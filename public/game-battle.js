/* Storyland Quest – the one battle flow used by islands, room props, daily battles, Pip missions and teacher assignments.
   question → (retry) → cast token → move tray → VFX + sounds → resolve → next turn → victory → chest. */
window.SQ_PARTS.push((G, C) => {
'use strict';
const D = G.D, E = G.E;
const { S, $, esc, art, coin, pick, shuffle, clamp, today, burst, anim, floaty, confetti, flyCoins, countUp, calm, sfx, speak, hush } = C;
const qa = s => [...document.querySelectorAll(s)];
const hash = s => { let h = 5381; for (const c of String(s)) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return h.toString(16).padStart(8, '0'); };
const strip = s => String(s).replace(/<[^>]+>/g, '');
let BT = null;
G.battleActive = () => !!BT;
G.debug = () => BT; /* test hook: lets the QA scripts read the battle state */

/* ---------- sound: the supplied WAVs, quiet under read-aloud ---------- */
const bufs = new Map();
G.playSfx = async id => {
  if (!S.settings.sound || !id) return;
  try {
    const a = C.audio(); let b = bufs.get(id);
    if (!b) { b = await a.decodeAudioData(await (await fetch('assets/sfx/' + id + '.wav')).arrayBuffer()); bufs.set(id, b); }
    const src = a.createBufferSource(), g = a.createGain();
    g.gain.value = 'speechSynthesis' in window && speechSynthesis.speaking ? .18 : .7;
    src.buffer = b; src.connect(g).connect(a.destination); src.start();
  } catch (e) { /* sound is optional */ }
};
const snd = id => { if (G.fx) G.fx.stamp('sfx', { id }); return G.playSfx(id); };
/* sound cues per move: [windup, release, impact]. The supplied polish cues are used first for Ember Pop and Star Scratch. */
const CUES = G.cueMap = { 'ember-pop': ['ember-windup', 'ember-release', 'ember-impact'], 'star-scratch': [null, 'scratch-release', 'scratch-impact'] };
const cues = m => CUES[m] || [null, m + '-cast', m + '-impact'];
const FOECOL = { 'ink-baron': '#9a5cff', 'thorn-marshal': '#4fd16a', 'clockwork-regent': '#ffc23d', 'baroness-vesper': '#c9d6ff' };

/* ---------- preparing questions ---------- */
function prepare(it) {
  const skill = it.skill || it.skillId, qid = it.qid || 'q' + hash(skill + '|' + it.key);
  const tiles = it.type === 'build' || it.type === 'order';
  const opts = tiles ? [{ id: 'ok' }, ...Array.from({ length: 12 }, (_, i) => ({ id: 'b' + (i + 1) }))] : (it.opts || it.options.map((t, i) => ({ id: 'o' + i, text: t })));
  const correctId = tiles ? 'ok' : (it.correctId || 'o' + it.answer);
  const r = { ...it, skill, qid, tiles, opts, correctId };
  if (tiles) { r.pool = (it.pool || []).map(x => ({ ...x, lock: false })); r.tray = []; }
  r.eq = { id: qid, skillId: skill, options: opts.map(o => ({ id: o.id })), correctId, wrongChoiceTags: it.tags || {} };
  return r;
}
const curItem = () => BT.byId[BT.state.questions[BT.state.index].id];
const step = (type, extra = {}) => { const b = BT.state, n = E.battleStep(b, { type, turn: b.turn, ...extra }); BT.state = n; return n !== b; };
const syncBag = () => { const p = BT.p; p.bag = { ...p.bag, clue: BT.state.bag.clue, look: BT.state.bag.look, bubble: BT.state.bag.bubble, double: BT.state.bag.double }; C.save(); };
const later = (fn, ms) => { const mine = BT; const t = setTimeout(() => { if (BT === mine && BT) fn(); }, ms); BT.timers.push(t); };

/* ---------- start ---------- */
G.startBattle = function startBattle(spec) {
  const p = C.cur(); hush(); G.closePanel();
  const ready = G.team(p).filter(z => G.stageOf(z) >= 1).slice(0, 3);
  const team = ready.length ? ready.map(z => ({ id: z.iid, moveIds: G.movesOf(z) })) : [{ id: 'pip', moveIds: ['pounce'] }];
  const seenQ = new Set(), items = spec.items.map(prepare).filter(i => !seenQ.has(i.qid) && seenQ.add(i.qid)), byId = Object.fromEntries(items.map(i => [i.qid, i])); /* one question per ID */
  const min = Math.max(1, Math.min(spec.min, new Set(items.map(i => i.qid)).size)), resolve = Math.max(2, spec.resolve || min * 2);
  const state = E.createBattle({ team, questions: items.map(i => i.eq), resolve, minimumCorrect: min, bag: p.bag, hp: 12, boss: !!spec.boss, practice: !!S.settings.practice, rules: G.rulesFor ? G.rulesFor(team) : {} });
  const dest = G.DEST[spec.dest] || G.DEST.mountain, enemy = { ...G.ENEMY[spec.enemy || dest.proposedBossId], ...(spec.enemyName ? { name: spec.enemyName } : {}) };
  BT = { spec, p, state, byId, dest, enemy, min, battleId: 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), shownResolve: state.resolve, shownHp: state.hp, timers: [], hint: false, msg: '', picked: null, t0: performance.now(), busy: false, firsts: 0, assistedN: 0, tileTries: 0, lastTeleHit: '' };
  if (spec.guided) { BT.state = { ...BT.state, assisted: true }; BT.hint = true; }
  draw(); telegraph(spec.tellFirst || spec.boss ? `${enemy.name} will counter with ${(G.counterOf(enemy) || {}).move}. Answer carefully!` : `${enemy.name} is ready…`);
};
G.team2 = () => BT && BT.state.team;

function hdrB() {
  const s = S.settings;
  return `<header class="top slim"><button class="btn ghost" data-a="bExit">← Back</button><span class="chip bt-title">${esc(BT.spec.title || BT.dest.name)}</span><span class="sp"></span>
    <button class="chip setb" data-a="gSettings" aria-haspopup="true" aria-expanded="false">⚙ Settings</button>
    <div class="pop" id="gset" hidden role="group" aria-label="Settings">${[['sound', 'Game sounds'], ['voice', 'Read-aloud voice'], ['narration', 'Narration (auto-read story)'], ['font', 'Easy-read letters'], ['practice', 'Practice mode (gentler counterattacks)']].map(([k, t]) => `<button class="setrow" data-a="gTog" data-k="${k}" aria-pressed="${!!s[k]}"><span>${t}</span><b class="st">${s[k] ? 'On' : 'Off'}</b></button>`).join('')}</div></header>`;
}
function draw() {
  const b = BT, en = b.enemy;
  C.view(`${hdrB()}<div class="btshell" id="btshell"><div class="bt-pin"><div class="arena stage" id="bt-arena" style="--bg:url(assets/arena/${b.dest.id}.jpg)"><span class="stagefb" id="stagefb">Arena picture is not available</span>
      <div class="unit u-l" id="hp-me"></div><div class="unit foe u-r" id="hp-foe"></div>
      <div class="side left"><span class="gshadow"></span><div class="fighter" id="fme"><div class="fi"></div></div><span class="shield" id="shield" hidden></span></div>
      <div class="vs"><div class="bt-hud" id="bt-hud"></div></div>
      <div class="side right"><span class="gshadow"></span><div class="fighter mon" id="fmon"><div class="fi ${b.spec.spriteCls || ''}">${b.spec.sprite ? art(b.spec.sprite, '🦹') : art('v_' + en.spriteId.replace(/-/g, '_'), '🦹')}</div></div><span class="bt-tele" id="bt-tele" role="status"></span></div></div>
    <div class="bt-team" id="bt-team"></div><div class="coach" id="bt-coach" role="status" hidden></div></div><div id="bt-pass" class="card bt-pass" hidden></div><div class="card game bt-q" id="bt-q"></div></div>
    <div class="bt-sheet" id="bt-sheet" role="dialog" aria-label="Choose a move" hidden></div>`, false, true);
  const im = new Image(); im.onerror = () => { const a = $('#bt-arena'); if (a) a.classList.add('noimg'); }; im.src = `assets/arena/${b.dest.id}.jpg`;
  G.fx.attach($('#bt-arena')); mountFighters(true); paint();
}
/* put the active pet (and its aura) on the left, the villain (and its aura) on the right */
function mountFighters(first) {
  const t = BT.state.team[BT.state.active], z = t.id === 'pip' ? null : G.inst(BT.p, t.id), fi = $('#fme .fi');
  fi.className = 'fi' + (z && G.flipFor(z.fam, 'left') ? ' flip' : ''); fi.innerHTML = z ? G.petImg(z) : art('pip_cheer', '🦊', 'pipf');
  G.fx.emit = G.fx.emit.filter(e => e.key === BT.enemy.id);
  if (z) G.fx.aura(z.fam, () => $('#fme .pimg') || $('#fme'));
  if (first) { G.fx.aura(BT.enemy.id, () => $('#fmon .art') || $('#fmon')); G.spr.idle($('#fmon .fi'), 1); }
  BT.idleA && BT.idleA.cancel && BT.idleA.cancel(); BT.idleA = G.spr.idle($('#fme .fi'), 0); BT.lastActive = BT.state.active;
}
function activePet() { const t = BT.state.team[BT.state.active]; if (t.id === 'pip') return art('pip_cheer', '🦊', 'pipf'); const z = G.inst(BT.p, t.id); return z ? G.petImg(z) : art('pip_cheer', '🦊'); }

/* ---------- painting ---------- */
function hud() {
  const s = BT.state, phase = s.phase === 'ready' ? '<b>Move ready!</b>' : s.phase === 'casting' ? 'Casting…' : s.phase === 'victory' || s.phase === 'claimed' ? `${esc(BT.enemy.name)} surrenders!` : s.phase === 'retry' ? 'Try again' : s.phase === 'defeat' ? 'Checkpoint' : 'Answer to earn a cast';
  return `<div class="bt-state" role="status">Correct answers ${s.correctIds.length}/${s.minimumCorrect} · ${phase}${s.shield ? ' · 🫧 Shield on' : ''}${s.ward ? ` · Ward ${s.ward}` : ''}${s.feintCut ? ' · Next counter −1' : ''}${s.practice ? ' · Practice' : ''}</div>
    ${BT.msg ? `<div class="bt-msg" role="status">${BT.msg}</div>` : ''}`;
}
function units() {
  const s = BT.state, t = s.team[s.active], z = t.id === 'pip' ? null : G.inst(BT.p, t.id), nm = z ? z.name : 'Pip', pct = v => Math.max(0, Math.min(100, 100 * v));
  const me = $('#hp-me'), foe = $('#hp-foe');
  if (me) me.innerHTML = `<span class="ul">${esc(nm)} · HP <b>${BT.shownHp}/${s.maxHp}</b>${s.ward ? ` <em>Ward ${s.ward}</em>` : ''}</span><span class="hp me"><i id="bt-hpme" style="width:${pct(BT.shownHp / s.maxHp)}%"></i></span>`;
  if (foe) foe.innerHTML = `<span class="ul">${esc(BT.enemy.name)} · Resolve <b>${BT.shownResolve}/${s.maxResolve}</b></span><span class="hp"><i id="bt-hp" style="width:${pct(BT.shownResolve / s.maxResolve)}%"></i></span>`;
}
const COACH = { question: ['Pick an answer.', 'A right answer earns a move.'], retry: ['Not quite. Read the hint,', 'then tap Try again.'], ready: ['Now tap your move!', 'Your pet attacks the villain.'], casting: ['Watch the attack!', ''] };
function coach() {
  const el = $('#bt-coach'); if (!el) return; if (!BT.spec.warmup) { el.hidden = true; return; }
  const l = COACH[BT.state.phase]; if (!l) { el.hidden = true; return; }
  el.hidden = false; el.innerHTML = `${art('pip_cheer', '🦊', 'coachpip')}<span><b>${l[0]}</b>${l[1] ? `<br><small>${l[1]}</small>` : ''}</span>`;
  const it = curItem(); if (BT.state.phase === 'question' && !it.tiles && BT.readTurn !== BT.state.turn + ':' + it.qid && S.settings.voice && S.settings.narration) { BT.readTurn = BT.state.turn + ':' + it.qid; setTimeout(() => { if (BT && BT.state.phase === 'question') A.bReadQ(); }, 500); }
  if (BT.state.phase === 'retry') setTimeout(() => { const f = $('#bt-fb'); if (f) f.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 120);
}
function teamHtml() {
  const s = BT.state, canSwap = s.phase === 'question' && !s.swapped && !s.assisted && !s.attempts.some(a => a.turn === s.turn);
  const slots = [0, 1, 2].map(i => {
    const t = s.team[i], z = t && t.id !== 'pip' ? G.inst(BT.p, t.id) : null;
    if (!t) return `<div class="tslot empty"><span>Empty slot</span><small>Hatch or recruit a pet</small></div>`;
    const mv = t.moveIds.map(m => G.MOVE[m].name).join(', '), act = i === s.active;
    return `<div class="tslot ${act ? 'act' : ''}"><span class="tmini">${z ? G.petImg(z, 'tiny') : art('pip_cheer', '🦊', 'tinyart')}</span><b>${esc(z ? z.name : 'Pip')}</b><small>${act ? 'Active' : 'Reserve'} · ${esc(mv)}</small>
      ${act ? '' : `<button class="btn ghost sm" data-a="bSwap" data-i="${i}" ${canSwap ? '' : 'disabled'}>${canSwap ? 'Free swap' : 'Swap locked'}</button>`}</div>`; });
  const locked = G.team(BT.p).filter(z => G.stageOf(z) === 0).length;
  return `<div class="tstrip" role="group" aria-label="Your team">${slots.join('')}</div>${locked ? `<p class="small">${locked} egg${locked > 1 ? 's are' : ' is'} not ready to battle yet.</p>` : ''}`;
}
function passHtml(it) {
  const sents = it.passageSents || (it.story ? splitSents(it.story.text) : it.passage ? splitSents(it.passage) : null); if (!sents) return '';
  const done = ['ready', 'casting', 'victory', 'claimed'].includes(BT.state.phase), cites = (done || (BT.state.phase === 'retry' && (BT.spec.practice || it.tutor))) && it.cites ? it.cites : [];
  const wh = str => str.split(/(\s+)/).map(w => !w ? '' : /^\s+$/.test(w) ? ' ' : `<span class="w" data-a="bWord" data-w="${esc(w.replace(/[^A-Za-z'’-]/g, ''))}">${esc(w)}</span>`).join('');
  return `<div class="row left tight"><button class="say" data-a="bReadP">🔊 Read the passage</button><button class="say" data-a="bStop">⏹ Stop</button><small>Tap any word to hear it.</small></div><p class="bt-text">${sents.map(s => {
    const ms = cites.filter(c => c.sentenceId === s.id).map(c => ({ i: s.text.indexOf(c.quote), q: c.quote })).filter(m => m.i >= 0).sort((a, b) => a.i - b.i); let out = '', pos = 0;
    for (const m of ms) { if (m.i < pos) continue; out += wh(s.text.slice(pos, m.i)) + '<mark class="cite">' + wh(m.q) + '</mark>'; pos = m.i + m.q.length; }
    return `<span class="sent">${out + wh(s.text.slice(pos))}</span> `; }).join('')}</p>`;
}
const splitSents = t => (String(t).replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+["”')]*|[^.!?]+$/g) || []).map((x, i) => ({ id: 's' + (i + 1), text: x.trim() }));
function tilesHtml(it) {
  const tile = (x, w) => `<button class="tile ${x.lock ? 'lock' : ''}" data-a="bTile" data-id="${x.id}" data-w="${w}" ${BT.state.phase !== 'question' ? 'disabled' : ''}>${esc(x.t)}</button>`;
  const slots = it.goal.length - it.tray.length;
  return `<div class="tray ${it.big ? 'bigt' : ''} ${it.type}" id="tray">${it.tray.map(x => tile(x, 't')).join('')}${it.big ? '' : '<span class="slot"></span>'.repeat(Math.max(0, slots))}${it.big && !it.tray.length ? '<span class="ph">Tap the first step below 👇</span>' : ''}</div>
    <div class="pool ${it.big ? 'bigt' : ''} ${it.type}">${it.pool.map(x => tile(x, 'p')).join('')}</div>
    <div class="center"><button class="btn big" data-a="bCheck" ${BT.state.phase === 'question' && it.tray.length === it.goal.length ? '' : 'disabled'}>Check ✔</button></div>`;
}
const worked = it => `<br><small><b>Worked example:</b> ${esc(strip(it.explain || it.hint || 'Read the clue again, cross out what does not fit, then pick the best match.'))} A fresh, similar question is available.</small>`;
function fbHtml(it) {
  const s = BT.state, ph = s.phase, fb = it.fbo || null;
  if (ph === 'defeat') return `<div class="fb warn"><div><b>${esc(((t => t && t.id !== 'pip' ? G.inst(BT.p, t.id) : null)(BT.state.team[BT.state.active]) || { name: 'Your companion' }).name)} needs a rest.</b> Your coins, items and streak are safe. Try this checkpoint again with a hint — Pip refilled your HP.<br>${it.hint ? '💡 ' + esc(it.hint) : ''}${worked(it)}</div><div class="row tight"><button class="btn big" data-a="bCheckpoint">Retry checkpoint</button>${BT.tries >= 2 && replacement(it, true) ? '<button class="btn ghost" data-a="bNew">Try a new question</button>' : ''}</div></div>`;
  if (ph === 'retry') {
    const why = fb ? esc(fb[BT.picked] || '') : (it.hint ? '💡 ' + esc(it.hint) : '');
    const can = BT.tries >= 2 && replacement(it, true), ex = BT.tries >= 2 ? worked(it) : '';
    return `<div class="fb warn"><div><b>Not quite.</b> ${why}${ex}</div><div class="row tight"><button class="btn big" data-a="bRetry">Try again</button>${G.tutorHelpBtn ? G.tutorHelpBtn(it) : ''}${can ? '<button class="btn ghost" data-a="bNew">Try a new question</button>' : ''}</div></div>`;
  }
  if (ph === 'question' && BT.hint) return `<div class="fb ok"><div><b>Clue Lantern:</b> ${esc(it.hint || 'Read it again slowly and look for a clue.')}<br><small>This turn is marked as helped.</small></div></div>`;
  if (ph === 'ready' || ph === 'casting') return `<div class="fb good"><div><b>Yes!</b> ${fb ? esc(fb[it.correctId] || '') : (it.explain || '')}${it.cites ? '<br><small>The highlighted words in the passage are the clue.</small>' : ''}${G.thinkBtn ? G.thinkBtn(it) : ''}${BT.spec.practice && s.attempts.filter(a => a.turn === s.turn).length > 1 ? '<br><small>You got it after a clue, so Pip counts this one as “after help”. A fresh question comes next.</small>' : ''}</div></div>`;
  return '';
}
function sheetHtml() {
  const s = BT.state, t = s.team[s.active];
  return `<h3>Move ready! Choose a move <small>(the arena stays above)</small></h3><div class="bt-moves">
    ${t.moveIds.map(id => { const m = G.MOVE[id], r = s.rules[id] || {}, cd = s.cd[id] || 0, used = r.once && s.used[id], off = cd > 0 || used;
      return `<button class="mv ${m.support ? 'sup' : ''}" style="--mc:${m.color}" data-a="bCast" data-m="${id}" ${off ? 'disabled' : ''}><span class="mi" aria-hidden="true">${G.moveIcon(id)}</span><b>${esc(m.name)}</b><small>${esc(m.effect)}</small><small class="cdb">${used ? 'Used this battle' : cd > 0 ? `Cooldown: ${cd} turn${cd > 1 ? 's' : ''}` : r.cd ? `Cooldown ${r.cd} after use` : 'Ready'}</small></button>`; }).join('')}
    <button class="mv bag" data-a="bDouble" ${s.bag.double && !s.double ? '' : 'disabled'} aria-pressed="${s.double}">${art('double_strike', '⚡', 'mi')}<b>Double Strike ×${s.bag.double}</b><small>${s.double ? 'Queued for your next damage move' : s.bag.double ? 'Tap to queue' : 'None left'}</small></button></div>`;
}
function sheet() {
  const el = $('#bt-sheet'), sh = $('#btshell'); if (!el) return; const open = BT.state.phase === 'ready';
  el.hidden = !open; if (sh) sh.classList.toggle('sheet-open', open);
  if (open) { const had = el.dataset.t === String(BT.state.turn) && el.dataset.ph === 'ready'; el.innerHTML = sheetHtml(); if (!had) { el.dataset.t = BT.state.turn; el.dataset.ph = 'ready'; const f = el.querySelector('.mv:not([disabled])'); if (f) setTimeout(() => f.focus({ preventScroll: true }), 60); } }
  else el.dataset.ph = '';
}
function qHtml() {
  const it = curItem(), s = BT.state, can = s.phase === 'question';
  const stem = `<div class="q"><h2>${it.prompt}</h2><div class="qtools"><button class="say" data-a="bReadQ">🔊 Read it to me</button>${G.tutorBtn ? G.tutorBtn(it) : ''}</div></div>`;
  const body = it.tiles ? tilesHtml(it) : `<div class="opts bt-opts">${it.opts.map((o, n) => { const out = s.out.includes(o.id), right = ['ready', 'casting', 'victory', 'claimed'].includes(s.phase) && o.id === it.correctId;
    return `<button class="opt c${n % 4} ${right ? 'right' : ''} ${out ? 'wrong' : ''}" data-a="bAns" data-id="${o.id}" ${!can || out ? 'disabled' : ''}><span class="ltr">${'ABCD'[n] || n + 1}</span><span class="otx">${it.raw === false ? esc(o.text) : esc(o.text)}</span></button>`; }).join('')}</div>`;
  const bag = [['bClue', 'clue_lantern', '🔦', 'Clue Lantern', s.bag.clue], ['bLook', 'item_second_look', '👀', 'Second Look', s.bag.look], ['bBubble', 'item_bubble_guard', '🫧', 'Bubble Guard', s.bag.bubble]]
    .map(([a, im, em, t, n]) => `<button class="bagb ${can && n ? '' : 'off'}" data-a="${a}" aria-disabled="${!(can && n)}">${art(im, em, 'mi')}<span>${t} ×${n}</span></button>`).join('');
  return `${stem}${body}<div class="bt-bag" role="group" aria-label="Battle Bag">${bag}</div><div id="bt-fb" aria-live="polite">${s.phase === 'victory' || s.phase === 'claimed' ? '' : fbHtml(it)}</div>${s.phase === 'victory' ? chestHtml() : ''}`;
}
function chestHtml() {
  const t = BT.spec.boss ? 'boss' : BT.spec.source === 'daily' ? 'daily' : 'standard';
  return `<div class="fb good"><div><b>${esc(BT.enemy.name)} surrenders!</b> You got ${BT.state.correctIds.length} different answers right. Open the chest!</div><button class="chest wobble bt-chest" data-a="bClaim" aria-label="Open the chest">${art('ch_chest_' + t, '🎁')}</button></div>`;
}
function paint() {
  if (!BT) return; const it = curItem();
  $('#bt-hud').innerHTML = hud(); units(); coach(); $('#bt-team').innerHTML = teamHtml(); $('#bt-q').innerHTML = qHtml(); sheet();
  const pa = $('#bt-pass'), ph = passHtml(it); pa.hidden = !ph; pa.innerHTML = ph;
  const sh = $('#shield'); if (sh) sh.hidden = !BT.state.shield;
  if ($('#fme') && BT.lastActive !== BT.state.active) mountFighters(false);
}
G.moveIcon = id => ({ 'ember-pop': '🔥', 'wing-cut': '🌙', 'bubble-burst': '🫧', 'star-scratch': '⭐', 'comet-dust': '☄️', 'sprout-surge': '🌿', 'prism-pulse': '🔮', 'story-spark': '📖', pounce: '🐾', guard: '🛡️', 'lantern-flash': '🏮', 'snow-hop': '❄️', 'coral-ripple': '🪸', 'page-gust': '📄', 'moon-flutter': '🌘', 'sand-puff': '🏜️', 'cloud-roll': '☁️', 'leaf-flick': '🍃', sunbeam: '☀️', 'petal-fan': '🌸', 'pearl-splash': '🦪', 'rainbow-curl': '🌈', 'north-star': '🧭', 'amber-clap': '🦀', 'seed-scatter': '🌰', 'ice-slide': '🧊', 'orchid-sweep': '🌺', 'star-wake': '🦈' })[id] || '✨';

/* ---------- effects ---------- */
function telegraph(text) {
  const el = $('#bt-tele'), m = $('#fmon'), c = FOECOL[BT.enemy.id] || '#c9a6ff'; if (el) el.textContent = text;
  if (m) { G.spr.telegraph(m, c); G.fx.charge(m, c); } snd(BT.enemy.id === 'clockwork-regent' ? 'cog-windup' : BT.enemy.id + '-telegraph');
  later(() => { const t = $('#bt-tele'); if (t) t.textContent = ''; }, 1500);
}
/* the villain strikes back when an answer is wrong: lunge, projectile, hit reaction on your pet */
function enemyStrike() {
  const foe = $('#fmon'), me = $('#fme'), c = FOECOL[BT.enemy.id] || '#c9a6ff'; if (!foe || !me) return;
  const lc = BT.state.lastCounter || { dmg: 0, blocked: null }, cn = (G.counterOf && G.counterOf(BT.enemy)) || { move: 'Counterattack' }, inst = calm(), hpNow = BT.state.hp;
  const hit = () => { BT.shownHp = hpNow; units(); const hb = $('#bt-hpme'); if (hb) hb.style.width = 100 * hpNow / BT.state.maxHp + '%';
    G.fx.number(lc.sim ? 'Demo −' + lc.dmg : lc.blocked === 'bubble' ? 'Blocked!' : lc.blocked === 'ward' && !lc.dmg ? 'Warded!' : lc.dmg ? '−' + lc.dmg + ' HP' : 'Softened!', me, 'foe');
    BT.msg = lc.sim ? `SIMULATED counterattack: ${esc(cn.move)} would hit for −${lc.dmg} HP. Demo only: HP unchanged and no answer recorded.` : lc.blocked === 'bubble' ? 'Bubble Guard absorbed the counterattack, so you lost no HP.' : lc.blocked === 'ward' ? `Your ward soaked up part of ${esc(cn.move)}.` : lc.blocked === 'feint' ? `Your feint softened ${esc(cn.move)}.` : `${esc(BT.enemy.name)} hit back with ${esc(cn.move)}: −${lc.dmg} HP.`;
    const h = $('#bt-hud'); if (h) h.innerHTML = hud(); };
  const tele = $('#bt-tele'); if (tele) tele.textContent = `${BT.enemy.name} winds up ${cn.move}…`;
  if (inst) { snd('pounce-impact'); hit(); return; }
  G.spr.telegraph(foe, c); G.fx.charge(foe, c); snd(BT.enemy.id === 'clockwork-regent' ? 'cog-windup' : BT.enemy.id + '-telegraph');
  const dx = me.getBoundingClientRect().left + me.getBoundingClientRect().width * .6 - (foe.getBoundingClientRect().left + foe.getBoundingClientRect().width * .3);
  later(() => { G.spr.lunge(foe, Math.max(-420, dx * .55)); G.fx.enemyAttack(foe, me, c); }, 420);
  later(() => { snd(BT.enemy.id === 'clockwork-regent' ? 'cog-impact' : 'pounce-impact'); if (lc.blocked === 'bubble') G.fx.shield(me, 'guard'); else G.spr.hit(me, false); anim($('#bt-arena'), 'quake', 350); hit(); const t = $('#bt-tele'); if (t) t.textContent = ''; }, 700);
}
G.vfx = function vfx(id, from, to, color) {
  if (!from || !to || calm()) return; const mv = G.MOVE[id], a = from.getBoundingClientRect(), b = to.getBoundingClientRect(), n = /three|volley|rings|motes|scatter|petal/i.test(mv.effect) ? 3 : 1;
  for (let i = 0; i < n; i++) { const e = document.createElement('span'); e.className = 'proj'; e.textContent = G.moveIcon(id); e.style.cssText = `left:0;top:0;color:${color};text-shadow:0 0 16px ${color},0 0 30px ${color}`; document.body.appendChild(e);
    const x0 = a.left + a.width * .7, y0 = a.top + a.height * .45, x1 = b.left + b.width * .3, y1 = b.top + b.height * .5, arc = mv.rig === 'swimmer' ? -60 : -90 - i * 25;
    e.animate([{ transform: `translate(${x0}px,${y0}px) scale(.5)`, opacity: 0 }, { transform: `translate(${(x0 + x1) / 2}px,${Math.min(y0, y1) + arc}px) scale(1.5) rotate(${i * 40}deg)`, opacity: 1, offset: .5 }, { transform: `translate(${x1}px,${y1 + (i - 1) * 16}px) scale(1) rotate(${i * 90}deg)`, opacity: 1 }], { duration: 230, delay: i * 40, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).onfinish = () => e.remove(); }
};

/* ---------- evidence ---------- */
function persist(att, it) {
  const p = BT.p, sel = it.tiles ? (it.tray || []).map(x => x.t).join(it.type === 'build' ? '' : ' ') : (it.opts.find(o => o.id === att.chosenOptionId) || {}).text || '';
  const right = it.tiles ? it.goal.join(it.type === 'build' ? '' : ' ') : (it.opts.find(o => o.id === it.correctId) || {}).text || '';
  p.attempts.push({ ...att, id: 'bt-' + BT.battleId + '-' + p.attempts.length, stem: strip(it.prompt).slice(0, 160), context: it.story ? it.story.text.slice(0, 160) : '', selectedText: String(sel).slice(0, 120), correctText: String(right).slice(0, 120), battleId: BT.battleId, source: BT.spec.source || 'island' });
  if (p.attempts.length > 600) p.attempts.splice(0, p.attempts.length - 600);
  if (att.attempt === 1) {
    if (!att.correct) { p.miss.push({ skill: it.skill, q: strip(it.prompt).slice(0, 150), picked: String(sel).slice(0, 100), right: String(right).slice(0, 100) }); if (p.miss.length > 15) p.miss.shift(); }
    C.record(p, it.skill in p.skills ? it.skill : 'reading', { correct: att.correct, ms: performance.now() - BT.t0, sub: it.sub || '', guess: !it.tiles && performance.now() - BT.t0 < 1200 && !att.assisted, weight: att.assisted ? .5 : 1 });
  }
  if (att.correct) { const cs = p.stats.correctSkill; cs[it.skill] = cs[it.skill] || []; if (!cs[it.skill].includes(it.qid)) cs[it.skill].push(it.qid); if (att.attempt === 1 && !att.assisted && G.dailyEvent) G.dailyEvent(p, 'uniq', it.qid); }
  C.save();
}

/* ---------- replacement question ---------- */
function replacement(it, probe) {
  const used = new Set(BT.state.questions.map(q => BT.byId[q.id].key)); let list = [];
  const d = BT.dest, p = BT.p;
  if (BT.spec.pool) list = BT.spec.pool(); else if (d.subject === 'language' && !['mountain', 'cove'].includes(d.id)) list = C.makeItems(d.skill, C.lvl(p.skills[d.skill].m), 6); else if (d.id === 'cove') list = window.SQ_SUBJECTS.banks.writing.map(t => G.mcFrom(t, { skill: 'writing' })); else if (d.subject !== 'language') list = window.SQ_SUBJECTS.banks[d.id].map(t => G.mcFrom(t, { skill: d.skill }));
  const c = list.find(x => !used.has(x.key)); if (!c || probe) return !!c; return prepare({ ...c, skill: c.skill || d.skill });
}

/* ---------- actions ---------- */
const A = G.actions;
function wrongFx() { snd('answer-retry'); BT.lastAbs = BT.state.absorbed; BT.shownResolve = BT.state.resolve; return ''; }
A.bAns = d => {
  if (!BT || BT.busy) return; const it = curItem(); if (!step('answer', { optionId: d.id })) return; hush();
  const att = BT.state.attempts[BT.state.attempts.length - 1]; persist(att, it); BT.hint = false; BT.tries = (BT.tries || 0) + (att.correct ? 0 : 1);
  if (att.correct) { BT.msg = ''; if (att.attempt === 1) BT.firsts++; if (att.assisted) BT.assistedN++; snd('answer-correct'); setTimeout(() => snd('move-ready'), 250); G.spr.cheer($('#fme')); G.fx.impact('comet-dust', $('#fme'), .5); if (G.tutorBonus) { const m = G.tutorBonus(it.qid, att); if (m) BT.msg = m; } }
  else { BT.picked = d.id; const t = wrongFx(); BT.msg = t; enemyStrike(); }
  paint();
};
A.bTile = d => {
  if (!BT || BT.state.phase !== 'question') return; const it = curItem(), id = +d.id; sfx.tap();
  if (d.w === 'p') { if (it.tray.length >= it.goal.length) return; const k = it.pool.findIndex(x => x.id === id); it.tray.push(...it.pool.splice(k, 1)); }
  else { const k = it.tray.findIndex(x => x.id === id); if (it.tray[k].lock) return; it.pool.push(...it.tray.splice(k, 1)); }
  paint();
};
A.bCheck = () => {
  if (!BT || BT.state.phase !== 'question') return; const it = curItem(); if (it.tray.length !== it.goal.length) return;
  const ok = it.tray.map(x => x.t).join('\u0001') === it.goal.join('\u0001'); const wrongId = 'b' + (1 + BT.state.attempts.filter(a => a.turn === BT.state.turn).length);
  if (!step('answer', { optionId: ok ? 'ok' : wrongId })) return; hush();
  const att = BT.state.attempts[BT.state.attempts.length - 1]; persist(att, it); BT.hint = false; BT.tries = (BT.tries || 0) + (ok ? 0 : 1);
  if (ok) { BT.msg = ''; if (att.attempt === 1) BT.firsts++; if (att.assisted) BT.assistedN++; snd('answer-correct'); setTimeout(() => snd('move-ready'), 250); G.spr.cheer($('#fme')); G.fx.impact('comet-dust', $('#fme'), .5); }
  else { BT.msg = wrongFx(); enemyStrike(); anim($('#tray'), 'shake', 500); }
  paint();
};
A.bCheckpoint = () => { if (!BT || !step('checkpoint')) return; BT.hint = true; BT.shownHp = BT.state.hp; BT.tries = 0; BT.msg = 'Checkpoint! HP refilled. This turn is marked as helped.'; snd('item-use'); paint(); };
A.bRetry = () => { if (!BT) return; const it = curItem();
  if (it.tiles) { const all = [...it.tray.filter(x => !x.lock), ...it.pool, ...it.tray.filter(x => x.lock)], locks = it.tray.filter(x => x.lock), rest = [...it.tray.filter(x => !x.lock), ...it.pool];
    const k = rest.findIndex(x => x.t === it.goal[locks.length]); if (k >= 0) { const [t] = rest.splice(k, 1); it.tray = [...locks, { ...t, lock: true }]; it.pool = shuffle(rest.map(x => ({ ...x, lock: false }))); } void all; }
  if (step('retry')) { BT.msg = it.tiles ? 'I locked one tile in for you.' : ''; paint(); } };
A.bNew = () => { if (!BT || BT.state.phase !== 'retry') return; const q = replacement(curItem(), false); if (!q) return; const oldId = curItem().qid; if (step('replaceq', { question: q.eq })) { BT.byId[q.qid] = q; delete BT.byId[oldId]; BT.tries = 0; BT.msg = 'Here is a new question. The last one does not count.'; paint(); } };
const bagMsg = t => { BT.msg = t; $('#bt-hud').innerHTML = hud(); };
A.bClue = () => { if (!BT) return; const s = BT.state; if (s.phase !== 'question') return bagMsg('Use the Clue Lantern before you answer.'); if (s.assisted) return bagMsg('You already used a helper this turn.'); if (!s.bag.clue) return bagMsg('You have no Clue Lanterns left. The shop sells them.');
  if (step('clue')) { BT.hint = true; snd('bag-open'); syncBag(); BT.msg = ''; paint(); } };
A.bLook = () => { if (!BT) return; const s = BT.state, it = curItem(); if (s.phase !== 'question') return bagMsg('Use Second Look before you answer.'); if (it.tiles) return bagMsg('Second Look only works on multiple choice.'); if (!s.bag.look) return bagMsg('You have no Second Looks left. The shop sells them.'); if (s.assisted) return bagMsg('You already used a helper this turn.');
  const wrong = it.opts.filter(o => o.id !== it.correctId && !s.out.includes(o.id)); if (wrong.length < 2) return bagMsg('Only two choices are left, so Second Look cannot help.');
  if (step('look', { optionId: pick(wrong).id })) { snd('item-use'); syncBag(); BT.msg = 'One wrong choice is crossed out.'; paint(); } };
A.bBubble = () => { if (!BT) return; const s = BT.state; if (s.phase !== 'question') return bagMsg('Use Bubble Guard before you answer.'); if (s.shield) return bagMsg('Your shield is already on.'); if (!s.bag.bubble) return bagMsg('You have no Bubble Guards left. The shop sells them.');
  if (step('bubble')) { snd('item-use'); syncBag(); BT.msg = 'Shield on! It blocks the next setback.'; paint(); } };
A.bDouble = () => { if (!BT) return; if (step('double')) { snd('item-use'); paint(); } };
A.bSwap = d => { if (!BT) return; if (step('swap', { slot: +d.i })) { snd('team-swap'); BT.msg = ''; paint(); G.spr.cheer($('#fme')); } };
A.bCast = d => {
  if (!BT || BT.busy || !step('cast', { moveId: d.m })) return; BT.busy = true; hush(); BT.msg = ''; syncBag();
  const m = G.MOVE[d.m], sup = !!(m.support || ['guard', 'ward', 'recovery'].includes((BT.state.lastCast || {}).kind)), instant = calm(), cue = cues(d.m), lc = BT.state.lastCast, big = lc && lc.double, me = $('#fme'), foe = $('#fmon'), fx = G.fx, dash = fx.isDash(d.m) && !sup; paint();
  const contact = () => { BT.shownResolve = BT.state.resolve; BT.shownHp = BT.state.hp; snd(cue[2]);
    if (sup) { const sh = $('#shield'); if (lc.kind === 'guard' && sh) sh.hidden = false; fx.shield(me, d.m); fx.number(lc.kind === 'recovery' ? '+' + lc.healed + ' HP' : lc.kind === 'ward' ? 'Ward +2' : 'Shield!', me, 'good'); }
    else { const hits = lc.hits || 1, fin = lc.kind === 'finisher'; fx.impact(d.m, foe, big || fin ? 1.4 : 1); G.spr.hit(foe, big || fin); anim($('#bt-arena'), 'quake', big || fin ? 600 : 420);
      if (hits > 1 && !calm()) setTimeout(() => { if (BT && BT.state) { fx.impact(d.m, foe, 1); G.spr.hit(foe, false); } }, 150);
      fx.number('−' + (lc ? lc.damage : 2), foe, big || fin ? 'big' : ''); if (lc.kind === 'feint') fx.number('Next counter −1', me, 'good'); }
    units(); const hd = $('#bt-hud'); if (hd) hd.innerHTML = hud(); };
  if (instant) { snd(cue[1]); contact(); settle(); return; }
  fx.stamp('t0', { move: d.m });
  if (cue[0]) snd(cue[0]);
  fx.windup(d.m, me);
  if (dash) { const a = me.getBoundingClientRect(), f = foe.getBoundingClientRect(); G.spr.dash(me, Math.max(60, f.left + f.width * .15 - (a.left + a.width * .85)), d.m); }
  else if (!sup) G.spr.windup(me, d.m); else G.spr.windup(me, d.m);
  later(() => { snd(cue[1]); if (!sup && !dash) { G.spr.strike(me); fx.launch(d.m, me, foe, .23); } }, 160);
  later(contact, 390); later(() => { if (!dash) G.spr.recover(me); }, 400); later(settle, 650);
};
function settle() {
  if (!BT || !step('settle')) return; BT.busy = false; BT.tries = 0; BT.hint = false; BT.t0 = performance.now(); const s = BT.state;
  const it = curItem(); if (it.tiles) { it.tray = []; it.pool = it.pool.concat([]).map(x => ({ ...x, lock: false })); }
  if (s.phase === 'victory') { onVictory(); return; }
  BT.msg = s.earlyZero && s.resolve === 0 ? `Resolve is zero, but you need ${s.minimumCorrect - s.correctIds.length} more different correct answer${s.minimumCorrect - s.correctIds.length > 1 ? 's' : ''} to win.` : '';
  paint(); telegraph(`${BT.enemy.name} prepares ${BT.enemy.telegraph}…`);
}
function onVictory() {
  const p = BT.p, s = BT.state;
  p.pending = { id: BT.battleId, dest: BT.dest.id, enemy: BT.enemy.id, src: BT.spec.source || 'island', chapter: BT.spec.chapter || '', stage: BT.spec.stage || '', boss: !!BT.spec.boss, chest: BT.spec.boss ? 'boss' : BT.spec.source === 'daily' ? 'daily' : 'standard', title: BT.spec.title || BT.dest.name,
    correct: s.correctIds.length, firsts: BT.firsts, assisted: BT.assistedN, setbacks: s.setbacks, absorbed: s.absorbed, dedupe: BT.spec.dedupe || '', placement: !!BT.spec.placement, team: s.team.map(t => t.id).filter(x => x !== 'pip'), at: Date.now(), sim: !!BT.sim };
  C.save(); snd('victory'); G.spr.defeat($('#fmon')); G.fx.defeat($('#fmon')); anim($('#bt-arena'), 'quake', 600); confetti(40); paint();
}
A.bClaim = () => { if (!BT || !step('claim')) return; hush(); const rc = G.claim(BT.p, BT.p.pending); showReceipt(rc, true); };
G.chestScreen = () => { const p = C.cur(); if (!p.pending) return G.map(); const pd = p.pending, d = G.DEST[pd.dest], en = G.ENEMY[pd.enemy];
  C.view(`${G.hdr()}<div class="card center results"><h1>${esc(en.name)} surrendered!</h1><p>${esc(pd.title)} · ${pd.correct} different answers right</p>
    <button class="chest wobble bt-chest" data-a="gClaim" aria-label="Open the chest">${art('ch_chest_' + pd.chest, '🎁')}<small>Tap to open</small></button></div>${G.nav('map')}`); void d; };
A.gChest = () => G.chestScreen();
A.gClaim = () => { const p = C.cur(); if (!p.pending) return G.map(); showReceipt(G.claim(p, p.pending), false); };
function showReceipt(rc, inBattle) {
  snd('chest-open'); setTimeout(() => snd(rc.coins ? 'coin' : 'ui-click'), 350); confetti(30, ['COIN', '✨', '🎉']);
  const lines = (rc.lines || []).map(l => `<li>${l}</li>`).join('');
  const html = `<div class="card center results rc"><h1>Chest opened!</h1><div class="chestimg">${art('ch_chest_' + rc.chest + (rc.chest === 'boss' ? '_open' : ''), '🎉')}</div><ul class="rlist" aria-label="Receipt">${lines}</ul>${rc.dup ? '<p class="small">This chest was already collected. Here is your receipt.</p>' : ''}
    <div class="row"><button class="btn big" data-a="bLeave">${BT && BT.spec.returnTo === 'dash' ? 'Back to teacher view' : 'Continue'}</button>${BT && BT.spec.again ? '<button class="btn" data-a="bAgain">Battle again</button>' : ''}</div></div>`;
  if (inBattle) { $('#bt-q').innerHTML = html.replace('card center results rc', 'center results rc'); } else C.view(`${G.hdr()}${html}${G.nav('map')}`);
  if (rc.evolve) rc.evolve.forEach(ev => snd(ev.hatched ? 'hatch' : 'new-pet'));
  setTimeout(() => { const b = $('[data-a=bLeave]'); if (b) b.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 350);
}
A.bLeave = () => G.leave();
A.bAgain = () => { const sp = BT && BT.spec; if (sp && sp.again) sp.again(); };
A.bExit = () => G.leave(true);
G.leave = function leave(early) {
  const back = BT ? BT.spec.returnTo : 'map', p = C.cur(); if (BT) BT.timers.forEach(clearTimeout); BT = null; hush(); if (G.fx) G.fx.detach();
  if (back === 'dash') { C.S.current = null; C.save(); return C.dash(); }
  if (back === 'room') return G.room(); if (back === 'rewards') return G.rewards();
  void early; void p; G.map();
};
A.bReadQ = () => { if (!BT) return; const it = curItem(); speak(it.say + (it.tiles ? '' : '. ' + it.opts.map((o, n) => 'ABCD'[n] + ': ' + o.text).join('. '))); };
A.bReadP = () => { if (!BT) return; const it = curItem(), s = it.passageSents || (it.story ? splitSents(it.story.text) : []); speak(s.map(x => x.text).join(' ')); };
A.bStop = () => hush();
A.bWord = d => { hush(); speak(d.w); };

/* ---------- starting battles from the map, the room and the dashboard ---------- */
A.gBattle = d => {
  const p = C.cur(), de = G.DEST[d.id]; if (!G.destPlayable(de)) return G.actions.gDest({ id: d.id });
  const boss = !!d.boss, mk = () => { const it = G.destItems(p, de, boss); return { dest: de.id, enemy: de.proposedBossId, items: it.items, min: it.min, resolve: it.resolve, source: d.src || 'island', boss, returnTo: 'map', again: () => G.actions.gBattle(d) }; };
  G.startBattle(mk());
};
A.gAdv = () => {};
G.startDaily = () => { const p = C.cur(), pool = D.destinations.filter(x => x.subject === 'language'), de = pool[(new Date().getDate() + pool.length) % pool.length], it = G.destItems(p, de, false);
  G.startBattle({ dest: de.id, enemy: de.proposedBossId, items: it.items, min: it.min, resolve: it.resolve, source: 'daily', returnTo: 'rewards', title: 'Daily Battle · ' + de.name }); };
A.gDaily = () => G.startDaily();
A.gWarm = () => { const p = C.cur(), de = G.DEST.sound, L = p.grade <= 2 ? 1 : p.grade <= 4 ? 2 : 3, items = shuffle(['phonics', 'vocab', 'spelling', 'grammar'].flatMap(s => C.makeItems(s, L, 2)));
  G.startBattle({ dest: 'sound', enemy: 'ink-baron', items, min: 3, resolve: 6, source: 'warmup', placement: true, returnTo: 'map', title: 'Pip’s Warm-Up' }); void de; };

const SK2DEST = { phonics: 'sound', spelling: 'castle', vocab: 'jungle', grammar: 'station', sequence: 'orchard', reading: 'mountain', writing: 'cove', placement: 'sound', mission: 'mountain' };
/** Adapter for the older quest builders (AI missions, AI adventures): same battle, same rewards. */
G.questToBattle = (skill, items, opts = {}) => {
  const dest = SK2DEST[skill] || 'mountain', ds = G.DEST[dest];
  G.startBattle({ dest, enemy: ds.proposedBossId, items: items.map(it => ({ ...it, skill: it.skill || (skill === 'mission' ? 'reading' : skill) })), min: Math.min(3, items.length), resolve: Math.min(3, items.length) * 2,
    source: opts.mission ? 'mission' : opts.placement ? 'warmup' : 'island', placement: !!opts.placement, returnTo: 'map', title: opts.mission ? 'AI Mission: ' + (opts.focus || '') : opts.adventure ? 'Pip’s Adventure' : ds.name });
};

/* a full move played in any arena (used by the Move Book preview: no battle state, no rewards) */
G.playMoveFx = (arena, me, foe, id) => {
  const fx = G.fx, m = G.MOVE[id], sup = m.support, cue = cues(id), dash = fx.isDash(id) && !sup, T = [];
  const at = (ms, fn) => T.push(setTimeout(() => { if (fx.arena === arena) fn(); }, ms));
  fx.stamp('t0', { move: id }); if (cue[0]) snd(cue[0]); fx.windup(id, me);
  if (dash) { const a = me.getBoundingClientRect(), f = foe.getBoundingClientRect(); G.spr.dash(me, Math.max(60, f.left + f.width * .15 - (a.left + a.width * .85)), id); } else G.spr.windup(me, id);
  at(160, () => { snd(cue[1]); if (!sup && !dash) { G.spr.strike(me); fx.launch(id, me, foe, .23); } });
  at(390, () => { snd(cue[2]); if (sup) { fx.shield(me, id); fx.number('Shield!', me, 'good'); } else { fx.impact(id, foe, 1); G.spr.hit(foe, false); fx.number('−2', foe); } });
  at(400, () => { if (!dash) G.spr.recover(me); });
  return () => T.forEach(clearTimeout);
};

/* presenter-console hook (QA only; see game-demo.js). Nothing here writes attempts or mastery evidence. */
G.btx = {
  live: () => !!BT,
  spec: () => BT && BT.spec,
  active: () => { if (!BT) return null; const t = BT.state.team[BT.state.active]; return t && t.id !== 'pip' ? G.inst(BT.p, t.id) : null; },
  simCounter() { if (!BT || BT.busy) return false; const keep = BT.state.lastCounter; BT.state = { ...BT.state, lastCounter: { dmg: 2, blocked: null, sim: true } }; const hp = BT.state.hp; enemyStrike(); BT.msg = 'SIMULATED counterattack (demo only). No answer was recorded and your HP did not change.'; BT.shownHp = hp; BT.state = { ...BT.state, lastCounter: keep }; const m = $('#bt-tele'); if (m) m.textContent = 'Demo: simulated counterattack'; setTimeout(() => { if (BT) { units(); const q = $('#bt-fb'); void q; } }, 800); return true; },
  resolve() { if (!BT) return false; BT.sim = true; BT.spec.source = 'demo'; BT.spec.dedupe = ''; BT.state = { ...BT.state, phase: 'victory', correctIds: BT.state.correctIds.length ? BT.state.correctIds : [], resolve: BT.state.resolve }; BT.timers.forEach(clearTimeout); BT.busy = false; onVictory(); return true; },
  results() { if (!BT) return false; BT.sim = true; BT.spec.source = 'demo'; BT.spec.dedupe = ''; const s = BT.state; BT.state = { ...s, phase: 'victory' }; onVictory(); const pd = BT.p.pending; BT.timers.forEach(clearTimeout); BT = null; hush(); if (G.fx) G.fx.detach(); G.chestScreen(); return !!pd; },
  preview(id) { if (!BT) return false; const me = $('#fme'), foe = $('#fmon'); if (!me || !foe || !G.fx.arena) return false; G.playMoveFx(G.fx.arena, me, foe, id); return true; },
  cur: () => (BT ? { phase: BT.state.phase, hp: BT.state.hp } : null),
  ctx: () => { if (!BT) return null; const it = curItem(), pk = (it.opts || []).find(o => o.id === BT.picked); return { item: it, picked: pk ? strip(pk.text) : '', pickedId: BT.picked || '', phase: BT.state.phase, tries: BT.tries || 0, qid: it.qid, spec: BT.spec }; },
  peek: () => BT
};
});
