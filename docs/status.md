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

## Known gaps, not bugs

- `resolve_prediction()` accepts `open` or `locked` status, not just
  `locked` — there's no automatic status check tightening this back down
  after the lazy lock-transition was added.
- `points_awarded` is scored on resolution (10/0) but never displayed
  anywhere in the UI — real data, no surface for it yet.
- Several now-dead mock exports remain in `lib/mock-data.ts`
  (`heroFeed`, `channelCards`, `topRoomComments`, `chatterFeed`,
  `predictStats`, `closingCards`, `liveQuestions`) — superseded by real
  data, flagged but not removed pending a decision to clean them up.
- **Supabase's Auth Site URL is still `http://localhost:3000`.** This is
  correct/intentional, not a bug — there's no production deployment yet.
  Auth/invite links will only resolve on whatever machine is running the
  dev server until that changes.

## Single most logical next step

**Deploy to a real URL (Vercel) and point Supabase's Auth Site URL at
it.** Email delivery is no longer the blocker — domain verification and
Custom SMTP are done and confirmed working end to end. The next thing
standing between this app and real users is that `Site URL` is still
`http://localhost:3000`, so there's nowhere for auth/invite links to
resolve to outside a dev machine. Once a deployment exists, update
`Site URL` and add it to the Redirect URLs allow list.
