import { Edit3, Settings } from "lucide-react";
import BottomNav from "../components/BottomNav";
import ForecastWordmark from "../components/ForecastWordmark";
import {
  pastItems,
  trophies,
  followedShows,
  profileActivity,
  profileFriends,
} from "../../../lib/mock-data";

const profileUser = {
  name: "Samuel",
  handle: "@samuelnw",
  avatar:
    "https://images.unsplash.com/photo-1614023342667-6f060e9d1e04?auto=format&fit=crop&w=120&q=80",
  streak: 4,
  identityLine: "Reality strategist · Prestige drama loyalist",
};

const trophyColor: Record<number, string> = {
  1: "#818cf8", // Called It — indigo
  2: "#fb923c", // Hot Streak — amber
  3: "#fbbf24", // Reality Expert — yellow
  4: "#c4b5fd", // Live Room Regular — violet
  5: "#a78bfa", // Finale Prophet — purple
  6: "#38bdf8", // First Call — sky
};

export default function Profile() {
  return (
    <main className="relative min-h-screen bg-[#020205] pb-32 text-white">
      <div className="mx-auto flex max-w-[640px] flex-col gap-6 px-4 pt-5">

        {/* ── Header ── */}
        <header className="-mx-4 px-4">
          <div className="flex items-center justify-between pb-2.5">
            <div className="relative shrink-0">
              <div className="h-[28px] w-[28px] overflow-hidden rounded-full border border-white/10 bg-slate-900">
                <img
                  src={profileUser.avatar}
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
              <Settings className="h-[15px] w-[15px]" strokeWidth={1.5} />
            </button>
          </div>
        </header>

        {/* ── Profile Hero ── */}
        <div className="relative flex flex-col items-center gap-[5px]">
          {/* Radial depth wash */}
          <div className="pointer-events-none absolute inset-x-0 -top-4 h-40 bg-[radial-gradient(ellipse_70%_55%_at_50%_10%,rgba(139,92,246,0.07),transparent)]" />

          {/* Avatar */}
          <div className="relative z-10">
            <div
              className="h-[58px] w-[58px] overflow-hidden rounded-full bg-slate-900"
              style={{
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.13), 0 0 22px rgba(139,92,246,0.15)",
              }}
            >
              <img
                src={profileUser.avatar}
                alt={profileUser.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-px -right-0.5 flex items-center gap-px rounded-full border border-white/10 bg-[#020205] px-[4px] py-[2px]">
              <span className="text-[0.44rem] leading-none">🔥</span>
              <span className="text-[0.46rem] font-bold leading-none text-amber-300">
                {profileUser.streak}
              </span>
            </div>
          </div>

          {/* Name + edit */}
          <div className="relative z-10 flex flex-col items-center gap-[3px]">
            <div className="flex items-center gap-2">
              <span className="text-[1.15rem] font-black leading-none text-white">
                {profileUser.name}
              </span>
              <button className="flex items-center gap-[3px] rounded-full border border-white/[0.08] bg-white/[0.03] px-[6px] py-[3px] text-[0.44rem] font-medium text-slate-500 transition hover:text-slate-300">
                <Edit3 className="h-[7px] w-[7px]" strokeWidth={1.5} />
                Edit
              </button>
            </div>
            <span className="text-[0.56rem] text-slate-500">{profileUser.handle}</span>
          </div>

          {/* Identity line */}
          <p className="relative z-10 text-center text-[0.58rem] leading-relaxed text-slate-400">
            {profileUser.identityLine}
          </p>
        </div>

        {/* ── Stats Row ── */}
        <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] px-5 py-3">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[1.05rem] font-black leading-none text-violet-300">62%</span>
            <span className="text-[0.4rem] uppercase tracking-[0.1em] text-slate-500">Accuracy</span>
          </div>
          <div className="h-7 w-px bg-white/[0.06]" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[1.05rem] font-black leading-none text-white">48</span>
            <span className="text-[0.4rem] uppercase tracking-[0.1em] text-slate-500">Predictions</span>
          </div>
          <div className="h-7 w-px bg-white/[0.06]" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[1.05rem] font-black leading-none text-emerald-300">12</span>
            <span className="text-[0.4rem] uppercase tracking-[0.1em] text-slate-500">This week</span>
          </div>
          <div className="h-7 w-px bg-white/[0.06]" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[1.05rem] font-black leading-none text-amber-300">6</span>
            <span className="text-[0.4rem] uppercase tracking-[0.1em] text-slate-500">Trophies</span>
          </div>
        </div>

        {/* ── Trophy Shelf ── */}
        <section className="space-y-2">
          <p className="px-0.5 text-[0.6rem] font-bold uppercase tracking-[0.28em] text-slate-200">
            Trophies
          </p>
          <div className="-mx-4 overflow-x-auto scroll-smooth px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-2 pr-4">
              {trophies.map((trophy) => {
                const color = trophyColor[trophy.id] ?? "#94a3b8";
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
                      <span className="relative text-[1.25rem] leading-none">
                        {trophy.icon}
                      </span>
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

        {/* ── Following Shows ── */}
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
                  <div
                    className="relative h-[84px] w-[62px] overflow-hidden rounded-xl border border-white/[0.07]"
                    style={{
                      backgroundImage: `url('${show.poster}')`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
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

        {/* ── Prediction Record ── */}
        <section className="space-y-1.5">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[0.54rem] font-bold uppercase tracking-[0.22em] text-slate-500">
              Prediction Record
            </p>
            <button className="text-[0.42rem] text-slate-600 transition hover:text-slate-400">
              See all ›
            </button>
          </div>
          <div className="divide-y divide-white/[0.04] rounded-xl border border-white/[0.05] bg-white/[0.015] px-3">
            {pastItems.map((item) => (
              <div key={item.id} className="flex items-start gap-2.5 py-2">
                <div
                  className={`mt-[4px] h-[5px] w-[5px] shrink-0 rounded-full ${
                    item.result === "correct"
                      ? "bg-emerald-400/75"
                      : item.result === "wrong"
                      ? "bg-rose-400/70"
                      : "bg-amber-400/60"
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
                <span
                  className={`shrink-0 pt-[3px] text-[0.42rem] font-semibold ${
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

        {/* ── Activity ── */}
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
                      ? "bg-violet-400/[0.08]"
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

        {/* ── Friends ── */}
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
                  <span className="shrink-0 text-[0.48rem] font-semibold text-violet-300/80">
                    {friend.accuracy}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>

      <BottomNav />
    </main>
  );
}
