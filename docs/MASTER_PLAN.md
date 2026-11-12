# Azbuka Master Plan: from prototype to live product

Written Nov 11, 2026; status updated Nov 12, 2026. Companion to `AZBUKA_BACKEND_UNFINISHED_WORK.md` (the detailed checklist) and `A1_RUSSIAN_VOICE_TUTOR_ROADMAP.md` (the full-product roadmap).

## Where things stand

The course is finished and the backend has been hardened and tested locally. The app does not talk to the backend yet, and nothing has been deployed.

| Area | Status | Evidence |
| --- | --- | --- |
| A1 course, Units 1 to 16 | Done | Validator passes; Units 2 to 16 render in the app |
| Offline app, adaptive review, XP, badges | Done (Phase 0) | 12 headless tests in `tests/` |
| FastAPI backend | Hardened (Phase 1) | 26 tests against a throwaway PostgreSQL |
| Postgres schema, migrations, Docker Compose | Fixed, not yet run in Docker | Compose network fixed; image build and `docker compose up` still to verify on the VPS |
| Client sync adapter and account UI | Not started (Phase 2) | No device ID, queue or login screen in the app |
| VPS deployment, HTTPS, backups | Not started (Phases 3 and 4) | |

### Bugs found in the original app (all fixed in Phase 0)

1. Replay spoke the previous word, not the card on screen.
2. The 15 play buttons on sentence patterns and conversation lines did nothing.
3. Alphabet cards spoke a bare capital letter, which many voices read badly.
4. Unit listening exercises had no audio and printed the answer text instead.
5. Rating a card skipped the next one, so cards showed as 1, 3, 5, 7.
6. Checkpoint questions highlighted the right answer after a wrong tap.
7. XP could be farmed by tapping Again repeatedly.
8. A JSON file downloaded every time the page loaded.
9. The counter was hardcoded to "/20".
10. A speech error could overwrite the status line when audio was replayed.
11. Retrying a quiz question allowed the same question to be answered again for more XP.

### Gaps found in the backend and deploy files (all fixed in Phase 1)

- Compose: `internal: true` on the only network stopped Docker publishing port 8090 to the host.
- Sync: one database error inside a batch aborted the whole transaction.
- XP: any `xp-awarded` event up to 100 was added with no cap or de-duplication.
- Secrets and abuse: `TOKEN_PEPPER` defaulted to empty; no rate limiting on login or register.
- Housekeeping: placeholder course hash in the migration; `.gitignore` did not ignore `.env`.

## Parity with the original a1-voice-tutor plan

The Russia repo matches the original on content approach and covers roughly half of its 15 features; it diverged on architecture. The original (`jenozu/a1-voice-tutor`) is a Polish Streamlit app with CSV storage. Its PRD lists 15 features, and its own todo has Phases 4 to 6 unchecked, so the original was never finished either. It already contains the Russian Stage 1 file (100 items, groups, pronunciation guides), which is where this repo's content began.

| # | Original feature (PRD) | Russia repo today | Gap |
| --- | --- | --- | --- |
| 4.1 | Word bank, 200+ words, search, custom entries | 100 items by day; no search, tags or custom words | Medium |
| 4.2 | Quiz: multiple choice, fill-in-the-blank, open-ended | Russian to English multiple choice only | Large |
| 4.3 | Conversation mode by theme | Scripted dialogue per unit, typed or spoken; not AI-driven | Medium |
| 4.4 | Voice input and text-to-speech | Browser speech in and out | Done (Phase 0 fixes) |
| 4.5 | Spaced repetition | Fixed intervals (10 min, 1, 3, 7 days) and adaptive picking | Small |
| 4.6 | Pronunciation scoring (Whisper or wav2vec2) | Record and transcribe, then compare text; no acoustic score | Large |
| 4.7 | Story mode with comprehension | One story plus a story per unit | Small |
| 4.8 | Grammar and culture tips | Three context tips plus a grammar card per unit | Small |
| 4.9 | Thematic study paths | 16 units | Done |
| 4.10 | XP, badges, streaks, weekly leaderboard | XP, 3 badges, streak; no leaderboard | Medium |
| 4.11 | Goals and reminders | Daily and weekly goals; no reminders | Medium |
| 4.12 | SMS reminders (Twilio) | None | Optional |
| 4.13 | Word of the Day | None | Small |
| 4.14 | Ambient mode | None | Large |
| 4.15 | Custom tutor voices and personas | Voice picker only; no personas | Medium |
| 7 | Multi-device sync (listed as future) | Backend hardened, not connected to the app | Phase 2 |

- The original already planned multi-device sync as a future item, so the backend direction follows your plan.
- The architecture changed from Streamlit with CSV files to a static web app with a FastAPI and Postgres backend. The old Python modules (`srs_engine`, `xp_badges`, `goals`, `leaderboard`) are the best reference for the missing features.
- The original repo needs cleanup too: a committed `.streamlit/secrets.toml` (placeholders only; no real keys found in history), committed `__pycache__` files and logs, and a Polish-first name for what is now a Russian product.

## Phases 0 to 2: stabilize, harden, connect

