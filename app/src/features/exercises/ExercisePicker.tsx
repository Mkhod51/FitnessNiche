import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { SEED_EXERCISES } from '../../db/seed-exercises';

/**
 * Artwork the developer sources, picked up with no code change.
 *
 * A file dropped at `src/assets/exercises/<exercise-id>.svg` appears here at the
 * next build — there is no registry to update and no import to add. See that
 * folder's README for the contract the artwork has to meet.
 */
const ART = import.meta.glob('../../assets/exercises/*.{svg,png}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const ART_BY_ID: Record<string, string> = Object.fromEntries(
  Object.entries(ART).map(([path, url]) => [path.replace(/^.*\/(.+)\.(svg|png)$/, '$1'), url]),
);

const LABEL = 'font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint';

/** The muscle a lift is mostly for — the strongest contribution in the seed map. */
function primaryMuscle(id: string): string {
  const ex = SEED_EXERCISES.find((e) => e.id === id);
  if (!ex) return '';
  const top = Object.entries(ex.contributions).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0].replace(/_/g, ' ') : '';
}

function Thumb({ id }: { id: string }): ReactElement {
  const url = ART_BY_ID[id];
  if (!url) {
    // Deliberately an obvious gap rather than a generic dumbbell: a placeholder
    // that looks like real content is one nobody ever goes back and replaces.
    return (
      <span
        data-testid="exercise-art-missing"
        aria-hidden="true"
        className="flex h-[44px] w-[44px] flex-none items-center justify-center border border-dashed border-rule-strong bg-paper-sunk"
      >
        <span className="font-sans text-[8px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
          art
        </span>
      </span>
    );
  }
  return (
    <span className="flex h-[44px] w-[44px] flex-none items-center justify-center border border-rule bg-paper-sunk">
      <img src={url} alt="" aria-hidden="true" className="h-[26px] w-[26px]" />
    </span>
  );
}

export function ExercisePicker({
  open,
  recentIds,
  onPick,
  onClose,
}: {
  open: boolean;
  recentIds: string[];
  onPick: (exerciseId: string) => void;
  onClose: () => void;
}): ReactElement | null {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setExpanded(false);
    }
  }, [open]);

  // Escape closes, because a sheet that can only be dismissed by a tap target
  // is unusable from a keyboard.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEED_EXERCISES;
    return SEED_EXERCISES.filter(
      (e) => e.name.toLowerCase().includes(q) || primaryMuscle(e.id).includes(q),
    );
  }, [query]);

  const recents = useMemo(
    () => (query.trim() ? [] : recentIds.map((id) => SEED_EXERCISES.find((e) => e.id === id)).filter(Boolean)),
    [recentIds, query],
  );

  if (!open) return null;

  const row = (id: string, name: string, meta: string) => (
    <li key={id}>
      <button
        type="button"
        data-testid="exercise-row"
        data-exercise-id={id}
        onClick={() => onPick(id)}
        className="flex min-h-[60px] w-full items-center gap-3 border-b border-rule px-4 py-2 text-left transition-colors duration-[var(--motion-tap)] ease-[var(--motion-ease)] active:bg-paper-sunk"
      >
        <Thumb id={id} />
        <span className="min-w-0">
          <span className="block font-serif text-[15.5px] leading-[1.25] text-ink">{name}</span>
          <span className={`${LABEL} mt-0.5 block`}>{meta}</span>
        </span>
      </button>
    </li>
  );

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Choose an exercise">
      <button
        type="button"
        data-testid="picker-scrim"
        aria-label="Close"
        onClick={onClose}
        className="scrim-enter absolute inset-0 w-full cursor-default bg-[rgba(20,18,16,0.28)]"
      />

      {/* Half height by default so the session stays readable behind it, growing
          only once you start typing — the list has nothing to show until then. */}
      <div
        data-testid="exercise-sheet"
        data-expanded={expanded ? 'true' : 'false'}
        className={`sheet-enter absolute inset-x-0 bottom-0 flex flex-col border-t border-rule-strong bg-paper transition-[height] duration-[var(--motion-move)] ease-[var(--motion-ease)] ${
          expanded ? 'h-[92%]' : 'h-[58%]'
        }`}
      >
        <div aria-hidden="true" className="mx-auto mt-2 h-[3px] w-9 bg-rule-strong" />

        <div className="px-4 pt-3">
          <input
            ref={searchRef}
            data-testid="exercise-search"
            type="search"
            autoComplete="off"
            placeholder="Search exercises…"
            value={query}
            onFocus={() => setExpanded(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setExpanded(true);
            }}
            className="h-[46px] w-full border border-rule-strong bg-paper px-3 font-serif text-[16px] text-ink outline-none focus:border-ink"
          />
        </div>

        <div className="mt-3 flex-1 overflow-y-auto overscroll-contain">
          {recents.length > 0 && (
            <>
              <p className={`${LABEL} border-b border-rule bg-paper-sunk px-4 py-2`}>Recent</p>
              <ul>
                {recents.map((e) => row(e!.id, e!.name, `${e!.modality} · ${primaryMuscle(e!.id)}`))}
              </ul>
            </>
          )}

          <p className={`${LABEL} border-b border-rule bg-paper-sunk px-4 py-2`}>
            {query.trim() ? `${matches.length} match${matches.length === 1 ? '' : 'es'}` : 'All exercises'}
          </p>

          {matches.length === 0 ? (
            <p className="px-4 py-5 font-serif text-[15px] leading-[1.45] text-ink-soft">
              Nothing matches “{query.trim()}”. The catalogue is {SEED_EXERCISES.length} exercises —
              it does not cover everything, and there is no way to add your own yet.
            </p>
          ) : (
            <ul>{matches.map((e) => row(e.id, e.name, `${e.modality} · ${primaryMuscle(e.id)}`))}</ul>
          )}
        </div>
      </div>
    </div>
  );
}
