# Product & architecture decisions

Why things work the way they do, not just what the code does. Written for
a future session (Claude Code or otherwise) with no memory of the
conversations these came out of. Dated so "why" stays legible as the app
changes around it.

## Prediction resolution & scoring

**Flat scoring: 10 points for a correct pick, 0 for wrong. No multipliers,
no difficulty weighting, no bonus for going against the crowd.**
Deliberate MVP simplification — `resolve_prediction()` in
`supabase/migrations/0003_resolve_predictions.sql`. Revisit if/when the
product wants to reward contrarian-but-correct picks or harder questions
more.

**`resolve_prediction()` accepts predictions in `open` *or* `locked`
status**, not just `locked`. There was no automatic open→locked transition
at the time it was written, so requiring `locked` would have made it
uncallable on any real data. Migration 0004 later added the lazy
open→locked transition (below), but the resolve function's acceptance of
`open` was never tightened back down — still a known gap, not a bug.

**Resolution is a manual, one-time admin action via SQL editor / service
role**, not a trigger and not exposed via the app's RPC surface
(`resolve_prediction` and `lock_expired_prediction` are explicitly
`revoke`d from `anon`/`authenticated` — see 0003, 0004). There is no admin
UI. Whoever runs the SQL is trusted to get the correct option right; the
function only guards against double-resolving and a mismatched
prediction/option pair.

## Prediction lifecycle: lazy open→locked transition, not a scheduled job

**No pg_cron, no scheduled job flips `predictions.status` from `open` to
`locked` at `locks_at`.** Instead, `lock_expired_prediction()`
(migration 0004) is a cheap, idempotent, publicly-callable function that
predict/page.tsx calls for any fetched prediction that's `open` and past
its `locks_at`, right before rendering — so a normal page load self-heals
a stale `open` status. Deliberately avoids new infrastructure for
something a page load can already fix.

**A prediction with zero votes locks exactly the same way as one with
votes.** No vote-count special-casing anywhere in the lock logic — a
prediction nobody participated in is still real data, not an error state.

## The "commitment device" mechanic (pre-existing, foundational)

Not a decision made this session, but worth restating since everything
above depends on it: `user_predictions` RLS (0001) makes a user's own pick
visible to themselves immediately, but invisible to *everyone else* —
including via a raw anon-key count — until the parent prediction's status
leaves `open`. This is why crowd-split percentages can't be computed from
`user_predictions` directly while a prediction is open.

**`prediction_options.vote_count`** (migration 0002) exists specifically
to route around that: a denormalized, publicly-readable counter,
incremented by a `SECURITY DEFINER` trigger on `user_predictions` insert.
It only ever exposes an aggregate count, never who voted or what any
individual row contains — the security property (no one can see or infer
WHO picked what) stays intact, but the live crowd-split UI still works
while a prediction is open.

## Streak: participation-based, local-day, snapshot timezone

**Participation-based, not correctness-based.** The streak counts any day
with at least one locked-in pick, regardless of whether it was right.
Rewards showing up, not accuracy. (The alternative — correctness-based,
where a wrong pick breaks the streak — was the author's own initial
recommendation, not what shipped; noting the disagreement so it doesn't
read as unanimous.)

**Live-computed, not stored.** `lib/streak.ts`'s `computeStreak()` derives
the streak from `user_predictions.created_at` on every read. There is no
`profiles.streak_count` write path — that column exists in the schema
(0001) but is permanently dormant/unused; nothing writes to it. A stored
counter would need trigger logic for "did a day pass with no qualifying
activity," which isn't naturally triggered by any single event without a
scheduled job — rejected for the same reason the lock transition avoids
one.

**Day boundary = the user's own local calendar day, not UTC**, via
`profiles.timezone`. This app is tied to real-time evening TV; a UTC-day
boundary would silently drift from when people actually use it (an evening
pick can land on either side of the UTC boundary depending on how far the
user is from UTC), producing "why did my streak break, I picked last
night" complaints.

