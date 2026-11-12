# Claude Implementation Brief: Deploy Azbuka Backend to Hostinger VPS

Copy this entire document into Claude, then provide the SSH/VPS information only through a secure mechanism. Do not paste passwords, private keys, database passwords, or token secrets into ordinary chat.

---

## Your role

You are the implementation engineer for the Azbuka Russian A1 Voice Tutor project. Your job is to deploy the existing FastAPI backend and PostgreSQL Docker Compose stack to the owner’s Hostinger VPS, verify it safely, and then connect the standalone app to the API through a local-first client sync adapter.

Work carefully and explain each major operation before executing it. Preserve the existing LocalStorage behavior. Do not turn the app into a network-only application.

The project is a dependency-free static learning app with a Python FastAPI backend and PostgreSQL schema prepared for account-based synchronization.

## Repository and important files

The repository is:

```text
https://github.com/jenozu/russia.git
```

The relevant files are:

```text
standalone.html
curriculum/russian/a1-course.json
scripts/build_standalone.py
scripts/validate_course_content.py

db/migrations/001_initial_azbuka_schema.sql

docker-compose.yml
backend/Dockerfile
backend/app/main.py
backend/requirements.txt
backend/.env.compose.example
backend/README.md
DOCKER_DEPLOYMENT.md
HOSTINGER_VPS_POSTGRES_SETUP.md
AZBUKA_VPS_SQL_SYNC_PLAN.md
```

The existing backend API includes:

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

The existing browser state is stored under:

```text
localStorage["azbuka-standalone"]
```

---

# Phase 0 — Collect deployment information safely

Before making VPS changes, ask for or verify:

1. VPS operating system and version.
2. SSH username.
3. VPS hostname or IP address.
4. Domain name for the API, such as `api.example.com`.
5. Domain name or URL where the standalone app will be hosted.
6. Whether DNS is already pointing the API subdomain to the VPS.
7. Whether Docker and Docker Compose are already installed.
8. Whether Nginx or Caddy is already running.
9. Whether another application already uses ports 80, 443, or 8090.
10. Whether SSH access uses a key or password.

Never ask the owner to paste a private SSH key, VPS root password, database password, or API secret into chat. Ask the owner to enter secrets directly in the VPS terminal or use the secure credential mechanism available in the environment.

Do not execute destructive commands until the target host and project directory are confirmed.

---

# Phase 1 — Inspect the VPS without changing it

Connect over SSH and collect read-only information first:

```bash
cat /etc/os-release
whoami
hostname
uname -a
docker --version || true
docker compose version || true
sudo systemctl is-active docker || true
sudo systemctl is-active nginx || true
sudo systemctl is-active caddy || true
sudo ss -tulpn
sudo ufw status verbose || true
```

Check available resources:

```bash
df -h
free -h
```

Do not install or remove anything until the inspection is complete and reported.

If the VPS is not Ubuntu/Debian, stop and adapt the package commands rather than blindly executing the Ubuntu instructions.

---

# Phase 2 — Deploy the repository

Use a dedicated deployment directory:

```bash
sudo mkdir -p /opt/azbuka
sudo chown "$USER":"$USER" /opt/azbuka
```

If the repository is not already present:

```bash
git clone https://github.com/jenozu/russia.git /opt/azbuka
```

If it is already present:

```bash
cd /opt/azbuka
git status --short
git remote -v
git pull --ff-only
```

Do not overwrite local VPS changes without inspecting them first.

Confirm the required files exist:

```bash
cd /opt/azbuka
test -f docker-compose.yml
test -f backend/Dockerfile
test -f backend/app/main.py
test -f db/migrations/001_initial_azbuka_schema.sql
```

---

# Phase 3 — Install Docker if required

Only if Docker is absent, install Docker Engine and the Compose plugin using the official Docker instructions for the VPS operating system.

After installation, verify:

```bash
docker --version
docker compose version
sudo systemctl enable --now docker
```

Add the deployment user to the Docker group only if appropriate:

```bash
sudo usermod -aG docker "$USER"
```

If the group changes, explain that the user must start a new SSH session before continuing. Do not weaken Docker socket permissions.

---

# Phase 4 — Create the production environment file

From the project root:

```bash
cd /opt/azbuka
cp .env.compose.example .env
chmod 600 .env
```

Edit `.env` directly on the VPS:

```bash
nano .env
```

The final file must contain real values for:

