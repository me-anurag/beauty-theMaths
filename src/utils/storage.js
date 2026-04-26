// =============================================
// BEAUTY & THE MATHS — Storage / Progress
// =============================================

const KEYS = {
  PROGRESS:    'batm_progress',
  STREAK:      'batm_streak',
  LEARNED:     'batm_learned_tables',
  HISTORY:     'batm_session_history',
  LAST_SESSION:'batm_last_session_date',
};

// ---- Progress ----
export function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.PROGRESS)) || {};
  } catch { return {}; }
}

export function saveProgress(data) {
  localStorage.setItem(KEYS.PROGRESS, JSON.stringify(data));
}

// ---- Streak ----
export function loadStreak() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.STREAK)) || { count: 0, lastDate: null };
  } catch { return { count: 0, lastDate: null }; }
}

export function updateStreak() {
  const today = new Date().toDateString();
  const streak = loadStreak();

  if (streak.lastDate === today) return streak; // already logged today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (streak.lastDate === yesterday.toDateString()) {
    streak.count += 1;
  } else if (streak.lastDate !== today) {
    streak.count = 1; // reset
  }

  streak.lastDate = today;
  localStorage.setItem(KEYS.STREAK, JSON.stringify(streak));
  return streak;
}

// ---- Learned Tables ----
export function loadLearnedTables() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.LEARNED)) || [];
  } catch { return []; }
}

export function saveLearnedTables(tables) {
  localStorage.setItem(KEYS.LEARNED, JSON.stringify(tables));
}

// ---- Session History ----
export function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.HISTORY)) || [];
  } catch { return []; }
}

export function saveSessionResult(result) {
  const history = loadHistory();
  history.unshift({
    date: new Date().toISOString(),
    tables: result.tables,
    score: result.finalScore,
    accuracy: result.accuracy,
    grade: result.grade,
    avgTime: result.avgTime,
    correct: result.correct,
    total: result.total,
  });
  // Keep last 30 sessions
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(history.slice(0, 30)));
  updateStreak();
}

export function getTodaySessionCount() {
  const history = loadHistory();
  const today = new Date().toDateString();
  return history.filter(s => new Date(s.date).toDateString() === today).length;
}
