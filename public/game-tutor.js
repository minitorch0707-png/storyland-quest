/* Storyland Quest – Ask Pip: an AI reading tutor available on every screen.
   In a battle it explains where an answer went wrong and why, using only that passage. Anywhere else it answers the
   student's own reading and writing questions. Claude writes every reply; checks decide whether it is shown.
   On the shared page it connects to the viewer's own Claude account automatically. */
window.SQ_PARTS.push((G, C) => {
'use strict';
const { S, $, esc, speak, hush } = C, A = G.actions;
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const strip = s => String(s || '').replace(/<[^>]+>/g, '');
const BATTLE_CHIPS = [['Why is my answer wrong?'], ['Give me a clue'], ['What does this word mean?'], ['Explain this passage']];
const FREE_CHIPS = [['Give me a reading tip'], ['How do I find the main idea?'], ['Quiz me on a new word'], ['Help me write a better sentence']];
let T = { key: '', turns: [], busy: false, msg: '', connecting: false };

const passageOf = it => (!it ? '' : it.passageSents ? it.passageSents.map(s => s.text).join(' ') : it.story ? it.story.text : it.passage ? strip(it.passage) : '');
const rightText = it => (!it ? '' : it.tiles ? (it.goal || []).join(it.type === 'build' ? '' : ' ') : strip(((it.opts || []).find(o => o.id === it.correctId) || {}).text || ''));
const phaseOf = c => (!c ? 'question' : ['ready', 'casting', 'victory', 'claimed'].includes(c.phase) ? 'solved' : c.pickedId && c.phase === 'retry' ? 'retry' : 'question');
/* the live battle question, or the last one the child saw (for 20 minutes) so "Why is my answer wrong?" still has context outside a battle */
let LAST = null;
const ctxNow = () => { const live = G.btx && G.btx.ctx(); if (live) { LAST = { ...live, at: Date.now() }; return live; } return LAST && Date.now() - LAST.at < 20 * 60000 ? { ...LAST, stale: true } : null; };
const voiceOn = () => S.settings.tutorVoice !== false;

const BONUS = 5, DAILY_BONUS = 30;
G.TUTOR_BONUS = BONUS;
G.tutorBtn = it => (it ? '<button class="tutb" data-a="tutOpen" aria-haspopup="dialog" aria-label="Ask Pip for help">🦊 Ask Pip</button>' : '');
G.tutorHelpBtn = it => (it ? `<button class="btn big pipask" data-a="tutOpen" aria-haspopup="dialog">🦊 Ask Pip <small>+${BONUS} 🪙 when you work it out</small></button>` : '');
/* Asking Pip is never a penalty. If you miss, ask Pip, and then work it out yourself, you earn a few coins (a daily cap stops farming). */
const helped = new Set();
G.tutorBonus = (qid, att) => { const p = C.cur(); if (!p || !att.correct || att.attempt < 2 || !helped.has(qid)) return '';
  helped.delete(qid); const day = C.today(); p.tutorBonus = p.tutorBonus && p.tutorBonus.day === day ? p.tutorBonus : { day, coins: 0 };
  if (p.tutorBonus.coins + BONUS > DAILY_BONUS) return 'You worked it out with Pip’s help! (Today’s Pip bonus is used up.)';
  p.tutorBonus.coins += BONUS; p.coins += BONUS; p.tutorLog = [...(p.tutorLog || []), { at: Date.now(), qid, mode: 'bonus', bonus: BONUS }].slice(-200); C.save();
  if (G.fx && $('#fme')) G.fx.number(`+${BONUS} 🪙`, $('#fme'), 'good'); return `Pip bonus: +${BONUS} 🪙 for working it out with help!`; };

/* ---- checks on every reply: nothing unsupported, answer-leaking or off-topic is shown ---- */
function okReply(r, c) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return false;
  const t = String(r.reply || ''), it = c && c.item, pass = passageOf(it), ph = phaseOf(c), right = norm(rightText(it));
  if (t.length < 5 || t.length > 650 || t.split(/\s+/).length > 110) return false;
  if (/https?:|www\.|@\w+\.\w+/i.test(t) || /\b(phone number|home address|password|where do you live|last name)\b/i.test(t)) return false;
  if (r.check && (typeof r.check !== 'string' || r.check.length > 200)) return false;
  if (r.quote && (typeof r.quote !== 'string' || r.quote.length > 220 || !pass || !pass.includes(r.quote))) return false;
  if (it && ph !== 'solved') { if (right.length >= 4 && norm(t).includes(right)) return false; if (/\b(the )?(correct )?answer is\b|\bit'?s (option |choice )?[abcd]\b|\b(option|choice) [abcd] (is|was) (right|correct)\b|\bpick [abcd]\b/i.test(t)) return false; }
  return true;
}

function connectCard() {
  const hosted = !!(window.claude && window.claude.use);
  return `<div class="tut-connect"><p><b>${T.connecting ? 'Connecting Pip…' : 'Pip’s AI is resting right now.'}</b></p>
    <p>You can still play. Try another battle, or ask again in a moment.</p>
    <div class="row"><button class="btn big" data-a="tutLeaveToPlay">▶ Practise another way</button>${hosted ? '<button class="btn" data-a="tutConnect">Try again</button>' : '<button class="btn" data-a="tutConnect">Try again</button>'}</div>
    <p class="small">Grown-up? AI is set up in <b>Teachers &amp; Parents</b> (behind the grown-up gate): ${hosted ? 'on this Claude page, allow AI when asked; ' : ''}on a local server, paste a key there or set an API key in the server’s environment.</p>${T.msg ? `<p class="small" role="status">${esc(T.msg)}</p>` : ''}</div>`;
}
function view(focus) {
  const c = ctxNow(), ai = C.AI().on, chips = c ? BATTLE_CHIPS : FREE_CHIPS;
  const log = `<div class="tut-log" role="log" aria-live="polite">${T.turns.map((t, n) => t.role === 'you' ? `<p class="tut-you"><b>You:</b> ${esc(t.text)}</p>`
    : `<div class="tut-pip"><p><b>Pip:</b> ${esc(t.text)}</p>${t.quote ? `<q class="tut-q">${esc(t.quote)}</q>` : ''}${t.check ? `<p><i>${esc(t.check)}</i></p>` : ''}<small class="tut-tag">${t.src === 'fixture' ? 'Authored demo fixture (not a live AI reply)' : 'Claude’s reply'}${c ? ' · checked against the passage' : ''}</small> <button class="btn sm ghost" data-a="tutSay" data-n="${n}">🔊 Read aloud</button></div>`).join('') || `<p class="small">${c ? 'Ask about this question. Pip helps you find the answer, not give it away.' : 'Ask Pip anything about reading, words or writing.'}</p>`}${T.busy ? '<p class="small" role="status">Pip is thinking…</p>' : ''}${ai && T.msg ? `<p class="small" role="status">${esc(T.msg)}</p>` : ''}</div>`;
  G.panel(`<h2>🦊 Ask Pip ${c ? `<small>· ${c.stale ? 'your last question' : 'this question'}</small>` : ''} <span class="aimode ${ai ? 'on' : ''}">${ai ? '✨ AI on' : 'AI off'}</span></h2>${ai ? `<p class="small tut-mode">${C.AI().fixture ? '🎬 Demo mode: each reply is labelled live or authored example.' : '✨ Connected to ' + esc(C.AI().provider || 'Claude') + '.'}</p>${log}
    <div class="tut-chips" role="group" aria-label="Quick questions">${chips.map(([t], k) => `<button class="btn sm" data-a="tutChip" data-k="${k}">${t}</button>`).join('')}</div>
    <div class="row tight"><input id="tut-in" class="inp" maxlength="200" placeholder="Type your own question…" aria-label="Your question for Pip" autocomplete="off"><button class="btn big" data-a="tutSend">Ask</button></div>
    <label class="tg-chk"><input type="checkbox" id="tut-voice" data-a="tutVoice" ${voiceOn() ? 'checked' : ''}> 🔊 Read Pip’s answers out loud</label>` : connectCard()}
    <div class="row left"><button class="btn ghost" data-a="tutClose">${c ? 'Back to the question' : 'Close'}</button></div>`);
  if (focus !== false) { const i = $(ai ? '#tut-in' : '#tut-key') || $('[data-a=tutConnect]'); if (i) i.focus(); }
}
async function autoConnect() {
  if (C.AI().on || T.connecting) return;
  if (window.claude && window.claude.use) { T.connecting = true; view(false); const r = await C.connectAI(''); T.connecting = false; T.msg = r.ok ? '' : (r.error || 'Could not connect.'); view(); }
}
A.tutOpen = () => { const c = ctxNow(), key = c ? c.qid : 'free'; if (T.key !== key) T = { key, turns: [], busy: false, msg: '', connecting: false }; view(); if (!C.AI().on) autoConnect(); };
A.tutClose = () => { hush(); G.closePanel(); };
A.tutSay = d => { const t = T.turns[+d.n]; if (t) { hush(); speak(t.text + (t.check ? ' ' + t.check : '')); } };
A.tutVoice = () => { const i = $('#tut-voice'); S.settings.tutorVoice = !!(i && i.checked); if (!S.settings.tutorVoice) hush(); C.save(); };
A.tutConnect = async () => { T.msg = ''; T.connecting = true; view(false); const r = await C.connectAI(''); T.connecting = false; T.msg = r.ok ? '' : r.error || 'Could not connect.'; view(); };
A.tutLeaveToPlay = () => { hush(); G.closePanel(); if (G.btx && G.btx.live()) return; G.map(); };
A.tutKey = async () => { const i = $('#tut-key'), k = i ? i.value.trim() : ''; T.msg = 'Checking the key…'; view(false); const r = await C.connectAI(k); T.msg = r.ok ? '' : r.error || 'Could not connect.'; view(); };
A.tutChip = d => { const c = ctxNow(); ask((c ? BATTLE_CHIPS : FREE_CHIPS)[+d.k][0]); };
A.tutSend = () => { const i = $('#tut-in'), v = i ? i.value.trim() : ''; if (!v) { T.msg = 'Type a question first.'; return view(); } ask(v); };
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 'tut-in') { e.preventDefault(); A.tutSend(); } });

