import { useEffect, useState, type ReactElement } from 'react';
import { Link } from 'react-router';
import { getUser, updateProfile, type User } from '../../db/user';
import { exportEverything, exportFilename, exportSetsCsv, exportCsvFilename, deleteEverything } from '../../db/export';
import { CLAIMS } from '../../generated/claims';
import { readStoredTheme, applyTheme, type Theme } from '../../theme';
import { getSyncConfig, setSyncConfig, clearSyncConfig, type SyncConfig } from '../../sync/config';
import { syncNow, startAutoSync } from '../../sync/sync';

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
  const [syncUrl, setSyncUrl] = useState('');
  const [syncToken, setSyncToken] = useState('');
  const [syncCfg, setSyncCfg] = useState<SyncConfig | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    setTheme(readStoredTheme());
    setSyncCfg(getSyncConfig());
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
    download(JSON.stringify(data, null, 2), 'application/json', exportFilename());
  }

  async function handleExportCsv() {
    download(await exportSetsCsv(), 'text/csv', exportCsvFilename());
  }

  function download(body: string, type: string, filename: string) {
    const url = URL.createObjectURL(new Blob([body], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    await deleteEverything();
    setDeleted(true);
    setConfirmingDelete(false);
    setUser(await getUser());
  }

  // setSyncConfig persists but does not re-arm the online listener (no circular
  // import with sync.ts). Re-arming here keeps the listener aligned with the
  // new config; re-reading getSyncConfig updates the displayed status and the
  // conditional privacy notice in one step.
  function handleSaveSync() {
    setSyncConfig(syncUrl, syncToken);
    startAutoSync();
    setSyncCfg(getSyncConfig());
    setSyncMsg(null);
  }

  async function handleSyncNow() {
    setSyncMsg(null);
    try {
      const r = await syncNow();
      setSyncMsg(r.configured ? `pushed ${r.pushed}, pulled ${r.pulled}` : 'not configured');
    } catch (e) {
      // A broken endpoint must be visible — auto-sync logs to console, but a
      // manual tap should show the user what happened, not swallow it.
      setSyncMsg(e instanceof Error ? e.message : String(e));
    }
  }

  function handleDisconnectSync() {
    clearSyncConfig();
    startAutoSync();
    setSyncCfg(getSyncConfig());
    setSyncMsg(null);
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

      {/* Named "training log", not "export", so the two are not mistaken for
          each other. The JSON above is the portability obligation and is
          complete; this is a convenience and covers sets only. */}
      <button type="button" data-testid="export-csv-button" onClick={() => void handleExportCsv()} className={`${ROW} w-full text-left ${TAP} active:bg-paper-sunk`}>
        <span className="min-w-0">
          <span className="block font-serif text-[15.5px] text-ink">Export the training log</span>
          <span className="block font-serif text-[12px] italic leading-[1.4] text-ink-faint">
            Sets only, for spreadsheets. Not a full export.
          </span>
        </span>
        <span className={LABEL}>CSV ›</span>
      </button>

      {/* Sync configuration. Runtime-configurable so a user can point at their
          own Worker without a rebuild; the URL/token live in localStorage (see
          sync/config.ts), never in the replicated DB, so the server's own
          credential doesn't cross the wire. */}
      <div className={ROW}>
        <span className="min-w-0">
          <span className="block font-serif text-[15.5px] text-ink">Sync</span>
          <span data-testid="sync-status" className="block font-serif text-[12px] italic leading-[1.4] text-ink-faint">
            {syncCfg ? `Configured → ${syncCfg.url}` : 'Off — logs stay on this device'}
          </span>
        </span>
      </div>
      <div className="border-b border-rule px-4 py-3">
        <label className={LABEL} htmlFor="sync-url-input">Server URL</label>
        <input
          id="sync-url-input"
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          data-testid="sync-url-input"
          value={syncUrl}
          onChange={(e) => setSyncUrl(e.target.value)}
          placeholder="https://your-worker.workers.dev"
          className="mt-1 min-h-[44px] w-full border border-rule-strong bg-paper px-3 font-sans text-[13px] text-ink outline-none focus:border-ink"
        />
        <label className={`${LABEL} mt-3 block`} htmlFor="sync-token-input">Bearer token</label>
        <input
          id="sync-token-input"
          type="password"
          autoComplete="off"
          spellCheck={false}
          data-testid="sync-token-input"
          value={syncToken}
          onChange={(e) => setSyncToken(e.target.value)}
          className="mt-1 min-h-[44px] w-full border border-rule-strong bg-paper px-3 font-sans text-[13px] text-ink outline-none focus:border-ink"
        />
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            data-testid="sync-save-button"
            disabled={!syncUrl.trim() || !syncToken.trim()}
            onClick={handleSaveSync}
            className={`min-h-[44px] flex-none border border-ink px-4 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-ink ${TAP} disabled:opacity-40 disabled:pointer-events-none`}
          >
            Save
          </button>
          {syncCfg && (
            <button
              type="button"
              data-testid="sync-now-button"
              onClick={() => void handleSyncNow()}
              className={`min-h-[44px] flex-none border border-rule-strong px-4 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-ink ${TAP}`}
            >
              Sync now
            </button>
          )}
          {syncCfg && (
            <button
              type="button"
              data-testid="sync-disconnect-button"
              onClick={handleDisconnectSync}
              className={`min-h-[44px] flex-none px-2 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-flag ${TAP}`}
            >
              Disconnect
            </button>
          )}
        </div>
        {syncMsg && (
          <p data-testid="sync-result" className="mt-2 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
            {syncMsg}
          </p>
        )}
      </div>

      {/* NFR-4/GR-5. The notice states what is actually true of this build, not
          boilerplate. With sync configured it says plainly what replicates
          where, that the bearer token stays on this device, and that "Delete
          all my data" below is device-only — server-side erasure is not yet
          wired (T6: never overstate). Food-query disclosure applies in both
          branches because it is independent of log sync. */}
      <section data-testid="privacy-notice" className="border-b border-rule px-4 py-4">
        <p className={LABEL}>Your data</p>
        {syncCfg ? (
          <>
            <p className="mt-2 font-serif text-[14px] leading-[1.5] text-ink">
              Everything you log — sets, bodyweight, meals — is stored in a database on this
              device and replicates to the server at <span className="break-all">{syncCfg.url}</span>.
              The connection uses a bearer token stored only on this device, never sent anywhere
              except to that server to authenticate sync.
            </p>
            <p className="mt-2 font-serif text-[14px] leading-[1.5] text-ink">
              &ldquo;Delete all my data&rdquo; below erases this device only. It does not erase
              what the server already holds — server-side erasure is not yet wired. Export above
              gives you a copy of everything on this device.
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 font-serif text-[14px] leading-[1.5] text-ink">
              Everything you log — sets, bodyweight, meals — is stored in a database on this device.
              Logs stay on this device unless you configure sync. There is no account.
            </p>
            <p className="mt-2 font-serif text-[14px] leading-[1.5] text-ink">
              Workout and bodyweight data is special-category health data under UK GDPR, which is why
              consent is asked separately before any of it is recorded, and why both buttons above
              exist: you can take your data out, and you can erase it, without asking anyone.
            </p>
            <p className="mt-2 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
              Clearing this site&rsquo;s storage in your browser erases it too — there is no copy
              of your logs for us to restore from.
            </p>
          </>
        )}
        <p className="mt-2 font-serif text-[14px] leading-[1.5] text-ink">
          Food searches and barcodes are sent to Open Food Facts only when you submit them.
        </p>
      </section>

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
          <strong className="font-semibold text-ink-soft">Data sources.</strong> Food data from{' '}
          <a className="underline decoration-rule-strong underline-offset-4" href="https://world.openfoodfacts.org">
            Open Food Facts
          </a>{' '}
          (© ODbL) and the{' '}
          <a
            className="underline decoration-rule-strong underline-offset-4"
            href="https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid"
          >
            CoFID
          </a>{' '}
          dataset (© Crown / OGL). Food search results show their source.
        </p>
      </div>
    </div>
  );
}
