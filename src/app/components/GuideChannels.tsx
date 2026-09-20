"use client";

import { useState } from "react";
import { channelPosters } from "../../../lib/standinImages";
import LocalTime from "./LocalTime";
import PosterBackground from "./PosterBackground";

type ChannelEntry = {
  channel: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    accent_color: string | null;
    genres: string[] | null;
  };
  episode: { episode_number: number | null; air_date: string | null } | null;
  isLive: boolean;
};

// Single-select, tap-to-clear — the smaller, more easily reversible version
// of chip filtering for a first cut (see docs/reports/guide-plan.md §5).
export default function GuideChannels({
  channelsOrdered,
  genreChips,
}: {
  channelsOrdered: ChannelEntry[];
  genreChips: string[];
}) {
  const [activeGenre, setActiveGenre] = useState<string | null>(null);

  const filtered = activeGenre
    ? channelsOrdered.filter(({ channel }) => channel.genres?.includes(activeGenre))
    : channelsOrdered;

  return (
    <>
      {genreChips.length > 0 && (
        <div className="-mx-4 overflow-x-auto px-4">
          <div className="flex gap-1.5">
            {genreChips.map((genre) => {
              const active = genre === activeGenre;
              return (
                <button
                  key={genre}
                  type="button"
                  onClick={() => setActiveGenre(active ? null : genre)}
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-caption font-medium transition ${
                    active
                      ? "border-white/20 bg-white/[0.12] text-white"
                      : "border-white/10 bg-white/[0.04] text-slate-400"
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {filtered.map(({ channel, episode, isLive }) => {
          const poster = channelPosters[channel.slug] ?? "";

          return (
            <article
              key={channel.id}
              className="flex flex-col overflow-hidden rounded-xl border border-white/10 shadow-sm"
              style={{
                borderLeftWidth: 2,
                borderLeftColor: channel.accent_color ?? undefined,
              }}
            >
              {/* Real, unobstructed image region — no scrim, since no text
                  ever sits over it (see docs/decisions.md's Channels-grid
                  entry for the full reasoning). Height + the info region's
                  padding below were both tuned against real rendered
                  measurements (Playwright, WebKit) to land in the 40-45%
                  image-height target, not eyeballed. Matches Up Next's
                  imagery-forward treatment in spirit without copying its
                  full-bleed, text-over-photo composition — that stays Up
                  Next's own. */}
              <div className="relative h-[88px] w-full shrink-0 bg-slate-900">
                {poster ? (
                  <PosterBackground
                    src={poster}
                    title=""
                    // Lanterns reuses its own hero photo here (see
                    // lib/standinImages.ts) — a tighter, higher crop than
                    // the full-card version this replaced, chosen for
                    // what actually reads at this card's new, much
                    // shorter image band rather than reusing the old
                    // full-card framing unexamined.
                    backgroundPosition={
                      channel.slug === "lanterns" ? "center 30%" : "center"
                    }
                    sizes="(max-width: 640px) 50vw, 320px"
                  />
                ) : (
                  // No mapped artwork (Survivor, Emmys): not a blank
                  // placeholder — a solid wash of the channel's own real,
                  // already-approved accent color, the same identity
                  // signal the left rail already carries, rather than a
                  // second copy of PosterBackground's generic gray
                  // no-image gradient sitting isolated in its own band.
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: channel.accent_color
                        ? `color-mix(in srgb, ${channel.accent_color} 22%, #0b0d12)`
                        : "#0b0d12",
                    }}
                  />
                )}
              </div>

              <div className="flex flex-1 flex-col justify-center gap-1 bg-slate-950 p-2">
                <p className="text-body font-bold leading-tight tracking-tight text-white">
                  {channel.name}
                </p>
                {channel.description && (
                  <p className="line-clamp-2 text-caption leading-snug text-slate-500">
                    {channel.description}
                  </p>
                )}
                <p
                  className={`text-caption leading-tight ${
                    isLive || episode ? "text-slate-500" : "text-slate-600"
                  }`}
                >
                  {isLive ? (
                    "Live now"
                  ) : episode ? (
                    <>
                      Next:{" "}
                      {episode.episode_number ? `E${episode.episode_number} · ` : ""}
                      <LocalTime iso={episode.air_date!} />
                    </>
                  ) : (
                    "No upcoming episodes"
                  )}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
