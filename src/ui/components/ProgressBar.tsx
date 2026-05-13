"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils";

interface Props {
  progress: number;   // 0..1
  isWarning: boolean;
  className?: string;
}

export function ProgressBar({ progress, isWarning, className }: Props) {
  const color = isWarning
    ? "var(--danger)"
    : progress > 0.5
    ? "var(--green)"
    : "var(--amber)";

  return (
    <div
      className={cn(
        "w-full h-1.5 rounded-full overflow-hidden",
        "bg-[var(--bg3)]",
        className
      )}
    >
      <motion.div
        className="h-full rounded-full origin-left"
        style={{ backgroundColor: color }}
        animate={{ scaleX: progress }}
        transition={{ duration: 0.1, ease: "linear" }}
        initial={false}
      />
    </div>
  );
}
