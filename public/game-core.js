/* Storyland Quest – game core: saved-profile migration, avatar, header and navigation, world map,
   destination panel, Pip's Pick and My Progress. Other parts (battle, pets, rewards) register on the same G object. */
window.SQ_PARTS = window.SQ_PARTS || [];
window.SQ_GAME = function install(C) { const G = { C, actions: {} }; window.SQ_PARTS.forEach(part => part(G, C)); return G; };

window.SQ_PARTS.push((G, C) => {
'use strict';
const D = window.SQ_DATA, E = window.SQ_ENGINE;
const { S, $, esc, art, coin, pick, shuffle, clamp, today } = C;
G.D = D; G.E = E;
G.FAM = Object.fromEntries(D.families.map(f => [f.id, f]));
G.DEST = Object.fromEntries(D.destinations.map(d => [d.id, d]));
G.MOVE = Object.fromEntries(D.moves.map(m => [m.id, m]));
G.ENEMY = Object.fromEntries(D.enemies.map(e => [e.id, e]));
G.COS = Object.fromEntries(D.cosmetics.map(c => [c.id, c]));
G.PROP = Object.fromEntries(D.props.map(p => [p.id, p]));
G.STAGES = ['egg', 'baby', 'juvenile', 'adult']; G.STAGE_NAME = ['Egg', 'Baby', 'Juvenile', 'Adult'];
const EVO = [10, 120, 350];
const ALIAS = { cap: 'cap-original', bow: 'bow-original', shades: 'shades-original', tophat: 'tophat-original', grad: 'grad-original', crown: 'crown-original' };
G.cosId = id => ALIAS[id] || id;
G.stageOf = inst => inst.xp < EVO[0] ? 0 : inst.xp < EVO[1] ? 1 : inst.xp < EVO[2] ? 2 : 3;
G.WORLDS = [['language', 'Language', '📚'], ['math', 'Math', '➗'], ['science', 'Science', '🔭'], ['visual-arts', 'Visual Arts', '🎨'], ['history', 'History', '🏛️'], ['french', 'French', '🥖']];
G.readyKey = 'existing-route';
const SUBJ_LABEL = Object.fromEntries(G.WORLDS.map(w => [w[0], w[1]]));
const lvlOf = (xp, mult = 1) => { const t = D.levels.map(x => x * mult); let l = 1; t.forEach((v, i) => { if (xp >= v) l = i + 1; }); return l + Math.max(0, Math.floor((xp - t[t.length - 1]) / (500 * mult))); };
G.lvlOf = lvlOf; G.SUBJ_LABEL = SUBJ_LABEL;

/* ---------- migration: keeps every existing save valid ---------- */
G.migrate = function migrate(p) {
  if (!p || p.v2) return p;
  p.pow = p.pow || { hint: 2, magnet: 0 };
  p.bag = p.bag || { clue: p.pow.hint != null ? p.pow.hint : 2, look: 1, bubble: 1, double: 1 };
  p.zoo = p.zoo || []; p.team = p.team || [];
  const nick = { dragon: 'Ember', bird: 'Skye', sea: 'Splash', cat: 'Whiskers' };
  for (const [fam, o] of Object.entries(p.pets || {})) {
    if (!G.FAM[fam] || p.zoo.some(z => z.fam === fam)) continue;
    const inst = { iid: 'i_' + fam, fam, xp: o.xp || 0, name: (fam === p.pet && p.petName) || nick[fam] || G.FAM[fam].name, cos: {} };
    if (o.hat && G.COS[G.cosId(o.hat)]) inst.cos[G.COS[G.cosId(o.hat)].slot] = G.cosId(o.hat);
    p.zoo.push(inst);
  }
  const lead = p.zoo.find(z => z.fam === p.pet);
  if (lead && G.stageOf(lead) > 0 && !p.team.length) p.team = [lead.iid];
  p.seen = p.seen || {}; p.zoo.forEach(z => { p.seen[z.fam] = true; });
  p.cosOwned = p.cosOwned || [...new Set((p.inv || []).map(G.cosId).filter(id => G.COS[id]))];
  p.av = p.av || null; p.avDone = !!p.avDone;
  p.sx = p.sx || { language: p.xp || 0 }; p.attempts = p.attempts || [];
  p.stats = p.stats || { wins: 0, bossWins: 0, byDest: {}, correctSkill: {}, dailyClaims: 0 };
  p.stk2 = p.stk2 || []; p.placed2 = p.placed2 || { banner: [], board: [] }; p.frame = p.frame || '';
  p.room = p.room || { items: [{ id: 'scholar-desk', slot: 'br' }, { id: 'star-bed', slot: 'fr' }, { id: 'reading-lamp', slot: 'bl' }, { id: 'star-wardrobe', slot: 'fm' }], owned: ['scholar-desk', 'star-bed', 'reading-lamp', 'star-wardrobe'], accent: 0 };
  p.tickets = p.tickets || 0; p.receipts = p.receipts || []; p.quests = p.quests || 0; p.gear = p.gear || { owned: [], on: {} };
  p.login = p.login || { last: '', streak: 0 }; p.dly = p.dly || { day: '', prog: {}, claimed: {}, wins: [], uniq: [] };
  p.world = p.world || 'language'; p.recruited = p.recruited || {};
  p.v2 = true; return p;
};
G.lead = p => p.zoo.find(z => z.iid === p.team[0]) || null;
G.team = p => p.team.map(id => p.zoo.find(z => z.iid === id)).filter(Boolean);
G.inst = (p, iid) => p.zoo.find(z => z.iid === iid);
G.movesOf = inst => { const f = G.FAM[inst.fam], st = G.stageOf(inst), out = []; if (st >= 1) out.push(f.unlocks.baby); if (st >= 2) out.push(f.unlocks.juvenile); if (st >= 3) out.push(f.unlocks.adult); return out; };
G.addInst = (p, fam, extra = {}) => { const inst = { iid: 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), fam, xp: 0, name: G.FAM[fam].name, cos: {}, ...extra }; p.zoo.push(inst); p.seen[fam] = true; return inst; };
G.formOf = inst => G.FAM[inst.fam].forms[G.stageOf(inst)];
/** pet XP: returns events ({hatched, evolved}) and keeps the team valid */
G.gainXp = (p, inst, xp) => { const before = G.stageOf(inst); inst.xp += xp; const after = G.stageOf(inst), ev = { inst, before, after, hatched: before === 0 && after >= 1, evolved: after > before && before >= 1 };
  if (ev.hatched && p.team.length < 3 && !p.team.includes(inst.iid)) p.team.push(inst.iid); return ev; };

/* ---------- pet sprites with cosmetics ---------- */
const FB = (e) => `data-fb="${e}"`;
G.petImg = (inst, cls = '', opts = {}) => {
  const st = G.stageOf(inst), cos = inst.cos || {};
  const over = ['back', 'neck', 'face', 'head'].map(slot => { const c = G.COS[cos[slot]]; return c ? `<img class="cos cos-${slot}" src="assets/cos_${c.base}.png" style="filter:hue-rotate(${c.hue}deg)" alt="" draggable="false">` : ''; }).join('');
  return `<span class="pet ${cls}${opts.dim ? ' dim' : ''}${opts.sil ? ' sil' : ''}"><img class="pimg" src="assets/c/${inst.fam}-${G.STAGES[st]}.png" alt="${esc(inst.name)}" draggable="false" ${FB('🐾')}>${st > 0 ? over : ''}</span>`;
};
G.formImg = (formId, cls = '', sil = false) => `<span class="pet ${cls}${sil ? ' sil' : ''}"><img class="pimg" src="assets/c/${formId}.png" alt="" draggable="false" ${FB('❔')}></span>`;
document.addEventListener('error', e => { const t = e.target; if (t && t.tagName === 'IMG' && t.dataset && t.dataset.fb != null && !t.dataset.dead) { t.dataset.dead = 1; const s = document.createElement('span'); s.className = 'art fbk'; s.textContent = t.dataset.fb || '🖼️'; t.replaceWith(s); } }, true);

/* ---------- avatar: layered SVG from the supplied portrait reference ---------- */
const AV = D.avatar, hexOf = (list, id) => (list.find(r => r[0] === id) || list[0])[1];
G.avDefault = () => ({ v: 1, skin: AV.defaults.skin, hair: AV.defaults.hair, hairColor: AV.defaults.hairColor, eyes: AV.defaults.eyes, eyeColor: AV.defaults.eyeColor, nose: AV.defaults.nose, outfit: AV.defaults.outfit });
G.humanize = id => String(id).replace(/-/g, ' ');
let AVN = 0;
const shade = (hex, k) => { const h = hex.replace('#', ''), n = [0, 2, 4].map(i => Math.max(0, Math.min(255, Math.round(parseInt(h.substr(i, 2), 16) * k)))); return '#' + n.map(v => v.toString(16).padStart(2, '0')).join(''); };
const PANTS = { 'teal-tunic': '#efe2c6', 'star-robe': '#5b2a63', 'navy-jacket': '#7a5636', 'explorer-tunic': '#8a6a45' };
const ACC = { 'teal-tunic': '#f2c230', 'star-robe': '#ffd36b', 'navy-jacket': '#e9edf7', 'explorer-tunic': '#7ba05b' };
/** Stylised adventurer (2D, layered SVG). o.head = head-and-shoulders crop for small portraits; otherwise full body. */
G.avatarSvg = (av, o = {}) => {
  av = { ...G.avDefault(), ...(av || {}) }; const id = 'av' + (++AVN), on = o.gear || {};
  const hair = hexOf(AV.hairColor, av.hairColor), skin = hexOf(AV.skin, av.skin), eye = hexOf(AV.eyeColor, av.eyeColor), outfit = (AV.outfits.find(x => x.id === av.outfit) || AV.outfits[0]).color;
  const pants = PANTS[av.outfit] || '#8a6a45', acc = ACC[av.outfit] || '#f2c230', hs = av.hair, E = (x, y, rx, ry, f, extra = '') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" ${extra}/>`;
  const gi = (n, x, y, w, h) => `<image href="assets/gear_${n.replace(/-/g, '_')}.png" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
  let d = `<defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(skin, 1.08)}"/><stop offset="1" stop-color="${shade(skin, .86)}"/></linearGradient>
    <linearGradient id="${id}o" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(outfit, 1.18)}"/><stop offset="1" stop-color="${shade(outfit, .72)}"/></linearGradient>
    <linearGradient id="${id}h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(hair, 1.45)}"/><stop offset=".5" stop-color="${hair}"/><stop offset="1" stop-color="${shade(hair, .65)}"/></linearGradient>
    <radialGradient id="${id}e" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="${shade(eye, 1.7)}"/><stop offset="1" stop-color="${shade(eye, .6)}"/></radialGradient>
    <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5532"/><stop offset="1" stop-color="#5a331c"/></linearGradient></defs>`;
  if (!o.head) {
    if (on.cape) d += gi(on.cape, 30, 140, 170, 200);
    /* legs and boots */
    for (const sx of [-1, 1]) {
      const cx = 115 + sx * 20;
      d += `<path d="M${cx - 17} 250 L${cx + 17} 250 L${cx + 14} 312 L${cx - 14} 312 Z" fill="${pants}"/><path d="M${cx - 15} 296 h30 v14 h-30z" fill="${shade(pants, .85)}"/>`;
      d += `<path d="M${cx - 17} 306 h34 l2 22 q4 14 -8 16 h-30 q-12 -2 -6 -16z" fill="url(#${id}b)"/><path d="M${cx - 19} 338 h40 v8 h-40z" fill="#3b2216"/>`;
      d += `<path d="M${cx - 8} 312 h16 M${cx - 8} 319 h16 M${cx - 8} 326 h16" stroke="#e9c987" stroke-width="2" stroke-linecap="round"/><path d="M${cx - 17} 306 h34" stroke="#f2e6cf" stroke-width="5" stroke-linecap="round" opacity=".85"/>`;
    }
    /* arms */
    d += `<path d="M62 160 q-26 34 -20 74" stroke="url(#${id}o)" stroke-width="26" stroke-linecap="round" fill="none"/><circle cx="42" cy="240" r="13" fill="url(#${id}s)"/>`;
    d += `<path d="M168 160 q26 34 20 74" stroke="url(#${id}o)" stroke-width="26" stroke-linecap="round" fill="none"/><circle cx="188" cy="240" r="13" fill="url(#${id}s)"/>`;
    d += `<path d="M44 226 q-3 8 0 14 M186 226 q3 8 0 14" stroke="${acc}" stroke-width="5" opacity=".9"/>`;
    /* torso */
    d += `<path d="M66 152 Q115 138 164 152 L176 262 Q115 276 54 262 Z" fill="url(#${id}o)"/><path d="M60 250 Q115 266 170 250 L172 262 Q115 278 58 262Z" fill="${acc}" opacity=".9"/>`;
    d += `<path d="M115 150 V260" stroke="${shade(outfit, .6)}" stroke-width="2" opacity=".6"/>` + [172, 192, 212].map(y => `<circle cx="115" cy="${y}" r="3" fill="${acc}"/>`).join('');
    d += `<rect x="58" y="214" width="114" height="14" rx="4" fill="url(#${id}b)"/><rect x="104" y="211" width="22" height="20" rx="4" fill="#f2c230" stroke="#b9871a" stroke-width="2"/><circle cx="115" cy="221" r="3.5" fill="#b9871a"/>`;
    d += `<rect x="128" y="226" width="30" height="22" rx="5" fill="url(#${id}b)"/><path d="M130 232 h26" stroke="#e9c987" stroke-width="2"/>`;
    if (av.outfit === 'star-robe') d += `<path d="M96 150 L115 178 L134 150" fill="#fff0c8" opacity=".95"/>` + [[84, 190], [148, 200], [96, 236], [140, 238]].map(([x, y]) => `<path d="M${x} ${y - 6} l1.8 4.2 4.4.4 -3.4 3 1 4.4 -3.8 -2.4 -3.8 2.4 1 -4.4 -3.4 -3 4.4 -.4z" fill="#ffd36b"/>`).join('');
    else d += `<path d="M90 146 Q115 170 140 146 Q146 164 132 176 Q115 186 98 176 Q84 164 90 146z" fill="${acc}"/><path d="M96 168 q-8 22 -2 40 M136 168 q8 22 2 40" stroke="${shade(acc, .75)}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    if (on.armor) d += gi(on.armor, 66, 150, 98, 80);
    if (on.wand) d += gi(on.wand, 180, 168, 52, 78);
  }
  /* neck + head */
  d += `<rect x="102" y="128" width="26" height="30" rx="8" fill="url(#${id}s)"/>`;
  if (hs === 'bun') d += E(115, 24, 27, 19, `url(#${id}h)`);
  if (hs === 'bob' || hs === 'braids') d += E(115, 88, 62, 66, `url(#${id}h)`);
  d += E(62, 99, 13, 17, `url(#${id}s)`) + E(168, 99, 13, 17, `url(#${id}s)`) + E(115, 89, 53, 58, `url(#${id}s)`);
  d += E(88, 117, 11, 7, '#ff8fa3', 'opacity=".32"') + E(142, 117, 11, 7, '#ff8fa3', 'opacity=".32"');
  if (hs !== 'shaved') {
    d += E(115, 54, 52, 28, `url(#${id}h)`);
    if (hs === 'curls') for (let i = 0; i < 7; i++) d += E(70 + i * 15, 46 + (i % 2) * 9 - (i === 3 ? 6 : 0), 17, 17, `url(#${id}h)`);
    if (hs === 'swept') d += E(88, 55, 32, 18, `url(#${id}h)`) + E(150, 52, 26, 16, `url(#${id}h)`);
    if (hs === 'braids') for (let i = 0; i < 4; i++) d += E(62, 92 + i * 16, 11, 13, `url(#${id}h)`) + E(168, 92 + i * 16, 11, 13, `url(#${id}h)`) + E(62, 100 + i * 16, 4, 4, acc) + E(168, 100 + i * 16, 4, 4, acc);
    d += E(98, 44, 20, 6, '#ffffff', 'opacity=".22" transform="rotate(-20 98 44)"');
  }
  const er = { round: [11, 13], almond: [14, 9.5], wide: [13, 13], soft: [10.5, 10] }[av.eyes] || [11, 13];
  for (const x of [94, 136]) {
    d += E(x, 91, er[0], er[1], '#fffaf4') + E(x, 92, er[0] * .62, er[1] * .78, `url(#${id}e)`) + E(x, 92, er[0] * .3, er[1] * .4, '#1d1426') + E(x - 2.5, 88, 2.8, 3.2, '#ffffff') + E(x + 2, 95, 1.4, 1.4, '#ffffff', 'opacity=".8"');
    d += `<path d="M${x - er[0] - 1} ${91 - er[1] * .5} Q${x} ${91 - er[1] - 3} ${x + er[0] + 1} ${91 - er[1] * .5}" stroke="#2a1b22" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    d += `<path d="M${x - 11} ${75} Q${x} ${69} ${x + 11} ${75}" stroke="${shade(hair, .8)}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
  }
  const nr = { button: [7, 5], bridge: [5, 9], round: [9, 6], 'soft-point': [6, 7] }[av.nose] || [7, 5];
  d += E(115, 108, nr[0], nr[1], shade(skin, .78), 'opacity=".55"') + E(113, 106, 2.5, 2, '#ffffff', 'opacity=".4"');
  d += `<path d="M99 120 Q115 136 131 120" fill="#fff" stroke="#75323f" stroke-width="3" stroke-linecap="round"/><path d="M101 121 Q115 130 129 121" fill="#e8607a" opacity=".5"/>`;
  if (on.head) d += gi(on.head, 58, -10, 114, 80);
  const crop = o.head ? '30 4 170 170' : '0 -10 230 372';
  return `<svg class="avsvg" viewBox="${crop}" role="img" aria-label="${esc(G.humanize(av.skin))} skin, ${esc(av.hair)} hair, ${esc(G.humanize(av.outfit))}" xmlns="http://www.w3.org/2000/svg">${o.bg === false || !o.head ? '' : `<circle cx="115" cy="101" r="103" fill="#eee3ff"/>`}${d}</svg>`;
};
G.avatarHtml = (p, o = {}) => p.avDone && p.av ? G.avatarSvg(p.av, { gear: p.gear.on, bg: o.bg }) : G.portrait(p, 110);
G.portrait = (p, px = 44) => p.avDone && p.av ? `<span class="avp" style="width:${px}px;height:${px}px">${G.avatarSvg(p.av, { head: true, gear: p.gear.on })}</span>` : `<span class="avp emo" style="width:${px}px;height:${px}px;font-size:${px * .62}px">${esc(p.avatar || '🙂')}</span>`;

/* ---------- panels (small bottom sheets) ---------- */
G.panel = html => { G.closePanel(); const w = document.createElement('div'); w.className = 'pwrap'; w.innerHTML = `<div class="panel" role="dialog" aria-modal="true">${html}</div>`; w.addEventListener('click', e => { if (e.target === w) G.closePanel(); }); document.body.appendChild(w); const b = w.querySelector('[data-a=gClose]') || w.querySelector('button'); if (b) b.focus(); };
G.closePanel = () => { document.querySelectorAll('.pwrap').forEach(n => n.remove()); if (G.fx && !(G.battleActive && G.battleActive())) G.fx.detach(); };
document.addEventListener('keydown', e => { if (e.key === 'Escape') { G.closePanel(); const s = $('#gset'); if (s) s.hidden = true; } });

/* ---------- header and navigation ---------- */
G.level = p => lvlOf(p.xp || 0, 3);
/** a ticket drawn as a ticket (never an emoji stand-in for a coin) */
G.ticket = () => '<svg class="tkt" viewBox="0 0 34 22" role="img" aria-label="ticket"><path d="M3 2h28a2 2 0 0 1 2 2v4a3 3 0 0 0 0 6v4a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-4a3 3 0 0 0 0-6V4a2 2 0 0 1 2-2z" fill="#ff8fc7" stroke="#a82a6b" stroke-width="1.5"/><path d="M12 3v16" stroke="#a82a6b" stroke-width="1.5" stroke-dasharray="2 2"/><path d="M22 6.5l1.2 2.6 2.8.3-2.1 1.9.6 2.8-2.5-1.4-2.5 1.4.6-2.8-2.1-1.9 2.8-.3z" fill="#fff3c4"/></svg>';
G.hdr = function hdr() {
  const p = C.cur(), L = G.level(p), s = S.settings;
  return `<header class="top slim"><button class="avbtn" data-a="gProgress" aria-label="My Progress for ${esc(p.name)}">${G.portrait(p, 46)}<span class="who"><b>${esc(p.name)}</b><small>Level ${L}</small></span></button>
    <span class="sp"></span><button class="chip coinc" id="coinc" data-a="gRewards" aria-label="${p.coins} coins. Open Rewards">${coin()} <b>${p.coins}</b></button>${p.tickets ? `<span class="chip tk" title="Spin tickets">${G.ticket()} <b>${p.tickets}</b></span>` : ''}
    <button class="chip setb" data-a="gSettings" aria-haspopup="true" aria-expanded="false">⚙ Settings</button>
    <div class="pop" id="gset" hidden role="group" aria-label="Settings">
      ${[['sound', 'Game sounds'], ['voice', 'Read-aloud voice'], ['narration', 'Narration (auto-read story)'], ['font', 'Easy-read letters'], ['practice', 'Practice mode (gentler counterattacks)']].map(([k, t]) => `<button class="setrow" data-a="gTog" data-k="${k}" aria-pressed="${!!s[k]}"><span>${t}</span><b class="st">${s[k] ? 'On' : 'Off'}</b></button>`).join('')}
      <button class="setrow" data-a="home"><span>Switch player</span><b>↪</b></button><button class="setrow" data-a="gate"><span>Teachers &amp; parents</span><b>↗</b></button></div></header>`;
};
G.nav = function nav(on) {
  const items = [['gMap', 'World Map', '🗺️', 'map'], ['gRoom', 'Pet Room', '🏠', 'room'], ['gLibrary', 'Library', '📚', 'library'], ['gRewards', 'Rewards', '🎁', 'rewards'], ['gShop', 'Shop', '🛒', 'shop']];
  return `<nav class="tabs gnav" aria-label="Main">${items.map(([a, t, i, k]) => `<button class="navb ${on === k ? 'on' : ''}" data-a="${a}" ${on === k ? 'aria-current="page"' : ''}><span aria-hidden="true">${i}</span><b>${t}</b></button>`).join('')}</nav>`;
};
G.actions.gSettings = (d, el) => { const s = $('#gset'); if (!s) return; s.hidden = !s.hidden; el.setAttribute('aria-expanded', String(!s.hidden)); C.sfx.tap(); };
G.actions.gTog = (d, el) => { const k = d.k; S.settings[k] = !S.settings[k]; C.save(); if ((k === 'voice' && !S.settings.voice) || (k === 'narration' && !S.settings.narration)) C.hush(); C.applySettings(); el.setAttribute('aria-pressed', String(!!S.settings[k])); el.querySelector('.st').textContent = S.settings[k] ? 'On' : 'Off'; C.sfx.tap(); };
G.actions.gMap = () => G.map(); G.actions.gProgress = () => G.progress();
document.addEventListener('click', e => { const s = $('#gset'); if (s && !s.hidden && !e.target.closest('#gset') && !e.target.closest('.setb')) s.hidden = true; });

/* ---------- content for a destination ---------- */
G.mcFrom = (t, extra = {}) => { const [stem, right, wrongs, hint, explain] = t, options = shuffle([right, ...wrongs]);
  return { type: 'mc', prompt: stem, options, answer: options.indexOf(right), key: stem.replace(/<[^>]+>/g, ' '), say: stem.replace(/<br>/g, '. ').replace(/<[^>]+>/g, ''), sub: 'review', hint, explain, ...extra }; };
G.destPlayable = d => d.contentStatus === G.readyKey || !!(S.reviewed && S.reviewed[d.id]);
G.destItems = function destItems(p, d, boss) {
  const want = boss ? 5 : 3; let items = [];
  const L = d.subject === 'language' && p.skills[d.skill] ? C.lvl(p.skills[d.skill].m) : 2;
  if (d.id === 'mountain') {
    const st = C.bankStory(p);
    const sents = (st.text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+["”’')]*|[^.!?]+$/g) || []).map((x, i) => ({ id: 's' + (i + 1), text: x.trim() }));
    items = st.questions.map(q => { const options = shuffle(q.options.slice()), answer = options.indexOf(q.options[0]);
      /* authored tutoring: why each wrong choice is tempting but wrong, and the exact sentence that decides it */
      const fbo = q.why ? Object.fromEntries(options.map((t, i) => ['o' + i, i === answer ? (q.explain || '') : (q.why[q.options.indexOf(t) - 1] || '')])) : null, hit = q.quote && sents.find(s => s.text.includes(q.quote));
      return { type: 'mc', prompt: esc(q.q), options, answer, key: st.title + '|' + q.q, say: q.q, sub: q.sub, hint: 'Look back at the passage for a clue.', explain: esc(q.explain || ''), skill: 'reading', story: { text: st.text, title: st.title, glossary: st.glossary || {} }, ...(fbo ? { fbo, tutor: true } : {}), ...(hit ? { cites: [{ sentenceId: hit.id, quote: q.quote }], passageSents: sents } : {}) }; });
  } else if (d.id === 'cove') items = window.SQ_SUBJECTS.banks.writing.map(t => G.mcFrom(t, { skill: 'writing', sub: 'writing goal' }));
  else if (d.subject !== 'language') items = window.SQ_SUBJECTS.banks[d.id].map(t => G.mcFrom(t, { skill: d.skill, sub: 'review' }));
  else items = C.makeItems(d.skill, L, 6);
  items = shuffle(items.map(it => ({ ...it, skill: it.skill || d.skill })));
  const min = Math.max(1, Math.min(want, items.length));
  return { items, min, resolve: min * 2 };
};
G.skillOfDest = id => (G.DEST[id] || {}).skill;

/* ---------- Pip's Pick ---------- */
G.pick = function pickFor(p) {
  if (p.pick && p.pick.day === today()) return p.pick;
  const ev = E.summarizeEvidence(p.attempts || [], { now: Date.now() }), play = D.destinations.filter(d => d.subject === 'language' && G.destPlayable(d));
  let best = null;
  for (const d of play) { const e = ev.find(x => x.skillId === d.skill); if (e && e.count >= 3 && (!best || e.accuracy < best.acc)) best = { d, acc: e.accuracy, e }; }
  let why, d;
  if (best && best.acc < .8) { d = best.d; why = `On your own, you got ${best.e.correct} of ${best.e.count} right in ${d.name} recently. Let’s make it stronger.`; }
  else { d = play.slice().sort((a, b) => p.skills[a.skill].m - p.skills[b.skill].m)[0]; why = `${d.name} is where I’d like to see a few more answers from you, so I can find your next step.`; }
  p.pick = { day: today(), dest: d.id, why, claimed: false }; C.save(); return p.pick;
};
G.pickCard = function pickCard(p) {
  const pk = G.pick(p), d = G.DEST[pk.dest], bonus = D.pipPick.bonusCoins;
  return `<section class="pick" aria-label="Pip’s Pick"><div class="pickh">${art('pip_cheer', '🦊', 'pipi')}<div><b>Pip’s Pick: ${esc(d.name)}</b><br><span>Practise: ${esc(d.starterActivity.toLowerCase())}.</span></div></div>
    <div class="pickb ${pk.claimed ? 'got' : ''}">${pk.claimed ? `✓ Bonus collected today` : `Win this battle for <b>+${bonus} bonus coins</b>`}</div>
    <div class="row left tight"><button class="btn big" data-a="gBattle" data-id="${d.id}" data-src="pick">Battle now</button><button class="btn ghost" data-a="gWhy" aria-expanded="false">Why this?</button><button class="btn ghost" data-a="gProgress">My Progress</button></div>
    <p class="why" id="gwhy" hidden>${esc(pk.why)} The bonus is paid once per day, only after a win in this battle.</p></section>`;
};
G.actions.gWhy = (d, el) => { const w = $('#gwhy'); w.hidden = !w.hidden; el.setAttribute('aria-expanded', String(!w.hidden)); };

/* ---------- world map ---------- */
G.destTile = function destTile(p, d, i) {
  const ok = G.destPlayable(d), lang = d.subject === 'language', m = lang && p.skills[d.skill] ? p.skills[d.skill].m : 0, lv = lang ? C.LV[C.lvl(m) - 1] : '';
  const lab = ok ? (lang ? lv : 'Teacher-reviewed') : 'Needs reviewed questions', pk = p.pick && p.pick.day === today() && p.pick.dest === d.id;
  return `<button class="isle ${ok ? '' : 'locked'} ${pk ? 'rec' : ''}" style="--d:${(i * .37 % 1.6).toFixed(2)}s" data-a="gDest" data-id="${d.id}" aria-label="${esc(d.name)}. ${esc(lab)}">
    ${pk ? '<span class="tag">Pip’s pick!</span>' : ''}${art(d.mapAssetId.replace(/-/g, '_'), '🏝️', 'ico')}<span class="plaque"><b>${esc(d.name)}</b><small>${esc(lab)}</small>${lang ? `<span class="bar"><i style="width:${Math.max(6, m)}%"></i></span>` : ''}</span></button>`;
};
G.map = function map(msg) {
  const p = C.cur(); if (!p) return C.home();
  if (!p.zoo.length) return G.eggs();
  G.loginCheck && G.loginCheck(p);
  const world = p.world || 'language', ds = D.destinations.filter(d => d.subject === world), lead = G.lead(p);
  const say = msg || `Welcome back, ${esc(p.name)}! Pick a world, or try Pip’s Pick.`;
  const pend = p.pending ? `<button class="banner" data-a="gChest">🎁 Your chest from the last battle is waiting. Open it!</button>` : '';
  C.view(`${G.hdr()}${pend}<div class="pip">${art('pip_happy', '🦊', 'pipi')}<div class="bubble">${say}</div></div>
    <div class="worlds" role="tablist" aria-label="Subject worlds">${G.WORLDS.map(([id, t, ic]) => `<button role="tab" aria-selected="${world === id}" class="wtab ${world === id ? 'on' : ''}" data-a="gWorld" data-w="${id}">${ic} ${t}</button>`).join('')}</div>
    <div class="world"><div class="wmain">${G.pickCard(p)}<div class="isles" role="list">${ds.map((d, i) => G.destTile(p, d, i)).join('')}</div>${world !== 'language' ? `<p class="note">${esc(SUBJ_LABEL[world])} questions are prototypes. A teacher approves them in the Teacher area before this world opens.</p>` : ''}</div>
      <aside class="wside"><button class="petcard" data-a="gLibrary"><span class="ptitle">Your team</span>${lead ? `<span class="petbox">${G.petImg(lead, 'mid')}</span><b>${esc(lead.name)}</b><small>${G.STAGE_NAME[G.stageOf(lead)]} ${esc(G.FAM[lead.fam].name)}</small>` : (p.zoo[0] ? `<span class="petbox">${G.petImg(p.zoo[0], 'mid')}</span><b>Your egg is waiting</b><small>Win a battle to hatch it</small>` : '<b>No pet yet</b>')}
        <span class="teamdots">${[0, 1, 2].map(i => { const z = G.inst(p, p.team[i]); return `<span class="td ${z ? 'on' : ''}">${z ? G.formImg(G.formOf(z).id, 'tiny') : '+'}</span>`; }).join('')}</span></button>
        ${!p.placed ? `<button class="mission warmup" data-a="gWarm">${art('monster_placement', '🎯')}<b>Pip’s Warm-Up</b><small>A quick battle with Pip<br>hatches your egg!</small></button>` : ''}
        ${G.dailyPanel ? G.dailyPanel(p) : ''}
        ${C.AI().on ? `<button class="mission" data-a="mission">${art('monster_mission', '🧠')}<b>AI Mission</b><small>Built from <u>your</u> answers<br>double coins!</small></button>` : ''}
      </aside></div>${G.nav('map')}`);
};
G.actions.gWorld = d => { const p = C.cur(); p.world = d.w; C.save(); C.sfx.tap(); G.map(); };

/* ---------- destination panel ---------- */
G.actions.gDest = d => {
  const p = C.cur(), de = G.DEST[d.id], ok = G.destPlayable(de), en = G.ENEMY[de.proposedBossId], w = p.stats.byDest[de.id] || { wins: 0 };
  C.sfx.tap();
  G.panel(`<div class="pstage" style="--bg:url(assets/arena/${de.id === 'art' ? 'art' : de.id}.jpg)"><span class="pfb">${esc(de.name)}</span>${art('v_' + en.spriteId.replace(/-/g, '_'), '🦹', 'pvil')}</div>
    <h2>${esc(de.name)}</h2><p><b>${esc(SUBJ_LABEL[de.subject])}</b> · ${esc(de.starterActivity)}.</p>
    <p class="small">Villain: ${esc(en.name)}. Watch for its ${esc(en.telegraph)}.</p>
    ${ok ? `<div class="row left"><button class="btn big" data-a="gBattle" data-id="${de.id}" data-src="island">Battle</button>
      ${w.wins >= 3 ? `<button class="btn gold" data-a="gBattle" data-id="${de.id}" data-src="island" data-boss="1">Boss fight</button>` : `<span class="small">Boss fight opens after 3 wins here (${w.wins}/3).</span>`}
      ${de.id === 'cove' ? '<button class="btn ghost" data-a="gWrite">Free writing (optional)</button>' : ''}${de.id === 'mountain' && C.AI().on ? '<button class="btn ghost" data-a="gAdventure">Pip adventure (AI)</button>' : ''}</div>`
    : `<div class="fb warn" role="status"><div><b>Needs reviewed questions.</b> This world only opens after a teacher reviews its first set of questions. They are prototypes for now.</div></div>`}
    <div class="row left"><button class="btn ghost" data-a="gClose">Close</button></div>`);
};
G.actions.gClose = () => G.closePanel();
G.actions.gWrite = () => { G.closePanel(); C.ACT.play({ skill: 'writing' }); };
G.actions.gAdventure = () => { G.closePanel(); C.ACT.play({ skill: 'reading' }); };

/* ---------- starter eggs ---------- */
const STARTERS = D.families.filter(f => f.avail === 'starter');
G.eggs = function eggs() {
  C.view(`${G.hdr()}<div class="pip">${art('pip_cheer', '🦊', 'pipi')}<div class="bubble">Every hero needs a buddy! Pick a mystery egg. Win a battle to <b>hatch</b> it.</div></div>
    <div class="eggs">${STARTERS.map(f => `<button class="egg" style="--c:#8f6bff" data-a="gEgg" data-f="${f.id}">${G.formImg(f.id + '-egg', 'huge wobble')}<b>${esc(f.name)} Egg</b><small>Hatches into ${esc(f.forms[1].name)}</small></button>`).join('')}</div>`);
};
G.actions.gEgg = d => { const p = C.cur(); const inst = G.addInst(p, d.f, { name: G.FAM[d.f].name }); p.pet = d.f; p.petName = inst.name; p.coins += 20; C.save(); C.sfx.win(); C.confetti(20); G.map(`You chose the <b>${esc(G.FAM[d.f].name)} Egg</b>! Here are <b>20 coins</b> to start. Win a battle to hatch it.`); };

/* ---------- avatar creator ---------- */
let CR = null;
const CFG = [['skin', 'Skin tone', 'sw'], ['hair', 'Hair style', 'pn'], ['hairColor', 'Hair colour', 'sw'], ['eyes', 'Eye shape', 'pn'], ['eyeColor', 'Eye colour', 'sw'], ['nose', 'Nose', 'pn'], ['outfit', 'Starter outfit', 'pn']];
const optsOf = k => k === 'skin' ? AV.skin.map(x => x[0]) : k === 'hairColor' ? AV.hairColor.map(x => x[0]) : k === 'eyeColor' ? AV.eyeColor.map(x => x[0]) : k === 'outfit' ? AV.outfits.map(x => x.id) : AV[k];
G.creator = function creator(pid) {
  const ex = pid ? C.S.profiles.find(x => x.id === pid) : null;
  if (!CR || CR.pid !== (pid || null)) CR = { pid: pid || null, name: ex ? ex.name : '', grade: ex ? ex.grade : 0, av: { ...G.avDefault(), ...(ex && ex.av ? ex.av : {}) }, err: '' };
  const sw = (k, id, hex) => `<button class="swatch ${CR.av[k] === id ? 'on' : ''}" style="background:${hex}" data-a="gAvSet" data-k="${k}" data-v="${id}" aria-label="${esc(G.humanize(id))}" aria-pressed="${CR.av[k] === id}" title="${esc(G.humanize(id))}"></button>`;
  C.view(`<div class="card creator"><h2>${ex ? 'Edit your adventurer' : 'Create your adventurer'}</h2>
    <div class="crgrid"><div class="crprev" id="crprev">${G.avatarSvg(CR.av, { gear: ex ? ex.gear.on : {} })}<div class="row tight"><button class="btn ghost" data-a="gAvRandom">🎲 Randomize</button><button class="btn ghost" data-a="gAvReset">Reset</button></div></div>
    <div class="crctl">${ex ? '' : `<label class="lab" for="nm">A nickname (you do not need your real name)</label><input id="nm" class="inp" maxlength="14" autocomplete="off" placeholder="Nickname" value="${esc(CR.name)}">
      <div class="lab">What grade are you in?</div><div class="grades">${[1, 2, 3, 4, 5, 6, 7, 8].map(g => `<button class="gr ${g === CR.grade ? 'on' : ''}" data-a="gGrade" data-v="${g}" aria-pressed="${g === CR.grade}">${g}</button>`).join('')}</div>`}
      ${CFG.map(([k, t, kind]) => { const list = optsOf(k), cur = CR.av[k];
        return `<div class="crrow"><span class="crl">${t}</span>${kind === 'sw' ? `<span class="sws" role="group" aria-label="${t}">${list.map(id => sw(k, id, hexOf(k === 'skin' ? AV.skin : k === 'hairColor' ? AV.hairColor : AV.eyeColor, id))).join('')}</span>`
          : `<span class="pnr"><button class="btn ghost sm" data-a="gAvStep" data-k="${k}" data-s="-1" aria-label="Previous ${t}">‹</button><b>${esc(G.humanize(cur))}</b><button class="btn ghost sm" data-a="gAvStep" data-k="${k}" data-s="1" aria-label="Next ${t}">›</button></span>`}</div>`; }).join('')}
      ${ex ? '' : `<details class="optmail"><summary>Parent or guardian email (optional)</summary><p class="small">A grown-up can add an email to get a weekly study update with graphs. You can skip this and add it later. It stays on this device.</p><label class="lab" for="pe">Parent or guardian email</label><input id="pe" class="inp" type="email" autocomplete="off" placeholder="parent@example.com" value="${esc(CR.pe || '')}"></details>`}<p class="small">All body and face choices are free for everyone.</p><p id="err" class="err" role="alert">${esc(CR.err)}</p></div></div>
    <div class="row"><button class="btn ghost" data-a="${ex ? 'gProgress' : 'home'}">Back</button><button class="btn big" data-a="gAvSave">${ex ? 'Save' : 'Next: pick an egg'}</button></div></div>`, false, true);
};
const crRedraw = () => { const n = $('#nm'); if (n) CR.name = n.value; const e = $('#pe'); if (e) CR.pe = e.value; G.creator(CR.pid); const m = $('#nm'); if (m) m.value = CR.name; };
G.actions.gAvSet = d => { CR.av[d.k] = d.v; crRedraw(); };
G.actions.gAvStep = d => { const l = optsOf(d.k), i = (l.indexOf(CR.av[d.k]) + (+d.s) + l.length) % l.length; CR.av[d.k] = l[i]; crRedraw(); };
G.actions.gAvRandom = () => { CFG.forEach(([k]) => { const l = optsOf(k); CR.av[k] = pick(l); }); crRedraw(); };
G.actions.gAvReset = () => { CR.av = G.avDefault(); crRedraw(); };
G.actions.gGrade = d => { CR.grade = +d.v; crRedraw(); };
G.actions.gAvSave = () => {
  const n = $('#nm'); if (n) CR.name = n.value.trim(); const pe = $('#pe'); if (pe) CR.pe = pe.value.trim();
  if (CR.pid) { const p = C.S.profiles.find(x => x.id === CR.pid); p.av = { ...CR.av }; p.avDone = true; C.save(); C.sfx.win(); CR = null; return G.progress(); }
  if (!CR.name) { CR.err = 'Type a nickname first.'; return G.creator(null); } if (!CR.grade) { CR.err = 'Tap your grade.'; return G.creator(null); }
  if (CR.pe && !/^[^@\s<>,;]{1,64}@[^@\s<>,;]{1,120}\.[A-Za-z]{2,}$/.test(CR.pe)) { CR.err = 'That email does not look right. Fix it or leave it empty.'; return G.creator(null); }
  const p = C.newProfile(CR.name, '🙂', CR.grade); p.av = { ...CR.av }; p.avDone = true; p.pet = ''; if (CR.pe) { p.parentEmail = CR.pe; p.parentOK = true; } S.profiles.push(p); S.current = p.id; C.save(); CR = null; C.sfx.win(); G.migrate(p); G.eggs();
};
G.actions.newP = () => { CR = null; G.creator(null); };
G.actions.gAvEdit = () => G.creator(C.cur().id);

/* ---------- My Progress ---------- */
G.pickCompact = function pickCompact(p) {
  const pk = G.pick(p), d = G.DEST[pk.dest], bonus = D.pipPick.bonusCoins;
  return `<div class="pcomp"><p><b>${esc(d.name)}</b><br>Practise: ${esc(d.starterActivity.toLowerCase())}.</p><p class="small">${pk.claimed ? '✓ Bonus collected today' : `Win for <b>+${bonus}</b> ${coin()} bonus coins`}</p>
    <button class="btn big" data-a="gBattle" data-id="${d.id}" data-src="pick">Battle now</button><details class="why2"><summary>Why this?</summary><p>${esc(pk.why)} The bonus is paid once per day, only after a win in this battle.</p></details></div>`;
};
G.progress = function progress() {
  const p = C.cur(), ev = E.summarizeEvidence(p.attempts || [], { now: Date.now() }), L = G.level(p), t = D.levels.map(x => x * 3), lo = t[Math.min(L - 1, 5)] || 0, hi = t[Math.min(L, 5)] || lo + 500;
  const skillName = id => { const d = D.destinations.find(x => x.skill === id); return d ? d.name : id; };
  const strong = ev.filter(e => e.count >= 3 && e.accuracy >= .7).sort((a, b) => b.accuracy - a.accuracy).slice(0, 2);
  const subj = G.WORLDS.map(([id, t2]) => { const ds = D.destinations.filter(d => d.subject === id), ok = ds.some(G.destPlayable), xp = (p.sx || {})[id] || 0, l = lvlOf(xp), a = D.levels[Math.min(l - 1, 5)], b = D.levels[Math.min(l, 5)] || a + 200;
    return `<div class="sjc ${ok ? '' : 'off'}"><b>${t2}</b>${ok ? `<span class="sjl">Level ${l}</span><span class="bar"><i style="width:${clamp((xp - a) / Math.max(1, b - a) * 100, 4, 100)}%"></i></span><small>${xp} XP</small>` : '<span class="sjl">Not open yet</span><small>Needs reviewed questions</small>'}</div>`; }).join('');
  const av = p.avDone ? `<span class="avbig">${G.avatarHtml(p)}</span>` : G.portrait(p, 96);
  C.view(`${G.hdr()}<main class="progpage"><section class="card psum">${av}<div class="psinfo"><h2>${esc(p.name)}</h2><p>Adventurer level <b>${L}</b> · ${p.xp} XP · ${p.streak || 0}-day streak</p>
      <span class="bar xpb" aria-label="Progress to the next level"><i style="width:${clamp((p.xp - lo) / Math.max(1, hi - lo) * 100, 3, 100)}%"></i></span>
      <div class="row left tight"><button class="btn ghost" data-a="gAvEdit">${p.avDone ? 'Edit adventurer' : 'Create your adventurer'}</button><button class="btn ghost" data-a="gWardrobe">Wardrobe</button></div></div>
      <div class="banner2">${G.bannerHtml(p)}</div></section>
    <div class="pgrid2"><section class="card"><h3>Strengths</h3>${strong.length ? `<ul class="plist">${strong.map(e => `<li><b>${esc(skillName(e.skillId))}</b>: ${e.correct} of ${e.count} right on your own</li>`).join('')}</ul>` : '<p class="empty">Try a few battles to find your strengths.</p>'}</section>
      <section class="card"><h3>Next practice</h3>${G.pickCompact(p)}</section></div>
    <section class="card"><h3>Subject levels</h3><div class="sjgrid">${subj}</div></section>
    <details class="evd card"><summary>How this is worked out</summary><p class="small">Levels count battles you finish. Strengths use only answers you got right on the first try without a hint. ${ev.map(e => `${esc(skillName(e.skillId))}: ${e.count} counted`).join(' · ') || 'No counted answers yet.'}</p></details></main>${G.nav('')}`);
};
G.actions.gRewards = () => G.rewards && G.rewards();
});
