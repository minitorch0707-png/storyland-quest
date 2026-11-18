/* Storyland Quest – 2D battle effects: a small canvas particle engine, per-creature auras, charge-ups,
   one recipe per catalogued move, impact flavours, hit reactions and damage numbers. All original, drawn in code. */
window.SQ_PARTS.push((G, C) => {
'use strict';
const { calm } = C;
const TAU = Math.PI * 2, rnd = (a, b) => a + Math.random() * (b - a), pk = a => a[Math.random() * a.length | 0];
const FX = G.fx = { scale: 1, parts: [], emit: [], cv: null, cx: null, arena: null, raf: 0, last: 0, freeze: 0, log: [] };
const stamp = (ev, extra) => { FX.log.push({ ev, t: Math.round(performance.now()), ...extra }); if (FX.log.length > 60) FX.log.shift(); };
FX.stamp = stamp;

/* ---------- sprite facing (explicit property: -1 = sprite natively faces left) ---------- */
G.SPRITE_FACE = { dragon: -1, sea: -1, mossback: -1, lanternfly: -1, leafgecko: -1, sunbeetle: -1, pearlseal: -1, prismchameleon: -1, starshark: -1 };
G.flipFor = (fam, side) => (side === 'left' ? G.SPRITE_FACE[fam] === -1 : false);

/* ---------- canvas lifecycle ---------- */
FX.attach = arena => {
  FX.detach(); if (!arena) return;
  const cv = document.createElement('canvas'); cv.className = 'fxc'; arena.appendChild(cv);
  FX.cv = cv; FX.cx = cv.getContext('2d'); FX.arena = arena; FX.resize();
  if (window.ResizeObserver) { FX.ro = new ResizeObserver(() => FX.resize()); FX.ro.observe(arena); }
  FX.last = performance.now(); FX.raf = requestAnimationFrame(loop);
};
FX.detach = () => { cancelAnimationFrame(FX.raf); if (FX.ro) FX.ro.disconnect(); if (FX.cv) FX.cv.remove(); FX.cv = FX.cx = FX.arena = null; FX.parts.length = 0; FX.emit.length = 0; };
FX.resize = () => { if (!FX.cv) return; const r = FX.arena.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1); FX.cv.width = Math.round(r.width * d); FX.cv.height = Math.round(r.height * d); FX.cv.style.width = r.width + 'px'; FX.cv.style.height = r.height + 'px'; FX.cx.setTransform(d, 0, 0, d, 0, 0); FX.w = r.width; FX.h = r.height; FX.k = Math.max(.85, Math.min(1.7, r.width / 700)); };
FX.box = (el, ax = .5, ay = .5) => { if (!el || !FX.arena) return { x: FX.w / 2, y: FX.h / 2, w: 0, h: 0 }; const r = el.getBoundingClientRect(), a = FX.arena.getBoundingClientRect(); return { x: r.left - a.left + r.width * ax, y: r.top - a.top + r.height * ay, w: r.width, h: r.height, l: r.left - a.left, t: r.top - a.top }; };

/* ---------- particles ---------- */
const texCache = new Map();
const glowTex = c => { let t = texCache.get(c); if (t) return t; t = document.createElement('canvas'); t.width = t.height = 64; const g = t.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, c); gr.addColorStop(.35, c); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.globalAlpha = 1; g.fillRect(0, 0, 64, 64); texCache.set(c, t); return t; };
const add = o => { if (!FX.cv || FX.parts.length > 900) return null; const K = FX.k || 1; for (const f of ['size', 'size1', 'vx', 'vy', 'ax', 'ay']) if (typeof o[f] === 'number' && o[f] > -1) o[f] *= K; else if (typeof o[f] === 'number') o[f] *= K; const p = Object.assign({ x: 0, y: 0, vx: 0, vy: 0, ax: 0, ay: 0, drag: 0, life: .6, max: 0, size: 6, size1: -1, color: '#fff', shape: 'dot', rot: 0, spin: 0, a0: 1, add: 1, fp: 1, fi: 0 }, o); p.max = p.max || p.life; if (p.size1 < 0) p.size1 = p.size; FX.parts.push(p); return p; };
FX.add = add;