Every fix goes into the source files (`build_standalone.py`, the curriculum JSON, `backend/`), never only into the generated `standalone.html`.

### Phase 0: stabilize the repo and app (done, merged to `main`)

- [x] Replace the `.gitignore` rules so `.env`, caches, virtual environments and database dumps are ignored.
- [x] Add a headless test script (`tests/app.test.js`) and a build-in-sync check (`tests/check_build_in_sync.py`).
- [x] Replay always speaks the card on screen.
- [x] Pattern and conversation play buttons work (one delegated listener).
- [x] Alphabet cards speak the example word.
- [x] Units have play buttons for vocabulary, patterns, dialogue turns and the story; listening exercises play audio and no longer print the answer.
- [x] Rating a card no longer skips the next one; the counter shows item-of-day.
- [x] Checkpoints mark only the wrong choice and keep the right one hidden.
- [x] XP rewards use stable per-item, per-day keys.
- [x] Removed the stray block that downloaded a JSON file on page load.
- [x] "Interrupted" speech errors are ignored.
- [x] Validator fails when any unit lacks lesson content (already fixed upstream).
- [x] Exit test: tests pass and all units 2 to 16 render.

### Phase 1: harden the backend (done, merged to `main`)

- [x] Compose: the API joins a second network so `127.0.0.1:8090` publishes; Postgres stays private with no published port.
- [x] Sync: each event runs in its own savepoint.
- [x] XP: per-prefix caps, one payout per reward key (`xp_ledger`), daily cap.
- [x] The API refuses to start without `TOKEN_PEPPER` and `APP_ORIGINS`.
- [x] Rate limits on register, login and sync (in the app; also add them at the reverse proxy).
- [x] Payload size cap; real `progress_version`.
- [x] Login takes the same time for unknown emails.
- [x] Course hash generated into `db/repeatable/course_units.sql`.
- [x] 26 backend tests against a throwaway PostgreSQL (`scripts/test_backend.sh`).
- [ ] Exit test: the whole stack starts with `docker compose up` (to verify on the VPS; this workspace has no Docker).

### Phase 2: build the client sync adapter and account screen (built; Windows and eyes-on checks pending)

This is the largest piece of missing work. It lives in `build_standalone.py` and keeps `localStorage["azbuka-standalone"]` as the instant save.

1. Create a stable `deviceId` once per browser and store it under a `sync` key.
2. Turn each learner action (review rated, checkpoint answered, unit completed) into an append-only event with its own UUID, and write it to a durable queue. Event identifiers must be strings of letters, digits and `._:@-`; XP events carry a reward key and an amount within the server caps.
3. Save locally first, then try the network; the app must stay fully usable offline and signed out.
4. Upload in batches while signed in and online; retry with capped backoff; reuse the same event IDs.
5. Mark accepted and duplicate events as synced; keep rejected ones and show a plain error.
6. After login, call bootstrap, then `changes` with the saved cursor, and merge without overwriting newer offline activity. Re-run bootstrap periodically (see the known cursor limitation in `backend/README.md`).
7. Add the screen: register, login, logout, account name, status (local only, syncing, synced, queued, error), last sync time, pending count, Sync Now, export and import.
8. First login: offer a clear "merge this browser's progress into my account" step; never replace local progress with an empty account.
9. Exit test: stop the API, complete a lesson, refresh and see progress; restart the API and watch the queue drain; open a second browser profile and see the same progress.

Status (2026-11-12): items 1 to 8 are built in `scripts/build_standalone.py`; item 9 is covered by `tests/sync_e2e.test.js` (`npm run test:e2e` in `tests/`, API must be running). Verified on Linux: 41 jsdom tests and the 5-step end-to-end script against the real API. Still open: a phone-size look at the account screen and two real browser profiles (see `.taskmaster/docs/manual-checks.md`).

## Phases 3 to 5: deploy, protect, prove

### Phase 3: deploy to the VPS

- [ ] Inspect the server first: OS, Docker, free disk and memory, open ports, existing Nginx or Caddy sites, firewall. Do not touch other apps.
- [ ] Put the repo in `/opt/azbuka` and create `.env` there (copy `.env.example`) with mode `600`; never paste secrets into chat.
- [ ] Generate separate strong `POSTGRES_PASSWORD` and `TOKEN_PEPPER` values on the server.
- [ ] Set `DATABASE_URL` to use the host name `db`, and `APP_ORIGINS` to the exact address where the static app is hosted.
- [ ] Run `docker compose config`, then `docker compose up -d --build`.
- [ ] Confirm `db` is healthy, `migrate` exits 0, `api` is healthy, and `course_units` has 16 rows.
- [ ] Point an API subdomain at the VPS; set up Nginx or Caddy with HTTPS and rate limits.
- [ ] Serve the static app over HTTPS from the VPS so microphone recording works.
- [ ] Exit test: the public `/health` URL answers over HTTPS, port 5432 is closed from outside, and plain HTTP to the API is refused or redirected.

### Phase 4: backups and operations

