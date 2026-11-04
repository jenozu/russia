# Азбука — Russian Alphabet

## Implementation plan

Азбука is a portrait-first Expo/React Native/TypeScript learning app for complete beginners. The first release is intentionally local-first: learning progress, daily goal, streak, and spaced-repetition history are persisted on-device with AsyncStorage so the core loop works immediately without login or a network dependency. The fixed Expo starter, Metro port 8081, API port 3000, app identifiers, and native integrations are preserved.

The experience is organized around three bottom-tab surfaces:

- **Today**: daily goal, streak, completion percentage, a single primary “Start today’s session” action, deck unlock progression, and a compact preview of the next practice set.
- **Practice**: short sessions with mode chips for Flashcards, Quiz, and Read. Flashcards flip between a large Cyrillic character and a definition side with pronunciation, English guide, example word, transliteration, meaning, and audio control. Quiz tests visual recognition and sound matching. Read exercises let the learner decode simple Russian words using already-introduced letters.
- **Progress**: overall alphabet completion, deck-level progress, mastered/learning/new counts, and a letter-by-letter mastery grid.

The data model includes all 33 Russian letters and explicit deck assignment: familiar-looking letters, confusing lookalikes, new characters, difficult sounds, and special signs. A curated learning order introduces the first familiar forms before later decks unlock gradually. Each letter records correct/incorrect reviews, a repetition count, mastery score, and next review timestamp. Review ratings schedule the next appearance sooner for “Again” and “Hard” and farther out for “Got it!”. Daily practice increments streak state and goal progress.

## Design system

- **Design movement**: neo-brutalist candy-pop learning tool, with warm pink canvas and black ink-like structure.
- **Core principles**: high-contrast legibility, one main action per screen, tactile feedback, and generous breathing room for a beginner’s attention.
- **Color philosophy**: Bubblegum Pink (`#FFD8E8`) makes the app welcoming; black borders and hard shadows make actions feel physical; Pastel Cyan (`#9BE9FB`) signals “go”; lavender (`#FAE8FF`) groups optional paths; white cards keep content crisp.
- **Layout paradigm**: a narrow, asymmetric mobile column with a strong top status strip, offset cards, and horizontal deck rails rather than dense grids.
- **Signature elements**: offset black shadows, pill-like deck chips, and oversized Cyrillic glyphs as the visual anchor.
- **Interaction philosophy**: every tappable surface has a tactile press state; the learning loop is calm, direct, and never hides the next obvious step.
- **Animation**: use simple scale/opacity and card flip state changes only; avoid distracting motion and keep transitions under 250ms.
- **Typography**: Outfit-style display hierarchy with bold headings, Space Grotesk-like compact body copy, and monospaced micro labels for progress numbers. The implementation uses system fallbacks where native font loading is unavailable.
- **Brand essence**: “A friendly first step into Russian reading” — playful, clear, motivating.
- **Brand voice**: warm and specific. Example lines: “One small session. A real alphabet.” and “You’re not behind — you’re building the sound map.”
- **Wordmark/logo**: a chunky black “Я” glyph inside a cyan speech-bubble tile, used as the app icon and compact identity mark.
- **Signature brand color**: Bubblegum Pink (`#FFD8E8`).

## Project structure

- `app/(tabs)/index.tsx` — Today dashboard and deck unlock overview.
- `app/(tabs)/practice.tsx` — Flashcard, recognition quiz, sound quiz, and reading exercise session.
- `app/(tabs)/progress.tsx` — Progress summary, deck breakdown, and letter mastery grid.
- `app/(tabs)/_layout.tsx` — Three-tab navigation styled in the candy-pop system.
- `lib/azbuka-data.ts` — Static 33-letter curriculum, deck metadata, examples, and reading prompts.
- `lib/azbuka-store.tsx` — AsyncStorage-backed learning state, streak logic, daily goal, unlock calculation, and spaced-repetition scheduling.
- `components/azbuka-ui.tsx` — Shared cards, buttons, progress bars, badges, and audio affordance.
- `theme.config.js` — Palette tokens derived from the supplied design file.
- `assets/images/*` — Rebranded launcher and splash assets using the app mark.

## Delivery boundaries

Russian audio uses Expo Speech on iOS/Android and the browser Web Speech API in Preview, both requesting the `ru-RU` voice when the host provides one. The first release does not require account login, cloud sync, or a production audio CDN; those can be layered onto the persisted data model later without changing the learning UI. Daily goal changes are available directly on the Today card, and the store resets the visible daily counter at calendar-day boundaries.
