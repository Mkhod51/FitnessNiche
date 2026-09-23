# Requirements traceability

The [requirements](../REQUIREMENTS.md) define targets; this page points from
stable IDs to current implementation evidence. `Partial` means a named
acceptance path remains missing, even when substantial code exists.

## Family map

| IDs | state | implementation and tests | detailed reference / exact missing path |
| --- | --- | --- | --- |
| G1, G4 | Implemented | [ClaimCard](../../app/src/components/ClaimCard.tsx), [snapshot](../../app/src/advice/snapshot.ts), [component tests](../../app/src/components/ClaimCard.test.tsx), [review tests](../../app/src/features/review/Review.test.tsx) | [Advice engine](../architecture/advice-engine.md); data-earned claim path exists. |
| G2 | Partial | [logging](../../app/src/features/log/LogWorkout.tsx), [nutrition](../../app/src/features/nutrition/EatDay.tsx), [offline e2e](../../app/e2e/log-offline.spec.ts) | Hevy UI, warm-up volume exclusion, deep-route offline reload, and deployed sync round trip remain missing. |
| G3 | Partial | [authored claims](../../app/claims), [claim build tests](../../app/scripts/build-claims.test.ts) | 32 claims versus the roughly 50 target; curation ledger review remains incomplete. |
| NG1, NG2, NG3, NG4, NG5 | Enforced scope | [provenance check](../../app/src/provenance.test.ts), [guards](../../app/src/domain/guards.ts) | No runtime LLM/clinical/social/wearable/personal-MEV/native-store path; see [safety](../product/safety-privacy.md). |
| T1, T2, T3 | Implemented | [claim engine](../../app/src/advice/engine.ts), [e1RM](../../app/src/domain/e1rm.ts), [provenance tests](../../app/src/provenance.test.ts) | Workout advice still collapses contested clusters to one card; see [advice engine](../architecture/advice-engine.md). |
| T4, T5, T6 | Partial | [local DB](../../app/src/db/client.ts), [guards](../../app/src/domain/guards.ts), [Settings](../../app/src/features/settings/Settings.tsx) | Deep offline reload, complete numbers-hidden coverage, server erasure, and active support links remain open. |
| FR-LOG-1, FR-LOG-2, FR-LOG-3, FR-LOG-4 | Implemented/partial | [workout](../../app/src/features/log/LogWorkout.tsx), [weight](../../app/src/features/log/LogWeight.tsx), [food](../../app/src/features/nutrition/FoodPicker.tsx), [browser tests](../../app/e2e) | Weight feedback/numbers-hidden and deep-reload boundaries remain; see [feature status](feature-status.md). |
| FR-LOG-5 | Not user-wired | [Hevy parser](../../app/src/features/import/hevy.ts), [parser tests](../../app/src/features/import/hevy.test.ts) | No route, file picker, consent-wrapped UI, persistence adapter, or e2e flow. |
| FR-LOG-6 | Partial | [local seed](../../app/src/db/seed-foods.ts), [OFF adapter](../../app/src/food/off.ts), [food tests](../../app/src/features/nutrition/FoodPicker.test.tsx) | Small CoFID seed; USDA fallback absent; real-camera path not verified. |
| FR-SIG-1, FR-SIG-2, FR-SIG-4, FR-SIG-5 | Implemented | [domain](../../app/src/domain), [domain tests](../../app/src/domain) | Sufficiency and non-claims: [domain algorithms](../architecture/domain-algorithms.md). |
| FR-SIG-3 | Partial | [volume](../../app/src/domain/volume.ts), [tests](../../app/src/domain/volume.test.ts) | Warm-up sets currently count in weekly volume. |
| FR-ADV-1, FR-ADV-2, FR-ADV-3, FR-ADV-4, FR-ADV-5, FR-ADV-7, FR-ADV-8, FR-ADV-9 | Implemented | [advice source](../../app/src/advice), [advice tests](../../app/src/advice), [browser advice](../../app/e2e/advice.spec.ts) | Hub rule cards consult cooldown but do not record display. |
| FR-ADV-6 | Partial | [cluster rendering](../../app/src/components/ClaimCard.tsx), [tests](../../app/src/components/ClaimCard.test.tsx) | Hub/search show both sides; the single-card workout path does not. |
| FR-CLAIM-1, FR-CLAIM-4, AC-6 | Partial | [claim YAML](../../app/claims), [review ledger](../../app/claims/review-ledger.json) | 32/roughly 50 target; pending review/direct-source/sign-off work remains. |
| FR-CLAIM-2, FR-CLAIM-3, FR-CLAIM-5 | Implemented structurally | [schema](../../app/src/advice/claim-schema.ts), [generator](../../app/scripts/build-claims.ts), [tests](../../app/src/advice/claim-schema.test.ts) | Structural/DOI validation does not prove literature truth. |
| FR-ONB-1, FR-ONB-2, FR-ONB-3 | Implemented | [consent](../../app/src/features/onboarding/ConsentGate.tsx), [goal](../../app/src/features/nutrition/GoalSetup.tsx), [tests](../../app/src/features/onboarding/ConsentGate.test.tsx) | Consent structural scan is deliberately limited to logging/import screen files. |
| NFR-1, NFR-3, NFR-7 | Partial | [PWA config](../../app/vite.config.ts), [persistence e2e](../../app/e2e/persistence.spec.ts), [offline e2e](../../app/e2e/offline.spec.ts) | No offline navigation fallback for hard reloads; fallback tab-close durability is not guaranteed. |
| NFR-2 | Partial | [sync client](../../app/src/sync/sync.ts), [Worker](../../app/server/src/sync.ts), [tests](../../app/src/sync/sync.test.ts) | Current code orders row conflicts by device `updatedAt` and pulls by server sequence; the requirement's “server timestamp” wording is legacy. No browser-to-D1 e2e. |
| NFR-4, NFR-5 | Partial | [export/erase](../../app/src/db/export.ts), [POST sync](../../app/src/sync/sync.ts), [tests](../../app/src/db/export.test.ts) | Local export/erasure exists; server/cross-device erasure and formal DPIA/ICO launch work remain. |
| NFR-6 | Partial | [UI source](../../app/src/features), [component/browser tests](../../app/e2e) | No complete WCAG audit is recorded. |
| NFR-8 | Implemented | [claim YAML](../../app/claims), [generator](../../app/scripts/build-claims.ts) | Adding/regrading a claim is data generation, not runtime code. |
| DM-USER, DM-EXERCISE, DM-WORKOUT, DM-SET, DM-WEIGHT, DM-FOODLOG, DM-FOODITEM, DM-ADVICE-EVENT, DM-SYNCMETA | Implemented | [schema](../../app/src/db/schema.ts), [migrations](../../app/src/db/migrations), [migration tests](../../app/src/db/migrate.test.ts) | Runtime shape intentionally differs from indicative requirement field lists in places. |
| DM-CLAIM, DM-CITATION | Implemented | [types](../../app/src/advice/types.ts), [schema tests](../../app/src/advice/claim-schema.test.ts) | Corpus-size/editorial-review gaps are tracked above. |
| GR-1, AC-5 | Partial | [guards](../../app/src/domain/guards.ts), [adversarial tests](../../app/src/domain/guards.test.ts), [structural tests](../../app/src/guards-enforcement.test.ts) | Floors/cap/default are enforced; Hub and Log Weight still leak figures in numbers-hidden mode. |
| GR-2, GR-3, GR-4, GR-6, AC-4 | Implemented boundaries | [provenance](../../app/src/provenance.test.ts), [evidence UI](../../app/src/components/EvidencePanel.tsx), [domain algorithms](../architecture/domain-algorithms.md) | Editorial review is ongoing; no publisher figures or individualized MEV/MRV path exists. |
| GR-5 | Partial | [consent](../../app/src/features/onboarding/ConsentGate.tsx), [export/erase](../../app/src/db/export.ts) | Server erasure and complete data-rights deployment work are missing. |
| AC-1 | Partial | [offline logging e2e](../../app/e2e/log-offline.spec.ts), [sync contract tests](../../app/server/src/index.test.ts) | Offline write survives; reconnect sync lacks a real browser→Worker→D1 acceptance test. |
| AC-2 | Implemented | [e1RM](../../app/src/domain/e1rm.ts), [trend UI](../../app/src/components/TrendChart.tsx), [tests](../../app/src/domain/e1rm.test.ts) | Eight qualifying observations are required. |
| AC-3 | Implemented | [snapshot](../../app/src/advice/snapshot.ts), [review](../../app/src/features/review/Review.tsx), [tests](../../app/src/features/review/Review.test.tsx) | Data-earned advice uses stored claims; current corpus breadth remains limited. |

Architecture targets TA-1, TA-2, TA-3, TA-4, and TA-5 map respectively to the
[PWA/local storage](../architecture/local-first-storage.md),
[sync](../architecture/sync.md), and [advice](../architecture/advice-engine.md)
references. Mutable user-facing detail belongs in [feature status](feature-status.md).
