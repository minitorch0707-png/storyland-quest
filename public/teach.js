/* Storyland Quest – Story Mountain teacher demo.
   1. Evidence: the handoff's learning-evidence rules, run on a synthetic learner's attempts.
   2. Pip draft: a pasted passage becomes two questions with exact quotes and per-choice feedback.
      Every draft is validated in code before a teacher sees it.
   3. Battle: a teacher-approved question is played against the Ink Baron. A correct first answer
      earns one cast token (the handoff's battle-engine rules). */
(() => {
'use strict';

const { summarizeEvidence } = window.SQ_ENGINE;

/* ---------- helpers ---------- */
const TC = window.SQ_TELESCOPE;
const PV = 'pip-gen-1';
const DAY = 864e5;
const SKILL_DEFS = {
  inference_causal: { label: 'Inference: why it happened', desc: TC.generatorInput.skillDescription },
  main_idea: { label: 'Main idea', desc: 'Say what a passage is mostly about, using details from the text.' },
  word_context: { label: 'Word meaning in context', desc: 'Use nearby words and sentences to work out what a word means.' }
};
const TAGS = { selected_visible_detail_over_cause: 'chose a visible detail instead of the cause' };
const MOVES = {
  'ember-pop': { name: 'Ember Pop', icon: '🔥' }, 'wing-cut': { name: 'Wing Cut', icon: '🌪️' },
  'bubble-burst': { name: 'Bubble Burst', icon: '🫧' }, 'star-scratch': { name: 'Star Scratch', icon: '⭐' },
  pounce: { name: 'Pounce', icon: '🐾' }, guard: { name: 'Guard', icon: '🛡️', support: true }
};
const SIG = { dragon: 'ember-pop', bird: 'wing-cut', sea: 'bubble-burst', cat: 'star-scratch' };
const words = s => (String(s || '').trim().match(/\S+/g) || []).length;
const hash = s => { let h = 5381; for (const c of String(s)) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return h.toString(16).padStart(8, '0'); };
const fmtDate = t => new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' });
const isStr = (s, min = 1, max = 400) => typeof s === 'string' && s.trim().length >= min && s.length <= max;
const gradeBand = g => g <= 2 ? 'Grades 1–2' : g <= 4 ? 'Grades 3–4' : 'Grades 5–6';
function splitSentences(t) {
  const m = String(t || '').replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+["”')]*|[^.!?]+$/g) || [];
  return m.map(s => s.trim()).filter(Boolean).map((text, i) => ({ id: 's' + (i + 1), text }));
}
const TELE_NORM = TC.generatorInput.passage.map(s => s.text).join(' ');

/* ---------- validating a draft: nothing reaches a teacher unless every check passes ---------- */
function validateDraft(d, input) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return { ok: false, errors: ['The reply was not a JSON object.'] };
  if (d.status === 'needs_source') return { ok: false, needsSource: true, errors: [], note: isStr(d.explanation || d.teacherNote, 1, 500) ? String(d.explanation || d.teacherNote) : 'Pip says the passage cannot support two questions at this skill.' };
  const errs = [];
  if (d.status !== 'draft') errs.push('status must be "draft" or "needs_source".');
  if (d.skillId !== input.skillId) errs.push(`skillId "${d.skillId}" does not match the approved skill "${input.skillId}".`);
  if (d.sourceVersion !== input.sourceVersion) errs.push(`sourceVersion "${d.sourceVersion}" does not match "${input.sourceVersion}".`);
  if (d.evidenceStrength !== input.evidenceStrength) errs.push(`evidenceStrength "${d.evidenceStrength}" does not match the computed "${input.evidenceStrength}".`);
  const sent = new Map(input.passage.map(s => [s.id, s.text])), out = [];
  if (!Array.isArray(d.items) || d.items.length !== 2) errs.push('Exactly two items are required.');
  else {
    const diffs = d.items.map(i => i && i.difficulty).sort().join(',');
    if (diffs !== 'guided,independent') errs.push('Items must be one "guided" and one "independent".');
    const ids = new Set();
    d.items.forEach((it, n) => {
      const L = `Item ${n + 1}: `, bad = m => errs.push(L + m);
      if (!it || typeof it !== 'object') return bad('is not an object.');
      if (!isStr(it.id, 1, 30) || ids.has(it.id)) bad('needs a unique id.'); else ids.add(it.id);
      if (!isStr(it.question, 5, 200)) bad('question is missing or too long.');
      else if (words(it.question) > 20) bad(`question has ${words(it.question)} words; the limit is 20.`);
      const opts = Array.isArray(it.options) ? it.options : [];
      if (opts.length !== 4 || !opts.every(o => o && isStr(o.id, 1, 10) && isStr(o.text, 1, 90))) bad('needs exactly four options, each with an id and text.');
      else {
        if (new Set(opts.map(o => o.id)).size !== 4) bad('option ids are not unique.');
        if (new Set(opts.map(o => o.text.trim().toLowerCase())).size !== 4) bad('option texts are not unique.');
        if (!opts.some(o => o.id === it.correctId)) bad(`correctId "${it.correctId}" is not one of the options.`);
        const fb = it.feedbackByOption && typeof it.feedbackByOption === 'object' ? it.feedbackByOption : {};
        for (const o of opts) if (!isStr(fb[o.id], 3, 300)) bad(`no feedback for option "${o.id}".`);
        for (const k of Object.keys(fb)) if (!opts.some(o => o.id === k)) bad(`feedback key "${k}" matches no option.`);
      }
      if (!isStr(it.hint, 3, 220)) bad('hint is missing.');
      const cites = Array.isArray(it.citations) ? it.citations : [];
      if (!cites.length) bad('needs at least one citation.');
      const norm = [];
      cites.forEach((c, k) => {
        const s = c && sent.get(c.sentenceId);
        if (!s) return bad(`citation ${k + 1} cites "${c && c.sentenceId}", which is not in the passage.`);
        if (!isStr(c.quote, 3, 300)) return bad(`citation ${k + 1} has no usable quote.`);
        if (!s.includes(c.quote)) return bad(`citation ${k + 1} quote is not an exact piece of ${c.sentenceId}.`);
        norm.push({ sentenceId: c.sentenceId, quote: c.quote, sentence: s, start: s.indexOf(c.quote) });
      });
      out.push({ id: it.id, difficulty: it.difficulty, question: it.question, options: opts.map(o => ({ id: o.id, text: o.text })), correctId: it.correctId,
        citations: norm, hint: it.hint, feedbackByOption: it.feedbackByOption || {} });
    });
  }
  return { ok: !errs.length, errors: errs, items: out, teacherNote: isStr(d.teacherNote, 1, 500) ? d.teacherNote : '' };
}

/* ---------- installed by app.js ---------- */
Object.assign(window.SQ_ENGINE, { validateDraft, splitSentences });
window.SQ_TEACH = function install(C) {
  const { S, $, esc, view, art, coin, petHtml, newProfile, togs, sfx, speak, hush, burst, anim, floaty, confetti, flyCoins, countUp, calm, pick, today } = C;
  const TS = { chg: { idx: 5, text: '', res: null, busy: false, msg: '' }, learner: 'syn-ari', open: false, showEv: false, skill: 'inference_causal', passage: '', appr: false, busy: false, draft: null, review: [], trace: null, msg: '' };
  let BT = null, wired = false;

  /* ----- synthetic learners (never real students) ----- */
  function learnerDefs(now) {
    const A = (id, item, days, correct, assisted, stem, context, sel, right, tag) => ({ id, itemId: item, skillId: 'inference_causal', time: now - days * DAY,
      turn: 0, attempt: 1, chosenOptionId: correct ? 'right' : 'wrong', correct, assisted, reviewedWrongChoiceTag: tag, stem, context, selectedText: sel, correctText: right, source: 'synthetic' });
    const ci = TC.generatorInput.attempts;
    return [
      { id: 'syn-ari', name: 'Ari', avatar: '🦉', grade: 3, pet: 'dragon', petXp: 140, petName: 'Ember', attempts: [
        A('a1', ci[0].sourceId, 5, false, false, ci[0].stem, ci[0].context, ci[0].selected, ci[0].correct, ci[0].observedPattern),
        A('a2', ci[1].sourceId, 4, false, false, ci[1].stem, ci[1].context, ci[1].selected, ci[1].correct, ci[1].observedPattern),
        A('a3', 'anchor-c', 2, true, false, 'Why did Sam turn on the lamp?', 'The sun set, and the room grew dark. Sam turned on the lamp.', 'The room was dark.', 'The room was dark.'),
        A('a4', 'anchor-d', 1, true, true, 'Why did Ana carry the sack with both hands?', 'The sack held ten glass jars. Ana lifted it slowly with both hands.', 'The jars could break.', 'The jars could break.')] },
      { id: 'syn-bea', name: 'Bea', avatar: '🐸', grade: 3, pet: 'bird', petXp: 60, petName: 'Skye', attempts: [
        A('b1', ci[0].sourceId, 3, true, false, ci[0].stem, ci[0].context, ci[0].correct, ci[0].correct),
        A('b2', ci[1].sourceId, 2, false, false, ci[1].stem, ci[1].context, ci[1].selected, ci[1].correct)] }
    ];
  }
  function ensure() {
    let changed = false;
    for (const d of learnerDefs(Date.now())) {
      if (S.profiles.some(p => p.id === d.id)) continue;
      const p = newProfile(d.name, d.avatar, d.grade);
      const zi = { iid: 'i_' + d.pet, fam: d.pet, xp: d.petXp, name: d.petName, cos: {} };
      Object.assign(p, { id: d.id, demo: true, synthetic: true, placed: true, pet: d.pet, petName: d.petName, pets: { [d.pet]: { xp: d.petXp, hat: '' } }, zoo: [zi], team: [zi.iid], seen: { [d.pet]: true }, coins: 40, daily: today(), attempts: d.attempts });
      S.profiles.push(p); changed = true;
    }
    S.approved = S.approved || []; S.traces = S.traces || [];
    if (changed) C.save();
  }
  const learner = () => S.profiles.find(p => p.id === TS.learner) || S.profiles.find(p => p.synthetic);

  /* ----- evidence card ----- */
  function evidence(p) {
    const all = summarizeEvidence(p.attempts || [], { now: Date.now() });
    const focus = all.find(s => s.status === 'suggest-practice') || all[0] || null;
    const counted = new Set(all.flatMap(s => s.evidence.map(e => s.skillId + '|' + e.itemId)));
    return { all, focus, counted, suggested: focus && focus.status === 'suggest-practice' ? focus.skillId : null };
  }
  function evidenceHtml(p) {
    const ev = evidence(p), f = ev.focus, label = f ? (SKILL_DEFS[f.skillId] || { label: f.skillId }).label : 'No attempts yet';
    let head, chip, lines = [];
    if (!f) { head = 'No attempts yet'; chip = ['more', 'More evidence needed']; lines.push('This learner has no independent first attempts yet.'); }
    else if (f.status === 'more-evidence') { head = `Not enough evidence yet: ${label}`; chip = ['more', 'More evidence needed']; lines.push(`${f.count} of 3 independent first attempts so far. Try a few more battles before suggesting anything.`); }
    else if (f.status === 'monitor') { head = `Keep an eye on: ${label}`; chip = ['ok', 'Monitor']; lines.push(`${f.correct} of ${f.count} independent first attempts correct (${Math.round(f.accuracy * 100)}%).`); }
    else { head = `Suggested practice: ${label}`; chip = ['sug', 'Suggested practice'];
      lines.push(`${f.correct} of ${f.count} independent first attempts correct (${Math.round(f.accuracy * 100)}%). Hints and retries are not counted.`);
      for (const pt of f.patterns) lines.push(`Repeated pattern in ${pt.evidenceCount} items (${pt.itemIds.map(esc).join(', ')}): ${esc(TAGS[pt.tag] || pt.tag)}.`); }
    const rows = [...(p.attempts || [])].sort((a, b) => b.time - a.time).slice(0, 12).map(a => {
      const c = ev.counted.has(a.skillId + '|' + a.itemId) && a.attempt === 1 && !a.assisted;
      return `<tr><td>${fmtDate(a.time)}</td><td>${esc(a.stem || a.itemId)}</td><td>${esc(a.selectedText || '–')}</td><td>${esc(a.correctText || '–')}</td><td>${a.assisted ? 'Used a hint' : 'None'}${a.attempt > 1 ? ' · retry' : ''}</td><td>${a.correct ? '✓ right' : '✗ not yet'}</td><td>${c ? 'Counted' : 'Not counted'}</td></tr>`; }).join('');
    return `<section class="tg-ev" aria-label="Evidence for ${esc(p.name)}"><span class="tg-chip ${chip[0]}">${chip[1]}</span><h3>${head}</h3>
      <ul class="tg-lines">${lines.map(l => `<li>${l}</li>`).join('')}</ul>
      <p class="small">Worked out by fixed rules from recent attempts, not by AI. It is a suggestion for you to confirm, not an assessment.</p>
      <button class="btn ghost" data-a="tgEv" aria-expanded="${TS.showEv}">${TS.showEv ? 'Hide' : 'Show'} the answer evidence</button>
      ${TS.showEv ? `<div class="scroll"><table class="tbl tg-tbl"><caption class="sr">Recent attempts</caption><tr><th>Date</th><th>Question</th><th>Chose</th><th>Approved answer</th><th>Help</th><th>Result</th><th>In evidence</th></tr>${rows || '<tr><td colspan="7">No attempts yet.</td></tr>'}</table></div>
      <p class="small">Attempts a1 and a2 come from the supplied telescope case. The others were added to this synthetic learner so the rules have enough items.</p>` : ''}</section>`;
  }

  /* ----- passage + generator ----- */
  function passageInfo() {
    const sents = splitSentences(TS.passage), norm = sents.map(s => s.text).join(' '); let err = '';
    if (!sents.length) err = 'Paste a passage of 4 to 12 sentences.';
    else if (sents.length < 4) err = 'Add more text. Two questions need at least 4 sentences.';
    else if (sents.length > 12 || TS.passage.length > 1500) err = 'That is too long. Use at most 12 sentences and 1,500 characters.';
    const tele = norm === TELE_NORM;
    return { sents, err, tele, version: tele ? TC.generatorInput.sourceVersion : 'src-' + hash(norm) };
  }
  const live = () => !!(C.ai().sample || (window.claude && window.claude.use));
  function previewHtml() {
    const pi = passageInfo();
    const list = pi.sents.length ? `<ol class="tg-sents">${pi.sents.map(s => `<li><code>${s.id}</code> ${esc(s.text)}</li>`).join('')}</ol>` : '';
    return `${list}<p class="${pi.err ? 'err' : 'small'}">${pi.err ? esc(pi.err) : `${pi.sents.length} sentences · source version <code>${esc(pi.version)}</code>${pi.tele ? ' · this is the telescope passage' : ''}`}</p>`;
  }
  function btnState() {
    const pi = passageInfo(), can = !pi.err && TS.appr && !TS.busy;
    return { draft: !(can && live()), off: !(can && pi.tele) };
  }
  function buildInput(sentsOver, verOver) {
    const p = learner(), pi = passageInfo(), ev = evidence(p), s = ev.all.find(x => x.skillId === TS.skill);
    const strength = s && s.patterns.length ? 'repeated' : 'uncertain';
    const seen = new Set();
    const att = s ? (p.attempts || []).filter(a => a.skillId === TS.skill && a.attempt === 1 && !a.assisted && a.correct === false && ev.counted.has(a.skillId + '|' + a.itemId) && !seen.has(a.itemId) && seen.add(a.itemId)).slice(-4)
      .map(a => ({ id: a.id || a.itemId, sourceId: a.itemId, firstAttempt: true, assisted: false, stem: a.stem, ...(a.context ? { context: a.context } : {}), selected: a.selectedText, correct: a.correctText,
        ...(a.reviewedWrongChoiceTag ? { observedPattern: a.reviewedWrongChoiceTag } : {}) })) : [];
    return { sourceVersion: verOver || pi.version, subject: 'Language', gradeBand: gradeBand(p.grade), questionReadingLoad: TC.generatorInput.questionReadingLoad,
      skillId: TS.skill, skillDescription: SKILL_DEFS[TS.skill].desc, evidenceStrength: strength, passage: sentsOver || pi.sents, attempts: att };
  }
  async function sampler() {
    if (C.ai().sample) return C.ai().sample;
    if (window.claude && window.claude.use) { try { return await window.claude.use('sample'); } catch (e) { return null; } }
    return null;
  }
  function finishDraft(raw, input, mode, err) {
    const v = err ? { ok: false, errors: [err] } : validateDraft(raw, input);
    const trace = { id: 't' + Date.now(), promptVersion: PV, mode, tier: mode === 'live-ai' ? 'default (viewer’s own Claude account)' : 'none', createdAt: Date.now(), sourceVersion: input.sourceVersion,
      skillId: input.skillId, evidenceStrength: input.evidenceStrength, input, output: raw == null ? null : raw, validation: { ok: v.ok, errors: v.errors || [] }, status: v.ok ? 'pending review' : v.needsSource ? 'needs source' : 'rejected',
      edits: [], approvedIds: [], rejectedItems: 0, teacherOverrode: !!(evidence(learner()).suggested && evidence(learner()).suggested !== input.skillId) };
    S.traces = [trace, ...(S.traces || [])].slice(0, 12); C.save();
    TS.trace = trace; TS.busy = false; TS.msg = '';
    if (v.ok) {
      TS.draft = { ok: true, mode, input, items: v.items, note: v.teacherNote };
      TS.review = v.items.map(it => ({ q: it.question, options: Object.fromEntries(it.options.map(o => [o.id, o.text])), correctId: it.correctId, hint: it.hint,
        fb: Object.fromEntries(it.options.map(o => [o.id, String(it.feedbackByOption[o.id])])), status: 'pending', msg: '' }));
    } else { TS.draft = { ok: false, mode, input, errors: v.errors, needsSource: !!v.needsSource, note: v.note }; TS.review = []; }
    render();
  }
  async function runLive() {
    const input = buildInput(); TS.busy = true; TS.draft = null; TS.msg = 'Pip is reading your passage and drafting…'; render();
    const sm = await sampler();
    if (!sm) { TS.busy = false; TS.msg = 'Pip’s AI is not available in this view, so nothing was drafted. Open the shared page while signed in to Claude, or load the offline fixture.'; render(); return; }
    let raw = null, err = '';
    try { raw = await sm.json(window.SQ_PROMPTS.buildDraft(input), { modelTier: 'default', cache: false }); }
    catch (e) { err = e && e.code === 'not_granted' ? 'AI use was not allowed for this page, so nothing was drafted.' : `The AI request failed (${(e && e.code) || 'error'}). Nothing was drafted.`; raw = e && e.text ? e.text : null; }
    if (err) { TS.busy = false; TS.msg = err; render(); return; }
    finishDraft(raw, input, 'live-ai');
  }
  function runOffline() { const input = buildInput(); input.evidenceStrength = TC.offlinePractice.evidenceStrength; finishDraft(JSON.parse(JSON.stringify(TC.offlinePractice)), input, 'offline-fixture'); }


  /* ===== passage-change check: same learner evidence and skill, one sentence changed ===== */
  const SAVED_EDIT = { idx: 5, text: 'Rin pressed the tripod legs into soft soil, where they could not slip.' };
  const SAVED_B_ITEM2 = { id: 'saved-2', difficulty: 'independent', question: 'How did the soft soil help Rin finish the drawing?',
    options: [{ id: 'a', text: 'It made the moon brighter.' }, { id: 'b', text: 'It kept the tripod legs from slipping.' }, { id: 'c', text: 'It held the drawing up.' }, { id: 'd', text: 'It moved the red bench.' }], correctId: 'b',
    citations: [{ sentenceId: 's5', quote: 'the wind shook the tripod' }, { sentenceId: 's6', quote: 'pressed the tripod legs into soft soil' }, { sentenceId: 's7', quote: 'The moon stayed in view long enough for Rin to draw it.' }],
    hint: 'Compare what happened in the wind with what Rin did to the legs.',
    feedbackByOption: { a: 'The story describes the wind and the tripod. What did the wind do?', b: 'Yes. With the legs pressed into soil, the tripod stayed steady, so Rin could keep the moon in view.', c: 'Rin drew the moon after it stayed in view. Look for what made the view steady.', d: 'The bench was at the first spot. Look at what Rin did to the tripod.' } };
  const editedSents = () => passageInfo().sents.map((s, k) => k === TS.chg.idx ? { id: s.id, text: TS.chg.text.trim() } : s);
  const itemRow = (d, k) => { const it = d && d.items && d.items[k]; if (!it) return { q: '–', a: '–', quotes: [] }; const right = it.options.find(o => o.id === it.correctId); return { q: it.question, a: right ? right.text : '–', quotes: it.citations }; };
  function chgResHtml() {
    const r = TS.chg.res; if (!r) return '';
    const lab = r.mode === 'live-ai' ? ['live', 'Live AI · Pip via your Claude account, two separate runs'] : ['off', 'Saved example · hand-written illustration, not a live AI run'];
    const bad = ['A', 'B'].filter(k => !r['v' + k].ok);
    if (bad.length) return `<p class="tg-mode ${lab[0]}">${lab[1]}</p><div class="tg-rej" role="alert"><b>A draft was rejected by the checks</b>${bad.map(k => `<p>${k === 'A' ? 'Original' : 'Edited'} passage: ${esc((r['v' + k].errors || []).join(' ') || r['v' + k].note || 'needs a different source')}</p>`).join('')}</div>`;
    const sents = TS.chg.res.sentsA, ed = TS.chg.res.sentsB, i = TS.chg.res.idx, qshow = qs => qs.map(c => `<q class="tg-src">${esc(c.sentenceId)}: ${esc(c.quote)}</q>`).join('');
    const rows = [0, 1].map(k => { const a = itemRow(r.vA, k), b = itemRow(r.vB, k), ans = a.a !== b.a, qt = JSON.stringify(a.quotes.map(c => c.quote)) !== JSON.stringify(b.quotes.map(c => c.quote));
      return `<tr><th scope="row">Item ${k + 1}</th><td><b>Question:</b> ${esc(a.q)}<br><b>Answer:</b> ${esc(a.a)}<br>${qshow(a.quotes)}</td><td><b>Question:</b> ${esc(b.q)}<br><b>Answer:</b> ${esc(b.a)}<br>${qshow(b.quotes)}</td><td><span class="tg-chip ${ans ? 'sug' : 'more'}">Answer ${ans ? 'changed' : 'same'}</span> <span class="tg-chip ${qt ? 'sug' : 'more'}">Quote ${qt ? 'changed' : 'same'}</span></td></tr>`; }).join('');
    return `<p class="tg-mode ${lab[0]}">${lab[1]}</p><p class="small">Same learner evidence (${esc(r.strength)}), same skill (<code>${esc(r.skill)}</code>). Only sentence ${esc(sents[i].id)} changed.</p>
      <div class="tg-cmp"><div><b>Original ${esc(sents[i].id)}</b><p>${esc(sents[i].text)}</p></div><div><b>Edited ${esc(ed[i].id)}</b><p>${esc(ed[i].text)}</p></div></div>
      <div class="scroll"><table class="tbl tg-chgt"><tr><th></th><th>Original passage</th><th>Edited passage</th><th>What changed</th></tr>${rows}</table></div><p class="small">Every quote above was matched letter for letter against its passage.</p>`;
  }
  function chgHtml() {
    const pi = passageInfo(); if (pi.err) return ''; const c = TS.chg, can = live() && TS.appr && !c.busy;
    if (c.idx >= pi.sents.length) c.idx = pi.sents.length - 1;
    return `<details class="tg-change" ${c.res || c.open ? 'open' : ''}><summary>Passage-change check: does Pip follow the passage?</summary>
      <p class="small">Keep the learner evidence and skill fixed, change one sentence, and compare the two drafts. If the answer and the supporting quote change with the sentence, the draft is grounded in the passage.</p>
      <label class="tg-l" for="tg-cidx">Sentence to change</label><select id="tg-cidx" class="inp sel" data-f="chgidx">${pi.sents.map((s, i) => `<option value="${i}" ${i === c.idx ? 'selected' : ''}>${s.id}: ${esc(s.text.slice(0, 48))}</option>`).join('')}</select>
      <label class="tg-l" for="tg-ctxt">New sentence</label><input id="tg-ctxt" class="inp" data-f="chgtext" maxlength="200" value="${esc(c.text)}" placeholder="Write the replacement sentence">
      <div class="row left"><button class="btn big" id="tg-chglive" data-a="tgChgRun" ${can ? '' : 'disabled'}>Run live check (two AI runs)</button><button class="btn ghost" data-a="tgChgSaved" ${pi.tele ? '' : 'disabled'}>Show saved example</button></div>
      <p class="small">${live() ? 'The live check asks Pip twice and asks your permission the first time.' : 'Live checks are not available in this view. The saved example uses the telescope passage.'}${TS.appr ? '' : ' Tick the source approval above to run a live check.'}</p>
      ${c.msg ? `<p class="${c.busy ? 'small' : 'err'}" role="status">${esc(c.msg)}</p>` : ''}${chgResHtml()}</details>`;
  }
  function finishChange(mode, vA, vB, inA, inB, rawA, rawB) {
    TS.chg.busy = false; TS.chg.msg = '';
    TS.chg.res = { mode, vA, vB, sentsA: inA.passage, sentsB: inB.passage, idx: TS.chg.idx, strength: inA.evidenceStrength, skill: inA.skillId };
    const t = { id: 't' + Date.now(), promptVersion: PV, mode: mode === 'live-ai' ? 'live-ai change-check' : 'saved-example change-check', tier: mode === 'live-ai' ? 'default (viewer’s own Claude account)' : 'none', createdAt: Date.now(), sourceVersion: inA.sourceVersion + ' → ' + inB.sourceVersion,
      skillId: inA.skillId, evidenceStrength: inA.evidenceStrength, input: { original: inA, edited: inB }, output: { original: rawA, edited: rawB }, validation: { ok: vA.ok && vB.ok, errors: [...(vA.errors || []), ...(vB.errors || [])] }, status: 'change check', edits: [], approvedIds: [], rejectedItems: 0 };
    S.traces = [t, ...(S.traces || [])].slice(0, 12); C.save(); render();
  }
  async function runChange() {
    const pi = passageInfo(), c = TS.chg, txt = c.text.trim(), orig = pi.sents[c.idx];
    if (!orig || txt.length < 8 || txt === orig.text) { c.msg = 'Write a replacement sentence that is different from the original.'; return render(); }
    const sentsB = editedSents(), verB = 'src-' + hash(sentsB.map(x => x.text).join(' ')), inA = buildInput(pi.sents, pi.version), inB = buildInput(sentsB, verB);
    c.busy = true; c.res = null; c.msg = 'Pip is drafting from the original passage, then from the edited one…'; render();
    const sm = await sampler(); if (!sm) { c.busy = false; c.msg = 'Pip’s AI is not available in this view, so nothing was run.'; return render(); }
    let rawA, rawB;
    try { rawA = await sm.json(window.SQ_PROMPTS.buildDraft(inA), { modelTier: 'default', cache: false }); rawB = await sm.json(window.SQ_PROMPTS.buildDraft(inB), { modelTier: 'default', cache: false }); }
    catch (e) { c.busy = false; c.msg = e && e.code === 'not_granted' ? 'AI use was not allowed for this page, so nothing was run.' : `The AI request failed (${(e && e.code) || 'error'}). Nothing was run.`; return render(); }
    finishChange('live-ai', validateDraft(rawA, inA), validateDraft(rawB, inB), inA, inB, rawA, rawB);
  }
  function runSavedChange() {
    const pi = passageInfo(); if (!pi.tele) return; TS.chg.idx = SAVED_EDIT.idx; TS.chg.text = SAVED_EDIT.text;
    const sentsB = editedSents(), verB = 'src-' + hash(sentsB.map(x => x.text).join(' ')), inA = buildInput(pi.sents, pi.version), inB = buildInput(sentsB, verB);
    const A = JSON.parse(JSON.stringify(TC.offlinePractice)); A.evidenceStrength = inA.evidenceStrength;
    const B = JSON.parse(JSON.stringify(TC.offlinePractice)); B.sourceVersion = verB; B.evidenceStrength = inB.evidenceStrength; B.items[1] = JSON.parse(JSON.stringify(SAVED_B_ITEM2));
    finishChange('saved-example', validateDraft(A, inA), validateDraft(B, inB), inA, inB, A, B);
  }

  /* ===== class evidence with filters, and the reviewed-content gate for the new worlds ===== */
  const TF = { student: 'all', skill: 'all' }, G2 = () => C.G;
  const skillLabel = id => { const d = G2().D.destinations.find(x => x.skill === id); return d ? d.name : (SKILL_DEFS[id] || {}).label || id; };
  function ehtml() {
    const profs = S.profiles.filter(p => (p.attempts || []).length).map(p => ({ p, ev: evidence(p) }));
    const skills = [...new Set(profs.flatMap(x => (x.p.attempts || []).map(a => a.skillId)))];
    const pick = profs.filter(x => TF.student === 'all' || x.p.id === TF.student);
    const rows = [];
    for (const { p, ev } of pick) for (const sk of skills) { if (TF.skill !== 'all' && TF.skill !== sk) continue; const at = (p.attempts || []).filter(a => a.skillId === sk); if (!at.length) continue; const e = ev.all.find(x => x.skillId === sk);
      const asst = at.filter(a => a.assisted).length, indep = e ? e.count : 0;
      const next = !e ? 'More evidence needed (no independent first tries yet)' : e.status === 'suggest-practice' ? `Suggested: practise ${skillLabel(sk)}. ${e.patterns.length ? 'Repeated pattern: ' + (TAGS[e.patterns[0].tag] || e.patterns[0].tag) + '.' : 'Recent accuracy ' + Math.round(e.accuracy * 100) + '%.'}` : e.status === 'monitor' ? 'Keep going. Recent answers look steady.' : `More evidence needed (${e.count} of 3 independent first tries)`;
      rows.push(`<tr><td>${p.synthetic ? '🧪 ' : ''}${esc(p.name)}</td><td>${esc(skillLabel(sk))}</td><td>${e ? `${e.correct} of ${e.count}` : '0 of 0'}</td><td>${asst}</td><td>${esc(next)}</td></tr>`); }
    const recent = pick.flatMap(({ p, ev }) => (p.attempts || []).filter(a => TF.skill === 'all' || a.skillId === TF.skill).map(a => ({ p, a, c: ev.counted.has(a.skillId + '|' + a.itemId) && a.attempt === 1 && !a.assisted })))
      .sort((x, y) => y.a.time - x.a.time).slice(0, 14).map(({ p, a, c }) => `<tr><td>${fmtDate(a.time)}</td><td>${esc(p.name)}</td><td>${esc(skillLabel(a.skillId))}</td><td>${esc(a.stem || a.itemId)}</td><td>${esc(a.selectedText || '–')}</td><td>${esc(a.correctText || '–')}</td><td>${a.assisted ? 'Hint used' : 'Independent'}${a.attempt > 1 ? ' · retry' : ''}</td><td>${a.correct ? '✓' : '✗'}</td><td>${c ? 'Counted' : 'Not counted'}</td></tr>`).join('');
    return `<h2>Answer evidence</h2><p class="small">Independent means first try, no hint. Hints and retries are shown but not counted. These are practice answers, not an assessment.</p>
      <div class="filt" role="group" aria-label="Evidence filters"><label>Student <select class="inp sel" data-ef="student"><option value="all">All students</option>${profs.map(x => `<option value="${x.p.id}" ${TF.student === x.p.id ? 'selected' : ''}>${x.p.synthetic ? '🧪 ' : ''}${esc(x.p.name)}</option>`).join('')}</select></label>
      <label>Skill <select class="inp sel" data-ef="skill"><option value="all">All skills</option>${skills.map(k => `<option value="${esc(k)}" ${TF.skill === k ? 'selected' : ''}>${esc(skillLabel(k))}</option>`).join('')}</select></label></div>
      ${rows.length ? `<div class="scroll"><table class="tbl"><tr><th>Student</th><th>Skill</th><th>Independent first tries right</th><th>Assisted attempts</th><th>Suggested next step</th></tr>${rows.join('')}</table></div>
      <h3>Recent answers</h3><div class="scroll"><table class="tbl tg-tbl"><tr><th>Date</th><th>Student</th><th>Skill</th><th>Question</th><th>Chose</th><th>Approved answer</th><th>Help</th><th>Result</th><th>In evidence</th></tr>${recent}</table></div>` : '<p>No answers match yet. Play a few battles, or choose another filter.</p>'}`;
  }
  function rhtml() {
    const G = G2(), worlds = G.D.destinations.filter(d => d.contentStatus !== 'existing-route'); S.reviewed = S.reviewed || {};
    return `<h2>Reviewed questions for new subject worlds</h2><p class="small">These worlds stay closed to students until you review their questions. The sets below are prototypes written for this demo. Check each one against your own program before approving.</p>
      ${worlds.map(d => { const ok = !!S.reviewed[d.id], qs = window.SQ_SUBJECTS.banks[d.id] || [];
        return `<details class="tg-rev"><summary><b>${esc(d.name)}</b> · ${esc(G.SUBJ_LABEL[d.subject])} · ${qs.length} questions <span class="tg-chip ${ok ? 'ok' : 'more'}">${ok ? 'Reviewed: open to students' : 'Needs review: closed'}</span></summary>
          <ol>${qs.map(q => `<li>${q[0].replace(/<br>/g, ' ')}<br><b>Answer:</b> ${esc(q[1])} <small>(other choices: ${q[2].map(esc).join('; ')})</small></li>`).join('')}</ol>
          <div class="row left">${ok ? `<button class="btn ghost" data-a="tgUnrev" data-id="${d.id}">Close this world again</button>` : `<label class="tg-chk"><input type="checkbox" id="rv-${d.id}"> I reviewed these questions and they are correct for my students.</label><button class="btn" data-a="tgRev" data-id="${d.id}">Mark as reviewed</button>`}</div></details>`; }).join('')}`;
  }
  const renderE = () => { const e = $('#ecard'); if (e) e.innerHTML = ehtml(); }, renderR = () => { const e = $('#rcard'); if (e) e.innerHTML = rhtml(); };
  document.addEventListener('change', e => { const t = e.target; if (t && t.dataset && t.dataset.ef && t.closest('#ecard')) { TF[t.dataset.ef] = t.value; renderE(); } });

  /* ----- review ----- */
  function modeLabel(m) { return m === 'live-ai' ? ['live', 'Live AI draft · Pip via your Claude account'] : ['off', 'Offline fixture · written by hand, not AI']; }
  function citeHtml(c) {
    const s = c.sentence, a = s.slice(0, c.start), m = c.quote, b = s.slice(c.start + m.length);
    return `<li><span class="tg-ok" aria-label="Verified">✓</span> <code>${esc(c.sentenceId)}</code> “${esc(c.quote)}” <span class="small">found in the source</span><br><q class="tg-src">${esc(a)}<mark>${esc(m)}</mark>${esc(b)}</q></li>`;
  }
  function itemHtml(it, i) {
    const r = TS.review[i], dis = r.status === 'approved' ? 'disabled' : '', approved = r.status === 'approved';
    const rec = (S.approved || []).find(x => x.sourceVersion === TS.draft.input.sourceVersion && x.item.id === it.id && x.reviewIndex === i);
    return `<article class="tg-item ${r.status}" aria-label="Draft ${i + 1}"><header><b>Draft ${i + 1} · ${it.difficulty === 'guided' ? 'Guided' : 'Independent'}</b>
      <span class="tg-chip ok">Quotes verified ${it.citations.length}/${it.citations.length}</span><span class="tg-chip ${r.status === 'approved' ? 'ok' : r.status === 'rejected' ? 'bad' : 'more'}">${r.status === 'approved' ? 'Approved' : r.status === 'rejected' ? 'Rejected' : 'Waiting for your review'}</span></header>
      <label class="tg-l" for="tgq${i}">Question (20 words or fewer)</label><input id="tgq${i}" class="inp" data-f="q" data-i="${i}" value="${esc(r.q)}" ${dis}>
      <fieldset class="tg-opts" ${dis}><legend>Choices: mark the correct one, and edit the feedback for each</legend>
        ${it.options.map((o, n) => `<div class="tg-opt"><label class="tg-rad"><input type="radio" name="tgc${i}" data-f="correct" data-i="${i}" value="${esc(o.id)}" ${r.correctId === o.id ? 'checked' : ''}><span>${'ABCD'[n]}<span class="sr"> correct answer</span></span></label>
          <input class="inp" aria-label="Choice ${'ABCD'[n]}" data-f="o" data-i="${i}" data-k="${esc(o.id)}" value="${esc(r.options[o.id])}">
          <input class="inp fbk" aria-label="Feedback if choice ${'ABCD'[n]} is picked" data-f="fb" data-i="${i}" data-k="${esc(o.id)}" value="${esc(r.fb[o.id])}"></div>`).join('')}</fieldset>
      <label class="tg-l" for="tgh${i}">Hint (a clue that does not give the answer away)</label><input id="tgh${i}" class="inp" data-f="hint" data-i="${i}" value="${esc(r.hint)}" ${dis}>
      <h4>Where the answer comes from</h4><ul class="tg-cites">${it.citations.map(citeHtml).join('')}</ul>
      ${r.msg ? `<p class="err" role="alert">${esc(r.msg)}</p>` : ''}
      <div class="row left">${approved ? `<button class="btn big" data-a="tgPlay" data-id="${esc(r.recId)}">▶ Play as ${esc(learner().name)} in a battle</button><button class="btn ghost" data-a="tgRevoke" data-i="${i}">Revoke approval</button>`
        : r.status === 'rejected' ? `<button class="btn ghost" data-a="tgRevoke" data-i="${i}">Review again</button>`
        : `<button class="btn big" data-a="tgApprove" data-i="${i}">Approve for practice</button><button class="btn ghost" data-a="tgReject" data-i="${i}">Reject</button>`}</div></article>`;
  }
  function draftHtml() {
    const d = TS.draft; if (!d) return TS.msg ? `<p class="${TS.busy ? 'small' : 'err'}" role="status">${esc(TS.msg)}</p>` : '';
    const ml = modeLabel(d.mode), banner = `<p class="tg-mode ${ml[0]}">${ml[1]} · source <code>${esc(d.input.sourceVersion)}</code> · evidence ${esc(d.input.evidenceStrength)}</p>`;
    if (!d.ok) return `${banner}<div class="tg-rej" role="alert"><b>${d.needsSource ? 'Pip needs a different source' : 'This draft was rejected by the checks and cannot be used'}</b>
      ${d.needsSource ? `<p>${esc(d.note)}</p>` : `<ul>${d.errors.map(e => `<li>${esc(e)}</li>`).join('')}</ul>`}<p class="small">Logged in the trace below. Try again, or change the passage.</p></div>`;
    const base = TC.fixedBankBaseline, first = d.items[0];
    return `${banner}${d.note ? `<p class="small"><b>Pip’s note:</b> ${esc(d.note)}</p>` : ''}
      <div class="tg-pass"><b>Source passage checked:</b> every quote below was matched, letter for letter, against its sentence.</div>
      ${d.items.map(itemHtml).join('')}
      <h4>Fixed bank vs Pip’s draft</h4><div class="tg-cmp">
        <div><b>Fixed bank</b><p>${esc(base.context)}</p><p><i>${esc(base.question)}</i></p><ol type="A">${base.options.map(o => `<li>${esc(o)}</li>`).join('')}</ol><p class="small">Same item for every learner. Not tied to your passage. No quote and no feedback for each choice.</p></div>
        <div><b>Pip’s draft</b><p><i>${esc(first.question)}</i></p><ol type="A">${first.options.map(o => `<li>${esc(o.text)}</li>`).join('')}</ol><p class="small">About your passage. Quotes its source. Feedback for every choice, reviewed by you before use.</p></div></div>`;
  }
  function traceHtml() {
    const t = TS.trace; if (!t) return '';
    return `<details class="tg-trace"><summary>Saved trace: prompt ${esc(t.promptVersion)} · ${esc(t.mode)} · ${esc(t.status)}</summary>
      <table class="tbl"><tr><th>Prompt version</th><td>${esc(t.promptVersion)}</td></tr><tr><th>Mode</th><td>${esc(t.mode)} (${esc(t.tier)})</td></tr><tr><th>Date</th><td>${new Date(t.createdAt).toLocaleString()}</td></tr>
      <tr><th>Source / skill / evidence</th><td>${esc(t.sourceVersion)} · ${esc(t.skillId)} · ${esc(t.evidenceStrength)}${t.teacherOverrode ? ' · teacher chose a different skill from the suggestion' : ''}</td></tr>
      <tr><th>Checks</th><td>${t.validation.ok ? 'Passed' : 'Rejected: ' + esc(t.validation.errors.join(' | '))}</td></tr>
      <tr><th>Review</th><td>${t.approvedIds.length} approved · ${t.rejectedItems} rejected · ${t.edits.length} edits by the teacher</td></tr></table>
      <p class="small">Sent to the model: the approved source, the skill, and ${t.input.attempts.length} synthetic attempt(s). No names.</p>
      <details><summary>Exact input</summary><pre>${esc(JSON.stringify(t.input, null, 1))}</pre></details>
      <details><summary>Exact output</summary><pre>${esc(typeof t.output === 'string' ? t.output : JSON.stringify(t.output, null, 1))}</pre></details>
      ${t.edits.length ? `<details><summary>Teacher edits</summary><pre>${esc(JSON.stringify(t.edits, null, 1))}</pre></details>` : ''}</details>`;
  }
  function approvedHtml() {
    const list = S.approved || []; if (!list.length) return '';
    return `<h4>Approved for battle</h4><ul class="tg-appr">${list.slice(0, 6).map(a => `<li><span><b>${esc(a.item.question)}</b><br><small>${esc(a.sourceVersion)} · ${a.mode === 'live-ai' ? 'live AI draft' : 'offline fixture'} · ${a.edits} edit(s)</small></span>
      <button class="btn" data-a="tgPlay" data-id="${esc(a.id)}">▶ Play as ${esc(learner().name)}</button>${(a.outcomes || []).length ? `<br><small class="tg-out"><b>Last practice:</b> ${esc((a.outcomes[0].items || []).map(o => `${o.label}: ${o.result}`).join(' · '))}</small>${(a.outcomes[0].log || []).length ? `<ol class="small tg-att">${a.outcomes[0].log.map(l => `<li><code>${esc(l.id)}</code> ${esc(l.role)} · try ${l.n} · chose “${esc(l.selected)}” · ${l.correct ? 'correct' : 'not correct'} · ${l.assisted || l.n > 1 ? 'after help (retry)' : 'independent'}</li>`).join('')}</ol>` : ''}` : ''}${storyHtml(a)}</li>`).join('')}</ul>`;
  }
  function genHtml(p, sugg) {
    const bs = btnState(), pi = passageInfo(), ov = sugg && sugg !== TS.skill;
    return `<div class="tg-gen"><h3>Create targeted battle</h3>
      <label class="tg-l" for="tg-skill">Reviewed skill</label>
      <select id="tg-skill" class="inp sel" data-f="skill">${Object.entries(SKILL_DEFS).map(([k, v]) => `<option value="${k}" ${k === TS.skill ? 'selected' : ''}>${esc(v.label)}${k === sugg ? ' (suggested by the evidence)' : ''}</option>`).join('')}</select>
      <p class="small">${esc(SKILL_DEFS[TS.skill].desc)}${ov ? ' You are choosing a different skill from the suggestion. That is allowed and is recorded in the trace.' : ''}</p>
      <label class="tg-l" for="tg-pass">Approved source passage (paste your own text; no student names)</label>
      <textarea id="tg-pass" class="inp area tg-area" data-f="passage" maxlength="1500" placeholder="Paste 4 to 12 sentences…">${esc(TS.passage)}</textarea>
      <div class="row left tight"><button class="btn ghost" data-a="tgSample">Use the telescope passage</button></div>
      <div id="tg-prev">${previewHtml()}</div>
      <label class="tg-chk"><input type="checkbox" id="tg-appr" data-f="appr" ${TS.appr ? 'checked' : ''}> I approve this text as the only source for these questions.</label>
      <div class="row left"><button class="btn big" id="tg-draft" data-a="tgDraft" ${bs.draft ? 'disabled' : ''}>Draft two questions with Pip</button>
        <button class="btn ghost" id="tg-off" data-a="tgOffline" ${bs.off ? 'disabled' : ''}>Load offline fixture</button></div>
      <p class="small" id="tg-why">${live() ? 'Live drafting uses your own Claude account and asks for your permission the first time.' : 'Live drafting is not available in this view. The offline fixture only fits the telescope passage.'}</p>
      ${draftHtml()}${lessonHtml()}${traceHtml()}${chgHtml()}${modesHtml()}</div>`;
  }
  function html() {
    const ps = S.profiles.filter(p => p.synthetic), p = learner(), ev = evidence(p);
    return `<div class="tg-head"><h2>Story Mountain: evidence and targeted practice</h2><span class="tg-chip syn">Synthetic learners · not real students</span></div>
      <div class="seg" role="group" aria-label="Choose a synthetic learner">${ps.map(x => `<button class="${x.id === p.id ? 'on' : ''}" data-a="tgPick" data-id="${x.id}" aria-pressed="${x.id === p.id}">${x.avatar} ${esc(x.name)} <small>Grade ${x.grade}</small></button>`).join('')}</div>
      <div class="tg-grid">${evidenceHtml(p)}<aside class="tg-act"><button class="btn big" data-a="tgOpen" aria-expanded="${TS.open}">Create targeted battle</button>
        <p class="small">Pip drafts two questions from a passage you approve. You review them before ${esc(p.name)} sees anything.</p></aside></div>
      ${TS.open ? genHtml(p, ev.suggested) : ''}${approvedHtml()}`;
  }
  function render() { const el = $('#tcard'); if (el) el.innerHTML = html(); }
  function mount() {
    if (!wired) { wired = true; document.addEventListener('input', onInput); document.addEventListener('change', onInput); }
    render(); renderE(); renderR();
  }
  function onInput(e) {
    const el = e.target; if (!el.closest || !el.closest('#tcard') || !el.dataset.f) return;
    const f = el.dataset.f, i = +el.dataset.i, r = TS.review[i];
    if (f === 'passage') { TS.passage = el.value; TS.appr = false; const c = $('#tg-appr'); if (c) c.checked = false; refreshGen(); }
    else if (f === 'appr') { TS.appr = el.checked; refreshGen(); }
    else if (f === 'wq' || f === 'wa' || f === 'wb') { if (TS.lesson) TS.lesson.worked[f === 'wq' ? 'question' : f === 'wa' ? 'answer' : 'because'] = el.value; }
    else if (f === 'sup') { if (TS.lesson && el.checked) TS.lesson.level = el.value; }
    else if (f === 'stintro' || f === 'stname' || f === 'stline' || f === 'stpay') { const sl = TS.story[el.dataset.id], dd = sl && sl.draft; if (dd) { if (f === 'stintro') dd.intro = el.value; else { const c = dd.choices[+el.dataset.k]; if (c) c[f === 'stname' ? 'name' : f === 'stline' ? 'line' : 'payoff'] = el.value; } } }
    else if (f === 'rctext') { if (TS.recap && TS.recap.draft) { TS.recap.draft.claims[+el.dataset.k].text = el.value; TS.recap.edited = true; } }
    else if (f === 'rcnext' || f === 'rcunc') { if (TS.recap && TS.recap.draft) { TS.recap.draft[f === 'rcnext' ? 'next' : 'uncertainty'] = el.value; TS.recap.edited = true; } }
    else if (f === 'chgidx') TS.chg.idx = +el.value;
    else if (f === 'chgtext') TS.chg.text = el.value;
    else if (f === 'skill') { if (e.type === 'change') { TS.skill = el.value; TS.draft = null; render(); } }
    else if (r && r.status !== 'approved') {
      if (f === 'q') r.q = el.value; else if (f === 'hint') r.hint = el.value; else if (f === 'correct') r.correctId = el.value;
      else if (f === 'o') r.options[el.dataset.k] = el.value; else if (f === 'fb') r.fb[el.dataset.k] = el.value;
    }
  }
  function refreshGen() {
    const pv = $('#tg-prev'), bs = btnState(); if (pv) pv.innerHTML = previewHtml();
    const d = $('#tg-draft'), o = $('#tg-off'); if (d) d.disabled = bs.draft; if (o) o.disabled = bs.off; const g = $('#tg-chglive'); if (g) g.disabled = !(live() && TS.appr && !passageInfo().err && !TS.chg.busy);
  }
  function checkReview(r, it) {
    if (!isStr(r.q, 5, 200) || words(r.q) > 20) return 'The question must be 5 to 200 characters and at most 20 words.';
    const texts = it.options.map(o => String(r.options[o.id] || '').trim());
    if (texts.some(t => !t)) return 'Every choice needs text.';
    if (new Set(texts.map(t => t.toLowerCase())).size !== texts.length) return 'Choices must be different from each other.';
    if (!it.options.some(o => o.id === r.correctId)) return 'Mark one choice as correct.';
    if (!isStr(r.hint, 3, 220)) return 'Add a hint.';
    const right = String(r.options[r.correctId]).trim().toLowerCase();
    if (right.length >= 4 && r.hint.toLowerCase().includes(right)) return 'The hint repeats the correct choice. Rewrite it so it points to the clue without giving the answer.';
    if (it.options.some(o => !isStr(r.fb[o.id], 3, 300))) return 'Every choice needs feedback.';
    return '';
  }

  /* ===== more Pip modes: mini-lesson, story mission, evidence recap, evaluation log (shared validation + explicit provenance) ===== */
  const MINI_FIX = () => ({ workedExample: { question: 'Why did Rin move the tripod behind a stone wall?', answer: 'The wall kept the air still, so the tripod stopped shaking.',
      because: 'The wind shook the tripod and the moon slid away. Behind the wall the air was still.', citations: [{ sentenceId: 's5', quote: 'When the wind shook the tripod, the moon slid out of view.' }, { sentenceId: 's6', quote: 'where the air was still' }] },
    supports: { short: { directions: 'Read these lines. Pick why.', guidedIds: ['s1', 's2', 's3', 's4'], independentIds: ['s5', 's6', 's7'] }, standard: { directions: 'Read the passage. Pick the answer that explains why.' } } });
  const BADWORDS = /\b(dyslex|disorder|adhd|autis|disab|lazy|slow learner|low ability|struggl)/i;
  function checkMini(x, input) {
    const e = [], sent = new Map(input.passage.map(s => [s.id, s.text])), w = x && x.workedExample, su = x && x.supports;
    if (!w || !isStr(w.question, 5, 200) || !isStr(w.answer, 3, 200) || !isStr(w.because, 3, 300)) e.push('Worked example needs a question, answer and reason.');
    else (Array.isArray(w.citations) ? w.citations : []).concat(Array.isArray(w.citations) && w.citations.length ? [] : [{}]).forEach(c => { const s = sent.get(c && c.sentenceId); if (!s || !isStr(c.quote, 3, 300) || !s.includes(c.quote)) e.push('Worked example quote is not an exact piece of its sentence.'); });
    if (!su || !su.short || !su.standard || !isStr(su.short.directions, 3, 120) || !isStr(su.standard.directions, 3, 160)) e.push('Both support levels need directions.');
    else if (su.short.directions.split(/\s+/).length > 12) e.push('Short directions must be 12 words or fewer.');
    return e;
  }
  function checkWindows(x, items) {
    const e = [], su = x.supports; if (!su || !su.short) return e;
    [['guidedIds', 'guided'], ['independentIds', 'independent']].forEach(([k, d]) => { const it = items.find(i => i.difficulty === d), ids = su.short[k]; if (!it) return;
      if (!Array.isArray(ids) || !ids.length) return e.push(`Short window for the ${d} item is missing.`);
      if (!it.citations.every(c => ids.includes(c.sentenceId))) e.push(`Short window for the ${d} item leaves out a sentence it cites.`); });
    return e;
  }
  async function runMini(offline) {
    const input = buildInput(); input.evidenceStrength = offline ? TC.offlinePractice.evidenceStrength : input.evidenceStrength; let raw, mode = offline ? 'offline-fixture' : 'live-ai';
    if (offline) raw = { ...JSON.parse(JSON.stringify(TC.offlinePractice)), ...MINI_FIX() };
    else { TS.busy = true; TS.draft = null; TS.msg = 'Pip is drafting a worked example, a guided clue and an independent question…'; render(); const sm = await sampler();
      if (!sm) { TS.busy = false; TS.msg = 'Pip’s AI is not available in this view, so nothing was drafted. Load the offline fixture instead.'; return render(); }
      try { raw = await sm.json(window.SQ_PROMPTS.buildMini(input), { modelTier: 'default', cache: false }); } catch (e) { TS.busy = false; TS.msg = `The AI request failed (${(e && e.code) || 'error'}). Nothing was drafted.`; return render(); } }
    finishDraft(raw, input, mode); if (TS.trace) TS.trace.kind = 'minilesson';
    if (TS.draft && TS.draft.ok) { const errs = [...checkMini(raw, input), ...checkWindows(raw, TS.draft.items)];
      if (errs.length) { TS.draft = { ok: false, mode, input, errors: errs }; TS.review = []; if (TS.trace) { TS.trace.validation = { ok: false, errors: errs }; TS.trace.status = 'rejected'; } }
      else { TS.draft.kind = 'minilesson'; TS.lesson = { worked: { ...raw.workedExample }, supports: JSON.parse(JSON.stringify(raw.supports)), level: 'standard' }; } }
    if (!TS.draft || !TS.draft.ok) TS.lesson = null; C.save(); render();
  }
  function lessonHtml() {
    const L = TS.lesson; if (!L || !TS.draft || TS.draft.kind !== 'minilesson') return '';
    const w = L.worked, sh = L.supports.short, lv = L.level;
    return `<section class="tg-lesson" aria-label="Mini-lesson"><h4>Mini-lesson: worked example</h4>
      <label class="tg-l" for="tgw-q">Worked question</label><input id="tgw-q" class="inp" data-f="wq" value="${esc(w.question)}"><label class="tg-l" for="tgw-a">Model answer</label><input id="tgw-a" class="inp" data-f="wa" value="${esc(w.answer)}">
      <label class="tg-l" for="tgw-b">Because…</label><input id="tgw-b" class="inp" data-f="wb" value="${esc(w.because)}">
      <ul class="tg-cites">${w.citations.map(c => `<li><code>${esc(c.sentenceId)}</code> “${esc(c.quote)}” <span class="tg-ok">✓ found in the source</span></li>`).join('')}</ul>
      <fieldset class="tg-opts"><legend>Support level for the learner (the skill stays the same)</legend>
        <label><input type="radio" name="tgsup" data-f="sup" value="standard" ${lv === 'standard' ? 'checked' : ''}> <b>Standard:</b> ${esc(L.supports.standard.directions)} (whole passage)</label><br>
        <label><input type="radio" name="tgsup" data-f="sup" value="short" ${lv === 'short' ? 'checked' : ''}> <b>Shorter:</b> ${esc(sh.directions)} (guided item shows ${esc(sh.guidedIds.join(', '))}; independent item shows ${esc(sh.independentIds.join(', '))})</label></fieldset>
      <p class="small">Approve each item below. The chosen support level, worked example and the supporting sentences travel with the approval.</p></section>`;
  }

  /* story mission */
  const MISSION_FIX = a => ({ intro: 'Pip’s star lens is missing a clue. Who should we help first?', choices: [{ id: 'a', name: 'Rin the stargazer', line: 'Rin wants to finish the moon drawing.', payoff: 'Rin finishes the moon drawing and pins it on the wall.' }, { id: 'b', name: 'Tock the lantern bot', line: 'Tock lost its glow and needs the clue.', payoff: 'Tock’s lantern shines again and lights the path.' }] });
  function checkMission(m, a) {
    const e = [], ok = (t, n) => isStr(t, 3, n);
    if (!m || !ok(m.intro, 220)) e.push('The intro is missing or too long.');
    const ch = m && Array.isArray(m.choices) ? m.choices : [];
    if (ch.length !== 2) e.push('Exactly two character choices are needed.');
    else if (!ch.every(c => c && isStr(c.id, 1, 10) && ok(c.name, 30) && ok(c.line, 140) && ok(c.payoff, 180)) || ch[0].id === ch[1].id) e.push('Each choice needs a unique id, name, line and payoff of reasonable length.');
    const keys = [a.item.options.find(o => o.id === a.item.correctId).text].filter(t => t.length >= 6).map(t => t.toLowerCase().replace(/[.!?]/g, ''));
    const blob = JSON.stringify(m || {}).toLowerCase(); if (keys.some(k => blob.includes(k))) e.push('The story repeats the answer key. Keep the story separate from the answer.');
    if (BADWORDS.test(blob)) e.push('The story uses a label that should not describe a learner.');
    return e;
  }
  TS.story = {};
  async function runStory(id, offline) {
    const a = (S.approved || []).find(x => x.id === id); if (!a) return; const slot = TS.story[id] = { busy: true, msg: '', draft: null };
    if (offline) { const m = MISSION_FIX(a), errs = checkMission(m, a); Object.assign(slot, { busy: false, draft: errs.length ? null : { mode: 'offline-fixture', ...m }, msg: errs.join(' ') }); return render(); }
    slot.msg = 'Pip is writing a short story frame…'; render(); const sm = await sampler();
    if (!sm) { slot.busy = false; slot.msg = 'Pip’s AI is not available in this view. Use the authored story instead.'; return render(); }
    let m; try { m = await sm.json(window.SQ_PROMPTS.buildMission({ skill: SKILL_DEFS[a.skillId].label, gradeBand: gradeBand(learner().grade), setting: (a.passage[0] || {}).text || '' }), { modelTier: 'default', cache: false }); } catch (e) { slot.busy = false; slot.msg = `The AI request failed (${(e && e.code) || 'error'}).`; return render(); }
    const errs = checkMission(m, a); slot.busy = false; if (errs.length) { slot.msg = 'Rejected by the checks: ' + errs.join(' '); slot.draft = null; } else slot.draft = { mode: 'live-ai', ...m };
    S.traces = [{ id: 't' + Date.now(), promptVersion: window.SQ_PROMPTS.missionVersion, mode: 'live-ai story-mission', tier: 'default (viewer’s own Claude account)', createdAt: Date.now(), sourceVersion: a.sourceVersion, skillId: a.skillId, evidenceStrength: '–', input: { skill: a.skillId }, output: m, validation: { ok: !errs.length, errors: errs }, status: errs.length ? 'rejected' : 'pending review', edits: [], approvedIds: [], rejectedItems: 0, kind: 'story' }, ...(S.traces || [])].slice(0, 12); C.save(); render();
  }
  function storyHtml(a) {
    const sl = TS.story[a.id] || {}, d = sl.draft;
    if (a.story) return `<div class="tg-story"><small class="tg-chip ok">Story approved · ${a.story.mode === 'live-ai' ? 'live AI draft' : 'authored offline story, not AI'}</small> “${esc(a.story.intro)}” <button class="btn sm ghost" data-a="tgStoryOff" data-id="${esc(a.id)}">Remove story</button></div>`;
    if (!d) return `<div class="tg-story"><div class="row left tight"><button class="btn sm" data-a="tgStory" data-id="${esc(a.id)}" data-m="off">Add story mission (authored)</button><button class="btn sm ghost" data-a="tgStory" data-id="${esc(a.id)}" data-m="live" ${live() ? '' : 'disabled'}>Draft story with Pip</button></div>${sl.msg ? `<p class="${sl.busy ? 'small' : 'err'}" role="status">${esc(sl.msg)}</p>` : ''}</div>`;
    return `<div class="tg-story"><p class="tg-mode ${d.mode === 'live-ai' ? 'live' : 'off'}">${d.mode === 'live-ai' ? 'Live AI draft' : 'Authored offline story · written by hand, not AI'}. Edit, then approve. The answer key is not in the story.</p>
      <label class="tg-l" for="st-i-${esc(a.id)}">Pip’s intro</label><input id="st-i-${esc(a.id)}" class="inp" data-f="stintro" data-id="${esc(a.id)}" value="${esc(d.intro)}">
      ${d.choices.map((c, k) => `<fieldset class="tg-opts"><legend>Character ${k + 1}</legend><input class="inp" aria-label="Character name" data-f="stname" data-id="${esc(a.id)}" data-k="${k}" value="${esc(c.name)}"><input class="inp" aria-label="Why they need help" data-f="stline" data-id="${esc(a.id)}" data-k="${k}" value="${esc(c.line)}"><input class="inp" aria-label="Payoff after practice" data-f="stpay" data-id="${esc(a.id)}" data-k="${k}" value="${esc(c.payoff)}"></fieldset>`).join('')}
      <div class="row left tight"><button class="btn sm" data-a="tgStoryOk" data-id="${esc(a.id)}">Approve story</button><button class="btn sm ghost" data-a="tgStoryNo" data-id="${esc(a.id)}">Discard</button></div></div>`;
  }

  /* teacher recap, linked to attempt ids */
  TS.recap = null;
  const lbl3 = (a, it) => it && it.difficulty ? (it.difficulty === 'independent' ? 'fresh independent item' : 'guided item') : 'practice item';
  function practiceAttempts(p) {
    const appr = (S.approved || []).filter(a => a.learnerId === p.id), ids = new Set(appr.filter(a => a.item.difficulty !== 'independent').map(a => a.id)); const lastB = (p.attempts || []).filter(t => t.source === 'assign').map(t => t.battleId);
    const bs = [...new Set(lastB)].slice(-1);
    return (p.attempts || []).filter(t => t.source === 'assign' && bs.includes(t.battleId)).map((t, n, arr) => ({ id: t.id, itemId: t.itemId, n: t.attempt, correct: !!t.correct, assisted: !!t.assisted || t.attempt > 1, selected: t.selectedText || '', correctText: t.correctText || '', role: ids.has(t.itemId) ? 'approved question' : 'fresh question', order: n })).slice(0, 12);
  }
  function offlineRecap(p, att) {
    const cut = x => String(x).replace(/[.!?]+$/, ''); const claims = []; const first = att.find(x => x.n === 1 && x.role === 'approved question');
    if (first) claims.push({ text: `${p.name} first chose “${cut(first.selected)}” on the approved question${first.correct ? ', which was the intended answer.' : ' instead of “' + cut(first.correctText) + '”.'}`, attemptIds: [first.id] });
    const retry = att.find(x => x.role === 'approved question' && x.n > 1 && x.correct);
    if (first && !first.correct) claims.push({ text: retry ? `After the clue, ${p.name} chose “${cut(retry.selected)}” on a retry. This answer followed help, so it is not counted as independent.` : `${p.name} had not yet found the answer after the clue.`, attemptIds: [first.id, ...(retry ? [retry.id] : [])] });
    const fresh = att.filter(x => x.role === 'fresh question'), f1 = fresh.find(x => x.n === 1);
    if (f1) claims.push({ text: f1.correct ? `On a fresh question with no help, ${p.name} chose “${cut(f1.selected)}” on the first try.` : `On a fresh question with no help, ${p.name} chose “${cut(f1.selected)}” first; the intended answer was “${cut(f1.correctText)}”.`, attemptIds: [f1.id] });
    const next = f1 && f1.correct ? 'Try another short passage at the same skill, with the clue offered only if asked for.' : 'Practise the same skill again with the clue shown first, then a fresh item with no help.';
    const unc = att.length < 5 ? `This note rests on ${att.length} attempt${att.length === 1 ? '' : 's'} from one practice session, so treat it as a first look, not a pattern.` : 'This is one practice session. Check it against more work before deciding anything.';
    return { mode: 'rule-based', claims, next, uncertainty: unc };
  }
  async function runRecap(offline) {
    const p = learner(), att = practiceAttempts(p); TS.recap = { busy: true, msg: '', draft: null };
    if (!att.length) { TS.recap = { busy: false, msg: `${p.name} has no approved-practice attempts yet. Play the approved practice first.`, draft: null }; return render(); }
    if (offline) { TS.recap = { busy: false, msg: '', draft: offlineRecap(p, att), att }; return render(); }
    TS.recap.msg = 'Pip is drafting a recap…'; render(); const sm = await sampler();
    if (!sm) { TS.recap = { busy: false, msg: 'Pip’s AI is not available in this view. Use the rule-based draft.', draft: null }; return render(); }
    let r; try { r = await sm.json(window.SQ_PROMPTS.buildRecap({ learner: 'synthetic learner', attempts: att.map(x => ({ id: x.id, role: x.role, attemptNumber: x.n, selected: x.selected, intendedAnswer: x.correctText, correct: x.correct, afterHelp: x.assisted })) }), { modelTier: 'default', cache: false }); } catch (e) { TS.recap = { busy: false, msg: `The AI request failed (${(e && e.code) || 'error'}).`, draft: null }; return render(); }
    const ids = new Set(att.map(x => x.id)), errs = [], cl = Array.isArray(r && r.claims) ? r.claims.slice(0, 5) : [];
    if (!cl.length) errs.push('No claims.'); cl.forEach(c => { if (!c || !isStr(c.text, 5, 300) || !Array.isArray(c.attemptIds) || !c.attemptIds.length || !c.attemptIds.every(i => ids.has(i))) errs.push('A claim does not cite real attempt ids.'); if (BADWORDS.test(String(c && c.text))) errs.push('A claim uses a label.'); });
    if (!isStr(r && r.next, 3, 300) || !isStr(r && r.uncertainty, 3, 300)) errs.push('Next step and uncertainty are required.');
    TS.recap = errs.length ? { busy: false, msg: 'Rejected by the checks: ' + errs.join(' '), draft: null } : { busy: false, msg: '', draft: { mode: 'live-ai', claims: cl, next: r.next, uncertainty: r.uncertainty }, att }; render();
  }
  function recapHtml() {
    const p = learner(), R = TS.recap, saved = (S.recaps || []).filter(x => x.learnerId === p.id)[0];
    const head = `<details class="tg-change" ${R || saved ? 'open' : ''}><summary>Evidence-linked recap for ${esc(p.name)}</summary><p class="small">Drafts what ${esc(p.name)} selected, what changed after the hint and what to try next. Each claim links to the attempt it came from. You edit it before it is saved.</p>
      <div class="row left"><button class="btn" data-a="tgRecap" data-m="off">Draft recap (rule-based)</button><button class="btn ghost" data-a="tgRecap" data-m="live" ${live() ? '' : 'disabled'}>Draft with Pip</button></div>`;
    let body = '';
    if (R && R.msg) body += `<p class="${R.busy ? 'small' : 'err'}" role="status">${esc(R.msg)}</p>`;
    if (R && R.draft) { const d = R.draft; body += `<p class="tg-mode ${d.mode === 'live-ai' ? 'live' : 'off'}">${d.mode === 'live-ai' ? 'Live AI draft · checked: every claim cites a real attempt' : 'Rule-based draft · built from the attempt log, not AI'}</p>
      <ul class="tg-recap">${d.claims.map((c, k) => `<li><input class="inp" aria-label="Claim ${k + 1}" data-f="rctext" data-k="${k}" value="${esc(c.text)}"><small>Attempts: ${c.attemptIds.map(i => `<code>${esc(i)}</code>`).join(' ')}</small></li>`).join('')}</ul>
      <label class="tg-l" for="rc-n">What to try next</label><input id="rc-n" class="inp" data-f="rcnext" value="${esc(d.next)}"><label class="tg-l" for="rc-u">Uncertainty</label><input id="rc-u" class="inp" data-f="rcunc" value="${esc(d.uncertainty)}">
      <div class="row left"><button class="btn" data-a="tgRecapSave">Save recap</button></div>`; }
    if (saved) body += `<h4>Saved recap · ${new Date(saved.at).toLocaleDateString()} · ${saved.mode === 'live-ai' ? 'live AI draft' : 'rule-based draft'}${saved.edited ? ' · teacher-edited' : ''}</h4><ul>${saved.claims.map(c => `<li>${esc(c.text)} <small>(${c.attemptIds.map(esc).join(', ')})</small></li>`).join('')}</ul><p><b>Next:</b> ${esc(saved.next)}</p><p class="small">${esc(saved.uncertainty)}</p>`;
    return head + body + '</details>';
  }

  /* evaluation log from real traces (nothing is invented: rows appear only for drafts that were actually run) */
  const EV = v => ['yes', 'no', 'unsure'].map(o => `<option value="${o}" ${v === o ? 'selected' : ''}>${o}</option>`).join('');
  function evalHtml() {
    const rows = (S.traces || []).filter(t => t.kind !== 'story' && !/change-check/.test(String(t.mode)));
    const ev = t => t.eval || {}, q = t => (t.validation && t.validation.ok ? (t.output && t.output.items ? t.output.items.reduce((n, i) => n + ((i.citations || []).length), 0) : 0) : 0);
    return `<details class="tg-change" ${rows.length ? 'open' : ''}><summary>Evaluation log: fixed bank vs generated (real runs only)</summary>
      <p class="small">One row per draft actually run. Automatic columns come from the checks; the three judgement columns are yours. Review seconds start when the draft appears and stop at the first approval. Prototype evidence only: it says nothing about learning gains.</p>
      ${rows.length ? `<div class="scroll"><table class="tbl tg-tbl"><tr><th>When</th><th>Source</th><th>Mode</th><th>Checks</th><th>Quotes matched</th><th>Edits</th><th>Review s</th><th>One defensible answer?</th><th>Matches source?</th><th>Fits skill?</th></tr>
      ${rows.map(t => `<tr><td>${new Date(t.createdAt).toLocaleTimeString()}</td><td>${esc(t.sourceVersion)}</td><td>${esc(t.mode)}${t.kind === 'minilesson' ? ' · mini-lesson' : ''}</td><td>${t.validation.ok ? 'passed' : 'rejected: ' + esc((t.validation.errors || []).join(' ').slice(0, 80))}</td><td>${q(t)}</td><td>${t.edits.length}</td><td>${t.reviewMs ? Math.round(t.reviewMs / 1000) : '–'}</td>
        ${['unique', 'source', 'skill'].map(k => `<td><select class="inp sel" aria-label="${k} for ${esc(t.id)}" data-ev="${esc(t.id)}" data-k="${k}"><option value="">–</option>${EV(ev(t)[k])}</select></td>`).join('')}</tr>`).join('')}</table></div>` : '<p>No drafts yet. Run a draft (live, or the authored fixture) and a row appears here.</p>'}
      <p class="small">Fixed bank baseline for comparison: one item (<code>${esc(TC.fixedBankBaseline.id)}</code>) with its own short context, no quote and no feedback for each choice.</p></details>`;
  }
  document.addEventListener('change', e => { const t = e.target; if (t && t.dataset && t.dataset.ev) { const tr = (S.traces || []).find(x => x.id === t.dataset.ev); if (tr) { tr.eval = { ...(tr.eval || {}), [t.dataset.k]: t.value }; C.save(); } } });
  const modesHtml = () => {
    const bs = btnState(), can = !passageInfo().err && TS.appr && !TS.busy;
    return `<details class="tg-change" ${TS.lesson ? 'open' : ''}><summary>Mini-lesson: worked example, guided clue, independent question</summary>
      <p class="small">From the passage above, Pip drafts one worked example, a guided clue and an independent question, plus a shorter-directions support level. You edit and approve each piece.</p>
      <div class="row left"><button class="btn" data-a="tgMini" data-m="off" ${bs.off ? 'disabled' : ''}>Load offline mini-lesson</button><button class="btn ghost" data-a="tgMini" data-m="live" ${can && live() ? '' : 'disabled'}>Draft mini-lesson with Pip</button></div></details>${recapHtml()}${evalHtml()}`;
  };

  const actions = {
    tgPick(d) { TS.learner = d.id; TS.draft = null; TS.trace = null; TS.review = []; TS.msg = ''; const ev = evidence(learner()); if (ev.suggested) TS.skill = ev.suggested; sfx.tap(); render(); },
    tgEv() { TS.showEv = !TS.showEv; render(); },
    tgMini(d) { runMini(d.m === 'off'); },
    tgStory(d) { runStory(d.id, d.m === 'off'); },
    tgStoryNo(d) { delete TS.story[d.id]; render(); },
    tgStoryOff(d) { const a = (S.approved || []).find(x => x.id === d.id); if (a) { delete a.story; C.save(); } delete TS.story[d.id]; render(); },
    tgStoryOk(d) { const a = (S.approved || []).find(x => x.id === d.id), sl = TS.story[d.id]; if (!a || !sl || !sl.draft) return; const m = sl.draft, errs = checkMission(m, a); if (errs.length) { sl.msg = errs.join(' '); sl.draft = m; return render(); }
      a.story = { mode: m.mode, intro: m.intro.trim(), choices: m.choices.map(c => ({ id: c.id, name: c.name.trim(), line: c.line.trim(), payoff: c.payoff.trim() })), promptVersion: m.mode === 'live-ai' ? window.SQ_PROMPTS.missionVersion : 'authored', approvedAt: Date.now() }; C.save(); sfx.ok(); delete TS.story[d.id]; render(); },
    tgRecap(d) { runRecap(d.m === 'off'); },
    tgRecapSave() { const R = TS.recap; if (!R || !R.draft) return; const p = learner(), d = R.draft; const orig = JSON.stringify([d.claims.map(c => c.text), d.next, d.uncertainty]);
      const rec = { id: 'rc' + Date.now(), learnerId: p.id, at: Date.now(), mode: d.mode, claims: d.claims, next: d.next, uncertainty: d.uncertainty, edited: R.edited || false, attemptIds: [...new Set(d.claims.flatMap(c => c.attemptIds))] };
      S.recaps = [rec, ...(S.recaps || []).filter(x => x.learnerId !== p.id)].slice(0, 10); TS.recap = null; C.save(); sfx.ok(); void orig; render(); },
    tgChgRun() { if (!TS.chg.busy) runChange(); }, tgChgSaved() { runSavedChange(); },
    tgRev(d) { const c = $('#rv-' + d.id); if (!c || !c.checked) { c && c.focus(); return; } S.reviewed = S.reviewed || {}; S.reviewed[d.id] = { at: Date.now() }; C.save(); sfx.ok(); renderR(); },
    tgUnrev(d) { if (S.reviewed) delete S.reviewed[d.id]; C.save(); renderR(); },
    tgOpen() { TS.open = !TS.open; if (TS.open) { const ev = evidence(learner()); if (ev.suggested) TS.skill = ev.suggested; } render(); },
    tgSample() { TS.passage = TC.generatorInput.passage.map(s => s.text).join(' '); TS.appr = false; TS.draft = null; render(); },
    tgDraft() { if (!btnState().draft) runLive(); },
    tgOffline() { if (!btnState().off) runOffline(); },
    tgApprove(d) {
      const i = +d.i, r = TS.review[i], it = TS.draft && TS.draft.items[i]; if (!r || !it) return;
      const err = checkReview(r, it); if (err) { r.msg = err; return render(); }
      const edits = [], cmp = (field, from, to) => { if (String(from).trim() !== String(to).trim()) edits.push({ itemId: it.id, field, from, to }); };
      cmp('question', it.question, r.q); cmp('hint', it.hint, r.hint); cmp('correctId', it.correctId, r.correctId);
      it.options.forEach(o => { cmp('option ' + o.id, o.text, r.options[o.id]); cmp('feedback ' + o.id, it.feedbackByOption[o.id], r.fb[o.id]); });
      const q = r.q.trim(), rec = { id: `${TS.draft.input.sourceVersion}:${it.id}:${hash(q).slice(0, 4)}`, sourceVersion: TS.draft.input.sourceVersion, skillId: TS.draft.input.skillId, mode: TS.draft.mode, promptVersion: PV,
        approvedAt: Date.now(), learnerId: learner().id, outcomes: [], passage: TS.draft.input.passage, edits: edits.length, reviewIndex: i,
        item: { id: it.id, difficulty: it.difficulty, question: q, options: it.options.map(o => ({ id: o.id, text: r.options[o.id].trim() })), correctId: r.correctId, hint: r.hint.trim(),
          feedbackByOption: Object.fromEntries(it.options.map(o => [o.id, r.fb[o.id].trim()])), citations: it.citations.map(c => ({ sentenceId: c.sentenceId, quote: c.quote })) } };
      if (TS.lesson && TS.draft.kind === 'minilesson') { rec.lesson = { worked: JSON.parse(JSON.stringify(TS.lesson.worked)), supports: JSON.parse(JSON.stringify(TS.lesson.supports)), level: TS.lesson.level }; rec.support = TS.lesson.level; }
      if (TS.trace && !TS.trace.reviewMs) TS.trace.reviewMs = Date.now() - TS.trace.createdAt;
      S.approved = [rec, ...(S.approved || []).filter(x => x.id !== rec.id)].slice(0, 20);
      if (TS.trace) { TS.trace.approvedIds.push(rec.id); TS.trace.edits.push(...edits); TS.trace.status = 'approved'; }
      r.status = 'approved'; r.recId = rec.id; r.msg = ''; C.save(); sfx.ok(); render();
    },
    tgReject(d) { const r = TS.review[+d.i]; if (!r) return; r.status = 'rejected'; if (TS.trace) { TS.trace.rejectedItems++; } C.save(); render(); },
    tgRevoke(d) { const r = TS.review[+d.i]; if (!r) return; if (r.recId) { S.approved = (S.approved || []).filter(x => x.id !== r.recId); if (TS.trace) TS.trace.approvedIds = TS.trace.approvedIds.filter(x => x !== r.recId); r.recId = ''; } r.status = 'pending'; C.save(); render(); },
    tgPlay(d) {
      const a = (S.approved || []).find(x => x.id === d.id), p = learner(); if (!a || !p) return; sfx.tap(); S.current = p.id; C.save();
      if (C.G.practiceIntro) return C.G.practiceIntro(a, 'dash');
      if (C.G.playApproved) return C.G.playApproved(a, 'dash');
      const it = { type: 'mc', prompt: esc(a.item.question), opts: a.item.options.map(o => ({ id: o.id, text: o.text })), correctId: a.item.correctId, fbo: a.item.feedbackByOption, hint: a.item.hint, key: a.id, qid: a.id, skill: a.skillId, passageSents: a.passage, cites: a.item.citations, sub: 'teacher-approved' };
      C.G.startBattle({ dest: 'mountain', enemy: 'ink-baron', items: [it], min: 1, resolve: 2, source: 'assign', returnTo: 'dash', title: 'Teacher assignment', dedupe: p.id + ':' + a.id });
    },
  };
  function demoReady() { ensure(); TS.learner = 'syn-ari'; const a = S.profiles.find(p => p.id === 'syn-ari'); if (a) a.practiceDone = {}; TS.open = true; TS.skill = 'inference_causal'; TS.passage = TC.generatorInput.passage.map(s => s.text).join(' '); TS.appr = true; TS.draft = null; TS.lesson = null; TS.trace = null; TS.msg = ''; C.save(); render(); renderE(); const g = $('#tcard'); if (g && g.scrollIntoView) g.scrollIntoView({ block: 'start' }); }
  return { ensure, mount, actions, demoReady };
};
})();
