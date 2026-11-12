// Headless regression tests for standalone.html (run: cd tests && npm install && npm test).
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '..', 'standalone.html'), 'utf8');

function boot(seedState) {
  const spoken = [];
  const utterances = [];
  const downloads = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'http://localhost/standalone.html',
    pretendToBeVisual: true,
    beforeParse(w) {
      if (seedState) w.localStorage.setItem('azbuka-standalone', JSON.stringify(seedState));
      w.SpeechSynthesisUtterance = function (t) { this.text = t; };
      w.speechSynthesis = {
        speaking: false, paused: false, cancel() {}, pause() {}, resume() {},
        speak(u) { spoken.push(u.text); utterances.push(u); },
        getVoices() { return [{ name: 'Test RU', lang: 'ru-RU' }]; },
      };
      w.URL.createObjectURL = () => 'blob:test';
      w.URL.revokeObjectURL = () => {};
      w.HTMLAnchorElement.prototype.click = function () { downloads.push(this.download); };
      w.scrollTo = () => {}; w.alert = () => {}; w.confirm = () => true;
    },
  });
  return { w: dom.window, d: dom.window.document, spoken, utterances, downloads };
}

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('page load does not trigger a download', () => {
  const { downloads } = boot();
  assert.strictEqual(downloads.length, 0);
});

test('pattern and conversation play buttons speak their sentence', () => {
  const { w, d, spoken } = boot();
  w.eval("show('stage');reveal()");
  const buttons = [...d.querySelectorAll('.tinyAudio')];
  assert.ok(buttons.length >= 10, 'expected sentence play buttons');
  buttons[0].click();
  assert.strictEqual(spoken[spoken.length - 1], buttons[0].dataset.sentence);
});

test('alphabet cards speak the example word, not a bare capital', () => {
  const { w, d, spoken } = boot();
  w.eval("show('alphabet')");
  const first = d.querySelector('#alphabetGrid [data-sound]');
  first.click();
  assert.ok(spoken[spoken.length - 1].length > 1, 'should speak a word');
});

test('Replay speaks the card on screen', () => {
  const { w, d, spoken } = boot();
  w.eval("show('stage');reveal()");
  d.getElementById('audioPlay').click();
  w.eval("rateCurrent('good');reveal()");
  const current = w.eval('list()[index%list().length].ru');
  d.getElementById('audioReplay').click();
  assert.strictEqual(spoken[spoken.length - 1], current);
});

test('rating cards does not skip items', () => {
  const { w } = boot();
  w.eval("show('stage')");
  const seen = [];
  for (let i = 0; i < 6; i++) {
    seen.push(w.eval('list()[index%list().length].n'));
    w.eval("reveal();rateCurrent('good')");
  }
  assert.deepStrictEqual(seen, [1, 2, 3, 4, 5, 6]);
});

test('card counter is item-of-day', () => {
  const { w, d } = boot();
  w.eval("show('stage')");
  assert.strictEqual(d.getElementById('itemCounter').textContent, '1/20');
});

test('repeated reviews of one item do not farm XP', () => {
  const { w } = boot();
  w.eval("show('stage')");
  const xpBefore = w.eval('state.motivation.xp');
  for (let i = 0; i < 10; i++) {
    w.eval("index=list().findIndex(i=>i.n===1);reveal();rateCurrent('again')");
  }
  assert.strictEqual(w.eval('state.motivation.xp') - xpBefore, 5);
});

test('speech "interrupted" errors do not overwrite status', () => {
  const { w, d, utterances } = boot();
  w.eval("show('stage');reveal()");
  d.getElementById('audioPlay').click();
  d.getElementById('audioPlay').click();
  const status = d.getElementById('audioStatus').textContent;
  utterances[0].onerror({ error: 'interrupted' });
  assert.strictEqual(d.getElementById('audioStatus').textContent, status);
});

test('every unit renders and has audio buttons', () => {
  const { w, d } = boot();
  for (let n = 2; n <= 16; n++) {
    w.eval(`show('unit${n}')`);
    assert.ok(d.getElementById('unitTitle').textContent.length > 0, 'unit' + n + ' title');
    assert.ok(d.querySelectorAll('#unit [data-speak]').length >= 10, 'unit' + n + ' audio buttons');
  }
});

test('listening exercise plays audio without printing the answer text', () => {
  const { w, d, spoken } = boot();
  w.eval("show('unit5')");
  const q = w.eval('UNIT.recycling.listeningContrasts[0]');
  const box = d.getElementById('unitListeningContrasts');
  const btn = box.querySelector('[data-speak]');
  assert.ok(btn, 'hear button exists');
  assert.ok(!box.textContent.includes(q.hear), 'heard text must not be printed');
  btn.click();
  assert.strictEqual(spoken[spoken.length - 1], q.hear);
});

test('wrong checkpoint answer marks the choice wrong and hides the right one', () => {
  const { w, d } = boot();
  w.eval("show('unit3')");
  const q = w.eval('UNIT.checkpoint.questions[0]');
  const wrong = q.options.find(o => o !== q.answer);
  w.eval(`answerUnitCheckpoint(0,${JSON.stringify(wrong)})`);
  const buttons = [...d.querySelectorAll('[data-unit-q="0"]')];
  assert.ok(buttons.find(b => b.textContent === wrong).classList.contains('wrong'));
  assert.ok(!buttons.some(b => b.classList.contains('correct')), 'answer must stay hidden');
  w.eval(`answerUnitCheckpoint(0,${JSON.stringify(q.answer)})`);
  const after = [...d.querySelectorAll('[data-unit-q="0"]')];
  assert.ok(after.find(b => b.textContent === q.answer).classList.contains('correct'));
});

