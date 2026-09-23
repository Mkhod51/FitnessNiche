# Testing guide

Tests are layered; passing a unit contract is not proof of a deployed workflow.

| layer | runner and examples | what it proves |
| --- | --- | --- |
| Pure domain | Vitest: `src/domain/*.test.ts` | Guards, e1RM qualification/bands, EWMA, volume, protein, reconciliation |
| Database/protocol | Vitest: `src/db/*.test.ts`, `src/sync/*.test.ts` | Migrations, persistence adapters, queueing, merge/tombstones, failure behavior |
| Component | Vitest + Testing Library: `src/features/**/*.test.tsx` | Consent, logging, target UI, advice, empty/noise/error states |
| Structural guard | `consent-enforcement.test.ts`, `guards-enforcement.test.ts`, `provenance.test.ts` | Source-level choke points that ordinary UI examples can miss |
| Generated content | `src/advice/claim-schema.test.ts`, `scripts/build-claims.test.ts`, `scripts/audit-claim-dois.test.ts` | Claim shape, cross-record invariants, reproducible bundle generation |
| Worker contract | Separate Vitest package under `app/server/` | Bearer auth, request validation, D1 batching/sequences, LWW |
| Browser | Playwright under `app/e2e/` | PWA boot, SQLite reload, offline writes, fallback persistence, core UI journeys |

## Focused commands

```bash
cd app
npm test -- --run src/domain/e1rm.test.ts
npm test -- --run src/sync src/guards-enforcement.test.ts src/consent-enforcement.test.ts
npm run e2e -- e2e/log-offline.spec.ts

cd server
npm test
```

Full app verification is `npm run typecheck`, `npm test -- --run`,
`npm run build`, then `npm run e2e`; run server typecheck/tests separately when
that package is in scope.

Playwright builds with Vite mode `e2e`. Only that mode exposes `window.__db`, an
escape hatch used to inspect real browser SQLite and migrations. Production
builds must not contain it; CI greps `dist/` and fails if `__db` leaked. A stale
local preview on port 4173 can hide the hatch by being reused—stop it and rerun.

Current boundaries: no Playwright run reaches a deployed Worker/D1, offline
tests return to `/` before reload because deep-route navigation fallback is
absent, camera scanning is mocked rather than hardware-tested, and fallback
snapshot tests do not prove tab-close durability. See
[feature status](../reference/feature-status.md).
