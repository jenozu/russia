# Azbuka VPS SQL Sync Plan

## Purpose

This document outlines how to evolve Azbuka from a standalone local-first web app into a hosted app with optional account-based synchronization through a SQL database on a Hostinger VPS.

The recommended architecture keeps the current LocalStorage experience intact while adding a small HTTPS API. The browser should never connect directly to MySQL or PostgreSQL. It should communicate with the API, and only the API should connect to the database.

```text
Browser / PWA
    |
    | HTTPS JSON API
    v
Azbuka API on Hostinger VPS
    |
    | private database connection
    v
PostgreSQL or MySQL database
```

## Current state

The current app is a dependency-free static web app generated into `standalone.html`. It stores progress locally under:

```text
localStorage["azbuka-standalone"]
```

The saved JSON state currently includes structures such as:

- `stageItems` — Stage 1 vocabulary review records.
- `letters` — Cyrillic letter progress.
- `courseUnits` — unit completion and lesson state.
- `courseReviews` — unit-level review records.
- `events` — learning events and timestamps.
- `scenario` — scenario attempts and completions.
- `story` — story attempts and comprehension results.
- `motivation` — XP, rewards, badges, activity dates, and weekly goals.
- `audio` — speed and selected voice preferences.
- `daily` — daily review state.
- `account` and `sync` — reserved structures for account and synchronization metadata.

The database migration should preserve this state rather than replacing it abruptly.

## Recommended technology choice

### Database

Use **PostgreSQL** for the durable production database. It is a good fit for event records, JSON fields, unique constraints, and future reporting.

For a very small single-user or early prototype deployment, SQLite can work. PostgreSQL is the better long-term choice if the app may eventually support multiple learners, account recovery, analytics, or teacher views.

### API

Use a small backend service with one of these stacks:

- Node.js + Fastify or Express.
- Python + FastAPI.
- PHP + a lightweight framework if that matches the existing Hostinger setup.

The static Azbuka app can remain dependency-free. Only the API server needs a runtime and database driver.

### Reverse proxy and TLS

Expose the API through a subdomain such as:

```text
api.azbuka.example.com
```

Put Nginx or another reverse proxy in front of the API and enable HTTPS. Do not expose the database port publicly. The database should listen only on localhost or a private VPS interface.

## Target synchronization model

Use a **local-first, cloud-optional** model:

1. The app continues saving every learning action to LocalStorage immediately.
2. If the learner is signed in and online, the app sends new events to the API.
3. The API stores events and updates server-side progress projections.
4. On login or another device, the app downloads the learner’s progress.
5. If the network is unavailable, the app continues working locally and queues unsynced events.
6. A later sync sends the queued events and receives the merged server state.

This avoids making learning depend on network availability.

## Account and authentication plan

Do not identify users with only a browser-generated ID. Add accounts before enabling cross-device sync.

Recommended first version:

- Email plus password, or magic-link login.
- Passwords stored only as strong salted hashes using Argon2id or bcrypt.
- Short-lived access token plus refresh token, or secure server-side session cookies.
- Refresh tokens stored in `HttpOnly`, `Secure`, `SameSite=Lax` cookies.
- Never place database credentials or a long-lived secret in the browser.

Suggested account tables:

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    display_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

If magic links are used, store only a hash of the one-time token, its expiry, and whether it has been consumed.

## Database schema

Start with a normalized event log plus a small progress projection. This is safer than trying to mirror the entire LocalStorage JSON object in one opaque row.

### Course content metadata

The app can continue shipping `a1-course.json` as static content. Do not duplicate all lesson content in SQL in the first sync milestone.

```sql
CREATE TABLE course_versions (
    id BIGSERIAL PRIMARY KEY,
    schema_version TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (schema_version, content_hash)
);
```

### Learner progress

```sql
CREATE TABLE user_unit_progress (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    unit_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    checkpoint_score INTEGER,
    checkpoint_total INTEGER,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    last_activity_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, unit_id)
);

CREATE TABLE user_item_progress (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_scope TEXT NOT NULL,
    item_id TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    correct INTEGER NOT NULL DEFAULT 0,
    last_rating TEXT,
    difficulty TEXT,
    last_reviewed_at TIMESTAMPTZ,
    next_review_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, item_scope, item_id)
);

CREATE TABLE user_letter_progress (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    letter_id TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    correct INTEGER NOT NULL DEFAULT 0,
    last_rating TEXT,
    last_reviewed_at TIMESTAMPTZ,
    next_review_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, letter_id)
);
```

