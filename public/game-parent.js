/* Storyland Quest – parent study report: trackers and graphs from the learner's real attempt log.
   The numbers are computed by rules. AI may only reword the narrative, and only if every number it uses is in the data.
   Nothing is emailed automatically: the teacher previews the report and presses Send. */
window.SQ_PARTS.push((G, C) => {
'use strict';
const { S, $, esc } = C, A = G.actions;
const DAY = 864e5, SK = { reading: 'Reading', inference_causal: 'Finding clues', phonics: 'Sounds', vocab: 'Word meanings', spelling: 'Spelling', grammar: 'Grammar', sequence: 'Putting things in order', writing: 'Writing' };
const skName = id => SK[id] || String(id).replace(/_/g, ' ');
const dayKey = t => { const d = new Date(t); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
const BAD = /\b(dyslex\w*|disorder|adhd|autis\w*|disabilit\w*|lazy|slow learner|low[- ]ability|struggling (reader|student|learner|child)|behind (grade|in reading|their peers|the class)|weak reader)\b/i;

/* ---- stats: everything below is plain counting ---- */
function stats(p, now = Date.now()) {
  const att = (p.attempts || []).filter(a => a.source !== 'synthetic' || true).map(a => ({ t: a.time, skill: a.skillId, first: a.attempt === 1 && !a.assisted, ok: !!a.correct, after: !!a.correct && (a.attempt > 1 || !!a.assisted), a1: a.attempt === 1 }));
  const ev = att.length ? att : (p.log || []).map(l => ({ t: l.t, skill: l.skill, first: true, ok: !!l.ok, after: false, a1: true }));
  const days = [...Array(7)].map((_, i) => { const t = now - (6 - i) * DAY, k = dayKey(t), e = ev.filter(x => dayKey(x.t) === k), q = e.filter(x => x.a1);
    return { k, label: new Date(t).toLocaleDateString([], { weekday: 'short' }), answered: q.length, right: q.filter(x => x.first && x.ok).length, after: e.filter(x => x.after).length, active: e.length > 0 }; });
  const wk = ev.filter(x => x.t >= now - 7 * DAY), q = wk.filter(x => x.a1), right = q.filter(x => x.first && x.ok).length, after = wk.filter(x => x.after).length;
  const bySkill = {}; q.forEach(x => { const b = bySkill[x.skill] = bySkill[x.skill] || { n: 0, ok: 0 }; b.n++; if (x.first && x.ok) b.ok++; });
  let streak = 0; for (let i = 0; i < 60; i++) { const k = dayKey(now - i * DAY); if (ev.some(x => dayKey(x.t) === k)) streak++; else if (i > 0) break; }
  const prev = ev.filter(x => x.t < now - 7 * DAY && x.t >= now - 14 * DAY && x.a1), prevPct = prev.length ? Math.round(100 * prev.filter(x => x.first && x.ok).length / prev.length) : null;
  const tut = (p.tutorLog || []).filter(x => x.at >= now - 7 * DAY).length;
  return { days, activeDays: days.filter(d => d.active).length, answered: q.length, right, after, pct: q.length ? Math.round(100 * right / q.length) : null, prevPct, streak, tut,
    skills: Object.entries(bySkill).map(([id, b]) => ({ id, name: skName(id), n: b.n, pct: Math.round(100 * b.ok / b.n) })).sort((a, b) => a.pct - b.pct), start: now - 6 * DAY, end: now };
}
const range = s => `${new Date(s.start).toLocaleDateString([], { month: 'short', day: 'numeric' })} to ${new Date(s.end).toLocaleDateString([], { month: 'short', day: 'numeric' })}`;

/* ---- rule-based narrative (always available) ---- */
const HOME = { reading: 'After a story, ask “why did that happen?” and look for the sentence that tells you.', inference_causal: 'Read one short text together and ask “what clue shows why?”.', phonics: 'Say two words and ask which ones rhyme.', vocab: 'Pick one new word a day and use it in a sentence.', spelling: 'Say a word, spell it out loud, then write it.', grammar: 'Read a sentence aloud and ask what the action word is.', sequence: 'Retell today in order: first, next, last.', writing: 'Write two sentences about their day together.' };
function narrate(p, s) {
  const first = esc(p.name), lowN = s.answered < 8, weak = s.skills.find(x => x.n >= 3 && x.pct < 70), strong = [...s.skills].reverse().find(x => x.n >= 3 && x.pct >= 70);
  return {
    opening: `Here is a short update on ${p.name}'s reading practice from ${range(s)}.`,
    celebrate: s.activeDays ? `${p.name} practised on ${s.activeDays} of the last 7 days${s.streak > 1 ? ` and has a ${s.streak}-day streak` : ''}${strong ? `, and did well on ${strong.name.toLowerCase()}` : ''}.` : 'There was no practice this week, so there is nothing to report yet. A few minutes a day is a great start.',
    practising: weak ? `We are working on ${weak.name.toLowerCase()}, where answers were right on the first try ${weak.pct}% of the time.` : lowN ? 'There were too few answers this week to pick one skill to focus on.' : 'No single skill stood out this week.',
    tryAtHome: [HOME[(weak || strong || { id: 'reading' }).id] || HOME.reading, 'Read together for 5 minutes and let your child tell you what they remember.'],
    caution: lowN ? `This is based on only ${s.answered} answer${s.answered === 1 ? '' : 's'} this week, so please treat it as a first look.` : 'These are practice answers from a game, not a test or a diagnosis. Check them against what you see at home.'
  };
}
const allowedNums = s => new Set([5, 7, 14, 0, 1, 2, 3, 4, 6, 8, 9, 10, s.activeDays, s.streak, s.answered, s.right, s.after, s.pct, s.prevPct, s.tut, ...s.skills.flatMap(x => [x.n, x.pct])].filter(x => x != null));
function okNarr(n, s) {
  if (!n || typeof n !== 'object') return false;
  const len = (v, m) => typeof v === 'string' && v.length >= 3 && v.length <= m;
  if (!len(n.opening, 220) || !len(n.celebrate, 240) || !len(n.practising, 240) || !len(n.caution, 240) || !Array.isArray(n.tryAtHome) || n.tryAtHome.length < 1 || n.tryAtHome.length > 3 || !n.tryAtHome.every(t => len(t, 200))) return false;
  const all = [n.opening, n.celebrate, n.practising, n.caution, ...n.tryAtHome].join(' ');
  if (BAD.test(all) || /https?:|www\./i.test(all)) return false;
  const ok = allowedNums(s); return (all.match(/\d+/g) || []).every(x => ok.has(+x));
}

/* ---- charts built from table cells and inline styles so they also work inside an email ---- */
const GREEN = '#3aa76d', AMBER = '#f0b429', GREY = '#d9d4c7', INK = '#2b2140';
function bar(label, pct, note, color) { return `<tr><td style="padding:3px 8px 3px 0;font:13px Arial;color:${INK};white-space:nowrap">${esc(label)}</td><td style="width:100%"><div style="background:#eee8d8;border-radius:6px;height:14px"><div style="width:${Math.max(2, pct)}%;background:${color};height:14px;border-radius:6px"></div></div></td><td style="padding-left:8px;font:12px Arial;color:#6b6280;white-space:nowrap">${esc(note)}</td></tr>`; }
function dailyChart(s) {
  const max = Math.max(4, ...s.days.map(d => d.answered)), H = 80;
  return `<table role="img" aria-label="Questions answered each day" style="border-collapse:collapse"><tr>${s.days.map(d => { const wrong = Math.max(0, d.answered - d.right - Math.min(d.after, d.answered - d.right)), aft = Math.min(d.after, d.answered - d.right);
    const h = x => Math.round(H * x / max);
    return `<td valign="bottom" style="padding:0 6px;text-align:center;font:11px Arial;color:#6b6280"><table cellpadding="0" cellspacing="0" style="margin:auto;width:26px;height:${H}px;border-collapse:collapse"><tr><td valign="bottom" style="padding:0"><div style="height:${h(wrong)}px;background:${GREY};line-height:0;font-size:0">&nbsp;</div><div style="height:${h(aft)}px;background:${AMBER};line-height:0;font-size:0">&nbsp;</div><div style="height:${h(d.right)}px;background:${GREEN};line-height:0;font-size:0">&nbsp;</div></td></tr></table>${d.answered}<br>${d.label}</td>`; }).join('')}</tr></table>
    <div style="font:12px Arial;color:#6b6280;margin-top:4px"><span style="color:${GREEN}">■</span> right on the first try &nbsp; <span style="color:${AMBER}">■</span> right after a hint &nbsp; <span style="color:#a39c88">■</span> still practising</div>`;
}
function tracker(s) { return `<div style="font:14px Arial">${s.days.map(d => `<span title="${d.label}" style="display:inline-block;width:34px;height:34px;line-height:34px;text-align:center;border-radius:50%;margin-right:4px;background:${d.active ? GREEN : '#eee8d8'};color:${d.active ? '#fff' : '#9a937f'}">${d.active ? '✓' : d.label[0]}</span>`).join('')}</div>`; }
function stat(n, t) { return `<td style="padding:10px 14px;background:#fff6dd;border-radius:10px;text-align:center"><div style="font:bold 24px Arial;color:${INK}">${esc(n)}</div><div style="font:12px Arial;color:#6b6280">${esc(t)}</div></td>`; }

function reportHtml(p, s, n, forPage) {
  const trend = s.pct != null && s.prevPct != null ? (s.pct > s.prevPct ? `up from ${s.prevPct}% the week before` : s.pct < s.prevPct ? `down from ${s.prevPct}% the week before` : 'the same as the week before') : 'no earlier week to compare yet';
  return `<div style="max-width:620px;margin:auto;font:15px/1.5 Arial;color:${INK}${forPage ? ';background:#fffdf7;padding:16px;border-radius:12px' : ''}">
  <h1 style="font:bold 22px Arial;margin:0 0 4px">🦊 ${esc(p.name)}’s study week</h1><div style="color:#6b6280;font:13px Arial">${esc(range(s))} · Storyland Quest</div>
  <p>${esc(n.opening)}</p>
  <table style="border-spacing:8px;margin:0 -8px"><tr>${stat(s.activeDays + '/7', 'days practised')}${stat(s.answered, 'questions answered')}${stat(s.pct == null ? '–' : s.pct + '%', 'right first try')}${stat(s.streak, 'day streak')}</tr></table>
  <h3 style="margin:14px 0 6px">Practice days</h3>${tracker(s)}
  <h3 style="margin:14px 0 6px">Questions each day</h3>${dailyChart(s)}
  <h3 style="margin:14px 0 6px">First-try accuracy by skill</h3>${s.skills.length ? `<table style="width:100%;border-collapse:collapse">${s.skills.map(x => bar(x.name, x.pct, `${x.pct}% of ${x.n}`, x.pct >= 70 ? GREEN : AMBER)).join('')}</table>` : '<p style="color:#6b6280">No answers this week yet.</p>'}
  <h3 style="margin:14px 0 6px">Help used</h3><table style="width:100%;border-collapse:collapse">${bar('Right first try', s.answered ? 100 * s.right / s.answered : 0, `${s.right}`, GREEN)}${bar('Right after a hint', s.answered ? 100 * s.after / s.answered : 0, `${s.after}`, AMBER)}${bar('Asked Pip a question', Math.min(100, s.tut * 10), `${s.tut}`, '#7b4bd6')}</table>
  <p style="font:13px Arial;color:#6b6280">First-try accuracy is ${s.pct == null ? 'not available yet' : s.pct + '%, ' + trend}. Answers after a hint are shown separately and are not counted as first try.</p>
  <h3 style="margin:14px 0 6px">What went well</h3><p>${esc(n.celebrate)}</p>
  <h3 style="margin:14px 0 6px">What we are practising</h3><p>${esc(n.practising)}</p>
  <h3 style="margin:14px 0 6px">Try at home (5 minutes)</h3><ul>${n.tryAtHome.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
  <p style="font:12px Arial;color:#6b6280;border-top:1px solid #e7dcc0;padding-top:8px">${esc(n.caution)}</p></div>`;
}
function reportText(p, s, n) { return [`${p.name}'s study week (${range(s)})`, '', n.opening, '', `Days practised: ${s.activeDays}/7 · Questions: ${s.answered} · Right first try: ${s.pct == null ? 'n/a' : s.pct + '%'} · Streak: ${s.streak} days`, `Right after a hint: ${s.after} · Questions asked to Pip: ${s.tut}`, ...s.skills.map(x => `  ${x.name}: ${x.pct}% of ${x.n}`), '', 'What went well: ' + n.celebrate, 'Practising: ' + n.practising, 'Try at home:', ...n.tryAtHome.map(t => '  - ' + t), '', n.caution].join('\n'); }

/* ---- teacher card ---- */
let PR = { id: '', n: null, mode: 'rule-based', msg: '', busy: false };
const kids = () => S.profiles.filter(p => !p.qa);
const cur = () => kids().find(p => p.id === PR.id) || kids().find(p => (p.attempts || []).length) || kids()[0];
const validEmail = v => /^[^@\s<>,;]{1,64}@[^@\s<>,;]{1,120}\.[A-Za-z]{2,}$/.test(String(v || '').trim());
function render() {
  const el = $('#pacard'); if (!el) return; const p = cur(); if (!p) { el.innerHTML = '<h2>Parent study report</h2><p>Add a student first.</p>'; return; }
  PR.id = p.id; const s = stats(p); if (!PR.n || PR.nid !== p.id) { PR.n = narrate(p, s); PR.nid = p.id; PR.mode = 'rule-based'; }
  const mode = (window.__sqEmail || 'off'), due = !p.parentSent || Date.now() - p.parentSent > 7 * DAY;
  el.innerHTML = `<h2>Parent study report</h2><p class="small">Trackers and graphs from ${esc(p.name)}’s own attempts this week. The numbers are counted by rules. ${C.AI().on ? 'AI can reword the notes, and its reply is checked against the numbers.' : 'AI is off, so the notes are written by rules.'} Nothing is emailed until you press Send.</p>
    <div class="row left"><label>Student <select class="inp sel" data-pr="pick">${kids().map(k => `<option value="${esc(k.id)}" ${k.id === p.id ? 'selected' : ''}>${k.synthetic ? '🧪 ' : ''}${esc(k.name)}</option>`).join('')}</select></label>
      <span class="tg-chip ${due ? 'more' : 'ok'}">${due ? 'Report due (none sent in 7 days)' : 'Sent ' + new Date(p.parentSent).toLocaleDateString()}</span></div>
    <div class="pr-edit"><label class="tg-l" for="pr-open">Opening</label><input id="pr-open" class="inp" data-pr="opening" value="${esc(PR.n.opening)}"><label class="tg-l" for="pr-cel">What went well</label><input id="pr-cel" class="inp" data-pr="celebrate" value="${esc(PR.n.celebrate)}">
      <label class="tg-l" for="pr-prac">What we are practising</label><input id="pr-prac" class="inp" data-pr="practising" value="${esc(PR.n.practising)}"><label class="tg-l" for="pr-home">Try at home (one per line)</label><textarea id="pr-home" class="inp area" data-pr="tryAtHome" rows="3">${esc(PR.n.tryAtHome.join('\n'))}</textarea>
      <label class="tg-l" for="pr-cau">Caution</label><input id="pr-cau" class="inp" data-pr="caution" value="${esc(PR.n.caution)}"></div>
    <p class="tg-mode ${PR.mode === 'ai' ? 'live' : 'off'}">${PR.mode === 'ai' ? 'AI-reworded notes · every number matched the data' : 'Notes written by rules (not AI)'}</p>
    <div class="row left"><button class="btn" data-a="prAi" ${C.AI().on && !PR.busy ? '' : 'disabled'}>Reword with Pip (AI)</button><button class="btn ghost" data-a="prReset">Reset notes</button></div>
    ${PR.msg ? `<p class="small" role="status">${esc(PR.msg)}</p>` : ''}
    <div class="pr-prev">${reportHtml(p, s, PR.n, true)}</div>
    <h3>Send to the parent</h3>
    <label class="tg-l" for="pr-mail">Parent email (kept in this browser only)</label><input id="pr-mail" class="inp" type="email" data-pr="mail" value="${esc(p.parentEmail || '')}" placeholder="parent@example.com" autocomplete="off">
    <label class="tg-chk"><input type="checkbox" data-pr="ok" ${p.parentOK ? 'checked' : ''}> This parent has agreed to receive study updates.</label>
    <div class="row left"><button class="btn" data-a="prCopy">Copy email text</button><button class="btn" data-a="prMailto">Open in my email app</button><button class="btn" data-a="prDownload">Download report (HTML)</button><button class="btn big" data-a="prSend" ${mode === 'off' ? 'disabled' : ''}>Send now</button></div>
    <p class="small">${mode === 'off' ? 'Direct sending is off: this page has no email server. Use Copy, Open in my email app, or Download. To enable Send, run <code>python3 server.py</code> with SMTP settings or <code>SQ_EMAIL_DRYRUN=1</code> (saves to an outbox folder for demos). See HOSTING.md.' : mode === 'dry-run' ? 'Demo mode: Send saves the email to the server’s <code>outbox/</code> folder instead of delivering it.' : 'Send delivers through this server’s email account after you confirm.'}</p>`;
}
const ensureMail = () => fetch('/api/status').then(r => r.json()).then(j => { window.__sqEmail = (j && j.email) || 'off'; render(); }).catch(() => {});
G.parentMount = () => { render(); ensureMail(); };
document.addEventListener('input', e => { const t = e.target; if (!t || !t.dataset || !t.dataset.pr || !t.closest('#pacard')) return; const f = t.dataset.pr, p = cur();
  if (f === 'mail') { p.parentEmail = t.value.trim(); C.save(); return; }
  if (f === 'ok') { p.parentOK = t.checked; C.save(); return; }
  if (f === 'pick') { PR.id = t.value; PR.n = null; render(); return; }
  if (PR.n) { PR.n[f] = f === 'tryAtHome' ? t.value.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 3) : t.value; PR.mode = PR.mode === 'ai' ? 'ai-edited' : PR.mode; } });
document.addEventListener('change', e => { const t = e.target; if (t && t.dataset && t.dataset.pr === 'pick' && t.closest('#pacard')) { PR.id = t.value; PR.n = null; render(); } });
A.prReset = () => { PR.n = null; PR.msg = ''; render(); };
A.prAi = async () => { const p = cur(), s = stats(p); PR.busy = true; PR.msg = 'Pip is rewording the notes…'; render();
  const raw = await C.aiCall('parent', { grade: p.grade, level: 2, stats: { daysPractised: s.activeDays, questionsAnswered: s.answered, rightFirstTry: s.right, rightAfterHint: s.after, firstTryPercent: s.pct == null ? 'none' : s.pct, streakDays: s.streak, questionsAskedToTutor: s.tut, ...Object.fromEntries(s.skills.slice(0, 4).flatMap(x => [[x.name + ' answers', x.n], [x.name + ' percent', x.pct]])) } });
  PR.busy = false; if (okNarr(raw, s)) { PR.n = { opening: raw.opening.replace(/your child/gi, p.name), celebrate: raw.celebrate.replace(/your child/gi, p.name), practising: raw.practising.replace(/your child/gi, p.name), tryAtHome: raw.tryAtHome, caution: raw.caution }; PR.mode = 'ai'; PR.msg = 'AI notes passed the checks. Read them before you send.'; }
  else PR.msg = raw ? 'The AI notes did not pass the checks (a number or label was not supported), so the rule-based notes were kept.' : 'AI was not available. The rule-based notes were kept.'; render(); };
const pack = () => { const p = cur(), s = stats(p); return { p, s, html: reportHtml(p, s, PR.n, false), text: reportText(p, s, PR.n) }; };
const gate = () => { const p = cur(); if (!validEmail(p.parentEmail)) { PR.msg = 'Enter a valid parent email first.'; render(); const i = $('#pr-mail'); i && i.focus(); return false; } if (!p.parentOK) { PR.msg = 'Tick the box to confirm this parent agreed to receive updates.'; render(); return false; } return true; };
A.prCopy = async () => { const { text } = pack(); try { await navigator.clipboard.writeText(text); PR.msg = 'Copied. Paste it into an email.'; } catch (e) { PR.msg = 'Copy was blocked here. Select the text in the preview and copy it by hand.'; } render(); };
A.prMailto = () => { if (!gate()) return; const { p, text } = pack(); PR.msg = 'Opening your email app with the text version. Graphs are in the HTML download or the Send option.'; render(); location.href = `mailto:${encodeURIComponent(p.parentEmail)}?subject=${encodeURIComponent(p.name + '’s study week')}&body=${encodeURIComponent(text.slice(0, 1800))}`; };
A.prDownload = () => { const { p, html } = pack(); try { const b = new Blob([`<!doctype html><meta charset="utf-8"><title>${esc(p.name)} study week</title><body style="background:#fff">${html}</body>`], { type: 'text/html' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `study-week-${p.name.replace(/\W+/g, '-')}.html`; document.body.appendChild(a); a.click(); a.remove(); PR.msg = 'Report downloaded.'; } catch (e) { PR.msg = 'Download was blocked in this view. Run the app locally to download.'; } render(); };
A.prSend = () => { if (!gate()) return; const { p } = pack();
  G.panel(`<h2>Send this report?</h2><p>To: <b>${esc(p.parentEmail)}</b><br>About: <b>${esc(p.name)}</b> (${esc(range(stats(p)))})</p><p class="small">This sends the report shown in the preview, including your edits. It cannot be unrecalled.</p><div class="row"><button class="btn big" data-a="prSendGo">Yes, send it</button><button class="btn ghost" data-a="gClose">Cancel</button></div>`); };
A.prSendGo = async () => { G.closePanel(); const { p, html, text } = pack(); PR.msg = 'Sending…'; render();
  try { const r = await fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: p.parentEmail, subject: `${p.name}’s study week`, html, text }) }), j = await r.json();
    if (r.ok) { p.parentSent = Date.now(); p.parentLog = [{ at: Date.now(), mode: j.mode, to: p.parentEmail }, ...(p.parentLog || [])].slice(0, 20); C.save(); PR.msg = j.mode === 'dry-run' ? `Saved to ${j.saved} (demo mode, not delivered).` : 'Sent.'; } else PR.msg = j.error || 'The email was not sent.'; }
  catch (e) { PR.msg = 'Could not reach the email server.'; } render(); };
G.parentStats = stats; G.parentOk = okNarr; G.parentNarrate = narrate; G.parentHtml = reportHtml;
});