function drawP(g, p) {
  const age = 1 - p.life / p.max, s = p.size + (p.size1 - p.size) * age; let a = p.a0 * Math.pow(Math.max(0, p.life / p.max), p.fp); if (p.fi) a *= Math.min(1, age * p.max / p.fi);
  if (a <= 0.01 || s <= 0.1) return; g.globalAlpha = Math.min(1, a); g.globalCompositeOperation = p.add ? 'lighter' : 'source-over';
  if (p.draw) { p.draw(g, p, s, a); return; }
  g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
  switch (p.shape) {
    case 'dot': g.drawImage(glowTex(p.color), -s, -s, s * 2, s * 2); break;
    case 'flame': g.drawImage(glowTex(p.color), -s, -s * 1.5, s * 2, s * 3); g.drawImage(glowTex('#fff4c0'), -s * .4, -s * .6, s * .8, s * 1.2); break;
    case 'star': g.fillStyle = p.color; g.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? s * .32 : s; g.lineTo(Math.cos(i * Math.PI / 4) * r, Math.sin(i * Math.PI / 4) * r); } g.closePath(); g.fill(); break;
    case 'ring': g.strokeStyle = p.color; g.lineWidth = Math.max(1.5, s * .12); g.beginPath(); g.arc(0, 0, s, 0, TAU); g.stroke(); break;
    case 'shard': g.fillStyle = p.color; g.beginPath(); g.moveTo(0, -s); g.lineTo(s * .38, 0); g.lineTo(0, s * .7); g.lineTo(-s * .38, 0); g.closePath(); g.fill(); break;
    case 'leaf': g.fillStyle = p.color; g.beginPath(); g.moveTo(-s, 0); g.quadraticCurveTo(0, -s * .7, s, 0); g.quadraticCurveTo(0, s * .7, -s, 0); g.fill(); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-s * .8, 0); g.lineTo(s * .8, 0); g.stroke(); break;
    case 'petal': g.fillStyle = p.color; g.beginPath(); g.ellipse(0, 0, s, s * .55, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-s * .2, -s * .12, s * .5, s * .22, 0, 0, TAU); g.fill(); break;
    case 'feather': g.fillStyle = p.color; g.beginPath(); g.moveTo(0, -s); g.quadraticCurveTo(s * .55, 0, 0, s); g.quadraticCurveTo(-s * .2, 0, 0, -s); g.fill(); break;
    case 'bubble': g.strokeStyle = p.color; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, s, 0, TAU); g.stroke(); g.fillStyle = 'rgba(255,255,255,.28)'; g.fill(); g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(-s * .35, -s * .35, s * .22, 0, TAU); g.fill(); break;
    case 'page': g.fillStyle = p.color; g.fillRect(-s * .6, -s * .8, s * 1.2, s * 1.6); g.strokeStyle = 'rgba(80,50,120,.5)'; g.lineWidth = 1; for (let i = -2; i < 3; i++) { g.beginPath(); g.moveTo(-s * .4, i * s * .28); g.lineTo(s * .4, i * s * .28); g.stroke(); } break;
    case 'moon': g.fillStyle = p.color; g.beginPath(); g.arc(0, 0, s, 0, TAU); g.fill(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(s * .45, -s * .1, s * .85, 0, TAU); g.fill(); break;
    case 'cloud': g.drawImage(glowTex(p.color), -s, -s, s * 2, s * 2); g.drawImage(glowTex(p.color), -s * 1.1, -s * .5, s * 1.4, s * 1.4); g.drawImage(glowTex(p.color), s * .1, -s * .6, s * 1.4, s * 1.4); break;
    case 'sand': g.fillStyle = p.color; g.fillRect(-s * .5, -s * .5, s, s); break;
    case 'seed': g.fillStyle = p.color; g.beginPath(); g.ellipse(0, 0, s * .6, s, 0, 0, TAU); g.fill(); break;
    case 'snow': g.strokeStyle = p.color; g.lineWidth = 1.6; for (let i = 0; i < 3; i++) { g.rotate(Math.PI / 3); g.beginPath(); g.moveTo(-s, 0); g.lineTo(s, 0); g.stroke(); } break;
    case 'cog': g.fillStyle = p.color; g.beginPath(); for (let i = 0; i < 16; i++) { const r = i % 2 ? s * .78 : s; g.lineTo(Math.cos(i * Math.PI / 8) * r, Math.sin(i * Math.PI / 8) * r); } g.closePath(); g.fill(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(0, 0, s * .32, 0, TAU); g.fill(); break;
    case 'dust': g.drawImage(glowTex(p.color), -s, -s, s * 2, s * 2); break;
    default: g.drawImage(glowTex(p.color), -s, -s, s * 2, s * 2);
  }
  g.restore();
}
function loop(t) {
  FX.raf = requestAnimationFrame(loop); if (!FX.cx) return;
  const real = Math.min(.05, (t - FX.last) / 1000); FX.last = t; let dt = real * FX.scale;
  if (FX.freeze > 0) { FX.freeze -= real * 1000; dt = 0; }
  for (const e of FX.emit) { e.acc += dt * e.rate; while (e.acc >= 1) { e.acc--; const b = FX.box(e.el(), 0, 0); if (b.w) e.fn(b); } }
  const g = FX.cx; g.setTransform(Math.min(2, window.devicePixelRatio || 1), 0, 0, Math.min(2, window.devicePixelRatio || 1), 0, 0); g.clearRect(0, 0, FX.w, FX.h);
  for (let i = FX.parts.length - 1; i >= 0; i--) {
    const p = FX.parts[i]; p.life -= dt; if (p.life <= 0) { if (p.die) p.die(p); FX.parts.splice(i, 1); continue; }
    if (p.upd) p.upd(p, dt, 1 - p.life / p.max);
    p.vx += p.ax * dt; p.vy += p.ay * dt; if (p.drag) { const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; } p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.spin * dt;
    drawP(g, p);
  }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}

