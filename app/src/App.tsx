import { useEffect, useState } from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router';
import { initDb } from './db/client';
import type { StorageMode } from './db/protocol';
import { AdviceFeed } from './features/advice/AdviceFeed';
import { AskEvidence } from './features/advice/AskEvidence';
import { LogWorkout } from './features/log/LogWorkout';

type BootState = StorageMode | 'booting' | `error: ${string}`;

const NAV_LINK_CLASS =
  'min-h-[44px] flex items-center font-sans text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-faint aria-[current=page]:text-ink aria-[current=page]:border-b-2 aria-[current=page]:border-ink';

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
    <BrowserRouter>
      <main className="min-h-screen bg-paper">
        <header className="mx-auto max-w-[480px] px-4 pt-4">
          <p
            data-testid="storage-mode"
            // A healthy backend is not news. Showing "opfs-sahpool" to a lifter is
            // debug output wearing a UI; it stays in the DOM for the platform e2e
            // checks but out of sight. Only the data-loss mode earns pixels.
            className={
              isDurable || isBooting
                ? 'sr-only'
                : 'mt-2 border border-flag p-2 font-sans text-[13px] font-semibold text-flag'
            }
          >
            {isDurable
              ? mode
              : isBooting
                ? 'checking storage…'
                : `data loss risk — storage fell back to ${mode}, nothing you do here is guaranteed to be saved`}
          </p>
          {/* M2 is the first multi-screen milestone: two routes is enough,
              this is not a nav framework. */}
          <nav className="flex gap-5 border-b border-rule" aria-label="sections">
            <NavLink to="/" end className={NAV_LINK_CLASS}>
              Evidence
            </NavLink>
            <NavLink to="/log" className={NAV_LINK_CLASS}>
              Log a set
            </NavLink>
          </nav>
        </header>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <div className="mx-auto max-w-[480px] px-4 pt-4">
                  <h1 className="font-serif text-[19px] leading-[1.3] tracking-[-0.005em] text-ink">
                    The evidence base
                  </h1>
                </div>
                {/* The M1 evidence feed carries no user health data, so it needs no
                    consent and renders unconditionally, durably, regardless of
                    ConsentGate state (see features/onboarding/ConsentGate.tsx).
                    Task 6's logging screen — not this — is wrapped in <ConsentGate>. */}
                <AskEvidence />
                <AdviceFeed />
              </>
            }
          />
          <Route path="/log" element={<LogWorkout />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
