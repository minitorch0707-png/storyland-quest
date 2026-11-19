/* Storyland Quest – 2D gameplay expansion: 150 merged moves (6 per family), equip slots, unlock sources,
   chapter campaign from chapters.json, boss counterattacks, and the separate Full Inventory QA profile. */
window.SQ_PARTS.push((G, C) => {
'use strict';
const D = G.D, { S, $, esc, art, coin, confetti, pick } = C, A = G.actions;
const M2 = window.SQ_MOVES2 || [], CH = window.SQ_CHAPTERS || { chapters: [], bossCounterattacks: [] };
const KIND = { 'quick-strike': 'strike', 'double-hit': 'double', feint: 'feint', finisher: 'finisher', ward: 'ward', recovery: 'recovery' };
const BASE_RULE = { strike: { kind: 'strike', dmg: 2, cd: 0 }, double: { kind: 'double', dmg: 3 }, feint: { kind: 'feint', dmg: 1 }, finisher: { kind: 'finisher', dmg: 4, once: true }, ward: { kind: 'ward' }, recovery: { kind: 'recovery' } };
const ARCH_ICON = { stream: '🔥', strike: '💫', double: '✌️', feint: '🌀', finisher: '💥', ward: '🛡️', recovery: '💚' };
const hashN = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

/* ---------- merge the catalog ---------- */
G.NEWMOVES = {};
for (const x of M2) {
  const sig = D.moves.find(m => m.family === x.family && !m.support), kind = KIND[x.archetype];
  G.MOVE[x.id] = { id: x.id, name: x.name, family: x.family, color: sig ? sig.color : '#ffd880', effect: x.effect, support: ['ward', 'recovery'].includes(kind), rig: sig ? sig.rig : 'quadruped',
    arche: kind, cd: x.cooldownTurns, unlock: x.unlock, sfxNote: x.sfx, vfxNote: x.vfx, sig: sig ? sig.id : 'pounce' };
  G.NEWMOVES[x.family] = (G.NEWMOVES[x.family] || []).concat(x.id);
}
/* Flame Stream: an extra unlockable Fire Dragon move with a sustained 2D stream (see FX.launch override below) */
G.MOVE['flame-stream'] = { id: 'flame-stream', name: 'Flame Stream', family: 'dragon', color: '#ff8e49', effect: 'Sustained rolling flame, 3 Resolve', support: false, rig: 'quadruped', arche: 'stream', cd: 2, unlock: 'Adult after the first chapter boss clear', sfxNote: 'Rolling whoosh with soft crackle', vfxNote: 'Narrow bright core, widening ribbons, drifting embers', sig: 'ember-pop' };
G.NEWMOVES.dragon = (G.NEWMOVES.dragon || []).concat('flame-stream');
BASE_RULE.stream = { kind: 'strike', dmg: 3 };
const baseFx = G.moveRecipe;
const SHAPES = ['dot', 'star', 'ring', 'leaf', 'snow', 'flame', 'feather', 'bubble', 'dust'];
G.moveRecipe = id => {
  const m = G.MOVE[id]; if (!m || !m.arche) return baseFx(id);
  if (m.arche === 'stream') return { k: 'stream', c: ['#ff7a30', '#ffe08a', '#fff6c8'], sh: 'flame', imp: 'fire', sock: [.86, .4] };
  const sig = baseFx(m.sig || 'pounce'), h = hashN(id), sh = SHAPES[h % SHAPES.length], c = sig.c;
  switch (m.arche) {
    case 'strike': return { ...sig, k: sig.k === 'dash' ? 'orb' : sig.k, sh, big: 1 };
    case 'double': return { ...sig, k: 'volley', sh, big: 1 };
    case 'feint': return { ...sig, k: 'slash', sh, claws: 2 };
    case 'finisher': return { ...sig, k: sig.k === 'rings' ? 'arc' : 'rings', sh: 'star', big: 1.7, c: [c[0], '#ffffff', c[c.length - 1]] };
    case 'recovery': return { k: 'shield', c: ['#8dff9a', '#e6ffe9', '#3fd36a'], sh: 'leaf', imp: 'leaf' };
    default: return { k: 'shield', c: [c[0], '#ffffff', c[1] || c[0]], sh: 'ring', imp: sig.imp };
  }
};
const _icon = G.moveIcon; G.moveIcon = id => { const m = G.MOVE[id]; return m && m.arche ? ARCH_ICON[m.arche] : _icon(id); };
if (G.cueMap) for (const x of M2) { const m = G.MOVE[x.id], base = m.arche === 'ward' ? 'guard' : m.arche === 'recovery' ? 'story-spark' : (m.sig && m.sig !== 'pounce' ? m.sig : 'pounce'); G.cueMap[x.id] = [null, base + '-cast', base + '-impact']; }
if (G.cueMap) G.cueMap['flame-stream'] = ['ember-windup', 'ember-release', 'ember-impact'];

/* ---------- unlock sources ---------- */
const attemptsDistinct = p => new Set((p.attempts || []).filter(a => a.attempt === 1 && !a.assisted && a.correct).map(a => a.itemId)).size;
G.v3 = p => (p.v3 = p.v3 || { mastery: 0 });
G.indep = p => attemptsDistinct(p);
const chDone = (p, key) => Object.values(p.ch || {}).filter(c => c[key]).length;
const NEED = s => /^Baby/.test(s) ? 1 : /^Juvenile/.test(s) ? 2 : 3;
G.moveUnlock = (p, z, id) => {
  const m = G.MOVE[id], f = G.FAM[z.fam];
  if (!m.arche) { const need = id === f.unlocks.baby ? 1 : id === f.unlocks.juvenile ? 2 : 3; return { ok: p.qa || G.stageOf(z) >= need, why: `Unlocks when this companion becomes a ${G.STAGE_NAME[need]}` }; }
  const u = m.unlock, st = G.stageOf(z), needSt = NEED(u); let prog = '', ok = false;
  if (/first battle win/.test(u)) { ok = p.stats.wins >= 1; prog = `${Math.min(1, p.stats.wins)}/1 wins`; }
  else if (/first chapter intro/.test(u)) { const n = chDone(p, 'intro'); ok = n >= 1; prog = `${Math.min(1, n)}/1 intros`; }
  else if (/three different independent/.test(u)) { const n = attemptsDistinct(p); ok = n >= 3; prog = `${Math.min(3, n)}/3 answers`; }
  else if (/elite/.test(u)) { const n = chDone(p, 'elite'); ok = n >= 1; prog = `${Math.min(1, n)}/1 elites`; }
  else if (/boss clear/.test(u)) { const n = chDone(p, 'cleared'); ok = n >= 1; prog = `${Math.min(1, n)}/1 bosses`; }
  else if (/mastery check/.test(u)) { ok = G.v3(p).mastery >= 1; prog = `${Math.min(1, G.v3(p).mastery)}/1 mastery checks`; }
  if (p.qa) return { ok: true, why: u };
  return { ok: ok && st >= needSt, why: `${u}${st < needSt ? ` (needs ${G.STAGE_NAME[needSt]} form; this one is ${G.STAGE_NAME[st]})` : ''}`, prog };
};
G.knownMoves = (p, z) => { const f = G.FAM[z.fam], base = [f.unlocks.baby, f.unlocks.juvenile, f.unlocks.adult].filter(id => G.moveUnlock(p, z, id).ok), more = (G.NEWMOVES[z.fam] || []).filter(id => G.moveUnlock(p, z, id).ok); return base.concat(more); };
G.equipOf = (p, z) => { const known = G.knownMoves(p, z), starter = G.FAM[z.fam].unlocks.baby; let eq = ((p.equip || {})[z.iid] || known.slice(0, 3)).filter(id => known.includes(id));
  if (!eq.includes(starter) && known.includes(starter)) eq.unshift(starter); if (!eq.length) eq = [starter]; return [...new Set(eq)].slice(0, 4); };
G.movesOf = z => G.equipOf(C.cur(), z);
G.rulesFor = team => { const out = {}; for (const t of team) for (const id of t.moveIds) { const m = G.MOVE[id]; if (!m) continue;
  out[id] = m.arche ? { ...BASE_RULE[m.arche], cd: m.cd || 0 } : (m.support ? { kind: 'guard', cd: 0 } : { kind: 'strike', dmg: 2, cd: 0 }); } return out; };
A.gEquip = d => { const p = C.cur(), z = G.inst(p, d.id); p.equip = p.equip || {}; let eq = G.equipOf(p, z); const starter = G.FAM[z.fam].unlocks.baby;
  if (eq.includes(d.m)) { if (d.m === starter) return; eq = eq.filter(x => x !== d.m); } else { if (!G.knownMoves(p, z).includes(d.m)) return; if (eq.length >= 4) return G.toast ? G.toast('Four moves is the limit. Take one off first.') : 0; eq.push(d.m); }
  p.equip[z.iid] = eq; C.save(); C.sfx.tap(); G.library('moves'); };

/* ---------- boss counterattacks ---------- */
G.counterOf = en => (CH.bossCounterattacks || []).find(b => en.name.replace(/^The /, '') === b.boss) || { move: en.telegraph || 'Counterattack', baseDamage: 2 };

/* ---------- chapters ---------- */
const STAGES = ['intro', 'minions', 'elite', 'boss'], STAGE_T = { intro: 'Guided intro', minions: 'Minions', elite: 'Elite check', boss: 'Boss review' };
G.chapter = id => (CH.chapters || []).find(c => c.id === id);
const chState = (p, id) => { p.ch = p.ch || {}; return (p.ch[id] = p.ch[id] || { intro: 0, minions: 0, elite: 0, boss: 0, cleared: 0, replayDay: '' }); };
const nextStage = st => STAGES.find(s => !st[s === 'boss' ? 'cleared' : s]) || 'done';
function chapterBattle(id, stage) {
  const p = C.cur(), de = G.DEST[id], c = G.chapter(id), beat = c.beats.find(b => b.kind === stage), L = p.skills[de.skill] ? C.lvl(p.skills[de.skill].m) : 2;
  let pool = G.destItems(p, de, false).items;
  if (stage === 'boss') { const other = D.destinations.filter(x => x.subject === 'language' && x.id !== id && G.destPlayable(x) && x.skill).slice(0, 1)[0];
    const mix = other ? G.destItems(p, other, false).items.slice(0, 1).map(it => ({ ...it, mixed: true })) : []; pool = pool.slice(0, 4).concat(mix); }
  const n = stage === 'intro' ? 1 : stage === 'minions' ? 2 : stage === 'elite' ? 2 : 3, items = pool.slice(0, stage === 'boss' ? 5 : Math.max(n + 1, 3)); void L;
  const MON = { sound: 'phonics', castle: 'spelling', jungle: 'vocab', station: 'grammar', orchard: 'sequence', mountain: 'reading', cove: 'writing' }[id], minion = c.beats.find(x => x.kind === 'minions');
  G.startBattle({ dest: id, enemy: de.proposedBossId, sprite: stage !== 'boss' && MON ? 'monster_' + MON : '', spriteCls: stage === 'elite' ? 'elite' : '', enemyName: stage === 'boss' ? undefined : stage === 'intro' ? 'Practice ' + ((minion && minion.enemy) || 'Sprite').replace(/s$/, '') : beat.enemy, items, min: Math.min(n, items.length), resolve: Math.min(n, items.length) * 2, source: 'chapter', chapter: id, stage, guided: stage === 'intro', boss: stage === 'boss',
    tellFirst: stage === 'elite', returnTo: 'map', title: `${c.title} · ${STAGE_T[stage]}`, again: () => chapterBattle(id, stage) });
}
A.gChapter = d => { G.closePanel(); chapterBattle(d.id, d.s); };
const chapterPanel = (p, de) => {
  const c = G.chapter(de.id); if (!c) return ''; const st = chState(p, de.id), soon = c.contentStatus === 'review-required' && !G.destPlayable(de), nxt = nextStage(st);
  const rows = STAGES.map((s, i) => { const b = c.beats.find(x => x.kind === s), done = !!st[s === 'boss' ? 'cleared' : s], open = !soon && (done || s === nxt || (st.cleared && s === 'boss'));
    return `<li class="chs ${done ? 'done' : open ? 'now' : 'wait'}"><span class="chn">${done ? '✔' : i + 1}</span><span><b>${STAGE_T[s]}</b>${b.enemy ? ` · ${esc(b.enemy)}` : ''}<small>${esc(b.goal)}</small></span>${open && !(done && s !== 'boss') ? `<button class="btn ${s === 'boss' ? 'gold' : ''} sm" data-a="gChapter" data-id="${de.id}" data-s="${s}">${done ? 'Replay' : 'Play'}</button>` : ''}</li>`; }).join('');
  const done = STAGES.filter(s => st[s === 'boss' ? 'cleared' : s]).length;
  return `<div class="chapter"><h3>Chapter: ${esc(c.title)}</h3><p class="small"><b>Skill:</b> ${esc(c.skill)} · <b>Progress:</b> ${done}/4 · ${soon ? '<b>Coming soon.</b> This topic opens after its questions are reviewed.' : st.cleared ? 'Atlas page recovered ✔ (replay for 20 coins once a day)' : `First clear: ${c.firstClear.coins} coins + ${esc(c.firstClear.award)}`}</p>
    <ol class="chlist" aria-label="Chapter steps">${rows}</ol></div>`;
};
const _dest = A.gDest;
A.gDest = d => { _dest(d); const p = C.cur(), de = G.DEST[d.id], box = document.querySelector('.panel .row.left, #panel .row.left'); void box;
  const h = chapterPanel(p, de), root = document.querySelector('.pstage'); if (!h || !root) return; const wrap = document.createElement('div'); wrap.innerHTML = h; const after = root.parentElement.querySelector('h2'); const sm = root.parentElement.querySelector('.small'); (sm || after).after(wrap.firstChild);
  const adv = root.parentElement.querySelector('[data-src="island"]:not([data-boss])'); if (adv) adv.textContent = 'Free practice battle'; };

/* ---------- claim hook: chapter progress, first clear, move unlock lines ---------- */
const _claim = G.claim;
G.claim = (p, pd) => {
  const before = new Map(p.zoo.map(z => [z.iid, new Set(G.knownMoves(p, z))]));
  const dup = p.receipts.some(r => r.id === pd.id);
  const rc = _claim(p, pd);
  if (!dup && !rc.dup) {
    if (pd.chapter && G.chapter(pd.chapter)) { const c = G.chapter(pd.chapter), st = chState(p, pd.chapter), k = pd.stage === 'boss' ? 'cleared' : pd.stage;
      if (pd.stage === 'boss') { if (!st.cleared) { st.cleared = 1; st.boss = 1; p.coins += c.firstClear.coins; p.atlas = p.atlas || []; if (!p.atlas.includes(pd.chapter)) p.atlas.push(pd.chapter);
          rc.lines.push(`${coin()} First clear: <b>+${c.firstClear.coins} coins</b>`, `📜 Atlas page recovered: <b>${esc(c.title)}</b>`); { const own = G.stkOwned(p), s = G.STK.find(x => x.set === pd.chapter && !own.has(x.id)); if (s) G.giveSticker(p, s.id, rc.lines); else G.giveSticker(p, 'c:atlas', rc.lines); } if (pd.firsts >= 3) G.v3(p).mastery = Math.max(1, G.v3(p).mastery); }
        else if (st.replayDay !== C.today()) { st.replayDay = C.today(); p.coins += 20; rc.lines.push(`${coin()} Replay bonus: <b>+20 coins</b>`); } }
      else st[k] = 1; }
    for (const z of p.zoo) { const was = before.get(z.iid) || new Set(); for (const id of G.knownMoves(p, z)) if (!was.has(id)) rc.lines.push(`✨ <b>${esc(z.name)}</b> learned a new move: <b>${esc(G.MOVE[id].name)}</b>`); }
    C.save(); }
  return rc;
};
const _mig = G.migrate; G.migrate = p => { _mig(p); p.ch = p.ch || {}; p.equip = p.equip || {}; p.atlas = p.atlas || []; G.v3(p); return p; };

/* ---------- Full Inventory QA profile (separate, resettable, outside ordinary player access) ---------- */
const qaMake = () => {
  const p = C.newProfile('Full Inventory QA', '🧪', 4); p.id = 'qa-full-inventory'; p.qa = true; p.demo = false; p.placed = true; p.avDone = true; G.migrate(p);
  p.coins = 100000; p.tickets = 25; p.bag = { clue: 99, look: 99, bubble: 99, double: 99 }; p.zoo = []; p.team = [];
  D.families.forEach(f => { const z = G.addInst(p, f.id, { name: f.name, xp: 500 }); z.iid = 'qa_' + f.id; });
  p.team = ['qa_dragon', 'qa_cat', 'qa_bird'].filter(id => p.zoo.some(z => z.iid === id)); if (p.team.length < 3) p.team = p.zoo.slice(0, 3).map(z => z.iid);
  p.pet = 'dragon'; p.seen = Object.fromEntries(D.families.map(f => [f.id, true]));
  p.cosOwned = D.cosmetics.map(c => c.id); p.gear = { owned: D.avatar.gear.map(g => g.id), on: {} };
  p.room = { items: [{ id: 'scholar-desk', x: .2, y: .72 }, { id: 'star-bed', x: .78, y: .74 }], owned: D.props.map(x => x.id), accent: 0, theme: 'lodge', pets: [] };
  p.stats = { wins: 12, bossWins: 6, byDest: Object.fromEntries(D.destinations.map(d => [d.id, { wins: 3 }])), correctSkill: {}, dailyClaims: 0 };
  p.ch = {}; p.v3 = { mastery: 1 }; p.equip = {}; D.destinations.forEach(d => { if (G.chapter(d.id)) chState(p, d.id); });
  p.zoo.forEach(z => { const f = G.FAM[z.fam], nm = G.NEWMOVES[z.fam] || [], by = k => nm.find(id => G.MOVE[id].arche === k); p.equip[z.iid] = [f.unlocks.baby, f.unlocks.juvenile, by('ward'), by('finisher')].filter(Boolean); });
  p.stk2 = []; p.note = 'Seeded for QA. Deterministic start: 100,000 coins, every item, companion and move.';
  return p;
};
const qaEnter = fresh => { if (fresh || !S.qa) S.qa = qaMake(); S.qaOn = true; S.qaPrev = S.qaPrev || S.current || null; S.current = 'qa'; C.save(); };
G.qaClearOwned = () => { const p = S.qa; if (!p) return; p.room = { items: [], owned: [], accent: 0, theme: 'lodge', pets: [] }; p.gear = { owned: [], on: {} }; p.cosOwned = []; p.bag = { clue: 0, look: 0, bubble: 0, double: 0 }; p.tickets = 0; p.coins = 100000; p.equip = {}; C.save(); };
let QAFAM = 'dragon';
G.qaScreen = () => {
  const on = !!S.qaOn, p = S.qa;
  C.view(`<div class="card qa"><h1>🧪 QA Adventurer <span class="qabadge">QA · synthetic test data</span></h1><p>A separate, permanent test profile (stable ID). It never touches real player saves, is not listed in the player chooser and is kept out of classroom reporting.</p>
    ${p ? `<p class="small">Coins ${p.coins.toLocaleString()} · Tickets ${p.tickets} · Furniture ${p.room.owned.length}/${D.props.length} · Companions ${p.zoo.length} · Gear ${p.gear.owned.length}</p>` : '<p class="small">No QA profile has been created yet.</p>'}
    <div class="row left"><button class="btn big" data-a="qaPlay">${p ? 'Play as QA Adventurer' : 'Create and play'}</button><button class="btn" data-a="qaReset">Reset to full inventory</button><button class="btn ghost" data-a="qaDash">⬅ Return to dashboard</button><button class="btn" data-a="tourMenu">▶ Automated run-through</button></div>
    <h3>Test presets</h3><div class="row left"><button class="btn sm" data-a="qaClear" ${p ? '' : 'disabled'}>Clean purchase save</button><button class="btn sm" data-a="qaPre" data-k="egg" ${p ? '' : 'disabled'}>Hatchable egg</button><button class="btn sm" data-a="qaPre" data-k="evo" ${p ? '' : 'disabled'}>Pets just below each evolution</button><button class="btn sm" data-a="qaPre" data-k="ember" ${p ? '' : 'disabled'}>Fire Dragon with Ember Pop equipped</button></div>
    <h3>Preview a reveal (saves nothing)</h3><div class="row left"><label>Family <select class="inp sel" id="qafam">${D.families.map(f => `<option value="${f.id}" ${QAFAM === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select></label>
      ${[['hatch', 'Hatch'], ['level-up', 'Level up'], ['evolve-1', 'Baby → Juvenile'], ['evolve-2', 'Juvenile → Adult']].map(([k, t]) => `<button class="btn sm ghost" data-a="qaPrev" data-k="${k}">${t}</button>`).join('')}</div>
    <p class="small">QA mode: ${on ? 'on' : 'off'}. Leaving restores the normal chooser.</p><div class="row left"><button class="btn ghost" data-a="qaExit">Leave QA mode</button></div></div>`);
};
document.addEventListener('change', e => { if (e.target && e.target.id === 'qafam') QAFAM = e.target.value; });
A.qaPrev = d => { const sel = $('#qafam'); if (sel) QAFAM = sel.value; G.revealPreview(QAFAM, d.k); };
A.qaPre = d => { const p = S.qa; if (!p) return; const fam = QAFAM; const drop = id => { p.zoo = p.zoo.filter(z => z.iid !== id); p.team = p.team.filter(x => x !== id); };
  if (d.k === 'egg') { drop('qa_egg'); const z = G.addInst(p, fam, { xp: 8, name: G.FAM[fam].name }); z.iid = 'qa_egg'; }
  if (d.k === 'evo') { ['qa_below1', 'qa_below2'].forEach(drop); const a = G.addInst(p, fam, { xp: 118, name: G.FAM[fam].name + ' (almost Juvenile)' }); a.iid = 'qa_below1'; const b = G.addInst(p, fam, { xp: 348, name: G.FAM[fam].name + ' (almost Adult)' }); b.iid = 'qa_below2'; p.team = ['qa_below1', 'qa_below2', ...p.team.filter(x => !x.startsWith('qa_below'))].slice(0, 3); }
  if (d.k === 'ember') { const z = p.zoo.find(x => x.iid === 'qa_dragon'); p.equip = p.equip || {}; p.equip[z.iid] = ['pounce', 'ember-pop', 'flame-stream', (G.NEWMOVES.dragon || []).find(id => G.MOVE[id].arche === 'ward'), (G.NEWMOVES.dragon || []).find(id => G.MOVE[id].arche === 'finisher')].filter(Boolean); p.team = ['qa_dragon', ...p.team.filter(x => x !== 'qa_dragon')].slice(0, 3); }
  C.save(); G.qaScreen(); const b2 = $('.qa .small'); if (b2) b2.textContent = 'Preset applied: ' + d.k + '. ' + b2.textContent; };
A.qaDash = () => { S.qaOn = false; S.current = null; C.save(); location.hash = ''; C.dash(); };
A.qaOpen = () => { qaEnter(false); G.map(); };
const _hdr = G.hdr; G.hdr = (...a) => { const h = _hdr(...a); return S.qaOn ? h.replace('</header>', '<span class="qabadge">QA</span><button class="chip" data-a="qaDash">⬅ Dashboard</button></header>') : h; };
A.qaPlay = () => { qaEnter(false); G.map(); };
A.qaReset = () => { qaEnter(true); G.qaScreen(); };
A.qaClear = () => { if (!S.qa) return; G.qaClearOwned(); G.qaScreen(); };
A.qaExit = () => { S.qaOn = false; S.current = null; S.qaPrev = null; C.save(); location.hash = ''; location.reload(); };
G.qaCheck = () => { if (location.hash === '#qa') G.qaScreen(); };
window.addEventListener('hashchange', G.qaCheck);

/* sustained stream renderer: runs ~420 ms from the muzzle anchor to the actual target, then tapers off */
const FXE = G.fx, _launch = FXE.launch;
FXE.launch = (id, srcEl, dstEl, dur) => {
  const r = G.moveRecipe(id); if (r.k !== 'stream') return _launch(id, srcEl, dstEl, dur);
  const a = FXE.box(srcEl, r.sock[0], r.sock[1]), b = FXE.box(dstEl, .45, .5), len = Math.hypot(b.x - a.x, b.y - a.y), dx = (b.x - a.x) / len, dy = (b.y - a.y) / len, t0 = performance.now(), TOT = 420, arena = FXE.arena;
  FXE.stamp && FXE.stamp('launch', { move: id, ax: Math.round(a.x), ay: Math.round(a.y), bx: Math.round(b.x), by: Math.round(b.y) });
  const rnd = (x, y) => x + Math.random() * (y - x), sp = len / .3;
  const iv = setInterval(() => { const u = (performance.now() - t0) / TOT; if (u >= 1 || !FXE.cv || FXE.arena !== arena) { clearInterval(iv); return; } const dens = u < .8 ? 1 : Math.max(.15, (1 - u) / .2);
    for (let i = 0; i < Math.round(3 * dens); i++) { const side = rnd(-1, 1), spread = rnd(.05, .32);
      FXE.add({ x: a.x, y: a.y, vx: (dx + -dy * side * spread) * sp * rnd(.8, 1.15), vy: (dy + dx * side * spread) * sp * rnd(.8, 1.15), ay: -40, life: rnd(.22, .4), size: rnd(5, 9) * (1.1 - u * .3), size1: rnd(12, 22), color: r.c[Math.floor(rnd(0, 2))], shape: 'flame', a0: .5 }); }
    FXE.add({ x: a.x, y: a.y, vx: dx * sp * 1.1, vy: dy * sp * 1.1, life: .22, size: rnd(3, 5), size1: 1, color: r.c[1], shape: 'dot', a0: .8 });
    if (Math.random() < .35 * dens) FXE.add({ x: a.x + dx * len * rnd(.2, .8), y: a.y + dy * len * rnd(.2, .8), vx: rnd(-30, 30), vy: rnd(-90, -30), life: rnd(.5, .9), size: rnd(3, 5), size1: 0, color: '#ffd27a', shape: 'dot' }); }, 16);
  FXE.add({ x: a.x, y: a.y, life: .2, size: 8, size1: 28, color: r.c[1], a0: .6 });
};
});
