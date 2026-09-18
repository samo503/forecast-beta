# Variable episode duration: investigation and plan

Report only. No code, schema, or content changes were made while
producing this. The live-database figures below come from a direct
query against production (`episodes` joined to `channels`, run
2026-09-18), not from migration files — `docs/decisions.md`'s
"Migration numbering" note already flags that the file list doesn't
reflect production state, and that's confirmed true here too: Lanterns'
and Love Island's episode rows exist live but were never seeded via a
committed migration.

---

## 1. What it would take

### The problem, precisely

`src/lib/episodeStatus.ts`'s `effectiveEpisodeStatus()` adds one fixed
`LIVE_WINDOW_MINUTES = 90` to every episode's `air_date` to compute when
it flips from `live` back to `ended`. That number is now wrong for two
of three still-relevant shows:

| Channel | Episode | Real runtime | Current fixed window |
|---|---|---|---|
| Lanterns | Bad Optics (E6), Episode 7, Episode 8 | ~52–57 min | 90 min (39% too long) |
| Survivor | Episode 1 (premiere) | 120 min | 90 min (would end 30 min early) |
| Survivor | Episodes 2–4 (weekly) | 90 min | 90 min (correct by coincidence) |

Survivor's premiere is the concrete near-term failure: air_date
`2026-09-24T03:00:00Z` (8:00 PM PT, per the dual-timezone note already
in `docs/decisions.md`) + 90 min would read as `ended` at 9:30 PM PT
while the real broadcast runs until 10:00 PM.

### Schema shape: `runtime_minutes`, not `ends_at`

**Recommend `episodes.runtime_minutes int`, nullable, no default.**
Considered `ends_at timestamptz` as the alternative and am not
recommending it:

- `ends_at` duplicates information already implied by `air_date` +
  duration — two timestamps that can drift out of sync if one is
  edited (e.g. an air_date correction) without the other. A minutes
  column has nothing to drift against; it's a pure duration, computed
  into a window only at display time, same as today.
- Every existing seed migration (`0008`, `0013`) was authored by hand,
  computing `air_date` from a plain-language description ("8pm ET/PT",
  "premieres September 23"). A minutes figure ("120 minutes") is the
  same kind of input a future manual seed will naturally have on hand;
  a precomputed absolute end instant is not.
- `runtime_minutes` is directly nullable-and-absent-means-"unknown," matching
  how every other optional column in this schema already works
  (`episode_number`, `accent_color`, `description`). `ends_at` would
  need the same nullability anyway, so it buys nothing structurally.

