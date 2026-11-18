/* Storyland Quest – app logic. No build step, no dependencies. */
(() => {
'use strict';
const B = window.BANK;
const KEY = 'storyland_quest_v1';
const app = document.getElementById('app');

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const strip = s => String(s).replace(/<[^>]+>/g, '');
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.random() * a.length | 0];
const sample = (a, n) => shuffle(a).slice(0, n);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const today = () => new Date().toISOString().slice(0, 10);

/* ---------- data ---------- */
const SKILLS = [
  {id:'phonics',  name:'Sound Island',     icon:'🏝️', color:'#ff8a5b', desc:'Rhymes & sounds',  label:'Phonics'},
  {id:'spelling', name:'Spell Castle',     icon:'🏰', color:'#a06cf5', desc:'Build words',      label:'Spelling'},
  {id:'vocab',    name:'Word Jungle',      icon:'🌴', color:'#2fbf71', desc:'Word meanings',    label:'Vocabulary'},
  {id:'grammar',  name:'Sentence Station', icon:'🚂', color:'#3d9df2', desc:'Build sentences',  label:'Grammar'},
  {id:'sequence', name:'Order Orchard',    icon:'🍎', color:'#f2a900', desc:'What comes next?', label:'Sequencing'},
  {id:'reading',  name:'Story Mountain',   icon:'⛰️', color:'#ef5da8', desc:'Read & think',     label:'Comprehension'},
  {id:'writing',  name:'Writer’s Cove',    icon:'✏️', color:'#19b5b0', desc:'Write your own',   label:'Writing'}
];
const SK = Object.fromEntries(SKILLS.map(s => [s.id, s]));
const LV = ['🌱 Sprout', '🧭 Explorer', '🏆 Champion'];
const TITLES = ['Word Cub','Page Turner','Story Scout','Book Ranger','Tale Tracker','Word Wizard','Reading Hero','Legend of Storyland'];
const AVATARS = ['🐼','🦁','🐸','🦄','🐙','🐧','🦉','🐯','🐨','🐰','🦖','🐳'];
const STICKERS = ['🌈','🚀','🍦','🎸','🦋','🍩','🏆','🎨','🛸','🧁','🐉','🌻','⚡','🎪','🧩','🪐','🍉','🦜','🎠','💎','🌋','🧸','🍭','👑'];
const TOPICS = [['🦖','dinosaurs'],['🚀','space'],['🐶','animals'],['⚽','sports'],['🧙','magic'],['🌊','the ocean'],['🤖','robots'],['🦸','superheroes'],['🍕','food'],['🎲','a surprise']];
const PRAISE = ['Awesome!','You got it!','Super reading!','Brilliant!','Wow, nice one!','Yes! High five!','Direct hit!'];
const RETRY = ['Not quite – try again!','So close!','Almost! One more try.'];
const SUBS = {main:'Main idea', detail:'Finding details', inference:'Inference', vocab:'Words in context'};
const RECS = {
  phonics:['Play rhyme games aloud and sort picture cards by first sound.','Practise word families that sound the same but are spelled differently (light / kite).','Clap out syllables in longer words and explore tricky vowel teams.'],
  spelling:['Build three-letter words with letter tiles (c-a-t).','Practise blends and long-vowel patterns with look-cover-write-check.','Break long words into syllables and study common endings (-tion, -ous).'],
  vocab:['Talk about new words during read-alouds; use a picture dictionary.','Keep a personal word wall and use each new word in a sentence.','Explore synonyms, antonyms and word roots in context.'],
  grammar:['Arrange word cards into simple sentences; stress capitals and periods.','Practise verb tenses and subject–verb agreement out loud and in writing.','Combine sentences with joining words; edit for commas in longer sentences.'],
  sequence:['Retell daily routines using first / next / last.','Use a story map to order the beginning, middle and end.','Summarize multi-step texts using time-order words.'],
  reading:['Shared reading of short texts with who / what / where questions.','Ask “how do you know?” to build inference from short passages.','Compare themes and author’s purpose; point to evidence in the text.'],
  writing:['Write one full sentence a day with a capital and a period.','Stretch sentences with describing words and “because”.','Plan paragraphs with a topic sentence, details and a closing.']
};
/* game layer */
const PETS = {
  dragon:{name:'Dragon',   nick:'Ember',    st:['🥚','🦎','🐲','🐉'], glow:'#ff8a5b'},
  bird:  {name:'Sky Bird', nick:'Skye',     st:['🥚','🐣','🐥','🦅'], glow:'#3d9df2'},
  sea:   {name:'Sea Pup',  nick:'Splash',   st:['🥚','🐟','🐬','🐳'], glow:'#19b5b0'},
  cat:   {name:'Wild Cat', nick:'Whiskers', st:['🥚','🐱','🐯','🦁'], glow:'#f2a900'}
};
const STAGE = ['Egg','Baby','Teen','Legendary'], EVO = [10, 120, 350];
const MON = {phonics:['👾','Echo Blob'], spelling:['🧌','Jumble Troll'], vocab:['🐊','Word Croc'], grammar:['🤖','Mix-Up Bot'], sequence:['🌀','Time Twister'],
  reading:['👻','Fog Ghost'], writing:['🦑','Ink Squid'], placement:['🎯','Target Bot'], mission:['🦹','Riddle Master']};
const SHOP = [
  {id:'apple', cat:'food', e:'🍎', name:'Apple', cost:15, xp:8, happy:25}, {id:'cookie', cat:'food', e:'🍪', name:'Cookie', cost:30, xp:18, happy:45}, {id:'cake', cat:'food', e:'🍰', name:'Star Cake', cost:60, xp:40, happy:100},
  {id:'cap', cat:'hat', e:'🧢', name:'Cool Cap', cost:25}, {id:'bow', cat:'hat', e:'🎀', name:'Big Bow', cost:30}, {id:'shades', cat:'hat', e:'🕶️', name:'Shades', cost:60},
  {id:'tophat', cat:'hat', e:'🎩', name:'Top Hat', cost:70}, {id:'grad', cat:'hat', e:'🎓', name:'Scholar Cap', cost:90}, {id:'crown', cat:'hat', e:'👑', name:'Royal Crown', cost:150},
  {id:'sky', cat:'theme', e:'⛅', name:'Sunny Sky', cost:0}, {id:'jungle', cat:'theme', e:'🌴', name:'Jungle', cost:100}, {id:'ocean', cat:'theme', e:'🌊', name:'Ocean', cost:100},
  {id:'candy', cat:'theme', e:'🍬', name:'Candy Land', cost:100}, {id:'space', cat:'theme', e:'🌌', name:'Outer Space', cost:120},
  {id:'hint', cat:'power', e:'🧪', name:'Hint Potion', cost:20}, {id:'magnet', cat:'power', e:'🧲', name:'Coin Magnet', cost:45},
  ...Object.keys(PETS).map(k => ({id:'egg_' + k, cat:'egg', pet:k, e:'🥚', name:PETS[k].name + ' Egg', cost:250}))
];
const CATS = {food:'🍎 Food', hat:'🎩 Hats', egg:'🥚 Eggs', theme:'🌍 Worlds', power:'⚡ Power-Ups'};

/* ---------- state ---------- */
let S = load();
let AI = {on:false, provider:'', model:''};
let ASSETS = new Set(window.SQ_ASSETS || []);   // names of PNGs found in public/assets (art drops in without code changes)
let Q = null;             // current quest
let W = null;             // current writing task
let A = null;             // current AI adventure
let dashSel = null;
let T = null;
let G = null;   // game layer (game-*.js)   // Story Mountain teacher demo (teach.js)
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.profiles)) return s; } catch (e) {}
  return {profiles:[], current:null, settings:{sound:true, voice:true, font:false}};
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function fix(p) { // fill in fields added by newer versions
  if (!p) return p;
  p.coins = p.coins || 0; p.inv = p.inv || ['sky']; p.pets = p.pets || {}; p.pet = p.pet || ''; p.petName = p.petName || '';
  p.theme = p.theme || 'sky'; p.pow = p.pow || {hint:2, magnet:0}; p.miss = p.miss || []; p.notes = p.notes || [];
  if (p.happy == null) { p.happy = 70; p.happyT = Date.now(); }
  if (G) G.migrate(p);
  return p;
}
const cur = () => fix(S.qaOn && S.qa && S.current === 'qa' ? S.qa : S.profiles.find(p => p.id === S.current));
const lvl = m => m < 35 ? 1 : m < 70 ? 2 : 3;
const startM = g => g <= 2 ? 20 : g <= 4 ? 45 : g <= 6 ? 62 : 72;
function newProfile(name, avatar, grade) {
  return fix({id:'p' + Date.now() + (Math.random() * 1e4 | 0), name, avatar, grade, xp:0, stars:0, streak:0, lastDay:'',
    quests:0, placed:false, stickers:[], seen:[], topic:'', log:[],
    skills:Object.fromEntries(SKILLS.map(s => [s.id, {m:startM(grade)}]))});
}
function record(p, skill, {correct, ms = 0, sub = '', guess = false, weight = 1, delta = null}) {
  const s = p.skills[skill], before = lvl(s.m);
  const d = delta != null ? delta : (correct ? 8 : -6) * (guess ? .5 : 1) * weight;
  s.m = clamp(s.m + d, 0, 100);
  p.log.push({t:Date.now(), skill, sub, ok:correct ? 1 : 0, ms:Math.round(ms), g:guess ? 1 : 0, lv:before});
  if (p.log.length > 800) p.log.shift();
  save();
}
const stage = x => x < EVO[0] ? 0 : x < EVO[1] ? 1 : x < EVO[2] ? 2 : 3;
const petOf = p => p.pets[p.pet];
const happy = p => clamp(Math.round((p.happy || 0) - (Date.now() - (p.happyT || Date.now())) / 36e5 * 3), 0, 100);

/* ---------- art: uses an image from public/assets when it exists, otherwise an emoji ---------- */
const art = (name, emoji, cls = '') => ASSETS.has(name) ? `<img class="art ${cls}" src="assets/${name}.png" alt="" draggable="false">` : `<span class="art ${cls}" aria-hidden="true">${emoji}</span>`;
const coin = () => art('coin', '🪙', 'ic');
function petHtml(p, cls = '') {
  if (!p.pet) return `<span class="pet ${cls}">${art('pip_happy', '🦊')}</span>`;
  const o = petOf(p), s = stage(o.xp), hat = s > 0 && o.hat ? SHOP.find(i => i.id === o.hat) : null;
  return `<span class="pet ${cls}">${hat ? `<span class="hat">${art('hat_' + hat.id, hat.e)}</span>` : ''}${art(`pet_${p.pet}_${s + 1}`, PETS[p.pet].st[s])}</span>`;
}

/* ---------- sound, voice, effects ---------- */
let ac;
function tone(notes, type = 'triangle') {
  if (!S.settings.sound) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    let t = ac.currentTime;
    notes.forEach(([f, d]) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(.16, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d); t += d * .8; });
  } catch (e) {}
}
function noise(d = .25, from = 400, to = 2400, vol = .05) {
  if (!S.settings.sound) return;
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const n = ac.sampleRate * d, buf = ac.createBuffer(1, n, ac.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), t = ac.currentTime; src.buffer = buf; f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + d); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + d * .4); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    src.connect(f).connect(g).connect(ac.destination); src.start(t); } catch (e) {}
}
const sfx = {whoosh:() => noise(), ok:() => { tone([[660,.12],[880,.22]]); tone([[990,.12],[1320,.25]], 'sine'); }, bad:() => tone([[220,.25]]), tap:() => tone([[520,.05]]), pop:() => tone([[900,.06]]),
  win:() => tone([[523,.12],[659,.12],[784,.12],[1047,.35]]), coin:() => tone([[988,.07],[1319,.18]], 'square'), hit:() => { tone([[180,.08],[120,.15]], 'sawtooth'); noise(.18, 1800, 200, .12); },
  evolve:() => tone([[392,.12],[523,.12],[659,.12],[784,.12],[1047,.15],[1319,.4]]), chest:() => tone([[440,.1],[554,.1],[659,.1],[880,.3]]), munch:() => tone([[300,.06],[260,.06],[300,.06]])};