**Timezone is captured once, at first sign-in, and never updated again.**
`src/app/auth/AuthForm.tsx` sends `Intl.DateTimeFormat().resolvedOptions().timeZone`
as `options.data.timezone` on every `signInWithOtp` call; `handle_new_user()`
(rewritten in migration 0005) reads it from `raw_user_meta_data` — but that
trigger only ever fires once per user, on `auth.users` insert, so sending it
on every request is harmless for returning users. Live re-detection was
explicitly rejected: real added complexity, and it opens an edge case where
someone manufactures an extra streak day by traveling right at a day
boundary — not worth solving for an MVP with one seeded channel.

## Auth scope: no global login wall

Most of the app is intentionally public — `channels`, `episodes`,
`predictions`, `prediction_options` are all `using (true)` in RLS by
design. Only two things actually require a session: locking in a pick
(`user_predictions` insert policy checks `auth.uid()`) and viewing
`/profile` (inherently meaningless without knowing who "you" are, so that
page redirects to `/auth?next=/profile` itself — not a global gate).
`src/proxy.ts` exists purely to refresh/persist the Supabase session on
every request (Server Components can't write cookies, so a needed token
refresh there silently drops the rotated cookie and kills the session —
this is why proxy.ts exists at all, not for route gating).

## Poster images: local map + graceful fallback, never self-hosted

Several real poster sources (`deadline.com`, `variety.com`, `tvline.com`)
block hotlinking and return `402` when requested from this origin.
**Never download or self-host those photos** — they're real editorial
photos of real people; copying them is a copyright problem, not just a
technical one. Instead:
- Channel/episode art lives in small local `Record<string, string>` maps
  keyed by channel slug (e.g. `channelPosters` in `src/app/page.tsx`),
  not a database column — there's no `poster_url` in the schema yet.
- `src/app/components/PosterBackground.tsx` probes the image off-DOM
  (a detached `Image()` in a `useEffect`, not the rendered `<img>`'s
  `onError`, which can be missed by React for an already-cache-failed
  URL) and falls back to the existing gradient + title-card treatment
  used elsewhere in the app (see the homepage's "Explore more" channel
  card) instead of showing a broken image.

## Still intentionally mock — no schema for these yet

Rooms, friends/social graph, trophies/achievements, and follows have
**no backing tables at all** in the current schema. These stay on
`lib/mock-data.ts` deliberately, not because wiring was skipped:
- `live/page.tsx`: "Live Rooms," "Friends Are Talking," and "Active
  Discussions" (the last is structurally just predictions again, not a
  distinct real feature). Only "Room Highlights" is real (`comments` +
  `reactions`, episode-scoped).
- `profile/ProfileClient.tsx`: Trophy Shelf, "Following" shows, and
  "Friends" are all mock. "Activity" is a mixed feed (predictions +
  comments + trophy events) with a real gap — trophy events have no
  source — so it stayed mock too rather than being half-real.
- `predict/PredictClient.tsx`: "Upcoming" and "Past Picks" preview
  sections are mock (`upcomingItems`, `pastItems` from `mock-data.ts`) —
  distinct from profile's real "Prediction Record," which shows the same
  *kind* of information but sourced from real resolved `user_predictions`.

Adding real data for any of these needs new tables/schema — a product
conversation, not a data-wiring task. See git history around the
"Wire app to real Supabase data" commits for the fuller reasoning each
time this boundary was hit.

## Color system

Consistently applied via small `Record<string, ...>` theme maps in
`src/app/page.tsx` (`briefTheme`) and `src/app/live/page.tsx`
(`discussionTheme`), and implicitly in the profile trophy shelf:
- **Pink** (`#fb7185`) — the prediction mechanic itself (live polls,
  open predictions, debates).
- **Cyan** (`#22d3ee`) — editorial/news content (returning, renewed, TV
  news, trending).
- **Amber/gold** (`#fbbf24` and friends) — covers two related but
  distinct things: buzz/social attention-getting content (recommended,
  casting news) *and* achievement (the trophy shelf's single-hue rarity
  system, where brightness signals rarity rather than each trophy getting
  an arbitrary color).

No `PROJECT_CONTEXT.md` exists in this repo despite being referenced in
early task instructions — this document's color-system section is
reconstructed from the actual inline comments in the code, not from a
file that was never actually present.