/* ---------- per-creature auras (always on, gentle) ---------- */
const spot = (b, fx = [.15, .85], fy = [.3, 1]) => ({ x: b.x - b.w / 2 + rnd(fx[0], fx[1]) * b.w, y: b.y - b.h / 2 + rnd(fy[0], fy[1]) * b.h });
const AURA = {
  dragon: { rate: 26, f: b => { const s = spot(b, [.2, .9], [.5, 1]); add({ ...s, vx: rnd(-14, 14), vy: rnd(-70, -130), life: rnd(.7, 1.3), size: rnd(3, 7), size1: 0, color: pk(['#ff7a30', '#ffb02e', '#ffe27a']) }); if (Math.random() < .3) add({ ...spot(b, [.1, .9], [.55, 1]), vy: rnd(-40, -80), life: .8, size: rnd(9, 15), size1: 2, color: '#ff8a2e', shape: 'flame', a0: .7 }); } },
  bird: { rate: 7, f: b => add({ ...spot(b), vx: rnd(-30, 30), vy: rnd(10, 30), life: 1.6, size: rnd(5, 8), color: pk(['#ffffff', '#bfe4ff']), shape: 'feather', spin: rnd(-2, 2), add: 0, a0: .9 }) },
  sea: { rate: 12, f: b => add({ ...spot(b, [.2, .8], [.6, 1]), vx: rnd(-10, 10), vy: rnd(-40, -70), life: 1.4, size: rnd(3, 7), color: '#d9fff8', shape: 'bubble', add: 0, a0: .85 }) },
  cat: { rate: 12, f: b => add({ ...spot(b), vy: rnd(-24, -8), life: 1, size: rnd(4, 8), size1: 0, color: pk(['#ffe27a', '#fff6c8']), shape: 'star', spin: 2 }) },
  'comet-moth': { rate: 14, f: b => { const a = rnd(0, TAU); add({ x: b.x + Math.cos(a) * b.w * .5, y: b.y + Math.sin(a) * b.h * .45, vx: -Math.sin(a) * 30, vy: Math.cos(a) * 30, life: 1, size: rnd(4, 8), size1: 0, color: pk(['#ff9bd8', '#fff2a0', '#c8b0ff']), shape: 'star', spin: 3 }); } },
  mossback: { rate: 9, f: b => add({ ...spot(b, [.2, .9], [.1, .6]), vx: rnd(-14, 14), vy: rnd(15, 40), life: 1.6, size: rnd(5, 8), color: pk(['#8cd870', '#4e9a52', '#c8f09a']), shape: 'leaf', spin: rnd(-3, 3), add: 0 }) },
  'prism-ram': { rate: 16, f: b => add({ ...spot(b), vy: rnd(-30, -10), life: .9, size: rnd(3, 7), size1: 0, color: pk(['#ff9bd8', '#9bd8ff', '#ffe29b', '#b39bff', '#9dff8a']), shape: 'star', spin: 2 }) },
  lanternfly: { rate: 10, f: b => { const s = spot(b, [.1, .9], [.1, 1]); add({ ...s, vx: rnd(-20, 20), vy: rnd(-20, 20), life: 1.4, size: rnd(5, 10), size1: 1, color: '#ffe27a', a0: .8 }); } },
  snowhare: { rate: 12, f: b => add({ ...spot(b, [0, 1], [0, .3]), vx: rnd(-12, 12), vy: rnd(25, 55), life: 1.5, size: rnd(3, 6), color: '#ffffff', shape: 'snow', spin: rnd(-2, 2), add: 0 }) },
  coralotl: { rate: 10, f: b => add({ ...spot(b, [.2, .8], [.6, 1]), vy: rnd(-40, -70), life: 1.3, size: rnd(3, 6), color: '#ffd2c8', shape: 'bubble', add: 0 }) },
  bookback: { rate: 7, f: b => add({ ...spot(b, [.2, .8], [0, .5]), vx: rnd(-10, 10), vy: rnd(-20, -8), life: 1.8, size: rnd(6, 9), color: '#fff3d0', shape: 'page', spin: rnd(-2, 2), add: 0, a0: .85 }) },
  moonbat: { rate: 12, f: b => add({ ...spot(b), vy: rnd(-26, -6), life: 1.1, size: rnd(4, 8), size1: 0, color: pk(['#d9ccff', '#fff2a0']), shape: 'star', spin: 2 }) },
  sandmole: { rate: 20, f: b => { const a = rnd(0, TAU); add({ x: b.x + Math.cos(a) * b.w * .42, y: b.y + b.h * .42 + Math.sin(a) * 12, vx: -Math.sin(a) * 34, vy: Math.cos(a) * 8 - 12, life: 1, size: rnd(2, 4), color: pk(['#e0a05a', '#f6bd78', '#fff0c8']), shape: 'sand', add: 0, a0: .9 }); } },
  cloudalpaca: { rate: 6, f: b => add({ ...spot(b, [.1, .9], [.5, 1]), vx: rnd(-8, 8), vy: rnd(-25, -10), life: 1.4, size: rnd(9, 15), size1: 3, color: '#ffffff', shape: 'cloud', add: 0, a0: .6 }) },
  leafgecko: { rate: 9, f: b => add({ ...spot(b), vx: rnd(-14, 14), vy: rnd(10, 30), life: 1.5, size: rnd(5, 8), color: pk(['#8fdc5a', '#5bbf4c']), shape: 'leaf', spin: rnd(-3, 3), add: 0 }) },
  sunbeetle: { rate: 14, f: b => add({ ...spot(b), vy: rnd(-30, -10), life: 1.1, size: rnd(3, 7), size1: 0, color: pk(['#ffe27a', '#fff6c0', '#ffd44d']) }) },
  roseflamingo: { rate: 8, f: b => add({ ...spot(b, [.1, .9], [0, .5]), vx: rnd(-14, 14), vy: rnd(14, 34), life: 1.6, size: rnd(5, 8), color: pk(['#ffb8d0', '#ff8fb0']), shape: 'petal', spin: rnd(-3, 3), add: 0 }) },
  pearlseal: { rate: 11, f: b => add({ ...spot(b), vy: rnd(-30, -10), life: 1.2, size: rnd(3, 6), size1: 0, color: pk(['#ffffff', '#bfeee3', '#ffd9f4']) }) },
  prismchameleon: { rate: 15, f: b => add({ ...spot(b), vy: rnd(-26, -6), life: 1, size: rnd(3, 6), size1: 0, color: pk(['#ff7ac8', '#7ad6ff', '#ffe27a', '#9dff8a']) }) },
  compassowl: { rate: 9, f: b => { const a = rnd(0, TAU); add({ x: b.x + Math.cos(a) * b.w * .5, y: b.y + Math.sin(a) * b.h * .4, vx: -Math.sin(a) * 24, vy: Math.cos(a) * 24, life: 1.2, size: rnd(5, 9), size1: 1, color: '#ffe37d', shape: 'star', spin: 1.5 }); } },
  ambercrab: { rate: 13, f: b => add({ ...spot(b, [.1, .9], [.4, 1]), vy: rnd(-40, -15), life: .9, size: rnd(3, 6), size1: 0, color: pk(['#ffa650', '#ffd09a', '#ffe0b0']) }) },
  seedhog: { rate: 8, f: b => add({ ...spot(b, [.2, .9], [.1, .5]), vx: rnd(-12, 12), vy: rnd(-10, 14), life: 1.6, size: rnd(4, 7), color: pk(['#8bd16a', '#7c5a3a']), shape: 'seed', spin: rnd(-2, 2), add: 0 }) },
  frostpenguin: { rate: 12, f: b => add({ ...spot(b, [0, 1], [0, .4]), vx: rnd(-10, 10), vy: rnd(20, 50), life: 1.5, size: rnd(3, 6), color: pk(['#ffffff', '#bfeaff']), shape: 'snow', spin: rnd(-2, 2), add: 0 }) },
  orchidmantis: { rate: 8, f: b => add({ ...spot(b), vx: rnd(-14, 14), vy: rnd(12, 30), life: 1.6, size: rnd(5, 8), color: pk(['#ffd6f4', '#ec9cdb']), shape: 'petal', spin: rnd(-3, 3), add: 0 }) },
  starshark: { rate: 14, f: b => add({ ...spot(b), vy: rnd(-30, -8), life: 1.1, size: rnd(4, 8), size1: 0, color: pk(['#ffffff', '#cfe0ff', '#ffe37d']), shape: 'star', spin: 2 }) },
  'ink-baron': { rate: 14, f: b => add({ ...spot(b, [.1, .9], [.2, 1]), vx: rnd(-14, 14), vy: rnd(-30, -10), life: 1.3, size: rnd(5, 10), size1: 1, color: pk(['#9a5cff', '#5a2cbf', '#d9b8ff']), a0: .7 }) },
  'thorn-marshal': { rate: 12, f: b => add({ ...spot(b), vx: rnd(-14, 14), vy: rnd(-26, 8), life: 1.3, size: rnd(5, 8), color: pk(['#7de06a', '#2f9d4a', '#d0ff9a']), shape: 'leaf', spin: rnd(-3, 3), add: 0 }) },
  'clockwork-regent': { rate: 8, f: b => add({ ...spot(b, [.1, .9], [.2, .9]), vx: rnd(-16, 16), vy: rnd(-34, -12), life: 1.4, size: rnd(4, 9), color: pk(['#ffc23d', '#d9a441']), shape: 'cog', spin: rnd(-3, 3), add: 0, a0: .85 }) },
  'baroness-vesper': { rate: 13, f: b => add({ ...spot(b), vy: rnd(-26, -6), life: 1.2, size: rnd(4, 8), size1: 0, color: pk(['#c9d6ff', '#ffffff', '#b39bff']), shape: pk(['star', 'moon']), spin: 2 }) },
};
FX.aura = (key, getEl) => { const a = AURA[key]; if (!a || calm()) return; FX.emit.push({ el: getEl, fn: a.f, rate: a.rate, acc: 0, key }); };
FX.clearAura = () => { FX.emit.length = 0; };

