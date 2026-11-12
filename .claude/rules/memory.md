# Azbuka memory (short-term project state)

<!-- Rules files without a `paths:` header load at the start of every Claude Code session, so nothing needs to
     import this. HTML comments like this one are stripped before loading and cost no context. -->

**Why this file exists:** so a new session knows where things stand without re-reading the PRD, task logs or
old chats. Open `.taskmaster/` only for the task you're working on.

**Who edits it:** the phase-runner, **once at the end of each run**, in its own commit. The lead also edits it
after resolving an escalation or when the human gives a fact worth keeping. Everyone else only reads it.
Never update it per task.

**Size rules (the point of the file):**
- Max ~80 lines. Each section has a cap; when it's full, delete the least useful line before adding one.
- Replace, don't append: "Now" is overwritten every time; outdated lines are deleted, not struck through.
- Only add to "Learned" what would save a future session 5+ minutes or prevent a repeat failure.
- Details belong in `tasks.py log <id>`; this file holds one-line pointers ("see 7.3 log").

---

## Now (overwrite each time, max 6 lines)
- 2026-11-12: Phase 1 built and pushed (tasks 5-9; Linux-verified: 41 jsdom, 5-step e2e vs real API, 26 backend).
- Phase 0 open: tasks 1, 2, 4 need the owner's Windows PC (see manual-checks.md); Phase 1 started on Linux evidence.
- Next: owner does task 1 + Windows checks, then `/run-phase 2` (deploy); needs SSH to the VPS from the PC.
- In progress: none.
- Manual checks waiting: Windows (1/2/4), mobile account screen (7), two real browsers (8/9).

## Facts (stable, max 15 lines)
- Dev machine: Windows 11, Git Bash; `python` (3.12), no `python3`. Node and PostgreSQL 17 installed locally (server on :5432). No Docker.
- Backend tests on Windows: `TEST_DATABASE_URL` to a disposable local db (`AZBUKA_TEST_DB`, set up in task 2); `scripts/test_backend.sh` is Linux-only.
- Hosting: Docker Compose in `/opt/azbuka` on the VPS (`ssh root@2.25.108.3`), Traefik (docker) owns 80/443 and does HTTPS; port 8090 is TAKEN by another site, Azbuka API uses host port 8091. Public URL `https://azbuka.andel-vps.space`, API under `/api/`. Server: Ubuntu 24.04, Docker 29, Compose 5.4, 31G free. Wildcard DNS already points there. Other apps share the server.
- Single owner/operator; learners are self-taught adults on phones. No analytics, no paid services in v1.
- Product docs: `docs/MASTER_PLAN.md` (status), `AZBUKA_BACKEND_UNFINISHED_WORK.md`, `backend/README.md` (API, cursor limitation).

## Decisions since the PRD (max 8 lines, newest first; full text in the PRD decision log)
- 2026-11-12: Deploy with Docker Compose (not VPS-kit git push); domain `azbuka.andel-vps.space`, API at `/api/`.
- 2026-11-12: Built with master-harness v1.3.1: lead (Opus) → phase-runner (Sonnet) → builders
  haiku → sonnet → opus. Manual checks batched per phase.

## Learned / gotchas (max 15 lines, newest first)
- (none yet)

## Model routing record (update counts at each close-out)
| Tier | Done first try | Escalated up | Notes |
|---|---|---|---|
| haiku | 0 | 0 | |
| sonnet | 0 | 0 | |
| opus | 0 | 0 | |
<!-- If one tier escalates on 3 tasks in a row, the phase-runner escalates to the lead, who may raise that tier's
     starting complexity in .claude/skills/next-task/SKILL.md. If haiku passes everything, give it complexity 4 too. -->

## Open questions for the human (max 5; delete once answered)
- Off-server backup storage for the encrypted nightly dump: where, and who creates the credentials?
- Monthly cost limit for hosted pronunciation scoring / AI conversation (v2; not blocking v1).
