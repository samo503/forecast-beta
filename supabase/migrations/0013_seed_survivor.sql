-- Seeds Survivor as a real fourth channel. CBS's Survivor 51, "The Open
-- Era" — 21 new castaways, Mamanuca Islands, Fiji. Premieres Wednesday,
-- September 23, 2026 (two hours); weekly 90-minute episodes Wednesdays
-- from September 30, 2026. Episode titles aren't published yet, so
-- "Episode 1", "Episode 2", etc. follow the same placeholder convention
-- already used for Lanterns' untitled episodes. No predictions and no
-- artwork yet — accent-color fallback, same as any channel without an
-- approved image.
--
-- Four episodes seeded (through October 14) — exactly what falls inside
-- /schedule's real 30-day window as of the seed date (2026-09-18). A
-- fifth episode (October 21) enters that window on its own in a few
-- days; a short follow-up seed nearer that date is the honest way to
-- extend this, not guessing the season's length now.
--
-- Known limitation (see docs/decisions.md, "Survivor: real channel, and
-- a known timezone limitation in its data"): CBS airs Survivor at 8:00 PM
-- simultaneously in both ET and PT, which a single timestamptz cannot
-- represent as "8 PM" in both zones at once. air_date below is anchored
-- to the Pacific instant. This is a deliberate, accepted gap, not a bug
-- to be silently corrected later.

insert into channels (id, slug, name, channel_number, status, genres, description, accent_color)
values (
  'cccccccc-1111-1111-1111-111111111111',
  'survivor',
  'Survivor',
  4,
  'upcoming',
  array['Reality', 'Competition'],
  'Twenty-one new castaways compete for a million dollars in the Mamanuca Islands, Fiji.',
  '#f97316'
);

insert into episodes (id, channel_id, title, episode_number, air_date, status)
values
  ('cccccccc-2222-2222-2222-000000000001', 'cccccccc-1111-1111-1111-111111111111', 'Episode 1', 1, '2026-09-24T03:00:00Z', 'upcoming'),
  ('cccccccc-2222-2222-2222-000000000002', 'cccccccc-1111-1111-1111-111111111111', 'Episode 2', 2, '2026-10-01T03:00:00Z', 'upcoming'),
  ('cccccccc-2222-2222-2222-000000000003', 'cccccccc-1111-1111-1111-111111111111', 'Episode 3', 3, '2026-10-08T03:00:00Z', 'upcoming'),
  ('cccccccc-2222-2222-2222-000000000004', 'cccccccc-1111-1111-1111-111111111111', 'Episode 4', 4, '2026-10-15T03:00:00Z', 'upcoming');
