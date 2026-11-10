from pathlib import Path
p=Path('scripts/build_standalone.py')
s=p.read_text()
css='''<style>\n.quizPanel{margin-top:18px;padding:18px;border:3px solid var(--k);background:var(--w);box-shadow:4px 4px 0 var(--k)}\n.quizPrompt{margin:14px 0;padding:16px;background:var(--c);border:2px solid var(--k)}\n.quizPrompt strong{display:block;font-size:30px;margin-top:5px}\n.quizChoices{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}\n.quizChoice{background:var(--w);border:2px solid var(--k);box-shadow:3px 3px 0 var(--k);padding:12px;text-align:left;font-weight:800;cursor:pointer}\n.quizChoice:disabled{cursor:default;opacity:.85}\n.quizChoice.correct{background:#b8f5ca}\n.quizChoice.wrong{background:#ffd0d0}\n.quizFeedback{min-height:24px;margin-top:14px;font-weight:800;line-height:1.35}\n.quizFeedback.good{color:#075b2a}.quizFeedback.bad{color:#8e1b1b}\n@media(max-width:800px){.quizChoices{grid-template-columns:1fr}}\n</style>'''
if '<style>\n.quizPanel' not in s:
    s=s.replace('</style>',css+'</style>',1)
p.write_text(s)

p=Path('master_task.md'); s=p.read_text()
needle='## Milestone 7 — Add structured quiz modes\n\n**Goal:** expand beyond reveal cards while keeping short, manageable sessions.'
replacement='''## Milestone 7 — Add structured quiz modes

**Status: in progress — first mode complete in the standalone HTML app.**

Implemented the first mode only: Russian → English multiple choice. It is a separate focused panel, reuses the existing Stage 1 due queue, generates four English choices, gives immediate correct/incorrect feedback, records quiz review events, schedules correct answers as Good and incorrect answers as Again, and keeps the active question stable through retry even when scheduling changes queue order. The remaining six quiz modes stay disabled until independently implemented and verified.

**Goal:** expand beyond reveal cards while keeping short, manageable sessions.'''
if needle not in s: raise SystemExit('milestone 7 anchor missing')
s=s.replace(needle,replacement)
p.write_text(s)

p=Path('TODO.md'); s=p.read_text(); s += '''\n\n## 13. Milestone 7 — Structured quiz modes\n\n- [x] Implement only the first quiz mode: Russian → English multiple choice; do not mix the remaining modes into this screen.\n- [x] Reuse the Stage 1 due queue so the quiz follows existing review priority.\n- [x] Show one Russian prompt with four English answer choices and one clear answer action.\n- [x] Give immediate correct/incorrect feedback and identify the correct meaning after an incorrect answer.\n- [x] Record each quiz result as a local review event with mode, item, correctness, chosen answer, timestamp, and next review.\n- [x] Schedule correct quiz answers as Good and incorrect answers as Again.\n- [x] Keep a retry path that preserves the active question even if the due queue reorders after scheduling.\n- [x] Validate clean question generation, four choices, incorrect feedback, retry stability, correct feedback, persistence, and event recording in a live browser runtime.\n- [ ] Implement and independently verify English → Russian, Cyrillic recognition, sound-to-letter, typed fill-in, typed translation, and spoken-response modes in later increments.\n'''
p.write_text(s)
print('polish and docs complete')
