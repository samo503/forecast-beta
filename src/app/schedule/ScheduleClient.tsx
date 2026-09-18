"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "../components/BottomNav";
import LocalTime from "../components/LocalTime";
import TopBar, { type TopBarUser } from "../components/TopBar";

export type ScheduleEpisode = {
  id: string;
  title: string;
  episodeNumber: number | null;
  airDate: string;
  show: string;
  accentColor: string | null;
  isLive: boolean;
  hasOpenPrediction: boolean;
};

type DateGroup = {
  key: string;
  // One representative ISO timestamp from the group, for the heading's
  // <LocalTime variant="date"> — any member's date renders the same
  // local calendar day by construction.
  airDate: string;
  episodes: ScheduleEpisode[];
};

function localDateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// episodes arrives already sorted air_date ascending (the server query's
// own .order()), so a single linear pass groups correctly without
// re-sorting.
function groupByLocalDate(episodes: ScheduleEpisode[]): DateGroup[] {
  const groups: DateGroup[] = [];
  for (const episode of episodes) {
    const key = localDateKey(episode.airDate);
    const current = groups[groups.length - 1];
    if (current && current.key === key) {
      current.episodes.push(episode);
    } else {
      groups.push({ key, airDate: episode.airDate, episodes: [episode] });
    }
  }
  return groups;
}

// Viewer-local time, computed only post-mount — same reasoning as
// LocalTime.tsx (the server doesn't know the viewer's timezone). Doesn't
// go through LocalTime itself: its "full" variant repeats the weekday/date
// this page already shows once per date-group heading, and a second
// "time only" variant isn't otherwise needed anywhere else yet.
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ScheduleClient({
  currentUser,
  episodes,
}: {
  currentUser: TopBarUser | null;
  episodes: ScheduleEpisode[];
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Grouping depends on the viewer's local calendar date, which the
  // server can't know — nothing groups until after mount, the same
  // mount-then-fill pattern LocalTime.tsx uses for a single timestamp.
  const groups = mounted ? groupByLocalDate(episodes) : null;

  return (
    <main className="relative min-h-screen bg-[#020205] pb-28 text-white">
      <div className="mx-auto flex max-w-[640px] flex-col gap-6 px-4 pt-5">
        <TopBar currentUser={currentUser} />

        <div className="px-0.5">
          <h1 className="text-label font-black uppercase tracking-[0.2em] text-white">
            Schedule
          </h1>
          <p className="mt-1 text-caption text-slate-500">
            Everything airing in the next 30 days.
          </p>
        </div>

        {mounted && episodes.length === 0 && (
          <p className="px-0.5 text-caption text-slate-600">Nothing scheduled.</p>
        )}

        {groups?.map((group) => (
          <section key={group.key} className="space-y-2">
            <p className="px-0.5 text-caption font-bold uppercase tracking-[0.24em] text-slate-500">
              <LocalTime iso={group.airDate} variant="date" />
            </p>
            <div className="divide-y divide-white/[0.04] rounded-xl border border-white/[0.08] bg-white/[0.015] px-3">
              {group.episodes.map((episode) => (
                <ScheduleRow key={episode.id} episode={episode} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}

function ScheduleRow({ episode }: { episode: ScheduleEpisode }) {
  const inner = (
    <div
      className="flex items-center gap-2.5 border-l-2 py-2 pl-2"
      style={
        episode.accentColor
          ? { borderLeftColor: episode.accentColor, borderLeftWidth: 2 }
          : undefined
      }
    >
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="text-micro text-slate-500">{episode.show}</span>
        <p className="text-caption font-medium leading-snug text-slate-300">
          {episode.title}
        </p>
        <span className="text-micro text-slate-600">
          {episode.episodeNumber ? `E${episode.episodeNumber} · ` : ""}
          {formatTime(episode.airDate)}
        </span>
      </div>

      {episode.isLive ? (
        <span className="inline-flex shrink-0 items-center gap-[3px] rounded-full bg-rose-500/10 px-1.5 py-[2px] text-micro font-semibold uppercase tracking-[0.06em] text-rose-400/80">
          <span className="h-[3px] w-[3px] rounded-full bg-rose-400/70 animate-pulse" />
          Live
        </span>
      ) : episode.hasOpenPrediction ? (
        <span className="shrink-0 rounded-full bg-white/[0.06] px-1.5 py-[2px] text-micro font-semibold uppercase tracking-[0.06em] text-slate-500">
          Predict
        </span>
      ) : null}
    </div>
  );

  // Per the approved scope: an open-prediction row links to the
  // prediction collection, an effectively-live row links to /live
  // generally (no per-episode room route exists), and everything else
  // is informational text — no channel page to send it to yet.
  if (episode.isLive) {
    return (
      <Link href="/live" className="block">
        {inner}
      </Link>
    );
  }
  if (episode.hasOpenPrediction) {
    return (
      <Link href={`/predict/${episode.id}`} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
