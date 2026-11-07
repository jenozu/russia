# Азбука — Standalone HTML Plan

## Product boundary

Азбука is a dependency-free standalone HTML Russian-learning app for complete beginners. The repository intentionally has no Expo, React Native, mobile framework, backend runtime, package manager, or build-time JavaScript dependency. The browser opens `standalone.html` directly or serves it through a basic static HTTP server.

## Current implementation

The app embeds the complete 100-item Russian Stage 1 curriculum and all 33 Cyrillic letters. It provides short learning loops, meaning-first Stage 1 cards, Russian pronunciation playback through the browser speech API, alphabet examples, sentence patterns, mini-conversation content, local progress, daily goals, letter mastery, progress statistics, and Milestone 1 versioned local state with migration, calendar-safe daily tracking, JSON backup, import, and reset controls.

## Design system

The visual language is neo-brutalist candy-pop: Bubblegum Pink `#FFD8E8` as the canvas, Pastel Cyan `#9BE9FB` for primary actions, Pastel Lilac `#FAE8FF` for supporting surfaces, heavy black borders and offset shadows, white cards, rounded tactile controls, large Cyrillic glyphs, and concise beginner-friendly copy.

## Repository structure

- `standalone.html` — generated, dependency-free browser app.
- `scripts/build_standalone.py` — deterministic generator for the standalone artifact.
- `curriculum/russian/stage_1.md` — imported source curriculum.
- `curriculum/russian/stage-one-data.ts` — structured curriculum source consumed by the generator; it is data only and is not an application framework.
- `README.md` — setup, product scope, and design overview.
- `master_task.md` — staged roadmap for future standalone-browser capabilities.
- `TODO.md` — delivered requirements and milestone status.

## Development approach

Implement one milestone at a time. Every milestone must preserve direct browser usability, local progress compatibility, the existing curriculum, and the visual system. Validate with generated-artifact checks and a static HTTP smoke test before moving to the next milestone.

## Future standalone-browser milestones

The roadmap proceeds from explicit local state to true spaced repetition, reliable Russian audio, microphone capture, transcription, pronunciation feedback, adaptive quizzes, conversations, stories, contextual grammar, motivation mechanics, optional sync, and browser/PWA hardening. None of those future capabilities should introduce Expo or another mobile framework into this repository.
