/**
 * Scoring Engine
 *
 * Score per question:
 *   base × difficulty_multiplier × streak_multiplier + time_bonus
 *
 * Time bonus: linear decay from max to 0 over timeLimit
 * Streak multiplier: caps at 5× after 10+ streak
 */

import type { Question, ScoreResult } from "@/types";

const BASE_POINTS = 100;
const MAX_TIME_BONUS = 50;

const DIFFICULTY_MULT: Record<Question["difficulty"], number> = {
  easy: 1.0,
  medium: 1.5,
  hard: 2.0,
};

function getStreakMultiplier(streak: number): number {
  if (streak < 3) return 1.0;
  if (streak < 5) return 1.2;
  if (streak < 8) return 1.5;
  if (streak < 12) return 2.0;
  return 3.0;
}

export function calculateScore(
  question: Question,
  correct: boolean,
  responseTimeMs: number,
  streak: number,
  runningTotal: number
): ScoreResult {
  if (!correct) {
    return {
      pointsEarned: 0,
      breakdown: { base: 0, timeBonus: 0, streakBonus: 0, difficultyBonus: 0 },
      runningTotal,
    };
  }

  const timeLimitMs = question.timeLimit * 1000;
  const timeFraction = Math.max(0, 1 - responseTimeMs / timeLimitMs);
  const timeBonus = Math.round(MAX_TIME_BONUS * timeFraction);

  const diffMult = DIFFICULTY_MULT[question.difficulty];
  const streakMult = getStreakMultiplier(streak);
  const base = BASE_POINTS;
  const difficultyBonus = Math.round(base * (diffMult - 1));
  const streakBonus = Math.round((base + difficultyBonus) * (streakMult - 1));

  const pointsEarned = base + difficultyBonus + streakBonus + timeBonus;

  return {
    pointsEarned,
    breakdown: { base, timeBonus, streakBonus, difficultyBonus },
    runningTotal: runningTotal + pointsEarned,
  };
}

export function calculateGrade(
  accuracy: number
): "S" | "A" | "B" | "C" | "D" {
  if (accuracy >= 96) return "S";
  if (accuracy >= 88) return "A";
  if (accuracy >= 75) return "B";
  if (accuracy >= 60) return "C";
  return "D";
}
