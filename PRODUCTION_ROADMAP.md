# Азбука Production Roadmap

**Status:** Draft for review  
**Baseline:** Standalone prototype roadmap complete through Milestone 14  
**Product:** Азбука — Russian in small, useful loops  
**Primary constraint:** Preserve the calm, local-first learning loop while adding production infrastructure only where it improves portability, reliability, privacy, or release quality.

## 1. Production objective

Prepare Азбука for a controlled public release without compromising the qualities that make the prototype useful: a beginner can start without Cyrillic knowledge, complete a short session, hear Russian, respond by typing or speaking, receive honest feedback, revisit difficult material, and resume without losing progress.

The production program should not begin by adding more visible features. It should first make the existing learning loop dependable across supported browsers and devices, establish trustworthy data handling, and provide a reversible path from local progress to an optional account.

## 2. Current baseline

The prototype already includes:

- A 100-item Stage 1 curriculum and Cyrillic alphabet practice.
- Local review state with spaced-repetition scheduling.
- Browser audio playback and pronunciation guidance.
- Local microphone capture with secure-context and permission handling.
- Browser-native Russian speech recognition where available.
- Transcript comparison and honest, non-phoneme-accurate pronunciation feedback.
- Adaptive quizzes, conversation scenarios, story comprehension, grammar/cultural context, motivation, streaks, badges, and private progress summaries.
- Local profile IDs, optional display names, account-aware backups, deterministic merge-on-import, and local data deletion.
- PWA manifest metadata, service-worker caching, responsive mobile layout, and touch-target hardening.

The prototype does **not** yet provide real authentication, a server-side learner profile, cloud synchronization, production privacy/legal documentation, physical-device QA, or an operational release process.

## 3. Guiding principles

### Local-first, cloud-optional

The basic lesson, review, quiz, story, and progress loop must remain usable offline. Account creation must be optional unless a future product decision explicitly makes sync a requirement.

### No silent data loss

Every sync or import operation must be explainable. Conflicts must be visible or resolved by a deterministic, documented rule. A remote failure must never erase local progress.

### Honest speech claims

The product must continue to distinguish browser speech recognition, transcript comparison, and actual pronunciation assessment. It must not imply phoneme-level accuracy unless a validated speech service is added and its limitations are clearly explained.

### Privacy by default

Audio and transcripts should remain local unless a user explicitly opts into a service that requires transmission. Data collection must be minimal, inspectable, exportable, and deletable.

### Calm motivation

Progress, goals, streaks, and badges should support practice rather than create pressure. Notifications, if added, must be opt-in and easy to disable.

### Mobile-first reliability

The supported mobile experience is a release gate, not a post-launch aspiration. iOS Safari and Android Chrome should receive dedicated testing because microphone permissions, speech recognition, audio playback, service workers, and install behavior differ substantially.

## 4. Recommended release stages

The roadmap is organized into nine production phases. Each phase has a clear outcome and exit gate. Phases may overlap only where the dependency notes allow it.

| Phase | Name | Primary outcome | Dependency |
|---|---|---|---|
| P0 | Scope and release contract | Supported-platform, privacy, and success criteria are fixed | None |
| P1 | Browser and PWA hardening | Supported browsers have a reliable offline-capable shell | P0 |
| P2 | Audio and voice compatibility | Audio, microphone, and speech fallbacks are verified on physical devices | P1 |
| P3 | Privacy, security, and data governance | User-facing policies and technical controls are production-ready | P0; before accounts |
| P4 | Account and sync service | Optional authentication and conflict-safe cloud sync are available | P3; P1 |
| P5 | Migration, backup, and recovery | Existing local learners can move safely between local and cloud modes | P4 |
| P6 | Content, observability, and quality operations | Content and incidents can be maintained without risky releases | P1; P3 |
| P7 | Beta and release readiness | A measured pilot validates retention, reliability, and support load | P2–P6 |
| P8 | Public launch and post-launch | Production launch is monitored and improved deliberately | P7 |

## 5. Phase P0 — Scope and release contract

### Objectives

Turn the prototype into an explicit release target before adding infrastructure.

### Work

1. Define supported platforms for the first release:
   - Desktop Chrome/Edge and Safari, if desktop support is desired.
   - iOS Safari on the minimum supported iOS version.
   - Android Chrome on the minimum supported Android version.
   - Supported offline behavior for installed PWA and normal browser tabs.
2. Decide whether the first production release is:
   - A local-first PWA with optional account sync; or
   - An account-centered product where anonymous use is still available temporarily.
3. Define product success metrics:
   - First-session completion.
   - Seven-day return rate.
   - Review completion rate.
   - Audio playback success rate.
   - Microphone permission success and fallback rate.
   - Sync success and conflict rate after accounts launch.
