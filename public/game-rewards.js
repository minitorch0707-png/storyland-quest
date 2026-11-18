/* Storyland Quest – rewards: chest claims with persistent receipts, stickers, recruit quests, Daily Battles,
   daily login rewards and the earned-coin prize wheel. Every grant is keyed by a receipt ID so it happens once. */
window.SQ_PARTS.push((G, C) => {
'use strict';
const D = G.D;
const { S, $, esc, art, coin, pick, shuffle, today, sfx, confetti, calm } = C;
const A = G.actions, CHEST = Object.fromEntries(D.chests.map(c => [c.id, c]));

/* ---------- stickers (earned by rules, usable on the profile banner and the room board) ---------- */
const EMO = { sound: ['🎵', '🐚', '🏝️'], castle: ['🏰', '🧩', '🗝️'], jungle: ['🌴', '🦜', '🐒'], station: ['🚂', '🎫', '🔔'], mountain: ['⛰️', '📖', '🦅'], cove: ['✏️', '🐚', '⚓'] };
G.STK = []; const KINDS = [['first', 'Win a battle here for the first time'], ['three', 'Get three different questions right here'], ['daily', 'Win a Daily Battle here']];
for (const d of D.destinations.filter(x => x.subject === 'language')) {
  const ex = D.stickerExamples.filter(s => s.set === 'Orchard');
  KINDS.forEach(([kind, earn], i) => {
    if (d.id === 'orchard') { const e = ex[i]; G.STK.push({ id: e.id, set: d.id, setName: d.name, name: e.id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), kind, earn, img: 'st_' + e.id.replace(/-/g, '_') }); }
    else G.STK.push({ id: d.id + '-' + 'abc'[i], set: d.id, setName: d.name, name: `${d.name} sticker ${i + 1}`, kind, earn, emoji: EMO[d.id][i] });
  });
}
G.STKBY = Object.fromEntries(G.STK.map(s => [s.id, s]));
G.stkOwned = p => new Set([...p.stk2, ...(p.stickers || []).map(e => 'c:' + e)]);
G.stkHtml = (id, cls = '') => { const s = G.STKBY[id]; if (s) return s.img ? art(s.img, '⭐', 'stk ' + cls) : `<span class="art stk ${cls}" aria-hidden="true">${s.emoji}</span>`; return `<span class="art stk ${cls}" aria-hidden="true">${esc(String(id).replace('c:', ''))}</span>`; };
G.stkName = id => G.STKBY[id] ? G.STKBY[id].name : 'Classic sticker';
G.setDone = (p, set) => { const own = G.stkOwned(p); return G.STK.filter(s => s.set === set).every(s => own.has(s.id)); };
function earnStickers(p, pd, lines) {
  const own = G.stkOwned(p), got = [];
  for (const s of G.STK) { if (own.has(s.id) || s.set !== pd.dest) continue; const dest = G.DEST[s.set];
    const ok = s.kind === 'first' ? (p.stats.byDest[s.set] || {}).wins === 1 : s.kind === 'three' ? ((p.stats.correctSkill[dest.skill] || []).length >= 3) : (pd.src === 'daily');
    if (ok) { p.stk2.push(s.id); got.push(s.id); lines.push(`${G.stkHtml(s.id, 'sm')} New sticker: <b>${esc(s.name)}</b>`); } }
  return got;
}
G.giveSticker = (p, id, lines) => { if (G.stkOwned(p).has(id)) { p.coins += 5; lines.push('Duplicate sticker turned into <b>5 coins</b>'); return false; } p.stk2.push(id); lines.push(`${G.stkHtml(id, 'sm')} New sticker: <b>${esc(G.stkName(id))}</b>`); return true; };

/* ---------- recruitment ---------- */
G.QUESTS = [
  { id: 'q1', fam: 'comet-moth', label: 'Win your first battle', test: p => p.stats.wins >= 1, prog: p => `${Math.min(1, p.stats.wins)}/1` },
  { id: 'q2', fam: 'mossback', label: 'Win 3 battles', test: p => p.stats.wins >= 3, prog: p => `${Math.min(3, p.stats.wins)}/3` },
  { id: 'q3', fam: 'prism-ram', label: 'Collect 3 stickers', test: p => G.stkOwned(p).size >= 3, prog: p => `${Math.min(3, G.stkOwned(p).size)}/3` },
  { id: 'q4', fam: 'lanternfly', label: 'Claim one Daily Battle reward', test: p => p.stats.dailyClaims >= 1, prog: p => `${Math.min(1, p.stats.dailyClaims)}/1` }];
G.BOSSFAM = { 'ink-baron': 'bookback', 'baroness-vesper': 'moonbat', 'clockwork-regent': 'snowhare', 'thorn-marshal': 'coralotl' };
G.HATCHERY = D.families.filter(f => f.avail === 'hatchery'); G.HATCH_COST = 250;
function recruitCheck(p, lines, evs) {
  for (const q of G.QUESTS) if (!p.recruited[q.id] && q.test(p)) { p.recruited[q.id] = true; const z = G.addInst(p, q.fam); lines.push(`${G.petImg(z, 'tiny')} Quest complete: <b>${esc(q.label)}</b>. A <b>${esc(G.FAM[q.fam].name)} Egg</b> joined you!`); evs.push({ new: z }); }
}
G.recruitCheck = recruitCheck;

/* ---------- the chest claim ---------- */
G.claim = function claim(p, pd) {
  const done = p.receipts.find(r => r.id === pd.id); if (done) { if (p.pending && p.pending.id === pd.id) { p.pending = null; C.save(); } return { ...done, dup: true }; }
  const def = CHEST['chest-' + pd.chest] || CHEST['chest-standard'], lines = [], evs = [], de = G.DEST[pd.dest];
  const rc = { id: pd.id, at: Date.now(), chest: pd.chest, dest: pd.dest, title: pd.title, coins: 0, tickets: 0, xp: 0, lines, evolve: [] };
  let coins = def.coins, dup = false;
  if (pd.dedupe) { p.dedupe = p.dedupe || {}; if (p.dedupe[pd.dedupe] === today()) { coins = 0; dup = true; lines.push('You already collected this practice reward today.'); } else p.dedupe[pd.dedupe] = today(); }
  if (coins && p.pow.magnet > 0) { coins *= 2; p.pow.magnet--; lines.push('🧲 Coin Magnet doubled your coins!'); }
  p.coins += coins; rc.coins = coins; if (coins) lines.unshift(`${coin()} <b>+${coins} coins</b>`);
  if (def.spinTickets && !dup) { p.tickets += def.spinTickets; rc.tickets = def.spinTickets; lines.push(`${G.ticket()} <b>+${def.spinTickets} spin ticket</b>`); }
  if (def.cosmeticPool && !dup) { const pool = D.cosmetics.filter(c => c.unlock === 'boss' && !p.cosOwned.includes(c.id)); if (pool.length) { const c = pick(pool); p.cosOwned.push(c.id); rc.cos = c.id; lines.push(`<img class="art cosi" src="assets/cos_${c.base}.png" style="filter:hue-rotate(${c.hue}deg)" alt=""> New pet item: <b>${esc(c.name)}</b>`); } else { p.coins += 15; lines.push('You own every boss item! <b>+15 coins</b> instead.'); } }
  /* progress that happens once per receipt */
  const first = pd.firsts || 0, xp = 10 + 2 * first + (pd.boss ? 10 : 0); p.xp += xp; rc.xp = xp; const subj = de.subject; p.sx[subj] = (p.sx[subj] || 0) + xp; lines.push(`⭐ <b>+${xp} XP</b> in ${esc(G.SUBJ_LABEL[subj])}`);
  p.stats.wins++; const bd = p.stats.byDest[pd.dest] = p.stats.byDest[pd.dest] || { wins: 0 }; bd.wins++; if (pd.boss) p.stats.bossWins++; p.quests++;
  for (const iid of pd.team || []) { const z = G.inst(p, iid); if (z) { const ev = G.gainXp(p, z, 12 + first); if (ev.evolved || ev.hatched) evs.push(ev); } }
  for (const z of p.zoo) { if (G.stageOf(z) === 0 && !(pd.team || []).includes(z.iid)) { const ev = G.gainXp(p, z, pd.placement ? 10 : 6); if (ev.hatched) evs.push(ev); } }
  for (const ev of evs) { if (ev.hatched) lines.push(`🐣 ${G.petImg(ev.inst, 'tiny')} <b>${esc(ev.inst.name)} hatched!</b>`); else if (ev.evolved) lines.push(`✨ ${G.petImg(ev.inst, 'tiny')} <b>${esc(ev.inst.name)} grew into a ${G.STAGE_NAME[ev.after]}!</b>`); }
  rc.evolve = evs.filter(e => e.hatched || e.evolved).map(e => ({ hatched: e.hatched }));
  if (pd.boss && G.BOSSFAM[pd.enemy] && !p.recruited['b:' + pd.enemy]) { p.recruited['b:' + pd.enemy] = true; const z = G.addInst(p, G.BOSSFAM[pd.enemy]); lines.push(`${G.petImg(z, 'tiny')} <b>${esc(G.ENEMY[pd.enemy].name)}</b> befriended you and left a <b>${esc(G.FAM[z.fam].name)} Egg</b>!`); evs.push({ new: z }); rc.evolve.push({ hatched: false }); }
  if (pd.placement) p.placed = true;
  earnStickers(p, pd, lines); recruitCheck(p, lines, evs);
  if (G.dailyEvent) G.dailyEvent(p, 'win', { dest: pd.dest, src: pd.src });
  const pk = p.pick; if (pk && pk.day === today() && pk.dest === pd.dest && !pk.claimed && ['island', 'pick'].includes(pd.src) && !dup) { pk.claimed = true; p.coins += D.pipPick.bonusCoins; rc.pick = D.pipPick.bonusCoins; lines.push(`🦊 <b>Pip’s Pick bonus: +${D.pipPick.bonusCoins} coins</b>`); }
  if (p.zoo.some(z => G.stageOf(z) > 0) && p.team.length === 0) { const z = p.zoo.find(x => G.stageOf(x) > 0); p.team.push(z.iid); }
  p.receipts.unshift(rc); if (p.receipts.length > 60) p.receipts.length = 60; p.pending = null; C.save(); return rc;
};

/* ---------- Daily Battles ---------- */
const roll = p => { if (p.dly.day !== today()) p.dly = { day: today(), prog: { room: 0 }, claimed: {}, wins: [], uniq: [] }; return p.dly; };
G.dailyEvent = (p, kind, v) => { const d = roll(p); if (kind === 'uniq' && !d.uniq.includes(v)) d.uniq.push(v); if (kind === 'win') { if (v.src === 'room') d.prog.room++; if (!d.wins.includes(v.dest)) d.wins.push(v.dest); } C.save(); };
G.dailyTasks = p => { const d = roll(p); return D.daily.map(t => { const n = t.id === 'daily-room' ? d.prog.room : t.id === 'daily-three' ? d.uniq.length : d.wins.length; return { ...t, n: Math.min(n, t.goal), done: n >= t.goal, claimed: !!d.claimed[t.id] }; }); };
G.dailyPanel = p => `<section class="dailyp" aria-label="Daily Battles"><h3>Daily Battles</h3><ul>${G.dailyTasks(p).map(t => `<li class="${t.done ? 'done' : ''}"><span>${esc(t.label)} <b>${t.n}/${t.goal}</b></span>${t.claimed ? '<em>Claimed</em>' : t.done ? `<button class="btn sm" data-a="gDailyClaim" data-id="${t.id}">Claim</button>` : ''}</li>`).join('')}</ul>
  <button class="btn ghost sm" data-a="gDaily">Play today’s Daily Battle</button></section>`;
A.gDailyClaim = d => {
  const p = C.cur(), t = G.dailyTasks(p).find(x => x.id === d.id); if (!t || !t.done) return; const day = roll(p), rid = 'daily-' + t.id + '-' + today();
  if (day.claimed[t.id] || p.receipts.some(r => r.id === rid)) return; day.claimed[t.id] = true; const def = CHEST['chest-daily'], lines = [], evs = [];
  p.coins += def.coins; p.tickets += def.spinTickets; p.stats.dailyClaims++; lines.push(`${coin()} <b>+${def.coins} coins</b>`, `${G.ticket()} <b>+${def.spinTickets} spin ticket</b>`); recruitCheck(p, lines, evs);
  p.receipts.unshift({ id: rid, at: Date.now(), chest: 'daily', title: t.label, coins: def.coins, tickets: def.spinTickets, lines }); C.save(); sfx.win(); confetti(24, ['COIN', '✨']);
  G.panel(`<h2>Daily reward claimed</h2><ul class="rlist">${lines.map(l => `<li>${l}</li>`).join('')}</ul><div class="row left"><button class="btn big" data-a="gClose">Nice!</button></div>`);
  const cur = $('.rewards'); if (cur) G.rewards();
};

/* ---------- login rewards ---------- */
const LOGIN = [10, 15, 20, 25, 30, 35, 50];
G.loginCheck = p => { if (p.login.last === today()) return; const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10); p.login.next = p.login.last === y ? Math.min(7, (p.login.streak || 0) + 1) : 1; p.login.ready = true; };
A.gLogin = () => { const p = C.cur(); G.loginCheck(p); if (!p.login.ready || p.login.last === today()) return; const day = p.login.next || 1, rid = 'login-' + today(); if (p.receipts.some(r => r.id === rid)) return;
  const coins = LOGIN[day - 1], lines = [`${coin()} <b>+${coins} coins</b> for day ${day}`]; p.coins += coins; if (day === 7) { p.tickets++; lines.push(G.ticket() + ' <b>+1 spin ticket</b>'); }
  p.login = { last: today(), streak: day, ready: false }; p.streak = day; p.receipts.unshift({ id: rid, at: Date.now(), chest: 'login', title: 'Daily login', coins, lines }); C.save(); sfx.win(); confetti(24, ['COIN', '✨']); G.rewards(); };

