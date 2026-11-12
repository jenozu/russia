# Claude Prompt: Audit, Restore, Fix, Validate, and Merge Azbuka on `main`

You are working on the Azbuka Russian A1 Voice Tutor repository. Perform a complete repair of the canonical `main` branch. Do not assume that the first repository or branch you find is complete.

## Context from the previous audit

A prior read-only audit reported that GitHub `main` stopped at commit `e22e342` (`Build Unit 7 travel course`) and appeared to contain only Units 2–7 in the actual `unitContent`, even though the top-level course metadata listed 16 units. It also reported missing backend, database, Docker, deployment documentation, and sync-adapter files. The audit found the following confirmed app defects:

1. Replay speaks the last globally spoken phrase instead of the word or card currently on screen.
2. Sentence-pattern and conversation-line play buttons are rendered but inactive because their handlers are attached before the buttons exist.
3. Alphabet cards speak bare capital letters, which is unreliable for Ъ, Ь, Ы, and similar letters; they should speak the example word or a reliable pronunciation phrase.
4. Unit listening exercises show Russian text and a play icon but provide no working audio control.
5. Stopping a previous utterance can trigger its error callback and overwrite a successful new playback status with “Audio could not play.”
6. Rating a card moves it in the queue while the cursor still advances, causing items to be skipped.
7. The Stage 1 counter is hardcoded to `/20` instead of reflecting the actual queue.
8. Checkpoint feedback reveals the correct option after a wrong answer, even though the UI says “Try again.”
9. XP can be farmed by repeating the same action because reward idempotency keys include a timestamp.
10. A stray block after `exportState()` downloads a progress JSON file on every page load.
11. Navigation only exposes Units 2–7 even though Units 8–16 are planned or available elsewhere.

Treat these as hypotheses to verify, not as permission to blindly patch. Reproduce each issue first, then fix it at the source layer and regenerate the standalone app.

## Phase 1 — Repository and branch discovery; read-only first

1. Clone or attach the repository specified by the task owner. Confirm the remote URL, current branch, current commit, working-tree state, and all available remote branches and tags.
2. Fetch all remote branches and tags without rewriting history. Inspect commit history, branch tips, pull requests if available, and any commits containing `Unit 8`, `Unit 9`, `Unit 10`, `Unit 11`, `Unit 12`, `Unit 13`, `Unit 14`, `Unit 15`, `Unit 16`, `backend`, `docker`, `migration`, `sync`, or `Hostinger`.
3. Do not assume `main` is complete merely because a separate local or published copy contains later work. Locate the actual source for Units 8–16 and the backend. Check every branch, tag, stash/ref if available, generated artifact, and project export. Preserve provenance for recovered files.
4. Produce an initial report containing:
   - canonical remote and branch;
   - current `main` SHA;
   - where Units 8–16 were found, or a clear statement that they cannot be recovered;
   - where backend/database/Docker files were found, or why they are unavailable;
   - the exact files and commits that will be changed.
5. Do not claim the course is complete from metadata alone. The validator must inspect actual lesson content.

## Phase 2 — Restore the complete A1 course

If Units 8–16 exist in another branch, commit, tag, export, or authoritative working copy, merge them into `main` while preserving Units 2–7 and the existing schema. Do not invent replacement content merely to make the count reach 16.

The final course source must contain real, rendered lesson content for every planned unit, including vocabulary, patterns, activities, guided dialogue, story, listening practice, checkpoint, and cumulative recycling metadata as required by the existing schema. Confirm that navigation exposes Units 2–16 and that the generated app renders each unit.

If the only authoritative copies are outside GitHub, stop before merging and report exactly what access or file transfer is needed. Do not silently substitute a reduced course.

Tighten `scripts/validate_course_content.py` so it fails when a planned unit has missing, empty, placeholder, or non-renderable `unitContent`, even if the metadata array lists that unit. Add explicit required-content rules for Units 8–16 and preserve the cumulative recycling-chain checks. The validator must report the unit ID and missing field clearly.

## Phase 3 — Fix all confirmed app defects at the source

Fix the underlying source files, especially `scripts/build_standalone.py`, curriculum source/schema, and validators. Do not hand-edit only the generated `standalone.html` unless the project’s build architecture explicitly requires it. Regenerate the standalone app after source changes.

### Audio

- Maintain an explicit current-audio/current-utterance identity. Replay must use the visible card, vocabulary item, sentence pattern, dialogue line, or story line—not a stale global last-spoken value.
- Attach event handlers after dynamic content is inserted, or use stable delegated handlers.
- Make sentence-pattern and conversation-line play buttons actually speak the associated Russian text.
- Add working play/listen controls to every Unit listening exercise and dialogue/listening item.
- Make alphabet cards speak their example word or a reliable pronunciation phrase, especially for Ъ, Ь, Ы, and other letters whose bare letter name may be silent or misleading.
- When cancelling an utterance, ignore stale `onerror`/`onend` callbacks from the cancelled utterance. A cancelled old utterance must not overwrite the status of a newer playback.
- Keep graceful fallback behavior when SpeechSynthesis is unavailable.

