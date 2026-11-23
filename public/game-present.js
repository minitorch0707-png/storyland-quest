/* Storyland Quest – Present mode: a full-screen, keyboard-driven slide view for the class talk.
   Live AI status and live test, a local video slot, and launch buttons. Reads nothing from player saves. */
window.SQ_PARTS.push((G, C) => {
'use strict';
const { esc } = C;
const SL = [
 { k: 'title', h: 'Storyland Quest', sub: 'A reading game where AI drafts, code checks, and the teacher decides', body: '<div class="pr-badges"><span>COSC1367 · Generative AI</span><span>Prototype with synthetic learners only</span></div>' },
 { k: 'problem', h: 'The problem', sub: 'Practice is easy to generate. Good practice from the passage a child is actually reading is not.', body: '<ul class="pr-list"><li>Teachers need questions tied to <b>their</b> text, with the right skill and a fair reading level.</li><li>Generic worksheets cannot point to the sentence that proves an answer.</li><li>Unchecked AI can invent quotes or give away answers.</li></ul>' },
 { k: 'roles', h: 'Who decides what', sub: 'AI is one stage in a controlled pipeline', body: '<div class="pr-cols"><div><i>⚙️</i><b>Code decides</b><p>Scoring, mastery, coins, unlocks, what a child sees next.</p></div><div><i>🦊</i><b>AI writes</b><p>Drafts questions, hints, clues and feedback from an approved passage.</p></div><div><i>👩‍🏫</i><b>Teacher approves</b><p>Nothing reaches a child until it passes the checks and the teacher ticks it.</p></div></div>' },
 { k: 'features', h: 'Where AI appears', sub: 'Each use is labelled Live, Saved or Rule-based', body: '<div class="pr-grid"><div>🔭<b>Pip drafts practice</b><small>Guided and independent items with exact quotes</small></div><div>🦊<b>Ask Pip tutor</b><small>Hints from the question on screen, never the answer</small></div><div>💭<b>Explain My Thinking</b><small>Child’s reason kept as evidence</small></div><div>📖<b>Reading support</b><small>Plain-language help on hard sentences</small></div><div>👥<b>Group lessons</b><small>Small-group plans from class results</small></div><div>📨<b>Parent report</b><small>Teacher previews before anything is sent</small></div></div>' },
 { k: 'live', h: 'Live AI', sub: 'Press the button. This is a real model call, not a recording.', body: '<div class="pr-live"><div class="pr-st" id="pr-st"></div><div class="pr-acts"><button class="pr-b" data-p="conn">Connect Claude</button><button class="pr-b gold" data-p="test">⚡ Run live test</button><button class="pr-b" data-p="tutor">Open the teacher demo</button></div><output class="pr-out" id="pr-out" aria-live="polite"></output></div>' },
 { k: 'video', h: 'Recorded walkthrough', sub: 'Backup for the live demo, or the guided tour', body: '<div class="pr-vid" id="pr-vid"></div>' },
 { k: 'safe', h: 'Safeguards you can test', sub: 'Six checks run on every draft before a teacher sees it', body: '<ol class="pr-list two"><li>Option IDs are unique</li><li>Option texts are unique</li><li>The answer key exists</li><li>Feedback covers every option</li><li>Quotes appear word for word in the passage</li><li>Question is 20 words or fewer</li></ol><div class="pr-acts"><button class="pr-b gold" data-p="hub">Break one live in the hub</button></div>' },
 { k: 'evidence', h: 'Evidence and honest limits', sub: 'We show what was observed and mark the rest pending', body: '<div class="pr-cols"><div><b>Observed</b><p>Offline workflow runs end to end; checks catch damaged items; tour completes without errors.</p></div><div><b>Pending</b><p>Paired comparison of generated vs authored items, with teacher review time.</p></div><div><b>Not claimed</b><p>Learning gains, teacher time savings, or classroom results.</p></div></div>' },
 { k: 'end', h: 'Questions', sub: 'Thank you', body: '<div class="pr-acts"><button class="pr-b" data-p="hub">Open Q&amp;A practice and answers</button></div>' }
];
let i = 0, vurl = '';
const root = () => document.getElementById('pres');
const live = () => { const a = C.AI(); return a.on && !a.fixture; };
function statusHtml() { const a = C.AI(); return live() ? `<span class="pr-dot on"></span><b>Claude is live</b> ${esc(a.provider || '')}` : `<span class="pr-dot"></span><b>AI is off</b> ${window.claude && window.claude.use ? 'Press Connect, then Allow.' : 'Open the shared Claude link, or run the server with a key.'}`; }
function vidHtml() { return vurl ? `<video controls playsinline src="${vurl}"></video><button class="pr-b" data-p="vclear">Remove video</button>` : '<label class="pr-drop">🎬 Choose your recording<input type="file" accept="video/*" hidden id="pr-file"></label><p class="pr-note">The file plays from this device only. It is not uploaded or saved.</p>'; }
function draw(dir) {
  const r = root(); if (!r) return; const s = SL[i];
  r.querySelector('.pr-stage').innerHTML = `<section class="pr-slide ${dir > 0 ? 'fw' : dir < 0 ? 'bw' : ''} k-${s.k}"><h1>${esc(s.h)}</h1><p class="pr-sub">${esc(s.sub)}</p><div class="pr-body">${s.body}</div></section>`;
  r.querySelector('.pr-bar i').style.width = (i + 1) / SL.length * 100 + '%'; r.querySelector('.pr-n').textContent = `${i + 1} / ${SL.length}`;
  const st = r.querySelector('#pr-st'); if (st) st.innerHTML = statusHtml(); const v = r.querySelector('#pr-vid'); if (v) v.innerHTML = vidHtml();
}
function go(n) { n = Math.max(0, Math.min(SL.length - 1, n)); if (n === i) return; const d = n - i; i = n; try { C.sfx.tap(); } catch (e) {} draw(d); }
function open(start) {
  if (root()) return; if (document.getElementById('hub') && window.SQ_HUB) window.SQ_HUB.close();
  i = Math.max(0, Math.min(SL.length - 1, start || 0)); const r = document.createElement('div'); r.id = 'pres'; r.className = 'prwrap'; r.setAttribute('role', 'dialog'); r.setAttribute('aria-label', 'Presentation');
  r.innerHTML = '<div class="pr-top"><b>🎓 Storyland Quest</b><span class="pr-n"></span><span class="hsp"></span><button class="pr-b sm" data-p="full" title="Full screen (F)">⛶</button><button class="pr-b sm" data-p="close">✕ Exit (Esc)</button></div><div class="pr-stage"></div><div class="pr-nav"><button class="pr-b" data-p="prev" aria-label="Previous slide">←</button><div class="pr-bar"><i></i></div><button class="pr-b gold" data-p="next" aria-label="Next slide">→</button></div>';
  document.body.appendChild(r); draw(0); try { C.sfx.win(); } catch (e) {}
}
function close() { const r = root(); if (r) { r.classList.add('out'); setTimeout(() => r.remove(), 220); } }
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-p]'); if (!b || !root()) return; const k = b.dataset.p;
  if (k === 'next') go(i + 1); else if (k === 'prev') go(i - 1); else if (k === 'close') close();
  else if (k === 'full') { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (er) {} }
  else if (k === 'hub') { close(); setTimeout(() => window.SQ_HUB && window.SQ_HUB.open(), 240); }
  else if (k === 'tutor') { close(); setTimeout(() => { try { G.actions.qaOpen && G.actions.qaOpen(); G.actions.dmPre && G.actions.dmPre({ k: 'tutor' }); } catch (er) {} }, 240); }
  else if (k === 'vclear') { if (vurl) URL.revokeObjectURL(vurl); vurl = ''; draw(0); }
  else if (k === 'conn') { const o = document.getElementById('pr-out'); if (o) o.textContent = 'Connecting…'; C.connectAI().then(r => { draw(0); const o2 = document.getElementById('pr-out'); if (o2 && !(r && r.ok)) o2.textContent = (r && r.error) || 'Not allowed.'; }); }
  else if (k === 'test') { const o = document.getElementById('pr-out'); if (!live()) { if (o) o.textContent = 'AI is off, so there is nothing live to test. Connect first.'; return; } o.textContent = 'Asking Claude…'; const t0 = performance.now();
    C.aiRaw('Reply with JSON only, no prose: {"question":"<one reading-comprehension question, 20 words or fewer, answerable from the sentence>"}. Sentence: "Ari looked through the telescope and saw a bright planet with rings."')
      .then(x => { const q = x && (x.question || (typeof x === 'string' ? x : '')), o2 = document.getElementById('pr-out'); if (!o2) return; o2.innerHTML = q ? `Live reply in ${((performance.now() - t0) / 1000).toFixed(1)}s<br><b>“${esc(String(q))}”</b>` : 'No reply. The app would fall back to labelled fixtures.'; try { q ? C.sfx.ok() : C.sfx.bad(); } catch (er) {} }); }
});
document.addEventListener('change', e => { if (e.target.id === 'pr-file' && e.target.files[0]) { vurl = URL.createObjectURL(e.target.files[0]); draw(0); } });
document.addEventListener('sq-ai', () => { const st = document.getElementById('pr-st'); if (st) st.innerHTML = statusHtml(); });
document.addEventListener('keydown', e => { if (!root()) { if ((e.key === 'p' || e.key === 'P') && !/INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '') && document.getElementById('hub')) open(); return; }
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); go(i + 1); } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(i - 1); }
  else if (e.key === 'Escape') close(); else if (e.key === 'f' || e.key === 'F') { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (er) {} } }, true);
G.presentOpen = open; window.SQ_PRESENT = { open, close, slides: SL.map(s => s.k) };
G.actions.presentOpen = () => open();
});