4. Define non-goals for the first release:
   - No public leaderboard by default.
   - No automatic upload of microphone recordings.
   - No claim of clinical or phoneme-accurate pronunciation assessment.
   - No notification channel without explicit opt-in.
5. Create a release decision log and assign owners for product, engineering, content, privacy, QA, and support.

### Exit criteria

- Supported browser/device matrix is approved.
- First-release feature list and non-goals are approved.
- Data categories and success metrics are named.
- A rollback owner and incident contact are identified.

## 6. Phase P1 — Browser and PWA hardening

### Objectives

Make the existing standalone shell reliable in normal browser tabs and installed-PWA mode.

### Work

1. Complete installability validation:
   - Verify manifest fields, scope, start URL, display mode, theme color, and app naming.
   - Test install prompts and installed launch behavior on supported browsers.
   - Add production app icons and maskable icon variants.
   - Confirm correct icon rendering in browser, launcher, and task switcher.
2. Harden service-worker lifecycle:
   - Use explicit cache versioning and upgrade behavior.
   - Verify stale-cache invalidation after a release.
   - Add an update notification that does not interrupt an active lesson.
   - Decide whether the app uses cache-first, network-first, or hybrid behavior per asset type.
   - Ensure failed network requests do not replace valid cached app content with an error page.
3. Test offline behavior:
   - Cold offline load after prior installation.
   - Warm offline load after normal browsing.
   - Offline local review, quiz, story, progress, export, and reset.
   - Recovery when storage is unavailable or nearly full.
4. Harden navigation and state restoration:
   - Refresh while on every major view.
   - Browser back/forward behavior where applicable.
   - Return from an interrupted audio or recording flow.
   - Preserve local state through service-worker updates.
5. Improve accessibility and touch behavior:
   - Keyboard navigation and visible focus styles.
   - Screen-reader labels for audio, recording, import, export, and destructive controls.
   - Color contrast and non-color feedback.
   - Minimum touch targets and one-handed layout at supported widths.
   - Reduced-motion behavior.

### Exit criteria

- Install and offline smoke tests pass on all supported browser families.
- Service-worker update and rollback procedures are documented.
- No critical accessibility or navigation defects remain.
- Existing local progress survives app-shell updates.

## 7. Phase P2 — Audio and voice compatibility

### Objectives

Validate the existing voice flow on real devices and make capability differences understandable.

### Work

1. Create a device test matrix covering:
   - iOS Safari, installed PWA, and Safari private browsing where relevant.
   - Android Chrome, installed PWA, and Android permission states.
   - Desktop browsers with and without microphones.
   - Headphones, muted devices, denied permission, revoked permission, and unavailable input devices.
2. Test text-to-speech:
   - Russian voice availability.
   - Voice selection persistence.
   - Playback interruption, replay, pause, and speed changes.
   - Background/foreground transitions.
   - Bluetooth and wired output behavior.
   - Screen lock and tab switching behavior.
3. Test microphone capture:
   - HTTPS requirement and localhost development behavior.
   - First permission prompt, denial, revocation, and retry.
   - Start/stop/discard/replay lifecycle.
   - iOS user-gesture requirements and recording duration limits.
   - Storage and memory behavior for longer recordings.
4. Test speech recognition:
   - Recognition unavailable.
   - Recognition denied.
   - No-speech and network errors.
   - Russian locale behavior.
   - Transcript completion and retry.
   - Typing fallback without loss of lesson position.
5. Document all limitations in product copy and help content.

### Exit criteria

- Every supported device has a tested happy path and unsupported/error path.
- Audio playback never blocks the lesson when a voice is unavailable.
- Microphone and recognition failures produce actionable guidance.
- No recording is uploaded without an explicit future opt-in flow.
- Voice claims in the UI match observed technical behavior.

## 8. Phase P3 — Privacy, security, and data governance

### Objectives

Prepare the product to handle learner data responsibly before introducing cloud accounts.

### Data inventory

Document each data category, purpose, retention, storage location, access path, and deletion behavior:

- Review events and schedules.
- Quiz, story, scenario, and motivation events.
- Local profile ID and optional display name.
- Account identifier and authentication metadata, once accounts exist.
- Audio recordings held in memory or local storage.
- Transcripts and pronunciation comparison results.
- Diagnostics and crash/error telemetry, if enabled.
- Notification preferences, if notifications are added.

### Work

1. Publish user-facing privacy documentation in plain language.
2. Explain browser-native speech recognition behavior and possible browser/vendor processing.
3. Clearly separate:
   - Data that stays on the device.
   - Data sent to a server after account sync.
   - Data sent to a speech or analytics provider, if any.
