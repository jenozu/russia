# Claude Prompt: Inspect, Finish, Deploy, Test, and Merge Azbuka

Copy the prompt below into Claude. Give Claude access to the repository and VPS through its approved tools or SSH workflow. Do not paste passwords, private keys, database passwords, bearer tokens, or secret environment values into ordinary chat.

---

You are taking over the Azbuka Russian A1 Voice Tutor repository as a senior full-stack engineer and deployment engineer.

Your task is to inspect the existing code first, preserve all completed course work, finish everything required for the VPS-backed backend and cross-device progress synchronization, test the complete system, and safely merge all intentional changes into the GitHub repository.

Do not assume that the existing documentation is complete. Treat the code, tests, Git history, and current working tree as the source of truth.

## Project context

Repository:

```text
https://github.com/jenozu/russia.git
```

The project is a local-first, dependency-free standalone Russian learning web app. The complete A1 course spine has been authored through Unit 16. The app currently saves learner progress in:

```text
localStorage["azbuka-standalone"]
```

The desired final architecture is:

```text
Static Azbuka app
    -> immediate LocalStorage save always works
    -> optional account/login
    -> HTTPS FastAPI API on Hostinger VPS
    -> private PostgreSQL database in Docker
    -> idempotent event-based cross-device synchronization
```

## Important starting-state warning

Before changing anything, inspect the repository. The checked-out Git commit may lag behind the working tree. The working tree may contain uncommitted course work through Unit 16 and new backend/deployment files.

Never run any of the following without explicit confirmation after a verified backup:

```bash
git reset --hard
git clean -fd
git checkout -- .
docker compose down -v
DROP DATABASE
DROP TABLE
```

Do not discard later A1 units, generated app files, curriculum content, study guides, backend files, Docker files, or deployment documentation.

## First response: inspection report only

Begin by producing an inspection report before making edits. Include:

1. Current directory and repository root.
2. `git status --short`.
3. Current branch and `git log --oneline -10`.
4. Git remotes and upstream branch.
5. Changed and untracked files.
6. Whether Units 2–16 exist in the course JSON.
7. Whether the course validator passes.
8. Whether `standalone.html` can be regenerated.
9. Whether `backend/app/main.py`, the migration, Compose files, and deployment docs exist.
10. Whether the client-side sync adapter already exists.
11. Whether Docker is available.
12. Whether VPS access is configured.
13. A categorized list of finished work, unfinished work, risks, and proposed implementation order.

Do not make destructive changes during inspection.

## Required reference files

Read these files before planning:

```text
AZBUKA_BACKEND_UNFINISHED_WORK.md
AZBUKA_VPS_SQL_SYNC_PLAN.md
HOSTINGER_VPS_POSTGRES_SETUP.md
DOCKER_DEPLOYMENT.md
backend/README.md
backend/app/main.py
db/migrations/001_initial_azbuka_schema.sql
docker-compose.yml
scripts/build_standalone.py
scripts/validate_course_content.py
curriculum/russian/a1-course.json
```

The living unfinished-work checklist is:

```text
AZBUKA_BACKEND_UNFINISHED_WORK.md
```

Update that file as work is completed. Do not claim completion unless the definition of done in that file is satisfied.

## Implementation objective

Finish the remaining work in this order:

### A. Reconcile and preserve the repository

Inspect all changes after the current Git commit. Confirm the A1 course content through Unit 16 is present and valid. Preserve the existing neo-brutalist candy-pop design, shared lesson renderer, local-first behavior, LocalStorage compatibility, adaptive review, SRS, XP, badges, stories, dialogues, and cumulative recycling.

Work from the source files used to generate the app. Do not make a one-off edit only to generated `standalone.html` if the real source is `scripts/build_standalone.py` or the curriculum JSON.

### B. Validate and harden the FastAPI backend

Use the existing backend as a starting point, but inspect it critically. Fix bugs, missing validation, transaction issues, and unsafe behavior you find.

The API must support:

