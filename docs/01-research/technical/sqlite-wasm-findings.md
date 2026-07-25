# SQLite-WASM + Drizzle + vite-plugin-pwa — Technical Findings

Research date: 2026-07-24. Scope: offline-first PWA (Vite + React 18 + TS), iOS Safari + Android Chrome, solo dev. Locked deps: `@sqlite.org/sqlite-wasm`, `drizzle-orm`, `vite-plugin-pwa`.

---

## 1. VFS choice — `opfs` vs `opfs-sahpool`

| | `opfs` | `opfs-sahpool` |
|---|---|---|
| COOP/COEP required | **Yes** — needs `SharedArrayBuffer`, which needs cross-origin isolation headers (`Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`) | **No** — this is its main selling point |
| Thread | Worker-only (main thread cannot use it) | Worker-only (same restriction — SAHPool does not escape the worker requirement, it only escapes the COOP/COEP requirement) |
| How it avoids the worker-only `createSyncAccessHandle` restriction | It doesn't — it runs in a worker | It pre-opens a **pool** of `SyncAccessHandle`s against a fixed set of pre-allocated OPFS files at VFS-install time (also in a worker), so it never needs to open new handles mid-transaction. This sidesteps needing `SharedArrayBuffer`/Atomics for cross-thread proxying (which is what `opfs` needs COOP/COEP for), not the worker requirement itself. |
| Multi-tab / multi-connection | Locking is exclusive per DB file; only one connection across all tabs/origins can hold it at a time; the lib retries on contention | Explicitly **does not support multiple simultaneous connections** — one tab holds the pool at a time. Cooperative multi-tab (pause/release, added ~v3.50) exists but is a manual, non-trivial pattern, not "just works." |
| Performance | Baseline | "Easily the highest OPFS performance of the options" per official docs — no cross-thread Atomics proxy overhead |
| iOS Safari | **Broken below iOS 17** — official docs cite a bug in Safari's sub-worker storage handling with "no available workaround" | Works from **Safari 16.4+** (Mar 2023), since it only needs `createSyncAccessHandle` (sync since 16.4) inside a single worker, not the full multi-worker OPFS access pattern |

