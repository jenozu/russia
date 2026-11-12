// End-to-end sync check against a real local API (run: node tests/sync_e2e.test.js).
// Start the API first: python .claude/scripts/devserver.py start api. Skips cleanly if it is not up.
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const API = process.env.API_BASE || 'http://127.0.0.1:8090';
const html = fs.readFileSync(path.join(__dirname, '..', 'standalone.html'), 'utf8');

function boot(seed, apiBase) {
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', url: 'http://localhost/standalone.html', pretendToBeVisual: true,
    beforeParse(w) {
      if (seed) w.localStorage.setItem('azbuka-standalone', seed);
      w.localStorage.setItem('azbuka-api-base', apiBase);
      w.fetch = (u, i) => fetch(u, i);
      w.SpeechSynthesisUtterance = function (t) { this.text = t; };
      w.speechSynthesis = { speaking: false, cancel() {}, pause() {}, resume() {}, speak() {}, getVoices() { return []; } };
      w.scrollTo = () => {}; w.alert = () => {}; w.confirm = () => true;
    },
  });
  return dom.window;
}
const saved = (w) => w.localStorage.getItem('azbuka-standalone');
const snap = (w) => JSON.parse(w.eval('JSON.stringify({s:Object.keys(state.stageItems),l:Object.keys(state.letters),xp:state.motivation.xp,done:!!(state.courseUnits["u03-numbers-time"]||{}).completedAt,cp:(state.courseUnits["u03-numbers-time"]||{}).checkpoint})'));
const api = async (p, tok, method = 'GET', body) => {
  const r = await fetch(API + p, { method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok }, body: body && JSON.stringify(body) });
  return { status: r.status, data: r.status === 204 ? null : await r.json() };
};
let step = 0;
const ok = (m) => console.log(`ok   - ${++step}. ${m}`);

(async () => {
  try { const h = await fetch(API + '/health'); assert.ok(h.ok); }
  catch (_) { console.log(`SKIP - API not reachable at ${API}. Start it: python .claude/scripts/devserver.py start api`); process.exit(0); }

  // 1. API unreachable: learn offline, reload, progress is still there.
  const DEAD = 'http://127.0.0.1:9';
  let a = boot(null, DEAD);
  a.eval("show('stage');reveal();rateCurrent('good');index=0;reveal();rateCurrent('hard');show('alphabet');rateLetter(2,'easy');show('unit3');startUnit();unitSession.dialogueComplete=true;answerUnitCheckpoint(0,UNIT.checkpoint.questions[0].answer);answerUnitCheckpoint(1,UNIT.checkpoint.questions[1].answer)");
  const offline = snap(a);
  assert.ok(offline.s.length >= 1 && offline.l.length === 1 && offline.xp > 0 && offline.done);
  const queued = a.eval('state.sync.queue.length');
  a = boot(saved(a), DEAD);
  assert.deepStrictEqual(snap(a), offline);
  assert.strictEqual(a.eval('state.sync.queue.length'), queued);
  ok(`offline progress survives a reload (${queued} events queued)`);

  // 2. API returns: register, queue drains with nothing rejected.
  const email = `e2e${Date.now()}@example.com`;
  a.localStorage.setItem('azbuka-api-base', API);
  a = boot(saved(a), API);
  assert.ok((await a.eval(`authRequest('register','${email}','correct-horse-battery','')`)).ok);
  const r = await a.eval('syncNow()');
  assert.ok(r.ok, JSON.stringify(r));
  assert.strictEqual(a.eval('state.sync.queue.length'), 0);
  assert.strictEqual(a.eval('state.sync.rejected.length'), 0);
  assert.deepStrictEqual(snap(a), offline, 'sync must not change local progress');
  ok('queue drains after the API returns, nothing rejected, local progress unchanged');

  // 3. Same batch twice: duplicates, no extra events or XP.
  const tok = a.eval('state.sync.account.token'), dev = a.eval('state.sync.deviceId');
  const before = await api('/v1/sync/changes?limit=500', tok);
  const eventsBefore = before.data.events.length;
  const rewardsBefore = (await api('/v1/sync/bootstrap', tok)).data.progress.rewards;
  const replay = before.data.events.map((e) => ({
    client_event_id: e.client_event_id, event_type: e.event_type, unit_id: e.unit_id, item_scope: e.item_scope, item_id: e.item_id,
    payload: typeof e.payload === 'string' ? JSON.parse(e.payload) : e.payload, occurred_at: e.occurred_at,
  }));
  const again = await api('/v1/sync/events', tok, 'POST', { device_id: dev, events: replay });
  assert.strictEqual(again.status, 200);
  assert.strictEqual(again.data.accepted.length, 0);
  assert.strictEqual(again.data.duplicates.length, replay.length);
  assert.strictEqual((await api('/v1/sync/changes?limit=500', tok)).data.events.length, eventsBefore);
  assert.deepStrictEqual((await api('/v1/sync/bootstrap', tok)).data.progress.rewards, rewardsBefore);
  ok(`resending ${replay.length} events: all duplicates, event count and XP unchanged`);

  // 4. Fresh browser profile logs in and restores the same progress.
  const b = boot(null, API);
  assert.ok((await b.eval(`authRequest('login','${email}','correct-horse-battery')`)).ok);
  const rb = await b.eval('syncNow()');
  assert.ok(rb.ok, JSON.stringify(rb));
  assert.deepStrictEqual(snap(b), offline);
  ok('a fresh profile restores the same cards, letters, XP and unit completion');

  // 5. Logging out and back in on the first profile changes nothing and uploads nothing new.
  await a.eval('logoutAccount()');
  assert.ok((await a.eval(`authRequest('login','${email}','correct-horse-battery')`)).ok);
  await a.eval('syncNow()');
  assert.deepStrictEqual(snap(a), offline);
  assert.strictEqual((await api('/v1/sync/changes?limit=500', a.eval('state.sync.account.token'))).data.events.length, eventsBefore);
  ok('logout and login again: progress unchanged, no new events');

  console.log(`\n${step}/${step} passed`);
  process.exit(0);
})().catch((e) => { console.log('FAIL - ' + (e && e.stack || e)); process.exit(1); });