let readTok = 0;
/* Voice: Claude's own voice (tts) on the shared page when the viewer allows it, otherwise the browser's speech engine. */
let TTS = null; if (window.claude && window.claude.use) window.claude.use('tts').then(t => { TTS = t || null; }).catch(() => {});
const canSpeak = () => S.settings.voice && (!!TTS || 'speechSynthesis' in window);
function speakLocal(text, onend) { if (!('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = .88; u.pitch = 1.1; u.lang = 'en-CA'; if (onend) u.onend = onend; speechSynthesis.speak(u); }
function speak(text, onend) {
  if (!canSpeak()) return; const t = strip(text).slice(0, 1900);
  if (TTS) { try { TTS.stop && TTS.stop(); } catch (e) { /* nothing playing */ } TTS.speak(t, {voice:'buttery'}).then(() => onend && onend()).catch(e => { if (!e || !['viewer_stopped', 'busy'].includes(e.code)) speakLocal(t, onend); }); return; }
  speakLocal(t, onend);
}
function hush() { readTok++; try { TTS && TTS.stop && TTS.stop(); } catch (e) { /* idle */ } if ('speechSynthesis' in window) speechSynthesis.cancel(); }
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function confetti(n = 36, set = ['⭐','🎉','✨','🌟','🎈','💛']) {
  if (calm()) return;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span'); s.className = 'conf'; const it = pick(set); if (it === 'COIN') s.innerHTML = coin(); else s.textContent = it;
    s.style.left = Math.random() * 100 + 'vw'; s.style.animationDuration = 1.6 + Math.random() * 1.6 + 's'; s.style.fontSize = 18 + Math.random() * 22 + 'px';
    document.body.appendChild(s); setTimeout(() => s.remove(), 3400);
  }
}
function floaty(html, el) {
  if (!el || calm()) return; const r = el.getBoundingClientRect(), s = document.createElement('span');
  s.className = 'floaty'; s.innerHTML = html; s.style.left = r.left + r.width / 2 + 'px'; s.style.top = r.top + 'px';
  document.body.appendChild(s); setTimeout(() => s.remove(), 1100);
}
function wipe() {}
function burst(el, n = 10, set = ['⭐','✨','💥','🌟']) {
  if (!el || calm()) return; const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < n; i++) { const s = document.createElement('span'), a = Math.PI * 2 * i / n + Math.random() * .5, d = 70 + Math.random() * 90;
    s.className = 'spark'; s.textContent = pick(set); s.style.left = cx + 'px'; s.style.top = cy + 'px'; document.body.appendChild(s);
    s.animate([{transform:'translate(-50%,-50%) scale(.4)', opacity:1}, {transform:`translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(1.3) rotate(${Math.random() * 360}deg)`, opacity:0}], {duration:650 + Math.random() * 300, easing:'cubic-bezier(.1,.8,.3,1)'}).onfinish = () => s.remove(); }
}
function flyCoins(from, to, n = 8) {
  if (!from || !to || calm()) return; const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  for (let i = 0; i < n; i++) { const c = document.createElement('span'); c.className = 'flycoin'; c.innerHTML = coin(); document.body.appendChild(c);
    const x0 = a.left + a.width / 2 + (Math.random() - .5) * 80, y0 = a.top + a.height / 2, x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
    c.animate([{transform:`translate(${x0}px,${y0}px) scale(.6)`, opacity:0}, {transform:`translate(${x0 + (Math.random() - .5) * 120}px,${y0 - 90 - Math.random() * 60}px) scale(1.2)`, opacity:1, offset:.35}, {transform:`translate(${x1}px,${y1}px) scale(.5)`, opacity:1}],
      {duration:900, delay:i * 70, easing:'cubic-bezier(.5,0,.3,1)', fill:'backwards'}).onfinish = () => { c.remove(); sfx.coin(); anim(to, 'bump', 250); }; }
}
function countUp(el, from, to) { if (!el) return; setTimeout(() => { if (document.body.contains(el)) el.textContent = to; }, 1700); const t0 = performance.now() + 500, d = 900; const step = t => { const k = clamp((t - t0) / d, 0, 1); el.textContent = Math.round(from + (to - from) * k); if (k < 1 && document.body.contains(el)) requestAnimationFrame(step); }; requestAnimationFrame(step); }
function anim(el, cls, ms = 600) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms); }

/* ---------- AI ---------- */
const QUICK = ['adventure', 'explain', 'vocab', 'writing'];
/* Connect Pip's AI from anywhere in the app: the viewer's own Claude account on the shared page, or an API key on a local server. */
async function connectAI(key) {
  if (!key && window.claude && window.claude.use && window.SQ_PROMPTS) { try { const sm = await window.claude.use('sample'); if (sm) { AI = {on:true, provider:'Claude (built in)', model:'', sample:sm}; return {ok:true}; } } catch (e) { /* fall through */ } return {ok:false, error:'Claude did not allow AI for this page.'}; }
  if (!key) return {ok:false, error:'Paste an API key, or open the shared Claude page and allow AI there.'};
  const provider = /^sk-ant-/.test(key) ? 'anthropic' : /^AIza/.test(key) ? 'gemini' : /^sk-/.test(key) ? 'openai' : 'anthropic';
  try { const r = await fetch('/api/key', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({provider, key})}), d = await r.json();
    if (!r.ok) return {ok:false, error:d.error || 'Could not connect.'};
    AI = {on:!!d.ai, provider:d.provider, model:d.model}; return {ok:AI.on};
  } catch (e) { return {ok:false, error:'Run the app with python3 server.py to connect an API key.'}; }
}
/* Raw prompt to the connected AI (used by the teacher drafting tools, which build long prompts of their own). */
async function aiRaw(prompt) {
  if (!AI.on) return null;
  if (AI.sample) return await AI.sample.json(prompt, {modelTier:'default', cache:false});
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 90000);
  try { const r = await fetch('/api/ai', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({kind:'raw', params:{prompt}}), signal:ctl.signal}); clearTimeout(to); if (!r.ok) return null; return (await r.json()).data || null; } catch (e) { return null; }
}
async function ai(kind, params) {
  if (!AI.on) return null;
  if (AI.sample) { // shared page: ask Claude through the viewer's own account
    try { return await AI.sample.json(window.SQ_PROMPTS.build(kind, params), {modelTier:QUICK.includes(kind) ? 'quick' : 'default', cache:false}); }
    catch (e) { if (e && ['not_granted','sampling_disabled','not_declared','capability_disabled','capability_removed'].includes(e.code)) AI = {on:false, provider:'', model:''}; return null; }
  }
  try {
    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 60000);
    const r = await fetch('/api/ai', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({kind, params}), signal:ctl.signal});
    clearTimeout(to);
    if (!r.ok) return null;
    return (await r.json()).data || null;
  } catch (e) { return null; }
}
/* Every AI reply is checked before a child sees it. Anything that fails → content bank. */
const isStr = (s, min = 1, max = 400) => typeof s === 'string' && s.trim().length >= min && s.length <= max;
function validQ(q) { // → {q, options (correct one first), sub, explain} or null
  if (!q || !isStr(q.q) || !Array.isArray(q.options) || q.options.length < 3 || q.options.length > 4 || !q.options.every(o => isStr(o, 1, 120))) return null;
  if (new Set(q.options.map(o => o.trim().toLowerCase())).size !== q.options.length) return null;
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) return null;
  return {q:q.q, options:[q.options[q.answer], ...q.options.filter((_, i) => i !== q.answer)], sub:SUBS[q.sub] ? q.sub : 'detail', explain:isStr(q.explain) ? q.explain : ''};
}
function validGloss(g) { const o = {}; if (g && typeof g === 'object') for (const [k, v] of Object.entries(g)) if (isStr(k, 1, 30) && isStr(v, 1, 120)) o[k.toLowerCase()] = v; return o; }
function validChapter(d, n) {
  if (!d || !isStr(d.title, 1, 80) || !isStr(d.text, 40, 1500)) return null;
  const question = validQ(d.question); if (!question) return null;
  const choices = Array.isArray(d.choices) ? d.choices.filter(c => isStr(c, 2, 80)).slice(0, 2) : [];
  if (n < 3 && choices.length !== 2) return null;
  return {title:d.title, emoji:isStr(d.emoji, 1, 8) ? d.emoji : '📖', text:d.text, glossary:validGloss(d.glossary), question, choices:n < 3 ? choices : []};
}
function validMission(d) {
  if (!d || !isStr(d.noticed, 5, 400) || !Array.isArray(d.items)) return null;
  const items = d.items.map(x => { const q = validQ(x); return q && ['vocab','grammar','reading','sequence'].includes(x.skill) ? {...q, skill:x.skill, passage:isStr(x.passage, 5, 600) ? x.passage : ''} : null; }).filter(Boolean);
  return items.length >= 4 ? {noticed:d.noticed, focus:isStr(d.focus, 1, 40) ? d.focus : 'Practice', note:isStr(d.teacher_note, 3, 400) ? d.teacher_note : '', items:items.slice(0, 6)} : null;
}
function validVocab(d) {
  if (!d || !Array.isArray(d.items)) return null;
  const ok = d.items.filter(x => x && isStr(x.word, 2, 24) && isStr(x.meaning, 2, 80) && Array.isArray(x.wrong) && x.wrong.length >= 3 && x.wrong.every(w => isStr(w, 2, 80) && w.trim().toLowerCase() !== x.meaning.trim().toLowerCase()));
  return ok.length >= 4 ? ok.slice(0, 5) : null;
}
function validFeedback(d) {
  if (!d || !isStr(d.glow, 3, 300) || !isStr(d.grow, 3, 300)) return null;
  return {ai:true, stars:clamp(parseInt(d.stars, 10) || 2, 1, 3), glow:d.glow, grow:d.grow, tip:isStr(d.tip, 1, 300) ? d.tip : ''};
}
const aiTag = t => `<p class="aitag">✨ ${t}</p>`;

/* ---------- item generators ---------- */
function mc(prompt, correct, wrongs, extra) {
  const options = shuffle([correct, ...wrongs]);
  return {type:'mc', prompt, options, answer:options.indexOf(correct), key:prompt, say:strip(prompt), ...extra};
}
function orderItem(o) {
  let toks; let n = 0;
  do { toks = shuffle(o.goal.map((t, i) => ({id:i, t}))); } while (toks.map(x => x.t).join('\u0001') === o.goal.join('\u0001') && n++ < 9);
  return {pool:toks, tray:[], ...o};
}
const GEN = {
  phonics(L) {
    const r = Math.random();
    if (L === 1 && r < .5) {
      const [w, e] = pick(B.firstSound);
      const same = pick(B.firstSound.filter(x => x[0][0] === w[0] && x[0] !== w));
      const letters = sample([...new Set(B.firstSound.map(x => x[0][0]))].filter(c => c !== w[0]), 3);
      const wrong = letters.map(c => pick(B.firstSound.filter(x => x[0][0] === c)));
      return mc(`Which word starts with the same sound as <b>${w}</b>?`, `${same[1]} ${same[0]}`, wrong.map(x => `${x[1]} ${x[0]}`),
        {emoji:e, sub:'first sound', hint:`Say “${w}” slowly. What sound do you hear first?`, explain:`<b>${w}</b> and <b>${same[0]}</b> both start with “${w[0]}”.`});
    }
    if (L === 3 && r < .55) {
      const [w, n] = pick(B.syllables);
      return mc(`How many beats (syllables) are in <b>${w}</b>?`, String(n), ['2','3','4','5'].filter(x => x !== String(n)),
        {sub:'syllables', hint:'Clap the word as you say it slowly.', explain:`<b>${w}</b> has ${n} beats.`});
    }
    const fams = B.rhymes[L === 1 ? 1 : 2];
    const f = pick(fams), [t, a] = sample(f, 2);
    const wrong = sample(fams.filter(x => x !== f), 3).map(pick);
    return mc(`Which word rhymes with <b>${t}</b>?`, a, wrong, {sub:'rhyme', hint:`Say each word out loud after “${t}”. Which one sounds the same at the end?`, explain:`<b>${t}</b> and <b>${a}</b> end with the same sound.`});
  },
  vocab(L) {
    const [w, m] = pick(B.vocab[L]);
    return mc(`What does <b>${w}</b> mean?`, m, sample(B.vocab[L].filter(x => x[0] !== w), 3).map(x => x[1]), {sub:'meaning', hint:'Cross out the ones you know are wrong first.', explain:`<b>${w}</b> means “${m}”.`});
  },
  spelling(L) {
    const [w, e, clue] = pick(B.spelling[L]);
    const extra = sample('abdeghiklmnoprstuw'.split('').filter(c => !w.includes(c)), L - 1);
    const it = orderItem({type:'build', goal:w.split(''), prompt:'Spell the word!', emoji:e, clue, word:w, key:w, sub:'spelling', say:`Spell the word: ${w}`, explain:`<b>${w.toUpperCase()}</b> – ${clue.toLowerCase()}.`});
    it.pool = shuffle([...it.pool, ...extra.map((t, i) => ({id:100 + i, t}))]);
    return it;
  },
  grammar(L) {
    if (Math.random() < .6) {
      const s = pick(B.sentences[L]);
      return orderItem({type:'order', goal:s.split(' '), prompt:'Tap the words in order to build a sentence.', key:s, sub:'word order', say:'Tap the words in order to build a sentence.', explain:`“${s}”`});
    }
    const [q, a, wrong, ex] = pick(B.grammar[L]);
    return mc(q.includes('___') ? `Pick the right words: <b>${q}</b>` : `<b>${q}</b>`, a, wrong, {sub:'usage', hint:'Say the sentence out loud with each choice. Which sounds right?', explain:ex, say:q.replace('___', 'blank')});
  },
  sequence(L) {
    const set = pick(B.sequences[L]);
    return orderItem({type:'order', big:true, goal:set.s, prompt:`Put the steps in order: <b>${set.t}</b>`, key:set.t, sub:'sequence', say:`Put the steps in order. ${strip(set.t)}`, explain:'First ➜ next ➜ then ➜ last.'});
  }
};
function makeItems(skill, L, n) {
  const out = [], seen = new Set(); let guard = 0;
  while (out.length < n && guard++ < 120) { const it = GEN[skill](L); if (seen.has(it.key)) continue; seen.add(it.key); it.skill = skill; out.push(it); }
  return out;
}
const qItem = (q, extra) => ({...mc(esc(q.q), q.options[0], q.options.slice(1), {sub:q.sub, explain:esc(q.explain || ''), say:q.q, hint:'Look back at the text for a clue.'}), ...extra});