/* ---------- moves: one recipe each ---------- */
const MV = {
  'ember-pop': { k: 'orb', c: ['#ff7a30', '#ffb02e', '#fff0a0'], sh: 'flame', imp: 'fire', sock: [.82, .42], big: 1.4 },
  'wing-cut': { k: 'slash', c: ['#9fdcff', '#ffffff', '#73c9ff'], sh: 'feather', imp: 'air', sock: [.6, .35] },
  'bubble-burst': { k: 'volley', c: ['#7ff0dc', '#d9fff8', '#48e1cc'], sh: 'bubble', imp: 'water', sock: [.8, .4] },
  'star-scratch': { k: 'slash', c: ['#ffe27a', '#fff6c8', '#ffcd55'], sh: 'star', imp: 'gold', sock: [.75, .6], claws: 3 },
  'comet-dust': { k: 'arc', c: ['#e7b6ff', '#ffffff', '#db94ff'], sh: 'star', imp: 'star', sock: [.5, .3] },
  'sprout-surge': { k: 'rush', c: ['#a8e07a', '#5bbf4c', '#d8f8a8'], sh: 'leaf', imp: 'leaf', sock: [.7, .7] },
  'prism-pulse': { k: 'rings', c: ['#ff9bd8', '#9bd8ff', '#ffe29b', '#b39bff'], sh: 'ring', imp: 'rainbow', sock: [.8, .45] },
  'story-spark': { k: 'shield', c: ['#ffdb71', '#fff3c4', '#ffc94d'], sh: 'star', imp: 'gold' },
  pounce: { k: 'dash', c: ['#ffd880', '#ffffff', '#ffb347'], sh: 'dust', imp: 'dust' },
  guard: { k: 'shield', c: ['#66dfcb', '#c9fff4', '#3fb8a6'], sh: 'ring', imp: 'water' },
  'lantern-flash': { k: 'volley', c: ['#ffc958', '#fff2a0', '#ff9f43'], sh: 'dot', imp: 'gold', sock: [.4, .75] },
  'snow-hop': { k: 'dash', c: ['#9adeff', '#ffffff', '#d6f3ff'], sh: 'snow', imp: 'ice', hop: 1 },
  'coral-ripple': { k: 'wave', c: ['#ff9b92', '#ffd2c8', '#ff6f91'], sh: 'ring', imp: 'water' },
  'page-gust': { k: 'rush', c: ['#d5a5ff', '#fff3d0', '#b98cf0'], sh: 'page', imp: 'paper', sock: [.7, .35] },
  'moon-flutter': { k: 'rings', c: ['#c8a9ff', '#fff2a0', '#8f78d9'], sh: 'moon', imp: 'moon', sock: [.6, .35] },
  'sand-puff': { k: 'wave', c: ['#f6bd78', '#e0a05a', '#fff0c8'], sh: 'sand', imp: 'sand' },
  'cloud-roll': { k: 'dash', c: ['#b9e9ff', '#ffffff', '#e6f6ff'], sh: 'cloud', imp: 'cloud' },
  'leaf-flick': { k: 'rush', c: ['#97e76d', '#4fb04c', '#d8f8a8'], sh: 'leaf', imp: 'leaf', sock: [.2, .7] },
  sunbeam: { k: 'beam', c: ['#ffd657', '#fff6c0', '#ffb02e'], sh: 'dot', imp: 'gold', sock: [.55, .3] },
  'petal-fan': { k: 'rush', c: ['#fa94bb', '#ffd0e2', '#ff7aa8'], sh: 'petal', imp: 'petal', sock: [.6, .35] },
  'pearl-splash': { k: 'orb', c: ['#83eedc', '#ffffff', '#bfeee3'], sh: 'bubble', imp: 'water', sock: [.8, .55] },
  'rainbow-curl': { k: 'rush', c: ['#ff7ac8', '#7ad6ff', '#ffe27a', '#9dff8a'], sh: 'dot', imp: 'rainbow', sock: [.2, .6] },
  'north-star': { k: 'orb', c: ['#ffe37d', '#ffffff', '#ffc94d'], sh: 'star', imp: 'star', sock: [.5, .3], spin: 1 },
  'amber-clap': { k: 'slash', c: ['#ffa650', '#ffd09a', '#ff8a2e'], sh: 'shard', imp: 'amber', sock: [.8, .55], claws: 2 },
  'seed-scatter': { k: 'dash', c: ['#a2d65e', '#7c5a3a', '#d8f8a8'], sh: 'seed', imp: 'leaf' },
  'ice-slide': { k: 'dash', c: ['#88d4ff', '#ffffff', '#bfeaff'], sh: 'shard', imp: 'ice' },
  'orchid-sweep': { k: 'slash', c: ['#ec9cdb', '#ffd6f4', '#c964b4'], sh: 'petal', imp: 'petal', sock: [.7, .5], claws: 2 },
  'star-wake': { k: 'arc', c: ['#94baff', '#ffffff', '#6f9aff'], sh: 'star', imp: 'star', sock: [.5, .5] },
};
G.moveRecipe = id => MV[id] || { k: 'orb', c: [(G.MOVE[id] || {}).color || '#ffd880', '#ffffff'], sh: 'dot', imp: 'gold' };
FX.isDash = id => G.moveRecipe(id).k === 'dash';
const col = r => pk(r.c);

