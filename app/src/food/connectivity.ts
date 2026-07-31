import { useEffect, useState } from 'react';

/**
 * The cheapest honest signal that the network is reachable.
 * Optimistic on purpose: navigator.onLine can be wrong (captive portals), so
 * the OFF fetch itself is the real probe — any failure renders the same
 * "you'll need wifi" notice. One message, two causes.
 */
export function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

/** React hook: online state that tracks the browser's online/offline events. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(isOnline());
  useEffect(() => {
    const go = (v: boolean) => () => setOnline(v);
    const on = go(true);
    const off = go(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}
