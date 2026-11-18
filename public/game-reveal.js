/* Storyland Quest – hatch, level-up and evolution reveals. Events are recorded once when XP is granted (saved in the
   profile queue with a unique id) and shown after the results screen. Skipping, reloading or previewing never grants again. */
window.SQ_PARTS.push((G, C) => {
'use strict';
const { S, $, esc, calm } = C, A = G.actions, LVL = 40;
const ICON = { hatch: 'sprites/hatch.png', 'level-up': 'sprites/level-up.png', evolution: 'sprites/evolution.png' };
G.levelOf = inst => 1 + Math.floor(inst.xp / LVL);
const sprite = (fam, stage) => `assets/c/${fam}-${['egg', 'baby', 'juvenile', 'adult'][stage]}.png`;
const known = (p, z) => { try { return G.knownMoves(p, z); } catch (e) { return []; } };
G.MISSING = G.MISSING || [];

/* ---- record events at the single point where XP is granted ---- */
const _gain = G.gainXp;
G.gainXp = (p, inst, xp) => {
  const xp0 = inst.xp, l0 = G.levelOf(inst), mv0 = new Set(known(p, inst)), ev = _gain(p, inst, xp);
  if (!p.preview && xp > 0) {
    const l1 = G.levelOf(inst), mv1 = known(p, inst).filter(id => !mv0.has(id)), s0 = ev.before, s1 = ev.after, q = (p.revq = p.revq || []), base = { iid: inst.iid, fam: inst.fam, name: inst.name, xp0, xp1: inst.xp, l0, l1 };
    const id = () => 'rv' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    let any = false;
    for (let s = s0; s < s1; s++) { any = true; q.push({ ...base, id: id(), kind: s === 0 ? 'hatch' : 'evolve', from: s, to: s + 1, moves: s + 1 === s1 ? mv1 : [] }); }
    if (!any && l1 > l0) q.push({ ...base, id: id(), kind: 'level', from: s1, to: s1, moves: mv1 });
    if (q.length > 12) q.splice(0, q.length - 12);
  }
  return ev;
};
G.hasReveals = () => { const p = C.cur(); return !!(p && p.revq && p.revq.length); };

/* ---- sound: a soft crack and a chime, both optional ---- */
const tone = (f, d, type = 'sine', g = .08, when = 0) => { if (!S.settings.sound) return; try { const a = C.audio(), o = a.createOscillator(), v = a.createGain(), t = a.currentTime + when; o.type = type; o.frequency.setValueAtTime(f, t); v.gain.setValueAtTime(g, t); v.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(v).connect(a.destination); o.start(t); o.stop(t + d); } catch (e) { /* optional */ } };
const crack = () => { tone(1800, .05, 'square', .05); tone(1200, .06, 'square', .05, .06); };
const chime = () => { tone(660, .25, 'sine', .09); tone(880, .3, 'sine', .09, .12); tone(1320, .35, 'sine', .08, .24); };

/* ---- overlay ---- */
let T = [], CUR = null;
const later = (ms, fn) => { const t = setTimeout(fn, ms); T.push(t); };
const clear = () => { T.forEach(clearTimeout); T = []; };
const img = (fam, st, cls = '') => `<img class="rvimg ${cls}" src="${sprite(fam, st)}" alt="" draggable="false" data-fam="${fam}" data-st="${st}">`;
const palette = fam => { const m = G.MOVE[(G.FAM[fam] || {}).unlocks && G.FAM[fam].unlocks.juvenile]; return (m && m.color) || '#ffd880'; };
const root = () => { let r = $('#reveal'); if (!r) { r = document.createElement('div'); r.id = 'reveal'; r.className = 'reveal'; r.setAttribute('role', 'dialog'); r.setAttribute('aria-modal', 'true'); document.body.appendChild(r); } return r; };
const missingCheck = (r, ev) => { r.querySelectorAll('img.rvimg').forEach(im => { im.onerror = () => { const id = `${im.dataset.fam}-${['egg', 'baby', 'juvenile', 'adult'][+im.dataset.st]}`; if (!G.MISSING.includes(id)) G.MISSING.push(id); im.replaceWith(Object.assign(document.createElement('span'), { className: 'rvmiss', textContent: `Missing picture: ${id}` })); const n = r.querySelector('.rvnote'); if (n) n.textContent = `A picture is missing (${id}). Your result is still saved correctly.`; }; }); void ev; };
const famName = fam => (G.FAM[fam] || {}).name || fam;
const STG = ['Egg', 'Baby', 'Juvenile', 'Adult'];
const movesLine = ev => ev.moves && ev.moves.length ? `<p class="rvmoves">New move${ev.moves.length > 1 ? 's' : ''}: ${ev.moves.map(id => `<b>${esc(G.MOVE[id] ? G.MOVE[id].name : id)}</b>`).join(', ')}</p>` : '';

const isQuest = ev => { const p = C.cur(); return ev.kind === 'hatch' && p && p.quest && p.quest.step === 'hatch' && p.quest.egg === ev.iid; };
function body(ev, preview) {
  const col = palette(ev.fam), fin = !!calm();
  const lab = (k) => `<div class="rvbadge"><img src="${ICON[k]}" alt="" width="56" height="56"><b>${{ hatch: 'Hatched!', 'level-up': 'Level up!', evolution: 'Evolved!' }[k]}</b></div>`;
  if (ev.kind === 'hatch') {
    return `${lab('hatch')}<div class="rvstage" style="--c:${col}"><div class="rvglow"></div>
      <div class="rvegg">${img(ev.fam, 0, 'rvbase')}<div class="rvcrackm" style="-webkit-mask-image:url(${sprite(ev.fam, 0)});mask-image:url(${sprite(ev.fam, 0)})"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M50 18 L44 34 L56 46 L42 60 L55 74 L48 88" fill="none" stroke="#fff6c8" stroke-width="2.4" stroke-linejoin="round"/><path d="M50 18 L44 34 L56 46 L42 60 L55 74 L48 88" fill="none" stroke="#3b2400" stroke-opacity=".55" stroke-width="1" stroke-linejoin="round"/></svg></div></div>
      <div class="rvshell s1">${img(ev.fam, 0)}</div><div class="rvshell s2">${img(ev.fam, 0)}</div><div class="rvshell s3">${img(ev.fam, 0)}</div>
      <div class="rvnew">${img(ev.fam, 1)}</div></div>
      <h2 class="rvtitle">${isQuest(ev) ? 'Your pet is ready!' : `${esc(ev.name)} <small>(${esc(famName(ev.fam))} Baby)</small>`}</h2>${isQuest(ev) ? `<p class="rvstg"><b>${esc(ev.name)}</b> joined your team.</p>` : ''}<p class="rvnote" role="status"></p>${movesLine(ev)}${fin ? '' : ''}`;
  }
  if (ev.kind === 'evolve') {
    return `${lab('evolution')}<div class="rvstage evo" style="--c:${col}"><div class="rvglow"></div><div class="rvold">${img(ev.fam, ev.from)}</div><div class="rvnew">${img(ev.fam, ev.to)}</div></div>
      <h2 class="rvtitle">${esc(ev.name)}</h2><p class="rvstg"><span>${STG[ev.from]}</span> → <b>${STG[ev.to]} ${esc(famName(ev.fam))}</b></p><p class="rvnote" role="status"></p>${movesLine(ev)}`;
  }
  const pct0 = (ev.xp0 % LVL) / LVL * 100, pct1 = ev.l1 > ev.l0 ? 100 : (ev.xp1 % LVL) / LVL * 100;
  return `${lab('level-up')}<div class="rvstage lv" style="--c:${col}"><div class="rvglow"></div><div class="rvnew show">${img(ev.fam, ev.to)}</div></div>
    <h2 class="rvtitle">${esc(ev.name)} <span class="rvlv">Level ${ev.l0} → Level ${ev.l1}</span></h2><div class="rvbar" aria-label="XP bar"><i style="width:${fin ? pct1 : pct0}%"></i></div><p class="rvstg">${ev.xp0} → ${ev.xp1} XP${ev.l1 - ev.l0 > 1 ? ` · jumped ${ev.l1 - ev.l0} levels` : ''}</p><p class="rvnote" role="status"></p>${movesLine(ev)}${preview ? '' : ''}`;
}
function play(ev, preview, done) {
  clear(); CUR = { ev, preview, done }; const r = root(), fin = !!calm();
  r.innerHTML = `<div class="rvcard" tabindex="-1">${preview ? '<span class="rvprev">Preview only: nothing is saved</span>' : ''}${body(ev, preview)}
    <div class="row rvbtns"><button class="btn ghost" data-a="rvSkip" id="rvskip">${fin ? '' : 'Skip animation'}</button>${isQuest(ev) ? '' : ev.kind === 'hatch' ? '<button class="btn" data-a="rvView">View in Companions</button>' : ''}${isQuest(ev) ? '<button class="btn big" data-a="rvGo" id="rvnext">Go to Sound Island</button>' : '<button class="btn big" data-a="rvNext" id="rvnext">Continue</button>'}</div></div>`;
  if (fin) { r.classList.add('done', 'calm'); const sk = $('#rvskip'); if (sk) sk.hidden = true; }
  missingCheck(r, ev); r.classList.remove('done', 'go'); if (fin) r.classList.add('done'); else r.classList.add('go');
  const card = r.querySelector('.rvcard'); if (card) card.focus({ preventScroll: true });
  if (fin) { chime(); return; }
  if (ev.kind === 'hatch') {
    const egg = r.querySelector('.rvegg'), K = (t, f) => later(t, f);
    K(200, () => { egg.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-5deg)' }, { transform: 'rotate(5deg)' }, { transform: 'rotate(0)' }], { duration: 420 }); tone(300, .08, 'triangle', .05); });
    K(750, () => { egg.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(5deg)' }, { transform: 'rotate(-5deg)' }, { transform: 'rotate(0)' }], { duration: 420 }); tone(320, .08, 'triangle', .05); });
    K(1350, () => { egg.animate([{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(-10deg) scale(1.06)' }, { transform: 'rotate(10deg) scale(1.08)' }, { transform: 'rotate(-6deg) scale(1.04)' }, { transform: 'rotate(0)' }], { duration: 650 }); });
    K(1900, () => { r.classList.add('cracked'); crack(); });
    K(2500, () => { r.classList.add('open'); G.playSfx('hatch'); });
    K(3300, () => { r.classList.add('done'); chime(); });
  } else if (ev.kind === 'evolve') {
    later(300, () => r.classList.add('glow')); later(1300, () => { r.classList.add('open'); G.playSfx('new-pet'); }); later(2200, () => { r.classList.add('done'); chime(); });
  } else {
    later(200, () => { const b = r.querySelector('.rvbar i'); if (b) b.style.width = (ev.l1 > ev.l0 ? 100 : (ev.xp1 % LVL) / LVL * 100) + '%'; }); later(900, () => { r.classList.add('done'); chime(); const i = r.querySelector('.rvnew img'); if (i) i.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-22px) scale(1.08)' }, { transform: 'translateY(0)' }], { duration: 520, easing: 'ease-out' }); });
  }
}
const finish = () => { clear(); const r = $('#reveal'); if (r) r.remove(); const d = CUR && CUR.done; CUR = null; if (d) d(); };
A.rvSkip = () => { clear(); const r = $('#reveal'); if (!r) return; r.classList.add('cracked', 'open', 'done', 'glow'); const b = r.querySelector('.rvbar i'); if (b && CUR) b.style.width = (CUR.ev.l1 > CUR.ev.l0 ? 100 : (CUR.ev.xp1 % LVL) / LVL * 100) + '%'; };
A.rvNext = () => finish();
A.rvGo = () => { G.questGo && G.questGo(); finish(); setTimeout(() => { if (!G.battleActive()) G.actions.trailGo({ id: 'sound', s: 'intro' }); }, 80); };
A.rvView = () => { const d = CUR && CUR.done; CUR = null; clear(); const r = $('#reveal'); if (r) r.remove(); if (CUR === null && !CUR) { /* queue item already consumed below */ } G.library('companions'); void d; };

/* ---- show the saved queue, one at a time, each consumed exactly once ---- */
G.revealPending = done => {
  const p = C.cur(); if (!p || !p.revq || !p.revq.length || $('#reveal')) { if (done) done(); return; }
  const next = () => { const q = p.revq; if (!q.length) { if (done) done(); return; } const ev = q.shift(); C.save(); play(ev, false, next); };
  next();
};
/* View in Companions leaves the queue to continue next time it is shown */
const _leave = G.leave; G.leave = function (early) { if (G.hasReveals()) return G.revealPending(() => _leave(early)); return _leave(early); };
G.revealPreview = (fam, kind) => {
  const f = G.FAM[fam]; if (!f) return; const xp = { hatch: [0, 10], 'level-up': [41, 81], 'evolve-1': [60, 120], 'evolve-2': [250, 350] }[kind] || [0, 10];
  const mk = { hatch: { kind: 'hatch', from: 0, to: 1 }, 'level-up': { kind: 'level', from: 1, to: 1 }, 'evolve-1': { kind: 'evolve', from: 1, to: 2 }, 'evolve-2': { kind: 'evolve', from: 2, to: 3 } }[kind];
  play({ ...mk, id: 'preview', iid: 'preview', fam, name: f.name, xp0: xp[0], xp1: xp[1], l0: 1 + Math.floor(xp[0] / LVL), l1: 1 + Math.floor(xp[1] / LVL), moves: [] }, true, () => {});
};
/* food and wheel XP outside battles */
document.addEventListener('click', () => setTimeout(() => { if (!$('#reveal') && G.hasReveals() && !G.battleActive()) G.revealPending(); }, 400), true);
});
