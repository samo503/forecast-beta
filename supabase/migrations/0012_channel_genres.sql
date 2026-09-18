-- Multi-genre support: channels.genre (a single free-text column) becomes
-- channels.genres (text[]), so a channel can genuinely belong to more than
-- one of the app's eight controlled genres — the thing the old column
-- structurally couldn't represent (there's nowhere to put a second value
-- on a single text column).
--
-- The controlled vocabulary is eight words: Drama, Comedy, Reality,
-- Competition, Sci-Fi, Sports, Awards, Documentary. "Dating" — the
-- pre-existing free-text value on Love Island USA — was never part of
-- this vocabulary and has no mapping target; that channel becomes
-- Reality, not Reality+Dating. See docs/decisions.md's Guide genre
-- section for the full reasoning behind the taxonomy and this drop.
--
-- Real mapping, approved and applied here:
--   Lanterns              -> Drama, Sci-Fi   (was the single free-text
--                            value "Sci-Fi Drama" — split into its two
--                            real constituent genres, not inferred)
--   Love Island USA        -> Reality          (was "Dating")
--   Primetime Emmy Awards  -> Awards           (unchanged in substance)
--
-- Survivor is not seeded yet — that's the next migration
-- (0013_seed_survivor.sql) — and will be inserted directly with its
-- genres set on this new column, not backfilled after the fact.

alter table channels add column genres text[] not null default '{}';

alter table channels add constraint channels_genres_valid
  check (
    genres <@ array[
      'Drama', 'Comedy', 'Reality', 'Competition',
      'Sci-Fi', 'Sports', 'Awards', 'Documentary'
    ]
  );

update channels set genres = array['Drama', 'Sci-Fi'] where slug = 'lanterns';
update channels set genres = array['Reality'] where slug = 'love-island-usa';
update channels set genres = array['Awards'] where slug = 'emmys';

-- Confirmed via grep across src/ and lib/ before writing this: nothing in
-- the running app reads channels.genre. Safe to drop in the same
-- migration rather than carrying a deprecated column forward.
alter table channels drop column genre;