4. Define retention and deletion rules for account data, events, transcripts, recordings, backups, and logs.
5. Add consent and settings controls for any non-essential processing.
6. Apply security basics to any future backend:
   - HTTPS everywhere.
   - Secure session handling and token rotation.
   - Passwordless or managed authentication where appropriate.
   - Rate limiting and abuse controls.
   - Server-side authorization by learner account.
   - Encrypted transport and encrypted-at-rest storage.
   - Auditability for account deletion and export.
7. Threat-model the import/export path, service worker, account recovery, and sync endpoint.
8. Add a data deletion verification procedure and support runbook.

### Exit criteria

- Privacy notice, data inventory, retention policy, and deletion process are approved.
- No cloud account feature launches before its data flow is documented.
- Security review finds no open critical or high-risk issue.
- Test users can understand what happens to audio and transcripts.

## 9. Phase P4 — Optional account and sync service

### Objectives

Add portability across devices without making cloud sync a prerequisite for basic practice.

### Recommended architecture

Use an append-oriented review-event model rather than syncing only the latest mutable state. The server should treat events as immutable facts where possible and derive schedules, motivation, and summaries deterministically. This makes retries and conflict handling safer.

Minimum backend components:

- Authentication provider or service.
- Learner profile record.
- Event ingestion endpoint with idempotency keys.
- Event query/sync endpoint using cursors or timestamps.
- Server-side state projection or schedule materialization.
- Export endpoint and account deletion job.
- Rate limiting, audit logs, and operational metrics.

### Sync contract

1. Every locally generated event receives a stable client event ID.
2. Upload retries are idempotent; submitting the same event twice does not duplicate it.
3. Downloads are cursor-based and resumable.
4. Local unsynced events remain available when offline.
5. A remote error never deletes local events.
6. Conflicts are resolved by documented rules:
   - Event history: union by stable event ID.
   - Review record projection: deterministic latest-event or server-projection rule.
   - Profile fields: explicit last-write or user-choice rule.
   - Goals/preferences: explicit field-level rule, not accidental object replacement.
7. The client shows sync state without interrupting practice:
   - Offline/not signed in.
   - Syncing.
   - Synced.
   - Needs attention.
8. Account deletion removes server data and clears local credentials/cache according to the documented policy.

### Exit criteria

- A new user can practice anonymously and later create an account.
- Existing local progress migrates without duplicate reviews or XP.
- Two devices converge after offline work and reconnect.
- Retry, duplicate upload, partial download, and conflict tests pass.
- Offline practice remains available when the service is down.

## 10. Phase P5 — Migration, backup, and recovery

### Objectives

Make migration trustworthy for current prototype users and future account holders.

### Work

1. Define the local-state schema version and migration strategy.
2. Add a migration preview before account adoption:
   - Items reviewed.
   - Events to upload.
   - Goals and motivation summary.
   - Potential duplicate/conflict warnings.
3. Preserve the existing JSON backup format or provide a documented conversion path.
4. Test restoring backups into:
   - A fresh browser.
   - A newer app version.
   - A device with a different locale/time zone.
   - A signed-in account with existing server progress.
5. Provide a recovery flow for interrupted migration and failed sync.
6. Test account deletion followed by local offline use.
7. Verify export completeness with automated fixture comparisons.

### Exit criteria

- Existing prototype state can be migrated in a fixture-based test suite.
- Exported data is readable and complete.
- Recovery is possible after browser refresh, network failure, or partial upload.
- No migration path silently overwrites newer learning activity.

## 11. Phase P6 — Content, observability, and quality operations

### Objectives

Make the product maintainable after launch instead of treating the standalone file as a one-time artifact.

### Content operations

- Separate curriculum/content updates from UI code where practical.
- Add content validation for IDs, translations, examples, answer variants, and related review links.
- Add regression fixtures for every story, scenario, quiz mode, and context tip.
- Define a content review process with Russian-language quality review.
- Version content so old review events remain interpretable.

### Observability

If telemetry is added, keep it minimal and documented. Track aggregate reliability rather than recording unnecessary learner content.

Recommended operational signals:

- App-shell load failures.
- Service-worker update failures.
- Audio playback errors by browser family.
- Microphone permission and capture failures.
- Speech-recognition availability/error rates.
- Sync success, retry, conflict, and deletion-job rates.
- Client error rates and release version distribution.

Do not send raw recordings or transcripts to analytics by default.

### Support operations

- Publish troubleshooting guides for audio, microphone, install, offline use, and backups.
- Create support procedures for export, account deletion, failed sync, and duplicate events.
- Define severity levels, response targets, and escalation paths.
- Maintain a release changelog and known-issues page.

### Exit criteria

- Content and state regression tests run in CI.
- Critical client and service failures are observable without collecting unnecessary learner content.
- Support can diagnose common device, backup, and sync problems.

## 12. Phase P7 — Beta and release readiness

### Objectives

