// =============================================
// BEAUTY & THE MATHS — Main App v2
// All UX fixes + History + Analytics dashboard
// =============================================

// =============================================
// STATE
// =============================================
const state = {
  page: 'home',
  selectedTables: [],
  questions: [],
  currentQ: 0,
  results: null,
  timer: null,
  timeLeft: 10,
  combo: 0,
  streak: 0,
  streakBest: 0,
  isMobile: window.innerWidth <= 768,
  panelOpen: false,
  pendingInput: '',
  paused: false,
  sessionStarted: false,
  countdownActive: false,
  sound: true,
  historyFilter: 'all', // all | week | month
};

const QUESTION_TIME = 10;
const TOTAL_QUESTIONS = 90;

// =============================================
// INIT
// =============================================
function init() {
  const streakData = loadStreak();
  state.streak = streakData.count;
  state.streakBest = streakData.best || 0;
  const prefs = loadPrefs();
  state.sound = prefs.sound !== false;
  renderApp();
  bindGlobalEvents();
  // First-time onboarding
  if (!localStorage.getItem('batm_seen')) {
    localStorage.setItem('batm_seen', '1');
    setTimeout(showOnboarding, 600);
  }
}

// =============================================
// RENDER — App shell
// =============================================
function renderApp() {
  document.getElementById('app').innerHTML = `
    <div class="scan-line"></div>
    ${renderNavbar()}
    <div class="layout">
      ${renderSidePanel()}
      <main class="main-arena" id="main-arena">${renderMainContent()}</main>
    </div>
    ${renderExitModal()}
    ${renderPauseModal()}
    ${renderStreakCelebration()}
  `;
  bindEvents();
}

// =============================================
// NAVBAR
// =============================================
function renderNavbar() {
  const todaySessions = getTodaySessionCount();
  const pages = [
    { id:'home',      label:'Practice', icon:'⚡' },
    { id:'history',   label:'History',  icon:'📋' },
    { id:'analysis',  label:'Analysis', icon:'📈' },
    { id:'cs-Leaderboard', label:'Leaderboard', icon:'🏆', soon:true },
    { id:'cs-Challenges',  label:'Challenges',  icon:'⚔️', soon:true },
  ];
  const navItems = pages.map(p => {
    const isActive = state.page === p.id;
    return `<button class="nav-item ${isActive?'active':''} ${p.soon?'coming-soon-nav':''}"
      data-page="${p.id}" ${p.soon?`data-label="${p.label}"`:''}">
      ${p.label}${p.soon?'<span class="badge">Soon</span>':''}
    </button>`;
  }).join('');

  return `
    <nav class="navbar">
      <button class="mobile-menu-btn" id="mobile-menu-btn">☰</button>
      <div class="navbar-logo">Beauty &amp; The <span>Maths</span></div>
      <div class="navbar-nav">${navItems}</div>
      <div class="navbar-right">
        <div class="sound-toggle" id="sound-toggle" title="Toggle sound">
          ${state.sound ? '🔊' : '🔇'}
        </div>
        <div class="day-badge">Today <span>${todaySessions}</span></div>
        <div class="streak-display" title="Best: ${state.streakBest} days">
          <span class="streak-flame">${state.streak >= 7 ? '🔥' : state.streak >= 3 ? '⚡' : '✦'}</span>
          <span class="streak-num">${state.streak}</span>
          <span class="streak-label">streak</span>
        </div>
      </div>
    </nav>`;
}

// =============================================
// SIDE PANEL
// =============================================
function renderSidePanel() {
  const tableData = loadTableData();
  const selectedSet = new Set(state.selectedTables);
  let cells = '';
  for (let i = 2; i <= 100; i++) {
    const td = tableData[i];
    const mastered = td && td.masteryScore >= 80 && td.sessions >= 3;
    const practiced = td && td.sessions > 0;
    const isSelected = selectedSet.has(i);
    let cls = 'table-cell';
    if (mastered)  cls += ' mastered';
    else if (practiced) cls += ' practiced';
    if (isSelected) cls += ' selected';
    const ms = td ? td.masteryScore : 0;
    cells += `<div class="${cls}" data-table="${i}" title="${i}× table${td ? ` · ${td.sessions} sessions · ${ms}% mastery` : ' · not started'}">${i}</div>`;
  }
  const [t1, t2] = state.selectedTables;
  const canStart = state.selectedTables.length === 2;
  const td1 = t1 ? loadTableData()[t1] : null;
  const td2 = t2 ? loadTableData()[t2] : null;

  return `
    <aside class="side-panel ${state.panelOpen?'open':''}" id="side-panel">
      <div class="panel-header">
        <div class="panel-title">Tables 2–100</div>
        <div class="panel-subtitle">Pick any 2 to practice. No daily limit — practice as much as you want.</div>
        <div class="legend-row">
          <span class="legend-dot mastered"></span><span>Mastered</span>
          <span class="legend-dot practiced"></span><span>Practiced</span>
          <span class="legend-dot"></span><span>New</span>
        </div>
      </div>
      <div class="panel-body"><div class="table-grid">${cells}</div></div>
      <div class="panel-footer">
        ${canStart ? `
          <div class="selected-tables-preview">
            <div class="sel-table-chip">
              <span class="chip-num">${t1}×</span>
              ${td1 ? `<span class="chip-ms">${td1.masteryScore}%</span>` : '<span class="chip-ms new">New</span>'}
            </div>
            <span class="chip-sep">+</span>
            <div class="sel-table-chip">
              <span class="chip-num">${t2}×</span>
              ${td2 ? `<span class="chip-ms">${td2.masteryScore}%</span>` : '<span class="chip-ms new">New</span>'}
            </div>
          </div>` : `
          <div class="selected-info">Select <strong>${2-state.selectedTables.length}</strong> table${state.selectedTables.length===1?'':'s'} to begin</div>`
        }
        <button class="btn-start" id="btn-start" ${!canStart?'disabled':''}>
          ${canStart ? '⚡ Start 90 Questions' : 'Select 2 Tables'}
        </button>
      </div>
    </aside>`;
}

