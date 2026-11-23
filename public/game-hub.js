/* Storyland Quest – Presentation Hub.
   One screen for the class presentation: the AI story, a timed run sheet with launch buttons, a live validator,
   evidence, Q&A rehearsal, the evaluation sheet, team/rubric, a submission checklist and the course documents.
   It never touches players, attempts or the main save (its own small storage key holds only the presenter's notes). */
window.SQ_PARTS.push((G, C) => {
'use strict';
const { S, $, esc } = C, A = G.actions;
const KEY = 'storyland_hub_v1';
const DOCS = window.SQ_HUB_DOCS || [];

/* ---------- tiny local store (presenter notes only) ---------- */
let ST = { checks: {}, trials: {}, team: {}, speak: {}, done: {} };
try { const r = JSON.parse(localStorage.getItem(KEY) || 'null'); if (r && typeof r === 'object') ST = Object.assign(ST, r); } catch (e) { /* storage may be blocked */ }
const store = () => { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { /* ignore */ } };

/* ---------- sound (respects the sound setting) ---------- */
let ac;
const on = () => S.settings && S.settings.sound !== false;
function beep(notes, type = 'sine', vol = .09) {
  if (!on()) return;
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); let t = ac.currentTime;
    notes.forEach(([f, d]) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d); t += d * .7; }); } catch (e) { /* ignore */ }
}
function swish(d = .22, from = 300, to = 2600, vol = .035) {
  if (!on()) return;
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const n = Math.floor(ac.sampleRate * d), buf = ac.createBuffer(1, n, ac.sampleRate), ch = buf.getChannelData(0); for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), t = ac.currentTime; src.buffer = buf; f.type = 'bandpass'; f.Q.value = 1.1; f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + d * .4); g.gain.exponentialRampToValueAtTime(.0001, t + d); src.connect(f).connect(g).connect(ac.destination); src.start(t); } catch (e) { /* ignore */ }
}
const FX = {
  open: () => { swish(.3, 250, 3000); beep([[523, .1], [659, .1], [784, .16]], 'triangle', .07); },
  close: () => { swish(.2, 2200, 300, .03); beep([[659, .08], [440, .12]], 'triangle', .06); },
  tab: () => { swish(.14, 500, 2200, .025); },
  tick: () => beep([[880, .04]], 'sine', .04),
  check: () => beep([[784, .06], [1175, .14]], 'sine', .08),
  done: () => beep([[523, .1], [659, .1], [784, .1], [1047, .3]], 'triangle', .09),
  good: () => beep([[660, .1], [990, .2]], 'sine', .08),
  bad: () => beep([[240, .2]], 'triangle', .08),
  go: () => { swish(.35, 200, 3200, .05); beep([[440, .08], [660, .08], [880, .2]], 'square', .05); }
};
G.hubFx = FX;

/* ---------- content ---------- */
const TABS = [['overview', '✨', 'Overview'], ['run', '⏱', 'Run sheet'], ['ai', '🧠', 'AI & safeguards'], ['evidence', '📋', 'Evidence'], ['qa', '💬', 'Q&A practice'], ['eval', '🧪', 'Evaluation'], ['team', '👥', 'Team & rubric'], ['check', '✅', 'Checklist'], ['docs', '📚', 'Documents']];

const FEATURES = [
  ['🔭', 'Pip drafts targeted practice', 'A teacher approves a passage and a skill; Pip drafts a guided and an independent question with exact supporting quotes, a clue and feedback for every option.', 'Draft → quote check → teacher approves', 'tutor', 'Open the teacher view'],
  ['🦊', 'Ask Pip (in-battle tutor)', 'A hint written from the actual question on screen, then a tutor reply to the child’s own words. Answers are never handed over.', 'Live / Saved / Rule-based, labelled', 'quick', 'Watch it in the run-through'],
  ['💭', 'Explain My Thinking', 'The learner picks the sentence that helped or writes a short reason; the teacher sees the reason beside the answer.', 'Child words kept as evidence', 'quick', 'Watch it in the run-through'],
  ['🎧', 'Reading support', 'Tap-a-hard-word reading with a counts-based note. The note says tap mode, not speech, and does not guess at causes.', 'Rule-based note, AI rewording optional', 'quick', 'Watch it in the run-through'],
  ['👥', 'Group lessons', 'Code groups learners by evidence; AI only drafts the lesson wording, which the teacher reviews before use.', 'Code groups · AI words · teacher approves', 'quick', 'Watch it in the run-through'],
  ['💌', 'Parent report', 'A plain-language summary with a next home activity. In the demo the email is a dry run and nothing is sent.', 'Dry run in demo', 'quick', 'Watch it in the run-through']
];

const RUN = [
  ['0:00', '1:00', 'Evidence first', 'Open the teacher view. Say that Ari is an invented test profile. Show three independent first attempts and the repeated “detail instead of cause” pattern. Name the skill: causal inference.', [['tutor', 'Open Ari’s teacher view']]],
  ['1:00', '3:00', 'Create a targeted battle', 'Expand Create targeted battle, approve the telescope passage, then generate. State the mode out loud (live, saved or authored fixture). Show one exact quote and say whether it really justifies the key. Approve one item.', []],
  ['3:00', '5:00', 'Play the approved practice', 'Launch the battle as Ari. Pick the tempting bench answer, read the feedback, retry with the clue, cast a move. Explain: the helped retry is not independent evidence.', []],
  ['5:00', '7:00', 'Change the source', 'Show the controlled source change (tree → fog). If a retained real model run exists, show the new item and quote. If not, say this experiment is pending and show the design, never present the fixture as model output.', [['tab:eval', 'Open the source-change panel']]],
  ['7:00', '9:00', 'Game showcase', 'Use the QA Adventurer for a short companion, Move Book or trail showcase. Say that skips and QA results are synthetic and excluded from evidence.', [['show', 'Open showcase'], ['qa', 'QA map']]],
  ['9:00', '10:00', 'Limits and close', 'Show the evidence log and one real limitation. End on what the prototype shows and what a study would need. Leave the screen ready for questions.', [['tab:evidence', 'Open the evidence log']]]
];

