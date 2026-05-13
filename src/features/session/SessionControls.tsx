"use client";

import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { cn } from "@/utils";

export function SessionControls() {
  const selectedTables = useStore((s) => s.selectedTables);
  const startSession   = useStore((s) => s.startSession);
  const learnedTables  = useStore((s) => s.retention.learnedTables);

  const canStart = selectedTables.length > 0;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-6">

      {/* Header */}
      <div className="text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-display text-3xl font-extrabold text-[var(--green-bright)] mb-2"
        >
          Ready to train?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[var(--ink-muted)] font-body text-sm max-w-xs text-center"
        >
          Select up to 2 tables from the sidebar. You'll answer 90 questions in 15 minutes.
        </motion.p>
      </div>

      {/* Selected tables preview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        className="flex gap-4"
      >
        {[0, 1].map((i) => {
          const t = selectedTables[i];
          return (
            <div
              key={i}
              className={cn(
                "w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-1",
                "border-2 transition-all duration-200",
                t
                  ? "border-[var(--green)] bg-[var(--green-dim)] shadow-[0_0_24px_var(--green-glow)]"
                  : "border-[var(--border)] bg-[var(--bg3)]"
              )}
            >
              {t ? (
                <>
                  <span className="font-mono font-bold text-2xl text-[var(--green-bright)]">{t}</span>
                  <span className="text-[9px] font-mono text-[var(--ink-muted)] uppercase tracking-widest">table</span>
                </>
              ) : (
                <span className="text-[var(--ink-faint)] text-2xl">+</span>
              )}
            </div>
          );
        })}
      </motion.div>

      {/* Session summary */}
      {canStart && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3 w-full max-w-sm"
        >
          {[
            { label: "Questions", value: "90" },
            { label: "Duration",  value: "15 min" },
            { label: "Per Q",     value: "~10 s" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[var(--bg3)] border border-[var(--border)]"
            >
              <span className="font-mono font-bold text-lg text-[var(--ink)]">{value}</span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-faint)]">{label}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Start button */}
      <motion.button
        whileHover={canStart ? { scale: 1.03 } : {}}
        whileTap={canStart ? { scale: 0.97 } : {}}
        onClick={startSession}
        disabled={!canStart}
        className={cn(
          "w-full max-w-sm py-4 rounded-2xl font-display font-bold text-xl tracking-widest uppercase",
          "transition-all duration-200",
          canStart
            ? "bg-[var(--green)] text-[var(--bg)] shadow-[0_0_40px_var(--green-glow)] hover:shadow-[0_0_56px_var(--green-glow)]"
            : "bg-[var(--bg3)] text-[var(--ink-faint)] border border-[var(--border)] cursor-not-allowed"
        )}
      >
        {canStart ? "Start Session" : "Select a Table"}
      </motion.button>

      {/* Learned tables count nudge */}
      {learnedTables.length > 0 && (
        <p className="text-[11px] text-[var(--ink-faint)] font-mono text-center">
          {learnedTables.length} table{learnedTables.length !== 1 ? "s" : ""} learned so far
        </p>
      )}
    </div>
  );
}
