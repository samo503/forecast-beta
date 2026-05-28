'use client'

import { useState } from "react";
import { Search } from "lucide-react";
import BottomNav from "../components/BottomNav";
import ForecastWordmark from "../components/ForecastWordmark";
import {
  type ClosingCard,
  closingCards,
  liveQuestions,
  pastItems,
  predictStats,
  upcomingItems,
} from "../../../lib/mock-data";

export default function Predict() {
  const [activeCard, setActiveCard] = useState<ClosingCard | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<"Yes" | "No" | null>(null);
  const [lockedPicks, setLockedPicks] = useState<Record<number, "Yes" | "No">>({});
  const [toast, setToast] = useState<string | null>(null);

  const openSheet = (card: ClosingCard) => {
    if (lockedPicks[card.id]) return;
    setActiveCard(card);
    setSelectedAnswer(null);
    // Double rAF ensures the element is mounted before the CSS transition fires
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setSheetVisible(true));
    });
  };

  const closeSheet = () => {
    setSheetVisible(false);
    setTimeout(() => {
      setActiveCard(null);
      setSelectedAnswer(null);
    }, 300);
  };

  const lockPick = () => {
    if (!activeCard || !selectedAnswer) return;
    const pick = selectedAnswer;
    const cardId = activeCard.id;
    setLockedPicks((prev) => ({ ...prev, [cardId]: pick }));
    closeSheet();
    setToast(pick);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <main className="relative min-h-screen bg-[#020205] pb-28 text-white">
      <div className="mx-auto flex max-w-[640px] flex-col gap-6 px-4 pt-5">

        {/* ── Header ── */}
        <header className="-mx-4 px-4">
          <div className="flex items-center justify-between pb-2.5">
            <div className="relative shrink-0">
              <div className="h-[28px] w-[28px] overflow-hidden rounded-full border border-white/10 bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1614023342667-6f060e9d1e04?auto=format&fit=crop&w=120&q=80"
                  alt="Profile avatar"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-1 flex items-center gap-px rounded-full border border-white/10 bg-[#020205] px-[3px] py-px">
                <span className="text-[0.4rem] leading-none">🔥</span>
                <span className="text-[0.42rem] font-bold leading-none text-amber-300">4</span>
              </div>
            </div>

            <ForecastWordmark />

            <button className="flex h-[28px] w-[28px] items-center justify-center rounded-full text-slate-400 transition hover:text-slate-200">
              <Search className="h-[15px] w-[15px]" strokeWidth={1.5} />
            </button>
          </div>

          {/* Predict tabs */}
          <div className="flex items-end justify-center gap-6 border-b border-white/[0.05]">
            <button className="relative pb-2 text-[0.62rem] font-semibold text-white">
              Live
              <span className="absolute inset-x-0 -bottom-px h-[1.5px] rounded-full bg-white/80" />
            </button>
            <button className="pb-2 text-[0.62rem] font-medium text-slate-500 transition hover:text-slate-300">
              Closing Soon
            </button>
            <button className="pb-2 text-[0.62rem] font-medium text-slate-500 transition hover:text-slate-300">
              Upcoming
            </button>
            <button className="pb-2 text-[0.62rem] font-medium text-slate-500 transition hover:text-slate-300">
              Past
            </button>
          </div>
        </header>

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
                  {predictStats.streak}
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
              <span className="text-[1.15rem] font-black leading-none text-violet-300">
                {predictStats.accuracy}%
              </span>
              <span className="text-[0.42rem] uppercase tracking-[0.12em] text-slate-500">
                Accuracy
              </span>
            </div>

            <div className="h-8 w-px bg-white/[0.06]" />

            {/* This week */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[1.15rem] font-black leading-none text-emerald-300">
                {predictStats.correctThisWeek}
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
              return (
                <article
                  key={card.id}
                  className="relative overflow-hidden rounded-2xl"
                  style={{
                    backgroundImage: `url('${card.poster}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
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
                        Closes {card.closesIn}
                      </span>
                    </div>

                    {/* Bottom block */}
                    <div className="mt-auto space-y-1.5">
                      <p className="text-[0.88rem] font-extrabold leading-snug text-white">
                        {card.question}
                      </p>

                      {/* Crowd split + bar inline */}
                      <div className="space-y-[4px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[0.42rem] text-slate-400">{card.yesPercent}% Yes</span>
                          <span className="text-[0.42rem] text-slate-400">{100 - card.yesPercent}% No</span>
                        </div>
                        <div className="h-[2px] overflow-hidden rounded-full bg-white/[0.07]">
                          <div
                            className="h-full rounded-full bg-violet-400/55"
                            style={{ width: `${card.yesPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* CTA — locked or open */}
                      {locked ? (
                        <div
                          className={`w-full rounded-lg border py-[5px] text-center text-[0.6rem] font-semibold tracking-[0.04em] ${
                            locked === "Yes"
                              ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300"
                              : "border-rose-400/30 bg-rose-400/[0.08] text-rose-300"
                          }`}
                        >
                          Locked: {locked} ✓
                        </div>
                      ) : (
                        <button
                          onClick={() => openSheet(card)}
                          className="w-full rounded-lg border border-white/[0.1] bg-black/25 py-[5px] text-center text-[0.6rem] font-semibold tracking-[0.04em] text-white/80 backdrop-blur-sm transition hover:bg-black/35 hover:text-white/95"
                        >
                          {card.cta} →
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
            {liveQuestions.map((q) => (
              <div
                key={q.id}
                className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5"
              >
                {/* Show + live badge + vote count */}
                <div className="mb-1.5 flex items-center gap-1.5">
                  <span className="text-[0.48rem] font-semibold uppercase tracking-[0.1em] text-violet-400/80">
                    {q.show}
                  </span>
                  <span className="inline-flex items-center gap-[3px] rounded-full bg-rose-500/10 px-1.5 py-[2px] text-[0.38rem] font-semibold uppercase tracking-[0.06em] text-rose-400/80">
                    <span className="h-[3px] w-[3px] rounded-full bg-rose-400/70 animate-pulse" />
                    Open
                  </span>
                  <span className="ml-auto text-[0.4rem] text-slate-500">
                    {q.totalVotes >= 1000
                      ? `${(q.totalVotes / 1000).toFixed(1)}k`
                      : q.totalVotes}{" "}
                    votes
                  </span>
                </div>

                {/* Question */}
                <p className="mb-2 text-[0.82rem] font-bold leading-snug text-white">
                  {q.question}
                </p>

                {/* Answer pills with crowd split */}
                <div className="flex flex-wrap gap-1.5">
                  {q.options.map((opt, idx) => (
                    <button
                      key={opt}
                      className="flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] px-2.5 py-[4px] transition hover:border-violet-400/50 hover:bg-violet-400/[0.08] active:scale-95"
                    >
                      <span className="text-[0.58rem] font-medium text-slate-300 transition-colors group-hover:text-violet-200">
                        {opt}
                      </span>
                      <span className="text-[0.44rem] font-semibold text-slate-500">
                        {q.crowdSplit[idx]}%
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
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
              Pick locked · {toast}
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
                <span className="text-[0.52rem] font-semibold uppercase tracking-[0.1em] text-violet-400/80">
                  {activeCard.show}
                </span>
                <span className="inline-flex items-center gap-[4px] rounded-full bg-rose-500/10 px-2 py-[3px] text-[0.42rem] font-bold uppercase tracking-[0.06em] text-rose-300">
                  <span className="h-[4px] w-[4px] rounded-full bg-rose-400 animate-pulse" />
                  Closes {activeCard.closesIn}
                </span>
              </div>

              {/* Question */}
              <p className="mb-5 text-[0.92rem] font-bold leading-snug text-white">
                {activeCard.question}
              </p>

              {/* Answer choices */}
              <div className="mb-4 flex gap-2.5">
                {(["Yes", "No"] as const).map((answer) => {
                  const pct = answer === "Yes" ? activeCard.yesPercent : 100 - activeCard.yesPercent;
                  const isSelected = selectedAnswer === answer;
                  return (
                    <button
                      key={answer}
                      onClick={() => setSelectedAnswer(answer)}
                      className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-3.5 transition-all duration-200 active:scale-[0.97] ${
                        isSelected
                          ? answer === "Yes"
                            ? "border-emerald-400/35 bg-emerald-400/[0.07] text-emerald-300"
                            : "border-rose-400/35 bg-rose-400/[0.07] text-rose-300"
                          : "border-white/[0.07] bg-white/[0.025] text-slate-300"
                      }`}
                    >
                      <span className="text-[0.9rem] font-bold leading-none">{answer}</span>
                      <span
                        className={`text-[0.42rem] font-medium leading-none ${
                          isSelected
                            ? answer === "Yes"
                              ? "text-emerald-400/70"
                              : "text-rose-400/70"
                            : "text-slate-500"
                        }`}
                      >
                        {pct}% crowd
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Crowd split bar */}
              <div className="mb-5 space-y-[5px]">
                <div className="flex justify-between">
                  <span className="text-[0.38rem] text-slate-600">{activeCard.yesPercent}% Yes</span>
                  <span className="text-[0.38rem] text-slate-600">{100 - activeCard.yesPercent}% No</span>
                </div>
                <div className="h-[2px] overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-violet-400/35"
                    style={{ width: `${activeCard.yesPercent}%` }}
                  />
                </div>
              </div>

              {/* Lock button */}
              <button
                onClick={lockPick}
                disabled={!selectedAnswer}
                className={`mb-2.5 w-full rounded-xl py-3.5 text-center text-[0.7rem] font-bold tracking-[0.05em] transition-all duration-200 ${
                  selectedAnswer
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
