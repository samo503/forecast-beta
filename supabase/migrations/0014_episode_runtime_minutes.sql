-- Adds a real per-episode duration so effectiveEpisodeStatus() (src/lib/
-- episodeStatus.ts) can stop assuming every episode runs exactly
-- LIVE_WINDOW_MINUTES = 90. That fixed window is wrong for two of three
-- still-relevant shows today: Lanterns runs ~52-57 minutes (HBO airs on
-- the hour, so 60 is used here as the safer boundary — a real episode
-- never runs past it, while still well short of colliding with the next
-- hour's programming), and Survivor's September 23, 2026 premiere runs
-- 120 minutes, not 90 — under the old fixed window it would read as
-- "ended" at 9:30 PM PT while the real broadcast runs until 10:00 PM.
-- See docs/reports/episode-duration-plan.md for the full investigation
-- and why runtime_minutes (not a second ends_at timestamp) was chosen.
--
-- Nullable, no default: an episode with no runtime_minutes set falls
-- back to today's exact LIVE_WINDOW_MINUTES behavior (see episodeStatus.ts,
-- next commit in this sequence) — this column is additive, not a
-- required migration for every future seed.
--
-- The two already-`ended` rows (Love Island, Emmys) are deliberately
-- left unbackfilled: effectiveEpisodeStatus() returns 'ended' for a
-- stored 'ended' row before ever consulting a duration, so a number
-- there would be dead data. Emmys' real runtime was never given, and
-- guessing it would be inventing data this project avoids elsewhere.

alter table episodes
  add column runtime_minutes int
  check (runtime_minutes is null or runtime_minutes > 0);

-- Lanterns: all three real upcoming episodes (Bad Optics, Episode 7,
-- Episode 8) share one runtime — HBO's fixed hourly slot, not a
-- per-episode figure.
update episodes
set runtime_minutes = 60
where channel_id = (select id from channels where slug = 'lanterns')
  and episode_number in (6, 7, 8);

-- Survivor: the two-hour premiere is genuinely different from every
-- week after it, not a rounding choice.
update episodes
set runtime_minutes = 120
where channel_id = (select id from channels where slug = 'survivor')
  and episode_number = 1;

update episodes
set runtime_minutes = 90
where channel_id = (select id from channels where slug = 'survivor')
  and episode_number in (2, 3, 4);
