'use client'

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import BottomNav from "../components/BottomNav";
import TopBar, { type TopBarUser } from "../components/TopBar";
import { createClient } from "../../../lib/supabase/browser";

export default function SettingsClient({
  currentUser,
}: {
  currentUser: TopBarUser | null;
}) {
  const router = useRouter();
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const signOutResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  };

  // Tap once to arm, tap the same button again to actually sign out. Auth is
  // magic-link only, so an accidental sign-out costs an email round trip to
  // recover from. Same two-tap shape as the /predict vote pills, for the
  // same reason: no undo, so no single-tap commit.
  const handleSignOutTap = () => {
    if (confirmingSignOut) {
      if (signOutResetRef.current) clearTimeout(signOutResetRef.current);
      handleSignOut();
      return;
    }
    setConfirmingSignOut(true);
    signOutResetRef.current = setTimeout(() => setConfirmingSignOut(false), 3000);
  };

  return (
    <main className="relative min-h-screen bg-[#020205] pb-32 text-white">
      <div className="mx-auto flex max-w-[640px] flex-col gap-6 px-4 pt-5">

        <TopBar currentUser={currentUser} />

        <Link
          href="/profile"
          className="flex w-fit items-center gap-1 text-[0.6rem] text-slate-500 transition hover:text-slate-300"
        >
          <ChevronLeft className="h-3 w-3" strokeWidth={2} />
          Back to profile
        </Link>

        <section className="space-y-2">
          <p className="px-0.5 text-[0.6rem] font-bold uppercase tracking-[0.28em] text-slate-200">
            Settings
          </p>

          <button
            onClick={handleSignOutTap}
            className={`w-full rounded-xl border py-3 text-center text-[0.62rem] font-semibold tracking-[0.04em] transition ${
              confirmingSignOut
                ? "border-rose-400/40 bg-rose-400/[0.08] text-rose-300"
                : "border-white/[0.07] bg-white/[0.025] text-slate-400 hover:text-slate-200"
            }`}
          >
            {confirmingSignOut ? "Tap again to sign out" : "Sign out"}
          </button>
        </section>

      </div>

      <BottomNav />
    </main>
  );
}
