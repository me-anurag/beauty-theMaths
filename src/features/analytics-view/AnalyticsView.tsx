"use client";

import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { formatMs, formatPercent, cn } from "@/utils";

const GRADE_COLORS: Record<string, string> = {
  S: "text-[var(--amber)]",
  A: "text-[var(--green-bright)]",
  B: "text-[var(--green)]",
  C: "text-[var(--ink-muted)]",
  D: "text-[var(--danger)]",
};

export function AnalyticsView() {
  const analytics      = useStore((s) => s.analytics);
  const selectedTables = useStore((s) => s.session.config.selectedTables);
  const abandonSession = useStore((s) => s.abandonSession);
  const startSession   = useStore((s) => s.startSession);

  if (!analytics) return null;

  const durationMin = (analytics.sessionDurationMs / 60000).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-5 h-full overflow-y-auto px-1 py-2"
    >
      {/* Grade */}
      <div className="flex flex-col items-center gap-1 py-4">
        <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--ink-faint)]">Session Grade</span>
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
          className={cn("font-display font-extrabold text-8xl", GRADE_COLORS[analytics.grade])}
        >
          {analytics.grade}
        </motion.span>
        <span className="font-mono text-xl font-bold text-[var(--amber)]">
          {analytics.score.toLocaleString()} pts
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Accuracy",   value: formatPercent(analytics.accuracy) },
          { label: "Avg Speed",  value: formatMs(analytics.avgResponseTimeMs) },
          { label: "Correct",    value: `${analytics.correct}` },
          { label: "Wrong",      value: `${analytics.incorrect}` },
          { label: "Best Streak",value: `${analytics.streakBest}` },
          { label: "Duration",   value: `${durationMin} min` },
          { label: "Fastest",    value: formatMs(analytics.fastestResponseMs) },
          { label: "Slowest",    value: formatMs(analytics.slowestResponseMs) },
        ].map(({ label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="flex flex-col items-center gap-0.5 p-3 rounded-xl bg-[var(--bg3)] border border-[var(--border)]"
          >
            <span className="font-mono font-bold text-lg text-[var(--ink)]">{value}</span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-faint)]">{label}</span>
          </motion.div>
        ))}
      </div>

      {/* Speed trend */}
      {analytics.speedTrend.length > 1 && (
        <div className="p-3 rounded-xl bg-[var(--bg3)] border border-[var(--border)]">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--ink-faint)] mb-3">
            Speed trend (ms / 10-Q block)
          </p>
          <div className="flex items-end gap-1 h-12">
            {analytics.speedTrend.map((ms, i) => {
              const max = Math.max(...analytics.speedTrend);
              const pct = max > 0 ? (ms / max) * 100 : 50;
              // Lower ms = faster = taller bar with green
              const inversePct = 100 - pct;
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(inversePct, 10)}%` }}
                  transition={{ delay: 0.05 * i, duration: 0.3 }}
                  className="flex-1 rounded-t bg-[var(--green)] opacity-70"
                  title={`Block ${i + 1}: ${ms}ms avg`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[8px] font-mono text-[var(--ink-faint)]">Q1</span>
            <span className="text-[8px] font-mono text-[var(--ink-faint)]">Q90</span>
          </div>
        </div>
      )}

      {/* Weak areas */}
      {analytics.weakAreas.length > 0 && (
        <div className="p-3 rounded-xl bg-[var(--bg3)] border border-[var(--border)]">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--ink-faint)] mb-3">
            Needs work
          </p>
          <div className="flex flex-col gap-2">
            {analytics.weakAreas.map((w, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="font-mono text-sm text-[var(--ink)]">
                  {w.table} × {w.operand}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-[var(--ink-faint)]">
                    {formatMs(w.avgResponseMs)}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--danger)]">
                    {w.errorCount} ✗
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-2">
        <button
          onClick={startSession}
          className="flex-1 py-3 rounded-xl bg-[var(--green)] text-[var(--bg)] font-display font-bold text-sm tracking-widest uppercase shadow-[0_0_24px_var(--green-glow)]"
        >
          Again
        </button>
        <button
          onClick={abandonSession}
          className="flex-1 py-3 rounded-xl bg-[var(--bg3)] text-[var(--ink-muted)] font-display font-bold text-sm tracking-widest uppercase border border-[var(--border)]"
        >
          Home
        </button>
      </div>
    </motion.div>
  );
}