const QA = [
  ['Why does this need generative AI?', 'The variable task is writing new, passage-specific practice and feedback for an observed error pattern. A fixed bank is our baseline. We still need measured comparisons to show where drafting is more useful or efficient.'],
  ['How does it know the learner’s weakness?', 'Explicit rules summarize independent first attempts and repeated wrong-choice tags on authored distractors. That gives a tentative suggestion a teacher confirms. It is not a diagnosis.'],
  ['What stops hallucinations?', 'Structured validation checks the output form and that every quote is an exact piece of the cited sentence. Teacher review checks meaning, key defensibility and age fit. Neither is perfect, so we keep traces and rejected drafts.'],
  ['Is what we’re seeing AI-generated?', 'Check the mode badge. Every AI moment is labelled Live AI response, Saved AI response, Authored demo fixture or Rule-based feedback. A fixture is hand-written and is never described as a model result.'],
  ['Have children learned more with it?', 'We have functional walkthrough evidence and no controlled learning study. We make no measured improvement claim.'],
  ['What did the team do?', 'Michelle supplied the original idea and Caleb built the prototype. Describe the other members’ tasks only once they are completed and recorded. Each presenter explains their own evidence.'],
  ['Why pets and battles?', 'They give a short practice task a visible goal and reward. Their educational value must be tested separately from item correctness; the core feature is feedback and fresh practice.'],
  ['How is Ask Pip different from a chatbot?', 'It is bound to the question on screen, it is told not to reveal the answer, replies are validated before display, and if the model is slow or fails the child gets a clearly labelled rule-based hint instead.'],
  ['What happens if AI is down during the demo?', 'The game keeps working. Hints fall back to rule-based feedback, drafts load the labelled authored fixture, and the automated run-through plays with no key at all.'],
  ['Can the demo send a real email?', 'No. The run-through only does an email dry run. Real sending needs a configured server and an explicit adult action.'],
  ['Where is child data stored?', 'In this demo, in the browser on this device. The run-through uses a separate synthetic session and leaves real players untouched. A real deployment would need authenticated adult roles and a verified retention policy.']
];

const EVID = [
  ['E01', '2026-11-13', 'Historical walkthrough', 'Synthetic new player', 'Select Sky Bird egg; finish warm-up; open result', 'Matching baby and hatch reveal', 'Pass observed on dated build', 'Public build may have changed'],
  ['E02', '2026-11-13', 'Historical walkthrough', 'Synthetic learner', 'Submit incorrect warm-up answer', 'Pip HP 12 to 10 and retry', 'Pass observed on dated build', 'No broad difficulty test'],
  ['E03', '2026-11-13', 'Historical walkthrough', 'Ari (synthetic)', 'Approve fixture; choose bench; retry; cast', 'Approved practice played to victory', 'Pass observed on dated build', 'Authored offline content'],
  ['E04', '2026-11-17', 'Historical walkthrough', 'Full Inventory QA', 'Complete shell activity and ring bell', '15-coin reward and ferry outcome', 'Pass observed on dated build', 'Synthetic QA; no learning claim'],
  ['E05', '2026-11-18', 'Public inspection', 'Full Inventory QA', 'Open map', 'Continue Adventure; QA; AI off displayed', 'Observed', 'Current UI only'],
  ['E06', '2026-11-18', 'Public inspection', 'Ari (synthetic)', 'Open evidence and targeted battle', 'Practice suggestion and source approval', 'Observed', 'No source audit'],
  ['E07', '2026-11-18', 'Public interaction', 'Ari (synthetic)', 'Approve telescope source; load offline fixture', 'Guided 2/2 and independent 3/3 quote flags; approve controls', 'Pass for interface path', 'Quote meaning still needs review; live AI off'],
  ['E08', '2026-11-18', 'Local structural validation', 'Hand-authored fixture', 'Run six checks per item; reject three damaged variants', '2 items passed; 5 quotes matched; 3 variants rejected', 'Pass', 'Local fixture only; no semantic or live-model result'],
  ['E09', '2026-11-22', 'Automated run-through (build check)', 'Synthetic demo session', 'Play the Quick overview start to finish', 'Completed with no step errors in about 3 minutes', 'Pass observed on dated build', 'Timer-based narration estimate; audible voice not checked'],
  ['E10', '2026-11-22', 'Automated run-through (build check)', 'Synthetic demo session', 'Run Full-demo chapters one at a time (Ask Pip, Explain My Thinking, reading support, dashboard, group lesson, parent report, AI checks)', 'Each chapter completed', 'Pass observed on dated build', 'Not one uninterrupted pass of all 43 steps'],
  ['E11', '2026-11-22', 'Storage comparison', 'Real player saves', 'Compare saved data before, during and after a tour', 'Identical', 'Pass observed on dated build', 'Browser storage only'],
  ['E12', '2026-11-22', 'Automated run-through (build check)', 'Synthetic demo session', 'One uninterrupted Full demo on a foreground window', 'Not yet completed; pane was hidden mid-run', 'Pending', 'Needs a clean rehearsal'],
  ['P01', '', 'Pending experiment', 'Synthetic profiles', 'Paired fixed-bank and generated item trial', '', 'Pending', 'No results recorded'],
  ['P02', '', 'Pending experiment', 'Synthetic profile', 'Change source cause and regenerate', '', 'Pending', 'Needs an actual model trace'],
  ['P03', '', 'Pending evaluation', 'Teacher reviewers', 'Measure review time and edits', '', 'Pending', 'Needs reviewer participation']
];

const RUBRIC = [
  ['Problem originality', '15%', 'Overview: the teacher-authoring problem; Run sheet block 1', 'Explain the source-specific authoring problem', 'overview'],
  ['Significance', '10%', 'Overview + Documents (stakeholders, background)', 'Confirm team wording and scenario', 'docs'],
  ['Appropriate generative AI', '20%', 'AI & safeguards tab; Evaluation tab', 'Retain an actual live or saved model run', 'ai'],
  ['System design', '15%', 'AI & safeguards (who decides what); Documents', 'Confirm against the editable source', 'ai'],
  ['Prototype implementation', '15%', 'Run sheet, automated run-through', 'Rerun on the presentation version', 'run'],
  ['Final presentation', '15%', 'Run sheet, Q&A practice, presenter timer', 'Assign all five speakers and rehearse', 'run'],
  ['Team collaboration', '10%', 'Team & rubric tab', 'Record completed contributions honestly', 'team']
];

const TEAM = [
  ['Caleb Passafiume', 'Prototype development', 'Freeze source and capture a runtime trace'],
  ['Michelle Smith', 'Original project idea', 'Review problem statement and instructional rationale'],
  ['Maryse Pichette', 'No completed task reported', 'Record paired evaluation and reviewer observations'],
  ['Rishit Dass', 'No completed task reported', 'Review answer keys and source citations'],
  ['Taylor Bennett', 'No completed task reported', 'Check the report and coordinate presentation rehearsal']
];

