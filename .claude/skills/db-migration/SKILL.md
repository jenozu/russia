---
name: db-migration
description: Create, review and test a database migration safely. Use whenever a task changes a data model, a table or a column (plain numbered SQL files in db/migrations/).
---

# Database migration procedure

## Always
1. **Change the model first**, then generate the migration. New columns on tables with data: nullable or with a
   default, so the upgrade works on existing rows. Keep old columns that existing rows still use.
2. **Read the generated migration.** Autogenerate gets these wrong; fix by hand:
   - renames detected as drop + add (loses data) → use a real rename;
   - NOT NULL added to a populated table → default or backfill step first;
   - tables owned by something else (raw SQL schema files, another service) must not appear.
   - The down/rollback must really undo the up.
3. **Round trip on a dev database that has data:** up → down → up. Then the tool's "no pending changes" check.
4. **Run the test suite** against the test database.
5. Commit the migration together with the model change. A destructive migration (drops, type changes) also gets
   `review: true` on its task and a backup step in the deploy instructions.

## This project: plain SQL migrations
- New file `db/migrations/NNN_<what>.sql` (next number), wrapped in `BEGIN; ... COMMIT;`. No down files: write
  the reverse SQL in the task log, and test it by hand on a scratch db for anything destructive.
- `db/apply_migrations.sh` applies each file once (tracked in `schema_migrations`), then re-runs `db/repeatable/`.
  Locally with psql env vars: `PGHOST=127.0.0.1 PGDATABASE=<scratch db> PGUSER=postgres MIGRATIONS_DIR=db sh db/apply_migrations.sh`; run it twice (second run must only print `skip`).
- After course content changes: `python scripts/generate_course_seed.py` regenerates `db/repeatable/course_units.sql`.
- Backend tests build the schema from these files, so the pytest suite is the round-trip check.