- [ ] Daily `pg_dump` with 14 to 30 days of retention.
- [ ] An encrypted copy sent off the VPS (object storage or another machine).
- [ ] A restore test into a separate database, documented with the exact commands.
- [ ] Health check from an outside monitor; container restart alerts.
- [ ] Written procedures for rotating secrets and for applying future schema migrations (add a numbered file to `db/migrations/`; the runner applies each once).
- [ ] Exit test: delete a scratch database, restore last night's backup, and see the same row counts.

### Phase 5: acceptance testing

| Test | Pass condition |
| --- | --- |
| Local-first | API stopped, lesson completed, page refreshed, progress still there |
| Auth | Register, login, `/v1/me` works, logout, same token now returns 401 |
| Sync | Completed unit shows up as events in Postgres |
| Idempotency | Same event sent twice: second is a duplicate; XP and attempts do not double |
| Second device | New browser profile logs in and restores progress |
| Offline queue | Offline activity uploads after reconnect |
| Isolation | Account B cannot read account A's progress; bad tokens return 401 |
| Security | No public 5432; HTTPS only; CORS limited to the app origin; no secrets in Git, front-end files or logs |
| Regression | Validator passes; app rebuilds; `node --check` passes; Units 1 to 16 render; old local data still loads |

## Phases 6 and 7: close the gap to the original vision

Once sync works, the missing features can be added one at a time. Each reads and writes through the same event queue, so they sync for free. Order is by learner value per unit of work.

| Order | Feature | Why this order | Notes |
| --- | --- | --- | --- |
| 1 | Word of the Day and daily reminder popup | Cheap; builds the habit loop | Pick from due or weak items; no server needed |
| 2 | More quiz types: English to Russian, fill-in-the-blank, typed answer | Retention depends on producing Russian, not only recognizing it | Reuse the adaptive picker |
| 3 | Word bank search, tags, custom words | Needed for the original's 200-word goal | Expand beyond 100 items only after Stage 1 is solid |
| 4 | Weekly leaderboard | Needs accounts, which Phase 2 provides | Server-side XP only; opt-in display name |
| 5 | Tutor personas and voice choice | Original names three tutors | Affects phrasing and chosen voice; small content task |
| 6 | Real pronunciation scoring | Biggest quality jump for a voice tutor | Needs an audio model; hosted scoring is the working preference |
| 7 | AI conversation mode | Original promises open role-play | Needs an LLM backend, cost control and safety limits |
| 8 | Ambient mode (hands-free audio) | Nice for commuting | Builds on playable audio everywhere |
| 9 | SMS reminders (Twilio) | Optional in the original | Needs phone consent, validation and cost caps; web push is likely a better fit |

- **Pronunciation scoring** is the main technical choice: send audio to a hosted model through the API (accurate, costs money, needs privacy wording) or run a small model in the browser (private, harder, lower accuracy).
- **AI conversation** should run through the backend, never from the browser, so keys stay secret and usage can be capped per account.
- **Stage 2 content** (beyond 100 items) should wait until Stage 1 retention is measured with real learners.

## Decisions and risks

### Decisions made (Nov 11 to 12)

1. Push access to `jenozu/russia`: granted.
2. VPS access: owner-run SSH from their own PC; the VPS hosts the API and the static app.
3. Which repo is the product: this one, for now. The Polish Streamlit repo stays as reference.
4. Pronunciation approach: hosted, to be confirmed when Phase 6 starts; set a monthly cost limit then.

### Still open

- The API domain (for example `api.<your domain>`) for HTTPS and CORS.
- The monthly cost limit for hosted pronunciation scoring and AI conversation.

### Risks

| Risk | Effect | Mitigation |
| --- | --- | --- |
| Fixes made only in `standalone.html` | Lost on next build | Edit sources only; `tests/check_build_in_sync.py` fails if the output is stale |
| Client XP farming reaches the server | Fake leaderboard and rewards | Server-side XP rules (done in Phase 1) |
| Merge overwrites offline progress | Learner loses days of work | Event queue plus merge tests in Phase 2 |
| Backups never restored | Data loss on first failure | Restore test is part of Phase 4's exit |
| Secrets committed | Account takeover | `.gitignore` covers `.env`; secret scan before each push |
| Browser speech varies by device | Audio quality differs; some devices have no Russian voice | Show the voice in use; offer a fallback message |
| Sync cursor can miss a very recent event when syncs overlap | A device may see an event late | Re-run bootstrap after login and periodically; sequence-based cursor later |

### Definition of done

- [x] Course Units 1 to 16 are preserved and validated, and every unit has lesson content.
- [x] All 11 confirmed bugs are fixed and covered by an automated check.
- [ ] Backend and app tests pass (backend and Phase 0 app tests pass; Phase 2 tests still to write).
- [ ] A learner can register, log in, log out, and migrate existing local progress without loss.
- [ ] New progress saves locally first, then syncs as idempotent events; offline events upload on reconnect.
- [ ] A second browser restores the same progress; duplicate retries never double-count.
- [ ] PostgreSQL is private on the VPS and the API answers only over HTTPS.
- [ ] A backup exists off the server and a restore has been tested.
- [ ] Everything is committed and pushed with no secrets.
- [ ] The parity table above has an agreed status for each of the 15 original features (built, deferred, or dropped).
