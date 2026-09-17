-- Closes the late-pick gap: the insert policy from 0001_init_schema.sql
-- only ever checked predictions.status = 'open', never locks_at itself.
-- Nothing re-checks locks_at at write time — lock_expired_prediction()
-- only runs as a side effect of some page's server render (predict/page.tsx),
-- not on every insert — so a client that loaded the page before locks_at
-- passed and never reloaded could still successfully lock in a pick after
-- the deadline, as long as no other page load happened to flip
-- predictions.status to 'locked' in the meantime. Report confirmed zero
-- predictions currently have status = 'open' with a null locks_at, so this
-- doesn't retroactively block anything live.
--
-- A null locks_at now blocks picks outright (`p.locks_at > now()` is false
-- when locks_at is null) — that column has no "open forever" meaning
-- anywhere else in the app, so a prediction without one shouldn't be
-- pickable either.
drop policy "users can lock in their own pick while prediction is open" on user_predictions;

create policy "users can lock in their own pick while prediction is open"
  on user_predictions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from predictions p
      where p.id = prediction_id
      and p.status = 'open'
      and p.locks_at > now()
    )
  );
