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
  getWorkoutExerciseIds,
  renameWorkout,
  logSet,
  type Workout,
  type LoggedSet,
} from '../../db/workouts';
import { setE1rm } from '../../domain/e1rm';

const LABEL = 'font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint';
const FIGURE = 'font-figure tabular-nums';
// Text inputs with a decimal keypad, deliberately not type="number": the
// spinner arrows are unhittable at thumb scale, steal width from the figure,
// and sprout browser chrome onto a form that is meant to read as printed.
const CELL =
  'h-[44px] w-full border border-rule bg-paper px-2 text-right text-[16px] text-ink outline-none focus:border-ink';
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
  const [finishing, setFinishing] = useState(false);
  const [draftName, setDraftName] = useState('');
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

  async function handleStart(name: string | null, repeatOf?: string) {
    const created = await startWorkout(name);
    // "Pick up a previous session" means the exercises come back too. Carrying
    // only the name would leave the user re-adding the same five lifts by hand,
    // which is the friction the affordance exists to remove.
    const carried = repeatOf ? await getWorkoutExerciseIds(repeatOf) : [];
    setWorkout(created);
    setLogged([]);
    setExtras(carried);
    setLive(null);
  }

  function openFinish() {
    if (!workout) return;
    setDraftName(workout.name ?? '');
    setFinishing(true);
  }

  async function handleFinish() {
    if (!workout) return;
    // Name first, so the session is already named when it is closed and shows
    // up correctly in the "pick up a previous session" list.
    if (draftName.trim() && draftName.trim() !== workout.name) {
      await renameWorkout(workout.id, draftName);
    }
    await finishWorkout(workout.id);
    setWorkout(null);
    setLogged([]);
    setExtras([]);
    setLive(null);
    setFinishing(false);
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

  if (workout && finishing) {
    const working = logged.filter((s) => s.setType === 'working');
    const warmups = logged.length - working.length;
    // FR-SIG-1: a set only feeds the 1RM estimate at RIR <= 3 and <= 10 reps,
    // and a set with no RIR cannot be used at all. Saying so plainly is the
    // honest number here, and it is the one no incumbent shows.
    const qualifying = working.filter((s) => s.rir !== null && setE1rm(s.weightKg, s.reps, s.rir) !== null);
    const heaviest = working.reduce<LoggedSet | null>(
      (best, s) => (best === null || s.weightKg > best.weightKg ? s : best),
      null,
    );

    return (
      <div className="mx-auto max-w-[480px] px-4 pt-5 pb-10">
        <p className={LABEL}>Finishing</p>

        <label className="mt-3 block">
          <span className={LABEL}>Name this session</span>
          <input
            data-testid="workout-name-input"
            className="mt-1 h-[48px] w-full border border-rule-strong bg-paper px-3 font-serif text-[16px] text-ink outline-none focus:border-ink"
            type="text"
            autoComplete="off"
            placeholder="Push day"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
          />
          <span className="mt-1 block font-serif text-[12.5px] italic text-ink-soft">
            Optional. It is what you will recognise this session by later.
          </span>
        </label>

        <section className="mt-6 border-t border-rule pt-4">
          <p className={LABEL}>Working sets logged</p>
          <p data-testid="summary-working" className={`${FIGURE} text-[19px] text-ink`}>
            {working.length}
            {warmups > 0 && (
              <span className="ml-2 text-[14px] text-ink-faint">
                + {warmups} warm-up, not counted
              </span>
            )}
          </p>
        </section>

        <section className="mt-4 border-t border-rule pt-4">
          <p className={LABEL}>Usable for the 1RM estimate</p>
          <p data-testid="summary-qualifying" className={`${FIGURE} text-[19px] text-ink`}>
            {qualifying.length} of {working.length}
          </p>
          {qualifying.length < working.length && (
            <p className="mt-1 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
              The rest went past RIR 3 or 10 reps, or had no RIR recorded, so they cannot be
              used to estimate a 1RM.
            </p>
          )}
        </section>

        {heaviest && (
          <section className="mt-4 border-t border-rule pt-4">
            <p className={LABEL}>Heaviest working set</p>
            <p className={`${FIGURE} text-[17px] text-ink`}>
              {exerciseName(heaviest.exerciseId)} {heaviest.weightKg} &times; {heaviest.reps}
              {heaviest.rir !== null && <span className="text-ink-faint"> @ RIR {heaviest.rir}</span>}
            </p>
          </section>
        )}

        <div className="mt-7 flex flex-col gap-3">
          <button
            type="button"
            data-testid="confirm-finish-button"
            onClick={() => void handleFinish()}
            className={`min-h-[48px] w-full bg-ink px-4 font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-paper ${TAP} active:opacity-80`}
          >
            Save and finish
          </button>
          <button
            type="button"
            data-testid="cancel-finish-button"
            onClick={() => setFinishing(false)}
            className={`min-h-[44px] w-full font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint ${TAP}`}
          >
            Keep logging
          </button>
        </div>
      </div>
    );
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
                    onClick={() => void handleStart(w.name, w.id)}
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
          onClick={openFinish}
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
                  <th className={`${LABEL} w-[86px] border-b border-rule pb-1.5 text-right`}>kg</th>
                  <th className={`${LABEL} w-[68px] border-b border-rule pb-1.5 text-right`}>Reps</th>
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
                    <td className="w-[86px] border-b border-rule py-1.5 pr-1.5">
                      <input
                        data-testid="weight-input"
                        className={`${FIGURE} ${CELL}`}
                        type="text"
                        inputMode="decimal"
                        enterKeyHint="next"
                        autoComplete="off"
                        aria-label="weight in kilograms"
                        value={live.weight}
                        onChange={(e) => setLive({ ...live, weight: e.target.value.replace(/[^0-9.]/g, '') })}
                      />
                    </td>
                    <td className="w-[68px] border-b border-rule py-1.5 pr-1.5">
                      <input
                        data-testid="reps-input"
                        className={`${FIGURE} ${CELL}`}
                        type="text"
                        inputMode="numeric"
                        enterKeyHint="done"
                        autoComplete="off"
                        aria-label="reps"
                        value={live.reps}
                        onChange={(e) => setLive({ ...live, reps: e.target.value.replace(/[^0-9]/g, '') })}
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

            {/* There is always a live row, so "+ Add set" was a no-op that set
                the pending row to the type it already had — and at 9px with no
                border neither control read as tappable. What the row actually
                needs is to say which KIND of set it is, which DESIGN.md
                specifies as a segmented control. */}
            {isCurrent && live && (
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className={LABEL}>This set</span>
                <div
                  className="flex border border-rule-strong"
                  role="group"
                  aria-label="set type"
                >
                  <button
                    type="button"
                    data-testid="set-type-working"
                    aria-pressed={live.setType === 'working'}
                    onClick={() => setLive({ ...live, setType: 'working' })}
                    className={`min-h-[44px] px-4 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] ${TAP} ${
                      live.setType === 'working' ? 'bg-ink text-paper' : 'bg-paper text-ink-faint'
                    }`}
                  >
                    Working
                  </button>
                  <button
                    type="button"
                    data-testid="add-warmup-button"
                    aria-pressed={live.setType === 'warmup'}
                    // A warm-up carries no RIR — rating effort on a warm-up is
                    // meaningless, and leaving a stale value would feed it to
                    // the e1RM qualification check.
                    onClick={() => setLive({ ...live, setType: 'warmup', rir: null })}
                    className={`min-h-[44px] border-l border-rule-strong px-4 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] ${TAP} ${
                      live.setType === 'warmup' ? 'bg-ink text-paper' : 'bg-paper text-ink-faint'
                    }`}
                  >
                    Warm-up
                  </button>
                </div>
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
