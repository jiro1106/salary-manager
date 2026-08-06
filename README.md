# Salary manager

A personal payday budget splitter — divide your salary into Savings / Needs /
Wants (or whatever categories you want), with editable percentages and
sub-category breakdowns. Runs entirely on your machine; nothing is sent
anywhere.

## Run it

You need [Node.js](https://nodejs.org) installed (18+ recommended).

```bash
npm install
npm run dev
```

Then open the URL it prints (usually http://localhost:5173) in your browser.

## Data storage

Your categories, percentages, and payday history are saved in your browser's
localStorage under the `salary-manager:` prefix. This means:

- Data persists between sessions, as long as you use the same browser on the
  same machine.
- Clearing your browser's site data for `localhost` will erase it.
- It does not sync across devices or browsers.

## Build for later use offline

```bash
npm run build
npm run preview
```

This creates a `dist/` folder with a static build you can open without
running the dev server.
