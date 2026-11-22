/* Storyland Quest – Demo Controls: a presenter drawer that works on the synthetic QA adventurer only.
   Every operation checks that QA mode is on. Nothing here touches S.profiles, the classroom dashboard or learner evidence;
   simulated battle outcomes are tagged and never write attempts. */
window.SQ_PARTS.push((G, C) => {
'use strict';
const { S, $, esc } = C, A = G.actions, D = G.D;
const ORDER = G.TRAIL || ['sound', 'castle', 'jungle', 'station', 'orchard', 'mountain', 'cove'];
const STEPS = [['intro', 'Guided intro'], ['minions', 'Minions'], ['elite', 'Elite check'], ['boss', 'Boss review'], ['cleared', 'Chapter cleared']];
const qa = () => (S.qaOn && S.qa && S.current === 'qa' ? S.qa : null);
let LOG = [], open = false, lastFocus = null;
const say = t => { LOG.unshift(t); LOG = LOG.slice(0, 6); const l = $('#dm-log'); if (l) l.innerHTML = logHtml(); };
const logHtml = () => LOG.length ? LOG.map(x => `<li>${x}</li>`).join('') : '<li>Nothing changed yet.</li>';
const note = (p, t) => { p.simLog = [{ at: Date.now(), t }, ...(p.simLog || [])].slice(0, 20); };
const num = v => { const s = String(v).trim(); if (!/^\d{1,8}$/.test(s)) return null; const n = +s; return n <= 10000000 ? n : null; };

/* ---- trail gate + demo preview worlds (QA profile only) ---- */
const cleared = (p, id) => !!(p.ch && p.ch[id] && p.ch[id].cleared);
const _io = G.islandOpen;
G.islandOpen = (p, id) => { if (p && p.qa) { if ((p.demoLock || {})[id]) return false; if (p.trailGate) { const i = ORDER.indexOf(id); return i <= 0 || cleared(p, ORDER[i - 1]); } return true; } return _io(p, id); };
const _dp = G.destPlayable;
G.destPlayable = d => _dp(d) || !!(qa() && (S.qa.demoWorlds || {})[d.id]);
const isDemoOnly = d => !_dp(d) && !!(qa() && (S.qa.demoWorlds || {})[d.id]);
const _sb = G.startBattle;
G.startBattle = spec => { if (qa() && spec && spec.dest) { const d = G.DEST[spec.dest]; if (d && isDemoOnly(d)) spec = { ...spec, title: 'Demo preview (synthetic content) · ' + (spec.title || d.name) }; } return _sb(spec); };
const _claim = G.claim;
G.claim = (p, pd) => { const rc = _claim(p, pd); if (pd && pd.sim && !rc.dup && !(rc.lines || []).some(l => /Simulated/.test(l))) { rc.sim = true; rc.lines = [...(rc.lines || []), '<small>🧪 <b>Simulated demo result.</b> No answers were recorded and this is not learner evidence.</small>']; note(p, 'Simulated result claimed: ' + (pd.title || '')); C.save(); } return rc; };

/* ---- entry point: purple button, top right, on every QA screen including battles ---- */
function fab() {
  let b = $('#demo-fab');
  if (!qa()) { if (b) b.remove(); if (open) close(true); return; }
  if (!b) { b = document.createElement('button'); b.id = 'demo-fab'; b.type = 'button'; b.className = 'demofab'; b.textContent = 'Demo Controls'; b.setAttribute('aria-haspopup', 'dialog'); b.addEventListener('click', toggle); document.body.appendChild(b); }
  b.setAttribute('aria-expanded', String(open));
}
setInterval(fab, 400); fab();

/* ---- drawer ---- */
const lbl = (id, t) => `<label for="${id}">${t}</label>`;
function drawerHtml() {
  const p = S.qa, live = G.btx && G.btx.live();
  const cat = [['prop', 'Furniture', D.props], ['gear', 'Avatar gear', D.avatar.gear], ['cos', 'Cosmetics', D.cosmetics], ['pet', 'Companions', D.families]];
  const worlds = G.WORLDS.filter(w => w[0] !== 'language');
  const wstate = id => { const ds = D.destinations.filter(d => d.subject === id); if (ds.some(_dp)) return 'Reviewed (open)'; return ds.every(d => (p.demoWorlds || {})[d.id]) ? 'Demo preview (synthetic)' : 'Closed'; };
  return `<div class="dm-head"><b>Demo Controls</b><span class="qabadge">QA · synthetic</span><button class="btn sm ghost" data-a="dmClose" id="dm-close" aria-label="Close Demo Controls">✕ Close</button></div>
  <p class="small dm-note">Works on the synthetic QA adventurer only. Simulated actions are tagged and never counted as learner answers.</p>
  ${G.hubMenuHtml ? G.hubMenuHtml() : ''}${G.tourMenuHtml ? G.tourMenuHtml() : ''}
  <details open><summary>Presets</summary><div class="dm-row"><button class="btn sm" data-a="dmPre" data-k="tutor">AI Tutor Demo</button><button class="btn sm" data-a="dmPre" data-k="show">Showcase</button><button class="btn sm" data-a="dmPre" data-k="fresh">Fresh Start (egg)</button></div>
    <div class="dm-row"><button class="btn sm ghost" data-a="dmReset">Reset synthetic default</button><button class="btn sm ghost" data-a="qaDash">⬅ Dashboard</button></div></details>
  <details><summary>Wallet and inventory</summary>
    <div class="dm-grid"><div>${lbl('dm-coins', 'Coins')}<input id="dm-coins" class="inp" inputmode="numeric" value="${p.coins}"></div><div>${lbl('dm-tix', 'Spin tickets')}<input id="dm-tix" class="inp" inputmode="numeric" value="${p.tickets}"></div></div>
    <div class="dm-row"><button class="btn sm" data-a="dmWallet" data-m="set">Set both</button><button class="btn sm" data-a="dmWallet" data-m="add">Add to both</button></div>
    <p class="small" id="dm-wmsg" role="status">Now: ${p.coins.toLocaleString()} coins · ${p.tickets} tickets</p>
    <div class="dm-row"><button class="btn sm" data-a="dmGrant" data-k="all">Grant everything</button></div>
    <div class="dm-row">${lbl('dm-item', 'One item')}<select id="dm-item" class="inp sel">${cat.map(([k, t, list]) => `<optgroup label="${t}">${list.map(x => `<option value="${k}:${esc(x.id)}">${esc(x.name || x.id)}</option>`).join('')}</optgroup>`).join('')}</select><button class="btn sm" data-a="dmGrant" data-k="one">Grant</button></div></details>
  <details><summary>Worlds and chapters</summary>
    <div class="dm-row">${lbl('dm-ch', 'Chapter')}<select id="dm-ch" class="inp sel">${ORDER.map(id => `<option value="${id}">${esc(G.DEST[id].name)}</option>`).join('')}</select>${lbl('dm-st', 'Step')}<select id="dm-st" class="inp sel">${STEPS.map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></div>
    <div class="dm-row"><button class="btn sm" data-a="dmStep">Set step</button><button class="btn sm" data-a="dmOpenCh">Open chapter battle</button></div>
    <div class="dm-row"><button class="btn sm" data-a="dmTrail" data-k="unlock">Unlock all reviewed destinations</button><button class="btn sm ghost" data-a="dmTrail" data-k="reset">Reset the trail</button></div>
    <div class="dm-row"><button class="btn sm ghost" data-a="dmLock">Lock / unlock selected chapter</button></div>
    <ul class="dm-worlds">${worlds.map(([id, t, ic]) => `<li><span>${ic} ${t}: <small>${wstate(id)}</small></span>${D.destinations.some(d => d.subject === id && _dp(d)) ? '' : `<button class="btn sm ghost" data-a="dmWorld" data-w="${id}">${wstate(id).startsWith('Demo') ? 'Close' : 'Open as demo'}</button>`}</li>`).join('')}</ul></details>
  <details open><summary>Battle shortcuts</summary>
    <p class="small">${live ? 'A battle is open. Real answers still work and stay in the QA save.' : 'Open a battle first, or jump straight to a boss.'}</p>
    <div class="dm-row"><button class="btn sm" data-a="dmBoss">Jump to selected chapter's boss</button></div>
    <div class="dm-row"><button class="btn sm" data-a="dmBt" data-k="move" ${live ? '' : 'disabled'}>Move preview</button><button class="btn sm" data-a="dmBt" data-k="wrong" ${live ? '' : 'disabled'}>Simulate wrong answer</button></div>
    <div class="dm-row"><button class="btn sm" data-a="dmBt" data-k="resolve" ${live ? '' : 'disabled'}>Resolve encounter (simulated)</button><button class="btn sm" data-a="dmBt" data-k="results" ${live ? '' : 'disabled'}>Skip to results (simulated)</button></div></details>
  <details><summary>Classroom run order</summary><ol class="small dm-guide"><li><b>AI Tutor Demo:</b> opens the teacher view with Ari, the telescope passage and approval ticked. Load the offline fixture (or draft live), approve, then Play as Ari.</li><li>Choose the bench → read Pip's clue → Retry → answer the fresh item.</li><li><b>Showcase</b> → Jump to a boss → Move preview, Simulate wrong answer, Skip to results.</li><li>Reset synthetic default, then Dashboard.</li></ol></details>
  <h4>What changed</h4><ul class="dm-log small" id="dm-log" aria-live="polite">${logHtml()}</ul>`;
}
function openDrawer() {
  if (!qa() || open) return; open = true; lastFocus = document.activeElement;
  const sh = document.createElement('div'); sh.id = 'dm-wrap'; sh.className = 'dmwrap';
  sh.innerHTML = `<div class="dm-scrim" data-a="dmClose"></div><aside class="dmdrawer" role="dialog" aria-modal="true" aria-label="Demo Controls" tabindex="-1">${drawerHtml()}</aside>`;
  document.body.appendChild(sh); fab(); const f = $('#dm-close'); if (f) f.focus();
}
function close(quiet) { const w = $('#dm-wrap'); if (w) w.remove(); open = false; const b = $('#demo-fab'); if (b) b.setAttribute('aria-expanded', 'false'); if (!quiet && lastFocus && document.contains(lastFocus)) lastFocus.focus(); else if (!quiet && b) b.focus(); }
function toggle() { open ? close() : openDrawer(); }
const redraw = () => { const d = $('.dmdrawer'); if (!d) return; const vals = {}; d.querySelectorAll('select[id],input[id]').forEach(x => { vals[x.id] = x.value; }); const keep = d.scrollTop, op = [...d.querySelectorAll('details')].map(x => x.open), act = document.activeElement && document.activeElement.id; d.innerHTML = drawerHtml(); Object.keys(vals).forEach(k => { const x = document.getElementById(k); if (x && !/^dm-(coins|tix)$/.test(k)) x.value = vals[k]; }); d.scrollTop = keep; d.querySelectorAll('details').forEach((x, i) => { if (op[i] != null) x.open = op[i]; }); const a = act && document.getElementById(act); if (a) a.focus(); };
document.addEventListener('keydown', e => {
  if (!open) return; const d = $('.dmdrawer'); if (!d) return;
  if (e.key === 'Escape') { e.preventDefault(); close(); return; }
  if (e.key === 'Tab') { const f = [...d.querySelectorAll('button:not([disabled]),input,select,summary,[tabindex]:not([tabindex="-1"])')].filter(x => x.offsetParent !== null); if (!f.length) return; const a = f[0], z = f[f.length - 1];
    if (!d.contains(document.activeElement)) { e.preventDefault(); a.focus(); } else if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
});
const refreshView = () => { if (G.btx && G.btx.live()) return; if (!S.qaOn) return; const h = location.hash; if (h === '#qa') return G.qaScreen(); G.map(); };

/* ---- actions ---- */
A.dmClose = () => close();
A.dmWallet = d => { const p = qa(); if (!p) return; const c = num(($('#dm-coins') || {}).value), t = num(($('#dm-tix') || {}).value), m = $('#dm-wmsg');
  if (c === null || t === null) { if (m) m.textContent = 'Enter whole numbers from 0 to 10,000,000.'; const bad = c === null ? $('#dm-coins') : $('#dm-tix'); bad && bad.focus(); return; }
  const b = [p.coins, p.tickets]; if (d.m === 'add') { p.coins += c; p.tickets += t; } else { p.coins = c; p.tickets = t; }
  note(p, `Wallet ${d.m}: coins ${b[0]} → ${p.coins}, tickets ${b[1]} → ${p.tickets}`); C.save(); const msg = `Coins ${b[0].toLocaleString()} → ${p.coins.toLocaleString()} · tickets ${b[1]} → ${p.tickets}`; say(msg); redraw(); const m2 = $('#dm-wmsg'); if (m2) m2.textContent = 'Now: ' + msg; refreshView(); };
function grant(p, k, id) {
  if (k === 'prop' && !p.room.owned.includes(id)) { p.room.owned.push(id); return 1; }
  if (k === 'gear' && !p.gear.owned.includes(id)) { p.gear.owned.push(id); return 1; }
  if (k === 'cos' && !p.cosOwned.includes(id)) { p.cosOwned.push(id); return 1; }
  if (k === 'pet' && !p.zoo.some(z => z.fam === id)) { const z = G.addInst(p, id, { name: G.FAM[id].name, xp: 500 }); z.iid = 'qa_' + id; return 1; }
  return 0;
}
A.dmGrant = d => { const p = qa(); if (!p) return; let n = 0;
  if (d.k === 'all') { D.props.forEach(x => n += grant(p, 'prop', x.id)); D.avatar.gear.forEach(x => n += grant(p, 'gear', x.id)); D.cosmetics.forEach(x => n += grant(p, 'cos', x.id)); D.families.forEach(x => n += grant(p, 'pet', x.id)); p.bag = { clue: 99, look: 99, bubble: 99, double: 99 }; say(`Granted ${n} new items, pets and gear (bag topped up to 99).`); }
  else { const v = ($('#dm-item') || {}).value || ''; const [k, ...r] = v.split(':'); n = grant(p, k, r.join(':')); say(n ? `Granted: ${esc(($('#dm-item').selectedOptions[0] || {}).text || v)}.` : 'Already owned. Nothing changed.'); }
  note(p, 'Grant ' + d.k + ' (' + n + ')'); C.save(); redraw(); refreshView(); };
A.dmStep = () => { const p = qa(); if (!p) return; const id = $('#dm-ch').value, k = $('#dm-st').value, i = STEPS.findIndex(s => s[0] === k);
  p.ch = p.ch || {}; p.ch[id] = { intro: i > 0 ? 1 : 0, minions: i > 1 ? 1 : 0, elite: i > 2 ? 1 : 0, boss: i > 3 ? 1 : 0, cleared: i > 3 ? 1 : 0, replayDay: '' }; note(p, `Step set: ${id} → ${k}`); C.save(); say(`${esc(G.DEST[id].name)} is now at: ${STEPS[i][1]}.`); redraw(); refreshView(); };
A.dmOpenCh = () => { const p = qa(); if (!p) return; const id = $('#dm-ch').value, st = (p.ch || {})[id] || {}; const s = STEPS.slice(0, 4).find(x => !st[x[0] === 'boss' ? 'cleared' : x[0]]); close(true); A.gChapter({ id, s: s ? s[0] : 'intro' }); };
A.dmBoss = () => { const p = qa(); if (!p) return; const id = ($('#dm-ch') || {}).value || 'mountain'; if (!G.islandOpen(p, id)) { say('That chapter is locked. Unlock it first.'); return; } say(`Jumped to the ${esc(G.DEST[id].name)} boss.`); close(true); if (G.btx && G.btx.live()) G.leave(true); A.gChapter({ id, s: 'boss' }); };
A.dmTrail = d => { const p = qa(); if (!p) return;
  if (d.k === 'unlock') { p.trailGate = false; p.demoLock = {}; say('All reviewed destinations are open.'); }
  else { p.ch = {}; p.demoLock = {}; p.trailGate = true; say('Trail reset: Sound Island is open, the rest unlock in order.'); }
  note(p, 'Trail ' + d.k); C.save(); redraw(); refreshView(); };
A.dmLock = () => { const p = qa(); if (!p) return; const id = $('#dm-ch').value; p.demoLock = p.demoLock || {}; if (p.demoLock[id]) delete p.demoLock[id]; else p.demoLock[id] = 1; say(`${esc(G.DEST[id].name)} is now ${p.demoLock[id] ? 'locked' : 'unlocked'}.`); note(p, 'Lock toggle ' + id); C.save(); redraw(); refreshView(); };
A.dmWorld = d => { const p = qa(); if (!p) return; p.demoWorlds = p.demoWorlds || {}; const ds = D.destinations.filter(x => x.subject === d.w), on = ds.every(x => p.demoWorlds[x.id]);
  ds.forEach(x => { if (on) delete p.demoWorlds[x.id]; else p.demoWorlds[x.id] = 1; }); say(`${esc((G.WORLDS.find(w => w[0] === d.w) || [])[1] || d.w)}: ${on ? 'closed' : 'opened as a clearly marked demo preview with synthetic questions'}.`); note(p, 'World ' + d.w + (on ? ' closed' : ' demo-open')); C.save(); redraw(); refreshView(); };
A.dmBt = d => { if (!qa() || !G.btx || !G.btx.live()) return;
  if (d.k === 'move') { const z = G.btx.active(), eq = (z && (S.qa.equip || {})[z.iid]) || [], id = eq.find(m => G.MOVE[m] && !G.MOVE[m].support) || 'pounce'; close(true); const ok = G.btx.preview(id); say(ok ? `Move preview: ${esc(G.MOVE[id].name)} (nothing recorded).` : 'The arena is not ready yet.'); }
  else if (d.k === 'wrong') { close(true); G.btx.simCounter(); say('Simulated wrong answer: counterattack preview only.'); note(S.qa, 'Simulated wrong answer (no attempt recorded)'); }
  else if (d.k === 'resolve') { close(true); G.btx.resolve(); say('Encounter resolved (simulated).'); note(S.qa, 'Simulated resolve'); }
  else if (d.k === 'results') { close(true); if (G.btx.results()) { note(S.qa, 'Simulated skip to results'); say('Skipped to results (simulated).'); } } C.save(); };

/* ---- presets and reset ---- */
function freshEgg() { const p = S.qa; p.demoQuest = true; p.zoo = []; p.team = []; const z = G.addInst(p, 'dragon', { name: G.FAM.dragon.name }); z.iid = 'qa_egg0'; p.pet = 'dragon'; p.petName = z.name; p.coins = 20; p.tickets = 0; p.bag = { clue: 1, look: 1, bubble: 1, double: 0 };
  p.room = { items: [], owned: [], accent: 0, theme: 'lodge', pets: [] }; p.gear = { owned: [], on: {} }; p.cosOwned = []; p.equip = {}; p.ch = {}; p.stats = { wins: 0, bossWins: 0, byDest: {}, correctSkill: {}, dailyClaims: 0 }; p.attempts = []; p.receipts = []; p.pending = null; p.revq = []; p.story = {}; p.atlas = []; p.badges = [];
  p.quest = { step: 'warm', egg: z.iid }; p.trailGate = true; p.demoLock = {}; p.demoWorlds = {}; }
A.dmPre = d => { if (!qa()) return; close(true); const keepSim = S.qa.simLog || [];
  if (d.k === 'show') { S.qa = null; S.qaOn = true; S.current = 'qa'; A.qaReset(); S.qa.trailGate = false; S.qa.demoWorlds = Object.fromEntries(D.destinations.filter(x => !_dp(x)).map(x => [x.id, 1])); S.qa.simLog = keepSim; note(S.qa, 'Preset: Showcase'); C.save(); G.map(); }
  else if (d.k === 'fresh') { A.qaReset(); freshEgg(); note(S.qa, 'Preset: Fresh Start with an egg'); C.save(); G.map(); }
  else if (d.k === 'tutor') { A.qaReset(); S.qa.trailGate = false; note(S.qa, 'Preset: AI Tutor Demo'); S.qaOn = false; S.current = null; C.save(); const t = window.SQ_TEACH_API; C.dash(); if (t && t.demoReady) t.demoReady(); } };
A.dmReset = () => { if (!qa()) return; close(true); A.qaReset(); S.qa.trailGate = false; C.save(); G.map(); };
document.addEventListener('change', () => {});
});