### Motivation and settings

```sql
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    daily_goal INTEGER NOT NULL DEFAULT 10,
    weekly_goal INTEGER NOT NULL DEFAULT 5,
    audio_speed NUMERIC(4,2) NOT NULL DEFAULT 0.72,
    voice_name TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_rewards (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    xp INTEGER NOT NULL DEFAULT 0,
    badges JSONB NOT NULL DEFAULT '[]'::jsonb,
    activity_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Immutable learning events

Events provide an audit trail and make future analytics possible. The API should treat an event ID as an idempotency key.

```sql
CREATE TABLE learning_events (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    unit_id TEXT,
    item_scope TEXT,
    item_id TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, client_event_id)
);

CREATE INDEX learning_events_user_time_idx
    ON learning_events(user_id, occurred_at DESC);
```

Examples of `event_type` values:

```text
unit-started
unit-completed
dialogue-response
listening-answer
story-answer
checkpoint-answer
review-rated
letter-rated
quiz-review
xp-awarded
badge-earned
```

Do not trust XP or completion totals submitted by the browser. The API should validate the event shape and calculate authoritative totals from accepted events or server-side projections.

## API surface

Begin with a small versioned API.

```text
POST /v1/auth/register
POST /v1/auth/login
POST /v1/auth/logout
GET  /v1/me

GET  /v1/sync/bootstrap
POST /v1/sync/events
GET  /v1/sync/changes?cursor=<cursor>

GET  /v1/progress/summary
GET  /v1/progress/units
GET  /v1/progress/items
```

### `POST /v1/sync/events`

Request:

```json
{
  "deviceId": "browser-generated-stable-id",
  "events": [
    {
      "clientEventId": "uuid",
      "eventType": "checkpoint-answer",
      "unitId": "u16-survival-mission",
      "itemId": "u16-q1",
      "payload": {
        "answer": "Сколько стоит билет?",
        "correct": true
      },
      "occurredAt": "2026-11-11T16:00:00.000Z"
    }
  ],
  "clientCursor": "optional-local-cursor"
}
```

Response:

```json
{
  "accepted": ["uuid"],
  "duplicates": [],
  "rejected": [],
  "serverCursor": "opaque-cursor",
  "progressVersion": 12
}
```

The API should accept duplicates safely. A retry caused by a network timeout must not award XP twice or duplicate a checkpoint completion.

## LocalStorage migration strategy

Do not delete the existing local state when accounts are introduced.

### First signed-in session

1. Read `localStorage['azbuka-standalone']`.
2. Validate its version and shape.
3. Create a migration bundle containing:
   - Existing events.
   - Unit completion records.
   - Review records.
   - Letter records.
   - XP, badges, and activity dates.
4. Upload the bundle or convert it into idempotent events.
5. Mark the local state with a sync marker such as:

```json
{
  "sync": {
    "lastExportAt": "...",
    "lastSyncAt": "...",
    "serverCursor": "...",
    "migrationVersion": 1
  }
}
```

6. Keep a local backup until the server confirms acceptance.

### Conflict policy

Use deterministic rules:

- Immutable events merge by `clientEventId`.
- Review records use the newest valid `lastReviewedAt` and preserve the highest attempt totals.
- Unit completion is monotonic: a completed unit must not revert to `in_progress`.
- XP is calculated from accepted events, not blindly summed from client totals.
- Settings use the most recently updated device value, or ask the user if a future UI exposes conflicts.

## Client-side changes

Add a small `sync` module to the generated app rather than replacing the existing save function immediately.

Suggested responsibilities:

```javascript
const SYNC_API = 'https://api.azbuka.example.com/v1';

