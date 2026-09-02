# Claim review queue

The current, field-level curation record is
[`app/claims/review-ledger.json`](../../app/claims/review-ledger.json). It is
the single source of truth for review state; do not copy mutable citation
details into this queue.

## Merge gate

A claim cannot merge until **every citation** has two independent hostile
direct-source reviews recorded in the ledger. Each reviewer checks the claim
statement, grade, population applicability, stored figures and quotes,
`peekStatement`, and any predicate against the source itself. A DOI resolving
does not replace a source review.

## Advice-surface policy

The advice-surface work has four deliberately separate lanes:

- **Hub empty:** at most one cited, clearly labelled general-evidence fact.
  It is never headed or explained as "for you."
- **Exercise selection:** at most one cited general-evidence fact after the
  first exercise is selected in a workout. The fact can describe its source
  population or applicability; selecting an exercise does not establish that
  the finding applies to the person who selected it.
- **Goal draft:** a cited context fact may appear while a cut, bulk, or
  maintenance goal is being drafted, only when that source's scope supports
  the exact goal context. It cannot calculate or imply an individual rate,
  intake, or target.
- **Longitudinal advice:** existing Hub and weekly-review claims remain the
  only lanes that can be data-earned from the aggregate snapshot.

No single food entry, weigh-in, just-logged set, RIR change, or workout finish
can earn an automatic claim. Workout opening and first exercise selection share
one automatic-card budget; later exercise selections and set entry do not
re-evaluate the lane.

## Advice-surface source intake — 2026-08-02

The direct-read candidate records live in the ledger under the
`candidate-advice-surface-*` ids. They are intake records, not claims: no YAML
may be drafted from them until an atomic statement, population label, grade,
null rationale, and two hostile direct-source reviews are complete.

- **Exercise selection:** the direct-read novice-exercise Delphi study is a
  candidate only for a labelled novice-population context fact. It is not
  evidence that the app can classify a first-time user as a novice or that any
  particular exercise is appropriate for them.
- **Hypertrophy mechanisms:** one reviewed general-evidence claim now explains
  that mechanical tension is a key hypertrophy stimulus and that motor-unit
  activity helps regulate that tension. Its directly read author-produced
  manuscript is a narrative review with an unstated population, so it remains
  Grade C and does not justify a load, volume, proximity-to-failure, or personal
  prescription. It may appear only as labelled general evidence on an empty Hub
  or after a first exercise selection.
- **Cut draft:** the direct-read energy-deficiency synthesis is a candidate for
  a population-level context fact only. Its approximately 500-kcal meta-
  regression is not a user-specific loss-rate target and cannot weaken the
  existing code-enforced cap or intake floors.
- **Bulk draft:** the existing direct-read energy-surplus review documents an
  evidence gap around a validated hypertrophy surplus. It now ships one
  reviewed goal-draft claim (`c-bulk-rate-surplus-unknown`) that surfaces the
  unvalidated-surplus fact while a bulk goal is drafted. It remains an
  uncertainty statement, never a personal surplus or gain-rate calculation.
- **Maintenance draft:** the direct-read weight-maintenance overview concerns
  adults with overweight or obesity after weight loss and finds no significant
  effect of the included exercise evidence on weight maintenance. That scope
  does not support a general lifting-app maintenance prescription, so this lane
  is intentionally silent pending a directly supported alternative.

## Working the queue

1. Run `npm run claims:audit-dois` manually when a DOI-resolution pass is due.
   It is a curation-only Crossref request and is deliberately excluded from
   `npm run claims`, tests, builds, and the running app.
2. Update the matching ledger entry with the audit date/result, how the source
   was read, exact evidence locations, every null or `unstated` rationale,
   population and grade rationale, and the next review date.
3. Record two separate hostile reviews. Do not backfill names, dates, source
   locations, or sign-offs that were not actually recorded.
4. Keep `pending-M6-review` entries unresolved until the M6 audit supplies
   direct-source evidence. The existing M1 citations retain their exact IDs and
   DOIs, but their missing review metadata must remain visibly unknown.

## Deferred M6 scopes

- No reactive-versus-scheduled-deload claim has been added. The direct sources
  reviewed in this pass address reduced training dose or a long periodic
  detraining block, not that comparison; neither should be relabelled as it.
- No new standalone maintenance-energy adaptation claim has been added. The
  directly read energy-deficit versus non-deficit synthesis is already cited by
  M1 energy-balance claims that remain `pending-M6-review`; it must be audited
  as part of the full M1 review rather than duplicated as a new claim.
