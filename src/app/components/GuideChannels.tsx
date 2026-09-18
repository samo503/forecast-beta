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
          const renderTypography = !poster;

          return (
            <article
              key={channel.id}
              className="min-h-[150px] overflow-hidden rounded-xl border border-white/10 bg-slate-950/10 shadow-sm"
              style={{
                borderLeftWidth: 2,
                borderLeftColor: channel.accent_color ?? undefined,
              }}
            >
              <div className="relative h-full">
                {renderTypography ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-slate-900 to-slate-800 px-4" />
                ) : (
                  <PosterBackground
                    src={poster}
                    title=""
                    // Lanterns reuses its own hero photo here (see
                    // lib/standinImages.ts) — a lower crop keeps this
                    // card visually distinct from the hero's framing
                    // of the same source image.
                    backgroundPosition={
                      channel.slug === "lanterns" ? "center 75%" : "center"
                    }
                    sizes="(max-width: 640px) 50vw, 320px"
                  />
                )}

                {/* A real scrim, not a fading tint. Measured (20th-
                    percentile-darkest pixel behind the description
                    line, avoiding glyph-pixel contamination in a
                    plain average): the original from-slate-950/85
                    blend measured 3.28:1 for Lanterns specifically
                    (3.82–4.23:1 for the other two, photo-dependent
                    either way) against text-slate-500. A semi-
                    transparent overlay always lets some of the
                    photo's own brightness through no matter how far
                    the stops are pushed — text-slate-500 against
                    genuine black tops out around 4.3:1 regardless
                    (that's its own luminance's ceiling, not a
                    background problem), so closing the gap needs the
                    region directly behind the text to be *opaque*,
                    not blended. from-slate-950/via-slate-950 (both
                    fully opaque — no percent-based alpha) through
                    90% of the card's height makes that whole region
                    solid and photo-independent regardless of exactly
                    where a given channel's text block starts. Pushed
                    from the original 82% after a real-device check on
                    Lanterns specifically still read as low-contrast
                    against its cloud/lightning image — the extra
                    margin covers description-length variance across
                    channels (four now, not three) rather than
                    re-measuring one fixed line count. Only the top
                    ~10% still fades to transparent and shows the
                    source photo. */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 from-0% via-slate-950 via-90% to-transparent" />

                <div className="relative flex h-full flex-col justify-end p-3">
                  <div className="space-y-1">
                    <p className="text-body font-bold tracking-tight text-white">
                      {channel.name}
                    </p>
                    {channel.description && (
                      <p className="line-clamp-2 text-caption text-slate-500">
                        {channel.description}
                      </p>
                    )}
                    <p
                      className={`text-caption ${
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
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
