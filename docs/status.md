# Current status

Plain-language summary for whoever (human or Claude Code session) picks
this up next, with no memory of the session that built it. For *why*
things work this way, see `docs/decisions.md`. This file is about *what
exists* and *what's next* — update it as state changes rather than
letting it drift.

## What's built and verified, end to end

**Real Supabase data everywhere it can be**, across all four pages
(homepage, `/live`, `/predict`, `/profile`):
- Channels, episodes, predictions, prediction options, and votes are real.
- Magic-link auth works (including the redirect-back-to-where-you-came-
  from `?next=` param), scoped to just what needs it — locking in a pick,
  and `/profile` — not a global login wall.
- **Resend's sending domain (`forecasttv.app`) is now verified**, and
  Custom SMTP is configured in Supabase (Host: `smtp.resend.com`, Port
  `465`) — confirmed working end to end: a real invite email was sent to
  a non-sandbox address and delivered successfully. This resolves what
  was the single most logical next step as of the previous version of
  this file.
- **The app is deployed and live in production**: https://forecasttv.app
  (Vercel, connected to this GitHub repo, auto-deploys on push to
  `main`), DNS via a CNAME record at Cloudflare. The original Vercel
  preview domain, `forecast-iota-pearl.vercel.app`, still works and is
  kept in Supabase's Redirect URLs allow list as a fallback. Supabase
  Auth's **Site URL is now `https://forecasttv.app`**, no longer
  `localhost:3000` — this resolves the other half of what was the
  previous version's single most logical next step.
- The full prediction lifecycle works and has been tested live, not just
  read from code: **create → vote → auto-lock at `locks_at` → resolve via
  admin SQL → accuracy/streak/prediction-record all update correctly.**
  This was verified twice tonight, once during initial build and once
  in a full authenticated regression pass afterward.
- Day-streak is real: participation-based (any day with a locked-in pick,
  right or wrong), computed live from `user_predictions`, using each
  user's own local calendar day (timezone snapshotted once at their first
  sign-in, never re-detected).
- Poster images gracefully fall back to a gradient/title card when the
  source blocks hotlinking (most of them do) — no broken images anywhere,
  and nothing downloaded or self-hosted.
- **Episode status (Guide's hero, Live's Live Now/Upcoming Rooms) is now
  derived from air time, not read raw from `episodes.status`.**
  `src/lib/episodeStatus.ts`'s `effectiveEpisodeStatus()` treats a stored
  `upcoming` episode as `live` for a fixed 90-minute window starting at
  `air_date`, then `ended` after that window passes — purely at display
  time, never written back to the database. This closes the gap where
  Guide used to show a passed episode as "Live" forever and Live used to
  show "Opens in soon" indefinitely past air time. **Long-running events
  (awards shows, live finales) exceed the 90-minute window and need
  `episodes.status` set to `live` by hand for their actual duration** —
  and because a stored `live` status is a manual override with no
  auto-expiry, **never set an episode to `live` manually for
  normal episode-length content**; let it derive from air time instead,
  or it will never come back down to `ended` on its own.
  `predictions.status` and `channels.status` are unaffected by this and
  remain entirely manual, unsynced with each other and with episode
  status — see the "three independent status columns" finding from the
  original Guide audit.
- **`supabase/migrations/0011_enforce_locks_at_on_pick.sql` has been
  applied to production (2026-09-16)**, confirmed via SQL editor — no
  longer just a file sitting in the repo. The `user_predictions` insert
  policy now requires `locks_at > now()` in addition to `status = 'open'`,
  closing the gap where a client that loaded `/predict` before `locks_at`
  and never reloaded could still write a pick after the deadline as long
  as no other page load had triggered the lazy lock in the meantime.
- A dedicated test login exists (`scripts/test-login.ts` +
  `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` in `.env.local`) so a future
  session can get an authenticated browser session without relaying a
  magic-link email. It currently authenticates as the real account used
  for tonight's manual testing (`user_72ad8a77`), not a separate
  clean-slate identity. **Update**: the constraint that forced this
  (Resend's sandbox sender could only reach one real address) no longer
  applies now that the sending domain is verified — this note is stale,
  not a live limitation. Optional future cleanup: point `test-login.ts`
  at a dedicated test identity instead of a real, evolving account.
- `points_awarded` (10/0 flat score) is now surfaced in profile's
  Prediction Record, next to each resolved pick's correct/wrong mark —
  previously scored on resolution but never shown anywhere.
- The seven dead mock exports superseded by real data (`heroFeed`,
  `channelCards`, `topRoomComments`, `chatterFeed`, `predictStats`,
  `closingCards`, `liveQuestions`) have been removed from
  `lib/mock-data.ts`.
- The wordmark's signal-pink pill now matches the app's real pink
  (rose-400 / `#fb7185`) — it previously hardcoded a different, unrelated
  hex (`#FF2D55`).
- **`resolve_prediction()` now requires `locked` status in production.**
  `supabase/migrations/0006_tighten_resolve_prediction_status.sql` has
  been run against the live Supabase database via the SQL editor and
  confirmed working — no longer just a file sitting in the repo.

## Deliberately still mock — not overlooked, no schema for it yet

- `/live`: "Live Rooms," "Friends Are Talking," "Active Discussions."
  Only "Room Highlights" is real (episode comments).
- `/profile`: Trophy Shelf, "Following" shows, "Friends." "Activity" is
  a mixed feed with a real gap (trophy events have no source) so it
  stayed mock rather than going half-real.
- `/predict`: "Upcoming" and "Past Picks" preview sections. (Not the same
  as profile's real "Prediction Record" — similar-looking, different
  data source.)

None of these have backing tables. Wiring any of them is a schema/product
conversation, not a data-wiring task — see `docs/decisions.md`.

## Built but dormant — not functional in production

**`LiveCommentsFeed.tsx` and `actions/comments.ts` are wired in code but
not functional in production.** Both were written for the pre-lobby
version of `/live` and still exist on disk — a working Realtime
subscription plus a `postComment` server action against real
`comments`/`reactions` tables — but nothing currently imports or renders
either file. Re-wiring them as-is would still not work, for two separate
reasons:
- `supabase/migrations/0009_comments_realtime.sql` (adds `comments` to
  the `supabase_realtime` publication — required for the subscription to
  receive anything at all) has never been applied to production — see
  `docs/decisions.md`'s "Migration numbering" note.
- The old version selected whichever episode had the newest `air_date`
  overall, not whichever episode was actually `status = 'live'` — the
  targeting was wrong even setting the migration aside.

Do not describe these as working without re-verifying both of the above.

## Single most logical next step

No known concrete blocker is outstanding as of this update — deployment,
email delivery, Site URL, and migration 0006 are all done and confirmed.
Remaining work (rooms, friends, trophies, follows) is product/schema
scoped, not a blocker fix — see `docs/decisions.md`.
