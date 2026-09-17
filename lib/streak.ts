// Week streak — participation-based: counts consecutive Monday–Sunday
// calendar weeks with at least one locked-in pick, regardless of whether
// it was correct. Live-computed from user_predictions.created_at on every
// read, not stored or maintained by a trigger — there's no
// profiles.streak_count write path.
//
// Weekly, not daily: Lanterns and most content on this app air weekly, so
// a consecutive-*day* streak broke every single week for every user by
// construction — it was measuring the wrong cadence entirely, not a real
// gap in participation.
//
// The week boundary uses a fixed timezone (STREAK_TIMEZONE below), not
// profiles.timezone. Weeks here track the broadcast schedule (Sunday
// evening, Pacific time), not each viewer's own clock — unlike the old
// per-user day boundary, which existed specifically to match individual
// viewing habits that no longer matter once the unit is "did you show up
// this broadcast week" rather than "did you show up today." This also
// means profiles.timezone (captured at signup, see AuthForm.tsx and
// migration 0005) has no remaining reader anywhere in the app — dormant
// now, same as profiles.streak_count.
//
// The timezone is a named constant, not left to the server's own clock:
// this runs server-side on Vercel, which runs UTC, so "local time" would
// silently mean UTC if this weren't explicit.
const STREAK_TIMEZONE = "America/Los_Angeles";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

// The calendar date (in STREAK_TIMEZONE) that `date` falls on, as
// {year, month, day} — independent of the server process's own timezone.
function localDateParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: STREAK_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

// A UTC-noon Date standing in for a calendar date, used purely as a
// day-granularity counter. Anchoring at noon (rather than midnight) keeps
// whole-day/whole-week arithmetic away from any DST transition boundary.
function dateFromParts({ year, month, day }: { year: number; month: number; day: number }): Date {
  return new Date(Date.UTC(year, month - 1, day, 12));
}

// Mon=0 .. Sun=6, from JS's native Sun=0..Sat=6.
function isoWeekday(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

// The Monday (in STREAK_TIMEZONE) that starts the Mon–Sun week containing
// `date`, as a stable "YYYY-MM-DD" key. A Sunday-night pick belongs to the
// week that started the Monday before it, not the Monday after.
function weekKey(date: Date): string {
  const local = dateFromParts(localDateParts(date));
  const monday = new Date(local.getTime() - isoWeekday(local) * ONE_DAY_MS);
  return monday.toISOString().slice(0, 10);
}

export function computeStreak(pickTimestamps: string[]): number {
  if (!pickTimestamps.length) return 0;

  const weeks = new Set(pickTimestamps.map((ts) => weekKey(new Date(ts))));

  const thisWeek = weekKey(new Date());
  const lastWeek = weekKey(new Date(Date.now() - ONE_WEEK_MS));

  // The streak is only still "alive" if this week or last week has a
  // pick. An empty current week doesn't break the streak by itself — it
  // breaks only once last week is empty too, since the current week
  // simply hasn't finished yet from the streak's point of view. This is
  // the reason a streak continues from last week when this week has
  // nothing in it yet, rather than dropping to 0 the moment Monday turns
  // over with no pick.
  let cursor: Date;
  if (weeks.has(thisWeek)) {
    cursor = new Date(`${thisWeek}T12:00:00Z`);
  } else if (weeks.has(lastWeek)) {
    cursor = new Date(`${lastWeek}T12:00:00Z`);
  } else {
    return 0;
  }

  let streak = 0;
  while (weeks.has(weekKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - ONE_WEEK_MS);
  }
  return streak;
}