// =============================================
// MAIN CONTENT ROUTER
// =============================================
function renderMainContent() {
  if (state.page === 'home')     return renderHome();
  if (state.page === 'session')  return renderSession();
  if (state.page === 'results')  return renderResults();
  if (state.page === 'history')  return renderHistory();
  if (state.page === 'analysis') return renderAnalysis();
  if (state.page.startsWith('cs-')) return renderComingSoon(state.page.replace('cs-',''));
  return renderHome();
}

// =============================================
// HOME
// =============================================
function renderHome() {
  const stats = getOverallStats();
  const history = loadHistory();
  const last = history[0];
  const tableData = loadTableData();
  const masteredCount = Object.values(tableData).filter(t=>t.masteryScore>=80&&t.sessions>=3).length;

  return `
    <div class="home-screen">
      <div class="home-hero">
        <div class="home-title">Master Tables<br><span class="accent">At Lightning Speed.</span></div>
        <p class="home-sub">Select any 2 tables from the panel. 90 questions, 10 seconds each, 15 minutes total. No limits. Pure mastery.</p>
      </div>

      <div class="home-stats">
        <div class="stat-chip"><span class="num">90</span><span class="lbl">Questions</span></div>
        <div class="stat-chip"><span class="num">10s</span><span class="lbl">Per Q</span></div>
        <div class="stat-chip"><span class="num">${stats?.totalSessions||0}</span><span class="lbl">Sessions Done</span></div>
        <div class="stat-chip"><span class="num" style="color:var(--green)">${masteredCount}</span><span class="lbl">Mastered</span></div>
      </div>

      ${last ? `
      <div class="last-session-card">
        <div class="ls-label">Last Session</div>
        <div class="ls-body">
          <div class="ls-tables">${last.tables?.join(' & ')}×</div>
          <div class="ls-grade" style="color:${gradeColor(last.grade)}">${last.grade}</div>
          <div class="ls-acc">${last.accuracy}% accuracy</div>
          <div class="ls-date">${timeAgo(last.date)}</div>
        </div>
      </div>` : ''}

      ${state.selectedTables.length < 2 ? `
      <div class="hint-arrow">← Select 2 tables to begin</div>` : `
      <div class="ready-hint">
        <span class="ready-dot"></span>
        Ready! Press <strong>⚡ Start</strong> in the panel
      </div>`}

      <div class="how-it-works">
        <div class="hiw-item"><span class="hiw-icon">1️⃣</span><span>Pick 2 tables from the left panel</span></div>
        <div class="hiw-item"><span class="hiw-icon">2️⃣</span><span>Answer 90 questions — 10 sec each</span></div>
        <div class="hiw-item"><span class="hiw-icon">3️⃣</span><span>Get graded, track your mastery</span></div>
      </div>
    </div>`;
}

