import pytest

from app import main
from conftest import PASSWORD, auth, register


async def test_health(client):
    r = await client.get("/health")
    assert r.status_code == 200 and r.json() == {"status": "ok"}


async def test_register_login_me_logout_revokes_token(client):
    token = await register(client)
    me = await client.get("/v1/me", headers=auth(token))
    assert me.status_code == 200 and me.json()["email"] == "learner@example.test"

    login = await client.post("/v1/auth/login", json={"email": "LEARNER@example.test", "password": PASSWORD})
    assert login.status_code == 200
    token2 = login.json()["access_token"]
    assert token2 != token

    assert (await client.post("/v1/auth/logout", headers=auth(token))).status_code == 204
    assert (await client.get("/v1/me", headers=auth(token))).status_code == 401
    assert (await client.get("/v1/me", headers=auth(token2))).status_code == 200


async def test_invalid_tokens_return_401(client):
    for headers in ({}, {"Authorization": "Bearer nope"}, {"Authorization": "Basic abc"}, {"Authorization": "Bearer "}):
        assert (await client.get("/v1/me", headers=headers)).status_code == 401
        assert (await client.get("/v1/sync/bootstrap", headers=headers)).status_code == 401
        assert (await client.get("/v1/progress/summary", headers=headers)).status_code == 401


async def test_duplicate_email_and_weak_password(client):
    await register(client)
    r = await client.post("/v1/auth/register", json={"email": "Learner@Example.test", "password": PASSWORD})
    assert r.status_code == 409
    r = await client.post("/v1/auth/register", json={"email": "other@example.test", "password": "short"})
    assert r.status_code == 422


async def test_wrong_password_and_unknown_email_look_the_same(client):
    await register(client)
    bad_pw = await client.post("/v1/auth/login", json={"email": "learner@example.test", "password": "wrong-password-1"})
    unknown = await client.post("/v1/auth/login", json={"email": "nobody@example.test", "password": "wrong-password-1"})
    assert bad_pw.status_code == unknown.status_code == 401
    assert bad_pw.json() == unknown.json()


async def test_passwords_and_tokens_are_not_stored_in_plaintext(client):
    token = await register(client)
    async with main.pool.acquire() as conn:
        pw = await conn.fetchval("SELECT password_hash FROM users")
        stored = await conn.fetchval("SELECT token_hash FROM sessions")
    assert pw.startswith("$argon2id$") and PASSWORD not in pw
    assert stored != token and len(stored) == 64


async def test_login_rate_limit_per_email(client):
    await register(client)
    codes = []
    for _ in range(main.RATE_LOGIN_FAILS_PER_15MIN + 3):
        r = await client.post("/v1/auth/login", json={"email": "learner@example.test", "password": "wrong-password-1"})
        codes.append(r.status_code)
    assert codes[0] == 401 and codes[-1] == 429
    # Even the right password is refused while the lock is active.
    r = await client.post("/v1/auth/login", json={"email": "learner@example.test", "password": PASSWORD})
    assert r.status_code == 429 and "retry-after" in r.headers


async def test_auth_rate_limit_per_ip(client, monkeypatch):
    monkeypatch.setattr(main, "RATE_AUTH_PER_MIN", 3)
    codes = [(await client.post("/v1/auth/login", json={"email": f"u{i}@example.test", "password": "x" * 12})).status_code for i in range(5)]
    assert codes[:3] == [401, 401, 401] and codes[3:] == [429, 429]


async def test_cors_only_for_app_origin(client):
    ok = await client.options("/v1/me", headers={"Origin": "https://app.example.test", "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "authorization"})
    assert ok.headers.get("access-control-allow-origin") == "https://app.example.test"
    bad = await client.options("/v1/me", headers={"Origin": "https://evil.example.test", "Access-Control-Request-Method": "GET"})
    assert "access-control-allow-origin" not in bad.headers


async def test_responses_are_not_cached_and_docs_are_off(client):
    r = await client.get("/v1/me")
    assert r.headers["cache-control"] == "no-store"
    assert (await client.get("/docs")).status_code == 404


def test_startup_refuses_unsafe_config(monkeypatch):
    monkeypatch.setattr(main, "TOKEN_PEPPER", "short")
    with pytest.raises(RuntimeError):
        main.validate_config()
    monkeypatch.setattr(main, "TOKEN_PEPPER", "x" * 20)
    monkeypatch.setattr(main, "APP_ORIGINS", ["*"])
    with pytest.raises(RuntimeError):
        main.validate_config()
    monkeypatch.setattr(main, "APP_ORIGINS", [])
    with pytest.raises(RuntimeError):
        main.validate_config()


async def test_expired_session_is_rejected(client):
    token = await register(client)
    async with main.pool.acquire() as conn:
        await conn.execute("UPDATE sessions SET expires_at = now() - interval '1 minute'")
    assert (await client.get("/v1/me", headers=auth(token))).status_code == 401
