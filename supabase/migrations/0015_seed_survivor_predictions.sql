-- Seeds the four approved Survivor 51 premiere predictions.
-- Written directly against the committed schema (supabase/migrations/
-- 0001_init_schema.sql) rather than via scripts/seed-prediction.ts:
-- that script always creates a new episode row as part of its output
-- and has no mode to attach predictions to an existing one — Survivor
-- Episode 1 already exists (0013_seed_survivor.sql). Using it as-is
-- would have created a duplicate "Episode 1" row.
--
-- All four attach to the real Survivor Episode 1, looked up by channel
-- slug + episode_number (not hardcoded IDs) so this doesn't silently
-- target the wrong row. Yes/No, status 'open', locks_at
-- 2026-09-24T03:00:00Z — the premiere's own air_date; picks lock at
-- air time, same as every other real prediction in this app.
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
  where c.slug = 'survivor' and e.episode_number = 1;

  if v_episode_id is null then
    raise exception 'Survivor Episode 1 not found — expected it seeded by 0013_seed_survivor.sql';
  end if;

  insert into predictions (id, episode_id, channel_id, question, status, locks_at)
  values
    ('cccccccc-3333-3333-3333-000000000001', v_episode_id, v_channel_id, 'Does anyone find a hidden immunity idol in the premiere?', 'open', '2026-09-24T03:00:00Z'),
    ('cccccccc-3333-3333-3333-000000000002', v_episode_id, v_channel_id, 'Is more than one person voted out during the premiere?', 'open', '2026-09-24T03:00:00Z'),
    ('cccccccc-3333-3333-3333-000000000003', v_episode_id, v_channel_id, 'Is the first person voted out eliminated by a unanimous vote?', 'open', '2026-09-24T03:00:00Z'),
    ('cccccccc-3333-3333-3333-000000000004', v_episode_id, v_channel_id, 'Does a twist or advantage from a previous season appear in the premiere?', 'open', '2026-09-24T03:00:00Z');

  insert into prediction_options (id, prediction_id, label, sort_order)
  values
    ('cccccccc-4444-4444-4444-000000000101', 'cccccccc-3333-3333-3333-000000000001', 'Yes', 0),
    ('cccccccc-4444-4444-4444-000000000102', 'cccccccc-3333-3333-3333-000000000001', 'No',  1),

    ('cccccccc-4444-4444-4444-000000000201', 'cccccccc-3333-3333-3333-000000000002', 'Yes', 0),
    ('cccccccc-4444-4444-4444-000000000202', 'cccccccc-3333-3333-3333-000000000002', 'No',  1),

    ('cccccccc-4444-4444-4444-000000000301', 'cccccccc-3333-3333-3333-000000000003', 'Yes', 0),
    ('cccccccc-4444-4444-4444-000000000302', 'cccccccc-3333-3333-3333-000000000003', 'No',  1),

    ('cccccccc-4444-4444-4444-000000000401', 'cccccccc-3333-3333-3333-000000000004', 'Yes', 0),
    ('cccccccc-4444-4444-4444-000000000402', 'cccccccc-3333-3333-3333-000000000004', 'No',  1);
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
  'cccccccc-3333-3333-3333-000000000001',
  'cccccccc-3333-3333-3333-000000000002',
  'cccccccc-3333-3333-3333-000000000003',
  'cccccccc-3333-3333-3333-000000000004'
)
group by p.id, e.title, p.question, p.status, p.locks_at
order by p.question;
