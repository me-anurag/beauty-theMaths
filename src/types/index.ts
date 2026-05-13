// ─── Question Types ───────────────────────────────────────────────────────────

export type QuestionKind =
  | "multiply"       // core: selected table × operand
  | "add"            // mixed: sum of two derived numbers
  | "subtract"       // mixed: difference of two derived numbers
  | "product-mixed"; // mixed: product question using selected-table values

export interface Question {
  id: string;
  kind: QuestionKind;
  display: string;         // e.g. "7 × 13"
  answer: number;
  a: number;
  b: number;
  table: number;           // which selected table it belongs to (0 if mixed)
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;       // seconds per question
}

// ─── Session Types ────────────────────────────────────────────────────────────

export type SessionPhase = "idle" | "active" | "paused" | "complete";

export interface QuestionAttempt {
  question: Question;
  userAnswer: number | null;
  correct: boolean;
  responseTimeMs: number;
  skipped: boolean;
}

export interface SessionConfig {
  selectedTables: number[];
  totalQuestions: number;     // default 90
  sessionDurationSec: number; // default 900 (15 min)
  questionTimeLimitSec: number; // default 10
}

export interface SessionState {
  phase: SessionPhase;
  config: SessionConfig;
  questions: Question[];
  currentIndex: number;
  attempts: QuestionAttempt[];
  startedAt: number | null;   // timestamp
  streakCurrent: number;
  streakBest: number;
  questionStartedAt: number | null;
}

// ─── Analytics Types ──────────────────────────────────────────────────────────

export interface WeakArea {
  table: number;
  operand: number;
  errorCount: number;
  avgResponseMs: number;
}

export interface SessionAnalytics {
  totalQuestions: number;
  correct: number;
  incorrect: number;
  skipped: number;
  accuracy: number;             // 0–100
  avgResponseTimeMs: number;
  fastestResponseMs: number;
  slowestResponseMs: number;
  streakBest: number;
  weakAreas: WeakArea[];
  speedTrend: number[];         // avg response per 10-question block
  score: number;
  grade: "S" | "A" | "B" | "C" | "D";
  sessionDurationMs: number;
}

// ─── Retention / Progress Types ───────────────────────────────────────────────

export interface TableMastery {
  table: number;
  sessionsCompleted: number;
  bestAccuracy: number;
  lastPracticed: number | null; // timestamp
  mastered: boolean;
}

export interface RetentionState {
  learnedTables: number[];       // tables marked green (learned)
  masteryMap: Record<number, TableMastery>;
  totalSessions: number;
  totalQuestionsAnswered: number;
  longestStreak: number;
  lastSessionDate: string | null;
}

// ─── Feedback Types ───────────────────────────────────────────────────────────

export type FeedbackKind = "correct" | "wrong" | "timeout" | "streak";

export interface FeedbackEvent {
  kind: FeedbackKind;
  value?: number; // streak count, etc.
}

// ─── Scoring Types ────────────────────────────────────────────────────────────

export interface ScoreConfig {
  basePoints: number;
  timeBonus: number;
  streakMultiplier: number;
  difficultyMultiplier: number;
}

export interface ScoreResult {
  pointsEarned: number;
  breakdown: {
    base: number;
    timeBonus: number;
    streakBonus: number;
    difficultyBonus: number;
  };
  runningTotal: number;
}
