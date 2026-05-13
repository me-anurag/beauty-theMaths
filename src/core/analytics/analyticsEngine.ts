/**
 * Analytics Engine
 *
 * Computes end-of-session analytics from QuestionAttempt[].
 * Also provides speed trend (avg response per 10-question block).
 */

import type { QuestionAttempt, SessionAnalytics, WeakArea } from "@/types";
import { calculateGrade } from "@/core/scoring/scoreEngine";

export function computeSessionAnalytics(
  attempts: QuestionAttempt[],
  streakBest: number,
  sessionDurationMs: number,
  score: number
): SessionAnalytics {
  const total = attempts.length;
  if (total === 0) {
    return {
      totalQuestions: 0,
      correct: 0, incorrect: 0, skipped: 0,
      accuracy: 0, avgResponseTimeMs: 0,
      fastestResponseMs: 0, slowestResponseMs: 0,
      streakBest: 0, weakAreas: [], speedTrend: [],
      score: 0, grade: "D", sessionDurationMs: 0,
    };
  }

  let correct = 0, incorrect = 0, skipped = 0;
  let totalTime = 0, fastest = Infinity, slowest = 0;

  // Weak area tracking: keyed by "table-operand"
  const weakMap: Record<string, { table: number; operand: number; errors: number; totalMs: number; count: number }> = {};

  attempts.forEach((a) => {
    if (a.skipped) { skipped++; return; }
    if (a.correct) correct++;
    else incorrect++;

    totalTime += a.responseTimeMs;
    if (a.responseTimeMs < fastest) fastest = a.responseTimeMs;
    if (a.responseTimeMs > slowest) slowest = a.responseTimeMs;

    // Track weak areas for multiply/product questions
    if (!a.correct && (a.question.kind === "multiply" || a.question.kind === "product-mixed")) {
      const key = `${a.question.table}-${a.question.b}`;
      if (!weakMap[key]) {
        weakMap[key] = { table: a.question.table, operand: a.question.b, errors: 0, totalMs: 0, count: 0 };
      }
      weakMap[key].errors++;
      weakMap[key].totalMs += a.responseTimeMs;
      weakMap[key].count++;
    }
  });

  const answered = correct + incorrect;
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const avgResponseTimeMs = answered > 0 ? Math.round(totalTime / answered) : 0;

  // Speed trend: blocks of 10
  const speedTrend: number[] = [];
  for (let i = 0; i < attempts.length; i += 10) {
    const block = attempts.slice(i, i + 10).filter((a) => !a.skipped);
    if (block.length === 0) continue;
    const avg = block.reduce((s, a) => s + a.responseTimeMs, 0) / block.length;
    speedTrend.push(Math.round(avg));
  }

  // Weak areas sorted by error count
  const weakAreas: WeakArea[] = Object.values(weakMap)
    .map((w) => ({
      table: w.table,
      operand: w.operand,
      errorCount: w.errors,
      avgResponseMs: w.count > 0 ? Math.round(w.totalMs / w.count) : 0,
    }))
    .sort((a, b) => b.errorCount - a.errorCount)
    .slice(0, 5);

  return {
    totalQuestions: total,
    correct, incorrect, skipped,
    accuracy,
    avgResponseTimeMs,
    fastestResponseMs: fastest === Infinity ? 0 : fastest,
    slowestResponseMs: slowest,
    streakBest,
    weakAreas,
    speedTrend,
    score,
    grade: calculateGrade(accuracy),
    sessionDurationMs,
  };
}
