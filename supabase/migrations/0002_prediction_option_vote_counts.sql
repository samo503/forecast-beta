-- Adds a denormalized, publicly-readable vote count per prediction_option so
-- the crowd-split UI can show live percentages while a prediction is still
-- 'open' — without exposing who picked what or any individual row from
-- user_predictions, which stays locked down by its existing RLS policies.

alter table prediction_options add column vote_count int not null default 0;

-- SECURITY DEFINER so it can update prediction_options (admin-only writes)
-- from a trigger that fires on a user's own insert into user_predictions.
-- It only ever increments a counter — it never reads or exposes the
-- inserted row's contents beyond the option_id it already targets.
create function public.increment_prediction_option_vote_count()
returns trigger as $$
begin
  update prediction_options
  set vote_count = vote_count + 1
  where id = new.option_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_user_prediction_insert_increment_vote_count
  after insert on user_predictions
  for each row execute procedure public.increment_prediction_option_vote_count();