/* ---------- layout pieces ---------- */
function applySettings() {
  const p = cur(), th = p ? p.theme : 'sky';
  document.body.classList.toggle('easy', !!S.settings.font);
  document.body.dataset.theme = calmMode ? 'calm' : th;
}
let calmMode = false;
function view(html, keep, quiet) { const y = window.scrollY; hush(); calmMode = false; applySettings(); app.innerHTML = `<div class="screen ${keep ? 'still' : ''}">${html}</div>`; window.scrollTo(0, keep ? y : 0); if (!keep && !quiet) wipe(); }
function togs() {
  const s = S.settings;
  return `<button class="chip tog" data-a="tog" data-k="sound" aria-label="Sound effects" title="Sound effects">${s.sound ? '🔔' : '🔕'}</button>
  <button class="chip tog" data-a="tog" data-k="voice" aria-label="Read-aloud voice" title="Read-aloud voice">${s.voice ? '🗣️' : '🤐'}</button>
  <button class="chip tog ${s.font ? 'on' : ''}" data-a="tog" data-k="font" aria-label="Easy-read letters" title="Easy-read letters">Aa</button>`;
}
function hdr() {
  if (G) return G.hdr();
  const p = cur(), L = Math.floor(p.xp / 100) + 1;
  return `<header class="top">
    <button class="badge" data-a="map" title="Back to the map"><span class="ava">${p.avatar}</span><span class="who"><b>${esc(p.name)}</b><small>Lv ${L} · ${TITLES[Math.min(L - 1, TITLES.length - 1)]}</small><span class="xp"><i style="width:${p.xp % 100}%"></i></span></span></button>
    <span class="sp"></span>
    <button class="chip coinc" id="coinc" data-a="pet" title="Coins – spend them in the pet shop">${coin()} <b>${p.coins}</b></button><span class="chip" title="Day streak">🔥 <b>${p.streak || 0}</b></span>
    ${togs()}<button class="chip tog" data-a="home" title="Switch player" aria-label="Switch player">🚪</button></header>`;
}
const tabs = a => { const p = cur(); return `<nav class="tabs">${[['map','World Map',art('theme_' + p.theme, '🗺️'),'coral'],['pet','My Pet & Shop',art(`pet_${p.pet}_${stage(petOf(p).xp) + 1}`, '🐾'),'gold'],['stickers','Sticker Book',art('isle_stickers', '📒'),'teal']]
  .map(([k, t, i, c]) => `<button class="btn3 ${c} ${a === k ? 'on' : ''}" data-a="${k}">${i}<span>${t}</span></button>`).join('')}</nav>`; };
const pip = (msg, mood = 'happy') => `<div class="pip"><div class="fox">${art('pip_' + mood, '🦊')}</div><div class="bubble">${msg}</div></div>`;
function loading(msg) { view(`${hdr()}<div class="card center loading"><div class="fox big bounce">${art('pip_think', '🦊')}</div><h2>${msg}</h2><div class="dots"><i></i><i></i><i></i></div>${aiTag('Pip’s AI brain is working…')}</div>`, false, true); }

/* ---------- screens: home & profiles ---------- */
const wordmark = sub => `<div class="wordmark"><span class="w1">Storyland</span><span class="w2">Quest</span>${sub ? `<em>${sub}</em>` : ''}</div>`;
function home() {
  S.current = null; S.qaOn = false; save();
  const ps = S.profiles.filter(p => !p.synthetic);
  view(`<div class="chooser"><header class="chhead">${art('pip_happy', '🦊', 'chpip')}${wordmark('A Reading Adventure Game!')}</header>
    <section class="chcard" aria-labelledby="chh"><h2 id="chh">Choose your player</h2><div class="chgrid">
      ${ps.map(p => `<button class="prof" data-a="pickP" data-id="${p.id}" title="${esc(p.name)}">${G ? G.portrait(p, 64) : `<span>${p.avatar}</span>`}<b>${esc(p.name)}</b><small>Grade ${p.grade} · ${coin()} ${p.coins || 0}</small></button>`).join('')}
      <button class="prof add" data-a="newP"><span>➕</span><b>New player</b><small>Start here!</small></button></div></section>
    <footer class="chfoot"><span class="chips">${togs()}</span><button class="btn3 teal" data-a="gate">👩‍🏫 Teachers &amp; Parents</button></footer></div>`, false, true);
}
let draft = {avatar:AVATARS[0], grade:0};
function newP() {
  view(`<div class="card"><h2>Make your player</h2>
    <label class="lab" for="nm">Your first name or a nickname</label><input id="nm" class="inp" maxlength="14" autocomplete="off" placeholder="Type here…">
    <div class="lab">Pick your picture</div><div class="avs">${AVATARS.map(a => `<button class="av ${a === draft.avatar ? 'on' : ''}" data-a="av" data-v="${a}">${a}</button>`).join('')}</div>
    <div class="lab">What grade are you in?</div><div class="grades">${[1,2,3,4,5,6,7,8].map(g => `<button class="gr ${g === draft.grade ? 'on' : ''}" data-a="gr" data-v="${g}">${g}</button>`).join('')}</div>
    <details class="optmail"><summary>Parent or guardian email (optional)</summary><p class="small">A grown-up can add an email to get a weekly study update with graphs. You can skip this and add it later. It stays on this device.</p>
      <label class="lab" for="pe">Parent or guardian email</label><input id="pe" class="inp" type="email" autocomplete="off" placeholder="parent@example.com" value="${esc(draft.pe || '')}"></details>
    <p id="err" class="err" role="alert"></p>
    <div class="row"><button class="btn ghost" data-a="home">Back</button><button class="btn big" data-a="mkP">Let’s go! 🚀</button></div></div>`);
}
function eggs() {
  view(`${hdr()}${pip('Every hero needs a buddy! Pick a mystery egg. Win battles to make it <b>hatch</b> and <b>evolve</b>!', 'cheer')}
    <div class="eggs">${Object.entries(PETS).map(([k, v]) => `<button class="egg" style="--c:${v.glow}" data-a="egg" data-k="${k}"><span class="eggart wobble">${art(`pet_${k}_1`, '🥚')}</span><b>${v.name} Egg</b><small>${v.st.slice(1).join(' → ')}</small></button>`).join('')}</div>`);
}

/* ---------- screen: map ---------- */
function recommend(p) { return SKILLS.map(s => s.id).sort((a, b) => p.skills[a].m - p.skills[b].m)[0]; }
function map(msg) {
  const p = cur(); if (!p) return home();
  Q = null; W = null; A = null;
  if (G) return G.map(msg);
  if (!p.pet) return eggs();
  if (p.daily !== today()) { p.daily = today(); p.coins += 20; save(); msg = msg || `Welcome, ${esc(p.name)}! Here is your daily gift: <b>+20 ${coin()}</b>`; }
  const rec = p.placed ? recommend(p) : null, o = petOf(p), s = stage(o.xp), h = happy(p);
  const say = msg || (!p.placed ? `Hi ${esc(p.name)}! Word monsters have scrambled Storyland! Do my warm-up so I can pick the best battles for you.`
    : `Welcome back, ${esc(p.name)}! The <b>${MON[rec][1]}</b> is causing trouble at <b>${SK[rec].name}</b>. Can you help?`);
  const next = s < 3 ? Math.round(100 * (o.xp - (EVO[s - 1] || 0)) / (EVO[s] - (EVO[s - 1] || 0))) : 100;
  view(`${hdr()}<div class="world"><div class="wmain">${pip(say)}
    <div class="isles">${SKILLS.map((s, i) => { const m = p.skills[s.id].m, l = lvl(m);
      return `<button class="isle ${rec === s.id ? 'rec' : ''}" style="--c:${s.color};--d:${(i * .37 % 1.6).toFixed(2)}s" data-a="play" data-skill="${s.id}">
        ${rec === s.id ? '<span class="tag">Pip’s pick!</span>' : ''}${art('isle_' + s.id, s.icon, 'ico')}<span class="plaque"><b>${s.name}</b><small>${s.desc} · ${LV[l - 1]}</small><span class="bar"><i style="width:${Math.max(6, m)}%"></i></span></span></button>`; }).join('')}
    </div></div>
    <aside class="wside">
      <button class="petcard" data-a="pet"><span class="ptitle">🐾 My Pet</span><span class="petbox">${petHtml(p, 'mid')}</span><b>${esc(p.petName)}</b><small>${STAGE[s]} ${PETS[p.pet].name}</small>
        <span class="mini"><em>⚡</em><span class="bar"><i style="width:${next}%"></i></span></span><span class="mini"><em>❤️</em><span class="bar"><i class="hb" style="width:${h}%"></i></span></span>
        <span class="go">${h < 40 ? 'I’m hungry! 🍎' : 'Pet home & shop ➜'}</span></button>
      ${!p.placed ? `<button class="mission warmup" data-a="warmup">${art('monster_placement', '🎯')}<b>Pip’s Warm-Up</b><small>8 quick questions<br>hatches your egg!</small></button>`
        : AI.on ? `<button class="mission" data-a="mission">${art('monster_mission', '🧠')}<b>AI Mission</b><small>Built from <u>your</u> answers<br>double coins!</small></button>`
        : `<button class="mission warmup" data-a="play" data-skill="${rec}">${art('monster_' + rec, MON[rec][0])}<b>Today’s Battle</b><small>${SK[rec].name} needs you!</small></button>`}
    </aside></div>${tabs('map')}`);
}
function stickers() {
  if (G) return G.library('stickers');
  const p = cur();
  view(`${hdr()}<div class="card"><h2>📒 My Sticker Book</h2><p>Every treasure chest has a sticker inside. Can you find them all?</p>
    <div class="stk">${STICKERS.map(s => `<div class="st ${p.stickers.includes(s) ? 'got' : ''}">${p.stickers.includes(s) ? s : '❔'}</div>`).join('')}</div>
    </div>${tabs('stickers')}`);
}

