"use client";

import { useEffect, useRef, useCallback } from "react";

interface Options {
  onSubmit: (value: number) => void;
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onSkip: () => void;
  active: boolean;
}

/**
 * Captures keyboard input globally while session is active.
 * Digits 0–9 append to the input buffer.
 * Enter submits. Backspace removes last digit.
 * Escape skips question.
 */
export function useKeyboardInput({
  onSubmit,
  onDigit,
  onBackspace,
  onSkip,
  active,
}: Options) {
  const bufferRef = useRef("");

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!active) return;

      // Block browser shortcuts from interfering
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key >= "0" && e.key <= "9") {
        if (bufferRef.current.length >= 6) return; // cap at 6 digits
        bufferRef.current += e.key;
        onDigit(e.key);
        e.preventDefault();
      } else if (e.key === "Backspace") {
        bufferRef.current = bufferRef.current.slice(0, -1);
        onBackspace();
        e.preventDefault();
      } else if (e.key === "Enter") {
        const val = parseInt(bufferRef.current, 10);
        if (!isNaN(val)) {
          onSubmit(val);
          bufferRef.current = "";
        }
        e.preventDefault();
      } else if (e.key === "Escape") {
        bufferRef.current = "";
        onSkip();
        e.preventDefault();
      }
    },
    [active, onSubmit, onDigit, onBackspace, onSkip]
  );

  // Reset buffer when question changes
  const resetBuffer = useCallback(() => {
    bufferRef.current = "";
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return { resetBuffer };
}
