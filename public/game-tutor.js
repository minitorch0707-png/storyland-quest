/* Storyland Quest – Ask Pip: a passage-grounded reading tutor.
   It explains where an answer went wrong and why, and answers the student's own questions.
   The AI writes every reply; checks decide whether it is shown. There is no canned fallback: with AI off the panel asks the user to connect it. */
window.SQ_PARTS.push((G, C) => {
'use strict';
const { S, $, esc, art, speak, hush } = C, A = G.actions;
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const strip = s => String(s || '').replace(/<[^>]+>/g, '');
const CHIPS = [['why', 'Why is my answer wrong?'], ['clue', 'Give me a clue'], ['word', 'What does this word mean?'], ['story', 'Explain this passage']];
let T = { qid: '', turns: [], busy: false, msg: '' };

const passageOf = it => (it.passageSents ? it.passageSents.map(s => s.text).join(' ') : it.story ? it.story.text : it.passage ? strip(it.passage) : '');
const rightText = it => strip(((it.opts || []).find(o => o.id === it.correctId) || {}).text || '');
const phaseOf = c => (['ready', 'casting', 'victory', 'claimed'].includes(c.phase) ? 'solved' : c.pickedId && c.phase === 'retry' ? 'retry' : 'question');

G.tutorBtn = it => (it && !it.tiles && it.opts ? '<button class="bagb tutb" data-a="tutOpen" aria-haspopup="dialog">🦊<span>Ask Pip</span></button>' : '');

/* ---- checks on an AI reply: nothing unsupported or answer-leaking is shown ---- */
function okReply(r, c) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return false;
  const t = String(r.reply || ''), pass = passageOf(c.item), ph = phaseOf(c), right = norm(rightText(c.item));
  if (t.length < 5 || t.length > 600 || t.split(/\s+/).length > 95) return false;
  if (/https?:|www\.|@\w+\.\w+/i.test(t)) return false;
  if (r.quote && (typeof r.quote !== 'string' || r.quote.length > 220 || !pass.includes(r.quote))) return false;
  if (r.check && (typeof r.check !== 'string' || r.check.length > 200)) return false;
  if (ph !== 'solved') { if (right.length >= 4 && norm(t).includes(right)) return false; if (/\b(the )?(correct )?answer is\b|\bit'?s (option |choice )?[abcd]\b|\b(option|choice) [abcd] (is|was) (right|correct)\b|\bpick [abcd]\b/i.test(t)) return false; }
  return true;
}

function connectCard() {
  const hosted = !!(window.claude && window.claude.use);
  return `<div class="tut-connect"><p><b>Pip’s tutor needs AI.</b> Connect it to ask questions and get explanations.</p>
    ${hosted ? '<button class="btn big" data-a="tutConnect">Use my Claude account</button><p class="small">Opens the AI permission for this page. Only the passage, the question and your message are sent, never your name.</p>' : ''}
    <label class="tg-l" for="tut-key">${hosted ? 'Or paste' : 'Paste'} an API key (Claude, ChatGPT or Gemini)</label><div class="row tight"><input id="tut-key" class="inp" type="password" autocomplete="off" placeholder="sk-…" aria-label="API key"><button class="btn" data-a="tutKey">Connect</button></div>
    <p class="small">The key is kept by the app’s server on this computer, not in the page. ${T.msg ? '' : 'On a public host, the owner sets the key in the host’s settings instead.'}</p>${T.msg ? `<p class="err" role="alert">${esc(T.msg)}</p>` : ''}</div>`;
}
function view(focus) {
  const c = G.btx && G.btx.ctx(); if (!c) return;
  const ai = C.AI().on;
  const log = `<div class="tut-log" role="log" aria-live="polite">${T.turns.map(t => t.role === 'you' ? `<p class="tut-you"><b>You:</b> ${esc(t.text)}</p>`
      : `<div class="tut-pip"><p><b>Pip:</b> ${esc(t.text)}</p>${t.quote ? `<q class="tut-q">${esc(t.quote)}</q>` : ''}${t.check ? `<p><i>${esc(t.check)}</i></p>` : ''}<small class="tut-tag">AI reply · checked against the passage</small> <button class="btn sm ghost" data-a="tutSay" data-n="${T.turns.indexOf(t)}">🔊 Read aloud</button></div>`).join('') || '<p class="small">Ask about this question. Pip will help you find the answer, not give it away.</p>'}${T.busy ? '<p class="small" role="status">Pip is thinking…</p>' : ''}${ai && T.msg ? `<p class="small" role="status">${esc(T.msg)}</p>` : ''}</div>`;
  G.panel(`<h2>🦊 Ask Pip</h2>${ai ? `<p class="small tut-mode">✨ Connected: ${esc(C.AI().provider || 'AI')}. Every reply is checked against the passage before you see it.</p>${log}
    <div class="tut-chips" role="group" aria-label="Quick questions">${CHIPS.map(([k, t]) => `<button class="btn sm" data-a="tutChip" data-k="${k}">${t}</button>`).join('')}</div>
    <div class="row tight"><input id="tut-in" class="inp" maxlength="200" placeholder="Type your own question" aria-label="Your question for Pip"><button class="btn big" data-a="tutSend">Ask</button></div>` : connectCard()}
    <div class="row left"><button class="btn ghost" data-a="tutClose">Back to the question</button></div>`);
  if (focus !== false) { const i = $(ai ? '#tut-in' : '#tut-key') || $('[data-a=tutConnect]'); if (i) i.focus(); }
}
A.tutConnect = async () => { T.msg = 'Asking for permission…'; view(false); const r = await C.connectAI(''); T.msg = r.ok ? '' : r.error || 'Could not connect.'; view(); };
A.tutKey = async () => { const i = $('#tut-key'), k = i ? i.value.trim() : ''; T.msg = 'Checking the key…'; view(false); const r = await C.connectAI(k); T.msg = r.ok ? '' : r.error || 'Could not connect.'; view(); };
A.tutOpen = () => { const c = G.btx && G.btx.ctx(); if (!c) return; if (T.qid !== c.qid) T = { qid: c.qid, turns: [], busy: false, msg: '' }; view(); };
A.tutClose = () => { hush(); G.closePanel(); };
A.tutSay = d => { const t = T.turns[+d.n]; if (t) { hush(); speak(t.text + (t.check ? ' ' + t.check : '')); } };
A.tutChip = d => ask((CHIPS.find(x => x[0] === d.k) || [0, ''])[1]);
A.tutSend = () => { const i = $('#tut-in'), v = i ? i.value.trim() : ''; if (!v) { T.msg = 'Type a question first.'; return view(); } ask(v); };
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 'tut-in') A.tutSend(); });

