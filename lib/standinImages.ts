// Temporary AI-generated atmospheric stand-in imagery — added 2026-09-17
// (Lanterns, Love Island) and 2026-09-19 (Survivor), not final artwork.
// See docs/decisions.md's "Imagery" section for the full rationale and the
// "no artwork until approved" exception these files carry.
//
// Shared by Guide (src/app/page.tsx) and Live (src/app/live/page.tsx) so
// there's exactly one mapping to update if a file moves or a new stand-in
// is added, rather than two copies drifting apart.

// Guide's Up Next hero fallback — one image per channel, reused across
// whichever episode that channel is currently showing in the carousel
// (consumed by page.tsx as `heroEpisodeImages[key] ?? channelPosters[slug]`).
// Lanterns and Survivor both reuse their own hero image here across every
// episode (E6/E7/E8; E1-E4) rather than going without — see the build
// report for why an active channel rendering as a plain text card next to
// others with art was the thing being fixed.
//
// No entry for "emmys" here — its original stand-in depicted an Emmy
// statuette (trademarked franchise iconography under decisions.md's
// Imagery rule) and was removed. A compliant replacement exists now
// (forecast_guide_card_emmys.png, added 2026-09-20 — see
// channelCardImages below) but Emmys currently has no upcoming episode,
// so it never reaches Up Next's carousel; nothing to wire here until
// that changes. The Channels-grid card still gets it via
// channelCardImages.
export const channelPosters: Record<string, string> = {
  lanterns: "/images/standin/forecast_guide_hero_lanterns.png",
  "love-island-usa": "/images/standin/forecast_guide_card_love_island.png",
  survivor: "/images/standin/forecast_guide_hero_survivor.png",
};

// Guide's Channels-grid card image specifically — takes precedence over
// channelPosters for that one surface only (GuideChannels.tsx does
// `channelCardImages[slug] ?? channelPosters[slug]`). Lanterns and Love
// Island have no entry here and fall through to channelPosters (the same
// single image reused for both surfaces, differentiated only by
// backgroundPosition) — Survivor and Emmys both have a real,
// separately-shot-for-the-card asset instead of a reused hero crop, so
// they get their own entries rather than forcing the other two into this
// map for no reason. Today's two Survivor files are byte-identical (same
// source image, two names) — this split still exists so a future
// replacement of just the card asset doesn't require a code change.
//
// Emmys (added 2026-09-20): warm golden spotlight beam upper-left,
// burgundy velvet curtain filling the rest — a real theater stage, no
// statuette, no logo, no people. Approved stand-in, same temporary
// AI-generated category as the rest of this file.
export const channelCardImages: Record<string, string> = {
  survivor: "/images/standin/forecast_guide_card_survivor.png",
  emmys: "/images/standin/forecast_guide_card_emmys.png",
};

// Guide's hero strip — keyed per episode, not per channel, since the
// stand-in is shot for this specific event, not the show in general.
// Only Bad Optics has a dedicated hero image today; a future primary hero
// (Episode 7, once Bad Optics airs) has no entry and falls back to the
// text-first no-image state until a hero image exists for it too.
export const heroEpisodeImages: Record<string, string> = {
  "lanterns-e6": "/images/standin/forecast_guide_hero_lanterns.png",
};

// Live's upcoming rows — one stand-in per real episode, distinct from the
// Guide hero's own Bad Optics image (same event, different surface,
// different shot — see docs/decisions.md's Imagery section on why a
// channel's visual family spans multiple images rather than one reused
// everywhere). Keyed by "<channel slug>-e<episode number>" rather than the
// episode's database id — stable across environments/reseeds, unlike an
// auto-generated uuid, and legible on its own in this file.
// No entry for "lanterns-e8" — its stand-in (forecast_live_lanterns_
// episode_8.png) was generic forest stock imagery with no visual
// connection to Lanterns' sci-fi world, unlike Bad Optics (storm/dam) and
// Episode 7 (moon/space), which share a cold, otherworldly palette. The
// asset was deleted rather than kept for reuse elsewhere. That row
// renders text-only until a compliant Lanterns-family replacement exists.
export const liveEpisodeImages: Record<string, string> = {
  "lanterns-e6": "/images/standin/forecast_live_lanterns_bad_optics.png",
  "lanterns-e7": "/images/standin/forecast_live_lanterns_episode_7.png",
};

export function episodeImageKey(
  channelSlug: string,
  episodeNumber: number | null
): string {
  return `${channelSlug}-e${episodeNumber ?? ""}`;
}
