# Азбука — Complete A1 Russian Voice-Tutor Roadmap

**Status:** Draft product-development roadmap  
**Reference:** `jenozu/a1-voice-tutor` and its product requirements, feature utilities, and deployment notes  
**Current baseline:** Standalone Russian Stage 1 prototype with 100 items, 33 Cyrillic letters, local review state, browser audio, microphone capture, browser speech recognition, adaptive practice, stories, scenarios, motivation, backups, and offline/PWA hardening.

## 1. What this roadmap is for

This is the roadmap for building the **entire A1 Russian course and voice-tutor product**. It is intentionally different from the completed standalone production-hardening roadmap.

The current app is a working Stage 1 vertical slice. This roadmap expands that slice into a complete, coherent A1 learning journey with enough content, speaking practice, thematic paths, stories, grammar support, tutor behavior, and progression for a learner to move from beginner survival Russian toward an A1 outcome.

The reference repository is useful as a product reference because it identifies the intended feature family:

- A practical word bank with familiarity tracking.
- Multiple quiz modes, including typed and spoken responses.
- Voice-enabled conversations.
- Text-to-speech and speech recognition.
- Spaced repetition.
- Pronunciation feedback.
- Graded stories.
- Grammar and culture tips at the moment of need.
- Thematic study paths.
- XP, badges, streaks, goals, reminders, and optional social motivation.
- Word of the Day, ambient practice, and selectable tutor voices.

The reference repository itself is not the implementation target. It is a partially implemented Streamlit prototype with placeholder or sparse data, including Polish-oriented UI and requirements alongside Russian Stage 1 data. This roadmap translates its product intent into a Russian-first browser application with a local-first core and optional production services later.

## 2. Product vision

Азбука should become a beginner-first Russian tutor that helps a learner understand, say, recognize, and use practical Russian in small loops.

The central learning sequence remains:

> **Meaning → pronunciation → listen → speak → recognize Cyrillic → use a tiny sentence → retrieve later**

The tutor should feel like a patient conversation partner rather than a deck of disconnected flashcards. A learner should be able to choose a short structured lesson, practice a useful situation, speak or type naturally, receive calibrated feedback, and return later to the material that actually needs review.

## 3. Target learner outcome

At the end of the A1 course, a learner should be able to handle predictable beginner situations in Russian, including:

- Greeting people and introducing themselves.
- Giving basic personal information.
- Asking and answering simple questions.
- Talking about family, home, work, school, and daily routine.
- Buying food, ordering in a café, and asking about prices.
- Asking for directions and understanding simple location phrases.
- Talking about time, dates, weather, and plans.
- Describing basic needs, preferences, abilities, and problems.
- Making simple requests and asking someone to repeat or speak slowly.
- Understanding short, clearly spoken messages and graded stories.
- Producing memorized and semi-open sentence patterns with comprehensible pronunciation.
- Reading and writing the Cyrillic alphabet well enough to support learning and everyday recognition.

These are product outcomes, not a claim that the app alone certifies CEFR proficiency. Any CEFR mapping should be reviewed by a qualified Russian-language educator.

## 4. Current state versus target state

| Area | Current state | A1 target |
|---|---|---|
| Curriculum | 100 Stage 1 words/expressions and alphabet | Coherent A1 syllabus with thematic units, recycling, and completion checks |
| Vocabulary | One 100-item Stage 1 set | Approximately 600–800 carefully selected lexical items and chunks, with a smaller high-frequency core explicitly prioritized |
| Grammar | Context tips and small sentence patterns | Progressive A1 grammar path with examples, contrastive explanations, and controlled production |
| Conversations | One short guided scenario family | Themed role-play library with branching repair moves and open-ended extensions |
| Stories | One short story | Graded listening/reading library across all A1 themes |
| Speaking | Browser recording and browser-native recognition | Reliable typed, recorded, and spoken paths with calibrated feedback and clear fallbacks |
| Tutor | Fixed prompts and deterministic matching | Content-grounded tutor with bounded dialogue behavior, hints, repair, and escalation to free practice |
| Review | Local SRS and adaptive quizzes | Course-wide scheduling across vocabulary, grammar patterns, listening, speaking, and stories |
| Progression | Stage 1 and alphabet views | Units, checkpoints, milestones, review health, and A1 completion evidence |
| Motivation | Local XP, streaks, badges, and goals | Optional reminders, meaningful milestones, and privacy-respecting social features if validated |
| Accounts | Local profile and backup merge | Optional account sync after the learning/content model is stable |

