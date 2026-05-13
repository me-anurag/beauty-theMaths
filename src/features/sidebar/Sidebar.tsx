"use client";

import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { cn } from "@/utils";
import { StreakBadge } from "@/ui/components/StreakBadge";
import { formatTime } from "@/utils";
import { useSessionTimer } from "@/hooks/useSessionTimer";

// Table grid: 1..100 displayed as 10×10
const ALL_TABLES = Array.from({ length: 100 }, (_, i) => i + 1);

export function Sidebar() {
  const selectedTables = useStore((s) => s.selectedTables);
  const learnedTables  = useStore((s) => s.retention.learnedTables);
  const masteryMap     = useStore((s) => s.retention.masteryMap);
  const phase          = useStore((s) => s.session.phase);
  const streakCurrent  = useStore((s) => s.session.streakCurrent);
  const streakBest     = useStore((s) => s.session.streakBest);
  const score          = useStore((s) => s.score);
  const currentIndex   = useStore((s) => s.session.currentIndex);
  const totalQuestions = useStore((s) => s.session.config.totalQuestions);
  const toggleSelected = useStore((s) => s.toggleTableSelected);
  const toggleLearned  = useStore((s) => s.toggleTableLearned);

  const { sessionSecondsLeft } = useSessionTimer();
  const isActive = phase === "active" || phase === "paused";

  return (
    <aside className="h-full flex flex-col gap-6 p-5 overflow-y-auto">

      {/* Logo */}
      <div className="flex flex-col gap-0.5">
        <h1 className="font-display text-lg font-extrabold text-[var(--green-bright)] tracking-tight leading-none">
          Beauty &amp;
        </h1>
        <h1 className="font-display text-lg font-extrabold text-[var(--ink)] tracking-tight leading-none">
          the Maths
        </h1>
      </div>

      {/* Session stats (only when active) */}
      {isActive && (
        <div className="flex flex-col gap-3 p-3 rounded-xl bg-[var(--bg3)] border border-[var(--border)]">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-widest text-[var(--ink-muted)] font-mono">Time</span>
            <span className={cn(
              "font-mono text-sm font-bold tabular-nums",
              sessionSecondsLeft < 60 ? "text-[var(--danger)]" : "text-[var(--green-bright)]"
            )}>
              {formatTime(Math.ceil(sessionSecondsLeft))}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-widest text-[var(--ink-muted)] font-mono">Progress</span>
            <span className="font-mono text-sm font-bold text-[var(--ink)] tabular-nums">
              {currentIndex}/{totalQuestions}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-widest text-[var(--ink-muted)] font-mono">Score</span>
            <span className="font-mono text-sm font-bold text-[var(--amber)] tabular-nums">
              {score.toLocaleString()}
            </span>
          </div>
          <StreakBadge streak={streakCurrent} />
          {streakBest > 0 && (
            <div className="text-[10px] text-[var(--ink-faint)] font-mono text-center">
              Best streak: {streakBest}
            </div>
          )}
        </div>
      )}

      {/* Table selector */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-[var(--ink-muted)] font-mono">
            Tables
          </span>
          <span className="text-[10px] text-[var(--ink-faint)] font-mono">
            {selectedTables.length}/2 selected
          </span>
        </div>

        <p className="text-[10px] text-[var(--ink-faint)] leading-relaxed">
          <span className="text-[var(--green)]">Tap</span> to select for session.{" "}
          <span className="text-[var(--green)]">Hold</span> to mark learned.
        </p>

        {/* 10×10 grid */}
        <div className="grid grid-cols-10 gap-[3px]">
          {ALL_TABLES.map((t) => {
            const isSelected = selectedTables.includes(t);
            const isLearned  = learnedTables.includes(t);
            const mastered   = masteryMap[t]?.mastered;

            return (
              <motion.button
                key={t}
                whileTap={{ scale: 0.85 }}
                onClick={() => toggleSelected(t)}
                onContextMenu={(e) => { e.preventDefault(); toggleLearned(t); }}
                disabled={phase === "active"}
                className={cn(
                  "aspect-square rounded-[3px] text-[8px] font-mono font-bold",
                  "flex items-center justify-center",
                  "transition-colors duration-150 cursor-pointer",
                  "border",
                  isSelected
                    ? "bg-[var(--green)] text-[var(--bg)] border-[var(--green-bright)]"
                    : isLearned
                    ? mastered
                      ? "bg-[var(--green-dim)] text-[var(--green-bright)] border-[var(--green-mid)]"
                      : "bg-[var(--green-dim)] text-[var(--green)] border-[var(--green-dim)]"
                    : "bg-[var(--bg3)] text-[var(--ink-faint)] border-[var(--border)] hover:border-[var(--green-dim)] hover:text-[var(--ink-muted)]",
                  phase === "active" && "opacity-60 cursor-not-allowed"
                )}
              >
                {t}
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-1 mt-1">
          {[
            { color: "bg-[var(--green)]", label: "Selected for session" },
            { color: "bg-[var(--green-dim)]", label: "Learned (right-click)" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-[2px]", color)} />
              <span className="text-[9px] text-[var(--ink-faint)] font-mono">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Total stats */}
      <div className="mt-auto flex flex-col gap-2 p-3 rounded-xl bg-[var(--bg3)] border border-[var(--border)]">
        <span className="text-[10px] uppercase tracking-widest text-[var(--ink-muted)] font-mono">All-time</span>
        <div className="flex justify-between">
          <span className="text-[10px] text-[var(--ink-faint)] font-mono">Sessions</span>
          <span className="text-[10px] font-mono text-[var(--ink-muted)]">
            {useStore.getState().retention.totalSessions}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] text-[var(--ink-faint)] font-mono">Tables learned</span>
          <span className="text-[10px] font-mono text-[var(--green)]">
            {learnedTables.length}
          </span>
        </div>
      </div>

    </aside>
  );
}
