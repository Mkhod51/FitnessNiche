// Fallback's fallback: when OPFS SAHPool can't get its single connection
// lock (second tab open) the worker runs on an in-memory sqlite database.
// This module is IndexedDB-backed durability for that mode — a single
// serialized copy of the whole database, keyed as one record. It exists to
// survive a page close, not to replace the real VFS, so it stays deliberately
// dumb: one store, one key, last write wins.
//
// Every export here must resolve rather than throw. Private browsing can
// refuse IndexedDB outright, and this is already the degraded path — a
// failure here must degrade further (to "no snapshot"), never crash the boot.

const DB_NAME = 'etl-snapshot';
const STORE_NAME = 'db';
const KEY = 'main';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'));
  });
}

function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const req = run(tx.objectStore(STORE_NAME));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error('indexedDB request failed'));
        tx.oncomplete = () => db.close();
      }),
  );
}

export async function saveSnapshot(bytes: Uint8Array): Promise<void> {
  try {
    await withStore('readwrite', (store) => store.put(bytes, KEY));
  } catch {
    // degrade to "no snapshot" — see file header.
  }
}

export async function loadSnapshot(): Promise<Uint8Array | null> {
  try {
    const result = await withStore<Uint8Array | undefined>('readonly', (store) => store.get(KEY));
    return result ?? null;
  } catch {
    return null;
  }
}

export async function clearSnapshot(): Promise<void> {
  try {
    await withStore('readwrite', (store) => store.delete(KEY));
  } catch {
    // degrade to "no snapshot" — see file header.
  }
}