Validate the production candidate with a small, representative cohort before public launch.

### Beta design

Use a staged beta with:

- Beginners with no Cyrillic background.
- Learners on iOS and Android.
- Users with and without microphone permissions.
- Users who remain offline for meaningful periods.
- Users who migrate from the existing standalone state.

### Test scenarios

- First session without an account.
- Install and offline reload.
- Review, quiz, story, scenario, and motivation flows.
- Audio with and without Russian voices.
- Microphone denial and recovery.
- Speech recognition unavailable and typing fallback.
- Backup export and restore.
- Account creation and local migration.
- Two-device offline activity and reconnect.
- Account deletion and post-deletion offline use.

### Release gates

- No open critical defects.
- No unresolved high-severity data-loss or privacy issues.
- Core lesson completion succeeds on every supported device family.
- Sync convergence and deletion tests pass.
- Support documentation is available.
- Rollback and incident drills are complete.

## 13. Phase P8 — Public launch and post-launch

### Launch sequence

1. Deploy backend and static/PWA assets behind versioned releases.
2. Run production smoke tests with a canary account and anonymous session.
3. Release to a small percentage of users.
4. Monitor load, audio, microphone, sync, and error signals.
5. Expand gradually if release gates remain healthy.
6. Keep the previous app shell available long enough to roll back safely.

### First 30 days

- Review reliability and support metrics weekly.
- Investigate every data-loss report immediately.
- Review browser/device distribution before expanding support.
- Fix broken audio and sync paths before adding new learner-facing features.
- Review notification opt-in rates and disable or adjust noisy behavior.
- Conduct a privacy and deletion audit after real account operations begin.

### First 90 days

- Decide whether additional stories, grammar coverage, or Stage 2 content should outrank new platform features.
- Evaluate whether a leaderboard is compatible with the calm, private product direction.
- Reassess speech scoring only with evidence that a better model improves feedback without overstating certainty.
- Formalize quarterly dependency, security, content, and data-retention reviews.

## 14. Test strategy

### Automated tests

- State normalization and migration fixtures.
- Reward idempotency and streak calculations.
- Review scheduling and adaptive selection.
- Event deduplication and merge conflict rules.
- Export/import round trips.
- Account deletion data assertions.
- Content schema and answer-variant validation.
- Service-worker cache manifest and version checks.

### Browser tests

- Fresh empty state.
- Existing local state refresh.
- Offline app-shell load.
- Install/update flow where automation permits.
- Keyboard and touch navigation.
- Audio playback controls.
- Permission denial and unsupported APIs.
- Backup download/import.
- Account migration and sync retries.

### Physical-device tests

Maintain a test log with device, operating-system version, browser version, network condition, permission state, expected result, actual result, and release build identifier.

## 15. Prioritized backlog

### Must-have before public accounts

1. Production privacy and data inventory.
2. Supported-device matrix and physical audio/microphone validation.
3. Account authentication and authorization.
4. Idempotent event-based sync.
5. Local-to-account migration.
6. Export and deletion verification.
7. Service-worker update/rollback behavior.
8. CI regression tests for current learning flows.
9. Incident and support runbooks.

### Should-have before broad public release

1. Production app icons and install UX.
2. Accessibility audit and keyboard support.
3. Error telemetry that excludes raw learner content.
4. Content validation and versioning.
5. Backup restore preview.
6. Beta cohort and staged rollout.
7. Release notes and known-issues documentation.

### Could-have after initial release

1. Opt-in reminders or push notifications.
2. Broader grammar and cultural coverage.
3. Additional stories and scenario progression.
4. Stage 2 curriculum.
5. Privacy-controlled social features or leaderboard experiments.
6. More advanced pronunciation assessment after validation.

## 16. Suggested sequencing decision

The next implementation effort should be **P0 + P1 test infrastructure**, not a new learner-facing feature. Once the supported-device contract and offline/update behavior are verified, proceed to **P2 physical audio testing and P3 privacy documentation**. Only after those gates should the project provision a backend and begin P4 account synchronization.

This sequence protects the core promise: a beginner should be able to open Азбука, practice a small loop, understand the feedback, and keep their progress—even when the network, microphone, speech service, or account system is unavailable.

## 17. Definition of production readiness

Азбука is ready for a controlled public release when:

- The supported browser/device matrix is documented and tested.
- The core local loop works offline and survives app updates.
- Audio, microphone, and recognition fallbacks are clear and non-blocking.
- Privacy and data handling are documented in plain language.
- Optional accounts migrate local progress without duplication or loss.
- Two devices converge after offline practice and reconnect.
- Export and deletion are verified end to end.
- Critical errors are observable without unnecessary learner-content collection.
- Support can handle the common failure modes.
- A staged rollout and rollback plan has been rehearsed.
