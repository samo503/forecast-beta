// Day streak — participation-based: counts consecutive local calendar days
// with at least one locked-in pick, regardless of whether it was correct.
// Live-computed from user_predictions.created_at on every read, not stored
// or maintained by a trigger — there's no profiles.streak_count write path.
//
// "Local" means profiles.timezone — captured once at signup from the
// browser's Intl API and never updated afterward (see migration 0005).
// This app is tied to real-time evening TV, so a UTC day boundary would
// drift from when people actually use it; a per-user IANA timezone string
// keeps the streak's "midnight" matching the user's own day.
function dayKey(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    // Guards against a corrupt/invalid stored timezone string — falls
    // back to UTC rather than throwing.
    return date.toISOString().slice(0, 10);
  }
}

export function computeStreak(pickTimestamps: string[], timezone: string): number {
  if (!pickTimestamps.length) return 0;

  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const days = new Set(pickTimestamps.map((ts) => dayKey(new Date(ts), timezone)));

  const today = new Date();
  const yesterday = new Date(today.getTime() - ONE_DAY_MS);

  // The streak is only still "alive" if today or yesterday has a pick —
  // otherwise it's already broken, regardless of how long a run preceded it.
  let cursor: Date;
  if (days.has(dayKey(today, timezone))) {
    cursor = today;
  } else if (days.has(dayKey(yesterday, timezone))) {
    cursor = yesterday;
  } else {
    return 0;
  }

  let streak = 0;
  while (days.has(dayKey(cursor, timezone))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - ONE_DAY_MS);
  }
  return streak;
}
