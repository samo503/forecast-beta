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

export type PredictionOption = {
  id: string;
  label: string;
  voteCount: number;
};

export type PredictionData = {
  id: string;
  question: string;
  status: "open" | "locked";
  locksAt: string | null;
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

function yesPercentFor(prediction: PredictionData): number {
  const yes = prediction.options.find((o) => o.label === "Yes");
  if (!yes) return 0;
  return percentFor(yes, prediction.options);
}

function noPercentFor(prediction: PredictionData): number {
  const no = prediction.options.find((o) => o.label === "No");
  if (!no) return 0;
  return percentFor(no, prediction.options);
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

// Yes/No crowd split, rendered as one bar in two colors (like a poll
// result) instead of a flat neutral progress bar — the split itself is
// the point, so a landslide should look like one and a toss-up should
// feel tense. `mounted` drives a one-time fill-in transition on load.
function CrowdSplitBar({
  yesPercent,
  noPercent,
  mounted,
}: {
  yesPercent: number;
  noPercent: number;
  mounted: boolean;
}) {
  const hasVotes = yesPercent + noPercent > 0;
  const yesLeading = yesPercent >= noPercent;

  return (
    <div className="space-y-[4px]">
      {hasVotes ? (
        <div className="flex items-center justify-between">
          <span
            className={
              yesLeading
                ? "text-[0.46rem] font-bold text-emerald-300"
                : "text-[0.42rem] text-slate-500"
            }
          >
            {yesPercent}% Yes
          </span>
          <span
            className={
              !yesLeading
                ? "text-[0.46rem] font-bold text-rose-300"
                : "text-[0.42rem] text-slate-500"
            }
          >
            {noPercent}% No
          </span>
        </div>
      ) : (
        <p className="text-[0.42rem] text-slate-600">Be the first to predict</p>
      )}
      <div className="flex h-[3px] overflow-hidden rounded-full bg-white/[0.07]">
        {hasVotes && (
          <>
            <div
              className="h-full bg-emerald-400/80 transition-[width] duration-700 ease-out"
              style={{ width: mounted ? `${yesPercent}%` : "0%" }}
            />
            <div
              className="h-full bg-rose-400/80 transition-[width] duration-700 ease-out"
              style={{ width: mounted ? `${noPercent}%` : "0%" }}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default function PredictClient({
  predictions,
  myPicks,
  currentUser,
  accuracy,
  streak,
  correctThisWeek,
}: {
  predictions: PredictionData[];
  myPicks: Record<string, string>;
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
  const [activeCard, setActiveCard] = useState<PredictionData | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [lockedPicks, setLockedPicks] = useState<Record<string, string>>(myPicks);
  const [toast, setToast] = useState<string | null>(null);
  const [barsMounted, setBarsMounted] = useState(false);

  useEffect(() => {
    setBarsMounted(true);
  }, []);

  const closingCards = predictions.filter((p) => p.locksAt).slice(0, 2);
  const liveQuestions = predictions;

  const openSheet = (card: PredictionData) => {
    if (lockedPicks[card.id] || card.status !== "open") return;
    setActiveCard(card);
    setSelectedOptionId(null);
    // Double rAF ensures the element is mounted before the CSS transition fires
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setSheetVisible(true));
    });
  };

  const closeSheet = () => {
    setSheetVisible(false);
    setTimeout(() => {
      setActiveCard(null);
      setSelectedOptionId(null);
    }, 300);
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const lockPick = async () => {
    if (!activeCard || !selectedOptionId) return;
    const predictionId = activeCard.id;
    const optionId = selectedOptionId;
    const label = activeCard.options.find((o) => o.id === optionId)?.label ?? "";
    closeSheet();

    try {
      await lockPrediction(predictionId, optionId);
      setLockedPicks((prev) => ({ ...prev, [predictionId]: optionId }));
      showToast(`Pick locked · ${label}`);
    } catch (err) {
      if (err instanceof Error && err.message === "not_authenticated") {
        router.push("/auth?next=/predict");
        return;
      }
      showToast("Something went wrong — try again");
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

        {/* ── Section 2: Closing Soon ── */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-1.5">
              <span className="h-[5px] w-[5px] rounded-full bg-rose-400 animate-pulse" />
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.28em] text-slate-200">
                Closing Soon
              </p>
            </div>
            <button className="text-[0.42rem] text-slate-600 transition hover:text-slate-400">
              See all ›
            </button>
          </div>

          <div className="space-y-2">
            {closingCards.map((card) => {
              const locked = lockedPicks[card.id];
              const lockedLabel = locked
                ? card.options.find((o) => o.id === locked)?.label
                : undefined;
              const yesPercent = yesPercentFor(card);
              const noPercent = noPercentFor(card);
              return (
                <article
                  key={card.id}
                  className="relative overflow-hidden rounded-2xl"
                >
                  {/* title="" — card.show is already shown above as the badge */}
                  <PosterBackground src={card.poster} title="" />
                  <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/45 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent" />

                  <div className="relative flex h-[160px] flex-col p-3.5">
                    {/* Top row: show badge + countdown */}
                    <div className="flex items-center justify-between">
                      <span className="rounded-full border border-white/10 bg-slate-950/60 px-2 py-[3px] text-[0.5rem] font-medium text-slate-300">
                        {card.show}
                      </span>
                      <span className="inline-flex items-center gap-[4px] rounded-full bg-rose-500/15 px-2 py-[3px] text-[0.44rem] font-bold uppercase tracking-[0.08em] text-rose-300">
                        <span className="h-[4px] w-[4px] rounded-full bg-rose-400 animate-pulse" />
                        Closes {closesInLabel(card.locksAt)}
                      </span>
                    </div>

                    {/* Bottom block */}
                    <div className="mt-auto space-y-1.5">
                      <p className="text-[0.88rem] font-extrabold leading-snug text-white">
                        {card.question}
                      </p>

                      {/* Crowd split */}
                      <CrowdSplitBar yesPercent={yesPercent} noPercent={noPercent} mounted={barsMounted} />

                      {/* CTA — my pick locked, voting closed with no pick, or still open */}
                      {locked ? (
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
                      ) : (
                        <button
                          onClick={() => openSheet(card)}
                          className="w-full rounded-lg border border-white/[0.1] bg-black/25 py-[5px] text-center text-[0.6rem] font-semibold tracking-[0.04em] text-white/80 backdrop-blur-sm transition hover:bg-black/35 hover:text-white/95"
                        >
                          Predict →
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── Section 3: Live Questions ── */}
        <section className="space-y-2">
          <p className="px-0.5 text-[0.6rem] font-bold uppercase tracking-[0.28em] text-slate-200">
            Live Questions
          </p>

          <div className="space-y-2">
            {liveQuestions.map((q) => {
              const total = totalVotes(q.options);
              const leadingId =
                total > 0
                  ? q.options.reduce((lead, o) => (o.voteCount > lead.voteCount ? o : lead), q.options[0]).id
                  : null;

              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5"
                >
                  {/* Show + live badge + vote count */}
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <span className="text-[0.48rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
                      {q.show}
                    </span>
                    {q.status === "open" ? (
                      <span className="inline-flex items-center gap-[3px] rounded-full bg-rose-500/10 px-1.5 py-[2px] text-[0.38rem] font-semibold uppercase tracking-[0.06em] text-rose-400/80">
                        <span className="h-[3px] w-[3px] rounded-full bg-rose-400/70 animate-pulse" />
                        Open
                      </span>
                    ) : (
                      <span className="rounded-full bg-white/[0.06] px-1.5 py-[2px] text-[0.38rem] font-semibold uppercase tracking-[0.06em] text-slate-500">
                        Locked
                      </span>
                    )}
                    <span className="ml-auto text-[0.4rem] text-slate-500">
                      {total > 0
                        ? `${total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total} votes`
                        : "Be the first to predict"}
                    </span>
                  </div>

                  {/* Question */}
                  <p className="mb-2 text-[0.82rem] font-bold leading-snug text-white">
                    {q.question}
                  </p>

                  {/* Answer pills — each filled proportional to its real vote
                      share, same underlying idea as the Yes/No crowd-split
                      bar, adapted to N options instead of 2. The option
                      currently in the lead gets the same signal-pink
                      emphasis used for the prediction mechanic elsewhere. */}
                  <div className="flex flex-wrap gap-1.5">
                    {q.options.map((opt) => {
                      const pct = percentFor(opt, q.options);
                      const isLeading = leadingId === opt.id;
                      return (
                        <div
                          key={opt.id}
                          className={`relative overflow-hidden rounded-full border px-2.5 py-[4px] ${
                            isLeading ? "border-rose-400/35" : "border-white/[0.1]"
                          }`}
                        >
                          <div
                            className={`absolute inset-y-0 left-0 transition-[width] duration-700 ease-out ${
                              isLeading ? "bg-rose-400/20" : "bg-white/[0.05]"
                            }`}
                            style={{ width: barsMounted ? `${pct}%` : "0%" }}
                          />
                          <div className="relative flex items-center gap-1.5">
                            <span
                              className={`text-[0.58rem] font-medium ${
                                isLeading ? "text-white" : "text-slate-300"
                              }`}
                            >
                              {opt.label}
                            </span>
                            {total > 0 && (
                              <span
                                className={`text-[0.44rem] font-semibold ${
                                  isLeading ? "text-rose-300" : "text-slate-500"
                                }`}
                              >
                                {pct}%
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 4: Upcoming (preview) ── */}
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

        {/* ── Section 5: Past Picks (preview) ── */}
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

      {/* ── Pick Sheet ── */}
      {activeCard && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-40 bg-black/55 transition-opacity duration-300 ${
              sheetVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeSheet}
          />

          {/* Sheet */}
          <div
            className={`fixed inset-x-0 bottom-0 z-50 rounded-t-[1.25rem] border-t border-white/[0.07] bg-[#0b0b12] transition-transform duration-300 ${
              sheetVisible ? "translate-y-0" : "translate-y-full"
            }`}
          >
            {/* Drag handle */}
            <div className="flex justify-center pb-1 pt-3">
              <div className="h-[3px] w-8 rounded-full bg-white/[0.1]" />
            </div>

            <div className="px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3">

              {/* Show name + countdown */}
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[0.52rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
                  {activeCard.show}
                </span>
                <span className="inline-flex items-center gap-[4px] rounded-full bg-rose-500/10 px-2 py-[3px] text-[0.42rem] font-bold uppercase tracking-[0.06em] text-rose-300">
                  <span className="h-[4px] w-[4px] rounded-full bg-rose-400 animate-pulse" />
                  Closes {closesInLabel(activeCard.locksAt)}
                </span>
              </div>

              {/* Question */}
              <p className="mb-5 text-[0.92rem] font-bold leading-snug text-white">
                {activeCard.question}
              </p>

              {/* Answer choices */}
              <div className="mb-4 flex gap-2.5">
                {activeCard.options.map((option) => {
                  const pct = percentFor(option, activeCard.options);
                  const isSelected = selectedOptionId === option.id;
                  const isNegative = option.label === "No";
                  return (
                    <button
                      key={option.id}
                      onClick={() => setSelectedOptionId(option.id)}
                      className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-3.5 transition-all duration-200 active:scale-[0.97] ${
                        isSelected
                          ? isNegative
                            ? "border-rose-400/35 bg-rose-400/[0.07] text-rose-300"
                            : "border-emerald-400/35 bg-emerald-400/[0.07] text-emerald-300"
                          : "border-white/[0.07] bg-white/[0.025] text-slate-300"
                      }`}
                    >
                      <span className="text-[0.9rem] font-bold leading-none">{option.label}</span>
                      <span
                        className={`text-[0.42rem] font-medium leading-none ${
                          isSelected
                            ? isNegative
                              ? "text-rose-400/70"
                              : "text-emerald-400/70"
                            : "text-slate-500"
                        }`}
                      >
                        {pct}% crowd
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Crowd split */}
              <div className="mb-5">
                <CrowdSplitBar
                  yesPercent={yesPercentFor(activeCard)}
                  noPercent={noPercentFor(activeCard)}
                  mounted={barsMounted}
                />
              </div>

              {/* Lock button */}
              <button
                onClick={lockPick}
                disabled={!selectedOptionId}
                className={`mb-2.5 w-full rounded-xl py-3.5 text-center text-[0.7rem] font-bold tracking-[0.05em] transition-all duration-200 ${
                  selectedOptionId
                    ? "border border-white/[0.18] bg-white/[0.08] text-white hover:bg-white/[0.12] active:scale-[0.98]"
                    : "cursor-not-allowed border border-white/[0.04] bg-white/[0.02] text-slate-600"
                }`}
              >
                Lock Pick
              </button>

              {/* Cancel */}
              <button
                onClick={closeSheet}
                className="w-full py-2 text-center text-[0.58rem] font-medium text-slate-500 transition hover:text-slate-300"
              >
                Cancel
              </button>

            </div>
          </div>
        </>
      )}

      <BottomNav />
    </main>
  );
}
