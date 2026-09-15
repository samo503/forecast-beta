'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import PosterBackground from "../components/PosterBackground";
import TopBar, { type TopBarUser } from "../components/TopBar";
import { lockPrediction } from "../actions/predictions";
import {
  pastItems,
  upcomingItems,
} from "../../../lib/mock-data";

// Both preview sections below are entirely mock (lib/mock-data.ts) — none
// of their items correspond to a real channel/prediction (The Bachelor,
// House of the Dragon, Big Brother, RuPaul's Drag Race; even the Love
// Island item's question doesn't match the real resolved prediction).
// Hidden until there's real content to back them; data intentionally
// left in place.
const SHOW_UPCOMING_PREVIEW = false;
const SHOW_PAST_PICKS_PREVIEW = false;

export type PredictionOption = {
  id: string;
  label: string;
  voteCount: number;
};

export type PredictionData = {
  id: string;
  question: string;
  status: "open" | "locked" | "resolved";
  locksAt: string | null;
  correctOptionId: string | null;
  show: string;
  poster: string;
  options: PredictionOption[];
};

function totalVotes(options: PredictionOption[]): number {
  return options.reduce((sum, o) => sum + o.voteCount, 0);
}

function percentFor(option: PredictionOption, options: PredictionOption[]): number {
  const total = totalVotes(options);
  if (!total) return 0;
  return Math.round((option.voteCount / total) * 100);
}

