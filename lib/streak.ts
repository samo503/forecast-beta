// Day streak — participation-based: counts consecutive calendar days (UTC)
// with at least one locked-in pick, regardless of whether it was correct.
// Live-computed from user_predictions.created_at on every read, not stored
// or maintained by a trigger — there's no profiles.streak_count write path.
export function computeStreak(pickTimestamps: string[]): number {
  if (!pickTimestamps.length) return 0;

  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const days = new Set(pickTimestamps.map((ts) => dayKey(new Date(ts))));

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  // The streak is only still "alive" if today or yesterday has a pick —
  // otherwise it's already broken, regardless of how long a run preceded it.
  let cursor: Date;
  if (days.has(dayKey(today))) {
    cursor = today;
  } else if (days.has(dayKey(yesterday))) {
    cursor = yesterday;
  } else {
    return 0;
  }

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
