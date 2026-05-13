"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useStore } from "@/store/useStore";

interface TimerState {
  sessionSecondsLeft: number;
  questionProgress: number; // 0..1, counts DOWN
  isWarning: boolean;       // true when < 3s left on question
}

/**
 * Drives two timers:
 * 1. Session countdown (15 min total)
 * 2. Per-question urgency bar (timeLimit per question)
 *
 * On question timeout → calls store.timeoutQuestion()
 */
export function useSessionTimer(): TimerState {
  const phase = useStore((s) => s.session.phase);
  const startedAt = useStore((s) => s.session.startedAt);
  const sessionDuration = useStore((s) => s.session.config.sessionDurationSec);
  const questionStartedAt = useStore((s) => s.session.questionStartedAt);
  const currentQuestion = useStore(
    (s) => s.session.questions[s.session.currentIndex]
  );
  const timeoutQuestion = useStore((s) => s.timeoutQuestion);

  const [state, setState] = useState<TimerState>({
    sessionSecondsLeft: sessionDuration,
    questionProgress: 1,
    isWarning: false,
  });

  const rafRef = useRef<number>(0);
  const timedOutRef = useRef(false);

  const tick = useCallback(() => {
    if (phase !== "active") return;

    const now = Date.now();

    // Session countdown
    const sessionElapsed = startedAt ? (now - startedAt) / 1000 : 0;
    const sessionSecondsLeft = Math.max(0, sessionDuration - sessionElapsed);

    // Per-question progress bar
    const qLimit = currentQuestion?.timeLimit ?? 10;
    const qElapsed = questionStartedAt ? (now - questionStartedAt) / 1000 : 0;
    const questionProgress = Math.max(0, 1 - qElapsed / qLimit);
    const isWarning = qElapsed >= qLimit - 3;

    // Trigger timeout once
    if (questionProgress <= 0 && !timedOutRef.current) {
      timedOutRef.current = true;
      timeoutQuestion();
      return;
    }

    setState({ sessionSecondsLeft, questionProgress, isWarning });
    rafRef.current = requestAnimationFrame(tick);
  }, [phase, startedAt, sessionDuration, questionStartedAt, currentQuestion, timeoutQuestion]);

  // Reset timeout flag when question changes
  useEffect(() => {
    timedOutRef.current = false;
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (phase === "active") {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, tick]);

  return state;
}