async function ask(text) {
  const c = G.btx && G.btx.ctx(); if (!c || T.busy) return; if (!C.AI().on) return view();
  const clean = String(text).replace(/[<>{}]/g, '').slice(0, 200), p = C.cur(), it = c.item;
  T.turns.push({ role: 'you', text: clean }); T.msg = ''; T.busy = true; view(false);
  const body = () => ({ grade: p.grade, level: 3, passage: passageOf(it).slice(0, 1600), question: strip(it.prompt), options: (it.opts || []).map(o => strip(o.text)), correct: rightText(it), picked: c.picked, phase: phaseOf(c), ask: clean,
    history: T.turns.slice(-5, -1).map(t => ({ role: t.role === 'you' ? 'student' : 'tutor', text: t.text })) });
  let raw = await C.aiCall('tutor', body()); if (!okReply(raw, c)) raw = await C.aiCall('tutor', { ...body(), ask: clean + ' (Please answer without revealing the answer and quote the passage exactly.)' });
  T.busy = false;
  if (okReply(raw, c)) { T.turns.push({ role: 'pip', text: String(raw.reply).trim(), quote: raw.quote || '', check: raw.check || '', mode: 'ai' }); p.tutorLog = [...(p.tutorLog || []), { at: Date.now(), qid: c.qid, ask: clean.slice(0, 120), mode: 'ai', phase: phaseOf(c) }].slice(-200); C.save(); }
  else { T.turns.pop(); T.msg = raw ? 'Pip could not give a safe answer to that. Try asking it another way.' : 'Pip could not reach the AI. Check the connection and try again.'; }
  view();
}
G.tutorOk = okReply;
const _leave = G.leave; G.leave = (...a) => { hush(); G.closePanel(); return _leave(...a); }; /* never leave the tutor panel open over another screen */
const _qd = A.qaDash; if (_qd) A.qaDash = (...a) => { G.closePanel(); return _qd(...a); }; /* test hooks */
});
