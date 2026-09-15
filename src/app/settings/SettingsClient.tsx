'use client'

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import BottomNav from "../components/BottomNav";
import TopBar, { type TopBarUser } from "../components/TopBar";

export default function SettingsClient({
  currentUser,
}: {
  currentUser: TopBarUser | null;
}) {
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

        {/* Sign out lives on /profile's footer now. This route stays for
            real account settings once there are any to add. */}
        <section className="space-y-2">
          <p className="px-0.5 text-[0.6rem] font-bold uppercase tracking-[0.28em] text-slate-200">
            Settings
          </p>
          <p className="px-0.5 text-[0.6rem] text-slate-600">Nothing to configure yet.</p>
        </section>

      </div>

      <BottomNav />
    </main>
  );
}
