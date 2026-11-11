# Azbuka Backend Completion Checklist

This is the living checklist for taking Azbuka from a local-first standalone app to a working VPS-backed account and synchronization system.

## Repository state at handoff

- Remote: `https://github.com/jenozu/russia.git`
- Current checked-out commit: `e22e342` — `Build Unit 7 travel course`
- Important: the working tree contains later uncommitted course work through Unit 16 and new backend/deployment artifacts. Do not reset, clean, or overwrite the working tree before reviewing and preserving those changes.
- The standalone app already persists progress locally under `localStorage["azbuka-standalone"]`.
- The PostgreSQL migration, FastAPI backend, Docker Compose stack, deployment guides, and study-guide exports exist locally but have not been proven against a live VPS in this environment.

## Current status

| Area | Status | What remains |
|---|---|---|
| A1 course content | Authored through Unit 16 | Preserve, validate, commit, and push the later-unit work |
| LocalStorage persistence | Working | Preserve as the immediate save path |
| PostgreSQL schema | Drafted | Apply on VPS and verify against the deployed course hash |
| FastAPI backend | Implemented locally | Harden, run, test, and deploy |
| Docker Compose | Drafted | Validate on VPS and configure reverse proxy/HTTPS |
| Client sync adapter | Not implemented | Add to the source generator and generated standalone app |
| Account/login UI | Not implemented | Add optional account and sync controls |
| Local progress migration | Not implemented | Convert existing local state/events into idempotent server events |
| Cross-device sync | Not tested | Test bootstrap, changes, conflict behavior, and offline queue |
| Backups/restoration | Not configured | Add automated backups and perform a restore drill |
| Git integration | Not complete | Reconcile changes, commit, push, and verify remote |

## Required implementation work

### 1. Preserve and reconcile the repository

- [ ] Inspect `git status`, `git diff`, and `git log` before editing.
- [ ] Do not run `git reset --hard`, `git clean -fd`, or `git checkout --` on project files.
- [ ] Identify all changes after Unit 7, including Units 8–16 and generated artifacts.
- [ ] Confirm `curriculum/russian/a1-course.json` validates.
- [ ] Confirm `standalone.html` can be regenerated from `scripts/build_standalone.py`.
- [ ] Decide whether generated study guides belong in Git; preserve them unless the project owner explicitly removes them.
- [ ] Add only intentional files and avoid committing `.env`, credentials, private keys, database dumps, or caches.

### 2. Harden and verify the backend

- [ ] Install backend dependencies in an isolated environment or build the Docker image.
- [ ] Run Python compilation and import checks.
- [ ] Add or run API tests for:
  - [ ] Registration.
  - [ ] Login with valid credentials.
  - [ ] Login rejection with invalid credentials.
  - [ ] Logout and token revocation.
  - [ ] `/v1/me` authorization.
  - [ ] Bootstrap for a new account.
  - [ ] Event acceptance.
  - [ ] Duplicate `client_event_id` handling.
  - [ ] Invalid event rejection.
  - [ ] Unknown unit rejection.
  - [ ] Progress projection updates.
  - [ ] Changes cursor pagination.
  - [ ] User isolation between two accounts.
- [ ] Review the backend for production issues before deployment:
  - [ ] Do not trust client-provided XP as authoritative.
  - [ ] Confirm all user-specific SQL queries scope by authenticated `user_id`.
  - [ ] Add request rate limits for auth and sync endpoints if not supplied by the reverse proxy.
  - [ ] Confirm CORS allows only the real app origin.
  - [ ] Confirm secrets are environment-only.
  - [ ] Confirm sessions expire and can be revoked.
  - [ ] Confirm sensitive values are not logged.
- [ ] Add a proper migration runner or document the one-shot Compose migration behavior for future migrations.

### 3. Deploy PostgreSQL and the API on Hostinger

- [ ] Confirm the VPS OS, Docker availability, disk space, memory, existing services, and ports.
- [ ] Copy/clone the repository to a controlled path such as `/opt/azbuka`.
- [ ] Create a production `.env` directly on the VPS with mode `600`.
- [ ] Generate separate strong values for `POSTGRES_PASSWORD` and `TOKEN_PEPPER`.
- [ ] Set `DATABASE_URL` to use the Docker service hostname `db`, not `localhost`.
- [ ] Replace the course-hash placeholder in the migration with the hash of the exact deployed `a1-course.json`.
- [ ] Run `docker compose config` with a safe test environment before startup.
- [ ] Run `docker compose up -d --build`.
- [ ] Confirm `db` is healthy, `migrate` exits 0, and `api` is healthy.
- [ ] Confirm all 16 rows exist in `course_units`.
- [ ] Confirm PostgreSQL has no published host port.
- [ ] Configure Nginx or Caddy to proxy an API subdomain to `127.0.0.1:8090`.
- [ ] Configure HTTPS and certificate renewal.
- [ ] Set `APP_ORIGINS` to the exact static-app origin.
- [ ] Verify `https://api.example.com/health`.

