"""Azbuka A1 progress and synchronization API.

The browser remains local-first and writes its JSON state immediately. This API
accepts idempotent learning events, projects them into progress tables, and
returns a bootstrap/changes payload for cross-device synchronization.

Run locally:
    uvicorn app.main:app --reload --app-dir backend
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Annotated

import asyncpg
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field, field_validator

try:
    from argon2 import PasswordHasher
    from argon2.exceptions import InvalidHashError, VerifyMismatchError
except ImportError:  # pragma: no cover - requirements include argon2-cffi
    PasswordHasher = None
    InvalidHashError = VerifyMismatchError = Exception


DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://azbuka:change-me@127.0.0.1:5432/azbuka")
APP_ORIGINS = [x.strip() for x in os.getenv("APP_ORIGINS", "http://localhost:4187").split(",") if x.strip()]
SESSION_TTL_DAYS = int(os.getenv("SESSION_TTL_DAYS", "30"))
MAX_SYNC_EVENTS = int(os.getenv("MAX_SYNC_EVENTS", "250"))
TOKEN_PEPPER = os.getenv("TOKEN_PEPPER", "")

app = FastAPI(title="Azbuka A1 Progress API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=APP_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Device-ID"],
)

pool: asyncpg.Pool | None = None
password_hasher = PasswordHasher() if PasswordHasher else None


@app.on_event("startup")
async def startup() -> None:
    global pool
    pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10, command_timeout=15)


@app.on_event("shutdown")
async def shutdown() -> None:
    if pool:
        await pool.close()


def db() -> asyncpg.Pool:
    if pool is None:
        raise RuntimeError("Database pool is not initialized")
    return pool


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def hash_token(token: str) -> str:
    return hashlib.sha256((TOKEN_PEPPER + token).encode("utf-8")).hexdigest()


def encode_cursor(received_at: datetime, event_id: uuid.UUID) -> str:
    value = {"received_at": received_at.isoformat(), "id": str(event_id)}
    return base64.urlsafe_b64encode(json.dumps(value).encode()).decode().rstrip("=")


def decode_cursor(cursor: str | None) -> tuple[datetime, uuid.UUID] | None:
    if not cursor:
        return None
    try:
        padded = cursor + "=" * (-len(cursor) % 4)
        value = json.loads(base64.urlsafe_b64decode(padded).decode())
        return datetime.fromisoformat(value["received_at"]), uuid.UUID(value["id"])
    except (ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=400, detail="Invalid sync cursor") from exc


def normalize_email(email: str) -> str:
    return email.strip().lower()


def password_hash(password: str) -> str:
    if not password_hasher:
        raise RuntimeError("argon2-cffi is required")
    return password_hasher.hash(password)


def password_verify(stored: str, password: str) -> bool:
    if not password_hasher:
        return False
    try:
        return password_hasher.verify(stored, password)
    except (VerifyMismatchError, InvalidHashError):
        return False


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class RegisterRequest(StrictModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=10, max_length=200)
    display_name: str | None = Field(default=None, max_length=120)

    @field_validator("email")
    @classmethod
    def email_has_at(cls, value: str) -> str:
        value = normalize_email(value)
        if "@" not in value or value.startswith("@") or value.endswith("@"):
            raise ValueError("email must be valid")
        return value


class LoginRequest(StrictModel):
    email: str
    password: str


class EventInput(StrictModel):
    client_event_id: str = Field(min_length=1, max_length=200)
    event_type: str
    unit_id: str | None = None
    item_scope: str | None = None
    item_id: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
    occurred_at: datetime

    @field_validator("event_type")
    @classmethod
    def event_type_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("event_type cannot be blank")
        return value.strip()


class SyncRequest(StrictModel):
    device_id: str = Field(min_length=1, max_length=200)
    events: list[EventInput] = Field(default_factory=list, max_length=MAX_SYNC_EVENTS)
    client_cursor: str | None = None


class UserOut(StrictModel):
    id: uuid.UUID
    email: str
    display_name: str | None
    created_at: datetime


class AuthResponse(StrictModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    user: UserOut


class SyncResponse(StrictModel):
    accepted: list[str]
    duplicates: list[str]
    rejected: list[dict[str, str]]
    server_cursor: str | None
    progress_version: int


async def current_user(authorization: Annotated[str | None, Header()] = None) -> asyncpg.Record:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Bearer token required")
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Bearer token required")
    row = await db().fetchrow(
        """
        SELECT u.id, u.email, u.display_name, u.created_at
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = $1
          AND s.revoked_at IS NULL
          AND s.expires_at > now()
          AND u.disabled_at IS NULL
        """,
        hash_token(token),
    )
    if not row:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    await db().execute("UPDATE sessions SET last_seen_at = now() WHERE token_hash = $1", hash_token(token))
    return row


async def ensure_device(user_id: uuid.UUID, client_device_id: str) -> asyncpg.Record:
    return await db().fetchrow(
        """
        INSERT INTO user_devices (user_id, client_device_id, last_seen_at)
        VALUES ($1, $2, now())
        ON CONFLICT (user_id, client_device_id)
        DO UPDATE SET last_seen_at = now()
        RETURNING id, user_id, client_device_id
        """,
        user_id,
        client_device_id,
    )


async def ensure_user_defaults(user_id: uuid.UUID) -> None:
    await db().execute(
        "INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING", user_id
    )
    await db().execute(
        "INSERT INTO user_rewards (user_id) VALUES ($1) ON CONFLICT DO NOTHING", user_id
    )


@app.get("/health")
async def health() -> dict[str, str]:
    await db().fetchval("SELECT 1")
    return {"status": "ok"}


@app.post("/v1/auth/register", response_model=AuthResponse, status_code=201)
async def register(body: RegisterRequest) -> AuthResponse:
    email = normalize_email(body.email)
    async with db().acquire() as conn:
        async with conn.transaction():
            try:
                user = await conn.fetchrow(
                    """
                    INSERT INTO users (email, password_hash, display_name)
                    VALUES ($1, $2, $3)
                    RETURNING id, email, display_name, created_at
                    """,
                    email,
                    password_hash(body.password),
                    body.display_name,
                )
            except asyncpg.UniqueViolationError as exc:
                raise HTTPException(status_code=409, detail="An account already exists for this email") from exc
            await conn.execute("INSERT INTO user_settings (user_id) VALUES ($1)", user["id"])
            await conn.execute("INSERT INTO user_rewards (user_id) VALUES ($1)", user["id"])
            token = secrets.token_urlsafe(48)
            expires = utc_now() + timedelta(days=SESSION_TTL_DAYS)
            await conn.execute(
                "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
                user["id"], hash_token(token), expires,
            )
    return AuthResponse(access_token=token, expires_at=expires, user=UserOut(**dict(user)))


@app.post("/v1/auth/login", response_model=AuthResponse)
async def login(body: LoginRequest) -> AuthResponse:
    user = await db().fetchrow(
        "SELECT id, email, display_name, created_at, password_hash FROM users WHERE email_normalized = $1 AND disabled_at IS NULL",
        normalize_email(body.email),
    )
    if not user or not user["password_hash"] or not password_verify(user["password_hash"], body.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = secrets.token_urlsafe(48)
    expires = utc_now() + timedelta(days=SESSION_TTL_DAYS)
    await db().execute(
        "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
        user["id"], hash_token(token), expires,
    )
    return AuthResponse(
        access_token=token,
        expires_at=expires,
        user=UserOut(id=user["id"], email=user["email"], display_name=user["display_name"], created_at=user["created_at"]),
    )


@app.post("/v1/auth/logout", status_code=204)
async def logout(authorization: Annotated[str | None, Header()] = None) -> Response:
    if authorization and authorization.lower().startswith("bearer "):
        await db().execute("UPDATE sessions SET revoked_at = now() WHERE token_hash = $1", hash_token(authorization.split(" ", 1)[1].strip()))
    return Response(status_code=204)


@app.get("/v1/me", response_model=UserOut)
async def me(user: Annotated[asyncpg.Record, Depends(current_user)]) -> UserOut:
    return UserOut(**dict(user))


async def validate_event(event: EventInput) -> None:
    allowed = {
        "unit-started", "unit-completed", "dialogue-response", "listening-answer",
        "story-answer", "checkpoint-answer", "review-rated", "letter-rated",
        "quiz-review", "xp-awarded", "badge-earned", "settings-updated",
        "scenario-completed", "sync-import",
    }
    if event.event_type not in allowed:
        raise ValueError(f"unsupported event type: {event.event_type}")
    if event.item_scope and event.item_scope not in {"stage", "course", "letter", "story", "scenario"}:
        raise ValueError("unsupported item scope")
    if event.occurred_at > utc_now() + timedelta(minutes=10):
        raise ValueError("occurred_at is too far in the future")
    if event.event_type in {"unit-started", "unit-completed", "checkpoint-answer", "dialogue-response", "listening-answer", "story-answer", "scenario-completed"} and not event.unit_id:
        raise ValueError("unit_id is required for this event type")
    if event.event_type in {"review-rated", "quiz-review", "letter-rated"} and not event.item_id:
        raise ValueError("item_id is required for this event type")


async def project_event(conn: asyncpg.Connection, user_id: uuid.UUID, event: EventInput) -> None:
    """Update server projections after an event is inserted.

    The event remains the source of truth. These projections make API reads fast.
    XP is intentionally bounded here; a production rules engine can replace this
    with server-side scoring rules once the lesson event contracts are finalized.
    """
    p = event.payload
    if event.unit_id and event.event_type in {"unit-started", "unit-completed", "checkpoint-answer", "dialogue-response", "listening-answer", "story-answer"}:
        status_value = "completed" if event.event_type == "unit-completed" else "in_progress"
        score = p.get("score") if isinstance(p.get("score"), int) else None
        total = p.get("total") if isinstance(p.get("total"), int) else None
        await conn.execute(
            """
            INSERT INTO user_unit_progress (user_id, unit_id, status, started_at, completed_at,
                checkpoint_score, checkpoint_total, dialogue_completed, last_activity_at)
            VALUES ($1, $2, $3, now(), CASE WHEN $3 = 'completed' THEN now() ELSE NULL END,
                $4, $5, COALESCE(($6)::boolean, false), now())
            ON CONFLICT (user_id, unit_id) DO UPDATE SET
                status = CASE WHEN user_unit_progress.status = 'completed' THEN 'completed' ELSE EXCLUDED.status END,
                started_at = COALESCE(user_unit_progress.started_at, EXCLUDED.started_at),
                completed_at = COALESCE(EXCLUDED.completed_at, user_unit_progress.completed_at),
                checkpoint_score = COALESCE(EXCLUDED.checkpoint_score, user_unit_progress.checkpoint_score),
                checkpoint_total = COALESCE(EXCLUDED.checkpoint_total, user_unit_progress.checkpoint_total),
                dialogue_completed = user_unit_progress.dialogue_completed OR EXCLUDED.dialogue_completed,
                last_activity_at = now(), updated_at = now()
            """,
            user_id,
            event.unit_id,
            status_value,
            score,
            total,
            bool(p.get("dialogueCompleted", False)),
        )

    if event.event_type in {"review-rated", "quiz-review", "letter-rated"} and event.item_id:
        scope = event.item_scope or ("letter" if event.event_type == "letter-rated" else "course")
        rating = p.get("rating") or ("good" if p.get("correct") is True else "again")
        if rating not in {"again", "hard", "good", "easy"}:
            rating = "again"
        await conn.execute(
            """
            INSERT INTO user_item_progress (user_id, item_scope, item_id, unit_id, attempts, correct,
                last_rating, difficulty, last_reviewed_at, next_review_at, metadata)
            VALUES ($1, $2, $3, $4, 1, CASE WHEN $5::boolean THEN 1 ELSE 0 END,
                $6, CASE WHEN $5::boolean THEN 'review' ELSE 'difficult' END,
                now(), $7, $8::jsonb)
            ON CONFLICT (user_id, item_scope, item_id) DO UPDATE SET
                attempts = user_item_progress.attempts + 1,
                correct = user_item_progress.correct + CASE WHEN $5::boolean THEN 1 ELSE 0 END,
                last_rating = EXCLUDED.last_rating,
                difficulty = EXCLUDED.difficulty,
                last_reviewed_at = now(),
                next_review_at = EXCLUDED.next_review_at,
                unit_id = COALESCE(EXCLUDED.unit_id, user_item_progress.unit_id),
                metadata = user_item_progress.metadata || EXCLUDED.metadata,
                updated_at = now()
            """,
            user_id,
            scope,
            event.item_id,
            event.unit_id,
            bool(p.get("correct", rating in {"good", "easy"})),
            rating,
            event.occurred_at + timedelta(days=1 if rating == "again" else 3 if rating == "hard" else 7 if rating == "good" else 21),
            json.dumps({"sourceEvent": event.event_type}),
        )

    if event.event_type in {"story-answer", "scenario-completed"}:
        table = "user_story_progress" if event.event_type == "story-answer" else "user_scenario_progress"
        key = "story_id" if event.event_type == "story-answer" else "scenario_id"
        completed_expr = "correct" if event.event_type == "story-answer" else "completed"
        identifier = event.item_id or p.get("storyId") or p.get("scenarioId") or event.unit_id
        if identifier:
            await conn.execute(
                f"""
                INSERT INTO {table} (user_id, {key}, unit_id, attempts, {completed_expr}, last_attempt_at, last_completed_at, metadata)
                VALUES ($1, $2, $3, 1, CASE WHEN $4::boolean THEN 1 ELSE 0 END, now(), CASE WHEN $4::boolean THEN now() ELSE NULL END, $5::jsonb)
                ON CONFLICT (user_id, {key}) DO UPDATE SET
                    attempts = {table}.attempts + 1,
                    {completed_expr} = {table}.{completed_expr} + CASE WHEN $4::boolean THEN 1 ELSE 0 END,
                    last_attempt_at = now(),
                    last_completed_at = CASE WHEN $4::boolean THEN now() ELSE {table}.last_completed_at END,
                    metadata = {table}.metadata || EXCLUDED.metadata,
                    updated_at = now()
                """,
                user_id,
                str(identifier),
                event.unit_id,
                bool(p.get("correct", p.get("completed", False))),
                json.dumps(p),
            )

    if event.event_type == "xp-awarded":
        amount = p.get("amount", 0)
        if isinstance(amount, int) and 0 < amount <= 100:
            await conn.execute(
                "INSERT INTO user_rewards (user_id, xp) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET xp = user_rewards.xp + EXCLUDED.xp, updated_at = now()",
                user_id,
                amount,
            )


async def insert_event(conn: asyncpg.Connection, user_id: uuid.UUID, device_uuid: uuid.UUID, event: EventInput) -> str:
    await validate_event(event)
    unit_exists = await conn.fetchval("SELECT 1 FROM course_units WHERE id = $1", event.unit_id) if event.unit_id else 1
    if not unit_exists:
        raise ValueError("unknown unit_id")
    row = await conn.fetchrow(
        """
        INSERT INTO learning_events (user_id, device_id, client_event_id, event_type, unit_id,
            item_scope, item_id, payload, occurred_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
        ON CONFLICT (user_id, client_event_id) DO NOTHING
        RETURNING id, received_at
        """,
        user_id, device_uuid, event.client_event_id, event.event_type, event.unit_id,
        event.item_scope, event.item_id, json.dumps(event.payload), event.occurred_at,
    )
    if not row:
        return "duplicate"
    await project_event(conn, user_id, event)
    return "accepted"


async def progress_payload(user_id: uuid.UUID) -> dict[str, Any]:
    units = await db().fetch("SELECT * FROM course_units ORDER BY unit_order")
    unit_progress = await db().fetch("SELECT * FROM user_unit_progress WHERE user_id = $1", user_id)
    item_progress = await db().fetch("SELECT * FROM user_item_progress WHERE user_id = $1", user_id)
    story_progress = await db().fetch("SELECT * FROM user_story_progress WHERE user_id = $1", user_id)
    scenario_progress = await db().fetch("SELECT * FROM user_scenario_progress WHERE user_id = $1", user_id)
    settings = await db().fetchrow("SELECT * FROM user_settings WHERE user_id = $1", user_id)
    rewards = await db().fetchrow("SELECT * FROM user_rewards WHERE user_id = $1", user_id)
    return {
        "units": [dict(x) for x in units],
        "unitProgress": [dict(x) for x in unit_progress],
        "itemProgress": [dict(x) for x in item_progress],
        "storyProgress": [dict(x) for x in story_progress],
        "scenarioProgress": [dict(x) for x in scenario_progress],
        "settings": dict(settings) if settings else None,
        "rewards": dict(rewards) if rewards else None,
    }


@app.get("/v1/sync/bootstrap")
async def bootstrap(user: Annotated[asyncpg.Record, Depends(current_user)]) -> dict[str, Any]:
    await ensure_user_defaults(user["id"])
    events = await db().fetchrow(
        "SELECT received_at, id FROM learning_events WHERE user_id = $1 ORDER BY received_at DESC, id DESC LIMIT 1",
        user["id"],
    )
    cursor = encode_cursor(events["received_at"], events["id"]) if events else None
    return {"user": dict(user), "progress": await progress_payload(user["id"]), "serverCursor": cursor}


@app.post("/v1/sync/events", response_model=SyncResponse)
async def sync_events(
    body: SyncRequest,
    user: Annotated[asyncpg.Record, Depends(current_user)],
) -> SyncResponse:
    device = await ensure_device(user["id"], body.device_id)
    accepted: list[str] = []
    duplicates: list[str] = []
    rejected: list[dict[str, str]] = []
    last_cursor: str | None = None

    async with db().acquire() as conn:
        async with conn.transaction():
            for event in body.events:
                try:
                    result = await insert_event(conn, user["id"], device["id"], event)
                    (accepted if result == "accepted" else duplicates).append(event.client_event_id)
                except (ValueError, asyncpg.ForeignKeyViolationError) as exc:
                    rejected.append({"clientEventId": event.client_event_id, "reason": str(exc)})
            row = await conn.fetchrow(
                "SELECT received_at, id FROM learning_events WHERE user_id = $1 ORDER BY received_at DESC, id DESC LIMIT 1",
                user["id"],
            )
            if row:
                last_cursor = encode_cursor(row["received_at"], row["id"])
            await conn.execute(
                "INSERT INTO sync_cursors (user_id, device_id, last_received_at, last_received_event_id, last_sync_at, progress_version) VALUES ($1, $2, now(), $3, now(), 1) ON CONFLICT (user_id, device_id) DO UPDATE SET last_sync_at = now(), progress_version = sync_cursors.progress_version + 1, updated_at = now()",
                user["id"], device["id"], row["id"] if row else None,
            )
    return SyncResponse(accepted=accepted, duplicates=duplicates, rejected=rejected, server_cursor=last_cursor, progress_version=len(accepted))


@app.get("/v1/sync/changes")
async def changes(
    user: Annotated[asyncpg.Record, Depends(current_user)],
    cursor: str | None = Query(default=None),
    limit: int = Query(default=250, ge=1, le=500),
) -> dict[str, Any]:
    decoded = decode_cursor(cursor)
    if decoded:
        after_time, after_id = decoded
        rows = await db().fetch(
            """
            SELECT id, client_event_id, event_type, unit_id, item_scope, item_id,
                   payload, occurred_at, received_at
            FROM learning_events
            WHERE user_id = $1 AND (received_at, id) > ($2, $3)
            ORDER BY received_at ASC, id ASC LIMIT $4
            """,
            user["id"], after_time, after_id, limit,
        )
    else:
        rows = await db().fetch(
            """
            SELECT id, client_event_id, event_type, unit_id, item_scope, item_id,
                   payload, occurred_at, received_at
            FROM learning_events WHERE user_id = $1
            ORDER BY received_at ASC, id ASC LIMIT $2
            """,
            user["id"], limit,
        )
    next_cursor = encode_cursor(rows[-1]["received_at"], rows[-1]["id"]) if rows else cursor
    return {"events": [dict(x) for x in rows], "nextCursor": next_cursor, "hasMore": len(rows) == limit}


@app.get("/v1/progress/summary")
async def summary(user: Annotated[asyncpg.Record, Depends(current_user)]) -> dict[str, Any]:
    row = await db().fetchrow("SELECT * FROM user_progress_summary WHERE user_id = $1", user["id"])
    return dict(row) if row else {"user_id": user["id"], "completed_units": 0, "started_units": 0, "xp": 0, "badge_count": 0}


@app.get("/v1/progress/units")
async def units(user: Annotated[asyncpg.Record, Depends(current_user)]) -> list[dict[str, Any]]:
    rows = await db().fetch(
        """
        SELECT cu.*, up.status AS learner_status, up.completed_at, up.checkpoint_score,
               up.checkpoint_total, up.dialogue_completed, up.last_activity_at
        FROM course_units cu
        LEFT JOIN user_unit_progress up ON up.unit_id = cu.id AND up.user_id = $1
        ORDER BY cu.unit_order
        """,
        user["id"],
    )
    return [dict(x) for x in rows]


@app.get("/v1/progress/items")
async def items(
    user: Annotated[asyncpg.Record, Depends(current_user)],
    due_only: bool = Query(default=False),
    limit: int = Query(default=100, ge=1, le=500),
) -> list[dict[str, Any]]:
    if due_only:
        rows = await db().fetch(
            "SELECT * FROM user_item_progress WHERE user_id = $1 AND next_review_at IS NOT NULL AND next_review_at <= now() ORDER BY next_review_at LIMIT $2",
            user["id"], limit,
        )
    else:
        rows = await db().fetch(
            "SELECT * FROM user_item_progress WHERE user_id = $1 ORDER BY updated_at DESC LIMIT $2",
            user["id"], limit,
        )
    return [dict(x) for x in rows]
