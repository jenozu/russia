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
