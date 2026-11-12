# Azbuka task checklist

Generated from `.taskmaster/tasks/tasks.json` (the source of truth). Never edit by hand; regenerate with
`python .taskmaster/render_tasks_md.py`.

**Progress: 11/30 tasks done.**

## Phase 0 - Foundation

- [ ] **1. Create local dev and test databases** **[HUMAN]**  
  A disposable local test database and a dev database exist, so the backend suite and API can run on this Windows PC.  
  _Test:_ PGPASSWORD=azbuka_test "/c/Program Files/PostgreSQL/17/bin/psql" -h 127.0.0.1 -U azbuka_test -d azbuka_test -tAc 'select 1' prints 1, and the same for -d azbuka_dev.
- [ ] **2. Install dev dependencies and get every test suite green on Windows** _(after 1)_  
  One command runs the jsdom suite, build-in-sync check, course validator and backend pytest suite on this PC, all passing.  
  _Test:_ The AGENTS.md test command exits 0; `sh scripts/test_backend.sh -q` exits 0 in Git Bash with AZBUKA_TEST_DB set.
- [x] **3. Remove one-off patch scripts and archive stale agent prompts**  
  The repo holds only live sources and docs; already-applied patch scripts and old prompt files no longer confuse builders.  
  _Test:_ python tests/check_build_in_sync.py passes; `git grep -n -e patch_m7 -e patch_m8 -e CLAUDE_MAIN_BRANCH_REPAIR -- ':!docs/archive'` prints nothing.
- [ ] **4. Run the API locally as a dev server** _(after 2)_  
  `python .claude/scripts/devserver.py start api` runs the FastAPI app against azbuka_dev so client sync can be built and tested locally.  
  _Test:_ python .claude/scripts/devserver.py start api && curl -fsS http://127.0.0.1:8090/health returns ok JSON; psql on azbuka_dev: select count(*) from course_units = 16; then devserver.py stop api.

## Phase 1 - Client sync

- [x] **5. Device ID and durable local event queue** _(after 2)_  
  Every learner action becomes an append-only event with a UUID in a durable local queue, saved before any network call; the app is unchanged offline and signed out.  
  _Test:_ (cd tests && npm test --silent) && python tests/check_build_in_sync.py; new tests prove: deviceId stable across reloads, rating a card appends one event with a valid id, old saved state without `sync` loads.
- [x] **6. Upload the event queue to the API** _(after 4, 5)_  
  While signed in and online, queued events upload in batches with capped backoff; accepted and duplicate events are marked synced, rejected ones kept with a plain error.  
  _Test:_ (cd tests && npm test --silent) && python tests/check_build_in_sync.py; stubbed-fetch tests cover all five responses; with the api dev server running, a scripted register+upload via the built app logic shows events in azbuka_dev (select count(*) from sync_events or the table backend uses).
- [x] **7. Account screen: register, login, logout, sync status** _(after 6)_  
  A learner can create an account, sign in and out, and see local-only / syncing / synced / queued / error status, last sync time, pending count and a Sync Now button.  
  _Test:_ (cd tests && npm test --silent) && python tests/check_build_in_sync.py; jsdom tests with stubbed fetch: register → signed-in view with email; logout → local-only; pending count equals queue length. MANUAL CHECK: mobile-ui-check checklist at 390x844.
- [x] **8. Restore and merge progress after login** _(after 6, 7)_  
  After login the app pulls the account's progress and merges it with local progress without ever losing offline work; a second browser restores the same progress.  
  _Test:_ See subtasks.
  - [~] 8.1 Pure merge function with tests
  - [~] 8.2 First-login merge step and bootstrap call
  - [x] 8.3 Periodic re-bootstrap and cursor handling
  - [x] 8.4 Pull and apply remote events idempotently
  - [x] 8.5 Explicit backfill of this browser's existing progress
  - [x] 8.6 Different-account guard and merge safety tests