## 5. Product architecture principles

### Local-first learning core

A learner must be able to complete lessons, reviews, quizzes, stories, and basic speaking practice without a server. Cloud services should add portability, not become a dependency for the core lesson loop.

### Content is structured data

Words, chunks, grammar points, dialogues, stories, prompts, answer variants, cultural notes, and audio metadata should live in versioned content data rather than being embedded as one-off UI strings.

### Pareto-first curriculum design

The course should deliberately teach the small set of Russian that unlocks the largest number of beginner situations before broadening coverage. This is not permission to create a shallow “top words” list. It means identifying a high-leverage core of words, chunks, question forms, repair phrases, verb patterns, and grammatical constructions; teaching that core repeatedly across listening, speaking, stories, and conversations; and only then adding lower-frequency breadth. Every new item should justify its place through usefulness, reuse, communicative coverage, or a prerequisite relationship.

The curriculum should track at least three layers: a **survival core** for immediate communication, a **high-frequency A1 core** that supports most recurring beginner interactions, and **supporting breadth** that makes the course more natural and flexible. Reviews and new lessons should prioritize the first two layers when learner time is limited.

### Personalized adaptive learning is a core behavior

Spaced repetition and adaptive selection are not optional gamification features. The tutor should use each learner’s demonstrated performance to decide what appears next, which modality needs work, when a word should return, how much scaffolding to show, and when to introduce new material. Adaptation should operate across recognition, listening, typing, speaking, grammar patterns, stories, and conversation—not only on isolated vocabulary cards.

The learner should be able to see and influence this behavior: why an item returned, which skill is weak, what can be postponed, and what evidence is needed to move forward. The system should protect the high-leverage core from being crowded out by novelty.

### Deterministic practice before generative freedom

The tutor should first provide reliable, authored exercises with explicit expected answers and helpful variants. Generative dialogue can be added behind boundaries, with content grounding, safety controls, and a visible fallback when the model is unavailable.

### Speaking feedback must be honest

The product should distinguish between:

1. Did the speech recognizer produce a plausible transcript?
2. Did the transcript match the intended meaning or target phrase?
3. Did the audio contain useful pronunciation evidence?

Only the third supports a pronunciation claim, and it requires a validated audio-scoring system. Until then, feedback should focus on comprehensibility, target coverage, missing words, and retry guidance.

### Progress should reflect demonstrated ability

Completion should not mean merely opening a lesson. It should combine recognition, production, listening, speaking, and delayed retrieval evidence.

## 6. Course model

### Course hierarchy

The complete course should use this hierarchy:

- **Course:** Russian A1.
- **Path:** a thematic or functional route through the course.
- **Unit:** one practical situation or language objective.
- **Lesson:** a 5–15 minute guided learning loop.
- **Activity:** listen, recognize, type, speak, read, choose, reorder, or converse.
- **Review item:** a word, chunk, grammar pattern, listening distinction, or speaking target.
- **Checkpoint:** a short mixed assessment that determines whether the learner should continue, review, or receive support.

### Recommended A1 unit map

The exact unit order should be validated by a Russian educator, but the initial content plan should cover at least the following sequence:

1. **Orientation and sound map** — Cyrillic overview, pronunciation expectations, learning controls, survival repair phrases.
2. **Greetings and introductions** — Привет, Здравствуйте, names, origin, formal/informal address.
3. **Numbers, dates, and time** — counting, age, phone numbers, clock time, days, months, basic dates.
4. **People and family** — family members, personal descriptions, possession, simple questions.
5. **Home and everyday objects** — rooms, places in the home, location, есть/нет, basic descriptions.
6. **Food and café** — menu vocabulary, ordering, preferences, prices, quantities, polite requests.
7. **Shopping and clothing** — sizes, colors, costs, wants, needs, simple exchanges.
8. **Daily routine** — common present-tense verbs, frequency, morning/evening, work and study.
9. **Work, school, and languages** — occupations, abilities, schedules, nationality, language questions.
10. **City and directions** — places, transport, left/right, near/far, where something is.
11. **Travel and accommodation** — tickets, hotel basics, arrival, departure, simple problems.
12. **Weather and seasons** — weather descriptions, clothing decisions, plans.
13. **Health and immediate needs** — body basics, symptoms, help, pharmacy/doctor survival phrases.
14. **Preferences and free time** — likes, dislikes, hobbies, invitations, accepting and declining.
15. **Plans and near future** — intentions, appointments, simple arrangements, tomorrow/next week.
16. **Review and A1 survival mission** — mixed scenarios, listening, reading, speaking, and self-directed repair.

