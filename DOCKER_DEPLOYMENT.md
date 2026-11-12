# Azbuka Docker Compose Deployment on a Hostinger VPS

This stack runs:

- PostgreSQL 16 with a persistent Docker volume.
- A one-shot migration container that applies the Azbuka schema.
- The FastAPI backend on an internal Docker network.

PostgreSQL has no published host port. The API is bound to `127.0.0.1:8090` on the VPS so Nginx or Caddy can expose it through HTTPS.

```text
Internet -> Nginx/Caddy HTTPS -> 127.0.0.1:8090 -> api container -> internal db container
```

## Files

- `docker-compose.yml` — PostgreSQL, migration, and API services.
- `backend/Dockerfile` — unprivileged Python API image.
- `backend/requirements.txt` — API dependencies.
- `.env.compose.example` — production environment template.
- `.dockerignore` — excludes secrets and local files from the image.
- `db/migrations/*.sql` — numbered schema migrations, applied once each by `db/apply_migrations.sh`.
- `db/repeatable/course_units.sql` — generated course seed, re-applied on every start.

## Prerequisites on the VPS

Install Docker Engine and the Compose plugin using Docker's official Ubuntu/Debian instructions. Verify:

```bash
docker --version
docker compose version
```

Do not install PostgreSQL separately for this Compose deployment. The `db` service supplies PostgreSQL. You can keep a separate host PostgreSQL installation only if you deliberately change the Compose configuration and connection strategy.

## 1. Copy the project to the VPS

```bash
sudo mkdir -p /opt/azbuka
sudo chown "$USER":"$USER" /opt/azbuka
git clone https://github.com/jenozu/russia.git /opt/azbuka
cd /opt/azbuka
```

For a private repository, use a deploy key or copy the project through a secure channel. Do not put a GitHub token in a command that will remain in shell history.

## 2. Create the production environment file

```bash
cp .env.compose.example .env
chmod 600 .env
nano .env
```

Generate secrets on the VPS:

```bash
openssl rand -base64 32
openssl rand -hex 32
```

Use the first value for `POSTGRES_PASSWORD` and the second for `TOKEN_PEPPER`.

The `DATABASE_URL` password must match `POSTGRES_PASSWORD` and must be URL-encoded if it contains characters reserved by URLs. For the simplest setup, use a long random password made from letters and numbers only.

Set `APP_ORIGINS` to the exact HTTPS origin hosting the standalone app, for example:

```env
APP_ORIGINS=https://app.example.com
```

Do not use `*` with authenticated requests.

## 3. Course content hash (automatic)

The course metadata is loaded from `db/repeatable/course_units.sql`, which is generated from `curriculum/russian/a1-course.json` and carries that file's SHA-256 hash. Nothing needs editing by hand. The migration runner re-applies it on every `docker compose up`.

Whenever the course JSON changes, regenerate and commit the seed:

```bash
python3 scripts/generate_course_seed.py          # rewrite the seed
python3 scripts/generate_course_seed.py --check  # fails if the committed seed is stale
```

Never edit `db/migrations/001_initial_azbuka_schema.sql` after it has been applied. Its placeholder hash row is harmless; the repeatable seed adds the real course version and points all 16 units at it.

## 4. Start the stack

Build the API image and start the database. The migration service waits for the database health check, applies the schema, and exits successfully. The API starts only after migration success.

```bash
docker compose up -d --build
```

Inspect service status:

```bash
docker compose ps
docker compose logs --tail=100 db
docker compose logs --tail=100 migrate
docker compose logs --tail=100 api
```

Expected state:

- `db` — running and healthy.
- `migrate` — exited with code 0.
- `api` — running and healthy.

## 5. Verify the API from the VPS

```bash
curl -f http://127.0.0.1:8090/health
```

Expected response:

```json
{"status":"ok"}
```

Open the API documentation only through an SSH tunnel or a protected HTTPS route during setup:

```text
http://127.0.0.1:8090/docs
```

To view it from your own computer without making port 8090 public:

```bash
ssh -L 8090:127.0.0.1:8090 YOUR_VPS_USER@YOUR_VPS_IP
```

Then open `http://127.0.0.1:8090/docs` locally.

## 6. Verify the database

The database is reachable only from the Docker network. Run `psql` through a temporary PostgreSQL client container:

```bash
docker compose run --rm migrate \
  psql -h db -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c 'SELECT unit_order, id, title FROM course_units ORDER BY unit_order;'
```

