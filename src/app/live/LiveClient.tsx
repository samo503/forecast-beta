'use client'

import BottomNav from "../components/BottomNav";
import PosterBackground from "../components/PosterBackground";
import TopBar, { type TopBarUser } from "../components/TopBar";

export type RoomEpisode = {
  id: string;
  title: string;
  episodeNumber: number | null;
  airDate: string | null;
  show: string;
  accentColor: string | null;
};

// Two tiers only, matching PredictClient.tsx's restraint: upcoming rows get
// the same flat, full-strength accentColor left border every card there
// gets, no graduated intensity between them. Live is the one state that
// still gets extra weight — full strength plus this background wash — since
// it's the single most prominent thing on the page, not one point on a
// gradient of urgency.
function accentWash(color: string | null, percent: number): string | undefined {
  if (!color) return undefined;
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

// No explicit timeZone: this runs in the browser, so it defaults to the
// viewer's own local zone. Deliberately different from the homepage hero's
// air time, which is pinned to America/New_York on purpose (a fixed US
// broadcast time). Here the ask is the viewer's own local time.
function formatLocalAirTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Same relative-time vocabulary as /predict's closesInLabel, not a new one:
// "opens in 4d" and "closes in 4d" should read as the same kind of fact.
function opensInLabel(iso: string | null): string {
  if (!iso) return "";
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return "soon";
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

// Consecutive rows that share a channel repeat the same badge for no
// reason — the channel only needs naming once until it changes. Emphasis
// stays purely positional (this, and the list's existing air_date-ascending
// order): never keyed off a specific episode's title or id, so it keeps
// working unattended as episodes air and new ones are added.
function showsChannelBadge(episodes: RoomEpisode[], index: number): boolean {
  return index === 0 || episodes[index - 1].show !== episodes[index].show;
}

export default function LiveClient({
  currentUser,
  liveEpisodes,
  upcomingEpisodes,
}: {
  currentUser: TopBarUser | null;
  liveEpisodes: RoomEpisode[];
  upcomingEpisodes: RoomEpisode[];
}) {
  const hasNoRooms = liveEpisodes.length === 0 && upcomingEpisodes.length === 0;

  return (
    <main className="relative min-h-screen bg-[#020205] pb-28 text-white">
      <div className="mx-auto flex max-w-[640px] flex-col gap-6 px-4 pt-5">

        <TopBar currentUser={currentUser} />

        <div className="px-0.5">
          <h1 className="text-[0.72rem] font-black uppercase tracking-[0.2em] text-white">
            Live
          </h1>
          <p className="mt-1 text-[0.6rem] text-slate-500">
            What&apos;s airing now and up next.
          </p>
        </div>

        {/* ── Live Now ── */}
        {liveEpisodes.length > 0 && (
          <section className="space-y-2">
            <p className="px-0.5 text-[0.54rem] font-bold uppercase tracking-[0.22em] text-slate-500">
              Live Now
            </p>
            <div className="space-y-2">
              {liveEpisodes.map((episode, i) => (
                <div
                  key={episode.id}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5"
                  style={{
                    borderLeftWidth: 2,
                    borderLeftColor: episode.accentColor ?? undefined,
                    backgroundColor: accentWash(episode.accentColor, 8),
                  }}
                >
                  <div className="mb-1 flex items-center gap-1.5">
                    {showsChannelBadge(liveEpisodes, i) && (
                      <span className="text-[0.48rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
                        {episode.show}
                      </span>
                    )}
                    <span className="ml-auto inline-flex items-center gap-[3px] rounded-full bg-rose-500/10 px-1.5 py-[2px] text-[0.38rem] font-semibold uppercase tracking-[0.06em] text-rose-400/80">
                      <span className="h-[3px] w-[3px] rounded-full bg-rose-400/70 animate-pulse" />
                      Live
                    </span>
                  </div>
                  <p className="text-[0.82rem] font-bold leading-snug text-white">
                    {episode.title}
                  </p>
                  {episode.episodeNumber && (
                    <span className="text-[0.42rem] text-slate-500">
                      E{episode.episodeNumber}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Upcoming Rooms ── */}
        {upcomingEpisodes.length > 0 && (
          <section className="space-y-2">
            <p className="px-0.5 text-[0.54rem] font-bold uppercase tracking-[0.22em] text-slate-500">
              Upcoming Rooms
            </p>
            <div className="divide-y divide-white/[0.04] rounded-xl border border-white/[0.05] bg-white/[0.015] px-3">
              {upcomingEpisodes.map((episode, i) => (
                <div
                  key={episode.id}
                  className={`flex items-center gap-2.5 border-l-2 pl-2 ${
                    i === 0 ? "py-2" : "py-1.5"
                  }`}
                  style={
                    episode.accentColor
                      ? { borderLeftColor: episode.accentColor, borderLeftWidth: 2 }
                      : undefined
                  }
                >
                  {/* No real imagery exists for any channel yet — this is the
                      same honest fallback PosterBackground renders on Guide,
                      not a stand-in image pretending to be real art. */}
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg">
                    <PosterBackground src={null} title="" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                    {showsChannelBadge(upcomingEpisodes, i) && (
                      <span className="text-[0.42rem] text-slate-500">{episode.show}</span>
                    )}
                    <p className="text-[0.6rem] font-medium leading-snug text-slate-300">
                      {episode.title}
                    </p>
                    <span className="text-[0.4rem] text-slate-600">
                      {[
                        episode.episodeNumber ? `E${episode.episodeNumber}` : null,
                        episode.airDate ? formatLocalAirTime(episode.airDate) : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                  {episode.airDate && (
                    <span className="shrink-0 rounded-full bg-white/[0.06] px-1.5 py-[2px] text-[0.38rem] font-semibold uppercase tracking-[0.06em] text-slate-400">
                      Opens in {opensInLabel(episode.airDate)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {hasNoRooms && (
          <p className="px-0.5 text-[0.6rem] text-slate-600">No rooms scheduled.</p>
        )}

      </div>

      <BottomNav />
    </main>
  );
}
