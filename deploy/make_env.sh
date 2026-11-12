#!/bin/sh
# Creates /opt/azbuka/.env with fresh random secrets. Refuses to overwrite an existing file. Prints no secret.
# Usage: sh deploy/make_env.sh [https://app-origin]   (default https://azbuka.andel-vps.space)
set -eu
APP_DIR="${APP_DIR:-/opt/azbuka}"
ORIGIN="${1:-https://azbuka.andel-vps.space}"
cd "$APP_DIR"
[ ! -e .env ] || { echo ".env already exists; not touching it." >&2; exit 1; }
rand() { head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n'; }
PW=$(rand); PEPPER=$(rand)
umask 077
cat > .env <<EOT
POSTGRES_DB=azbuka
POSTGRES_USER=azbuka_app
POSTGRES_PASSWORD=$PW
DATABASE_URL=postgresql://azbuka_app:$PW@db:5432/azbuka
TOKEN_PEPPER=$PEPPER
APP_ORIGINS=$ORIGIN
SESSION_TTL_DAYS=30
MAX_SYNC_EVENTS=250
API_PORT=8090
EOT
chmod 600 .env
echo "Created $APP_DIR/.env (mode 600) for $ORIGIN. Secrets are random and were not printed."
