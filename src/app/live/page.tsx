import { supabase } from "../../../lib/supabase/client";
import { getCurrentUserBadge } from "../../../lib/supabase/current-user";
import { episodeImageKey, liveEpisodeImages } from "../../../lib/standinImages";
import { effectiveEpisodeStatus } from "../../lib/episodeStatus";
import LiveClient, { type RoomEpisode } from "./LiveClient";

export default async function Live() {
  const currentUserBadge = await getCurrentUserBadge();

  // Each episode is its own room, scoped to the episode's own lifecycle
  // (upcoming -> live -> ended), not a permanent per-show channel. Ended
  // episodes have nothing to show here. Ascending air_date gives Upcoming
  // its required soonest-first order for free; Live Now's order isn't
  // specified, so the same order is fine there too.
  //
  // The query filters on the *stored* status, which only ever excludes
  // already-'ended' rows. A stored 'upcoming' episode whose air_date has
  // already passed the live window still comes back here and needs
  // effectiveEpisodeStatus() below to be read as 'ended' — otherwise it
  // would sit under "Opens in soon" forever once its air time passes.
  const { data: episodeRows } = await supabase
    .from("episodes")
    .select("id, title, episode_number, air_date, status, channel:channels(name, slug, accent_color)")
    .in("status", ["live", "upcoming"])
    .order("air_date", { ascending: true });

  const episodeRowsNonNull = episodeRows ?? [];
  const toRoomEpisode = (e: (typeof episodeRowsNonNull)[number]): RoomEpisode => {
    // Supabase's inferred type shapes a to-one embed as an array; the
    // actual response for this single-FK relation is a plain object, same
    // as every other channel embed in this app (e.g. predict/page.tsx's
    // p.channel.name).
    const channel = e.channel as unknown as { name: string; slug: string; accent_color: string | null } | null;
    return {
      id: e.id,
      title: e.title,
      episodeNumber: e.episode_number,
      airDate: e.air_date,
      show: channel?.name ?? "",
      accentColor: channel?.accent_color ?? null,
      image: channel ? liveEpisodeImages[episodeImageKey(channel.slug, e.episode_number)] ?? null : null,
    };
  };

  // Effectively-ended episodes (stored 'upcoming', air time already past
  // the live window) satisfy neither filter below and are silently
  // dropped, same as an actually-'ended' row already is by the query.
  const now = new Date();
  const liveEpisodes: RoomEpisode[] = episodeRowsNonNull
    .filter((e) => effectiveEpisodeStatus(e.status, e.air_date, now) === "live")
    .map(toRoomEpisode);
  const upcomingEpisodes: RoomEpisode[] = episodeRowsNonNull
    .filter((e) => effectiveEpisodeStatus(e.status, e.air_date, now) === "upcoming")
    .map(toRoomEpisode);

  return (
    <LiveClient
      currentUser={currentUserBadge}
      liveEpisodes={liveEpisodes}
      upcomingEpisodes={upcomingEpisodes}
    />
  );
}
