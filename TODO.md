# TODO — Азбука

## 1. Beginner curriculum and visual system

- [x] Include all 33 Russian letters.
- [x] Organize letters into beginner-friendly learning decks for familiar-looking letters, confusing lookalikes, new characters, difficult sounds, and special signs.
- [x] Introduce letters gradually rather than overwhelming the learner with all 33 at once.
- [x] Keep the interface clean, minimal, intuitive and beginner-friendly, with short lessons and manageable daily practice sessions.
- [x] Apply the supplied Bubblegum Pink, Neo-Brutalist Black, Pure White, Pastel Cyan, Soft Cyan, Pastel Lilac, Soft Ice Blue, Candy Rose, crimson, neutral, and typography direction.

## 2. Flashcards, audio, quizzes, and reading

- [x] Create interactive flip cards showing uppercase and lowercase Cyrillic, pronunciation, an English pronunciation guide, an example Russian word, transliteration, and English meaning.
- [x] Include native Russian audio pronunciation where possible.
- [x] Include quizzes for recognizing letters.
- [x] Include sound-matching quizzes that connect pronunciation cues with the correct letters.
- [x] Include exercises for reading simple Russian words.

## 3. Adaptive practice and motivation

- [x] Implement spaced repetition so difficult letters come back sooner and mastered letters appear less frequently.
- [x] Include a daily learning goal with a configurable goal value.
- [x] Track consecutive practice days with a visible learning streak.
- [x] Show progress statistics for which letters have been mastered.
- [x] Show an overall alphabet completion percentage.

## 4. Standalone browser readiness

- [x] Keep `standalone.html` runnable directly in a browser with no framework, package manager, or runtime dependency.
- [x] Persist learning state locally so sessions, streak, goal, and mastery remain available across app sessions.
- [x] Verify a clean checkpoint after TypeScript and app checks complete.

## 5. Stage 1 speak-first curriculum integration

- [x] Incorporate the linked `curriculum/russian/stage_1.md` curriculum as a dedicated in-app Stage 1 flow without replacing the alphabet decks.
- [x] Include all 100 Stage 1 everyday words and expressions with Russian, pronunciation guide, English meaning, and seven-day grouping.
- [x] Follow the curriculum order of meaning, pronunciation, saying it aloud, recognizing Cyrillic, and using a tiny sentence.
- [x] Include the source curriculum’s sentence patterns, mini-conversation practice, pronunciation notes through the displayed guides, and readiness checks for moving to Stage 2.


## 6. Standalone HTML handoff

- [x] Deliver a dependency-free `standalone.html` browser app as the current primary prototype.
- [x] Embed the complete 100-item Stage 1 curriculum and all 33 Russian alphabet letters.
- [x] Preserve local progress, daily goal controls, pronunciation audio, Stage 1 review flow, alphabet mastery, and progress views without standalone HTML runtime dependencies.


## 7. Milestone 1 — Versioned local state

- [x] Add a versioned local state object with learner preferences, daily activity, Stage 1 item records, alphabet records, and review event history.
- [x] Migrate the existing `goal`, `stage`, and `letters` localStorage shape without losing saved progress.
- [x] Reset the visible daily counter at calendar-day boundaries while preserving cumulative progress.
- [x] Add JSON export, import, and reset controls for local learning data.
- [x] Validate the generated standalone artifact with JavaScript syntax and static HTTP smoke checks.


## 8. Milestone 2 — Ratings and spaced repetition

- [x] Add Again, Hard, Good, and Easy review buttons to Stage 1 cards.
- [x] Use transparent deterministic intervals: Again 10 minutes, Hard 1 day, Good 3 days, and Easy 7 days, with longer intervals for repeated Good/Easy reviews.
- [x] Prioritize overdue scheduled items, then weak items, then untouched material within the selected Stage 1 day.
- [x] Keep separate scheduling records for Stage 1 phrases and alphabet letters.
- [x] Show why an item is appearing again and expose last review, rating, and next review in the Settings debug panel.
- [x] Verify rating ordering, due-first selection, and localStorage persistence in a live browser runtime.


