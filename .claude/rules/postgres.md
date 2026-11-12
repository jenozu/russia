---
paths:
  - "db/**"
  - "**/*.sql"
---

# Postgres rules

- Schema changes only as a new numbered file `db/migrations/NNN_<what>.sql` (`db-migration` skill). Never edit
  an applied migration. `db/repeatable/` files must stay idempotent; `course_units.sql` is generated.
- Dev and test databases are separate; tests never touch dev data. Connection strings come from env vars.
- Add indexes for columns used in WHERE/JOIN/ORDER BY on tables that grow (events, xp_ledger, sessions).
- Bound parameters only. No string-built SQL from user input.
- Destructive statements (`DROP`, `TRUNCATE`, `DELETE` without WHERE) only against local dev/test databases.
- Timestamps as `timestamptz`.
