'use client'

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Target, Flame, Trophy, Star, Crown, Mic, Sparkles, Zap } from "lucide-react";
import BottomNav from "../components/BottomNav";
import PosterBackground from "../components/PosterBackground";
import TopBar from "../components/TopBar";
import { createClient } from "../../../lib/supabase/browser";
import {
  trophies,
  followedShows,
  profileActivity,
  profileFriends,
} from "../../../lib/mock-data";

// Trophies (the mock shelf below), Following, Activity, and Friends are
// entirely mock (lib/mock-data.ts) — same pattern as SHOW_TONIGHTS_BRIEF on
// the homepage and SHOW_UPCOMING_PREVIEW / SHOW_PAST_PICKS_PREVIEW on
// /predict. Hidden until there's real data to back them; data intentionally
// left in place. Distinct from LOCKED_TROPHIES below, which is real (if
// locked) content, not mock earned-trophy data.
const SHOW_TROPHIES = false;
const SHOW_FOLLOWING = false;
const SHOW_ACTIVITY = false;
const SHOW_FRIENDS = false;

// Hardcoded and all locked. There's no trophy-awarding logic or schema for
// any of these yet, so this is a fixed list of goals, not progress pulled
// from data — see docs/decisions.md's "Trophy rules" section for exactly
// how each would be derived once an earned-state pass happens.
const LOCKED_TROPHIES = [
  {
    name: "Called It",
    criterion: "Correctly predict an outcome that most people missed.",
    icon: Trophy,
  },
  {
    name: "Hot Streak",
    criterion: "Get five predictions right in a row.",
    icon: Flame,
  },
  {
    name: "Sharp Eye",
    criterion: "Reach 70%+ accuracy across 10+ resolved predictions.",
    icon: Target,
  },
  {
    name: "Full Sweep",
    criterion: "Get every prediction right for a single episode or event.",
    icon: Star,
  },
];

export type ProfileData = {
  /** display_name only — no "You"/username fallback. Null renders no name
   *  row at all; ProfileClient promotes @handle to the primary identity
   *  line in that case instead of hiding identity entirely. */
  name: string | null;
  handle: string;
  avatar: string | null;
  identityLine: string | null;
  streak: number;
};

export type ProfileStats = {
  /** null when there are zero *resolved* predictions to compute accuracy from. */
  accuracy: number | null;
  predictions: number;
};

export type RecordItem =
  | {
      id: string;
      show: string;
      question: string;
      pick: string;
      status: "resolved";
      result: "correct" | "wrong";
      points: number;
    }
  | {
      id: string;
      show: string;
      question: string;
      pick: string;
      status: "pending";
      locksAt: string | null;
    };

