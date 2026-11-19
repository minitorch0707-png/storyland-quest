# Storyland Quest 🦊

Prototype for the COSC1367 team project: an AI literacy rehabilitation system.
Children (Grades 1–6) play short reading games; the system finds each child's weak
skills, assigns personalized practice, gives instant feedback, adjusts difficulty,
and reports to teachers and parents.

> Sharing, hosting and editing: see `HOSTING.md`, `TEAM-GUIDE.md` and `REQUIREMENTS-MAP.md`.

## Run it

```bash
python3 server.py
```

Open http://localhost:5173. Needs only Python 3 (no installs).

### Turn on generative AI (optional)

Open **For teachers & parents** on the home screen and paste a Claude, ChatGPT or Gemini API key under
**Generative AI**. (Or put it in a `.env` file; see `.env.example`.) Without a key the app runs on its
hand-written content bank and the AI features are hidden.

To test the AI screens without a key: `SQ_MOCK=1 python3 server.py` (canned replies).

## How it maps to the proposal

| Proposal step | In the prototype |
|---|---|
| Identify weaknesses | "Pip's Warm-Up" placement + a 0–100 mastery score per skill (7 skills, plus 4 comprehension sub-skills) |
| Personalized material | "Pip's pick" sends the child to their weakest skill; AI writes a story on a topic the child chooses, at their level, with an extra question on their weakest sub-skill |
| Immediate feedback | Two tries per question, a hint after the first miss, an explanation after every answer; AI "glow and grow" feedback on writing |
| Raise / lower difficulty | Mastery moves up on first-try answers and down on misses; three levels per skill |
| Support teachers | Dashboard (behind a grown-up gate): class heat-map, class insight, per-student profile, next steps, AI summary, CSV export |

## Where generative AI is used (and where it is not)

- **AI Mission:** the AI reads the child's recent mistakes and mastery scores, names the likely pattern, and writes a 6-question boss battle aimed at it. It also leaves a diagnosis note for the teacher.
- **AI Adventure:** a 3-chapter choose-your-own-adventure starring the child's pet, written chapter by chapter from the child's choices, at their reading level, with a question on their weakest comprehension skill.
- **Why? Ask Pip:** after a wrong answer the AI explains that specific mix-up.
- **Also:** topic vocabulary, writing feedback, teacher summaries.
- **Not used:** phonics and spelling. A wrong rhyme or spelling would teach an error, so those come only from the checked bank.
- **Hallucination guard:** every AI reply is validated in the browser (shape, answer index, lengths, duplicate options). A failed reply is replaced with bank content.
- **Guessing guard:** answers faster than 1.2 s are flagged as likely guesses, count for half, and show on the dashboard.
- **Privacy:** student data stays in the browser (localStorage). Only grade, level, topic and scores go to the AI, never names. The API key is saved in a `.env` file next to `server.py` (file permissions 600) and is never sent to the page. Anyone with access to that folder can read it.
- **Prompts:** in `server.py`, and viewable live in the dashboard under "How the AI is prompted".

## Files

- `server.py` – static server, prompts, AI calls
- `public/app.js` – games, adaptive engine, dashboard
- `public/content.js` – offline content bank
- `public/styles.css`, `public/index.html`

## AI acknowledgment

This prototype's code and built-in content were generated with Claude Code (Anthropic)
and should be acknowledged as such in the report. The team is responsible for reviewing
and verifying it.

## Game layer

Battles against word monsters, coins, treasure chests, a pet that hatches and evolves, and a shop
(food, hats, worlds, power-ups, new eggs). Art: drop PNGs into `public/assets/` using the names in
`DESIGN_PROMPT.md`; anything missing falls back to an emoji.

## Battle expansion (this build)

- **One battle flow** (`public/game-battle.js`, engine in `public/engine.js`): question → retry → cast token → move tray → VFX + sounds → resolve → victory → chest. Used by islands, boss fights, room props, Daily Battles, Pip's warm-up, AI missions/adventures and teacher assignments.
- **Worlds**: 7 Language islands + Math, Science, Visual Arts, History, French, each with its own arena and villain (`public/data.js` is generated from the handoff catalogs). The five new worlds stay closed until a teacher marks their prototype questions as reviewed (Teacher area → "Reviewed questions").
- **Companions**: 25 families / 100 forms, Field Guide, three-pet team, free swap between questions, Move Book, hatching, recruit quests, boss befriending, Hatchery.
- **Rewards**: chests (granted once, receipts kept), stickers (banner + room board + set frames), 100 cosmetics, Daily Battles, daily login, earned-coin prize wheel.
- **Adventurer + Pet Room**: avatar creator (layered SVG), wardrobe, gear, slot-based furniture, practice props.
- **Teacher area**: evidence filters, assisted vs independent attempts, Pip passage drafts with exact-quote checks and approval, passage-change check (live AI / saved example / offline fixture).
- Old saves migrate automatically (`G.migrate` in `public/game-core.js`).

Run locally with `python3 server.py` (port 5173). Test mode without a key: `SQ_MOCK=1 python3 server.py`.

## 2D gameplay expansion (v7)
- Battle: pinned arena, labelled companion HP (12) and enemy Resolve, enemy counterattack on a wrong answer (2 HP, boss 3, Practice mode halves it), Bubble Guard/ward/feint blocks, checkpoint retry at 0 HP, bottom-sheet move picker.
- Moves: `public/data2.js` merges move-expansion.json (150 moves) and chapters.json; `public/game-v3.js` holds unlock rules, equip (max 4), chapters, counterattacks and the QA profile.
- Full Inventory QA profile: open the game with `#qa` in the URL. It is stored apart from real saves (`S.qa`), is not listed in the player chooser, and can be reset or cleared of owned items for checkout tests.
- Room: owned/unplaced furniture list, drag/click/keyboard placement with undo, room theme, resident roster, in-scene greetings. Wheel: prize icons, odds text, wallet receipt.

## Demo Controls and AI modes (v11)
- **Demo Controls** (purple button, top right of every QA screen): wallet, grants, worlds/chapters, battle shortcuts, presets, click-path guide. QA adventurer only; simulated outcomes are tagged and write no attempts. Code: `public/game-demo.js`, hook `G.btx` in `game-battle.js`.
- **Teacher modes** in `teach.js`: mini-lesson (worked example, guided, independent, shorter-directions support), story mission, evidence-linked recap, evaluation log. Prompts: `prompts.js` (`buildMini`, `buildMission`, `buildRecap`). Offline items are authored fixtures; live drafts need a signed-in Claude view.

## Automated Run-through (v17)
A narrated tour that operates the real prototype in a separate synthetic session. Start it from **Teachers & Parents → ▶ Demo run-through** (or Demo Controls). *Full demo* ≈ 9 min, *Quick overview* ≈ 3 min, with play/pause, next/previous, restart, a progress bar, a chapter selector, separate narration and sound toggles, captions and an **Exit Demo** button. It works with no API key: AI segments use authored fixtures and are labelled **Authored demo fixture**; with Claude connected they use a live reply and are labelled **Live AI response**. Real saves are never changed, and no email is ever sent. See `TEAM-GUIDE.md`.