function getLocalState() {}
function saveLocalState(state) {}
function appendPendingEvent(event) {}
function flushPendingEvents() {}
function pullServerChanges() {}
function mergeServerState(localState, serverState) {}
function markSyncSuccess(cursor) {}
```

The existing `save()` function should remain the first write path:

```javascript
function save() {
  rollDaily();
  localStorage.setItem('azbuka-standalone', JSON.stringify(state));
  queueSyncEventsFromRecentChanges();
  update();
}
```

For reliability, maintain a small local queue inside the same LocalStorage object or a second key such as:

```text
azbuka-sync-queue
```

A queue record should contain a client-generated UUID, event type, payload, and occurrence timestamp. Never block the lesson UI while a sync request is in flight.

## Security requirements

- Use HTTPS only.
- Keep SQL credentials in server environment variables, never in the repository or browser.
- Use parameterized SQL queries or a trusted query builder.
- Validate every request body with a schema validator.
- Apply authentication and authorization on every user-specific route.
- Scope every SQL query by the authenticated `user_id`.
- Add rate limiting to authentication and sync endpoints.
- Configure CORS for the actual app origin only; do not use `*` with credentials.
- Use secure, HttpOnly cookies for refresh sessions when possible.
- Avoid storing access tokens in LocalStorage if cookie sessions are practical.
- Log server errors without logging passwords, tokens, or complete health-related payloads.
- Run database backups and test restoration before treating the system as production-ready.
- Keep the database private; only the API should reach it.

## VPS deployment outline

1. Create a subdomain for the API.
2. Install the selected runtime, PostgreSQL/MySQL, and Nginx on the VPS.
3. Create a dedicated Linux service user for the API.
4. Create a dedicated database and database user with only the required permissions.
5. Store secrets in an environment file outside the Git repository.
6. Run migrations to create the tables above.
7. Start the API under `systemd`, Supervisor, or Docker Compose.
8. Configure Nginx to proxy the API subdomain to the local API port.
9. Issue and renew an HTTPS certificate.
10. Configure CORS for the static app origin.
11. Deploy the static app to its chosen host, or serve it through Nginx on the VPS.
12. Test registration, login, bootstrap, event upload, duplicate retry, logout, and cross-device restore.

Do not expose PostgreSQL port `5432` or MySQL port `3306` to the public internet unless there is a specific administrative requirement and firewall restriction.

## Suggested implementation milestones

### Milestone 1 — API skeleton

- Select Node/Fastify, Python/FastAPI, or PHP.
- Add health endpoint: `GET /health`.
- Add environment configuration.
- Add database connection and migration runner.
- Add request logging without sensitive values.

### Milestone 2 — Authentication

- Add account registration and login.
- Add secure session handling.
- Add `GET /v1/me`.
- Add account deletion/export endpoints before inviting real users.

### Milestone 3 — Event sync

- Add `learning_events` table.
- Add `POST /v1/sync/events` with idempotency.
- Add local pending queue.
- Upload only after local save succeeds.

### Milestone 4 — Progress projections

- Build unit progress and review projections from events.
- Add bootstrap and changes endpoints.
- Merge server state into LocalStorage without losing offline progress.

### Milestone 5 — Cross-device testing

Test at least these cases:

- New account on an empty browser.
- Existing anonymous LocalStorage state migrated after login.
- Offline lesson activity followed by reconnect.
- The same event retried three times.
- Two browsers reviewing the same item.
- A completed unit opened on a second device.
- Logout followed by another account login.
- Browser storage cleared, then server restore.

### Milestone 6 — Operations

- Automated daily database backups.
- Restore drill.
- Monitoring and error alerts.
- Migration rollback procedure.
- Privacy policy and data deletion workflow.
- Export of a learner’s complete data as JSON.

## What not to do

- Do not connect the browser directly to SQL.
- Do not put database passwords in `standalone.html`.
- Do not replace LocalStorage with a network-only lesson flow.
- Do not trust client-provided XP, completion, or correctness totals without validation.
- Do not use a single mutable JSON blob as the only server record once multiple devices exist.
- Do not deploy without HTTPS, backups, rate limits, and an account deletion path.

## Recommended first decision

For this project, the safest next implementation step is:

> Keep the current static Azbuka app and LocalStorage behavior, add a small FastAPI or Node API on a private Hostinger VPS, use PostgreSQL, and synchronize append-only learning events with idempotent client event IDs.

This gives the project cloud backup and cross-device progress without sacrificing the current offline-first learning experience.
