'use client'

import { useEffect, useState } from "react";

// Every viewer, everywhere — not a hardcoded broadcast zone. Server and
// client can't render the real formatted time in the same pass: the
// server has no idea what timezone the viewer is in, and guessing (or
// using the server's own zone, UTC on Vercel) would just bake in a
// different wrong answer and still mismatch once the client reformats
// correctly after mount. So this renders nothing until mounted, then
// fills in — the standard fix for this class of problem, not
// suppressHydrationWarning, which would hide the mismatch instead of
// avoiding it. Both the server's render and the client's pre-hydration
// render produce the same empty output, so there's nothing to mismatch.
export type LocalTimeVariant = "full";

const FORMAT_OPTIONS: Record<LocalTimeVariant, Intl.DateTimeFormatOptions> = {
  // "Sun, Sep 20, 6:00 PM" — the one format currently needed, shared by
  // Guide's hero and Live's rows. Add a variant here if a second shape is
  // ever actually needed; don't pre-build one speculatively.
  full: {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  },
};

export default function LocalTime({
  iso,
  variant = "full",
}: {
  iso: string;
  variant?: LocalTimeVariant;
}) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    // The lint rule disabled below is a generic "you might not need an
    // effect" heuristic — it doesn't have an exception for the one case
    // this actually is: deliberately deferring a client-only computed
    // value until after mount, specifically to keep the first client
    // render identical to the server's. That's not synchronizing React
    // state with an external system by accident; it's the mechanism this
    // component exists for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText(new Date(iso).toLocaleString("en-US", FORMAT_OPTIONS[variant]));
  }, [iso, variant]);

  return <>{text}</>;
}
