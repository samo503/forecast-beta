import { supabase } from "../../../lib/supabase/client";
import { getCurrentUserBadge } from "../../../lib/supabase/current-user";
import LiveClient, { type RoomEpisode } from "./LiveClient";

export default async function Live() {
  const currentUserBadge = await getCurrentUserBadge();

  // Each episode is its own room, scoped to the episode's own lifecycle
  // (upcoming -> live -> ended), not a permanent per-show channel. Ended
  // episodes have nothing to show here. Ascending air_date gives Upcoming
  // its required soonest-first order for free; Live Now's order isn't
  // specified, so the same order is fine there too.
  const { data: episodeRows } = await supabase
    .from("episodes")
    .select("id, title, air_date, status, channel:channels(name, accent_color)")
    .in("status", ["live", "upcoming"])
    .order("air_date", { ascending: true });

  const episodeRowsNonNull = episodeRows ?? [];
  const toRoomEpisode = (e: (typeof episodeRowsNonNull)[number]): RoomEpisode => {
    // Supabase's inferred type shapes a to-one embed as an array; the
    // actual response for this single-FK relation is a plain object, same
    // as every other channel embed in this app (e.g. predict/page.tsx's
    // p.channel.name).
    const channel = e.channel as unknown as { name: string; accent_color: string | null } | null;
    return {
      id: e.id,
      title: e.title,
      airDate: e.air_date,
      show: channel?.name ?? "",
      accentColor: channel?.accent_color ?? null,
    };
  };

  const liveEpisodes: RoomEpisode[] = episodeRowsNonNull
    .filter((e) => e.status === "live")
    .map(toRoomEpisode);
  const upcomingEpisodes: RoomEpisode[] = episodeRowsNonNull
    .filter((e) => e.status === "upcoming")
    .map(toRoomEpisode);

  return (
    <LiveClient
      currentUser={currentUserBadge}
      liveEpisodes={liveEpisodes}
      upcomingEpisodes={upcomingEpisodes}
    />
  );
}