- [x] **9. Client sync end-to-end check against the local API** _(after 7, 8)_  
  A script proves the PRD sync criteria locally: offline progress survives refresh, the queue drains with no duplicates when the API returns, and a second browser profile restores the same progress.  
  _Test:_ python .claude/scripts/devserver.py start api && (cd tests && npm run test:e2e --silent) exits 0. MANUAL CHECK: two real browser profiles on the PC show the same progress after login.

## Phase 2 - Deploy

- [x] **10. Verify DNS and SSH, inspect the VPS read-only**  
  azbuka.andel-vps.space resolves to the VPS through the wildcard record, SSH to root@2.25.108.3 works with the owner's key, and the server's state is recorded before anything is changed.  
  _Test:_ nslookup azbuka.andel-vps.space shows 2.25.108.3; `ssh -o BatchMode=yes root@2.25.108.3 true` exits 0; the task log holds the inspection summary.
- [x] **11. Server deploy script and static build output** _(after 2, 6)_  
  One idempotent script on the server pulls main, builds the static app into dist/ and (re)starts the Compose stack, waiting for it to be healthy.  
  _Test:_ `python scripts/build_dist.py` leaves exactly the 4 files in dist/; `python -m http.server -d dist 4174` + curl -fsS http://127.0.0.1:4174/ returns the app; `sh -n deploy/deploy.sh` passes (shellcheck -S warning if installed).
- [x] **12. Reverse-proxy site block for azbuka.andel-vps.space** _(after 10)_  
  A committed site config serves dist/ at https://azbuka.andel-vps.space/ and proxies /api/ to the API on 127.0.0.1:8090 with the /api prefix stripped.  
  _Test:_ The file exists and greps show server_name, proxy_pass http://127.0.0.1:8090/, the acme-challenge location and the 80→443 redirect. `nginx -t` runs on the server in task 15.
  - [x] 12.1 Replace nginx site config with Traefik labels and a static web container
- [x] **13. Security review before first deploy** _(after 11, 12)_  
  Run the security-review skill over secrets, auth, input, web and dependencies and file every finding as a fix task.  
  _Test:_ Every finding is a task (tasks.py status lists them); no open high/critical finding before task 14 runs.
- [x] **14. Put the Compose stack on the VPS** _(after 9, 10, 11, 12, 13)_  
  The repo lives in /opt/azbuka on the VPS with a private .env, and `deploy/deploy.sh` brings up db, migrate and api healthy, with 16 course units in the database.  
  _Test:_ See subtasks.
  - [x] 14.1 Create the server .env
  - [x] 14.2 Clone to /opt/azbuka and run the first deploy
- [ ] **15. Install the site block, get the HTTPS certificate, smoke test** _(after 14)_  
  https://azbuka.andel-vps.space/ serves the app and /api/health answers over HTTPS with a valid certificate; plain HTTP redirects, CORS allows only the app origin, and ports 5432 and 8090 are closed from outside.  
  _Test:_ sh scripts/smoke_prod.sh exits 0; `ssh root@2.25.108.3 'nginx -t && certbot renew --dry-run'` exits 0. MANUAL CHECK: open the site on a phone, padlock shown, the mic prompt appears on a voice exercise.
  - [ ] 15.1 Traefik route, certificate and smoke test (replaces the nginx/certbot steps)

## Phase 3 - Backups & ops

- [ ] **16. Choose off-server backup storage** **[HUMAN]** _(after 14)_  
  The owner picks where the encrypted nightly database dump goes off the VPS and creates its credentials.  
  _Test:_ The task log names the storage choice and where its credentials live (names only).
- [ ] **17. Ship an encrypted off-server copy of the nightly dump** _(after 16)_  
  Each night's database dump ends up encrypted outside the VPS with 14-30 days of retention.  
  _Test:_ After one manual run of deploy/backup.sh, the off-server location lists today's dump; decrypting it with the owner's key yields a file `pg_restore --list` accepts; `crontab -l` on the server shows the entry once.
- [ ] **18. Write the operations runbook** _(after 15)_  
  docs/OPERATIONS.md holds exact commands for deploy, rollback, logs, backups, restore, secret rotation and schema migrations on the kit.  
  _Test:_ File exists; every script it names exists in the repo; markdown links resolve.