// =============================================
// SESSION
// =============================================
function renderSession() {
  const q = state.questions[state.currentQ];
  if (!q) return '';
  const progress = (state.currentQ / TOTAL_QUESTIONS) * 100;
  const circumference = 138.2;
  const offset = circumference - (state.timeLeft / QUESTION_TIME) * circumference;
  const timerClass = state.timeLeft <= 3 ? 'danger' : state.timeLeft <= 5 ? 'warning' : '';
  const typeLabel = {mult:'✕ Multiply', add:'+ Add', sub:'− Subtract', cross:'⊕ Mixed'}[q.type]||'';
  const correct = state.questions.filter(q=>q.isCorrect===true).length;
  const wrong = state.questions.filter(q=>q.isCorrect===false||q.timedOut).length;
  const accuracy = state.currentQ > 0 ? Math.round((correct/state.currentQ)*100) : 100;

  const dots = state.questions.map((sq,i) => {
    let cls = 'q-dot';
    if (i===state.currentQ) cls+=' active';
    else if (sq.isCorrect===true) cls+=' correct';
    else if (sq.timedOut) cls+=' timeout';
    else if (sq.isCorrect===false) cls+=' wrong';
    return `<div class="${cls}"></div>`;
  }).join('');

  return `
    <div class="session-screen">
      <div class="session-progress-bar"><div class="session-progress-fill" style="width:${progress}%"></div></div>

      <div class="session-header">
        <div class="session-meta">
          <div class="meta-chip"><span class="lbl">Q</span><span class="val">${state.currentQ+1}/${TOTAL_QUESTIONS}</span></div>
          <div class="meta-chip green"><span class="lbl">✓</span><span class="val">${correct}</span></div>
          <div class="meta-chip red"><span class="lbl">✗</span><span class="val">${wrong}</span></div>
          <div class="meta-chip amber hidden-mobile"><span class="lbl">Acc</span><span class="val">${accuracy}%</span></div>
          <div class="meta-chip hidden-mobile"><span class="lbl">Tables</span><span class="val">${state.selectedTables.join('&')}×</span></div>
        </div>
        <div class="session-header-right">
          <button class="pause-btn" id="pause-btn" title="Pause">⏸</button>
          <div class="timer-ring-wrap">
            <svg class="timer-ring" viewBox="0 0 46 46">
              <circle class="timer-ring-track" cx="23" cy="23" r="22"/>
              <circle class="timer-ring-fill ${timerClass}" cx="23" cy="23" r="22"
                stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
            </svg>
            <div class="timer-num">${state.timeLeft}</div>
          </div>
        </div>
      </div>

      <div class="question-zone" id="question-zone">
        <div class="combo-display ${state.combo>=3?'visible':''}" id="combo-display">
          ${state.combo>=3?`<span class="combo-num">×${state.combo}</span>${getComboMessage(state.combo)?.label||''}` : ''}
        </div>
        <div class="question-type-tag">${typeLabel}</div>
        <div class="question-text" id="question-text">
          ${q.display.replace('= ?','')}<span class="q-placeholder">= ?</span>
        </div>
        <div class="answer-zone">
          <input class="answer-input" id="answer-input"
            type="text" inputmode="numeric" pattern="[0-9]*"
            autocomplete="off" spellcheck="false" placeholder="…" autofocus/>
        </div>
      </div>

      <div class="q-strip">${dots}</div>

      <div class="mobile-answer-display" id="mobile-ans-display">
        <div class="ans-val" id="mobile-ans-val">_</div>
      </div>

      <div class="numpad" id="numpad">
        ${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="numpad-btn" data-num="${n}">${n}</button>`).join('')}
        <button class="numpad-btn del" id="np-del">⌫</button>
        <button class="numpad-btn zero" data-num="0">0</button>
        <button class="numpad-btn enter" id="np-enter">↵</button>
      </div>
    </div>`;
}

// =============================================
// RESULTS
// =============================================
function renderResults() {
  const r = state.results;
  if (!r) return '';
  const circumference = 283;
  const offset = circumference - (r.accuracy/100)*circumference;
  const gc = gradeColor(r.grade);

  const qRows = r.questions.map((q,i) => `
    <div class="q-row ${q.isCorrect?'':'q-row-wrong'}">
      <span class="q-idx">${i+1}</span>
      <span class="q-expr">${q.expr}</span>
      <span class="q-ans">${q.timedOut?'—':q.userAnswer} <span class="q-correct-ans">(${q.answer})</span></span>
      <span class="q-time">${q.timeTaken?((q.timeTaken/1000).toFixed(1)+'s'):'—'}</span>
      <span class="q-status">${q.timedOut?'⏱':q.isCorrect?'✅':'❌'}</span>
    </div>`).join('');

  // Type breakdown
  const types = [
    {key:'mult', label:'Multiply'},
    {key:'add',  label:'Addition'},
    {key:'sub',  label:'Subtract'},
    {key:'cross',label:'Mixed'},
  ];
  const typeBreakdown = types.map(t => {
    const bt = r.byType[t.key];
    if (!bt || bt.t===0) return '';
    const pct = Math.round((bt.c/bt.t)*100);
    return `
      <div class="type-row">
        <span class="type-lbl">${t.label}</span>
        <div class="type-bar-wrap"><div class="type-bar" style="width:${pct}%;background:${pct>=80?'var(--green)':pct>=60?'var(--amber)':'var(--red)'}"></div></div>
        <span class="type-pct">${pct}%</span>
        <span class="type-frac">${bt.c}/${bt.t}</span>
      </div>`;
  }).join('');

  return `
    <div class="results-screen">
      <div class="results-top">
        <div class="results-score-ring">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" stroke-width="7"/>
            <circle cx="50" cy="50" r="45" fill="none" stroke="${gc}" stroke-width="7"
              stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
              style="filter:drop-shadow(0 0 8px ${gc}55)"/>
          </svg>
          <div class="results-score-num">
            <span class="big" style="color:${gc}">${r.grade}</span>
            <span class="small">${r.finalScore}pts</span>
          </div>
        </div>
        <div class="results-header-text">
          <div class="results-title">${r.title}</div>
          <div class="results-sub">Tables ${state.selectedTables.join(' & ')}× &middot; ${new Date().toLocaleDateString()}</div>
          <div class="results-streak">
            <span class="streak-flame">${state.streak>=3?'🔥':'⚡'}</span>
            ${state.streak} day streak ${state.streak===state.streakBest && state.streak>1?'<span class="badge-new">Personal Best!</span>':''}
          </div>
        </div>
      </div>

      <div class="results-stats">
        <div class="result-stat"><span class="r-val" style="color:var(--green)">${r.correct}</span><span class="r-lbl">Correct</span></div>
        <div class="result-stat"><span class="r-val" style="color:var(--red)">${r.wrong}</span><span class="r-lbl">Wrong</span></div>
        <div class="result-stat"><span class="r-val" style="color:var(--amber)">${r.timeouts}</span><span class="r-lbl">Timeouts</span></div>
        <div class="result-stat"><span class="r-val" style="color:var(--blue)">${r.avgTime}s</span><span class="r-lbl">Avg Speed</span></div>
      </div>

      <div class="results-section">
        <div class="section-title">By Question Type</div>
        <div class="type-breakdown">${typeBreakdown}</div>
      </div>

      <div class="results-section">
        <div class="section-title">All Questions</div>
        <div class="q-breakdown">
          <div class="q-breakdown-header">
            <span>#</span><span>Question</span><span>Your Answer</span><span>Time</span><span></span>
          </div>
          <div class="q-list">${qRows}</div>
        </div>
      </div>

      <div class="results-actions">
        <button class="btn-retry" id="btn-retry">⚡ Same Tables Again</button>
        <button class="btn-new" id="btn-new">🔀 New Tables</button>
        <button class="btn-home" id="btn-home">← Home</button>
      </div>
    </div>`;
}

// =============================================
// HISTORY PAGE
// =============================================
function renderHistory() {
  const history = loadHistory();
  const filters = ['all','week','month'];
  const now = Date.now();
  const filtered = history.filter(s => {
    if (state.historyFilter==='week')  return now - new Date(s.date).getTime() < 7*86400000;
    if (state.historyFilter==='month') return now - new Date(s.date).getTime() < 30*86400000;
    return true;
  });

  if (!history.length) return `
    <div class="empty-page">
      <div class="empty-icon">📋</div>
      <div class="empty-title">No sessions yet</div>
      <div class="empty-sub">Complete your first session and it will appear here.</div>
    </div>`;

  const rows = filtered.map(s => `
    <div class="history-row">
      <div class="hr-date">
        <span class="hr-day">${new Date(s.date).toLocaleDateString('en',{day:'numeric',month:'short'})}</span>
        <span class="hr-time">${new Date(s.date).toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'})}</span>
      </div>
      <div class="hr-tables">${(s.tables||[]).join(' & ')}×</div>
      <div class="hr-grade" style="color:${gradeColor(s.grade)}">${s.grade}</div>
      <div class="hr-acc ${s.accuracy>=80?'green':s.accuracy>=60?'amber':'red'}">${s.accuracy}%</div>
      <div class="hr-score">${s.score}pts</div>
      <div class="hr-speed">${s.avgTime}s</div>
    </div>`).join('');

  return `
    <div class="history-page">
      <div class="page-header">
        <div class="page-title">Session History</div>
        <div class="filter-tabs">
          ${filters.map(f=>`<button class="filter-tab ${state.historyFilter===f?'active':''}" data-filter="${f}">${f.charAt(0).toUpperCase()+f.slice(1)}</button>`).join('')}
        </div>
      </div>
      <div class="history-table">
        <div class="history-header">
          <span>Date</span><span>Tables</span><span>Grade</span><span>Accuracy</span><span>Score</span><span>Avg Speed</span>
        </div>
        <div class="history-body">${rows || '<div class="no-data">No sessions in this period</div>'}</div>
      </div>
    </div>`;
}

// =============================================
// ANALYSIS DASHBOARD
// =============================================
function renderAnalysis() {
  const stats = getOverallStats();
  const days = getLast7Days();
  const wrongs = getTopWrongs(8);
  const tableData = loadTableData();
  const history = loadHistory();

  if (!stats) return `
    <div class="empty-page">
      <div class="empty-icon">📈</div>
      <div class="empty-title">No data yet</div>
      <div class="empty-sub">Complete at least one session to see your analysis.</div>
    </div>`;

  // Bar chart: last 7 days accuracy
  const maxAcc = 100;
  const barChart = days.map(d => `
    <div class="bar-col">
      <div class="bar-wrap">
        <div class="bar-fill ${d.avgAccuracy===null?'bar-empty':''}"
          style="height:${d.avgAccuracy!==null?d.avgAccuracy:0}%;background:${
            d.avgAccuracy===null?'var(--border)':
            d.avgAccuracy>=80?'var(--green)':
            d.avgAccuracy>=60?'var(--amber)':'var(--red)'
          }">
          ${d.avgAccuracy!==null?`<span class="bar-val">${d.avgAccuracy}%</span>`:''}
        </div>
      </div>
      <div class="bar-label">${d.label}</div>
      <div class="bar-sessions">${d.sessions>0?d.sessions+'s':''}</div>
    </div>`).join('');

  // Top tables practiced
  const topTables = Object.entries(tableData)
    .sort((a,b)=>b[1].sessions-a[1].sessions).slice(0,8);

  const tableCards = topTables.map(([num, t]) => {
    const mastered = t.masteryScore>=80 && t.sessions>=3;
    const acc = t.totalQ>0 ? Math.round((t.correct/t.totalQ)*100) : 0;
    return `
      <div class="table-card ${mastered?'mastered':''}">
        <div class="tc-num">${num}×</div>
        <div class="tc-ms-bar"><div class="tc-ms-fill" style="width:${t.masteryScore}%"></div></div>
        <div class="tc-stats">
          <span>${t.masteryScore}% mastery</span>
          <span>${t.sessions} sessions</span>
          <span>${acc}% accuracy</span>
        </div>
        ${mastered?'<div class="tc-badge">✓ Mastered</div>':''}
      </div>`;
  }).join('');

  // Wrong expressions
  const wrongsList = wrongs.length ? wrongs.map(w=>`
    <div class="wrong-row">
      <span class="wrong-expr">${w.expr}</span>
      <span class="wrong-count">${w.count}×</span>
      <div class="wrong-bar"><div class="wrong-fill" style="width:${Math.min(100,(w.count/wrongs[0].count)*100)}%"></div></div>
    </div>`).join('') : '<div class="no-data">No wrong answers tracked yet</div>';

  // Grade distribution from history
  const grades = {S:0,A:0,B:0,C:0,D:0,F:0};
  history.forEach(s=>{ const g=s.grade?.replace('+',''); if(grades[g]!==undefined) grades[g]++; });
  const totalGrades = Object.values(grades).reduce((a,b)=>a+b,0);
  const gradeDist = Object.entries(grades).filter(([,v])=>v>0).map(([g,v])=>`
    <div class="grade-bar-row">
      <span class="grade-lbl" style="color:${gradeColor(g)}">${g}</span>
      <div class="grade-bar-wrap"><div class="grade-bar-fill" style="width:${totalGrades?Math.round(v/totalGrades*100):0}%;background:${gradeColor(g)}"></div></div>
      <span class="grade-count">${v}</span>
    </div>`).join('');

  return `
    <div class="analysis-page">
      <div class="page-header">
        <div class="page-title">Your Analysis</div>
        <div class="page-sub">${stats.totalSessions} sessions · ${stats.totalQ.toLocaleString()} questions answered</div>
      </div>

      <!-- Overall KPIs -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-val" style="color:var(--green)">${stats.avgAccuracy}%</div>
          <div class="kpi-lbl">Avg Accuracy</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color:var(--amber)">${stats.bestScore}</div>
          <div class="kpi-lbl">Best Score</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val">${state.streakBest}</div>
          <div class="kpi-lbl">Best Streak</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color:var(--green)">${stats.masteredCount}</div>
          <div class="kpi-lbl">Tables Mastered</div>
        </div>
      </div>

      <!-- 7 day chart -->
      <div class="analysis-card">
        <div class="card-title">Last 7 Days — Accuracy</div>
        <div class="bar-chart">${barChart}</div>
      </div>

      <!-- Grade distribution -->
      <div class="analysis-card">
        <div class="card-title">Grade Distribution</div>
        <div class="grade-dist">${gradeDist}</div>
      </div>

      <!-- Table mastery -->
      <div class="analysis-card">
        <div class="card-title">Table Progress</div>
        ${topTables.length ? `<div class="table-cards">${tableCards}</div>` : '<div class="no-data">No tables practiced yet</div>'}
      </div>

      <!-- Top wrong answers -->
      <div class="analysis-card">
        <div class="card-title">⚠️ Weak Spots — Practice These</div>
        <div class="wrongs-list">${wrongsList}</div>
      </div>
    </div>`;
}

// =============================================
// COMING SOON
// =============================================
function renderComingSoon(label) {
  const icons = {Leaderboard:'🏆', Challenges:'⚔️', Stats:'📊'};
  const descriptions = {
    Leaderboard: 'Compete with friends and global players. See where you rank across all tables.',
    Challenges: 'Daily challenges, speed runs, no-mistake modes, and table-specific duels.',
    Stats: 'Deep per-table statistics, heatmaps, and spaced repetition insights.',
  };
  return `
    <div class="empty-page">
      <div class="empty-icon">${icons[label]||'🚀'}</div>
      <div class="empty-title">${label}</div>
      <div class="empty-sub">${descriptions[label]||'This feature is being built with the same obsession as the questions.'}</div>
      <div class="cs-tag">Coming Soon</div>
    </div>`;
}

// =============================================
// MODALS
// =============================================
function renderExitModal() {
  return `
    <div class="modal-overlay" id="exit-modal" style="display:none">
      <div class="modal">
        <div class="modal-icon">⚠️</div>
        <div class="modal-title">Exit Session?</div>
        <div class="modal-sub">You're on Q${state.currentQ+1} of 90. Progress will be lost.</div>
        <div class="modal-actions">
          <button class="modal-btn danger" id="exit-confirm">Yes, Exit</button>
          <button class="modal-btn" id="exit-cancel">Keep Going</button>
        </div>
      </div>
    </div>`;
}

function renderPauseModal() {
  return `
    <div class="modal-overlay" id="pause-modal" style="display:none">
      <div class="modal">
        <div class="modal-icon">⏸</div>
        <div class="modal-title">Paused</div>
        <div class="modal-sub">Q${state.currentQ+1}/90 · ${state.selectedTables.join(' & ')}× Tables</div>
        <div class="modal-actions">
          <button class="modal-btn primary" id="resume-btn">▶ Resume</button>
          <button class="modal-btn danger" id="pause-exit-btn">Exit Session</button>
        </div>
      </div>
    </div>`;
}

function renderStreakCelebration() {
  return `<div class="streak-celebrate" id="streak-celebrate" style="display:none">
    <div class="sc-inner">🔥 ${state.streak} Day Streak!</div>
  </div>`;
}

// =============================================
// SESSION ENGINE
// =============================================
function startCountdown(cb) {
  state.countdownActive = true;
  const page = document.getElementById('main-arena');
  if (!page) { cb(); return; }
  let count = 3;
  page.innerHTML = `<div class="countdown-screen"><div class="cd-num" id="cd-num">3</div><div class="cd-label">Get Ready</div></div>`;
  const interval = setInterval(() => {
    count--;
    const el = document.getElementById('cd-num');
    if (count > 0 && el) {
      el.textContent = count;
      el.style.animation = 'none'; el.offsetHeight; el.style.animation = '';
    } else {
      clearInterval(interval);
      state.countdownActive = false;
      cb();
    }
  }, 750);
}

function startSession() {
  if (state.selectedTables.length !== 2) return;
  const [t1, t2] = state.selectedTables;
  state.questions = generateSession(t1, t2);
  state.currentQ = 0;
  state.combo = 0;
  state.pendingInput = '';
  state.page = 'session';
  state.paused = false;
  closeAllModals();

  // Update navbar
  const navbar = document.querySelector('.navbar');
  if (navbar) navbar.outerHTML = renderNavbar();

  // 3-2-1 countdown then start
  state.sessionStarted = false;
  const arena = document.getElementById('main-arena');
  if (arena) {
    arena.innerHTML = renderSession();
    bindSessionEvents();
  }
  startCountdown(() => {
    state.sessionStarted = true;
    updateSessionUI();
    focusInput();
    if (state.sound) sounds.sessionStart();
    startTimer();
  });
}

function startTimer() {
  clearInterval(state.timer);
  state.timeLeft = QUESTION_TIME;
  updateTimerUI();
  state.timer = setInterval(() => {
    if (state.paused) return;
    state.timeLeft--;
    updateTimerUI();
    if (state.timeLeft <= 3 && state.timeLeft > 0 && state.sound) sounds.tick();
    if (state.timeLeft <= 0) onTimeout();
  }, 1000);
}

function onTimeout() {
  clearInterval(state.timer);
  const q = state.questions[state.currentQ];
  q.timedOut = true; q.isCorrect = false; q.timeTaken = QUESTION_TIME * 1000;
  state.combo = 0;
  if (state.sound) sounds.timeout();
  if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
  flashInput('timeout');
  updateMobileAns('timeout');
  setTimeout(advanceQuestion, 700);
}

function submitAnswer() {
  if (!state.sessionStarted || state.paused) return;
  const input = document.getElementById('answer-input');
  const rawVal = input ? input.value.trim() : state.pendingInput.trim();
  const val = parseInt(rawVal, 10);
  if (isNaN(val) || rawVal === '') return;

  clearInterval(state.timer);
  const q = state.questions[state.currentQ];
  q.userAnswer = val;
  q.timeTaken  = (QUESTION_TIME - state.timeLeft) * 1000;
  q.isCorrect  = (val === q.answer);

  if (q.isCorrect) {
    state.combo++;
    if (state.sound) sounds.correct();
    if (state.combo >= 3 && state.sound) sounds.combo();
    if (navigator.vibrate) navigator.vibrate(30);
    flashInput('correct'); updateMobileAns('correct');
  } else {
    state.combo = 0;
    if (state.sound) sounds.wrong();
    if (navigator.vibrate) navigator.vibrate([60, 30, 60]);
    flashInput('wrong'); updateMobileAns('wrong');
  }
  setTimeout(advanceQuestion, 400);
}

function advanceQuestion() {
  state.currentQ++;
  state.pendingInput = '';
  if (state.currentQ >= TOTAL_QUESTIONS) { endSession(); return; }
  updateSessionUI();
  focusInput();
  startTimer();
}

function endSession() {
  clearInterval(state.timer);
  const score = scoreSession(state.questions);
  score.tables = state.selectedTables;
  score.totalTimeMs = state.questions.reduce((s,q)=>s+(q.timeTaken||0),0);
  state.results = score;

  saveSessionResult(score);
  const streakData = loadStreak();
  state.streak = streakData.count;
  state.streakBest = streakData.best;

  if (state.sound) sounds.sessionEnd();
  state.page = 'results';
  renderApp();

  // Streak celebration
  if (state.streak >= 3) {
    const sc = document.getElementById('streak-celebrate');
    if (sc) { sc.style.display='flex'; setTimeout(()=>{sc.style.display='none';},3000); }
  }
}

function pauseSession() {
  if (!state.sessionStarted) return;
  state.paused = true;
  const modal = document.getElementById('pause-modal');
  if (modal) {
    modal.querySelector('.modal-sub').textContent = `Q${state.currentQ+1}/90 · ${state.selectedTables.join(' & ')}× Tables`;
    modal.style.display = 'flex';
  }
}

function resumeSession() {
  state.paused = false;
  const modal = document.getElementById('pause-modal');
  if (modal) modal.style.display = 'none';
  focusInput();
}

function exitSession() {
  clearInterval(state.timer);
  state.page = 'home';
  state.questions = [];
  state.currentQ = 0;
  state.sessionStarted = false;
  state.paused = false;
  closeAllModals();
  renderApp();
}

function closeAllModals() {
  ['exit-modal','pause-modal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

// =============================================
// ONBOARDING
// =============================================
function showOnboarding() {
  const el = document.createElement('div');
  el.id = 'onboarding';
  el.className = 'modal-overlay';
  el.style.display = 'flex';
  el.innerHTML = `
    <div class="modal" style="max-width:360px">
      <div class="modal-icon">∞</div>
      <div class="modal-title">Welcome!</div>
      <div class="modal-sub" style="text-align:left;line-height:1.8">
        <b>How it works:</b><br>
        1. Pick <b>any 2 tables</b> from the left panel<br>
        2. Answer <b>90 questions</b> — 10 seconds each<br>
        3. Build mastery over time — <b>no day limits!</b><br><br>
        Green cells = mastered tables (3+ sessions, 80%+ accuracy).
      </div>
      <div class="modal-actions">
        <button class="modal-btn primary" onclick="document.getElementById('onboarding').remove()">Let's Go ⚡</button>
      </div>
    </div>`;
  document.body.appendChild(el);
}

// =============================================
// UI UPDATES
// =============================================
function updateSessionUI() {
  const q = state.questions[state.currentQ];
  if (!q) return;

  const qt = document.getElementById('question-text');
  if (qt) {
    qt.innerHTML = `${q.display.replace('= ?','')}<span class="q-placeholder">= ?</span>`;
    qt.style.animation = 'none'; qt.offsetHeight; qt.style.animation = '';
  }

  const input = document.getElementById('answer-input');
  if (input) { input.value = ''; input.className = 'answer-input'; }

  const mAns = document.getElementById('mobile-ans-val');
  if (mAns) { mAns.textContent = '_'; mAns.className = 'ans-val'; }

  const fill = document.querySelector('.session-progress-fill');
  if (fill) fill.style.width = `${(state.currentQ/TOTAL_QUESTIONS)*100}%`;

  document.querySelectorAll('.q-dot').forEach((dot,i) => {
    const sq = state.questions[i];
    dot.className = 'q-dot' +
      (i===state.currentQ?' active':'') +
      (sq.isCorrect===true?' correct':'') +
      (sq.timedOut?' timeout':'') +
      (sq.isCorrect===false&&!sq.timedOut?' wrong':'');
  });

  const chips = document.querySelectorAll('.meta-chip .val');
  if (chips[0]) chips[0].textContent = `${state.currentQ+1}/${TOTAL_QUESTIONS}`;
  const correct = state.questions.filter(q=>q.isCorrect===true).length;
  const wrong   = state.questions.filter(q=>q.isCorrect===false||q.timedOut).length;
  if (chips[1]) chips[1].textContent = correct;
  if (chips[2]) chips[2].textContent = wrong;
  if (chips[3]) chips[3].textContent = state.currentQ>0?Math.round((correct/state.currentQ)*100)+'%':'100%';

  const combo = document.getElementById('combo-display');
  if (combo) {
    const msg = getComboMessage(state.combo);
    combo.className = `combo-display ${state.combo>=3?'visible':''}`;
    combo.innerHTML = state.combo>=3?`<span class="combo-num">×${state.combo}</span>${msg?.label||''}`:'';
  }

  const typeEl = document.querySelector('.question-type-tag');
  if (typeEl) typeEl.textContent = {mult:'✕ Multiply',add:'+ Add',sub:'− Subtract',cross:'⊕ Mixed'}[q.type]||'';

  // Pause modal sub text
  const pSub = document.querySelector('#pause-modal .modal-sub');
  if (pSub) pSub.textContent = `Q${state.currentQ+1}/90 · ${state.selectedTables.join(' & ')}× Tables`;

  // Exit modal sub
  const eSub = document.querySelector('#exit-modal .modal-sub');
  if (eSub) eSub.textContent = `You're on Q${state.currentQ+1} of 90. Progress will be lost.`;
}

