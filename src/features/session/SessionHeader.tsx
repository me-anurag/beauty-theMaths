"use client";

import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { useSessionTimer } from "@/hooks/useSessionTimer";
import { formatTime } from "@/utils";
import { cn } from "@/utils";

export function SessionHeader() {
  const phase          = useStore((s) => s.session.phase);
  const score          = useStore((s) => s.score);
  const streakCurrent  = useStore((s) => s.session.streakCurrent);
  const pauseSession   = useStore((s) => s.pauseSession);
  const resumeSession  = useStore((s) => s.resumeSession);
  const abandonSession = useStore((s) => s.abandonSession);

  const { sessionSecondsLeft } = useSessionTimer();

  if (phase === "idle" || phase === "complete") return null;

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--panel)] shrink-0">

      {/* Timer */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "font-mono text-sm font-bold tabular-nums",
            sessionSecondsLeft < 60 ? "text-[var(--danger)]" : "text-[var(--green-bright)]"
          )}
        >
          {formatTime(Math.ceil(sessionSecondsLeft))}
        </span>
      </div>

      {/* Score */}
      <motion.span
        key={score}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 0.2 }}
        className="font-mono text-sm font-bold text-[var(--amber)] tabular-nums"
      >
        {score.toLocaleString()} pts
      </motion.span>

      {/* Streak (mobile) */}
      {streakCurrent >= 3 && (
        <motion.span
          key={streakCurrent}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.2 }}
          className="font-mono text-sm font-bold text-[var(--green-bright)]"
        >
          🔥 {streakCurrent}
        </motion.span>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={phase === "paused" ? resumeSession : pauseSession}
          className="text-[11px] font-mono text-[var(--ink-muted)] hover:text-[var(--ink)] px-2 py-1 rounded-lg border border-[var(--border)] hover:border-[var(--border-bright)] transition-colors"
        >
          {phase === "paused" ? "Resume" : "Pause"}
        </button>
        <button
          onClick={abandonSession}
          className="text-[11px] font-mono text-[var(--ink-faint)] hover:text-[var(--danger)] px-2 py-1 rounded-lg border border-[var(--border)] transition-colors"
        >
          Quit
        </button>
      </div>
    </header>
  );
}
