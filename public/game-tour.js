/* Storyland Quest – Automated Run-through.
   A narrated, step-based tour that operates the real prototype: real screens, battle engine, artwork and checks.
   - It runs in a throw-away synthetic session. Real saves are never read for play, never written, and are restored on exit.
   - Every AI segment is labelled: Live AI response, Saved AI response, Authored demo fixture, or Rule-based feedback.
   - A step defines: its screen (ensure), action (act), expected state (expect), caption, narration and how long to hold.
   - Nothing is recorded as learner evidence: the session lives only in memory. */
window.SQ_PARTS.push((G, C) => {
'use strict';
const { S, $, esc } = C, A = G.actions, D = G.D;
const CANCEL = { cancelled: true };
const AI_LABEL = { live: 'Live AI response', saved: 'Saved AI response', fixture: 'Authored demo fixture', rules: 'Rule-based feedback' };
const CHAPTERS = [['intro', 'Introduction'], ['battles', 'Battles'], ['pip', 'Ask Pip'], ['think', 'Explain My Thinking'], ['read', 'Reading Support'], ['pets', 'Companions and Rewards'], ['teach', 'Student Evidence'], ['parent', 'Parent Reports'], ['checks', 'AI Checks']];
const el = s => document.querySelector(s);
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const words = s => (String(s || '').match(/\S+/g) || []).length;
const estimate = t => Math.max(1.4, words(t) / 2.8 + .4) * 1000;

/* ================= runtime state ================= */
let T = null; // the live tour, or null
const SNAP = { s: null, ai: null, fetch: null, email: undefined, origin: 'home', realTraces: [] };

/* ================= sandbox: a separate synthetic session ================= */
function freshState() { return { profiles: [], current: null, settings: { ...SNAP.settings, sound: T.sfx, voice: T.narr, tutorVoice: false, narration: false, practice: false } }; }
function swapState(next) { Object.keys(S).forEach(k => delete S[k]); Object.assign(S, next); }
function enterSandbox() {
  SNAP.s = JSON.stringify(S); SNAP.settings = JSON.parse(SNAP.s).settings || {}; SNAP.realTraces = (JSON.parse(SNAP.s).traces || []).slice(0, 3);
  window.SQ_NOSAVE = true; swapState(freshState());
  const ai = C.AI(); SNAP.ai = { ...ai }; const wasLive = !!(ai.on && (ai.sample || ai.provider));
  Object.assign(ai, { on: true, fixture: true, live: wasLive, src: 'fixture', provider: wasLive ? ai.provider : 'Authored demo fixture' }); T.live = wasLive;
  window.SQ_FIX = { ai: aiHook, raw: rawHook };
  SNAP.fetch = window.fetch; SNAP.email = window.__sqEmail;
  window.fetch = function (u, o) { const url = String(u && u.url || u);
    if (/\/api\/email/.test(url)) return Promise.resolve(new Response(JSON.stringify({ ok: true, mode: 'dry-run', saved: 'nowhere, this is a demo preview' }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    if (/\/api\/status/.test(url)) return SNAP.fetch.apply(this, arguments).then(r => r.json()).then(j => new Response(JSON.stringify({ ...(j || {}), email: 'dry-run' }), { status: 200, headers: { 'Content-Type': 'application/json' } })).catch(() => new Response(JSON.stringify({ email: 'dry-run' }), { status: 200 }));
    return SNAP.fetch.apply(this, arguments); };
  window.__sqEmail = 'dry-run';
}
function leaveSandbox() {
  if (!SNAP.s) return;
  const ai = C.AI(); Object.keys(ai).forEach(k => delete ai[k]); Object.assign(ai, SNAP.ai || { on: false, provider: '', model: '' });
  window.SQ_FIX = null; if (SNAP.fetch) window.fetch = SNAP.fetch; window.__sqEmail = SNAP.email;
  swapState(JSON.parse(SNAP.s)); window.SQ_NOSAVE = false; SNAP.s = null; C.applySettings();
}

/* ================= authored demo fixtures (always labelled as fixtures) ================= */
const sentsOf = t => (String(t || '').match(/[^.!?]+[.!?]+/g) || [t]).map(x => x.trim()).filter(Boolean);
const FIX = {
  tutor(p) {
    const picked = String(p.picked || '').slice(0, 80), right = norm(p.correct), pass = String(p.passage || ''); let quote = '';
    if (pass) {
      const qw = new Set(norm(p.question).split(' ').filter(w => w.length > 3)); let best = null, sc = 0;
      sentsOf(pass).forEach(s => { const n = norm(s); if (right.length >= 4 && n.includes(right)) return; const c = n.split(' ').filter(w => qw.has(w)).length; if (c > sc) { sc = c; best = s; } });
      if (best && best.length <= 200 && pass.includes(best)) quote = best;
      return { reply: `Good question to ask.${picked ? ` “${picked}” is a tempting choice, but it does not match what the passage says.` : ''} Read the question again and find the one place in the passage that speaks to it. Then test each choice against that sentence.`, quote, check: 'Which choice does that sentence really support, and which one only sounds similar?' };
    }
    return { reply: `Good question to ask.${picked ? ` “${picked}” does not quite fit.` : ''} Try this: read the question again, say each choice out loud, and cross out any that do not fit the rule or the word. Then compare the two that are left.`, quote: '', check: 'What is the strongest clue in the question itself?' };
  },
  adapt(p) {
    const S1 = { s1: 'Rin put a telescope by a red bench.', s2: 'A tall tree hid the moon there.', s3: 'Rin took the telescope to the field.', s4: 'In the field, Rin could see the moon.', s5: 'The wind shook the tripod. The moon slid away.', s6: 'Rin moved the tripod behind a stone wall. The air was still there.', s7: 'The moon stayed in view. Rin drew it.' };
    if (p.target === 'harder') return { sentences: (p.sentences || []).map(x => ({ text: x.text.replace(/\.$/, '') + (x.id === 's4' ? ', and it stayed steady for 3 minutes.' : ', which mattered.'), from: [x.id] })), notes: 'Deliberately flawed example: it adds a number that is not in the original.' };
    return { sentences: (p.sentences || []).map(x => ({ text: S1[x.id] || x.text, from: [x.id] })), notes: 'Shorter sentences and easier words. Every fact is kept.' };
  },
  parent(p) {
    const s = p.stats || {}, name = Object.keys(s).filter(k => / percent$/.test(k)).sort((a, b) => s[a] - s[b])[0] || '';
    const sk = name.replace(/ percent$/, ''), pct = s[name];
    return { opening: 'Here is a short look at how your child’s reading practice went this week.',
      celebrate: `Your child practised on ${s.daysPractised} of the last 7 days and answered ${s.questionsAnswered} questions, with ${s.firstTryPercent === 'none' ? 0 : s.firstTryPercent}% right on the first try.`,
      practising: sk ? `We are practising ${sk.toLowerCase()}, where ${pct}% of first answers were right.` : 'No single skill stood out this week.',
      tryAtHome: ['Read one short text together and ask “what clue shows why?”.', 'Read together for 5 minutes and let your child retell what they remember.'],
      caution: 'These are practice answers from a game, not a test or a diagnosis. Please check them against what you see at home.' };
  },
  fluency(p) { const m = (p.missed || []).filter(Boolean); return { praise: 'You read most of the words smoothly. That takes practice.', tip: m.length ? `Say ${m.slice(0, 2).join(' and ')} slowly first, then read the sentence again.` : 'Try a slightly longer sentence next time.', practice: m.length ? `Say ${m[0]} slowly, then say it fast.` : '' }; }
};
const FIXG = {
  'explain-thinking'(inp) { const t = String(inp.text || ''), kw = new Set(norm((inp.clues || []).join(' ')).split(' ').filter(w => w.length > 4)), hit = norm(t).split(' ').some(w => kw.has(w));
    const ev = (t.split(/[,.;]/)[0] || '').trim();
    return { verdict: hit ? 'supported' : 'unsupported', evidence: hit ? ev : '', clue: (inp.clues || [])[0] || '', followUp: 'What else in the passage shows the same thing?', note: hit ? 'You pointed to the clue and linked it to the answer. That is real evidence.' : 'That is an idea, but the passage does not say it. Look at the clue again.' }; },
  'group-lesson'(inp) { const id = x => inp.passage.find(s => s.id === x); if (![2, 4, 5, 6, 7].every(n => id('s' + n))) return null;
    return { pattern: 'These learners picked a visible detail instead of the cause.', worked: { question: 'Why did Rin move the tripod behind a stone wall?', answer: 'The air was still there.', because: 'Wind had shaken the tripod, so Rin chose a spot without wind.', quote: 'where the air was still', sentenceId: 's6' },
      guided: [{ question: 'Why did Rin carry the telescope to the open field?', options: ['A tall tree hid the moon.', 'The field had a red bench.', 'The lens was too heavy.', 'Rin wanted to see the wind.'], answer: 0, quote: 'A tall tree hid the moon from that spot.', sentenceId: 's2' },
        { question: 'What made the moon slide out of view?', options: ['The wind shook the tripod.', 'A cloud covered it.', 'Rin turned off the lens.', 'A stone wall moved.'], answer: 0, quote: 'the wind shook the tripod', sentenceId: 's5' }],
      exit: { question: 'Why did Rin get to draw the moon?', options: ['The still air kept it in view.', 'The tree grew taller.', 'The telescope was bigger.', 'Rin sat on the red bench.'], answer: 0, quote: 'The moon stayed in view long enough', sentenceId: 's7' } }; },
  'tricky-practice'(inp) { const w = inp.words || []; if (!w.length) return null; const s1 = `Mia said the word ${w[0]} slowly and clearly.`, s2 = w[1] ? `Then she said ${w[1]} again, and it sounded easy.` : 'Then she said it again, and it sounded easy.';
    return { sentences: [s1, s2], question: { q: 'What did Mia do with the tricky word?', options: ['She said it slowly and clearly.', 'She hid it in a box.', 'She skipped it completely.', 'She spelled it backwards.'], answer: 0, quote: `said the word ${w[0]} slowly and clearly` } }; }
};
async function withTimeout(p, ms) { let t; try { return await Promise.race([p, new Promise((_, rej) => { t = setTimeout(() => rej(new Error('timeout')), ms); })]); } finally { clearTimeout(t); } }
async function aiHook(kind, params, live) {
  const tk = T && T.run; let res = null, src = 'fixture';
  if (T && T.useLive && C.AI().live) { try { res = await withTimeout(live(), 15000); } catch (e) { res = null; }
    if (res != null && kind === 'tutor' && G.tutorOk && !G.tutorOk(res, G.btx.ctx())) res = null;
    if (res != null) src = 'live'; }
  if (res == null) { await pause(1100); res = FIX[kind] ? FIX[kind](params) : null; src = 'fixture'; }
  if (T && T.run === tk) { C.AI().src = src; seen(kind, src); } else C.AI().src = src;
  return res;
}
async function rawHook(prompt, live) {
  const gc = window.SQ_GEN_CALL || {}; let res = null, src = 'fixture';
  if (T && T.useLive && C.AI().live) { try { res = await withTimeout(live(), 20000); } catch (e) { res = null; }
    if (res != null && gc.mode && gc.mode.validate && (gc.mode.validate(res, gc.input, gc.ctx) || []).length) res = null;
    if (res != null) src = 'live'; }
  if (res == null) { await pause(1100); res = FIXG[gc.id] ? FIXG[gc.id](gc.input) : null; src = 'fixture'; }
  C.AI().src = src; seen(gc.id || 'raw', src); return res;
}
const pause = ms => new Promise(r => setTimeout(r, ms));
function seen(kind, src) { if (!T) return; T.lastAI = { kind, src }; T.used.push({ kind, src, step: T.i }); badge(); }

/* ================= helpers bound to one run (cancellable, pausable) ================= */
function helpers(tok) {
  const alive = () => { if (!T || T.run !== tok) throw CANCEL; };
  const X = {
    async sleep(ms) { const want = ms * (T.mode === 'quick' ? .5 : .8); let acc = 0, last = performance.now(); while (acc < want) { alive(); await pause(40); const n = performance.now(); if (!T.paused) acc += Math.min(n - last, 1500); last = n; } alive(); },
    async gate() { while (T && T.paused && T.run === tok) await pause(60); alive(); },
    async until(fn, ms = 9000) { let t = 0, last = performance.now(); for (;;) { alive(); let v = false; try { v = fn(); } catch (e) { v = false; } if (v) return true; await pause(60); const n = performance.now(); if (!T.paused) t += Math.min(n - last, 1500); last = n; if (t > ms) return false; } },
    async find(sel, ms = 5000) { const get = () => typeof sel === 'function' ? sel() : typeof sel === 'string' ? el(sel) : sel; const ok = await X.until(() => { const e = get(); return e && (e.offsetParent !== null || getComputedStyle(e).position === 'fixed'); }, ms); return ok ? get() : null; },
    async press(sel, o = {}) { const e = await X.find(sel, o.wait || 5000); if (!e) throw new Error('Control not found: ' + (typeof sel === 'string' ? sel : 'dynamic')); await X.gate(); await X.look(e); await X.cursor(e); await X.sleep(o.pre == null ? 380 : o.pre); alive(); if (e.disabled) throw new Error('Control is disabled'); e.click(); await X.sleep(o.post == null ? 260 : o.post); return e; },
    async tryPress(sel, o) { try { return await X.press(sel, { wait: 2500, ...(o || {}) }); } catch (e) { if (e === CANCEL) throw e; T.errors.push({ id: (T.steps[T.i] || {}).id, msg: 'skipped: ' + String(e.message || e).slice(0, 60) }); return null; } },
    async look(e, soft) { alive(); if (!e) return; const r = e.getBoundingClientRect(), top = T.barH + 6, bot = innerHeight - 8; if (r.top < top || r.bottom > bot) { e.scrollIntoView({ block: r.height > innerHeight * .6 ? 'start' : 'center', behavior: C.calm() ? 'auto' : 'smooth' }); await X.sleep(420); } ring(e, soft); },
    async cursor(e) { alive(); const r = e.getBoundingClientRect(), c = el('#tour-cur'); if (c) { c.style.opacity = 1; c.style.transform = `translate(${Math.round(r.left + r.width * .6)}px,${Math.round(r.top + r.height * .6)}px)`; } await X.sleep(C.calm() ? 60 : 420); },
    unlook() { ring(null); const c = el('#tour-cur'); if (c) c.style.opacity = 0; },
    async type(sel, text, cps = 26) { const e = await X.find(sel); if (!e) throw new Error('Field not found'); await X.look(e); await X.cursor(e); e.focus(); e.value = ''; for (const ch of text) { alive(); await X.gate(); e.value += ch; e.dispatchEvent(new Event('input', { bubbles: true })); await pause(1000 / cps); } await X.sleep(250); },
    closeAll() { G.closePanel(); const r = el('.reveal'); if (r) r.remove(); const s = el('.story'); if (s) s.remove(); },
    tok
  };
  return X;
}

/* ================= overlay: banner, controls, captions, spotlight ================= */
function mount() {
  if (el('#tour')) return;
  const r = document.createElement('div'); r.id = 'tour'; r.className = 'tour'; r.setAttribute('role', 'region'); r.setAttribute('aria-label', 'Automated run-through');
  r.innerHTML = `<div class="tour-shield"></div><div class="tour-ring" id="tour-ring"></div><div class="tour-cur" id="tour-cur" aria-hidden="true">👆</div>
  <div class="tour-bar" id="tour-bar"><div class="tour-row r1"><span class="tour-badge"><span class="lg">🧪 DEMO SESSION · synthetic data · nothing here is saved</span><span class="sh">🧪 DEMO · synthetic · not saved</span></span><button class="tour-exit" data-tour="exit" type="button">✕ Exit Demo</button></div>
    <div class="tour-row r2"><div class="tour-ctl"><button type="button" data-tour="prev" aria-label="Previous step" title="Previous step">⏮</button><button type="button" data-tour="play" id="tour-play" aria-label="Pause" title="Pause or resume">⏸</button><button type="button" data-tour="next" aria-label="Next step" title="Next step">⏭</button><button type="button" data-tour="restart" aria-label="Restart" title="Restart the tour">↺</button></div>
      <div class="tour-tog"><button type="button" data-tour="narr" id="tour-narr" aria-pressed="true" title="Narration"><span class="ic">🗣</span><span class="tx"> Narration</span></button><button type="button" data-tour="sfx" id="tour-sfx" aria-pressed="true" title="Game sound effects"><span class="ic">🔔</span><span class="tx"> Sounds</span></button><button type="button" data-tour="caps" id="tour-caps" aria-pressed="true" title="Captions">CC</button></div></div>
    <div class="tour-row r3"><div class="tour-prog"><div class="tour-track" id="tour-track" role="progressbar" aria-label="Tour progress" aria-valuemin="0" aria-valuemax="100"><i id="tour-fill"></i></div><select id="tour-chap" aria-label="Chapter"></select></div></div>
    <div class="tour-cap" id="tour-cap" aria-live="polite"><span class="tour-ch" id="tour-ch"></span><span class="tour-ai" id="tour-ai" hidden></span><p id="tour-txt"></p></div></div>`;
  document.body.appendChild(r); document.body.classList.add('touring');
  r.addEventListener('click', onTourClick); sizeBar(); addEventListener('resize', sizeBar);
  let seenAt = 0; T.revTimer = setInterval(() => { const rv = el('.reveal'); if (!rv || !T || T.paused || T.holdReveal) { seenAt = 0; return; } if (!seenAt) { seenAt = Date.now(); return; } if (Date.now() - seenAt < 2600) return; const b = rv.querySelector('[data-a=rvNext]') || rv.querySelector('[data-a=rvGo]') || rv.querySelector('[data-a=rvSkip]'); if (b) b.click(); else rv.remove(); seenAt = 0; }, 300);
}
function unmount() { if (T && T.revTimer) clearInterval(T.revTimer); const r = el('#tour'); if (r) r.remove(); document.body.classList.remove('touring'); document.body.style.removeProperty('--tth'); removeEventListener('resize', sizeBar); }
function sizeBar() { const b = el('#tour-bar'); if (!b || !T) return; T.barH = b.offsetHeight; document.body.style.setProperty('--tth', T.barH + 'px'); }
let ringEl = null, ringSoft = false, ringRaf = 0;
function ring(e, soft) { ringEl = e || null; ringSoft = !!soft; const r = el('#tour-ring'); if (!r) return; if (!e) { r.style.opacity = 0; return; } r.style.opacity = 1; if (!ringRaf) loopRing(); }
function loopRing() { const r = el('#tour-ring'); if (!r || !ringEl || !document.contains(ringEl)) { ringRaf = 0; if (r) r.style.opacity = 0; return; } const b = ringEl.getBoundingClientRect(), pad = 6;
  r.style.transform = `translate(${Math.round(b.left - pad)}px,${Math.round(b.top - pad)}px)`; r.style.width = Math.round(b.width + pad * 2) + 'px'; r.style.height = Math.round(b.height + pad * 2) + 'px'; r.classList.toggle('soft', ringSoft); ringRaf = requestAnimationFrame(loopRing); }
function badge() { const b = el('#tour-ai'); if (!b || !T) return; const st = T.steps[T.i]; if (!st || !st.ai) { b.hidden = true; return; }
  let k = null; if (st.ai === 'rules') k = 'rules'; else if (st.ai === 'saved') k = null; else { const mine = T.used.filter(u => u.step === T.i); k = mine.length ? mine[mine.length - 1].src : st.badgeFn ? st.badgeFn() : st.reuse && T.used.length ? T.used[T.used.length - 1].src : null; }
  b.hidden = false; b.className = 'tour-ai ' + (k || 'wait'); b.textContent = k ? AI_LABEL[k] : 'AI segment · waiting for the response'; }
function caption(st) { const ch = el('#tour-ch'), tx = el('#tour-txt'); if (!ch || !tx) return; ch.textContent = (CHAPTERS.find(c => c[0] === st.ch) || [, ''])[1] + (st.title ? ' · ' + st.title : ''); tx.textContent = T.mode === 'quick' && st.sayQ ? st.sayQ : st.say; el('#tour-cap').classList.toggle('off', !T.caps); badge(); sizeBar(); }
function updateUI() { const fill = el('#tour-fill'); if (!fill || !T) return; const pct = Math.round(100 * (T.i + (T.done ? 1 : 0)) / T.steps.length); fill.style.width = pct + '%'; el('#tour-track').setAttribute('aria-valuenow', pct);
  const sel = el('#tour-chap'); if (sel) { const have = [...new Set(T.steps.map(s => s.ch))]; if (!sel.dataset.m || sel.dataset.m !== T.mode) { sel.innerHTML = have.map(k => `<option value="${k}">${(CHAPTERS.find(c => c[0] === k) || [, k])[1]}</option>`).join(''); sel.dataset.m = T.mode; } const cur = T.steps[T.i]; if (cur) sel.value = cur.ch; }
  const pl = el('#tour-play'); if (pl) { pl.textContent = T.done ? '▶' : T.paused ? '▶' : '⏸'; pl.setAttribute('aria-label', T.paused ? 'Play' : 'Pause'); }
  [['narr', T.narr], ['sfx', T.sfx], ['caps', T.caps]].forEach(([k, v]) => { const b = el('#tour-' + k); if (b) b.setAttribute('aria-pressed', String(!!v)); }); }
function onTourClick(e) { const b = e.target.closest('[data-tour]'); if (!b || !T) return; const k = b.dataset.tour;
  if (k === 'exit') return exitTour(); if (k === 'play') return T.done ? restart() : togglePause(); if (k === 'prev') return jump(T.i - 1); if (k === 'next') return jump(T.i + 1); if (k === 'restart') return restart();
  if (k === 'narr') { T.narr = !T.narr; S.settings.voice = T.narr; if (!T.narr) C.hush(); else if (T.line) startSpeech(); } if (k === 'sfx') { T.sfx = !T.sfx; S.settings.sound = T.sfx; } if (k === 'caps') T.caps = !T.caps; updateUI(); caption(T.steps[T.i] || T.steps[0]); }
document.addEventListener('change', e => { if (e.target && e.target.id === 'tour-chap' && T) { const k = e.target.value, i = T.steps.findIndex(s => s.ch === k); if (i >= 0) jump(i); } });
document.addEventListener('keydown', e => { if (!T || e.target.closest && e.target.closest('input,textarea,select')) return; if (e.key === 'Escape') { e.preventDefault(); exitTour(); } if (e.key === ' ' && !e.target.closest('button')) { e.preventDefault(); togglePause(); } });

/* ================= narration (pausable; falls back to a reading-time estimate) ================= */
function narrate(text) { return new Promise(res => { T.line = { text, res, gen: 0, t0: Date.now(), est: estimate(text), spoken: false }; startSpeech(); }); }
function startSpeech() { const L = T && T.line; if (!L) return; const gen = ++L.gen; C.hush(); clearTimeout(L.timer);
  const fin = () => { if (T && T.line === L && L.gen === gen && !T.paused) { T.line = null; clearTimeout(L.timer); L.res(); } };
  if (S.settings.voice && 'speechSynthesis' in window && !T.paused) { C.speak(L.text, fin, 1.08); L.timer = setTimeout(fin, L.est * 1.25 + 1200); }
  else L.timer = setTimeout(function chk() { if (!T || T.line !== L) return; if (T.paused) return (L.timer = setTimeout(chk, 120)); if (Date.now() - L.t0 >= L.est) return fin(); L.timer = setTimeout(chk, 120); }, 120); }
function togglePause() { if (!T || T.done) return; T.paused = !T.paused; if (T.paused) C.hush(); else if (T.line) { T.line.t0 = Date.now(); startSpeech(); } updateUI(); }

/* ================= the runner ================= */
function stepsFor(mode) { return ALL.filter(s => mode === 'full' ? !s.qOnly : s.q); }
async function runFrom(i) {
  const tok = ++T.run; T.i = i; T.done = false;
  while (T && T.run === tok && T.i < T.steps.length) {
    const st = T.steps[T.i]; updateUI(); caption(st);
    const t0 = Date.now(); T.times = T.times || {}; try { await runStep(tok, st); T.times[st.id] = Date.now() - t0; } catch (e) { if (e === CANCEL || !T || T.run !== tok) return; T.errors.push({ id: st.id, msg: String(e && e.message || e), at: String(e && e.stack || '').split('\n').slice(1, 9).join(' | ').split(location.origin).join('').slice(0, 700) }); tx('This part could not run here (' + String(e && e.message || e).slice(0, 80) + '). Continuing with the next step.', true); await pause(1800); }
    if (!T || T.run !== tok) return; T.i++;
  }
  if (T && T.run === tok) finish();
}
async function runStep(tok, st) {
  const X = helpers(tok), still = () => { if (!T || T.run !== tok) throw CANCEL; }; await X.gate(); still(); C.hush(); T.holdReveal = false;
  const line = narrate(T.mode === 'quick' && st.sayQ ? st.sayQ : st.say); T.used = T.used.filter(u => u.step !== T.i);
  if (st.ai === 'rules') badge();
  if (st.ensure) { await st.ensure(X); still(); }
  await X.gate(); still();
  if (st.act) await st.act(X);
  if (st.expect) { const ok = await X.until(() => st.expect(X), st.wait || 8000); if (!ok) { T.errors.push({ id: st.id, msg: 'expected state not reached' }); } }
  await line; await X.sleep(st.hold == null ? 500 : st.hold); X.unlook();
}
function tx(t, force) { const e = el('#tour-txt'); if (e) e.textContent = t; if (force) el('#tour-cap').classList.remove('off'); }
function jump(i) { if (!T) return; const n = Math.max(0, Math.min(T.steps.length - 1, i)); T.paused = false; T.line = null; C.hush(); ring(null); runFrom(n); }
function restart() { if (!T) return; T.run++; C.hush(); T.line = null; resetSession(); T.paused = false; T.used = []; T.errors = []; runFrom(0); }
function resetSession() { if (G.btx && G.btx.live()) { G.leave(true); dropStory(); } G.closePanel(); const r = el('.reveal'); if (r) r.remove(); const s = el('.story'); if (s) s.remove(); if (G.tutorReset) G.tutorReset(); swapState(freshState()); ctx.maya = null; ctx.nw = null; ring(null); }
function finish() { T.done = true; updateUI(); ring(null); const tx2 = el('#tour-txt'); if (tx2) tx2.textContent = 'That is the end of the run-through. Restart to watch it again, or exit to return to the prototype.'; el('#tour-ch').textContent = 'Finished'; const b = el('#tour-ai'); if (b) b.hidden = true; }
function exitTour() {
  if (!T) return; const origin = SNAP.origin; T.run += 5; C.hush(); T.line = null; ring(null);
  try { if (G.btx && G.btx.live()) { G.leave(true); dropStory(); } dropStory(); } catch (e) { /* ignore */ }
  G.closePanel(); document.querySelectorAll('.reveal,.story,.conf,.spark,.floaty,.flycoin,.proj').forEach(n => n.remove()); if (G.tutorReset) G.tutorReset();
  clearInterval(T.revTimer); T = null; leaveSandbox(); unmount();
  if (origin === 'dash') C.dash(); else if (S.qaOn && S.qa && S.current === 'qa') G.map(); else if (C.cur()) G.map(); else C.home(); }
function startTour(mode, useLive) {
  if (T) return; closeMenu(); SNAP.origin = el('.dtop') ? 'dash' : (S.qaOn ? 'qa' : 'home');
  T = { mode, steps: stepsFor(mode), i: 0, run: 0, paused: false, done: false, narr: S.settings.voice !== false, sfx: S.settings.sound !== false, caps: true, useLive: useLive !== false, line: null, used: [], errors: [], barH: 90, lastAI: null };
  C.hush(); G.closePanel(); if (G.btx && G.btx.live()) { G.leave(true); dropStory(); }
  enterSandbox(); mount(); C.home(); runFrom(0); }
function closeMenu() { G.closePanel(); }

/* ================= entry points ================= */
function menuHtml() { const live = !!(C.AI().on && (C.AI().sample || C.AI().provider)); return `<h2>▶ Automated run-through</h2>
  <p>A narrated tour that operates the real game, like a screen recording that plays itself. It runs in a <b>separate synthetic demo session</b>: your saved players are never changed.</p>
  <div class="tour-modes"><button class="btn big" data-a="tourStart" data-m="full">Full demo <small>about 9 minutes</small></button><button class="btn big" data-a="tourStart" data-m="quick">Quick overview <small>about 3 minutes</small></button></div>
  <p class="small">AI segments are labelled on screen: <b>Live AI response</b>, <b>Saved AI response</b>, <b>Authored demo fixture</b> or <b>Rule-based feedback</b>. ${live ? 'AI is connected, so replies are live when they arrive in time and pass the checks; otherwise an authored example is shown and labelled.' : 'No AI is connected, so authored examples are used and labelled. The tour works without a key.'} No email is ever sent: the parent report is a dry-run preview.</p>
  <div class="row left"><button class="btn ghost" data-a="gClose">Close</button></div>`; }
A.tourMenu = () => { if (T) return; G.panel(menuHtml()); };
A.tourStart = d => startTour(d.m === 'quick' ? 'quick' : 'full');
G.tourOpen = () => A.tourMenu();
G.tourMenuHtml = () => `<details open><summary>Automated Run-through</summary><p class="small">A narrated, automatic tour in a separate synthetic session.</p><div class="dm-row"><button class="btn sm" data-a="tourStart" data-m="full">Full demo (~9 min)</button><button class="btn sm" data-a="tourStart" data-m="quick">Quick overview (~3 min)</button></div></details>`;

/* ================= the demo students ================= */
const ctx = { maya: null, nw: null };
function mkAttempts(now) { const DAY = 864e5, out = []; let n = 0;
  const add = (d, skill, ok, first, assisted, stem, sel, right) => out.push({ id: 'ms' + (++n), itemId: 'mi' + n, skillId: skill, time: now - d * DAY - n * 6e4, turn: 0, attempt: first ? 1 : 2, chosenOptionId: ok ? 'right' : 'wrong', correct: ok, assisted, stem, selectedText: sel, correctText: right, source: 'synthetic', ...(!ok && skill === 'inference_causal' ? { reviewedWrongChoiceTag: 'selected_visible_detail_over_cause' } : {}) });
  [[6, 'reading', 1, 1], [6, 'vocab', 1, 1], [5, 'reading', 0, 1], [5, 'reading', 1, 0], [5, 'vocab', 1, 1], [4, 'inference_causal', 0, 1], [4, 'inference_causal', 0, 1], [4, 'vocab', 1, 1], [3, 'reading', 1, 1], [3, 'inference_causal', 1, 0], [2, 'reading', 1, 1], [2, 'vocab', 1, 1], [2, 'inference_causal', 0, 1], [1, 'reading', 1, 1], [1, 'vocab', 0, 1], [1, 'inference_causal', 1, 0], [0, 'reading', 1, 1], [0, 'vocab', 1, 1]]
    .forEach(([d, sk, ok, first]) => add(d, sk, !!ok, !!first, !first, 'Practice question ' + (n + 1), ok ? 'the correct choice' : 'a tempting detail', 'the correct choice')); return out; }
function makeMaya() {
  const p = C.newProfile('Maya', '🦄', 7); Object.assign(p, { id: 'demo-maya', demo: true, synthetic: true, tour: true, placed: true, avDone: false, coins: 420, tickets: 2, parentEmail: 'demo.parent@example.com', parentOK: true });
  G.migrate(p); p.zoo = []; p.team = [];
  const add = (fam, xp, name) => { const z = G.addInst(p, fam, { name, xp }); return z.iid; };
  const fams = D.families.filter(f => f.avail === 'starter').map(f => f.id); const f0 = fams[0] || 'dragon', f1 = fams[1] || 'cat', f2 = fams[2] || 'bird';
  p.team = [add(f0, 150, G.FAM[f0].name), add(f1, 40, G.FAM[f1].name), add(f2, 380, G.FAM[f2].name)]; p.pet = f0;
  p.bag = { clue: 3, look: 3, bubble: 3, double: 1 }; p.attempts = mkAttempts(Date.now());
  p.quest = { step: 'done' }; p.legacyOpen = false; p.stats = { wins: 9, bossWins: 4, byDest: { sound: { wins: 3 }, castle: { wins: 3 }, jungle: { wins: 3 }, station: { wins: 3 }, orchard: { wins: 3 }, mountain: { wins: 3 } }, correctSkill: {}, dailyClaims: 0 };
  p.ch = {}; ['sound', 'castle', 'jungle', 'station', 'orchard'].forEach(id => { p.ch[id] = { intro: 1, minions: 1, elite: 1, boss: 1, cleared: 1, replayDay: '' }; }); p.ch.mountain = { intro: 1, minions: 1, elite: 1, boss: 0, cleared: 0, replayDay: '' }; p.atlas = ['sound', 'castle', 'jungle', 'station', 'orchard'];
  p.skills.reading.m = 48; p.skills.vocab.m = 66; p.skills.grammar.m = 70; p.skills.phonics.m = 82; p.skills.spelling.m = 74; p.skills.sequence.m = 58; p.skills.writing.m = 52;
  p.room = { items: [], owned: ['scholar-desk', 'star-bed'], accent: 0, theme: 'lodge', pets: [] }; p.cosOwned = []; p.gear = { owned: [], on: {} };
  return p; }
function needMaya() { let p = S.profiles.find(x => x.id === 'demo-maya'); if (!p) { p = makeMaya(); S.profiles.unshift(p); } S.current = p.id; ctx.maya = p; return p; }

/* ================= battle helpers (they use the real battle actions) ================= */
const bt = () => G.btx.peek(), ph = () => (G.btx.cur() || {}).phase;
const live = () => G.btx && G.btx.live();
async function answer(X, ok) {
  const c = G.btx.ctx(); if (!c) throw new Error('no battle'); const it = c.item, B = bt();
  if (it.tiles) {
    if (ok) { const need = it.goal.length; for (let n = it.tray.length; n < need; n++) { const t = it.pool.find(x => x.t === it.goal[n]); if (!t) break; await X.press(`[data-a=bTile][data-w=p][data-id="${t.id}"]`, { pre: 120, post: 120 }); } }
    else { const bad = it.pool.slice(0, it.goal.length); let n = 0; for (const t of bad.reverse()) { if (n++ >= it.goal.length) break; await X.press(`[data-a=bTile][data-w=p][data-id="${t.id}"]`, { pre: 120, post: 120 }); } }
    await X.press('[data-a=bCheck]', { pre: 250 }); return; }
  const wrong = it.opts.find(o => o.id !== it.correctId && !B.state.out.includes(o.id));
  await X.press(`[data-a=bAns][data-id="${ok ? it.correctId : (wrong || it.opts[0]).id}"]`, { pre: 600 });
}
async function cast(X, support) { await X.until(() => ph() === 'ready', 8000); const sel = support ? '.mv.sup:not([disabled])' : '.mv:not(.sup):not([disabled])'; const b = el('#bt-sheet ' + sel) ? sel : '.mv:not([disabled])'; await X.press('#bt-sheet ' + b, { pre: 700, post: 100 }); await X.until(() => !live() || (!bt().busy && ['question', 'victory'].includes(ph())), 9000); }
async function startMountain(X, boss) { needMaya(); X.closeAll(); await leave(X); G.map(); await X.until(() => el('.ccard,.world,.trailpage')); if (boss) A.gChapter({ id: 'mountain', s: 'boss' }); else A.gBattle({ id: 'mountain', src: 'island' }); }
async function toPhase(X, want) { /* bring a fresh (non-boss) mountain battle to a phase, quickly, with the real actions */
  const order = { question: 0, retry: 1, ready: 2 };
  const usable = () => live() && bt().dest.id === 'mountain' && !bt().spec.boss && order[ph()] !== undefined && order[ph()] <= order[want] && !(want === 'question' && ph() === 'question' && bt().state.attempts.some(a => a.turn === bt().state.turn));
  if (!usable()) { await startMountain(X, false); await X.until(() => live() && ph() === 'question', 9000); }
  if (want === 'question') return;
  if (ph() === 'question') { await answer(X, want === 'ready'); await X.until(() => ph() === (want === 'ready' ? 'ready' : 'retry'), 6000); }
  if (want === 'ready' && ph() === 'retry') { await X.press('[data-a=bRetry]'); await answer(X, true); await X.until(() => ph() === 'ready', 6000); } }
const dropStory = () => { for (let n = 0; n < 5 && el('.story'); n++) A.stSkip(); };
const leave = async X => { if (live()) { G.leave(true); dropStory(); await X.sleep(150); dropStory(); } };
async function skipStory(X) { for (let n = 0; n < 12 && el('.story'); n++) { const b = el('.story [data-a=stNext]') || el('.story [data-a=stSkip]'); if (!b) break; b.click(); await X.sleep(500); } }

/* ================= the steps ================= */
const ALL = [];
const S_ = (o) => ALL.push(o);
const home = async X => { needNone(); X.closeAll(); await leave(X); };
function needNone() { if (S.profiles.some(p => p.id === 'demo-maya') && !ctx.maya) ctx.maya = null; }

S_({ id: 'intro-problem', ch: 'intro', q: true, title: 'The problem',
  say: 'Storyland Quest starts with a classroom problem: a teacher with twenty-five students cannot explain every mistake the moment it happens. An AI tutor, counted evidence and checked outputs help fill that gap.',
  sayQ: 'Students need different help, and a teacher cannot explain every mistake right away. An AI tutor helps.',
  ensure: async X => { X.closeAll(); await leave(X); swapState(freshState()); ctx.maya = null; ctx.nw = null; C.home(); await X.until(() => el('#app .card,#app main,#app .home,#app button')); }, act: async X => { const b = el('[data-a=newP]'); if (b) await X.look(b, true); }, hold: 900 });

S_({ id: 'intro-create', ch: 'intro', q: true, title: 'Character creation',
  say: 'A new player creates a character: pick a look, type a nickname and choose a grade from one to eight. A parent email is optional and only used for weekly reports.',
  sayQ: 'A new player picks a look, a nickname and a grade. A parent email is optional.',
  ensure: async X => { X.closeAll(); await leave(X); if (!el('#nm')) { swapState(freshState()); ctx.nw = null; C.home(); await X.until(() => el('[data-a=newP]')); await X.press('[data-a=newP]'); } await X.find('#nm'); },
  act: async X => { await X.press('[data-a=gAvStep][data-k=hair][data-s="1"]', { pre: 300 }); await X.press('[data-a=gAvSet][data-k=hairColor]:nth-child(3)', { pre: 250 }); await X.type('#nm', 'Sam', 12); await X.press('[data-a=gGrade][data-v="3"]'); const m = el('.optmail'); if (m) { m.open = true; await X.look(m, true); await X.sleep(1500); } await X.press('[data-a=gAvSave]'); },
  expect: () => el('.eggpage,.eggs,.eggs2') || el('.pip'), hold: 400 });

S_({ id: 'intro-egg', ch: 'intro', q: true, title: 'Choosing an egg',
  say: 'Next the player chooses an egg. Each species hatches into its own baby, then grows into a juvenile and an adult as it levels up. Winning battles is how it hatches.',
  sayQ: 'The player chooses an egg. Each species hatches into its own baby, then grows.',
  ensure: async X => { X.closeAll(); await leave(X); const p = S.profiles.find(x => x.id === 'demo-new'); if (!p || p.zoo.length) { swapState(freshState()); const n = C.newProfile('Sam', '🦁', 3); Object.assign(n, { id: 'demo-new', demo: true, synthetic: true, tour: true }); S.profiles = [n]; S.current = n.id; ctx.nw = n; G.map(); } await X.until(() => el('.eggs2,.eggs')); },
  act: async X => { const eggs = [...document.querySelectorAll('[data-a=gEgg]')]; await X.look(el('.eggs2,.eggs'), true); await X.sleep(1500); const pick = eggs.find(b => /bird/i.test(b.getAttribute('aria-label') || b.textContent)) || eggs[0]; await X.press(pick); },
  expect: () => el('.warmintro') || el('.eggbig'), hold: 400 });

S_({ id: 'intro-mission', ch: 'intro', q: true, title: 'The first mission',
  say: 'The first mission is Pip\'s Warm-Up: a few easy questions where right answers crack the egg open. The player\'s next action is one tap on, Help Pip hatch my egg.',
  sayQ: 'The first mission is a short warm-up: right answers crack the egg open.',
  ensure: async X => { X.closeAll(); await leave(X); let p = S.profiles.find(x => x.id === 'demo-new'); if (!p) { const n = C.newProfile('Sam', '🦁', 3); Object.assign(n, { id: 'demo-new', demo: true, synthetic: true, tour: true }); S.profiles = [n]; S.current = n.id; p = n; }
    S.current = p.id; if (!p.zoo.length) { const f = D.families.find(x => x.avail === 'starter' && /bird/i.test(x.name)) || D.families.find(x => x.avail === 'starter'); A.gEgg({ f: f.id }); } else G.warmIntro(); await X.until(() => el('.warmintro')); },
  act: async X => { await X.look(el('.eggbig'), true); await X.sleep(1800); await X.press('[data-a=gWarmGo]'); },
  expect: () => live(), hold: 600 });

S_({ id: 'bt-map', ch: 'battles', q: true, title: 'Chapter and goal',
  say: 'From here the tour uses Maya, a prepared synthetic student with three companions. Her map shows the current chapter, the next step, and what finishing it unlocks: here, the Story Mountain boss.',
  sayQ: 'Now Maya, a prepared synthetic student. Her map shows the chapter goal and what it unlocks.',
  ensure: async X => { needMaya(); X.closeAll(); await leave(X); G.map(); await X.until(() => el('.ccard')); },
  act: async X => { await X.look(el('.ccard'), true); await X.sleep(1800); const t = el('.trail'); if (t) await X.look(t, true); }, hold: 700 });

S_({ id: 'bt-boss', ch: 'battles', title: 'Boss introduction',
  say: 'Selecting the boss step opens a short introduction. It names the villain and states the goal: answer enough different questions correctly to make it surrender.',
  sayQ: 'The boss opens with an introduction that states the chapter goal.',
  ensure: async X => { needMaya(); X.closeAll(); await leave(X); G.map(); await X.until(() => el('.ccard [data-a=trailGo]')); },
  act: async X => { await X.press('.ccard [data-a=trailGo]'); await X.sleep(2600); await skipStory(X); },
  expect: () => live() && ph() === 'question', wait: 15000, hold: 400 });

S_({ id: 'bt-question', ch: 'battles', title: 'The question',
  say: 'The question comes with its passage. Your companion\'s health is on the left and the villain\'s Resolve is on the right. A highlighted clue appears in the passage after each answer.',
  sayQ: 'The question comes with its passage. Companion health is on the left, the villain\'s Resolve on the right.',
  ensure: async X => { if (!(live() && bt().spec.boss && ph() === 'question')) { needMaya(); X.closeAll(); await leave(X); G.map(); await X.until(() => el('.ccard')); A.gChapter({ id: 'mountain', s: 'boss' }); await X.sleep(600); await skipStory(X); await X.until(() => live() && ph() === 'question', 12000); } },
  act: async X => { const q = el('#bt-q .q'); if (q) await X.look(q, true); await X.sleep(1500); await X.look(el('#hp-me'), true); await X.sleep(1300); await X.look(el('#hp-foe'), true); await X.sleep(1200); }, hold: 500 });

S_({ id: 'bt-wrong', ch: 'battles', q: true, title: 'A wrong answer',
  say: 'Here is a deliberate wrong answer. The villain counterattacks and the companion loses health. The feedback explains why that choice was tempting, and the question can be tried again.',
  sayQ: 'A wrong answer: the villain counterattacks, and the feedback explains why that choice was tempting.',
  ensure: async X => { if (!(live() && ph() === 'question' && !bt().state.attempts.length)) { await toPhase(X, 'question'); } },
  act: async X => { await answer(X, false); await X.until(() => ph() === 'retry', 6000); await X.look(el('#hp-me'), true); await X.sleep(2400); const f = el('#bt-fb .fb'); if (f) await X.look(f, true); await X.sleep(1500); },
  expect: () => ph() === 'retry', hold: 500 });

S_({ id: 'bt-right', ch: 'battles', q: true, title: 'A right answer unlocks a move',
  say: 'After another try, the right answer unlocks a move. The highlighted words show the clue, and the move tray opens at the bottom while the arena stays in view.',
  sayQ: 'A right answer unlocks a move, and the highlighted words show the clue.',
  ensure: async X => { if (!live() || !['retry', 'question'].includes(ph())) await toPhase(X, 'retry'); },
  act: async X => { if (ph() === 'retry') await X.press('[data-a=bRetry]'); await answer(X, true); await X.until(() => ph() === 'ready', 6000); const m = el('mark.cite'); if (m) await X.look(m, true); await X.sleep(1400); await X.look(el('#bt-sheet'), true); await X.sleep(1300); },
  expect: () => ph() === 'ready', hold: 400 });

S_({ id: 'bt-move', ch: 'battles', title: 'The move',
  say: 'Choosing a move plays its animation while the battle stays in view. This is the first companion\'s move.',
  sayQ: 'Choosing a move plays its attack animation.',
  ensure: async X => { if (!live() || ph() !== 'ready') await toPhase(X, 'ready'); },
  act: async X => { await cast(X); await X.sleep(900); }, expect: () => ph() === 'question' || ph() === 'victory', hold: 600 });

S_({ id: 'bt-swap', ch: 'battles', title: 'Another companion',
  say: 'Before answering, a player can swap to a reserve companion for free. Here is the second pet, and its own, different move after a right answer.',
  ensure: async X => { if (!live() || ph() !== 'question' || bt().state.attempts.some(a => a.turn === bt().state.turn)) await toPhase(X, 'question'); },
  act: async X => { await X.look(el('#bt-team'), true); await X.sleep(1300); const sw = el('[data-a=bSwap]:not([disabled])'); if (sw) await X.press(sw, { pre: 600 }); await X.sleep(1500); await answer(X, true); await cast(X); }, expect: () => ph() === 'question' || ph() === 'victory', wait: 14000, hold: 500 });

S_({ id: 'bt-bag', ch: 'battles', title: 'An item from the bag',
  say: 'The battle bag holds helpers. Second Look crosses out one wrong choice, and the turn is marked as helped, which matters for the evidence later.',
  sayQ: 'The bag\'s Second Look crosses out a wrong choice and marks the turn as helped.',
  ensure: async X => { if (!live() || ph() !== 'question' || bt().state.attempts.some(a => a.turn === bt().state.turn)) await toPhase(X, 'question'); },
  act: async X => { await X.look(el('.bt-bag'), true); await X.sleep(1200); await X.press('[data-a=bLook]', { pre: 600 }); await X.sleep(1400); await answer(X, true); await X.until(() => ph() === 'ready', 6000); await cast(X); }, expect: () => ph() === 'question' || ph() === 'victory', wait: 14000, hold: 400 });

S_({ id: 'bt-finish', ch: 'battles', q: true, title: 'Finishing and the chest',
  say: 'The encounter ends when enough different questions are right. The chest pays coins, an Atlas page and a sticker. In the quick tour the remaining turns are skipped and marked as simulated.',
  sayQ: 'The chest pays coins and an Atlas page. In this quick tour the turns are skipped and marked simulated.',
  ensure: async X => { if (!live()) { await startMountain(X, true); await skipStory(X); await X.until(() => live() && ph() === 'question', 12000); } },
  act: async X => { if (T.mode === 'quick') { G.btx.resolve(); } else { for (let n = 0; n < 8 && live() && ph() !== 'victory'; n++) { if (ph() === 'question') { await answer(X, true); await X.until(() => ph() === 'ready', 6000); } if (ph() === 'ready') await cast(X); } }
    await X.until(() => ph() === 'victory' || (live() && el('[data-a=bClaim]')), 9000); await X.sleep(900); await X.press('[data-a=bClaim]', { pre: 900 }); await X.until(() => el('.rlist'), 6000); await X.sleep(2600); },
  expect: () => el('.rlist'), wait: 12000, hold: 800 });

S_({ id: 'bt-unlock', ch: 'battles', title: 'Next chapter unlocked',
  say: 'After the chapter-cleared scene, the map shows Writer\'s Cove is open. One receipt pays everything once, and the demo cannot pay it twice.',
  sayQ: 'The next chapter is now open on the map.',
  ensure: async X => { if (live() && !el('.rlist') && el('[data-a=bClaim]')) { await X.press('[data-a=bClaim]'); await X.sleep(1500); } },
  act: async X => { for (let n = 0; n < 6 && el('.story'); n++) { const b = el('.story [data-a=stNext]'); if (!b) break; await X.press(b, { pre: 1500 }); } const lv = el('[data-a=bLeave]'); if (lv) await X.press(lv); await X.until(() => !live() && el('.trail'), 8000); needMaya(); await X.look(el('.trail'), true); await X.sleep(1500); const open = el('.stop.current,.stop.open'); if (open) await X.look(open, true); },
  hold: 800 });


/* ---------- 3. Ask Pip ---------- */
const PIPQ = 'Why is my answer wrong? Give me a hint, but don’t tell me the answer.';
async function askPipFlow(X) {
  for (let n = 0; n < 2 && !el('#tut-in'); n++) { await X.press('#bt-fb [data-a=tutOpen], [data-a=tutOpen]', { pre: 700, wait: 9000 }); await X.sleep(700); }
  await X.type('#tut-in', PIPQ, 30); await X.sleep(500);
  await X.press('[data-a=tutSend]', { pre: 500 });
  await X.until(() => el('.tut-pip') || el('.tut-log .small[role=status]'), 25000);
}
S_({ id: 'pip-ask', ch: 'pip', q: true, title: 'Asking Pip', ai: true,
  say: 'After a deliberate wrong answer the student opens Ask Pip and types a question. Pip receives the real question, the options, the chosen answer, the passage and the grade, and is told never to reveal the answer.',
  sayQ: 'The student asks Pip in their own words. Pip gets the real question, options, chosen answer, passage and grade.',
  ensure: async X => { if (!(live() && ph() === 'retry' && !bt().spec.boss && bt().dest.id === 'mountain')) { await toPhase(X, 'question'); await answer(X, false); await X.until(() => ph() === 'retry', 6000); } },
  act: async X => { await askPipFlow(X); }, expect: () => el('.tut-pip'), wait: 26000, hold: 400 });

S_({ id: 'pip-reply', ch: 'pip', reuse: true, title: 'Pip’s reply', ai: true,
  say: 'The reply is checked before it is shown. The checks reject answer leaks, invented quotes, links and requests for personal information. This one gives a hint and a clue sentence, not the answer.',
  sayQ: 'The reply is checked first: no answer leaks and no invented quotes.',
  ensure: async X => { if (!el('.tut-pip')) { if (!(live() && ph() === 'retry')) { await toPhase(X, 'question'); await answer(X, false); await X.until(() => ph() === 'retry', 6000); } if (!el('#tut-in')) await askPipFlow(X); } },
  act: async X => { const r = el('.tut-pip'); if (r) await X.look(r, true); await X.sleep(1500); const t = el('.tut-tag'); if (t) await X.look(t, true); await X.sleep(800); }, hold: 500 });

S_({ id: 'pip-retry', ch: 'pip', q: true, title: 'A helped retry', ai: 'rules',
  say: 'Back to the question. A right answer after help still earns the move and a small coin bonus, and asking never costs anything. But it is recorded as helped, separate from an independent first attempt.',
  sayQ: 'The retry earns a small bonus, and is recorded as helped, not as an independent attempt.',
  ensure: async X => { if (!(live() && ph() === 'retry' && el('.tut-pip') || !live() && 0)) { if (!(live() && ph() === 'retry')) { await toPhase(X, 'question'); await answer(X, false); await X.until(() => ph() === 'retry', 6000); } if (!el('.tut-pip')) await askPipFlow(X); } },
  act: async X => { await X.tryPress('[data-a=tutClose]'); await X.until(() => !el('.pwrap'), 3000); await X.press('[data-a=bRetry]'); await answer(X, true); await X.until(() => ph() === 'ready', 6000); const m = el('.bt-msg'); if (m) await X.look(m, true); await X.sleep(2200); },
  expect: () => ph() === 'ready', hold: 400 });

S_({ id: 'pip-fresh', ch: 'pip', title: 'A fresh question next', ai: 'rules',
  say: 'The next question is fresh, on the same skill. That independent first attempt is what counts as evidence, not the helped retry.',
  ensure: async X => { if (!live() || !['ready', 'question'].includes(ph())) { await toPhase(X, 'ready'); } },
  act: async X => { if (ph() === 'ready') await cast(X); await X.until(() => ph() === 'question' || ph() === 'victory', 8000); const q = el('#bt-q .q'); if (q) await X.look(q, true); await X.sleep(1800); }, hold: 400 });

S_({ id: 'pip-qonly', ch: 'pip', title: 'Beyond passages', ai: true,
  say: 'Pip also works on questions with no passage, such as vocabulary. It then explains the rule behind the question using only the question, options and the student\'s choice.',
  ensure: async X => { needMaya(); X.closeAll(); await leave(X); G.map(); await X.until(() => el('.trail,.isles')); A.gBattle({ id: 'jungle', src: 'island' }); await X.until(() => live() && ph() === 'question', 9000); },
  act: async X => { await answer(X, false); await X.until(() => ph() === 'retry', 6000); await X.sleep(900); await X.press('#bt-fb [data-a=tutOpen], [data-a=tutOpen]', { pre: 600, wait: 9000 }); await X.type('#tut-in', PIPQ, 40); await X.press('[data-a=tutSend]'); await X.until(() => el('.tut-pip') || el('.tut-log .small[role=status]'), 25000); const r = el('.tut-pip'); if (r) await X.look(r, true); await X.sleep(1500); },
  expect: () => el('.tut-pip'), wait: 26000, hold: 500 });

/* ---------- 4. Explain My Thinking ---------- */
async function seedThinking(X) { const m = needMaya(); if ((m.thinking || []).length >= 2) return; await toPhase(X, 'ready'); A.exOpen(); A.exGuess(); A.exClose(); await cast(X); await X.until(() => ph() === 'question' || ph() === 'victory', 8000); if (ph() === 'question') { await answer(X, true); await X.until(() => ph() === 'ready', 6000); const c = G.btx.ctx(), cs = c.item.cites[0]; A.exOpen(); const b = el(`[data-a=exPick][data-id="${cs.sentenceId}"]`); if (b) b.click(); A.exClose(); } await leave(X); }
S_({ id: 'think-guess', ch: 'think', q: true, title: 'A guess is not a reason', ai: 'rules',
  say: 'After a right answer the student can say what helped. Tapping, I guessed, is judged by rules, not AI: it is not yet supported by the text, so the clue is shown. The score does not change.',
  sayQ: 'Tapping, I guessed, shows the clue to revisit. The score does not change.',
  ensure: async X => { if (!(live() && ph() === 'ready' && !bt().spec.boss && bt().dest.id === 'mountain' && el('[data-a=exOpen]'))) await toPhase(X, 'ready'); },
  act: async X => { await X.look(el('#bt-fb .fb'), true); await X.sleep(900); await X.press('[data-a=exOpen]', { pre: 600 }); await X.sleep(900); await X.press('[data-a=exGuess]', { pre: 700 }); await X.sleep(1800); const q = el('.tut-q'); if (q) await X.look(q, true); await X.sleep(1500); },
  expect: () => el('.tg-chip'), hold: 400 });
S_({ id: 'think-supported', ch: 'think', title: 'An explanation backed by the text', ai: 'rules',
  say: 'On the next question the student taps the sentence that decides the answer. Rules match it to the reviewed clue and mark it evidence-backed, so the suggested practice changes.',
  ensure: async X => { const done = () => { const c = live() && G.btx.ctx(); return c && (needMaya().thinking || []).some(t => t.qid === c.qid); };
    if (!(live() && ph() === 'ready' && bt().dest.id === 'mountain' && !bt().spec.boss)) await toPhase(X, 'ready');
    if (done()) { G.closePanel(); await cast(X); await X.until(() => ph() === 'question', 8000); await answer(X, true); await X.until(() => ph() === 'ready', 6000); } },
  act: async X => { await X.tryPress('[data-a=exOpen]', { pre: 500 }); await X.sleep(900); const c = G.btx.ctx(); const id = c && c.item.cites && c.item.cites[0].sentenceId; await X.press(`[data-a=exPick][data-id="${id}"]`, { pre: 900 }); await X.sleep(2200); },
  expect: () => el('.tg-chip.ok'), hold: 500 });
S_({ id: 'think-typed', ch: 'think', title: 'Typed explanations', ai: true,
  say: 'Older learners can type their reasoning. The model judges it against the clue, and the reply must quote the student\'s own words and an exact piece of the passage to be accepted.',
  ensure: async X => { if (!(live() && ph() === 'ready' && el('[data-a=exOpen]'))) await toPhase(X, 'ready'); },
  act: async X => { await X.tryPress('[data-a=exClose]'); await X.press('[data-a=exOpen]', { pre: 500 }); await X.sleep(700); const ta = el('#ex-text'); if (ta) { await X.type('#ex-text', 'The author said the clue directly, so I matched it to my answer because the passage supports it.', 34); await X.press('[data-a=exSend]', { pre: 500 }); await X.until(() => el('.tg-chip') && !el('#ex-text'), 25000); await X.sleep(1800); } },
  hold: 400 });
S_({ id: 'think-teacher', ch: 'think', title: 'Teacher confirms the plan', ai: 'rules',
  say: 'On the dashboard each explanation sits beside the reviewed clue. The suggested practice is only a proposal: the teacher confirms one and dismisses another. Neither changes the original score.',
  sayQ: 'The teacher confirms or dismisses each suggested practice. Scores never change.',
  ensure: async X => { needMaya(); X.closeAll(); await seedThinking(X); S.current = null; await leave(X); C.dash(); await X.until(() => el('#excard table')); },
  act: async X => { const c = el('#excard'); await X.look(c.querySelector('h2'), true); await X.sleep(1400); const tb = c.querySelector('table'); if (tb) await X.look(tb, true); await X.sleep(1500); await X.tryPress('#excard [data-a=exApprove]', { pre: 700 }); await X.sleep(700); await X.tryPress('#excard [data-a=exDismiss]', { pre: 700 }); await X.sleep(1000); }, hold: 500 });

/* ---------- 5. Reading support ---------- */
async function openTeacher(X) { needMaya(); X.closeAll(); await leave(X); S.current = null; C.dash(); await X.until(() => el('#tcard')); const t = window.SQ_TEACH_API; if (t && t.demoReady) t.demoReady(); await X.until(() => el('#tcard .tg-ev')); }
S_({ id: 'read-adapt', ch: 'read', q: true, title: 'Reading-level adapter', ai: true,
  say: 'A teacher can ask Pip to rewrite a passage at an easier level. The rewrite must cover every original sentence and add no new numbers or names, and a formula measures the new level.',
  sayQ: 'Pip rewrites a passage more simply. Checks require every fact kept, and a formula measures the level.',
  ensure: async X => { await openTeacher(X); const d = [...document.querySelectorAll('#tcard details.tg-change')].find(x => /Reading-level adapter/.test(x.textContent)); if (d) d.open = true; await X.until(() => el('[data-a=tgAdapt][data-t=simpler]')); },
  act: async X => { await X.press('[data-a=tgAdapt][data-t=simpler]', { pre: 700 }); await X.until(() => el('#tcard .tg-mode.live') || el('#tcard .tg-rej'), 25000); const tb = el('#tcard .tg-mode.live'); if (tb) await X.look(tb.nextElementSibling || tb, true); await X.sleep(2500); },
  expect: () => el('#tcard .tg-mode.live'), wait: 26000, hold: 400 });
S_({ id: 'read-reject', ch: 'read', title: 'A rewrite that is rejected', ai: true,
  say: 'This second request is a deliberately flawed example. It adds a number that is not in the original, so the checks reject it and list why. A rejected rewrite never reaches a student.',
  sayQ: 'A deliberately flawed rewrite adds a number, so the checks reject it.',
  ensure: async X => { if (!el('[data-a=tgAdapt][data-t=harder]')) { await openTeacher(X); const d = [...document.querySelectorAll('#tcard details.tg-change')].find(x => /Reading-level adapter/.test(x.textContent)); if (d) d.open = true; await X.until(() => el('[data-a=tgAdapt][data-t=harder]')); } },
  act: async X => { await X.press('[data-a=tgAdapt][data-t=harder]', { pre: 700 }); await X.until(() => el('#tcard .tg-rej'), 25000); const r = el('#tcard .tg-rej'); if (r) await X.look(r, true); await X.sleep(2600); },
  expect: () => el('#tcard .tg-rej'), wait: 26000, hold: 400 });
async function toMap(X) { needMaya(); X.closeAll(); await leave(X); G.map(); await X.until(() => el('.trail')); }
S_({ id: 'read-coach', ch: 'read', q: true, title: 'Reading coach', ai: true,
  say: 'The reading coach listens through the microphone. With no microphone, the student taps the tricky words instead. Rules count the words, and AI writes only a short coaching note.',
  sayQ: 'With no microphone, the student taps tricky words. Rules count them; AI writes only the note.',
  ensure: async X => { await toMap(X); await X.until(() => el('[data-a=flStart]')); },
  act: async X => { await X.press('[data-a=flStart]'); await X.sleep(900); const mb = el('[data-a=flManual]'); if (mb) await X.press(mb, { pre: 700 }); await X.until(() => el('.flw[data-a=flTap]')); const ids = [...document.querySelectorAll('.flw[data-a=flTap]')].sort((a, b) => b.textContent.length - a.textContent.length).slice(0, 2).map(w => w.dataset.i); for (const i of ids) await X.press(`.flw[data-a=flTap][data-i="${i}"]`, { pre: 350, post: 200 }); await X.sleep(700); await X.press('[data-a=flManualGo]', { pre: 600 }); await X.until(() => el('#flcoach .tut-tag'), 25000); const c = el('#flcoach'); if (c) await X.look(c, true); await X.sleep(2200); },
  expect: () => el('#flcoach .tut-tag'), wait: 26000, hold: 400 });
S_({ id: 'read-practice', ch: 'read', title: 'Tricky words become practice', ai: true,
  say: 'The tricky words become a short practice text, and every word is checked to appear in it. Then an independent read counts how many of those words went right this time.',
  sayQ: 'Tricky words feed a practice text, then an independent read checks them.',
  ensure: async X => { if (!el('[data-a=flPractice]')) { await toMap(X); await X.press('[data-a=flStart]'); const mb = el('[data-a=flManual]'); if (mb) await X.press(mb); await X.until(() => el('.flw[data-a=flTap]')); const ids = [...document.querySelectorAll('.flw[data-a=flTap]')].sort((a, b) => b.textContent.length - a.textContent.length).slice(0, 2).map(w => w.dataset.i); ids.forEach(i => { const w = el(`.flw[data-a=flTap][data-i="${i}"]`); if (w) w.click(); }); await X.press('[data-a=flManualGo]'); await X.until(() => el('[data-a=flPractice]'), 25000); } },
  act: async X => { await X.press('[data-a=flPractice]', { pre: 600 }); await X.until(() => el('[data-a=flPracRead]'), 25000); const pr = el('[data-a=flPracRead]'); await X.look(pr.closest('.ccard') || pr, true); await X.sleep(2000); await X.press(pr, { pre: 500 }); await X.sleep(800); const mb = el('[data-a=flManual]'); if (mb) await X.press(mb); await X.sleep(500); await X.press('[data-a=flManualGo]', { pre: 800 }); await X.until(() => /Independent check/.test(document.body.textContent), 8000); const r = [...document.querySelectorAll('.flsent ~ p b, .echopage p b')].find(b => /Independent check/.test(b.textContent)); if (r) await X.look(r, true); await X.sleep(2200); },
  expect: () => /Independent check/.test(document.body.textContent), wait: 26000, hold: 400 });

/* ---------- 6. Companions and rewards ---------- */
const famOf = () => { const m = ctx.maya || needMaya(); return m.pet || (D.families.find(f => f.avail === 'starter') || {}).id; };
S_({ id: 'pets-reveal', ch: 'pets', q: true, title: 'Hatching and evolution',
  say: 'An egg hatches into its matching baby, and as a companion levels up it evolves from baby to juvenile to adult. These are the game\'s own reveal screens, played as previews.',
  sayQ: 'An egg hatches into its matching baby, then evolves to juvenile and adult.',
  ensure: async X => { await toMap(X); },
  act: async X => { const fam = (D.families.find(f => f.avail === 'starter' && /bird/i.test(f.name)) || D.families[0]).id; const kinds = T.mode === 'quick' ? ['hatch', 'evolve-2'] : ['hatch', 'level-up', 'evolve-1', 'evolve-2']; T.holdReveal = true;
    for (const k of kinds) { G.revealPreview(fam, k); await X.until(() => el('.reveal'), 5000); await X.sleep(T.mode === 'quick' ? 3200 : 4200); for (let n = 0; n < 5 && el('.reveal'); n++) { const b = el('.reveal [data-a=rvNext]') || el('.reveal [data-a=rvGo]') || el('.reveal [data-a=rvSkip]'); if (!b) break; b.click(); await X.sleep(700); } const r = el('.reveal'); if (r) r.remove(); await X.sleep(300); } T.holdReveal = false; }, hold: 300 });
S_({ id: 'pets-team', ch: 'pets', title: 'Collection, team and moves',
  say: 'The Library holds the collection, the three-pet team and each pet\'s moves. The Move Book previews a move in an arena without recording any battle.',
  sayQ: 'The Library holds the collection, the team of three and the Move Book.',
  ensure: async X => { await toMap(X); await X.press('.gnav [data-a=gLibrary]'); await X.until(() => el('[data-a=gLibTab]')); },
  act: async X => { const t = el('.tstrip,.team,.lib'); await X.look(el('[data-a=gLibTab]').parentElement, true); await X.sleep(1500); await X.tryPress('[data-a=gLibTab][data-tab=moves]'); await X.sleep(1200); const pv = el('[data-a=gPreview]'); if (pv) { await X.press(pv, { pre: 600 }); await X.sleep(2500); } else { const eq = el('[data-a=gEquip]'); if (eq) await X.look(eq, true); await X.sleep(1500); } await X.tryPress('[data-a=gLibTab][data-tab=stickers]'); await X.sleep(1500); void t; }, hold: 300 });
S_({ id: 'pets-shop', ch: 'pets', title: 'Shop and food',
  say: 'The shop sells food, pet items, bag helpers, gear and furniture, all paid for with coins earned in play. Buying food feeds a companion.',
  ensure: async X => { await toMap(X); await X.press('.gnav [data-a=gShop]'); await X.until(() => el('[data-a=gBuy]')); },
  act: async X => { const before = (ctx.maya || needMaya()).coins; await X.look(el('[data-a=gBuy]'), true); await X.sleep(1500); await X.tryPress('[data-a=gBuy][data-id=apple]', { pre: 700 }); await X.sleep(1500); const c = el('#coinc'); if (c) await X.look(c, true); await X.sleep(1000); void before; }, hold: 300 });
S_({ id: 'pets-room', ch: 'pets', title: 'Pet room and gear',
  say: 'The pet room lets players place furniture, greet companions and open the wardrobe. These are rewards for practice and never affect scoring.',
  ensure: async X => { await toMap(X); await X.press('.gnav [data-a=gRoom]'); await X.until(() => el('[data-a=gGreet]')); },
  act: async X => { await X.tryPress('[data-a=gGreet]', { pre: 600 }); await X.sleep(1500); await X.tryPress('[data-a=gMode][data-m=edit]', { pre: 600 }); await X.sleep(1200); await X.tryPress('[data-a=gWardrobe]', { pre: 600 }); await X.sleep(1800); }, hold: 300 });
S_({ id: 'pets-rewards', ch: 'pets', title: 'Daily rewards and the prize wheel',
  say: 'Rewards has a daily login reward, daily battles and a prize wheel with its odds listed. Here is one real spin using a ticket in the demo session.',
  sayQ: 'Rewards has a daily login reward, daily battles and a prize wheel with listed odds.',
  ensure: async X => { await toMap(X); await X.press('.gnav [data-a=gRewards]'); await X.until(() => el('[data-a=gSpin]')); },
  act: async X => { await X.tryPress('[data-a=gLogin]', { pre: 600 }); await X.sleep(1300); const dl = el('[data-a=gDaily]'); if (dl) await X.look(dl, true); await X.sleep(1200); await X.press('[data-a=gSpin]', { pre: 700 }); await X.until(() => el('.pwrap'), 7000); await X.sleep(2500); await X.tryPress('.pwrap [data-a=gClose]'); }, hold: 300 });
S_({ id: 'pets-worlds', ch: 'pets', title: 'Subject worlds',
  say: 'Other subject worlds are visible, but only reviewed content is playable. A world awaiting teacher review says so and opens nothing, so a tile never pretends to be a finished lesson.',
  sayQ: 'Other worlds wait for teacher review and open nothing until then.',
  ensure: async X => { await toMap(X); await X.until(() => el('[data-a=gWorld]')); },
  act: async X => { const tabs = [...document.querySelectorAll('[data-a=gWorld]')].filter(b => b.dataset.w !== 'language'); const t = tabs[0]; if (t) { await X.press(t, { pre: 600 }); await X.sleep(1300); const isl = el('.isle'); if (isl) { await X.press(isl, { pre: 600 }); await X.sleep(2200); await X.tryPress('.pwrap [data-a=gClose]'); } } await X.tryPress('[data-a=gWorld][data-w=language]'); }, hold: 300 });

/* ---------- 7. Student evidence (teacher) ---------- */
S_({ id: 'teach-overview', ch: 'teach', title: 'Class overview',
  say: 'The teacher dashboard shows a class heat map, then a skill breakdown for each student. Every student here is synthetic. Independent first attempts and answers after help are counted separately.',
  sayQ: 'The dashboard shows a class heat map and a skill breakdown per student.',
  ensure: async X => { needMaya(); X.closeAll(); await leave(X); S.current = null; C.dash(); await X.until(() => el('.heat')); },
  act: async X => { await X.look(el('.heat').closest('.card'), true); await X.sleep(1800); const sb = el('.sbars'); if (sb) await X.look(sb, true); await X.sleep(1500); }, hold: 300 });
S_({ id: 'teach-evidence', ch: 'teach', q: true, title: 'Error pattern and suggestion', ai: 'rules',
  say: 'This is Ari, a synthetic learner. Fixed rules, not AI, read independent first attempts: one of three right, and two wrong answers share a pattern, a visible detail chosen over the cause. That suggests a practice focus.',
  sayQ: 'For Ari, rules find a pattern: a visible detail chosen over the cause. That suggests a focus.',
  ensure: async X => { await openTeacher(X); },
  act: async X => { await X.look(el('#tcard .tg-ev'), true); await X.sleep(2200); await X.tryPress('[data-a=tgEv]', { pre: 600 }); await X.sleep(500); const t = el('#tcard .tg-tbl'); if (t) await X.look(t, true); await X.sleep(2200); }, expect: () => el('#tcard .tg-tbl'), hold: 300 });
S_({ id: 'teach-group', ch: 'teach', q: true, title: 'Group lesson draft', ai: true,
  say: 'Learners with the same counted pattern form a group. Pip drafts a five-minute lesson, every quote is checked against the passage, and the teacher edits and approves it.',
  sayQ: 'Learners with the same pattern form a group. Pip drafts a lesson and the teacher approves it.',
  ensure: async X => { needMaya(); X.closeAll(); await leave(X); S.current = null; C.dash(); await X.until(() => el('#grcard [data-a=grDraft]')); },
  act: async X => { await X.look(el('#grcard'), true); await X.sleep(1500); await X.press('#grcard [data-a=grDraft]', { pre: 700 }); await X.until(() => el('#grcard .tg-lesson .tg-mode') || el('#grcard .err'), 26000); const l = el('#grcard .tg-mode'); if (l) await X.look(l, true); await X.sleep(2200); await X.tryPress('#grcard [data-a=grApprove]', { pre: 800 }); await X.sleep(1200); },
  expect: () => el('#grcard .tg-mode'), wait: 27000, hold: 300 });

/* ---------- 8. Parent reports ---------- */
async function toParent(X) { needMaya(); X.closeAll(); await leave(X); S.current = null; C.dash(); await X.until(() => el('#pacard select[data-pr=pick]')); const sel = el('#pacard select[data-pr=pick]'); if (sel.value !== 'demo-maya') { sel.value = 'demo-maya'; sel.dispatchEvent(new Event('change', { bubbles: true })); await X.until(() => el('#pacard .pr-prev')); } }
S_({ id: 'parent-report', ch: 'parent', q: true, title: 'Counted statistics and graphs', ai: 'rules',
  say: 'The parent report shows days practised, questions answered, first-try accuracy, a daily chart and accuracy by skill. Rules count all of it from the student\'s own attempts.',
  sayQ: 'The parent report shows counted statistics and graphs, all computed by rules.',
  ensure: async X => { await toParent(X); },
  act: async X => { await X.look(el('#pacard .pr-prev'), true); await X.sleep(1500); const prev = el('#pacard .pr-prev'); prev.scrollIntoView({ block: 'start', behavior: 'smooth' }); await X.sleep(1800); await X.look(prev.querySelector('table[role=img]') || prev, true); await X.sleep(2000); }, hold: 300 });
S_({ id: 'parent-ai', ch: 'parent', title: 'AI wording, numbers checked', ai: true,
  say: 'AI may reword the notes in plain language, but only if every number it uses matches the counted data. Any unsupported number fails the check, and the rule-based notes are kept.',
  ensure: async X => { if (!el('#pacard [data-a=prAi]')) await toParent(X); },
  act: async X => { await X.press('#pacard [data-a=prAi]', { pre: 700 }); await X.until(() => /passed the checks|did not pass|not available|kept/.test((el('#pacard [role=status]') || {}).textContent || ''), 26000); const m = el('#pacard .tg-mode'); if (m) await X.look(m, true); await X.sleep(2400); },
  expect: () => /passed the checks|did not pass|kept/.test((el('#pacard [role=status]') || {}).textContent || ''), wait: 27000, hold: 300 });
S_({ id: 'parent-email', ch: 'parent', title: 'Email preview (dry run)', ai: 'rules',
  say: 'Sending asks for confirmation first. In this tour it is a dry run: nothing is delivered and no address is contacted.',
  sayQ: 'Sending needs confirmation. In this tour it is a dry run: nothing is sent.',
  ensure: async X => { if (!el('#pacard [data-a=prSend]')) await toParent(X); },
  act: async X => { const b = el('#pacard [data-a=prSend]'); await X.look(b, true); await X.sleep(900); await X.press('#pacard [data-a=prSend]', { pre: 600 }); await X.until(() => el('.pwrap [data-a=prSendGo]')); await X.sleep(2000); await X.press('.pwrap [data-a=prSendGo]', { pre: 700 }); await X.until(() => /demo preview|dry|Saved to/.test((el('#pacard [role=status]') || {}).textContent || ''), 6000); const m = el('#pacard [role=status]'); if (m) await X.look(m, true); await X.sleep(2400); },
  hold: 300 });

/* ---------- 9. AI checks and conclusion ---------- */
async function seedTraces(X) { if ((S.traces || []).length) return; const sents = window.SQ_TELESCOPE.generatorInput.passage; await G.gen.run('group-lesson', { skill: 'Inference: why it happened', pattern: 'chose a visible detail instead of the cause', n: 2, band: 'Grades 3-4', passage: sents }, { skillId: 'inference_causal', sourceVersion: 'tour' }); void X; }
S_({ id: 'checks-trace', ch: 'checks', badgeFn: () => { const t = S.traces || []; return t.some(x => x.provenance === 'fixture') ? 'fixture' : t.some(x => x.provenance === 'live-ai') ? 'live' : null; }, q: true, title: 'Validation and saved traces', ai: true,
  say: 'Every generation is saved as a trace: prompt version, origin, the checks passed or failed, and teacher edits. The origin column says whether a row is a live response or an authored fixture.',
  sayQ: 'Each generation is saved with its prompt version, origin and check results.',
  ensure: async X => { await seedTraces(X); await openTeacher(X); const d = [...document.querySelectorAll('#tcard details.tg-change')].find(x => /Evaluation log/.test(x.textContent)); if (d) d.open = true; await X.until(() => el('#tcard .tg-tbl')); },
  act: async X => { const d = [...document.querySelectorAll('#tcard details.tg-change')].find(x => /Evaluation log/.test(x.textContent)); if (d) { d.open = true; await X.look(d, true); } await X.sleep(2500); const tb = d && d.querySelector('table'); if (tb) await X.look(tb, true); await X.sleep(2600); }, hold: 300 });
S_({ id: 'checks-saved', ch: 'checks', title: 'Saved AI responses', ai: 'saved',
  say: 'Saved responses from earlier live runs would be listed here with their original details. Nothing is invented: this panel only reads what exists in the real saves.',
  ensure: async X => { X.closeAll(); },
  act: async X => { const rows = (SNAP.realTraces || []).filter(t => t && (t.provenance === 'live-ai' || /live-ai/.test(String(t.mode || '')))); if (!rows.length) { tx('No saved live AI responses exist in this browser’s real saves, so nothing is shown here. Live runs would appear with their original prompt version and date.', true); T.used = T.used.filter(u => u.step !== T.i); const b = el('#tour-ai'); if (b) { b.hidden = false; b.className = 'tour-ai wait'; b.textContent = 'No saved live responses'; } await X.sleep(2800); return; }
    G.panel(`<h2>Saved AI responses (read-only)</h2><ul class="rcp">${rows.map(t => `<li><b>${esc(String(t.mode || t.kind || 'generation'))}</b> · ${esc(String(t.promptVersion || ''))} · ${new Date(t.createdAt).toLocaleDateString()} · origin: ${esc(String(t.provenance || 'live-ai'))} · ${esc(String(t.status || ''))}</li>`).join('')}</ul><p class="small">These come from your real saves and are not changed by the tour.</p><div class="row left"><button class="btn big" data-a="gClose">Close</button></div>`); seen('saved', 'saved'); await X.sleep(3500); G.closePanel(); },
  hold: 300 });
S_({ id: 'checks-split', ch: 'checks', title: 'What code decides, what AI writes',
  say: 'Code decides scores, mastery, groups, unlocks and whether a reply is shown. Generative AI writes language only: hints, rewrites, readings of reasoning, lesson drafts and report wording. Every output is checked first.',
  ensure: async X => { X.closeAll(); },
  act: async X => { G.panel(`<h2>Who decides what</h2><div class="tour-split"><div><h3>Code and rules decide</h3><ul><li>Scores and mastery</li><li>Which learners form a group</li><li>Unlocks and rewards</li><li>Whether an AI reply is shown at all</li></ul></div><div><h3>Generative AI writes</h3><ul><li>Tutor hints and explanations</li><li>Passage rewrites</li><li>Readings of a student’s reasoning</li><li>Lesson drafts and report wording</li></ul></div></div><p class="small">Teacher approval sits between AI drafts and anything that changes instruction.</p>`); await X.sleep(T.mode === 'quick' ? 4200 : 7000); G.closePanel(); },
  hold: 300 });
S_({ id: 'checks-recap', ch: 'checks', q: true, title: 'Recap',
  say: 'Students get help that explains why, without giving the answer away. Teachers get counted evidence and drafts to approve. Parents get graphs with checked wording. This shows how it works; it does not measure learning gains.',
  sayQ: 'Students get hints that explain, teachers get evidence, parents get checked reports. Learning gains are not measured.',
  ensure: async X => { X.closeAll(); },
  act: async X => { G.panel(`<h2>What was shown</h2><ul class="rlist"><li><b>Students:</b> hints that explain why, at their level</li><li><b>Teachers:</b> counted evidence, grouped patterns, drafts to approve</li><li><b>Parents:</b> graphs and notes with checked numbers</li></ul><p class="small"><b>Not measured:</b> learning gains, time saved, or classroom outcomes. This tour demonstrates how the features work.</p>`); await X.sleep(T.mode === 'quick' ? 4500 : 7500); G.closePanel(); },
  hold: 600 });

/* more chapters are appended by the second half of this module */
window.SQ_TOUR_STEPS = ALL; window.SQ_TOUR_API = { start: startTour, exit: () => exitTour(), get: () => T, jump, ALL, FIX, FIXG, needMaya, mkAttempts };
});