Each unit should contain a small core vocabulary set, reusable chunks, one or more grammar targets, a dialogue, a story or listening passage, cultural context, and an exit checkpoint.

### Vocabulary target

Use a quality target rather than an arbitrary word count. The course should begin with the existing 100-item Stage 1 set and expand toward approximately 600–800 entries, while explicitly tagging the high-leverage survival and A1 core. The number is a planning range, not a completion metric by itself. A smaller set that is deeply recycled and usable in speech is preferable to a larger set that is only recognized in isolation. Include:

- High-frequency individual words.
- Reusable multiword chunks.
- Function words and question forms.
- Irregular but essential forms.
- Pronunciation-sensitive minimal contrasts where useful.
- Vocabulary needed to understand the authored stories and conversations.

Every item should have a stable ID, Russian text, learner-facing meaning, part of speech or chunk type, stress/pronunciation information, example use, theme, CEFR/course unit, known variants, audio metadata, and review relationships.

### Reference-feature coverage requirement

The reference A1 voice-tutor repository describes the intended product family, so the eventual Russian course should cover the substance of those features rather than treating them as unrelated add-ons:

| Reference capability | Russian A1 implementation commitment |
|---|---|
| Word bank | High-leverage core plus supporting A1 vocabulary, examples, tags, audio, and familiarity evidence |
| Multiple quiz modes | Recognition, fill-in, translation, sentence building, typed production, and spoken response |
| Conversation mode | Themed role-play with tutor turns, repair phrases, accepted variants, and optional branching |
| Voice input and TTS | Listen, record, recognize, replay, and graceful typed fallback across the course |
| Spaced repetition | Skill-aware scheduling that protects the Pareto core and adapts to individual performance |
| Pronunciation feedback | Honest transcript/target feedback first; validated audio scoring only when evidence supports it |
| Story mode | Graded Russian stories with comprehension, glossary, listening, and optional retell activities |
| Grammar and culture tips | Contextual explanations linked to the learner’s current error or goal |
| Thematic study paths | Unit and path navigation by practical situation, with cross-unit recycling |
| XP, badges, streaks, and goals | Existing mechanics extended to meaningful course milestones without pressure as the default |
| Word of the Day | Optional high-leverage word or chunk with audio, example, and review action |
| Reminders | Opt-in daily practice reminders after the core experience is stable |
| Ambient mode | Optional bounded hands-free listening/responding mode with clear privacy controls |
| Custom tutor voices | Consistent tutor styles that change tone and pacing, not instructional truth |
| Leaderboard/social features | Deferred until privacy, motivation, and learner research justify them |

This table is a coverage contract for the product direction. It does not require every feature to be built before the first expanded unit, but it prevents the final A1 course from quietly regressing into a larger flashcard app.

## 7. Roadmap phases

The roadmap has twelve build phases. The existing Stage 1 implementation counts as the baseline for Phase 0; the next work should begin with content and course architecture rather than another production-only pass.

| Phase | Name | Outcome |
|---|---|---|
| 0 | Baseline and course contract | Freeze the current working loop and define the A1 content model |
| 1 | Course architecture and content schema | Make all future units, activities, and review items data-driven |
| 2 | A1 curriculum expansion | Build the vocabulary, grammar, and thematic unit spine |
| 3 | Lesson and checkpoint engine | Turn units into repeatable guided lesson loops |
| 4 | Listening and pronunciation progression | Make speech practice useful across the full course |
| 5 | Conversation tutor expansion | Build authored role-play and bounded tutor behavior |
| 6 | Story, culture, and grammar library | Scale meaningful input and contextual explanation |
| 7 | Adaptive mastery and course progression | Tie review, checkpoints, and unit unlocks to ability evidence |
| 8 | Ambient and daily practice modes | Add Word of the Day, short routines, and optional hands-free practice |
| 9 | Learner accounts and sync | Add optional portability after the content model is stable |
| 10 | Educator and content operations | Make quality, authoring, and corrections maintainable |
| 11 | A1 beta and completion validation | Test the complete course with real learners |

