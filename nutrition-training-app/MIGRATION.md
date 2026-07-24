# Phase 3 Housekeeping Migration

Documents the repo reorganisation done at the start of Phase 3 (thesis review). The prior Phase 1 → Phase 2 migration is separately documented in `00-meta/migration-map.md` — this file only covers the Phase 3 changes.

| Old path | New path | Why |
|---|---|---|
| `research/constraints.md` | removed (duplicate) | Byte-identical to `04-sources/raw-notes/phase1/constraints.md`; redundant leftover |
| `research/data-and-segments.md` | removed (duplicate) | Byte-identical to `04-sources/raw-notes/phase1/data-and-segments.md`; redundant leftover |
| `research/` (dir) | removed | Emptied by the two removals above |
| sources dir (was numbered `03-`) | `04-sources/` | Freed the `03-` prefix for the new `03-thesis-review/` output dir; number collision otherwise |
| `02-ideation/phase1-candidates-archive.md` | `archive/phase1-ideation/candidates.md` | Consolidated superseded Phase 1 ideation output into one archive dir |
| `02-ideation/phase1-ranking-archive.md` | `archive/phase1-ideation/ranking.md` | Consolidated superseded Phase 1 ideation output into one archive dir |
| `02-ideation/phase1-recommended-archive.md` | `archive/phase1-ideation/recommended.md` | Consolidated superseded Phase 1 ideation output into one archive dir |
| `02-ideation/shortlist-deep-dives/` (empty, untracked) | removed | Unused placeholder dir |
| — | `03-thesis-review/` (new, with `.gitkeep`) | Reserved output location for Phase 3 |

Additionally, all 9 files that referenced the old sources dir path were updated to point at `04-sources`: `01-research/constraints/ethics.md`, `01-research/constraints/regulatory.md`, `01-research/users/segments/00-phase1-segment-survey.md`, `01-research/users/abandonment.md`, `01-research/technical/architecture-patterns.md`, `01-research/technical/data-sources.md`, `04-sources/raw-notes/stream-c1-notes.md`, `00-meta/migration-map.md`, `00-meta/decision-log.md`. `00-meta/migration-map.md` was also updated to point its three archive-file references at the new `archive/phase1-ideation/` paths, with a note on the consolidation.
