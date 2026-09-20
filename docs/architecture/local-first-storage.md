# Local-first storage

**Status:** Current implementation behavior. “Local-first” means local SQLite is the primary write path; it does not mean every browser storage mode has identical durability.

## Storage modes

| Mode | SQLite database | Persistence path | User-visible state |
| --- | --- | --- | --- |
| `opfs-sahpool` | `/app.db` through SQLite's OPFS SAHPool VFS | SQLite writes directly to OPFS | Healthy mode is visually hidden, but retained in the DOM for diagnostics and browser tests |
| `memory-fallback` | `:memory:` | Best-effort whole-database export to one IndexedDB record | Visible warning: data loss is possible and saves are not guaranteed |

The storage mode is selected inside the dedicated [SQLite worker](../../app/src/db/sqlite.worker.ts), not by feature code. The worker first calls `installOpfsSAHPoolVfs({ name: 'etl-pool' })`; when that succeeds, it opens `/app.db`. Unsupported capabilities, private-mode restrictions, and pool-lock acquisition failure can reject that installation and enter fallback mode. A failure constructing the OPFS database after successful installation is allowed to fail boot rather than silently downgrade.

## Boot and database readiness

The boot path is deliberately ordered:

```text
main.tsx → App shell → initDb() → worker init/storage selection
         → ordered migrations → exercise seed → food seed → Drizzle proxy
```

- [`main.tsx`](../../app/src/main.tsx) registers the generated service worker and renders the app.
- The shell in [`App.tsx`](../../app/src/App.tsx) calls [`initDb()`](../../app/src/db/client.ts). `initDb()` caches its in-flight promise so parallel callers use one worker and one initialization run.
- The worker owns the SQLite connection and executes array-mode SQL sent through [`rpc.ts`](../../app/src/db/rpc.ts). Main-thread data access uses Drizzle's [`sqlite-proxy`](../../app/src/db/client.ts), whose callback maps `get` to one row and other methods to row arrays.
- [`runMigrations()`](../../app/src/db/migrate.ts) creates `_migrations`, reads applied names, and applies each missing migration in ascending order inside its own transaction. It records the migration only after its SQL succeeds.
- [`seedExercises()`](../../app/src/db/seed.ts) treats an exact catalogue count as complete; otherwise transactional `insert or replace` repairs an interrupted partial seed. `seedFoods()` transactionally upserts stable CoFID rows on every boot so source corrections reach existing installs without deleting cached non-CoFID foods.
- The Drizzle proxy is created only after migrations and both seeds complete. Failure clears the cached mode and initialization promise so later callers see a real retry rather than a half-initialized success.

The local schema and seed catalogues are described in the [data model](data-model.md).

## Why a second tab may use the fallback

The implementation treats the OPFS SAHPool as a single-connection resource. While one tab holds its pool lock, another same-origin tab may fail to acquire it and fall back to an independent in-memory database. This rationale is recorded in the [worker](../../app/src/db/sqlite.worker.ts), [snapshot module](../../app/src/db/snapshot.ts), and the [two-tab browser test](../../app/e2e/fallback-persistence.spec.ts).

Fallback is not live multi-tab access to `/app.db`. It restores the most recent **fallback** snapshot, if one exists; it does not clone or continuously mirror the OPFS database held by the first tab. The warning is therefore intentional: a fallback tab can contain different state and has weaker persistence.

## Snapshot lifecycle

Fallback durability uses one serialized copy of the whole SQLite database:

- IndexedDB database: `etl-snapshot`
- Object store: `db`
- Record key: `main`

At fallback boot, [`loadSnapshot()`](../../app/src/db/snapshot.ts) returns that byte array and the worker deserializes it into `:memory:`. If no snapshot exists, normal migrations and seeds initialize the empty in-memory database.

After a worker execution reports `changes > 0`, fallback mode schedules an export with a **0 ms trailing timeout**. A later changed execution cancels and replaces any still-pending timer; this is not a 250 ms debounce. Export uses `sqlite3_js_db_export`, then [`saveSnapshot()`](../../app/src/db/snapshot.ts) replaces the IndexedDB record. OPFS mode skips this entire export path.

When the document becomes hidden, [`client.ts`](../../app/src/db/client.ts) sends an explicit `flush` request. The worker cancels a pending timer, exports immediately, and awaits the IndexedDB write. Both the visibility handler and snapshot module swallow failures: fallback storage must not crash the app merely because IndexedDB is also unavailable.

### Durability boundary

The fallback is best-effort, not an “every write is durable on return” guarantee:

- the in-memory SQLite write can finish before its asynchronous IndexedDB snapshot;
- `visibilitychange` reduces the close-time window but a browser may tear down the page or worker before the async write commits;
- private browsing or storage failure can make IndexedDB unavailable, in which case the app continues with unsnapshotted memory;
- the browser test proves explicit flush → IndexedDB → reload → restore, and separately proves automatic snapshot after a 500 ms wait. It does **not** prove a real tab-close durability guarantee.

For that reason [`App.tsx`](../../app/src/App.tsx) visibly renders “data loss risk” whenever the worker reports `memory-fallback`. The warning is part of the product behavior, not debug output.

## Offline application assets

[`setupPwa()`](../../app/src/pwa.ts) registers the generated service worker immediately. [`vite.config.ts`](../../app/vite.config.ts) configures Workbox to precache `js`, `css`, `html`, icons, PNG, SVG, and `wasm`, with an 8 MiB per-file cap. WASM is explicit because it is outside Workbox's default pattern and SQLite cannot boot offline without it.

The browser coverage checks both that the generated `sw.js` precache contains a `.wasm` entry and that, after the service worker controls the page, the app can reload, read seeded data, and write SQLite while the network is disabled. See [PWA](../../app/e2e/pwa.spec.ts), [offline](../../app/e2e/offline.spec.ts), and [OPFS persistence](../../app/e2e/persistence.spec.ts) specs.

## Optional sync does not replace local storage

Every core write goes to local SQLite first. The optional sync layer later reads pending rows from `sync_meta`, exchanges them with a Cloudflare Worker, and merges accepted remote rows back into SQLite. A network failure leaves the pending queue intact. See [sync architecture](sync.md) and the local/remote comparison in the [data model](data-model.md#local-versus-remote-schema).
