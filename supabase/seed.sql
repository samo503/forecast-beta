-- Minimal seed data — just enough to exercise the full prediction loop
-- end to end. Deliberately only one real channel, matching the "honest
-- scope" principle: don't invent data for channels that aren't live yet.

insert into channels (id, slug, name, channel_number, status, genre, description, accent_color)
values (
  '11111111-1111-1111-1111-111111111111',
  'love-island-usa',
  'Love Island USA',
  1,
  'live',
  'Dating',
  'Islanders navigate recouplings, tea parties, and dumping ceremonies all summer.',
  '#fb7185'
);

insert into episodes (id, channel_id, title, episode_number, air_date, status)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Recoupling Night',
  34,
  now(),
  'live'
);

insert into predictions (id, episode_id, channel_id, question, status, locks_at)
values (
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Will Serena survive tonight''s recoupling?',
  'open',
  now() + interval '2 hours'
);

insert into prediction_options (id, prediction_id, label, sort_order)
values
  ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333333', 'Yes', 0),
  ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333333', 'No', 1);