### 4. Implement the client-side sync adapter

Implement this in the source used by `scripts/build_standalone.py`, not only by editing generated HTML.

- [ ] Add a configurable public API base URL.
- [ ] Preserve immediate LocalStorage saves.
- [ ] Generate and persist a stable browser `deviceId`.
- [ ] Add a durable pending event queue.
- [ ] Assign a stable UUID `client_event_id` to every queued event.
- [ ] Reuse the same event ID across retries.
- [ ] Upload only after local save succeeds.
- [ ] Retry transient failures with bounded exponential backoff.
- [ ] Mark accepted and duplicate events as complete.
- [ ] Keep rejected events and expose a user-safe error state.
- [ ] Add login/logout token handling without storing database credentials.
- [ ] Call `/v1/sync/bootstrap` after login.
- [ ] Call `/v1/sync/changes` using the stored cursor.
- [ ] Merge server state without erasing newer local offline activity.
- [ ] Prevent duplicate XP or review attempts during retries.
- [ ] Provide visible states: local-only, syncing, synced, offline/queued, and error.
- [ ] Provide a manual “Sync now” action.
- [ ] Keep the app fully usable without an account or network.

Suggested local sync metadata:

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

### 5. Add account and migration UI

- [ ] Add optional register form.
- [ ] Add optional login form.
- [ ] Add logout control.
- [ ] Show signed-in email.
- [ ] Show sync status and last-sync time.
- [ ] Show pending event count.
- [ ] Add “Sync now.”
- [ ] Add “Export local progress.”
- [ ] Add “Import local progress.”
- [ ] On first login, offer a clear migration of existing local progress.
- [ ] Keep a local backup until server acceptance is confirmed.
- [ ] Never silently replace local progress with an empty server account.

### 6. Backups and operations

- [ ] Configure daily PostgreSQL logical backups.
- [ ] Keep backups outside the public web root.
- [ ] Copy encrypted backups to a second location.
- [ ] Test restoring a backup into a separate database.
- [ ] Document backup retention.
- [ ] Monitor API health and container restarts.
- [ ] Document the rollback procedure.
- [ ] Document how to rotate database, session, and token secrets.

## Acceptance tests

### Local-first behavior

- [ ] App works with API stopped.
- [ ] Lesson progress survives refresh.
- [ ] Existing LocalStorage state is not lost.

### Account and migration

- [ ] New account registration works.
- [ ] Login works.
- [ ] Existing local progress can be migrated.
- [ ] Server bootstrap returns the learner’s progress.

### Synchronization

- [ ] A completed unit creates events and updates server projections.
- [ ] Retrying an event produces a duplicate response, not a second XP award.
- [ ] Offline events queue locally.
- [ ] Reconnection uploads queued events.
- [ ] Changes cursor advances correctly.
- [ ] A second browser restores progress.
- [ ] Two users cannot see each other’s progress.

### Security

- [ ] Invalid tokens return 401.
- [ ] Expired/revoked sessions fail.
- [ ] Database port is not publicly exposed.
- [ ] HTTPS is required for public access.
- [ ] CORS is restricted.
- [ ] `.env` is not tracked.
- [ ] No secrets appear in frontend files or logs.

## Git completion requirements

Before merging or pushing:

- [ ] Run `git diff --check`.
- [ ] Run the course validator.
- [ ] Rebuild `standalone.html` from the generator.
- [ ] Run `node --check` on the generated script.
- [ ] Run backend Python checks/tests.
- [ ] Run Docker Compose configuration validation.
- [ ] Review `git diff --stat` and the complete staged diff.
- [ ] Confirm no secrets, `.env`, dumps, caches, or temporary files are staged.
- [ ] Commit in logical commits, for example:
  - [ ] A1 course completion/content and generated app.
  - [ ] Database/backend/Compose deployment.
  - [ ] Client sync adapter and account UI.
  - [ ] Documentation and tests.
- [ ] Push to the configured `origin` branch only after the owner has reviewed the summary or explicitly authorized the push.
- [ ] Verify the remote commit and working tree after push.

## Definition of done

The backend phase is complete only when:

1. The API is running behind HTTPS on the VPS.
2. PostgreSQL is running privately and has all 16 course units.
3. A learner can register, log in, and log out.
4. Existing LocalStorage progress can be migrated safely.
5. New lesson actions save locally and synchronize as idempotent events.
6. Offline activity queues and later uploads successfully.
7. A second browser restores the learner’s progress.
8. Duplicate retries do not double-count progress or rewards.
9. Backups and a restore test exist.
10. The implementation, tests, and documentation are committed and pushed without secrets.
