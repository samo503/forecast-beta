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

## Email delivery: Resend domain verified, Custom SMTP wired into Supabase

**Resend's sending domain (`forecasttv.app`) is verified**, via Cloudflare
DNS records — DKIM TXT, MX, SPF TXT, and DMARC TXT. Custom SMTP is
configured in Supabase Auth (Host `smtp.resend.com`, Port `465`, sender
`noreply@forecasttv.app`), replacing the shared sandbox sender
(`onboarding@resend.dev`) that could only reach the Resend account
owner's own address.

Tested via Supabase's own Auth > Users > Invite user flow initially, not
the app's `signInWithOtp` magic-link form — there was no deployment yet
at the time to actually click through that path, so the invite-user flow
was the closest available proxy for "does a real address outside the
sandbox receive mail." It sent and delivered successfully to a
non-sandbox address.

**Update — the app is now deployed**, to `https://forecasttv.app`
(Vercel, auto-deploying from this repo's `main` branch; DNS via a
Cloudflare CNAME). Supabase Auth's **Site URL is now
`https://forecasttv.app`**, replacing `http://localhost:3000` — the
Redirect URLs allow list also still includes the original Vercel preview
domain, `forecast-iota-pearl.vercel.app`, as a fallback. With a real
deployment in place, the app's own `signInWithOtp` magic-link flow has
since been exercised directly rather than only via the invite-user
proxy — see the cross-browser PKCE issue that surfaced below.

## Auth bug: cross-browser magic-link failure was silent (now surfaced, not eliminated)

**Found and partially fixed today**: opening a magic-link email in a
different browser (or browser profile/incognito window) than the one
that requested it makes `exchangeCodeForSession()` in
`src/app/auth/callback/route.ts` fail. Supabase's magic-link flow uses
PKCE, where the code verifier is generated and stored in the requesting
browser; a different browser context has no matching verifier, so the
exchange fails and the route redirects to `/auth?error=auth_failed`.

Before today, `AuthForm.tsx` never read that `error` param — a failed
exchange landed the user on a completely empty sign-in form with no
indication anything had gone wrong, indistinguishable from having never
clicked anything. `AuthForm.tsx` now reads `error` from the URL
(`missing_code` or `auth_failed`) and surfaces a real message reusing
the existing `text-rose-400` error styling already used for
`signInWithOtp` errors: "That link didn't work — it may have been opened
in a different browser than the one you requested it from, or it's
expired. Request a new one below."

**This makes the failure visible and actionable — it does not eliminate
the underlying cross-browser mismatch.** The PKCE
code-verifier-must-match-the-requesting-browser behavior is structural
to this auth pattern, not a bug in this app's code. A user who opens
their magic link in a different browser than they requested it from will
still hit this failure every time; they just see why now instead of a
blank form.

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

Rooms, friends/social graph, and trophies/achievements have **no
backing tables at all** in the current schema. Follows is a partial
exception: `channel_follows`/`user_follows` exist as of migration
0010, but no UI or application code reads or writes them yet — the
follow features below remain mocked at the product level. These stay
on `lib/mock-data.ts` deliberately, not because wiring was skipped:
- `live/page.tsx`: no longer belongs on this list. "Live Rooms," "Friends
  Are Talking," "Active Discussions," and the old "Room Highlights"
  comments feed described here previously are all gone — replaced by the
  "episode room lobby" rewrite. The current Live Now / Upcoming Rooms
  lobby is sourced entirely from real `episodes` and `channels` data,
  filtered on real `status` values, with no mock content anywhere on the
  page. `LiveCommentsFeed.tsx` and `actions/comments.ts` (the old real
  comments feed) still exist in the repo but are unwired and dormant —
  see docs/status.md, not a mock/real distinction anymore but a
  built/disconnected one.
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

