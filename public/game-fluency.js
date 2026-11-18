/* Storyland Quest – Read it aloud: a fluency coach.
   The browser listens (speech recognition) or, where it cannot, the child taps the tricky words.
   Words correct and words per minute are counted by rules. AI only writes the coaching note, and only from those counts. */
window.SQ_PARTS.push((G, C) => {
'use strict';
const { S, $, esc, art, speak, hush } = C, A = G.actions;
const norm = w => String(w).toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9']/g, '');
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let R = null, REC = null;

/* ---- alignment: edit distance over words. correct / changed / skipped for each target word ---- */
function align(target, heard) {
  const a = target.map(norm), b = heard.map(norm), n = a.length, m = b.length, d = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) d[i][0] = i; for (let j = 0; j <= m; j++) d[0][j] = j;
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  const out = new Array(n); let i = n, j = m;
  while (i > 0) {
    if (j > 0 && a[i - 1] === b[j - 1] && d[i][j] === d[i - 1][j - 1]) { out[i - 1] = 'ok'; i--; j--; }
    else if (j > 0 && d[i][j] === d[i - 1][j - 1] + 1) { out[i - 1] = 'changed'; i--; j--; }
    else if (d[i][j] === d[i - 1][j] + 1) { out[i - 1] = 'skipped'; i--; }
    else { j--; }
  }
  return out;
}
const score = (words, marks, ms) => { const ok = marks.filter(x => x === 'ok').length, min = Math.max(ms, 3000) / 60000; return { ok, total: words.length, pct: Math.round(100 * ok / words.length), wcpm: Math.round(ok / min), secs: Math.round(ms / 1000) }; };

function pickSentence(p) {
  const st = C.bankStory(p), all = (st.text.match(/[^.!?]+[.!?]+/g) || []).map(s => s.trim()), fit = all.filter(s => { const n = s.split(/\s+/).length; return n >= (p.grade <= 2 ? 4 : 8) && n <= (p.grade <= 2 ? 9 : 22); });
  return (fit.length ? fit : all)[Math.floor(Math.random() * Math.max(1, (fit.length ? fit : all).length))] || 'The little fox read a book.';
}
G.fluencyCard = p => `<button class="mission" data-a="flStart" aria-label="Read it aloud with Pip">${art('pip_cheer', '🎤')}<b>Read it aloud</b><small>Pip listens and coaches your reading</small></button>`;
const _pc = G.pickCard; G.pickCard = p => (_pc ? _pc(p) : '') + G.fluencyCard(p);

function head() { return G.hdr(); }
function view() {
  const p = C.cur(); if (!R) return;
  const words = R.words;
  if (R.stage === 'ready' || R.stage === 'listening') {
    C.view(`${head()}<main class="echopage fl"><div class="pip">${art('pip_cheer', '🦊', 'pipi')}<div class="bubble" role="status">${R.stage === 'listening' ? 'I am listening. Read the sentence out loud.' : SR ? 'Read this sentence out loud. Tap Start when you are ready.' : 'Read this sentence out loud, then tap the words that felt tricky.'}</div></div>
      <p class="flsent" aria-label="Sentence to read">${words.map((w, i) => `<span class="flw ${R.tap && R.tap.has(i) ? 'miss' : ''}" ${!SR || R.manual ? `role="button" tabindex="0" data-a="flTap" data-i="${i}"` : ''}>${esc(w)}</span>`).join(' ')}</p>
      <div class="center bigcta">${R.stage === 'listening' ? '<button class="btn big" data-a="flStop">⏹ I am done</button>' : SR && !R.manual ? '<button class="btn big" data-a="flListen">🎤 Start reading</button><button class="btn ghost" data-a="flManual">Mic not working? Tap tricky words instead</button>' : '<button class="btn big" data-a="flManualGo">I read it</button>'}
      <button class="btn ghost" data-a="gMap">Back</button></div><p class="small center" id="flmsg" role="status">${esc(R.msg || '')}</p></main>`, false, true);
    return;
  }
  const s = R.score, marks = R.marks, missed = words.filter((w, i) => marks[i] !== 'ok');
  C.view(`${head()}<main class="echopage fl"><div class="pip">${art('pip_cheer', '🦊', 'pipi')}<div class="bubble" role="status"><b>${s.pct >= 90 ? 'Smooth reading!' : s.pct >= 70 ? 'Nice work!' : 'Good try!'}</b> ${s.ok} of ${s.total} words ${R.manual ? 'felt easy' : 'matched'}${R.manual ? '' : ` · about ${s.wcpm} words a minute`}.</div></div>
    <p class="flsent" aria-label="Your reading, word by word">${words.map((w, i) => `<span class="flw ${marks[i]}">${esc(w)}${marks[i] === 'skipped' ? ' <small>skipped</small>' : marks[i] === 'changed' ? ' <small>different</small>' : ''}</span>`).join(' ')}</p>
    <div class="ccard"><div><h2>Pip’s coaching</h2><div id="flcoach">${R.coach ? coachHtml(R.coach) : '<p class="small">Pip is writing a note…</p>'}</div></div></div>
    <div class="row"><button class="btn" data-a="flAgain">Read another</button>${missed.length ? '<button class="btn" data-a="flSay">🔊 Hear the tricky words</button>' : ''}<button class="btn ghost" data-a="gMap">Done</button></div></main>`, false, true);
}
const coachHtml = c => `<p>${esc(c.praise)}</p><p>${esc(c.tip)}</p>${c.practice ? `<p><b>Try this:</b> “${esc(c.practice)}” <button class="btn sm ghost" data-a="flSayP">🔊</button></p>` : ''}<small class="tut-tag">${c.ai ? 'AI note · written from the counts above' : 'Counts-based note (AI is off)'}</small>`;
function okCoach(c, missed) { const l = (v, m) => typeof v === 'string' && v.length >= 3 && v.length <= m; if (!c || !l(c.praise, 160) || !l(c.tip, 200)) return false; if (c.practice && (typeof c.practice !== 'string' || c.practice.split(/\s+/).length > 14)) return false; if (/https?:|www\./i.test(JSON.stringify(c))) return false; void missed; return true; }
function ruleCoach(s, missed) {
  return { ai: false, praise: s.pct >= 90 ? 'You read that very smoothly. Keep going!' : s.pct >= 70 ? 'You read most of the words well. That takes practice.' : 'Thank you for trying. Reading aloud is brave.',
    tip: missed.length ? `Read these words slowly first, then the sentence again: ${missed.slice(0, 4).join(', ')}.` : 'Try a longer sentence next time.', practice: '' };
}
async function finish(marks, ms, manual) {
  const p = C.cur(), s = score(R.words, marks, ms), missed = R.words.filter((w, i) => marks[i] !== 'ok').map(w => w.replace(/[^\w'’-]/g, ''));
  Object.assign(R, { stage: 'done', marks, score: s, manual: !!manual, coach: null }); p.fluency = [...(p.fluency || []), { at: Date.now(), total: s.total, ok: s.ok, wcpm: manual ? null : s.wcpm, missed: missed.slice(0, 8), manual: !!manual }].slice(-60); C.save(); view();
  let coach = null;
  if (C.AI().on) { const raw = await C.aiCall('fluency', { grade: p.grade, level: 2, wcpm: manual ? 0 : s.wcpm, correct: s.ok, total: s.total, missed: missed.slice(0, 8) }); if (okCoach(raw, missed)) coach = { ai: true, praise: raw.praise, tip: raw.tip, practice: raw.practice || '' }; }
  R.coach = coach || ruleCoach(s, missed); const el = $('#flcoach'); if (el) el.innerHTML = coachHtml(R.coach);
}
A.flStart = () => { const p = C.cur(); R = { words: pickSentence(p).split(/\s+/), stage: 'ready', manual: false, tap: new Set(), msg: '' }; view(); };
A.flAgain = () => A.flStart();
A.flManual = () => { R.manual = true; R.tap = new Set(); view(); };
A.flManualGo = () => { R.t0 = R.t0 || Date.now(); finish(R.words.map((w, i) => (R.tap.has(i) ? 'changed' : 'ok')), Date.now() - (R.t0 || Date.now()), true); };
A.flTap = d => { const i = +d.i; R.tap.has(i) ? R.tap.delete(i) : R.tap.add(i); if (!R.t0) R.t0 = Date.now(); view(); };
A.flListen = () => {
  if (!SR) return A.flManual(); hush(); const rec = REC = new SR(); rec.lang = 'en-CA'; rec.interimResults = false; rec.continuous = true; rec.maxAlternatives = 1; let heard = '', t0 = 0, ended = false;
  rec.onstart = () => { t0 = Date.now(); R.stage = 'listening'; view(); };
  rec.onresult = e => { for (let i = e.resultIndex; i < e.results.length; i++) heard += ' ' + e.results[i][0].transcript; };
  rec.onerror = e => { if (ended) return; ended = true; R.stage = 'ready'; R.msg = e.error === 'not-allowed' ? 'The microphone was blocked. You can allow it in the browser, or tap the tricky words instead.' : 'I could not hear that. Try again, or tap the tricky words instead.'; view(); };
  rec.onend = () => { if (ended) return; ended = true; const hw = heard.trim().split(/\s+/).filter(Boolean); if (!hw.length) { R.stage = 'ready'; R.msg = 'I did not hear any words. Try again a little louder.'; return view(); } finish(align(R.words, hw), Date.now() - t0, false); };
  try { rec.start(); } catch (e) { A.flManual(); }
};
A.flStop = () => { try { REC && REC.stop(); } catch (e) { /* already stopped */ } };
A.flSay = () => { hush(); speak(R.words.filter((w, i) => R.marks[i] !== 'ok').map(w => w.replace(/[^\w'’-]/g, '')).join('. ')); };
A.flSayP = () => { hush(); speak((R.coach && R.coach.practice) || ''); };
document.addEventListener('keydown', e => { const t = e.target; if (t && t.classList && t.classList.contains('flw') && (e.key === 'Enter' || e.key === ' ') && t.dataset.a) { e.preventDefault(); A.flTap(t.dataset); } });
G.fluencyAlign = align; G.fluencyScore = score;
});
