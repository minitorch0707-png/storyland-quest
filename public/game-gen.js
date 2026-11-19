/* Storyland Quest – one generation service for every AI mode.
   A mode is registered once: id, version, prompt builder, validator, optional authored fixture.
   Running a mode calls the connected AI, validates the reply, and writes a trace (input, output, checks, provenance).
   Rules, not the AI, decide scores, unlocks and what a learner is allowed to see. */
window.SQ_PARTS.push((G, C) => {
'use strict';
const { S } = C;
const modes = {};
const DIAG = /\b(dyslex\w*|disorder|adhd|autis\w*|disabilit\w*|lazy|slow learner|low[- ]ability|struggling (reader|student|learner|child)|behind (grade|in reading|their peers|the class)|weak reader)\b/i;
const words = s => (String(s || '').trim().match(/\S+/g) || []).length;
const isStr = (s, min = 1, max = 400) => typeof s === 'string' && s.trim().length >= min && s.length <= max;
/* one consistent AI mode indicator in every header */
const _hdr = G.hdr; G.hdr = (...a) => { const h = _hdr(...a); const on = C.AI().on; return h.replace('</header>', `<span class="aimode ${on ? 'on' : ''}" title="${on ? 'Pip’s AI is connected' : 'Pip’s AI is off. A grown-up can connect it in Teachers & Parents.'}">${on ? '✨ AI on' : 'AI off'}</span></header>`); };
G.gen = {
  modes, DIAG, words, isStr,
  register(m) { modes[m.id] = m; return m; },
  /** Run a mode. Returns { ok, value, errors, trace, reason }. reason: 'unavailable' | 'invalid' | 'ok'. */
  async run(id, input, ctx = {}) {
    const m = modes[id]; if (!m) throw new Error('unknown mode ' + id);
    if (!C.AI().on) { try { await C.connectAI(''); } catch (e) { /* offline */ } }
    const t0 = Date.now(); let raw = null, err = '';
    if (C.AI().on) { window.SQ_GEN_CALL = { id, input, ctx, mode: m }; try { raw = await C.aiRaw(m.build(input, ctx)); } catch (e) { err = (e && e.code) || 'error'; } window.SQ_GEN_CALL = null; }
    if (raw == null) return { ok: false, reason: 'unavailable', errors: [err ? `The AI request failed (${err}).` : 'AI is not connected.'], value: null, trace: null };
    const errors = m.validate(raw, input, ctx) || [], ok = !errors.length;
    const trace = { id: 't' + Date.now() + Math.random().toString(36).slice(2, 5), kind: 'gen', mode: m.id, promptVersion: m.version, provenance: C.AI().src === 'fixture' ? 'fixture' : 'live-ai', provider: C.AI().src === 'fixture' ? 'Authored demo fixture' : (C.AI().provider || ''), createdAt: Date.now(), ms: Date.now() - t0,
      input: m.redact ? m.redact(input) : input, output: raw, validation: { ok, errors }, status: ok ? 'passed checks' : 'rejected', edits: [], approvedIds: [], rejectedItems: 0, sourceVersion: ctx.sourceVersion || '', skillId: ctx.skillId || '', evidenceStrength: '–' };
    S.traces = [trace, ...(S.traces || [])].slice(0, 40); C.save();
    return { ok, reason: ok ? 'ok' : 'invalid', errors, value: ok ? (m.normalize ? m.normalize(raw, input, ctx) : raw) : null, trace };
  },
  badge(trace) { return !trace ? 'Rule-based (no AI)' : trace.provenance === 'fixture' ? `Authored demo fixture · ${trace.mode} ${trace.promptVersion}` : trace.provenance === 'live-ai' ? `Live AI · ${trace.mode} ${trace.promptVersion}` : `Saved run · ${trace.mode}`; }
};
});
