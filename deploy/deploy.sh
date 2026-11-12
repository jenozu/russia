#!/bin/sh
# Idempotent deploy of Azbuka on the VPS. Run as root: sh /opt/azbuka/deploy/deploy.sh
# Pulls main, builds dist/ (static app) and (re)starts the Compose stack, then waits until it is healthy.
# Never prints .env values. Touches only this directory and the azbuka_* Docker resources.
set -eu
APP_DIR="${APP_DIR:-/opt/azbuka}"
cd "$APP_DIR"

[ -f .env ] || { echo "Missing $APP_DIR/.env. Create it with: sh deploy/make_env.sh" >&2; exit 1; }
chmod 600 .env
if grep -q -e '<generate-on-server>' -e '<same-password>' -e 'your-app-domain' .env; then
  echo ".env still has placeholder values. Fix them (or recreate with deploy/make_env.sh)." >&2; exit 1
fi

git pull --ff-only origin main
python3 scripts/build_dist.py
docker compose config -q
docker compose up -d --build --remove-orphans

status() { # status <service> -> "health" or "state exitcode"
  id=$(docker compose ps -a -q "$1" 2>/dev/null | head -1)
  [ -n "$id" ] || { echo "missing"; return; }
  case "$1" in
    migrate) docker inspect -f '{{.State.Status}} {{.State.ExitCode}}' "$id" ;;
    *) docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$id" ;;
  esac
}

i=0
while [ "$i" -lt 60 ]; do
  db=$(status db); mig=$(status migrate); api=$(status api); web=$(status web)
  if [ "$db" = "healthy" ] && [ "$mig" = "exited 0" ] && [ "$api" = "healthy" ] && [ "$web" = "healthy" ]; then
    echo "OK: db=$db migrate=$mig api=$api web=$web"
    exit 0
  fi
  case "$mig" in exited\ [1-9]*) break ;; esac
  i=$((i + 1)); sleep 2
done

echo "FAILED: db=$db migrate=$mig api=$api web=$web" >&2
echo "--- migrate (last 15) ---" >&2; docker compose logs --no-color --tail 15 migrate >&2 || true
echo "--- api (last 30) ---" >&2; docker compose logs --no-color --tail 30 api >&2 || true
echo "--- web (last 10) ---" >&2; docker compose logs --no-color --tail 10 web >&2 || true
exit 1
