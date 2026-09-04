import { supabase } from "../../../lib/supabase/client";
import { createClient as createServerClient } from "../../../lib/supabase/server";
import type { TopBarUser } from "../components/TopBar";
import PredictClient, { type PredictionData } from "./PredictClient";

// Channel art isn't in the schema yet — same local lookup used on the homepage.
const channelPosters: Record<string, string> = {
  "love-island-usa":
    "https://deadline.com/wp-content/uploads/2025/08/love-island-usa-season-7-reunion-trailer-photos.jpg?w=1000&h=667&crop=1",
};

export default async function PredictPage() {
  const { data: predictionRows } = await supabase
    .from("predictions")
    .select(
      "*, channel:channels(*), options:prediction_options!prediction_options_prediction_id_fkey(*)"
    )
    .eq("status", "open")
    .order("locks_at", { ascending: true });

  const predictions: PredictionData[] = (predictionRows ?? [])
    .filter((p) => p.channel)
    .map((p) => ({
      id: p.id,
      question: p.question,
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

  if (user) {
    const { data: profileRow } = await authedSupabase
      .from("profiles")
      .select("username, display_name, avatar_url, streak_count")
      .eq("id", user.id)
      .single();

    currentUserBadge = {
      name: profileRow?.display_name ?? profileRow?.username ?? "You",
      avatar: profileRow?.avatar_url ?? null,
      streak: profileRow?.streak_count ?? 0,
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
    />
  );
}
