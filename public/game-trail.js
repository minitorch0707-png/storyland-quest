/* Storyland Quest – onboarding quest (pick egg → warm-up → hatch → Sound Island) and the adventure trail map.
   Existing saves keep every island they had; fresh profiles unlock Spell Castle, Word Jungle, ... in order. */
window.SQ_PARTS.push((G, C) => {
'use strict';
const { S, $, esc, art, speak, hush } = C, A = G.actions, D = G.D;
const ORDER = ['sound', 'castle', 'jungle', 'station', 'orchard', 'mountain', 'cove'];
const STAGES = ['intro', 'minions', 'elite', 'boss'], STAGE_T = { intro: 'Guided intro', minions: 'Minions', elite: 'Elite check', boss: 'Boss review' };
G.TRAIL = ORDER;
const chs = (p, id) => (p.ch && p.ch[id]) || {};
const cleared = (p, id) => !!chs(p, id).cleared;

/* ---- quest + legacy state ---- */
const _mig = G.migrate;
G.migrate = p => { _mig(p);
  if (!p.quest) {
    if (p.qa || p.stats.wins > 0 || p.placed || p.zoo.some(z => G.stageOf(z) >= 1)) { p.quest = { step: 'done' }; p.legacyOpen = true; }
    else if (!p.zoo.length) p.quest = { step: 'egg' };
    else p.quest = { step: 'warm', egg: p.zoo[0].iid };
  }
  if (p.qa && !p.demoQuest) { p.quest = { step: 'done' }; p.legacyOpen = true; }
  return p; };
G.questActive = p => !!p.quest && ['warm', 'hatch', 'island'].includes(p.quest.step) && !cleared(p, 'sound');
G.islandOpen = (p, id) => { const i = ORDER.indexOf(id); return i < 0 || p.qa || p.legacyOpen || i === 0 || cleared(p, ORDER[i - 1]); };
const lockWhy = id => { const i = ORDER.indexOf(id); if (i < 1) return 'Open this island from the Demo Controls.'; return `Finish ${G.DEST[ORDER[i - 1]].name} to open ${G.DEST[id].name}.`; };
const nextStage = (p, id) => { const st = chs(p, id); return STAGES.find(s => !st[s === 'boss' ? 'cleared' : s]) || 'done'; };
G.currentIsland = p => ORDER.find(id => G.islandOpen(p, id) && !cleared(p, id)) || ORDER[ORDER.length - 1];

/* ---- 1. pick an egg ---- */
const STARTERS = D.families.filter(f => f.avail === 'starter');
const shortName = f => f.name.replace(/ (Egg)$/, '');
G.eggs = function eggs() {
  C.view(`${G.hdr()}<main class="eggpage"><div class="pip">${art('pip_cheer', '🦊', 'pipi')}<div class="bubble"><b>Pick an egg.</b> Help Pip hatch it, and the pet inside will join your team.</div></div>
    <div class="eggs2">${STARTERS.map(f => `<div class="egg2"><span class="eggart">${G.formImg(f.id + '-egg', 'huge')}</span><b>${esc(shortName(f))}</b><button class="btn big" data-a="gEgg" data-f="${f.id}" aria-label="Pick the ${esc(shortName(f))} egg">Pick this egg</button></div>`).join('')}</div></main>`);
};
A.gEgg = d => { const p = C.cur(); if (p.zoo.length) return G.map(); const inst = G.addInst(p, d.f, { name: G.FAM[d.f].name }); p.pet = d.f; p.petName = inst.name; p.coins += 20; p.quest = { step: 'warm', egg: inst.iid }; C.save(); C.sfx.win(); C.confetti(20); G.warmIntro(); };
G.warmIntro = () => {
  const p = C.cur(), z = G.inst(p, (p.quest || {}).egg) || p.zoo[0]; if (!z) return G.eggs();
  C.view(`${G.hdr()}<main class="eggpage warmintro"><div class="pip">${art('pip_happy', '🦊', 'pipi')}<div class="bubble"><b>Pip’s Warm-Up.</b> Answer a few easy questions with me. Our wins will crack your egg open!</div></div>
    <div class="eggbig">${G.formImg(z.fam + '-egg', 'huge wobble')}<b>${esc(shortName(G.FAM[z.fam]))} Egg</b></div>
    <div class="center bigcta"><button class="btn big" data-a="gWarmGo">Help Pip hatch my egg</button></div></main>`);
};
A.gWarmGo = () => A.gWarm();
const _warm = A.gWarm;
A.gWarm = () => { const p = C.cur(), L = p.grade <= 3 ? 1 : p.grade <= 4 ? 2 : 3, items = C.shuffle(['phonics', 'vocab'].flatMap(s => C.makeItems(s, L, 2)));
  G.startBattle({ dest: 'sound', enemy: 'ink-baron', items, min: 2, resolve: 4, source: 'warmup', placement: true, warmup: true, returnTo: 'map', title: 'Pip’s Warm-Up' }); void _warm; };

/* ---- 3. warm-up reward -> hatch quest step ---- */
const _claim = G.claim;
G.claim = (p, pd) => { const rc = _claim(p, pd); if (!rc.dup && pd.placement && p.quest && p.quest.step === 'warm') { p.quest.step = 'hatch'; C.save(); } return rc; };
G.questGo = () => { const p = C.cur(); if (p.quest) p.quest.step = 'island'; C.save(); };
A.questResume = () => { const p = C.cur(), q = p.quest || {};
  if (q.step === 'warm') return G.warmIntro();
  if (q.step === 'hatch') { if (p.revq && p.revq.length) return G.revealPending(() => G.map()); /* reveal already seen */ q.step = 'island'; C.save(); }
  return A.trailGo({ id: 'sound', s: nextStage(p, 'sound') === 'done' ? 'intro' : nextStage(p, 'sound') }); };
A.trailGo = d => { if (!G.islandOpen(C.cur(), d.id)) return A.trailLock({ id: d.id }); A.gChapter({ id: d.id, s: d.s }); };
A.trailLock = d => G.panel(`<h2>${esc(G.DEST[d.id].name)} is locked</h2><p>${esc(lockWhy(d.id))}</p><div class="row left"><button class="btn big" data-a="gClose">OK</button></div>`);

/* ---- gating: a locked island never opens a battle ---- */
for (const k of ['gDest', 'gBattle', 'gChapter']) { const f = A[k]; A[k] = d => { if (!G.islandOpen(C.cur(), d.id)) return A.trailLock({ id: d.id }); return f(d); }; }

/* ---- 4/5. adventure trail map ---- */
const _map = G.map;
G.map = function map(msg) {
  const p = C.cur(); if (!p) return C.home(); if (!p.zoo.length) return G.eggs();
  if ((p.world || 'language') !== 'language') return _map(msg);
  G.loginCheck && G.loginCheck(p);
  const q = p.quest || { step: 'done' }, quest = G.questActive(p), cur = G.currentIsland(p), cd = G.DEST[cur], i = ORDER.indexOf(cur), nxt = ORDER[i + 1], pend = p.pending ? `<button class="banner" data-a="gChest">🎁 Your chest from the last battle is waiting. Open it!</button>` : '';
  const lead = G.lead(p), egg = G.inst(p, q.egg) || p.zoo[0];
  let card;
  if (quest && q.step !== 'island') {
    card = `<section class="ccard quest" aria-label="Hatch quest"><div class="ceggs">${egg ? G.formImg(egg.fam + '-egg', 'mid wobble') : ''}</div><div><h2>Continue hatch quest</h2><p>${q.step === 'warm' ? 'Help Pip win the warm-up to hatch your egg.' : 'Your egg is ready to hatch!'}</p>
      <p class="small">Next: ${q.step === 'warm' ? 'Pip’s Warm-Up' : 'See your new pet'} · Then: ${esc(G.DEST.sound.name)} opens.</p></div><button class="btn big" data-a="questResume">Continue hatch quest</button></section>`;
  } else {
    const s = nextStage(p, cur), done = s === 'done', unlock = nxt ? `${G.DEST[nxt].name} opens` : 'The Atlas finale opens';
    card = `<section class="ccard" aria-label="Continue Adventure"><div class="cart">${art(cd.mapAssetId.replace(/-/g, '_'), '🏝️', 'ico')}</div><div><h2>Continue Adventure</h2><p><b>${esc(cd.name)}</b></p>
      <p class="goal">${esc(G.kidGoal ? G.kidGoal(cur) : '')}</p><p class="small">Next step: ${done ? 'Replay any step' : STAGE_T[s]} · Completing the chapter unlocks: ${esc(unlock)}.</p></div><button class="btn big" data-a="trailGo" data-id="${cur}" data-s="${done ? 'intro' : s}">${done ? 'Replay' : 'Continue'}</button></section>`;
  }
  const stops = ORDER.map((id, k) => { const d = G.DEST[id], open = G.islandOpen(p, id), done = cleared(p, id), isCur = id === cur && !done && open, st = done ? 'Complete' : isCur ? 'Current' : open ? 'Open' : 'Locked', why = open ? '' : lockWhy(id), n = STAGES.filter(s => chs(p, id)[s === 'boss' ? 'cleared' : s]).length;
    return `<li class="stop ${st.toLowerCase()}"><span class="node" aria-hidden="true">${done ? '✔' : open ? k + 1 : '🔒'}</span><button class="stopb" data-a="${open ? 'gDest' : 'trailLock'}" data-id="${id}" aria-label="${esc(d.name)}. ${st}. ${esc(why)}">${art(d.mapAssetId.replace(/-/g, '_'), '🏝️', 'ico')}<span class="stext2"><b>${esc(d.name)}</b><small>${done ? 'Complete · tap to replay' : open ? (n ? `${n}/4 steps done` : 'Ready to play') : esc(why)}</small></span><span class="schip ${st.toLowerCase()}">${st}</span></button></li>`; }).join('');
  const optional = quest ? '' : `<section class="optional"><h3>Extra activities</h3>${G.pickCard(p)}${G.dailyPanel ? G.dailyPanel(p) : ''}${C.AI().on ? `<button class="mission" data-a="mission">${art('monster_mission', '🧠')}<b>AI Mission</b><small>Built from <u>your</u> answers</small></button>` : ''}</section>`;
  const tabs = `<div class="worlds" role="tablist" aria-label="Subject worlds">${G.WORLDS.map(([id, t, ic]) => `<button role="tab" aria-selected="${id === 'language'}" class="wtab ${id === 'language' ? 'on' : ''}" data-a="gWorld" data-w="${id}">${ic} ${t}</button>`).join('')}</div>`;
  C.view(`${G.hdr()}${pend}<main class="trailpage">${card}${quest ? '' : (G.practiceCard ? G.practiceCard(p) : '')}<ol class="trail" aria-label="Adventure trail">${stops}</ol>${optional}
    <button class="petcard slim" data-a="gLibrary">${lead ? `<span class="petbox">${G.petImg(lead, 'mid')}</span><span><b>${esc(lead.name)}</b><small>${G.STAGE_NAME[G.stageOf(lead)]} ${esc(G.FAM[lead.fam].name)}</small></span>` : '<b>Your egg is waiting</b>'}</button>${tabs}</main>${G.nav('map')}`);
  if (msg) { const b = document.createElement('p'); b.className = 'bubble'; b.setAttribute('role', 'status'); b.innerHTML = msg; const m = $('.trailpage'); if (m) m.prepend(b); }
};
G.actions.gMap = () => G.map();
});
