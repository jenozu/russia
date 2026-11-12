---
paths:
  - "backend/**/*.py"
---

# Python + FastAPI rules

- The whole API is one module, `backend/app/main.py` (routes, Pydantic models, SQL). Keep that shape; split
  only if a task says so.
- DB access is raw **asyncpg** (`main.pool`), not SQLAlchemy: `$1, $2` bound parameters only, never f-string SQL.
  Each sync event runs in its own savepoint; keep that when touching `/v1/sync/events`.
- Use the venv: `backend/venv/Scripts/python.exe` on Windows, `backend/venv/bin/python` on Linux. Install with
  `pip install -q -r requirements-dev.txt`; add deps only when a task names them.
- Type hints on new functions. Pydantic models for every request and response body.
- Every endpoint touching user data depends on the current-user dependency and filters by user id; another
  user's row returns 404, not 403.
- Config only from env vars (see `.env.example`). Never default a secret to an empty string.
- XP is decided server-side (`xp_ledger`, caps); never trust an amount from the client beyond the caps.
- Schema changes go through a new numbered file in `db/migrations/` (`db-migration` skill).
- `logging`, not `print`. Never log tokens, passwords, emails or full request bodies.
- Tests: pytest + httpx in `backend/tests/`, against a disposable database (`TEST_DATABASE_URL`,
  `ALLOW_WIPE_TEST_DB=1`). Run with `-q`. Add a test for every new endpoint and every auth/XP rule.
