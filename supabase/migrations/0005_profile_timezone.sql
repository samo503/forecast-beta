-- Adds a per-user timezone, captured once at signup from the browser's
-- Intl API and never updated afterward — used to compute the day-streak's
-- calendar-day boundary in the user's own local time instead of UTC.
--
-- Deliberately snapshot-only, not live-detected on every visit: this app
-- has one seeded channel and is an MVP, and live re-detection would open
-- an edge case where someone manufactures an extra streak day by
-- traveling right at a day boundary. Not worth solving right now.
alter table profiles add column timezone text not null default 'UTC';

-- handle_new_user() reads timezone from raw_user_meta_data, which the
-- client sets as `options.data.timezone` on the signInWithOtp call (see
-- src/app/auth/AuthForm.tsx). Falls back to 'UTC' if it's ever missing —
-- this trigger only ever fires once per user, on their first sign-in, so
-- there's no path for this to change after the row is created.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, timezone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'timezone', 'UTC')
  );
  return new;
end;
$$ language plpgsql security definer;
