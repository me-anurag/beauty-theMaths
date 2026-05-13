"use client";

import { useStore } from "@/store/useStore";
import { Sidebar } from "@/features/sidebar/Sidebar";
import { SessionControls } from "@/features/session/SessionControls";
import { QuestionDisplay } from "@/features/session/QuestionDisplay";
import { SessionHeader } from "@/features/session/SessionHeader";
import { PauseOverlay } from "@/features/session/PauseOverlay";
import { AnalyticsView } from "@/features/analytics-view/AnalyticsView";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/utils";
import { useState } from "react";

export default function HomePage() {
  const phase = useStore((s) => s.session.phase);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full w-full overflow-hidden">

      {/* ── Desktop Sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-[220px] shrink-0 border-r border-[var(--border)] bg-[var(--panel)] flex-col overflow-hidden">
        <Sidebar />
      </aside>

      {/* ── Mobile Sidebar Drawer ────────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-[260px] bg-[var(--panel)] border-r border-[var(--border)] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <span className="font-display font-bold text-sm text-[var(--green-bright)]">Tables</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-[var(--ink-muted)] hover:text-[var(--ink)] text-lg"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar (idle / complete) */}
        {(phase === "idle" || phase === "complete") && (
          <div className="md:hidden flex items-center px-4 py-3 border-b border-[var(--border)] bg-[var(--panel)] shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-[var(--ink-muted)] hover:text-[var(--ink)] font-mono text-sm flex items-center gap-2"
            >
              <span className="text-base">☰</span>
              <span>Tables</span>
            </button>
          </div>
        )}

        {/* Session header (active / paused) */}
        <SessionHeader />

        {/* Body */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">

            {phase === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                <SessionControls />
              </motion.div>
            )}

            {(phase === "active" || phase === "paused") && (
              <motion.div
                key="active"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 p-4 flex flex-col"
              >
                <QuestionDisplay />
                <PauseOverlay />
              </motion.div>
            )}

            {phase === "complete" && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 p-4 overflow-y-auto"
              >
                <AnalyticsView />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
