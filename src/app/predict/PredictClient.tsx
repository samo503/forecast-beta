'use client'

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import BottomNav from "../components/BottomNav";
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
  episodeId: string;
  question: string;
  status: "open" | "locked" | "resolved";
  locksAt: string | null;
  correctOptionId: string | null;
  show: string;
  accentColor: string | null;
  options: PredictionOption[];
};

type Tab = "open" | "locked" | "past";

// Below this many total votes, a crowd split is more noise than signal: one
// vote renders as 100% and looks like consensus when it's one person, and a
// 3-to-1 split among early testers renders as a confident 75% when it's four
// people. This is a deliberate policy call, not a technical limit, so raise
// it if the real audience is still small enough that individual votes swing
// the percentages by double digits.
const MIN_VOTES_FOR_CROWD_SPLIT = 10;

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

// No badge without a deadline to report. Resolved always reads as
// "Resolved", regardless of when it locked. Otherwise: a future locksAt is
// the existing "Closes 6d" countdown (urgent, rose); a past locksAt (or, in
// principle, a status other than "resolved" whose locksAt has already
// passed) reads as the neutral "Closed" instead of repeating "Closes soon"
// forever.
function closeBadgeFor(card: PredictionData): { text: string; urgent: boolean } | null {
  if (card.status === "resolved") return { text: "Resolved", urgent: false };
  if (!card.locksAt) return null;
  const diffMs = new Date(card.locksAt).getTime() - Date.now();
  if (diffMs <= 0) return { text: "Closed", urgent: false };
  return { text: `Closes in ${closesInLabel(card.locksAt)}`, urgent: true };
}