const CHECK = [
  ['Package', ['Three-page proposal with all five members, motivation, problem, objectives, tools, outcomes and timeline', 'Progress demonstration brief: prompting strategy, current challenges, next work', 'Report draft (12 pt Times New Roman) with all twelve required topic areas', 'Twenty-minute presentation outline with speaker notes', 'Ten-minute demonstration run sheet and five-minute Q&A preparation', 'Dated observations, local validation and a protocol for the pending experiment', 'Team contribution log and rubric coverage map']],
  ['Needs the team', ['Confirm the architecture and runtime model identifier against the editable project', 'Retain a real live generation or genuine saved trace', 'Run the paired comparison and record real results; update report and slides', 'Agree and complete each member’s task; update the contribution log from evidence', 'Assign all five presenters a speaking block and rehearse', 'Confirm with the instructor that 20 + 10 + 5 minutes fits the slot', 'Rehearse the Full run-through once on the presentation computer', 'Read the report together, check references, acknowledge AI assistance']]
];

/* validator fixture (hand-authored; labelled as such everywhere it appears) */
const PASSAGE = [['s1', 'Rin set a telescope beside a red bench.'], ['s2', 'A tall tree hid the moon from that spot.'], ['s3', 'Rin carried the telescope to the open field.'], ['s4', 'From the field, Rin could see the moon through the lens.'], ['s5', 'When the wind shook the tripod, the moon slid out of view.'], ['s6', 'Rin moved the tripod behind a stone wall, where the air was still.'], ['s7', 'The moon stayed in view long enough for Rin to draw it.']];
const FOG = [['s1', 'Rin set a telescope beside a red bench.'], ['s2', 'A thick fog hid the moon from that spot.'], ['s3', 'Rin carried the telescope to an observation deck above the fog.'], ['s4', 'From the deck, Rin could see the moon through the lens.'], ['s5', 'When the wind shook the tripod, the moon slid out of view.'], ['s6', 'Rin moved the tripod behind a stone wall, where the air was still.'], ['s7', 'The moon stayed in view long enough for Rin to draw it.']];
const FIXTURE = [
  { id: 'fixture-1', difficulty: 'guided', question: 'Why did Rin carry the telescope to the field?', options: [['a', 'To see past the tree.'], ['b', 'To sit on the red bench.'], ['c', 'To hide from the wind.'], ['d', 'To put away the lens.']], correctId: 'a',
    citations: [['s2', 'A tall tree hid the moon from that spot.'], ['s4', 'From the field, Rin could see the moon through the lens.']], hint: 'Read what hid the moon. What changed when Rin moved?',
    feedback: { a: 'Yes. The tree blocked the view by the bench. From the open field, Rin could see the moon.', b: 'The bench tells you where Rin started. What made the moon hard to see there?', c: 'Wind caused a problem later. Look for what blocked the moon at the first spot.', d: 'Rin still used the lens in the field. Look for what had been in the way.' } },
  { id: 'fixture-2', difficulty: 'independent', question: 'How did the wall help Rin finish the drawing?', options: [['a', 'It made the moon brighter.'], ['b', 'It helped keep the tripod still.'], ['c', 'It held the drawing up.'], ['d', 'It moved the red bench.']], correctId: 'b',
    citations: [['s5', 'the wind shook the tripod'], ['s6', 'behind a stone wall, where the air was still'], ['s7', 'The moon stayed in view long enough for Rin to draw it.']], hint: 'Compare what happened in the wind with what happened behind the wall.',
    feedback: { a: 'The story describes a change in the wind. What did the wind do to the tripod?', b: 'Yes. The tripod stopped shaking in the still air, so Rin could keep looking at the moon.', c: 'Rin drew the moon after it stayed in view. Look for what made the view steady.', d: 'The bench was at the first spot. Look at what happened after the tripod moved.' } }
];
const BANK = { context: 'Mira took her paper kite down. The string had begun to tear.', question: 'Why did Mira take down her kite?', options: ['The string was tearing.', 'The kite was made of paper.', 'Mira wanted to find a kite.', 'The kite had a short tail.'], correct: 0 };
const CHECKS = [['ids', 'Four unique option IDs'], ['texts', 'Four unique option texts'], ['key', 'Correct key exists'], ['fb', 'Feedback covers every option'], ['quotes', 'Every quote is exact text from its sentence'], ['len', 'Question is 20 words or fewer']];
function validate(item, passage) {
  const ids = item.options.map(o => o[0]), tx = item.options.map(o => o[1].trim().toLowerCase()), src = Object.fromEntries(passage);
  return { ids: ids.length === 4 && new Set(ids).size === 4, texts: new Set(tx).size === 4, key: ids.includes(item.correctId),
    fb: ids.every(i => item.feedback[i]) && Object.keys(item.feedback).length === ids.length,
    quotes: item.citations.length > 0 && item.citations.every(([sid, q]) => src[sid] && q && src[sid].includes(q)), len: item.question.trim().split(/\s+/).length <= 20 };
}
const clone = o => JSON.parse(JSON.stringify(o));
const DAMAGE = { key: it => { it.correctId = 'z'; return 'Key removed (correct answer ID “z” is not an option)'; }, dup: it => { it.options[1][1] = it.options[0][1]; return 'Duplicate option (B now repeats A)'; }, quote: it => { it.citations[0][1] = 'A giant owl hid the moon.'; return 'Invented quote that is not in the passage'; } };

/* ---------- state ---------- */
let H = null; // { tab, doc, q, reveal, vstate, ... }
let timer = { run: false, left: 600, last: 0, id: 0 };
const fmt = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const aiState = () => { const a = C.AI(); return a.on ? { on: true, txt: `AI is connected${a.provider ? ' · ' + a.provider : ''}. Replies are live when they arrive in time and pass the checks; otherwise a labelled fallback is shown.` } : { on: false, txt: 'AI is off in this session. Drafts use the labelled authored fixture and hints use rule-based feedback. Nothing is described as a model result.' }; };
const chip = (cls, t) => `<span class="hb ${cls}">${esc(t)}</span>`;
const statusCls = s => /^Pass/.test(s) ? 'pass' : /^Pending/.test(s) ? 'pend' : 'obs';