## 8. Phase 0 — Baseline and course contract

### Work

- Freeze the current Stage 1 behavior as a regression baseline.
- Preserve the local state schema and migration fixtures before adding course-level fields.
- Define the Russian A1 learner profile and outcomes.
- Decide which portions of the course are offline-capable and which optional services require connectivity.
- Define the initial supported input methods: typing, browser speech recognition, local recording, and playback.
- Decide whether social features are out of scope for the first complete A1 release.
- Establish Russian editorial review ownership.

### Exit criteria

- The current 100-item Stage 1 loop passes regression tests.
- A1 outcomes and unit map are approved.
- Content quality owners and review process are identified.
- No new feature work can silently break the baseline.

## 9. Phase 1 — Course architecture and content schema

**Status: first Pareto-first schema slice and first data-driven unit complete.** The repository now has a versioned `a1-course.json` that covers all 100 Stage 1 items, tags 45 high-leverage survival-core items, scaffolds 16 A1 units, and contains a complete, learner-facing Unit 3 vertical slice for numbers, dates, and time. The standalone build validates the schema before generation; adaptive scheduling across the new unit is the next Phase 1 slice.

### Work

Create versioned data structures for:

- Course, path, unit, lesson, activity, checkpoint, and completion rule.
- Vocabulary items and reusable chunks.
- Pronunciation guides, stress marks, audio variants, and voice metadata.
- Grammar points with prerequisites, examples, and common learner errors.
- Dialogues with roles, turns, accepted response variants, repair moves, and optional branches.
- Stories with level, transcript, translation, audio, glossary, questions, and retell prompts.
- Cultural notes linked to the exact moment they are useful.
- Review items that can represent vocabulary, chunks, grammar patterns, listening contrasts, and speaking targets.
- Localization strings and accessibility labels.

Add content validators for duplicate IDs, broken links, missing answer variants, invalid unit references, mismatched audio metadata, and unsupported grammar prerequisites.

### Exit criteria

- The existing Stage 1 content is migrated into the new schema without changing behavior.
- A second sample unit can be represented entirely through content data.
- The generator or runtime can render a unit without hardcoded feature-specific strings.
- Content validation runs before a build can be accepted.

## 10. Phase 2 — A1 curriculum expansion

### Work

Build the 16-unit course spine, beginning with Units 2–5 so expansion is visible quickly while preserving the first 100 items.

For each unit, author:

- A lexical core and reusable sentence chunks.
- A recognition set and production set.
- Listening examples at natural but beginner-appropriate speed.
- Controlled sentence-building exercises.
- One authored dialogue with repair language.
- One short story or listening passage.
- One grammar focus and one or two common mistakes.
- One or two cultural notes that directly affect use.
- A unit checkpoint and review recovery path.

Every new item must be deliberately recycled in later units. Avoid building isolated word lists that never reappear in speech, stories, or conversations.

### Content quality gates

- Russian text reviewed by a fluent or professional Russian-language reviewer.
- Stress and pronunciation guidance reviewed separately from English glosses.
- Formality, gender, aspect, and usage notes are correct where relevant.
- Examples sound natural and are appropriate for beginners.
- Answer variants do not accept semantically wrong but superficially similar responses.
- Every unit has enough listening and speaking material to support the stated outcome.

### Exit criteria

- Units 1–4 are complete and integrated.
- At least one complete path from greeting through daily life works end to end.
- The remaining units have content briefs and dependency maps.
- Vocabulary and grammar coverage can be measured by unit and skill.

## 11. Phase 3 — Lesson and checkpoint engine

### Work

Build reusable lesson templates instead of bespoke panels for every unit:

1. Warm-up and retrieval from prior units.
2. Meaning-first introduction.
3. Listen and notice.
4. Guided recognition.
5. Controlled production.
6. Speaking or typed response.
7. Short dialogue or story application.
8. Reflection, reward, and scheduled review.

