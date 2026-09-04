import {
  categories,
  tonightsBrief,
  type ChannelCard,
  type HeroFeedShow,
} from "../../lib/mock-data";
import { supabase } from "../../lib/supabase/client";
import { getCurrentUserBadge } from "../../lib/supabase/current-user";
import BottomNav from "./components/BottomNav";
import PosterBackground from "./components/PosterBackground";
import TopBar from "./components/TopBar";

// Channel art isn't in the schema yet — keyed by slug until channels gain a poster column.
const channelPosters: Record<string, string> = {
  "love-island-usa":
    "https://deadline.com/wp-content/uploads/2025/06/love-island-usa-season-7-recoupling.jpg?w=1000&h=667&crop=1",
};

const channelStatusLabel: Record<string, string> = {
  live: "LIVE",
  upcoming: "RETURNS",
  off_air: "OFF-AIR",
  off_season: "OFF-SEA",
  pilot: "COMING SOON",
};

const episodeStatusLabel: Record<string, string> = {
  live: "LIVE",
  upcoming: "UPCOMING",
  ended: "FINAL",
};

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

  const { data: channelRows } = await supabase
    .from("channels")
    .select("*")
    .order("channel_number");

  const { data: episodeRows } = await supabase
    .from("episodes")
    .select("*, channel:channels(*)")
    .order("air_date", { ascending: false });

  const channelCards: ChannelCard[] = (channelRows ?? []).map((c) => ({
    id: c.channel_number,
    channel: `CH ${String(c.channel_number).padStart(2, "0")}`,
    title: c.name,
    status: channelStatusLabel[c.status] ?? c.status.toUpperCase(),
    note: c.description ?? c.genre ?? "",
    poster: channelPosters[c.slug] ?? "",
    mode: channelPosters[c.slug] ? "poster" : "typography",
    visualWeight: channelPosters[c.slug] ? "bright" : "typography",
  }));

  const heroFeed: HeroFeedShow[] = (episodeRows ?? [])
    .filter((e) => e.channel)
    .map((e, idx) => {
      const air = e.air_date ? new Date(e.air_date) : null;
      return {
        id: idx,
        kind: "show",
        channel: `CH ${String(e.channel.channel_number).padStart(2, "0")}`,
        slot: "",
        status: episodeStatusLabel[e.status] ?? e.status.toUpperCase(),
        title: e.channel.name,
        subtitle: "",
        detail: [
          e.episode_number ? `E${e.episode_number}` : null,
          air
            ? air.toLocaleString("en-US", {
                weekday: "short",
                hour: "numeric",
                minute: "2-digit",
              })
            : null,
        ]
          .filter(Boolean)
          .join(" · "),
        viewers: "",
        predicted: "",
        action: "",
        poster: channelPosters[e.channel.slug] ?? "",
      };
    });

  return (
    <main className="relative min-h-screen bg-[#020205] pb-28 text-white">
      <div className="mx-auto flex max-w-[640px] flex-col gap-3 px-4 pt-5">
        <TopBar
          currentUser={currentUserBadge}
          tabs={[
            { label: "For You", active: true },
            { label: "Following" },
            { label: "Tonight" },
          ]}
        />

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.7rem] uppercase tracking-[0.32em] text-pink-400">
              Live now
            </p>
            <button className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-300">
              Full Guide
            </button>
          </div>

          <div className="-mx-4 overflow-x-auto px-4 pb-2">
            <div className="flex gap-4">
              {heroFeed.map((item) => {
                const tone = (() => {
                  const titleForTone = item.kind === "show" ? item.title : undefined;
                  switch (titleForTone) {
                    case "Severance":
                      return {
                        gradient: "from-slate-900 via-slate-800",
                        titleColor: "text-amber-100",
                      };
                    case "RuPaul’s Drag Race":
                      return {
                        gradient: "from-pink-900 via-fuchsia-800",
                        titleColor: "text-pink-50",
                      };
                    case "Big Brother":
                      return {
                        gradient: "from-emerald-900 via-emerald-700",
                        titleColor: "text-emerald-100",
                      };
                    case "The Bear":
                      return {
                        gradient: "from-slate-900 via-amber-900",
                        titleColor: "text-white",
                      };
                    case "House of the Dragon":
                      return {
                        gradient: "from-rose-900 via-slate-800",
                        titleColor: "text-amber-100",
                      };
                    case "Love Island":
                    case "Love Island USA":
                      return {
                        gradient: "from-amber-600/65 via-pink-500/35",
                        titleColor: "text-white",
                      };
                    default:
                      return { gradient: "from-slate-950/96 via-slate-950/10", titleColor: "text-white" };
                  }
                })();

                return (
                  <article
                    key={item.id}
                    className="w-[82vw] max-w-[480px] aspect-[16/10] shrink-0 overflow-hidden rounded-[1.25rem] border border-white/10 shadow-sm"
                  >
                    <div className="relative h-full bg-slate-950">
                      <PosterBackground src={item.poster} title={item.title} />
                      <div className={`absolute inset-0 bg-gradient-to-t ${tone.gradient} opacity-80`} />
                      <div className="relative flex h-full flex-col justify-between p-3">
                        {/* Top row: channel badge + LIVE NOW pill */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded-full border border-white/10 bg-slate-950/60 px-2 py-0.5 text-[0.56rem] text-slate-300">
                            {item.channel}
                          </span>
                          {item.status === "LIVE" ? (
                            <span className="inline-flex items-center gap-[5px] rounded-full bg-rose-500/10 px-2 py-[3px] text-[0.5rem] font-semibold uppercase tracking-[0.08em] text-rose-300">
                              <span className="h-[5px] w-[5px] rounded-full bg-rose-400 animate-pulse" />
                              Live Now
                            </span>
                          ) : (
                            <span className="rounded-full bg-white/6 px-2 py-0.5 text-[0.52rem] font-semibold uppercase tracking-[0.1em] text-slate-300">
                              {item.status}
                            </span>
                          )}
                        </div>

                        {/* Bottom: title → episode/time → stats panel */}
                        <div>
                          <h2 className={`text-[1.85rem] font-extrabold leading-tight ${tone.titleColor}`}>
                            {item.title}
                          </h2>
                          <p className="mt-0.5 text-[0.86rem] leading-snug text-slate-200/75">
                            {item.detail}
                          </p>

                          {/* Three-stat glass panel — only shown when at least one stat has real data */}
                          {item.kind === "show" &&
                            (item.viewers || item.predicted || item.liveChatCount) && (
                              <div className="mt-2 mx-0.5 flex divide-x divide-white/[0.06] overflow-hidden rounded-xl bg-black/28 backdrop-blur-md">
                                {item.viewers ? (
                                  <div className="flex flex-1 flex-col items-center gap-[2px] py-[6px]">
                                    <span className="text-[0.74rem] font-bold leading-none text-white">
                                      {item.viewers.split(" ")[0]}
                                    </span>
                                    <span className="text-[0.42rem] uppercase tracking-[0.05em] text-slate-400/90">
                                      watching
                                    </span>
                                  </div>
                                ) : null}
                                {item.predicted ? (
                                  <div className="flex flex-1 flex-col items-center gap-[2px] py-[6px]">
                                    <span className="text-[0.74rem] font-bold leading-none text-white">
                                      {item.predicted.split(" ")[0]}
                                    </span>
                                    <span className="text-[0.42rem] uppercase tracking-[0.05em] text-slate-400/90">
                                      predicted right
                                    </span>
                                  </div>
                                ) : null}
                                {item.liveChatCount ? (
                                  <div className="flex flex-1 flex-col items-center gap-[2px] py-[6px]">
                                    <span className="text-[0.74rem] font-bold leading-none text-white">
                                      {(item.liveChatCount / 1000).toFixed(1)}k
                                    </span>
                                    <span className="text-[0.42rem] uppercase tracking-[0.05em] text-slate-400/90">
                                      discussing
                                    </span>
                                  </div>
                                ) : null}
                              </div>
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

        <section className="overflow-x-auto pb-2">
          <div className="flex gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`rounded-lg border px-2 py-0.5 text-[0.65rem] transition ${
                  category.active
                    ? "border-white/10 bg-white/5 text-slate-200"
                    : "border-white/[0.06] text-slate-500 hover:text-slate-300"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            {/** Curate and balance the grid to alternate visual weight and avoid orphan/empty cards */}
            {(() => {
              const curated = (() => {
                // simple bucket interleave: bright/face/logo vs dark/typography
                const bright: typeof channelCards = [];
                const dark: typeof channelCards = [];
                channelCards.forEach((c) => {
                  if (c.visualWeight === "dark" || c.visualWeight === "typography") dark.push(c);
                  else bright.push(c);
                });
                const out: typeof channelCards = [];
                while (bright.length || dark.length) {
                  if (bright.length) out.push(bright.shift()!);
                  if (dark.length) out.push(dark.shift()!);
                }
                // ensure even number of cards to avoid orphan
                if (out.length % 2 === 1) {
                  out.push({
                    id: 9999,
                    channel: "",
                    title: "Explore more",
                    status: "",
                    note: "Curated picks",
                    poster:
                      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Placeholder_vertical_gradient.png/600px-Placeholder_vertical_gradient.png",
                    mode: "logo",
                    logoFallback:
                      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Placeholder_vertical_gradient.png/600px-Placeholder_vertical_gradient.png",
                    visualWeight: "logo",
                  });
                }
                return out;
              })();

              return curated.map((channel) => {
                const renderPoster = channel.mode === "poster" && channel.poster;
                const renderLogo = (channel.mode === "logo" && (channel.logoFallback || channel.poster)) || undefined;
                const renderTypography = channel.mode === "typography" || (!channel.poster && !channel.logoFallback);

                return (
                  <article
                    key={channel.id}
                    className="aspect-[4/5] overflow-hidden rounded-[1.1rem] border border-white/10 bg-slate-950/10 shadow-sm transition duration-200 hover:-translate-y-0.5"
                  >
                    <div className="relative h-full">
                      {renderPoster ? (
                        <PosterBackground src={channel.poster} title={channel.title} />
                      ) : renderLogo ? (
                        <PosterBackground src={renderLogo} title={channel.title} variant="logo" />
                      ) : renderTypography ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-slate-900 to-slate-800 px-4">
                          <h3 className="text-center text-lg font-bold tracking-tight text-white">
                            {channel.title}
                          </h3>
                        </div>
                      ) : null}

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" />

                      <div className="relative flex h-full flex-col justify-between p-3">
                        <div className="flex items-center justify-between gap-2 text-[0.62rem] uppercase tracking-[0.16em] text-slate-200">
                          <span className="rounded-full border border-white/10 bg-slate-950/60 px-2 py-0.5 text-slate-100 text-[0.62rem]">
                            {channel.channel || ""}
                          </span>
                          {channel.status === "LIVE" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-1.5 py-px text-[0.54rem] font-medium uppercase tracking-[0.06em] text-rose-400">
                              <span className="h-1 w-1 rounded-full bg-rose-400 animate-pulse" />
                              LIVE
                            </span>
                          ) : (
                            <span className="rounded-full bg-white/5 px-1.5 py-px text-[0.54rem] font-medium uppercase tracking-[0.06em] text-slate-400">
                              {channel.status}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-[0.9rem] font-bold tracking-tight text-white">
                            {channel.title}
                          </p>
                          <p className="text-[0.62rem] text-slate-500">{channel.note}</p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              });
            })()}
          </div>
        </section>

        <button className="flex w-full items-center justify-between rounded-md border border-white/[0.08] bg-slate-950/80 px-3 py-1.5 text-[0.62rem] text-slate-500 transition hover:border-white/15 hover:text-slate-300">
          <span>Browse all channels</span>
          <span>→</span>
        </button>

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
      </div>

      <BottomNav />
    </main>
  );
}
