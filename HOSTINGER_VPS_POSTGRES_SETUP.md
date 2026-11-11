# Azbuka PostgreSQL Setup on a Hostinger VPS

This guide sets up the PostgreSQL database required by the Azbuka A1 progress API.

The commands assume:

- A Hostinger VPS running Ubuntu or Debian.
- SSH access with a sudo-capable user.
- The Azbuka repository available on the VPS, or the migration file copied to it.
- The API and PostgreSQL database running on the same VPS.

The recommended security model is:

```text
Internet -> HTTPS API -> localhost PostgreSQL
```

The browser must never connect directly to PostgreSQL, and PostgreSQL should not be exposed publicly on port `5432`.

## 1. Connect to the VPS

From your computer:

```bash
ssh YOUR_VPS_USER@YOUR_VPS_IP
```

Check the operating system:

```bash
cat /etc/os-release
```

The commands below target Ubuntu/Debian. If your VPS uses another distribution, use its PostgreSQL package and service conventions.

## 2. Update the VPS

```bash
sudo apt update
sudo apt upgrade -y
```

Install basic tools:

```bash
sudo apt install -y ca-certificates curl git unzip ufw openssl
```

## 3. Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
```

Enable and start the service:

```bash
sudo systemctl enable postgresql
sudo systemctl start postgresql
sudo systemctl status postgresql --no-pager
```

Confirm the server is responding:

```bash
sudo -u postgres psql -c "SELECT version();"
```

## 4. Create the Azbuka database user and database

Generate a strong password locally on the VPS:

```bash
openssl rand -base64 32
```

Copy the result somewhere secure temporarily. Do not commit it to Git, paste it into the browser, or place it in a public file.

Open the PostgreSQL administrator console:

```bash
sudo -u postgres psql
```

Run the following SQL, replacing `PASTE_A_LONG_RANDOM_PASSWORD_HERE` with the generated password:

```sql
CREATE ROLE azbuka_app LOGIN PASSWORD 'PASTE_A_LONG_RANDOM_PASSWORD_HERE';
CREATE DATABASE azbuka OWNER azbuka_app;
\connect azbuka
CREATE EXTENSION IF NOT EXISTS pgcrypto;
\q
```

If you accidentally expose the password in shell history or a terminal recording, rotate it immediately:

```bash
sudo -u postgres psql -c "ALTER ROLE azbuka_app WITH PASSWORD 'NEW_LONG_RANDOM_PASSWORD';"
```

## 5. Keep PostgreSQL private

Find the active PostgreSQL configuration file:

```bash
sudo -u postgres psql -tAc "SHOW config_file;"
```

Edit the returned file, for example:

```bash
sudo nano /etc/postgresql/16/main/postgresql.conf
```

Set PostgreSQL to listen only on the VPS itself:

```conf
listen_addresses = '127.0.0.1'
```

Find the client-authentication file:

```bash
sudo -u postgres psql -tAc "SHOW hba_file;"
```

Edit it:

```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Ensure local TCP connections use SCRAM authentication. Add or confirm a line like:

```conf
host    azbuka    azbuka_app    127.0.0.1/32    scram-sha-256
```

Do not add `0.0.0.0/0`. Do not open PostgreSQL to the entire internet.

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

Test the application role through the local TCP path:

```bash
PGPASSWORD='YOUR_DATABASE_PASSWORD' psql \
  "host=127.0.0.1 port=5432 dbname=azbuka user=azbuka_app sslmode=disable" \
  -c "SELECT current_user, current_database();"
```

For a same-VPS API, local TCP is sufficient. TLS between API and database can be added later if the API and database are moved to separate machines.

## 6. Copy or clone the Azbuka project

Option A: clone the private repository on the VPS:

```bash
sudo mkdir -p /opt/azbuka
sudo chown "$USER":"$USER" /opt/azbuka
git clone https://github.com/jenozu/russia.git /opt/azbuka
cd /opt/azbuka
```

If the repository is private, use a deploy key or another secure GitHub authentication method. Do not put a personal access token into a shell command that will remain in history.

