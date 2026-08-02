# M6 Claim Curation and Evidence Hardening Design

## Purpose

M6 takes MyoStat's curated claim base from 17 claims to approximately 50 while
making each claim auditable from a source a reviewer actually read. It also
fixes the advice-engine paths needed to distinguish data-earned advice from a
generic context rule. The work satisfies the M6 target in `BUILD-PLAN.md` and
AC-6 without weakening T1, GR-1, GR-3, GR-4, GR-5, or GR-6.

## Scope

- Add roughly 33 directly curated claim records, including the missing ROM and
  bulk-rate topics, deeper rest-interval and deload coverage, and balanced
  coverage of volume, frequency, failure proximity, energy balance, protein,
  loading, and exercise selection.
- Build curation-time evidence controls: a persistent review ledger, batch DOI
  verification that is never part of the runtime or normal deterministic build,
  and automated checks for claim count, ledger coverage, and valid predicates.
- Correct authoring guidance so its template matches the schema, including the
  required `peekStatement` field.
- Make predicates reject unknown snapshot fields and malformed JSON-logic rather
  than silently returning no match.
- Correct the advice trigger/context path: advice instantiated by recorded user
  state is stored as `data-earned`; generic context rules remain `rule`; the Hub
  must evaluate the real snapshot rather than `EMPTY_SNAPSHOT`.
- Audit the entire final claim base for calibrated grade language, contested
  clusters, source-read figures, and review dates.

## Explicit non-goals

- No sync Worker, D1 deletion, food-provider, barcode, CoFID, or cross-device
  recents changes.
- No live scholarly API or LLM in the shipped app or its trust path.
- No fabricated figures, inferred sample sizes/populations, publisher images,
  individual MEV/MRV, rate-of-loss threshold, medical claim, or personal protein
  conclusion drawn from incomplete food logging.
- No new database migration: claims remain a versioned, generated app bundle.

## Claim curation workflow

Each candidate begins as an atomic research question with its target population,
outcome, and intended reachability declared before search. Discovery uses
PubMed/Crossref/Europe PMC and web research only to find possible primary or
synthesis sources. A claim is not drafted from a search result, AI summary, or
secondary paper description.

For every citation, the curator resolves the DOI independently, reads the
available primary source, and records exact evidence locations for every stored
number, quote, effect, and population value. Fields unavailable in the source
remain `null` or `unstated`. Grades apply to the precise claim, not source
prestige; a trained-lifter claim supported only by untrained or unstated
populations is downgraded. A contested topic is authored as both real sides of a
shared cluster, never as a strawman.

Every claim receives two independent hostile source checks. Each reviewer tests
the statement's scope, grade, population, extracted values, `peekStatement`,
and any predicate against the actual record and source. The second review is a
required control because M1's automated checks previously allowed unsupported
wording to survive.

## Evidence ledger

`docs/00-meta/claim-review-queue.md` is the human-readable, versioned review
ledger. It has one row per citation and records: claim and citation IDs, DOI,
DOI-resolution date/result, source/read mode, exact source location for stored
evidence, reason for every null/unstated value, population-match and grade
rationale, first and second reviewer/date, and a future review date. It also
lists any deliberately unresolved evidence gap. It is curation data, never read
by the running app.

A curation-only DOI audit script reads all YAML citations, resolves them in a
bounded batch, and writes an auditable report for the ledger. Normal `claims`,
test, build, and runtime paths remain offline/deterministic and do not make
network calls.

## Predicate and advice semantics

Predicates may reference only the snapshot fields already computed by the app:
`goal`, `deficitWeeks`, `weightTrend`, `e1rmTrend`, `proteinPerKg7d`,
`numbersHidden`, and `muscleSets.{muscle,sets}`. The schema validates supported
JSON-logic operators, allowed paths, and required null guards before a claim is
generated. Claims default to search-only.

Only a claim whose predicate is instantiated by reliable logged state may use
the `data-earned` trigger. The strongest current example is strength holding
through a sustained cut. Volume can state what the log contains against a
population range, never prescribe a personal MEV/MRV. Protein and configured
deficit claims remain context rules until the snapshot can establish complete
intake coverage and an observed deficit. The Hub and session surfaces evaluate
the real snapshot; `whyNow` must name the data that matched the selected claim,
not an unrelated extreme.

## Verification

Automated gates: YAML/schema generation, generated-bundle drift, count and
ledger-completeness checks, predicate validation, engine/context/trigger tests,
provenance and grade-language tests, typecheck, build, and Playwright. These
prove structure and behaviour, not truth of a source: direct-source extraction
and the two-reader ledger remain the load-bearing evidence controls.

## Delivery sequence

1. Establish authoring, ledger, DOI-audit, count, and predicate-validation
   controls, with tests.
2. Repair advice trigger/context semantics and test real-data behaviour.
3. Curate reviewed claims in small topic batches, generating the bundle after
   every batch.
4. Run the hostile audit across both new and M1 records, resolve figure gaps
   honestly, then complete the full verification and project-state update.
