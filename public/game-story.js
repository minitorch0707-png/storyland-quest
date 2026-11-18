/* Storyland Quest – "The Atlas of Unfinished Things": dialogue before each first encounter, a boss introduction,
   a closing line, a journal for reopening scenes, the finale and the Atlas Keeper badge. Progress is kept by chapter and beat in the save. */
window.SQ_PARTS.push((G, C) => {
'use strict';
const { S, $, esc, art, speak, hush, calm } = C, A = G.actions, D = G.D;
const CAST = {
  Pip: { c: '#ff9f43', art: 'pip_cheer', em: '🦊', role: 'Guide fox' }, Luma: { c: '#f5c542', art: 'clue_lantern', em: '🏮', role: 'Lantern keeper' }, Brindle: { c: '#7a5cf5', art: 'item_magnet', em: '📮', role: 'Courier' }, Tock: { c: '#3fb8a6', art: 'v_clockwork_regent', em: '⏱️', role: 'Clockmaker' },
  'Margin Keeper': { c: '#6b4aa0', art: 'v_ink_baron', em: '📖', role: 'Keeper of the last page' },
};
const BOSSART = { 'Baroness Vesper': 'v_baroness_vesper', 'Clockwork Regent': 'v_clockwork_regent', 'Thorn Marshal': 'v_thorn_marshal', 'Ink Baron': 'v_ink_baron', 'Prism Curator': 'v_ink_baron', 'Chronicle Warden': 'v_clockwork_regent' };
const MONART = { sound: 'monster_phonics', castle: 'monster_spelling', jungle: 'monster_vocab', station: 'monster_grammar', orchard: 'monster_sequence', mountain: 'monster_reading', cove: 'monster_writing' };
const T = (a, b) => [a, b];
const STORY = {
  sound: { title: 'The Missing Echo', open: T('Luma', 'The ferry bell calls out “boat,” but the cliff keeps answering “bell.” Listen for the part of the words that sounds the same.'), minions: T('Brindle', 'The echo sprites are hiding in the wrong shells. Pair the sounds and see which shells answer.'), elite: T('Shell Echoer', 'You found the matching ends. Now listen with the bell turned around. Can you still hear them?'), boss: T('Baroness Vesper', 'I borrowed the echoes to keep my flock together. Show me which sound belongs to the ferry bell and I’ll give it back.'), clear: T('Pip', 'The ferry can hear its way home. Our first lantern just learned to sing.'), change: 'The ferry bell rings and the cliff answers with the right sound.' },
  castle: { title: 'The Shuffled Gate', open: T('Brindle', 'The gate says “STOP,” but it’s supposed to say “POST.” Same letters, very different delivery.'), minions: T('Tock', 'Letter imps pinched the middle sounds. Build the words before the gate guesses again.'), elite: T('Glyph Keeper', 'The first word fits. Can you fix the next one when only one sound changes?'), boss: T('Clockwork Regent', 'My gate can rearrange letters faster than you. Can it put them in the right order?'), clear: T('Brindle', 'First delivery through the gate. It’s a thank-you note from the gate.'), change: 'The gate spells POST and swings open.' },
  jungle: { title: 'The Whispering Vines', open: T('Pip', 'The sign says the bridge is “sturdy.” Read what the sign says happened when the elephant crossed.'), minions: T('Luma', 'The word mites nibble single words off the trail. The sentences around them still have clues.'), elite: T('Vine Oracle', 'The same word can mean two things. Which meaning fits this part of the story?'), boss: T('Thorn Marshal', 'I hid my bridge behind a word I thought no one would understand. Show me how the other words helped you.'), clear: T('Luma', 'The vines are lowering the bridge. Look, they grew a little railing.'), change: 'The vine bridge lowers and grows a railing.' },
  station: { title: 'The Mixed-Up Express', open: T('Tock', 'My train notice says “to the orchard.” Nobody knows who is going or when.'), minions: T('Brindle', 'The carriage sprites mixed up the words. Put a whole thought back together.'), elite: T('Switch Keeper', 'Two notices sound fine at first. Which one tells the passengers what to do?'), boss: T('Clockwork Regent', 'Write a notice that makes sense before my clock reaches departure.'), clear: T('Tock', 'All aboard! Next stop, wherever the notice actually says.'), change: 'The departure board shows a clear, complete notice.' },
  orchard: { title: 'The Backward Harvest', open: T('Tock', 'My harvest clock runs backward. It tried to pack apples before anyone picked them. Can you put the steps in order?'), minions: T('Brindle', 'The crate sprites took the recipe cards. Let’s sort the steps before the apples roll away.'), elite: T('Harvest Keeper', 'Some steps could swap places. Which one must happen first for the rest to work?'), boss: T('Clockwork Regent', 'I wound the harvest clock backward because I missed spring. Show me how to begin a new harvest.'), clear: T('Tock', 'Pick, pack, share. The pies are safe. And next spring is already on the way.'), change: 'The harvest clock runs forward: pick, pack, share.' },
  mountain: { title: 'The Missing Chapter', open: T('Pip', 'The last page is gone. We can still figure out why the lantern keeper left if we look at what she did.'), minions: T('Luma', 'The page wisps repeat every tiny detail. Which ones actually help explain the ending?'), elite: T('Lantern Keeper', 'That answer could happen in a different story. Which clue makes it fit this one?'), boss: T('Ink Baron', 'I saved the ending so nobody would forget it. Tell me what you think happened and show me where you got the idea.'), clear: T('Pip', 'The ending is back. I like it better now that we know why she left.'), change: 'The missing last page is back in the book.' },
  cove: { title: 'The Blotted Lighthouse', open: T('Brindle', 'A ship is looking for the lighthouse. My first message says “Over there.” I may need to be more specific.'), minions: T('Pip', 'The ink mites are blotting out the useful words. Which sentence actually tells the captain where to turn?'), elite: T('Quill Keeper', 'Make the message clearer for someone who’s never seen this cove.'), boss: T('Ink Baron', 'I can write a hundred fancy words. Can you write one message the captain can follow?'), clear: T('Brindle', 'The ship saw the light. The captain wrote back. Her message says “Left at the lighthouse.” Very clear.'), change: 'The lighthouse shines and the ship turns the right way.' },
  math: { title: 'The Split Mosaic', open: T('Tock', 'Two teams say they each painted half the mosaic. One counted tiles and the other looked at area.'), minions: T('Luma', 'The tile sprites have cut some pieces bigger than others. Find a model with equal parts.'), elite: T('Fraction Keeper', 'The pieces changed shape. Did the shaded share change?'), boss: T('Clockwork Regent', 'Prove which picture shows the share I promised the painters.'), clear: T('Tock', 'The mosaic is finished. We split the celebration cake into equal pieces, too.'), change: 'The mosaic is whole again.' },
  science: { title: 'The Vanishing Signal', open: T('Luma', 'A light blinks near the moon. I have three observations and about a hundred guesses.'), minions: T('Pip', 'The glow motes collected notes. Sort what someone observed from what they imagined.'), elite: T('Dome Keeper', 'Two explanations sound possible. Which one is supported by this observation?'), boss: T('Thorn Marshal', 'I covered the lens to protect the seedlings. Show me the observation that tells us when it’s safe to open it.'), clear: T('Luma', 'The dome is open. We still have questions. This time we know which ones to investigate.'), change: 'The observatory dome opens to the sky.' },
  art: { title: 'The Faded Festival', open: T('Brindle', 'The festival posters all look the same from the water. Can we use colour to make the welcome sign stand out?'), minions: T('Pip', 'Sort the paint sprites by warm and cool colours. They’re getting into each other’s buckets.'), elite: T('Palette Keeper', 'Which background makes this warm lantern easier to spot?'), boss: T('Prism Curator', 'I saved my best colours in one locked box. Show me how to use them together and I’ll open it.'), clear: T('Brindle', 'Now the welcome sign looks warm even from the ferry.'), change: 'The festival sign glows warm across the water.' },
  history: { title: 'The Lost Timeline', open: T('Tock', 'The museum put its newest photo at the start of the timeline. Let’s look at the dates and captions.'), minions: T('Luma', 'The clock mites mixed old and new photographs. Put the events in order using the evidence.'), elite: T('Archive Keeper', 'One picture has no date. Which caption helps us place it?'), boss: T('Chronicle Warden', 'My favourite event deserves to go first. Can you show me what happened before it?'), clear: T('Tock', 'Your favourite event can stay your favourite, even when it’s in the middle.'), change: 'The museum timeline runs oldest to newest.' },
  french: { title: 'The Silent Market', open: T('Brindle', 'My delivery notes tell me when to greet someone and when to say goodbye. I mixed up the French cards.'), minions: T('Pip', 'Match the greetings to the people arriving at the stalls.'), elite: T('Harbor Keeper', 'The stall is closing now. Which phrase fits the goodbye?'), boss: T('Baroness Vesper', 'My flock can repeat any phrase. Show me which one belongs at the beginning of this conversation.'), clear: T('Brindle', 'Bonjour when I arrive. Au revoir when I leave. I think I can deliver the next letter myself.'), change: 'The market speaks again: bonjour and au revoir.' },
};
const PROLOGUE = [T('Pip', 'The paths are still here. We just have to figure out where they go.'), T('Luma', 'These lanterns remember what happened on each island. Help me light them, and we can stitch the roads back together.'), T('Brindle', 'I’ll carry notes between islands. If you see a clue, write it in your journal. I’ve already tried delivering one letter to a cloud.')];
const FINALE = [T('Margin Keeper', 'Every time the Atlas was finished, someone shut it. I thought if the roads were gone, nobody would ever leave.'), T('Luma', 'I used to keep the lanterns on a shelf. They’re brighter now that people carry them.'), T('Pip', 'We can finish a story and still come back. Want to help us draw a road for the next person?')];
const OBJ = { intro: 'Guided question: read the clue, then answer.', minions: 'Answer independently to chase the sprites away.', elite: 'An elite check with a twist, and a counterattack to watch for.', boss: 'Mixed review. You need three different correct answers and the boss’s Resolve at zero.' };
G.STORY = STORY;
const st = p => (p.story = p.story || { seen: {}, pendingClear: '', prologue: 0 });
const portrait = who => { const c = CAST[who]; if (c) return art(c.art, c.em, 'sp'); return art('monster_phonics', '🦹', 'sp'); };
const plate = who => `<span class="splate" style="--pc:${(CAST[who] || { c: '#9a5cff' }).c}">${esc(who)}${CAST[who] ? `<small>${esc(CAST[who].role)}</small>` : ''}</span>`;

/* ---- the scene player ---- */
let SC = null;
const root = () => { let r = $('#story'); if (!r) { r = document.createElement('div'); r.id = 'story'; r.className = 'story'; r.setAttribute('role', 'dialog'); r.setAttribute('aria-modal', 'true'); document.body.appendChild(r); } return r; };
function show(scene) {
  SC = scene; const r = root(), line = scene.lines[scene.i], who = line[0], boss = scene.boss && scene.i === scene.lines.length - 1;
  const spr = scene.sprites && scene.sprites[who] ? art(scene.sprites[who], '🦹', 'sp') : portrait(who);
  r.innerHTML = `<div class="scard ${boss ? 'boss' : ''}" tabindex="-1">${scene.title ? `<div class="stitle">${esc(scene.title)}</div>` : ''}${boss ? '<div class="sboss">⚠ Boss introduction</div>' : ''}
    <div class="sbody"><div class="sport">${spr}</div><div class="stext">${plate(who)}<p id="sline">${esc(line[1])}</p></div></div>
    ${scene.obj ? `<div class="sobj"><b>Why this battle:</b> ${esc(scene.obj)}</div>` : ''}
    <div class="row sbtn"><button class="btn ghost sm" data-a="stSkip">Skip</button><button class="btn ghost sm" data-a="stRead">🔊 Read aloud</button><button class="btn ghost sm" data-a="stStop">⏹ Stop</button><button class="btn big" data-a="stNext">${scene.i < scene.lines.length - 1 ? 'Next ▶' : scene.cta || 'Continue ▶'}</button></div></div>`;
  const c = r.querySelector('.scard'); if (c) c.focus({ preventScroll: true });
  if (S.settings.voice && S.settings.narration && scene.auto) speak(line[1]);
}
const end = () => { hush(); const r = $('#story'); if (r) r.remove(); const d = SC && SC.done; SC = null; if (d) d(); };
A.stNext = () => { if (!SC) return; hush(); if (SC.i < SC.lines.length - 1) { SC.i++; show(SC); } else end(); };
A.stSkip = () => end();
A.stRead = () => { if (SC) speak(SC.lines[SC.i][1]); };
A.stStop = () => hush();
const play = (scene, done) => { show({ i: 0, ...scene, done }); };

/* ---- integrate with chapters: dialogue before the first time each beat is played ---- */
const _chapter = A.gChapter;
A.gChapter = d => {
  const p = C.cur(), s = STORY[d.id], key = d.id + ':' + d.s, sg = st(p); if (!s || sg.seen[key]) return _chapter(d);
  G.closePanel(); const lines = [], pro = !sg.prologue; if (pro && d.id === 'sound') lines.push(...PROLOGUE);
  const beat = s[{ intro: 'open', minions: 'minions', elite: 'elite', boss: 'boss' }[d.s]]; lines.push(beat);
  const sprites = {}; if (d.s === 'boss') sprites[beat[0]] = BOSSART[beat[0]]; else if (!CAST[beat[0]] && beat[0] !== 'Pip') sprites[beat[0]] = MONART[d.id];
  sg.seen[key] = 1; if (pro && d.id === 'sound') sg.prologue = 1; C.save();
  play({ lines, title: `${s.title} · ${{ intro: 'Opening', minions: 'Minions', elite: 'Elite check', boss: 'Boss' }[d.s]}`, obj: OBJ[d.s], boss: d.s === 'boss', sprites, cta: 'Begin battle ▶', auto: true }, () => { _chapter(d); });
};
/* closing line after a boss clear */
const _claim = G.claim;
G.claim = (p, pd) => { const had = pd.chapter && pd.stage === 'boss' && !(p.ch && p.ch[pd.chapter] && p.ch[pd.chapter].cleared); const rc = _claim(p, pd);
  if (had && STORY[pd.chapter]) { st(p).pendingClear = pd.chapter; } if (pd.chapter === 'finale' && !rc.dup) { p.badges = p.badges || []; if (!p.badges.includes('atlas-keeper')) { p.badges.push('atlas-keeper'); rc.lines.push('🏅 <b>Atlas Keeper badge</b> (permanent)'); } st(p).finaleDone = 1; st(p).pendingClear = 'finale'; } C.save(); return rc; };
const _leave = G.leave;
G.leave = function (early) { const p = C.cur(), sg = p && st(p), id = sg && sg.pendingClear;
  if (id) { sg.pendingClear = ''; C.save(); const lines = id === 'finale' ? [T('Pip', 'Every road is drawn. The Atlas Keeper badge is yours.'), ['Margin Keeper', 'The next page is blank. Pick where the next adventure begins.']] : [STORY[id].clear]; const after = id === 'finale' ? [] : [['Pip', 'Island update: ' + STORY[id].change]];
    return play({ lines: [...lines, ...after], title: id === 'finale' ? 'The page after the last page' : STORY[id].title + ' · Cleared', cta: 'Continue ▶', auto: true }, () => _leave(early)); }
  return _leave(early); };

/* ---- journal ---- */
const destName = id => (G.DEST[id] || {}).name || id;
G.journal = () => {
  const p = C.cur(), sg = st(p), cleared = id => !!(p.ch && p.ch[id] && p.ch[id].cleared), playable = D.destinations.filter(d => STORY[d.id] && G.destPlayable(d)), all = playable.every(d => cleared(d.id));
  const rows = Object.keys(STORY).map(id => { const s = STORY[id], play = G.destPlayable(G.DEST[id] || {}), beats = ['intro', 'minions', 'elite', 'boss'].filter(b => sg.seen[id + ':' + b]);
    return `<li class="jrow ${cleared(id) ? 'done' : ''}"><b>${cleared(id) ? '🏮' : '◌'} ${esc(s.title)}</b> <small>${esc(destName(id))}${play ? '' : ' · coming soon'}</small>${cleared(id) ? `<br><small>${esc(s.change)}</small>` : ''}<div class="row left tight">${beats.map(b => `<button class="btn ghost sm" data-a="jScene" data-id="${id}" data-b="${b}">${{ intro: 'Opening', minions: 'Minions', elite: 'Elite', boss: 'Boss' }[b]}</button>`).join('')}${cleared(id) ? `<button class="btn ghost sm" data-a="jScene" data-id="${id}" data-b="clear">Ending</button>` : ''}</div></li>`; }).join('');
  const n = playable.filter(d => cleared(d.id)).length;
  G.panel(`<h2>📖 Atlas Journal</h2><p class="small">Lanterns lit: <b>${n}</b> of ${Object.keys(STORY).length} chapters (${playable.length} playable now; the rest open after their questions are reviewed). ${p.badges && p.badges.includes('atlas-keeper') ? '🏅 Atlas Keeper badge earned.' : ''}</p>
    <ul class="jlist">${rows}</ul>
    <div class="fb ${all ? 'good' : 'warn'}"><div><b>Finale: The page after the last page.</b> ${all ? 'All playable chapters are cleared.' : `Clear every playable chapter first (${n}/${playable.length}).`} <small>Demo build: this finale uses the ${playable.length} playable chapters, not all twelve.</small></div>${all ? `<button class="btn gold" data-a="jFinale">${sg.finaleDone ? 'Replay the finale' : 'Begin the finale'}</button>` : ''}</div>
    <div class="row left"><button class="btn ghost" data-a="gClose">Close</button></div>`);
};
A.gJournal = () => G.journal();
A.jScene = d => { const s = STORY[d.id]; const line = d.b === 'clear' ? s.clear : s[{ intro: 'open', minions: 'minions', elite: 'elite', boss: 'boss' }[d.b]]; G.closePanel(); play({ lines: [line], title: s.title, boss: d.b === 'boss', sprites: d.b === 'boss' ? { [line[0]]: BOSSART[line[0]] } : (!CAST[line[0]] ? { [line[0]]: MONART[d.id] } : {}), cta: 'Close', auto: false }, () => G.journal()); };
A.jFinale = () => { const p = C.cur(); G.closePanel(); const ids = D.destinations.filter(d => STORY[d.id] && G.destPlayable(d) && p.ch && p.ch[d.id] && p.ch[d.id].cleared).map(d => d.id);
  play({ lines: FINALE, title: 'The page after the last page', obj: 'A short review using questions from the chapters you cleared. Each right answer redraws one road.', boss: true, sprites: { 'Margin Keeper': 'v_ink_baron' }, cta: 'Begin the review ▶', auto: true }, () => {
    let items = []; ids.forEach(id => items.push(...G.destItems(p, G.DEST[id], false).items.slice(0, 1))); const min = Math.min(3, items.length);
    G.startBattle({ dest: ids[0] || 'sound', enemy: 'ink-baron', enemyName: 'Margin Keeper', items, min, resolve: min * 2, source: 'chapter', chapter: 'finale', stage: 'finale', boss: true, returnTo: 'map', title: 'The page after the last page', again: () => A.jFinale() }); }); };
const _panel = A.gDest;
A.gDest = d => { _panel(d); const h = document.querySelector('.chapter h3'); if (h && !h.querySelector('[data-a=gJournal]')) h.insertAdjacentHTML('beforeend', ' <button class="btn ghost sm" data-a="gJournal">📖 Journal</button>'); };
});
