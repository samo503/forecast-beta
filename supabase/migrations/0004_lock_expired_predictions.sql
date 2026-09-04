-- Lazily transitions a prediction from 'open' to 'locked' once its
-- locks_at deadline has passed. There's no scheduled job (no pg_cron, no
-- new infrastructure) flipping this automatically — instead, the app
-- calls this for each open prediction it fetches, right before
-- rendering, so any page load naturally self-heals a stale 'open' status.
--
-- A prediction with zero votes on it locks exactly the same way as one
-- with votes — no special-casing here; a prediction nobody participated
-- in is still real data, not an error state.
--
-- This only ever moves open+expired -> locked and is a no-op otherwise,
-- so it's safe to expose broadly rather than lock down like
-- resolve_prediction (which actually scores picks and awards points).
create function public.lock_expired_prediction(p_prediction_id uuid)
returns void as $$
begin
  update predictions
  set status = 'locked'
  where id = p_prediction_id
    and status = 'open'
    and locks_at is not null
    and locks_at < now();
end;
$$ language plpgsql security definer;

grant execute on function public.lock_expired_prediction(uuid) to anon, authenticated;