## 9. Milestone 3 — Browser Russian audio

- [x] Add a reusable `speechSynthesis` audio controller for Stage 1 words, alphabet letters, sentence patterns, and mini-conversation lines.
- [x] Discover `ru-RU` voices first, then use a Russian-name match, an available browser voice, or an explicit unavailable state.
- [x] Add Play, Pause, Replay, and persisted playback-speed controls.
- [x] Add word-level and sentence-level playback with a phonetic-guide highlight while speech is active.
- [x] Cancel the previous utterance before each new playback so repeated taps do not accumulate duplicate queues.
- [x] Keep lessons usable when `speechSynthesis` or browser voices are unavailable.
- [x] Validate generated JavaScript and live-browser controller behavior.


## 10. Milestone 4 — Learner microphone capture

- [x] Detect `MediaRecorder`, `getUserMedia`, and secure-context capability without requesting permission on page load.
- [x] Request microphone permission only after the learner explicitly taps Record.
- [x] Add Record, Stop, Replay, and Discard controls with elapsed duration and clear status messages.
- [x] Keep recordings in memory only; do not upload audio or add recording blobs to localStorage.
- [x] Revoke object URLs, stop media tracks, and handle repeated/discarded recordings without stale controls.
- [x] Provide useful permission-denied, unsupported-browser, and HTTPS guidance while leaving the rest of the lesson usable.
- [x] Validate the complete lifecycle with a mocked live-browser test.


## 11. Milestone 5 — Browser-native speech transcription

- [x] Choose and document the browser-native `SpeechRecognition`/`webkitSpeechRecognition` path; defer remote transcription services.
- [x] Add idle, recording, processing, result, and error transcription states.
- [x] Configure Russian recognition with `ru-RU`, interim results, and final transcript display.
- [x] Require explicit learner acknowledgment of browser speech-processing privacy before recognition starts.
- [x] Add retry/reset behavior without losing the current target phrase.
- [x] Distinguish recognition errors and no-speech results from incorrect answers; do not calculate or display a fake score.
- [x] Provide an unsupported-browser fallback while keeping local recording available.
- [x] Confirm the path makes no app upload/API call and does not persist audio or transcript data.


## 12. Milestone 6 — Transcript-level pronunciation feedback

- [x] Normalize transcript and target case, punctuation, whitespace, and Russian Unicode letters before comparison.
- [x] Compare words deterministically with partial credit; exact matches score 100%, while missing or extra words lower the F1-style score predictably.
- [x] Show a human-readable percentage with matched-word count, missing words, extra words, and likely trouble spots.
- [x] Clearly label the result as transcript comparison, not phoneme-accurate pronunciation scoring.
- [x] Keep recognition failures and no-speech states scoreless and distinguish them from incorrect answers.
- [x] Preserve the target phrase and prior transcript attempts through retry; store score, transcript, timestamp, and attempt count on the Stage 1 review record.
- [x] Validate exact, missing, extra-word, retry, and metadata behavior in a live browser runtime.


## 13. Milestone 7 — Structured quiz modes

- [x] Implement only the first quiz mode: Russian → English multiple choice; do not mix the remaining modes into this screen.
- [x] Reuse the Stage 1 due queue so the quiz follows existing review priority.
- [x] Show one Russian prompt with four English answer choices and one clear answer action.
- [x] Give immediate correct/incorrect feedback and identify the correct meaning after an incorrect answer.
- [x] Record each quiz result as a local review event with mode, item, correctness, chosen answer, timestamp, and next review.
- [x] Schedule correct quiz answers as Good and incorrect answers as Again.
- [x] Keep a retry path that preserves the active question even if the due queue reorders after scheduling.
- [x] Validate clean question generation, four choices, incorrect feedback, retry stability, correct feedback, persistence, and event recording in a live browser runtime.
- [ ] Implement and independently verify English → Russian, Cyrillic recognition, sound-to-letter, typed fill-in, typed translation, and spoken-response modes in later increments.


## 14. Milestone 8 — Adaptive quiz selection

