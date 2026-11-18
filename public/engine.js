/* Storyland Quest – one battle engine and one evidence rule set for every activity.
   Ported from the handoff's battle-engine.mjs and learning-evidence.mjs, then extended with the
   Battle Bag (Clue Lantern, Second Look, Bubble Guard, Double Strike), enemy setbacks and a
   comparable-question swap. The extension keeps the handoff's guarantees: a wrong answer never earns
   a cast, damages the enemy or counts toward victory; every action carries a turn number so a double
   click or a replay cannot resolve one turn twice. */
(() => {
'use strict';
const SUPPORT = id => id === 'guard' || id === 'story-spark';

function createBattle({ team, questions, resolve = 6, minimumCorrect = 3, bag = {}, hp = 12, boss = false, practice = false, rules = {} }) {
  if (!team.length || team.length > 3 || new Set(team.map(pet => pet.id)).size !== team.length ||
      team.some(pet => !pet.moveIds.length) || !Number.isInteger(resolve) || resolve < 1 ||
      !Number.isInteger(minimumCorrect) || minimumCorrect < 1 ||
      new Set(questions.map(q => q.id)).size < minimumCorrect) {
    throw new Error('Battle needs a valid team, Resolve and enough distinct questions.');
  }
  return { team, questions, resolve, maxResolve: resolve, minimumCorrect, active: 0, swapped: false, phase: 'question', index: 0, turn: 1,
    attempts: [], correctIds: [], assisted: false, double: false, lastCast: null, shield: false, out: [], earlyZero: false, setbacks: 0, absorbed: 0,
    hp, maxHp: hp, counter: boss ? 3 : 2, practice, rules, ward: 0, feintCut: 0, cd: {}, used: {}, lastCounter: null, checkpoints: 0, misses: 0,
    bag: { clue: bag.clue ?? 2, look: bag.look ?? 0, bubble: bag.bubble ?? 0, double: bag.double ?? 1 } };
}

function battleStep(state, action) {
  if (action.turn !== state.turn) return state;
  const question = state.questions[state.index];
  switch (action.type) {
    case 'swap':
      if (state.phase !== 'question' || state.swapped || state.assisted || state.attempts.some(a => a.turn === state.turn) ||
          !state.team[action.slot] || action.slot === state.active) return state;
      return { ...state, active: action.slot, swapped: true };
    case 'clue':
      if (state.phase !== 'question' || state.assisted || !state.bag.clue) return state;
      return { ...state, assisted: true, bag: { ...state.bag, clue: state.bag.clue - 1 } };
    case 'look': {
      const left = question.options.filter(o => !state.out.includes(o.id));
      if (state.phase !== 'question' || !state.bag.look || left.length < 3 || action.optionId === question.correctId ||
          !left.some(o => o.id === action.optionId)) return state;
      return { ...state, assisted: true, out: [...state.out, action.optionId], bag: { ...state.bag, look: state.bag.look - 1 } };
    }
    case 'bubble':
      if (state.phase !== 'question' || !state.bag.bubble || state.shield) return state;
      return { ...state, shield: true, bag: { ...state.bag, bubble: state.bag.bubble - 1 } };
    case 'answer': {
      if (state.phase !== 'question' || !question.options.some(o => o.id === action.optionId) || state.out.includes(action.optionId)) return state;
      const correct = action.optionId === question.correctId;
      const attempts = [...state.attempts, { itemId: question.id, skillId: question.skillId, time: action.time ?? Date.now(), turn: state.turn,
        attempt: 1 + state.attempts.filter(a => a.turn === state.turn).length, chosenOptionId: action.optionId, correct, assisted: state.assisted,
        petId: state.team[state.active].id, reviewedWrongChoiceTag: correct ? undefined : question.wrongChoiceTags?.[action.optionId] }];
      const correctIds = correct ? [...new Set([...state.correctIds, question.id])] : state.correctIds;
      let { shield, hp, ward, feintCut, absorbed } = state, lastCounter = state.lastCounter, phase = correct ? 'ready' : 'retry';
      if (!correct) {
        let dmg = state.counter, blocked = null;
        if (state.practice) dmg = Math.max(1, Math.ceil(dmg / 2));
        if (feintCut) { dmg = Math.max(0, dmg - feintCut); feintCut = 0; blocked = 'feint'; }
        if (shield) { shield = false; absorbed += 1; blocked = 'bubble'; dmg = 0; }
        else if (ward && dmg) { const a = Math.min(ward, dmg); ward -= a; dmg -= a; blocked = 'ward'; }
        hp = Math.max(0, hp - dmg); lastCounter = { dmg, blocked, turn: state.turn };
        if (hp === 0) phase = 'defeat';
      }
      return { ...state, phase, attempts, correctIds, shield, hp, ward, feintCut, absorbed, lastCounter, misses: state.misses + (correct ? 0 : 1), out: correct ? state.out : [...state.out, action.optionId] };
    }
    case 'checkpoint':
      return state.phase === 'defeat' ? { ...state, phase: 'question', hp: state.maxHp, assisted: true, out: [], ward: 0, feintCut: 0, shield: false, checkpoints: state.checkpoints + 1 } : state;
    case 'retry':
      return state.phase === 'retry' ? { ...state, phase: 'question' } : state;
    case 'replaceq':
      if (state.phase !== 'retry' || state.questions.some(q => q.id === action.question.id)) return state;
      return { ...state, phase: 'question', out: [], questions: state.questions.map((q, i) => i === state.index ? action.question : q) };
    case 'double':
      return state.phase === 'ready' && state.bag.double && !state.double ? { ...state, double: true } : state;
    case 'cast': {
      if (state.phase !== 'ready' || !state.team[state.active].moveIds.includes(action.moveId)) return state;
      const r = state.rules[action.moveId] || { kind: SUPPORT(action.moveId) ? 'guard' : 'strike', dmg: 2, cd: 0 };
      if ((state.cd[action.moveId] || 0) > 0 || (r.once && state.used[action.moveId])) return state;
      const dmgKind = ['strike', 'feint', 'double', 'finisher'].includes(r.kind), spent = Number(state.double && dmgKind);
      const dealt = dmgKind ? (r.dmg ?? 2) + spent : 0, resolve = Math.max(0, state.resolve - dealt);
      let { hp, ward, feintCut, shield } = state;
      if (r.kind === 'guard') shield = true;
      if (r.kind === 'ward') ward = Math.min(2, ward + 2);
      if (r.kind === 'feint') feintCut = 1;
      const healed = r.kind === 'recovery' ? Math.min(state.maxHp - hp, 3) : 0; hp += healed;
      return { ...state, phase: 'casting', resolve, double: false, hp, ward, feintCut, shield, bag: { ...state.bag, double: state.bag.double - spent },
        cd: { ...state.cd, [action.moveId]: r.cd ? r.cd + 1 : 0 }, used: r.once ? { ...state.used, [action.moveId]: true } : state.used,
        lastCast: { moveId: action.moveId, petId: state.team[state.active].id, double: Boolean(spent), damage: dealt, kind: r.kind, healed, hits: r.kind === 'double' ? 2 : 1 } };
    }
    case 'settle': {
      if (state.phase !== 'casting') return state;
      if (!state.resolve && state.correctIds.length >= state.minimumCorrect) return { ...state, phase: 'victory' };
      return { ...state, cd: Object.fromEntries(Object.entries(state.cd).map(([k, v]) => [k, Math.max(0, v - 1)])), phase: 'question', index: (state.index + 1) % state.questions.length, turn: state.turn + 1, swapped: false, assisted: false, out: [],
        earlyZero: !state.resolve };
    }
    case 'claim':
      return state.phase === 'victory' ? { ...state, phase: 'claimed' } : state;
    default:
      return state;
  }
}

/** Summarize recent, independent, unassisted first attempts by skill. */
function summarizeEvidence(attempts, { now = Date.now(), days = 30 } = {}) {
  const oldest = now - days * 86_400_000, unique = new Map();
  for (const a of [...attempts].sort((x, y) => x.time - y.time)) {
    if (!a.skillId || !a.itemId || !Number.isFinite(a.time) || a.time < oldest || a.time > now || a.attempt !== 1 || a.assisted || typeof a.correct !== 'boolean') continue;
    const key = JSON.stringify([a.skillId, a.itemId]);
    if (!unique.has(key)) unique.set(key, a);
  }
  const skills = new Map();
  for (const a of unique.values()) skills.set(a.skillId, [...(skills.get(a.skillId) ?? []), a]);
  return [...skills.entries()].map(([skillId, items]) => {
    const correct = items.filter(a => a.correct).length, accuracy = correct / items.length, tags = new Map();
    for (const a of items) if (!a.correct && a.reviewedWrongChoiceTag) tags.set(a.reviewedWrongChoiceTag, [...(tags.get(a.reviewedWrongChoiceTag) ?? []), a.itemId]);
    const patterns = [...tags].filter(([, ids]) => ids.length >= 2)
      .sort(([lt, l], [rt, r]) => r.length - l.length || lt.localeCompare(rt)).map(([tag, itemIds]) => ({ tag, itemIds, evidenceCount: itemIds.length }));
    return { skillId, count: items.length, correct, accuracy, patterns,
      status: items.length < 3 ? 'more-evidence' : patterns.length || accuracy < 0.6 ? 'suggest-practice' : 'monitor',
      evidence: items.map(({ itemId, time, correct, chosenOptionId }) => ({ itemId, time, correct, chosenOptionId })) };
  });
}

window.SQ_ENGINE = Object.assign(window.SQ_ENGINE || {}, { createBattle, battleStep, summarizeEvidence });
})();
