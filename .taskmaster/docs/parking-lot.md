# Parking lot

Ideas that are not part of the current plan. One dated line each. Review at the end of each phase:
promote to a task (`tasks.py add` or the `adapt` skill), defer, or delete on purpose.

- 2026-11-12: Outside uptime monitor + container restart alerts (MASTER_PLAN Phase 4); not a PRD success criterion, add if the kit lacks alerts.
- 2026-11-12 (security review, low): pin base images by digest (python:3.12-slim, postgres:16-alpine, nginx:1.27-alpine) and add `read_only: true` + `cap_drop: [ALL]` to api/web; CSP still needs 'unsafe-inline' because the app is one inline file (revisit if the app is split); deploy.sh runs `git pull` as root, so anyone who can push to main can run code on the VPS: keep GitHub 2FA on and consider signed commits.
