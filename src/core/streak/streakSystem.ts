/**
 * Streak System
 *
 * Tracks consecutive correct answers.
 * Emits milestone events at 5, 10, 15, 20...
 */

export const STREAK_MILESTONES = [5, 10, 15, 20, 30, 50];

export function isMilestone(streak: number): boolean {
  return STREAK_MILESTONES.includes(streak);
}

export function getStreakLabel(streak: number): string {
  if (streak >= 30) return "🔥 INFERNO";
  if (streak >= 20) return "⚡ LIGHTNING";
  if (streak >= 15) return "💥 BLAZING";
  if (streak >= 10) return "🚀 ON FIRE";
  if (streak >= 5)  return "✨ STREAK";
  return "";
}

export function getStreakColor(streak: number): string {
  if (streak >= 20) return "#f59e0b";   // amber
  if (streak >= 10) return "#5de878";   // bright green
  if (streak >= 5)  return "#3dba55";   // green
  return "#6b9e77";                      // muted
}