```text
GET  /health
POST /v1/auth/register
POST /v1/auth/login
POST /v1/auth/logout
GET  /v1/me
GET  /v1/sync/bootstrap
POST /v1/sync/events
GET  /v1/sync/changes
GET  /v1/progress/summary
GET  /v1/progress/units
GET  /v1/progress/items
```

Requirements:

- Passwords use Argon2id or an equivalent strong password hash.
- Session tokens are stored hashed, not as plaintext.
- Every user-specific SQL query scopes to the authenticated user.
- Event ingestion is idempotent using `(user_id, client_event_id)`.
- Duplicate event retries cannot double-count XP, attempts, or completions.
- Invalid event types, item scopes, unit IDs, and future timestamps are rejected.
- XP and reward calculations are server-validated rather than blindly trusting arbitrary client totals.
- Auth and sync routes are rate-limited or protected by the reverse proxy.
- Secrets come only from environment variables.
- Sensitive values are not logged.
- CORS is restricted to the real app origin.
- Errors return useful but non-sensitive responses.

Add automated tests if they do not exist. Use a disposable test database or a mocked repository layer; do not run tests against production data.

### C. Deploy PostgreSQL and the backend on the VPS

Use the existing Docker Compose stack unless inspection shows a clear reason to improve it. The expected services are:

- `db`: PostgreSQL with a persistent volume and no public port.
- `migrate`: one-shot migration runner that waits for database health.
- `api`: FastAPI service bound to VPS localhost and exposed publicly only through HTTPS reverse proxy.

On the VPS:

1. Inspect OS, Docker, ports, disk, memory, existing Nginx/Caddy, and firewall.
2. Do not overwrite another application.
3. Deploy the repository to a controlled directory such as `/opt/azbuka`.
4. Create `.env` directly on the VPS with mode `600`.
5. Generate separate strong `POSTGRES_PASSWORD` and `TOKEN_PEPPER` values on the VPS.
6. Set `DATABASE_URL` to use the Docker hostname `db`.
7. Replace the migration course-hash placeholder with the hash of the exact deployed `curriculum/russian/a1-course.json`.
8. Run Compose config validation.
9. Start with `docker compose up -d --build`.
10. Confirm `db` is healthy, `migrate` exits 0, and `api` is healthy.
11. Confirm all 16 rows exist in `course_units`.
12. Configure Nginx or Caddy and HTTPS for a dedicated API subdomain.
13. Set `APP_ORIGINS` to the exact static app origin.
14. Verify the public HTTPS health endpoint.

Do not expose PostgreSQL port 5432. Do not expose the API directly without HTTPS.

If VPS access is unavailable, complete all local implementation and provide exact commands for the owner, clearly labeling the VPS portion as not executed.

### D. Implement the client-side sync adapter

This is currently the most important likely unfinished coding task.

Implement the adapter in the source used by `scripts/build_standalone.py`. Preserve `localStorage["azbuka-standalone"]` as the immediate save layer.

Required behavior:

1. Generate and persist a stable browser `deviceId`.
2. Add a durable pending sync-event queue.
3. Assign a stable UUID `client_event_id` to each event.
4. Reuse event IDs on retries.
5. Save locally before attempting network sync.
6. Upload only while signed in and online.
7. Retry transient failures with bounded backoff.
8. Treat accepted and duplicate events as synchronized.
9. Keep rejected events and show a safe error status.
10. Call `/v1/sync/bootstrap` after login.
11. Call `/v1/sync/changes` with the stored cursor.
12. Merge server progress without erasing newer offline local activity.
13. Avoid duplicate XP and duplicate review attempts.
14. Show local-only, syncing, synced, offline/queued, and error states.
15. Add a manual Sync Now control.
16. Keep the app fully usable without login or network.

Suggested sync metadata:

```json
{
  "sync": {
    "deviceId": "stable-browser-id",
    "lastSyncAt": null,
    "serverCursor": null,
    "pendingEventCount": 0,
    "lastError": null,
    "migrationVersion": 1
  }
}
```

Do not upload the complete LocalStorage object on every click. Use append-only events and bootstrap/changes reconciliation.

