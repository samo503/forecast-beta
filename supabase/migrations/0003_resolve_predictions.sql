-- Resolves a prediction: locks in the correct option and scores every
-- user's pick against it. This is the mechanism that turns "open, people
-- voted" into "resolved, here's who was right" — see the 0001 comment on
-- user_predictions for why picks stay hidden until this happens.
--
-- Called manually, once, via the SQL editor (or any service-role
-- connection) as a deliberate admin action — not exposed to the app's
-- anon/authenticated PostgREST roles, same as creating a prediction isn't.
-- There is no admin UI for this yet; that's out of scope for this step.
--
-- Known gap: this accepts 'open' as well as 'locked' because there's no
-- automatic open→locked transition at locks_at yet — requiring 'locked'
-- would make this uncallable on any real data right now. Worth a small
-- follow-up step (e.g. a scheduled job flipping status at locks_at), not
-- bundled into this one.
create function public.resolve_prediction(
  p_prediction_id uuid,
  p_correct_option_id uuid
)
returns void as $$
declare
  v_status text;
begin
  select status into v_status
  from predictions
  where id = p_prediction_id;

  if v_status is null then
    raise exception 'prediction % not found', p_prediction_id;
  end if;

  if v_status = 'resolved' then
    raise exception 'prediction % is already resolved', p_prediction_id;
  end if;

  if not exists (
    select 1 from prediction_options
    where id = p_correct_option_id
    and prediction_id = p_prediction_id
  ) then
    raise exception 'option % does not belong to prediction %',
      p_correct_option_id, p_prediction_id;
  end if;

  update predictions
  set status = 'resolved',
      correct_option_id = p_correct_option_id
  where id = p_prediction_id;

  -- Flat scoring for this MVP pass: 10 points for a correct pick, 0
  -- otherwise. No multipliers, streak bonuses, or difficulty weighting.
  update user_predictions
  set is_correct = (option_id = p_correct_option_id),
      points_awarded = case when option_id = p_correct_option_id then 10 else 0 end
  where prediction_id = p_prediction_id;
end;
$$ language plpgsql security definer;

-- Admin-only: revoke the default PostgREST-exposed execute grant so this
-- can't be called over the app's anon/authenticated RPC surface. It's only
-- meant to be run directly with elevated (service-role/SQL editor) access.
revoke execute on function public.resolve_prediction(uuid, uuid) from public, anon, authenticated;
