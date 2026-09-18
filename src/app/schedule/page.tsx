import { supabase } from "../../../lib/supabase/client";
import { getCurrentUserBadge } from "../../../lib/supabase/current-user";
import { effectiveEpisodeStatus } from "../../lib/episodeStatus";
import ScheduleClient, { type ScheduleEpisode } from "./ScheduleClient";

const SCHEDULE_WINDOW_DAYS = 30;

export default async function Schedule() {
  const currentUserBadge = await getCurrentUserBadge();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + SCHEDULE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const { data: episodeRows } = await supabase
    .from("episodes")
    .select("*, channel:channels(*)")
    .in("status", ["live", "upcoming"])
    .lte("air_date", windowEnd.toISOString())
    .order("air_date", { ascending: true });

  // Same fetch-then-check shape as Guide's hero (src/app/page.tsx) — an
  // episode whose locks_at-adjacent prediction is open and not yet
  // locked gets a real destination; everything else in the schedule is
  // informational only, per the approved scope (no channel page yet).
  const { data: openPredictionRows } = await supabase
    .from("predictions")
    .select("episode_id")
    .eq("status", "open")
    .gt("locks_at", now.toISOString());
  const openPredictionEpisodeIds = new Set(
    (openPredictionRows ?? []).map((p) => p.episode_id)
  );

  // The ended-window exclusion still applies here exactly as it does on
  // Guide/Live — a stored 'upcoming' row whose live window has already
  // closed needs to read as ended and drop out, or the schedule would
  // show a passed episode as upcoming forever. Rows with no air_date are
  // excluded too: the schedule's whole point is grouping by date.
  const episodes: ScheduleEpisode[] = (episodeRows ?? [])
    .filter(
      (e) =>
        e.channel &&
        e.air_date &&
        effectiveEpisodeStatus(e.status, e.air_date, now) !== "ended"
    )
    .map((e) => ({
      id: e.id,
      title: e.title,
      episodeNumber: e.episode_number,
      airDate: e.air_date as string,
      show: e.channel.name,
      accentColor: e.channel.accent_color ?? null,
      isLive: effectiveEpisodeStatus(e.status, e.air_date, now) === "live",
      hasOpenPrediction: openPredictionEpisodeIds.has(e.id),
    }));

  return <ScheduleClient currentUser={currentUserBadge} episodes={episodes} />;
}
