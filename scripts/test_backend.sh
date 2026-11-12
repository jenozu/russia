#!/bin/sh
# Runs the backend tests against a throwaway local PostgreSQL cluster.
# Requires PostgreSQL server binaries (initdb, pg_ctl) and Python test deps:
#   pip install -r backend/requirements-dev.txt
# If TEST_DATABASE_URL is already set it is used as-is (it WILL be wiped).
set -eu
root="$(cd "$(dirname "$0")/.." && pwd)"

if [ -n "${TEST_DATABASE_URL:-}" ]; then
  cd "$root/backend" && ALLOW_WIPE_TEST_DB=1 exec python3 -m pytest "$@"
fi

bin="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)"
[ -n "$bin" ] || { echo "PostgreSQL server binaries not found; set TEST_DATABASE_URL instead" >&2; exit 2; }

work="$(mktemp -d)"
run=""
if [ "$(id -u)" = "0" ]; then
  id azbuka_pgtest >/dev/null 2>&1 || useradd --system --create-home azbuka_pgtest
  chown azbuka_pgtest "$work"
  run="runuser -u azbuka_pgtest --"
fi
port="${TEST_PG_PORT:-54329}"
cleanup() { $run "$bin/pg_ctl" -D "$work/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$work"; }
trap cleanup EXIT

$run "$bin/initdb" -D "$work/data" -A trust -U postgres >/dev/null
$run "$bin/pg_ctl" -D "$work/data" -o "-p $port -k $work -c listen_addresses=127.0.0.1" -w -l "$work/pg.log" start >/dev/null
$run "$bin/createdb" -h 127.0.0.1 -p "$port" -U postgres azbuka_test

cd "$root/backend"
TEST_DATABASE_URL="postgresql://postgres@127.0.0.1:$port/azbuka_test" ALLOW_WIPE_TEST_DB=1 python3 -m pytest "$@"
