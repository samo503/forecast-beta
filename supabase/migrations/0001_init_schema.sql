-- Forecast — initial schema
-- Channel-first design: every content table carries a channel/episode reference
-- from day one, so adding a second channel later is an INSERT, not a migration.
-- RLS strategy throughout: default deny, explicit allow. Nothing is readable or
-- writable unless a policy below says so.

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ─────────────────────────────────────────────────────────────────────────
-- profiles
-- One row per auth user. Public read (it's a social/reputation product —
-- profiles are meant to be seen), write restricted to the owner.
-- ─────────────────────────────────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  identity_line text,        -- e.g. "Reality strategist · Prestige drama loyalist"
  streak_count int not null default 0,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles are publicly readable"
  on profiles for select
  using (true);

create policy "users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up, so the app never has
-- to handle "authenticated but no profile yet" as a state.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────
-- channels
-- Public read. No client-side writes — channels are created by you (admin),
-- via the Supabase dashboard or a service-role script, not by end users.
-- ─────────────────────────────────────────────────────────────────────────
create table channels (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  channel_number int unique not null,
  status text not null default 'pilot'
    check (status in ('live', 'upcoming', 'off_air', 'off_season', 'pilot')),
  genre text,
  description text,
  accent_color text,
  created_at timestamptz not null default now()
);

alter table channels enable row level security;

create policy "channels are publicly readable"
  on channels for select
  using (true);

-- ─────────────────────────────────────────────────────────────────────────
-- episodes
-- Public read. No client-side writes (admin/service-role only).
-- ─────────────────────────────────────────────────────────────────────────
create table episodes (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references channels(id) on delete cascade,
  title text not null,
  episode_number int,
  air_date timestamptz,
  status text not null default 'upcoming'
    check (status in ('upcoming', 'live', 'ended')),
  created_at timestamptz not null default now()
);

create index episodes_channel_id_idx on episodes(channel_id);

alter table episodes enable row level security;

create policy "episodes are publicly readable"
  on episodes for select
  using (true);

-- ─────────────────────────────────────────────────────────────────────────
-- predictions + prediction_options
-- Public read. No client-side writes (admin/service-role only) — you create
-- and resolve predictions, users only ever write to user_predictions below.
-- ─────────────────────────────────────────────────────────────────────────
create table predictions (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episodes(id) on delete cascade,
  channel_id uuid not null references channels(id) on delete cascade, -- denormalized for simpler RLS/queries
  question text not null,
  status text not null default 'open'
    check (status in ('open', 'locked', 'resolved')),
  locks_at timestamptz,
  correct_option_id uuid, -- FK added below, after prediction_options exists
  created_at timestamptz not null default now()
);

create index predictions_episode_id_idx on predictions(episode_id);
create index predictions_channel_id_idx on predictions(channel_id);

create table prediction_options (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null references predictions(id) on delete cascade,
  label text not null,
  sort_order int not null default 0
);

create index prediction_options_prediction_id_idx on prediction_options(prediction_id);

alter table predictions
  add constraint predictions_correct_option_fk
  foreign key (correct_option_id) references prediction_options(id);

alter table predictions enable row level security;
alter table prediction_options enable row level security;

create policy "predictions are publicly readable"
  on predictions for select
  using (true);

create policy "prediction options are publicly readable"
  on prediction_options for select
  using (true);

-- ─────────────────────────────────────────────────────────────────────────
-- user_predictions
-- The one table where the "commitment device" mechanic actually lives.
-- A user's pick is visible to themselves immediately, but invisible to
-- everyone else until the parent prediction is no longer 'open' — that's
-- what makes the "called it" receipt mean something (no copying picks).
-- Users can insert their own pick only while the prediction is still open,
-- and can never edit or delete it afterward — locking in is meant to be final.
-- ─────────────────────────────────────────────────────────────────────────
create table user_predictions (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null references predictions(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  option_id uuid not null references prediction_options(id) on delete cascade,
  is_correct boolean,       -- set on resolution
  points_awarded int not null default 0,
  created_at timestamptz not null default now(),
  unique (prediction_id, user_id) -- one pick per user per prediction, ever
);

create index user_predictions_prediction_id_idx on user_predictions(prediction_id);
create index user_predictions_user_id_idx on user_predictions(user_id);

alter table user_predictions enable row level security;

create policy "users can see their own picks anytime"
  on user_predictions for select
  using (auth.uid() = user_id);

create policy "picks become visible to everyone once no longer open"
  on user_predictions for select
  using (
    exists (
      select 1 from predictions p
      where p.id = user_predictions.prediction_id
      and p.status != 'open'
    )
  );

create policy "users can lock in their own pick while prediction is open"
  on user_predictions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from predictions p
      where p.id = prediction_id
      and p.status = 'open'
    )
  );

-- Deliberately no update/delete policy for user_predictions: locking in a
-- pick is final by design. Score corrections happen via service-role only.

-- ─────────────────────────────────────────────────────────────────────────
-- comments
-- Episode-scoped. Public read, authenticated users can post as themselves.
-- ─────────────────────────────────────────────────────────────────────────
create table comments (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episodes(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index comments_episode_id_idx on comments(episode_id);

alter table comments enable row level security;

create policy "comments are publicly readable"
  on comments for select
  using (true);

create policy "authenticated users can post comments as themselves"
  on comments for insert
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- reactions
-- Generic target (episode or comment) so one table covers both without
-- duplicating structure. Public read, authenticated users react as themselves.
-- ─────────────────────────────────────────────────────────────────────────
create table reactions (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('episode', 'comment')),
  target_id uuid not null,
  user_id uuid not null references profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (target_type, target_id, user_id, emoji) -- no duplicate-spamming the same reaction
);

create index reactions_target_idx on reactions(target_type, target_id);

alter table reactions enable row level security;

create policy "reactions are publicly readable"
  on reactions for select
  using (true);

create policy "authenticated users can react as themselves"
  on reactions for insert
  with check (auth.uid() = user_id);
