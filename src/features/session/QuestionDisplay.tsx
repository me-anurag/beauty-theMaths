"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { useKeyboardInput } from "@/hooks/useKeyboardInput";
import { useSessionTimer } from "@/hooks/useSessionTimer";
import { ProgressBar } from "@/ui/components/ProgressBar";
import { FeedbackFlash } from "@/features/feedback/FeedbackFlash";
import { NumericKeypad } from "@/features/keypad/NumericKeypad";
import { cn } from "@/utils";

export function QuestionDisplay() {
  const phase         = useStore((s) => s.session.phase);
  const questions     = useStore((s) => s.session.questions);
  const currentIndex  = useStore((s) => s.session.currentIndex);
  const totalQuestions= useStore((s) => s.session.config.totalQuestions);
  const submitAnswer  = useStore((s) => s.submitAnswer);
  const skipQuestion  = useStore((s) => s.skipQuestion);

  const currentQ = questions[currentIndex];
  const { questionProgress, isWarning } = useSessionTimer();

  const [inputValue, setInputValue] = useState("");
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // Reset input on question change
  useEffect(() => {
    setInputValue("");
  }, [currentIndex]);

  const handleSubmit = useCallback((val?: number) => {
    const parsed = val !== undefined ? val : parseInt(inputValue, 10);
    if (!isNaN(parsed)) {
      submitAnswer(parsed);
      setInputValue("");
    }
  }, [inputValue, submitAnswer]);

  const handleDigit = useCallback((d: string) => {
    setInputValue((v) => (v.length < 6 ? v + d : v));
  }, []);

  const handleBackspace = useCallback(() => {
    setInputValue((v) => v.slice(0, -1));
  }, []);

  const handleSkip = useCallback(() => {
    setInputValue("");
    skipQuestion();
  }, [skipQuestion]);

  const { resetBuffer } = useKeyboardInput({
    onSubmit: handleSubmit,
    onDigit: handleDigit,
    onBackspace: handleBackspace,
    onSkip: handleSkip,
    active: phase === "active",
  });

  useEffect(() => {
    resetBuffer();
  }, [currentIndex, resetBuffer]);

  if (!currentQ) return null;

  const progressPct = Math.round((currentIndex / totalQuestions) * 100);
  const kindLabel: Record<string, string> = {
    multiply: "×",
    add: "+",
    subtract: "−",
    "product-mixed": "×",
  };

  return (
    <div className="relative flex flex-col h-full">

      {/* Session progress top bar */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <div className="flex-1 h-1 rounded-full bg-[var(--bg3)] overflow-hidden">
          <motion.div
            className="h-full bg-[var(--green)] rounded-full"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="text-[11px] font-mono text-[var(--ink-muted)] tabular-nums shrink-0">
          {currentIndex}/{totalQuestions}
        </span>
      </div>

      {/* Question card */}
      <div className="relative flex-1 flex flex-col items-center justify-center rounded-2xl bg-[var(--panel)] border border-[var(--border)] overflow-hidden min-h-0 px-6 py-8">

        {/* Feedback flash overlay */}
        <FeedbackFlash />

        {/* Question urgency timer bar */}
        <div className="absolute top-0 left-0 right-0 px-4 pt-3">
          <ProgressBar progress={questionProgress} isWarning={isWarning} />
        </div>

        {/* Kind badge */}
        <div className="mb-3 mt-4">
          <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-[var(--ink-faint)]">
            {currentQ.kind === "multiply" || currentQ.kind === "product-mixed"
              ? "Multiplication"
              : currentQ.kind === "add"
              ? "Addition"
              : "Subtraction"}
          </span>
        </div>

        {/* Giant question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.34, 1.3, 0.64, 1] }}
            className="flex flex-col items-center gap-2"
          >
            <span
              className={cn(
                "font-mono font-bold text-center leading-none text-glow",
                "text-[clamp(3rem,10vw,6rem)]",
                "text-[var(--ink)]"
              )}
            >
              {currentQ.display}
            </span>
            <span className="text-[var(--ink-faint)] font-mono text-2xl">=</span>
          </motion.div>
        </AnimatePresence>

        {/* Input display */}
        <motion.div
          className={cn(
            "mt-6 min-w-[140px] px-6 py-3 rounded-xl",
            "border-2 text-center",
            "font-mono text-3xl font-bold tabular-nums",
            "transition-colors duration-150",
            inputValue
              ? "border-[var(--green)] text-[var(--green-bright)] bg-[var(--bg2)]"
              : "border-[var(--border)] text-[var(--ink-faint)] bg-[var(--bg3)]"
          )}
          animate={inputValue ? { boxShadow: "0 0 16px var(--green-glow)" } : { boxShadow: "none" }}
        >
          {inputValue || "?"}
        </motion.div>

        {/* Difficulty dot */}
        <div className="absolute bottom-3 right-4">
          <span className={cn(
            "text-[9px] font-mono uppercase tracking-widest",
            currentQ.difficulty === "hard" ? "text-[var(--danger)]" :
            currentQ.difficulty === "medium" ? "text-[var(--amber)]" :
            "text-[var(--ink-faint)]"
          )}>
            {currentQ.difficulty}
          </span>
        </div>
      </div>

      {/* Mobile keypad */}
      <div className="md:hidden mt-4 shrink-0">
        <NumericKeypad
          onDigit={handleDigit}
          onBackspace={handleBackspace}
          onSubmit={() => handleSubmit()}
          onSkip={handleSkip}
          disabled={phase !== "active"}
        />
      </div>

      {/* Desktop hint */}
      <div className="hidden md:flex items-center justify-center gap-4 mt-4 shrink-0">
        <span className="text-[11px] text-[var(--ink-faint)] font-mono">
          Type answer · <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg3)] border border-[var(--border)] text-[10px]">Enter</kbd> to submit ·{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg3)] border border-[var(--border)] text-[10px]">Esc</kbd> to skip
        </span>
      </div>
    </div>
  );
}
