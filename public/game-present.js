/* Storyland Quest – Present mode: the team's 15-slide talk (from Storyland_Final_Presentation) as a 16:9 deck inside the app.
   Speaker notes (N), timing guide, live AI test, local video slot. Reads nothing from player saves. */
window.SQ_PARTS.push((G, C) => {
'use strict';
const { esc } = C;
const FOOT = 'Evidence status as of November 18, 2026';
/* kind: std | flow | case | live | video | title ; min = suggested minutes ; art = [assetId, emoji] */
const SL = [
 { kind: 'title', h: 'Storyland Quest', sub: 'Generative AI assisted literacy practice', pts: ['COSC1367 team project', 'Teacher reviewed practice inside a companion adventure'], min: 1, art: ['pip_cheer', '🦊'],
   notes: 'Introduce the team and the prototype. State the specific investigation: can a teacher turn a new passage and a recurring answer pattern into useful practice? The game is the delivery setting. All five members need an assigned speaking block.' },
 { kind: 'std', sec: 'Classroom problem', h: 'One passage can produce different learning needs', pts: ['A learner may recall details but miss a cause.', 'A teacher needs evidence and a useful next activity.', 'Writing individual follow ups adds preparation work.'], min: 1.3, art: ['pip_think', '🤔'],
   notes: 'Michelle can introduce the original idea. Describe a hypothetical classroom, not a participant sample. Explain the detail-versus-cause example. The evaluation asks whether drafting is useful and accurate. Avoid claiming a measured crisis or established workload saving.' },
 { kind: 'std', sec: 'Stakeholders', h: 'The teacher reviews the practice before release', pts: ['Learners need clear instructions and helpful feedback.', 'Teachers need inspectable source evidence.', 'Parents need understandable progress summaries.'], min: 1.1, art: ['cos_grad', '🎓'],
   notes: 'Explain responsibilities. The teacher confirms the target and reviews drafts. Parents see practice summaries. School deployment would need verified data and access controls. This prototype uses synthetic learners for the demonstration.' },
 { kind: 'std', sec: 'Learning adventure', h: 'Questions drive the companion battle', pts: ['Choose an egg and follow a chapter.', 'A correct answer earns one move.', 'The game records independent and assisted attempts.'], min: 1.3, art: ['pet_dragon_2', '🐉'],
   notes: 'Describe the playable flow and show the companion sprite. Historical walkthroughs verified the hatch, a wrong-answer HP change and a chest reward. These are functional observations. A correct retry is recorded separately from a first independent response.' },
 { kind: 'flow', sec: 'System design', h: 'Approved content links the teacher and learner views', pts: ['Attempt evidence informs a suggested skill.', 'Pip drafts from a confirmed passage.', 'Review and approval make an item available in battle.'], min: 1.8, icons: ['📊', '🦊', '✅'],
   notes: 'Walk through this conceptual data flow. The rules summarize attempts, the model drafts language, the teacher reviews meaning, and the game delivers the item. The source repository and backend were not audited for this report. Confirm exact persistence and API implementation before the final talk.' },
 { kind: 'std', sec: 'Generative contribution', h: 'New practice about the teacher’s current text', pts: ['Fixed bank supplies the comparison.', 'Generation drafts a new question and feedback.', 'Review time and item quality are the testable outcomes.'], min: 1.5, art: ['clue_lantern', '🏮'],
   notes: 'Make the originality argument precise. Games and adaptive banks have precedents. The proposed value is passage-specific authoring with error-specific explanations and human approval. It remains a hypothesis until measured. Source: Prodigy teacher features for comparable game context, prodigygame.com/main-en/teachers/master-features.' },
 { kind: 'flow', sec: 'Prompt engineering', h: 'The draft must point back to its source', pts: ['Approved sentences and a reviewed skill', 'Four choices, a key and exact quotes', 'Guided and independent practice with feedback'], min: 1.7, icons: ['📄', '✍️', '🎯'],
   notes: 'Explain the bounded prompt contract. The source is data, including any embedded instructions. Require a needs-source response when the skill cannot be supported. Store prompt and source versions and show feedback for each option. The project includes a designed prompt; preserve the actual runtime version with the final trace.' },
 { kind: 'flow', sec: 'Validation and approval', h: 'A matching quote still needs a meaning check', pts: ['Check structure and quote matches.', 'Review the answer and alternatives.', 'Record teacher edits and source versions.'], min: 1.4, icons: ['🔎', '👩‍🏫', '🗂️'], hubBtn: 'Break a check live in the hub',
   notes: 'Explain a concrete failure: a real sentence can be quoted while the key is unsupported. Automated exact matching is a first check. The teacher checks semantic support and ambiguity. Show a rejected or edited draft if one has actually been collected. The hub’s validator lets you damage an authored fixture and watch the checks catch it.' },
 { kind: 'case', sec: 'Ari’s practice case', h: 'A visible detail can distract from the cause', pts: ['Synthetic profile with 1 of 3 independent answers correct', 'Two recurring detail versus cause errors', 'Approved telescope passage and a guided follow up'], min: 1.5, art: ['prop_telescope', '🔭'],
   notes: 'Show the synthetic fixture in the upcoming demo. Ari chose a visible detail rather than the cause. The teacher confirms this tentative focus. Nov 18 review showed AI off and the draft was an explicitly hand-written fixture, so do not call that run live generation. Update before the talk: use the live test in the final slide to show the current AI mode.' },
 { kind: 'std', sec: 'Prototype evidence', h: 'Representative paths worked in walkthroughs', pts: ['Starter egg and hatch reveal', 'Teacher approved fixture opened in battle', 'Shell activity ended with a ferry reward'], min: 1.3, art: ['chest_open', '🎁'], hubBtn: 'Open the dated evidence table',
   notes: 'Refer to the dated evidence CSV. Hatch was observed November 13, approved-item battle November 13, shell activity November 17, and source approval plus fixture review November 18. The artifact changes, so rerun paths on the presentation build. No participant outcome study was conducted.' },
 { kind: 'flow', sec: 'Evaluation design', h: 'Compare both methods on the same inputs', pts: ['Approved passages and synthetic error profiles', 'Blind review of source fit and answer quality', 'Actual edits, review time and rejected outputs'], min: 2, icons: ['📚', '🙈', '⏱️'], hubBtn: 'Open the comparison sheet',
   notes: 'This is the planned experiment, not completed results. Six passages and twelve profiles are a proposed small trial design. Hold some passages out of prompt tuning. Keep raw outputs and compare baseline and generated content on equal inputs. Reviewers should record their own judgments rather than accepting the model’s rating.' },
 { kind: 'std', sec: 'Learning and usability', h: 'Supported practice should lead to a fresh independent turn', pts: ['Show the clue after an error.', 'Ask a different question on the same skill.', 'Keep narration optional and the next action visible.'], min: 1.1, art: ['pip_happy', '😊'],
   notes: 'Connect design to instructional guidance without claiming efficacy. IES describes explicit practice and independent work (ies.ed.gov/ncee/wwc/PracticeGuide/21). W3C supports independent audio control (w3.org/WAI/WCAG21/Understanding/audio-control).' },
 { kind: 'std', sec: 'Limits and ethics', h: 'The report keeps evidence claims bounded', pts: ['Live model quality remains unverified in the public review.', 'Speech recognition and self report carry uncertainty.', 'Synthetic QA shortcuts stay outside learner evidence.'], min: 1.2, art: ['item_second_look', '🔍'],
   notes: 'Discuss current limits clearly. Source implementation and storage need verification. No diagnostic claims follow from small answer histories. Tap mode marks words the learner found tricky. It cannot establish spoken accuracy. Learning gains and teacher time savings remain unmeasured.' },
 { kind: 'flow', sec: 'Completion and teamwork', h: 'The remaining work is concrete', pts: ['Retain and evaluate an actual model trace.', 'Freeze and rehearse the demonstration build.', 'Record completed work and assign all five speakers.'], min: 1, icons: ['🧾', '🧊', '🎤'], hubBtn: 'Open team and checklist',
   notes: 'Current reported work: Michelle supplied the original idea and Caleb developed the prototype. Maryse, Rishit and Taylor have no completed contribution reported as of November 18. Proposed evaluation and review tasks require agreement and actual completion. Do not describe them as already done.' },
 { kind: 'live', sec: 'Live demonstration', h: 'Teacher evidence to approved student practice', pts: ['Inspect Ari’s evidence and approve the source.', 'Review one item and play it as Ari.', 'Show the actual AI mode and retained trace.'], min: 0.8,
   notes: 'The preceding talk totals 20 minutes. Proceed to the separate ten-minute demo run sheet (hub, Run sheet tab), followed by five minutes of Q&A. Confirm the timetable with the instructor. Use the synthetic QA tools only for the later showcase and label simulated outcomes. Press Run live test to show the current AI mode with a real model call.' },
 { kind: 'video', sec: 'Appendix', h: 'Recorded walkthrough', pts: ['Backup if the live demo or connection fails.'], min: 0,
   notes: 'Choose your screen recording before class. It plays from this device only and is not uploaded.' }
];
let i = 0, vurl = '', notes = false, t0 = 0, tid = 0, deckEl = null;
const root = () => document.getElementById('pres');
const live = () => { const a = C.AI(); return a.on && !a.fixture; };
const total = SL.reduce((a, s) => a + s.min, 0);
const cum = n => SL.slice(0, n).reduce((a, s) => a + s.min, 0);
const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
const A = (a) => a ? C.art(a[0], a[1], 'pr-art') : '';
const pts = s => s.pts.map((p, k) => `<li style="--k:${k}"><i>${k + 1}</i><span>${esc(p)}</span></li>`).join('');
const hubB = s => s.hubBtn ? `<button class="pr-b" data-p="hub">${esc(s.hubBtn)} →</button>` : '';
const statusHtml = () => { const a = C.AI(); return live() ? `<span class="pr-dot on"></span><b>Claude is live</b><span>${esc(a.provider || '')}</span>` : `<span class="pr-dot"></span><b>AI is off</b><span>${window.claude && window.claude.use ? 'Press Connect, then Allow.' : 'Open the shared Claude link, or run the server with a key.'}</span>`; };
function body(s, n) {
  const tag = s.sec ? `<div class="pr-tag">${esc(s.sec)}</div>` : '';
  if (s.kind === 'title') return `<div class="pr-hero"><div class="pr-hl"><div class="pr-tag">${esc(s.pts[0])}</div><h1>${esc(s.h)}</h1><p class="pr-lead">${esc(s.sub)}</p><p class="pr-lead2">${esc(s.pts[1])}</p><div class="pr-team">Caleb Passafiume · Michelle Smith · Maryse Pichette · Rishit Dass · Taylor Bennett</div></div><div class="pr-hr">${A(s.art)}</div></div>`;
  if (s.kind === 'flow') return `${tag}<h2>${esc(s.h)}</h2><div class="pr-flow">${s.pts.map((p, k) => `<div class="pr-step" style="--k:${k}"><div class="pr-ic">${s.icons[k]}</div><b>${k + 1}</b><p>${esc(p)}</p></div>${k < 2 ? '<span class="pr-arr">➜</span>' : ''}`).join('')}</div><div class="pr-act">${hubB(s)}</div>`;
  if (s.kind === 'case') return `${tag}<h2>${esc(s.h)}</h2><div class="pr-two"><ul class="pr-pts">${pts(s)}</ul><div class="pr-card"><div class="pr-ch"><b>Ari</b><small>synthetic learner</small></div><div class="pr-meter"><i style="width:33%"></i></div><p class="pr-cap">1 of 3 independent answers correct</p><div class="pr-chips"><span>Detail ✔</span><span class="bad">Cause ✖</span><span class="bad">Cause ✖</span></div><p class="pr-quote">“Ari looked through the telescope…”</p>${A(s.art)}</div></div>`;
  if (s.kind === 'live') return `${tag}<h2>${esc(s.h)}</h2><div class="pr-two"><ul class="pr-pts">${pts(s)}</ul><div class="pr-card live"><div class="pr-st" id="pr-st">${statusHtml()}</div><div class="pr-acts"><button class="pr-b" data-p="conn">Connect Claude</button><button class="pr-b gold" data-p="test">⚡ Run live test</button></div><output class="pr-out" id="pr-out" aria-live="polite">A real model call, with the time it takes.</output><div class="pr-acts"><button class="pr-b" data-p="tutor">▶ Start the teacher demo</button><button class="pr-b" data-p="hub">Run sheet &amp; timer</button></div></div></div>`;
  if (s.kind === 'video') return `${tag}<h2>${esc(s.h)}</h2><div class="pr-vidbox" id="pr-vid">${vidHtml()}</div>`;
  return `${tag}<h2>${esc(s.h)}</h2><div class="pr-two"><ul class="pr-pts">${pts(s)}</ul><div class="pr-stagebox">${A(s.art)}<div class="pr-glow"></div></div></div><div class="pr-act">${hubB(s)}</div>`;
}
function vidHtml() { return vurl ? `<video controls playsinline src="${vurl}"></video><button class="pr-b" data-p="vclear">Remove video</button>` : '<label class="pr-drop">🎬 Choose your recording<input type="file" accept="video/*" hidden id="pr-file"></label><p class="pr-note">Plays from this device only. Not uploaded or saved.</p>'; }
function fit() { const r = root(); if (!r || !deckEl) return; const box = r.querySelector('.pr-viewport').getBoundingClientRect(), k = Math.min(box.width / 1280, box.height / 720); deckEl.style.transform = `translate(-50%,-50%) scale(${k})`; }
function draw(dir) {
  const r = root(); if (!r) return; const s = SL[i];
  r.querySelector('.pr-viewport').innerHTML = `<div class="pr-deck"><section class="pr-slide k-${s.kind} ${dir > 0 ? 'fw' : dir < 0 ? 'bw' : ''}">${body(s, i)}<footer><span>COSC1367 · Storyland Quest</span><span>${FOOT}</span><span>${i + 1}</span></footer></section></div>`;
  deckEl = r.querySelector('.pr-deck'); fit();
  r.querySelector('.pr-bar i').style.width = (i + 1) / SL.length * 100 + '%'; r.querySelector('.pr-n').textContent = `${i + 1} / ${SL.length}`;
  const nb = r.querySelector('.pr-notes'); nb.hidden = !notes; nb.innerHTML = `<b>Speaker notes · suggested ${s.min ? s.min + ' min' : 'n/a'}</b><p>${esc(s.notes)}</p>`;
  tick();
}
function tick() { const r = root(); if (!r) return; const el = r.querySelector('.pr-clock'); if (!el) return; if (!t0) { el.textContent = 'Press T to start the clock'; el.className = 'pr-clock'; return; }
  const el2 = (performance.now() - t0) / 1000, plan = cum(i) * 60, d = el2 - plan; el.textContent = `${fmt(el2)} of ${total.toFixed(0)}:00 · ${Math.abs(d) < 15 ? 'on pace' : d > 0 ? fmt(d) + ' behind' : fmt(-d) + ' ahead'}`; el.className = 'pr-clock ' + (d > 60 ? 'late' : 'ok'); }
function go(n) { n = Math.max(0, Math.min(SL.length - 1, n)); if (n === i) return; const d = n - i; i = n; try { C.sfx.tap(); } catch (e) {} draw(d); }
function open(start) {
  if (root()) return; if (document.getElementById('hub') && window.SQ_HUB) window.SQ_HUB.close();
  i = Math.max(0, Math.min(SL.length - 1, start || 0)); const r = document.createElement('div'); r.id = 'pres'; r.className = 'prwrap'; r.setAttribute('role', 'dialog'); r.setAttribute('aria-label', 'Presentation');
  r.innerHTML = '<div class="pr-top"><b>🎓 Storyland Quest</b><span class="pr-n"></span><span class="pr-clock"></span><span class="hsp"></span><button class="pr-b sm" data-p="notes" title="Speaker notes (N)">Notes</button><button class="pr-b sm" data-p="full" title="Full screen (F)">⛶</button><button class="pr-b sm" data-p="close">✕ Exit</button></div><div class="pr-viewport"></div><div class="pr-notes" hidden></div><div class="pr-nav"><button class="pr-b" data-p="prev" aria-label="Previous slide">←</button><div class="pr-bar"><i></i></div><button class="pr-b gold" data-p="next" aria-label="Next slide">→</button></div>';
  document.body.appendChild(r); draw(0); clearInterval(tid); tid = setInterval(tick, 1000); window.addEventListener('resize', fit); try { C.sfx.win(); } catch (e) {}
}
function close() { clearInterval(tid); window.removeEventListener('resize', fit); const r = root(); if (r) { r.classList.add('out'); setTimeout(() => r.remove(), 220); } }
const toggleFull = () => { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (er) {} };
const clock = () => { t0 = t0 ? 0 : performance.now(); tick(); };
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-p]'); if (!b || !root()) return; const k = b.dataset.p;
  if (k === 'next') go(i + 1); else if (k === 'prev') go(i - 1); else if (k === 'close') close();
  else if (k === 'notes') { notes = !notes; draw(0); } else if (k === 'full') toggleFull();
  else if (k === 'hub') { close(); setTimeout(() => window.SQ_HUB && window.SQ_HUB.open(), 240); }
  else if (k === 'tutor') { close(); setTimeout(() => { try { G.actions.qaOpen && G.actions.qaOpen(); G.actions.dmPre && G.actions.dmPre({ k: 'tutor' }); } catch (er) {} }, 240); }
  else if (k === 'vclear') { if (vurl) URL.revokeObjectURL(vurl); vurl = ''; draw(0); }
  else if (k === 'conn') { const o = document.getElementById('pr-out'); if (o) o.textContent = 'Connecting…'; C.connectAI().then(r => { const st = document.getElementById('pr-st'); if (st) st.innerHTML = statusHtml(); const o2 = document.getElementById('pr-out'); if (o2) o2.textContent = r && r.ok ? 'Connected.' : (r && r.error) || 'Not allowed.'; }); }
  else if (k === 'test') { const o = document.getElementById('pr-out'); if (!live()) { if (o) o.textContent = 'AI is off, so there is nothing live to test. Connect first.'; return; } o.textContent = 'Asking Claude…'; const t1 = performance.now();
    C.aiRaw('Reply with JSON only, no prose: {"question":"<one reading-comprehension question, 20 words or fewer, answerable from the sentence>"}. Sentence: "Ari looked through the telescope and saw a bright planet with rings."')
      .then(x => { const q = x && (x.question || (typeof x === 'string' ? x : '')), o2 = document.getElementById('pr-out'); if (!o2) return; o2.innerHTML = q ? `Live reply in ${((performance.now() - t1) / 1000).toFixed(1)}s<br><b>“${esc(String(q))}”</b>` : 'No reply. The app would fall back to labelled fixtures.'; try { q ? C.sfx.ok() : C.sfx.bad(); } catch (er) {} }); }
});
document.addEventListener('change', e => { if (e.target.id === 'pr-file' && e.target.files[0]) { vurl = URL.createObjectURL(e.target.files[0]); draw(0); } });
document.addEventListener('sq-ai', () => { const st = document.getElementById('pr-st'); if (st) st.innerHTML = statusHtml(); });
document.addEventListener('keydown', e => { const typing = /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '');
  if (!root()) { if ((e.key === 'p' || e.key === 'P') && !typing && document.getElementById('hub')) open(); return; }
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); go(i + 1); } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(i - 1); }
  else if (e.key === 'Home') go(0); else if (e.key === 'End') go(SL.length - 1);
  else if (e.key === 'Escape') close(); else if (e.key === 'f' || e.key === 'F') toggleFull(); else if (e.key === 'n' || e.key === 'N') { notes = !notes; draw(0); } else if (e.key === 't' || e.key === 'T') clock(); }, true);
G.presentOpen = open; window.SQ_PRESENT = { open, close, slides: SL.map(s => s.sec || s.h), count: SL.length };
G.actions.presentOpen = () => open();
});
