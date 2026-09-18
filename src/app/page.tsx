import Link from "next/link";
import {
  tonightsBrief,
  type HeroFeedShow,
} from "../../lib/mock-data";
import { supabase } from "../../lib/supabase/client";
import { getCurrentUserBadge } from "../../lib/supabase/current-user";
import {
  channelPosters,
  episodeImageKey,
  heroEpisodeImages,
} from "../../lib/standinImages";
import { effectiveEpisodeStatus } from "../lib/episodeStatus";
import BottomNav from "./components/BottomNav";
import LocalTime from "./components/LocalTime";
import PosterBackground from "./components/PosterBackground";
import TopBar from "./components/TopBar";

// "Tonight's Brief" is entirely mock (lib/mock-data.ts's tonightsBrief) —
// none of its 5 items correspond to a real channel/prediction (Survivor,
// Big Brother, Love Is Blind, The Bachelor, House of the Dragon). Hidden
// until there's real content to back it; data intentionally left in place.
const SHOW_TONIGHTS_BRIEF = false;

// Fixed order, not alphabetical or derived — see docs/decisions.md's
// Genre section. Chips render in this order regardless of which channels
// exist or when they were seeded, filtered down to genres at least one
// channel actually carries.
const GENRE_VOCABULARY = [
  "Drama", "Comedy", "Reality", "Competition",
  "Sci-Fi", "Sports", "Awards", "Documentary",
] as const;

const briefTheme: Record<string, { color: string }> = {
  "PREDICTION OPEN": { color: "#fb7185" }, // prediction mechanic — signal pink
  "RETURNING":       { color: "#22d3ee" }, // editorial/news — cyan
  "RECOMMENDED":     { color: "#fbbf24" }, // buzz/social — amber
  "CASTING":         { color: "#fbbf24" }, // buzz/social — amber
  "RENEWED":         { color: "#22d3ee" }, // editorial/news — cyan
  "TV NEWS":         { color: "#22d3ee" }, // editorial/news — cyan
  "TRENDING":        { color: "#22d3ee" }, // editorial/news — cyan
};

