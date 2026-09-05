-- Tightens resolve_prediction() to only accept predictions in 'locked'
-- status, closing the gap noted in 0003. That gap existed because there
-- was no automatic open->locked transition at the time; lock_expired_
-- prediction() (0004) has since covered that for a while, so requiring
-- 'locked' here no longer makes the function uncallable on real data.
create or replace function public.resolve_prediction(
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

  if v_status != 'locked' then
    raise exception 'prediction % is not locked (status: %)',
      p_prediction_id, v_status;
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

revoke execute on function public.resolve_prediction(uuid, uuid) from public, anon, authenticated;
