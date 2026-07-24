import { describe, it, expect } from 'vitest';
import { createRpc } from './rpc';

class FakeWorker {
  onmessage: ((e: { data: unknown }) => void) | null = null;
  posted: unknown[] = [];
  postMessage(msg: unknown) { this.posted.push(msg); }
  reply(data: unknown) { this.onmessage?.({ data }); }
  terminate() {}
}

describe('rpc', () => {
  it('resolves each call with its own matching response', async () => {
    const w = new FakeWorker();
    const rpc = createRpc(w as unknown as Worker);
    const a = rpc.exec('select 1', [], 'all');
    const b = rpc.exec('select 2', [], 'all');
    // reply out of order to prove correlation is by id, not arrival order
    w.reply({ id: 2, ok: true, kind: 'exec', rows: [[2]] });
    w.reply({ id: 1, ok: true, kind: 'exec', rows: [[1]] });
    expect(await a).toEqual([[1]]);
    expect(await b).toEqual([[2]]);
  });

  it('rejects when the worker reports an error', async () => {
    const w = new FakeWorker();
    const rpc = createRpc(w as unknown as Worker);
    const p = rpc.exec('bad sql', [], 'all');
    w.reply({ id: 1, ok: false, error: 'syntax error' });
    await expect(p).rejects.toThrow('syntax error');
  });
});