/* ---------- pet home & shop ---------- */
let shopTab = 'food';
function pet(msg, keep) {
  if (G) return G.room(msg);
  const p = cur(), o = petOf(p), s = stage(o.xp), h = happy(p);
  const lo = EVO[s - 1] || 0, next = s < 3 ? Math.round(100 * (o.xp - lo) / (EVO[s] - lo)) : 100;
  const label = it => {
    if (it.cat === 'food') return s === 0 ? 'Hatch first!' : `Feed · 🪙 ${it.cost}`;
    if (it.cat === 'power') return `🪙 ${it.cost} · have ${p.pow[it.id] || 0}`;
    if (it.cat === 'egg') return p.pets[it.pet] ? (p.pet === it.pet ? '✓ With you' : 'Bring along') : `🪙 ${it.cost}`;
    if (!p.inv.includes(it.id)) return `🪙 ${it.cost}`;
    return it.cat === 'hat' ? (o.hat === it.id ? 'Take off' : 'Wear') : (p.theme === it.id ? '✓ Using' : 'Use');
  };
  const pic = it => it.cat === 'egg' ? art(`pet_${it.pet}_1`, it.e) : art(`${it.cat === 'theme' ? 'theme' : it.cat === 'hat' ? 'hat' : 'item'}_${it.id}`, it.e);
  view(`${hdr()}<div class="home2"><div class="card room"><div class="stagebox"><button class="petbig" data-a="trick" aria-label="Play with your pet">${petHtml(p, 'huge')}</button><div class="bubble" id="pbub">${msg || (s === 0 ? 'Win a battle to hatch me!' : h < 40 ? 'I’m hungry…' : 'Tap me to play!')}</div></div>
      <div class="pmeta"><input id="pn" class="inp pname" maxlength="12" value="${esc(p.petName)}" aria-label="Pet name"><span>${STAGE[s]} ${PETS[p.pet].name}</span>
        <div class="mini"><em>⚡ ${s < 3 ? 'Next evolution' : 'Fully evolved!'}</em><span class="bar"><i style="width:${next}%"></i></span></div>
        <div class="mini"><em>❤️ Happiness</em><span class="bar"><i class="hb" style="width:${h}%"></i></span></div>
        <small>${h >= 50 ? '😊 A happy pet finds <b>25% more coins</b> in battle!' : 'Feed your pet to make it happy. Happy pets find more coins!'}</small></div></div>
    <div class="card shopcard"><div class="shophead"><div class="ribbon">🛒 Shop</div><span class="chip coinc">${coin()} <b>${p.coins}</b></span></div>
      <div class="stabs">${Object.entries(CATS).map(([c, t]) => `<button class="stab ${c === shopTab ? 'on' : ''}" data-a="stab" data-c="${c}">${t}</button>`).join('')}</div><p id="shopmsg" class="err" role="status"></p>
      <div class="shop">${SHOP.filter(i => i.cat === shopTab).map(it => `<button class="item ${p.inv.includes(it.id) || (it.pet && p.pets[it.pet]) ? 'own' : ''}" data-a="buy" data-id="${it.id}">${pic(it)}<b>${it.name}</b><small>${label(it)}</small></button>`).join('')}</div></div></div>${tabs('pet')}`, keep);
  $('#pn').addEventListener('change', e => { const v = e.target.value.trim(); if (v) { p.petName = v; save(); } });
}
function feedPetXp(p, xp) { const o = petOf(p), b = stage(o.xp); o.xp += xp; return stage(o.xp) > b; }

/* ---------- quests (battles) ---------- */
function newQuest(skill, items, opts = {}) {
  const p = cur(); let magnet = false;
  if (p.pow.magnet > 0) { p.pow.magnet--; magnet = true; save(); }
  return {skill, items, i:0, stars:0, xp:0, coins:0, first:0, combo:0, magnet, before:skill in p.skills ? lvl(p.skills[skill].m) : 0, ...opts};
}
function startQuest(skill, items, opts) { if (G) return G.questToBattle(skill, items, opts); Q = newQuest(skill, items, opts); showItem(); }
const monKey = () => Q.mission ? 'mission' : Q.placement ? 'placement' : Q.skill;
function showItem() {
  const p = cur(), it = Q.items[Q.i]; it.tries = 0; it.done = false; it.ms = null; it.t0 = performance.now();
  const sk = SK[it.skill || Q.skill] || {}, mk = monKey(), mon = MON[mk], total = Q.total || Q.items.length;
  const title = Q.mission ? `🧠 AI Mission: ${esc(Q.focus || '')}` : Q.placement ? '🎯 Pip’s Warm-Up' : `${sk.icon} ${sk.name}`;
  let body;
  if (it.type === 'mc') {
    body = `${it.story ? `<details class="peek"><summary>📖 Peek at the story</summary><p>${esc(it.story.text)}</p></details>` : ''}${it.passage ? `<p class="passage">${esc(it.passage)}</p>` : ''}
      <div class="q">${it.emoji ? `<div class="qemoji">${it.emoji}</div>` : ''}<h2>${it.prompt}</h2><button class="say" data-a="say">🔊 Read it to me</button></div>
      <div class="opts">${it.options.map((o, i) => `<button class="opt c${i}" data-a="ans" data-i="${i}"><span class="ltr">${'ABCD'[i]}</span><span class="otx">${esc(o)}</span></button>`).join('')}</div>`;
  } else {
    body = `<div class="q">${it.emoji ? `<div class="qemoji">${it.emoji}</div>` : ''}<h2>${it.prompt}</h2>
      ${it.clue ? `<p class="clue">Clue: ${esc(it.clue)}</p>` : ''}<button class="say" data-a="say">🔊 ${it.type === 'build' ? 'Say the word' : 'Read it to me'}</button></div>
      <div class="tray ${it.big ? 'bigt' : ''} ${it.type}" id="tray"></div><div class="pool ${it.big ? 'bigt' : ''} ${it.type}" id="pool"></div>
      <div class="center"><button class="btn big" id="chk" data-a="check" disabled>Check ✔</button></div>`;
  }
  view(`${hdr()}<div class="arena" id="arena"><div class="side"><div class="fighter" id="fme">${petHtml(p)}</div><div class="plat"></div></div>
      <div class="vs"><b class="btitle">${title}</b><div class="vsbar"><div class="hp me"><i id="pw" style="width:${8 + 92 * Q.first / total}%"></i></div><span class="vsb">VS</span><div class="hp"><i id="hp" style="width:${100 * (total - Q.i) / total}%"></i></div></div>
        <small>${esc(p.petName)} ⚡ power &nbsp;·&nbsp; ${mon[1]}${Q.magnet || Q.mission ? ' · 🧲 double coins!' : ''}</small></div>
      <div class="side"><div class="fighter mon" id="fmon">${art('monster_' + mk, mon[0])}</div><div class="plat"></div></div></div>
    <div class="qbar"><div class="prog">${Q.items.map((x, i) => `<i class="${i < Q.i ? (x.first ? 'ok' : 'no') : i === Q.i ? 'now' : ''}"></i>`).join('')}</div><span id="combo" class="combo">${Q.combo >= 2 ? `🔥 ${Q.combo} in a row!` : ''}</span>
      <button class="chip potion" id="potion" data-a="hint" ${p.pow.hint > 0 ? '' : 'disabled'} title="Use a hint potion">🧪 Hint ×<b>${p.pow.hint}</b></button></div>
    <div class="card game">${body}<div id="fb" aria-live="polite"></div></div>`, false, true);
  if (it.type !== 'mc') drawTiles(it);
  if (it.type === 'build') speak(it.say);
}
function fb(html, kind) { const el = $('#fb'); if (el) { el.className = 'fb ' + kind; el.innerHTML = html; el.scrollIntoView({block:'nearest', behavior:'smooth'}); } }
function need(it) { return it.goal.length; }
function drawTiles(it) {
  const tile = (x, where) => `<button class="tile ${x.lock ? 'lock' : ''}" data-a="tile" data-id="${x.id}" data-w="${where}" ${it.done ? 'disabled' : ''}>${esc(x.t)}</button>`;
  const slots = need(it) - it.tray.length;
  $('#tray').innerHTML = it.tray.map(x => tile(x, 't')).join('') + (it.big ? '' : '<span class="slot"></span>'.repeat(Math.max(0, slots))) + (it.big && !it.tray.length ? '<span class="ph">Tap the first step below 👇</span>' : '');
  $('#pool').innerHTML = it.pool.map(x => tile(x, 'p')).join('');
  const c = $('#chk'); if (c) c.disabled = it.done || it.tray.length !== need(it);
}
function lockNext(it) { // put the next correct tile in place and lock it
  const locks = it.tray.filter(x => x.lock), rest = [...it.tray.filter(x => !x.lock), ...it.pool];
  const k = rest.findIndex(x => x.t === it.goal[locks.length]); if (k < 0) return;
  const [t] = rest.splice(k, 1); it.tray = [...locks, {...t, lock:true}]; it.pool = shuffle(rest); drawTiles(it);
}
function finishItem(it, first, failed) {
  it.done = true; it.first = first;
  const p = cur(), guess = it.type === 'mc' && it.ms < 1200, total = Q.total || Q.items.length;
  record(p, it.skill || Q.skill, {correct:first, ms:it.ms, sub:it.sub, guess, weight:(Q.placement ? 2 : 1) * (it.hinted ? .5 : 1)});
  if (!first) { p.miss.push({skill:it.skill || Q.skill, q:strip(it.prompt).slice(0, 150), picked:(it.picked || '').slice(0, 100), right:(it.type === 'mc' ? it.options[it.answer] : it.goal.join(it.type === 'build' ? '' : ' ')).slice(0, 100)}); if (p.miss.length > 15) p.miss.shift(); save(); }
  const c = first ? 5 : failed ? 1 : 2;
  Q.stars += first ? 3 : failed ? 0 : 1; Q.xp += first ? 10 : failed ? 2 : 5; Q.coins += c;
  const hp = $('#hp'); if (hp) hp.style.width = 100 * (total - Q.i - 1) / total + '%';
  if (first) { Q.first++; Q.combo++; sfx.ok(); setTimeout(sfx.hit, 180); anim($('#fme'), 'atk'); setTimeout(() => { anim($('#fmon'), 'hit'); anim($('#arena'), 'quake', 450); burst($('#fmon'), 12); }, 180); if (Q.combo >= 3) confetti(10); const pw = $('#pw'); if (pw) pw.style.width = 8 + 92 * Q.first / total + '%'; }
  else { Q.combo = 0; if (!failed) { sfx.ok(); anim($('#fmon'), 'hit'); } else anim($('#fmon'), 'laugh'); }
  floaty(`+${c} 🪙`, $('#coinc'));
  app.querySelectorAll('.opt,.tile,#chk,#potion').forEach(b => b.disabled = true);
  const last = Q.i === Q.items.length - 1 && !(Q.adv && A && A.ch < 3);
  const head = first ? pick(PRAISE) + ' ⭐⭐⭐' : failed ? 'Good try! Here’s the answer.' : 'You got it! ⭐';
  const slow = guess && !first ? '<br><small>🐢 Tip from Pip: take your time and read every choice.</small>' : '';
  const why = !first && AI.on && it.type === 'mc' && it.picked ? '<button class="btn" data-a="why">🦊 Why? Ask Pip</button>' : '';
  fb(`<div><b>${head}</b> ${it.explain || ''}${slow}<div id="why"></div></div><div class="row tight">${why}<button class="btn big next" data-a="next">${last ? 'Finish 🎉' : 'Next ➜'}</button></div>`, first ? 'good' : failed ? 'bad' : 'ok');
  const cb = $('#combo'); if (cb) cb.textContent = Q.combo >= 2 ? `🔥 ${Q.combo} in a row!` : '';
  const btn = $('.next'); if (btn) btn.focus({preventScroll:true});
}
function finishQuest() {
  const p = cur(), t = today(), total = Q.items.length, sk = SK[Q.skill], mon = MON[monKey()];
  const bonus = 15 + (Math.random() * 16 | 0) + (Q.first === total ? 20 : 0), h = happy(p) >= 50;
  const coins = Math.round((Q.coins + bonus) * (Q.magnet || Q.mission ? 2 : 1) * (h ? 1.25 : 1));
  p.xp += Q.xp; p.stars += Q.stars; p.coins += coins; p.quests++;
  if (p.lastDay !== t) { const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10); p.streak = p.lastDay === y ? (p.streak || 0) + 1 : 1; p.lastDay = t; }
  if (Q.placement) p.placed = true;
  const left = STICKERS.filter(s => !p.stickers.includes(s)); const won = left.length ? pick(left) : null; if (won) p.stickers.push(won);
  const evolved = feedPetXp(p, 10 + Q.first * 2), s = stage(petOf(p).xp);
  const up = sk && Q.before && lvl(p.skills[Q.skill].m) > Q.before;
  save(); sfx.win(); confetti(40);
  const msg = Q.placement ? 'Thanks! Now I know just where to send you. Look for <b>Pip’s pick</b> on the map!'
    : Q.first === total ? 'A perfect battle! You are on fire! 🔥' : Q.first >= total / 2 ? 'Great work! Every battle makes your reading brain stronger. 💪' : 'That was a tough one, and you kept going. That’s how heroes grow! 🌱';
  view(`${hdr()}<div class="card center results"><div class="trophy bounce">${art('monster_' + monKey(), mon[0])}</div><h1>${mon[1]} is now your friend!</h1>
    ${pip(msg, 'cheer')}
    <div class="stats"><div><b>${Q.first}/${total}</b><small>first try</small></div><div><b>⭐ ${Q.stars}</b><small>stars</small></div><div><b>+${Q.xp}</b><small>XP</small></div></div>
    ${up ? `<div class="levelup">⬆️ Level up! You are now a <b>${LV[lvl(p.skills[Q.skill].m) - 1]}</b> in ${sk.name}!</div>` : ''}
    ${evolved ? `<div class="levelup evo">${s === 1 ? '🐣 Your egg hatched!' : '✨ Your pet evolved!'} <span class="evopet">${petHtml(p, 'mid')}</span> Meet your <b>${STAGE[s]} ${PETS[p.pet].name}</b>!</div>` : ''}
    <button class="chest wobble" id="chest" data-a="chest" data-coins="${coins}" aria-label="Open your treasure chest"><span class="rays"></span>${art('chest_closed', '🎁')}<small>Tap to open your treasure!</small></button>
    <div id="loot" class="loot" hidden><div>${coin()} <b>+${coins}</b><small>coins${h ? ' (happy pet bonus!)' : ''}</small></div>${won ? `<div><span class="big">${won}</span><small>new sticker</small></div>` : ''}<div><span class="big">⚡</span><small>pet energy +${10 + Q.first * 2}</small></div></div>
    <div class="row">${p.quests % 2 === 0 ? '<button class="btn big gold" data-a="bonus">🌠 Bonus game!</button>' : ''}
      ${sk ? `<button class="btn" data-a="play" data-skill="${Q.skill}">Battle again 🔁</button>` : ''}<button class="btn" data-a="pet">Pet shop 🛒</button><button class="btn big" data-a="map">Map 🗺️</button></div></div>`);
  const cb = $('#coinc b'); if (cb) cb.textContent = p.coins - coins;
  if (evolved) { sfx.evolve(); confetti(40, ['✨','💫','🌟']); }
  Q = null; A = null;
}

