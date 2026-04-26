# Beauty & The Maths ∞

> Master multiplication tables 2–100 with lightning-speed 90-question sessions.

---

## Deploy in 60 seconds (3 ways)

### Option 1 — Netlify Drop (Easiest, no account needed)
1. Go to **https://app.netlify.com/drop**
2. Drag the file `beauty-and-the-maths-pwa.html` onto the page
3. Rename it to `index.html` if prompted
4. Done — live URL instantly. Share it, add to home screen.

### Option 2 — Netlify with Git (Recommended for updates)
1. Create a GitHub repo, push this folder
2. Go to **https://app.netlify.com** → New site from Git
3. Connect repo, build command: *(leave empty)*, publish dir: `.`
4. Deploy. Every git push auto-deploys.

### Option 3 — Vercel
1. `npm i -g vercel`
2. In this folder: `vercel --prod`
3. Done.

### Option 4 — GitHub Pages
1. Push to GitHub
2. Settings → Pages → Branch: main → Folder: / (root)
3. Rename `beauty-and-the-maths-pwa.html` → `index.html`

---

## Install as App (PWA)

### Android (Chrome)
- Open the URL in Chrome
- Tap the **"Add to Home Screen"** banner that appears
- Or: Chrome menu → "Add to Home Screen"
- Opens full-screen, no browser bar — feels native

### iPhone (Safari)
- Open the URL in Safari
- Tap the **Share** button (box with arrow)
- Tap **"Add to Home Screen"**
- Tap **Add**

---

## Data Storage
All progress is stored in **localStorage** on your device:
- ✅ Session history (last 30 sessions)
- ✅ Mastered tables (green cells)
- ✅ Daily streak
- ✅ Today's session count

Data persists across browser sessions. Clearing browser data will reset it.

---

## Folder Structure
```
beauty-and-the-maths/
├── index.html                    ← Entry point
├── manifest.json                 ← PWA manifest
├── sw.js                         ← Service worker (offline)
├── netlify.toml                  ← Deploy config
├── icons/                        ← App icons (all sizes)
│   ├── icon-192.png
│   └── icon-512.png
└── src/
    ├── main.js                   ← App state & rendering
    ├── styles/
    │   └── main.css              ← Design system
    └── utils/
        ├── questionGenerator.js  ← 90Q algorithm
        ├── storage.js            ← localStorage manager
        └── sounds.js             ← Web Audio feedback
```

---

## Roadmap (Coming Soon)
- 📈 Progress charts — accuracy trends per table
- 🏆 Leaderboard — compete with saved profiles
- ⚔️ Challenges — timed streaks, no-mistake runs
- 📊 Weak spot detection — auto-focus problem tables
- 🔔 Daily reminder push notifications
