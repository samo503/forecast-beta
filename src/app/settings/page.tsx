import { redirect } from "next/navigation";
import { getCurrentUserBadge } from "../../../lib/supabase/current-user";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const currentUser = await getCurrentUserBadge();

  if (!currentUser) {
    redirect("/auth?next=/settings");
  }

  return <SettingsClient currentUser={currentUser} />;
}
