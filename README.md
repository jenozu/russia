# Азбука — Russian Voice Tutor

Азбука is a beginner-first Russian learning app built as a standalone HTML experience. This repository intentionally contains only the dependency-free browser app, its generator, source curriculum, and documentation.

The product direction is intentionally incremental: first make the core loop reliable, then add one voice, assessment, adaptive-learning, and motivation capability at a time. Each feature should be implemented and verified independently before the next feature begins.

## Current framework

### Standalone browser app

`standalone.html` is the current easiest-to-run prototype. It has no build step or runtime dependency:

- Open `standalone.html` directly in a browser, or serve the repository with any static HTTP server.
- Includes the complete Russian Stage 1 curriculum: 100 words and expressions organized into five 20-item study days.
- Includes all 33 Russian Cyrillic letters with uppercase/lowercase forms, pronunciation guides, example words, and meanings.
- Provides Stage 1 reveal cards, pronunciation playback through browser `speechSynthesis`, sentence patterns, mini-conversation content, alphabet browsing, letter mastery, daily goal controls, and progress views.
- Saves prototype progress locally in the browser with `localStorage`.

Example local preview:

```bash
python3 -m http.server 4173
# Open http://localhost:4173/standalone.html
```

## Product direction

The original idea is a voice-first adaptive tutor rather than only a flashcard app. The target experience will eventually support:

1. Learner microphone input and speech transcription.
2. Pronunciation scoring with useful feedback.
3. Real spaced repetition based on performance and review dates.
4. Multiple quiz types and adaptive question selection.
5. Scenario-based conversations with a tutor.
6. Short stories and comprehension practice.
7. Grammar and cultural context at the moment it is useful.
8. XP, badges, streak depth, and optional reminders.

The complete staged implementation plan is in [`master_task.md`](master_task.md). Work should proceed in order, with each milestone validated before moving on.

## Design language

The interface uses a neo-brutalist candy-pop system derived from the supplied design file:

- Bubblegum Pink `#FFD8E8` canvas.
- Pastel Cyan `#9BE9FB` for primary actions and learning highlights.
- Pastel Lilac `#FAE8FF` for secondary content.
- White cards, heavy black borders, and offset black shadows.
- Large Cyrillic glyphs, tactile buttons, short lessons, and high-contrast beginner-friendly copy.

## Content source

The Russian Stage 1 curriculum is preserved in [`curriculum/russian/stage_1.md`](curriculum/russian/stage_1.md) and structured for the standalone generator in [`curriculum/russian/stage-one-data.ts`](curriculum/russian/stage-one-data.ts). It follows the learning sequence:

> Meaning → pronunciation → say it aloud → recognize the Cyrillic → use a tiny sentence

## Repository structure

```text
standalone.html                 Dependency-free browser app
scripts/build_standalone.py     Regenerates standalone.html from local curriculum data
curriculum/russian/             Source markdown and structured curriculum data
README.md                       Standalone app setup and product overview
master_task.md                  Incremental implementation plan
```

## Development principle

Do not implement the entire roadmap in one pass. Add one feature, verify its behavior, document what was learned, and only then proceed to the next feature. The objective is a dependable learning loop, not a large collection of partially working controls.
