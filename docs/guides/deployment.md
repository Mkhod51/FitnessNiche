# Deployment guide

The PWA and Worker are independently deployable. The default supported mode is
offline-only: build the static app without sync variables and all core local
flows remain available.

## Static PWA

```bash
cd app
npm ci
npm run build
```

Deploy `app/dist/` to an HTTPS static host. Preserve the generated Workbox
service worker and manifest. The Vite config deliberately precaches `.wasm` and
raises Workbox's asset limit to 8 MiB for SQLite; changing either can make an
installed app fail offline. The host must serve client routes appropriately:
the current service worker has no navigation fallback, so hard offline reloads
on routes such as `/train` remain a known gap.

Optional build variables:

| variable | use |
| --- | --- |
| `VITE_SYNC_URL` | Worker origin used for `POST /sync` |
| `VITE_SYNC_TOKEN` | Single-user bearer credential; Settings config overrides it |
| `VITE_FOOD_SEARCH_URL` | Worker origin for `POST /api/food/search` when cross-origin |

Embedding `VITE_SYNC_TOKEN` in a public build exposes it to that client. Prefer
the Settings-entered per-device value for a personal deployment.

## Worker and D1

The Worker package is `app/server/`. Apply `schema.sql` to the configured D1
database, bind it as `DB`, install `SYNC_TOKEN` as a Wrangler secret, set
`FOOD_SEARCH_ALLOWED_ORIGINS` when the PWA is cross-origin, then deploy. Use the
exact database creation, local/remote schema, secret, and Wrangler commands in
the [server README](../../app/server/README.md); do not improvise binding names.

Food search allows same-origin requests automatically. Cross-origin production
requests require an exact origin in the comma-separated allowlist. The endpoint
is POST-only, rate-limited in D1, and forwards only bounded search fields.

## Release checks and boundaries

- Run app typecheck, tests, production build, and Playwright; run Worker
  typecheck/tests separately. Confirm the production bundle contains no
  e2e-only `window.__db` symbol.
- Use HTTPS/TLS and never place health data or bearer tokens in URLs.
- Verify the deployed PWA can load its SQLite WASM and service-worker assets.
- There is no automated browser-to-deployed-Worker/D1 round trip today.
- Server-side erasure and cross-device deletion are not implemented; local
  “delete all data” cannot be represented as a normal sync tombstone.
- OPFS fallback persistence and real-device iOS storage remain platform checks,
  not guarantees supplied by deployment configuration.

See [sync architecture](../architecture/sync.md) and
[testing](testing.md).
