'use client'

import { Search, Settings } from "lucide-react";
import ForecastWordmark from "./ForecastWordmark";
import { currentUser } from "../../../lib/mock-data";

export type TopBarTab = {
  label: string;
  active?: boolean;
};

export type TopBarUser = {
  name: string;
  avatar: string | null;
  streak: number;
};

type TopBarProps = {
  /** Tab row under the wordmark. Omit for pages with no tabs (e.g. Profile). */
  tabs?: TopBarTab[];
  /** Which icon renders on the right. Defaults to search. */
  rightIcon?: "search" | "settings";
  onRightIconClick?: () => void;
  /**
   * The real signed-in user's avatar/streak. Pass `null` for a logged-out
   * visitor — falls back to the mock identity. Pages should always pass
   * their actual auth state rather than omitting this, so a signed-in
   * user never sees the mock user's face in the header.
   */
  currentUser?: TopBarUser | null;
};

// Shared across all four pages so the identity (avatar + streak) always reads
// from one source — previously each page hardcoded its own copy of the avatar
// URL, which meant three of four places wouldn't update if it ever changed.
export default function TopBar({ tabs, rightIcon = "search", onRightIconClick, currentUser: signedInUser }: TopBarProps) {
  const RightIcon = rightIcon === "settings" ? Settings : Search;
  const name = signedInUser ? signedInUser.name : currentUser.name;
  const avatar = signedInUser ? signedInUser.avatar : currentUser.avatar;
  const streak = signedInUser ? signedInUser.streak : currentUser.streak;

  return (
    <header className="-mx-4 px-4">
      <div className="flex items-center justify-between pb-2.5">
        <div className="relative shrink-0">
          <div className="flex h-[28px] w-[28px] items-center justify-center overflow-hidden rounded-full border border-white/10 bg-slate-900">
            {avatar ? (
              <img
                src={avatar}
                alt="Profile avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[0.62rem] font-semibold text-slate-500">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-1 flex items-center gap-px rounded-full border border-white/10 bg-[#020205] px-[3px] py-px">
            <span className="text-[0.4rem] leading-none">🔥</span>
            <span className="text-[0.42rem] font-bold leading-none text-amber-300">
              {streak}
            </span>
          </div>
        </div>

        <ForecastWordmark />

        <button
          onClick={onRightIconClick}
          className="flex h-[28px] w-[28px] items-center justify-center rounded-full text-slate-400 transition hover:text-slate-200"
        >
          <RightIcon className="h-[15px] w-[15px]" strokeWidth={1.5} />
        </button>
      </div>

      {tabs && tabs.length > 0 && (
        <div className="flex items-end justify-center gap-6 border-b border-white/[0.05]">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              className={
                tab.active
                  ? "relative pb-2 text-[0.62rem] font-semibold text-white"
                  : "pb-2 text-[0.62rem] font-medium text-slate-500 transition hover:text-slate-300"
              }
            >
              {tab.label}
              {tab.active && (
                <span className="absolute inset-x-0 -bottom-px h-[1.5px] rounded-full bg-white/80" />
              )}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
