# Development guide

Use **Node.js 24**, matching [CI](../../.github/workflows/ci.yml). The PWA and
optional Worker are separate npm packages with separate lockfiles.

```bash
cd app
npm ci
npm run dev

# Only when changing the Worker/D1 service
cd server
npm ci
npm run dev
```

## Commands

Run app commands from `app/`:

| command | purpose |
| --- | --- |
| `npm run dev` / `npm run preview` | Vite development server / built preview |
| `npm run typecheck` | App and Vite configuration TypeScript checks |
| `npm test -- --run` | One non-watch Vitest run |
| `npm run build` | Typecheck, then production Vite/PWA build |
| `npm run e2e` | Playwright browser suite |
| `npm run claims` | Validate YAML claims and regenerate `src/generated/claims.ts` |
| `npm run claims:audit-dois` | Audit claim DOI resolution/shape |

Worker commands from `app/server/` are `npm run typecheck`, `npm test`,
`npm run dev`, and `npm run deploy`.

## Configuration

`VITE_SYNC_URL` and `VITE_SYNC_TOKEN` are optional development/build fallbacks;
Settings-entered sync configuration takes precedence. `VITE_FOOD_SEARCH_URL`
points browser food search at the Worker when app and Worker do not share an
origin. The Worker receives the `SYNC_TOKEN` secret, D1 `DB` binding, and an
optional comma-separated `FOOD_SEARCH_ALLOWED_ORIGINS` value. Do not commit
tokens or put health data in URLs.

## Repository conventions

- Keep `src/domain/` pure and framework-free. Keep deterministic claim
  selection/validation in `src/advice/`; React belongs in components/features.
- All target setting goes through `src/domain/guards.ts`. All advice keeps a
  stored claim id and renders grade/citation from the claim record.
- Add a claim by editing `app/claims/*.yaml`, following
  [ADDING-A-CLAIM](../../app/claims/ADDING-A-CLAIM.md), then run `npm run claims`
  and review the generated diff. The runtime never calls scholarly APIs.
- Preserve local-first behavior, soft-delete synced rows, and call
  `markPending` after user-data mutations.
- Keep research/archive history intact. Current status belongs in
  [feature status](../reference/feature-status.md), not in old milestone plans.

See [testing](testing.md), [deployment](deployment.md), and the
[repository map](../reference/repository-map.md).