function updateTimerUI() {
  const circumference = 138.2;
  const offset = circumference - (state.timeLeft/QUESTION_TIME)*circumference;
  const fill = document.querySelector('.timer-ring-fill');
  const num  = document.querySelector('.timer-num');
  if (fill) {
    fill.style.strokeDashoffset = offset;
    fill.className = 'timer-ring-fill' + (state.timeLeft<=3?' danger':state.timeLeft<=5?' warning':'');
  }
  if (num) num.textContent = state.timeLeft;
}

function flashInput(type) {
  const input = document.getElementById('answer-input');
  if (input) { input.className=`answer-input ${type}`; setTimeout(()=>{if(input)input.className='answer-input';},400); }
}

function updateMobileAns(type) {
  const el = document.getElementById('mobile-ans-val');
  if (el) { el.className=`ans-val ${type}`; setTimeout(()=>{if(el)el.className='ans-val';},400); }
}

function focusInput() {
  if (!state.isMobile) {
    const input = document.getElementById('answer-input');
    if (input) { input.focus(); input.select(); }
  }
}

// =============================================
// EVENTS
// =============================================
function bindGlobalEvents() {
  window.addEventListener('resize', () => { state.isMobile = window.innerWidth <= 768; });

  // Block browser back mid-session
  window.addEventListener('popstate', (e) => {
    if (state.page==='session' && state.sessionStarted) {
      e.preventDefault();
      document.getElementById('exit-modal').style.display = 'flex';
      history.pushState(null,'','');
    }
  });
  history.pushState(null,'','');

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (state.page!=='session' || !state.sessionStarted) return;
    if (e.key==='Escape') { pauseSession(); return; }
    if (e.key==='Enter') { submitAnswer(); return; }
    // Block non-numeric except backspace
    if (!/^\d$/.test(e.key) && e.key!=='Backspace') e.preventDefault();
  });
}

