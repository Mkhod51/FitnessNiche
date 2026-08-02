import { useEffect, useState } from 'react';

/**
 * The cheapest honest signal that the network is reachable.
 * Optimistic on purpose: navigator.onLine can be wrong (captive portals), but
 * this gate is only for the explicit offline copy. Provider failures are handled
 * separately at the call site so we do not mislabel them as missing wifi.
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
