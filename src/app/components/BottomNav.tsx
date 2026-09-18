'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Target, Tv, User, Zap } from "lucide-react";

const navItems = [
  { href: "/",        icon: Tv,     label: "Guide"   },
  { href: "/live",    icon: Zap,    label: "Live"    },
  { href: "/predict", icon: Target, label: "Predict" },
  { href: "/profile", icon: User,   label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Fully opaque, no backdrop-blur — iOS Safari doesn't reliably keep a
  // backdrop-filter live behind a `fixed` element during scroll/navigation,
  // so the translucent version let page content bleed through unblurred and
  // left stale nav pixels ghosted over other screens' headers. A solid
  // background sidesteps the whole bug class instead of chasing it.
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-white/[0.08] bg-[#020205] px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
      <div className="mx-auto flex max-w-[640px] items-center justify-between">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-[5px]">
              <span className="relative flex items-center justify-center">
                <span
                  className={`absolute h-8 w-8 rounded-full blur-lg ${
                    active ? "bg-white/[0.12]" : "bg-white/[0.04]"
                  }`}
                />
                <Icon
                  className={`relative h-[18px] w-[18px] ${active ? "text-white" : "text-slate-500"}`}
                  strokeWidth={1.5}
                />
              </span>
              <span
                className={`text-caption uppercase tracking-[0.14em] ${
                  active ? "text-white" : "text-slate-500"
                }`}
              >
                {label}
              </span>
              {active && <span className="h-[2px] w-[2px] rounded-full bg-white" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