/* charge-up at the source while the pet winds up (0-160 ms) */
FX.windup = (id, srcEl) => {
  const r = G.moveRecipe(id), s = r.sock || [.5, .5], p = FX.box(srcEl, s[0], s[1]), sz = Math.max(srcEl.getBoundingClientRect().width, 90);
  for (let i = 0; i < 22; i++) { const a = rnd(0, TAU), d = rnd(.5, .75) * sz; add({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, life: .16, size: rnd(3, 7), size1: 1, color: col(r), shape: r.sh === 'flame' || r.sh === 'dust' || r.sh === 'cloud' || r.sh === 'sand' ? 'dot' : r.sh, upd: q => { q.vx = (p.x - q.x) * 7; q.vy = (p.y - q.y) * 7; }, spin: 6 }); }
  const g = FX.box(srcEl, .5, .98); add({ x: g.x, y: g.y, life: .5, size: sz * .1, size1: sz * .55, color: r.c[0], shape: 'ring', a0: .7, draw: (c, q, s) => { c.strokeStyle = r.c[0]; c.lineWidth = 3; c.beginPath(); c.ellipse(q.x, q.y, s, s * .28, 0, 0, TAU); c.stroke(); } });
  add({ x: p.x, y: p.y, life: .2, size: 8, size1: sz * .38, color: r.c[1] || '#fff', a0: .9 }); stamp('windup', { move: id });
};

/* release -> contact: projectile travels from the socket to the target's hit point, arriving at `dur` */
FX.launch = (id, srcEl, dstEl, dur = .23) => {
  const r = G.moveRecipe(id), s = r.sock || [.5, .5], a = FX.box(srcEl, s[0], s[1]), b = FX.box(dstEl, .45, .5), c1 = r.c, k = r.k; stamp('launch', { move: id, ax: Math.round(a.x), ay: Math.round(a.y), bx: Math.round(b.x), by: Math.round(b.y) });
  const along = u => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
  if (k === 'orb' || k === 'volley' || k === 'arc') {
    const n = k === 'volley' ? 3 : 1;
    for (let i = 0; i < n; i++) {
      const off = k === 'volley' ? (i - 1) * 34 : 0, t0 = performance.now() + (k === 'volley' ? i * 35 : 0), arc = k === 'arc' ? -70 : k === 'volley' ? -30 - i * 10 : -18;
      add({ x: a.x, y: a.y, life: dur + (k === 'volley' ? .02 : 0), size: (r.big || 1) * (k === 'volley' ? 19 : 30), size1: (r.big || 1) * (k === 'volley' ? 16 : 26), color: c1[1] || c1[0], shape: r.sh === 'flame' ? 'dot' : r.sh, spin: r.spin ? 9 : 0, a0: 1,
        draw: (g, q, sz) => { const u = Math.min(1, Math.max(0, (performance.now() - t0) / (dur * 1000 / Math.max(FX.scale, .01)))); const u2 = 1 - q.life / q.max; const uu = Math.max(u2, 0); const p = along(uu); q.x = p.x; q.y = p.y + Math.sin(uu * Math.PI) * arc + off * Math.sin(uu * Math.PI);
          g.drawImage(glowTex(c1[0]), q.x - sz * 2, q.y - sz * 2, sz * 4, sz * 4); g.drawImage(glowTex(c1[1] || '#fff'), q.x - sz * .9, q.y - sz * .9, sz * 1.8, sz * 1.8);
          if (r.sh !== 'dot' && r.sh !== 'flame') { g.save(); g.translate(q.x, q.y); g.rotate(q.rot); g.globalCompositeOperation = 'source-over'; g.fillStyle = c1[1] || '#fff'; if (r.sh === 'star') { g.beginPath(); for (let j = 0; j < 8; j++) { const rr = j % 2 ? sz * .4 : sz; g.lineTo(Math.cos(j * Math.PI / 4) * rr, Math.sin(j * Math.PI / 4) * rr); } g.closePath(); g.fill(); } else if (r.sh === 'bubble') { g.strokeStyle = c1[0]; g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, sz * .9, 0, TAU); g.stroke(); } g.restore(); }
          add({ x: q.x + rnd(-4, 4), y: q.y + rnd(-4, 4), vx: rnd(-30, 30) - (b.x - a.x) * .35, vy: rnd(-40, 20), life: rnd(.25, .5), size: rnd(7, 15) * (r.big || 1), size1: 0, color: pk(c1), shape: r.sh === 'flame' ? 'flame' : r.sh === 'bubble' ? 'dot' : r.sh, spin: rnd(-4, 4) }); } });
    }
  } else if (k === 'slash') {
    for (let i = 0; i < (r.claws || 2); i++) { const dy = (i - ((r.claws || 2) - 1) / 2) * 26; add({ x: b.x, y: b.y + dy, life: .22, size: 90, color: c1[0], a0: 1, draw: (g, q) => { const u = 1 - q.life / q.max; g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = c1[1]; g.lineWidth = 9 * (1 - u) + 2; g.lineCap = 'round'; g.shadowColor = c1[0]; g.shadowBlur = 18; g.beginPath(); g.moveTo(q.x - 70 + u * 20, q.y - 56 + dy * 0 + u * 6); g.quadraticCurveTo(q.x + 10, q.y - 10, q.x + 70 - u * 10, q.y + 56 - u * 6); g.stroke(); g.restore(); }, die: null, upd: null }); }
    for (let i = 0; i < 14; i++) add({ ...along(rnd(0, 1)), vx: rnd(60, 160), vy: rnd(-20, 20), life: rnd(.15, .3), size: rnd(4, 8), size1: 0, color: pk(c1), shape: r.sh });
  } else if (k === 'rush' || k === 'wave') {
    const ground = k === 'wave';
    for (let i = 0; i < 34; i++) { const u = i / 34, off = ground ? rnd(-8, 8) : Math.sin(u * 9) * 26; const p = along(u); add({ x: p.x, y: (ground ? Math.max(a.y, b.y) + 26 : p.y) + off, life: dur + .05, max: dur + .05, size: rnd(5, 10) * (ground ? 1.2 : 1), size1: ground ? 2 : 4, color: pk(c1), shape: r.sh, spin: rnd(-8, 8), a0: .95, fi: u * dur, upd: (q, dt, ag) => { q.y += Math.sin(ag * 9 + u * 7) * (ground ? 0 : 40) * dt; } }); }
  } else if (k === 'rings') {
    for (let i = 0; i < 5; i++) { const t0 = i * .035; add({ x: a.x, y: a.y, life: dur + .03, size: 12, size1: 46, color: c1[i % c1.length], shape: 'ring', a0: .95, fi: t0, upd: (q, dt, ag) => { const p = along(Math.min(1, ag)); q.x = p.x; q.y = p.y + Math.sin(ag * 3) * 10; } }); if (r.sh === 'moon') add({ x: a.x, y: a.y, life: dur + .02, size: 18, size1: 18, color: c1[1], shape: 'moon', upd: (q, dt, ag) => { const p = along(Math.min(1, ag)); q.x = p.x; q.y = p.y; q.rot = ag * 8; } }); }
  } else if (k === 'beam') {
    add({ x: a.x, y: a.y, life: dur + .08, size: 1, draw: (g, q) => { const u = 1 - q.life / q.max, w = Math.sin(Math.min(1, u * 1.3) * Math.PI) * 26 + 6; g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.strokeStyle = c1[0]; g.lineWidth = w * 1.6; g.globalAlpha = .45; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(a.x + (b.x - a.x) * Math.min(1, u * 1.6), a.y + (b.y - a.y) * Math.min(1, u * 1.6)); g.stroke(); g.strokeStyle = c1[1]; g.lineWidth = w * .6; g.globalAlpha = .95; g.stroke(); g.restore(); } });
    for (let i = 0; i < 18; i++) add({ ...along(rnd(0, 1)), vx: rnd(-20, 20), vy: rnd(-30, 30), life: rnd(.2, .35), size: rnd(3, 7), size1: 0, color: pk(c1) });
  }
  /* sparkle at the muzzle on release */
  add({ x: a.x, y: a.y, life: .16, size: 6, size1: 34, color: c1[1] || '#fff', a0: .9 });
};

