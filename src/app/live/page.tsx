import BottomNav from "../components/BottomNav";
import TopBar from "../components/TopBar";
import { supabase } from "../../../lib/supabase/client";
import { getCurrentUserBadge } from "../../../lib/supabase/current-user";
import LiveCommentsFeed, { type LiveComment } from "./LiveCommentsFeed";

export default async function Live() {
  const currentUserBadge = await getCurrentUserBadge();

  // Room Highlights is the only section on this page with a real backing
  // table (comments, episode-scoped). See supabase/migrations/0001_init_schema.sql.
  const { data: episodeRows } = await supabase
    .from("episodes")
    .select("*, channel:channels(*)")
    .order("air_date", { ascending: false })
    .limit(1);
  const episode = episodeRows?.[0];

  let initialComments: LiveComment[] = [];
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

    initialComments = (commentRows ?? [])
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

        {/* ── Room Highlights (live) ── */}
        <section className="space-y-2">
          <p className="px-0.5 text-[0.54rem] font-bold uppercase tracking-[0.22em] text-slate-500">Room Highlights</p>

          {episode ? (
            <LiveCommentsFeed
              episodeId={episode.id}
              initialComments={initialComments}
              isSignedIn={!!currentUserBadge}
              accentColor={accentColor}
            />
          ) : (
            <p className="px-0.5 text-[0.6rem] text-slate-600">No comments yet.</p>
          )}
        </section>

      </div>

      <BottomNav />
    </main>
  );
}
