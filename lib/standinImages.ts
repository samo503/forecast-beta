// Temporary AI-generated atmospheric stand-in imagery — added 2026-09-17
// ahead of the 2026-09-20 test, not final artwork. See docs/decisions.md's
// "Imagery" section for the full rationale and the "no artwork until
// approved" exception these six files carry.
//
// Shared by Guide (src/app/page.tsx) and Live (src/app/live/page.tsx) so
// there's exactly one mapping to update if a file moves or a new stand-in
// is added, rather than two copies drifting apart.

// Guide's channel grid — one image per channel, reused across whichever
// episode that channel is currently showing. Lanterns intentionally
// reuses its own hero image (a different crop, via a different
// backgroundPosition at the call site) rather than going without: see the
// build report for why an active channel rendering as a plain text card
// next to two inactive channels with art was the thing being fixed.
//
// No entry for "emmys" — its stand-in (forecast_guide_card_emmys.png)
// depicted an Emmy statuette, trademarked franchise iconography under
// decisions.md's Imagery rule, and was removed along with the asset
// itself. That channel renders the plain accent-color fallback until a
// compliant replacement exists.
export const channelPosters: Record<string, string> = {
  lanterns: "/images/standin/forecast_guide_hero_lanterns.png",
  "love-island-usa": "/images/standin/forecast_guide_card_love_island.png",
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
