---
name: mobile-ui-check
description: Check a UI change works on a phone-sized screen before calling it done - build, lint, and a filled-in manual checklist at 390x844. Use for any task that changes the frontend.
---

# Phone-screen check

Automated (run them, report results):
1. `python scripts/build_standalone.py` then `python tests/check_build_in_sync.py` pass.
2. `(cd tests && npm test --silent)` passes; extract the inline script and `node --check` it if you changed JS.
3. Serve with `python .claude/scripts/devserver.py start web` and `curl -fsS http://127.0.0.1:4173/standalone.html`.

Manual: you can't see a phone. Put this checklist, filled in for the screen you changed, under MANUAL CHECK in
your report (the phase-runner files it under Eyes-on):
- [ ] Chrome DevTools → device toolbar → 390×844. Reload.
- [ ] No horizontal scrolling; nothing hidden under fixed bars, the notch or the home bar.
- [ ] Every button and row is easy to tap (≥ 44 px); inputs don't zoom the page on focus.
- [ ] Play buttons speak the card they sit on; with no Russian voice, the fallback message shows.
- [ ] Loading, empty and error states (signed out, offline, API stopped) all look intentional.
- [ ] <the specific flow this task added, step by step, with the expected result of each step>
- [ ] After deploy: the same flow on a real phone (and in the installed home-screen app, if it's a PWA).

Anything you *can* prove with a running dev server and curl (the API returns the right data, a page renders
server-side) belongs under Agent-checkable, not here.