**Narrowed, following the design-baseline audit
(`docs/reports/design-baseline.md`).** The original rule — "pink is the
prediction mechanic itself" — was written down but nothing in the app
actually followed it: `/predict`, the one page that *is* the prediction
mechanic, used no pink anywhere, and Guide's own "Live now" heading used
pink for a fact (something is airing right now) that every other live
indicator in the app renders in rose. Pink is now reserved for exactly
two things: the wordmark and the primary-action CTA (Guide's "Make a
prediction" button). Nothing else should reach for it. Guide's former
pink "Live now" heading is now rose (it's a live-status fact, rose's
job); the former pink "Predictions open" pill is now cyan (it's an
informational/editorial fact about a prediction's status, not the
action of making one).

**Reconciled.** The wordmark's pink pill (`ForecastWordmark.tsx`) and
the "Make a prediction" CTA used to be two different hues sharing the
name "pink" — the wordmark a hardcoded `#fb7185` (identical to
Tailwind's `rose-400` swatch, not to Tailwind's `pink-*` family, where
`pink-400` ≈ `#f472b6`, distinctly more magenta), the CTA Tailwind's
`pink-400`/`pink-300` utility classes. The wordmark's hex wins as the
one real brand color. `styles/globals.css` now defines
`--color-brand: #fb7185` once; both the wordmark's gradient and the
CTA's classes (`bg-brand`/`text-brand`) reference it instead of one
hardcoding a literal and the other reaching for an unrelated Tailwind
swatch.

Consistently applied via small `Record<string, ...>` theme maps in
`src/app/page.tsx` (`briefTheme`, mock/hidden) and implicitly
elsewhere. **Final color-role table**, superseding the old bullet list:

| Role | Token | Notes |
|---|---|---|
| Primary content | `text-white` | titles, values |
| Secondary content | `text-slate-300` | body/question text, hero detail lines |
| Muted metadata | `text-slate-500` | captions, section headers, small-caps labels — `slate-200` and `slate-400` are retired from this role |
| Quietest / inert | `text-slate-600` | empty states, disabled-feeling text |
| Urgency / genuinely live / confirmed wrong | `text-rose-400` (and friends) | never pink for "live," never for "selected/active" either |
| Confirmed correct | `text-emerald-400` | |
| Pending / committed / streak | `text-amber-300` | |
| Brand / primary action only | `bg-brand`/`text-brand` (`--color-brand: #fb7185`) | wordmark and the "Make a prediction" CTA — nowhere else |
| Editorial / informational fact | `text-cyan-400` | Guide's "Up next" heading and "Predictions open" pill |
| Focus ring / neutral interactive | `white/20` | replaces the orphaned `violet-400/40` that only ever appeared in `AuthForm.tsx` |
| Active nav / selected tab | neutral white (`bg-white/[0.12]` glow, `text-white`) | not rose — rose is reserved for urgency/live/wrong, not "this is the current tab" |

`slate-400` remains in use outside the label/header role above (icon
default/hover pairs, plain sentence body copy, disabled-state text) —
those weren't retired, since they're a different role than the one this
pass targeted and retiring them would have erased real state pairs (see
`docs/reports/latest.md`'s color-semantics section for the specific
cases considered and left alone).

No `PROJECT_CONTEXT.md` exists in this repo despite being referenced in
early task instructions — this document's color-system section is
reconstructed from the actual inline comments in the code, not from a
file that was never actually present.

## Migration numbering: file order doesn't reflect production state

**Migration numbering is intentionally non-sequential right now.**
`0009_comments_realtime.sql` exists in the repo but has never been
applied to production — it's parked and inert, pending the `/live`
Realtime work. `0010_follows_and_comment_delete.sql` was applied to
production on 2026-09-14 (commit `467e2c5`), out of order relative to
0009. The two are independent and nothing is broken, but the
migrations directory no longer reflects production state in file
order. Before assuming a migration has been applied, verify against
the database rather than against the file list.

## Design principles

Product principles from a design discussion, captured here so they reach
future sessions directly rather than through chat context.

**Socially available, not artificially socially busy.** Live may state
that a room is open. It may not imply people are in it unless that is
actually known. This governs presence indicators, viewer counts, friend
activity, and trending.

**Don't advertise an interaction until the interaction exists.** Card
copy that promises something untappable is worse than a thinner card
that claims nothing.

**Surface split.** Guide is browse — discovery and editorial across the
whole lineup. Live is doors open now or about to open, never
retrospective. The channel page (not built yet) is one show over time —
the home for that show's archived rooms and event history.

**Room lifecycle equals episode lifecycle.** One conversation per
episode. Read-only once the episode ends. Still readable for the run of
the season, for people who watch later in the week.

**Lifecycle framing.** The core loop is predict, anticipate, watch,
resolve, learn how you did, return. Forecast does not need manufactured
gamification, because every prediction already creates an unanswered
question with a future resolution. The job is exposing and strengthening
that tension, not inventing new tension.

Each state has a job. Open is the decision. Locked is anticipation. Live
is the payoff environment. Past is the reveal and receipt. Profile is
reputation over time.

**States differ through emphasis, copy, and hierarchy, never through
separate component systems.**

**Ethical rule.** Use anticipation, genuine social context, earned
reputation, and truthful feedback. Avoid fake scarcity, fake consensus,
fake activity counts, engineered near misses, loss chasing, sunk-cost
framing, and streak-loss pressure.

The test: are we making an existing fact more legible, or manufacturing
pressure that did not otherwise exist?

Forecast's structural advantage is that nobody loses anything, since the
episode airs regardless. There is nothing to chase.

**Held until the room route exists:** live card copy for a live episode
reads "Live chat is open now" with a "Join live chat" affordance —
chosen over "Live conversation happening now", which implies people are
present in what may be an empty room.

## Trophy rules (for a future earned-state pass, not built)

The four trophies on `/profile` render permanently locked today — no
earned-state logic exists (see `LOCKED_TROPHIES` in
`src/app/profile/ProfileClient.tsx`). These are the rules a future
earned-state pass should implement, derived from existing tables only —
recorded now so that work starts from an already-settled definition
instead of re-deriving one.

**Called It** — the user was correct on a resolved prediction where the
correct option's share of total voters was 25% or less, with at least 10
total voters on that prediction (same crowd-percentage/minimum-votes
shape already used for the crowd-split UI's `MIN_VOTES_FOR_CROWD_SPLIT`
threshold in `PredictClient.tsx`). Permanent once earned.

**Hot Streak** — five consecutive correct resolved picks at any point in
the user's full history, not a currently-active run. A later wrong pick
must not revoke it. Order by `user_predictions.created_at` — there is no
resolution-time column anywhere in the schema (`user_predictions` has no
`resolved_at`, and `resolve_prediction()` doesn't stamp one), so
pick-time order is the only ordering available. Permanent once earned.

**Sharp Eye** — cumulative accuracy reached 70%+ at some point with 10+
resolved picks, computed historically (walk the user's resolved picks in
order and check cumulative accuracy at each step), not from today's
live-recomputed accuracy. This one specifically must not be implemented
as a live threshold check — accuracy can drop back below 70% as more
picks resolve wrong, which would make the trophy flicker on and off
instead of staying earned. Permanent once earned, never re-evaluated
downward.

**Full Sweep** — the user picked every prediction on a single episode,
all of them resolved correct, and that episode had at least 3
predictions. Permanent once earned.

**Earned trophies are never revoked, for any of the four.** Once true,
always true — none of these are live/current-state checks, even where
the underlying stat (accuracy, an active streak) fluctuates.

**Streak is participation-based and weekly**, not daily — see
`lib/streak.ts`. It counts consecutive Monday–Sunday weeks (fixed to
`America/Los_Angeles`, not each user's own `profiles.timezone`) with at
least one locked-in pick, matching the weekly cadence most content on
this app actually airs on.

## Displayed air times: viewer's local timezone, not a hardcoded one

**Reversed a prior decision.** Guide's hero used to format episode air
times pinned to `America/New_York` on purpose, on the reasoning that it's
"a fixed US broadcast time." That reasoning doesn't hold once the
audience isn't assumed to be Eastern — a viewer in Los Angeles doesn't
want to do timezone math to know when something they're watching on their
own TV actually airs for them. All displayed times now use the viewer's
own local timezone, on every page that shows one.

**`src/app/components/LocalTime.tsx`** is the one place this is
implemented. It can't format the real local time on the server — the
server has no idea what timezone the viewer is in, and Vercel's own
runtime timezone (UTC) isn't a stand-in for it either. Rendering a
guessed time server-side and correcting it client-side would still
produce a visible flash and a React hydration mismatch (server and client
would render different text for the same node). Instead it renders
nothing until mounted, then fills in the real local time from a
`useEffect` — server and client's first render both produce the same
empty output, so there's nothing to mismatch, and no
`suppressHydrationWarning` is needed to hide a problem that was avoided
rather than papered over. Guide's hero and Live's Upcoming Rooms both use
it now; their previous separate formatting helpers (one hardcoded to
`America/New_York`, one relying on the browser's default zone with no
hydration-safety handling) are gone.

## "Rooms" is the mechanic, "Events" is what you're anticipating

**Live's "Upcoming Rooms" section is now "Upcoming Events."** A user
doesn't anticipate a room — they anticipate an event (an episode airing,
an awards show happening) and joins a room *inside* that event once it's
live. "Room" is correct terminology for the live, in-progress
conversation (see "Room lifecycle equals episode lifecycle," above), but
wrong for something that hasn't started yet — there's no room to name
yet for an episode that airs in four days, only an event on the
calendar. The Live Now section keeps its own heading as-is; this rename
only applies to the not-yet-started list.

## Streak label: resolved to "Weeks active"

**Profile's and Predict's streak stat are the same metric, confirmed by
reading both call sites.** Both call `computeStreak()`
(`lib/streak.ts`) on every one of the user's `user_predictions.created_at`
timestamps, unfiltered by resolution or correctness —
`profile/page.tsx`'s `allPicks.map(p => p.created_at)` and
`predict/page.tsx`'s `pickResults.map(p => p.created_at)` are the same
query shape against the same table for the same user. TopBar's
avatar-badge streak (`lib/supabase/current-user.ts`'s
`getCurrentUserBadge()`) computes it the same way too — all three
call sites are structurally identical, so there was never a
same-page-different-number risk here.

**Previously labeled "Current streak," which turned out to still be
ambiguous next to the Hot Streak trophy.** The streak stat is
participation-based (any week with at least one locked-in pick counts,
right or wrong — see "Streak: participation-based, local-day, snapshot
timezone," above, now weekly per "Trophy rules"). The Hot Streak
trophy, sitting on the same Profile page, is correctness-based (five
*correct* resolved picks in a row). A viewer reading "Current streak: 3"
right above a trophy called "Hot Streak" had a real reason to assume
the number meant three *correct* picks in a row — it doesn't. "Current
streak" didn't disambiguate participation from correctness.

**Resolved: both stat panels now say "Weeks active."** Names the actual
unit (weeks, not correctness) and reads as clearly distinct from Hot
Streak's "five in a row" framing — the ambiguity this section used to
flag no longer applies to the shipped label. If a future trophy or stat
introduces a different weekly or streak-shaped metric, re-check this
naming against it rather than assuming "weeks active" stays
unambiguous forever.

## Channel naming: audited, no inconsistency found in the live app or database

**Every live channel name across the running app and the production
database is already singular per channel** — `channels.name` holds
exactly one value each ("Love Island USA," "Primetime Emmy Awards,"
"Lanterns"), and every place the app renders a channel name reads
`channel.name`/`c.name` dynamically rather than hardcoding a copy of it.
The only other place "Emmys" appears anywhere in the repository is the
channel's `slug` column (`"emmys"`) and a migration filename
(`0008_seed_emmys_2026.sql`) — neither is ever displayed to a user.
Searched the full codebase, `docs/`, and the live database directly for
"Primetime Emmys" (the third variant reported) and found no occurrence
anywhere. This audit could not reproduce the reported inconsistency in
the current app — it may predate the Guide redesign (which removed the
last hardcoded channel-name-adjacent UI, the grid's CH-badge and status
label) or describe a build this session doesn't have visibility into.
No `UPDATE` statements were needed as a result.

## Imagery

Forecast uses original, licensed, or otherwise approved atmospheric
imagery rather than network artwork as its primary visual language.
Channel imagery should evoke the world, mood, or event without relying
on characters, logos, copyrighted show stills, or recognizable
franchise iconography. Each channel has a coherent visual family that
can produce multiple images across Guide, Live and Predict. Photography
carries channel personality; UI color remains restrained.

Imagery intensity isn't uniform — it scales down with how much weight
each surface gives to browsing versus deciding. Guide carries the
richest imagery of any surface, because discovery is its entire job:
it's the page where a viewer is scanning the whole lineup and imagery
is doing real work distinguishing one channel from the next. Live keeps
imagery large and atmospheric — a viewer has already picked a channel
by the time they're here, so the art is setting mood for something
already chosen rather than competing for attention with five others.
Predict deliberately mutes this further: shorter, darker crops, because
the question itself has to stay the dominant thing on a card whose job
is a decision, not a browse. Profile carries essentially no channel
imagery at all — it's about the viewer's own history and reputation,
not any one show. No channel's artwork ships until that channel's
visual family has actually been art-directed and approved; until then,
every channel uses the existing accent-color fallback rather than a
placeholder that looks more finished than it is.

**Exception, five assets now — six originally, one removed.** These
assets are temporary AI-generated atmospheric stand-ins, not final
artwork, added Sept 17, 2026 before the Sept 20 test. They contain no
characters, logos, or franchise iconography, and are to be replaced by
original photography. This supersedes the earlier "no artwork until a
channel's visual family is approved" line for these assets only — every
other channel, and any future asset beyond these, still waits for that
approval. Mapped in `lib/standinImages.ts`; see the build report for
the per-surface crop and reuse decisions (Lanterns' channel card
reusing its own hero photo, in particular).

**`forecast_guide_card_emmys.png` removed, Sept 18, 2026.** It depicted
an Emmy statuette — trademarked franchise iconography, not an
atmospheric stand-in, and a direct violation of this section's own
"no characters, logos, copyrighted show stills, or recognizable
franchise iconography" rule. Deleted from `public/images/standin/` and
unmapped from `channelPosters` in `lib/standinImages.ts`. The Emmys
channel renders the plain accent-color fallback again until a
compliant replacement exists — not a regression, the correct state per
this section's own rule for a channel with no approved image.

## Navigation affordances

Navigation affordances must correspond to implemented destinations. The
grouped Predict banner and its prediction-collection destination are
one feature and ship together. Until the destination exists, do not
expose a banner, chevron, button, or other control implying that
navigation.

## Fallback states must look intentionally complete

Fallback states must look intentionally complete without imagery. They
should not expose empty thumbnail frames or blank image placeholders.
The presence or absence of approved artwork should not make a
component appear broken or incomplete.

This does not alter the approved imagery strategy above — approved
channel artwork still becomes the primary visual language across
Guide, Live, and Predict once a channel's visual family is art-directed
and approved. This is about the state before that: Live's upcoming rows
no longer reserve a 44px thumbnail square for an image that doesn't
exist; Guide's channel cards no longer carry a fixed height inherited
from a poster-shaped aspect ratio when there's no poster to fill it;
Guide's hero keeps its pill and text content anchored to their own
positions rather than stretched to opposite edges of a box sized for
art that isn't there yet. None of these changes wait for real artwork
to look finished — they're the pre-artwork state actually looking
finished, not a smaller version of the post-artwork state.

## Genre: controlled eight-word vocabulary, multi-genre per channel

**`channels.genre` (a single free-text column) is now `channels.genres`
(`text[]`)** — migration `0012_channel_genres.sql`. A channel
structurally could not belong to more than one genre before; a single
text column has nowhere to put a second value. The vocabulary is fixed
at eight words: Drama, Comedy, Reality, Competition, Sci-Fi, Sports,
Awards, Documentary — enforced by a `check` constraint
(`genres <@ array[...]`), not just documentation discipline, so a typo
can't silently create a ninth genre no chip ever shows.

**"Dating" is deliberately not in the vocabulary.** It was Love Island
USA's old free-text value, with no mapping target in the controlled
list — that channel is `Reality` now, not `Reality` plus a
grandfathered "Dating." Real mapping applied: Lanterns → `Drama,
Sci-Fi` (its old value, "Sci-Fi Drama," was one free-text string mashing
together its two real constituent genres — split, not inferred, since
that inference doesn't generalize to any future channel's free text);
Love Island USA → `Reality`; Primetime Emmy Awards → `Awards`;
Survivor → `Reality, Competition` (seeded directly with this value, not
backfilled).

**Guide's genre chips render only for genres at least one channel
actually carries** — computed as `present = new Set(channels.flatMap(c
=> c.genres))`, then the *fixed vocabulary array* (not the derived set)
filtered down to members of `present`. Filtering the vocabulary rather
than sorting the derived set keeps chip order stable and intentional
(Drama always before Comedy if both are present) regardless of which
channels exist or in what order they were seeded.

## Survivor: real channel, and a known timezone limitation in its data

**A real fourth channel**, seeded in `0013_seed_survivor.sql`: CBS's
*Survivor 51, "The Open Era"* — 21 new castaways, Mamanuca Islands,
Fiji. Premiere Wednesday, September 23, 2026 (two hours); weekly
90-minute episodes Wednesdays from September 30, 2026. Four episodes
seeded (through October 14) — every one mechanically computed from
those two stated facts with no assumption about the season's total
length, and exactly the set that falls inside `/schedule`'s real
30-day window as of the seed date. A fifth episode (October 21) enters
that window on its own in a few days; seeding it earlier would add a
row `/schedule` wouldn't show yet for no present benefit — a short
follow-up seed nearer that date is the cheaper, more honest way to
extend this than guessing the finale now. No predictions yet (a
separate content decision) and no artwork yet (accent-color fallback,
same as any channel with no approved image — see "Imagery," above).
Episode titles aren't published; `"Episode 1"`, `"Episode 2"`, etc.
match the same placeholder convention already used for Lanterns'
untitled episodes.

**Known limitation, deliberate, not to be silently "fixed": Survivor's
`air_date` is anchored to Pacific time, not Eastern.** CBS airs this
show at 8:00 PM *simultaneously* in both zones — not a single national
feed with the usual same-day tape delay for the West Coast, which is
what "8 PM ET/PT" means for most other programming. `episodes.air_date`
is one `timestamptz`, one absolute instant, which cannot equal "8:00
PM" in two different zones at once — the schema has no per-network or
per-broadcast-zone offset concept. The decision made here: store the
**Pacific** instant (e.g. the premiere as `2026-09-24T03:00:00Z`).
`LocalTime` will therefore show the correct 8:00 PM for a Pacific
viewer but an incorrect 11:00 PM (not the real 8:00 PM) for an Eastern
one. **This is accepted as a known gap, not a bug** — do not "correct"
it to anchor Eastern instead without revisiting this decision
explicitly; that would just move the same error onto Pacific viewers.
Fixing it properly needs a real per-network or per-channel
timezone-offset concept the schema doesn't have today, which is a
schema change, not a data fix.

## Live thumbnails removed again in 5d4e760, imagery decision still open

Removed once already in `fd9f06f` (no real per-episode imagery existed,
so the 44px frame always rendered blank) and reintroduced by accident
when Guide's and Predict's stand-in image mapping went in — `RoomEpisode`
grew an `image` field and Live's upcoming rows started rendering whatever
`liveEpisodeImages` happened to map, including a mismatched forest crop
on Lanterns Episode 8. Removed again in `5d4e760`, this time along with
the `image` field and its wiring in `live/page.tsx`, not just the render.
This is a note that it happened twice, not a ruling on how Live should
look — whether Live rows get thumbnails at all is still an open design
question for this redesign, not settled by either removal.
