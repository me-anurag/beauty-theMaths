"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useFeedback } from "@/hooks/useFeedback";

export function FeedbackFlash() {
  const feedback = useFeedback();

  const config = {
    correct: { bg: "rgba(61,186,85,0.15)", border: "var(--green)", label: "✓" },
    wrong:   { bg: "rgba(239,68,68,0.15)",  border: "var(--danger)", label: "✗" },
    timeout: { bg: "rgba(245,158,11,0.12)", border: "var(--amber)", label: "⏱" },
    streak:  { bg: "rgba(61,186,85,0.2)",   border: "var(--green-bright)", label: "🔥" },
  };

  return (
    <AnimatePresence>
      {feedback && (
        <motion.div
          key={feedback.kind + Date.now()}
          className="absolute inset-0 rounded-2xl pointer-events-none flex items-center justify-center"
          style={{
            backgroundColor: config[feedback.kind].bg,
            border: `1px solid ${config[feedback.kind].border}`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        />
      )}
    </AnimatePresence>
  );
}