/* ---------- prize wheel (earned coins or a spin ticket) ---------- */
const WHEEL = [{ t: '10 coins', coins: 10, w: 24, c: '#ff8a5b', icon: 'coin' }, { t: '25 coins', coins: 25, w: 20, c: '#ffd23f', icon: 'coin' }, { t: 'Clue Lantern', bag: 'clue', w: 12, c: '#5db4ff', icon: 'clue_lantern' }, { t: 'Spin ticket', ticket: 1, w: 10, c: '#2fbf71', icon: 'ticket' },
  { t: 'Apple (+8 XP)', food: 8, w: 10, c: '#a06cf5', icon: 'item_apple' }, { t: 'Pet item', cos: true, w: 6, c: '#ef5da8', icon: 'cos_bow' }, { t: 'Bubble Guard', bag: 'bubble', w: 8, c: '#19b5b0', icon: 'item_bubble_guard' }, { t: 'Mini chest (60 coins)', coins: 60, w: 10, c: '#ff9f43', icon: 'ch_chest_daily' }];
const wIcon = (s, cls = '') => s.icon === 'coin' ? coin() : s.icon === 'ticket' ? G.ticket() : art(s.icon, '🎁', 'wi ' + cls);
G.WHEEL = WHEEL;
const SPIN_COST = 40; let spinning = false;
A.gSpin = () => {
  const p = C.cur(); if (spinning) return; if (!p.tickets && p.coins < SPIN_COST) return; spinning = true;
  const useTicket = p.tickets > 0, before = { coins: p.coins, tickets: p.tickets }; if (useTicket) p.tickets--; else p.coins -= SPIN_COST;
  let r = Math.random() * WHEEL.reduce((a, s) => a + s.w, 0), idx = 0; for (let i = 0; i < WHEEL.length; i++) { r -= WHEEL[i].w; if (r <= 0) { idx = i; break; } }
  const w = WHEEL[idx], lines = [useTicket ? G.ticket() + ' Used 1 spin ticket' : `${coin()} Paid ${SPIN_COST} earned coins`];
  if (w.coins) { p.coins += w.coins; lines.push(`${coin()} <b>+${w.coins} coins</b>`); } else if (w.ticket) { p.tickets += w.ticket; lines.push(`${G.ticket()} <b>+1 spin ticket</b>`); } else if (w.food) { const lead = G.lead(p); if (lead) { G.gainXp(p, lead, w.food); lines.push(`🍎 <b>+${w.food} XP</b> for ${esc(lead.name)}`); } else { p.coins += 10; lines.push('No lead pet yet, so the apple became <b>+10 coins</b>'); } } else if (w.bag) { p.bag[w.bag]++; lines.push(`🎒 <b>${w.t}</b> added to your Battle Bag`); }
  else { const pool = D.cosmetics.filter(c => c.unlock === 'daily' && !p.cosOwned.includes(c.id)); if (pool.length) { const c = pick(pool); p.cosOwned.push(c.id); lines.push(`<img class="art cosi" src="assets/cos_${c.base}.png" style="filter:hue-rotate(${c.hue}deg)" alt=""> <b>${esc(c.name)}</b>`); } else { p.coins += 40; lines.push('You own every wheel item! <b>+40 coins</b>'); } }
  lines.push(`<small>Wallet: ${before.coins} → ${p.coins} coins · ${before.tickets} → ${p.tickets} tickets</small>`);
  const rc = { prize: w.t, idx, id: 'spin-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: Date.now(), chest: 'spin', title: 'Prize wheel: ' + w.t, coins: w.coins || 0, lines }; p.receipts.unshift(rc); p.lastSpin = { id: rc.id, idx, prize: w.t }; C.save(); /* saved before the animation, so a reload cannot re-roll */
  const el = $('#wheel'), deg = 360 * 5 - idx * 45 - 22.5; G.playSfx('spin-tick'); if (el) { el.style.transition = calm() ? 'none' : 'transform 3.2s cubic-bezier(.15,.7,.1,1)'; el.style.transform = `rotate(${deg}deg)`; }
  const fin = () => { spinning = false; G.playSfx('spin-win'); confetti(30, ['COIN', '✨']); G.panel(`<h2>You won: ${esc(w.t)}</h2><ul class="rlist">${lines.map(l => `<li>${l}</li>`).join('')}</ul><div class="row left"><button class="btn big" data-a="gClose">Great!</button></div>`); const cur = $('.rewards'); if (cur) { const keep = el ? el.style.transform : ''; G.rewards(); const e2 = $('#wheel'); if (e2) { e2.style.transition = 'none'; e2.style.transform = keep; } } };
  if (calm()) fin(); else setTimeout(fin, 3300);
};

/* ---------- the Rewards screen ---------- */
G.rewards = function rewards() {
  const p = C.cur(); G.loginCheck(p); const canLogin = p.login.ready && p.login.last !== today(), day = p.login.next || (p.login.streak % 7) + 1, seg = 360 / WHEEL.length;
  const grad = `conic-gradient(${WHEEL.map((s, i) => `${s.c} ${i * seg}deg ${(i + 1) * seg}deg`).join(',')})`;
  C.view(`${G.hdr()}<div class="rewards"><div class="card"><h2>Daily login reward</h2><div class="cal" role="list">${LOGIN.map((c, i) => `<div class="calday ${i + 1 < day || (!canLogin && i + 1 === (p.login.streak || 0)) ? 'got' : ''} ${canLogin && i + 1 === day ? 'now' : ''}" role="listitem"><b>Day ${i + 1}</b><span>${i === 6 ? G.ticket() + ' + ' : ''}${c} ${coin()}</span></div>`).join('')}</div>
      <div class="row left">${canLogin ? `<button class="btn big" data-a="gLogin">Claim day ${day} reward</button>` : '<span class="small">Today’s login reward is claimed. Come back tomorrow!</span>'}</div></div>
    <div class="card"><h2>Daily Battles</h2>${G.dailyPanel(p)}</div>
    <div class="card"><h2>Prize wheel</h2><p>Spin with a ticket, or with ${SPIN_COST} coins you earned. You have <b>${p.tickets}</b> ticket${p.tickets === 1 ? '' : 's'} and <b>${p.coins}</b> coins.</p>
      <div class="wheelwrap"><span class="wptr" aria-hidden="true">▼</span><div class="wheel" id="wheel" style="background:${grad}" aria-hidden="true">${WHEEL.map((s, i) => `<span class="wl" data-wedge="${i}" style="transform:rotate(${i * seg + seg / 2}deg) translateY(-84px) rotate(-${i * seg + seg / 2}deg)">${wIcon(s)}<b>${esc(s.t.replace(/ \(.*\)/, ''))}</b></span>`).join('')}</div></div>
      <p class="small odds" id="odds"><b>Prize pool and odds (each spin):</b> ${WHEEL.map(s => `${esc(s.t)} ${Math.round(100 * s.w / WHEEL.reduce((a, x) => a + x.w, 0))}%`).join(' · ')}.${p.lastSpin ? ` Last spin: <b>${esc(p.lastSpin.prize)}</b>.` : ''}</p>
      <div class="row"><button class="btn big" data-a="gSpin" ${p.tickets || p.coins >= SPIN_COST ? '' : 'disabled'}>Spin (${p.tickets ? '1 ticket' : SPIN_COST + ' coins'})</button></div>${p.tickets || p.coins >= SPIN_COST ? '' : '<p class="small center">Win battles to earn coins and tickets.</p>'}</div>
    <div class="card"><h2>Receipts</h2>${p.receipts.length ? `<ul class="rcp">${p.receipts.slice(0, 10).map(r => `<li><b>${esc(r.title || r.chest)}</b> · ${new Date(r.at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}<br><small class="rl">${(r.lines || []).join(' · ')}</small></li>`).join('')}</ul>` : '<p>No receipts yet. Win a battle to open your first chest.</p>'}</div></div>${G.nav('rewards')}`);
};

/** Small one-off rewards (for example finishing a free-writing piece). Keyed by receipt ID. */
G.quickReward = (p, { title, coins = 0, xp = 0, subject = 'language' }) => {
  const rc = { id: 'qr-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: Date.now(), chest: 'standard', title, coins, xp, lines: [] };
  p.coins += coins; p.xp += xp; p.sx[subject] = (p.sx[subject] || 0) + xp; if (coins) rc.lines.push(`${coin()} <b>+${coins} coins</b>`); if (xp) rc.lines.push(`⭐ <b>+${xp} XP</b>`);
  p.receipts.unshift(rc); C.save(); sfx.win(); confetti(24, ['⭐', '✨']);
  G.panel(`<h2>${esc(title)}</h2><ul class="rlist">${rc.lines.map(l => `<li>${l}</li>`).join('')}</ul><div class="row left"><button class="btn big" data-a="gClose">Great!</button></div>`); return rc;
};
});
