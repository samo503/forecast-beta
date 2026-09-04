import { createClient as createServerClient } from "./server";

export type CurrentUserBadge = {
  name: string;
  avatar: string | null;
  streak: number;
};

// Small shared avatar+streak badge for the TopBar header, used by pages that
// don't otherwise need a full profile fetch (homepage, live). Pages that
// already fetch the signed-in user's full profile (predict, profile) build
// this same shape from data they already have instead of calling this too.
export async function getCurrentUserBadge(): Promise<CurrentUserBadge | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, streak_count")
    .eq("id", user.id)
    .single();

  return {
    name: profile?.display_name ?? profile?.username ?? "You",
    avatar: profile?.avatar_url ?? null,
    streak: profile?.streak_count ?? 0,
  };
}