function bindEvents() {
  // Navbar navigation
  document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.page==='session' && state.sessionStarted) {
        const modal = document.getElementById('exit-modal');
        if (modal) { modal.style.display='flex'; }
        // Store pending page
        state._pendingPage = btn.dataset.page;
        return;
      }
      navigateTo(btn.dataset.page, btn.dataset.label);
    });
  });

  // Sound toggle
  const soundBtn = document.getElementById('sound-toggle');
  if (soundBtn) soundBtn.addEventListener('click', () => {
    state.sound = !state.sound;
    savePrefs({ sound: state.sound });
    soundBtn.textContent = state.sound ? '🔊' : '🔇';
  });

  // Mobile menu
  const mobileBtn = document.getElementById('mobile-menu-btn');
  if (mobileBtn) mobileBtn.addEventListener('click', () => {
    state.panelOpen = !state.panelOpen;
    const panel = document.getElementById('side-panel');
    const overlay = document.getElementById('panel-overlay');
    if (panel) panel.classList.toggle('open', state.panelOpen);
    if (overlay) overlay.classList.toggle('show', state.panelOpen);
  });

  // Overlay close
  const overlay = document.getElementById('panel-overlay');
  if (overlay) overlay.addEventListener('click', closePanelOverlay);

  // Table cells
  document.querySelectorAll('.table-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      const num = parseInt(cell.dataset.table, 10);
      const idx = state.selectedTables.indexOf(num);
      if (idx>=0) state.selectedTables.splice(idx,1);
      else {
        if (state.selectedTables.length>=2) state.selectedTables.shift();
        state.selectedTables.push(num);
      }
      updateSidePanel();
      // Also update home hint
      if (state.page==='home') updateMainContent();
    });
  });

  // Start button
  const startBtn = document.getElementById('btn-start');
  if (startBtn) startBtn.addEventListener('click', () => {
    if (state.selectedTables.length===2) { closePanelOverlay(); startSession(); }
  });

  // Session events
  bindSessionEvents();

  // Results
  const retryBtn = document.getElementById('btn-retry');
  if (retryBtn) retryBtn.addEventListener('click', () => startSession());

  const newBtn = document.getElementById('btn-new');
  if (newBtn) newBtn.addEventListener('click', () => {
    state.selectedTables = [];
    state.page = 'home';
    state.results = null;
    renderApp();
  });

  const homeBtn = document.getElementById('btn-home');
  if (homeBtn) homeBtn.addEventListener('click', () => {
    state.page = 'home'; state.results = null;
    updateMainContent(); updateNavActive();
  });

  // History filters
  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      state.historyFilter = btn.dataset.filter;
      updateMainContent();
    });
  });

  // Exit modal
  const exitConfirm = document.getElementById('exit-confirm');
  if (exitConfirm) exitConfirm.addEventListener('click', () => {
    exitSession();
    if (state._pendingPage) { navigateTo(state._pendingPage); state._pendingPage=null; }
  });

  const exitCancel = document.getElementById('exit-cancel');
  if (exitCancel) exitCancel.addEventListener('click', closeAllModals);

  // Pause modal
  const resumeBtn = document.getElementById('resume-btn');
  if (resumeBtn) resumeBtn.addEventListener('click', resumeSession);

  const pauseExitBtn = document.getElementById('pause-exit-btn');
  if (pauseExitBtn) pauseExitBtn.addEventListener('click', exitSession);
}

