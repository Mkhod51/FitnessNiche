import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { ConsentGate } from '../onboarding/ConsentGate';
import { SEED_EXERCISES } from '../../db/seed-exercises';
import {
  findOpenWorkout,
  startWorkout,
  finishWorkout,
  getRecentWorkouts,
  getLastSetForExercise,
  getOpenSessionSets,
  logSet,
  type Workout,
  type LoggedSet,
} from '../../db/workouts';

const LABEL = 'font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint';
const FIGURE = 'font-figure tabular-nums';
const CELL =
  'w-[62px] border border-rule bg-paper px-2 py-1.5 text-right text-[15px] text-ink outline-none focus:border-ink';
const TAP = 'transition-colors duration-[var(--motion-tap)] ease-[var(--motion-ease)]';

function exerciseName(exerciseId: string): string {
  return SEED_EXERCISES.find((e) => e.id === exerciseId)?.name ?? exerciseId;
}

function sinceLabel(iso: string, now: number): string {
  const days = Math.floor((now - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

function elapsed(startedAt: string, now: number): string {
  const total = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

type LiveRow = {
  exerciseId: string;
  weight: string;
  reps: string;
  rir: number | null;
  setType: 'working' | 'warmup';
};

/**
 * The set-logging surface, in the Hevy idiom, inside the world DESIGN.md
 * commits to.
 *
 * The behaviour of the screen this replaces is kept deliberately: weight and
 * reps default from the previous set of the SAME exercise, the write goes
 * straight to sqlite on tick, and there is no save button to miss (FR-LOG-4).
 * What changed is the layout — a set table instead of one form per set.
 */
function LoggingSurface(): ReactElement {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [recent, setRecent] = useState<Workout[]>([]);
  const [logged, setLogged] = useState<LoggedSet[]>([]);
  const [extras, setExtras] = useState<string[]>([]);
  const [live, setLive] = useState<LiveRow | null>(null);
  const [rirOpen, setRirOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let off = false;
    void (async () => {
      const open = await findOpenWorkout();
      if (off) return;
      setWorkout(open ?? null);
      if (open) setLogged(await getOpenSessionSets());
      else setRecent(await getRecentWorkouts(5));
    })();
    return () => {
      off = true;
    };
  }, []);

  // The elapsed clock is the one number here the app measures directly rather
  // than infers, so it ticks instead of being rounded away.
  useEffect(() => {
    if (!workout) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [workout]);

  const groups = useMemo(() => {
    const order: string[] = [];
    [...logged]
      .sort((a, b) => a.performedAt.localeCompare(b.performedAt))
      .forEach((s) => {
        if (!order.includes(s.exerciseId)) order.push(s.exerciseId);
      });
    extras.forEach((id) => {
      if (!order.includes(id)) order.push(id);
    });
    return order;
  }, [logged, extras]);

  const currentExerciseId = live?.exerciseId ?? groups[groups.length - 1] ?? null;

  // A live row for whichever exercise is current, pre-filled from that
  // exercise's OWN last set — never a global last set.
  useEffect(() => {
    if (!workout || !currentExerciseId || live) return;
    let off = false;
    void (async () => {
      const last = await getLastSetForExercise(currentExerciseId);
      if (off) return;
      setLive({
        exerciseId: currentExerciseId,
        weight: last ? String(last.weightKg) : '',
        reps: last ? String(last.reps) : '',
        rir: null, // RIR never carries over — it describes one set, not a plan
        setType: 'working',
      });
    })();
    return () => {
      off = true;
    };
  }, [workout, currentExerciseId, live]);

  const workingCount = logged.filter((s) => s.setType === 'working').length;
  const hasWarmup = logged.some((s) => s.setType === 'warmup');

  async function handleStart(name: string | null) {
    const created = await startWorkout(name);
    setWorkout(created);
    setLogged([]);
  }

  async function handleFinish() {
    if (!workout) return;
    await finishWorkout(workout.id);
    setWorkout(null);
    setLogged([]);
    setExtras([]);
    setLive(null);
    setRecent(await getRecentWorkouts(5));
  }

  async function handleTick() {
    if (!live || busy) return; // guards a double-tap writing the set twice
    setBusy(true);
    try {
      const created = await logSet({
        exerciseId: live.exerciseId,
        weightKg: Number(live.weight) || 0,
        reps: Number(live.reps) || 0,
        rir: live.rir, // FR-LOG-1: blank stays null, never defaulted to a number
        setType: live.setType,
      });
      setLogged((prev) => [...prev, created]);
      setRirOpen(false);
      setLive(null); // the effect opens a fresh row, defaulting back to working
    } finally {
      setBusy(false);
    }
  }

  if (!workout) {
    return (
      <div className="mx-auto max-w-[480px] px-4 pt-5 pb-10">
        <h1 className="font-serif text-[20px] leading-[1.2] text-ink">Train</h1>
        <button
          type="button"
          data-testid="start-workout-button"
          onClick={() => void handleStart(null)}
          className={`mt-4 min-h-[48px] w-full bg-ink px-4 font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-paper ${TAP} active:opacity-80`}
        >
          Start a workout
        </button>

        {recent.length > 0 && (
          <section className="mt-7">
            <p className={LABEL}>Or pick up a previous session</p>
            <ul className="mt-2 border-t border-rule">
              {recent.map((w) => (
                <li key={w.id}>
                  <button
                    type="button"
                    data-testid="recent-workout-row"
                    onClick={() => void handleStart(w.name)}
                    className={`flex min-h-[48px] w-full items-baseline justify-between gap-3 border-b border-rule py-2 text-left ${TAP} active:bg-paper-sunk`}
                  >
                    <span className="font-serif text-[15.5px] text-ink">{w.name ?? 'Unnamed session'}</span>
                    <span className={`${LABEL} ${FIGURE}`}>{sinceLabel(w.startedAt, now)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[480px] pb-10">
      <header className="flex items-baseline justify-between gap-3 border-b border-rule px-4 py-3">
        <div>
          <p className={LABEL}>
            {workout.name ?? 'Session'} &middot; {workingCount} {workingCount === 1 ? 'set' : 'sets'}
          </p>
          <p className={`${FIGURE} mt-0.5 text-[21px] text-ink`}>{elapsed(workout.startedAt, now)}</p>
        </div>
        <button
          type="button"
          data-testid="finish-button"
          onClick={() => void handleFinish()}
          className={`min-h-[44px] bg-ink px-4 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-paper ${TAP} active:opacity-80`}
        >
          Finish
        </button>
      </header>

      {groups.map((exId) => {
        const rows = logged
          .filter((s) => s.exerciseId === exId)
          .sort((a, b) => a.performedAt.localeCompare(b.performedAt));
        let working = 0;
        const isCurrent = live?.exerciseId === exId;

        return (
          <section key={exId} className="border-b border-rule px-4 pt-4 pb-3">
            <h2 className="font-serif text-[17px] leading-[1.3] text-ink">{exerciseName(exId)}</h2>

            <table className="mt-2 w-full border-collapse">
              <thead>
                <tr>
                  <th className={`${LABEL} w-[34px] border-b border-rule pb-1.5 text-left`}>Set</th>
                  <th className={`${LABEL} border-b border-rule pb-1.5 text-right`}>Previous</th>
                  <th className={`${LABEL} border-b border-rule pb-1.5 text-right`}>kg</th>
                  <th className={`${LABEL} border-b border-rule pb-1.5 text-right`}>Reps</th>
                  <th className={`${LABEL} w-[56px] border-b border-rule pb-1.5 text-right`}>RIR</th>
                  <th className="w-[52px] border-b border-rule" />
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const warm = s.setType === 'warmup';
                  if (!warm) working += 1;
                  return (
                    <tr key={s.id} className={warm ? 'text-ink-faint' : 'text-ink'}>
                      <td
                        data-testid="set-number"
                        className={`${FIGURE} border-b border-rule py-2 text-left text-[15px]`}
                      >
                        {warm ? 'W' : working}
                      </td>
                      <td className={`${FIGURE} border-b border-rule py-2 text-right text-[14px] text-ink-faint`}>
                        &mdash;
                      </td>
                      <td className={`${FIGURE} border-b border-rule py-2 text-right text-[15px]`}>{s.weightKg}</td>
                      <td className={`${FIGURE} border-b border-rule py-2 text-right text-[15px]`}>{s.reps}</td>
                      <td className={`${FIGURE} border-b border-rule py-2 text-right text-[15px]`}>
                        {warm ? '—' : (s.rir ?? '–')}
                      </td>
                      <td className="border-b border-rule py-2">
                        <span className="ml-auto flex h-[30px] w-[30px] items-center justify-center bg-ink text-paper">
                          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                            <path d="M3 8.5l3.2 3.2L13 5" fill="none" stroke="currentColor" strokeWidth={2} />
                          </svg>
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {isCurrent && live && (
                  <tr>
                    <td className={`${FIGURE} border-b border-rule py-2 text-left text-[15px] text-ink`}>
                      {live.setType === 'warmup' ? 'W' : working + 1}
                    </td>
                    <td className={`${FIGURE} border-b border-rule py-2 text-right text-[14px] text-ink-faint`}>
                      &mdash;
                    </td>
                    <td className="border-b border-rule py-2 text-right">
                      <input
                        data-testid="weight-input"
                        className={`${FIGURE} ${CELL}`}
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        min="0"
                        value={live.weight}
                        onChange={(e) => setLive({ ...live, weight: e.target.value })}
                      />
                    </td>
                    <td className="border-b border-rule py-2 text-right">
                      <input
                        data-testid="reps-input"
                        className={`${FIGURE} ${CELL} w-[54px]`}
                        type="number"
                        inputMode="numeric"
                        step="1"
                        min="0"
                        value={live.reps}
                        onChange={(e) => setLive({ ...live, reps: e.target.value })}
                      />
                    </td>
                    <td className="border-b border-rule py-2 text-right">
                      {/* Tapping opens tap targets, never a numeric keyboard: a
                          keyboard is the wrong control at arm's length with wet
                          hands. Dashed rather than absent, because a field you
                          cannot see is one that gets skipped forever — and RIR
                          is what gates the e1RM trend. */}
                      <button
                        type="button"
                        data-testid="rir-cell"
                        onClick={() => setRirOpen((v) => !v)}
                        className={`${FIGURE} min-h-[44px] w-[56px] border border-dashed border-rule-strong text-center text-[15px] ${TAP} ${live.rir === null ? 'text-ink-faint' : 'text-ink'}`}
                      >
                        {live.rir ?? '–'}
                      </button>
                    </td>
                    <td className="border-b border-rule py-2">
                      <button
                        type="button"
                        data-testid="tick-button"
                        onClick={() => void handleTick()}
                        aria-label="save this set"
                        className={`ml-auto flex min-h-[44px] min-w-[44px] items-center justify-center border border-rule-strong bg-paper text-ink ${TAP} active:bg-ink active:text-paper`}
                      >
                        <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
                          <path d="M3 8.5l3.2 3.2L13 5" fill="none" stroke="currentColor" strokeWidth={2} />
                        </svg>
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {isCurrent && live && rirOpen && (
              <div className="mt-2 flex items-center gap-2">
                <span className={LABEL}>Reps left</span>
                {[0, 1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    data-testid={`rir-option-${n}`}
                    onClick={() => {
                      setLive({ ...live, rir: n });
                      setRirOpen(false);
                    }}
                    className={`${FIGURE} min-h-[44px] min-w-[44px] border border-rule-strong text-[15px] text-ink ${TAP} active:bg-ink active:text-paper`}
                  >
                    {n === 4 ? '4+' : n}
                  </button>
                ))}
              </div>
            )}

            {isCurrent && live && (
              <div className="mt-3 flex gap-5">
                <button
                  type="button"
                  data-testid="add-set-button"
                  onClick={() => setLive({ ...live, setType: 'working' })}
                  className={`${LABEL} min-h-[44px] text-ink`}
                >
                  + Add set
                </button>
                <button
                  type="button"
                  data-testid="add-warmup-button"
                  onClick={() => setLive({ ...live, setType: 'warmup', rir: null })}
                  className={`${LABEL} min-h-[44px] text-ink`}
                >
                  + Warm-up
                </button>
              </div>
            )}
          </section>
        );
      })}

      {hasWarmup && (
        <p
          data-testid="warmup-note"
          className="px-4 pt-3 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft"
        >
          Warm-ups aren&rsquo;t counted toward your weekly sets or the 1RM estimate.
        </p>
      )}

      <div className="px-4 pt-5">
        {picking ? (
          <select
            data-testid="add-exercise-select"
            className="min-h-[48px] w-full border border-rule-strong bg-paper px-3 font-serif text-[15px] text-ink"
            defaultValue=""
            onChange={(e) => {
              const id = e.target.value;
              if (!id) return;
              setExtras((prev) => (prev.includes(id) ? prev : [...prev, id]));
              setLive({ exerciseId: id, weight: '', reps: '', rir: null, setType: 'working' });
              setPicking(false);
            }}
          >
            <option value="" disabled>
              Choose an exercise
            </option>
            {SEED_EXERCISES.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        ) : (
          <button
            type="button"
            data-testid="add-exercise-button"
            onClick={() => setPicking(true)}
            className={`min-h-[48px] w-full border border-ink font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-ink ${TAP} active:bg-paper-sunk`}
          >
            Add exercise
          </button>
        )}
      </div>
    </div>
  );
}

/** GR-5: this screen renders user health data, so it is unreachable without consent. */
export function LogWorkout(): ReactElement {
  return (
    <ConsentGate>
      <LoggingSurface />
    </ConsentGate>
  );
}