A `check (runtime_minutes is null or runtime_minutes > 0)` constraint
is cheap and consistent with this migration series' own habit of
constraining new columns (`0012`'s genre `check`) — recommend including
it, not deferring it.

### Migration

One file, schema + backfill together, following `0012`'s own precedent
(that migration added `channels.genres` and backfilled the three real
rows in the same file, not a separate pass):

**`supabase/migrations/0014_episode_runtime_minutes.sql`**
- `alter table episodes add column runtime_minutes int check (runtime_minutes is null or runtime_minutes > 0);`
- Backfill, using only the real figures given, nothing invented:

| Row (queried live) | `status` | `runtime_minutes` to set |
|---|---|---|
| Love Island "Recoupling Night" | `ended` | — left `null`, see below |
| Emmys "78th Primetime Emmy Awards" | `ended` | — left `null`, see below |
| Lanterns "Bad Optics" (E6) | `upcoming` | `60` |
| Lanterns "Episode 7" | `upcoming` | `60` |
| Lanterns "Episode 8" | `upcoming` | `60` |
| Survivor "Episode 1" | `upcoming` | `120` |
| Survivor "Episode 2" | `upcoming` | `90` |
| Survivor "Episode 3" | `upcoming` | `90` |
| Survivor "Episode 4" | `upcoming` | `90` |

**Lanterns uses 60, not its measured 52–57 minute runtime**: HBO airs
on the hour, so the next episode's slot never actually starts before
the top of the following hour regardless of the exact runtime — 60 is
the safer boundary (a real episode never runs past it) while staying
well short of colliding with the next hour's programming. Approved
2026-09-18.

**Why the two `ended` rows are left `null` rather than backfilled**:
`effectiveEpisodeStatus()` returns `"ended"` immediately for a stored
`ended` row, before it ever looks at `air_date` or a duration — the
column would be write-only dead data for those two rows. Not a gap,
just not worth inventing a number (Emmys' real runtime was never
given) for a field nothing will ever read.

### Every consumer of `effectiveEpisodeStatus()`

The function itself takes exactly three params today —
`(storedStatus, airDate, now)` — called from **8 call sites across 3
files**:

| File | Call sites | Query shape today |
|---|---|---|
| `src/app/page.tsx` (Guide) | 4 (lines 84, 97, 103, 136) | `select("*, channel:channels(*)")` — already fetches every column, including a new one |
| `src/app/schedule/page.tsx` | 2 (lines 43, 52) | Same `select("*, ...")` shape — same, no query change needed |
| `src/app/live/page.tsx` | 2 (lines 50, 53) | `select("id, title, episode_number, air_date, status, channel:channels(...)")` — **explicit column list, needs `runtime_minutes` added** |

The function itself needs a 4th, optional parameter so the change is
additive at the type level:

```
effectiveEpisodeStatus(storedStatus, airDate, now, runtimeMinutes?)
```

Every call site then needs its 3rd positional arg extended to pass
`e.runtime_minutes` (or `episode.runtime_minutes`, matching whatever
the local variable is named at that call site) — mechanical, but real:
skipping any one of the 8 sites leaves that surface silently back on
the fixed 90-minute assumption while the others are correct, which is
worse than not starting (an inconsistency nothing surfaces visibly).

---

## 2. Fallback for episodes with no duration set

**Keep `LIVE_WINDOW_MINUTES = 90` exactly as it is today, repurposed as
the fallback**: `windowMs = (runtimeMinutes ?? LIVE_WINDOW_MINUTES) * 60_000`.

Reasoning: this makes the schema change strictly additive in practice,
not just in the type signature. Every future episode seeded without a
`runtime_minutes` value (forgotten, or genuinely unknown at seed time)
behaves exactly as every episode behaves today — no regression risk,
no new number to invent or justify. The alternative I considered and
rejected — treating a missing duration as "no auto-expiry, stays live
until manually flipped back" — would make a *forgotten* column behave
like today's deliberate manual override, which is the more dangerous
failure direction (an episode stuck reading "Live" forever because
someone forgot one field, discovered only when a user notices, versus
today's known, bounded 90-minute guess).

---

## 3. Other surfaces assuming a fixed 90 minutes

**Grepped the full `src/` and `lib/` trees for any other numeric
duration assumption — none found.** `LIVE_WINDOW_MINUTES` is defined
and consumed only inside `episodeStatus.ts`; nothing else hardcodes 90,
duplicates the window math, or reads `episodes.status`/`air_date`
directly to infer a runtime. Live's `opensInLabel()` (countdown to
air_date) and the schedule's row rendering are both duration-agnostic —
they only care about `air_date` itself, not how long the window is.

**One *process* assumption does need updating, not in code but in
`docs/status.md`**: the existing guidance there reads "Long-running
events (awards shows, live finales) exceed the 90-minute window and
need `episodes.status` set to `live` by hand for their actual
duration." That workaround exists specifically *because* the window
was fixed. Once `runtime_minutes` is real, any event with a **known**
runtime (Survivor's premiere, a future long finale with an announced
length) should get a real number instead of a manual override — the
manual-override escape hatch should be narrowed to cover only content
whose length is genuinely unknown or open-ended at air time (a results
show that might run long, breaking news), not used as the default tool
for "this one's longer than 90 minutes." Proposing this doc update as
part of the sequence below, not silently.

---

## Implementation sequence — small, reversible commits

**Not implemented. Waiting for approval on this sequence specifically
before writing any code.**

**1. Migration `0014_episode_runtime_minutes.sql`.** Add the column +
check constraint, backfill the 7 real upcoming rows per the table
above. DB-only commit, verifiable by reading the rows back in the SQL
editor before anything in the app depends on it — same pattern as
every prior schema-only commit in this series (`0011`, `0012`).

**2. `episodeStatus.ts`: accept an optional `runtimeMinutes` param.**
Signature change plus the fallback logic from §2. Zero call sites
updated yet, so this commit changes no observable behavior anywhere —
verifiable by confirming all three pages render identically
before/after (they will, since every existing call site keeps passing
only 3 args).

**3. Guide (`src/app/page.tsx`): pass `e.runtime_minutes` /
`episode.runtime_minutes` at all 4 call sites.** No query change needed
(`select("*, ...")` already returns the column). Verifiable in WebKit:
Bad Optics/Episode 7/Episode 8 still render correctly now (all ended
today regardless, so no visible change until Sept 20+), and nothing
else in the Up Next carousel or Channels grid regresses.

**4. Live (`src/app/live/page.tsx`): add `runtime_minutes` to the
explicit `select()` list, pass it at both call sites.** The one file
that needs a query change, isolated in its own commit for that reason.
Verifiable the same way — Live Now / Upcoming Events render unchanged
today, ready for Sept 23.

**5. Schedule (`src/app/schedule/page.tsx`): pass it at both call
sites.** No query change needed, same as Guide. Verifiable against the
existing `/schedule` screenshot baseline from the prior session.

**6. Docs.** `docs/status.md`'s episode-status paragraph gets the
narrowed manual-override guidance from §3. A new `docs/decisions.md`
entry records the `runtime_minutes`-over-`ends_at` reasoning from §1,
the real backfilled figures (60 / 120 / 90), and that the two `ended`
rows were deliberately left unbackfilled — so a future session doesn't
"fix" that into inventing an Emmys runtime nobody gave it.

Each commit is independently revertable and, except for #1 (which
nothing yet depends on) and #2 (which changes no behavior), each of
#3–#5 can land in any order relative to the others — they touch
disjoint files and only start mattering once #1 and #2 are both in.