### E. Add optional account and migration UI

Add the smallest clear UI that supports:

- Register.
- Login.
- Logout.
- Current account display.
- Sync status.
- Last sync time.
- Pending event count.
- Sync Now.
- Export local progress.
- Import local progress.
- First-login migration of existing anonymous LocalStorage progress.

The app must remain usable anonymously and offline. Never replace nonempty local progress with an empty server account without a clear migration/merge action.

The frontend may know the public API URL, but it must never know database credentials.

### F. Backups and operations

Configure or document:

- Daily PostgreSQL logical backups.
- Backup retention.
- Off-VPS encrypted backup copy.
- Restore test into a separate database.
- API health monitoring.
- Container restart monitoring.
- Secret rotation procedure.
- Schema migration procedure after the initial migration.

## Required acceptance testing

Run and report these tests:

### Local-first

- Stop the API.
- Complete a lesson.
- Refresh the app.
- Confirm progress survives in LocalStorage.

### Auth

- Register a disposable test user.
- Log in.
- Call `/v1/me`.
- Log out.
- Confirm the token no longer works.

### Sync

- Complete a unit or checkpoint.
- Confirm events reach PostgreSQL.
- Submit one event twice.
- Confirm the second attempt is a duplicate and does not double-count.
- Run bootstrap on a second browser/profile.
- Confirm progress is restored.
- Create offline activity.
- Reconnect and confirm queued activity uploads.

### Security/isolation

- Confirm invalid tokens return 401.
- Confirm one account cannot read another account’s progress.
- Confirm PostgreSQL has no public port.
- Confirm only HTTPS exposes the API.
- Confirm CORS is restricted.
- Confirm no secrets appear in Git, frontend files, or logs.

### Regression

- Run the A1 course validator.
- Rebuild the standalone app.
- Run `node --check` on the generated script.
- Verify Unit 16 renders.
- Verify existing units still render.
- Verify LocalStorage backward compatibility.

## Git and merge requirements

The final repository must be up to date and contain all intentional work.

Before staging:

```bash
git status --short
git diff --check
```

Review the complete diff. Do not stage:

```text
.env
.env.* except committed examples
private keys
passwords
bearer tokens
database dumps
Docker volumes
__pycache__
local virtual environments
logs
```

Use logical commits. A suggested sequence is:

```text
Complete A1 Units 8–16 and curriculum validation
Add PostgreSQL schema and FastAPI progress API
Add Docker deployment and VPS documentation
Add client-side sync adapter and account UI
Add backend/client tests and operational documentation
```

If the repository has a meaningful uncommitted baseline, do not rewrite history to hide it. Preserve authorship and make clear commits.

Push only to the configured repository and branch after:

- Tests pass.
- Secrets are absent.
- The full staged diff is reviewed.
- The owner has explicitly authorized the push if the environment requires confirmation for external Git actions.

After pushing:

```bash
git fetch origin
git status -sb
git log --oneline -5
```

Report the exact commit hashes pushed.

## Required final report

When finished, provide:

1. Inspection findings.
2. Files changed.
3. Backend/API status.
4. Database and migration status.
5. VPS deployment status.
6. Public API URL, without credentials.
7. Client sync adapter status.
8. Account UI status.
9. Test commands and results.
10. Backup and restore status.
11. Git commits and push status.
12. Any remaining limitations.

Never include passwords, private keys, token peppers, bearer tokens, or credential-bearing database URLs in the report.

## Definition of done

Do not say the task is complete until all of these are true:

- The A1 course content through Unit 16 is preserved and validated.
- The FastAPI backend runs successfully.
- PostgreSQL runs privately on the VPS.
- The API is available through HTTPS.
- A learner can register, log in, and log out.
- Existing LocalStorage progress can be migrated without loss.
- New progress saves locally first and synchronizes as idempotent events.
- Offline events queue and upload after reconnection.
- A second browser restores progress.
- Duplicate retries do not double-count.
- Backups exist and restoration has been tested.
- The final implementation is tested, documented, committed, and pushed without secrets.