Add checkpoint types for recognition, listening discrimination, typed production, spoken production, and comprehension. Checkpoints should explain what was demonstrated and recommend the next action.

Add unit-level progress states:

- Not started.
- In progress.
- Needs review.
- Ready for checkpoint.
- Completed with evidence.
- Revisit recommended.

### Exit criteria

- Any authored unit can run through the same lesson engine.
- A learner can leave and resume at a stable activity boundary.
- Checkpoint failures send the learner to targeted review instead of a generic restart.
- Unit completion cannot be granted solely by clicking through screens.

## 12. Phase 4 — Listening and pronunciation progression

### Work

Expand the current browser audio layer into a course-wide listening system:

- Native Russian voice selection with reliable fallback.
- Pre-generated or reviewed audio for canonical course content where browser TTS is inconsistent.
- Slow, natural, and repetition playback modes.
- Word, chunk, sentence, dialogue, and story playback.
- Optional speed and loop controls.
- Listening discrimination exercises for useful beginner contrasts.
- Stress-aware pronunciation guidance.
- Audio preloading and offline asset strategy.

For speaking, maintain three levels:

1. **Transcript path:** browser speech recognition or typed response checks whether intended content was produced.
2. **Recording path:** learner can record, replay, and discard without uploading.
3. **Validated pronunciation path:** a future scoring service may analyze audio, but only after a test set and expert review establish that its feedback is useful.

Feedback should identify missing target words, unexpected words, likely recognition uncertainty, and a concrete retry suggestion. Do not show a false precision score when the system only evaluated text.

### Exit criteria

- Every A1 unit has usable listen-and-repeat material.
- Unsupported voice or microphone behavior never blocks the lesson.
- Speaking activities have typed and recorded fallbacks.
- Pronunciation feedback language accurately reflects the evidence available.

## 13. Phase 5 — Conversation tutor expansion

### Work

Expand the current deterministic scenario into an authored conversation system with themes such as:

- Meeting someone.
- Café and restaurant.
- Shopping.
- Asking directions.
- Hotel and travel.
- Work or school introduction.
- Doctor/pharmacy survival.
- Making plans.
- Asking for repetition and clarification.

Each conversation should include:

- Tutor goal and learner goal.
- Required and optional target phrases.
- Accepted response variants.
- Formality expectations.
- Hints that become more explicit after difficulty.
- Listen again, show meaning, slow mode, and retry controls.
- Repair moves such as “I don’t understand,” “please repeat,” and “more slowly, please.”
- A safe completion state when the learner gives an understandable but non-canonical answer.

After the authored flow is stable, add a bounded AI tutor mode only if it can be grounded in the unit vocabulary and grammar. The model should not invent arbitrary curriculum, correct dialect variation as an error, or continue a conversation without a clear learner-control path.

### Exit criteria

- At least eight complete scenarios work with typed and spoken response paths.
- The learner can recover from an unexpected response without losing progress.
- Conversation completion records demonstrated targets, not just turns completed.
- AI or server-dependent behavior has a deterministic fallback.

## 14. Phase 6 — Story, culture, and grammar library

### Work

Scale the existing story and context-tip systems into a coherent A1 input library.

For every unit, provide at least one short story, dialogue transcript, or listening passage. Build progression across:

- Length.
- Vocabulary density.
- Speech speed.
- Grammatical complexity.
- Amount of translation support.
- Number of comprehension and retell tasks.

Grammar should appear when it helps answer a learner’s immediate question. The roadmap should cover, at an appropriate beginner level:

- Personal pronouns and basic omission patterns.
- Gender and adjective agreement in useful phrases.
- Present-tense verb patterns.
- Common irregular verbs.
- Questions and negation.
- Possession and у-constructions.
- Basic cases in high-value expressions.
- Motion and location survival patterns.
- Past and simple future patterns needed for A1 communication.
- Imperatives and polite requests.
- Aspect awareness only where it helps distinguish common meanings.

Do not turn every grammar tip into a lecture. Each explanation should include an example, a contrast, a tiny practice action, and a link back to the learner’s current activity.

### Exit criteria

