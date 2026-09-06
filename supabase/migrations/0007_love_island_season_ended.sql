-- Content correction: the Love Island USA season this episode belongs to
-- has ended, but the channel and episode were seeded as 'live' and never
-- updated afterward — so the homepage's "Live Now" strip and channel grid
-- have shown it as live ever since, regardless of the actual date. This
-- reuses the existing 'ended'/'off_season' status values (already mapped
-- to "FINAL"/"OFF-SEA" in src/app/page.tsx) rather than introducing any
-- new UI. Content only, no schema or function changes.
--
-- air_date intentionally left untouched: the season's finale date is
-- known, but episode 34 ("Recoupling Night") isn't confirmed to be that
-- finale episode specifically — recouplings recur throughout a season,
-- so asserting a specific air_date here would risk the label and date
-- disagreeing. Only status changes.

update episodes
set status = 'ended'
where channel_id = (select id from channels where slug = 'love-island-usa')
  and episode_number = 34;

update channels
set status = 'off_season'
where slug = 'love-island-usa';