Option B: copy only the migration from your development machine:

```bash
scp db/migrations/001_initial_azbuka_schema.sql \
  YOUR_VPS_USER@YOUR_VPS_IP:/tmp/001_initial_azbuka_schema.sql
```

Then on the VPS:

```bash
sudo mkdir -p /opt/azbuka/db/migrations
sudo mv /tmp/001_initial_azbuka_schema.sql /opt/azbuka/db/migrations/
```

## 7. Set the deployed course content hash

The migration seeds the course metadata and contains this placeholder:

```text
replace-with-a1-course-json-sha256
```

If the VPS has the repository, calculate the hash of the exact course file that belongs to the deployed app:

```bash
cd /opt/azbuka
sha256sum curriculum/russian/a1-course.json
```

Replace the placeholder in a copy of the migration. The command below is safe because a SHA-256 hash contains only hexadecimal characters:

```bash
HASH="$(sha256sum curriculum/russian/a1-course.json | awk '{print $1}')"
sed "s/replace-with-a1-course-json-sha256/$HASH/g" \
  db/migrations/001_initial_azbuka_schema.sql \
  > /tmp/001_initial_azbuka_schema.applied.sql
```

Review the generated SQL before applying it:

```bash
grep -n "course_versions\|$HASH\|replace-with" /tmp/001_initial_azbuka_schema.applied.sql
```

The output should contain the real hash and no remaining placeholder.

## 8. Apply the Azbuka migration

Avoid putting the database password directly into a long-lived shell command. Use a temporary `PGPASSWORD` variable in the current shell or a protected `.pgpass` file.

Temporary shell variable:

```bash
export PGPASSWORD='YOUR_DATABASE_PASSWORD'
psql "host=127.0.0.1 port=5432 dbname=azbuka user=azbuka_app sslmode=disable" \
  -v ON_ERROR_STOP=1 \
  -f /tmp/001_initial_azbuka_schema.applied.sql
unset PGPASSWORD
```

The migration creates:

- `users`
- `sessions`
- `auth_tokens`
- `user_devices`
- `user_settings`
- `user_rewards`
- `course_versions`
- `course_units`
- `user_unit_progress`
- `user_item_progress`
- `user_story_progress`
- `user_scenario_progress`
- `learning_events`
- `sync_cursors`
- `data_exports`
- `schema_migrations`
- `user_progress_summary` view

## 9. Verify the schema

```bash
export PGPASSWORD='YOUR_DATABASE_PASSWORD'
psql "host=127.0.0.1 port=5432 dbname=azbuka user=azbuka_app sslmode=disable" <<'SQL'
SELECT current_database(), current_user;
SELECT version FROM schema_migrations ORDER BY version;
SELECT unit_order, id, title, status, vocabulary_count
FROM course_units
ORDER BY unit_order;
SELECT COUNT(*) AS table_count
FROM information_schema.tables
WHERE table_schema = 'public';
SQL
unset PGPASSWORD
```

Expected course-unit result:

- 16 rows.
- Unit orders 1 through 16.
- Unit 16 titled `A1 survival mission`.
- Active status for the authored A1 unit spine.

Check the important indexes and view:

```bash
export PGPASSWORD='YOUR_DATABASE_PASSWORD'
psql "host=127.0.0.1 port=5432 dbname=azbuka user=azbuka_app sslmode=disable" -c "\d+ learning_events"
psql "host=127.0.0.1 port=5432 dbname=azbuka user=azbuka_app sslmode=disable" -c "SELECT * FROM user_progress_summary LIMIT 1;"
unset PGPASSWORD
```

## 10. Create the API environment file

Once the database works, create a protected environment file for the API. Do not store it in Git:

```bash
sudo mkdir -p /etc/azbuka
sudo nano /etc/azbuka/api.env
```

Example contents:

