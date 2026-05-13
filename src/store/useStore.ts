/**
 * Global Store (Zustand)
 *
 * Manages:
 *  - Session state (questions, progress, streaks, score)
 *  - Retention state (learned tables, mastery)
 *  - UI state (selected tables, phase)
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
// Note: requires `npm install immer` in addition to zustand
import type {
  SessionState,
  SessionConfig,
  QuestionAttempt,
  RetentionState,
  SessionAnalytics,
  FeedbackEvent,
} from "@/types";
import { generateSessionQuestions } from "@/core/engine/questionGenerator";
import { calculateScore } from "@/core/scoring/scoreEngine";
import { computeSessionAnalytics } from "@/core/analytics/analyticsEngine";
import {
  loadRetention,
  markTableLearned,
  unmarkTableLearned,
  updateMasteryAfterSession,
} from "@/core/retention/retentionSystem";

// ─── Store Shape ──────────────────────────────────────────────────────────────

interface AppStore {
  // Session
  session: SessionState;
  score: number;
  analytics: SessionAnalytics | null;
  feedback: FeedbackEvent | null;

  // Retention
  retention: RetentionState;

  // UI
  selectedTables: number[];

  // Actions — Setup
  toggleTableSelected: (table: number) => void;
  toggleTableLearned: (table: number) => void;
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  abandonSession: () => void;

  // Actions — Gameplay
  submitAnswer: (answer: number) => void;
  skipQuestion: () => void;
  timeoutQuestion: () => void;
  clearFeedback: () => void;
}

// ─── Default Session ──────────────────────────────────────────────────────────

function defaultSession(): SessionState {
  return {
    phase: "idle",
    config: {
      selectedTables: [],
      totalQuestions: 90,
      sessionDurationSec: 900,
      questionTimeLimitSec: 10,
    },
    questions: [],
    currentIndex: 0,
    attempts: [],
    startedAt: null,
    streakCurrent: 0,
    streakBest: 0,
    questionStartedAt: null,
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useStore = create<AppStore>()(
  immer((set, get) => ({
    session: defaultSession(),
    score: 0,
    analytics: null,
    feedback: null,
    retention: loadRetention(),
    selectedTables: [],

    // ── Table Selection ──────────────────────────────────────────────────────

    toggleTableSelected(table) {
      set((s) => {
        const idx = s.selectedTables.indexOf(table);
        if (idx === -1) {
          if (s.selectedTables.length < 2) s.selectedTables.push(table);
        } else {
          s.selectedTables.splice(idx, 1);
        }
      });
    },

    toggleTableLearned(table) {
      set((s) => {
        const isLearned = s.retention.learnedTables.includes(table);
        s.retention = isLearned
          ? unmarkTableLearned(s.retention, table)
          : markTableLearned(s.retention, table);
      });
    },

    // ── Session Lifecycle ────────────────────────────────────────────────────

    startSession() {
      const { selectedTables } = get();
      if (selectedTables.length === 0) return;

      const config: SessionConfig = {
        selectedTables,
        totalQuestions: 90,
        sessionDurationSec: 900,
        questionTimeLimitSec: 10,
      };

      const questions = generateSessionQuestions(config);

      set((s) => {
        s.session = {
          phase: "active",
          config,
          questions,
          currentIndex: 0,
          attempts: [],
          startedAt: Date.now(),
          streakCurrent: 0,
          streakBest: 0,
          questionStartedAt: Date.now(),
        };
        s.score = 0;
        s.analytics = null;
        s.feedback = null;
      });
    },

    pauseSession() {
      set((s) => { s.session.phase = "paused"; });
    },

    resumeSession() {
      set((s) => {
        s.session.phase = "active";
        s.session.questionStartedAt = Date.now();
      });
    },

    abandonSession() {
      set((s) => {
        s.session = defaultSession();
        s.score = 0;
        s.analytics = null;
        s.feedback = null;
      });
    },

    // ── Gameplay ─────────────────────────────────────────────────────────────

    submitAnswer(answer) {
      const { session, score } = get();
      if (session.phase !== "active") return;

      const q = session.questions[session.currentIndex];
      if (!q) return;

      const responseTimeMs = session.questionStartedAt
        ? Date.now() - session.questionStartedAt
        : 5000;
      const correct = answer === q.answer;

      const newStreak = correct ? session.streakCurrent + 1 : 0;
      const newBest = Math.max(session.streakBest, newStreak);

      const result = calculateScore(q, correct, responseTimeMs, newStreak, score);

      const attempt: QuestionAttempt = {
        question: q,
        userAnswer: answer,
        correct,
        responseTimeMs,
        skipped: false,
      };

      set((s) => {
        s.session.attempts.push(attempt);
        s.session.streakCurrent = newStreak;
        s.session.streakBest = newBest;
        s.score = result.runningTotal;
        s.feedback = { kind: correct ? "correct" : "wrong" };

        const nextIndex = s.session.currentIndex + 1;
        if (nextIndex >= s.session.questions.length) {
          s.session.phase = "complete";
          s.session.currentIndex = nextIndex;
          // compute analytics
          const duration = s.session.startedAt ? Date.now() - s.session.startedAt : 0;
          s.analytics = computeSessionAnalytics(
            s.session.attempts, s.session.streakBest, duration, result.runningTotal
          );
          // update retention
          s.retention = updateMasteryAfterSession(
            s.retention, s.session.config.selectedTables, s.analytics!
          );
        } else {
          s.session.currentIndex = nextIndex;
          s.session.questionStartedAt = Date.now();
        }
      });
    },

    skipQuestion() {
      const { session, score } = get();
      if (session.phase !== "active") return;

      const q = session.questions[session.currentIndex];
      if (!q) return;

      const attempt: QuestionAttempt = {
        question: q,
        userAnswer: null,
        correct: false,
        responseTimeMs: q.timeLimit * 1000,
        skipped: true,
      };

      set((s) => {
        s.session.attempts.push(attempt);
        s.session.streakCurrent = 0;
        s.feedback = { kind: "timeout" };

        const nextIndex = s.session.currentIndex + 1;
        if (nextIndex >= s.session.questions.length) {
          s.session.phase = "complete";
          s.session.currentIndex = nextIndex;
          const duration = s.session.startedAt ? Date.now() - s.session.startedAt : 0;
          s.analytics = computeSessionAnalytics(
            s.session.attempts, s.session.streakBest, duration, score
          );
          s.retention = updateMasteryAfterSession(
            s.retention, s.session.config.selectedTables, s.analytics!
          );
        } else {
          s.session.currentIndex = nextIndex;
          s.session.questionStartedAt = Date.now();
        }
      });
    },

    timeoutQuestion() {
      get().skipQuestion();
    },

    clearFeedback() {
      set((s) => { s.feedback = null; });
    },
  }))
);
