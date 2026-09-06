-- Seeds a real one-night event: the 78th Primetime Emmy Awards, airing
-- September 14, 2026 at 8pm ET. Follows the same schema pattern as the
-- existing Love Island USA seed data (supabase/seed.sql) — a channel, one
-- episode, and predictions with real options. Content only, no schema or
-- function changes.

insert into channels (id, slug, name, channel_number, status, genre, description, accent_color)
values (
  'eeeeeeee-1111-1111-1111-111111111111',
  'emmys',
  'Primetime Emmy Awards',
  2,
  'upcoming',
  'Awards',
  'Television''s biggest night honors the best in drama, comedy, and limited series.',
  '#fb7185'
);

insert into episodes (id, channel_id, title, air_date, status)
values (
  'eeeeeeee-2222-2222-2222-222222222222',
  'eeeeeeee-1111-1111-1111-111111111111',
  '78th Primetime Emmy Awards',
  '2026-09-14 20:00:00-04',
  'upcoming'
);

insert into predictions (id, episode_id, channel_id, question, status, locks_at)
values
  ('eeeeeeee-3333-3333-3333-000000000001', 'eeeeeeee-2222-2222-2222-222222222222', 'eeeeeeee-1111-1111-1111-111111111111', 'Who will win Outstanding Drama Series?', 'open', '2026-09-14 19:45:00-04'),
  ('eeeeeeee-3333-3333-3333-000000000002', 'eeeeeeee-2222-2222-2222-222222222222', 'eeeeeeee-1111-1111-1111-111111111111', 'Who will win Outstanding Comedy Series?', 'open', '2026-09-14 19:45:00-04'),
  ('eeeeeeee-3333-3333-3333-000000000003', 'eeeeeeee-2222-2222-2222-222222222222', 'eeeeeeee-1111-1111-1111-111111111111', 'Who will win Outstanding Lead Actor in a Drama Series?', 'open', '2026-09-14 19:45:00-04'),
  ('eeeeeeee-3333-3333-3333-000000000004', 'eeeeeeee-2222-2222-2222-222222222222', 'eeeeeeee-1111-1111-1111-111111111111', 'Who will win Outstanding Lead Actress in a Drama Series?', 'open', '2026-09-14 19:45:00-04');

-- Outstanding Drama Series
insert into prediction_options (id, prediction_id, label, sort_order)
values
  ('eeeeeeee-4444-4444-4444-000000000101', 'eeeeeeee-3333-3333-3333-000000000001', 'The Diplomat', 0),
  ('eeeeeeee-4444-4444-4444-000000000102', 'eeeeeeee-3333-3333-3333-000000000001', 'The Gilded Age', 1),
  ('eeeeeeee-4444-4444-4444-000000000103', 'eeeeeeee-3333-3333-3333-000000000001', 'A Knight of the Seven Kingdoms', 2),
  ('eeeeeeee-4444-4444-4444-000000000104', 'eeeeeeee-3333-3333-3333-000000000001', 'Paradise', 3),
  ('eeeeeeee-4444-4444-4444-000000000105', 'eeeeeeee-3333-3333-3333-000000000001', 'The Pitt', 4),
  ('eeeeeeee-4444-4444-4444-000000000106', 'eeeeeeee-3333-3333-3333-000000000001', 'Pluribus', 5),
  ('eeeeeeee-4444-4444-4444-000000000107', 'eeeeeeee-3333-3333-3333-000000000001', 'Slow Horses', 6),
  ('eeeeeeee-4444-4444-4444-000000000108', 'eeeeeeee-3333-3333-3333-000000000001', 'Your Friends & Neighbors', 7);

-- Outstanding Comedy Series
insert into prediction_options (id, prediction_id, label, sort_order)
values
  ('eeeeeeee-4444-4444-4444-000000000201', 'eeeeeeee-3333-3333-3333-000000000002', 'Abbott Elementary', 0),
  ('eeeeeeee-4444-4444-4444-000000000202', 'eeeeeeee-3333-3333-3333-000000000002', 'The Bear', 1),
  ('eeeeeeee-4444-4444-4444-000000000203', 'eeeeeeee-3333-3333-3333-000000000002', 'Hacks', 2),
  ('eeeeeeee-4444-4444-4444-000000000204', 'eeeeeeee-3333-3333-3333-000000000002', 'Margo''s Got Money Troubles', 3),
  ('eeeeeeee-4444-4444-4444-000000000205', 'eeeeeeee-3333-3333-3333-000000000002', 'Nobody Wants This', 4),
  ('eeeeeeee-4444-4444-4444-000000000206', 'eeeeeeee-3333-3333-3333-000000000002', 'Only Murders in the Building', 5),
  ('eeeeeeee-4444-4444-4444-000000000207', 'eeeeeeee-3333-3333-3333-000000000002', 'Shrinking', 6),
  ('eeeeeeee-4444-4444-4444-000000000208', 'eeeeeeee-3333-3333-3333-000000000002', 'Widow''s Bay', 7);

-- Outstanding Lead Actor in a Drama Series
insert into prediction_options (id, prediction_id, label, sort_order)
values
  ('eeeeeeee-4444-4444-4444-000000000301', 'eeeeeeee-3333-3333-3333-000000000003', 'Sterling K. Brown (Paradise)', 0),
  ('eeeeeeee-4444-4444-4444-000000000302', 'eeeeeeee-3333-3333-3333-000000000003', 'Gary Oldman (Slow Horses)', 1),
  ('eeeeeeee-4444-4444-4444-000000000303', 'eeeeeeee-3333-3333-3333-000000000003', 'Mark Ruffalo (Task)', 2),
  ('eeeeeeee-4444-4444-4444-000000000304', 'eeeeeeee-3333-3333-3333-000000000003', 'Rufus Sewell (The Diplomat)', 3),
  ('eeeeeeee-4444-4444-4444-000000000305', 'eeeeeeee-3333-3333-3333-000000000003', 'Noah Wyle (The Pitt)', 4);

-- Outstanding Lead Actress in a Drama Series
insert into prediction_options (id, prediction_id, label, sort_order)
values
  ('eeeeeeee-4444-4444-4444-000000000401', 'eeeeeeee-3333-3333-3333-000000000004', 'Carrie Coon (The Gilded Age)', 0),
  ('eeeeeeee-4444-4444-4444-000000000402', 'eeeeeeee-3333-3333-3333-000000000004', 'Chase Infiniti (The Testaments)', 1),
  ('eeeeeeee-4444-4444-4444-000000000403', 'eeeeeeee-3333-3333-3333-000000000004', 'Keri Russell (The Diplomat)', 2),
  ('eeeeeeee-4444-4444-4444-000000000404', 'eeeeeeee-3333-3333-3333-000000000004', 'Rhea Seehorn (Pluribus)', 3),
  ('eeeeeeee-4444-4444-4444-000000000405', 'eeeeeeee-3333-3333-3333-000000000004', 'Zendaya (Euphoria)', 4);
