---
paths:
  - "**/*.sh"
  - "deploy/**"
---

# Script rules

- `db/apply_migrations.sh` and `scripts/test_backend.sh` are POSIX `sh` (they run in Alpine and Debian):
  keep `#!/bin/sh` + `set -eu`, no bashisms. New bash scripts: `#!/usr/bin/env bash` + `set -euo pipefail`.
- Quote every variable, idempotent (safe to run twice), print what each step does, fail with a clear message.
  `shellcheck -S warning` clean if shellcheck is installed.
- Header comment: what it does, how to run it, what it needs. Keep it accurate.
- Scripts that run on the server get the reviewer, every change.
- Never put secrets in scripts; generate them on the server into a mode-600 env file.
- Local scripts must also work in Git Bash on Windows (`venv/Scripts` vs `venv/bin`, CRLF, no `sudo`,
  no `/usr/lib/postgresql` assumptions).
