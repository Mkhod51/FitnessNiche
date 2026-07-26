import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { getUser, recordConsent, hasConsented } from '../../db/user';

// Shared sizing/weight so accept and decline are exactly as prominent as each
// other (no dark patterns): same element, same height, same text size and
// weight. They differ only by fill — ink-filled vs outlined — never by size,
// position, or a "skip" link styled to look lesser.
const BUTTON_BASE =
  'min-h-[44px] flex-1 border border-ink px-4 font-sans text-[13px] font-semibold uppercase tracking-[0.08em]';

type Status = 'checking' | 'needed' | 'granted';

/**
 * Wraps a logging surface and renders it only once explicit consent
 * (GR-5/FR-ONB-3) has been recorded — never implied by using the app, never
 * a pre-ticked box. Declining is a real, supported action: it leaves the
 * prompt in a normal, re-triable state rather than an error or a dead end,
 * and — because this wraps only the content passed as children — anything
 * rendered outside `ConsentGate` (like the M1 evidence feed) is unaffected
 * either way.
 */
export function ConsentGate({ children }: { children: ReactNode }): ReactElement | null {
  const [status, setStatus] = useState<Status>('checking');
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getUser().then((user) => {
      if (cancelled) return;
      setStatus(hasConsented(user) ? 'granted' : 'needed');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'checking') return null;
  if (status === 'granted') return <>{children}</>;

  async function handleAccept() {
    await recordConsent();
    setStatus('granted');
  }

  return (
    <div data-testid="consent-gate" className="mx-auto max-w-[480px] bg-paper p-4">
      <h2 className="font-serif text-[17px] leading-[1.3] tracking-[-0.005em] text-ink">
        Before you log anything
      </h2>
      <p className="mt-2 font-serif text-[15px] leading-[1.45] text-ink">
        Logging a workout or a bodyweight entry stores that data on this device. Under
        UK GDPR, workout and bodyweight data is treated as special-category health data,
        so we ask separately, plainly, before any of it is recorded. It stays on your
        device — nothing is sent anywhere else.
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          data-testid="consent-accept"
          onClick={handleAccept}
          className={`${BUTTON_BASE} bg-ink text-paper`}
        >
          I agree — start logging
        </button>
        <button
          type="button"
          data-testid="consent-decline"
          onClick={() => setDeclined(true)}
          className={`${BUTTON_BASE} bg-paper text-ink`}
        >
          Not now
        </button>
      </div>
      {declined && (
        <p data-testid="consent-declined-note" className="mt-3 font-serif text-[13px] leading-[1.45] text-ink-soft">
          Nothing was stored. You can agree any time before logging a workout or a
          bodyweight entry.
        </p>
      )}
    </div>
  );
}
