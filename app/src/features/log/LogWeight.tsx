import { useEffect, useState, type ReactElement } from 'react';
import { ConsentGate } from '../onboarding/ConsentGate';
import { getWeightHistory, logWeight, type WeightReading } from '../../db/weights';

const INPUT_CLASS = 'mt-1 min-h-[44px] w-full border border-rule bg-paper px-3 font-mono text-[16px] text-ink';
const LABEL_CLASS = 'block font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint';

/**
 * The weight-logging screen (Task 7). Same immediacy as LogWorkout: no save
 * button beyond the log tap, write goes straight to sqlite (FR-LOG-4).
 */
function LoggingSurface(): ReactElement {
  const [valueKg, setValueKg] = useState('');
  const [readings, setReadings] = useState<WeightReading[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getWeightHistory().then((existing) => {
      if (!cancelled) setReadings(existing.slice().reverse()); // most recent first for display
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogWeight() {
    if (submitting) return;
    const value = Number(valueKg);
    if (!Number.isFinite(value) || value <= 0) return;

    setSubmitting(true);
    try {
      const created = await logWeight(value);
      setReadings((prev) => [created, ...prev]);
      setValueKg('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[480px] px-4 pt-4 pb-8">
      <h1 className="font-serif text-[19px] leading-[1.3] tracking-[-0.005em] text-ink">Log bodyweight</h1>

      <label className={`${LABEL_CLASS} mt-4`}>
        Weight (kg)
        <input
          data-testid="weight-value-input"
          className={INPUT_CLASS}
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          value={valueKg}
          onChange={(e) => setValueKg(e.target.value)}
        />
      </label>

      <button
        type="button"
        data-testid="log-weight-button"
        onClick={handleLogWeight}
        className="mt-6 min-h-[44px] w-full bg-ink font-sans text-[13px] font-semibold uppercase tracking-[0.08em] text-paper"
      >
        Log weight
      </button>

      {readings.length > 0 && (
        <section className="mt-8 border-t border-rule pt-4" aria-label="recent readings">
          <h2 className="font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
            Recent readings
          </h2>
          <ul>
            {readings.map((r) => (
              <li
                key={r.id}
                data-testid="weight-reading-row"
                className="mt-2 flex justify-between gap-3 border-b border-rule pb-2"
              >
                <span className="font-serif text-[13px] text-ink-soft">
                  {new Date(r.measuredAt).toLocaleDateString()}
                </span>
                <span className="font-mono text-[13px] text-ink">{r.valueKg}kg</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** GR-5: this screen renders user health data, so it is unreachable without consent. */
export function LogWeight(): ReactElement {
  return (
    <ConsentGate>
      <LoggingSurface />
    </ConsentGate>
  );
}