```env
DATABASE_URL=postgresql://azbuka_app:URL_ENCODED_PASSWORD@127.0.0.1:5432/azbuka
APP_ORIGINS=https://YOUR_APP_DOMAIN
SESSION_TTL_DAYS=30
MAX_SYNC_EVENTS=250
TOKEN_PEPPER=GENERATE_A_SEPARATE_LONG_RANDOM_SECRET
```

Generate the token pepper:

```bash
openssl rand -hex 32
```

If the database password contains characters such as `@`, `:`, `/`, `?`, or `#`, URL-encode it before putting it in `DATABASE_URL`. A safer alternative is to use a PostgreSQL password without URL-reserved characters, consisting of a long random set of letters, numbers, and a few simple symbols.

Protect the file:

```bash
sudo chown root:root /etc/azbuka/api.env
sudo chmod 600 /etc/azbuka/api.env
```

The backend README contains the API installation and runtime instructions.

## 11. Configure the firewall

Only expose SSH and the web ports needed by the API/reverse proxy:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

Do **not** run:

```bash
sudo ufw allow 5432/tcp
```

If you need remote database administration, use an SSH tunnel instead of opening port 5432 publicly:

```bash
ssh -L 5433:127.0.0.1:5432 YOUR_VPS_USER@YOUR_VPS_IP
```

Then connect from your computer to `127.0.0.1:5433`.

## 12. Set up backups before real learner data

Create a protected backup directory:

```bash
sudo mkdir -p /var/backups/azbuka
sudo chown postgres:postgres /var/backups/azbuka
sudo chmod 700 /var/backups/azbuka
```

Test a manual backup:

```bash
sudo -u postgres pg_dump \
  --format=custom \
  --file=/var/backups/azbuka/azbuka-$(date +%F-%H%M).dump \
  azbuka
```

Test that the backup is readable:

```bash
sudo -u postgres pg_restore --list \
  /var/backups/azbuka/azbuka-YYYY-MM-DD-HHMM.dump | head
```

A practical first automated backup is a daily cron job or systemd timer that:

1. Runs `pg_dump --format=custom`.
2. Stores the dump outside the web root.
3. Keeps a rolling retention window.
4. Copies an encrypted backup to a separate storage location.
5. Sends an alert when the backup command fails.

A backup is not verified until a restore has been tested on a separate database or VPS.

## 13. Common checks and troubleshooting

### PostgreSQL is not running

```bash
sudo systemctl status postgresql --no-pager
sudo journalctl -u postgresql -n 100 --no-pager
```

### Authentication failed

Check that:

- The role name is exactly `azbuka_app`.
- The password is correct.
- `pg_hba.conf` includes `127.0.0.1/32` with `scram-sha-256`.
- PostgreSQL was restarted after configuration changes.
- The connection uses `host=127.0.0.1`, not an unexpected socket or public hostname.

### The migration stops with a foreign-key error

Apply the migration as the `azbuka_app` role against the `azbuka` database. Do not manually insert progress rows before the migration creates `course_units`.

### The migration says an object already exists

The migration is designed to be repeat-safe for its tables and seeds. If a previous partial migration exists, inspect:

```bash
psql "$DATABASE_URL" -c "SELECT * FROM schema_migrations;"
```

Do not drop production tables casually. Take a backup first and resolve the specific failed statement.

## Completion checklist

- [ ] SSH access works.
- [ ] PostgreSQL is installed and enabled.
- [ ] `azbuka_app` role exists.
- [ ] `azbuka` database exists.
- [ ] PostgreSQL listens only on localhost.
- [ ] Port 5432 is not exposed through UFW or the Hostinger firewall.
- [ ] The course-content hash is inserted into the migration.
- [ ] The migration completes with `ON_ERROR_STOP=1`.
- [ ] All 16 course units are present.
- [ ] The `learning_events` table and idempotency constraint exist.
- [ ] The API environment file is protected with mode 600.
- [ ] A manual backup has completed.
- [ ] A restore test has been performed.
- [ ] The API can connect using the final `DATABASE_URL`.

After this checklist is complete, the next implementation step is deploying the FastAPI service and then connecting the standalone app’s client-side sync adapter to it.