export default async function Home() {
  const currentUserBadge = await getCurrentUserBadge();
  const now = new Date();

  const { data: channelRows } = await supabase
    .from("channels")
    .select("*")
    .order("channel_number");

  const { data: episodeRows } = await supabase
    .from("episodes")
    .select("*, channel:channels(*)")
    .in("status", ["live", "upcoming"])
    .order("air_date", { ascending: true });

  // Real, not derived from predictions.status alone: a prediction whose
  // locks_at has passed but whose status hasn't been synced yet (the same
  // lazy-transition gap /predict's own lock_expired_prediction() exists
  // to self-heal) shouldn't read as "open" here either — mirrors the
  // check migration 0011 added at the database level for the same reason.
  const { data: openPredictionRows } = await supabase
    .from("predictions")
    .select("episode_id")
    .eq("status", "open")
    .gt("locks_at", now.toISOString());
  const openPredictionEpisodeIds = new Set(
    (openPredictionRows ?? []).map((p) => p.episode_id)
  );

  // One slot per channel — its most urgent non-ended episode (soonest
  // upcoming, or the one currently live) — shared by the hero strip and
  // the channel grid below rather than computed twice. Ascending air_date
  // order means the first non-ended occurrence per channel is already its
  // most urgent one: a computed-live episode (past air_date, still stored
  // as 'upcoming') always sorts before that channel's actual future
  // episodes.
  const channelEpisode = new Map<string, NonNullable<typeof episodeRows>[number]>();
  for (const e of episodeRows ?? []) {
    if (!e.channel || channelEpisode.has(e.channel_id)) continue;
    if (effectiveEpisodeStatus(e.status, e.air_date, now) === "ended") continue;
    channelEpisode.set(e.channel_id, e);
  }

  // ── Up Next hero ──
  const HERO_LIMIT = 8;
  const heroFeed: HeroFeedShow[] = [...channelEpisode.values()]
    .slice(0, HERO_LIMIT)
    .map((e, idx) => ({
      id: idx,
      kind: "show",
      episodeId: e.id,
      isLive: effectiveEpisodeStatus(e.status, e.air_date, now) === "live",
      hasOpenPrediction: openPredictionEpisodeIds.has(e.id),
      title: e.title,
      subtitle: e.channel.name,
      detail: e.episode_number ? `E${e.episode_number}` : "",
      airDate: e.air_date,
      accentColor: e.channel.accent_color ?? null,
      poster:
        heroEpisodeImages[episodeImageKey(e.channel.slug, e.episode_number)] ??
        channelPosters[e.channel.slug] ??
        "",
    }));

  // The section heading/subtitle describe the primary (first) hero card
  // specifically, not "is anything in the strip live" — each card still
  // carries its own pill/CTA independently for whatever else is in the
  // strip (e.g. the next channel's upcoming episode peeking in beside it).
  const primaryHero = heroFeed[0] as HeroFeedShow | undefined;
  const heroHeading = primaryHero?.isLive ? "Live now" : "Up next";
  const heroSubtitle = primaryHero?.isLive
    ? "Picks are locked until results are in."
    : "Upcoming episodes you can predict.";

  // ── Channels ──
  // Live first, then soonest upcoming episode, then channels with nothing
  // upcoming — never channels.status, which is manual and can say
  // anything regardless of what's actually scheduled (see docs/status.md's
  // "three independent status columns" finding). Name is the stable
  // tiebreak within each tier.
  const channelsOrdered = (channelRows ?? [])
    .map((c) => {
      const episode = channelEpisode.get(c.id) ?? null;
      const isLive = episode
        ? effectiveEpisodeStatus(episode.status, episode.air_date, now) === "live"
        : false;
      return { channel: c, episode, isLive };
    })
    .sort((a, b) => {
      const rank = (x: (typeof channelsOrdered)[number]) =>
        x.isLive ? 0 : x.episode ? 1 : 2;
      const rankDiff = rank(a) - rank(b);
      if (rankDiff !== 0) return rankDiff;
      if (!a.isLive && !b.isLive && a.episode && b.episode) {
        const dateDiff =
          new Date(a.episode.air_date!).getTime() - new Date(b.episode.air_date!).getTime();
        if (dateDiff !== 0) return dateDiff;
      }
      return a.channel.name.localeCompare(b.channel.name);
    });

  // Vocabulary filtered to members present, not the present set sorted —
  // keeps chip order stable (Drama always before Comedy if both exist)
  // regardless of channel order or how many channels exist.
  const presentGenres = new Set((channelRows ?? []).flatMap((c) => c.genres ?? []));
  const genreChips = GENRE_VOCABULARY.filter((g) => presentGenres.has(g));

  return (
    <main className="relative min-h-screen bg-[#020205] pb-28 text-white">
      <div className="mx-auto flex max-w-[640px] flex-col gap-6 px-4 pt-5">
        <TopBar currentUser={currentUserBadge} />

        {heroFeed.length > 0 && (
        <section className="space-y-2">
          <div className="space-y-0.5">
            <p
              className={`text-label uppercase tracking-[0.32em] ${
                primaryHero?.isLive ? "text-rose-400" : "text-cyan-400"
              }`}
            >
              {heroHeading}
            </p>
            <p className="text-caption text-slate-500">{heroSubtitle}</p>
          </div>

          <div className="-mx-4 overflow-x-auto px-4 pb-2">
            <div className="flex gap-4">
              {heroFeed.map((item) => {
                return (
                  <article
                    key={item.id}
                    className="w-[82vw] max-w-[480px] aspect-[16/9] shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-sm"
                    style={{
                      borderLeftWidth: 2,
                      borderLeftColor: item.accentColor ?? undefined,
                    }}
                  >
                    <div className="relative h-full bg-slate-950">
                      {/* title="" — the title is already shown below as the h2 */}
                      <PosterBackground
                        src={item.poster}
                        title=""
                        sizes="(max-width: 480px) 82vw, 480px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/96 via-slate-950/10 opacity-80" />
                      <div className="relative flex h-full flex-col justify-between p-3">
                        {/* Top row: live / predictions-open pill, or nothing */}
                        <div className="flex items-center justify-end gap-2">
                          {item.isLive ? (
                            <span className="inline-flex items-center gap-[5px] rounded-full bg-rose-500/10 px-2 py-[3px] text-caption font-semibold uppercase tracking-[0.08em] text-rose-300">
                              <span className="h-[5px] w-[5px] rounded-full bg-rose-400 animate-pulse" />
                              Live Now
                            </span>
                          ) : item.hasOpenPrediction ? (
                            <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-caption font-semibold uppercase tracking-[0.1em] text-slate-300">
                              Predictions open
                            </span>
                          ) : null}
                        </div>

                        {/* Bottom: subtitle → title → episode/time → CTA */}
                        <div>
                          <p className="text-caption font-semibold uppercase tracking-[0.14em] text-slate-500">
                            {item.subtitle}
                          </p>
                          <h2 className="text-display font-extrabold leading-tight text-white">
                            {item.title}
                          </h2>
                          <p className="mt-0.5 text-body leading-snug text-slate-300/75">
                            {item.detail}
                            {item.detail && item.airDate && " · "}
                            {item.airDate && <LocalTime iso={item.airDate} />}
                          </p>

                          {!item.isLive && item.hasOpenPrediction && (
                            <Link
                              href={`/predict?episode=${item.episodeId}`}
                              className="mt-2 inline-flex w-fit items-center rounded-full bg-brand/15 px-3 py-1.5 text-caption font-semibold text-brand transition hover:bg-brand/25"
                            >
                              Make a prediction
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
        )}

        <section className="space-y-2">
          <p className="px-0.5 text-caption font-bold uppercase tracking-[0.24em] text-slate-500">
            Channels
          </p>

          {genreChips.length > 0 && (
            <div className="-mx-4 overflow-x-auto px-4">
              <div className="flex gap-1.5">
                {genreChips.map((genre) => (
                  <span
                    key={genre}
                    className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-caption font-medium text-slate-400"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {channelsOrdered.map(({ channel, episode, isLive }) => {
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
        </section>

        {SHOW_TONIGHTS_BRIEF && (
        <section className="space-y-2.5">
          {/* Section header */}
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.28em] text-slate-200">
              Tonight&apos;s Brief
            </p>
            <button className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[0.44rem] font-medium uppercase tracking-[0.1em] text-slate-600 transition hover:text-slate-400">
              See all
            </button>
          </div>

          {/* Featured card — Survivor, cinematic with dual vignette */}
          {(() => {
            const f = tonightsBrief[0];
            const ft = briefTheme[f.category] ?? briefTheme["TV NEWS"];
            return (
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
                <PosterBackground src={f.image} title={f.headline} backgroundPosition="center 42%" titleClassName="text-base" />
                {/* Subtle top vignette for cinematic frame */}
                <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/30 to-transparent" />
                {/* Rich bottom gradient for text legibility */}
                <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/94 via-black/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3.5">
                  <div className="mb-2 h-[2px] w-5 rounded-full" style={{ backgroundColor: ft.color }} />
                  <span
                    className="mb-1.5 inline-block rounded-full border px-1.5 py-px text-[0.44rem] font-semibold uppercase tracking-[0.07em]"
                    style={{ color: ft.color, borderColor: `${ft.color}45`, backgroundColor: `${ft.color}18` }}
                  >
                    {f.category}
                  </span>
                  <p className="text-[1.05rem] font-black leading-snug text-white">{f.headline}</p>
                  <div className="mt-1.5 flex items-end justify-between gap-2">
                    <p className="text-[0.62rem] leading-snug text-white/70">{f.context}</p>
                    <button className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[0.68rem] text-white backdrop-blur-sm">
                      →
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Medium editorial pair — different crop per card for rhythm */}
          <div className="flex gap-2">
            {[tonightsBrief[1], tonightsBrief[2]].map((card, i) => {
              const ct = briefTheme[card.category] ?? briefTheme["TV NEWS"];
              return (
                <div
                  key={card.id}
                  className={`relative h-[132px] overflow-hidden rounded-xl ${i === 0 ? "w-[54%]" : "flex-1"}`}
                >
                  <PosterBackground
                    src={card.image}
                    title={card.headline}
                    backgroundPosition={i === 0 ? "center 15%" : "center 62%"}
                    titleClassName="text-sm"
                  />
                  {/* Subtle top scrim so pill stays legible */}
                  <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/92 via-black/30 to-transparent" />
                  <div className="relative flex h-full flex-col justify-between p-2.5">
                    <span
                      className="self-start rounded-full border px-1.5 py-px text-[0.42rem] font-semibold uppercase tracking-[0.07em]"
                      style={{ color: ct.color, borderColor: `${ct.color}45`, backgroundColor: `${ct.color}18` }}
                    >
                      {card.category}
                    </span>
                    <p className="text-[0.76rem] font-bold leading-snug text-white">{card.headline}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Slim strips — portrait crops show face/upper, image bleeds right */}
          <div className="space-y-1.5">
            {[tonightsBrief[3], tonightsBrief[4]].map((card, i) => {
              const ct = briefTheme[card.category] ?? briefTheme["TV NEWS"];
              return (
                <div
                  key={card.id}
                  className="relative h-[72px] overflow-hidden rounded-xl"
                >
                  <PosterBackground
                    src={card.image}
                    title=""
                    backgroundPosition={i === 0 ? "center top" : "center 25%"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/84 via-black/42 to-black/5" />
                  <div className="relative flex h-full items-center gap-3 px-3.5">
                    <div
                      className="h-6 w-[2px] shrink-0 rounded-full opacity-90"
                      style={{ backgroundColor: ct.color }}
                    />
                    <div className="flex flex-col gap-[4px]">
                      <span
                        className="self-start rounded-full border px-1.5 py-px text-[0.41rem] font-semibold uppercase tracking-[0.06em]"
                        style={{ color: ct.color, borderColor: `${ct.color}45`, backgroundColor: `${ct.color}18` }}
                      >
                        {card.category}
                      </span>
                      <p className="text-[0.8rem] font-bold leading-tight text-white">{card.headline}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
