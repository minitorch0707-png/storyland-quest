/* Storyland Quest – game polish: answer streaks, danger vignette and victory shower in battles; staggered, animated adventure map.
   Hooks only into the existing sound event stream (G.fx.stamp) and the DOM, so it never changes game rules or saves. */
window.SQ_PARTS.push((G, C) => {
'use strict';
const { S, $ } = C;
const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
let ac = null;
const blip = (freqs, type = 'triangle', vol = .06, gap = .08) => {
  if (!S.settings.sound) return;
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const t0 = ac.currentTime;
    freqs.forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(), t = t0 + i * gap; o.type = type; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + gap * 1.8); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + gap * 2); });
  } catch (e) {}
};
let streak = 0, lastArena = null;
const arena = () => document.getElementById('bt-arena');
const pop = (html, cls) => { const a = arena(); if (!a) return; const el = document.createElement('div'); el.className = 'pl-pop ' + (cls || ''); el.innerHTML = html; a.appendChild(el); setTimeout(() => el.remove(), 1300); };
const flash = cls => { const a = arena(); if (!a || reduce()) return; a.classList.remove('pl-danger', 'pl-glow'); void a.offsetWidth; a.classList.add(cls); setTimeout(() => a.classList.remove(cls), 900); };
const RISE = [523, 587, 659, 784, 880, 1047, 1175, 1319];

function onSfx(id) {
  if (id === 'answer-correct') {
    streak++;
    if (streak >= 2) { const n = Math.min(streak, 8); setTimeout(() => blip([RISE[n - 1], RISE[n - 1] * 1.5], 'sine', .05, .07), 120);
      pop(`<b>${streak >= 5 ? '🔥' : '⚡'} ${streak} in a row!</b>`, streak >= 5 ? 'hot' : ''); flash('pl-glow'); if (C.confetti && streak >= 4) C.confetti(6, ['✨']); }
  } else if (id === 'answer-retry') {
    if (streak >= 3) pop('<b>Streak paused</b><small>Next one starts a new streak</small>', 'soft');
    streak = 0;
  } else if (/-telegraph$|^cog-windup$/.test(id)) { flash('pl-danger'); blip([196, 165], 'sawtooth', .035, .12); }
  else if (id === 'victory') {
    streak = 0; blip([523, 659, 784, 1047, 1319], 'triangle', .05, .09);
    const a = arena(); if (a && !reduce()) for (let i = 0; i < 14; i++) { const s = document.createElement('span'); s.className = 'pl-star'; s.textContent = ['⭐', '✨', '🌟'][i % 3];
      s.style.cssText = `left:${8 + Math.random() * 84}%;animation-delay:${i * 60}ms;font-size:${1 + Math.random() * 1.2}rem`; a.appendChild(s); setTimeout(() => s.remove(), 2200); }
  }
}
function wrap() {
  if (!G.fx || !G.fx.stamp || G.fx.stamp.__pl) return;
  const orig = G.fx.stamp; const w = (ev, extra) => { try { if (ev === 'sfx' && extra) onSfx(extra.id); } catch (e) {} return orig(ev, extra); }; w.__pl = true; G.fx.stamp = w;
}
wrap();

/* ---------- adventure map ---------- */
let mapSeen = null;
function mapPolish() {
  const tp = document.querySelector('.trailpage'); if (!tp) { mapSeen = null; return; } if (mapSeen === tp) return; mapSeen = tp;
  if (reduce()) return;
  tp.classList.add('tp-in'); tp.querySelectorAll('.ccard,.stop,.optional,.petcard,.worlds').forEach((el, i) => el.style.setProperty('--d', Math.min(i, 12) * 55 + 'ms'));
  if (G.playSfx) { try { G.playSfx('ui-open'); } catch (e) {} }
  const cur = tp.querySelector('.stop.current .node'); if (cur) cur.classList.add('pl-beacon');
  tp.querySelectorAll('.stop.complete .node').forEach((n, i) => setTimeout(() => n.classList.add('pl-shine'), 500 + i * 160));
}
let raf = 0;
new MutationObserver(() => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; wrap(); mapPolish(); if (!arena()) { streak = 0; lastArena = null; } else if (arena() !== lastArena) { lastArena = arena(); streak = 0; } }); })
  .observe(document.documentElement, { childList: true, subtree: true });

/* soft tick when tapping an open island on the map */
document.addEventListener('pointerdown', e => { const b = e.target.closest && e.target.closest('.stopb,.ccard .btn,.worlds .wtab'); if (b) blip([740], 'sine', .03, .05); }, true);
});
