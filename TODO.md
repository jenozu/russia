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

## 4. Mobile readiness

- [x] Preserve the fixed Expo/React Native/TypeScript mobile starter and portrait-first, one-handed flows.
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
- [x] Preserve local progress, daily goal controls, pronunciation audio, Stage 1 review flow, alphabet mastery, and progress views without Expo runtime dependencies.


## 7. Milestone 1 — Versioned local state

- [x] Add a versioned local state object with learner preferences, daily activity, Stage 1 item records, alphabet records, and review event history.
- [x] Migrate the existing `goal`, `stage`, and `letters` localStorage shape without losing saved progress.
- [x] Reset the visible daily counter at calendar-day boundaries while preserving cumulative progress.
- [x] Add JSON export, import, and reset controls for local learning data.
- [x] Validate the generated standalone artifact with JavaScript syntax and static HTTP smoke checks.