The Compose `.env` variables are available to Compose interpolation. If your shell does not have them exported, use:

```bash
docker compose run --rm \
  -e PGPASSWORD="$(grep '^POSTGRES_PASSWORD=' .env | cut -d= -f2-)" \
  migrate psql -h db -U "$(grep '^POSTGRES_USER=' .env | cut -d= -f2-)" \
  -d "$(grep '^POSTGRES_DB=' .env | cut -d= -f2-)" \
  -c 'SELECT COUNT(*) FROM course_units;'
```

The expected unit count is `16`.

## 7. Configure HTTPS reverse proxy

Do not expose the API directly on a public port. Configure Nginx or Caddy to proxy an API subdomain to:

```text
http://127.0.0.1:8090
```

A minimal Nginx location is conceptually:

```nginx
server {
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

Use a trusted TLS certificate, configure renewal, then change `APP_ORIGINS` to the exact app origin and restart the API:

```bash
docker compose up -d api
```

## 8. Updating the API

Pull the latest code, rebuild, and restart:

```bash
cd /opt/azbuka
git pull
docker compose build api
docker compose up -d api
```

For a schema change, update the migration strategy before deploying. The current migration is intended for the initial database. Do not edit an already-applied production migration and assume it will run again.

## 9. Backups

List the PostgreSQL volume:

```bash
docker volume inspect azbuka_postgres_data
```

Create a logical backup through a temporary client container:

```bash
mkdir -p /opt/azbuka/backups
chmod 700 /opt/azbuka/backups

docker compose run --rm \
  -e PGPASSWORD="$(grep '^POSTGRES_PASSWORD=' .env | cut -d= -f2-)" \
  migrate pg_dump -h db -U "$(grep '^POSTGRES_USER=' .env | cut -d= -f2-)" \
  -d "$(grep '^POSTGRES_DB=' .env | cut -d= -f2-)" \
  --format=custom \
  --file="/tmp/azbuka-$(date +%F-%H%M).dump"
```

For a persistent backup file, use a small backup image or mount a backup directory into the client container. Keep copies outside the VPS as well. Test restoring into a separate database before trusting the backup.

Never rely only on a copy of the Docker volume while PostgreSQL is running. Prefer `pg_dump` for logical backups.

## 10. Stop or reset the stack

Stop containers while preserving data:

```bash
docker compose down
```

Stop containers and delete the database volume — destructive:

```bash
docker compose down -v
```

Do not run `down -v` on a production VPS unless you have a verified backup and explicitly intend to delete the database.

## Troubleshooting

### Migration container exits with an error

```bash
docker compose logs migrate
```

Fix the SQL or environment issue, then rerun:

```bash
docker compose run --rm migrate
```

### API cannot connect to PostgreSQL

Inside Docker, the hostname must be `db`, not `127.0.0.1` or `localhost`:

```env
DATABASE_URL=postgresql://azbuka_app:PASSWORD@db:5432/azbuka
```

`127.0.0.1` inside the API container refers to the API container itself.

### Port 8090 is already in use

Change the host-side port in `.env`:

```env
API_PORT=8091
```

Then update the reverse proxy target to `127.0.0.1:8091` and restart:

```bash
docker compose up -d api
```

### CORS errors in the browser

Ensure `APP_ORIGINS` contains the exact scheme and host of the app, without a trailing path:

```env
APP_ORIGINS=https://app.example.com
```

Restart the API after changing it:

```bash
docker compose up -d api
```

## Deployment checklist

- [ ] Docker and Compose are installed.
- [ ] `.env` exists and has mode 600.
- [ ] `POSTGRES_PASSWORD` is strong and private.
- [ ] `TOKEN_PEPPER` is separate from the database password.
- [ ] `DATABASE_URL` uses `db` as the hostname.
- [ ] `python3 scripts/generate_course_seed.py --check` passes, so the seed matches the deployed `a1-course.json`.
- [ ] `docker compose up -d --build` succeeds.
- [ ] `migrate` exits successfully.
- [ ] `api` reports healthy.
- [ ] `curl http://127.0.0.1:8090/health` succeeds.
- [ ] All 16 units appear in `course_units`.
- [ ] PostgreSQL has no published port.
- [ ] Only HTTPS exposes the API publicly.
- [ ] Backups are configured and a restore test is scheduled.
- [ ] The client-side sync adapter is configured with the public API URL.
