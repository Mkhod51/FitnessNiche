import { useEffect, useState } from 'react';
import { initDb } from './db/client';
import type { StorageMode } from './db/protocol';
import { AdviceFeed } from './features/advice/AdviceFeed';

type BootState = StorageMode | 'booting' | `error: ${string}`;

export default function App() {
  const [mode, setMode] = useState<BootState>('booting');

  useEffect(() => {
    initDb().then(setMode).catch((e) => setMode(`error: ${e.message}`));
  }, []);

  // D7: memory-fallback is a data-loss mode, not a curiosity — anything other
  // than the durable OPFS backend gets a visible warning, never a bare value.
  const isDurable = mode === 'opfs-sahpool';
  const isBooting = mode === 'booting';

  return (
    <main className="min-h-screen bg-paper">
      <header className="mx-auto max-w-[480px] px-4 pt-4">
        <h1 className="font-serif text-[19px] leading-[1.3] tracking-[-0.005em] text-ink">
          The evidence base
        </h1>
        <p
          data-testid="storage-mode"
          className={
            isDurable || isBooting
              ? 'mt-1 font-mono text-[9px] text-ink-faint'
              : 'mt-2 border border-flag p-2 font-sans text-[13px] font-semibold text-flag'
          }
        >
          {isDurable
            ? mode
            : isBooting
              ? 'checking storage…'
              : `data loss risk — storage fell back to ${mode}, nothing you do here is guaranteed to be saved`}
        </p>
      </header>
      <AdviceFeed />
    </main>
  );
}