function bindSessionEvents() {
  const pauseBtn = document.getElementById('pause-btn');
  if (pauseBtn) pauseBtn.addEventListener('click', pauseSession);

  const answerInput = document.getElementById('answer-input');
  if (answerInput) {
    // Only allow numeric input
    answerInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g,'').slice(0,5);
    });
    answerInput.addEventListener('keydown', (e) => {
      if (e.key==='Enter') submitAnswer();
    });
  }

  // Numpad
  document.querySelectorAll('.numpad-btn[data-num]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.pendingInput = (state.pendingInput + btn.dataset.num).slice(0,5);
      const input = document.getElementById('answer-input');
      if (input) input.value = state.pendingInput;
      const mAns = document.getElementById('mobile-ans-val');
      if (mAns) mAns.textContent = state.pendingInput || '_';
    });
  });

  const npDel = document.getElementById('np-del');
  if (npDel) npDel.addEventListener('click', () => {
    state.pendingInput = state.pendingInput.slice(0,-1);
    const input = document.getElementById('answer-input');
    if (input) input.value = state.pendingInput;
    const mAns = document.getElementById('mobile-ans-val');
    if (mAns) mAns.textContent = state.pendingInput || '_';
  });

  const npEnter = document.getElementById('np-enter');
  if (npEnter) npEnter.addEventListener('click', submitAnswer);
}

