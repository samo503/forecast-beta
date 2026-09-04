import { Zap } from "lucide-react";
import BottomNav from "../components/BottomNav";
import PosterBackground from "../components/PosterBackground";
import TopBar from "../components/TopBar";
import { supabase } from "../../../lib/supabase/client";
import { getCurrentUserBadge } from "../../../lib/supabase/current-user";
import {
  discussionPrompts,
  friendComments,
  liveRooms,
} from "../../../lib/mock-data";

const discussionTheme: Record<string, string> = {
  "LIVE POLL":  "#fb7185", // prediction mechanic — signal pink
  "PREDICTION": "#fb7185", // prediction mechanic — signal pink
  "DEBATE":     "#fb7185", // prediction mechanic — signal pink
};

const heatLabel: Record<string, string> = {
  peak:    "🔥 Peak",
  heating: "↑ Heating",
  rising:  "↗ Rising",
};

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

export default async function Live() {
  const currentUserBadge = await getCurrentUserBadge();

  // "Room Highlights" is the only section with a real backing table
  // (comments, episode-scoped) — everything else on this page (rooms,
  // friends, discussion prompts) has no schema behind it yet, so those
  // stay on mock data. See supabase/migrations/0001_init_schema.sql.
  const { data: episodeRows } = await supabase
    .from("episodes")
    .select("*, channel:channels(*)")
    .order("air_date", { ascending: false })
    .limit(1);
  const episode = episodeRows?.[0];

  type LiveComment = {
    id: string;
    message: string;
    createdAt: string;
    authorName: string;
    authorAvatar: string | null;
    agreementCount: number;
  };

  let roomHighlights: LiveComment[] = [];
  const accentColor = episode?.channel?.accent_color ?? "#22d3ee";

  if (episode) {
    const { data: commentRows } = await supabase
      .from("comments")
      .select("*, author:profiles(*)")
      .eq("episode_id", episode.id)
      .order("created_at", { ascending: false })
      .limit(3);

    const commentIds = (commentRows ?? []).map((c) => c.id);
    let agreementCounts: Record<string, number> = {};
    if (commentIds.length) {
      const { data: reactionRows } = await supabase
        .from("reactions")
        .select("target_id")
        .eq("target_type", "comment")
        .in("target_id", commentIds);
      agreementCounts = (reactionRows ?? []).reduce<Record<string, number>>(
        (acc, r) => {
          acc[r.target_id] = (acc[r.target_id] ?? 0) + 1;
          return acc;
        },
        {}
      );
    }

    roomHighlights = (commentRows ?? [])
      .filter((c) => c.author)
      .map((c) => ({
        id: c.id,
        message: c.body,
        createdAt: c.created_at,
        authorName: c.author.display_name ?? c.author.username,
        authorAvatar: c.author.avatar_url,
        agreementCount: agreementCounts[c.id] ?? 0,
      }));
  }

  return (
    <main className="relative min-h-screen bg-[#020205] pb-28 text-white">
      <div className="mx-auto flex max-w-[640px] flex-col gap-6 px-4 pt-5">

        <TopBar
          currentUser={currentUserBadge}
          tabs={[
            { label: "Following", active: true },
            { label: "Friends" },
            { label: "Trending" },
          ]}
        />

        {/* Live pulse */}
        <div className="-mt-4 flex items-center justify-center gap-1.5 pb-0.5">
          <span className="h-[4px] w-[4px] rounded-full bg-rose-500/50 animate-pulse" />
          <p className="text-[0.46rem] tracking-[0.04em] text-slate-600">
            24 rooms live <span className="text-slate-700">·</span> 18.4k watching <span className="text-slate-700">·</span> 6 friends active
          </p>
        </div>

        {/* ── Section 1: Live Rooms ── */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-1.5">
              <span className="h-[5px] w-[5px] rounded-full bg-rose-400 animate-pulse" />
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.28em] text-slate-200">Live Rooms</p>
            </div>
            <button className="text-[0.44rem] text-slate-600 transition hover:text-slate-400">All rooms ›</button>
          </div>

          <div className="-mx-4 overflow-x-auto scroll-smooth px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-3 pr-4">
              {liveRooms.map((room) => (
                <article
                  key={room.id}
                  className="w-[56vw] max-w-[240px] shrink-0 overflow-hidden rounded-[1.1rem] border border-white/10"
                >
                  {/* Poster image */}
                  <div className="relative aspect-[4/3] bg-slate-950">
                    <PosterBackground src={room.poster} title={room.show} titleClassName="text-base" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/22 to-transparent" />

                    {/* Top badges row */}
                    <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2">
                      {room.status === "LIVE" ? (
                        <span className="inline-flex items-center gap-[4px] rounded-full bg-rose-500/15 px-1.5 py-[3px] text-[0.42rem] font-semibold uppercase tracking-[0.06em] text-rose-300">
                          <span className="h-[4px] w-[4px] rounded-full bg-rose-400 animate-pulse" />
                          Live
                        </span>
                      ) : (
                        <span className="rounded-full bg-black/50 px-1.5 py-[3px] text-[0.42rem] font-semibold uppercase tracking-[0.06em] text-slate-300">
                          {room.status}
                        </span>
                      )}
                      {room.heat && (
                        <span className="rounded-full bg-black/40 px-1.5 py-[3px] text-[0.4rem] font-medium text-amber-300/80">
                          {heatLabel[room.heat]}
                        </span>
                      )}
                    </div>

                    {/* Bottom: show name + social row */}
                    <div className="absolute inset-x-0 bottom-0 p-2.5">
                      <p className="mb-1.5 text-[0.82rem] font-bold leading-tight text-white">{room.show}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="flex -space-x-1.5">
                            {room.avatars.slice(0, 3).map((av, i) => (
                              <div
                                key={i}
                                className="h-[15px] w-[15px] overflow-hidden rounded-full border border-white/20"
                              >
                                <img src={av} alt="" className="h-full w-full object-cover" />
                              </div>
                            ))}
                          </div>
                          <span className="text-[0.42rem] text-white/60">{room.friendsActive} friends</span>
                        </div>
                        <span className="text-[0.42rem] text-white/50">
                          {room.viewers >= 1000
                            ? `${(room.viewers / 1000).toFixed(1)}k`
                            : room.viewers} watching
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Topic strip */}
                  <div className="border-t border-white/[0.05] bg-slate-950/90 px-2.5 py-1.5">
                    <p className="text-[0.57rem] font-medium leading-snug text-slate-300 line-clamp-1">
                      {room.topic}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 2: Friends Are Talking ── */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.28em] text-slate-200">Friends Are Talking</p>
            <button className="text-[0.42rem] text-slate-600 transition hover:text-slate-400">See all ›</button>
          </div>

          {/* Feed rows — no box, just dividers */}
          <div className="divide-y divide-white/[0.04]">
            {friendComments.slice(0, 2).map((post) => (
              <div key={post.id} className="flex gap-2.5 py-2.5 first:pt-0">
                {/* Avatar */}
                <div className="relative mt-[2px] shrink-0">
                  <div className="h-[26px] w-[26px] overflow-hidden rounded-full border border-white/10">
                    <img src={post.avatar} alt={post.user} className="h-full w-full object-cover" />
                  </div>
                  {post.mutual && (
                    <div className="absolute -bottom-px -right-px h-[7px] w-[7px] rounded-full border border-[#020205] bg-rose-500/80" />
                  )}
                </div>

                {/* Content */}
                <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  {/* Name · show · time */}
                  <div className="flex min-w-0 items-baseline gap-1">
                    <span className="shrink-0 text-[0.62rem] font-semibold text-white">{post.user}</span>
                    {post.badge && (
                      <span className="shrink-0 rounded-full bg-amber-400/10 px-1 py-px text-[0.34rem] font-semibold uppercase tracking-[0.04em] text-amber-300">
                        {post.badge}
                      </span>
                    )}
                    <span className="shrink-0 text-[0.38rem] text-slate-600">·</span>
                    <span className="truncate text-[0.44rem] text-slate-500">{post.show}</span>
                    <span className="ml-auto shrink-0 text-[0.4rem] text-slate-600">{post.time}</span>
                  </div>
                  <p className="text-[0.66rem] leading-snug text-slate-300">{post.message}</p>
                  {/* Actions — inline, quiet */}
                  <div className="flex items-center gap-1 pt-[1px]">
                    <button className="text-[0.34rem] font-medium text-slate-400 transition hover:text-slate-200">
                      Jump in ›
                    </button>
                    <span className="text-[0.3rem] text-slate-700">·</span>
                    <button className="text-[0.32rem] text-slate-600 transition hover:text-slate-400">Agree</button>
                    <span className="text-[0.3rem] text-slate-700">·</span>
                    <button className="text-[0.32rem] text-slate-600 transition hover:text-slate-400">Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 3: Room Highlights ── */}
        <section className="space-y-2">
          <p className="px-0.5 text-[0.54rem] font-bold uppercase tracking-[0.22em] text-slate-500">Room Highlights</p>

          <div className="space-y-px">
            {roomHighlights.length === 0 ? (
              <p className="px-0.5 text-[0.6rem] text-slate-600">No comments yet.</p>
            ) : (
              roomHighlights.map((item) => (
                <div
                  key={item.id}
                  className="relative overflow-hidden rounded-xl border border-white/[0.05] bg-slate-950/50 px-3 py-2"
                >
                  <div
                    className="absolute inset-y-0 left-0 w-[2px]"
                    style={{ backgroundColor: accentColor }}
                  />
                  <div className="flex items-start gap-2">
                    {item.authorAvatar ? (
                      <div className="mt-px h-[20px] w-[20px] shrink-0 overflow-hidden rounded-full border border-white/10">
                        <img src={item.authorAvatar} alt={item.authorName} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="mt-px flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[0.5rem] font-semibold text-slate-400">
                        {item.authorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[0.52rem] font-semibold text-white/80">{item.authorName}</span>
                        <span className="ml-auto text-[0.4rem] text-slate-500">{timeAgo(item.createdAt)}</span>
                      </div>
                      <p className="text-[0.64rem] leading-snug text-slate-400">{item.message}</p>
                      <span className="text-[0.4rem] text-slate-500">{item.agreementCount} agree</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── Section 4: Active Discussions ── */}
        <section className="space-y-2">
          <p className="px-0.5 text-[0.54rem] font-bold uppercase tracking-[0.22em] text-slate-500">Active Discussions</p>

          <div className="space-y-px">
            {discussionPrompts.map((prompt) => {
              const color = discussionTheme[prompt.category] ?? "#22d3ee";
              return (
                <button
                  key={prompt.id}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.018] px-2.5 py-2 text-left transition hover:bg-white/[0.04] active:scale-[0.99]"
                >
                  <div
                    className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${color}12`, border: `1px solid ${color}25` }}
                  >
                    <Zap className="h-[10px] w-[10px]" strokeWidth={2} style={{ color }} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                    <p className="text-[0.68rem] font-semibold leading-snug text-white/85">{prompt.question}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-[0.4rem] font-semibold uppercase tracking-[0.06em]" style={{ color }}>
                        {prompt.category}
                      </span>
                      <span className="text-[0.36rem] text-slate-600">·</span>
                      <span className="text-[0.4rem] text-slate-500">{prompt.show}</span>
                      <span className="text-[0.36rem] text-slate-600">·</span>
                      <span className="text-[0.4rem] text-slate-500">
                        {prompt.votes >= 1000
                          ? `${(prompt.votes / 1000).toFixed(1)}k`
                          : prompt.votes} votes
                      </span>
                      {prompt.timeLeft && (
                        <>
                          <span className="text-[0.36rem] text-slate-600">·</span>
                          <span className="text-[0.4rem] text-rose-400/90">{prompt.timeLeft}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-[0.58rem] text-slate-600">›</span>
                </button>
              );
            })}
          </div>
        </section>

      </div>

      <BottomNav />
    </main>
  );
}