// Mirrors the closes-countdown formatting on /predict (closesInLabel in
// PredictClient.tsx), reimplemented locally rather than imported across
// route trees for a handful of lines. A pick with no locksAt, or one whose
// window has already passed, has nothing left to count down to.
function pendingStatusLabel(locksAt: string | null): string {
  if (!locksAt) return "Awaiting result";
  const diffMs = new Date(locksAt).getTime() - Date.now();
  if (diffMs <= 0) return "Awaiting result";
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `Closes in ${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `Closes in ${hours}h`;
  return `Closes in ${Math.round(hours / 24)}d`;
}

// Single achievement hue (amber/gold). Brightness signals rarity, not identity —
// harder-to-earn trophies glow brighter instead of each getting an arbitrary color.
const trophyColor: Record<number, string> = {
  1: "#b8860b", // Called It
  2: "#d4a017", // Hot Streak
  3: "#fbbf24", // Reality Expert
  4: "#b8860b", // Live Room Regular
  5: "#fcd34d", // Finale Prophet — rarest, brightest
  6: "#d4a017", // First Call
};

// Emoji icons render in their own fixed native colors regardless of CSS `color`,
// which undermines the single-hue achievement system. Swapping to lucide-react
// icons (already used elsewhere in the app) lets the amber color actually apply.
const trophyIcon: Record<number, React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>> = {
  1: Target,
  2: Flame,
  3: Crown,
  4: Mic,
  5: Sparkles,
  6: Zap,
};

export default function ProfileClient({
  profile,
  stats,
  predictionRecord,
}: {
  profile: ProfileData;
  stats: ProfileStats;
  predictionRecord: RecordItem[];
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

        {/* No top-left avatar on Profile — the hero below is the one real
            identity display on this page; duplicating it in the header
            (and its streak badge) was redundant. */}
        <TopBar
          currentUser={null}
          rightIcon="settings"
          onRightIconClick={() => router.push("/settings")}
        />

        {/* ── Profile Hero ── */}
        <div className="relative flex flex-col items-center gap-[5px]">
          {/* Radial depth wash */}
          <div className="pointer-events-none absolute inset-x-0 -top-4 h-40 bg-[radial-gradient(ellipse_70%_55%_at_50%_10%,rgba(255,255,255,0.06),transparent)]" />

          {/* Avatar — no streak badge here; the flame lives on the streak
              stat below now, not duplicated on every avatar in the app. */}
          <div className="relative z-10">
            <div
              className="flex h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-full bg-slate-900"
              style={{
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.13), 0 0 22px rgba(255,255,255,0.10)",
              }}
            >
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name ?? profile.handle}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[1.1rem] font-bold text-slate-500">
                  {(profile.name ?? profile.handle.replace(/^@/, "")).charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Name is display_name only — no synthetic fallback. When it's
              unset, @handle (always real) becomes the primary identity line
              instead of a fabricated name. No Edit control: there's no edit
              flow anywhere in the app yet (see docs/decisions.md). */}
          <div className="relative z-10 flex flex-col items-center gap-[3px]">
            {profile.name ? (
              <>
                <span className="text-[1.15rem] font-black leading-none text-white">
                  {profile.name}
                </span>
                {profile.handle && (
                  <span className="text-[0.56rem] text-slate-500">{profile.handle}</span>
                )}
              </>
            ) : (
              profile.handle && (
                <span className="text-[1.15rem] font-black leading-none text-white">
                  {profile.handle}
                </span>
              )
            )}
          </div>

          {/* Identity line / bio. Visual constraint only (line-clamp-2) —
              there's no editor for this field yet, so there's no input to
              cap; truncating existing content server-side would risk
              cutting it mid-word for no reason. */}
          {profile.identityLine && (
            <p className="relative z-10 mx-auto line-clamp-2 max-w-[280px] text-center text-[0.58rem] leading-relaxed text-slate-400">
              {profile.identityLine}
            </p>
          )}
        </div>

        {/* ── Stats Row ── */}
        <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] px-5 py-3">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[1.05rem] font-black leading-none text-white">
              {stats.accuracy === null ? "—" : `${stats.accuracy}%`}
            </span>
            <span className="text-[0.4rem] uppercase tracking-[0.1em] text-slate-500">Accuracy</span>
          </div>
          <div className="h-7 w-px bg-white/[0.06]" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[1.05rem] font-black leading-none text-white">{stats.predictions}</span>
            <span className="text-[0.4rem] uppercase tracking-[0.1em] text-slate-500">Predictions</span>
          </div>
          <div className="h-7 w-px bg-white/[0.06]" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="flex items-center gap-1 text-[1.05rem] font-black leading-none text-white">
              <Flame className="h-[13px] w-[13px] text-amber-300" strokeWidth={2} />
              {profile.streak}
            </span>
            <span className="text-[0.4rem] uppercase tracking-[0.1em] text-slate-500">
              Current streak
            </span>
          </div>
        </div>

        {/* ── Trophies (real, locked) ──
            A grid, not a list: four fixed slots read as a shelf with empty
            spaces, which is the point. A vertical checklist would read as
            a to-do list instead of a shelf. */}
        <section className="space-y-2">
          <p className="px-0.5 text-[0.6rem] font-bold uppercase tracking-[0.28em] text-slate-200">
            Trophies
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {LOCKED_TROPHIES.map((trophy) => {
              const Icon = trophy.icon;
              return (
                <div
                  key={trophy.name}
                  className="relative flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-3 text-center"
                >
                  <Lock
                    className="absolute right-2 top-2 h-2.5 w-2.5 text-slate-600"
                    strokeWidth={2}
                  />
                  <Icon className="h-5 w-5 text-slate-600" strokeWidth={1.75} />
                  <span className="text-[0.58rem] font-semibold text-slate-300">{trophy.name}</span>
                  <span className="text-[0.44rem] leading-snug text-slate-400">
                    {trophy.criterion}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Trophy Shelf (mock) ── */}
        {SHOW_TROPHIES && (
        <section className="space-y-2">
          <p className="px-0.5 text-[0.6rem] font-bold uppercase tracking-[0.28em] text-slate-200">
            Trophies
          </p>
          <div className="-mx-4 overflow-x-auto scroll-smooth px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-2 pr-4">
              {trophies.map((trophy) => {
                const color = trophyColor[trophy.id] ?? "#d4a017";
                const Icon = trophyIcon[trophy.id] ?? Sparkles;
                return (
                  <div
                    key={trophy.id}
                    className="flex w-[64px] shrink-0 flex-col items-center gap-2 rounded-xl bg-slate-950/80 px-2 py-3.5"
                    style={{
                      border: `1px solid ${color}20`,
                      boxShadow: `0 0 16px ${color}08, inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 ${color}08`,
                    }}
                  >
                    {/* Icon with radial glow */}
                    <div className="relative flex items-center justify-center">
                      <div
                        className="absolute h-8 w-8 rounded-full blur-lg"
                        style={{ backgroundColor: `${color}1c` }}
                      />
                      <Icon size={20} strokeWidth={1.75} style={{ color, position: "relative" }} />
                    </div>
                    <span
                      className="text-center text-[0.42rem] font-semibold leading-tight"
                      style={{ color: `${color}9a` }}
                    >
                      {trophy.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        )}

        {/* ── Following Shows ──
            Not reconciled against the color-semantics rule adopted for
            Predict/My Picks. Its rose LIVE/FINALE badge means "this show is
            airing right now," a third meaning the rule doesn't cover.
            Re-check before ever unhiding this. */}
        {SHOW_FOLLOWING && (
        <section className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.28em] text-slate-200">
              Following
            </p>
            <button className="text-[0.42rem] text-slate-600 transition hover:text-slate-400">
              See all ›
            </button>
          </div>
          <div className="-mx-4 overflow-x-auto scroll-smooth px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-3 pr-4">
              {followedShows.map((show) => (
                <div key={show.id} className="flex shrink-0 flex-col gap-1">
                  <div className="relative h-[84px] w-[62px] overflow-hidden rounded-xl border border-white/[0.07]">
                    <PosterBackground src={show.poster} title="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <span
                      className={`absolute bottom-1 left-1 rounded-full px-[4px] py-[1.5px] text-[0.3rem] font-semibold uppercase ${
                        show.status === "LIVE" || show.status === "FINALE"
                          ? "bg-rose-500/25 text-rose-300"
                          : "bg-white/[0.1] text-slate-400"
                      }`}
                    >
                      {show.status}
                    </span>
                  </div>
                  <div className="flex flex-col gap-[1px]">
                    <p className="w-[62px] truncate text-[0.44rem] font-medium leading-tight text-slate-300">
                      {show.title}
                    </p>
                    {show.accuracy !== undefined && (
                      <span className="text-[0.38rem] text-slate-600">{show.accuracy}% acc</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* ── My Picks ──
            Pending is uncapped. Resolved is capped at 5 most recent
            (see profile/page.tsx). No "See all" link yet: with today's
            pick counts nothing exceeds the cap, so a link to a full
            history route would have nowhere to point and nothing to
            reveal. Add one, pointing at a new /profile/picks route, once
            resolved history actually grows past 5. */}
        <section className="space-y-1.5">
          <p className="px-0.5 text-[0.54rem] font-bold uppercase tracking-[0.22em] text-slate-500">
            My Picks
          </p>
          <div className="divide-y divide-white/[0.04] rounded-xl border border-white/[0.05] bg-white/[0.015] px-3">
            {predictionRecord.length === 0 ? (
              <p className="py-2 text-[0.6rem] text-slate-600">No picks yet.</p>
            ) : (
              predictionRecord.map((item) =>
                item.status === "resolved" ? (
                  <div key={item.id} className="flex items-start gap-2.5 py-2">
                    <div
                      className={`mt-[4px] h-[5px] w-[5px] shrink-0 rounded-full ${
                        item.result === "correct" ? "bg-emerald-400/75" : "bg-rose-400/70"
                      }`}
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                      <span className="text-[0.42rem] text-slate-500">{item.show}</span>
                      <p className="text-[0.6rem] leading-snug text-slate-400">{item.question}</p>
                      <span className="text-[0.42rem] text-slate-500">
                        Picked:{" "}
                        <span className="text-slate-400">{item.pick}</span>
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-[2px] pt-[3px]">
                      <span
                        className={`text-[0.42rem] font-semibold ${
                          item.result === "correct" ? "text-emerald-400/75" : "text-rose-400/65"
                        }`}
                      >
                        {item.result === "correct" ? "✓" : "✗"}
                      </span>
                      <span className="text-[0.38rem] text-slate-600">
                        +{item.points} pts
                      </span>
                    </div>
                  </div>
                ) : (
                  <div key={item.id} className="flex items-start gap-2.5 py-2">
                    <div className="mt-[4px] h-[5px] w-[5px] shrink-0 rounded-full bg-amber-400/60" />
                    <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                      <span className="text-[0.42rem] text-slate-500">{item.show}</span>
                      <p className="text-[0.6rem] leading-snug text-slate-400">{item.question}</p>
                      <span className="text-[0.42rem] text-slate-500">
                        Picked:{" "}
                        <span className="text-slate-400">{item.pick}</span>
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-[2px] pt-[3px]">
                      <span className="text-[0.42rem] font-semibold text-amber-400/75">…</span>
                      <span className="text-[0.38rem] text-slate-600">
                        {pendingStatusLabel(item.locksAt)}
                      </span>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </section>

        {/* ── Activity ──
            Not reconciled against the color-semantics rule. Its rose/amber
            icon backgrounds mean "this item's category is prediction /
            trophy," not urgency, wrong, or pending. Re-check before ever
            unhiding this. */}
        {SHOW_ACTIVITY && (
        <section className="space-y-1.5">
          <p className="px-0.5 text-[0.54rem] font-bold uppercase tracking-[0.22em] text-slate-500">
            Activity
          </p>
          <div className="divide-y divide-white/[0.04]">
            {profileActivity.map((item) => (
              <div key={item.id} className="flex items-start gap-2.5 py-2 first:pt-0">
                <div
                  className={`mt-[1px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${
                    item.type === "prediction"
                      ? "bg-rose-400/[0.08]"
                      : item.type === "trophy"
                      ? "bg-amber-400/[0.08]"
                      : "bg-white/[0.04]"
                  }`}
                >
                  <span className="text-[0.5rem] leading-none">
                    {item.type === "prediction" ? "🎯" : item.type === "trophy" ? "🏆" : "💬"}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1">
                  <p className="text-[0.6rem] leading-snug text-slate-400">
                    {item.action}{" "}
                    <span className="text-slate-300">{item.detail}</span>
                    {item.show && (
                      <span className="text-slate-500"> · {item.show}</span>
                    )}
                  </p>
                </div>
                <span className="shrink-0 text-[0.4rem] text-slate-600">{item.time}</span>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* ── Friends ──
            Not reconciled against the color-semantics rule. Its amber
            achievement badge means "this friend earned an accolade," not
            pending/ongoing. Re-check before ever unhiding this. */}
        {SHOW_FRIENDS && (
        <section className="space-y-1.5">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[0.54rem] font-bold uppercase tracking-[0.22em] text-slate-500">
              Friends
            </p>
            <button className="text-[0.42rem] text-slate-600 transition hover:text-slate-400">
              See all ›
            </button>
          </div>
          <div className="divide-y divide-white/[0.04] rounded-xl border border-white/[0.05] bg-white/[0.015] px-3">
            {profileFriends.map((friend) => (
              <div key={friend.id} className="flex items-center gap-2.5 py-2">
                <div className="h-[26px] w-[26px] shrink-0 overflow-hidden rounded-full border border-white/10">
                  <img
                    src={friend.avatar}
                    alt={friend.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[0.62rem] font-semibold text-white">{friend.name}</span>
                    {friend.badge && (
                      <span className="rounded-full bg-amber-400/10 px-1 py-px text-[0.34rem] font-semibold uppercase tracking-[0.04em] text-amber-300">
                        {friend.badge}
                      </span>
                    )}
                  </div>
                  {friend.activity && (
                    <span className="text-[0.44rem] text-slate-500">{friend.activity}</span>
                  )}
                </div>
                {friend.accuracy !== undefined && (
                  <span className="shrink-0 text-[0.48rem] font-semibold text-slate-300">
                    {friend.accuracy}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
        )}

        {/* ── Footer ──
            Settings lives in the gear icon in the header now, not
            duplicated here. */}
        <div className="flex items-center justify-end px-0.5">
          <button
            onClick={handleSignOutTap}
            className={`text-[0.42rem] transition ${
              confirmingSignOut ? "text-rose-400" : "text-slate-600 hover:text-slate-400"
            }`}
          >
            {confirmingSignOut ? "Tap again to sign out" : "Sign out"}
          </button>
        </div>

      </div>

      <BottomNav />
    </main>
  );
}
