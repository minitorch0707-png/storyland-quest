# Share, host and edit Storyland Quest

The app is static files plus one optional Python server. Pick the row that fits.

| Goal | How | AI features |
|---|---|---|
| Group mates just try it | Open the shared page: https://claude.ai/artifact/L9LeV5MbN2zFH9QTVoRJEq | Live drafting works only for a signed-in Claude viewer |
| Everyone on the same Wi-Fi | `HOST=0.0.0.0 python3 server.py`, then share `http://<your-ip>:5173` | Off unless a key is set |
| Free public link, no AI | Drag the `public` folder onto netlify.com/drop, or push to GitHub and enable Pages (folder `/public`) | Off. Offline fixtures still demo the workflow |
| Public link with live AI | Push to GitHub, then Render > New > Blueprint (uses `render.yaml` + `Dockerfile`). Add `ANTHROPIC_API_KEY` in the Render dashboard | On |

## Run it from GitHub (recommended for the team)
1. Create an empty repo on github.com (name: `storyland-quest`), then add your group mates under Settings > Collaborators.
2. Push (commands below). 3. Settings > Pages > Source: **GitHub Actions**. Copy `docs/pages-workflow.yml` to `.github/workflows/pages.yml` (GitHub web: Add file > Create new file; the push token here can't create workflows). It publishes `public/` at `https://<user>.github.io/storyland-quest/` after every push to `main`.
4. Anyone can also clone and run: `git clone <repo> && cd storyland-quest && python3 server.py` (Python 3 only, no installs).

## Rules for a hosted server
- Never commit a key. `.env` is git-ignored; use the host's environment settings.
- When `HOST` is not localhost, the browser key box is disabled (`/api/key` returns 403) so strangers cannot set your key. `SQ_ALLOW_KEY_UI=1` turns it back on (not recommended).
- All learner data stays in each visitor's browser (localStorage). Nothing is stored on the server.
- Use synthetic learners (Ari, Bea) for demos. Do not enter real student names.

## Put it on GitHub for the team
```bash
git add -A && git commit -m "Storyland Quest"
git branch -M main
git remote add origin <your repo url>
git push -u origin main
```
Each person works on a branch, opens a pull request, and one other person reviews before merge.

## Run locally
`python3 server.py` then open http://localhost:5173 . Add `#qa` to the address for the QA adventurer and Demo Controls. `SQ_MOCK=1 python3 server.py` shows the AI screens with canned replies (label these as simulated in the demo).
