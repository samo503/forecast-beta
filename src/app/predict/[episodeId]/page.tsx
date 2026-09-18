import { notFound } from "next/navigation";
import { supabase } from "../../../../lib/supabase/client";
import { createClient as createServerClient } from "../../../../lib/supabase/server";
import { getCurrentUserBadge } from "../../../../lib/supabase/current-user";
import type { PredictionData } from "../PredictClient";
import EpisodePredictionsClient from "./EpisodePredictionsClient";

function isPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

export default async function EpisodePredictionsPage({
  params,
}: {
  params: Promise<{ episodeId: string }>;
}) {
  const { episodeId } = await params;

  const { data: episode } = await supabase
    .from("episodes")
    .select("id, title, episode_number, air_date, channel:channels(name, slug, accent_color)")
    .eq("id", episodeId)
    .single();

  if (!episode || !episode.channel) {
    notFound();
  }
  const channel = episode.channel as unknown as {
    name: string;
    slug: string;
    accent_color: string | null;
  };

  // Same fetch-all-statuses-then-self-heal shape as /predict itself
  // (predict/page.tsx) — a prediction whose locks_at just passed needs to
  // transition to 'locked' correctly even though this page only ever
  // *displays* the ones still open afterward. Fetching pre-filtered to
  // 'open' would silently skip that self-heal for this one episode.
  const { data: predictionRows } = await supabase
    .from("predictions")
    .select(
      "*, options:prediction_options!prediction_options_prediction_id_fkey(*)"
    )
    .eq("episode_id", episodeId)
    .in("status", ["open", "locked", "resolved"])
    .order("locks_at", { ascending: true });

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

  // This route is the open-predictions collection for one event — a
  // question that's since locked or resolved isn't part of what it shows;
  // the flat Locked/Past tabs on /predict are still where those live.
  const openPredictions: PredictionData[] = (predictionRows ?? [])
    .filter((p) => p.status === "open")
    .map((p) => ({
      id: p.id,
      episodeId: p.episode_id,
      episodeTitle: episode.title,
      episodeNumber: episode.episode_number,
      airDate: episode.air_date,
      channelSlug: channel.slug,
      question: p.question,
      status: "open" as const,
      locksAt: p.locks_at,
      correctOptionId: p.correct_option_id as string | null,
      show: channel.name,
      accentColor: channel.accent_color ?? null,
      options: (p.options ?? [])
        .slice()
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .map((o: { id: string; label: string; vote_count: number | null }) => ({
          id: o.id,
          label: o.label,
          // Same client-side redaction as /predict — every prediction on
          // this page is already status 'open', so this is always 0, but
          // matching the exact ternary keeps the two pages' logic
          // identical rather than one hardcoding an assumption the other
          // states explicitly.
          voteCount: p.status === "open" ? 0 : o.vote_count ?? 0,
        })),
    }));

  const authedSupabase = await createServerClient();
  const {
    data: { user },
  } = await authedSupabase.auth.getUser();

  // Same TopBar badge every other page without its own full profile fetch
  // uses (Guide, Live, Settings) — real streak, not a stand-in value.
  const currentUserBadge = await getCurrentUserBadge();

  let myPicks: Record<string, string> = {};
  let myResults: Record<string, { isCorrect: boolean; points: number }> = {};

  if (user) {
    if (openPredictions.length) {
      const { data: pickRows } = await authedSupabase
        .from("user_predictions")
        .select("prediction_id, option_id, is_correct, points_awarded")
        .in(
          "prediction_id",
          openPredictions.map((p) => p.id)
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
    <EpisodePredictionsClient
      episodeTitle={episode.title}
      episodeNumber={episode.episode_number}
      airDate={episode.air_date}
      show={channel.name}
      accentColor={channel.accent_color ?? null}
      predictions={openPredictions}
      myPicks={myPicks}
      myResults={myResults}
      currentUser={currentUserBadge}
    />
  );
}
