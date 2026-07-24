import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stand in for the real worker constructor — these are jsdom unit tests,
// there's no OPFS or real worker thread here. We only care how many times
// `new Worker(...)` (via createRpc) gets invoked.
class FakeWorker {
  terminate() {}
}
(globalThis as unknown as { Worker: unknown }).Worker = FakeWorker;

vi.mock('./rpc', () => ({
  createRpc: vi.fn(() => ({
    // Resolve on a microtask delay so two concurrent initDb() calls actually
    // race each other instead of one finishing before the other starts.
    init: () => new Promise((resolve) => setTimeout(() => resolve('opfs-sahpool'), 5)),
    // initDb now runs migrations right after init, which selects rows and
    // .maps() them — an empty result set keeps that a no-op here.
    exec: vi.fn(async () => []),
    dispose: vi.fn(),
  })),
}));

describe('initDb concurrency', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('constructs only one worker when called concurrently, and both callers get the same result', async () => {
    const { createRpc } = await import('./rpc');
    const { initDb } = await import('./client');

    const [a, b] = await Promise.all([initDb(), initDb()]);

    expect(a).toBe('opfs-sahpool');
    expect(b).toBe('opfs-sahpool');
    expect(createRpc).toHaveBeenCalledTimes(1);
  });

  it('stays idempotent on later, non-concurrent calls too', async () => {
    const { createRpc } = await import('./rpc');
    const { initDb } = await import('./client');

    await initDb();
    await initDb();

    expect(createRpc).toHaveBeenCalledTimes(1);
  });

  it('keeps rejecting on later calls after a failed init, instead of falsely resolving', async () => {
    const { createRpc } = await import('./rpc');
    vi.mocked(createRpc).mockImplementation(() => ({
      init: () => Promise.resolve('opfs-sahpool'),
      // migrations run right after init and call exec() first — fail there
      // to simulate e.g. a disk-full error during the migration transaction.
      exec: vi.fn(async () => {
        throw new Error('migration boom');
      }),
      dispose: vi.fn(),
    }) as unknown as ReturnType<typeof createRpc>);
    const { initDb } = await import('./client');

    await expect(initDb()).rejects.toThrow('migration boom');
    // Before the fix, `mode` was set before migrations ran and never got
    // cleared on failure, so this second call would resolve 'opfs-sahpool'
    // against a database with no tables instead of rejecting again.
    await expect(initDb()).rejects.toThrow('migration boom');
  });
});
