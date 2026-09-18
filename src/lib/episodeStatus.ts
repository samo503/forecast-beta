// A stored 'upcoming' episode never flips to 'live' or 'ended' on its own —
// nothing writes to episodes.status except a manual admin action (same
// pattern as predictions, minus even the lazy lock_expired_prediction()
// self-heal). Guide and Live both need to *display* the truth as air time
// passes without waiting on that manual update, the same way Guide's old
// displayEpisodeStatus already did for the upcoming->live transition — this
// just makes that a shared, pure function and adds the live->ended half
// that never existed anywhere before (Guide used to show a passed episode
// as "Live" forever).
//
// LIVE_WINDOW_MINUTES is now only the fallback for an episode with no real
// duration set. episodes.runtime_minutes (migration 0014) carries the real
// per-episode figure where it's known; pass it as the 4th argument below.
// An episode with no runtime_minutes set (nullable, not backfilled for
// every row — see 0014) falls back to this exact 90-minute behavior, so
// this constant staying at 90 is a deliberate no-regression choice, not
// an arbitrary one. Content whose real length is still genuinely unknown
// or open-ended at air time (not just "longer than 90 minutes" — a known
// duration should go in runtime_minutes instead) still needs the manual
// 'live' override kept in place by hand for its actual duration. A stored
// 'live' status is exempt from this window entirely (see the rule below),
// which is what makes that manual override possible.
export const LIVE_WINDOW_MINUTES = 90;

export type EffectiveEpisodeStatus = "upcoming" | "live" | "ended";

// Pure: no I/O, no Date.now() read internally, never writes to the
// database. `now` is a parameter specifically so this is testable without
// mocking the clock.
export function effectiveEpisodeStatus(
  storedStatus: string,
  airDate: string | null,
  now: Date,
  runtimeMinutes?: number | null
): EffectiveEpisodeStatus {
  if (storedStatus === "ended") return "ended";

  // Manual override, unchanged: once someone sets it live, it stays live
  // until they change it themselves. No auto-expiry — see the
  // LIVE_WINDOW_MINUTES comment above for why that's true only here.
  if (storedStatus === "live") return "live";

  // storedStatus === "upcoming" from here down.
  if (!airDate) return "upcoming";

  const airTime = new Date(airDate).getTime();
  const nowTime = now.getTime();

  if (nowTime < airTime) return "upcoming";

  const windowMs = (runtimeMinutes ?? LIVE_WINDOW_MINUTES) * 60 * 1000;
  if (nowTime <= airTime + windowMs) return "live";

  return "ended";
}