- [x] Adapt the active Stage 1 Russian → English quiz using actual item review state, last quiz correctness, rating, due status, newness, and confidence history.
- [x] Balance due reviews, weak items, new material, and maintenance/confidence-building items with deterministic selection.
- [x] Protect against repeating the same item too many times in one quiz session with a per-session seen counter.
- [x] Show a learner-visible reason such as “Back because it was tricky last time” or “New material — a gentle first check.”
- [x] Store the adaptive reason and session occurrence with each quiz result so later tuning is based on actual outcomes.
- [x] Keep incorrect items eligible for earlier return through Again scheduling while allowing new material to enter the session.
- [x] Validate weak-item priority, new-item introduction, confidence maintenance candidates, visible reasons, and repeat protection in a live browser runtime.
- [ ] Extend the adaptive selector to letter-level and additional quiz-mode/deck-level queues when those quiz modes are implemented.

## 15. Milestone 9 — Conversation scenario

- [x] Add one dedicated Russian “Meeting someone” scenario with a short scripted tutor-led exchange; do not add multiple scenarios in this milestone.
- [x] Provide tutor Russian lines with replayable audio through the existing browser audio controller.
- [x] Provide English support that can be revealed or hidden without leaving the scenario.
- [x] Provide typed response input and a browser-native Russian speech response path where supported, with a typed fallback when recognition is unavailable.
- [x] Accept response patterns and natural variants such as “Меня зовут …”, “Я из …”, and “Я живу в …” rather than requiring one exact answer.
- [x] Show beginner-friendly recovery guidance, listen-again, and retry controls for unexpected responses without resetting the app.
- [x] Save local scenario attempts, completion counts, timestamps, response methods, and correctness as scenario events while preserving existing localStorage state compatibility.
- [x] Validate JavaScript syntax, static HTTP serving, scenario rendering, English reveal, tutor audio target, accepted typed variants, unexpected-response recovery, completion, refresh persistence, and existing adaptive quiz rendering in a live browser.
- [ ] Add later scenarios such as café, directions, shopping, and asking for help.

## 16. Milestone 10 — Story and comprehension practice

- [x] Add one short beginner Russian story, “Утро Алекса”, using existing Stage 1 vocabulary; do not add multiple stories in this milestone.
- [x] Provide line-level English translation reveal without interrupting the story.
- [x] Provide story audio playback through the existing browser speech controller.
- [x] Highlight story vocabulary at phrase and word level as known/new based on local Stage 1 review state.
- [x] Link highlighted vocabulary back to the corresponding Stage 1 review card without adding a separate content system.
- [x] Add three comprehension questions answerable from the story text with immediate feedback.
- [x] Add one cloze activity and immediate correct/incorrect guidance.
- [x] Save story attempts, correctness, cloze results, timestamps, and activity types as local review events while preserving existing localStorage compatibility.
- [x] Validate JavaScript syntax, static HTTP serving, story rendering, translation reveal, audio control, vocabulary highlighting/linking, all three questions, cloze feedback, and refresh persistence in a live browser.
- [ ] Add additional stories and richer vocabulary/story progression in later milestones.

## 17. Milestone 11 — Grammar and cultural context

- [x] Add a content-separated structured tip model with kind, topic, title, explanation, example, optional learn-more text, and related Stage 1 item IDs.
- [x] Add a beginner-friendly formal/informal “тебя or вас?” explanation tied to the greeting lesson.
- [x] Add a cultural note explaining casual “Привет” versus formal “Здравствуйте”.
- [x] Add a seeded pronunciation/stress tip for чай to establish the reusable content pattern.
- [x] Show only relevant tips for the active Stage 1 item and keep the core lesson usable without opening them.
- [x] Add optional learn-more expansion and sequential dismiss behavior for multiple relevant tips.
- [x] Persist dismissed tip IDs in the existing version-1 local state with backward-compatible migration defaults.
- [x] Validate relevance, example text, learn-more expansion, dismiss-to-next-tip behavior, syntax, static HTTP serving, and preservation of existing story/scenario panels in a live browser.
- [ ] Add broader grammar coverage and cultural notes for later scenarios and stories.

