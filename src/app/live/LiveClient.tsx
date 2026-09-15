'use client'

import BottomNav from "../components/BottomNav";
import TopBar, { type TopBarUser } from "../components/TopBar";

export type RoomEpisode = {
  id: string;
  title: string;
  airDate: string | null;
  show: string;
};

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

        <TopBar
          currentUser={currentUser}
          tabs={[
            { label: "Following", active: true },
            { label: "Friends" },
            { label: "Trending" },
          ]}
        />

        {/* ── Live Now ── */}
        {liveEpisodes.length > 0 && (
          <section className="space-y-2">
            <p className="px-0.5 text-[0.54rem] font-bold uppercase tracking-[0.22em] text-slate-500">
              Live Now
            </p>
            <div className="space-y-2">
              {liveEpisodes.map((episode) => (
                <div
                  key={episode.id}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5"
                >
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="text-[0.48rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
                      {episode.show}
                    </span>
                    <span className="ml-auto inline-flex items-center gap-[3px] rounded-full bg-rose-500/10 px-1.5 py-[2px] text-[0.38rem] font-semibold uppercase tracking-[0.06em] text-rose-400/80">
                      <span className="h-[3px] w-[3px] rounded-full bg-rose-400/70 animate-pulse" />
                      Live
                    </span>
                  </div>
                  <p className="text-[0.82rem] font-bold leading-snug text-white">
                    {episode.title}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Upcoming ── */}
        {upcomingEpisodes.length > 0 && (
          <section className="space-y-2">
            <p className="px-0.5 text-[0.54rem] font-bold uppercase tracking-[0.22em] text-slate-500">
              Upcoming
            </p>
            <div className="divide-y divide-white/[0.04] rounded-xl border border-white/[0.05] bg-white/[0.015] px-3">
              {upcomingEpisodes.map((episode) => (
                <div
                  key={episode.id}
                  className="flex items-start justify-between gap-2.5 py-2"
                >
                  <div className="flex min-w-0 flex-col gap-[2px]">
                    <span className="text-[0.42rem] text-slate-500">{episode.show}</span>
                    <p className="text-[0.6rem] font-medium leading-snug text-slate-300">
                      {episode.title}
                    </p>
                    <span className="text-[0.4rem] text-slate-600">
                      Opens when this starts
                    </span>
                  </div>
                  <span className="shrink-0 pt-[1px] text-[0.42rem] text-slate-500">
                    {formatLocalAirTime(episode.airDate)}
                  </span>
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
