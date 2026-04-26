// =============================================
// BEAUTY & THE MATHS — Question Generator
// Core algorithm for 90-question sessions
// =============================================

/**
 * Session structure:
 *  - 50 questions: products of selected 2 tables (multiplication)
 *  - 40 questions: mixed addition, subtraction, AND cross-products
 *
 * Weights ensure even coverage and no boring repetition.
 * Fisher-Yates shuffle used throughout.
 */

const TABLES_RANGE = [2, 100];
const MULT_RANGE = [1, 12]; // multiplier range per table

// ---- Utilities ----
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---- Question factories ----

/** Multiplication: tableNum × n */
function makeMultQ(tableNum, n) {
  const ans = tableNum * n;
  return {
    type: 'mult',
    expr: `${tableNum} × ${n}`,
    a: tableNum, op: '×', b: n,
    answer: ans,
    display: `${tableNum} × ${n} = ?`,
    tableTag: `${tableNum}×`,
  };
}

/** Addition within a table context: e.g. tableNum×a + tableNum×b simplified, or plain */
function makeAddQ(maxVal = 200) {
  const a = randInt(2, maxVal);
  const b = randInt(2, maxVal);
  return {
    type: 'add',
    expr: `${a} + ${b}`,
    a, op: '+', b,
    answer: a + b,
    display: `${a} + ${b} = ?`,
    tableTag: null,
  };
}

/** Subtraction (always positive result) */
function makeSubQ(maxVal = 200) {
  let a = randInt(2, maxVal);
  let b = randInt(2, maxVal);
  if (b > a) [a, b] = [b, a];
  return {
    type: 'sub',
    expr: `${a} − ${b}`,
    a, op: '−', b,
    answer: a - b,
    display: `${a} − ${b} = ?`,
    tableTag: null,
  };
}

/** Cross-product: t1 × n + t2 × m style (bonus complexity) */
function makeCrossQ(t1, t2) {
  const n = randInt(1, 12);
  const m = randInt(1, 12);
  const a = t1 * n;
  const b = t2 * m;
  const ops = ['+', '−'];
  const op = ops[randInt(0, 1)];
  const answer = op === '+' ? a + b : Math.abs(a - b);
  const expr = op === '+' ? `${a} + ${b}` : `${Math.max(a,b)} − ${Math.min(a,b)}`;
  return {
    type: 'cross',
    expr,
    a: op === '+' ? a : Math.max(a,b),
    op,
    b: op === '+' ? b : Math.min(a,b),
    answer,
    display: expr + ' = ?',
    tableTag: `${t1}×+${t2}×`,
  };
}

// =============================================
// MAIN GENERATOR
// =============================================

/**
 * generateSession(t1, t2)
 * Returns array of 90 question objects.
 *
 * Breakdown:
 *   Block A (50q): pure multiplication of t1 and t2
 *     - 25 from t1 (all 12 multiples + 13 random re-hits weighted to hard ones)
 *     - 25 from t2 (same)
 *   Block B (40q): mixed
 *     - 12 addition
 *     - 12 subtraction
 *     - 16 cross/mixed involving t1 and t2
 */
