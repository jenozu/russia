"""Backend tests run against a throwaway PostgreSQL database.

Set TEST_DATABASE_URL to a database that may be wiped (never production), or
use scripts/test_backend.sh, which starts a temporary local cluster.
"""
import os
import sys
from pathlib import Path

import asyncpg
import httpx
import pytest

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")
if not TEST_DATABASE_URL:
    pytest.exit("TEST_DATABASE_URL is required (use scripts/test_backend.sh)", returncode=2)
if "azbuka_postgres_data" in TEST_DATABASE_URL or os.environ.get("ALLOW_WIPE_TEST_DB") != "1":
    pytest.exit("Refusing to wipe a database: set ALLOW_WIPE_TEST_DB=1 only for a disposable test database", returncode=2)

# Configuration must be in place before the app module is imported.
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["TOKEN_PEPPER"] = "test-pepper-0123456789abcdef"
os.environ["APP_ORIGINS"] = "https://app.example.test"
os.environ["RATE_AUTH_PER_MIN"] = "100"  # raised by default; the rate-limit tests lower it

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))

from app import main  # noqa: E402

PASSWORD = "correct-horse-battery"


async def _apply_sql(conn: asyncpg.Connection) -> None:
    for path in sorted((ROOT / "db" / "migrations").glob("*.sql")):
        await conn.execute(path.read_text())
    for path in sorted((ROOT / "db" / "repeatable").glob("*.sql")):
        await conn.execute(path.read_text())


@pytest.fixture(scope="session", autouse=True)
def prepare_schema():
    import asyncio

    async def go():
        conn = await asyncpg.connect(TEST_DATABASE_URL)
        try:
            await conn.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
            await _apply_sql(conn)
        finally:
            await conn.close()

    asyncio.run(go())


@pytest.fixture
async def client():
    main.limiter.reset()
    main.pool = await asyncpg.create_pool(TEST_DATABASE_URL, min_size=1, max_size=5)
    async with main.pool.acquire() as conn:
        await conn.execute("TRUNCATE users CASCADE")
    transport = httpx.ASGITransport(app=main.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    await main.pool.close()
    main.pool = None


async def register(client, email="learner@example.test", password=PASSWORD):
    r = await client.post("/v1/auth/register", json={"email": email, "password": password})
    assert r.status_code == 201, r.text
    return r.json()["access_token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def make_event(event_id, event_type="review-rated", **overrides):
    event = {
        "client_event_id": event_id,
        "event_type": event_type,
        "item_scope": "stage",
        "item_id": "1",
        "payload": {"rating": "good"},
        "occurred_at": "2026-11-10T12:00:00Z",
    }
    event.update(overrides)
    return event


async def push(client, token, events, device="device-a"):
    r = await client.post("/v1/sync/events", json={"device_id": device, "events": events}, headers=auth(token))
    assert r.status_code == 200, r.text
    return r.json()