```env
POSTGRES_DB=azbuka
POSTGRES_USER=azbuka_app
POSTGRES_PASSWORD=LONG_RANDOM_DATABASE_PASSWORD
DATABASE_URL=postgresql://azbuka_app:URL_ENCODED_PASSWORD@db:5432/azbuka
APP_ORIGINS=https://APP_DOMAIN.example
SESSION_TTL_DAYS=30
MAX_SYNC_EVENTS=250
TOKEN_PEPPER=SEPARATE_LONG_RANDOM_SECRET
API_PORT=8090
```

Generate secrets on the VPS, not in chat:

```bash
openssl rand -base64 32
openssl rand -hex 32
```

Important:

- `POSTGRES_PASSWORD` and the password inside `DATABASE_URL` must match.
- URL-encode the password if it contains reserved URL characters.
- `TOKEN_PEPPER` must be different from the database password.
- Never commit `.env`.
- Never print `.env` in logs or include it in a response.
- Verify permissions are `600`.

---

# Phase 5 — Prepare and apply the course migration

The migration seeds all 16 A1 units. Before applying it for the first time, replace the course-content hash placeholder with the hash of the exact course JSON deployed with the app:

```bash
cd /opt/azbuka
HASH="$(sha256sum curriculum/russian/a1-course.json | awk '{print $1}')"
sed "s/replace-with-a1-course-json-sha256/$HASH/g" \
  db/migrations/001_initial_azbuka_schema.sql \
  > /tmp/001_initial_azbuka_schema.applied.sql
mv /tmp/001_initial_azbuka_schema.applied.sql \
  db/migrations/001_initial_azbuka_schema.sql
```

Confirm the placeholder is gone:

```bash
grep -n "replace-with-a1-course-json-sha256" \
  db/migrations/001_initial_azbuka_schema.sql || true
```

Do not run `docker compose down -v`. That deletes the PostgreSQL volume.

Start the stack:

```bash
docker compose up -d --build
```

Check service status:

```bash
docker compose ps
docker compose logs --tail=100 migrate
docker compose logs --tail=100 api
```

Expected state:

- `db` is running and healthy.
- `migrate` exited with code 0.
- `api` is running and healthy.

If the migration fails, stop and inspect the error. Do not delete the database volume as a first response.

---

# Phase 6 — Verify the database and API

Verify the local API:

```bash
curl -f http://127.0.0.1:8090/health
```

Expected response:

```json
{"status":"ok"}
```

Verify all 16 course units using the migration client:

```bash
docker compose run --rm migrate \
  psql -h db -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c 'SELECT unit_order, id, title FROM course_units ORDER BY unit_order;'
```

If the shell does not have the Compose variables exported, use values from `.env` without printing the password.

Verify the migration marker:

```bash
docker compose run --rm migrate \
  psql -h db -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c 'SELECT version, applied_at FROM schema_migrations ORDER BY applied_at;'
```

Verify the API docs locally through an SSH tunnel rather than publicly exposing port 8090:

```bash
ssh -L 8090:127.0.0.1:8090 VPS_USER@VPS_IP
```

Then open locally:

```text
http://127.0.0.1:8090/docs
```

Test registration and login with a disposable development account. Do not use the owner’s real password in a command copied into shell history.

---

# Phase 7 — Configure HTTPS reverse proxy

Expose only an HTTPS API subdomain, such as:

```text
https://api.example.com
```

The reverse proxy should forward to:

```text
http://127.0.0.1:8090
```

Do not publish PostgreSQL port 5432.

If Nginx is used, create a site configuration similar to:

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then validate and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Use the VPS’s approved HTTPS certificate method. After HTTPS works, set:

```env
APP_ORIGINS=https://THE_EXACT_APP_ORIGIN
```

Restart only the API:

```bash
docker compose up -d api
```

Verify the public API:

```bash
curl -f https://api.example.com/health
```

---

# Phase 8 — Implement the client-side sync adapter

The backend deployment is not enough by itself. The standalone app must upload local progress events and pull server progress.

Implement this in the source used by `scripts/build_standalone.py`, not only by editing generated `standalone.html`.

Preserve the existing behavior:

```javascript
localStorage["azbuka-standalone"]
```

The sync adapter must:

