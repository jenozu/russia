# Manual checks

The phase-runner adds checks here instead of stopping mid-phase. Each item: `### Task <id> - <title> (<date>)`
with numbered steps and the expected result.

- **Agent-checkable:** provable with a running dev server and curl, a script or a query.
  Run them with `/manual-checks run`.
- **Eyes-on:** need a human looking at a screen, a phone, a real device or server. Do them, then tell the lead
  what passed and failed (`/manual-checks results ...`).

## Agent-checkable

### Tasks 1, 2, 4 - Windows confirmation (2026-11-12)
Tasks 1, 2 and 4 were verified on Linux (full suite green, API dev server healthy, course_units = 16) and left open
because they name the owner's Windows PC. Phase 1 started on that evidence.
1. Do task 1 (create `azbuka_test` and `azbuka_dev` databases).
2. Run the AGENTS.md test command; expect exit 0.
3. `python .claude/scripts/devserver.py start api`, `curl http://127.0.0.1:8090/health` -> ok, stop it.
Expected: all pass; then close tasks 2 and 4.

## Eyes-on

### Task 7 - Account screen at 390x844 (2026-11-12)
1. Open standalone.html (Data tab) in a phone or devtools at 390x844.
2. The Sync account panel shows email + password fields (no zoom on focus: 16px), Sign in and Create account buttons, nothing cut off or overlapping the nav.
3. Create an account against a running API; panel switches to "Signed in as ...", pending count, last sync time, Sync now and Sign out.
4. Stop the API, rate a card: status shows queued/sync problem and the pending count goes up; app keeps working.
Expected: all of the above; tap targets are comfortable.

