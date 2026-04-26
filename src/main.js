// =============================================
// BEAUTY & THE MATHS — Main App
// =============================================
import { generateSession, scoreSession, getComboMessage } from './utils/questionGenerator.js';
import { loadStreak, loadLearnedTables, saveLearnedTables, saveSessionResult, getTodaySessionCount } from './utils/storage.js';
import { sounds } from './utils/sounds.js';

// =============================================
// STATE
// =============================================
const state = {
  page: 'home',        // home | session | results
  selectedTables: [],  // up to 2
  learnedTables: [],
  questions: [],
  currentQ: 0,
  results: null,
  timer: null,
  timeLeft: 10,
  combo: 0,
  streak: 0,
  isMobile: window.innerWidth <= 768,
  panelOpen: false,
  pendingInput: '',
};

const QUESTION_TIME = 10; // seconds per question
const TOTAL_QUESTIONS = 90;

// =============================================
// INIT
// =============================================
function init() {
  const streakData = loadStreak();
  state.streak = streakData.count;
  state.learnedTables = loadLearnedTables();

  renderApp();
  bindGlobalEvents();
}

// =============================================
// RENDER
// =============================================
function renderApp() {
  document.getElementById('app').innerHTML = `
    <div class="scan-line"></div>
    ${renderNavbar()}
    <div class="layout">
      ${renderSidePanel()}
      <main class="main-arena" id="main-arena">
        ${renderMainContent()}
      </main>
    </div>
  `;
  bindEvents();
}

function renderNavbar() {
  const todaySessions = getTodaySessionCount();
  return `
    <nav class="navbar">
      <button class="mobile-menu-btn" id="mobile-menu-btn">☰</button>
      <div class="navbar-logo">Beauty & The <span>Maths</span></div>
      <div class="navbar-nav">
        <button class="nav-item ${state.page !== 'coming' ? 'active' : ''}" data-page="home">Practice</button>
        <button class="nav-item" data-page="coming" data-label="Progress">Progress <span class="badge">Soon</span></button>
        <button class="nav-item" data-page="coming" data-label="Leaderboard">Leaderboard <span class="badge">Soon</span></button>
        <button class="nav-item" data-page="coming" data-label="Challenges">Challenges <span class="badge">Soon</span></button>
        <button class="nav-item" data-page="coming" data-label="Stats">Stats <span class="badge">Soon</span></button>
      </div>
      <div class="navbar-right">
        <div class="day-badge">Today <span>${todaySessions} session${todaySessions !== 1 ? 's' : ''}</span></div>
        <div class="streak-display">
          <span class="streak-flame">${state.streak >= 3 ? '🔥' : '⚡'}</span>
          <span class="streak-num">${state.streak}</span>
          <span class="streak-label">day streak</span>
        </div>
      </div>
    </nav>
  `;
}

function renderSidePanel() {
  const learnedSet = new Set(state.learnedTables);
  const selectedSet = new Set(state.selectedTables);
  const canStart = state.selectedTables.length === 2;

  let cells = '';
  for (let i = 2; i <= 100; i++) {
    const isLearned = learnedSet.has(i);
    const isSelected = selectedSet.has(i);
    let cls = 'table-cell';
    if (isLearned) cls += ' learned';
    if (isSelected) cls += ' selected';
    cells += `<div class="${cls}" data-table="${i}">${i}</div>`;
  }

  const [t1, t2] = state.selectedTables;

  return `
    <aside class="side-panel ${state.panelOpen ? 'open' : ''}" id="side-panel">
      <div class="panel-header">
        <div class="panel-title">Tables (2–100)</div>
        <div class="panel-subtitle">Select 2 tables you're practicing today. Mastered = green glow.</div>
      </div>
      <div class="panel-body">
        <div class="table-grid">${cells}</div>
      </div>
      <div class="panel-footer">
        <div class="selected-info">
          ${canStart
            ? `Today: <strong>${t1}×</strong> &amp; <strong>${t2}×</strong> — 90 questions`
            : `Select <strong>${2 - state.selectedTables.length}</strong> more table${state.selectedTables.length === 1 ? '' : 's'}`
          }
        </div>
        <button class="btn-start" id="btn-start" ${!canStart ? 'disabled' : ''}>
          ${canStart ? '⚡ Start Session' : 'Select 2 Tables'}
        </button>
      </div>
    </aside>
  `;
}

