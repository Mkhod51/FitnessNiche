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
  getWorkoutTemplate,
  getRecentExerciseIds,
  renameWorkout,
  logSet,
  type Workout,
  type LoggedSet,
} from '../../db/workouts';
import { setE1rm } from '../../domain/e1rm';
import { weeklySetsByMuscle } from '../../domain/volume';
import { getSetsSince } from '../../db/workouts';
import { getUser } from '../../db/user';
import { CLAIMS } from '../../generated/claims';
import { selectSessionAdvice } from '../../advice/session-advice';
import {
  recordAdviceShown,
  suppressClaim,
  suppressedClaimIds,
  recentlyShownClaimIds,
  shownInWorkout,
} from '../../db/advice-events';
import { AdvicePeek } from '../advice/AdvicePeek';
import type { Claim } from '../../advice/types';
import { ExercisePicker } from '../exercises/ExercisePicker';

const LABEL = 'font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint';
const FIGURE = 'font-figure tabular-nums';
const TAP = 'transition-colors duration-[var(--motion-tap)] ease-[var(--motion-ease)]';

// Text inputs with a decimal keypad, deliberately not type="number": the
// spinner arrows are unhittable at thumb scale and put browser chrome on a
// form meant to read as printed. Width comes from the column, never from the
// input, so nothing can spill past its cell.
const CELL =
  'h-[44px] w-full bg-paper text-center text-[15px] text-ink outline-none border border-rule focus:border-ink';

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

/**
 * A row you have not ticked yet. Deliberately UI state and not a database row:
 * an unticked row holds nothing worth keeping, and persisting it would mean a
 * nullable performed_at, which SQLite cannot add without rebuilding the table.
 */
type PendingRow = {
  key: string;
  weight: string;
  reps: string;
  rir: number | null;
  setType: 'working' | 'warmup';
};

type PendingByExercise = Record<string, PendingRow[]>;

let rowSeq = 0;
const newKey = () => `r${++rowSeq}`;

/**
 * The set-logging surface, in the Hevy idiom, inside the world DESIGN.md
 * commits to.
 *
 * Behaviour kept from the screen this replaces: weight and reps default from
 * the previous set of the SAME exercise, the write goes straight to sqlite on
 * tick, and there is no save button to miss (FR-LOG-4).
 */
