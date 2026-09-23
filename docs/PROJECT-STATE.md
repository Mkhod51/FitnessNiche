# Project state

**Updated:** 2026-09-23 · **Branch audited:** `codex/documentation-overhaul`

MyoStat is a working local-first React PWA with SQLite-WASM persistence,
workout/bodyweight/nutrition logging, honest trend/reconciliation calculations,
a deterministic claim-backed advice system, and optional Worker/D1 sync. This
is a compatibility ledger, not a declaration that every v1 requirement is done.

## Current baseline

| area | current state | authority |
| --- | --- | --- |
| Local app | Eight routes; core writes use on-device SQLite with OPFS preferred and IndexedDB-backed fallback | [system overview](architecture/system-overview.md), [feature status](reference/feature-status.md) |
| Advice | 32 generated claims / 36 citations; deterministic selection, search, data-earned snapshots, graded cards and contested Hub/search rendering | [advice engine](architecture/advice-engine.md), [claim workflow](guides/evidence-curation.md) |
| Training and signals | Workout/weight logging, e1RM regression/band, EWMA weight, fractional volume, weekly reconciliation | [domain algorithms](architecture/domain-algorithms.md) |
| Nutrition | Goal guards, local/quick food logging, CoFID seed, Open Food Facts search/barcode path, numbers-hidden on most sensitive surfaces | [feature tour](product/feature-tour.md) |
| Sync and rights | Optional bearer-auth push/pull with deterministic LWW; local JSON/CSV export and device erasure | [sync](architecture/sync.md), [safety/privacy](product/safety-privacy.md) |
| Verification | Vitest domain/component/structural/generated checks, separate Worker contract tests, and Playwright PWA/offline journeys | [testing guide](guides/testing.md) |

## Open compatibility gaps

| priority | gap |
| --- | --- |
| Product integrity | Claim corpus is 32 versus the roughly 50 target; the review ledger still has pending direct-source/reviewer work. |
| User journey | Hevy import is a tested parser only—no route, file picker, persistence integration, or browser flow. |
| Privacy | Numbers-hidden still reveals bodyweight figures on Hub and Log Weight; Goal intentionally reveals editable targets. |
| Data rights | “Delete all my data” erases this device only; no server/cross-device erasure exists. |
| Sync proof | Client and Worker contracts are tested, but no real browser→Worker→D1 end-to-end test exists. |
| Measurement | Weekly volume currently counts warm-up sets despite UI/source comments saying they are excluded. |
| Offline routing | Cached core flows work, but hard offline reload on deep routes such as `/train` lacks a navigation fallback. |
| Advice behavior | Workout selection reduces a contested cluster to one card; Hub rule cards consult cooldown history but do not record their own display. |

For exact requirement paths use [requirements traceability](reference/requirements-traceability.md).
Historical milestone narrative is preserved under
[archive/build-history](archive/build-history/README.md) and the
[pre-overhaul snapshot](archive/documentation-pre-overhaul-2026-09-19/README.md).