/* ---------- reading: bank stories + AI adventures ---------- */
function weakSub(p) {
  const acc = {}; Object.keys(SUBS).forEach(k => { const l = p.log.filter(x => x.skill === 'reading' && x.sub === k).slice(-8); acc[k] = l.length ? l.filter(x => x.ok).length / l.length : .5; });
  return Object.keys(acc).sort((a, b) => acc[a] - acc[b])[0];
}
function bankStory(p) {
  const L = lvl(p.skills.reading.m);
  const seenT = Array.isArray(p.seen) ? p.seen : [];
  const adv = p.grade >= 7, fit = s => !!s.adv === adv; /* grades 7-8 read the advanced passages, everyone else the originals */
  let pool = B.stories.filter(s => s.level === L && fit(s) && !seenT.includes(s.title));
  if (adv && !pool.length) pool = B.stories.filter(s => s.adv && !seenT.includes(s.title));
  if (!pool.length) { if (Array.isArray(p.seen)) { const keep = p.seen.filter(t => !B.stories.some(s => s.level === L && s.title === t)); Object.keys(p.seen).forEach(k => { if (isNaN(+k)) keep[k] = p.seen[k]; }); p.seen = keep; } pool = B.stories.filter(s => fit(s) && (adv || s.level === L)); }
  return pick(pool);
}
function showStory(st) {
  const p = cur(); if (!st.ai && !p.seen.includes(st.title)) { p.seen.push(st.title); save(); }
  Q = {pendingStory:st};
  const gl = st.glossary || {};
  const sents = st.text.match(/[^.!?]+[.!?]+["”’')]*\s*/g) || [st.text];
  const html = sents.map(s => `<span class="sent">${s.split(/(\s+)/).map(w => { if (!w.trim()) return ' '; const c = w.toLowerCase().replace(/[^a-z'’-]/g, '').replace(/^['’]|['’]$/g, ''); const g = gl[c];
    return `<span class="w ${g ? 'gw' : ''}" data-a="word" data-w="${esc(c)}">${esc(w)}</span>`; }).join('')}</span>`).join('');
  view(`${hdr()}<div class="card story">${st.chap ? `<span class="chap">${st.chap}</span>` : ''}<div class="stitle"><span>${esc(st.emoji || '📖')}</span><h1>${esc(st.title)}</h1></div>
    ${st.ai ? aiTag(`Pip’s AI wrote this just for you${st.hero ? `, starring ${esc(st.hero)}` : ''}`) : ''}
    <div class="row left"><button class="btn" data-a="readStory">🔊 Read to me</button><button class="btn ghost" data-a="stopRead">⏹ Stop</button><small>Tap any word to hear it. <u>Underlined</u> words have a meaning!</small></div>
    <div class="text" id="stext">${html}</div><div id="gloss" class="gloss" aria-live="polite"></div>
    <div class="center"><button class="btn big" data-a="${st.next || 'storyQs'}">${st.nextLabel || 'I’m ready for the questions! ➜'}</button></div></div>`);
}
async function chapter(choice) {
  const p = cur(), L = lvl(p.skills.reading.m);
  loading(A.ch === 1 ? `Pip is writing an adventure about ${esc(A.topic)} for you and ${esc(leadName(p))}…` : 'Pip is writing what happens next…');
  const d = validChapter(await ai('adventure', {grade:p.grade, level:L, topic:A.topic, focus:A.focus, hero:A.hero, chapter:A.ch, so_far:A.soFar.slice(-1500), choice:choice || ''}), A.ch);
  if (cur() !== p || !A) return;
  if (!d) { if (!(A.qs && A.qs.length)) { A = null; return showStory(bankStory(p)); } const items = A.qs; A = null; return startQuest('reading', items, { adventure: true }); }
  A.soFar += ' ' + d.text; A.cur = d;
  showStory({ai:true, hero:leadName(p), title:d.title, emoji:d.emoji, text:d.text, glossary:d.glossary, chap:`Chapter ${A.ch} of 3`, next:'advQ', nextLabel:'Answer to keep going! ➜'});
}

/* ---------- writing ---------- */
function writing() {
  const p = cur(), L = lvl(p.skills.writing.m);
  W = W || {prompt:pick(B.writing), goal:[10, 25, 40][L - 1], text:'', level:L, tries:0};
  view(`${hdr()}<div class="card write"><h2>✏️ ${esc(W.prompt)}</h2>
    <p class="clue">Try to write at least <b>${W.goal} words</b>. Don’t use your real last name or address.</p>
    <textarea id="wt" class="inp area" maxlength="1500" placeholder="Start your story here…" spellcheck="true">${esc(W.text)}</textarea>
    <div class="wmeter"><span id="wc">0 words</span><div class="bar"><i id="wbar"></i></div><span id="wgoal">🎯 ${W.goal}</span></div>
    <p id="err" class="err" role="alert"></p>
    <div class="row"><button class="btn ghost" data-a="map">Back</button><button class="btn ghost" data-a="newPrompt">🎲 New idea</button><button class="btn big" data-a="showPip">Show Pip! 🦊</button></div></div>`);
  const ta = $('#wt'); ta.addEventListener('input', wcount); wcount(); ta.focus();
}
const words = t => (t.trim().match(/[A-Za-z’'-]+/g) || []);
function wcount() { const n = words($('#wt').value).length; $('#wc').textContent = n + (n === 1 ? ' word' : ' words'); $('#wbar').style.width = clamp(n / W.goal * 100, 0, 100) + '%'; $('#wgoal').textContent = n >= W.goal ? '🎉 Goal!' : '🎯 ' + W.goal; }
function localFeedback(text, goal) {
  const w = words(text), sents = text.split(/[.!?]+/).filter(s => s.trim()), cap = /^[\s"“]*[A-Z]/.test(text), end = /[.!?]["”]?\s*$/.test(text);
  const joiners = w.filter(x => /^(because|but|so|then|when|after|although|while)$/i.test(x)).length, uniq = new Set(w.map(x => x.toLowerCase())).size / Math.max(1, w.length);
  const stars = 1 + (w.length >= goal ? 1 : 0) + (cap && end && (joiners > 0 || sents.length > 1) ? 1 : 0);
  const glow = w.length >= goal ? `You wrote ${w.length} words and reached your goal. That takes real effort!` : joiners ? 'You used joining words to connect your ideas. Nice thinking!' : uniq > .8 ? 'You used lots of different words. That makes your writing interesting!' : `You shared your idea in ${w.length} words. Great start!`;
  let grow, tip;
  if (!cap) { grow = 'Start your first sentence with a capital letter.'; tip = 'Like this: “My dragon is green.”'; }
  else if (!end) { grow = 'Finish your last sentence with a period, question mark or exclamation mark.'; tip = 'Like this: “We flew to the park.”'; }
  else if (w.length < goal) { grow = `Add one more sentence to get closer to ${goal} words.`; tip = 'What happened next? How did you feel?'; }
  else if (!joiners) { grow = 'Join two ideas with a word like “because” or “so”.'; tip = 'Like this: “I was happy because we won.”'; }
  else { grow = 'Add a describing word to paint a picture.'; tip = 'Instead of “a dog”, try “a fluffy, muddy dog”.'; }
  return {stars, glow, grow, tip};
}
function showFeedback(f) {
  W.tries++; W.last = f;
  sfx.win(); if (f.stars === 3) confetti(30);
  view(`${hdr()}<div class="card center"><div class="trophy">${'⭐'.repeat(f.stars)}${'☆'.repeat(3 - f.stars)}</div>
    ${pip('Thank you for sharing your writing with me!', 'cheer')}
    <blockquote class="mine">${esc(W.text)}</blockquote>
    <div class="glow"><b>✨ Glow</b><p>${esc(f.glow)}</p></div><div class="grow"><b>🌱 Grow</b><p>${esc(f.grow)}</p>${f.tip ? `<p class="tip">💡 ${esc(f.tip)}</p>` : ''}</div>
    ${f.ai ? aiTag('Feedback written by Pip’s AI. Ask a grown-up if something doesn’t seem right.') : ''}
    <div class="row"><button class="btn" data-a="rewrite">Make it even better ✏️</button><button class="btn big" data-a="doneWrite">Finish 🎉</button></div></div>`);
}

/* ---------- bonus game ---------- */
function bonus() {
  let n = 0, t = 15;
  view(`${hdr()}<div class="card center"><h2>🌠 Coin Shower!</h2><p>Tap as many as you can!</p><div class="bbar"><b id="bt">15</b>s · <b id="bn">0</b> ${coin()}</div><div id="sky" class="sky"></div></div>`);
  const sky = $('#sky');
  const spawn = setInterval(() => { if (!document.body.contains(sky)) return clearInterval(spawn);
    const b = document.createElement('button'); b.className = 'fall'; b.innerHTML = pick([coin(), coin(), '⭐', '💎']); b.setAttribute('aria-label', 'coin');
    b.style.left = 4 + Math.random() * 84 + '%'; b.style.animationDuration = 2 + Math.random() * 1.5 + 's';
    b.onclick = () => { n++; sfx.coin(); $('#bn').textContent = n; b.remove(); }; b.addEventListener('animationend', () => b.remove()); sky.appendChild(b); }, 380);
  const tick = setInterval(() => { if (!document.body.contains(sky)) { clearInterval(tick); clearInterval(spawn); return; }
    $('#bt').textContent = --t; if (t <= 0) { clearInterval(tick); clearInterval(spawn); const p = cur(); p.coins += n * 2; p.xp += n; save(); confetti(30); sfx.win(); map(`Wow! You caught ${n} and won <b>${n * 2} ${coin()}</b> in the Coin Shower!`); } }, 1000);
}

/* ---------- grown-ups ---------- */
let gateQ = [7, 8];
function gate() {
  gateQ = [6 + (Math.random() * 4 | 0), 6 + (Math.random() * 4 | 0)];
  setTimeout(() => { calmMode = true; applySettings(); });
  view(`<div class="card center narrow"><h2>👩‍🏫 Grown-ups only</h2><p>To open the teacher &amp; parent dashboard, answer:</p><h1>${gateQ[0]} × ${gateQ[1]} = ?</h1>
    <input id="ga" class="inp short" inputmode="numeric" autocomplete="off" aria-label="Answer"><p id="err" class="err" role="alert"></p>
    <div class="row"><button class="btn ghost" data-a="home">Back</button><button class="btn big" data-a="gateGo">Open</button></div></div>`);
  $('#ga').focus();
}
function stat(p, skill) {
  const l = p.log.filter(x => x.skill === skill), r = l.slice(-20);
  return {n:l.length, acc:r.length ? Math.round(100 * r.filter(x => x.ok).length / r.length) : null, guess:l.filter(x => x.g).length, m:Math.round(p.skills[skill].m), lv:lvl(p.skills[skill].m)};
}
function subStats(p) { const o = {}; Object.keys(SUBS).forEach(k => { const l = p.log.filter(x => x.skill === 'reading' && x.sub === k); o[k] = l.length ? Math.round(100 * l.filter(x => x.ok).length / l.length) : null; }); return o; }
const heat = m => m < 35 ? 'h1' : m < 70 ? 'h2' : 'h3';
function ruleReport(p) {
  const st = SKILLS.map(s => ({s, ...stat(p, s.id)})), tried = st.filter(x => x.n >= 5);
  if (!tried.length) return {summary:'There is not enough practice data yet. After a few battles this report will fill in.', strengths:[], needs:[], activities:[], caution:'A handful of answers is not enough evidence to judge a skill.'};
  const hi = [...tried].sort((a, b) => b.m - a.m), lo = [...tried].sort((a, b) => a.m - b.m).slice(0, 2);
  const g = p.log.filter(x => x.g).length, gr = Math.round(100 * g / p.log.length);
  return {summary:`${p.name} is strongest in ${hi[0].s.label.toLowerCase()} and would benefit most from extra support in ${lo.map(x => x.s.label.toLowerCase()).join(' and ')}.${gr >= 15 ? ` About ${gr}% of answers came very quickly, which can mean guessing.` : ''}`,
    strengths:hi.filter(x => x.m >= 55).slice(0, 3).map(x => `${x.s.label}: ${LV[x.lv - 1]} (${x.acc}% recent accuracy)`),
    needs:lo.map(x => `${x.s.label}: ${LV[x.lv - 1]} (${x.acc}% recent accuracy)`),
    activities:lo.map(x => RECS[x.s.id][x.lv - 1]),
    caution:'This is practice data from a game, not a formal assessment. Use it alongside your own observations.'};
}
function reportHtml(r, isAI) {
  const list = (t, a) => a && a.length ? `<h4>${t}</h4><ul>${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
  return `<div class="report">${isAI ? aiTag(`Written by generative AI (${esc(AI.provider)}) from anonymous scores and mistakes only. Please verify against your own observations.`) : '<p class="aitag">Rule-based summary (AI is not connected).</p>'}
    <p>${esc(r.summary || '')}</p>${list('Strengths', r.strengths)}${list('Needs support', r.needs)}${list('Suggested activities', r.activities)}${r.caution ? `<p class="caution">⚠️ ${esc(r.caution)}</p>` : ''}</div>`;
}
function dash(extra = '') {
  if (T) T.ensure();
  setTimeout(() => { calmMode = true; applySettings(); });
  const ps = S.profiles.map(fix);
  if (!ps.some(p => p.id === dashSel)) dashSel = ps[0] ? ps[0].id : null;
  const p = ps.find(x => x.id === dashSel);
  const avg = SKILLS.map(s => ({s, v:ps.length ? ps.reduce((a, x) => a + x.skills[s.id].m, 0) / ps.length : 0})).sort((a, b) => a.v - b.v);
  const withData = ps.filter(x => x.log.length >= 10 && !x.demo);
  const rowsOrdered = [...ps.filter(x => !x.demo), ...(ps.some(x => x.demo) ? ['SEP'] : []), ...ps.filter(x => x.demo)];
  const sepRow = `<tr class="grp"><td colspan="${SKILLS.length + 1}">Synthetic class (demo data, not real students)</td></tr>`;
  let detail = '<p>No students yet. Add a player on the home screen, or load the demo class.</p>';
  if (p) {
    const st = SKILLS.map(s => ({s, ...stat(p, s.id)})), sub = subStats(p), tot = p.log.length, ok = p.log.filter(x => x.ok).length, g = p.log.filter(x => x.g).length;
    const mins = Math.round(p.log.reduce((a, x) => a + Math.min(x.ms, 90000), 0) / 60000);
    const needs = [...st].sort((a, b) => a.m - b.m).slice(0, 3);
    detail = `<div class="dstats"><div><b>${p.quests}</b><small>battles</small></div><div><b>${tot ? Math.round(100 * ok / tot) : 0}%</b><small>first-try accuracy</small></div><div><b>${tot}</b><small>answers</small></div><div><b>~${mins} min</b><small>answering time</small></div><div class="${tot && g / tot >= .15 ? 'flag' : ''}"><b>${g}</b><small>likely guesses</small></div></div>
      <h3>Skill profile</h3><div class="sbars">${st.map(x => `<div class="sb"><span>${x.s.icon} ${x.s.label}</span><div class="bar"><i class="${heat(x.m)}" style="width:${Math.max(3, x.m)}%"></i></div><b>${LV[x.lv - 1]}</b><small>${x.acc == null ? 'no data' : x.acc + '% of last ' + Math.min(20, x.n)}${x.guess ? ` · ${x.guess} fast` : ''}</small></div>`).join('')}</div>
      <h3>Comprehension breakdown</h3><div class="subs">${Object.keys(SUBS).map(k => `<div class="${sub[k] != null && sub[k] < 50 ? 'flag' : ''}"><b>${sub[k] == null ? '–' : sub[k] + '%'}</b><small>${SUBS[k]}</small></div>`).join('')}</div>
      <h3>Assigned next steps</h3><ul class="recs">${needs.map(x => `<li><b>${x.s.icon} ${x.s.label} (${LV[x.lv - 1]}):</b> ${RECS[x.s.id][x.lv - 1]}</li>`).join('')}</ul>
      ${p.notes.length ? `<h3>✨ AI diagnosis notes</h3><ul class="recs">${p.notes.slice(-4).reverse().map(n => `<li><b>${new Date(n.t).toLocaleDateString()} · ${esc(n.focus)}:</b> ${esc(n.note)}</li>`).join('')}</ul><p class="small">Written by AI when it built a mission from this student’s mistakes. Treat as a hypothesis to check.</p>` : ''}
      <div class="row left"><button class="btn" data-a="aiReport">${AI.on ? '✨ Write AI summary' : '📝 Write summary'}</button>${window.SQ_ARTIFACT ? '' : '<button class="btn ghost" data-a="csv">⬇️ Export CSV</button>'}<button class="btn ghost danger" data-a="delP">🗑 Remove student</button></div>
      <div id="rep">${extra}</div>
      <h3>Recent mistakes</h3><table class="tbl"><tr><th>Skill</th><th>Question</th><th>Answered</th><th>Correct</th></tr>${p.miss.slice(-8).reverse().map(x => `<tr><td>${(SK[x.skill] || {}).label || esc(x.skill)}</td><td>${esc(x.q)}</td><td>${esc(x.picked || '–')}</td><td>${esc(x.right)}</td></tr>`).join('') || '<tr><td colspan="4">None recorded yet</td></tr>'}</table>
      <h3>Recent answers</h3><table class="tbl"><tr><th>When</th><th>Skill</th><th>Focus</th><th>Result</th><th>Time</th></tr>${p.log.slice(-10).reverse().map(x => `<tr><td>${new Date(x.t).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</td><td>${SK[x.skill].label}</td><td>${esc(SUBS[x.sub] || x.sub)}</td><td>${x.ok ? '✅' : '❌'}${x.g ? ' ⚡' : ''}</td><td>${(x.ms / 1000).toFixed(1)}s</td></tr>`).join('') || '<tr><td colspan="5">Nothing yet</td></tr>'}</table>`;
  }
  const connect = AI.on ? `<p>✨ <b>AI is connected</b> (${esc(AI.provider)}${AI.model ? ' · ' + esc(AI.model) : ''}). Children now get AI adventures, AI missions built from their mistakes, “Why?” explanations and AI writing feedback.</p>`
    : window.SQ_ARTIFACT ? `<p><b>AI is not available in this view</b>, so the app is using its built-in content. Open this page while signed in to Claude and choose “Allow” when it asks, and the AI features switch on.</p>`
    : `<p><b>AI is not connected</b>, so the app is using its built-in content. Paste an API key to switch on the AI features. The key is saved only on this computer (in <code>.env</code>).</p>
      <div class="row left"><select id="kp" class="inp sel" aria-label="AI provider"><option value="anthropic">Claude (Anthropic)</option><option value="openai">ChatGPT (OpenAI)</option><option value="gemini">Gemini (Google)</option></select>
      <input id="kk" class="inp keyin" type="password" autocomplete="off" placeholder="Paste API key" aria-label="API key"><button class="btn big" data-a="connect">Connect</button></div><p id="kerr" class="err" role="alert"></p>`;
  view(`<header class="top dtop"><b>👩‍🏫 Teacher &amp; Parent Dashboard</b><span class="chip ${AI.on ? 'aion' : ''}">${AI.on ? `✨ AI on · ${esc(AI.provider)}` : 'AI off'}</span><span class="sp"></span><button class="chip" data-a="qaOpen" title="Synthetic test profile, separate from real students">🧪 Open QA Adventurer</button><button class="chip" data-a="home">⬅ Back to app</button></header>
    <div class="card dashc"><h2>🤖 Generative AI</h2>${connect}<div class="row left"><button class="btn ghost" data-a="prompts">🔍 How the AI is prompted</button></div><div id="pr"></div></div>
    <div class="card dashc" id="tcard" aria-live="polite"></div>
    <div class="card dashc" id="ecard"></div><div class="card dashc" id="pacard"></div><div class="card dashc" id="rcard"></div>
    <div class="card dashc"><h2>Class overview</h2>
      ${ps.length ? `<div class="scroll"><table class="tbl heat"><tr><th>Student</th>${SKILLS.map(s => `<th title="${s.label}">${s.icon}<br><small>${s.label}</small></th>`).join('')}</tr>
        ${rowsOrdered.map(x => x === 'SEP' ? sepRow : `<tr class="${x.id === dashSel ? 'sel' : ''}"><td><button class="link" data-a="selP" data-id="${x.id}">${x.avatar} ${esc(x.name)} <small>G${x.grade}</small></button></td>${SKILLS.map(s => `<td class="${heat(x.skills[s.id].m)}">${Math.round(x.skills[s.id].m)}</td>`).join('')}</tr>`).join('')}</table></div>
        <p class="legend"><span class="h1">Sprout 0–34</span><span class="h2">Explorer 35–69</span><span class="h3">Champion 70–100</span></p>
        ${withData.length >= 2 ? `<div class="insight">💡 <b>Class insight:</b> the lowest class average is <b>${avg[0].s.label}</b> (${Math.round(avg[0].v)}/100), then ${avg[1].s.label} (${Math.round(avg[1].v)}/100). When most students struggle with the same skill, it may be worth a whole-class mini-lesson rather than individual practice.</div>` : ''}` : ''}
      <div class="row left"><button class="btn ghost" data-a="demo">🧪 Load demo class</button>${ps.some(x => x.demo) ? '<button class="btn ghost" data-a="undemo">Remove demo class</button>' : ''}</div></div>
    <div class="card dashc"><h2>${p ? `${p.avatar} ${esc(p.name)} · Grade ${p.grade}` : 'Student detail'}</h2>${detail}</div>
    <p class="center small">All student data stays in this browser. Only grade, level, topic, scores and recent question text are sent to the AI – never names.</p>`, false, true);
  if (T) T.mount();
  if (G && G.parentMount) G.parentMount();
}
function demo() {
  const defs = [['Ava','🐼',2,{phonics:72,spelling:58,vocab:41,grammar:44,sequence:30,reading:33,writing:28},.04],['Liam','🦁',3,{phonics:80,spelling:62,vocab:55,grammar:38,sequence:42,reading:36,writing:40},.3],
    ['Zoe','🦄',3,{phonics:90,spelling:84,vocab:78,grammar:74,sequence:66,reading:71,writing:68},.02],['Mateo','🐸',2,{phonics:35,spelling:26,vocab:38,grammar:30,sequence:25,reading:22,writing:20},.08],
    ['Priya','🦉',4,{phonics:88,spelling:75,vocab:82,grammar:70,sequence:48,reading:52,writing:60},.03],['Noah','🐯',4,{phonics:65,spelling:48,vocab:60,grammar:52,sequence:36,reading:44,writing:35},.1]];
  S.profiles = S.profiles.filter(p => !p.demo || p.synthetic);
  defs.forEach(([n, a, g, m, gr]) => { const p = newProfile(n, a, g); p.demo = true; p.placed = true; const k0 = pick(Object.keys(PETS)); p.pet = k0; p.pets[k0] = {xp:60, hat:''}; p.petName = PETS[k0].nick;
    SKILLS.forEach(s => { p.skills[s.id].m = m[s.id]; const k = 9 + (Math.random() * 8 | 0);
      for (let i = 0; i < k; i++) { const sub = s.id === 'reading' ? pick(Object.keys(SUBS)) : ''; const guess = Math.random() < gr;
        const ok = Math.random() * 100 < (guess ? 28 : m[s.id] + 18 - (sub === 'inference' ? 25 : 0));
        p.log.push({t:Date.now() - Math.random() * 6048e5, skill:s.id, sub, ok:ok ? 1 : 0, ms:guess ? 500 + Math.random() * 600 : 3000 + Math.random() * 14000 | 0, g:guess ? 1 : 0, lv:lvl(m[s.id])}); } });
    p.miss = [{skill:'reading', q:'Why did the firefly land on Noor’s hand?', picked:'She had a jar', right:'She sat still and calm'}, {skill:'reading', q:'How does Bella feel at the end?', picked:'Sleepy', right:'Happy'}, {skill:'vocab', q:'What does curious mean?', picked:'very tired', right:'wanting to know more'}];
    p.log.sort((x, y) => x.t - y.t); p.quests = Math.round(p.log.length / 5); p.xp = p.quests * 38; p.stars = p.quests * 11; p.coins = p.quests * 25; p.streak = 1 + (Math.random() * 5 | 0); S.profiles.push(p); });
  save();
}

/* ---------- actions ---------- */
const ACT = {
  home, newP() { draft = {avatar:AVATARS[0], grade:0}; newP(); }, gate, stickers, bonus,
  map() { map(); }, pet() { sfx.tap(); pet(); }, stab(d) { shopTab = d.c; sfx.tap(); pet('', true); },
  tog(d) { const k = d.k; S.settings[k] = !S.settings[k]; save(); if (k === 'voice' && !S.settings.voice) hush(); applySettings();
    document.querySelectorAll(`[data-k="${k}"]`).forEach(b => { if (k === 'font') b.classList.toggle('on', S.settings.font); else b.textContent = k === 'sound' ? (S.settings.sound ? '🔔' : '🔕') : (S.settings.voice ? '🗣️' : '🤐'); }); sfx.tap(); },
  pickP(d) { S.current = d.id; save(); sfx.tap(); map(); },
  av(d) { draft.avatar = d.v; draft.name = $('#nm').value; draft.pe = ($('#pe') || {value:''}).value; newP(); $('#nm').value = draft.name || ''; },
  gr(d) { draft.grade = +d.v; draft.name = $('#nm').value; draft.pe = ($('#pe') || {value:''}).value; newP(); $('#nm').value = draft.name || ''; },
  mkP() { const name = $('#nm').value.trim(); if (!name) return $('#err').textContent = 'Type a name or nickname first.'; if (!draft.grade) return $('#err').textContent = 'Tap your grade.';
    const pe = ($('#pe') || {value:''}).value.trim(); if (pe && !/^[^@\s<>,;]{1,64}@[^@\s<>,;]{1,120}\.[A-Za-z]{2,}$/.test(pe)) { const d = $('.optmail'); if (d) d.open = true; return $('#err').textContent = 'That email does not look right. Fix it or leave it empty.'; }
    const p = newProfile(name, draft.avatar, draft.grade); if (pe) { p.parentEmail = pe; p.parentOK = true; } S.profiles.push(p); S.current = p.id; save(); sfx.win(); map(); },
  egg(d) { const p = cur(); p.pets[d.k] = {xp:0, hat:''}; p.pet = d.k; p.petName = PETS[d.k].nick; p.daily = today(); p.coins += 20; save(); sfx.chest(); confetti(20);
    map(`You picked the <b>${PETS[d.k].name} Egg</b>! I named it <b>${p.petName}</b> (you can change that). Here are <b>20 🪙</b> to start. Win a battle to hatch it!`); },
  trick() { const p = cur(), el = $('.petbig .pet'); anim(el, pick(['spin','jump','wiggle']), 800); sfx.pop(); floaty('❤️', el);
    $('#pbub').textContent = stage(petOf(p).xp) === 0 ? pick(['*wobble wobble*','*tap tap*','Something is moving inside!']) : pick(['Hee hee!','Let’s go battle!','I love reading with you!','Again! Again!','Can I have a snack?','You’re the best!']); },
  buy(d) {
    const p = cur(), it = SHOP.find(x => x.id === d.id), o = petOf(p), say = t => { $('#shopmsg').textContent = t; sfx.bad(); };
    const owned = it.cat === 'egg' ? !!p.pets[it.pet] : p.inv.includes(it.id), needsPay = it.cat === 'food' || it.cat === 'power' || !owned;
    if (it.cat === 'food' && stage(o.xp) === 0) return say('Your egg can’t eat yet! Win a battle to hatch it.');
    if (needsPay && p.coins < it.cost) return say(`You need ${it.cost - p.coins} more coins for that. Win a battle to earn them!`);
    if (needsPay) p.coins -= it.cost;
    let msg = '';
    if (it.cat === 'food') { const evo = feedPetXp(p, it.xp); p.happy = clamp(happy(p) + it.happy, 0, 100); p.happyT = Date.now(); sfx.munch(); msg = evo ? 'WOW! I evolved!' : pick(['Yum yum yum!','Delicious! Thank you!','My favourite!']); if (evo) { setTimeout(sfx.evolve, 200); confetti(40, ['✨','💫','🌟']); } }
    else if (it.cat === 'power') { p.pow[it.id] = (p.pow[it.id] || 0) + 1; sfx.coin(); msg = it.id === 'hint' ? 'A hint potion! Use it in battle.' : 'Your next battle pays double coins!'; }
    else if (it.cat === 'egg') { if (!owned) { p.pets[it.pet] = {xp:0, hat:''}; sfx.chest(); confetti(20); } p.pet = it.pet; p.petName = owned ? p.petName : PETS[it.pet].nick; msg = owned ? 'I’m coming with you!' : 'A new egg! Win a battle to hatch me!'; }
    else { if (!owned) { p.inv.push(it.id); sfx.coin(); } else sfx.tap();
      if (it.cat === 'hat') { o.hat = o.hat === it.id && owned ? '' : it.id; msg = o.hat ? 'How do I look?' : 'Hat off!'; } else { p.theme = it.id; msg = `Welcome to ${it.name}!`; } }
    save(); pet(msg, true); if (it.cat === 'food') { anim($('.petbig .pet'), 'jump', 800); floaty('❤️', $('.petbig')); }
  },
  chest(d, el) { const p = cur(), n = +d.coins || 0; el.disabled = true; el.classList.remove('wobble'); el.classList.add('open'); el.innerHTML = '<span class="rays on"></span>' + art('chest_open', '🎉'); $('#loot').hidden = false; sfx.chest(); burst(el, 16);
    flyCoins(el, $('#coinc'), 10); countUp($('#coinc b'), p.coins - n, p.coins); },
  warmup() { const p = cur(), L = p.grade <= 2 ? 1 : p.grade <= 4 ? 2 : 3;
    startQuest('placement', shuffle(['phonics','vocab','spelling','grammar'].flatMap(s => makeItems(s, L, 2))), {placement:true}); },
  async play(d) {
    const p = cur(), skill = d.skill, L = lvl(p.skills[skill].m); sfx.tap();
    if (skill === 'writing') { W = null; return writing(); }
    if (skill === 'reading') {
      if (!AI.on) return showStory(bankStory(p));
      return view(`${hdr()}${pip(`Where should you and <b>${esc(leadName(p))}</b> go on an adventure? I’ll write the story and <b>you choose what happens</b>!`, 'cheer')}<div class="topics">${TOPICS.map(([e, t]) => `<button class="topic" data-a="topic" data-t="${t}"><span>${e}</span>${t}</button>`).join('')}</div><div class="center"><button class="btn ghost" data-a="map">Back</button></div>`);
    }
    if (skill === 'vocab' && AI.on && p.topic) {
      loading(`Pip is finding new words about ${esc(p.topic)}…`);
      const items = validVocab(await ai('vocab', {grade:p.grade, level:L, topic:p.topic}));
      if (cur() !== p) return;
      if (items) return startQuest('vocab', items.map(x => ({...mc(`What does <b>${esc(x.word)}</b> mean?`, x.meaning, x.wrong.slice(0, 3), {sub:'meaning', hint:'Cross out the ones you know are wrong first.', explain:`<b>${esc(x.word)}</b> means “${esc(x.meaning)}”.`}), skill:'vocab'})));
    }
    startQuest(skill, makeItems(skill, L, skill === 'sequence' ? 3 : 5));
  },
  topic(d) {
    const p = cur(); let topic = d.t; if (topic === 'a surprise') topic = pick(TOPICS.slice(0, -1))[1];
    p.topic = topic; save();
    A = {topic, ch:1, soFar:'', focus:weakSub(p), hero:heroDesc(p), q:null, cur:null};
    chapter();
  },
  advQ() { if (!A || !A.cur) return; A.qs = A.qs || []; A.qs.push(qItem(A.cur.question, { story: { text: A.cur.text }, skill: 'reading' }));
    if (A.ch < 3 && A.cur.choices.length === 2) return view(`${hdr()}${pip('What should we do next? <b>You decide!</b>', 'think')}<div class="choices">${A.cur.choices.map((c, i) => `<button class="choice c${i}" data-a="advPick" data-i="${i}"><span>${i ? '🅱️' : '🅰️'}</span>${esc(c)}</button>`).join('')}</div>${aiTag('The AI will write the next chapter from your choice.')}`);
    const items = A.qs; A = null; startQuest('reading', items, { adventure: true }); },
  advPick(d) { if (!A) return; const c = A.cur.choices[+d.i]; A.ch++; sfx.tap(); chapter(c); },
  async mission() {
    const p = cur(); sfx.tap(); loading('Pip is studying your answers and building a mission just for you…');
    const mastery = {}; ['vocab','grammar','reading','sequence'].forEach(k => mastery[k] = Math.round(p.skills[k].m));
    const L = lvl(Math.min(...Object.values(mastery)));
    const m = validMission(await ai('mission', {grade:p.grade, level:L, mastery, mistakes:p.miss.slice(-10)}));
    if (cur() !== p) return;
    if (!m) return map('My AI brain got muddled that time. Try a battle on the map, then ask me again!');
    if (m.note) { p.notes.push({t:Date.now(), focus:m.focus, note:m.note}); if (p.notes.length > 8) p.notes.shift(); save(); }
    Q = {pendingMission:m};
    view(`${hdr()}<div class="card center"><div class="trophy bounce">${art('monster_mission', MON.mission[0])}</div><h1>AI Mission: ${esc(m.focus)}</h1>${pip(esc(m.noticed), 'think')}
      ${aiTag('Pip’s AI looked at your recent answers and wrote these questions just for you.')}<p>Beat the <b>Riddle Master</b> for <b>double coins</b>!</p>
      <div class="row"><button class="btn ghost" data-a="map">Not now</button><button class="btn big" data-a="missionGo">Start mission ⚔️</button></div></div>`);
  },
  missionGo() { const m = Q && Q.pendingMission; if (!m) return; startQuest('mission', m.items.map(x => qItem(x, {skill:x.skill, passage:x.passage, sub:x.skill === 'reading' ? x.sub : 'mission'})), {mission:true, focus:m.focus}); },
  async why() {
    const it = Q.items[Q.i], p = cur(), el = $('#why'), b = app.querySelector('[data-a=why]'); if (b) b.remove();
    el.innerHTML = '<p class="aitag">🦊 Pip is thinking…</p>';
    const d = await ai('explain', {grade:p.grade, question:strip(it.prompt), options:it.options, correct:it.options[it.answer], picked:it.picked, passage:it.story ? it.story.text : it.passage || ''});
    const box = $('#why'); if (!box) return;
    box.innerHTML = d && isStr(d.why, 5, 400) ? `<div class="whybox"><b>🦊 Pip says:</b> ${esc(d.why)}${isStr(d.tip, 2, 200) ? `<br>💡 <i>${esc(d.tip)}</i>` : ''}${aiTag('Explained by AI')}</div>` : '<p class="aitag">Pip couldn’t explain that one right now.</p>';
  },
  hint() {
    const p = cur(), it = Q.items[Q.i]; if (it.done || p.pow.hint < 1) return;
    p.pow.hint--; it.hinted = true; save(); sfx.coin();
    if (it.type === 'mc') { const w = [...app.querySelectorAll('.opt:not(:disabled)')].filter(b => +b.dataset.i !== it.answer); if (w.length > 1) { const b = pick(w); b.disabled = true; b.classList.add('wrong'); } } else lockNext(it);
    const b = $('#potion'); b.querySelector('b').textContent = p.pow.hint; b.disabled = true; floaty('🧪', b);
  },
  word(d, el) { hush(); const st = Q && Q.pendingStory; if (!st) return; speak(d.w); const g = (st.glossary || {})[d.w];
    app.querySelectorAll('.w.on').forEach(x => x.classList.remove('on')); el.classList.add('on');
    $('#gloss').innerHTML = g ? `<b>${esc(d.w)}</b> means: ${esc(g)}` : ''; },
  readStory() { if (!canSpeak()) return $('#gloss').textContent = 'Turn on the 🗣️ voice button at the top to hear the story.';
    const sents = [...app.querySelectorAll('.sent')], my = ++readTok; let i = 0;
    const nx = () => { if (my !== readTok) return; sents.forEach(s => s.classList.remove('on')); if (i >= sents.length) return; const s = sents[i++]; s.classList.add('on'); speak(s.textContent, nx); }; nx(); },
  stopRead() { hush(); app.querySelectorAll('.sent.on').forEach(s => s.classList.remove('on')); },
  storyQs() { const st = Q.pendingStory; startQuest('reading', st.questions.map(q => qItem(q, {story:st, skill:'reading'}))); },
  say() { const it = Q.items[Q.i]; speak(it.type === 'mc' ? `${it.say}. ${it.options.join('. ')}` : it.say); },
  ans(d, el) {
    const it = Q.items[Q.i]; if (it.done) return; const i = +d.i; if (it.ms == null) it.ms = performance.now() - it.t0;
    if (i === it.answer) { el.classList.add('right'); return finishItem(it, it.tries === 0, false); }
    it.tries++; if (!it.picked) it.picked = it.options[i]; el.classList.add('wrong'); el.disabled = true; sfx.bad();
    if (it.tries >= 2 || app.querySelectorAll('.opt:not(:disabled)').length <= 1) { app.querySelector(`.opt[data-i="${it.answer}"]`).classList.add('right'); finishItem(it, false, true); }
    else fb(`<div><b>${pick(RETRY)}</b> 💡 ${it.hint || 'Read it again slowly.'}</div>`, 'warn');
  },
  tile(d) {
    const it = Q.items[Q.i]; if (it.done) return; const id = +d.id; sfx.tap();
    if (d.w === 'p') { if (it.tray.length >= need(it)) return; const k = it.pool.findIndex(x => x.id === id); it.tray.push(...it.pool.splice(k, 1)); }
    else { const k = it.tray.findIndex(x => x.id === id); if (it.tray[k].lock) return; it.pool.push(...it.tray.splice(k, 1)); }
    drawTiles(it);
  },
  check() {
    const it = Q.items[Q.i]; if (it.done) return; if (it.ms == null) it.ms = performance.now() - it.t0;
    const got = it.tray.map(x => x.t), goal = it.goal.join('\u0001');
    if (got.join('\u0001') === goal) { $('#tray').classList.add('right'); return finishItem(it, it.tries === 0, false); }
    it.tries++; if (!it.picked) it.picked = got.join(it.type === 'build' ? '' : ' '); sfx.bad();
    if (it.tries >= 2) { it.pool = []; it.tray = it.goal.map((t, i) => ({id:i, t, lock:true})); drawTiles(it); return finishItem(it, false, true); }
    lockNext(it); anim($('#tray'), 'shake', 500);
    fb(`<div><b>${pick(RETRY)}</b> 💡 I locked one in for you. ${it.type === 'build' ? 'Say the word slowly and listen to each sound.' : 'What happens next?'}</div>`, 'warn');
  },
  next() { hush(); Q.i++; if (Q.i < Q.items.length) return showItem();
    if (Q.adv && A && A.ch < 3 && A.cur.choices.length === 2) { A.q = Q;
      return view(`${hdr()}${pip('What should we do next? <b>You decide!</b>', 'think')}<div class="choices">${A.cur.choices.map((c, i) => `<button class="choice c${i}" data-a="advPick" data-i="${i}"><span>${i ? '🅱️' : '🅰️'}</span>${esc(c)}</button>`).join('')}</div>${aiTag('The AI will write the next chapter from your choice.')}`); }
    finishQuest(); },
  newPrompt() { const t = $('#wt').value; W.prompt = pick(B.writing.filter(x => x !== W.prompt)); W.text = t; writing(); },
  async showPip() {
    const p = cur(), text = $('#wt').value.trim(); W.text = text;
    if (words(text).length < 3) return $('#err').textContent = 'Write at least a few words first – you can do it!';
    loading('Pip is reading your writing…');
    const f = validFeedback(await ai('writing', {grade:p.grade, level:W.level, prompt:W.prompt, text})) || localFeedback(text, W.goal);
    if (cur() !== p || !W) return;
    showFeedback(f);
  },
  rewrite() { writing(); },
  doneWrite() { const p = cur(), f = W.last; record(p, 'writing', {correct:f.stars >= 2, ms:0, sub:'composition', delta:[-3, 6, 11][f.stars - 1]});
    if (G) { W = null; map('Nice writing!'); return G.quickReward(p, { title: 'Free writing', coins: f.stars * 6, xp: f.stars * 8 }); }
    Q = {...newQuest('writing', [{}]), stars:f.stars * 3, xp:f.stars * 10, coins:f.stars * 6, first:f.stars >= 2 ? 1 : 0, before:W.level}; W = null; finishQuest(); },
  gateGo() { if (+$('#ga').value === gateQ[0] * gateQ[1]) dash(); else $('#err').textContent = 'Not quite. Try again.'; },
  selP(d) { dashSel = d.id; dash(); },
  demo() { demo(); dashSel = null; dash(); }, undemo() { S.profiles = S.profiles.filter(p => !p.demo || p.synthetic); save(); dash(); },
  delP(d, el) { const p = S.profiles.find(x => x.id === dashSel); if (!p) return; if (el.dataset.sure) { S.profiles = S.profiles.filter(x => x !== p); save(); dash(); } else { el.dataset.sure = 1; el.textContent = `Tap again to remove ${p.name}`; } },
  csv() { const p = S.profiles.find(x => x.id === dashSel); if (!p) return;
    const rows = [['time','skill','focus','first_try_correct','seconds','likely_guess','level_at_time'], ...p.log.map(x => [new Date(x.t).toISOString(), x.skill, x.sub, x.ok, (x.ms / 1000).toFixed(1), x.g, x.lv])];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map(r => r.join(',')).join('\n')], {type:'text/csv'})); a.download = `storyland-${p.name.replace(/\W+/g, '_')}.csv`; a.click(); URL.revokeObjectURL(a.href); },
  async connect() {
    const err = $('#kerr'), key = $('#kk').value.trim(); if (!key) return err.textContent = 'Paste a key first.';
    err.textContent = 'Checking the key…';
    try { const r = await fetch('/api/key', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({provider:$('#kp').value, key})}); const d = await r.json();
      if (!r.ok) return err.textContent = d.error || 'Could not connect.';
      AI = {on:!!d.ai, provider:d.provider, model:d.model}; dash();
    } catch (e) { err.textContent = 'Start the app with “python3 server.py” to connect AI.'; }
  },
  async aiReport() {
    const p = fix(S.profiles.find(x => x.id === dashSel)), rep = $('#rep'); if (!p) return;
    rep.innerHTML = '<p class="aitag">Writing summary…</p>';
    let r = null;
    if (AI.on) { const skills = {}; SKILLS.forEach(s => { const x = stat(p, s.id); skills[s.label] = {mastery:x.m, level:x.lv, accuracy:x.acc, attempts:x.n, guesses:x.guess}; });
      const d = await ai('report', {grade:p.grade, skills, subs:subStats(p), mistakes:p.miss.slice(-10)}); if (d && isStr(d.summary, 5, 900)) { const arr = a => Array.isArray(a) ? a.filter(x => isStr(x, 1, 400)).slice(0, 5) : []; r = {summary:d.summary, strengths:arr(d.strengths), needs:arr(d.needs), activities:arr(d.activities), caution:isStr(d.caution, 1, 400) ? d.caution : ''}; } }
    const el = $('#rep'); if (el) el.innerHTML = reportHtml(r || ruleReport(p), !!r);
  },
  async prompts() {
    const el = $('#pr'); if (el.innerHTML) return el.innerHTML = '';
    try { const d = window.SQ_ARTIFACT && window.SQ_PROMPTS ? {system:window.SQ_PROMPTS.system, templates:window.SQ_PROMPTS.templates()} : await (await fetch('/api/prompts')).json();
      el.innerHTML = `<h3>System prompt (sent with every request)</h3><pre>${esc(d.system)}</pre>${Object.entries(d.templates).map(([k, v]) => `<h3>Task prompt: ${esc(k)}</h3><pre>${esc(v)}</pre>`).join('')}<p class="small">Every reply is checked in the browser (shape, answer index, lengths, duplicate options). If a reply fails, the child gets hand-written content instead. Phonics and spelling never use AI, because a wrong rhyme or spelling would teach an error.</p>`;
    } catch (e) { el.innerHTML = '<p class="small">Start the app with <code>python3 server.py</code> to view the live prompts. They are also in <code>server.py</code>.</p>'; }
  }
};
function leadInst(p) { return G ? (G.lead(p) || p.zoo[0] || null) : null; }
function leadName(p) { const z = leadInst(p); return z ? z.name : (p.petName || 'your pet'); }
function heroDesc(p) { const z = leadInst(p); if (z) return `${z.name}, a ${G.STAGE_NAME[G.stageOf(z)].toLowerCase()} ${G.FAM[z.fam].name.toLowerCase()}`; return `${p.petName}, a ${STAGE[stage(petOf(p).xp)].toLowerCase()} ${PETS[p.pet].name.toLowerCase()}`; }
const CTX = { aiCall: (k, p) => ai(k, p), aiRaw, connectAI, S, $, esc, view, art, coin, newProfile, togs, sfx, speak, hush, canSpeak, burst, anim, floaty, confetti, flyCoins, countUp, calm, pick, shuffle, clamp, today, save, cur, fix, lvl, LV, SKILLS, makeItems, bankStory, record,
  applySettings, home, dash: () => dash(), ACT, AI: () => AI, ASSETS: () => ASSETS, audio: () => (ac = ac || new (window.AudioContext || window.webkitAudioContext)()) };
if (window.SQ_GAME) { G = window.SQ_GAME(CTX); Object.assign(ACT, G.actions); }
window.SQ_G = G; /* test hook */
if (window.SQ_TEACH) {
  T = window.SQ_TEACH({ ...CTX, G, ai: () => AI });
  Object.assign(ACT, T.actions); window.SQ_TEACH_API = T;
}
document.addEventListener('click', e => { const el = e.target.closest('[data-a]'); if (!el || el.disabled) return; const fn = ACT[el.dataset.a]; if (fn) fn(el.dataset, el); });
document.addEventListener('keydown', e => { if (e.key !== 'Enter') return; if (e.target.id === 'ga') ACT.gateGo(); if (e.target.id === 'nm') ACT.mkP(); if (e.target.id === 'kk') ACT.connect(); });

/* ---------- boot ---------- */
const start = () => { if (location.hash === '#qa' && window.SQ_G && window.SQ_G.qaScreen) return window.SQ_G.qaScreen(); if (cur()) map(); else home(); };
start();
const j = u => fetch(u).then(r => r.json()).catch(() => null);
Promise.all([j('/api/status'), j('/api/assets')]).then(([s, a]) => {
  if (s && s.ai) AI = {on:true, provider:s.provider, model:s.model};
  if (a && Array.isArray(a.names)) ASSETS = new Set(a.names);
  if ((AI.on || (ASSETS.size && !window.SQ_ASSETS)) && !Q && !W && !$('#nm') && !$('#ga')) start(); // redraw with AI features / art
  if (!AI.on && window.claude && window.claude.use && window.SQ_PROMPTS) window.claude.use('sample').then(sm => {
    if (!sm || AI.on) return; AI = {on:true, provider:'Claude (built in)', model:'', sample:sm}; if ($('.world')) map(); }).catch(() => {});
});
})();
