# FinGuard AI

Interactive financial-crime intelligence console: transaction monitoring, AML rules, fraud scoring, customer risk, graph analytics, case management and a rule-based AI copilot.

**Everything runs in the browser on synthetic data.** There is no backend, database or trained production model. Roles are a demo switch, not authentication. The benchmark is a PaySim-style simulator, or your own PaySim / Credit Card Fraud CSV loaded locally (never uploaded).

## Run
Open `index.html`, or serve the folder (`python -m http.server`). React and htm load from a CDN.

## Edit
Source is in `src/`. Run `bash build.sh` to rebuild `index.html`.

## Deploy
Pushing to `main` publishes to GitHub Pages through `.github/workflows/pages.yml`. In the repo, set Settings > Pages > Source to "GitHub Actions".