function renderMainContent() {
  switch (state.page) {
    case 'home':    return renderHome();
    case 'session': return renderSession();
    case 'results': return renderResults();
    case 'coming':  return renderComingSoon();
  }
}

function renderHome() {
  return `
    <div class="home-screen">
      <div class="home-title">Master Tables<br><span class="accent">2× Speed.</span></div>
      <p class="home-sub">Select 2 tables from the panel, then fire through 90 questions in 15 minutes. Each question — 10 seconds. No mercy.</p>
      <div class="home-stats">
        <div class="stat-chip"><span class="num">90</span><span class="lbl">Questions</span></div>
        <div class="stat-chip"><span class="num">10s</span><span class="lbl">Per Question</span></div>
        <div class="stat-chip"><span class="num">15</span><span class="lbl">Minutes</span></div>
        <div class="stat-chip"><span class="num">${state.learnedTables.length}</span><span class="lbl">Mastered</span></div>
      </div>
      <div class="hint-arrow">← Pick your 2 tables to begin</div>
    </div>
  `;
}

function renderSession() {
  const q = state.questions[state.currentQ];
  if (!q) return '';

  const progress = (state.currentQ / TOTAL_QUESTIONS) * 100;
  const circumference = 138.2;
  const offset = circumference - (state.timeLeft / QUESTION_TIME) * circumference;
  const timerClass = state.timeLeft <= 3 ? 'danger' : state.timeLeft <= 5 ? 'warning' : '';

  const dots = state.questions.map((sq, i) => {
    let cls = 'q-dot';
    if (i === state.currentQ) cls += ' active';
    else if (sq.isCorrect === true) cls += ' correct';
    else if (sq.timedOut) cls += ' timeout';
    else if (sq.isCorrect === false) cls += ' wrong';
    return `<div class="${cls}"></div>`;
  }).join('');

  const typeLabel = { mult: '✕ Multiplication', add: '+ Addition', sub: '− Subtraction', cross: '⊕ Mixed' }[q.type] || '';

  return `
    <div class="session-screen">
      <div class="session-progress-bar">
        <div class="session-progress-fill" style="width:${progress}%"></div>
      </div>

      <div class="session-header">
        <div class="session-meta">
          <div class="meta-chip green">
            <span>Q</span><span class="val">${state.currentQ + 1}/${TOTAL_QUESTIONS}</span>
          </div>
          <div class="meta-chip">
            <span>✓</span>
            <span class="val">${state.questions.filter(q=>q.isCorrect).length}</span>
          </div>
          <div class="meta-chip red">
            <span>✗</span>
            <span class="val">${state.questions.filter(q=>q.isCorrect===false||q.timedOut).length}</span>
          </div>
          <div class="meta-chip amber">
            <span>Tables</span>
            <span class="val">${state.selectedTables.join(' & ')}×</span>
          </div>
        </div>

        <div class="timer-ring-wrap">
          <svg class="timer-ring" viewBox="0 0 46 46">
            <circle class="timer-ring-track" cx="23" cy="23" r="22"/>
            <circle class="timer-ring-fill ${timerClass}"
              cx="23" cy="23" r="22"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${offset}"/>
          </svg>
          <div class="timer-num">${state.timeLeft}</div>
        </div>
      </div>

      <div class="question-zone" id="question-zone">
        <div class="combo-display ${state.combo >= 3 ? 'visible' : ''}" id="combo-display">
          ${state.combo >= 3 ? `<span class="combo-num">×${state.combo}</span>${getComboMessage(state.combo)?.label || ''}` : ''}
        </div>
        <div class="question-type-tag">${typeLabel}</div>
        <div class="question-text" id="question-text">${q.display.replace('= ?', '')}<span style="color:var(--text-3)">= ?</span></div>
        <div class="answer-zone">
          <div class="answer-input-wrap">
            <input
              class="answer-input"
              id="answer-input"
              type="number"
              inputmode="numeric"
              autocomplete="off"
              placeholder="…"
              autofocus
            />
          </div>
        </div>
      </div>

      <div class="q-strip">${dots}</div>

      <!-- Mobile numpad -->
      <div class="numpad" id="numpad">
        ${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="numpad-btn" data-num="${n}">${n}</button>`).join('')}
        <button class="numpad-btn del" id="np-del">⌫</button>
        <button class="numpad-btn zero" data-num="0">0</button>
        <button class="numpad-btn enter" id="np-enter">↵</button>
      </div>
    </div>
  `;
}

function renderResults() {
  const r = state.results;
  if (!r) return '';

  const circumference = 283;
  const offset = circumference - (r.accuracy / 100) * circumference;
  const gradeColor = { 'S+': '#00ff88', A: '#00ff88', B: '#4488ff', C: '#ffaa00', D: '#ff8844', F: '#ff4466' }[r.grade] || '#888';

  const qRows = r.questions.map((q, i) => `
    <div class="q-row">
      <span class="q-idx">${i + 1}</span>
      <span class="q-expr">${q.expr}</span>
      <span class="q-ans">${q.timedOut ? `—` : `${q.userAnswer}`} <span style="color:var(--text-3);font-size:11px">(${q.answer})</span></span>
      <span class="q-status">${q.timedOut ? '⏱' : q.isCorrect ? '✅' : '❌'}</span>
    </div>
  `).join('');

  return `
    <div class="results-screen">
      <div class="results-header">
        <div class="results-score-ring">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" stroke-width="6"/>
            <circle cx="50" cy="50" r="45" fill="none"
              stroke="${gradeColor}" stroke-width="6"
              stroke-linecap="round"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${offset}"
              style="filter: drop-shadow(0 0 8px ${gradeColor}55)"/>
          </svg>
          <div class="results-score-num">
            <span class="big" style="color:${gradeColor}">${r.grade}</span>
            <span class="small">${r.finalScore}pts</span>
          </div>
        </div>
        <div class="results-title">${r.title}</div>
        <div class="results-sub">Tables ${state.selectedTables.join(' & ')}× · ${new Date().toLocaleDateString()}</div>
      </div>

      <div class="results-stats">
        <div class="result-stat">
          <span class="r-val" style="color:var(--green)">${r.correct}</span>
          <span class="r-lbl">Correct</span>
        </div>
        <div class="result-stat">
          <span class="r-val" style="color:var(--red)">${r.wrong}</span>
          <span class="r-lbl">Wrong</span>
        </div>
        <div class="result-stat">
          <span class="r-val" style="color:var(--amber)">${r.timeouts}</span>
          <span class="r-lbl">Timeouts</span>
        </div>
        <div class="result-stat">
          <span class="r-val" style="color:var(--blue)">${r.avgTime}s</span>
          <span class="r-lbl">Avg Speed</span>
        </div>
      </div>

      <div class="q-breakdown">
        <div class="q-breakdown-header">Question Breakdown</div>
        <div class="q-list">${qRows}</div>
      </div>

      <div class="results-actions">
        <button class="btn-retry" id="btn-retry">⚡ Go Again</button>
        <button class="btn-home" id="btn-home">← Home</button>
      </div>
    </div>
  `;
}

function renderComingSoon() {
  const labels = { Progress:'📈', Leaderboard:'🏆', Challenges:'⚔️', Stats:'📊' };
  const label = state.comingLabel || 'Feature';
  return `
    <div class="coming-soon-page">
      <div class="cs-icon">${labels[label] || '🚀'}</div>
      <div class="cs-title">${label}</div>
      <div class="cs-sub">This feature is being crafted with the same obsession as the questions. Coming soon.</div>
    </div>
  `;
}

// =============================================
// SESSION ENGINE
// =============================================
function startSession() {
  if (state.selectedTables.length !== 2) return;
  const [t1, t2] = state.selectedTables;
  state.questions = generateSession(t1, t2);
  state.currentQ = 0;
  state.combo = 0;
  state.page = 'session';
  renderApp();
  setTimeout(() => {
    sounds.sessionStart();
    focusInput();
    startTimer();
  }, 100);
}

function startTimer() {
  clearInterval(state.timer);
  state.timeLeft = QUESTION_TIME;
  updateTimerUI();

  state.timer = setInterval(() => {
    state.timeLeft--;
    updateTimerUI();

    if (state.timeLeft <= 3 && state.timeLeft > 0) {
      sounds.tick();
    }

    if (state.timeLeft <= 0) {
      onTimeout();
    }
  }, 1000);
}

function onTimeout() {
  clearInterval(state.timer);
  const q = state.questions[state.currentQ];
  q.timedOut = true;
  q.isCorrect = false;
  q.timeTaken = QUESTION_TIME * 1000;
  state.combo = 0;
  sounds.timeout();
  flashInput('timeout');
  setTimeout(advanceQuestion, 600);
}

function submitAnswer() {
  const input = document.getElementById('answer-input');
  const val = input ? parseInt(input.value || state.pendingInput, 10) : parseInt(state.pendingInput, 10);
  if (isNaN(val)) return;

  clearInterval(state.timer);
  const q = state.questions[state.currentQ];
  const timeTaken = (QUESTION_TIME - state.timeLeft) * 1000;
  q.userAnswer = val;
  q.timeTaken = timeTaken;
  q.isCorrect = val === q.answer;

  if (q.isCorrect) {
    state.combo++;
    sounds.correct();
    if (state.combo >= 3) sounds.combo();
    flashInput('correct');
  } else {
    state.combo = 0;
    sounds.wrong();
    flashInput('wrong');
  }

  setTimeout(advanceQuestion, 350);
}

function advanceQuestion() {
  state.currentQ++;

  if (state.currentQ >= TOTAL_QUESTIONS) {
    endSession();
    return;
  }

  state.pendingInput = '';
  updateSessionUI();
  focusInput();
  startTimer();
}

function endSession() {
  const score = scoreSession(state.questions);
  score.tables = state.selectedTables;
  state.results = score;

  // Mark tables as learned
  const newLearned = new Set([...state.learnedTables, ...state.selectedTables]);
  state.learnedTables = [...newLearned];
  saveLearnedTables(state.learnedTables);
  saveSessionResult(score);

  state.streak = loadStreak().count;
  sounds.sessionEnd();
  state.page = 'results';
  renderApp();
}

// =============================================
// UI UPDATES (partial — avoid full re-render)
// =============================================
function updateSessionUI() {
  const q = state.questions[state.currentQ];
  if (!q) return;

  // Question text
  const qt = document.getElementById('question-text');
  if (qt) {
    qt.innerHTML = `${q.display.replace('= ?', '')}<span style="color:var(--text-3)">= ?</span>`;
    qt.style.animation = 'none';
    qt.offsetHeight; // reflow
    qt.style.animation = '';
  }

  // Clear input
  const input = document.getElementById('answer-input');
  if (input) { input.value = ''; input.className = 'answer-input'; }

  // Progress
  const fill = document.querySelector('.session-progress-fill');
  if (fill) fill.style.width = `${(state.currentQ / TOTAL_QUESTIONS) * 100}%`;

  // q strip dots
  const dots = document.querySelectorAll('.q-dot');
  dots.forEach((dot, i) => {
    const sq = state.questions[i];
    dot.className = 'q-dot' +
      (i === state.currentQ ? ' active' : '') +
      (sq.isCorrect === true ? ' correct' : '') +
      (sq.timedOut ? ' timeout' : '') +
      (sq.isCorrect === false && !sq.timedOut ? ' wrong' : '');
  });

  // Meta chips
  const metaChips = document.querySelectorAll('.meta-chip .val');
  if (metaChips[0]) metaChips[0].textContent = `${state.currentQ + 1}/${TOTAL_QUESTIONS}`;
  if (metaChips[1]) metaChips[1].textContent = state.questions.filter(q=>q.isCorrect).length;
  if (metaChips[2]) metaChips[2].textContent = state.questions.filter(q=>q.isCorrect===false||q.timedOut).length;

  // Combo
  const combo = document.getElementById('combo-display');
  if (combo) {
    const msg = getComboMessage(state.combo);
    if (msg && state.combo >= 3) {
      combo.className = 'combo-display visible';
      combo.innerHTML = `<span class="combo-num">×${state.combo}</span>${msg.label}`;
    } else {
      combo.className = 'combo-display';
    }
  }

  // Type tag
  const typeEl = document.querySelector('.question-type-tag');
  if (typeEl) {
    const typeLabel = { mult: '✕ Multiplication', add: '+ Addition', sub: '− Subtraction', cross: '⊕ Mixed' }[q.type] || '';
    typeEl.textContent = typeLabel;
  }
}

function updateTimerUI() {
  const circumference = 138.2;
  const offset = circumference - (state.timeLeft / QUESTION_TIME) * circumference;
  const fill = document.querySelector('.timer-ring-fill');
  const num = document.querySelector('.timer-num');

  if (fill) {
    fill.style.strokeDashoffset = offset;
    fill.className = 'timer-ring-fill' +
      (state.timeLeft <= 3 ? ' danger' : state.timeLeft <= 5 ? ' warning' : '');
  }
  if (num) num.textContent = state.timeLeft;
}

function flashInput(type) {
  const input = document.getElementById('answer-input');
  if (!input) return;
  input.className = `answer-input ${type}`;
  setTimeout(() => {
    if (input) input.className = 'answer-input';
  }, 350);
}

function focusInput() {
  if (!state.isMobile) {
    const input = document.getElementById('answer-input');
    if (input) input.focus();
  }
}

// =============================================
// EVENTS
// =============================================
function bindGlobalEvents() {
  window.addEventListener('resize', () => {
    state.isMobile = window.innerWidth <= 768;
  });

  document.addEventListener('keydown', (e) => {
    if (state.page !== 'session') return;
    if (e.key === 'Enter') submitAnswer();
  });
}

function bindEvents() {
  // Navbar page navigation
  document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      if (page === 'coming') {
        state.comingLabel = btn.dataset.label;
        state.page = 'coming';
      } else {
        state.page = page;
      }
      if (state.page !== 'session') clearInterval(state.timer);
      updateMainContent();
      updateNavActive();
    });
  });

  // Mobile menu
  const mobileBtn = document.getElementById('mobile-menu-btn');
  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
      state.panelOpen = !state.panelOpen;
      const panel = document.getElementById('side-panel');
      if (panel) panel.classList.toggle('open', state.panelOpen);
    });
  }

  // Table cells
  document.querySelectorAll('.table-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      const num = parseInt(cell.dataset.table, 10);
      const idx = state.selectedTables.indexOf(num);

      if (idx >= 0) {
        state.selectedTables.splice(idx, 1);
      } else {
        if (state.selectedTables.length >= 2) state.selectedTables.shift();
        state.selectedTables.push(num);
      }

      updateSidePanel();
    });
  });

  // Start button
  const startBtn = document.getElementById('btn-start');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (state.selectedTables.length === 2) {
        state.panelOpen = false;
        startSession();
      }
    });
  }

  // Answer input
  const answerInput = document.getElementById('answer-input');
  if (answerInput) {
    answerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitAnswer();
    });
  }

  // Mobile numpad
  document.querySelectorAll('.numpad-btn[data-num]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.pendingInput = (state.pendingInput + btn.dataset.num).slice(0, 5);
      const input = document.getElementById('answer-input');
      if (input) input.value = state.pendingInput;
    });
  });

  const npDel = document.getElementById('np-del');
  if (npDel) {
    npDel.addEventListener('click', () => {
      state.pendingInput = state.pendingInput.slice(0, -1);
      const input = document.getElementById('answer-input');
      if (input) input.value = state.pendingInput;
    });
  }

  const npEnter = document.getElementById('np-enter');
  if (npEnter) npEnter.addEventListener('click', submitAnswer);

  // Results actions
  const retryBtn = document.getElementById('btn-retry');
  if (retryBtn) retryBtn.addEventListener('click', () => {
    state.page = 'home';
    state.results = null;
    updateMainContent();
    startSession();
  });

  const homeBtn = document.getElementById('btn-home');
  if (homeBtn) homeBtn.addEventListener('click', () => {
    state.page = 'home';
    state.results = null;
    updateMainContent();
    updateNavActive();
  });
}

function updateMainContent() {
  const arena = document.getElementById('main-arena');
  if (arena) arena.innerHTML = renderMainContent();
  bindEvents();
}

function updateNavActive() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === state.page);
  });
}

function updateSidePanel() {
  const panel = document.getElementById('side-panel');
  if (!panel) return;
  panel.outerHTML = renderSidePanel();
  // Re-bind (outerHTML replaces node)
  bindEvents();
}

// =============================================
// BOOT
// =============================================
init();