export function generateSession(t1, t2) {
  const questions = [];

  // ---- Block A: 50 multiplication ----
  // All 12 standard multiples for each table, then fill to 25 with hard ones (7-12)
  function multBlock(tNum, count) {
    const pool = [];
    // All 12 first
    for (let n = 1; n <= 12; n++) pool.push(makeMultQ(tNum, n));
    shuffle(pool);

    // Fill remaining with harder multipliers (7-12 weighted)
    const hardPool = [];
    for (let extra = 0; extra < count - 12; extra++) {
      hardPool.push(makeMultQ(tNum, randInt(7, 12)));
    }
    return shuffle([...pool, ...hardPool]).slice(0, count);
  }

  const blockA = shuffle([...multBlock(t1, 25), ...multBlock(t2, 25)]);
  questions.push(...blockA);

  // ---- Block B: 40 mixed ----
  const blockB = [];

  // 12 addition
  for (let i = 0; i < 12; i++) {
    // Mix: some involve multiples of tables
    if (i < 6) {
      // plain addition up to ~200
      blockB.push(makeAddQ(150));
    } else {
      // addition using table products
      const n1 = randInt(1, 12), n2 = randInt(1, 12);
      const a = t1 * n1, b = t2 * n2;
      blockB.push({
        type: 'add', expr: `${a} + ${b}`,
        a, op: '+', b, answer: a + b,
        display: `${a} + ${b} = ?`, tableTag: `${t1}×${t2}×`
      });
    }
  }

  // 12 subtraction
  for (let i = 0; i < 12; i++) {
    if (i < 6) {
      blockB.push(makeSubQ(150));
    } else {
      const n1 = randInt(1, 12), n2 = randInt(1, 12);
      const raw = [t1 * n1, t2 * n2];
      raw.sort((a, b) => b - a);
      blockB.push({
        type: 'sub', expr: `${raw[0]} − ${raw[1]}`,
        a: raw[0], op: '−', b: raw[1], answer: raw[0] - raw[1],
        display: `${raw[0]} − ${raw[1]} = ?`, tableTag: `${t1}×${t2}×`
      });
    }
  }

  // 16 cross/mixed
  for (let i = 0; i < 16; i++) {
    blockB.push(makeCrossQ(t1, t2));
  }

  questions.push(...shuffle(blockB));

  // Final: tag each with index and blank user fields
  return questions.map((q, i) => ({
    ...q,
    index: i,
    userAnswer: null,
    isCorrect: null,
    timeTaken: null,
    timedOut: false,
  }));
}

/**
 * scoreSession(questions)
 * Returns score object with full analytics.
 */
export function scoreSession(questions) {
  const total = questions.length;
  let correct = 0, wrong = 0, timeouts = 0;
  let totalTime = 0;
  const byType = { mult: { c: 0, t: 0 }, add: { c: 0, t: 0 }, sub: { c: 0, t: 0 }, cross: { c: 0, t: 0 } };

  questions.forEach(q => {
    if (q.timedOut) {
      timeouts++;
    } else if (q.isCorrect) {
      correct++;
    } else {
      wrong++;
    }
    if (q.timeTaken != null) totalTime += q.timeTaken;
    const bt = byType[q.type] || { c: 0, t: 0 };
    bt.t++;
    if (q.isCorrect) bt.c++;
    byType[q.type] = bt;
  });

  const accuracy = Math.round((correct / total) * 100);
  const avgTime = totalTime > 0 ? (totalTime / total / 1000).toFixed(1) : '--';

  // Score: 100 base * accuracy * speed bonus
  const speedBonus = avgTime !== '--' ? Math.max(1, (10 - parseFloat(avgTime)) / 10) : 1;
  const finalScore = Math.round(accuracy * speedBonus);

  let grade = 'F';
  if (finalScore >= 95) grade = 'S+';
  else if (finalScore >= 85) grade = 'A';
  else if (finalScore >= 70) grade = 'B';
  else if (finalScore >= 55) grade = 'C';
  else if (finalScore >= 40) grade = 'D';

  let title = 'Keep Going';
  if (grade === 'S+') title = 'LIGHTNING MASTER ⚡';
  else if (grade === 'A') title = 'Sharp & Fast 🎯';
  else if (grade === 'B') title = 'Good Momentum 💪';
  else if (grade === 'C') title = 'Building Up ⚙️';
  else title = 'Rise Tomorrow 🌅';

  return {
    total, correct, wrong, timeouts,
    accuracy, avgTime, finalScore, grade, title,
    byType,
    questions,
  };
}

/**
 * getComboMessage(streak)
 * Returns motivational text for combo streaks.
 */
export function getComboMessage(streak) {
  if (streak >= 10) return { label: 'UNSTOPPABLE', emoji: '⚡' };
  if (streak >= 7)  return { label: 'ON FIRE',     emoji: '🔥' };
  if (streak >= 5)  return { label: 'COMBO',       emoji: '✨' };
  if (streak >= 3)  return { label: 'STREAK',      emoji: '💥' };
  return null;
}