/* contact: flash, shockwave, sparks and a flavour specific to the move */
const FLAV = {
  fire: (p, c) => { for (let i = 0; i < 26; i++) add({ x: p.x, y: p.y, vx: rnd(-150, 150), vy: rnd(-220, -20), ay: 160, life: rnd(.4, .9), size: rnd(5, 12), size1: 0, color: pk(c), shape: 'flame' }); for (let i = 0; i < 8; i++) add({ x: p.x + rnd(-20, 20), y: p.y, vy: rnd(-60, -30), life: 1, size: 14, size1: 30, color: '#5a3a3a', add: 0, a0: .35, shape: 'dot' }); },
  sand: (p, c) => { for (let i = 0; i < 90; i++) add({ x: p.x + rnd(-20, 20), y: p.y + 16, vx: rnd(-240, 240), vy: rnd(-260, -30), ay: 420, life: rnd(.6, 1.2), size: rnd(3.5, 8), color: pk(c), shape: 'sand', rot: rnd(0, 3), spin: rnd(-6, 6), add: 0 }); for (let i = 0; i < 12; i++) add({ x: p.x + rnd(-50, 50), y: p.y + 22, vx: rnd(-90, 90), vy: rnd(-70, -10), life: 1.1, size: 28, size1: 70, color: '#e0b878', shape: 'cloud', add: 0, a0: .7 }); },
  ice: (p, c) => { for (let i = 0; i < 18; i++) { const a = rnd(0, TAU); add({ x: p.x, y: p.y, vx: Math.cos(a) * rnd(90, 210), vy: Math.sin(a) * rnd(90, 210), life: rnd(.4, .7), size: rnd(6, 12), size1: 2, color: pk(c), shape: 'shard', rot: a, spin: 2 }); } for (let i = 0; i < 12; i++) add({ x: p.x, y: p.y, vx: rnd(-90, 90), vy: rnd(-120, 30), ay: 60, life: 1, size: rnd(4, 7), color: '#fff', shape: 'snow', spin: 3, add: 0 }); },
  water: (p, c) => { for (let i = 0; i < 16; i++) add({ x: p.x, y: p.y, vx: rnd(-170, 170), vy: rnd(-230, -60), ay: 420, life: rnd(.5, .9), size: rnd(3, 6), color: pk(c), shape: 'dot' }); for (let i = 0; i < 8; i++) add({ x: p.x + rnd(-30, 30), y: p.y + rnd(-20, 20), vy: rnd(-30, -60), life: rnd(.6, 1), size: rnd(8, 14), color: '#d9fff8', shape: 'bubble', add: 0 }); },
  leaf: (p, c) => { for (let i = 0; i < 22; i++) { const a = rnd(0, TAU); add({ x: p.x, y: p.y, vx: Math.cos(a) * rnd(60, 190), vy: Math.sin(a) * rnd(60, 190) - 40, ay: 120, life: rnd(.7, 1.2), size: rnd(6, 11), color: pk(c), shape: pk(['leaf', 'seed']), spin: rnd(-8, 8), add: 0 }); } },
  star: (p, c) => { for (let i = 0; i < 24; i++) { const a = rnd(0, TAU); add({ x: p.x, y: p.y, vx: Math.cos(a) * rnd(60, 220), vy: Math.sin(a) * rnd(60, 220), drag: 1.4, life: rnd(.5, .9), size: rnd(6, 13), size1: 0, color: pk(c), shape: 'star', spin: rnd(-6, 6) }); } },
  gold: (p, c) => { for (let i = 0; i < 26; i++) { const a = rnd(0, TAU); add({ x: p.x, y: p.y, vx: Math.cos(a) * rnd(60, 230), vy: Math.sin(a) * rnd(60, 230), drag: 1.6, life: rnd(.4, .8), size: rnd(4, 9), size1: 0, color: pk(c), shape: pk(['star', 'dot']), spin: rnd(-6, 6) }); } },
  petal: (p, c) => { for (let i = 0; i < 24; i++) { const a = rnd(0, TAU); add({ x: p.x, y: p.y, vx: Math.cos(a) * rnd(40, 170), vy: Math.sin(a) * rnd(40, 170) - 30, ay: 90, life: rnd(.8, 1.3), size: rnd(6, 11), color: pk(c), shape: 'petal', spin: rnd(-8, 8), add: 0 }); } },
  paper: (p, c) => { for (let i = 0; i < 14; i++) { const a = rnd(0, TAU); add({ x: p.x, y: p.y, vx: Math.cos(a) * rnd(40, 160), vy: Math.sin(a) * rnd(40, 160) - 40, ay: 120, life: rnd(.8, 1.3), size: rnd(8, 12), color: pk(c), shape: 'page', spin: rnd(-8, 8), add: 0 }); } },
  rainbow: (p, c) => { for (let i = 0; i < 5; i++) add({ x: p.x, y: p.y, life: .5, size: 8, size1: 40 + i * 16, color: c[i % c.length], shape: 'ring', a0: .9, fi: i * .03 }); FLAV.star(p, c); },
  moon: (p, c) => { for (let i = 0; i < 12; i++) { const a = rnd(0, TAU); add({ x: p.x, y: p.y, vx: Math.cos(a) * rnd(60, 160), vy: Math.sin(a) * rnd(60, 160), drag: 1.2, life: rnd(.6, 1), size: rnd(7, 13), color: pk(c), shape: 'moon', spin: rnd(-6, 6) }); } FLAV.star(p, c); },
  cloud: (p, c) => { for (let i = 0; i < 12; i++) add({ x: p.x + rnd(-30, 30), y: p.y + rnd(-20, 20), vx: rnd(-80, 80), vy: rnd(-70, 10), life: rnd(.6, 1), size: rnd(14, 26), size1: 36, color: '#ffffff', shape: 'cloud', add: 0, a0: .7 }); },
  dust: (p, c) => { for (let i = 0; i < 12; i++) add({ x: p.x + rnd(-24, 24), y: p.y + 18, vx: rnd(-120, 120), vy: rnd(-60, 0), life: rnd(.5, .8), size: rnd(10, 20), size1: 26, color: '#e8d9b8', shape: 'cloud', add: 0, a0: .5 }); FLAV.star(p, c); },
  air: (p, c) => { for (let i = 0; i < 16; i++) { const a = rnd(0, TAU); add({ x: p.x, y: p.y, vx: Math.cos(a) * rnd(80, 200), vy: Math.sin(a) * rnd(80, 200), drag: 1, life: rnd(.4, .8), size: rnd(8, 14), color: pk(c), shape: 'feather', rot: a, spin: rnd(-6, 6), add: 0 }); } },
  amber: (p, c) => { for (let i = 0; i < 20; i++) { const a = rnd(0, TAU); add({ x: p.x, y: p.y, vx: Math.cos(a) * rnd(70, 210), vy: Math.sin(a) * rnd(70, 210), drag: 1.2, life: rnd(.4, .8), size: rnd(6, 12), size1: 0, color: pk(c), shape: 'shard', rot: a, spin: 3 }); } },
};
FX.impact = (id, dstEl, power = 1) => {
  const r = G.moveRecipe(id), p = FX.box(dstEl, .45, .5), c = r.c; stamp('impact', { move: id, x: Math.round(p.x), y: Math.round(p.y) });
  add({ x: p.x, y: p.y, life: .26, size: 24, size1: 190 * power, color: c[1] || '#fff', a0: .95 });
  for (let i = 0; i < 2; i++) add({ x: p.x, y: p.y, life: .4 + i * .1, size: 12, size1: (150 + i * 70) * power, color: c[i], shape: 'ring', a0: .9 });
  for (let i = 0; i < 28; i++) { const a = rnd(0, TAU); add({ x: p.x, y: p.y, vx: Math.cos(a) * rnd(120, 340), vy: Math.sin(a) * rnd(120, 340), drag: 2.2, life: rnd(.3, .65), size: rnd(4, 10), size1: 0, color: pk(c) }); }
  (FLAV[r.imp] || FLAV.gold)(p, c); FX.freeze = 60 + (power > 1 ? 40 : 0);
};
/* pounce and the other dash moves: after-images and a dust trail while the sprite itself travels (see animSprite) */
FX.trail = (srcEl, id, ms) => { const r = G.moveRecipe(id), t0 = performance.now(); const tick = () => { if (!FX.cv || performance.now() - t0 > ms) return; const b = FX.box(srcEl, .5, .85); add({ x: b.x, y: b.y, vx: rnd(-30, 30), vy: rnd(-20, 5), life: .4, size: rnd(10, 20), size1: 4, color: pk(r.c), shape: r.sh === 'cloud' ? 'cloud' : 'dot', a0: .7 }); setTimeout(tick, 30); }; tick(); };
FX.shield = (el, id) => { const r = G.moveRecipe(id || 'guard'), p = FX.box(el, .5, .5), sz = Math.max(el.getBoundingClientRect().width, 100) * .7;
  for (let i = 0; i < 3; i++) add({ x: p.x, y: p.y, life: .6 + i * .12, size: sz * .3, size1: sz * (.9 + i * .15), color: r.c[i % r.c.length], shape: 'ring', a0: .9, fi: i * .04 });
  for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; add({ x: p.x + Math.cos(a) * sz, y: p.y + Math.sin(a) * sz * .9, life: .7, size: 7, size1: 0, color: pk(r.c), shape: 'star', vx: Math.cos(a) * 20, vy: Math.sin(a) * 20, spin: 3 }); } };
