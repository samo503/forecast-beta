import { supabase } from "../../../lib/supabase/client";
import { createClient as createServerClient } from "../../../lib/supabase/server";
import { computeStreak } from "../../../lib/streak";
import type { TopBarUser } from "../components/TopBar";
import PredictClient, { type PredictionData } from "./PredictClient";

// Channel art isn't in the schema yet — same local lookup used on the homepage.
const channelPosters: Record<string, string> = {
  "love-island-usa": "",
  "emmys":
    "https://images.unsplash.com/photo-1713514116766-d9be318edaf8?fm=jpg&q=80&w=1200&auto=format&fit=crop",
};

// Per-category art for the 4 real Emmy predictions, keyed by prediction id
// since they all share one channel (so channelPosters alone can't tell them
// apart). Falls back to channelPosters for any prediction not listed here.
const predictionPosters: Record<string, string> = {
  "eeeeeeee-3333-3333-3333-000000000001": // Outstanding Drama Series
    "https://images.unsplash.com/photo-1713514116766-d9be318edaf8?fm=jpg&q=80&w=1200&auto=format&fit=crop",
  "eeeeeeee-3333-3333-3333-000000000002": // Outstanding Comedy Series
    "https://images.unsplash.com/photo-1760437429636-2e280cf3726f?fm=jpg&q=80&w=1200&auto=format&fit=crop",
  "eeeeeeee-3333-3333-3333-000000000003": // Outstanding Lead Actor in a Drama Series
    "https://images.unsplash.com/photo-1784542471030-043371709e27?fm=jpg&q=80&w=1200&auto=format&fit=crop",
  "eeeeeeee-3333-3333-3333-000000000004": // Outstanding Lead Actress in a Drama Series
    "https://images.unsplash.com/photo-1761925116230-d24410fbe1a0?fm=jpg&q=80&w=1200&auto=format&fit=crop",
};

function isPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

function isWithinPastWeek(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() <= 7 * 24 * 60 * 60 * 1000;
}

export default async function PredictPage() {
  const { data: predictionRows } = await supabase
    .from("predictions")
    .select(
      "*, channel:channels(*), options:prediction_options!prediction_options_prediction_id_fkey(*)"
    )
    .in("status", ["open", "locked", "resolved"])
    .order("locks_at", { ascending: true });

  // Lazy open->locked transition: no scheduled job flips this, so every
  // page load self-heals any prediction whose locks_at has passed. A
  // prediction with zero votes locks the same as any other — no
  // vote-count check here at all.
  const toLock = (predictionRows ?? []).filter(
    (p) => p.status === "open" && p.locks_at && isPast(p.locks_at)
  );
  if (toLock.length) {
    await Promise.all(
      toLock.map((p) => supabase.rpc("lock_expired_prediction", { p_prediction_id: p.id }))
    );
    const toLockIds = new Set(toLock.map((p) => p.id));
    for (const p of predictionRows ?? []) {
      if (toLockIds.has(p.id)) p.status = "locked";
    }
  }

  const predictions: PredictionData[] = (predictionRows ?? [])
    .filter((p) => p.channel)
    .map((p) => ({
      id: p.id,
      question: p.question,
      status: p.status as "open" | "locked" | "resolved",
      locksAt: p.locks_at,
      correctOptionId: p.correct_option_id as string | null,
      show: p.channel.name,
      poster: predictionPosters[p.id] ?? channelPosters[p.channel.slug] ?? "",
      options: (p.options ?? [])
        .slice()
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .map((o: { id: string; label: string; vote_count: number | null }) => ({
          id: o.id,
          label: o.label,
          // Client-side redaction only: the query still fetches the real
          // vote_count (RLS on prediction_options is still `using (true)`),
          // we just zero it here before it reaches the page for any option
          // on a still-open prediction. Anyone querying the anon key
          // directly still sees real counts for open predictions — this
          // does not close that gap. Deliberately deferred: today's
          // exposure is two test accounts, and rewriting this feed query
          // into a redacting RPC is more work than the leak is worth right
          // now. Do the real fix (an RPC that redacts server-side, plus
          // revoking public select on this column) before the leaderboard
          // ships, when there's real standing to game.
          voteCount: p.status === "open" ? 0 : o.vote_count ?? 0,
        })),
    }));

  const authedSupabase = await createServerClient();
  const {
    data: { user },
  } = await authedSupabase.auth.getUser();

  // My own picks — RLS only ever returns rows I own (or ones no longer
  // 'open'), so this is safe to run even when nobody is signed in.
  let myPicks: Record<string, string> = {};
  // Resolution outcome for the signed-in user's own picks, keyed by
  // prediction id — same source of truth profile's Prediction Record
  // trusts (stored is_correct/points_awarded, not re-derived client-side).
  let myResults: Record<string, { isCorrect: boolean; points: number }> = {};
  // TopBar badge — same shape as lib/supabase/current-user.ts's
  // getCurrentUserBadge(), built from data already fetched here instead of
  // querying auth/profiles a second time.
  let currentUserBadge: TopBarUser | null = null;
  // "Your Forecast" accuracy — null (rendered as "—") until there's at
  // least one *resolved* pick, same fallback as profile's stats row.
  let accuracy: number | null = null;
  let streak = 0;
  let picksThisWeek = 0;

  if (user) {
    const { data: profileRow } = await authedSupabase
      .from("profiles")
      .select("username, display_name, avatar_url, timezone")
      .eq("id", user.id)
      .single();

    const { data: pickResults } = await authedSupabase
      .from("user_predictions")
      .select("is_correct, created_at")
      .eq("user_id", user.id);

    const resolved = (pickResults ?? []).filter((p) => p.is_correct !== null);
    const correct = resolved.filter((p) => p.is_correct === true);
    accuracy = resolved.length
      ? Math.round((correct.length / resolved.length) * 100)
      : null;
    streak = computeStreak(
      (pickResults ?? []).map((p) => p.created_at),
      profileRow?.timezone ?? "UTC"
    );
    // Same metric as /profile's "This week": every pick locked in the last
    // 7 days, regardless of status or outcome. Accuracy already covers
    // whether picks are landing, so this slot doesn't need to.
    picksThisWeek = (pickResults ?? []).filter((p) => isWithinPastWeek(p.created_at)).length;

    currentUserBadge = {
      name: profileRow?.display_name ?? profileRow?.username ?? "You",
      avatar: profileRow?.avatar_url ?? null,
      streak,
    };

    if (predictions.length) {
      const { data: pickRows } = await authedSupabase
        .from("user_predictions")
        .select("prediction_id, option_id, is_correct, points_awarded")
        .in(
          "prediction_id",
          predictions.map((p) => p.id)
        );
      myPicks = Object.fromEntries(
        (pickRows ?? []).map((r) => [r.prediction_id, r.option_id])
      );
      myResults = Object.fromEntries(
        (pickRows ?? [])
          .filter((r) => r.is_correct !== null)
          .map((r) => [
            r.prediction_id,
            { isCorrect: r.is_correct as boolean, points: r.points_awarded ?? 0 },
          ])
      );
    }
  }

  return (
    <PredictClient
      predictions={predictions}
      myPicks={myPicks}
      myResults={myResults}
      currentUser={currentUserBadge}
      accuracy={accuracy}
      streak={streak}
      picksThisWeek={picksThisWeek}
    />
  );
}
