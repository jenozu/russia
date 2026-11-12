---
paths:
  - "scripts/build_standalone.py"
  - "curriculum/**"
  - "standalone.html"
  - "service-worker.js"
  - "manifest.json"
  - "tests/app.test.js"
---

# Standalone app / phone-first rules

- `standalone.html` is generated. Change `scripts/build_standalone.py` (markup, CSS, JS) or
  `curriculum/russian/a1-course.json` (content), run `python scripts/build_standalone.py`, commit source and
  output together. `python tests/check_build_in_sync.py` must pass. No one-off `patch_*.py` scripts.
- No frameworks, bundlers or runtime dependencies: plain HTML/CSS/JS in one file. Must open from disk and work
  offline and signed out; network (sync) is always optional and never blocks a lesson.
- Save locally first (`localStorage["azbuka-standalone"]`), then sync. Old saved state must still load: migrate
  it in `normalizeState`, never drop fields a learner's data uses.
- Bump `CACHE` in `service-worker.js` whenever app assets change. The service worker never caches API responses.
- Speech: `speechSynthesis` with a Russian voice when one exists; show the voice in use and a fallback message.
  Every play button speaks the text of the card it sits on.
- Design at 390 px wide first. No horizontal scrolling, tap targets ≥ 44 px, input font-size ≥ 16 px,
  safe areas respected. Keep the neo-brutalist candy-pop look (pink `#FFD8E8`, cyan `#9BE9FB`, lilac `#FAE8FF`,
  black borders and offset shadows).
- Mic: ask only on a user action, stop all tracks when done, handle "denied". Learner audio is never stored.
- New behaviour gets a jsdom check in `tests/app.test.js`. UI changes need the `mobile-ui-check` checklist.
