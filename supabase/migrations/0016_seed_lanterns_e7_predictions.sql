-- Seeds the four approved Lanterns Episode 7 predictions.
-- Same shape as 0015_seed_survivor_predictions.sql: written directly
-- against the committed schema, not via scripts/seed-prediction.ts,
-- since Episode 7 already exists (seeded outside migration discipline —
-- see docs/status.md's "repo cannot reproduce current production data"
-- known gap) and that script has no mode to attach predictions to an
-- existing episode.
--
-- All four attach to the real Lanterns Episode 7, looked up by channel
-- slug + episode_number (not hardcoded IDs) so this doesn't silently
-- target the wrong row. Yes/No, status 'open', locks_at
-- 2026-09-28T01:00:00Z — Sunday Sept 27, 2026, 6:00 PM PT, Episode 7's
-- own air_date (confirmed matching the live database before writing
-- this file — not assumed); picks lock at air time, same as every
-- other real prediction in this app.
--
-- Resolution criteria for each question is NOT stored anywhere below —
-- predictions/prediction_options have no column for it, and none was
-- added here. See docs/prediction-criteria.md for the full criteria
-- text, kept outside the database until a real column exists for it.

do $$
declare
  v_channel_id uuid;
  v_episode_id uuid;
begin
  select c.id, e.id into v_channel_id, v_episode_id
  from channels c
  join episodes e on e.channel_id = c.id
  where c.slug = 'lanterns' and e.episode_number = 7;

  if v_episode_id is null then
    raise exception 'Lanterns Episode 7 not found — expected it already seeded in production';
  end if;

  insert into predictions (id, episode_id, channel_id, question, status, locks_at)
  values
    ('dddddddd-3333-3333-3333-000000000001', v_episode_id, v_channel_id, 'Does John Stewart fly using a Green Lantern ring in Episode 7?', 'open', '2026-09-28T01:00:00Z'),
    ('dddddddd-3333-3333-3333-000000000002', v_episode_id, v_channel_id, 'Do the Guardians find out that John has Hal''s ring?', 'open', '2026-09-28T01:00:00Z'),
    ('dddddddd-3333-3333-3333-000000000003', v_episode_id, v_channel_id, 'Do Guy Gardner and John Stewart fight each other in Episode 7?', 'open', '2026-09-28T01:00:00Z'),
    ('dddddddd-3333-3333-3333-000000000004', v_episode_id, v_channel_id, 'Is it revealed who broke Sinestro out of Spazkaban (Space Azkaban)?', 'open', '2026-09-28T01:00:00Z');

  insert into prediction_options (id, prediction_id, label, sort_order)
  values
    ('dddddddd-4444-4444-4444-000000000101', 'dddddddd-3333-3333-3333-000000000001', 'Yes', 0),
    ('dddddddd-4444-4444-4444-000000000102', 'dddddddd-3333-3333-3333-000000000001', 'No',  1),

    ('dddddddd-4444-4444-4444-000000000201', 'dddddddd-3333-3333-3333-000000000002', 'Yes', 0),
    ('dddddddd-4444-4444-4444-000000000202', 'dddddddd-3333-3333-3333-000000000002', 'No',  1),

    ('dddddddd-4444-4444-4444-000000000301', 'dddddddd-3333-3333-3333-000000000003', 'Yes', 0),
    ('dddddddd-4444-4444-4444-000000000302', 'dddddddd-3333-3333-3333-000000000003', 'No',  1),

    ('dddddddd-4444-4444-4444-000000000401', 'dddddddd-3333-3333-3333-000000000004', 'Yes', 0),
    ('dddddddd-4444-4444-4444-000000000402', 'dddddddd-3333-3333-3333-000000000004', 'No',  1);
end $$;

-- Verify what was just created.
select
  p.id as prediction_id,
  e.title as episode,
  p.question,
  array_agg(po.label order by po.sort_order) as options,
  p.status,
  p.locks_at
from predictions p
join episodes e on e.id = p.episode_id
join prediction_options po on po.prediction_id = p.id
where p.id in (
  'dddddddd-3333-3333-3333-000000000001',
  'dddddddd-3333-3333-3333-000000000002',
  'dddddddd-3333-3333-3333-000000000003',
  'dddddddd-3333-3333-3333-000000000004'
)
group by p.id, e.title, p.question, p.status, p.locks_at
order by p.question;
