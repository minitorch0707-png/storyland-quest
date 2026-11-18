/* Storyland Quest – group-lesson drafts for teachers.
   Learners are grouped by the existing reviewed evidence rules (summarizeEvidence). Pip then drafts a five-minute lesson for the group:
   the observed pattern, one worked example, two guided questions and one independent exit item. Every claim links to attempt ids.
   The teacher edits and approves. Sparse evidence is shown, never hidden. */
window.SQ_PARTS.push((G, C) => {
'use strict';
const { S, $, esc } = C, A = G.actions, { summarizeEvidence } = window.SQ_ENGINE;
const SKILL = { inference_causal: 'Inference: why it happened', main_idea: 'Main idea', word_context: 'Word meaning in context', reading: 'Reading comprehension' };
const TAG = { selected_visible_detail_over_cause: 'chose a visible detail instead of the cause' };
const sk = id => SKILL[id] || String(id).replace(/_/g, ' ');
let GR = { passage: '', busy: false, msg: '', draft: null, group: null, appr: '' };
const TELE = () => (window.SQ_TELESCOPE ? window.SQ_TELESCOPE.generatorInput.passage.map(s => s.text).join(' ') : '');
const sentsOf = txt => (String(txt).replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+["”')]*|[^.!?]+$/g) || []).map((x, i) => ({ id: 's' + (i + 1), text: x.trim() }));

/* ---- grouping: only rule-based evidence decides who is in a group ---- */
function groups() {
  const map = new Map();
  S.profiles.filter(p => !p.qa).forEach(p => { const ev = summarizeEvidence(p.attempts || []);
    ev.filter(e => e.status !== 'monitor').forEach(e => { const tag = (e.patterns[0] || {}).tag || '', key = e.skillId + '|' + tag;
      const ids = (p.attempts || []).filter(a => a.skillId === e.skillId && a.attempt === 1 && !a.assisted && a.correct === false).map(a => a.id).filter(Boolean);
      const g = map.get(key) || { key, skillId: e.skillId, tag, learners: [], attemptIds: [], sparse: true };
      g.learners.push({ id: p.id, name: p.name, synthetic: !!p.synthetic, n: e.count, correct: e.correct, status: e.status }); g.attemptIds.push(...ids); if (e.status === 'suggest-practice') g.sparse = false; map.set(key, g); }); });
  return [...map.values()];
}

/* ---- the AI mode ---- */
G.gen.register({
  id: 'group-lesson', version: 'pip-group-1',
  build: inp => `You draft a five-minute small-group lesson for a teacher. Use ONLY the passage. The students are described by counts, never names.
Skill: ${inp.skill}. Observed pattern (from counted answers): ${inp.pattern || 'accuracy below the practice threshold'}. Students in the group: ${inp.n}. Grade band: ${inp.band}.
<data name="passage">
${JSON.stringify(inp.passage)}
</data>
Return JSON: {"pattern": "one plain sentence naming the mix-up without labelling any student", "worked": {"question": "...", "answer": "...", "because": "one sentence", "quote": "exact piece of one passage sentence", "sentenceId": "s1"}, "guided": [{"question": "...", "options": ["","","",""], "answer": 0, "quote": "...", "sentenceId": "s1"}, {...}], "exit": {"question": "...", "options": ["","","",""], "answer": 0, "quote": "...", "sentenceId": "s1"}}
Rules: questions at most 20 words; options distinct; "answer" is the 0-based index of the correct option; each quote must be copied exactly from the sentence named; the exit item must rely on a DIFFERENT sentence than the worked example; no diagnostic labels.`,
  validate(r, inp) { const e = [], g = G.gen, sent = new Map(inp.passage.map(s => [s.id, s.text]));
    const checkQ = (q, label) => { if (!q || !g.isStr(q.question, 5, 200) || g.words(q.question) > 20) return e.push(`${label}: the question is missing or too long.`);
      if (!Array.isArray(q.options) || q.options.length !== 4 || !q.options.every(o => g.isStr(o, 1, 90)) || new Set(q.options.map(o => String(o).toLowerCase())).size !== 4 || !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) e.push(`${label}: needs 4 distinct options and a valid answer index.`);
      const s = sent.get(q.sentenceId); if (!s || !g.isStr(q.quote, 3, 300) || !s.includes(q.quote)) e.push(`${label}: the quote is not an exact piece of ${q.sentenceId}.`); };
    if (!r || typeof r !== 'object') return ['The reply was not an object.'];
    if (!g.isStr(r.pattern, 5, 260)) e.push('pattern is missing.');
    const w = r.worked; if (!w || !g.isStr(w.question, 5, 200) || !g.isStr(w.answer, 2, 200) || !g.isStr(w.because, 3, 260)) e.push('The worked example is incomplete.'); else { const s = sent.get(w.sentenceId); if (!s || !g.isStr(w.quote, 3, 300) || !s.includes(w.quote)) e.push('Worked example: the quote is not exact.'); }
    if (!Array.isArray(r.guided) || r.guided.length !== 2) e.push('Exactly two guided questions are needed.'); else r.guided.forEach((q, i) => checkQ(q, 'Guided ' + (i + 1)));
    checkQ(r.exit, 'Exit item'); if (r.exit && w && r.exit.sentenceId === w.sentenceId) e.push('The exit item should rely on a different sentence than the worked example.');
    if (g.DIAG.test(JSON.stringify(r))) e.push('The reply uses a label that should not describe a learner.');
    return e; }
});

/* ---- card ---- */
function render() {
  const el = $('#grcard'); if (!el) return; const gs = groups();
  if (!GR.passage) GR.passage = TELE();
  const ai = C.AI().on;
  el.innerHTML = `<h2>Group lesson drafts</h2><p class="small">Groups come from the existing evidence rules (independent first tries only). Pip drafts a five-minute lesson from a passage you choose. You edit and approve it. ${ai ? '' : 'AI is off: connect it in the Generative AI card first.'}</p>
    ${gs.length ? gs.map((g, i) => `<div class="tg-lesson"><b>${esc(sk(g.skillId))}</b> ${g.tag ? '· ' + esc(TAG[g.tag] || g.tag) : ''} <span class="tg-chip ${g.sparse ? 'more' : 'sug'}">${g.sparse ? 'Sparse evidence' : 'Practice suggested'}</span>
      <p class="small">${g.learners.map(l => `${l.synthetic ? '🧪 ' : ''}${esc(l.name)} (${l.correct}/${l.n} right first try)`).join(' · ')}<br>Linked attempts: ${g.attemptIds.slice(0, 8).map(a => `<code>${esc(String(a).slice(-8))}</code>`).join(' ') || 'none'}</p>
      <button class="btn" data-a="grDraft" data-i="${i}" ${GR.busy ? 'disabled' : ''}>Draft 5-minute lesson</button></div>`).join('') : '<p>No group needs practice yet. Groups appear when learners have counted independent answers below the threshold.</p>'}
    <label class="tg-l" for="gr-pass">Passage for the lesson (paste yours, or use the telescope text)</label><textarea id="gr-pass" class="inp area tg-area" data-gr="passage" maxlength="1500">${esc(GR.passage)}</textarea>
    ${GR.msg ? `<p class="${GR.busy ? 'small' : 'err'}" role="status">${esc(GR.msg)}</p>` : ''}${GR.draft ? lessonHtml() : ''}`;
}
function lessonHtml() {
  const d = GR.draft, v = d.value, q = (x, k) => `<fieldset class="tg-opts"><legend>${k}</legend><input class="inp" aria-label="${k} question" data-gr="q" data-k="${k}" value="${esc(x.question)}"><ol type="A">${x.options.map((o, n) => `<li class="${n === x.answer ? 'tg-ok' : ''}">${esc(o)}${n === x.answer ? ' ✓' : ''}</li>`).join('')}</ol><q class="tg-src">${esc(x.sentenceId)}: ${esc(x.quote)}</q></fieldset>`;
  return `<div class="tg-lesson"><p class="tg-mode live">${esc(d.badge)} · ${d.group.learners.length} learner${d.group.learners.length === 1 ? '' : 's'} · quotes verified in the passage</p>
    <h4>Observed pattern</h4><input class="inp" data-gr="pattern" value="${esc(v.pattern)}"><p class="small">Linked attempts: ${d.group.attemptIds.slice(0, 8).map(a => `<code>${esc(String(a).slice(-8))}</code>`).join(' ') || 'none'}${d.group.sparse ? ' · <b>sparse evidence: treat as a first look</b>' : ''}</p>
    <h4>1. Worked example (model it)</h4><p><b>${esc(v.worked.question)}</b><br>Answer: ${esc(v.worked.answer)}<br>Because: ${esc(v.worked.because)}</p><q class="tg-src">${esc(v.worked.sentenceId)}: ${esc(v.worked.quote)}</q>
    <h4>2. Guided questions (ask together)</h4>${q(v.guided[0], 'Guided 1')}${q(v.guided[1], 'Guided 2')}<h4>3. Independent exit item</h4>${q(v.exit, 'Exit')}
    <div class="row left"><button class="btn big" data-a="grApprove">Approve lesson</button><button class="btn" data-a="grCopy">Copy lesson text</button></div>${GR.appr ? `<p class="small" role="status">${esc(GR.appr)}</p>` : ''}</div>`;
}
G.groupMount = render;
document.addEventListener('input', e => { const t = e.target; if (!t || !t.dataset || !t.dataset.gr || !t.closest('#grcard')) return; const f = t.dataset.gr;
  if (f === 'passage') GR.passage = t.value; else if (GR.draft) { const v = GR.draft.value; if (f === 'pattern') v.pattern = t.value; else if (f === 'q') { const k = t.dataset.k; (k === 'Exit' ? v.exit : v.guided[k === 'Guided 1' ? 0 : 1]).question = t.value; } } });
A.grDraft = async d => { const g = groups()[+d.i]; if (!g) return; const sents = sentsOf(GR.passage);
  if (sents.length < 4 || sents.length > 12) { GR.msg = 'Use a passage of 4 to 12 sentences.'; return render(); }
  GR.busy = true; GR.msg = 'Pip is drafting a lesson…'; GR.draft = null; GR.appr = ''; render();
  const grade = Math.round(g.learners.length ? (S.profiles.find(p => p.id === g.learners[0].id) || { grade: 3 }).grade : 3), band = grade <= 2 ? 'Grades 1-2' : grade <= 4 ? 'Grades 3-4' : grade <= 6 ? 'Grades 5-6' : 'Grades 7-8';
  const out = await G.gen.run('group-lesson', { skill: sk(g.skillId), pattern: TAG[g.tag] || g.tag, n: g.learners.length, band, passage: sents }, { skillId: g.skillId, sourceVersion: 'group-' + sents.length }); GR.busy = false;
  if (out.ok) { GR.msg = ''; GR.draft = { value: JSON.parse(JSON.stringify(out.value)), badge: G.gen.badge(out.trace), group: g, traceId: out.trace.id }; }
  else GR.msg = out.reason === 'unavailable' ? 'AI is not connected. Connect it in the Generative AI card, then try again.' : 'The draft was rejected by the checks: ' + out.errors.join(' ');
  render(); };
const text = () => { const d = GR.draft, v = d.value, q = (x, k) => `${k}: ${x.question}\n${x.options.map((o, i) => `  ${'ABCD'[i]}. ${o}`).join('\n')}\n  Answer: ${'ABCD'[x.answer]} (${x.sentenceId}: "${x.quote}")`;
  return [`5-minute lesson: ${sk(d.group.skillId)}`, `Pattern: ${v.pattern}`, `Linked attempts: ${d.group.attemptIds.slice(0, 8).join(', ') || 'none'}${d.group.sparse ? ' (sparse evidence)' : ''}`, `Source: ${d.badge}`, '', `Worked example: ${v.worked.question} -> ${v.worked.answer}. Because ${v.worked.because} (${v.worked.sentenceId}: "${v.worked.quote}")`, '', q(v.guided[0], 'Guided 1'), '', q(v.guided[1], 'Guided 2'), '', q(v.exit, 'Exit item')].join('\n'); };
A.grCopy = async () => { try { await navigator.clipboard.writeText(text()); GR.appr = 'Copied.'; } catch (e) { GR.appr = 'Copy was blocked here. Select the text by hand.'; } render(); };
A.grApprove = () => { const d = GR.draft; if (!d) return; const tr = (S.traces || []).find(t => t.id === d.traceId); if (tr) { tr.approvedIds.push('group-lesson'); tr.status = 'approved'; tr.reviewMs = Date.now() - tr.createdAt; }
  S.lessons = [{ id: 'gl' + Date.now(), at: Date.now(), skillId: d.group.skillId, learnerIds: d.group.learners.map(l => l.id), attemptIds: d.group.attemptIds.slice(0, 20), sparse: d.group.sparse, lesson: JSON.parse(JSON.stringify(d.value)), provenance: d.badge, traceId: d.traceId }, ...(S.lessons || [])].slice(0, 20);
  C.save(); GR.appr = 'Approved and saved. Copy it for your lesson plan.'; render(); };
G.groupList = groups;
});