async function ask(text) {
  if (T.busy) return; if (!C.AI().on) { await autoConnect(); if (!C.AI().on) return view(); }
  const c = ctxNow(), it = c && c.item, p = C.cur(), clean = String(text).replace(/[<>{}]/g, '').slice(0, 200);
  T.turns.push({ role: 'you', text: clean }); T.msg = ''; T.busy = true; view(false);
  const body = extra => ({ grade: (p && p.grade) || 3, level: 3, passage: passageOf(it).slice(0, 1600), question: it ? strip(it.prompt) + (it.hint && !it.cites ? ` (clue shown to the student: ${strip(it.hint)})` : '') : '', options: it && it.opts ? it.opts.map(o => strip(o.text)) : [], correct: rightText(it), picked: c ? c.picked : '', phase: phaseOf(c), ask: clean + (extra || ''),
    history: T.turns.slice(-5, -1).map(t => ({ role: t.role === 'you' ? 'student' : 'tutor', text: t.text })) });
  let raw = await C.aiCall('tutor', body()); if (!okReply(raw, c)) raw = await C.aiCall('tutor', body(' (Please keep it short, never give the answer away, and quote the passage exactly if you quote.)'));
  T.busy = false;
  if (okReply(raw, c)) {
    T.turns.push({ role: 'pip', text: String(raw.reply).trim(), quote: raw.quote || '', check: raw.check || '', mode: 'ai', src: C.AI().src === 'fixture' ? 'fixture' : 'live' });
    if (c && phaseOf(c) === 'retry') helped.add(c.qid);
    if (p) { p.tutorLog = [...(p.tutorLog || []), { at: Date.now(), qid: c ? c.qid : 'free', ask: clean.slice(0, 120), mode: 'ai', phase: phaseOf(c) }].slice(-200); C.save(); }
    if (voiceOn()) { const last = T.turns[T.turns.length - 1]; speak(last.text + (last.check ? ' ' + last.check : '')); }
  } else { T.turns.pop(); T.msg = raw ? 'Pip could not give a safe answer to that. Try asking it another way.' : 'Pip could not reach Claude. Check the connection and try again.'; }
  view();
}

/* ---- a floating Ask Pip button on every screen outside a battle ---- */
function fab() {
  let b = $('#pip-fab'); const show = !!C.cur() && !(G.btx && G.btx.live()) && !document.querySelector('.pwrap') && !!$('#app, main, .card, header');
  if (!show) { if (b) b.hidden = true; return; }
  if (!b) { b = document.createElement('button'); b.id = 'pip-fab'; b.type = 'button'; b.className = 'pipfab'; b.setAttribute('aria-haspopup', 'dialog'); b.innerHTML = '<span aria-hidden="true">🦊</span><b>Ask Pip</b>'; b.addEventListener('click', A.tutOpen); document.body.appendChild(b); }
  b.hidden = false;
}
setInterval(fab, 500);
G.tutorOk = okReply; G.tutorReset = () => { LAST = null; T = { key: '', turns: [], busy: false, msg: '', connecting: false }; helped.clear(); };
const _leave = G.leave; G.leave = (...a) => { ctxNow(); hush(); G.closePanel(); return _leave(...a); };
const _qd = A.qaDash; if (_qd) A.qaDash = (...a) => { G.closePanel(); return _qd(...a); };
});
