import { useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter, NavLink, Route, Routes, useLocation } from 'react-router';
import { initDb } from './db/client';
import type { StorageMode } from './db/protocol';
import { Hub } from './features/hub/Hub';
import { LogWorkout } from './features/log/LogWorkout';
import { LogWeight } from './features/log/LogWeight';
import { EatDay } from './features/nutrition/EatDay';
import { GoalSetup } from './features/nutrition/GoalSetup';
import { Settings } from './features/settings/Settings';
import { HubIcon, TrainIcon, EatIcon } from './components/icons';

type BootState = StorageMode | 'booting' | `error: ${string}`;

/** Fixed order, so left and right in the pane transition mean something. */
const TABS = [
  { to: '/', label: 'Hub', Icon: HubIcon },
  { to: '/train', label: 'Train', Icon: TrainIcon },
  { to: '/eat', label: 'Eat', Icon: EatIcon },
] as const;

const TAB_CLASS =
  'flex-1 flex flex-col items-center justify-center min-h-[52px] py-2 font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint transition-colors duration-[var(--motion-tap)] ease-[var(--motion-ease)] aria-[current=page]:text-ink';

function tabIndexOf(pathname: string): number {
  if (pathname === '/') return 0;
  if (pathname.startsWith('/train')) return 1;
  if (pathname.startsWith('/eat')) return 2;
  return 0;
}

/**
 * Panes animate on the tab's index rather than the raw path, so the direction
 * of travel carries information: moving to a tab on the right brings its pane
 * in from the right. Three tabs in a fixed order makes that a real spatial cue
 * rather than decoration (DESIGN.md §Motion).
 *
 * The animation is presentational only — it never gates visibility, and
 * prefers-reduced-motion zeroes the duration tokens it uses, so the pane is
 * simply there.
 */
function AnimatedPane({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const index = tabIndexOf(pathname);
  const [prev, setPrev] = useState(index);

  useEffect(() => {
    setPrev(index);
  }, [index]);

  const from = index >= prev ? '12px' : '-12px';

  return (
    <div
      key={pathname}
      className="pane-enter"
      style={{ ['--pane-from' as string]: from }}
    >
      {children}
    </div>
  );
}

function Shell() {
  const [mode, setMode] = useState<BootState>('booting');

  useEffect(() => {
    initDb()
      .then(setMode)
      .catch((e) => setMode(`error: ${e.message}`));
  }, []);

  // D7: memory-fallback is a data-loss mode, not a curiosity — anything other
  // than the durable OPFS backend gets a visible warning, never a bare value.
  const isDurable = mode === 'opfs-sahpool';
  const isBooting = mode === 'booting';

  return (
    <div data-testid="app-ground" className="flex min-h-screen flex-col bg-paper">
      <p
        data-testid="storage-mode"
        // A healthy backend is not news. Showing "opfs-sahpool" to a lifter is
        // debug output wearing a UI; it stays in the DOM for the platform e2e
        // checks but out of sight. Only the data-loss mode earns pixels.
        className={
          isDurable || isBooting
            ? 'sr-only'
            : 'mx-4 mt-2 border border-flag p-2 font-sans text-[13px] font-semibold text-flag'
        }
      >
        {isDurable
          ? mode
          : isBooting
            ? 'checking storage…'
            : `data loss risk — storage fell back to ${mode}, nothing you do here is guaranteed to be saved`}
      </p>

      <main className="flex-1 overflow-x-hidden">
        <AnimatedPane>
          <Routes>
            <Route path="/" element={<Hub />} />
            <Route path="/train" element={<LogWorkout />} />
            <Route path="/eat" element={<EatDay />} />
            <Route path="/goal" element={<GoalSetup />} />
            <Route path="/weight" element={<LogWeight />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AnimatedPane>
      </main>

      <nav className="sticky bottom-0 flex border-t border-rule bg-paper" aria-label="sections">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.to === '/'} className={TAB_CLASS}>
            <t.Icon className="mb-1 h-[19px] w-[19px]" />
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