// =============================================
// NAVIGATION HELPERS
// =============================================
function navigateTo(page, label) {
  if (page.startsWith('cs-') || page==='coming') {
    state.page = `cs-${label||page.replace('cs-','')}`;
  } else {
    state.page = page;
  }
  clearInterval(state.timer);
  updateMainContent();
  updateNavActive();
}

function closePanelOverlay() {
  state.panelOpen = false;
  const panel = document.getElementById('side-panel');
  const overlay = document.getElementById('panel-overlay');
  if (panel) panel.classList.remove('open');
  if (overlay) overlay.classList.remove('show');
}

function updateMainContent() {
  const arena = document.getElementById('main-arena');
  if (arena) arena.innerHTML = renderMainContent();
  bindEvents();
}

function updateNavActive() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page===state.page);
  });
  // Update navbar streak/today count
  const nb = document.querySelector('.navbar');
  if (nb) nb.outerHTML = renderNavbar();
  bindEvents();
}

function updateSidePanel() {
  const panel = document.getElementById('side-panel');
  if (!panel) return;
  panel.outerHTML = renderSidePanel();
  bindEvents();
}

// =============================================
// UTILITIES
// =============================================
function gradeColor(grade) {
  const g = (grade||'').replace('+','');
  return {S:'#00ff88',A:'#00ff88',B:'#4488ff',C:'#ffaa00',D:'#ff8844',F:'#ff4466'}[g]||'#888';
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  return `${Math.floor(diff/86400000)}d ago`;
}

// =============================================
// BOOT
// =============================================
init();
