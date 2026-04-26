// =============================================
// BEAUTY & THE MATHS — Storage v2
// Rich data model, unlimited sessions, versioned
// =============================================

const KEYS = {
  META:    'batm_meta',
  STREAK:  'batm_streak',
  TABLES:  'batm_tables',
  HISTORY: 'batm_history',
  WRONGS:  'batm_wrongs',
  PREFS:   'batm_prefs',
};

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) { console.warn('Storage full', e); }
}

// ---- Preferences ----
function loadPrefs() { return load(KEYS.PREFS, { sound: true, haptic: true }); }
function savePrefs(p) { save(KEYS.PREFS, p); }

// ---- Streak ----
function loadStreak() {
  return load(KEYS.STREAK, { count: 0, best: 0, lastDate: null });
}
function updateStreak() {
  const today = new Date().toDateString();
  const s = loadStreak();
  if (s.lastDate === today) return s;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  s.count = s.lastDate === yesterday ? s.count + 1 : 1;
  s.best  = Math.max(s.best || 0, s.count);
  s.lastDate = today;
  save(KEYS.STREAK, s);
  return s;
}

// ---- Table mastery data ----
function loadTableData() { return load(KEYS.TABLES, {}); }
function updateTableData(tableNum, res) {
  const data = loadTableData();
  const t = data[tableNum] || { sessions:0, totalQ:0, correct:0, totalTimeMs:0, lastDate:null, masteryScore:0 };
  t.sessions   += 1;
  t.totalQ     += res.total || 0;
  t.correct    += res.correct || 0;
  t.totalTimeMs += res.totalTimeMs || 0;
  t.lastDate    = new Date().toISOString();
  const acc = t.totalQ > 0 ? t.correct / t.totalQ : 0;
  t.masteryScore = Math.min(100, Math.round(acc * 70 + Math.min(t.sessions, 10) * 3));
  data[tableNum] = t;
  save(KEYS.TABLES, data);
}
function isMastered(tableNum) {
  const t = loadTableData()[tableNum];
  return !!(t && t.masteryScore >= 80 && t.sessions >= 3);
}

// ---- Wrong tracker ----
function recordWrong(expr) {
  const w = load(KEYS.WRONGS, {});
  w[expr] = (w[expr] || 0) + 1;
  save(KEYS.WRONGS, w);
}
function getTopWrongs(n) {
  return Object.entries(load(KEYS.WRONGS, {}))
    .sort((a,b) => b[1]-a[1]).slice(0, n||10)
    .map(([expr,count]) => ({ expr, count }));
}

// ---- Session history ----
function loadHistory() { return load(KEYS.HISTORY, []); }
function saveSessionResult(result) {
  const history = loadHistory();
  const entry = {
    id:          Date.now(),
    date:        new Date().toISOString(),
    tables:      result.tables,
    score:       result.finalScore,
    accuracy:    result.accuracy,
    grade:       result.grade,
    avgTime:     result.avgTime,
    correct:     result.correct,
    wrong:       result.wrong,
    timeouts:    result.timeouts,
    total:       result.total,
    totalTimeMs: result.totalTimeMs || 0,
    byType:      result.byType,
  };
  history.unshift(entry);
  save(KEYS.HISTORY, history.slice(0, 500));
  if (result.tables) result.tables.forEach(t => updateTableData(t, result));
  updateStreak();
  // Track wrong expressions
  if (result.questions) {
    result.questions.filter(q => !q.isCorrect && !q.timedOut)
      .forEach(q => recordWrong(q.expr));
  }
  return entry;
}

// ---- Analytics ----
function getTodaySessionCount() {
  const today = new Date().toDateString();
  return loadHistory().filter(s => new Date(s.date).toDateString() === today).length;
}
function getOverallStats() {
  const history = loadHistory();
  if (!history.length) return null;
  const n = history.length;
  return {
    totalSessions: n,
    avgAccuracy:   Math.round(history.reduce((s,h)=>s+h.accuracy,0)/n),
    avgScore:      Math.round(history.reduce((s,h)=>s+h.score,0)/n),
    bestScore:     Math.max(...history.map(h=>h.score)),
    bestGrade:     history.sort((a,b)=>b.score-a.score)[0]?.grade,
    totalQ:        history.reduce((s,h)=>s+h.total,0),
    totalCorrect:  history.reduce((s,h)=>s+h.correct,0),
    masteredCount: Object.values(loadTableData()).filter(t=>t.masteryScore>=80&&t.sessions>=3).length,
  };
}
function getLast7Days() {
  const history = loadHistory();
  return Array.from({length:7},(_,i)=>{
    const d = new Date(Date.now() - (6-i)*86400000);
    const dateStr = d.toDateString();
    const sessions = history.filter(s=>new Date(s.date).toDateString()===dateStr);
    return {
      label: d.toLocaleDateString('en',{weekday:'short'}),
      sessions: sessions.length,
      avgAccuracy: sessions.length ? Math.round(sessions.reduce((s,h)=>s+h.accuracy,0)/sessions.length) : null,
      avgScore: sessions.length ? Math.round(sessions.reduce((s,h)=>s+h.score,0)/sessions.length) : null,
    };
  });
}
