"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import type { FeedbackEvent } from "@/types";

/**
 * Consumes feedback events from the store, holds them briefly for animation,
 * then clears them. Returns the current active feedback for UI to animate.
 */
export function useFeedback(): FeedbackEvent | null {
  const feedback = useStore((s) => s.feedback);
  const clearFeedback = useStore((s) => s.clearFeedback);
  const [active, setActive] = useState<FeedbackEvent | null>(null);

  useEffect(() => {
    if (!feedback) return;
    setActive(feedback);
    const t = setTimeout(() => {
      setActive(null);
      clearFeedback();
    }, 350);
    return () => clearTimeout(t);
  }, [feedback, clearFeedback]);

  return active;
}
