"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils";

interface Props {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  onSkip: () => void;
  disabled?: boolean;
}

const KEYS = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["skip", "0", "⌫"],
];

export function NumericKeypad({
  onDigit,
  onBackspace,
  onSubmit,
  onSkip,
  disabled,
}: Props) {
  const handleKey = (key: string) => {
    if (disabled) return;
    if (key >= "0" && key <= "9") onDigit(key);
    else if (key === "⌫") onBackspace();
    else if (key === "skip") onSkip();
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {KEYS.map((row, ri) => (
        <div key={ri} className="flex gap-2">
          {row.map((key) => {
            const isAction = key === "skip" || key === "⌫";
            return (
              <motion.button
                key={key}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleKey(key)}
                className={cn(
                  "flex-1 h-14 rounded-xl font-mono text-xl font-bold",
                  "flex items-center justify-center",
                  "border transition-colors duration-100",
                  "active:bg-[var(--green-dim)]",
                  isAction
                    ? "bg-[var(--bg3)] border-[var(--border)] text-[var(--ink-muted)] text-sm"
                    : "bg-[var(--bg2)] border-[var(--border)] text-[var(--ink)] hover:border-[var(--green-mid)]",
                  disabled && "opacity-40 pointer-events-none"
                )}
              >
                {key === "skip" ? (
                  <span className="text-xs tracking-widest uppercase text-[var(--ink-faint)]">skip</span>
                ) : key}
              </motion.button>
            );
          })}
        </div>
      ))}

      {/* Enter / Submit button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onSubmit}
        disabled={disabled}
        className={cn(
          "w-full h-14 rounded-xl font-display font-bold text-base tracking-widest uppercase",
          "bg-[var(--green)] text-[var(--bg)] border border-[var(--green-bright)]",
          "transition-all duration-100",
          "shadow-[0_0_24px_var(--green-glow)]",
          disabled && "opacity-40 pointer-events-none"
        )}
      >
        Enter
      </motion.button>
    </div>
  );
}
