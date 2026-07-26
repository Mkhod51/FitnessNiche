import { describe, it, expect } from 'vitest';
import { createRpc } from './rpc';

class FakeWorker {
  onmessage: ((e: { data: unknown }) => void) | null = null;
  onerror: ((e: { message: string }) => void) | null = null;
  posted: unknown[] = [];
  postMessage(msg: unknown) { this.posted.push(msg); }
  reply(data: unknown) { this.onmessage?.({ data }); }
  crash(message: string) { this.onerror?.({ message }); }
  terminate() {}
}

describe('rpc', () => {
  it('resolves each call with its own matching response', async () => {
    const w = new FakeWorker();
    const rpc = createRpc(w as unknown as Worker);
    const a = rpc.exec('select 1', [], 'all');
    const b = rpc.exec('select 2', [], 'all');
    // reply out of order to prove correlation is by id, not arrival order
    w.reply({ id: 2, ok: true, kind: 'exec', rows: [[2]], changes: 0 });
    w.reply({ id: 1, ok: true, kind: 'exec', rows: [[1]], changes: 1 });
    // D8: exec() resolves rows AND changes (db.changes()), not just rows.
    expect(await a).toEqual({ rows: [[1]], changes: 1 });
    expect(await b).toEqual({ rows: [[2]], changes: 0 });
  });

  it('flush() posts a flush request and resolves once the worker acks it', async () => {
    const w = new FakeWorker();
    const rpc = createRpc(w as unknown as Worker);
    const p = rpc.flush();
    expect(w.posted).toEqual([{ id: 1, kind: 'flush' }]);
    w.reply({ id: 1, ok: true, kind: 'flush' });
    await expect(p).resolves.toBeUndefined();
  });

  it('rejects when the worker reports an error', async () => {
    const w = new FakeWorker();
    const rpc = createRpc(w as unknown as Worker);
    const p = rpc.exec('bad sql', [], 'all');
    w.reply({ id: 1, ok: false, error: 'syntax error' });
    await expect(p).rejects.toThrow('syntax error');
  });

  it('rejects every pending request and clears the queue when the worker dies', async () => {
    const w = new FakeWorker();
    const rpc = createRpc(w as unknown as Worker);
    const a = rpc.exec('select 1', [], 'all');
    const b = rpc.exec('select 2', [], 'all');
    expect(rpc._pendingCount()).toBe(2);

    w.crash('script error');

    await expect(a).rejects.toThrow(/worker crashed/);
    await expect(b).rejects.toThrow(/worker crashed/);
    expect(rpc._pendingCount()).toBe(0);

    // A call made after the crash must reject immediately too, not hang
    // forever posting into a worker nothing will ever reply from.
    const c = rpc.exec('select 3', [], 'all');
    await expect(c).rejects.toThrow(/worker crashed/);
    expect(w.posted.length).toBe(2); // the post-crash call never reached the worker
  });
});
