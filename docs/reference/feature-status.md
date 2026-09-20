# Feature status

**Status:** current, dated implementation ledger. Last source audit: 2026-09-19.

This page owns mutable claims about what is implemented and verified. Requirements describe the target; historical plans and screenshots do not prove current behaviour.

## Status capsule

The current app implements a local training, nutrition, bodyweight, deterministic-advice, and weekly-review loop. Optional sync code and a Worker/D1 service are present. The main boundaries are:

| Area | Current state | Verification boundary | Target or gap |
| --- | --- | --- | --- |
| Claim corpus | 32 authored claim YAML files feed the generated bundle | Schema, generation, selection, and UI coverage exist | FR-CLAIM-1 / AC-6 target roughly 50 claims; the review ledger also remains a curation concern |
| Hevy import | `parseHevyCsv()` is implemented and unit-tested | No production caller, route, file input, or persistence flow | User-facing import is not shipped |
| Data erasure | Settings can export and hard-delete local records | The UI explicitly describes device-only erasure | No server-side or cross-device erasure path exists |
| Sync | Client protocol, deterministic merge, failure handling, auth, and Worker contracts are tested | No Playwright test performs a real browser-to-Worker/D1 replication exchange | Deployment integration remains unverified end to end |

These statements were checked against current source, tests, `docs/REQUIREMENTS.md`, and the 2026-09-19 feature/technical audits. Documentation Task 4 will expand this page into the canonical area-by-area matrix with code, tests, requirement IDs, and known gaps.

## Interpretation

Use only these implementation labels in the expanded matrix: `implemented`, `implemented but not user-wired`, `partial`, `planned`, and `out of scope`. Verification must be stated separately: a source implementation, a unit/contract test, a browser flow, and a deployed integration are different levels of evidence.