function LoggingSurface(): ReactElement {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [recent, setRecent] = useState<Workout[]>([]);
  const [logged, setLogged] = useState<LoggedSet[]>([]);
  const [extras, setExtras] = useState<string[]>([]);
  const [pending, setPending] = useState<PendingByExercise>({});
  const [defaults, setDefaults] = useState<Record<string, { weight: string; reps: string }>>({});
  const [rirFor, setRirFor] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [recentExercises, setRecentExercises] = useState<string[]>([]);
  const [peek, setPeek] = useState<{ claim: Claim; why: string } | null>(null);
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
      if (open) {
        setLogged(await getOpenSessionSets());
        void pickSessionAdvice(open.id);
      }
      else setRecent(await getRecentWorkouts(5));
      setRecentExercises(await getRecentExerciseIds(6));
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
    Object.keys(pending).forEach((id) => {
      if (!order.includes(id)) order.push(id);
    });
    return order;
  }, [logged, extras, pending]);

  // Every exercise on screen keeps at least one open row, and each exercise
  // carries its OWN last set as the default — never a global last set.
  useEffect(() => {
    if (!workout) return;
    let off = false;
    void (async () => {
      for (const exId of groups) {
        if (defaults[exId] !== undefined) continue;
        const last = await getLastSetForExercise(exId);
        if (off) return;
        const d = { weight: last ? String(last.weightKg) : '', reps: last ? String(last.reps) : '' };
        setDefaults((prev) => (prev[exId] ? prev : { ...prev, [exId]: d }));
        // Seed one open row only when the exercise has nothing at all — freshly
        // added, nothing logged. Never top the queue back up afterwards.
        setPending((prev) =>
          prev[exId] !== undefined
            ? prev
            : { ...prev, [exId]: [{ key: newKey(), ...d, rir: null, setType: 'working' }] },
        );
      }
    })();
    return () => {
      off = true;
    };
  }, [workout, groups, defaults]);

  const workingCount = logged.filter((s) => s.setType === 'working').length;
  const hasWarmup = logged.some((s) => s.setType === 'warmup');

  function patchRow(exId: string, key: string, patch: Partial<PendingRow>) {
    setPending((prev) => ({
      ...prev,
      [exId]: (prev[exId] ?? []).map((r) => (r.key === key ? { ...r, ...patch } : r)),
    }));
  }

  function addRow(exId: string) {
    const d = defaults[exId] ?? { weight: '', reps: '' };
    setPending((prev) => ({
      ...prev,
      [exId]: [...(prev[exId] ?? []), { key: newKey(), ...d, rir: null, setType: 'working' }],
    }));
  }

  async function handleStart(name: string | null, repeatOf?: string) {
    const created = await startWorkout(name);

    // "Pick up a previous session" lays last time's session out again: the same
    // exercises, the same number of rows, pre-filled with the weights and reps
    // you actually did, all UNTICKED. You are about to repeat the workout, not
    // copy the record of it — so nothing is logged until you tick it.
    const template = repeatOf ? await getWorkoutTemplate(repeatOf) : [];

    const carriedPending: PendingByExercise = {};
    const carriedDefaults: Record<string, { weight: string; reps: string }> = {};
    for (const group of template) {
      carriedPending[group.exerciseId] = group.sets.map((t) => ({
        key: newKey(),
        weight: String(t.weightKg),
        reps: String(t.reps),
        rir: null, // RIR describes how a set felt; last week's cannot speak for today's
        setType: t.setType,
      }));
      // Defaults for any row added later come from the last WORKING set, not
      // the last set full stop — otherwise adding a set after a warm-up would
      // pre-fill the warm-up's weight.
      const lastWorking = [...group.sets].reverse().find((t) => t.setType === 'working') ?? group.sets.at(-1);
      carriedDefaults[group.exerciseId] = lastWorking
        ? { weight: String(lastWorking.weightKg), reps: String(lastWorking.reps) }
        : { weight: '', reps: '' };
    }

    setWorkout(created);
    setLogged([]);
    setExtras(template.map((g) => g.exerciseId));
    setPending(carriedPending);
    setDefaults(carriedDefaults);
    void pickSessionAdvice(created.id);
  }

  function openFinish() {
    if (!workout) return;
    setDraftName(workout.name ?? '');
    setFinishing(true);
  }

  /**
   * Chosen ONCE, when the session opens, and never re-evaluated inside it.
   * No predicate in the claim base reads within-session state, so nothing can
   * become true because of the set just logged — and the 90 seconds that matter
   * stay free of computation.
   */
  async function pickSessionAdvice(workoutId: string) {
    const user = await getUser();
    if (await shownInWorkout(workoutId)) return;

    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const recentSets = await getSetsSince(weekAgo);
    const byMuscle = weeklySetsByMuscle(recentSets, SEED_EXERCISES, weekAgo);

    const item = selectSessionAdvice(
      {
        goal: user.goal,
        deficitWeeks: 0,
        weightTrend: 'unknown',
        e1rmTrend: 'insufficient_data',
        weeklySetsByMuscle: byMuscle,
        proteinPerKg7d: null,
        numbersHidden: user.numbersHidden,
      },
      CLAIMS,
      {
        suppressedClaimIds: await suppressedClaimIds(),
        recentlyShownClaimIds: await recentlyShownClaimIds(),
        alreadyShownThisSession: false,
      },
    );
    if (!item) return;

    const claim = CLAIMS.find((c) => c.id === item.claimId);
    if (!claim) return;

    // A fact about the user's own data, never a recommendation (GR-4).
    const lowest = Object.entries(byMuscle).sort((a, b) => a[1] - b[1])[0];
    const why = lowest ? `${lowest[0].replace(/_/g, ' ')} · ${Math.round(lowest[1] * 10) / 10} sets in 7 days` : '';

    await recordAdviceShown(claim.id, item.trigger, workoutId);
    setPeek({ claim, why });
  }

  async function handleFinish() {
    if (!workout) return;
    // Name first, so the session is already named when it closes and is
    // recognisable in the "pick up a previous session" list.
    if (draftName.trim() && draftName.trim() !== workout.name) {
      await renameWorkout(workout.id, draftName);
    }
    await finishWorkout(workout.id);
    setWorkout(null);
    setLogged([]);
    setExtras([]);
    setPending({});
    setDefaults({});
    setFinishing(false);
    setRecent(await getRecentWorkouts(5));
  }

  async function handleTick(exId: string, row: PendingRow) {
    if (busy) return; // guards a double-tap writing the set twice
    setBusy(true);
    try {
      const created = await logSet({
        exerciseId: exId,
        weightKg: Number(row.weight) || 0,
        reps: Number(row.reps) || 0,
        rir: row.rir, // FR-LOG-1: blank stays null, never defaulted to a number
        setType: row.setType,
      });
      setLogged((prev) => [...prev, created]);
      setRirFor(null);
      // Only this row leaves, and nothing replaces it. Rows are added
      // deliberately with "+ Add set"; conjuring a fresh one after every tick
      // meant the table never emptied and you could not tell what was left to
      // do from what the app had invented.
      setPending((prev) => ({
        ...prev,
        [exId]: (prev[exId] ?? []).filter((r) => r.key !== row.key),
      }));
    } finally {
      setBusy(false);
    }
  }

  if (workout && finishing) {
    const working = logged.filter((s) => s.setType === 'working');
    const warmups = logged.length - working.length;
    // FR-SIG-1: a set only feeds the 1RM estimate at RIR <= 3 and <= 10 reps,
    // and a set with no RIR cannot be used at all. Saying so plainly is the
    // honest number here, and the one no incumbent shows.
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
              <span className="ml-2 text-[14px] text-ink-faint">+ {warmups} warm-up, not counted</span>
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
              The rest went past RIR 3 or 10 reps, or had no RIR recorded, so they cannot be used
              to estimate a 1RM.
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
        const queue = pending[exId] ?? [];
        let working = 0;

        return (
          <section key={exId} className="border-b border-rule px-4 pt-4 pb-3">
            <h2 className="font-serif text-[17px] leading-[1.3] text-ink">{exerciseName(exId)}</h2>

            <table className="mt-2 w-full table-fixed border-collapse">
              {/* Widths live here, once, so the header and the body cannot drift
                  apart — they were sized independently before, which is why the
                  columns did not line up. */}
              <colgroup>
                <col className="w-[30px]" />
                <col />
                <col className="w-[68px]" />
                <col className="w-[56px]" />
                <col className="w-[46px]" />
                <col className="w-[48px]" />
              </colgroup>
              <thead>
                <tr>
                  <th className={`${LABEL} border-b border-rule pb-1.5 text-left`}>Set</th>
                  <th className={`${LABEL} border-b border-rule pb-1.5 text-left`}>Previous</th>
                  <th className={`${LABEL} border-b border-rule pb-1.5 text-center`}>kg</th>
                  <th className={`${LABEL} border-b border-rule pb-1.5 text-center`}>Reps</th>
                  <th className={`${LABEL} border-b border-rule pb-1.5 text-center`}>RIR</th>
                  <th className="border-b border-rule" />
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const warm = s.setType === 'warmup';
                  if (!warm) working += 1;
                  return (
                    <tr key={s.id} className={warm ? 'text-ink-faint' : 'text-ink'}>
                      <td data-testid="set-number" className={`${FIGURE} border-b border-rule py-2 text-left text-[15px]`}>
                        {warm ? 'W' : working}
                      </td>
                      <td className={`${FIGURE} border-b border-rule py-2 text-left text-[13px] text-ink-faint`}>
                        &mdash;
                      </td>
                      <td className={`${FIGURE} border-b border-rule py-2 text-center text-[15px]`}>{s.weightKg}</td>
                      <td className={`${FIGURE} border-b border-rule py-2 text-center text-[15px]`}>{s.reps}</td>
                      <td className={`${FIGURE} border-b border-rule py-2 text-center text-[15px]`}>
                        {warm ? '—' : (s.rir ?? '–')}
                      </td>
                      <td className="border-b border-rule py-2">
                        <span className="tick-fill mx-auto flex h-[28px] w-[28px] items-center justify-center bg-ink text-paper">
                          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                            <path d="M3 8.5l3.2 3.2L13 5" fill="none" stroke="currentColor" strokeWidth={2} />
                          </svg>
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {queue.map((row) => {
                  const warm = row.setType === 'warmup';
                  const number = warm ? 'W' : ++working;
                  return (
                    <tr key={row.key} className="row-open">
                      <td className="border-b border-rule py-1.5">
                        {/* Tapping the set number changes the kind of set, which
                            is where Hevy puts it. Two kinds, so it toggles
                            rather than opening a sheet for a binary choice. */}
                        <button
                          type="button"
                          data-testid="set-type-toggle"
                          aria-label={`set ${number}: ${warm ? 'warm-up' : 'working'} set, tap to change`}
                          onClick={() =>
                            patchRow(exId, row.key, {
                              setType: warm ? 'working' : 'warmup',
                              // A warm-up carries no RIR — rating effort on one
                              // is meaningless, and a stale value would be fed
                              // to the e1RM qualification check.
                              rir: warm ? row.rir : null,
                            })
                          }
                          className={`${FIGURE} min-h-[44px] w-full text-left text-[15px] ${TAP} ${warm ? 'text-ink-faint' : 'text-ink'}`}
                        >
                          {number}
                        </button>
                      </td>
                      <td className={`${FIGURE} border-b border-rule py-1.5 text-left text-[13px] text-ink-faint`}>
                        &mdash;
                      </td>
                      <td className="border-b border-rule px-0.5 py-1.5">
                        <input
                          data-testid="weight-input"
                          className={`${FIGURE} ${CELL}`}
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          aria-label="weight in kilograms"
                          value={row.weight}
                          onChange={(e) => patchRow(exId, row.key, { weight: e.target.value.replace(/[^0-9.]/g, '') })}
                        />
                      </td>
                      <td className="border-b border-rule px-0.5 py-1.5">
                        <input
                          data-testid="reps-input"
                          className={`${FIGURE} ${CELL}`}
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          aria-label="reps"
                          value={row.reps}
                          onChange={(e) => patchRow(exId, row.key, { reps: e.target.value.replace(/[^0-9]/g, '') })}
                        />
                      </td>
                      <td className="border-b border-rule px-0.5 py-1.5">
                        <button
                          type="button"
                          data-testid="rir-cell"
                          disabled={warm}
                          onClick={() => setRirFor(rirFor === row.key ? null : row.key)}
                          className={`${FIGURE} h-[44px] w-full border border-dashed border-rule-strong text-center text-[15px] ${TAP} ${
                            warm ? 'opacity-40' : row.rir === null ? 'text-ink-faint' : 'text-ink'
                          }`}
                        >
                          {warm ? '—' : (row.rir ?? '–')}
                        </button>
                      </td>
                      <td className="border-b border-rule py-1.5">
                        <button
                          type="button"
                          data-testid="tick-button"
                          onClick={() => void handleTick(exId, row)}
                          aria-label="save this set"
                          className={`mx-auto flex min-h-[44px] min-w-[44px] items-center justify-center border border-rule-strong bg-paper text-ink ${TAP} active:bg-ink active:text-paper`}
                        >
                          <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
                            <path d="M3 8.5l3.2 3.2L13 5" fill="none" stroke="currentColor" strokeWidth={2} />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {rirFor !== null && queue.some((r) => r.key === rirFor) && (
              <div className="mt-2 flex items-center gap-2">
                <span className={LABEL}>Reps left</span>
                {[0, 1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    data-testid={`rir-option-${n}`}
                    onClick={() => {
                      patchRow(exId, rirFor, { rir: n });
                      setRirFor(null);
                    }}
                    className={`${FIGURE} min-h-[44px] min-w-[44px] border border-rule-strong text-[15px] text-ink ${TAP} active:bg-ink active:text-paper`}
                  >
                    {n === 4 ? '4+' : n}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              data-testid="add-set-button"
              onClick={() => addRow(exId)}
              className={`mt-3 min-h-[44px] w-full border border-rule-strong font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-ink ${TAP} active:bg-paper-sunk`}
            >
              + Add set
            </button>
          </section>
        );
      })}

      {hasWarmup && (
        <p data-testid="warmup-note" className="px-4 pt-3 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
          Warm-ups aren&rsquo;t counted toward your weekly sets or the 1RM estimate.
        </p>
      )}

      {peek && (
        <AdvicePeek
          claim={peek.claim}
          why={peek.why}
          onDismiss={() => setPeek(null)}
          onSuppress={() => {
            void suppressClaim(peek.claim.id);
            setPeek(null);
          }}
        />
      )}

      <div className="px-4 pt-5">
        <button
          type="button"
          data-testid="add-exercise-button"
          onClick={() => setPicking(true)}
          className={`min-h-[48px] w-full border border-ink font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-ink ${TAP} active:bg-paper-sunk`}
        >
          Add exercise
        </button>
      </div>

      <ExercisePicker
        open={picking}
        recentIds={recentExercises}
        onClose={() => setPicking(false)}
        onPick={(id) => {
          setExtras((prev) => (prev.includes(id) ? prev : [...prev, id]));
          setPicking(false);
        }}
      />
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
