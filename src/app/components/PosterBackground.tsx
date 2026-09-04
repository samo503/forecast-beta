'use client'

import { useEffect, useState } from "react";

// Fills its nearest `relative` ancestor with a poster image, falling back
// to the app's existing gradient + title-card treatment (see the homepage's
// "Explore more" channel card) when the image fails to load — several of
// this app's poster sources (deadline.com, variety.com, tvline.com) block
// hotlinking and 402 when requested from this origin. We never download or
// self-host those photos; a failed load just degrades to the same
// typography treatment already used for channels with no art at all.
export default function PosterBackground({
  src,
  title,
  backgroundPosition = "center",
  titleClassName = "text-lg",
  variant = "cover",
}: {
  src: string | null | undefined;
  /** Shown centered over the fallback gradient. Pass "" to render just the
   *  gradient with no title — e.g. when the headline is already shown as
   *  legible overlay text elsewhere in the card. */
  title: string;
  backgroundPosition?: string;
  titleClassName?: string;
  /** "cover" fills the container as a background image (default). "logo"
   *  centers the image at a fixed height, e.g. for a channel logo mark. */
  variant?: "cover" | "logo";
}) {
  // Probe the image off-DOM before ever rendering it. A rendered <img>'s
  // onError can be missed by React when the browser resolves the request
  // from its failed-request cache synchronously, before React's listener
  // attaches — this sidesteps that entirely.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;

    let cancelled = false;
    const probe = new Image();
    probe.onload = () => {
      if (!cancelled) setLoadedSrc(src);
    };
    probe.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!src || loadedSrc !== src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-slate-900 to-slate-800 px-4">
        {title && (
          <h3 className={`text-center font-bold tracking-tight text-white ${titleClassName}`}>
            {title}
          </h3>
        )}
      </div>
    );
  }

  if (variant === "logo") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-slate-900 to-slate-800">
        <img src={src} alt={`${title} logo`} className="h-20 object-contain" />
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `url('${src}')`,
        backgroundSize: "cover",
        backgroundPosition,
      }}
    />
  );
}
