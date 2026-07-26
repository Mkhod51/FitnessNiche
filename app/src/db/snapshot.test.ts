import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { saveSnapshot, loadSnapshot, clearSnapshot } from './snapshot';

describe('snapshot', () => {
  beforeEach(async () => { await clearSnapshot(); });

  it('returns null when nothing has been saved', async () => {
    expect(await loadSnapshot()).toBeNull();
  });

  it('round-trips bytes unchanged', async () => {
    const bytes = new Uint8Array([1, 2, 3, 250, 0, 99]);
    await saveSnapshot(bytes);
    const back = await loadSnapshot();
    expect(back).not.toBeNull();
    expect(Array.from(back as Uint8Array)).toEqual([1, 2, 3, 250, 0, 99]);
  });

  it('overwrites rather than accumulating', async () => {
    await saveSnapshot(new Uint8Array([1]));
    await saveSnapshot(new Uint8Array([2, 2]));
    expect(Array.from((await loadSnapshot()) as Uint8Array)).toEqual([2, 2]);
  });

  it('clears', async () => {
    await saveSnapshot(new Uint8Array([1]));
    await clearSnapshot();
    expect(await loadSnapshot()).toBeNull();
  });

  it('resolves rather than throwing when IndexedDB is unavailable', async () => {
    // Private browsing can refuse IndexedDB outright. Losing the fallback's
    // fallback must degrade to "no snapshot", never crash the boot.
    const real = globalThis.indexedDB;
    // @ts-expect-error deliberately removing the API to simulate a hostile environment
    delete globalThis.indexedDB;
    await expect(saveSnapshot(new Uint8Array([1]))).resolves.toBeUndefined();
    await expect(loadSnapshot()).resolves.toBeNull();
    globalThis.indexedDB = real;
  });
});
