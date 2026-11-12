#!/bin/sh
# Applies db/migrations/*.sql once each (in name order), then re-applies the
# idempotent files in db/repeatable/ on every run. Uses the standard PG*
# environment variables. Safe to run repeatedly.
set -eu

dir="${MIGRATIONS_DIR:-/db}"

psql -v ON_ERROR_STOP=1 -q -c "CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())"

for file in "$dir"/migrations/*.sql; do
  version="$(basename "$file" .sql)"
  applied="$(psql -tA -c "SELECT 1 FROM schema_migrations WHERE version = '$version'")"
  if [ "$applied" = "1" ]; then
    echo "skip   $version"
    continue
  fi
  echo "apply  $version"
  psql -v ON_ERROR_STOP=1 -q -f "$file"
done

for file in "$dir"/repeatable/*.sql; do
  [ -e "$file" ] || continue
  echo "repeat $(basename "$file")"
  psql -v ON_ERROR_STOP=1 -q -f "$file"
done

echo "migrations complete"
