import { redirect } from "next/navigation";
import { createClient as createServerClient } from "../../../lib/supabase/server";
import { computeStreak } from "../../../lib/streak";
import ProfileClient, {
  type ProfileData,
  type ProfileStats,
  type RecordItem,
} from "./ProfileClient";

function isWithinPastWeek(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() <= 7 * 24 * 60 * 60 * 1000;
}

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
      "*, prediction:predictions(question, channel:channels(name)), option:prediction_options(label)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const allPicks = pickRows ?? [];

  const profile: ProfileData = {
    name: profileRow?.display_name ?? profileRow?.username ?? "You",
    handle: profileRow?.username ? `@${profileRow.username}` : "",
    avatar: profileRow?.avatar_url ?? null,
    identityLine: profileRow?.identity_line ?? null,
    streak: computeStreak(allPicks.map((p) => p.created_at)),
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
    thisWeek: allPicks.filter((p) => isWithinPastWeek(p.created_at)).length,
  };

  const predictionRecord: RecordItem[] = resolvedPicks
    .filter((p) => p.prediction && p.option)
    .map((p) => ({
      id: p.id,
      show: p.prediction.channel?.name ?? "",
      question: p.prediction.question,
      pick: p.option.label,
      result: p.is_correct ? "correct" : "wrong",
    }));

  return (
    <ProfileClient
      profile={profile}
      stats={stats}
      predictionRecord={predictionRecord}
    />
  );
}
