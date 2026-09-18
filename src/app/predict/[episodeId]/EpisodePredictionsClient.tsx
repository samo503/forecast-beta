'use client'

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import BottomNav from "../../components/BottomNav";
import LocalTime from "../../components/LocalTime";
import TopBar, { type TopBarUser } from "../../components/TopBar";
import { lockPrediction } from "../../actions/predictions";
import { PredictionCard, type PredictionData } from "../PredictClient";

// Same vote-lock interaction as PredictClient.tsx's confirmVote/
// handlePillTap, duplicated rather than shared through a hook — this page
// is a single, self-contained list for one episode (no tabs, no deep-link
// scrolling, no mock preview sections), so the shared surface with
// PredictClient is the card itself (imported directly) and the server
// action, not the surrounding state glue. What's reused is exactly what
// makes the controls actually work: vote hiding, lock/commit behavior,
// locks_at handling, and the crowd-threshold rule all live inside
// PredictionCard/VotePills and are untouched here.
export default function EpisodePredictionsClient({
  episodeTitle,
  episodeNumber,
  airDate,
  show,
  accentColor,
  predictions,
  myPicks,
  myResults,
  currentUser,
}: {
  episodeTitle: string;
  episodeNumber: number | null;
  airDate: string | null;
  show: string;
  accentColor: string | null;
  predictions: PredictionData[];
  myPicks: Record<string, string>;
  myResults: Record<string, { isCorrect: boolean; points: number }>;
  currentUser: TopBarUser | null;
}) {
  const router = useRouter();
  const [lockedPicks, setLockedPicks] = useState<Record<string, string>>(myPicks);
  const [pendingSelection, setPendingSelection] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [barsMounted, setBarsMounted] = useState(false);

  useEffect(() => {
    // Same deliberate mount-then-reveal as PredictClient.tsx's identical
    // effect: the vote bars' width transition needs a render with width:0
    // to exist first, or the bar would jump straight to its final width
    // with no animation on first paint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBarsMounted(true);
  }, []);

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
          router.push(`/auth?next=/predict/${card.episodeId}`);
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
      console.error("lockPrediction failed", { predictionId: card.id, optionId }, err);
      showToast("Something went wrong. Try again.");
    }
  };

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

        <TopBar currentUser={currentUser} />

        <Link
          href="/predict"
          className="flex w-fit items-center gap-1 text-caption text-slate-500 transition hover:text-slate-300"
        >
          <ChevronLeft className="h-3 w-3" strokeWidth={2} />
          Back to Predict
        </Link>

        <div
          className="border-l-2 border-transparent pl-2.5"
          style={accentColor ? { borderLeftColor: accentColor } : undefined}
        >
          <span className="inline-block rounded-full border border-white/10 bg-slate-950/60 px-2 py-[3px] text-caption font-medium text-slate-300">
            {show}
          </span>
          <h1 className="mt-1.5 text-title font-black leading-tight text-white">
            {episodeTitle}
          </h1>
          <p className="mt-0.5 text-caption text-slate-500">
            {episodeNumber ? `Episode ${episodeNumber}` : null}
            {episodeNumber && airDate && " · "}
            {airDate && <LocalTime iso={airDate} />}
          </p>
        </div>

        <section className="space-y-1">
          {predictions.length === 0 ? (
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] px-3 py-2">
              <p className="text-caption text-slate-600">
                No open predictions for this event right now.
              </p>
            </div>
          ) : (
            predictions.map((card, i) => (
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
        </section>

      </div>

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
