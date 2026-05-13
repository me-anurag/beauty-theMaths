# Beauty and the Maths

> High-speed cognitive mental maths training platform.

---

## Stack

| Layer        | Tech                        |
|--------------|-----------------------------|
| Framework    | Next.js 14 (App Router)     |
| Language     | TypeScript                  |
| Styling      | Tailwind CSS                |
| Animations   | Framer Motion               |
| State        | Zustand + Immer             |
| Persistence  | localStorage (retention)    |
| Hosting      | Vercel / Netlify            |

---

## Folder Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout, fonts, PWA meta
│   └── page.tsx            # Main orchestrator page
│
├── core/                   # Pure logic — no UI dependencies
│   ├── engine/
│   │   └── questionGenerator.ts   # Question generation algorithm
│   ├── scoring/
│   │   └── scoreEngine.ts         # Points, grade calculation
│   ├── analytics/
│   │   └── analyticsEngine.ts     # Session analytics computation
│   ├── streak/
│   │   └── streakSystem.ts        # Streak milestones, labels
│   └── retention/
│       └── retentionSystem.ts     # localStorage persistence
│
├── features/               # UI feature modules
│   ├── session/
│   │   ├── QuestionDisplay.tsx    # Giant question + input
│   │   ├── SessionControls.tsx    # Idle start screen
│   │   ├── SessionHeader.tsx      # Active session top bar
│   │   └── PauseOverlay.tsx       # Pause screen
│   ├── sidebar/
│   │   └── Sidebar.tsx            # Table grid, streak, stats
│   ├── keypad/
│   │   └── NumericKeypad.tsx      # Mobile numeric keypad
│   ├── feedback/
│   │   └── FeedbackFlash.tsx      # Correct/wrong flash overlay
│   └── analytics-view/
│       └── AnalyticsView.tsx      # End-of-session results
│
├── ui/
│   ├── components/
│   │   ├── ProgressBar.tsx        # Timer urgency bar
│   │   └── StreakBadge.tsx        # Animated streak display
│   ├── animations/                # (future: shared variants)
│   └── theme/
│       └── globals.css            # CSS custom properties, base styles
│
├── hooks/
│   ├── useSessionTimer.ts         # RAF-driven timer (session + per-Q)
│   ├── useKeyboardInput.ts        # Global keyboard capture
│   └── useFeedback.ts             # Feedback event consumer
│
├── store/
│   └── useStore.ts                # Zustand global store (all state)
│
├── types/
│   └── index.ts                   # All TypeScript types
│
└── utils/
    └── index.ts                   # cn(), formatTime(), formatMs()
```

---

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Build & Deploy (Vercel)

```bash
npm run build
# Push to GitHub → connect to Vercel → auto-deploys
```

## Build & Deploy (Netlify)

Set build command: `npm run build`  
Publish directory: `.next`  
Install the Netlify Next.js plugin.

---

## How it works

### Question Algorithm
- **50 multiplication** questions: selected tables × operands 1–20, fully shuffled per cycle so all combinations appear before repeating
- **40 mixed** questions: 15 addition + 15 subtraction + 10 product-mixed, all derived from selected table values
- Interleaved 5:4 ratio (multiply:mixed) for rhythm variation
- No two identical consecutive questions

### Scoring
- Base 100 pts × difficulty multiplier (1.0 / 1.5 / 2.0)
- Time bonus: up to 50 pts (linear decay over question time limit)
- Streak multiplier: 1.0 → 3.0× for streaks of 3 / 5 / 8 / 12+

### Timer
- RAF-driven (requestAnimationFrame) for smooth urgency bar
- Per-question limit: 8s easy / 10s medium / 12s hard
- Auto-advances on timeout (counts as skip)

### Retention
- Learned tables persist in localStorage
- Mastery unlocked after 90%+ accuracy in any session
- All-time stats tracked across sessions

---

## Future Expansion

The architecture is designed for easy addition of:

| Feature              | Where to add                          |
|----------------------|---------------------------------------|
| Leaderboard          | `src/features/leaderboard/`           |
| Survival mode        | `src/core/engine/` + new game mode    |
| AI difficulty adapt  | `src/core/engine/adaptiveEngine.ts`   |
| Supabase sync        | `src/core/retention/supabaseSync.ts`  |
| Heatmap analytics    | `src/features/analytics-view/`        |
| Multiplayer          | `src/features/multiplayer/`           |
| Ranked mode          | `src/store/` + new session config     |
