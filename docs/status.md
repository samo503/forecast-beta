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
  magic-link email. **Caveat**: it currently authenticates as the real
  account used for tonight's manual testing (`user_72ad8a77`), not a
  separate clean-slate identity — Resend's sandbox sender can only
  deliver to one specific real address (see the email-delivery section
  below), which forced this compromise. It's a live, evolving identity
  with real history, not a blank slate to test against.

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

- **Resend's sending domain isn't verified.** Outbound auth email only
  reaches one address (the Resend account owner's own). Real users can't
  receive magic links until a real sending domain is verified. This is
  the actual blocker behind most of tonight's test-account friction —
  fix this before onboarding anyone else.
- `resolve_prediction()` accepts `open` or `locked` status, not just
  `locked` — there's no automatic status check tightening this back down
  after the lazy lock-transition was added.
- `points_awarded` is scored on resolution (10/0) but never displayed
  anywhere in the UI — real data, no surface for it yet.
- Several now-dead mock exports remain in `lib/mock-data.ts`
  (`heroFeed`, `channelCards`, `topRoomComments`, `chatterFeed`,
  `predictStats`, `closingCards`, `liveQuestions`) — superseded by real
  data, flagged but not removed pending a decision to clean them up.

## Single most logical next step

**Verify a real sending domain in Resend.** Almost everything else
tonight — the test-account saga, the inability to onboard a second real
user, the general fragility around auth email — traces back to this one
unresolved piece. It's infrastructure, not a feature, and it unblocks
real user testing (not just this one account) once it's done.
