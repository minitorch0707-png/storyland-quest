/* Storyland Quest – Pip's practice (teacher-approved item → feedback → retry → fresh same-skill item),
   child-friendly island goals, and the Missing Echo shell-match payoff for early readers. */
window.SQ_PARTS.push((G, C) => {
'use strict';
const { S, $, esc, art, speak, hush, shuffle } = C, A = G.actions, D = G.D;

/* ---------- approved practice ---------- */
const SKILL_WORDS = { inference_causal: ['Find the clue', 'Let’s practise finding why things happen.'] };
const skillText = id => SKILL_WORDS[id] || ['Pip’s practice', 'Let’s practise something Pip picked for you.'];
const mine = p => (S.approved || []).filter(a => a.learnerId === p.id && !((p.practiceDone || {})[a.id])).sort((x, y) => (x.item.difficulty === 'independent') - (y.item.difficulty === 'independent'))[0];
G.practiceCard = p => { const a = mine(p); if (!a) return '';
  const [t, why] = skillText(a.skillId);
  return `<section class="pcard" aria-label="Pip’s practice">${art('pip_think', '🦊', 'pipi')}<div><b>Pip’s practice · ${esc(t)}</b><br><span>${esc(why)}</span></div><button class="btn big" data-a="pipPractice" data-id="${esc(a.id)}">Play Pip’s practice</button></section>`; };
function followUp(p, a) {
  const used = new Set([a.id]); let items = []; try { items = G.destItems(p, G.DEST.mountain, false).items; } catch (e) { items = []; }
  const cause = items.find(i => /cause|infer|why/i.test(String(i.sub || '') + ' ' + String(i.prompt || '')) && !used.has(i.key)) || items.find(i => !used.has(i.key));
  return cause ? { ...cause, skill: a.skillId === 'inference_causal' ? 'reading' : (cause.skill || 'reading'), followup: true } : null;
}
const itemOf = (rec, extra) => { const lv = rec.support && rec.lesson ? rec.support : 'standard', sh = rec.lesson && rec.lesson.supports.short, ids = lv === 'short' && sh ? (rec.item.difficulty === 'independent' ? sh.independentIds : sh.guidedIds) : null;
  const dir = lv === 'short' && sh ? `<small class="pdir">${esc(sh.directions)}</small><br>` : '';
  return { type: 'mc', prompt: dir + esc(rec.item.question), opts: rec.item.options.map(o => ({ id: o.id, text: o.text })), correctId: rec.item.correctId, fbo: rec.item.feedbackByOption, hint: rec.item.hint, key: rec.id, qid: rec.id, skill: rec.skillId, passageSents: ids ? rec.passage.filter(s => ids.includes(s.id)) : rec.passage, cites: rec.item.citations, sub: 'teacher-approved', approvedId: rec.id, ...extra }; };
G.playApproved = (a, back, pick) => {
  const p = C.cur(); if (!a || !p || (a.learnerId && a.learnerId !== p.id)) return;
  const sib = (S.approved || []).find(x => x.id !== a.id && x.learnerId === a.learnerId && x.sourceVersion === a.sourceVersion && x.item.difficulty === 'independent' && a.item.difficulty !== 'independent' && !((p.practiceDone || {})[x.id]));
  const it = itemOf(a), f = sib ? itemOf(sib, { followup: true }) : followUp(p, a), items = f ? [it, f] : [it];
  const ch = pick && a.story ? a.story.choices.find(c => c.id === pick) : null; if (ch) { p.storyPick = { ...(p.storyPick || {}), [a.id]: ch.id }; C.save(); }
  G.startBattle({ dest: 'mountain', enemy: 'ink-baron', items, min: items.length, resolve: items.length * 2, source: 'assign', practice: true, approvedId: a.id, returnTo: back || 'map', title: 'Pip’s practice · ' + skillText(a.skillId)[0] + (ch ? ' · helping ' + ch.name : ''), dedupe: p.id + ':' + a.id });
};
/* optional intro scenes before the battle: story choice, then the worked example. Narration is tap-to-read; Skip always works. */
const sayIt = t => { hush(); speak(String(t).replace(/<[^>]+>/g, '')); };
G.practiceIntro = (a, back) => { const p = C.cur(); if (p.storyPick) delete p.storyPick[a.id];
  const worked = () => { if (!a.lesson) return G.playApproved(a, back, (p.storyPick || {})[a.id]); const w = a.lesson.worked, ids = new Set(w.citations.map(c => c.sentenceId));
    C.view(`${G.hdr()}<main class="echopage"><div class="pip">${art('pip_think', '🦊', 'pipi')}<div class="bubble"><b>Watch first.</b> Pip shows one example.</div></div><div class="ccard wk"><div><h2>${esc(w.question)}</h2><p><b>Answer:</b> ${esc(w.answer)}</p><p>${esc(w.because)}</p>
      <ul class="wkq">${a.passage.filter(s => ids.has(s.id)).map(s => `<li><q>${esc(s.text)}</q></li>`).join('')}</ul></div></div><div class="row"><button class="btn" data-a="pipSay" data-t="${esc(w.question + '. ' + w.answer + '. ' + w.because)}">🔊 Read aloud</button><button class="btn ghost" data-a="pipStop">Stop</button></div>
      <div class="center bigcta"><button class="btn big" data-a="pipGo" data-id="${esc(a.id)}">Start practice</button></div></main>`, false, true); };
  G._pi = { a, back, worked };
  if (!a.story) return worked();
  C.view(`${G.hdr()}<main class="echopage"><div class="pip">${art('pip_cheer', '🦊', 'pipi')}<div class="bubble" role="status">${esc(a.story.intro)}</div></div><div class="row"><button class="btn" data-a="pipSay" data-t="${esc(a.story.intro)}">🔊 Read aloud</button><button class="btn ghost" data-a="pipStop">Stop</button></div>
    <div class="storypick" role="group" aria-label="Who should we help?">${a.story.choices.map(c => `<button class="btn big" data-a="pipPick" data-c="${esc(c.id)}"><b>${esc(c.name)}</b><br><small>${esc(c.line)}</small></button>`).join('')}</div>
    <div class="center"><button class="btn ghost" data-a="pipSkip">Skip story</button></div></main>`, false, true);
};
A.pipSay = d => sayIt(d.t || ''); A.pipStop = () => hush();
A.pipPick = d => { hush(); const pi = G._pi; if (!pi) return; const p = C.cur(); p.storyPick = { ...(p.storyPick || {}), [pi.a.id]: d.c }; C.save(); pi.worked(); };
A.pipSkip = () => { hush(); const pi = G._pi; if (pi) pi.worked(); };
A.pipGo = () => { hush(); const pi = G._pi; if (!pi) return; G.playApproved(pi.a, pi.back, (C.cur().storyPick || {})[pi.a.id]); };
A.pipPractice = d => { const p = C.cur(), a = (S.approved || []).find(x => x.id === d.id); if (!a || a.learnerId !== p.id) return; G.practiceIntro(a, 'map'); };
/* record which answers were independent and which followed help, on the approval and on the learner */
const _claim = G.claim;
G.claim = (p, pd) => { const rc = _claim(p, pd);
  if (!rc.dup && pd.src === 'assign') { const ms = (S.approved || []).filter(x => p.attempts.some(t => t.battleId === pd.id && t.itemId === x.id)), a = ms.find(x => x.item.difficulty !== 'independent') || ms[0]; if (a) {
    const att = p.attempts.filter(t => t.battleId === pd.id), ids = [...new Set(att.map(t => t.itemId))];
    const items = ids.map((id, n) => { const mine2 = att.filter(t => t.itemId === id), first = mine2[0]; return { label: n === 0 ? 'approved question' : 'fresh question', result: first.correct && !first.assisted ? 'independent, correct first try' : mine2.some(t => t.correct) ? 'correct after help (retry)' : 'not yet correct' }; });
    const log = att.map(t => ({ id: t.id, role: t.itemId === a.id ? 'approved question' : 'fresh question', n: t.attempt, selected: t.selectedText || '', correct: !!t.correct, assisted: !!t.assisted || t.attempt > 1 }));
    a.outcomes = [{ learnerId: p.id, at: Date.now(), items, log }, ...(a.outcomes || [])].slice(0, 5); const done = { ...(p.practiceDone || {}) }; ids.forEach(i => { if ((S.approved || []).some(x => x.id === i)) done[i] = Date.now(); }); p.practiceDone = done;
    const pk = a.story && (p.storyPick || {})[a.id], ch = pk && a.story.choices.find(c => c.id === pk); if (ch) rc.lines.push(`<small>📖 ${esc(ch.payoff)}</small>`);
    C.save(); rc.lines.push(`<small>Pip noted: ${esc(items.map(o => o.result).join(' · '))}</small>`); } }
  return rc; };

/* ---------- Missing Echo: shell match ---------- */
const KID_GOAL = { sound: 'Light the shells so the ferry bell can ring.', castle: 'Put the gate’s letters back in order.', jungle: 'Use the words around it to read the sign.', station: 'Put the train notice back together.', orchard: 'Put the harvest steps in order.', mountain: 'Find the clues to the missing page.', cove: 'Write a message the captain can follow.' };
G.kidGoal = id => KID_GOAL[id] || '';
let EC = null;
const speakWord = w => { if (S.settings.voice) speak(w); };
function rounds(p) { const L = p.grade <= 3 ? 1 : 2, all = C.makeItems('phonics', L, 14).filter(i => i.type === 'mc'), rh = all.filter(i => i.sub === 'rhyme'), seen = new Set(), pick = [...rh, ...all].filter(i => !seen.has(i.key) && seen.add(i.key)).slice(0, 4); return pick.map((it, i) => ({ it, mode: i === 0 ? 'model' : i === 1 ? 'supported' : 'independent' })); }
const targetOf = it => (String(it.prompt).match(/<b>([^<]+)<\/b>/) || [, ''])[1];
const plain = s => String(s).replace(/<[^>]+>/g, '');
function echoView() {
  const r = EC.rounds, cur = r[EC.i], lit = EC.lit, done = EC.i >= r.length;
  const shells = r.map((x, k) => `<span class="eshell ${k < lit ? 'lit' : ''}" aria-label="Shell ${k + 1} ${k < lit ? 'lit' : 'dark'}">${k < lit ? '✨' : ''}🐚</span>`).join('');
  if (done) {
    return C.view(`${G.hdr()}<main class="echopage"><div class="pip">${art('pip_cheer', '🦊', 'pipi')}<div class="bubble"><b>All the shells are glowing!</b> Tap the ferry bell.</div></div><div class="eshells">${shells}</div>
      <div class="center bigcta"><button class="btn big bell" data-a="echoBell">🔔 Ring the ferry bell</button></div></main>`, false, true);
  }
  const it = cur.it, target = targetOf(it), model = cur.mode === 'model';
  const ask = plain(it.prompt), line = model ? `Watch me. ${esc(ask)} The glowing shell is the answer.` : cur.mode === 'supported' ? `Your turn with help. ${esc(ask)}` : `Now on your own! ${esc(ask)}`;
  C.view(`${G.hdr()}<main class="echopage"><div class="pip">${art('pip_cheer', '🦊', 'pipi')}<div class="bubble" role="status">${line}</div></div><div class="eshells" aria-label="Shells lit so far">${shells}</div>
    <div class="etarget"><button class="btn big" data-a="echoPlay" aria-label="Play the word ${esc(target)}">🔊 Play “${esc(target)}”</button>${cur.mode === 'supported' ? `<small>Hint: say the word, then say each shell’s word. Listen to the ending.</small>` : ''}</div>
    <div class="eopts" role="group" aria-label="Shells">${it.options.map((t, n) => `<button class="eopt ${model && n === it.answer ? 'glow' : ''}" data-a="echoPick" data-n="${n}" ${model ? 'disabled' : ''}><span>🐚</span><b>${esc(plain(t))}</b></button>`).join('')}</div>
    ${model ? '<div class="center bigcta"><button class="btn big" data-a="echoNext">Got it ▶</button></div>' : ''}<p class="small center" id="emsg" role="status"></p></main>`, false, true);
}
G.echoStart = (spec) => { const p = C.cur(); EC = { rounds: rounds(p), i: 0, lit: 0, tries: 0, spec: spec || {} }; echoView(); };
A.echoPlay = () => { const it = EC.rounds[EC.i].it; speakWord(targetOf(it) || plain(it.prompt)); };
A.echoNext = () => { const c = EC.rounds[EC.i]; if (c.mode === 'model') { EC.lit++; EC.i++; EC.tries = 0; echoView(); } };
A.echoPick = d => { const c = EC.rounds[EC.i]; if (!c || c.mode === 'model') return; const p = C.cur(), ok = +d.n === c.it.answer, att = EC.tries++;
  p.attempts.push({ id: 'echo-' + Date.now() + '-' + p.attempts.length, itemId: 'echo:' + (targetOf(c.it) || plain(c.it.prompt)), skillId: 'phonics', time: Date.now(), attempt: att + 1, correct: ok, assisted: c.mode === 'supported' || att > 0, source: 'shell-match', stem: 'Shell match: ' + (targetOf(c.it) || plain(c.it.prompt)) });
  if (ok) { EC.lit++; EC.i++; EC.tries = 0; C.sfx.ok(); C.save(); echoView(); }
  else { C.sfx.bad(); const m = $('#emsg'); if (m) m.textContent = 'Not that shell. Press play, listen to the end, and try another.'; C.save(); } };
A.echoBell = () => { const p = C.cur(); p.echo = p.echo || {}; const first = !p.echo.done; p.echo.done = true; p.ch = p.ch || {}; p.ch.sound = p.ch.sound || { intro: 0, minions: 0, elite: 0, boss: 0, cleared: 0, replayDay: '' }; p.ch.sound.intro = 1; let rew = '';
  if (first) { p.coins += 15; rew = ' You earned 15 coins (once).'; } C.save(); C.sfx.win(); C.confetti(40);
  const nxt = G.DEST[G.TRAIL ? G.TRAIL[1] : 'castle'];
  C.view(`${G.hdr()}<main class="echopage"><div class="pip">${art('pip_cheer', '🦊', 'pipi')}<div class="bubble"><b>Ding-dong!</b> The ferry can hear its way home.${esc(rew)}</div></div>
    <div class="ferry" aria-hidden="true">⛵</div><div class="ccard"><div class="cart">${art(nxt.mapAssetId.replace(/-/g, '_'), '🏝️', 'ico')}</div><div><h2>Next island</h2><p><b>${esc(nxt.name)}</b></p><p class="small">The ferry is heading there next.</p></div><button class="btn big" data-a="gMap">Continue Adventure</button></div></main>`, false, true); };
/* Sound Island's guided intro is the shell match */
const _start = G.startBattle;
G.startBattle = spec => { if (spec && spec.chapter === 'sound' && spec.stage === 'intro') return G.echoStart(spec); return _start(spec); };
});