FX.defeat = el => { const p = FX.box(el, .5, .5), sz = el.getBoundingClientRect().width;
  for (let i = 0; i < 4; i++) add({ x: p.x, y: p.y, life: .6 + i * .1, size: 20, size1: sz * (.8 + i * .25), color: ['#ffffff', '#ffd23f', '#ff8fc7', '#8fd8ff'][i], shape: 'ring', a0: .95, fi: i * .06 });
  for (let i = 0; i < 46; i++) { const a = rnd(0, TAU); add({ x: p.x + rnd(-sz * .25, sz * .25), y: p.y + rnd(-sz * .25, sz * .25), vx: Math.cos(a) * rnd(50, 220), vy: Math.sin(a) * rnd(50, 220) - 70, ay: 80, life: rnd(.8, 1.5), size: rnd(5, 11), size1: 0, color: pk(['#ffffff', '#ffd23f', '#ff8fc7', '#8fd8ff', '#b39bff']), shape: pk(['star', 'dot']), spin: rnd(-5, 5) }); } };
FX.enemyAttack = (fromEl, toEl, color) => { const a = FX.box(fromEl, .3, .5), b = FX.box(toEl, .5, .5);
  for (let i = 0; i < 22; i++) { const u = i / 22; add({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u + Math.sin(u * 8) * 16, life: .3 + u * .12, size: rnd(6, 12), size1: 0, color, a0: .9, fi: u * .24 }); }
  add({ x: b.x, y: b.y, life: .3, size: 10, size1: 90, color: '#ffffff', a0: .8, fi: .2 }); for (let i = 0; i < 14; i++) { const a2 = rnd(0, TAU); add({ x: b.x, y: b.y, vx: Math.cos(a2) * rnd(70, 200), vy: Math.sin(a2) * rnd(70, 200), drag: 2, life: rnd(.3, .6), size: rnd(3, 7), size1: 0, color, fi: .2 }); } };