- Every unit has contextual input and a learner-facing grammar path.
- Stories reuse vocabulary from previous units while introducing a manageable amount of new material.
- Culture notes are specific, non-stereotyping, and directly useful.
- Learners can hide support without losing the activity.

## 15. Phase 7 — Adaptive mastery and course progression

### Work

Extend the current SRS and adaptive quiz logic beyond isolated Stage 1 items.

Add review dimensions for:

- Russian-to-meaning recognition.
- Meaning-to-Russian production.
- Listening recognition.
- Typed sentence production.
- Spoken target coverage.
- Grammar pattern use.
- Story comprehension.
- Conversation repair and functional success.

Keep scheduling transparent. A learner should be able to see why something returned, what skill needs work, and what evidence would mark it healthier.

Add course-level mastery views:

- Vocabulary known, learning, and due.
- Skill balance across reading, listening, speaking, and production.
- Unit readiness and checkpoint history.
- Commonly missed phrases and grammar patterns.
- A1 survival-situation coverage.

Use adaptive selection to keep the learner in a productive zone: due items first, weak skills next, then new content, with periodic interleaving from older units.

### Exit criteria

- Review selection works across all activity types.
- New units do not hide overdue foundational material.
- A learner can see a credible reason for each review.
- Completion metrics distinguish exposure from demonstrated retention.

## 16. Phase 8 — Ambient and daily practice modes

This phase adapts the reference repo’s Word of the Day, goals, reminders, ambient mode, and custom voices without making them prerequisites for the course.

### Daily practice

- Word or chunk of the day with audio, example, theme, and review action.
- A short daily session assembled from due work and one optional new item.
- Goals that count meaningful practice rather than arbitrary screen taps.
- Streaks that handle time zones, missed days, and recovery without shame.

### Ambient mode

Build a controlled hands-free mode for walking or routine practice:

- Plays a prompt, pauses for a response, and gives a short result.
- Uses only a safe, pre-authored prompt set initially.
- Has clear start, pause, stop, and privacy controls.
- Does not assume continuous microphone access or upload audio.
- Falls back to listening-only mode when microphone or speech recognition is unavailable.

### Tutor voices

Start with stable voice styles rather than arbitrary personas:

- Calm tutor.
- Encouraging coach.
- Concise practice partner.

Voice personality should change pacing and encouragement, not factual content or correction standards.

### Exit criteria

- Daily practice is useful without becoming a second course to maintain.
- Ambient mode works as an optional extension and never traps the learner.
- Reminder behavior is opt-in and respects quiet hours.
- Voice styles remain consistent and do not change instructional content.

## 17. Phase 9 — Learner accounts and sync

Only begin this phase after the content model and full A1 learning state are stable.

### Work

- Keep anonymous local use available.
- Allow a learner to create an account after making progress locally.
- Migrate review events, unit progress, goals, and preferences without duplication.
- Sync append-oriented events with idempotency keys.
- Resolve profile and preference conflicts explicitly.
- Keep offline unsynced work safe through retries.
- Provide complete export and account deletion.
- Explain what audio, transcripts, and diagnostics do or do not leave the device.

### Exit criteria

- Two devices converge after offline work.
- Server unavailability does not prevent local practice.
- Account deletion is verifiable.
- Migration tests cover every prior local-state version.

## 18. Phase 10 — Educator and content operations

### Work

Create a maintainable content workflow:

- Content authoring templates.
- Russian review and approval states.
- Audio review and replacement workflow.
- Automated schema and link validation.
- Preview builds for a single unit.
- Diffable content changes.
- Content versioning and rollback.
- Learner-facing correction process when an item is wrong or unclear.

Add internal reports for coverage gaps:

- Items without audio.
- Grammar points without practice.
- Stories with unsupported vocabulary density.
- Dialogues without repair moves.
- Review items that never reappear.
- Units with imbalanced skill practice.

### Exit criteria

- A new unit can be authored without modifying application logic.
- Content changes can be reviewed independently from code changes.
- A bad content release can be rolled back.
- Every A1 skill and theme has measurable coverage.

## 19. Phase 11 — A1 beta and completion validation

### Beta cohort

Recruit learners with varied backgrounds:

