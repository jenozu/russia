# Azbuka (Russian A1 Voice Tutor) - PRD

Adapted from the original Polish A1 Voice Tutor PRD v2.0 (`jenozu/a1-voice-tutor`, `lang-prd-updated.md`).
Companion docs: `docs/MASTER_PLAN.md` (status and phases), `AZBUKA_BACKEND_UNFINISHED_WORK.md` (backend checklist).

## Goal
Adult A0-A1 learners of Russian struggle to retain vocabulary, pronounce accurately and practise speaking, and
most free apps have weak voice features and don't adapt to what the learner actually knows. Azbuka is a
local-first web app with a 16-unit A1 course, spoken audio on every phrase, adaptive review, and optional
account sync across devices. "Solved" means a learner can finish the A1 course, speak and hear Russian on every
screen, keep their progress on any device, and the app keeps working with no internet and no account.

## Users
Self-taught adults and expats (age 16-45) learning practical spoken Russian, often on a phone, daily for
5-20 minutes, starting from zero Cyrillic. Single owner/operator (Andel) hosts it on a personal VPS.

## Capabilities (v1)
Status: [x] built, [ ] to do.
1. [x] 16-unit A1 course (alphabet, vocabulary, patterns, dialogues, story, listening, checkpoint per unit).
2. [x] Spoken audio (browser speech synthesis) on every word, sentence, dialogue turn and listening exercise.
3. [x] Adaptive review: rate cards Again/Hard/Good/Easy, fixed intervals (10 min, 1, 3, 7 days), weak items resurface.
4. [x] Quizzes (Russian to English multiple choice) and unit checkpoints with instant feedback.
5. [x] Voice input: record, transcribe in the browser, compare to the target phrase.
6. [x] XP, streak, daily and weekly goals, badges. XP cannot be farmed.
7. [x] Works fully offline and signed out; progress saved in the browser first.
8. [x] Backend API: register, login, logout, idempotent event sync, server-side XP rules (tested).
9. [ ] Client sync: device ID, durable event queue, account screen, merge of existing local progress, second-device restore.
10. [ ] Deployed on the VPS over HTTPS (API and static app), PostgreSQL private, with daily off-server backups and a tested restore.
11. [ ] Word of the Day with daily reminder popup.
12. [ ] More quiz types: English to Russian, fill-in-the-blank, typed answer.
13. [ ] Word bank: search, tags, custom words.
14. [ ] Weekly leaderboard (opt-in display name, server-side XP only).
15. [ ] Tutor personas (original: "Tutor Magda", "Coach Piotr" equivalents).

## Non-goals (v1)
- No Streamlit or Python front end; the app stays a static web app plus API.
- No pronunciation scoring with an audio model, AI free-conversation mode, ambient mode, or SMS reminders in v1
  (candidates for v2; see Later).
- No content beyond A1 (no Stage 2 vocabulary until Stage 1 retention is measured).
- No social features beyond the opt-in weekly leaderboard; no ads, no payments.
- No third-party analytics or tracking.
- No managed cloud services; everything runs on the owner's VPS.

## Success criteria
- Units 1-16 all render, every play button speaks the phrase on the card it sits on, and the headless suite
  (`tests/`) and backend suite (`scripts/test_backend.sh`) pass.
- With the API stopped, a learner completes a lesson, refreshes, and still sees progress; when the API returns,
  queued events upload with no duplicates and no lost XP.
- Logging in on a second browser restores the same progress; first login never replaces local progress with an empty account.
- Sending the same event twice never double-counts attempts or XP; account B cannot read account A's data.
- Public `/health` answers over HTTPS; port 5432 is closed from outside; CORS allows only the app origin; no secrets in Git.
- A backup exists off the server and a restore into a scratch database reproduces the same row counts.
- Original-PRD goals, tracked as targets not gates: 80% of the first 100 words reach "known" in 4 weeks;
  streaks of 7+ days for most weekly active learners.

## Stack and constraints
- Frontend: single generated file `standalone.html`, built from `scripts/build_standalone.py` and
  `curriculum/russian/a1-course.json`. Never edit the HTML directly; edit the sources and rebuild.