function closesInLabel(locksAt: string | null): string {
  if (!locksAt) return "";
  const diffMs = new Date(locksAt).getTime() - Date.now();
  if (diffMs <= 0) return "soon";
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

// Vote pills, shared by every card regardless of size. A pill is only
// interactive when the prediction is open and the user hasn't picked yet.
// Tapping an unselected pill just selects it (`pendingSelection`); tapping
// the same pill again confirms and locks it. Tapping a different pill moves
// the selection instead of locking anything. This two-tap flow (rather than
// locking on the first tap) exists because a mis-tap here has no undo.
function VotePills({
  card,
  lockedPicks,
  pendingSelection,
  barsMounted,
  onPillTap,
}: {
  card: PredictionData;
  lockedPicks: Record<string, string>;
  pendingSelection: Record<string, string>;
  barsMounted: boolean;
  onPillTap: (card: PredictionData, optionId: string) => void;
}) {
  const total = totalVotes(card.options);
  const leadingId =
    total > 0
      ? card.options.reduce((lead, o) => (o.voteCount > lead.voteCount ? o : lead), card.options[0]).id
      : null;
  const myPick = lockedPicks[card.id];
  const pending = pendingSelection[card.id];
  const votable = card.status === "open" && !myPick;

  return (
    <div className="flex flex-wrap gap-1.5">
      {card.options.map((opt) => {
        const pct = percentFor(opt, card.options);
        const isPicked = myPick === opt.id;
        const isPending = votable && pending === opt.id;
        const isLeading = leadingId === opt.id;

        const pillClassName = `relative min-w-[62px] overflow-hidden rounded-full border px-3 py-[5px] ${
          isPicked
            ? "border-rose-400"
            : isPending
            ? "border-white"
            : isLeading
            ? "border-rose-400/35"
            : "border-white/[0.1]"
        } ${votable ? "cursor-pointer" : ""}`;

        const fillClassName = `absolute inset-y-0 left-0 transition-[width] duration-700 ease-out ${
          isPicked
            ? "bg-rose-400/[0.12]"
            : isPending
            ? "bg-white/[0.14]"
            : isLeading
            ? "bg-rose-400/20"
            : "bg-white/[0.05]"
        }`;

        const labelClassName = `text-[0.58rem] font-medium ${
          isPicked
            ? "text-rose-300"
            : isPending
            ? "text-white"
            : isLeading
            ? "text-white"
            : "text-slate-300"
        }`;

        const inner = (
          <>
            <div className={fillClassName} style={{ width: barsMounted ? `${pct}%` : "0%" }} />
            <div className="relative flex items-center justify-center gap-1.5">
              <span className={labelClassName}>{opt.label}</span>
              {isPending ? (
                <span className="text-[0.44rem] font-semibold text-white/80">Tap to confirm</span>
              ) : (
                total > 0 && (
                  <span
                    className={`text-[0.44rem] font-semibold ${
                      isPicked || isLeading ? "text-rose-300" : "text-slate-500"
                    }`}
                  >
                    {pct}%
                  </span>
                )
              )}
            </div>
          </>
        );

        return votable ? (
          <button
            key={opt.id}
            type="button"
            onClick={() => onPillTap(card, opt.id)}
            className={pillClassName}
          >
            {inner}
          </button>
        ) : (
          <div key={opt.id} className={pillClassName}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

// One card component for the whole list. `variant` controls size only
// (poster + fixed height for "large", plain compact row otherwise) — the
// vote pills and the locked/resolved receipts below them read the same at
// both sizes, since hierarchy here comes from position, not from a
// different vote-visualization language.
function PredictionCard({
  card,
  variant,
  lockedPicks,
  pendingSelection,
  myResults,
  barsMounted,
  onPillTap,
}: {
  card: PredictionData;
  variant: "large" | "compact";
  lockedPicks: Record<string, string>;
  pendingSelection: Record<string, string>;
  myResults: Record<string, { isCorrect: boolean; points: number }>;
  barsMounted: boolean;
  onPillTap: (card: PredictionData, optionId: string) => void;
}) {
  const locked = lockedPicks[card.id];
  const lockedLabel = locked ? card.options.find((o) => o.id === locked)?.label : undefined;
  const myResult = myResults[card.id];
  const correctLabel = card.correctOptionId
    ? card.options.find((o) => o.id === card.correctOptionId)?.label
    : undefined;

  const showBadgeClassName =
    variant === "large"
      ? "rounded-full border border-white/10 bg-slate-950/60 px-2 py-[3px] text-[0.5rem] font-medium text-slate-300"
      : "text-[0.48rem] font-semibold uppercase tracking-[0.1em] text-slate-400";

  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className={showBadgeClassName}>{card.show}</span>
        {card.locksAt && (
          <span className="inline-flex items-center gap-[4px] rounded-full bg-rose-500/15 px-2 py-[3px] text-[0.44rem] font-bold uppercase tracking-[0.08em] text-rose-300">
            <span className="h-[4px] w-[4px] rounded-full bg-rose-400 animate-pulse" />
            Closes {closesInLabel(card.locksAt)}
          </span>
        )}
      </div>

      <div className={variant === "large" ? "mt-auto space-y-1.5" : "mt-1.5 space-y-1.5"}>
        <p
          className={
            variant === "large"
              ? "text-[0.88rem] font-extrabold leading-snug text-white"
              : "text-[0.82rem] font-bold leading-snug text-white"
          }
        >
          {card.question}
        </p>

        <VotePills
          card={card}
          lockedPicks={lockedPicks}
          pendingSelection={pendingSelection}
          barsMounted={barsMounted}
          onPillTap={onPillTap}
        />

        {/* Receipt — resolved outcome, my pick locked, or voting closed with no pick.
            An open, unpicked prediction shows nothing extra; the pills are the input. */}
        {card.status === "resolved" ? (
          <div className="space-y-1">
            <div className="w-full rounded-lg border border-white/[0.06] bg-black/20 py-[5px] text-center text-[0.6rem] font-semibold tracking-[0.04em] text-slate-300">
              Correct answer: {correctLabel ?? "—"}
            </div>
            {locked && myResult && (
              <div
                className={`w-full rounded-lg border py-[5px] text-center text-[0.6rem] font-semibold tracking-[0.04em] ${
                  myResult.isCorrect
                    ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300"
                    : "border-rose-400/30 bg-rose-400/[0.08] text-rose-300"
                }`}
              >
                {myResult.isCorrect ? "✓" : "✗"} Picked: {lockedLabel} · +{myResult.points} pts
              </div>
            )}
          </div>
        ) : locked ? (
          <div
            className={`w-full rounded-lg border py-[5px] text-center text-[0.6rem] font-semibold tracking-[0.04em] ${
              lockedLabel === "Yes"
                ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300"
                : "border-rose-400/30 bg-rose-400/[0.08] text-rose-300"
            }`}
          >
            Locked: {lockedLabel} ✓
          </div>
        ) : card.status !== "open" ? (
          <div className="w-full rounded-lg border border-white/[0.06] bg-black/20 py-[5px] text-center text-[0.6rem] font-semibold tracking-[0.04em] text-white/40">
            Voting closed
          </div>
        ) : null}
      </div>
    </>
  );

  if (variant === "large") {
    if (card.poster) {
      return (
        <article className="relative overflow-hidden rounded-2xl">
          {/* title="" — card.show is already shown above as the badge */}
          <PosterBackground src={card.poster} title="" />
          <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/45 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent" />
          <div className="relative flex h-[160px] flex-col p-3.5">{content}</div>
        </article>
      );
    }
    // No poster art for this channel yet — a plain card sized to its
    // content instead of the fixed-height poster band with nothing in it.
    return (
      <article className="flex flex-col gap-1.5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5">
        {content}
      </article>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
      {content}
    </div>
  );
}

export default function PredictClient({
  predictions,
  myPicks,
  myResults,
  currentUser,
  accuracy,
  streak,
  correctThisWeek,
}: {
  predictions: PredictionData[];
  myPicks: Record<string, string>;
  /** Resolution outcome for the signed-in user's own picks, keyed by
   *  prediction id. Absent entries mean either not resolved yet, or
   *  resolved but the user never picked. */
  myResults: Record<string, { isCorrect: boolean; points: number }>;
  currentUser: TopBarUser | null;
  /** Real computed accuracy, null when there are zero *resolved* picks
   *  (rendered as "—"). */
  accuracy: number | null;
  /** Real, live-computed day streak (participation-based). */
  streak: number;
  /** Real count of correct, resolved picks made in the past 7 days. */
  correctThisWeek: number;
}) {
  const router = useRouter();
  const [lockedPicks, setLockedPicks] = useState<Record<string, string>>(myPicks);
  const [pendingSelection, setPendingSelection] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [barsMounted, setBarsMounted] = useState(false);

  useEffect(() => {
    setBarsMounted(true);
  }, []);

  // Two tiers, nothing dropped. Not-resolved predictions come first (most
  // urgent, i.e. soonest locks_at, at the top; no locks_at sorts last within
  // this group). Resolved predictions come after all of those, most recently
  // locked first, so a resolved receipt never outranks a still-open question.
  const byLocksAtAscNullsLast = (a: PredictionData, b: PredictionData) => {
    if (!a.locksAt && !b.locksAt) return 0;
    if (!a.locksAt) return 1;
    if (!b.locksAt) return -1;
    return new Date(a.locksAt).getTime() - new Date(b.locksAt).getTime();
  };
  const byLocksAtDescNullsLast = (a: PredictionData, b: PredictionData) => {
    if (!a.locksAt && !b.locksAt) return 0;
    if (!a.locksAt) return 1;
    if (!b.locksAt) return -1;
    return new Date(b.locksAt).getTime() - new Date(a.locksAt).getTime();
  };
  const notResolved = predictions
    .filter((p) => p.status !== "resolved")
    .sort(byLocksAtAscNullsLast);
  const resolved = predictions
    .filter((p) => p.status === "resolved")
    .sort(byLocksAtDescNullsLast);
  const sortedPredictions = [...notResolved, ...resolved];

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const confirmVote = async (card: PredictionData, optionId: string) => {
    setPendingSelection((prev) => {
      const next = { ...prev };
      delete next[card.id];
      return next;
    });
    const label = card.options.find((o) => o.id === optionId)?.label ?? "";

    try {
      const result = await lockPrediction(card.id, optionId);
      if (result.ok) {
        setLockedPicks((prev) => ({ ...prev, [card.id]: optionId }));
        showToast(`Pick locked · ${label}`);
        return;
      }
      switch (result.reason) {
        case "not_authenticated":
          router.push("/auth?next=/predict");
          return;
        case "duplicate_pick":
          showToast("You've already locked in a pick for this category");
          return;
        default: {
          const exhaustiveCheck: never = result;
          return exhaustiveCheck;
        }
      }
    } catch (err) {
      // Genuine unexpected failure (RLS rejection, bad ids, etc), not one
      // of lockPrediction's expected outcomes above.
      console.error("lockPrediction failed", { predictionId: card.id, optionId }, err);
      showToast("Something went wrong. Try again.");
    }
  };

  // Tap once to select, tap the same pill again to confirm and lock.
  // Tapping a different pill just moves the selection.
  const handlePillTap = (card: PredictionData, optionId: string) => {
    if (pendingSelection[card.id] === optionId) {
      confirmVote(card, optionId);
    } else {
      setPendingSelection((prev) => ({ ...prev, [card.id]: optionId }));
    }
  };

  return (
    <main className="relative min-h-screen bg-[#020205] pb-28 text-white">
      <div className="mx-auto flex max-w-[640px] flex-col gap-6 px-4 pt-5">

        <TopBar
          currentUser={currentUser}
          tabs={[
            { label: "Live", active: true },
            { label: "Closing Soon" },
            { label: "Upcoming" },
            { label: "Past" },
          ]}
        />

        {/* ── Section 1: Your Forecast ── */}
        <section className="space-y-2">
          <p className="px-0.5 text-[0.6rem] font-bold uppercase tracking-[0.28em] text-slate-200">
            Your Forecast
          </p>

          <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] px-5 py-3.5">
            {/* Streak */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-baseline gap-1">
                <span className="text-[1.15rem] font-black leading-none text-amber-300">
                  {streak}
                </span>
                <span className="text-[0.7rem] leading-none">🔥</span>
              </div>
              <span className="text-[0.42rem] uppercase tracking-[0.12em] text-slate-500">
                Day streak
              </span>
            </div>

            <div className="h-8 w-px bg-white/[0.06]" />

            {/* Accuracy */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[1.15rem] font-black leading-none text-white">
                {accuracy === null ? "—" : `${accuracy}%`}
              </span>
              <span className="text-[0.42rem] uppercase tracking-[0.12em] text-slate-500">
                Accuracy
              </span>
            </div>

            <div className="h-8 w-px bg-white/[0.06]" />

            {/* This week */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[1.15rem] font-black leading-none text-white">
                {correctThisWeek}
              </span>
              <span className="text-[0.42rem] uppercase tracking-[0.12em] text-slate-500">
                This week
              </span>
            </div>
          </div>
        </section>

        {/* ── Section 2: Predictions ── */}
        <section className="space-y-2">
          <p className="px-0.5 text-[0.6rem] font-bold uppercase tracking-[0.28em] text-slate-200">
            Predictions
          </p>

          <div className="space-y-2">
            {sortedPredictions.map((card, i) => (
              <PredictionCard
                key={card.id}
                card={card}
                variant={i === 0 ? "large" : "compact"}
                lockedPicks={lockedPicks}
                pendingSelection={pendingSelection}
                myResults={myResults}
                barsMounted={barsMounted}
                onPillTap={handlePillTap}
              />
            ))}
          </div>
        </section>

        {/* ── Section 3: Upcoming (preview) ── */}
        {SHOW_UPCOMING_PREVIEW && (
        <section className="space-y-1.5">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[0.54rem] font-bold uppercase tracking-[0.22em] text-slate-500">Upcoming</p>
            <button className="text-[0.42rem] text-slate-600 transition hover:text-slate-400">See all ›</button>
          </div>

          <div className="divide-y divide-white/[0.04] rounded-xl border border-white/[0.05] bg-white/[0.015] px-3">
            {upcomingItems.slice(0, 2).map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-1.5">
                <div className="h-[5px] w-[5px] shrink-0 rounded-full bg-slate-700" />
                <div className="flex min-w-0 flex-1 flex-col gap-[1px]">
                  <span className="text-[0.42rem] text-slate-500">{item.show}</span>
                  <p className="text-[0.62rem] font-medium text-slate-300">{item.description}</p>
                </div>
                <span className="shrink-0 rounded-full border border-white/[0.05] bg-white/[0.025] px-1.5 py-[2px] text-[0.4rem] text-slate-500">
                  {item.opensAt}
                </span>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* ── Section 4: Past Picks (preview) ── */}
        {SHOW_PAST_PICKS_PREVIEW && (
        <section className="space-y-1.5">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[0.54rem] font-bold uppercase tracking-[0.22em] text-slate-500">Past Picks</p>
            <button className="text-[0.42rem] text-slate-600 transition hover:text-slate-400">See all ›</button>
          </div>

          <div className="divide-y divide-white/[0.04] rounded-xl border border-white/[0.05] bg-white/[0.015] px-3">
            {pastItems.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center gap-2.5 py-1.5">
                <div
                  className={`h-[5px] w-[5px] shrink-0 rounded-full ${
                    item.result === "correct"
                      ? "bg-emerald-400/75"
                      : item.result === "wrong"
                      ? "bg-rose-400/70"
                      : "bg-amber-400/60"
                  }`}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-[1px]">
                  <span className="text-[0.42rem] text-slate-500">{item.show}</span>
                  <p className="truncate text-[0.62rem] text-slate-400">{item.question}</p>
                </div>
                <span
                  className={`shrink-0 text-[0.42rem] font-semibold ${
                    item.result === "correct"
                      ? "text-emerald-400/75"
                      : item.result === "wrong"
                      ? "text-rose-400/65"
                      : "text-amber-400/55"
                  }`}
                >
                  {item.result === "correct" ? "✓" : item.result === "wrong" ? "✗" : "…"}
                </span>
              </div>
            ))}
          </div>
        </section>
        )}

      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className="pointer-events-none fixed bottom-24 inset-x-0 z-[60] flex justify-center px-4">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-[#0d0d14]/90 px-4 py-2 backdrop-blur-xl">
            <span className="h-[5px] w-[5px] rounded-full bg-emerald-400/70" />
            <span className="text-[0.52rem] font-semibold uppercase tracking-[0.1em] text-emerald-300">
              {toast}
            </span>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
