import { redirect } from "next/navigation";
import { createClient as createServerClient } from "../../../lib/supabase/server";
import { computeStreak } from "../../../lib/streak";
import ProfileClient, {
  type ProfileData,
  type ProfileStats,
  type RecordItem,
} from "./ProfileClient";

export default async function ProfilePage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?next=/profile");
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: pickRows } = await supabase
    .from("user_predictions")
    .select(
      "*, prediction:predictions(question, locks_at, channel:channels(name)), option:prediction_options(label)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const allPicks = pickRows ?? [];

  const profile: ProfileData = {
    // No "You"/username fallback here — a real name renders only when
    // display_name is actually set. @handle is the always-real identity
    // (ProfileClient promotes it to the primary line when name is null).
    name: profileRow?.display_name ?? null,
    handle: profileRow?.username ? `@${profileRow.username}` : "",
    avatar: profileRow?.avatar_url ?? null,
    identityLine: profileRow?.identity_line ?? null,
    streak: computeStreak(
      allPicks.map((p) => p.created_at),
      profileRow?.timezone ?? "UTC"
    ),
  };
  const resolvedPicks = allPicks.filter((p) => p.is_correct !== null);
  const correctPicks = resolvedPicks.filter((p) => p.is_correct === true);

  const stats: ProfileStats = {
    // null (not 0%) when nothing's been resolved yet — 0% would read as
    // "you got this wrong" rather than "nothing scored yet".
    accuracy: resolvedPicks.length
      ? Math.round((correctPicks.length / resolvedPicks.length) * 100)
      : null,
    predictions: allPicks.length,
  };

  const validPicks = allPicks.filter((p) => p.prediction && p.option);

  // Pending is uncapped: it's the only place a user's open commitments show
  // up at all (Predict > Past is resolved-only), and it's naturally bounded
  // by how many predictions are open. Resolved history grows forever, so it
  // gets capped.
  const pendingPicks: RecordItem[] = validPicks
    .filter((p) => p.is_correct === null)
    .map((p) => ({
      id: p.id,
      show: p.prediction.channel?.name ?? "",
      question: p.prediction.question,
      pick: p.option.label,
      status: "pending" as const,
      locksAt: p.prediction.locks_at,
    }));

  const resolvedRecordItems: RecordItem[] = validPicks
    .filter((p) => p.is_correct !== null)
    .map((p) => ({
      id: p.id,
      show: p.prediction.channel?.name ?? "",
      question: p.prediction.question,
      pick: p.option.label,
      status: "resolved" as const,
      result: p.is_correct ? "correct" : "wrong",
      points: p.points_awarded ?? 0,
    }));

  const RESOLVED_PICKS_LIMIT = 5;
  const resolvedPicksCapped = resolvedRecordItems.slice(0, RESOLVED_PICKS_LIMIT);
  // Not surfaced anywhere yet — there's no /profile/picks route to send a
  // "See all" link to, and with today's pick counts nothing exceeds the cap
  // regardless. Kept so the cap's effect stays visible to whoever builds
  // that route once resolved history actually grows past it.
  const hasMoreResolvedPicks = resolvedRecordItems.length > RESOLVED_PICKS_LIMIT;
  void hasMoreResolvedPicks;

  // Newest first within each group; pending as a block before resolved.
  const predictionRecord: RecordItem[] = [...pendingPicks, ...resolvedPicksCapped];

  return (
    <ProfileClient
      profile={profile}
      stats={stats}
      predictionRecord={predictionRecord}
    />
  );
}