1. Continue saving locally first.
2. Generate a stable browser device ID.
3. Add a local pending event queue.
4. Upload events only when the user is signed in.
5. Retry network failures with backoff.
6. Mark accepted and duplicate events as complete.
7. Keep rejected events visible for troubleshooting.
8. Call `/v1/sync/bootstrap` after login.
9. Call `/v1/sync/changes` using the stored server cursor.
10. Merge progress without allowing a server response to erase newer local offline activity.
11. Show sync state such as `Local only`, `Syncing`, `Synced`, or `Offline — queued`.
12. Provide a local JSON export before migration.

Suggested additional local fields:

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

Suggested event queue key:

```text
azbuka-sync-queue
```

Every queued event needs a stable `client_event_id`. Retrying the same event must reuse the same ID.

Do not upload the entire LocalStorage object on every click. Upload append-only events, then use bootstrap/changes for restoration and reconciliation.

---

# Phase 9 — Add account and sync UI

Add a small Settings or Account panel to the app with:

- Create account.
- Log in.
- Log out.
- Current account email.
- Sync status.
- Last successful sync time.
- Pending event count.
- “Sync now” button.
- “Export local progress” button.
- “Import local progress” button.

The app should remain usable without an account. Make the account feature optional until the learner chooses to sync.

Do not store database credentials in the frontend. The frontend only knows the public API base URL.

Use an API configuration value such as:

```javascript
const SYNC_API_BASE = 'https://api.example.com';
```

For the first implementation, use the existing bearer-token API contract. If the app is made public, harden this into short-lived access tokens and Secure HttpOnly refresh sessions.

---

# Phase 10 — Test the full system

Run the following acceptance tests and record the results.

## Local-first test

1. Open the app while the API is unavailable.
2. Complete a lesson and review.
3. Refresh the page.
4. Confirm progress remains in LocalStorage.

## Registration and migration test

1. Export existing local progress.
2. Create a development account.
3. Sign in.
4. Migrate local progress into sync events.
5. Confirm the API reports accepted events.
6. Confirm no progress was lost locally.

## Duplicate-event test

1. Submit the same event twice with the same `client_event_id`.
2. Confirm the first response is accepted.
3. Confirm the second response is reported as a duplicate.
4. Confirm XP and attempts were not doubled.

## Offline queue test

1. Sign in.
2. Disconnect the browser from the network.
3. Complete dialogue, listening, story, and checkpoint actions.
4. Confirm the app shows queued events.
5. Reconnect.
6. Confirm the events upload automatically.

## Cross-browser test

1. Sign in from Browser A.
2. Complete Unit 16 dialogue and checkpoint.
3. Sign in from Browser B.
4. Call bootstrap.
5. Confirm Unit 16 progress appears.
6. Review an item in Browser B.
7. Confirm Browser A receives the change after its next sync.

## Security test

Confirm:

- PostgreSQL has no public port.
- API is reachable only through HTTPS publicly.
- `.env` is not tracked by Git.
- Database credentials are absent from frontend files.
- CORS allows only the real app origin.
- Invalid bearer tokens return 401.
- One user cannot request another user’s progress.
- Expired sessions stop working.
- Passwords are not logged.

---

# Required deliverables

Before declaring the task complete, provide:

1. VPS operating system and hostname used.
2. Git commit/version deployed.
3. Docker Compose service status.
4. Migration result.
5. Number of rows in `course_units`.
6. API health-check result.
7. Public HTTPS API URL.
8. Client sync adapter files changed.
9. Tests executed and their results.
10. Backup location and restore-test status.
11. Any remaining limitations.

Never include passwords, private keys, bearer tokens, `TOKEN_PEPPER`, or database URLs containing credentials in the final report.

---

# Safety rules

- Do not run `docker compose down -v` on a production database.
- Do not run `DROP DATABASE`, `DROP TABLE`, or destructive SQL without explicit confirmation and a verified backup.
- Do not open port 5432 to the internet.
- Do not expose FastAPI directly without HTTPS.
- Do not commit `.env` or secrets.
- Do not replace LocalStorage with a network-only flow.
- Do not silently discard local progress during migration.
- Do not claim cross-device synchronization is complete until the two-browser test passes.
- If an operation could delete data or interrupt another service, stop and ask for confirmation before executing it.

The desired end state is:

```text
Static Azbuka app
    -> local LocalStorage save always works
    -> optional account login
    -> HTTPS sync API on the VPS
    -> private PostgreSQL in Docker
    -> idempotent event-based cross-device synchronization
```
