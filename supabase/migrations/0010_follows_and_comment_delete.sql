-- ─────────────────────────────────────────────────────────────────────────
-- channel_follows
-- A user following a channel. Public read (low sensitivity, same pattern
-- as comments/reactions), users manage only their own rows.
-- ─────────────────────────────────────────────────────────────────────────
create table channel_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  channel_id uuid not null references channels(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, channel_id)
);

create index channel_follows_user_id_idx on channel_follows(user_id);
create index channel_follows_channel_id_idx on channel_follows(channel_id);

alter table channel_follows enable row level security;

create policy "channel follows are publicly readable"
  on channel_follows for select
  using (true);

create policy "users can follow channels as themselves"
  on channel_follows for insert
  with check (auth.uid() = user_id);

create policy "users can unfollow channels they follow"
  on channel_follows for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- user_follows
-- A user following another user. Public read, users manage only their own
-- rows (as the follower). A user can't follow themselves.
-- ─────────────────────────────────────────────────────────────────────────
create table user_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references profiles(id) on delete cascade,
  followee_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, followee_id),
  check (follower_id != followee_id)
);

create index user_follows_follower_id_idx on user_follows(follower_id);
create index user_follows_followee_id_idx on user_follows(followee_id);

alter table user_follows enable row level security;

create policy "user follows are publicly readable"
  on user_follows for select
  using (true);

create policy "users can follow other users as themselves"
  on user_follows for insert
  with check (auth.uid() = follower_id);

create policy "users can unfollow users they follow"
  on user_follows for delete
  using (auth.uid() = follower_id);

-- ─────────────────────────────────────────────────────────────────────────
-- comments: add delete policy
-- Select/insert policies (0001) are untouched. Users may now delete only
-- their own comments; no update policy — comments stay edit-never, same
-- as before, just now removable by their author.
-- ─────────────────────────────────────────────────────────────────────────
create policy "users can delete their own comments"
  on comments for delete
  using (auth.uid() = user_id);