**iOS-specific risk detail:**
- `FileSystemSyncAccessHandle` methods became synchronous in Safari 16.4 / Chrome 108 / Firefox 111 — this is the hard floor for either VFS on iOS.
- Plain `opfs` VFS is documented as unusable on iOS Safari < 17 due to a WebKit sub-worker bug — no workaround exists, so `opfs` is a bigger iOS gamble even ignoring the COOP/COEP requirement.
- Safari (in-browser, not installed-to-homescreen) evicts script-writable storage — including, per general Storage API eviction rules, IndexedDB/OPFS-backed data — after **7 days of no user interaction with the origin**; each visit resets the counter. Apps added to the iOS home screen run outside Safari's tab lifecycle and are believed to have separate/longer persistence, but this project cannot assume users install to home screen. (unverified: whether OPFS specifically is swept by the same 7-day ITP rule as IndexedDB/localStorage — widely reported for IndexedDB/localStorage, not confirmed by Apple docs specifically naming OPFS.)
- Safari **Private Browsing** does not support OPFS at all (per PowerSync's 2026 survey) — any fallback path must handle this.
- There have been reports (e.g. Eclipse Theia issue #16107) of Safari OPFS being able to read but not reliably create/write files in some conditions — treat as a known flaky area, not fully verified against current Safari versions (unverified, unclear if still reproducible).

### Verdict
Use **`opfs-sahpool`**. It is the only option that (a) avoids COOP/COEP — which a solo dev otherwise has to configure on every hosting layer including any CDN/edge in front of the PWA, a real ongoing maintenance cost — and (b) has the better iOS floor (16.4+ vs the `opfs` VFS's iOS-17-or-broken situation). The cost is single-connection-at-a-time semantics, which is an acceptable trade for a single-user offline-first fitness app (no expectation of the same user's data being written from two tabs simultaneously). Still must run inside a dedicated Worker.

---

## 2. Exact init code

Package: `@sqlite.org/sqlite-wasm` (official ES Module wrapper, published by the SQLite project). Browser-only — "no plans to support non-browser JS environments" (per official npm.md docs).

```bash
npm install @sqlite.org/sqlite-wasm
```

Everything OPFS-related — including SAHPool — **must run in a Worker**; the main thread only gets a transient in-memory `sqlite3.oo1.DB`. The official README code samples confirmed via docs:

**worker.js**
```js
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

const log = (...args) => console.log(...args);
const error = (...args) => console.error(...args);

const start = async (sqlite3) => {
  log('Running SQLite3 version', sqlite3.version.libVersion);

  // Preferred path: OPFS SyncAccessHandle Pool VFS — no COOP/COEP needed.
  const poolUtil = await sqlite3.installOpfsSAHPoolVfs({
    name: 'fitness-app-pool', // isolates this app's pool from others on same origin
  });

  const db = new poolUtil.OpfsSAHPoolDb('/fitness.sqlite3');
  // db now behaves like sqlite3.oo1.DB but persists via SAHPool.
  return db;
};

const initializeSQLite = async () => {
  try {
    const sqlite3 = await sqlite3InitModule({ print: log, printErr: error });
    const db = await start(sqlite3);
    // ... expose db over RPC to the main thread from here
  } catch (err) {
    error('Initialization error:', err.name, err.message);
  }
};

initializeSQLite();
```

> Note: `installOpfsSAHPoolVfs` and the resulting `poolUtil.OpfsSAHPoolDb` constructor name are documented in the SQLite project's own `sqlite3-opfs-async-proxy`/SAHPool API surface referenced from `persistence.md` and the wasm API index; I could not pull the literal SAHPool code block from the README mirror I fetched (it 403'd on raw GitHub and the rendered version didn't include that section in the extracted text) — **verify the exact method name (`installOpfsSAHPoolVfs` vs `sqlite3.installOpfsSAHPoolVfs`) against `node_modules/@sqlite.org/sqlite-wasm/sqlite-wasm/jswasm/sqlite3.js` comments or the live `sqlite3/doc` bundle before wiring it up** — treat the call shape above as **(unverified exact API surface, verify against installed package)**, everything else on this page (VFS behavior/support matrix) is confirmed from official docs.

**Main thread → Worker RPC shape** (since the DB instance can't cross the thread boundary):
```js
// main.ts
const worker = new Worker(new URL('./sqlite-worker.ts', import.meta.url), { type: 'module' });

function query(sql, params = []) {
  const id = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const onMsg = (e) => {
      if (e.data.id !== id) return;
      worker.removeEventListener('message', onMsg);
      e.data.error ? reject(new Error(e.data.error)) : resolve(e.data.result);
    };
    worker.addEventListener('message', onMsg);
    worker.postMessage({ id, sql, params });
  });
}
```
```js
// sqlite-worker.ts (inside the `start`/`initializeSQLite` above, after db is ready)
self.onmessage = async (e) => {
  const { id, sql, params } = e.data;
  try {
    const result = db.exec({ sql, bind: params, returnValue: 'resultRows', rowMode: 'object' });
    self.postMessage({ id, result });
  } catch (err) {
    self.postMessage({ id, error: String(err) });
  }
};
```
This RPC shape is exactly what `drizzle-orm/sqlite-proxy` expects on the other end (see §4).

---

## 3. Vite config gotchas

Confirmed from official docs + community-reported Vite issues:

```ts
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'], // required — do not let esbuild pre-bundle it
  },
  server: {
    headers: {
      // Only needed if you ALSO want the plain `opfs` VFS or SharedArrayBuffer anywhere.
      // Not required for opfs-sahpool.
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  worker: {
    format: 'es', // sqlite-wasm's worker build is an ES module
  },
});
```

Known issues:
- `optimizeDeps.exclude` is required both for dev and build — without it, esbuild's dependency pre-bundling breaks the package's internal worker/wasm loading (`sqlite-wasm` is called out by name in Vite tracking issues about this class of problem, e.g. vitejs/vite#11672-adjacent worker/wasm pre-bundling issues).
- Vite has had general (not sqlite-wasm-specific) bugs around `new Worker(new URL(..., import.meta.url))` inside **pre-bundled** dependencies (see vitejs/vite PR #17837, merged fix) — another reason to keep this package out of `optimizeDeps` pre-bundling entirely rather than relying on a fixed Vite version.
- Since the SAHPool path doesn't need COOP/COEP, you can skip that server-header config entirely for this project — one less cross-cutting concern (those headers also break loading of any cross-origin iframe/image that isn't itself CORP/CORS-compliant, so skipping them is a real simplification, not just a nice-to-have).
- No `assetsInclude` entry was needed in current docs/examples — the package's own build handles `.wasm` loading; you do NOT need `vite-plugin-wasm` or `vite-plugin-top-level-await` for `@sqlite.org/sqlite-wasm` specifically (those are for hand-rolled wasm imports).

---

## 4. Drizzle integration

`drizzle-orm/sqlite-proxy` is the correct fit — it's designed exactly for "SQL execution happens somewhere async and out-of-process from the ORM," which is precisely the Worker+RPC situation here.

```ts
// db/client.ts
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from './schema';

const worker = new Worker(new URL('./sqlite-worker.ts', import.meta.url), { type: 'module' });

function rpc(sql: string, params: unknown[], method: 'all' | 'run' | 'get' | 'values') {
  const id = crypto.randomUUID();
  return new Promise<any>((resolve, reject) => {
    const onMsg = (e: MessageEvent) => {
      if (e.data.id !== id) return;
      worker.removeEventListener('message', onMsg);
      e.data.error ? reject(new Error(e.data.error)) : resolve(e.data.result);
    };
    worker.addEventListener('message', onMsg);
    worker.postMessage({ id, sql, params, method });
  });
}

export const db = drizzle(
  async (sql, params, method) => {
    const rows = await rpc(sql, params, method);
    // drizzle-orm/sqlite-proxy contract: return { rows: string[] } for 'get'/'run',
    // or { rows: string[][] } for 'all'/'values'.
    return { rows };
  },
  { schema },
);
```

**Migrations — no official browser path exists.** `drizzle-kit` only generates SQL files + a `_journal.json` for filesystem/Node use; there is an **open, unresolved** feature request (drizzle-team/drizzle-orm#1009, "Running Migrations in the Browser for Local-First Apps") asking for first-class support — as of this research it has no merged solution. The community workaround (documented in that issue) is DIY:

1. Run `drizzle-kit generate` normally (produces `drizzle/0000_xxx.sql`, `drizzle/meta/_journal.json`).
2. Write a small script/module that imports each migration file with Vite's `?raw` suffix (so it's inlined as a string at build time) plus the journal, and re-implements Drizzle's `migrate()` runner using `Web Crypto` instead of `node:crypto` (for the migration-hash bookkeeping) and no `node:fs` (content is passed directly, not read from disk).
3. Run that runner once at app boot, before the app opens its first real connection, tracking applied hashes in a `__drizzle_migrations` table inside the same SQLite DB (mirroring what Drizzle's Node runner does).

```ts
// migrations/apply.ts (sketch — no official Drizzle browser migrator to import)
import migration0000 from '../drizzle/0000_init.sql?raw';
import journal from '../drizzle/meta/_journal.json';

export async function applyMigrations(execRaw: (sql: string) => Promise<void>) {
  await execRaw(`CREATE TABLE IF NOT EXISTS __drizzle_migrations (
    id INTEGER PRIMARY KEY, hash TEXT NOT NULL, created_at INTEGER NOT NULL)`);
  const applied = new Set(/* query __drizzle_migrations for existing hashes */);
  const migrations = [migration0000 /* , migration0001, ... */];
  for (let i = 0; i < journal.entries.length; i++) {
    const hash = await sha256(migrations[i]); // Web Crypto subtle.digest
    if (applied.has(hash)) continue;
    await execRaw(migrations[i]);
    await execRaw(`INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)`);
  }
}
```

### Verdict
`sqlite-proxy` is the right driver — confirmed fit for the Worker/RPC architecture. Migrations are **not** an official/turnkey feature: budget time to hand-roll the raw-import + custom-runner pattern above; treat drizzle-orm#1009 as the thing to watch (if it lands mid-build, swap in the official version).

---

## 5. vite-plugin-pwa + wasm precache

Confirmed from official vite-pwa docs:
- By default the plugin's Workbox `globPatterns` **only include `css`, `js`, `html`** — a `.wasm` file will silently NOT be precached unless you add it.
- Workbox has a `maximumFileSizeToCacheInBytes` ceiling; files over that size are skipped with a warning, and **since vite-plugin-pwa v0.20.2 that warning is promoted to a hard build error**. The sqlite-wasm binary (~1–1.6MB typically) is well within Workbox's own default (2 MiB) in older workbox versions but this default is not guaranteed across versions/plugin defaults — set it explicitly to be safe rather than relying on the ambient default (unverified: exact current numeric default for the workbox-build version vite-plugin-pwa pins — set explicitly rather than assume).

```ts
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,wasm}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB — headroom over the ~1-1.6MB wasm binary
      },
    }),
  ],
});
```
Also confirm the worker script itself (`sqlite-worker.ts` bundled output) is covered by `globPatterns` — it's `.js`, already included by default, but worth eyeballing the generated `dist` manifest (`dist/sw.js` precache list) after build to make sure both the worker chunk and the `.wasm` asset appear, since the wasm file may be emitted under a hashed name Vite's asset pipeline controls, and Workbox precaches by matching the built output paths, not source paths.

### Verdict
Two explicit config changes are non-optional: extend `globPatterns` to include `wasm` (and ideally `json` for the migration journal if it's fetched rather than inlined), and raise `maximumFileSizeToCacheInBytes` above the wasm binary's actual built size. Skipping either means the app works online but fails "fully offline on first reload" — the exact requirement in this build plan.

---

## 6. Fallback (no OPFS/SAHPool available)

Realistic triggers: iOS Safari Private Browsing (no OPFS at all), or any browser predating the Safari 16.4 / Chrome 108 / Firefox 111 sync-handle floor.

Options evaluated:

- **`kvvfs`** (localStorage/sessionStorage-backed): main-thread only (not usable from the Worker at all — `localStorage`/`sessionStorage` aren't exposed to Workers), ~5MB typical browser storage-area limit, and SQLite's own docs note the *effective* usable space is smaller still because kvvfs stores page data as JS strings (2-byte encoding overhead). One DB per storage object max. This is real persistence, but the capacity is too small for a relational store meant to hold structured training/nutrition history over time, and the main-thread-only constraint conflicts with the Worker-centric architecture already being built for the primary path.
- **In-memory DB + periodic export to IndexedDB** via `sqlite3.capi.sqlite3_js_db_export(db)` (confirmed real API, code sample in official cookbook) to get a `Uint8Array` snapshot, stored as a blob in IndexedDB, and reloaded via `sqlite3_deserialize`/reading the ArrayBuffer back into a fresh `:memory:` DB on boot. IndexedDB itself is broadly supported (including Safari Private Browsing has historically blocked or restricted IndexedDB too — verify per browser/mode) and gives much larger quota than kvvfs.
- **wa-sqlite's `IDBBatchAtomicVFS`** (third-party, not `@sqlite.org/sqlite-wasm`) — out of scope since the VFS is locked to the official package, but PowerSync's 2026 survey names it as the community-standard "no COOP/COEP, no OPFS" fallback; mentioned here for awareness only, not a recommendation given the locked dependency choice.

### Verdict
Use **in-memory DB + periodic/on-write export to IndexedDB via `sqlite3_js_db_export`**, gated behind an OPFS-SAHPool-availability check at boot (`'opfs' in sqlite3` / feature-detect before calling `installOpfsSAHPoolVfs`). Cost: every write needs a debounced export step (e.g. export on `visibilitychange`/`beforeunload` plus a periodic timer, not on every single statement, to avoid serializing the whole DB constantly), and a crash/tab-kill between the last write and the next export can lose that window's data — document this as a known gap (a `ponytail`-style tradeoff: acceptable for a solo-dev v1, revisit with a write-ahead export-on-transaction-commit hook if data-loss reports come in). This path only needs to exist for the eviction/Private-Browsing edge case, not as the primary storage engine — most users on modern iOS Safari (16.4+, not Private mode) and Android Chrome get the full SAHPool path.

---

## Sources

- [Persistent Storage Options — sqlite.org/wasm](https://sqlite.org/wasm/doc/trunk/persistence.md)
- [Node Package Manager (npm) — sqlite.org/wasm](https://sqlite.org/wasm/doc/trunk/npm.md)
- [Cookbook — sqlite.org/wasm](https://sqlite.org/wasm/doc/trunk/cookbook.md)
- [Project News — sqlite.org/wasm](https://sqlite.org/wasm/doc/trunk/news.md)
- [sqlite/sqlite-wasm README — GitHub](https://github.com/sqlite/sqlite-wasm/blob/main/README.md)
- [@sqlite.org/sqlite-wasm — npm](https://www.npmjs.com/package/@sqlite.org/sqlite-wasm)
- [The Current State Of SQLite Persistence On The Web: May 2026 Update — PowerSync](https://powersync.com/blog/sqlite-persistence-on-the-web)
- [SQLite Wasm in the browser backed by OPFS — Chrome for Developers](https://developer.chrome.com/blog/sqlite-wasm-in-the-browser-backed-by-the-origin-private-file-system)
- [The File System API with Origin Private File System — WebKit blog](https://webkit.org/blog/12257/the-file-system-access-api-with-origin-private-file-system/)
- [WebKit Features in Safari 16.4 — WebKit blog](https://webkit.org/blog/13966/webkit-features-in-safari-16-4/)
- [Safari 16.4 Release Notes — Apple Developer](https://developer.apple.com/documentation/safari-release-notes/safari-16_4-release-notes)
- [Storage quotas and eviction criteria — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [What Safari's 7-day cap on script-writeable storage means for PWA developers — Search Engine Land](https://searchengineland.com/what-safaris-7-day-cap-on-script-writeable-storage-means-for-pwa-developers-332519)
- [Drizzle ORM — Drizzle Proxy docs](https://orm.drizzle.team/docs/connect-drizzle-proxy)
- [drizzle-team/drizzle-orm#1009 — Running Migrations in the Browser for Local-First Apps](https://github.com/drizzle-team/drizzle-orm/issues/1009)
- [Service Worker Precache — Vite PWA guide](https://vite-pwa-org.netlify.app/guide/service-worker-precache.html)
- [Workbox Options — vite-plugin-pwa DeepWiki](https://deepwiki.com/vite-pwa/vite-plugin-pwa/4.3-workbox-options)
- [vitejs/vite PR #17837 — Worker/wasm pre-bundling fix](https://github.com/vitejs/vite/pull/17837)
- [Eclipse Theia issue #16107 — Safari OPFS read/write inconsistency (unverified reproducibility)](https://github.com/eclipse-theia/theia/issues/16107)
- [GitHub - birchill/nice-sqlite-wasm (opfs-sahpool-only custom build, for context)](https://github.com/birchill/nice-sqlite-wasm/)