- Absolute beginners.
- Learners who know the alphabet but little vocabulary.
- Learners who can read some Russian but struggle to speak.
- Mobile-first learners.
- Learners who decline microphone permissions.

### Evaluate

- Can a learner complete the first unit without explanation from the team?
- Do learners understand why they were corrected?
- Do they use repair phrases instead of abandoning a conversation?
- Does speech support help, or does it create confusion about its accuracy?
- Do stories and grammar tips support recall rather than interrupt it?
- Do learners return to due reviews?
- Do they perceive progress toward real-life situations?
- Which units create overload or insufficient challenge?

### A1 completion evidence

A learner should complete a final mixed set containing:

- Recognition of core vocabulary.
- Listening comprehension.
- Typed production.
- Spoken or recorded production with calibrated feedback.
- Scenario completion and repair.
- Story comprehension.
- Grammar-in-context tasks.
- A practical survival mission combining multiple units.

Completion should produce a strengths-and-next-steps report rather than an unqualified claim of language certification.

## 20. Suggested implementation order

The next coding milestone should be **Phase 1: course architecture and content schema**, followed by a vertical expansion of **one complete new unit**. Do not author all 16 units before proving the reusable lesson engine.

Recommended first vertical slice:

1. Migrate the existing Stage 1 items into the new content schema.
2. Add the numbers, dates, and time unit.
3. Render that unit with the shared lesson engine.
4. Add one dialogue, one story, one grammar explanation, and one checkpoint.
5. Schedule its items through the existing adaptive review system.
6. Test typed, audio, speaking, offline, and recovery paths.
7. Use the learner experience to revise the schema before scaling content production.

After that slice is stable, build Units 4–8 as the first thematic release, then Units 9–13, then Units 14–16 and the final A1 checkpoint.

## 21. Prioritized backlog

### Must-have for a complete A1 course

- Versioned course/content schema.
- 16-unit Russian A1 curriculum spine.
- Approximately 600–800 quality-controlled vocabulary items and chunks, with a clearly prioritized core.
- Progressive grammar coverage.
- Listening and speaking material in every unit.
- At least eight practical conversation scenarios.
- Graded stories or listening passages across all themes.
- Course-wide adaptive review and mastery evidence.
- Unit checkpoints and final survival mission.
- Content validation and Russian editorial review.

### Should-have for a strong voice tutor

- Bounded AI conversation mode grounded in unit content.
- Better reviewed audio assets where browser TTS is inconsistent.
- Listening discrimination practice.
- Ambient hands-free practice.
- Word of the Day and daily session assembly.
- Tutor voice styles.
- Local-to-account migration and optional sync.
- Educator content dashboard and coverage reports.

### Could-have after the core A1 course

- SMS reminders.
- Push notifications.
- Weekly leaderboard or private social comparisons.
- Learner-created topics or tutor personas.
- More advanced pronunciation scoring.
- Open-ended generative stories.
- A2 progression.

## 22. Relationship to the existing production roadmap

The production roadmap remains useful, but it is now a supporting track rather than the main product roadmap.

The recommended order is:

1. Build the content schema and one complete new A1 unit.
2. Expand the learning and tutor features through the A1 course.
3. Run content and learner beta validation.
4. Apply the production hardening gates to the now-complete A1 experience.
5. Add accounts, sync, reminders, and optional services when the course is worth syncing.

This avoids spending most of the effort making a small 100-word slice production-scale before proving the full course experience.

## 23. Definition of done for the complete A1 product

The A1 Russian tutor is complete when:

- A learner can start at zero Cyrillic knowledge and follow a coherent path through the full A1 course.
- The 100-item Stage 1 foundation is reused rather than abandoned.
- Every unit teaches useful language through meaning, listening, speaking, reading, and retrieval.
- Vocabulary and grammar recur across conversations and stories.
- The tutor supports repair, clarification, and understandable alternate answers.
- Speech limitations are communicated honestly, with usable typing and recording fallbacks.
- Review scheduling responds to actual performance across skills.
- Learners can see what they know, what is due, and what situation they are preparing for.
- A final mixed checkpoint demonstrates practical beginner communication without pretending to be a formal CEFR certification.
- Content can be corrected, expanded, and reviewed without rewriting the application.
- Optional production services can be added without breaking offline learning.
