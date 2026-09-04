import { supabase } from "../../../lib/supabase/client";
import { createClient as createServerClient } from "../../../lib/supabase/server";
import { computeStreak } from "../../../lib/streak";
import type { TopBarUser } from "../components/TopBar";
import PredictClient, { type PredictionData } from "./PredictClient";

// Channel art isn't in the schema yet — same local lookup used on the homepage.
const channelPosters: Record<string, string> = {
  "love-island-usa":
    "https://deadline.com/wp-content/uploads/2025/08/love-island-usa-season-7-reunion-trailer-photos.jpg?w=1000&h=667&crop=1",
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
    .in("status", ["open", "locked"])
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
      status: p.status as "open" | "locked",
      locksAt: p.locks_at,
      show: p.channel.name,
      poster: channelPosters[p.channel.slug] ?? "",
      options: (p.options ?? [])
        .slice()
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .map((o: { id: string; label: string; vote_count: number | null }) => ({
          id: o.id,
          label: o.label,
          voteCount: o.vote_count ?? 0,
        })),
    }));

  const authedSupabase = await createServerClient();
  const {
    data: { user },
  } = await authedSupabase.auth.getUser();

  // My own picks — RLS only ever returns rows I own (or ones no longer
  // 'open'), so this is safe to run even when nobody is signed in.
  let myPicks: Record<string, string> = {};
  // TopBar badge — same shape as lib/supabase/current-user.ts's
  // getCurrentUserBadge(), built from data already fetched here instead of
  // querying auth/profiles a second time.
  let currentUserBadge: TopBarUser | null = null;
  // "Your Forecast" accuracy — null (rendered as "—") until there's at
  // least one *resolved* pick, same fallback as profile's stats row.
  let accuracy: number | null = null;
  let streak = 0;
  let correctThisWeek = 0;

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
    correctThisWeek = correct.filter((p) => isWithinPastWeek(p.created_at)).length;

    currentUserBadge = {
      name: profileRow?.display_name ?? profileRow?.username ?? "You",
      avatar: profileRow?.avatar_url ?? null,
      streak,
    };

    if (predictions.length) {
      const { data: pickRows } = await authedSupabase
        .from("user_predictions")
        .select("prediction_id, option_id")
        .in(
          "prediction_id",
          predictions.map((p) => p.id)
        );
      myPicks = Object.fromEntries(
        (pickRows ?? []).map((r) => [r.prediction_id, r.option_id])
      );
    }
  }

  return (
    <PredictClient
      predictions={predictions}
      myPicks={myPicks}
      currentUser={currentUserBadge}
      accuracy={accuracy}
      streak={streak}
      correctThisWeek={correctThisWeek}
    />
  );
}
