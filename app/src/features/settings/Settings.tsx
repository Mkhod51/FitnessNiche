import { useEffect, useState, type ReactElement } from 'react';
import { Link } from 'react-router';
import { getUser, updateProfile, type User } from '../../db/user';
import { exportEverything, exportFilename, deleteEverything } from '../../db/export';
import { CLAIMS } from '../../generated/claims';
import { readStoredTheme, applyTheme, type Theme } from '../../theme';

const LABEL = 'font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint';
const TAP = 'transition-colors duration-[var(--motion-tap)] ease-[var(--motion-ease)]';
const ROW = 'flex items-center justify-between gap-3 border-b border-rule px-4 py-3 min-h-[56px]';

function Segmented<T extends string>({
  value,
  options,
  onChange,
  testId,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  testId: string;
}): ReactElement {
  return (
    <div className="flex flex-none border border-rule-strong" role="group" data-testid={testId}>
      {options.map((o, i) => (
        <button
          key={o.id}
          type="button"
          data-testid={`${testId}-${o.id}`}
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`min-h-[44px] px-3 font-sans text-[11px] font-semibold uppercase tracking-[0.06em] ${TAP} ${
            i > 0 ? 'border-l border-rule-strong' : ''
          } ${value === o.id ? 'bg-ink text-paper' : 'bg-paper text-ink-faint'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Settings(): ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<Theme>('auto');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    setTheme(readStoredTheme());
    let off = false;
    void (async () => {
      const u = await getUser();
      if (!off) setUser(u);
    })();
    return () => {
      off = true;
    };
  }, []);

  async function toggleNumbersHidden() {
    if (!user) return;
    setUser(await updateProfile({ numbersHidden: !user.numbersHidden }));
  }

  async function handleExport() {
    const data = await exportEverything();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportFilename();
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    await deleteEverything();
    setDeleted(true);
    setConfirmingDelete(false);
    setUser(await getUser());
  }

  const lastReviewed = CLAIMS.map((c) => c.lastReviewed).sort().at(-1) ?? '—';

  return (
    <div className="mx-auto max-w-[480px] pb-10">
      <header className="px-4 pt-5 pb-3">
        <h1 className="font-serif text-[20px] leading-[1.2] text-ink">Settings</h1>
      </header>

      <p className={`${LABEL} px-4 pt-2 pb-1`}>You</p>
      <Link to="/goal" data-testid="settings-goal-link" className={`${ROW} ${TAP} active:bg-paper-sunk`}>
        <span className="font-serif text-[15.5px] text-ink">Goal and calorie target</span>
        <span className={LABEL}>{user?.goal ?? '—'} ›</span>
      </Link>
      <div className={ROW}>
        <span className="font-serif text-[15.5px] text-ink">Height</span>
        <span className="font-figure tabular-nums text-[14px] text-ink-soft">
          {user?.heightCm ? `${user.heightCm} cm` : 'Not set'}
        </span>
      </div>
      <div className={ROW}>
        <span className="font-serif text-[15.5px] text-ink">Born</span>
        <span className="font-figure tabular-nums text-[14px] text-ink-soft">
          {user?.birthYear ?? 'Not set'}
        </span>
      </div>

      <p className={`${LABEL} px-4 pt-5 pb-1`}>What you see</p>
      <div className={ROW}>
        <span className="min-w-0">
          <span className="block font-serif text-[15.5px] text-ink">Hide numbers</span>
          <span className="block font-serif text-[12px] italic leading-[1.4] text-ink-faint">
            Hides calorie and bodyweight figures everywhere. Your training log is unaffected.
          </span>
        </span>
        <button
          type="button"
          data-testid="numbers-hidden-toggle"
          role="switch"
          aria-checked={user?.numbersHidden ?? false}
          aria-label="Hide numbers"
          onClick={() => void toggleNumbersHidden()}
          className={`relative h-[26px] w-[44px] flex-none border ${TAP} ${
            user?.numbersHidden ? 'border-ink bg-ink' : 'border-rule-strong bg-paper'
          }`}
        >
          <span
            aria-hidden="true"
            className={`absolute top-[2px] block h-[20px] w-[20px] ${TAP} ${
              user?.numbersHidden ? 'left-[20px] bg-paper' : 'left-[2px] bg-rule-strong'
            }`}
          />
        </button>
      </div>
      <div className={ROW}>
        <span className="font-serif text-[15.5px] text-ink">Appearance</span>
        <Segmented
          testId="theme"
          value={theme}
          onChange={(t) => {
            setTheme(t);
            applyTheme(t);
          }}
          options={[
            { id: 'light', label: 'Light' },
            { id: 'dark', label: 'Dark' },
            { id: 'auto', label: 'Auto' },
          ]}
        />
      </div>

      <p className={`${LABEL} px-4 pt-5 pb-1`}>Your data</p>
      <div className={ROW}>
        <span className="min-w-0">
          <span className="block font-serif text-[15.5px] text-ink">Stored on this device</span>
          <span className="block font-serif text-[12px] italic leading-[1.4] text-ink-faint">
            {user?.consentedAt
              ? `Consented ${new Date(user.consentedAt).toLocaleDateString()}`
              : 'No consent recorded — logging is off until you give it.'}
          </span>
        </span>
      </div>
      <button type="button" data-testid="export-button" onClick={() => void handleExport()} className={`${ROW} w-full text-left ${TAP} active:bg-paper-sunk`}>
        <span className="font-serif text-[15.5px] text-ink">Export everything</span>
        <span className={LABEL}>JSON ›</span>
      </button>

      {/* GR-5 erasure. Destructive controls are --flag TEXT, never a filled red
          button — a filled red target invites the mis-tap it exists to prevent. */}
      {confirmingDelete ? (
        <div className="border-b border-rule px-4 py-4">
          <p className="font-serif text-[15px] leading-[1.45] text-ink">
            This erases every set, weight, meal and advice record on this device. It is not a
            soft delete and there is no undo.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              data-testid="confirm-delete-button"
              onClick={() => void handleDelete()}
              className={`min-h-[44px] flex-1 border border-flag font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-flag ${TAP}`}
            >
              Erase it all
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className={`${LABEL} min-h-[44px] px-3 text-ink ${TAP}`}
            >
              Keep my data
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          data-testid="delete-button"
          onClick={() => setConfirmingDelete(true)}
          className={`${ROW} w-full text-left ${TAP} active:bg-paper-sunk`}
        >
          <span className="font-serif text-[15.5px] text-flag">Delete all my data</span>
          <span className="font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-flag">›</span>
        </button>
      )}
      {deleted && (
        <p data-testid="delete-done" className="row-open px-4 py-3 font-serif text-[13px] italic text-ink-soft">
          Erased. Consent has been cleared too, so logging is off until you give it again.
        </p>
      )}

      {/* GR-1 requires this, verbatim: "static signpost to Beat/NHS in settings".
          Worded to state the app's own limits — T6/GR-2 is signpost, never screen. */}
      <p className={`${LABEL} px-4 pt-5 pb-1`}>If food or weight is feeling hard</p>
      <div className="px-4 pb-4">
        <p className="font-serif text-[14px] leading-[1.5] text-ink-soft">
          This app is not a clinical tool and cannot assess anyone. If you want to talk to someone
          who can:
        </p>
        <p className="mt-2 font-serif text-[15px] text-ink">Beat — beateatingdisorders.org.uk</p>
        <p className="mt-1 font-serif text-[15px] text-ink">NHS — nhs.uk</p>
      </div>

      <p className={`${LABEL} px-4 pt-3 pb-1`}>The evidence base</p>
      <div className={ROW}>
        <span className="font-serif text-[15.5px] text-ink">{CLAIMS.length} claims</span>
        <span className="font-figure tabular-nums text-[14px] text-ink-soft">
          reviewed {lastReviewed}
        </span>
      </div>
      <div className="px-4 py-3">
        <p className="font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
          Exercise data is hand-authored for this app. Food data will carry its source and licence
          per entry once a food database ships.
        </p>
      </div>
    </div>
  );
}
