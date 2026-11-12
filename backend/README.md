# Azbuka Progress API

This is the first backend implementation for the Azbuka A1 Voice Tutor. It is a local-first synchronization API: the browser saves immediately to LocalStorage, then uploads idempotent learning events when an account is signed in and the network is available.

## Endpoints

- `GET /health`
- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/logout`
- `GET /v1/me`
- `GET /v1/sync/bootstrap`
- `POST /v1/sync/events`
- `GET /v1/sync/changes`
- `GET /v1/progress/summary`
- `GET /v1/progress/units`
- `GET /v1/progress/items`

Interactive OpenAPI documentation is off by default; set `ENABLE_DOCS=1` for local development.

## Prerequisites

- Python 3.11 or newer.
- PostgreSQL 14 or newer.
- The migrations in `../db/migrations/` and the seed in `../db/repeatable/` applied (`db/apply_migrations.sh`, or the Compose `migrate` service).

## Local setup

From the repository root:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
# Edit backend/.env with a real DATABASE_URL and TOKEN_PEPPER.
set -a; . backend/.env; set +a
PGHOST=127.0.0.1 MIGRATIONS_DIR=db sh db/apply_migrations.sh   # uses the standard PG* variables
uvicorn app.main:app --reload --app-dir backend --host 127.0.0.1 --port 8090
```

Health check:

```bash
curl http://127.0.0.1:8090/health
```

## Register and sync example

```bash
curl -s http://127.0.0.1:8090/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"learner@example.com","password":"a-long-development-password","display_name":"Learner"}'
```

Use the returned `access_token` as a Bearer token. A sync payload looks like:

```json
{
  "device_id": "browser-device-uuid",
  "events": [
    {
      "client_event_id": "local-event-uuid",
      "event_type": "unit-started",
      "unit_id": "u16-survival-mission",
      "payload": {},
      "occurred_at": "2026-11-11T16:00:00Z"
    }
  ]
}
```

```bash
curl -s http://127.0.0.1:8090/v1/sync/events \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d @sync.json
```

Submitting the same `client_event_id` again is safe: it is reported as a duplicate and is not projected twice.

## Important production notes

- Run behind HTTPS and a reverse proxy such as Nginx.
- Keep PostgreSQL private; the browser must never receive `DATABASE_URL`.
- `TOKEN_PEPPER` (16+ random characters) and `APP_ORIGINS` are required; the API refuses to start without them.
- Use a real domain in `APP_ORIGINS`; do not use `*` with credentials.
- Add automated database backups and test restoration.
- Put the API behind a process manager such as systemd, Supervisor, or Docker Compose.
- The API currently uses bearer tokens in JSON responses for a straightforward first integration. For a public production app, prefer short-lived access tokens plus refresh tokens in Secure, HttpOnly cookies.
- The client sync adapter is a separate piece of work (Phase 2); this backend does not change `standalone.html`.
- XP is server-validated: `xp-awarded` events must carry `payload.key` (`review:`, `quiz:`, `course-review:`, `scenario-complete:`, `speech:`, `unit-complete:` prefixes) and an `amount` no higher than that prefix's cap (see `XP_RULES`). Each key pays once per user (`xp_ledger`) and `DAILY_XP_CAP` bounds a day. Anything else is rejected.
- Auth and sync are rate limited in the app (per IP, per email, per user); also limit `/v1/auth` and `/v1/sync` in the reverse proxy.
- Known limitation: `/v1/sync/changes` pages by `received_at`, which is the transaction start time. Overlapping transactions can commit out of order, so a client could miss a very recent event. The client should re-run bootstrap after login and periodically; a sequence-based cursor is a future migration.
- Event identifiers (`client_event_id`, `unit_id`, `item_id`) must be strings of letters, digits and `._:@-`.

## API behavior

The API validates event types, unit IDs, item scopes, timestamps, and payload shape. It stores accepted events in `learning_events` and updates read-optimized tables for units, items, stories, scenarios, and rewards. The event log remains the durable audit/synchronization boundary.

## Tests

The tests use a throwaway PostgreSQL database and never touch real data.

```bash
pip install -r backend/requirements-dev.txt
scripts/test_backend.sh            # starts a temporary local cluster (needs PostgreSQL server binaries)
# or, with your own disposable database:
TEST_DATABASE_URL=postgresql://user@host/db_that_can_be_wiped scripts/test_backend.sh
```
