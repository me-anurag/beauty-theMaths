"use client";

import { motion, AnimatePresence } from "framer-motion";
import { getStreakLabel, getStreakColor } from "@/core/streak/streakSystem";

interface Props {
  streak: number;
}

export function StreakBadge({ streak }: Props) {
  const label = getStreakLabel(streak);
  const color = getStreakColor(streak);

  return (
    <div className="flex flex-col items-center gap-1">
      <AnimatePresence mode="wait">
        {streak >= 3 && (
          <motion.span
            key={`label-${Math.floor(streak / 5)}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="text-[10px] font-mono tracking-widest uppercase"
            style={{ color }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      <motion.div
        key={streak}
        animate={streak > 0 ? { scale: [1, 1.25, 1] } : {}}
        transition={{ duration: 0.25 }}
        className="flex items-center gap-1.5"
      >
        <span
          className="text-2xl font-mono font-bold tabular-nums"
          style={{ color }}
        >
          {streak}
        </span>
        <span className="text-xs text-[var(--ink-muted)] font-body">streak</span>
      </motion.div>
    </div>
  );
}
