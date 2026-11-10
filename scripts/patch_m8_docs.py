from pathlib import Path
p=Path('scripts/build_standalone.py'); s=p.read_text()
css='''<style>\n.quizReason{margin:10px 0 0;padding:8px 10px;background:var(--l);border:2px solid var(--k);font-size:14px;font-weight:800}\n</style>'''
if '<style>\n.quizReason' not in s:
    s=s.replace('</style>',css+'</style>',1)
s=s.replace("record.lastQuizMode='ru-en';record.lastQuizAt=", "record.lastQuizMode='ru-en';record.lastAdaptiveReason=quizReason;record.lastAdaptiveSeen=quizSession.seen[item.n]||1;record.lastQuizAt=",1)
p.write_text(s)

p=Path('master_task.md'); s=p.read_text()
needle='## Milestone 8 — Add adaptive quiz selection\n\n**Goal:** use performance to choose the next question intelligently.'
replacement='''## Milestone 8 — Add adaptive quiz selection

**Status: in progress — adaptive Stage 1 Russian → English mode complete.**

Implemented the first adaptive selector for the active Stage 1 quiz mode. It combines due status, actual quiz correctness, review ratings, new-item status, confidence-building maintenance, and per-session seen counts. Weak items are prioritized, new items are introduced before strong items are repeated, an item is protected from repeated selection, and each question shows a learner-visible reason. The selected reason and session occurrence are stored with the quiz result. Letter/deck-level adaptive selection will be added when the corresponding quiz modes are implemented.

**Goal:** use performance to choose the next question intelligently.'''
if needle not in s: raise SystemExit('milestone 8 anchor missing')
s=s.replace(needle,replacement)
p.write_text(s)

p=Path('TODO.md'); s=p.read_text(); s += '''\n\n## 14. Milestone 8 — Adaptive quiz selection\n\n- [x] Adapt the active Stage 1 Russian → English quiz using actual item review state, last quiz correctness, rating, due status, newness, and confidence history.\n- [x] Balance due reviews, weak items, new material, and maintenance/confidence-building items with deterministic selection.\n- [x] Protect against repeating the same item too many times in one quiz session with a per-session seen counter.\n- [x] Show a learner-visible reason such as “Back because it was tricky last time” or “New material — a gentle first check.”\n- [x] Store the adaptive reason and session occurrence with each quiz result so later tuning is based on actual outcomes.\n- [x] Keep incorrect items eligible for earlier return through Again scheduling while allowing new material to enter the session.\n- [x] Validate weak-item priority, new-item introduction, confidence maintenance candidates, visible reasons, and repeat protection in a live browser runtime.\n- [ ] Extend the adaptive selector to letter-level and additional quiz-mode/deck-level queues when those quiz modes are implemented.\n'''
p.write_text(s)
print('m8 docs and polish complete')
