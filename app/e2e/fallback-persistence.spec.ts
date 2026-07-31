import { test, expect } from '@playwright/test';

// D6: OPFS SAHPool is single-connection. A second tab on the same origin
// can't acquire the pool lock and the worker falls back to
// `new sqlite3.oo1.DB(':memory:')` — which has no persistence of its own.
// This proves the IndexedDB snapshot (src/db/snapshot.ts) actually closes
// that gap: a write made in the fallback tab must survive that tab reloading.
//
// Note on how the flush is triggered here: a real tab close fires
// visibilitychange -> hidden correctly (verified manually while building
// this test — the worker does receive the flush request), but Playwright's
// scripted page.close() tears the page and its worker down so fast that the
// async IndexedDB write racing that teardown is unreliable in this harness,
// regardless of how long the page sat idle first. That race is a property
// of how quickly a *scripted* close reaps the renderer, not a bug in the
// flush itself: manually firing visibilitychange while the page stays open
// reliably produces a committed snapshot within milliseconds. So instead of
// a close-timing race that would make this test flaky, `window.__db.flush()`
// (an e2e-only hatch, see client.ts) calls the exact same code path the
// visibilitychange handler calls, deterministically, and this test reloads
// afterwards rather than closing — which still exercises the real
// export -> IndexedDB -> reload -> restore -> deserialize path end to end.

type Hatch = { execSql: (sql: string, params?: unknown[], method?: string) => Promise<unknown[][]>; flush: () => Promise<void> };

async function readProbe(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(async () => {
    const { execSql } = (window as unknown as { __db: Hatch }).__db;
    const rows = await execSql(
      'select pending_since from sync_meta where table_name = ?',
      ['fallback-persistence-probe'],
      'all',
    );
    return rows.map((r: unknown[]) => String(r[0]));
  });
}

test('a write made in a fallback (second) tab survives a reload', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByTestId('storage-mode')).toHaveText('opfs-sahpool');

  // Second tab, same origin, same context (same storage partition) — the
  // first tab is still holding the OPFS SAHPool lock, so this one can't get
  // it and drops to memory-fallback, same as the real second-tab bug found
  // during M1.
  const second = await context.newPage();
  await second.goto('/');
  // D7's data-loss warning wraps the mode in prose rather than rendering it
  // bare (only opfs-sahpool, the durable mode, is shown as-is) — match that.
  await expect(second.getByTestId('storage-mode')).toContainText('memory-fallback', { timeout: 15_000 });

  await second.evaluate(async () => {
    const { execSql } = (window as unknown as { __db: Hatch }).__db;
    await execSql(
      'insert or replace into sync_meta (table_name, row_id, pending_since) values (?, ?, ?)',
      ['fallback-persistence-probe', '1', 'ok'],
      'run',
    );
  });

  // Force the same export the visibilitychange handler would fire on tab
  // close — see the file-level note on why this beats racing a scripted close.
  await second.evaluate(async () => {
    const { flush } = (window as unknown as { __db: Hatch }).__db;
    await flush();
  });

  await second.reload();
  // The first tab is still open, so the reloaded second tab falls back again
  // — this reload must restore from the snapshot the flush above wrote out.
  await expect(second.getByTestId('storage-mode')).toContainText('memory-fallback', { timeout: 15_000 });
  expect(await readProbe(second)).toEqual(['ok']);
});

test('a write also survives once the debounced export fires on its own (no explicit flush)', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByTestId('storage-mode')).toHaveText('opfs-sahpool');

  const second = await context.newPage();
  await second.goto('/');
  await expect(second.getByTestId('storage-mode')).toContainText('memory-fallback', { timeout: 15_000 });

  await second.evaluate(async () => {
    const { execSql } = (window as unknown as { __db: Hatch }).__db;
    await execSql(
      'insert or replace into sync_meta (table_name, row_id, pending_since) values (?, ?, ?)',
      ['fallback-persistence-probe-2', '1', 'ok'],
      'run',
    );
  });

  // The worker's trailing debounce is ~250ms — wait it out without ever
  // calling flush(), to prove the automatic (non-visibilitychange) path works.
  await second.waitForTimeout(500);
  await second.reload();
  await expect(second.getByTestId('storage-mode')).toContainText('memory-fallback', { timeout: 15_000 });

  const rows = await second.evaluate(async () => {
    const { execSql } = (window as unknown as { __db: Hatch }).__db;
    const rows = await execSql(
      'select pending_since from sync_meta where table_name = ?',
      ['fallback-persistence-probe-2'],
      'all',
    );
    return rows.map((r: unknown[]) => String(r[0]));
  });
  expect(rows).toEqual(['ok']);
});
