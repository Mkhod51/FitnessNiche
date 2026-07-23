# Phase 1 → Phase 2 Migration Map

Phase 1's flat structure could not hold Phase 2's volume. Nothing was discarded; everything was placed. Verbatim copies of all four Phase 1 research files are archived unmodified at `03-sources/raw-notes/phase1/` so that no Wave 1 agent extending a document can destroy the original.

## Whole-file moves

| Phase 1 path | Phase 2 path | Note |
|---|---|---|
| `decisions.md` | `00-meta/decision-log.md` | Continues to accumulate; Phase 2 appends |
| `carryover.md` | `00-meta/carryover.md` | Written at the start of Phase 2 |
| `research/integration-thesis.md` | `01-research/domain/integration-thesis.md` | Physiology adjudication; feeds both exercise- and nutrition-science streams |
| `research/landscape.md` | `01-research/market/incumbents/00-phase1-landscape-summary.md` | Per-incumbent files from Stream D sit alongside it |
| `ideation/candidates.md` | `02-ideation/phase1-candidates-archive.md` | Preserved whole. Phase 2 candidates are a new numbered set; surviving Phase 1 concepts re-enter as candidates on equal terms |
| `ideation/ranking.md` | `02-ideation/phase1-ranking-archive.md` | Superseded by Phase 2 `ranking.md`, retained for the reasoning record |
| `ideation/recommended.md` | `02-ideation/phase1-recommended-archive.md` | Superseded; `Verdict` re-enters as a candidate, not an incumbent |
| `ideation/what-not-to-build.md` | `02-ideation/rejected.md` | Seeds the Phase 2 rejection register, which appends |

## Splits

`research/constraints.md` covered four unrelated domains and was split four ways:

| Section | Destination |
|---|---|
| §1 ED harm reduction (kill list, required baseline) | `01-research/constraints/ethics.md` |
| §2 Regulatory line + UK GDPR | `01-research/constraints/regulatory.md` |
| §3 Retention reality | `01-research/users/abandonment.md` |
| §4 Offline-first stack constraint | `01-research/technical/architecture-patterns.md` |

`research/data-and-segments.md` was two briefs in one file and was split two ways:

| Section | Destination |
|---|---|
| Half 1: food database comparison + moat verdict | `01-research/technical/data-sources.md` |
| Half 2: underserved segments | `01-research/users/segments/00-phase1-segment-survey.md` |

## Convention for extended documents

Each migrated document opens with a status banner naming the Wave 1 stream that will extend it and stating that Phase 1 content is retained rather than replaced. Each also carries an explicit **open questions** section listing what Phase 1 missed — these are the extending agent's targets, derived from `carryover.md` §2 and §3.

## Directories created empty, filled by Wave 1

`01-research/domain/` (exercise-science, nutrition-science, behaviour-change, measurement-validity) · `01-research/market/` (adjacent-products, failed-products, monetisation, per-incumbent files) · `01-research/technical/` (algorithms, build-vs-buy) · `01-research/users/` (jobs-to-be-done, per-segment files) · `01-research/constraints/licensing.md` · `02-ideation/candidates/` · `02-ideation/shortlist-deep-dives/` · `03-sources/`