test('older saved progress still loads', () => {
  const now = new Date().toISOString();
  const old = { version: 1, goal: 12, audio: { speed: 0.8, voiceName: '' }, daily: { date: now.slice(0, 10), reviewed: [1] },
    stageItems: { 1: { attempts: 2, correct: 2, lastReviewed: now, nextReview: now } }, letters: {}, events: [] };
  const { w } = boot(old);
  assert.strictEqual(w.eval('state.goal'), 12);
  assert.strictEqual(w.eval('Object.keys(state.stageItems).length'), 1);
});

const ID_RE = /^[A-Za-z0-9._:@-]+$/;
const queue = (w) => JSON.parse(w.eval('JSON.stringify(state.sync.queue)'));

test('device id is created once and stays stable across reloads', () => {
  const a = boot();
  a.w.eval("show('stage');reveal();rateCurrent('good')");
  const id = a.w.eval('state.sync.deviceId');
  assert.ok(/^web-[A-Za-z0-9._:-]+$/.test(id), 'device id charset: ' + id);
  const saved = JSON.parse(a.w.localStorage.getItem('azbuka-standalone'));
  const b = boot(saved);
  assert.strictEqual(b.w.eval('state.sync.deviceId'), id);
  assert.strictEqual(queue(b.w).length, queue(a.w).length);
});

test('rating a card queues one review event and one xp event with valid ids', () => {
  const { w } = boot();
  w.eval("show('stage');reveal();rateCurrent('good')");
  const q = queue(w);
  const rev = q.filter((e) => e.event_type === 'review-rated');
  const xp = q.filter((e) => e.event_type === 'xp-awarded');
  assert.strictEqual(rev.length, 1);
  assert.strictEqual(xp.length, 1);
  assert.strictEqual(rev[0].item_scope, 'stage');
  assert.ok(ID_RE.test(rev[0].client_event_id) && ID_RE.test(rev[0].item_id));
  assert.strictEqual(rev[0].payload.rating, 'good');
  assert.ok(/^review:1:/.test(xp[0].payload.key) && xp[0].payload.amount === 5);
  assert.strictEqual(new Set(q.map((e) => e.client_event_id)).size, q.length);
  assert.ok(rev[0].occurred_at === w.eval('state.stageItems[1].lastReviewed'));
});

test('tapping Again repeatedly queues review events but only one xp event', () => {
  const { w } = boot();
  w.eval("show('stage');for(let i=0;i<3;i++){reveal();rateCurrent('again');index=0}");
  const q = queue(w);
  assert.strictEqual(q.filter((e) => e.event_type === 'xp-awarded').length, 1);
  assert.ok(q.filter((e) => e.event_type === 'review-rated').length >= 3);
});

test('checkpoint answers and unit completion are queued with the unit id', () => {
  const { w } = boot();
  w.eval("show('unit3');startUnit();unitSession.dialogueComplete=true;answerUnitCheckpoint(0,UNIT.checkpoint.questions[0].answer);answerUnitCheckpoint(1,UNIT.checkpoint.questions[1].answer)");
  const q = queue(w);
  assert.strictEqual(q.filter((e) => e.event_type === 'checkpoint-answer').length, 2);
  const done = q.filter((e) => e.event_type === 'unit-completed');
  assert.strictEqual(done.length, 1);
  assert.strictEqual(done[0].unit_id, 'u03-numbers-time');
  assert.ok(q.every((e) => ID_RE.test(e.client_event_id)));
});

test('a full queue refuses new events and raises a warning instead of dropping old ones', () => {
  const { w } = boot();
  w.eval("ensureSync();for(let i=0;i<QUEUE_MAX;i++)state.sync.queue.push({client_event_id:'e'+i,event_type:'settings-updated',occurred_at:new Date().toISOString(),payload:{}});emitSync('settings-updated',{})");
  assert.strictEqual(w.eval('state.sync.queue.length'), 5000);
  assert.strictEqual(w.eval('state.sync.queueFull'), true);
  assert.strictEqual(w.eval("state.sync.queue[0].client_event_id"), 'e0');
});

test('old saved state without sync fields gets queue defaults', () => {
  const now = new Date().toISOString();
  const old = { version: 1, goal: 10, audio: { speed: 0.8, voiceName: '' }, daily: { date: now.slice(0, 10), reviewed: [] },
    stageItems: {}, letters: {}, events: [], sync: { lastExportAt: null, lastImportAt: null } };
  const { w } = boot(old);
  assert.deepStrictEqual(queue(w), []);
  assert.strictEqual(w.eval('Array.isArray(state.sync.rejected)'), true);
});

let failed = 0;
for (const [name, fn] of tests) {
  try { fn(); console.log('ok   - ' + name); }
  catch (e) { failed++; console.log('FAIL - ' + name + '\n       ' + e.message.split('\n')[0]); }
}
console.log(`\n${tests.length - failed}/${tests.length} passed`);
process.exit(failed ? 1 : 0);
