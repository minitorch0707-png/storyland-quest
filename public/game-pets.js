/* Storyland Quest – companions: Field Guide, three-pet team, Move Book, stickers, Library, Pet Room, Shop and Wardrobe. */
window.SQ_PARTS.push((G, C) => {
'use strict';
const D = G.D;
const { S, $, esc, art, coin, pick, today, sfx, confetti, calm, anim, burst, floaty } = C;
const A = G.actions;
let TAB = 'companions', SHOP = 'food', MODE = 'practice';
const FIL = { slot: 'head', own: 'all', hue: 'all' };
const HUES = [...new Set(D.cosmetics.map(c => c.hue))];
const SLOTP = { head: 40, face: 50, neck: 45, back: 55 };
const ROOM_SLOTS = { bl: ['floor', 17, 70, .82, 'Rear, left'], br: ['floor', 83, 70, .82, 'Rear, right'], fm: ['floor', 30, 83, .92, 'Middle, left'], fr2: ['floor', 70, 83, .92, 'Middle, right'], fl: ['floor', 12, 94, 1, 'Front, left'], fr: ['floor', 88, 94, 1, 'Front, right'] };
const PROPDEST = { 'scholar-desk': 'mountain', telescope: 'mountain', 'artist-easel': 'cove', xylophone: 'sound', 'map-table': 'orchard', 'puppet-theater': 'station', 'chemistry-bench': 'science', greenhouse: 'science', 'weather-globe': 'science', aquarium: 'science' };
const PRODEC = { 'star-bed': 'Rest your pet', 'reading-lamp': 'Change the lighting', 'star-wardrobe': 'Open the wardrobe' };
const PROP_PRICE = { telescope: 120, 'artist-easel': 100, xylophone: 90, 'map-table': 110, 'puppet-theater': 130, 'chemistry-bench': 120, greenhouse: 110, 'weather-globe': 100, aquarium: 140 };
const GEAR_PRICE = { 'mint-armor': 80, 'star-cape': 120, 'star-wand': 60, 'moon-hat': 90 };
const THEME_PRICE = { sky: 0, jungle: 100, ocean: 100, candy: 100, space: 120 };
const FOOD = [['apple', 'Apple', 15, 8], ['cookie', 'Cookie', 30, 18], ['cake', 'Star Cake', 60, 40]];
const BAGP = [['clue', 'Clue Lantern', 20, 'clue_lantern', '🔦'], ['look', 'Second Look', 25, 'item_second_look', '👀'], ['bubble', 'Bubble Guard', 30, 'item_bubble_guard', '🫧'], ['double', 'Double Strike', 40, 'double_strike', '⚡']];
const rooms = p => p.room;
const cosImg = (c, cls = '') => `<img class="art cosi ${cls}" src="assets/cos_${c.base}.png" style="filter:hue-rotate(${c.hue}deg)" alt="" draggable="false">`;
const hueName = h => ({ 0: 'Original', 31: 'Sunset', 59: 'Honey', 94: 'Meadow', 124: 'Mint', 163: 'Lagoon', 201: 'Sky', 237: 'Twilight', 277: 'Orchid', 321: 'Berry' })[h] || h + '°';

/* ---------- banner (stickers shown on the profile) ---------- */
G.bannerHtml = p => { const ids = p.placed2.banner, fr = p.frame === 'orchard' ? '<img class="frameimg" src="assets/st_orchard_frame.png" alt="" data-fb="">' : '';
  return `${fr}<span class="bn ${p.frame ? 'frame-' + p.frame : ''}">${ids.length ? ids.map(id => `<span class="bs">${G.stkHtml(id)}</span>`).join('') : '<span class="small">Place stickers on your banner from the Library.</span>'}</span>`; };

/* ---------- Library ---------- */
G.library = function library(tab) {
  if (tab) TAB = tab; const p = C.cur();
  const tabs = [['companions', 'Companions'], ['moves', 'Move Book'], ['stickers', 'Stickers']];
  C.view(`${G.hdr()}<div class="card lib"><div class="worlds" role="tablist" aria-label="Library">${tabs.map(([k, t]) => `<button role="tab" aria-selected="${TAB === k}" class="wtab ${TAB === k ? 'on' : ''}" data-a="gLibTab" data-tab="${k}">${t}</button>`).join('')}</div>
    ${TAB === 'companions' ? companions(p) : TAB === 'moves' ? moveBook(p) : stickerTab(p)}</div>${G.nav('library')}`);
};
A.gLibrary = d => G.library(d && d.tab); A.gLibTab = d => { sfx.tap(); G.library(d.tab); };
const ownedBest = (p, fam) => Math.max(-1, ...p.zoo.filter(z => z.fam === fam).map(G.stageOf));
const famState = (p, f) => ownedBest(p, f.id) >= 0 ? 'owned' : p.seen[f.id] ? 'encountered' : 'undiscovered';
function companions(p) {
  const slot = i => { const z = G.inst(p, p.team[i]); return z ? `<div class="tslot act"><span class="tmini">${G.petImg(z, 'mid')}</span><input class="inp rn" data-rn="${z.iid}" maxlength="12" value="${esc(z.name)}" aria-label="Pet name"><small>${G.STAGE_NAME[G.stageOf(z)]} · ${esc(G.movesOf(z).map(m => G.MOVE[m].name).join(', '))}</small>
    <span class="row tight">${i ? `<button class="btn ghost sm" data-a="gLead" data-id="${z.iid}">Make lead</button>` : '<b>Lead</b>'}<button class="btn ghost sm" data-a="gTeamRem" data-id="${z.iid}">Remove</button></span></div>` : `<div class="tslot empty"><span>Empty slot</span><small>Add a hatched pet below</small></div>`; };
  const bench = p.zoo.filter(z => !p.team.includes(z.iid));
  const q = G.QUESTS.map(x => { const done = p.recruited[x.id], f = G.FAM[x.fam]; if (!done) p.seen[x.fam] = p.seen[x.fam] || true; return `<li class="${done ? 'done' : ''}"><span>${G.formImg(x.fam + '-egg', 'tiny', !done)}</span><div><b>${esc(x.label)}</b><br><small>Reward: ${done ? esc(f.name) + ' Egg ✓' : 'a mystery egg · ' + x.prog(p)}</small></div></li>`; }).join('');
  C.save();
  return `<h2>Your team</h2><p class="small">Up to three pets. The lead starts each battle. Between questions you get one free swap before you answer.</p><div class="tstrip">${[0, 1, 2].map(slot).join('')}</div>
    <h3>Eggs and reserves</h3><div class="bench">${bench.length ? bench.map(z => { const st = G.stageOf(z); return `<div class="bcard">${G.petImg(z, 'mid')}<b>${esc(z.name)}</b><small>${G.STAGE_NAME[st]}${st === 0 ? ` · ${Math.min(z.xp, 10)}/10 XP: win battles to hatch` : ''}</small>${st ? `<button class="btn ghost sm" data-a="gTeamAdd" data-id="${z.iid}" ${p.team.length >= 3 ? 'disabled' : ''}>${p.team.length >= 3 ? 'Team is full' : 'Add to team'}</button>` : ''}</div>`; }).join('') : '<p class="small">Everything you own is on your team.</p>'}</div>
    <h3>Recruit quests</h3><ul class="qlist">${q}</ul>
    <h3>Storyland Field Guide</h3><p class="small">${p.zoo.length ? new Set(p.zoo.map(z => z.fam)).size : 0} of 25 families found. Tap a family to see how to recruit it.</p>
    <div class="guide" role="list">${D.families.map(f => { const st = famState(p, f), best = ownedBest(p, f.id), shown = st === 'owned' ? f.forms[best].id : f.forms[Math.max(1, 0)].id;
      return `<button class="gcard ${st}" role="listitem" data-a="gFam" data-id="${f.id}" aria-label="${st === 'undiscovered' ? 'Undiscovered family' : esc(f.name)}, ${st}">${G.formImg(shown, 'mid', st !== 'owned')}<b>${st === 'undiscovered' ? '???' : esc(f.name)}</b><small>${st === 'owned' ? `${best + 1}/4 forms` : st === 'encountered' ? 'Seen' : 'Not found yet'}</small></button>`; }).join('')}</div>`;
}
A.gTeamAdd = d => { const p = C.cur(), z = G.inst(p, d.id); if (z && G.stageOf(z) >= 1 && p.team.length < 3 && !p.team.includes(z.iid)) { p.team.push(z.iid); C.save(); sfx.win(); G.library(); } };
A.gTeamRem = d => { const p = C.cur(); p.team = p.team.filter(x => x !== d.id); C.save(); sfx.tap(); G.library(); };
A.gLead = d => { const p = C.cur(); p.team = [d.id, ...p.team.filter(x => x !== d.id)]; C.save(); sfx.tap(); G.library(); };
document.addEventListener('change', e => { const t = e.target; if (t && t.dataset && t.dataset.rn) { const p = C.cur(), z = G.inst(p, t.dataset.rn), v = t.value.trim(); if (z && v) { z.name = v.slice(0, 12); C.save(); } } });
A.gFam = d => {
  const p = C.cur(), f = G.FAM[d.id], st = famState(p, f), best = ownedBest(p, f.id), q = G.QUESTS.find(x => x.fam === f.id), bossE = Object.entries(G.BOSSFAM).find(e => e[1] === f.id);
  const how = f.avail === 'starter' ? 'A starter egg. Players choose one at the very start.' : f.avail === 'quest' ? `Quest: ${esc(q.label)} (${q.prog(p)}).` : f.avail === 'boss-befriend' ? `Win a boss fight against ${esc(G.ENEMY[bossE[0]].name)} and it leaves you an egg.` : `Buy a ${esc(f.name)} egg in the Hatchery (${G.HATCH_COST} coins).`;
  const mv = [['Baby', f.unlocks.baby], ['Juvenile', f.unlocks.juvenile], ['Adult', f.unlocks.adult]].map(([s, m]) => `${s}: ${esc(G.MOVE[m].name)}`).join(' · ');
  G.panel(`<h2>${st === 'undiscovered' ? 'Undiscovered family' : esc(f.name)}</h2><div class="forms">${f.forms.map((x, i) => { const own = i <= best, show = own || st !== 'undiscovered'; return `<div class="fcell ${own ? 'own' : ''}">${G.formImg(x.id, 'mid', !own)}<b>${show ? esc(x.name) : '???'}</b><small>${own ? 'Owned' : show ? 'Seen' : 'Not found'}</small></div>`; }).join('')}</div>
    ${st === 'undiscovered' ? '<p>Keep exploring to discover this family.</p>' : `<p class="small">${mv}</p><p><b>How to recruit:</b> ${how}</p>`}
    ${f.avail === 'hatchery' && st !== 'undiscovered' ? `<div class="row left"><button class="btn big" data-a="gBuyEgg" data-id="${f.id}" ${p.coins >= G.HATCH_COST ? '' : 'disabled'}>Buy egg · ${G.HATCH_COST} coins</button></div>` : ''}<div class="row left"><button class="btn ghost" data-a="gClose">Close</button></div>`);
};
A.gBuyEgg = d => { const p = C.cur(); if (p.coins < G.HATCH_COST) return; p.coins -= G.HATCH_COST; const z = G.addInst(p, d.id); C.save(); G.playSfx('new-pet'); confetti(20); G.closePanel(); G.library('companions'); void z; };

/* ---------- Move Book ---------- */
function moveBook(p) {
  const pets = p.zoo.filter(z => G.stageOf(z) >= 1);
  if (!pets.length) return '<h2>Move Book</h2><p>Hatch a pet to start learning moves. Win a battle to hatch your egg.</p>';
  const card = (z, id, eq, full) => { const mv = G.MOVE[id], u = G.moveUnlock(p, z, id), got = u.ok, on = eq.includes(id), cd = mv.arche ? mv.cd : 0;
    return `<div class="mv static ${got ? '' : 'locked'} ${on ? 'equipped' : ''}" style="--mc:${mv.color}"><span class="mi" aria-hidden="true">${G.moveIcon(id)}</span><b>${esc(mv.name)}</b><small>${esc(mv.effect)}${cd ? ` · Cooldown ${cd} turns` : ''}${mv.arche === 'finisher' ? ' · once per battle' : ''}</small>
      <small>${got ? (on ? '✔ Equipped' : 'Unlocked') : `🔒 ${esc(u.why)}${u.prog ? ` · ${esc(u.prog)}` : ''}`}</small>
      <span class="row tight">${got ? `<button class="btn ${on ? 'ghost' : ''} sm" data-a="gEquip" data-m="${id}" data-id="${z.iid}" ${on && id === G.FAM[z.fam].unlocks.baby ? 'disabled' : ''}>${on ? (id === G.FAM[z.fam].unlocks.baby ? 'Starter' : 'Take off') : 'Equip'}</button>` : ''}<button class="btn ghost sm" data-a="gPreview" data-m="${id}" data-id="${z.iid}">${got ? 'Preview' : 'Preview only'}</button></span></div>`; };
  return `<h2>Move Book</h2><p class="small">Equip up to four moves per companion (the starter strike stays). Locked moves show how to earn them and can be previewed, but a preview never changes damage, items, XP or rewards. Moves are earned by learning, not bought.</p>` + pets.map(z => { const f = G.FAM[z.fam], st = G.stageOf(z), eq = G.equipOf(p, z), all = [f.unlocks.baby, f.unlocks.juvenile, f.unlocks.adult].concat(G.NEWMOVES[z.fam] || []);
    return `<div class="mvset"><div class="mvh">${G.petImg(z, 'tiny')}<b>${esc(z.name)}</b><small>${G.STAGE_NAME[st]} ${esc(f.name)} · ${eq.length}/4 equipped</small></div><div class="bt-moves mbook">${all.map(id => card(z, id, eq)).join('')}</div></div>`; }).join('');
}
A.gPreview = d => {
  const p = C.cur(), z = G.inst(p, d.id), m = G.MOVE[d.m], flip = G.flipFor(z.fam, 'left') ? ' flip' : '';
  G.panel(`<h2>${esc(m.name)}</h2><div class="arena stage pv" id="pvarena" style="--bg:url(assets/arena/mountain.jpg)"><div class="side left"><span class="gshadow"></span><div class="fighter" id="pvme"><div class="fi${flip}">${G.petImg(z)}</div></div></div><div class="side right"><span class="gshadow"></span><div class="fighter mon" id="pvfoe"><div class="fi">${art('v_ink_baron', '🎯')}</div></div></div></div>
    <p class="small">${esc(m.effect)}${m.arche ? ` · Cooldown ${m.cd || 0}` : ''}. Preview only: no damage, items, XP or rewards.</p><div class="row left"><button class="btn" data-a="gPreview" data-m="${d.m}" data-id="${d.id}">Play again</button><button class="btn ghost" data-a="gClose">Close</button></div>`);
  setTimeout(() => { const ar = $('#pvarena'); if (!ar) return; G.fx.attach(ar); const me = $('#pvme'), foe = $('#pvfoe'); G.fx.aura(z.fam, () => $('#pvme .pimg') || me); G.fx.aura('ink-baron', () => $('#pvfoe .art') || foe); G.spr.idle($('#pvme .fi'), 0); G.spr.idle($('#pvfoe .fi'), 1); setTimeout(() => G.playMoveFx(ar, me, foe, d.m), 500); }, 120);
};

/* ---------- Stickers ---------- */
function stickerTab(p) {
  const own = G.stkOwned(p), sets = D.destinations.filter(d => d.subject === 'language');
  const place = (id) => `<span class="row tight"><button class="btn ghost sm" data-a="gPlace" data-id="${id}" data-w="banner" aria-pressed="${p.placed2.banner.includes(id)}">${p.placed2.banner.includes(id) ? 'Off banner' : 'On banner'}</button><button class="btn ghost sm" data-a="gPlace" data-id="${id}" data-w="board" aria-pressed="${p.placed2.board.includes(id)}">${p.placed2.board.includes(id) ? 'Off room board' : 'On room board'}</button></span>`;
  const classic = (p.stickers || []).map(e => 'c:' + e);
  return `<h2>Stickers</h2><p class="small">Earn stickers by winning. Put them on your banner or the board in your Pet Room. Finishing a set unlocks a frame. A duplicate sticker turns into 5 coins.</p>
    <div class="banner2 big">${G.bannerHtml(p)}</div>${p.frame ? `<p class="small">Banner frame: ${esc(p.frame)} <button class="btn ghost sm" data-a="gFrame" data-f="">Remove frame</button></p>` : ''}
    ${sets.map(d => { const ss = G.STK.filter(s => s.set === d.id), n = ss.filter(s => own.has(s.id)).length, done = n === ss.length;
      return `<section class="stset"><h3>${esc(d.name)} <small>${n}/${ss.length}</small>${done ? `<button class="btn ghost sm" data-a="gFrame" data-f="${d.id}">${p.frame === d.id ? '✓ Frame in use' : 'Use set frame'}</button>` : ''}</h3><div class="stgrid">${ss.map(s => own.has(s.id) ? `<div class="stc got">${G.stkHtml(s.id)}<b>${esc(s.name)}</b>${place(s.id)}</div>` : `<div class="stc"><span class="art stk q">❔</span><b>${esc(s.name)}</b><small>${esc(s.earn)}</small></div>`).join('')}</div></section>`; }).join('')}
    ${classic.length ? `<section class="stset"><h3>Classic stickers <small>${classic.length}</small></h3><div class="stgrid">${classic.map(id => `<div class="stc got">${G.stkHtml(id)}${place(id)}</div>`).join('')}</div></section>` : ''}`;
}
A.gPlace = d => { const p = C.cur(), L = p.placed2[d.w], cap = d.w === 'banner' ? 6 : 8, i = L.indexOf(d.id); if (i >= 0) L.splice(i, 1); else if (L.length < cap) L.push(d.id); else return; C.save(); sfx.tap(); G.library('stickers'); };
A.gFrame = d => { const p = C.cur(); p.frame = d.f === 'orchard' || d.f === '' ? d.f : d.f; C.save(); G.library('stickers'); };

/* ---------- Pet Room: free placement, owned/unplaced furniture, residents, themes ---------- */
const RTHEME = { lodge: ['Lodge', ''], dusk: ['Evening', 'hue-rotate(200deg) brightness(.82) saturate(1.1)'], mint: ['Mint', 'hue-rotate(80deg) saturate(1.05)'], rose: ['Rose', 'hue-rotate(300deg) saturate(1.1)'], sun: ['Sunny', 'brightness(1.12) saturate(1.25)'] };
const FLOOR = { x0: .07, x1: .93, y0: .32, y1: .97 }, PAGE = 8;
let SEL = null, UNDO = [], RPAGE = 0, RPET = null, GREET = null;
const fixRoom = r => { r.owned = r.owned || []; r.items = (r.items || []).filter(i => G.PROP[i.id]); r.theme = RTHEME[r.theme] ? r.theme : 'lodge'; r.pets = r.pets || [];
  const seen = new Set(); r.items = r.items.filter(i => !seen.has(i.id) && seen.add(i.id)); r.items.forEach(i => { if (typeof i.x !== 'number') { const s = ROOM_SLOTS[i.slot] || ROOM_SLOTS.bl; i.x = s[1] / 100; i.y = s[2] / 100; delete i.slot; } i.x = Math.min(FLOOR.x1, Math.max(FLOOR.x0, i.x)); i.y = Math.min(FLOOR.y1, Math.max(FLOOR.y0, i.y)); });
  r.items.forEach(i => { if (!r.owned.includes(i.id)) r.owned.push(i.id); }); return r; };
const snap = () => { UNDO.push(JSON.stringify(C.cur().room.items)); if (UNDO.length > 30) UNDO.shift(); };
const residents = p => p.zoo.filter(z => G.stageOf(z) >= 1);
const spot = (i, n) => { const row = n > 4 ? i % 2 : 0, cols = Math.ceil(n / (n > 4 ? 2 : 1)), col = n > 4 ? Math.floor(i / 2) : i; return { x: .2 + (cols === 1 ? .3 : col * (.62 / (cols - 1))) + (row ? .03 : 0), y: n > 4 ? (row ? .97 : .9) : .93 }; };
G.room = function room(msg) {
  const p = C.cur(), r = fixRoom(p.room), edit = MODE === 'edit';
  const placed = r.items.slice().sort((a, b) => a.y - b.y).map(it => { const pr = G.PROP[it.id], act = PROPDEST[it.id] || PRODEC[it.id];
    return `<button class="rprop ${SEL === it.id && edit ? 'sel' : ''}" style="left:${it.x * 100}%;top:${it.y * 100}%;z-index:${Math.round(it.y * 1000)}" data-a="gProp" data-id="${it.id}" aria-label="${esc(pr.name)}${edit ? ' (editing: drag, or use arrow keys when selected)' : act ? '. ' + esc(PROPDEST[it.id] ? 'Practice: ' + pr.activity : act) : ''}"><span class="rsh"></span>${art('prop_' + it.id.replace(/-/g, '_'), '🪑')}${edit ? '<span class="rh" aria-hidden="true">⇄</span>' : ''}</button>`; }).join('');
  const all = residents(p), pages = Math.max(1, Math.ceil(all.length / PAGE)); RPAGE = Math.min(RPAGE, pages - 1); const shown = all.slice(RPAGE * PAGE, RPAGE * PAGE + PAGE), team = new Set(p.team);
  const pets = shown.map((z, i) => { const s = spot(i, shown.length), sz = (G.lead(p) && G.lead(p).iid === z.iid) ? 'lead' : shown.length > 5 ? 'sm' : shown.length > 2 ? 'md' : 'lg';
    return `<button class="rpet rp-${sz} ${RPET === z.iid ? 'sel' : ''}" data-iid="${z.iid}" data-a="gGreet" data-id="${z.iid}" style="left:${s.x * 100}%;top:${s.y * 100}%;z-index:${Math.round(s.y * 1000) + 1}" aria-label="${esc(z.name)}${team.has(z.iid) ? ', on your battle team' : ', resident'}. Say hi."><span class="rsh"></span>${G.petImg(z, 'mid')}${team.has(z.iid) ? '<span class="rteam" aria-hidden="true">★</span>' : ''}</button>`; }).join('');
  const board = p.placed2.board.length ? `<div class="rboard" aria-label="Sticker board">${p.placed2.board.map(id => `<span class="bs">${G.stkHtml(id, 'sm')}</span>`).join('')}</div>` : '';
  const unplaced = r.owned.filter(id => G.PROP[id] && !r.items.some(i => i.id === id));
  const thumb = id => art('prop_' + id.replace(/-/g, '_'), '🪑', 'tinyart');
  const selIt = r.items.find(i => i.id === SEL);
  const roster = `<div class="roster" role="group" aria-label="Companions in your room"><h4>Companions at home <small>${all.length} owned · showing ${all.length ? RPAGE * PAGE + 1 : 0}–${Math.min(all.length, RPAGE * PAGE + PAGE)}</small></h4><div class="rchips">${shown.map(z => `<button class="chip rchip ${RPET === z.iid ? 'on' : ''}" data-a="gRosterPick" data-id="${z.iid}" aria-pressed="${RPET === z.iid}">${G.petImg(z, 'tiny')} ${esc(z.name)}${team.has(z.iid) ? ' ★ team' : ''}</button>`).join('')}</div>
    ${pages > 1 ? `<div class="row left tight"><button class="btn ghost sm" data-a="gRPage" data-d="-1" ${RPAGE === 0 ? 'disabled' : ''}>◀ Previous zone</button><span class="small">Zone ${RPAGE + 1} of ${pages}</span><button class="btn ghost sm" data-a="gRPage" data-d="1" ${RPAGE >= pages - 1 ? 'disabled' : ''}>Next zone ▶</button></div>` : ''}<p class="small">★ = your three battle fighters. Everyone else lives in the room.</p></div>`;
  const themes = `<div class="rthemes" role="group" aria-label="Room look">${Object.entries(RTHEME).map(([k, [n]]) => `<button class="btn ${r.theme === k ? 'big' : 'ghost'} sm" data-a="gRTheme" data-t="${k}" aria-pressed="${r.theme === k}">${n}</button>`).join('')}</div>`;
  C.view(`${G.hdr()}<div class="card room2"><div class="rmbar"><div class="seg2" role="group" aria-label="Room mode"><button class="btn ${MODE === 'practice' ? 'big' : 'ghost'}" data-a="gMode" data-m="practice" aria-pressed="${MODE === 'practice'}">Practice</button><button class="btn ${edit ? 'big' : 'ghost'}" data-a="gMode" data-m="edit" aria-pressed="${edit}">Edit room</button></div><button class="btn ghost" data-a="gGreet">👋 Say hi</button><button class="btn ghost" data-a="gWardrobe">Wardrobe</button></div>
    ${msg ? `<p class="bubble" role="status">${esc(msg)}</p>` : ''}
    <div class="roomscene ${edit ? 'edit' : ''}" id="rscene" style="--acc:${['#fff6cf', '#ffd9ec', '#d9f0ff'][(r.accent || 0) % 3]}"><span class="rbg" style="filter:${RTHEME[r.theme][1] || 'none'}"></span><span class="rlight"></span>${board}${placed}${pets}
      <button class="ravatar" id="ravatar" data-a="gGreet" aria-label="Greet a companion" style="left:9%;top:96%;z-index:2000"><span class="rsh"></span><span class="avbig">${G.avatarHtml(p, { bg: false })}</span></button></div>
    ${edit ? `<div class="redit"><h3>Edit your room</h3><p class="small">Drag a piece anywhere on the floor or walls, tap a spot after selecting it, or use the arrow keys (hold Shift for bigger steps).</p>${themes}
      <div class="row left tight"><button class="btn ghost sm" data-a="gUndo" ${UNDO.length ? '' : 'disabled'}>↶ Undo</button>${selIt ? `<span class="small">Selected: <b>${esc(G.PROP[selIt.id].name)}</b></span><button class="btn ghost sm" data-a="gUnplace" data-id="${selIt.id}">Put away in inventory</button>` : '<span class="small">Tap a piece to select it.</span>'}</div>
      <h4>In your room (${r.items.length})</h4>${r.items.map(it => `<div class="ritem ${SEL === it.id ? 'sel' : ''}">${thumb(it.id)}<b>${esc(G.PROP[it.id].name)}</b><button class="btn ghost sm" data-a="gSelProp" data-id="${it.id}">Select</button><button class="btn ghost sm" data-a="gUnplace" data-id="${it.id}">Put away</button></div>`).join('') || '<p class="small">Nothing placed yet.</p>'}
      <h4>Owned, not placed (${unplaced.length})</h4>${unplaced.map(id => `<div class="ritem">${thumb(id)}<b>${esc(G.PROP[id].name)}</b><button class="btn sm" data-a="gPlaceProp" data-id="${id}">Place in room</button></div>`).join('') || '<p class="small">Everything you own is in the room.</p>'}<p class="small">Need more furniture? The Shop has some.</p></div>${roster}`
    : `${roster}<div class="rpractice"><h3>Practise in your room</h3><ul>${r.items.map(it => { const pr = G.PROP[it.id], dest = PROPDEST[it.id], ok = dest ? G.destPlayable(G.DEST[dest]) : true;
      return `<li><span>${art('prop_' + it.id.replace(/-/g, '_'), '🪑', 'tinyart')} <b>${esc(pr.name)}</b><br><small>${esc(dest ? (ok ? pr.activity : 'Needs reviewed questions') : PRODEC[it.id] || '')}</small></span><button class="btn ghost sm" data-a="gProp" data-id="${it.id}">${dest ? (ok ? 'Start battle' : 'Locked') : PRODEC[it.id]}</button></li>`; }).join('')}</ul></div>`}</div>${G.nav('room')}`);
};
A.gRoom = () => G.room(); A.gMode = d => { MODE = d.m; SEL = null; sfx.tap(); G.room(); };
A.gRTheme = d => { const r = fixRoom(C.cur().room); r.theme = d.t; C.save(); sfx.tap(); G.room(); };
A.gRPage = d => { RPAGE = Math.max(0, RPAGE + +d.d); sfx.tap(); G.room(); };
A.gRosterPick = d => { RPET = d.id; sfx.tap(); G.room(); };
A.gSelProp = d => { SEL = d.id; sfx.tap(); G.room(); };
A.gUnplace = d => { const p = C.cur(); snap(); p.room.items = p.room.items.filter(i => i.id !== d.id); if (SEL === d.id) SEL = null; C.save(); G.playSfx('ui-back'); G.room(`${G.PROP[d.id].name} is back in your inventory.`); };
A.gUndo = () => { const p = C.cur(), prev = UNDO.pop(); if (!prev) return; p.room.items = JSON.parse(prev); C.save(); G.playSfx('ui-back'); G.room('Undone.'); };
A.gPlaceProp = d => { const p = C.cur(), r = fixRoom(p.room); if (r.items.some(i => i.id === d.id)) return; snap(); const n = r.items.length; r.items.push({ id: d.id, x: .25 + (n % 5) * .13, y: .62 + (n % 3) * .1 }); SEL = d.id; C.save(); G.playSfx('furniture-place'); G.closePanel(); MODE = 'edit'; G.room(`${G.PROP[d.id].name} placed. Drag it where you like.`); };
/* free drag, click-to-place and keyboard nudges */
let DRAG = null, JUSTDRAG = false;
const place = (id, nx, ny, save) => { const it = C.cur().room.items.find(i => i.id === id); if (!it) return; it.x = Math.min(FLOOR.x1, Math.max(FLOOR.x0, nx)); it.y = Math.min(FLOOR.y1, Math.max(FLOOR.y0, ny)); const el = document.querySelector(`.rprop[data-id="${id}"]`); if (el) { el.style.left = it.x * 100 + '%'; el.style.top = it.y * 100 + '%'; el.style.zIndex = Math.round(it.y * 1000); } if (save) { C.save(); G.playSfx('furniture-place'); } };
document.addEventListener('pointerdown', e => { const el = e.target.closest && e.target.closest('.roomscene.edit .rprop'); if (!el || MODE !== 'edit') return; const sc = $('#rscene'), it = C.cur().room.items.find(i => i.id === el.dataset.id); if (!it) return;
  DRAG = { id: it.id, sx: e.clientX, sy: e.clientY, ox: it.x, oy: it.y, moved: false, snapped: false }; SEL = it.id; try { el.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } void sc; });
document.addEventListener('pointermove', e => { if (!DRAG) return; const sc = $('#rscene'); if (!sc) return; const b = sc.getBoundingClientRect(), dx = e.clientX - DRAG.sx, dy = e.clientY - DRAG.sy;
  if (!DRAG.moved && Math.hypot(dx, dy) < 4) return; if (!DRAG.snapped) { snap(); DRAG.snapped = true; } DRAG.moved = true; place(DRAG.id, DRAG.ox + dx / b.width, DRAG.oy + dy / b.height, false); });
document.addEventListener('pointerup', () => { if (!DRAG) return; const d = DRAG; DRAG = null; if (d.moved) { JUSTDRAG = true; setTimeout(() => { JUSTDRAG = false; }, 250); C.save(); G.playSfx('furniture-place'); G.room('Saved. It stays where you dropped it.'); } else G.room(); });
document.addEventListener('click', e => { const sc = e.target.closest && e.target.closest('.roomscene.edit'); if (!sc || JUSTDRAG || e.target.closest('.rprop') || e.target.closest('.rpet,.ravatar') || !SEL || MODE !== 'edit') return; const b = sc.getBoundingClientRect(); snap(); place(SEL, (e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height, true); G.room('Moved.'); });
document.addEventListener('keydown', e => { if (MODE !== 'edit' || !SEL || !$('#rscene')) return; const a = document.activeElement; if (a && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)) return; const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (!k) return;
  e.preventDefault(); const it = C.cur().room.items.find(i => i.id === SEL); if (!it) return; const st = e.shiftKey ? .05 : .015; snap(); place(SEL, it.x + k[0] * st, it.y + k[1] * st, true); G.room(); setTimeout(() => { const el = document.querySelector(`.rprop[data-id="${SEL}"]`); if (el) el.focus({ preventScroll: true }); }, 0); });
/* greetings: the adventurer faces a companion, takes a short capped step inside the scene, then returns to rest */
A.gGreet = d => {
  const sc = $('#rscene'), av = $('#ravatar'); if (!sc || !av) return; const p = C.cur(), all = [...sc.querySelectorAll('.rpet')]; const el = (d && d.id && sc.querySelector(`.rpet[data-iid="${d.id}"]`)) || sc.querySelector(`.rpet[data-iid="${RPET}"]`) || all[0];
  if (GREET) { GREET.forEach(clearTimeout); } GREET = []; const rest = { x: .09, y: .96 };
  if (el) { const b = sc.getBoundingClientRect(), pb = el.getBoundingClientRect(), px = (pb.left + pb.width / 2 - b.left) / b.width, py = Math.min(FLOOR.y1, (pb.bottom - b.top) / b.height), dir = px >= rest.x ? 1 : -1, dist = Math.abs(px - rest.x), step = Math.max(0, Math.min(.16, Math.max(.04, dist - .1), dist - .06)), tx = Math.min(.95, Math.max(.05, rest.x + dir * step));
    av.classList.toggle('face-l', dir < 0); av.style.transition = 'left .45s ease, top .45s ease'; av.style.left = tx * 100 + '%'; av.style.top = Math.min(.97, Math.max(.9, py)) * 100 + '%'; anim(av.querySelector('.avbig').firstElementChild || av.querySelector('.avbig'), 'wave', 900);
    anim(el.querySelector('.pet'), 'jump', 800); floaty('❤️', el); G.playSfx('ui-click');
    GREET.push(setTimeout(() => { av.style.left = rest.x * 100 + '%'; av.style.top = rest.y * 100 + '%'; av.classList.remove('face-l'); }, 1300));
    const l = p.zoo.find(z => z.iid === el.dataset.iid); const b2 = $('.bubble[role=status]'), msg = `${p.name} waves at ${l ? l.name : 'your companion'}.`; if (b2) b2.textContent = msg; else { const m = document.createElement('p'); m.className = 'bubble'; m.setAttribute('role', 'status'); m.textContent = msg; $('.rmbar').after(m); } }
  else { anim(av.querySelector('.avbig').firstElementChild || av, 'wave', 900); G.playSfx('ui-click'); }
};
A.gProp = d => {
  const p = C.cur(), pr = G.PROP[d.id]; if (MODE === 'edit') { SEL = d.id; return; }
  if (d.id === 'star-wardrobe') return G.wardrobe(); if (d.id === 'reading-lamp') { p.room.accent = ((p.room.accent || 0) + 1) % 3; C.save(); G.playSfx('ui-click'); return G.room('The light changed.'); }
  if (d.id === 'star-bed') { G.playSfx('ui-click'); anim($('#rpet') && $('#rpet').querySelector('.pet'), 'jump', 800); floaty('💤', $('#rpet')); return; }
  const dest = G.DEST[PROPDEST[d.id]]; if (!G.destPlayable(dest)) return G.panel(`<h2>${esc(pr.name)}</h2><div class="fb warn"><div><b>Needs reviewed questions.</b> ${esc(dest.name)} opens once a teacher reviews its questions.</div></div><div class="row left"><button class="btn ghost" data-a="gClose">Close</button></div>`);
  G.playSfx({ 'scholar-desk': 'desk-page', 'artist-easel': 'easel-brush', telescope: 'telescope-focus', xylophone: 'xylophone', aquarium: 'terrarium', greenhouse: 'terrarium', 'chemistry-bench': 'lab-bubble' }[d.id] || 'ui-open');
  G.panel(`<h2>${esc(pr.name)}</h2><p>${esc(pr.activity)}</p><p class="small">Villain: ${esc(G.ENEMY[pr.enemy].name)} · ${esc(dest.name)}</p><div class="row left"><button class="btn big" data-a="gRoomBattle" data-id="${d.id}">Start battle</button><button class="btn ghost" data-a="gClose">Not now</button></div>`);
};
A.gRoomBattle = d => { const p = C.cur(), pr = G.PROP[d.id], de = G.DEST[PROPDEST[d.id]], it = G.destItems(p, de, false); G.startBattle({ dest: de.id, enemy: pr.enemy, items: it.items, min: it.min, resolve: it.resolve, source: 'room', returnTo: 'room', title: pr.name, again: () => A.gRoomBattle(d) }); };

/* ---------- Shop ---------- */
const filt = (list, p) => list.filter(c => (FIL.slot === 'all' || c.slot === FIL.slot) && (FIL.hue === 'all' || String(c.hue) === FIL.hue) && (FIL.own === 'all' || (FIL.own === 'owned') === p.cosOwned.includes(c.id)));
const filtUi = () => `<div class="filt" role="group" aria-label="Filters"><label>Slot <select class="inp sel" data-f="slot">${['all', 'head', 'face', 'neck', 'back'].map(s => `<option ${FIL.slot === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
  <label>Owned <select class="inp sel" data-f="own">${[['all', 'All'], ['owned', 'Owned'], ['not', 'Not owned']].map(([v, t]) => `<option value="${v}" ${FIL.own === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
  <label>Colourway <select class="inp sel" data-f="hue"><option value="all">All</option>${HUES.map(h => `<option value="${h}" ${FIL.hue === String(h) ? 'selected' : ''}>${hueName(h)}</option>`).join('')}</select></label></div>`;
document.addEventListener('change', e => { const t = e.target; if (t && t.dataset && t.dataset.f && t.closest('.filt')) { FIL[t.dataset.f] = t.value; const w = $('.wardrobe'); if (w) G.wardrobe(); else G.shop(); } });
G.shop = function shop(tab) {
  if (tab) SHOP = tab; const p = C.cur(); let grid = '', note = '';
  const it = (k, id, img, name, price, state, extra = '') => `<button class="item ${state === 'own' ? 'own' : ''}" data-a="gBuy" data-k="${k}" data-id="${id}" ${state === 'own' ? 'aria-disabled="true"' : ''}>${img}<b>${esc(name)}</b><small>${state === 'own' ? 'Owned' : price != null ? `${price} coins` : ''}</small>${extra ? `<span class="xpl">${esc(extra.replace(/^ · /, ''))}</span>` : ''}</button>`;
  if (SHOP === 'food') { grid = FOOD.map(([id, n, pr, xp]) => it('food', id, art('item_' + id, '🍎'), n, pr, '', `+${xp} XP to ${G.lead(p) ? G.lead(p).name : 'your lead pet'}`)).join(''); note = 'Food gives your lead pet XP.'; }
  else if (SHOP === 'cos') { grid = filt(D.cosmetics.filter(c => c.unlock === 'shop'), p).map(c => it('cos', c.id, cosImg(c), c.name, SLOTP[c.slot], p.cosOwned.includes(c.id) ? 'own' : '', ` · ${c.slot}`)).join('') || '<p>No items match these filters.</p>'; note = 'Daily-reward and boss items are won in chests and on the prize wheel. These are the ones you can buy.'; }
  else if (SHOP === 'egg') { D.families.filter(f => f.avail === 'hatchery').forEach(f => { p.seen[f.id] = true; }); C.save(); grid = G.HATCHERY.map(f => it('egg', f.id, G.formImg(f.id + '-egg', 'mid'), f.name + ' Egg', G.HATCH_COST, '')).join(''); note = 'Hatchery eggs hatch after you win a few battles. Other families come from quests and boss fights.'; }
  else if (SHOP === 'world') { grid = Object.entries(THEME_PRICE).map(([id, pr]) => it('world', id, art('theme_' + id, '🌍'), id[0].toUpperCase() + id.slice(1), pr, p.inv.includes(id) || id === 'sky' ? 'own' : '')).join(''); note = 'A world changes your room and map background.'; }
  else if (SHOP === 'bag') { grid = BAGP.map(([id, n, pr, im, em]) => it('bag', id, art(im, em), n, pr, '', ` · you have ${p.bag[id] || 0}`)).join('') + it('bag', 'magnet', art('item_magnet', '🧲'), 'Coin Magnet', 45, '', ` · you have ${p.pow.magnet || 0}`); note = 'Battle Bag items are used in battle. A Coin Magnet doubles the coins from your next chest.'; }
  else if (SHOP === 'gear') { grid = D.avatar.gear.map(g => it('gear', g.id, art('gear_' + g.id.replace(/-/g, '_'), '🎽'), G.humanize(g.id).replace(/\b\w/g, c => c.toUpperCase()), GEAR_PRICE[g.id], p.gear.owned.includes(g.id) ? 'own' : '', ` · ${g.slot}`)).join(''); note = 'Gear is only for how your adventurer looks. It never changes what you answer.'; }
  else { grid = Object.keys(PROP_PRICE).map(id => it('prop', id, art('prop_' + id.replace(/-/g, '_'), '🪑'), G.PROP[id].name, PROP_PRICE[id], p.room.owned.includes(id) ? 'own' : '')).join(''); note = 'Furniture goes in your Pet Room. Some pieces start practice battles.'; }
  const tabs = [['food', 'Food'], ['cos', 'Pet items'], ['egg', 'Hatchery'], ['world', 'Worlds'], ['bag', 'Battle Bag'], ['gear', 'Gear'], ['prop', 'Furniture']];
  C.view(`${G.hdr()}<div class="card shopcard"><div class="shophead"><div class="ribbon">Shop</div><span class="chip coinc">${coin()} <b>${p.coins}</b></span></div>
    <div class="stabs" role="tablist">${tabs.map(([k, t]) => `<button role="tab" aria-selected="${SHOP === k}" class="stab ${SHOP === k ? 'on' : ''}" data-a="gShopTab" data-tab="${k}">${t}</button>`).join('')}</div>${SHOP === 'cos' ? filtUi() : ''}<p id="shopmsg" class="err" role="status"></p><p class="small">${esc(note)}</p><div class="shop">${grid}</div></div>${G.nav('shop')}`);
};
A.gShop = () => G.shop(); A.gShopTab = d => { sfx.tap(); G.shop(d.tab); };
A.gBuy = d => {
  const p = C.cur(), say = t => { const m = $('#shopmsg'); if (m) m.textContent = t; sfx.bad(); }, pay = n => { if (p.coins < n) { say(`You need ${n - p.coins} more coins. Win battles to earn them!`); return false; } p.coins -= n; return true; }; let ok = false;
  if (d.k === 'food') { const f = FOOD.find(x => x[0] === d.id), lead = G.lead(p); if (!lead) return say('Hatch a pet first. Win a battle to hatch your egg.'); if (!pay(f[2])) return; const ev = G.gainXp(p, lead, f[3]); sfx.ok(); G.playSfx('hatch'); ok = true; if (ev.evolved) confetti(30, ['✨']); }
  else if (d.k === 'cos') { if (p.cosOwned.includes(d.id)) return; const c = G.COS[d.id]; if (!pay(SLOTP[c.slot])) return; p.cosOwned.push(d.id); ok = true; }
  else if (d.k === 'egg') { if (!pay(G.HATCH_COST)) return; G.addInst(p, d.id); G.playSfx('new-pet'); ok = true; }
  else if (d.k === 'world') { if (p.inv.includes(d.id) || d.id === 'sky') { p.theme = d.id; ok = true; } else { if (!pay(THEME_PRICE[d.id])) return; p.inv.push(d.id); p.theme = d.id; ok = true; } }
  else if (d.k === 'bag') { const pr = d.id === 'magnet' ? 45 : BAGP.find(x => x[0] === d.id)[2]; if (!pay(pr)) return; if (d.id === 'magnet') p.pow.magnet++; else p.bag[d.id]++; ok = true; G.playSfx('item-use'); }
  else if (d.k === 'gear') { if (p.gear.owned.includes(d.id)) return; if (!pay(GEAR_PRICE[d.id])) return; p.gear.owned.push(d.id); ok = true; }
  else if (d.k === 'prop') { if (p.room.owned.includes(d.id)) return; if (!pay(PROP_PRICE[d.id])) return; p.room.owned.push(d.id); G.playSfx('furniture-place'); C.save(); sfx.coin(); G.shop(); return G.panel(`<h2>${esc(G.PROP[d.id].name)} is yours!</h2><div class="chestimg center">${art('prop_' + d.id.replace(/-/g, '_'), '🪑')}</div><p>It is in your inventory. Put it in your room now, or place it later from Edit room.</p><div class="row"><button class="btn big" data-a="gPlaceProp" data-id="${d.id}">Place now</button><button class="btn ghost" data-a="gClose">Later</button></div>`); }
  if (ok) { C.save(); sfx.coin(); const sc = $('.shop'), st = window.scrollY; G.shop(); window.scrollTo(0, st); void sc; }
};

/* ---------- Wardrobe ---------- */
let WD = null;
G.wardrobe = function wardrobe() {
  const p = C.cur(), pets = p.zoo.filter(z => G.stageOf(z) >= 1);
  if (!WD || WD.pid !== p.id) WD = { pid: p.id, iid: (G.lead(p) || pets[0] || {}).iid, tab: 'pet', cos: null, gear: null, outfit: null };
  const z = G.inst(p, WD.iid); if (!WD.cos && z) WD.cos = { ...z.cos }; if (!WD.gear) WD.gear = { ...p.gear.on }; if (!WD.outfit && p.av) WD.outfit = p.av.outfit;
  const prevPet = z ? { ...z, cos: WD.cos } : null, saved = z && JSON.stringify(WD.cos) === JSON.stringify(z.cos);
  let body;
  if (WD.tab === 'pet') {
    const list = filt(D.cosmetics, p);
    body = pets.length ? `<div class="wdgrid"><div class="wdprev">${G.petImg(prevPet, 'huge')}<select class="inp sel" data-wp aria-label="Choose a pet">${pets.map(x => `<option value="${x.iid}" ${x.iid === WD.iid ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
      <div class="slots">${['head', 'face', 'neck', 'back'].map(s => `<span class="slt">${s}: <b>${WD.cos[s] ? esc(G.COS[WD.cos[s]].name) : 'none'}</b></span>`).join('')}</div><div class="row tight"><button class="btn big" data-a="gWdSave" ${saved ? 'disabled' : ''}>Save look</button><button class="btn ghost" data-a="gWdReset" ${saved ? 'disabled' : ''}>Reset preview</button></div><p class="small" role="status">${saved ? 'Saved on this pet.' : 'Previewing. Not saved yet.'}</p></div>
      <div>${filtUi()}<div class="shop wd">${list.map(c => { const own = p.cosOwned.includes(c.id), on = WD.cos[c.slot] === c.id; return `<button class="item ${on ? 'own' : ''}" data-a="gWdCos" data-id="${c.id}" ${own ? '' : 'aria-disabled="true"'}>${cosImg(c)}<b>${esc(c.name)}</b><small>${on ? 'Previewing' : own ? 'Owned · ' + c.slot : 'Not owned · ' + c.slot}</small></button>`; }).join('') || '<p>No items match these filters.</p>'}</div></div></div>` : '<p>Hatch a pet to dress it up.</p>';
  } else {
    const gsaved = JSON.stringify(WD.gear) === JSON.stringify(p.gear.on) && (!p.av || WD.outfit === p.av.outfit);
    body = `<div class="wdgrid"><div class="wdprev">${p.avDone || p.av ? `<span class="avbig">${G.avatarSvg({ ...(p.av || G.avDefault()), outfit: WD.outfit || (p.av && p.av.outfit) }, { gear: WD.gear })}</span>` : '<p>Create your adventurer first.</p>'}<div class="row tight"><button class="btn big" data-a="gWdSaveAv" ${gsaved ? 'disabled' : ''}>Save look</button><button class="btn ghost" data-a="gWdResetAv" ${gsaved ? 'disabled' : ''}>Reset preview</button></div><p class="small" role="status">${gsaved ? 'Saved.' : 'Previewing. Not saved yet.'}</p></div>
      <div><h3>Outfits</h3><div class="shop wd">${D.avatar.outfits.map(o => `<button class="item ${WD.outfit === o.id ? 'own' : ''}" data-a="gWdOutfit" data-id="${o.id}">${art('gear_' + o.id.replace(/-/g, '_'), '👕')}<b>${esc(G.humanize(o.id))}</b><small>${WD.outfit === o.id ? 'Previewing' : 'Free'}</small></button>`).join('')}</div>
      <h3>Gear</h3><div class="shop wd">${D.avatar.gear.map(g => { const own = p.gear.owned.includes(g.id), on = WD.gear[g.slot] === g.id; return `<button class="item ${on ? 'own' : ''}" data-a="gWdGear" data-id="${g.id}" ${own ? '' : 'aria-disabled="true"'}>${art('gear_' + g.id.replace(/-/g, '_'), '🎽')}<b>${esc(G.humanize(g.id))}</b><small>${on ? 'Previewing' : own ? 'Owned · ' + g.slot : 'Not owned · ' + g.unlock}</small></button>`; }).join('')}</div><p class="small">Gear is for looks only.</p></div></div>`;
  }
  C.view(`${G.hdr()}<div class="card wardrobe"><h2>Wardrobe</h2><div class="worlds" role="tablist"><button role="tab" aria-selected="${WD.tab === 'pet'}" class="wtab ${WD.tab === 'pet' ? 'on' : ''}" data-a="gWdTab" data-tab="pet">Pet items</button><button role="tab" aria-selected="${WD.tab === 'avatar'}" class="wtab ${WD.tab === 'avatar' ? 'on' : ''}" data-a="gWdTab" data-tab="avatar">Adventurer</button></div>${body}
    <div class="row"><button class="btn ghost" data-a="gRoom">Back to the Pet Room</button></div></div>${G.nav('room')}`);
};
A.gWardrobe = () => { WD = null; G.wardrobe(); }; A.gWdTab = d => { WD.tab = d.tab; G.wardrobe(); };
document.addEventListener('change', e => { const t = e.target; if (t && t.dataset && 'wp' in t.dataset) { WD.iid = t.value; WD.cos = null; G.wardrobe(); } });
A.gWdCos = d => { const p = C.cur(), c = G.COS[d.id]; if (!p.cosOwned.includes(d.id)) { return G.panel(`<h2>${esc(c.name)}</h2><p>You do not own this yet. ${c.unlock === 'shop' ? 'It is in the Shop under Pet items.' : c.unlock === 'daily' ? 'Win it on the prize wheel.' : 'Win it from a boss chest.'}</p><div class="row left"><button class="btn ghost" data-a="gClose">Close</button></div>`); } if (WD.cos[c.slot] === d.id) delete WD.cos[c.slot]; else WD.cos[c.slot] = d.id; sfx.tap(); G.wardrobe(); };
A.gWdSave = () => { const p = C.cur(), z = G.inst(p, WD.iid); z.cos = { ...WD.cos }; C.save(); G.playSfx('furniture-place'); G.wardrobe(); }; A.gWdReset = () => { const z = G.inst(C.cur(), WD.iid); WD.cos = { ...z.cos }; G.wardrobe(); };
A.gWdOutfit = d => { WD.outfit = d.id; sfx.tap(); G.wardrobe(); };
A.gWdGear = d => { const p = C.cur(), g = D.avatar.gear.find(x => x.id === d.id); if (!p.gear.owned.includes(d.id)) return G.panel(`<h2>${esc(G.humanize(d.id))}</h2><p>You do not own this yet. ${esc(g.unlock)}.</p><div class="row left"><button class="btn ghost" data-a="gClose">Close</button></div>`); if (WD.gear[g.slot] === d.id) delete WD.gear[g.slot]; else WD.gear[g.slot] = d.id; sfx.tap(); G.wardrobe(); };
A.gWdSaveAv = () => { const p = C.cur(); p.gear.on = { ...WD.gear }; if (p.av) p.av.outfit = WD.outfit; else { p.av = { ...G.avDefault(), outfit: WD.outfit }; } C.save(); G.playSfx('furniture-place'); G.wardrobe(); };
A.gWdResetAv = () => { const p = C.cur(); WD.gear = { ...p.gear.on }; WD.outfit = p.av ? p.av.outfit : null; G.wardrobe(); };
A.gShop2 = () => G.shop('cos');

/* gear that is earned, not bought */
const _claim = G.claim;
G.claim = (p, pd) => { const rc = _claim(p, pd); if (!rc.dup) { const add = (id, why) => { if (!p.gear.owned.includes(id)) { p.gear.owned.push(id); rc.lines.push(`${art('gear_' + id.replace(/-/g, '_'), '🎽', 'sm')} New gear: <b>${esc(G.humanize(id))}</b> (${why})`); } };
  if (pd.src === 'daily') add('star-wand', 'first Daily Battle win'); if (pd.boss) add('star-cape', 'first boss win'); if (p.stats.wins >= 5) add('moon-hat', 'five wins'); C.save(); } return rc; };
});