## 18. Milestone 12 — Motivation and habit mechanics

- [x] Add persisted, idempotent XP rewards for completed Stage 1 reviews, quiz results, speaking attempts, and scenario completion.
- [x] Record reward keys and XP-awarded events so refreshes and replayed UI states cannot duplicate rewards.
- [x] Track actual activity dates and display the current calendar-day streak.
- [x] Display a seven-day activity count and editable weekly activity goal.
- [x] Keep the existing editable daily review goal visible in the private summary.
- [x] Add three small badges tied to meaningful thresholds: first win, 50 XP, and three-day streak.
- [x] Add a private Progress summary showing XP, streak, weekly activity, badges, and goal guidance.
- [x] Preserve version-1 local state with backward-compatible motivation defaults.
- [x] Validate reward creation, no-duplicate refresh behavior, progress rendering, goal persistence, syntax, static HTTP serving, and existing Stage 1 state in a live browser.
- [ ] Consider optional reminders, accounts, and privacy-controlled leaderboards only in later milestones.

## 19. Milestone 13 — Durable accounts and sync foundation

- [x] Add a durable local learner profile ID with optional display name.
- [x] Add account-aware JSON backup naming and export metadata.
- [x] Merge imported review records by newest review timestamp instead of silently replacing local progress.
- [x] Deduplicate merged review events and preserve local motivation, scenario, story, and dismissal state.
- [x] Show explicit local-only account and privacy boundary messaging.
- [x] Add explicit local account/data deletion while keeping the basic offline loop usable.
- [x] Preserve version-1 local state with backward-compatible account and sync defaults.
- [x] Validate profile creation, name persistence, backup download, refresh persistence, syntax, static HTTP serving, and existing review state in a live browser.
- [ ] Add real authentication, server-side learner profiles, and multi-device conflict-safe sync only after a backend service is provisioned.
- [ ] Publish privacy documentation for audio and transcripts alongside the account service.

## 20. Milestone 14 — Standalone browser hardening

- [x] Add a PWA manifest with standalone display, app scope, theme color, and mobile viewport metadata.
- [x] Add a versioned service worker that precaches the app shell and provides offline fallback behavior.
- [x] Add 44px touch targets and touch-action hints for primary controls.
- [x] Add one-handed responsive layout rules for narrow mobile screens.
- [x] Preserve capability-based microphone behavior: secure-context checks, permission errors, and non-blocking fallback.
- [x] Preserve browser speech-recognition fallback so typing and local review remain available when recognition is unsupported.
- [x] Validate manifest/service-worker HTTP delivery, live registration, computed touch-target styles, local Stage 1 loop, and voice fallback messaging in a browser.
- [ ] Validate install prompts, iOS/Android audio parity, and push notifications on physical devices with explicit opt-in.

## 21. A1 roadmap Phase 1 — Pareto-first survival core and content structure

- [x] Add versioned `curriculum/russian/a1-course.json` content metadata without replacing the existing Stage 1 runtime source.
- [x] Define three explicit Pareto tiers: survival core, high-frequency A1 core, and supporting breadth.
- [x] Tag all 100 existing Stage 1 items with a tier, unit relationship, skill coverage, reuse targets, and selection weight.
- [x] Identify 45 stable-ID survival-core items covering greetings, repair, questions, identity, needs, time, food, places, and basic navigation.
- [x] Scaffold the 16-unit Russian A1 course path with lesson-template and Pareto-focus metadata.
- [x] Define protected-core adaptive-selection priorities and explanation templates for future review integration.
- [x] Add dependency-free content validation for schema version, tiers, IDs, unit links, skill labels, and complete Stage 1 coverage.
- [x] Wire content validation into `scripts/build_standalone.py` so invalid metadata blocks generated artifacts.
- [x] Embed validated course metadata in the generated standalone artifact without changing the current learner UI.
- [x] Validate JSON/schema output, generated JavaScript syntax, fresh-port browser rendering, embedded metadata markers, existing local state loading, Stage 1 navigation, and card reveal.
- [ ] Build the first fully data-driven new unit and render its lesson activities through the shared course engine.
