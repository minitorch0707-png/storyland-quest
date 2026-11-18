# Team guide: where things live and how to change them

## Folder map (`public/`)
| File | What it does | Change it to... |
|---|---|---|
| `content.js`, `subjects.js` | Hand-checked question banks | add or fix questions |
| `data.js`, `data2.js` | Pets, shop, moves (150), campaign chapters | add pets, moves, chapters |
| `engine.js` | Battle rules (HP, counterattacks, evidence rules) | change battle math. Keep it deterministic |
| `game-*.js` | Game screens, each a "part" that adds to `window.SQ_PARTS` | add a new screen: copy `game-practice.js` |
| `game-demo.js` | Presenter Demo Controls (QA only) | add a demo shortcut |
| `teach.js`, `telescope.js` | Teacher workflow: evidence, passage drafting, approval, modes | add a teacher AI mode |
| `prompts.js` | Every prompt sent to the model | tune wording. Bump the version string |
| `game-tutor.js` | Ask Pip: AI tutor in battles (explains where an answer went wrong, answers student questions; reply checks reject answer leaks and invented quotes) | tune checks, chips |
| `game-fluency.js` | Read it aloud: speech recognition + word alignment, AI coaching note | change scoring |
| `game-parent.js` | Parent study report with trackers/graphs; Send button -> `/api/email` | change report layout |
| `server.py` | Static server + `/api/ai` | add an AI `kind` and its prompt |

Add a script tag for any new file in BOTH `index.html` and `storyland-quest.html`.

## Rules we keep
1. AI never decides scores, mastery or unlocks. Rules do.
2. AI drafts are validated (schema, quote match, answer id), then a teacher approves before a child sees them.
3. Simulated or offline content is always labeled. Never call it live AI.
4. Only approved text and minimal synthetic evidence go to the model. No names.

## Adding an AI mode (pattern from the mini-lesson)
1. Prompt builder in `prompts.js`.
2. Validation function in `teach.js` (reject anything unsupported by the passage).
3. Offline authored fixture so the demo works without AI.
4. Teacher edit + approve screen. Save a trace (input, output, model, prompt version).

## Testing checklist before a demo
Open `#qa` > Demo Controls > AI Tutor Demo > load offline fixture > approve > Play as Ari > pick the bench > retry > fresh question > check the teacher view lists three attempts.

## AI is connected, not canned
The tutor, adapter, fluency coach and report notes call `C.aiCall(kind, params)`. On the shared Claude page the viewer's own account answers; locally paste a key in the tutor panel (or dashboard). There is no offline tutor. Prompts exist twice: `prompts.js` (shared page) and `server.py` (local server). Keep them in sync.

## Grades 7-8
Advanced reading passages are in `content.js` (`adv:true`). Each question has `why` (why each wrong choice is tempting) and `quote` (the deciding sentence) so the tutor can teach, not just score.

## Connecting AI
- Shared Claude page: Ask Pip and the teacher tools connect to the viewer's own Claude account automatically (`sample`); read-aloud uses Claude's voice (`tts`). Publish with `capabilities: {sample:{}, tts:{}}`.
- Local: `python3 server.py` uses `ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`, or the `claude` CLI if it is on PATH.
- Teacher tools send long prompts as `kind: raw`, which a hosted server refuses.
- Ask Pip is on every screen (floating button) and in battles. Teachers no longer approve a source: Claude can write the passage, and the teacher still reviews every question before a student sees it.