// Vote pills, shared by every card regardless of size. A pill is only
// interactive when the prediction is open and the user hasn't picked yet.
// Tapping an unselected pill just selects it (`pendingSelection`); tapping
// the same pill again confirms and locks it. Tapping a different pill moves
// the selection instead of locking anything. This two-tap flow (rather than
// locking on the first tap) exists because a mis-tap here has no undo.
//
// Non-votable pills stay non-interactive divs (no cursor change, no hover
// state, no invitation to tap) but still respond to a tap with a toast
// explaining why, rather than doing nothing. Same message no matter which
// pill is tapped, including the user's own pick — there's no special case.
function VotePills({
  card,
  lockedPicks,
  pendingSelection,
  barsMounted,
  onPillTap,
  showToast,
}: {
  card: PredictionData;
  lockedPicks: Record<string, string>;
  pendingSelection: Record<string, string>;
  barsMounted: boolean;
  onPillTap: (card: PredictionData, optionId: string) => void;
  showToast: (message: string) => void;
}) {
  const total = totalVotes(card.options);
  // Below the threshold, the crowd split is withheld entirely: no
  // percentages, no fill proportion, no "leading option" emphasis. All
  // three are claims about the crowd, and a claim from a handful of votes
  // is misleading even without printing a number.
  const hasEnoughVotes = total >= MIN_VOTES_FOR_CROWD_SPLIT;
  const leadingId =
    hasEnoughVotes
      ? card.options.reduce((lead, o) => (o.voteCount > lead.voteCount ? o : lead), card.options[0]).id
      : null;
  const myPick = lockedPicks[card.id];
  const pending = pendingSelection[card.id];
  const votable = card.status === "open" && !myPick;
  const lockedMessage = myPick
    ? "Your pick is locked in and can't be changed."
    : card.status !== "open"
    ? "Voting is closed for this one."
    : null;

  return (
    <div className="space-y-1">
      {/* Crowd counts are redacted for open predictions (client-side only,
          see predict/page.tsx) — say so explicitly rather than letting the
          missing percentages read as "nobody has voted yet", which may not
          be true. Says nothing about how many people actually voted. */}
      {card.status === "open" && (
        <p className="text-micro text-slate-400">Votes hidden until this closes.</p>
      )}
      <div className="flex flex-wrap gap-1.5">
      {card.options.map((opt) => {
        const pct = percentFor(opt, card.options);
        const isPicked = myPick === opt.id;
        const isPending = votable && pending === opt.id;
        const isLeading = leadingId === opt.id;

        // Color reports fact, never a guess dressed as one. A pill only ever
        // says which option is yours (and, while locked, that it's a
        // commitment still awaiting an outcome) — it never claims correct or
        // wrong. That's the resolved receipt bar's job alone, so a picked
        // pill looks the same whether the card is open or already resolved.
        // isPicked (locked): amber, matching the pending-outcome meaning
        // amber already carries on /profile's My Picks. isPicked (open or
        // resolved): neutral white. isLeading (crowd's current lean, never
        // the user's own signal): a fainter neutral slate, one tier below
        // isPicked so "mine" still reads stronger than "popular."
        const isPickedLocked = isPicked && card.status === "locked";

        const pillClassName = `relative min-w-[62px] overflow-hidden rounded-full border px-3 py-[5px] ${
          isPickedLocked
            ? "border-amber-400"
            : isPicked
            ? "border-white/70"
            : isPending
            ? "border-white"
            : isLeading
            ? "border-slate-400/30"
            : "border-white/[0.1]"
        } ${votable ? "cursor-pointer" : ""}`;

        const fillClassName = `absolute inset-y-0 left-0 transition-[width] duration-700 ease-out ${
          isPickedLocked
            ? "bg-amber-400/[0.12]"
            : isPicked
            ? "bg-white/[0.08]"
            : isPending
            ? "bg-white/[0.14]"
            : isLeading
            ? "bg-white/[0.06]"
            : "bg-white/[0.05]"
        }`;

        const labelClassName = `text-caption font-medium ${
          isPickedLocked
            ? "text-amber-300"
            : isPicked
            ? "text-white"
            : isPending
            ? "text-white"
            : isLeading
            ? "text-white"
            : "text-slate-300"
        }`;

        const inner = (
          <>
            <div
              className={fillClassName}
              style={{ width: barsMounted && hasEnoughVotes ? `${pct}%` : "0%" }}
            />
            <div className="relative flex items-center justify-center gap-1.5">
              <span className={labelClassName}>{opt.label}</span>
              {isPickedLocked && (
                // Color alone (white vs. amber) shouldn't be the only thing
                // distinguishing "committed, open" from "committed, locked"
                // for a color-blind reader. Locked is the state worth a
                // non-color explanation; the open case is self-evident from
                // the bright border alone, so it gets no glyph.
                <Lock className="h-[8px] w-[8px] text-amber-300" strokeWidth={2.5} />
              )}
              {isPending ? (
                <span className="text-micro font-semibold text-white/80">Tap to confirm</span>
              ) : (
                hasEnoughVotes && (
                  <span
                    className={`text-micro font-semibold ${
                      isPickedLocked
                        ? "text-amber-300"
                        : isPicked
                        ? "text-white/70"
                        : isLeading
                        ? "text-slate-300"
                        : "text-slate-500"
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
          <div
            key={opt.id}
            onClick={() => lockedMessage && showToast(lockedMessage)}
            className={pillClassName}
          >
            {inner}
          </div>
        );
      })}
      </div>
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
  showToast,
}: {
  card: PredictionData;
  variant: "large" | "compact";
  lockedPicks: Record<string, string>;
  pendingSelection: Record<string, string>;
  myResults: Record<string, { isCorrect: boolean; points: number }>;
  barsMounted: boolean;
  onPillTap: (card: PredictionData, optionId: string) => void;
  showToast: (message: string) => void;
}) {
  const myPickId = lockedPicks[card.id];
  const myPickLabel = myPickId ? card.options.find((o) => o.id === myPickId)?.label : undefined;
  const myResult = myResults[card.id];
  const correctLabel = card.correctOptionId
    ? card.options.find((o) => o.id === card.correctOptionId)?.label
    : undefined;

  // Same quiet pill on every card, large or compact — a plain-text badge on
  // one size and an outlined pill on the other read as accidental, not
  // deliberate. Dark, subtle border, small text, no accent-color fill: the
  // card's own left-edge accent already carries the stronger identity, this
  // just names which show.
  const showBadgeClassName =
    "rounded-full border border-white/10 bg-slate-950/60 px-2 py-[3px] text-caption font-medium text-slate-300";

  const closeBadge = closeBadgeFor(card);

  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className={showBadgeClassName}>{card.show}</span>
        {closeBadge && (
          <span
            className={`inline-flex items-center gap-[4px] rounded-full px-2 py-[3px] text-micro font-bold uppercase tracking-[0.08em] ${
              closeBadge.urgent ? "bg-rose-500/15 text-rose-300" : "bg-white/[0.06] text-slate-500"
            }`}
          >
            {closeBadge.urgent && (
              <span className="h-[4px] w-[4px] rounded-full bg-rose-400 animate-pulse" />
            )}
            {closeBadge.text}
          </span>
        )}
      </div>

      <div className={variant === "large" ? "mt-auto space-y-1" : "mt-1.5 space-y-1"}>
        <p
          className={
            variant === "large"
              ? "text-body font-extrabold leading-snug text-white"
              : "text-body font-bold leading-snug text-white"
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
          showToast={showToast}
        />

        {/* Receipt — every branch keys off card.status explicitly, never off
            merely having a pick, so a picked-but-still-open prediction can't
            fall into the same branch as a picked-and-locked one.
            Resolved is one bar, not two: the outcome, the pick, and the
            correct answer only get named once each, never twice.
            Open-with-a-pick and locked-with-a-pick render no bar at all —
            the pill's own border (and, for locked, the small lock glyph)
            already carries it; a card with a pick should read as cleanly as
            one without. Only "voting closed with no pick" still needs a
            bar, since nothing else on the card says that. */}
        {card.status === "resolved" ? (
          myPickId && myResult ? (
            <div
              className={`w-full rounded-lg border py-[5px] text-center tracking-[0.04em] ${
                myResult.isCorrect
                  ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300"
                  : "border-rose-400/30 bg-rose-400/[0.08] text-rose-300"
              }`}
            >
              {myResult.isCorrect ? (
                // One fact to state, so one line, as before.
                <span className="text-caption font-semibold">
                  ✓ {myPickLabel} · +{myResult.points}
                </span>
              ) : (
                // Two facts, scannable top to bottom instead of packed into
                // one sentence: what I picked (primary line, full brightness)
                // above what was actually correct (secondary line, smaller
                // and dimmer), rather than both parsed left to right.
                <>
                  <p className="text-caption font-semibold">
                    ✗ {myPickLabel} · +{myResult.points}
                  </p>
                  <p className="mt-[2px] text-micro font-medium text-rose-300/70">
                    Correct: {correctLabel ?? "—"}
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="w-full rounded-lg border border-white/[0.06] bg-black/20 py-[5px] text-center text-caption font-semibold tracking-[0.04em] text-slate-300">
              Correct answer: {correctLabel ?? "—"}
            </div>
          )
        ) : card.status === "locked" && !myPickId ? (
          <div className="w-full rounded-lg border border-white/[0.06] bg-black/20 py-[5px] text-center text-caption font-semibold tracking-[0.04em] text-white/40">
            Voting closed
          </div>
        ) : null}
      </div>
    </>
  );

  if (variant === "large") {
    // No image treatment for any card, ever — one card looking different
    // because it happened to have an entry in a poster lookup map read as
    // an accident, not a design choice. Every card is this same plain,
    // content-sized shape; the channel's accent_color left edge is the
    // only per-channel identity cue, and degrades to a plain uniform
    // border if unset.
    return (
      <article
        id={`prediction-${card.id}`}
        className="flex flex-col gap-1 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3"
        style={card.accentColor ? { borderLeftColor: card.accentColor, borderLeftWidth: 2 } : undefined}
      >
        {content}
      </article>
    );
  }

  return (
    <div
      id={`prediction-${card.id}`}
      className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2"
      style={card.accentColor ? { borderLeftColor: card.accentColor, borderLeftWidth: 2 } : undefined}
    >
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
  picksThisWeek,
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
  /** Real, live-computed week streak (participation-based). */
  streak: number;
  /** Count of all picks locked in the past 7 days, regardless of status or
   *  outcome. Same metric as /profile's "This week" stat. */
  picksThisWeek: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetEpisodeId = searchParams.get("episode");
  const [lockedPicks, setLockedPicks] = useState<Record<string, string>>(myPicks);
  const [pendingSelection, setPendingSelection] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [barsMounted, setBarsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("open");

  useEffect(() => {
    setBarsMounted(true);
  }, []);

  // id as a stable secondary key: several Lanterns predictions share the
  // same locks_at, so locksAt alone leaves ties unresolved and order can
  // shuffle between loads. Any deterministic tiebreaker works; id needs no
  // extra data plumbing beyond what's already on every card.
  const byLocksAtAscNullsLast = (a: PredictionData, b: PredictionData) => {
    if (!a.locksAt && !b.locksAt) return a.id.localeCompare(b.id);
    if (!a.locksAt) return 1;
    if (!b.locksAt) return -1;
    const diff = new Date(a.locksAt).getTime() - new Date(b.locksAt).getTime();
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  };
  const byLocksAtDescNullsLast = (a: PredictionData, b: PredictionData) => {
    if (!a.locksAt && !b.locksAt) return a.id.localeCompare(b.id);
    if (!a.locksAt) return 1;
    if (!b.locksAt) return -1;
    const diff = new Date(b.locksAt).getTime() - new Date(a.locksAt).getTime();
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  };

  // Three tabs, one status each. Nothing dropped across all three combined,
  // just split by which bucket a prediction is currently in.
  const tabPredictions: Record<Tab, PredictionData[]> = {
    open: predictions.filter((p) => p.status === "open").sort(byLocksAtAscNullsLast),
    locked: predictions.filter((p) => p.status === "locked").sort(byLocksAtDescNullsLast),
    past: predictions.filter((p) => p.status === "resolved").sort(byLocksAtDescNullsLast),
  };
  const tabEmptyMessage: Record<Tab, string> = {
    open: "No open predictions right now.",
    locked: "No locked predictions waiting on a result.",
    past: "No resolved predictions yet.",
  };
  const sortedPredictions = tabPredictions[activeTab];

  // Deep link from Guide's "Make a prediction" CTA (?episode=<id>). A
  // matching episode's predictions can land on any of the three tabs, so
  // this switches to whichever one actually has a match, most-actionable
  // first — matching why someone was sent here in the first place. If the
  // episode has no predictions at all (bad id, or none were ever created),
  // this is silently a no-op: same "let the page just be correct" stance
  // as everywhere else a stale or missing target is handled.
  useEffect(() => {
    if (!targetEpisodeId) return;
    const matches = predictions.filter((p) => p.episodeId === targetEpisodeId);
    if (!matches.length) return;
    const tabForStatus: Record<PredictionData["status"], Tab> = {
      open: "open",
      locked: "locked",
      resolved: "past",
    };
    const tabPriority: Tab[] = ["open", "locked", "past"];
    const matchedTabs = new Set(matches.map((p) => tabForStatus[p.status]));
    const winningTab = tabPriority.find((tab) => matchedTabs.has(tab));
    // This is reacting to a URL param, not synchronizing with the tab
    // state itself — there's no way to know which tab a deep-linked
    // episode belongs on without first looking at the loaded predictions,
    // which only exist once this effect runs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (winningTab) setActiveTab(winningTab);
  }, [targetEpisodeId, predictions]);

  // Runs after the tab switch above actually re-renders the DOM (this
  // effect depends on activeTab, so it re-fires once that tab's cards
  // exist) — scrolls to the first matching card and stops there. If the
  // prediction has since locked or resolved by the time this runs, this
  // still scrolls to it and lets the card show its own real state; that's
  // the page being correct, not an error to special-case.
  useEffect(() => {
    if (!targetEpisodeId) return;
    const match = sortedPredictions.find((p) => p.episodeId === targetEpisodeId);
    if (!match) return;
    document.getElementById(`prediction-${match.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, targetEpisodeId, predictions]);

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

    // A tab left open past locksAt never re-runs the lazy lock itself
    // (that only happens on a fresh server render of /predict), so this
    // catches the common late-pick case before even attempting the write.
    // 0011_enforce_locks_at_on_pick.sql's RLS check is the real backstop
    // for whatever this client-side check misses.
    if (card.locksAt && Date.now() >= new Date(card.locksAt).getTime()) {
      showToast("Picks for this question have closed.");
      router.refresh();
      return;
    }

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
        case "closed":
          showToast("Picks for this question have closed.");
          router.refresh();
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
            { label: "Open", active: activeTab === "open", onClick: () => setActiveTab("open") },
            { label: "Locked", active: activeTab === "locked", onClick: () => setActiveTab("locked") },
            { label: "Past", active: activeTab === "past", onClick: () => setActiveTab("past") },
          ]}
        />

        {/* ── Section 1: Your Forecast ── */}
        <section className="space-y-2">
          <p className="px-0.5 text-caption font-bold uppercase tracking-[0.28em] text-slate-500">
            Your Forecast
          </p>

          <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] px-5 py-2">
            {/* Streak */}
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <span className="text-title font-black leading-none text-amber-300">
                  {streak}
                </span>
                <span className="text-label leading-none">🔥</span>
              </div>
              <span className="text-micro uppercase tracking-[0.12em] text-slate-500">
                Week streak
              </span>
            </div>

            <div className="h-6 w-px bg-white/[0.06]" />

            {/* Accuracy */}
            <div className="flex flex-col items-center">
              <span className="text-title font-black leading-none text-white">
                {accuracy === null ? "—" : `${accuracy}%`}
              </span>
              <span className="text-micro uppercase tracking-[0.12em] text-slate-500">
                Accuracy
              </span>
            </div>

            <div className="h-6 w-px bg-white/[0.06]" />

            {/* This week */}
            <div className="flex flex-col items-center">
              <span className="text-title font-black leading-none text-white">
                {picksThisWeek}
              </span>
              <span className="text-micro uppercase tracking-[0.12em] text-slate-500">
                This week
              </span>
            </div>
          </div>
        </section>

        {/* ── Section 2: Predictions ── */}
        <section className="space-y-2">
          <p className="px-0.5 text-caption font-bold uppercase tracking-[0.28em] text-slate-500">
            Predictions
          </p>

          <div className="space-y-1">
            {sortedPredictions.length === 0 ? (
              <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] px-3 py-3">
                <p className="text-caption text-slate-600">{tabEmptyMessage[activeTab]}</p>
              </div>
            ) : (
              sortedPredictions.map((card, i) => (
                <PredictionCard
                  key={card.id}
                  card={card}
                  variant={i === 0 ? "large" : "compact"}
                  lockedPicks={lockedPicks}
                  pendingSelection={pendingSelection}
                  myResults={myResults}
                  barsMounted={barsMounted}
                  onPillTap={handlePillTap}
                  showToast={showToast}
                />
              ))
            )}
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

        {/* ── Section 4: Past Picks (preview) ──
            Not reconciled against the color-semantics rule adopted for
            VotePills and the receipt banners above (rose = urgency or
            confirmed wrong, emerald = confirmed correct + success toast,
            amber = pending/ongoing, neutral = a selection with no verdict
            yet). It happens to already match — correct is emerald, wrong is
            rose, pending is amber — but re-check before ever unhiding it. */}
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
            <span className="text-caption font-semibold uppercase tracking-[0.1em] text-emerald-300">
              {toast}
            </span>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
