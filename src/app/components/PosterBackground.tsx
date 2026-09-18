'use client'

import { useState } from "react";
import Image from "next/image";

// Fills its nearest `relative` ancestor with a poster image, falling back
// to the app's existing gradient + title-card treatment (see the homepage's
// "Explore more" channel card) when the image fails to load — several of
// this app's poster sources (deadline.com, variety.com, tvline.com) block
// hotlinking and 402 when requested from this origin. We never download or
// self-host those photos; a failed load just degrades to the same
// typography treatment already used for channels with no art at all.
//
// Renders through next/image rather than a CSS background-image or a raw
// <img> — real compression and per-breakpoint sizing matter once `src`
// points at an actual multi-hundred-KB photo instead of never resolving.
// next/image's own onError is what drives the fallback now; it fires
// reliably (unlike a raw <img>'s onError, which a browser can resolve from
// its failed-request cache before React's listener attaches), so the old
// off-DOM probe-before-render step is gone — it would have meant fetching
// every local stand-in asset twice.
export default function PosterBackground({
  src,
  title,
  backgroundPosition = "center",
  titleClassName = "text-lg",
  variant = "cover",
  sizes = "100vw",
  quality = 60,
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
  /** Passed straight to next/image's `sizes` — matters for a `fill` image,
   *  since it's how the optimizer picks which rendered width to generate.
   *  Callers should pass the container's real rendered width; the default
   *  is a safe but usually-oversized fallback. */
  sizes?: string;
  /** next/image quality (1-100). Lower than Next's own default (75) since
   *  these are atmospheric backgrounds sitting behind UI text and a
   *  legibility gradient, not images anyone zooms into. */
  quality?: number;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
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
        <Image
          src={src}
          alt={`${title} logo`}
          width={160}
          height={80}
          quality={quality}
          className="h-20 w-auto object-contain"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt=""
      fill
      sizes={sizes}
      quality={quality}
      className="object-cover"
      style={{ objectPosition: backgroundPosition }}
      onError={() => setFailed(true)}
    />
  );
}
