# Prediction resolution criteria

**There is no schema column for this.** `predictions` has `id,
episode_id, channel_id, question, status, locks_at, correct_option_id,
created_at`; `prediction_options` has `id, prediction_id, label,
sort_order, vote_count` — verified against every committed migration
(`supabase/migrations/`). Resolution criteria for every prediction below
lives only in this file, not in the database. Whoever resolves a
prediction (via `resolve_prediction()`, per `docs/decisions.md` — a
manual, trusted admin action) needs to read the matching entry here
first. A future migration could add a real column (e.g.
`predictions.resolution_criteria text`) if this file becomes
unwieldy or resolution moves off a single trusted person — not done
here, per instruction not to invent one.

---

## Survivor — Episode 1 (premiere, Sept 23, 2026)

Seeded by `supabase/migrations/0015_seed_survivor_predictions.sql`
(not yet applied as of this writing).

**`cccccccc-3333-3333-3333-000000000001`**
Does anyone find a hidden immunity idol in the premiere?
Resolves Yes if a castaway is shown finding an idol on screen during
the episode.

**`cccccccc-3333-3333-3333-000000000002`**
Is more than one person voted out during the premiere?
Resolves Yes if two or more castaways are voted out across the
episode.

**`cccccccc-3333-3333-3333-000000000003`**
Is the first person voted out eliminated by a unanimous vote?
Refers to the first tribal council of the episode. Resolves Yes only
if every vote cast at that council went to a single person.

**`cccccccc-3333-3333-3333-000000000004`**
Does a twist or advantage from a previous season appear in the
premiere?
Resolves Yes if a returning twist or advantage is explicitly
introduced, announced, found, awarded, or played during the episode.

---

## Lanterns — Episode 6, "Bad Optics"

**Criteria not recoverable from the repo.** These four predictions
exist in production (confirmed by a direct query against the live
`predictions` table, 2026-09-19) but — per `docs/status.md`'s known
gap — Lanterns was never seeded via a committed migration, and no
resolution-criteria text for them exists in any committed file
(migrations, `docs/decisions.md`, `docs/status.md`, or
`docs/sunday-runbook.md` — grepped all four). The questions themselves
are recorded below only as a live-database fact, not a repo fact — do
not treat this section as reproducible from `supabase/migrations/`
the way the Survivor section above is.

| Prediction ID (live) | Question |
|---|---|
| `1f156d64-d0ee-4fee-a365-1077233b94ae` | Does John Stewart wear a Green Lantern ring at any point in Episode 6? |
| `f8530c83-eafe-44f1-b73b-f35e976cd82e` | Is it revealed who has Hal Jordan's missing ring? |
| `cf6dbdf9-c3bc-4b4c-8a9a-7cbd887b280e` | Does Episode 6 include any scene set on Oa? |
| `f6b62986-1cb3-40cb-bfa9-e3a36036b559` | Does Episode 6 contain any scene set in the 2016 timeline? |

Whoever originally wrote these questions has the resolution criteria,
if it was ever written down outside this repo — not something this
pass can recover. Resolving any of these four without that source
means inferring criteria from the question text alone, which is a
judgment call each admin action should make explicitly, not something
this file can substitute for.
