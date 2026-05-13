"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/store/useStore";

export function PauseOverlay() {
  const phase         = useStore((s) => s.session.phase);
  const resumeSession = useStore((s) => s.resumeSession);

  return (
    <AnimatePresence>
      {phase === "paused" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[var(--bg)]/90 backdrop-blur-sm rounded-2xl"
        >
          <span className="font-display text-4xl font-extrabold text-[var(--ink)]">Paused</span>
          <button
            onClick={resumeSession}
            className="px-10 py-3 rounded-2xl bg-[var(--green)] text-[var(--bg)] font-display font-bold text-lg tracking-widest uppercase shadow-[0_0_32px_var(--green-glow)]"
          >
            Resume
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