/* ---------- renderers ---------- */
function mdHtml(md) {
  const lines = md.split('\n'); const out = []; let list = null, code = null;
  const flush = () => { if (list) { out.push('</ul>'); list = null; } };
  for (const raw of lines) {
    if (/^```/.test(raw)) { if (code === null) { flush(); code = []; } else { out.push('<pre class="hcode">' + esc(code.join('\n')) + '</pre>'); code = null; } continue; }
    if (code !== null) { code.push(raw); continue; }
    const l = raw.trimEnd();
    if (!l.trim()) { flush(); continue; }
    let m;
    if ((m = /^(#{1,3})\s+(.*)/.exec(l))) { flush(); out.push(`<h${m[1].length + 2} class="hh">${esc(m[2])}</h${m[1].length + 2}>`); }
    else if ((m = /^\s*[-*]\s+(.*)/.exec(l)) || (m = /^\s*\d+\.\s+(.*)/.exec(l))) { if (!list) { out.push('<ul>'); list = 1; } out.push('<li>' + inline(m[1]) + '</li>'); }
    else { flush(); out.push('<p>' + inline(l) + '</p>'); }
  }
  flush(); return out.join('');
}
const inline = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>');

const T = {
  overview() {
    const ai = aiState();
    return `<div class="hhero"><div><span class="hkick">COSC1367 · Generative AI team project</span><h1>Storyland Quest</h1>
      <p class="hlead">Pip, an AI guide, drafts <b>reviewable</b> reading practice from a teacher’s own passage and a learner’s real error pattern. The game delivers it. The teacher stays in charge.</p>
      <div class="hrow"><button class="hbtn pri" data-h="go" data-k="quick">▶ Play the 3-minute tour</button><button class="hbtn" data-h="go" data-k="full">▶ Full tour (~9 min)</button><button class="hbtn" data-h="go" data-k="tutor">Open Ari’s teacher view</button></div></div>
      <div class="hmodeb ${ai.on ? 'live' : ''}"><b>${ai.on ? '● AI connected' : '○ AI off'}</b><span>${esc(ai.txt)}</span></div></div>
    <h2 class="hsec">Who decides what</h2>
    <div class="hwho"><div><b>Code decides</b><span>Scores, groups, unlocks, rewards, which attempts count as independent evidence</span></div><div class="ai"><b>AI writes</b><span>Questions, clues, feedback wording, tutor replies — always labelled, always validated</span></div><div><b>Teacher approves</b><span>Anything that changes instruction: sources, drafts, group lessons</span></div></div>
    <h2 class="hsec">The AI features</h2><div class="hgrid">${FEATURES.map((f, i) => `<article class="hcard" style="--i:${i}"><div class="hic">${f[0]}</div><h3>${esc(f[1])}</h3><p>${esc(f[2])}</p><div class="hbadge">${esc(f[3])}</div><button class="hbtn sm" data-h="go" data-k="${f[4]}">${esc(f[5])}</button></article>`).join('')}</div>
    <h2 class="hsec">Honest limits, up front</h2>
    <ul class="hlist"><li>No controlled learning study. We claim a working workflow, not a reading gain.</li><li>The reviewed Nov 18 build showed AI off; a retained live model trace is still a to-do.</li><li>Fixtures are hand-written and always labelled as such.</li></ul>`;
  },
  run() {
    const el = timer.left, used = 600 - el;
    return `<div class="htimer"><div class="hring" style="--p:${Math.min(1, used / 600) * 360}deg"><b id="h-time">${fmt(timer.left)}</b></div>
      <div><b>Presenter timer</b><span>10-minute demo block</span><div class="hrow"><button class="hbtn sm pri" data-h="tstart">${timer.run ? '⏸ Pause' : '▶ Start'}</button><button class="hbtn sm" data-h="treset">↺ Reset</button></div></div></div>
    <ol class="hrun">${RUN.map((r, i) => { const a = this.sec(r[0]), b = this.sec(r[1]), now = used >= a && used < b && (timer.run || used > 0); return `<li class="${now ? 'now' : ''} ${ST.done['r' + i] ? 'done' : ''}" style="--i:${i}"><div class="hrt"><b>${r[0]}–${r[1]}</b></div><div class="hrb"><h3>${esc(r[2])}</h3><p>${esc(r[3])}</p><div class="hrow">${r[4].map(x => `<button class="hbtn sm pri" data-h="go" data-k="${x[0]}">${esc(x[1])}</button>`).join('')}<label class="hck"><input type="checkbox" data-h="rdone" data-k="r${i}" ${ST.done['r' + i] ? 'checked' : ''}> done</label></div></div></li>`; }).join('')}</ol>
    <div class="hcall"><b>If anything breaks</b><span>Play the automated run-through. It works with no key and no network, and every AI moment is labelled.</span><div class="hrow"><button class="hbtn sm" data-h="go" data-k="quick">▶ Quick tour</button><button class="hbtn sm" data-h="go" data-k="full">▶ Full tour</button></div></div>
    <p class="hnote">Click rule: say aloud which person is clicking and which mode the audience is seeing before each block.</p>`;
  },
  sec: s => { const [m, x] = s.split(':'); return +m * 60 + +x; },
  ai() {
    const ai = aiState(), res = H.vres;
    const rows = FIXTURE.map(it => { const r = validate(it, PASSAGE); return `<tr><th>${esc(it.id)} <small>${it.difficulty}</small></th>${CHECKS.map(c => `<td class="${r[c[0]] ? 'ok' : 'no'}">${r[c[0]] ? '✓' : '✗'}</td>`).join('')}</tr>`; }).join('');
    const dmg = H.dmg ? (() => { const it = clone(FIXTURE[0]); const what = DAMAGE[H.dmg](it); const r = validate(it, PASSAGE); const bad = CHECKS.filter(c => !r[c[0]]); return `<div class="hdmg ${bad.length ? 'caught' : 'missed'}"><b>${bad.length ? '🛑 Rejected' : '⚠ Not caught'}</b> — ${esc(what)}<br><small>Failed: ${bad.length ? bad.map(c => esc(c[1])).join('; ') : 'none'}</small></div>`; })() : '';
    return `<div class="hmodeb ${ai.on ? 'live' : ''}"><b>${ai.on ? '● AI connected' : '○ AI off'}</b><span>${esc(ai.txt)}</span></div>
    <h2 class="hsec">Draft → check → teacher approves</h2>
    <div class="hflow"><div><b>1 Evidence</b><span>Rules read independent first attempts</span></div><i>→</i><div><b>2 Source</b><span>Teacher approves the passage</span></div><i>→</i><div class="ai"><b>3 Pip drafts</b><span>Two items, quotes, clue, feedback</span></div><i>→</i><div><b>4 Checks</b><span>Structure and exact quotes</span></div><i>→</i><div><b>5 Teacher</b><span>Judges meaning, then approves</span></div></div>
    <h2 class="hsec">Live validator <small>runs in this page on the authored telescope fixture</small></h2>
    <div class="hscroll"><table class="htbl vt"><thead><tr><th>Item</th>${CHECKS.map(c => `<th>${esc(c[1])}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
    <div class="hrow"><span class="hlab">Damage item 1 and watch it get caught:</span><button class="hbtn sm" data-h="dmg" data-k="key">Remove the key</button><button class="hbtn sm" data-h="dmg" data-k="dup">Duplicate an option</button><button class="hbtn sm" data-h="dmg" data-k="quote">Invent a quote</button></div>${dmg}
    <p class="hnote">Structure and quotes are checked by code. Whether the quote really <i>justifies</i> the answer still needs a teacher. This validator does not measure model accuracy.</p>
    <h2 class="hsec">Fixed bank vs generated <small>generated side is an authored fixture, not a model output</small></h2>
    <div class="hcmp"><section><h4>Fixed bank item ${chip('obs', 'reviewed bank')}</h4><p class="ctx">${esc(BANK.context)}</p><p><b>${esc(BANK.question)}</b></p><ul>${BANK.options.map((o, i) => `<li class="${i === BANK.correct ? 'key' : ''}">${esc(o)}</li>`).join('')}</ul><small>Stable, reviewed, but not about the teacher’s new passage or this learner’s mistake.</small></section>
    <section><h4>Targeted draft ${chip('fix', 'authored fixture')}</h4><p class="ctx">${esc(PASSAGE.map(p => p[1]).join(' '))}</p><p><b>${esc(FIXTURE[0].question)}</b></p><ul>${FIXTURE[0].options.map(o => `<li class="${o[0] === FIXTURE[0].correctId ? 'key' : ''}">${esc(o[1])}</li>`).join('')}</ul><small>Quotes: “${esc(FIXTURE[0].citations[0][1])}” + “${esc(FIXTURE[0].citations[1][1])}”<br>Hint: ${esc(FIXTURE[0].hint)}</small></section></div>
    <h2 class="hsec">The prompt contract</h2>
    <details class="hdet"><summary>Show the system prompt and rules</summary>${mdHtml((DOCS.find(d => d.id === 'prompt') || { md: '' }).md)}</details>`;
  },
  evidence() {
    const f = H.ef || 'all', rows = EVID.filter(r => f === 'all' || (f === 'pend' ? statusCls(r[6]) === 'pend' : statusCls(r[6]) !== 'pend'));
    const n = k => EVID.filter(r => statusCls(r[6]) === k).length;
    return `<div class="hstats"><div><b>${n('pass')}</b><span>passed on a dated build</span></div><div><b>${n('obs')}</b><span>observed only</span></div><div class="pend"><b>${n('pend')}</b><span>pending, not claimed</span></div></div>
    <div class="hrow"><button class="hbtn sm ${f === 'all' ? 'pri' : ''}" data-h="ef" data-k="all">All</button><button class="hbtn sm ${f === 'done' ? 'pri' : ''}" data-h="ef" data-k="done">Done</button><button class="hbtn sm ${f === 'pend' ? 'pri' : ''}" data-h="ef" data-k="pend">Pending</button></div>
    <div class="hscroll"><table class="htbl ev"><thead><tr><th>ID</th><th>Date</th><th>Method</th><th>Profile</th><th>Action</th><th>Outcome</th><th>Status</th><th>Limit</th></tr></thead><tbody>${rows.map(r => `<tr><td><b>${r[0]}</b></td><td>${r[1] || '—'}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td>${esc(r[4])}</td><td>${esc(r[5] || '—')}</td><td>${chip(statusCls(r[6]), r[6])}</td><td>${esc(r[7])}</td></tr>`).join('')}</tbody></table></div>
    <p class="hnote">E01–E08 are carried over from the Nov 18 package. E09–E12 are build checks from Nov 22. “Pending” means nothing is claimed yet.</p>`;
  },
  qa() {
    return `<div class="hrow"><button class="hbtn sm ${H.reveal ? '' : 'pri'}" data-h="reveal">${H.reveal ? '🙈 Hide all answers' : '👀 Show all answers'}</button><span class="hlab">Tap a question to practise, then reveal the suggested answer.</span></div>
    <div class="hqa">${QA.map((q, i) => `<details class="hqd" style="--i:${i}" ${H.reveal ? 'open' : ''}><summary>${esc(q[0])}</summary><p>${esc(q[1])}</p></details>`).join('')}</div>`;
  },
  eval() {
    const TR = Array.from({ length: 12 }, (_, i) => 'T' + String(i + 1).padStart(2, '0'));
    const v = (id, k) => ((ST.trials[id] || {})[k] || '');
    const filled = TR.filter(id => v(id, 'cond') && v(id, 'acc'));
    const gen = filled.filter(id => v(id, 'cond') === 'generated'), acc = gen.filter(id => v(id, 'acc') === 'accepted');
    const secs = filled.map(id => +v(id, 'sec')).filter(x => x > 0).sort((a, b) => a - b), med = secs.length ? (secs.length % 2 ? secs[(secs.length - 1) / 2] : (secs[secs.length / 2 - 1] + secs[secs.length / 2]) / 2) : null;
    const diff = (a, b, i) => a[i][1] !== b[i][1];
    return `<h2 class="hsec">Controlled source change <small>pending a real model run</small></h2>
    <p class="hnote">Hold the learner evidence and skill fixed. Change the cause in the passage. Generate again. The key, clue and quotes should follow the new source. An exact-quote check rejects a stale quotation; a teacher still judges meaning.</p>
    <div class="hcmp"><section><h4>Baseline source</h4><ol class="hsrc">${PASSAGE.map((p, i) => `<li class="${diff(PASSAGE, FOG, i) ? 'chg' : ''}"><i>${p[0]}</i> ${esc(p[1])}</li>`).join('')}</ol></section><section><h4>Changed source (tree → fog) ${chip('fix', 'authored for the test')}</h4><ol class="hsrc">${FOG.map((p, i) => `<li class="${diff(PASSAGE, FOG, i) ? 'chg' : ''}"><i>${p[0]}</i> ${esc(p[1])}</li>`).join('')}</ol></section></div>
    <p class="hnote">Highlighted sentences are the only edits. The team still needs to run and retain a real model experiment before reporting any result.</p>
    <h2 class="hsec">Paired comparison sheet</h2>
    <p class="hnote">Fill in real trials only. Acceptance and review time are calculated from filled rows; blank rows count for nothing. Data stays in this browser.</p>
    <div class="hscroll"><table class="htbl tr"><thead><tr><th>Trial</th><th>Condition</th><th>Outcome</th><th>Source ok</th><th>Unique key</th><th>Skill fit</th><th>Review s</th><th>Edits</th><th>Reviewer / note</th></tr></thead><tbody>
    ${TR.map(id => `<tr><td><b>${id}</b></td><td><select data-h="tr" data-id="${id}" data-f="cond" aria-label="${id} condition"><option value=""></option><option value="fixed" ${v(id, 'cond') === 'fixed' ? 'selected' : ''}>fixed bank</option><option value="generated" ${v(id, 'cond') === 'generated' ? 'selected' : ''}>generated</option></select></td>
      <td><select data-h="tr" data-id="${id}" data-f="acc" aria-label="${id} outcome"><option value=""></option><option value="accepted" ${v(id, 'acc') === 'accepted' ? 'selected' : ''}>accepted</option><option value="rejected" ${v(id, 'acc') === 'rejected' ? 'selected' : ''}>rejected</option><option value="failed" ${v(id, 'acc') === 'failed' ? 'selected' : ''}>provider failure</option></select></td>
      ${['src', 'uniq', 'skill'].map(f => `<td><select data-h="tr" data-id="${id}" data-f="${f}" aria-label="${id} ${f}"><option value=""></option><option value="y" ${v(id, f) === 'y' ? 'selected' : ''}>yes</option><option value="n" ${v(id, f) === 'n' ? 'selected' : ''}>no</option></select></td>`).join('')}
      <td><input class="hin s" inputmode="numeric" data-h="tr" data-id="${id}" data-f="sec" value="${esc(v(id, 'sec'))}" aria-label="${id} review seconds"></td><td><input class="hin s" inputmode="numeric" data-h="tr" data-id="${id}" data-f="edits" value="${esc(v(id, 'edits'))}" aria-label="${id} edits"></td><td><input class="hin" data-h="tr" data-id="${id}" data-f="who" value="${esc(v(id, 'who'))}" aria-label="${id} reviewer"></td></tr>`).join('')}
    </tbody></table></div>
    <div class="hstats"><div><b>${filled.length}</b><span>trials recorded</span></div><div><b>${gen.length ? Math.round(acc.length / gen.length * 100) + '%' : '—'}</b><span>generated drafts accepted${gen.length ? ` (${acc.length} of ${gen.length})` : ''}</span></div><div><b>${med === null ? '—' : med + ' s'}</b><span>median review time${secs.length ? ` (n=${secs.length})` : ''}</span></div></div>
    <div class="hrow"><button class="hbtn sm" data-h="csv">📋 Copy as CSV</button><button class="hbtn sm ghost" data-h="clear">Clear sheet</button><span class="hlab" id="h-msg"></span></div>
    <h2 class="hsec">How to run it</h2>${mdHtml((DOCS.find(d => d.id === 'protocol') || { md: '' }).md.replace(/^#.*\n/, ''))}`;
  },
  team() {
    const BL = RUN.map((r, i) => [i, r[2]]);
    return `<h2 class="hsec">Contributions <small>as reported Nov 18, edit as work is completed</small></h2>
    <div class="hscroll"><table class="htbl"><thead><tr><th>Member</th><th>Reported</th><th>Proposed next task (to agree)</th><th>Completed work evidence</th></tr></thead><tbody>${TEAM.map((t, i) => `<tr><td><b>${esc(t[0])}</b></td><td>${esc(t[1])}</td><td>${esc(t[2])}</td><td><input class="hin" data-h="team" data-i="${i}" value="${esc((ST.team || {})[i] || '')}" placeholder="Add only real, completed work" aria-label="Evidence for ${esc(t[0])}"></td></tr>`).join('')}</tbody></table></div>
    <p class="hnote">No completed work is attributed to a member until it is entered here. Every member should be able to explain the whole workflow.</p>
    <h2 class="hsec">Speaking plan <small>every member presents</small></h2>
    <div class="hscroll"><table class="htbl"><thead><tr><th>Block</th><th>Presenter</th><th>Clicking</th></tr></thead><tbody>${BL.map(([i, n]) => `<tr><td><b>${RUN[i][0]}</b> ${esc(n)}</td>${['talk', 'click'].map(k => `<td><select data-h="speak" data-i="${i}" data-k="${k}" aria-label="${esc(n)} ${k}"><option value=""></option>${TEAM.map(t => `<option ${((ST.speak[i] || {})[k]) === t[0] ? 'selected' : ''}>${esc(t[0])}</option>`).join('')}</select></td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <h2 class="hsec">Where the rubric is covered</h2>
    <div class="hscroll"><table class="htbl"><thead><tr><th>Criterion</th><th>Weight</th><th>In this demo</th><th>Still to do</th><th></th></tr></thead><tbody>${RUBRIC.map(r => `<tr><td><b>${esc(r[0])}</b></td><td>${r[1]}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td><button class="hbtn sm" data-h="tab" data-k="${r[4]}">Show</button></td></tr>`).join('')}</tbody></table></div>`;
  },
  check() {
    const all = CHECK.flatMap(g => g[1].map((t, i) => g[0] + i)), n = all.filter(k => ST.checks[k]).length, pct = Math.round(n / all.length * 100);
    return `<div class="hprog"><div><b>${n} of ${all.length} done</b><span>${pct}%</span></div><div class="hbar"><i style="width:${pct}%"></i></div></div>
    ${CHECK.map(g => `<h2 class="hsec">${esc(g[0])}</h2><ul class="hck2">${g[1].map((t, i) => { const k = g[0] + i; return `<li class="${ST.checks[k] ? 'on' : ''}"><label><input type="checkbox" data-h="chk" data-k="${k}" ${ST.checks[k] ? 'checked' : ''}><span>${esc(t)}</span></label></li>`; }).join('')}</ul>`).join('')}
    <p class="hnote">Tick only what is really done. Ticks are saved on this device.</p>`;
  },
  docs() {
    const q = (H.q || '').trim().toLowerCase(), d = DOCS.find(x => x.id === H.doc) || DOCS[0];
    const hits = x => q ? (x.md.toLowerCase().split(q).length - 1) : 0;
    let body = mdHtml(d.md);
    if (q) body = body.replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?![^<]*>)', 'gi'), '<mark>$1</mark>');
    return `<div class="hbanner">Drafts written Nov 18 from the public build. Since then the prototype has gained the automated run-through, Ask Pip, Explain My Thinking and more — update claims such as “AI off” or “no repository” before you submit.</div>
    <div class="hdocs"><nav aria-label="Documents"><input class="hin" id="h-q" type="search" placeholder="Search all documents" value="${esc(H.q || '')}" aria-label="Search documents">${DOCS.map(x => `<button class="hdn ${x.id === d.id ? 'on' : ''}" data-h="doc" data-k="${x.id}">${esc(x.title)}${q ? `<em>${hits(x)}</em>` : ''}</button>`).join('')}<small>Source files: ${esc(d.file)}</small></nav><article class="hread" tabindex="0">${body}</article></div>`;
  }
};

/* ---------- shell ---------- */
const hasClaudeHost = () => !!(window.claude && window.claude.use);
function aiStrip() {
  const a = C.AI(), live = a.on && !a.fixture;
  const why = live ? '' : hasClaudeHost() ? 'Not connected yet. Press Connect, then choose Allow.' : 'This page is not running inside Claude and no API key is set on this server. Open the shared Claude link while signed in, or start the server with ANTHROPIC_API_KEY.';
  return `<div class="hai ${live ? 'on' : 'off'}" id="h-ai"><span class="hdot"></span><b>${live ? 'Claude is live' : 'AI is off'}</b><span class="hai-t">${live ? esc(a.provider || 'Claude') + (a.model ? ' · ' + esc(a.model) : '') : esc(why)}</span><span class="hsp"></span>${live ? '<button class="hbtn sm" data-h="aitest">⚡ Run live test</button>' : (hasClaudeHost() ? '<button class="hbtn sm" data-h="aiconn">Connect Claude</button>' : '')}<output class="hai-out" id="h-aiout" aria-live="polite"></output></div>`;
}
function shell() {
  const t = TABS.find(x => x[0] === H.tab) || TABS[0];
  return `<div class="hubwrap" id="hub" role="dialog" aria-modal="true" aria-label="Presentation Hub"><div class="hub">
    <header class="hhead"><div class="hlogo">🎓<b>Class Demo Hub</b></div>${timer.run || timer.left < 600 ? `<button class="hpill" data-h="tab" data-k="run" title="Presenter timer"><span id="h-time2">${fmt(timer.left)}</span></button>` : ''}<span class="hsp"></span><button class="hbtn sm gold" data-h="present" title="Open slide view (P)">▶ Present</button><button class="hbtn sm ghost" data-h="full" title="Toggle full screen (F)">⛶</button><button class="hbtn sm" data-h="close" aria-label="Close hub">✕ Close</button></header>
    ${aiStrip()}
    <nav class="htabs" role="tablist">${TABS.map(x => `<button role="tab" aria-selected="${x[0] === H.tab}" class="${x[0] === H.tab ? 'on' : ''}" data-h="tab" data-k="${x[0]}"><span>${x[1]}</span>${x[2]}</button>`).join('')}</nav>
    <main class="hbody" id="hbody" data-tab="${t[0]}">${T[t[0]]()}</main>
    <footer class="hfoot"><span>← → switch tabs · Esc close</span></footer></div></div>`;
}
function render(keepScroll) {
  const w = $('#hub'); if (!w) return; const b = $('#hbody'), y = keepScroll && b ? b.scrollTop : 0;
  const keepQ = document.activeElement && document.activeElement.id === 'h-q' ? document.activeElement.selectionStart : -1;
  const tmp = document.createElement('div'); tmp.innerHTML = shell(); const nh = tmp.firstElementChild.querySelector('.hub');
  w.replaceChild(nh, w.querySelector('.hub')); const nb = $('#hbody'); if (nb) nb.scrollTop = y;
  if (keepQ >= 0) { const i = $('#h-q'); if (i) { i.focus(); i.setSelectionRange(keepQ, keepQ); } }
}
function openHub(tab) {
  if (window.SQ_TOUR_API && window.SQ_TOUR_API.get && window.SQ_TOUR_API.get()) return;
  const was = $('#hub'); if (was) { if (tab) go(tab); return; }
  H = H || { tab: 'overview', doc: 'report', q: '', reveal: false, ef: 'all' }; if (tab && TABS.some(x => x[0] === tab)) H.tab = tab;
  G.closePanel(); const pill = $('#hub-pill'); if (pill) pill.remove();
  const d = document.createElement('div'); d.innerHTML = shell(); document.body.appendChild(d.firstElementChild); document.body.classList.add('hubopen'); FX.open();
  const b = $('.hbody'); b && b.focus({ preventScroll: true });
}
function closeHub(quiet) {
  const w = $('#hub'); if (!w) return; if (!quiet) FX.close(); w.classList.add('out'); document.body.classList.remove('hubopen');
  setTimeout(() => w.remove(), quiet ? 0 : 200); pill();
}
function go(tab) { if (!TABS.some(x => x[0] === tab) || H.tab === tab) return; H.tab = tab; FX.tab(); render(false); const b = $('#hbody'); if (b) { b.classList.remove('swap'); void b.offsetWidth; b.classList.add('swap'); } }
function pill() { /* small reopen pill while the presenter timer is running */
  let p = $('#hub-pill'); const show = !$('#hub') && (timer.run || timer.left < 600) && !document.querySelector('.tourbar');
  if (!show) { if (p) p.remove(); return; }
  if (!p) { p = document.createElement('button'); p.id = 'hub-pill'; p.className = 'hubpill'; p.type = 'button'; p.addEventListener('click', () => openHub('run')); document.body.appendChild(p); }
  p.innerHTML = `🎓 <b>${fmt(timer.left)}</b>`; p.setAttribute('aria-label', 'Reopen Class Demo Hub, ' + fmt(timer.left) + ' left');
}
function tick() {
  if (!timer.run) return; const n = performance.now(); timer.left = Math.max(0, timer.left - (n - timer.last) / 1000); timer.last = n;
  const a = $('#h-time'), b = $('#h-time2'); if (a) a.textContent = fmt(timer.left); if (b) b.textContent = fmt(timer.left);
  const r = document.querySelector('.hring'); if (r) r.style.setProperty('--p', Math.min(1, (600 - timer.left) / 600) * 360 + 'deg');
  if (!$('#hub')) pill();
  if (timer.left <= 0) { timer.run = false; clearInterval(timer.id); FX.done(); if ($('#hub')) render(true); pill(); }
  else if ($('#hub') && H.tab === 'run' && Math.floor(timer.left) % 15 === 0) render(true);
}

/* ---------- launching things from the hub ---------- */
function launch(k) {
  if (k.startsWith('tab:')) return go(k.slice(4));
  if (k === 'full' || k === 'quick') { closeHub(true); FX.go(); setTimeout(() => A.tourStart({ m: k }), 60); return; }
  closeHub(true); FX.go();
  setTimeout(() => {
    try {
      if (k === 'qa') A.qaOpen();
      else if (k === 'show' || k === 'tutor') { A.qaOpen(); A.dmPre({ k }); }
      else if (k === 'dash') C.dash();
    } catch (e) { /* fall back to the dashboard */ try { C.dash(); } catch (e2) { /* ignore */ } }
    pill();
  }, 60);
}

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-h]'); if (!t || !t.closest('#hub')) return; const k = t.dataset.k, h = t.dataset.h;
  if (h === 'close') closeHub();
  else if (h === 'tab') go(k);
  else if (h === 'go') launch(k);
  else if (h === 'tstart') { if (timer.run) { timer.run = false; clearInterval(timer.id); FX.tick(); } else { if (timer.left <= 0) timer.left = 600; timer.run = true; timer.last = performance.now(); clearInterval(timer.id); timer.id = setInterval(tick, 500); FX.go(); } render(true); }
  else if (h === 'treset') { timer.run = false; clearInterval(timer.id); timer.left = 600; FX.tick(); render(true); pill(); }
  else if (h === 'present') { closeHub(); setTimeout(() => window.SQ_PRESENT && window.SQ_PRESENT.open(), 260); }
  else if (h === 'aiconn') { const o = document.getElementById('h-aiout'); if (o) o.textContent = 'Connecting…'; C.connectAI().then(r => { render(true); const o2 = document.getElementById('h-aiout'); if (o2 && !(r && r.ok)) o2.textContent = (r && r.error) || 'Not allowed.'; }); }
  else if (h === 'aitest') { const o = document.getElementById('h-aiout'); if (o) o.textContent = 'Asking Claude…'; const t0 = performance.now();
    C.aiRaw('Reply with JSON only, no prose: {"question":"<one reading-comprehension question, 20 words or fewer, answerable from the sentence>"}. Sentence: "Ari looked through the telescope and saw a bright planet with rings."')
      .then(r => { const q = r && (r.question || (typeof r === 'string' ? r : '')), ms = Math.round(performance.now() - t0), o2 = document.getElementById('h-aiout'); if (!o2) return;
        if (q) { o2.innerHTML = `Live reply in ${(ms / 1000).toFixed(1)}s: <b>“${esc(String(q))}”</b>`; FX.good(); } else { o2.textContent = 'No reply (timed out or not allowed). The app falls back to labelled fixtures.'; FX.bad(); } }); }
  else if (h === 'full') { const el = document.documentElement; try { document.fullscreenElement ? document.exitFullscreen() : (el.requestFullscreen && el.requestFullscreen()); } catch (er) { /* ignore */ } }
  else if (h === 'dmg') { H.dmg = k; FX.bad(); render(true); setTimeout(() => FX.good(), 160); }
  else if (h === 'ef') { H.ef = k; FX.tick(); render(true); }
  else if (h === 'reveal') { H.reveal = !H.reveal; FX.tick(); render(true); }
  else if (h === 'doc') { H.doc = k; FX.tick(); render(false); }
  else if (h === 'csv') csv();
  else if (h === 'clear') { if (t.dataset.sure) { ST.trials = {}; store(); FX.tick(); render(true); } else { t.dataset.sure = 1; t.textContent = 'Tap again to clear'; setTimeout(() => { t.dataset.sure = ''; t.textContent = 'Clear sheet'; }, 2500); } }
});
document.addEventListener('change', e => {
  const t = e.target.closest('[data-h]'); if (!t || !t.closest('#hub')) return; const h = t.dataset.h;
  if (h === 'chk') { ST.checks[t.dataset.k] = t.checked; store(); t.checked ? FX.check() : FX.tick(); if (t.checked) C.burst && C.burst(t.closest('li'), 6, ['✨', '⭐']);
    const all = CHECK.flatMap(g => g[1].map((x, i) => g[0] + i)); const full = all.every(k => ST.checks[k]); render(true); if (full) { FX.done(); C.confetti && C.confetti(50); } }
  else if (h === 'rdone') { ST.done[t.dataset.k] = t.checked; store(); t.checked ? FX.check() : FX.tick(); render(true); }
  else if (h === 'tr') { const id = t.dataset.id; ST.trials[id] = Object.assign(ST.trials[id] || {}, { [t.dataset.f]: t.value }); store(); FX.tick(); render(true); }
  else if (h === 'team') { ST.team = ST.team || {}; ST.team[t.dataset.i] = t.value; store(); FX.tick(); }
  else if (h === 'speak') { ST.speak[t.dataset.i] = Object.assign(ST.speak[t.dataset.i] || {}, { [t.dataset.k]: t.value }); store(); FX.tick(); }
});
document.addEventListener('input', e => { if (e.target.id === 'h-q' && $('#hub')) { H.q = e.target.value; render(true); } });
document.addEventListener('keydown', e => {
  if (!$('#hub')) return; const typing = /INPUT|TEXTAREA|SELECT/.test((e.target.tagName || ''));
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeHub(); }
  else if (!typing && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { const i = TABS.findIndex(x => x[0] === H.tab), n = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length][0]; go(n); e.preventDefault(); }
  else if (!typing && (e.key === 'f' || e.key === 'F')) { const b = document.querySelector('[data-h=full]'); b && b.click(); }
}, true);
function csv() {
  const rows = [['Trial', 'Condition', 'Outcome', 'Source_supported', 'Unique_correct_answer', 'Skill_fit', 'Review_seconds', 'Edits', 'Reviewer_note']];
  for (let i = 1; i <= 12; i++) { const id = 'T' + String(i).padStart(2, '0'), r = ST.trials[id] || {}; rows.push([id, r.cond, r.acc, r.src, r.uniq, r.skill, r.sec, r.edits, r.who].map(x => '"' + String(x || '').replace(/"/g, '""') + '"')); }
  const text = rows.map(r => r.join(',')).join('\n'), msg = $('#h-msg');
  const done = ok => { if (msg) msg.textContent = ok ? 'Copied to clipboard.' : 'Select the text below and copy it.'; if (ok) FX.good(); else { const ta = document.createElement('textarea'); ta.className = 'hin'; ta.style.width = '100%'; ta.rows = 6; ta.value = text; msg && msg.parentNode.appendChild(ta); ta.select(); } };
  try { navigator.clipboard.writeText(text).then(() => done(true), () => done(false)); } catch (er) { done(false); }
}

/* ---------- entry points ---------- */
A.hubOpen = () => openHub();
G.hubOpen = openHub; G.hubClose = closeHub;
G.hubMenuHtml = () => `<details open><summary>Class Demo Hub</summary><p class="small">Run sheet, AI story, evidence, Q&amp;A practice and the course documents in one place.</p><div class="dm-row"><button class="btn sm" data-a="hubOpen">🎓 Open the hub</button></div></details>`;
G.hubTab = openHub;
document.addEventListener('sq-ai', () => { if (document.getElementById('hub')) render(true); });
window.SQ_HUB = { open: openHub, close: closeHub, tabs: TABS.map(t => t[0]), validate: (i, p) => validate(i || FIXTURE[0], p || PASSAGE) };

/* quiet tick on small controls everywhere (not on game answers) */
document.addEventListener('pointerdown', e => { const b = e.target.closest && e.target.closest('.chip,.btn3,.setrow,.hbtn,.htabs button'); if (b && !b.closest('#hub')) FX.tick(); }, true);
});
