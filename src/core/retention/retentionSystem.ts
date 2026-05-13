/**
 * Retention System
 *
 * Manages long-term progress: which tables are learned, mastery data.
 * Persists to localStorage so progress survives sessions.
 */

import type { RetentionState, TableMastery, SessionAnalytics } from "@/types";

const STORAGE_KEY = "batm_retention_v1";

const defaultState = (): RetentionState => ({
  learnedTables: [],
  masteryMap: {},
  totalSessions: 0,
  totalQuestionsAnswered: 0,
  longestStreak: 0,
  lastSessionDate: null,
});

export function loadRetention(): RetentionState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return JSON.parse(raw) as RetentionState;
  } catch {
    return defaultState();
  }
}

export function saveRetention(state: RetentionState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function markTableLearned(
  state: RetentionState,
  table: number
): RetentionState {
  if (state.learnedTables.includes(table)) return state;
  const next = {
    ...state,
    learnedTables: [...state.learnedTables, table].sort((a, b) => a - b),
  };
  saveRetention(next);
  return next;
}

export function unmarkTableLearned(
  state: RetentionState,
  table: number
): RetentionState {
  const next = {
    ...state,
    learnedTables: state.learnedTables.filter((t) => t !== table),
  };
  saveRetention(next);
  return next;
}

export function updateMasteryAfterSession(
  state: RetentionState,
  tables: number[],
  analytics: SessionAnalytics
): RetentionState {
  const now = Date.now();
  const masteryMap = { ...state.masteryMap };

  for (const table of tables) {
    const prev: TableMastery = masteryMap[table] ?? {
      table,
      sessionsCompleted: 0,
      bestAccuracy: 0,
      lastPracticed: null,
      mastered: false,
    };

    const updated: TableMastery = {
      table,
      sessionsCompleted: prev.sessionsCompleted + 1,
      bestAccuracy: Math.max(prev.bestAccuracy, analytics.accuracy),
      lastPracticed: now,
      mastered: prev.mastered || analytics.accuracy >= 90,
    };

    masteryMap[table] = updated;
  }

  const next: RetentionState = {
    ...state,
    masteryMap,
    totalSessions: state.totalSessions + 1,
    totalQuestionsAnswered: state.totalQuestionsAnswered + analytics.correct,
    longestStreak: Math.max(state.longestStreak, analytics.streakBest),
    lastSessionDate: new Date().toISOString().split("T")[0],
  };

  saveRetention(next);
  return next;
}
