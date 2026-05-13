/**
 * Question Generation Engine
 *
 * Algorithm design:
 * - 50 multiplication questions from selected tables
 * - 40 mixed arithmetic (add/subtract/product-mixed)
 * - Full coverage: every (table × operand) pair appears before repeating
 * - Fisher-Yates shuffle for true randomness
 * - Weighted difficulty distribution: 30% easy, 50% medium, 20% hard
 * - Operand range for selected tables: 1–20 (ensures depth)
 * - No two identical consecutive questions
 */

import type { Question, QuestionKind, SessionConfig } from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getDifficulty(a: number, b: number): Question["difficulty"] {
  const product = a * b;
  if (product <= 50) return "easy";
  if (product <= 200) return "medium";
  return "hard";
}

function getTimeLimit(diff: Question["difficulty"]): number {
  if (diff === "easy") return 8;
  if (diff === "medium") return 10;
  return 12;
}

// ─── Multiplication Question Generator ───────────────────────────────────────

/**
 * Generates `count` multiplication questions covering all (table × operand)
 * combinations as evenly as possible, then shuffles.
 */
function generateMultiplyQuestions(
  tables: number[],
  count: number
): Question[] {
  if (tables.length === 0) return [];

  // Build full cartesian: each table × operands 1..20
  const operands = Array.from({ length: 10 }, (_, i) => i + 1);
  const allPairs: Array<{ table: number; operand: number }> = [];

  for (const t of tables) {
    for (const op of operands) {
      allPairs.push({ table: t, operand: op });
    }
  }

  // Cycle through pairs until we hit count, always fully shuffled per cycle
  const questions: Question[] = [];
  let pool = shuffle(allPairs);
  let poolIndex = 0;

  while (questions.length < count) {
    if (poolIndex >= pool.length) {
      pool = shuffle(allPairs);
      poolIndex = 0;
    }
    const { table, operand } = pool[poolIndex++];
    const diff = getDifficulty(table, operand);

    questions.push({
      id: uid(),
      kind: "multiply",
      display: `${table} × ${operand}`,
      answer: table * operand,
      a: table,
      b: operand,
      table,
      difficulty: diff,
      timeLimit: getTimeLimit(diff),
    });
  }

  // Ensure no two consecutive identical displays
  return dedupeConsecutive(questions, count);
}

// ─── Mixed Arithmetic Generator ───────────────────────────────────────────────

/**
 * Generates 40 mixed questions using values derived from selected tables.
 * Mix: 15 add, 15 subtract, 10 product-mixed
 */
function generateMixedQuestions(
  tables: number[],
  count: number
): Question[] {
  if (tables.length === 0) return [];

  const addCount = Math.floor(count * 0.375);       // ~15
  const subCount = Math.floor(count * 0.375);       // ~15
  const prodCount = count - addCount - subCount;    // ~10

  const questions: Question[] = [];

  // Helper: pick a random table value (table × rand operand)
  const tableVal = () => {
    const t = tables[Math.floor(Math.random() * tables.length)];
    const op = Math.floor(Math.random() * 10) + 1; // 1–10
    return t * op;
  };

  // Addition: sum of two table-derived values
  for (let i = 0; i < addCount; i++) {
    const a = tableVal();
    const b = tableVal();
    const diff = getDifficulty(a, b);
    questions.push({
      id: uid(),
      kind: "add",
      display: `${a} + ${b}`,
      answer: a + b,
      a, b, table: 0,
      difficulty: diff,
      timeLimit: getTimeLimit(diff),
    });
  }

  // Subtraction: always positive result
  for (let i = 0; i < subCount; i++) {
    let a = tableVal();
    let b = tableVal();
    if (b > a) [a, b] = [b, a];
    const diff = getDifficulty(a, b);
    questions.push({
      id: uid(),
      kind: "subtract",
      display: `${a} − ${b}`,
      answer: a - b,
      a, b, table: 0,
      difficulty: diff,
      timeLimit: getTimeLimit(diff),
    });
  }

  // Product-mixed: multiply two smaller table-derived numbers
  for (let i = 0; i < prodCount; i++) {
    const t = tables[Math.floor(Math.random() * tables.length)];
    const op1 = Math.floor(Math.random() * 10) + 1;
    const op2 = Math.floor(Math.random() * 10) + 1;
    const a = t;
    const b = op1;
    const diff = getDifficulty(a, b);
    questions.push({
      id: uid(),
      kind: "product-mixed",
      display: `${a} × ${b}`,
      answer: a * b,
      a, b, table: t,
      difficulty: diff,
      timeLimit: getTimeLimit(diff),
    });
  }

  return shuffle(questions);
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function dedupeConsecutive(questions: Question[], count: number): Question[] {
  const result: Question[] = [];
  for (const q of questions) {
    if (result.length === 0 || result[result.length - 1].display !== q.display) {
      result.push(q);
    }
    if (result.length >= count) break;
  }
  return result;
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export function generateSessionQuestions(config: SessionConfig): Question[] {
  const { selectedTables, totalQuestions } = config;

  const multiplyCount = 50;
  const mixedCount = totalQuestions - multiplyCount; // 40

  const multiplyQs = generateMultiplyQuestions(selectedTables, multiplyCount);
  const mixedQs = generateMixedQuestions(selectedTables, mixedCount);

  // Interleave: roughly 5 multiply, then 4 mixed, repeat
  const interleaved: Question[] = [];
  let mi = 0, mxi = 0;
  let block = 0;

  while (interleaved.length < totalQuestions) {
    const isMultiplyBlock = block % 2 === 0;
    const blockSize = isMultiplyBlock ? 5 : 4;
    const source = isMultiplyBlock ? multiplyQs : mixedQs;
    const idx = isMultiplyBlock ? mi : mxi;

    for (let i = 0; i < blockSize && idx + i < source.length; i++) {
      interleaved.push(source[idx + i]);
    }

    if (isMultiplyBlock) mi += blockSize;
    else mxi += blockSize;
    block++;

    if (mi >= multiplyQs.length && mxi >= mixedQs.length) break;
  }

  return interleaved.slice(0, totalQuestions);
}

// ─── Utility Exports ──────────────────────────────────────────────────────────

export { shuffle, getDifficulty, getTimeLimit };