FX.charge = (el, color) => { const p = FX.box(el, .5, .5), sz = Math.max(el.getBoundingClientRect().width, 120);
  for (let i = 0; i < 30; i++) { const a = rnd(0, TAU), d = rnd(.5, .8) * sz; add({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, life: rnd(.4, .7), size: rnd(4, 8), size1: 1, color, upd: q => { q.vx = (p.x - q.x) * 4; q.vy = (p.y - q.y) * 4; } }); }
  add({ x: p.x, y: p.y, life: .7, size: sz * .7, size1: 14, color, shape: 'ring', a0: .8 }); };

/* floating damage number over a target */
FX.number = (text, el, cls = '') => { if (!FX.arena) return; const p = FX.box(el, .45, .3), d = document.createElement('span'); d.className = 'dmg ' + cls; d.textContent = text; d.style.left = p.x + 'px'; d.style.top = p.y + 'px'; FX.arena.appendChild(d); setTimeout(() => d.remove(), 1100); };

/* ---------- sprite animation (Web Animations, on the outer .fighter box) ---------- */
const A = (el, kf, o = {}) => { if (!el || calm()) return null; return el.animate(kf, { duration: 300, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'none', ...o }); };
G.spr = {
  idle(inner, ph = 0) { if (!inner || calm()) return; inner.animate([{ transform: 'translateY(0) scale(1,1)' }, { transform: 'translateY(-7px) scale(.985,1.025)' }, { transform: 'translateY(0) scale(1,1)' }], { duration: 2000 + ph * 260, iterations: Infinity, easing: 'ease-in-out', delay: -ph * 380 }); },
  windup(el, id) { const r = G.moveRecipe(id); A(el, [{ transform: 'none', filter: 'none' }, { transform: 'translate(-20px,3px) scale(1.05,.9) rotate(-4deg)', filter: `brightness(1.25) drop-shadow(0 0 14px ${r.c[0]})` }], { duration: 160, fill: 'forwards', easing: 'ease-out' }); },
  strike(el, dx = 56) { A(el, [{ transform: 'translate(-20px,3px) scale(1.05,.9) rotate(-4deg)' }, { transform: `translate(${dx}px,-8px) scale(1.12) rotate(5deg)`, offset: .6 }, { transform: `translate(${dx * .7}px,-4px) scale(1.06) rotate(3deg)` }], { duration: 230, fill: 'forwards', easing: 'cubic-bezier(.2,.9,.3,1)' }); },
  recover(el) { A(el, [{ transform: 'translate(40px,-4px) scale(1.05) rotate(3deg)' }, { transform: 'translate(-6px,2px) scale(.97,1.04)' }, { transform: 'none' }], { duration: 300, fill: 'forwards' }); },
  dash(el, dx, id) { A(el, [{ transform: 'none' }, { transform: 'translate(-24px,3px) scale(1.06,.88) rotate(-5deg)', offset: .15 }, { transform: `translate(${dx}px,-12px) scale(1.1) rotate(6deg)`, offset: .6 }, { transform: `translate(${dx}px,-6px) scale(1.08) rotate(4deg)`, offset: .64 }, { transform: 'none' }], { duration: 650, fill: 'none' }); FX.trail(el, id, 330); },
  hit(el, big) { A(el, [{ transform: 'none', filter: 'brightness(1)' }, { transform: `translate(${big ? 34 : 22}px,-4px) rotate(${big ? 9 : 5}deg) scale(.92,1.06)`, filter: 'brightness(3.2) saturate(.2)', offset: .2 }, { transform: 'translate(-8px,2px) rotate(-3deg) scale(1.04,.96)', filter: 'brightness(1.4)', offset: .5 }, { transform: 'none', filter: 'brightness(1)' }], { duration: 520 }); },
  cheer(el) { A(el, [{ transform: 'none' }, { transform: 'translateY(-34px) scale(.95,1.08)', offset: .45 }, { transform: 'translateY(0) scale(1.06,.92)', offset: .8 }, { transform: 'none' }], { duration: 520 }); },
  telegraph(el, color) { A(el, [{ transform: 'none', filter: 'none' }, { transform: 'translateY(-12px) scale(1.1)', filter: `brightness(1.3) drop-shadow(0 0 22px ${color})`, offset: .45 }, { transform: 'translateY(-8px) scale(1.07)', filter: `brightness(1.2) drop-shadow(0 0 18px ${color})`, offset: .8 }, { transform: 'none', filter: 'none' }], { duration: 900 }); },
  lunge(el, dx) { A(el, [{ transform: 'none' }, { transform: 'translate(30px,-6px) scale(1.04)', offset: .3 }, { transform: `translate(${dx}px,-4px) scale(1.12) rotate(-6deg)`, offset: .55 }, { transform: 'none' }], { duration: 620 }); },
  defeat(el) { A(el, [{ transform: 'none', opacity: 1, filter: 'none' }, { transform: 'scale(1.12) rotate(-4deg)', filter: 'brightness(2.5)', offset: .25 }, { transform: 'scale(.2) rotate(40deg) translateY(-40px)', opacity: 0, filter: 'brightness(3)' }], { duration: 900, fill: 'forwards', easing: 'ease-in' }); },
};
G.spr.arm = A;
});