### Queue, counters, and SRS

- After rating a card, update the queue/cursor consistently so no item is skipped and no item is unintentionally repeated.
- Derive Stage 1 progress from the actual queue/session, not a hardcoded `/20`. Preserve the intended daily goal separately if it is distinct from queue length.
- Preserve LocalStorage compatibility with existing keys and migrate old state safely.
- Make repeated taps on the same review action idempotent for XP and event logging. Reward keys must be stable per logical event/card/action, not timestamp-only. Repeating the same action must not farm XP.

### Checkpoints and answer feedback

- After a wrong checkpoint choice, mark only the selected choice as wrong and show a retry hint. Do not highlight or reveal the correct choice until the learner retries or explicitly requests help.
- Preserve the existing completion threshold and local progress behavior unless tests demonstrate that they are incorrect.

### Export and navigation

- Remove the stray automatic progress-JSON download from page load. Export must happen only when the user explicitly taps an Export/Backup control.
- Ensure all Units 2–16 are reachable through navigation and deep-linked/rendered by the shared data-driven renderer.
- Keep the neo-brutalist candy-pop design and browser-native speech behavior.

## Phase 4 — Backend, database, Docker, and sync

If the missing backend files are recoverable from the authoritative project, restore them. Otherwise implement them from the repository’s existing architecture and documentation, without exposing secrets.

Expected deliverables, if in scope and supported by the recovered project:

- `backend/app/main.py` or the project’s equivalent FastAPI entry point;
- backend requirements and safe `.env.example`;
- PostgreSQL migration under `db/migrations/`;
- `docker-compose.yml` for API plus PostgreSQL;
- backend Dockerfile and `.dockerignore`;
- Hostinger/VPS setup and deployment documentation;
- a client-side sync adapter that is optional and backwards-compatible, with LocalStorage remaining the offline source of truth;
- idempotent push/pull or bootstrap/changes behavior, conflict handling, authentication boundaries, and no private database credentials in browser code.

Do not pretend that a database is connected merely because a schema or API exists. Verify the client adapter’s actual network behavior separately, and keep the app usable when the API is unavailable.

## Phase 5 — Tests and validation

Add or update automated tests for every repaired issue. At minimum, test:

- replay targets the visible/current item;
- sentence, conversation, dialogue, and listening play controls exist and invoke the correct text;
- alphabet example-word audio mapping;
- stale audio cancellation does not overwrite current status;
- queue order after repeated ratings;
- dynamic Stage 1 counter;
- checkpoint wrong-answer feedback does not reveal the answer;
- XP idempotency under repeated identical actions;
- no automatic JSON download on load;
- Units 2–16 appear in navigation;
- every Unit 2–16 has non-empty required content and renders;
- validator rejects an empty unitContent entry;
- build regeneration succeeds;
- generated HTML passes syntax checks.

Run the complete validation sequence from a clean working tree:

```bash
python3 scripts/validate_course_content.py
python3 scripts/build_standalone.py
node --check /path/to/any-extracted-script.js   # or the project’s documented JS check
python3 -m py_compile backend/app/main.py      # if backend exists
# run the project’s full test command as well
```

Run a live browser smoke test for the home screen, Unit 2, Unit 7, Unit 8, Unit 12, Unit 16, audio controls, checkpoint choices, export behavior, and LocalStorage persistence. If browser automation is unavailable, document exactly which checks were run instead.

## Phase 6 — Safe merge to canonical `main`

Before changing history:

1. Make sure all unrelated user changes are preserved.
2. Fetch `origin/main` again immediately before the final merge.
3. Integrate remote changes without force-pushing, resetting, deleting, or rewriting `main`.
4. Resolve conflicts explicitly and rerun affected tests.
5. Review `git diff --stat`, `git diff --check`, and the complete list of changed files.
6. Create focused commits with clear messages, or one clearly documented repair commit if that matches the repository convention.
7. Push the verified result to `origin/main` only after all checks pass.
8. Report the final commit SHA, the exact files changed, the recovered source of Units 8–16, all tests run and their results, and any remaining blockers.

Do not say “fixed” for any item that was not reproduced or validated. Do not claim Units 8–16, the backend, sync, or VPS deployment are complete unless their files exist on canonical `main` and the corresponding checks pass.

Begin with the Phase 1 read-only report. After the report, proceed with implementation only if the authoritative source and merge path are clear.
