import { useEffect, useState, type ReactElement } from 'react';
import { ConsentGate } from '../onboarding/ConsentGate';
import { SEED_EXERCISES } from '../../db/seed-exercises';
import { logSet, getLastSetForExercise, getTodaysSets, type LoggedSet } from '../../db/workouts';

const INPUT_CLASS = 'mt-1 min-h-[44px] w-full border border-rule bg-paper px-3 font-mono text-[16px] text-ink';
const LABEL_CLASS = 'block font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint';

function exerciseName(exerciseId: string): string {
  return SEED_EXERCISES.find((e) => e.id === exerciseId)?.name ?? exerciseId;
}

/**
 * The set-logging screen (Task 6). The scene is one hand, ~90 seconds
 * between sets: weight/reps are pre-filled from the previous set of the
 * SAME exercise, so the overwhelmingly common case — "same again", or "same
 * again, one more rep" — is a single tap on Log Set with no editing at all.
 * There is deliberately no separate "repeat last set" button or confirm
 * dialog; the defaulting itself IS the one-tap repeat.
 */
function LoggingSurface(): ReactElement {
  const [exerciseId, setExerciseId] = useState(SEED_EXERCISES[0].id);
  const [weightKg, setWeightKg] = useState('');
  const [reps, setReps] = useState('');
  const [rir, setRir] = useState('');
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Load today's already-logged sets on mount, so reopening the screen (or
  // reloading mid-session) still shows the write landed — this reads via
  // getTodaysSets, which never creates a workout on its own.
  useEffect(() => {
    let cancelled = false;
    getTodaysSets().then((existing) => {
      if (!cancelled) setLoggedSets(existing);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Defaults come from the previous set of the SAME exercise, never a global
  // last set — switching exercise must re-fetch this exercise's own history.
  useEffect(() => {
    let cancelled = false;
    getLastSetForExercise(exerciseId).then((last) => {
      if (cancelled) return;
      setWeightKg(last ? String(last.weightKg) : '');
      setReps(last ? String(last.reps) : '');
      setRir(last?.rir != null ? String(last.rir) : '');
    });
    return () => {
      cancelled = true;
    };
  }, [exerciseId]);

  async function handleLogSet() {
    if (submitting) return; // guards a double-tap from writing the set twice — not a network wait, the write itself is local and immediate
    const weight = Number(weightKg);
    const repsCount = Number(reps);
    if (!Number.isFinite(weight) || weight <= 0) return;
    if (!Number.isInteger(repsCount) || repsCount <= 0) return;

    setSubmitting(true);
    try {
      const created = await logSet({
        exerciseId,
        weightKg: weight,
        reps: repsCount,
        rir: rir === '' ? null : Number(rir), // FR-LOG-1: blank means null, never a default number
      });
      setLoggedSets((prev) => [created, ...prev]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[480px] px-4 pt-4 pb-8">
      <h1 className="font-serif text-[19px] leading-[1.3] tracking-[-0.005em] text-ink">Log a set</h1>

      <label className={`${LABEL_CLASS} mt-4`}>
        Exercise
        <select
          data-testid="exercise-select"
          className={`${INPUT_CLASS} font-serif normal-case tracking-normal text-[15px]`}
          value={exerciseId}
          onChange={(e) => setExerciseId(e.target.value)}
        >
          {SEED_EXERCISES.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className={LABEL_CLASS}>
          Weight (kg)
          <input
            data-testid="weight-input"
            className={INPUT_CLASS}
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
          />
        </label>
        <label className={LABEL_CLASS}>
          Reps
          <input
            data-testid="reps-input"
            className={INPUT_CLASS}
            type="number"
            inputMode="numeric"
            step="1"
            min="1"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
          />
        </label>
      </div>

      <label className={`${LABEL_CLASS} mt-4`}>
        RIR (reps in reserve) — optional
        <input
          data-testid="rir-input"
          className={INPUT_CLASS}
          type="number"
          inputMode="numeric"
          step="1"
          min="0"
          placeholder="not recorded"
          value={rir}
          onChange={(e) => setRir(e.target.value)}
        />
      </label>

      <button
        type="button"
        data-testid="log-set-button"
        onClick={handleLogSet}
        className="mt-6 min-h-[44px] w-full bg-ink font-sans text-[13px] font-semibold uppercase tracking-[0.08em] text-paper"
      >
        Log set
      </button>

      {loggedSets.length > 0 && (
        <section className="mt-8 border-t border-rule pt-4" aria-label="this session">
          <h2 className="font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
            Logged this session
          </h2>
          <ul>
            {loggedSets.map((s) => (
              <li
                key={s.id}
                data-testid="logged-set-row"
                className="mt-2 flex justify-between gap-3 border-b border-rule pb-2"
              >
                <span className="font-serif text-[13px] text-ink-soft">{exerciseName(s.exerciseId)}</span>
                <span className="font-mono text-[13px] text-ink">
                  {s.weightKg}kg &times; {s.reps}
                  {s.rir != null ? ` @RIR${s.rir}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** GR-5: this screen renders user health data, so it is unreachable without consent — wrapped in ConsentGate. */
export function LogWorkout(): ReactElement {
  return (
    <ConsentGate>
      <LoggingSurface />
    </ConsentGate>
  );
}