- [ ] **19. Test a restore into a scratch database** _(after 17, 18)_  
  Last night's backup restores into a scratch database inside the db container and its row counts match production.  
  _Test:_ Counts match table by table; the log holds both lists; azbuka_restore_test no longer exists.

## Phase 4 - Acceptance

- [ ] **20. Automated production acceptance script** _(after 15)_  
  One script proves the PRD's server criteria on the live app: auth, idempotency, isolation, CORS, HTTPS, closed 5432.  
  _Test:_ The script exits 0 against production and prints one PASS line per PRD criterion.
- [ ] **21. Regression check: course, build and old saved data** _(after 9)_  
  Units 1-16 render, every play button speaks its own card, and an old saved state from before sync still loads.  
  _Test:_ The AGENTS.md test command exits 0 with the new tests.
- [ ] **22. Real-phone acceptance pass** **[HUMAN]** _(after 20)_  
  The owner confirms on a real phone: lesson offline and signed out, refresh keeps progress, queue drains when back online, second device restores.  
  _Test:_ All four steps reported pass in the task log.
- [ ] **23. Update the plan docs and the parity table** _(after 20, 21, 22)_  
  docs/MASTER_PLAN.md and the README reflect what is live, and each of the 15 original features has a status (built, planned in phase 5, deferred to v2, dropped).  
  _Test:_ git diff shows the doc updates; every parity row has one of the four statuses.

## Phase 5 - Learner features

- [ ] **24. Word of the Day with a daily reminder popup** _(after 23)_  
  Each day the app shows one Word of the Day picked from due or weak items, with a dismissible popup on first open that day.  
  _Test:_ (cd tests && npm test --silent) && python tests/check_build_in_sync.py; jsdom tests: same word all day, new word next day, popup shows once per day. MANUAL CHECK: mobile-ui-check.
- [ ] **25. Quiz: English to Russian multiple choice** _(after 23)_  
  Learners can take quizzes in the English → Russian direction with the same adaptive picker and XP rules.  
  _Test:_ (cd tests && npm test --silent) && python tests/check_build_in_sync.py; jsdom tests: EN→RU question shows English prompt and Russian choices; answering right twice gives XP once per key.
- [ ] **26. Quiz: fill-in-the-blank and typed answer** _(after 25)_  
  Learners can fill a blank in a pattern sentence and type a Russian answer, with tolerant checking.  
  _Test:_ (cd tests && npm test --silent) && python tests/check_build_in_sync.py; jsdom tests for the normaliser (ё/е, case, punctuation) and one blank question end to end.
- [ ] **27. Word bank: search, tags and custom words** _(after 23)_  
  Learners can search all words, filter by tag (unit/topic), and add their own words that join review and sync.  
  _Test:_ (cd tests && npm test --silent) && python tests/check_build_in_sync.py; jsdom tests: search finds by English and Cyrillic; custom word appears in review and in the event queue. MANUAL CHECK: mobile-ui-check.
- [ ] **28. Weekly leaderboard (opt-in, server-side XP)** _(after 23)_  
  Signed-in learners can opt in with a display name and see this week's top XP from the server's xp_ledger.  
  _Test:_ See subtasks.
  - [ ] 28.1 Leaderboard migration and endpoint
  - [ ] 28.2 Leaderboard opt-in setting and view
- [ ] **29. Tutor personas** _(after 23)_  
  Learners pick one of two tutor personas that changes encouragement phrasing and the preferred speech voice.  
  _Test:_ (cd tests && npm test --silent) && python tests/check_build_in_sync.py; jsdom test: switching persona changes a feedback string and persists across reload.
- [ ] **30. Deploy the learner features and smoke test** _(after 24, 25, 26, 27, 28, 29)_  
  Phase 5 is live on the VPS and still passes the production checks.  
  _Test:_ deploy.sh exits 0 and both scripts exit 0 after the deploy. MANUAL CHECK: Word of the Day and a typed quiz on a real phone.
