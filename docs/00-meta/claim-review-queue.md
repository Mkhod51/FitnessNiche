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
