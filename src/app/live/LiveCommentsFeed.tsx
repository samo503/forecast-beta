'use client'

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import { postComment } from "../actions/comments";

export type LiveComment = {
  id: string;
  message: string;
  createdAt: string;
  authorName: string;
  authorAvatar: string | null;
  agreementCount: number;
};

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

// Subscribes to INSERT events on `comments` (scoped to this episode) via
// Supabase Realtime so new comments appear without a page reload — see
// supabase/migrations/0009_comments_realtime.sql for the publication
// change this depends on. RLS's existing public SELECT policy on
// `comments` governs who receives these broadcasts, same as any other read.
export default function LiveCommentsFeed({
  episodeId,
  initialComments,
  isSignedIn,
  accentColor,
}: {
  episodeId: string;
  initialComments: LiveComment[];
  isSignedIn: boolean;
  accentColor: string;
}) {
  const [comments, setComments] = useState<LiveComment[]>(initialComments);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel(`comments:${episodeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `episode_id=eq.${episodeId}`,
        },
        async (payload) => {
          const row = payload.new as {
            id: string;
            body: string;
            created_at: string;
            user_id: string;
          };

          // The change payload is the raw comments row only — no joined
          // author, so fetch it separately (profiles are publicly
          // readable, same as the initial server-side fetch's join).
          const { data: author } = await supabase
            .from("profiles")
            .select("username, display_name, avatar_url")
            .eq("id", row.user_id)
            .single();

          setComments((prev) => {
            if (prev.some((c) => c.id === row.id)) return prev;
            return [
              {
                id: row.id,
                message: row.body,
                createdAt: row.created_at,
                authorName: author?.display_name ?? author?.username ?? "Someone",
                authorAvatar: author?.avatar_url ?? null,
                agreementCount: 0,
              },
              ...prev,
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [episodeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || posting) return;
    setPosting(true);
    try {
      await postComment(episodeId, body);
      setDraft("");
    } catch {
      // The realtime subscription is the only feedback surface for this
      // list today — a failed post just leaves the draft in place to retry.
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-2">
      {comments.length === 0 ? (
        <p className="px-0.5 text-[0.6rem] text-slate-600">No comments yet.</p>
      ) : (
        <div className="space-y-px">
          {comments.map((item) => (
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
          ))}
        </div>
      )}

      {isSignedIn && (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment…"
            maxLength={500}
            className="min-w-0 flex-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[0.62rem] text-white placeholder:text-slate-600 outline-none focus:border-white/20"
          />
          <button
            type="submit"
            disabled={!draft.trim() || posting}
            className="shrink-0 rounded-full border border-white/[0.12] bg-white/[0.06] px-3 py-2 text-[0.58rem] font-semibold text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {posting ? "Posting…" : "Post"}
          </button>
        </form>
      )}
    </div>
  );
}