- Storage: `localStorage["azbuka-standalone"]` plus service worker (cache-first; bump the cache name when assets change).
- Backend: FastAPI, asyncpg, argon2, PostgreSQL; numbered migrations in `db/migrations/`, generated seed in `db/repeatable/`.
- Deploy: Docker Compose (`db`, `migrate`, `api`) in `/opt/azbuka` on the owner's VPS. One HTTPS origin,
  `https://azbuka.andel-vps.space`: the host reverse proxy serves the static app and proxies `/api/` to the API on
  `127.0.0.1:8090`; Let's Encrypt certificate for that hostname.
- Tests: jsdom for the app, pytest against a throwaway PostgreSQL for the backend.
- Offline-first; must stay usable signed out. Browser speech varies by device; some have no Russian voice.
- Privacy: no secrets in the repo; `.env` ignored; learner audio is not stored.

## Risks and unknowns
- Docker build and `docker compose up` have never been run (the dev sandbox has no Docker); first run is on the VPS.
- Merge logic could overwrite offline progress; needs explicit tests.
- `/v1/sync/changes` cursor can miss an event when two syncs overlap (documented in `backend/README.md`); re-run bootstrap after login and periodically.
- Browser speech quality differs per device and some have no Russian voice; show the voice in use plus a fallback message.
- Unit IDs `u07-shopping-clothing` and `u08-daily-routine` do not match their titles; IDs are stable keys, do not rename.
- Pronunciation scoring approach (hosted vs in-browser) and its monthly cost are undecided.

## Human-only steps
- Domain decided: `azbuka.andel-vps.space` (app, API under `/api/`); the wildcard `*` A record already points at the VPS, so no DNS step.
- Run Claude Code on the home PC with the SSH key to `root@2.25.108.3`; the agent must inspect the server first and not touch other apps.
- Create `.env` on the server with strong `POSTGRES_PASSWORD` and `TOKEN_PEPPER`; never paste secrets into chat.
- Choose off-server backup storage and its credentials.
- Decide the monthly cost limit before any hosted pronunciation scoring or AI conversation work.

## Later (v2 candidates, not in v1)
Real pronunciation scoring, AI conversation mode, ambient hands-free mode, SMS or web-push reminders,
Stage 2 content (200+ words), branching story dialogues.

## Decision log
- 2026-11-11: Russia repo is the main product; the Polish Streamlit repo stays as reference - owner decision - replaces the Polish app as the plan of record.
- 2026-11-11: Host the API and static app on the owner's VPS with Docker Compose - owner decision - replaces unspecified hosting.
- 2026-11-12: Hosted pronunciation scoring is the working preference, to be confirmed in v2 - owner "not sure" - no decision yet.
- 2026-11-12: Phases 0 (app fixes) and 1 (backend hardening) merged to main - see `docs/MASTER_PLAN.md`.
- 2026-11-12: PRD adopted for build with master-harness; plan of record is `.taskmaster/tasks/tasks.json` (harness phases 0-5 continue MASTER_PLAN Phases 2-7).
- 2026-11-12 (superseded the same day, see below): Deploy through the owner's VPS kit (`ssh vps`, `git push vps main`, app `azbuka`, domain `azbuka.andel-vps.space`, kit-managed PostgreSQL and nightly dumps) instead of hand-run Docker Compose; Compose stays as the local full-stack option - bootstrap assumption, owner to confirm - replaces the 2026-11-11 Compose deploy decision.
- 2026-11-12: Deploy with Docker Compose on the VPS as decided 2026-11-11, not git-push deploys through the VPS kit - owner decision - replaces the bootstrap's VPS-kit assumption.
- 2026-11-12: App at `https://azbuka.andel-vps.space` with the API under `/api/`; wildcard DNS already points at the VPS; the deploy tasks add the proxy site block and HTTPS certificate - owner decision - resolves the open API-domain question.
- 2026-11-12: Restore after login replays server events into local state (newer review wins by occurred_at, answers OR-ed, each XP key once) instead of merging two whole states - idempotent by construction, never overwrites local work, reuses the event log as the single source of truth - replaces the planned pure merge(local, remote) function (tasks 8.1 and 8.2 cancelled, replaced by 8.4-8.6).
