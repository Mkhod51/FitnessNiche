import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogWorkout } from './LogWorkout';
import { getUser, type User } from '../../db/user';
import {
  findOpenWorkout,
  startWorkout,
  finishWorkout,
  getRecentWorkouts,
  getLastSetForExercise,
  getOpenSessionSets,
  getWorkoutTemplate,
  getRecentExerciseIds,
  getSetsSince,
  renameWorkout,
  logSet,
  type Workout,
  type LoggedSet,
} from '../../db/workouts';
import { getWeightHistory } from '../../db/weights';
import { getEntriesSince } from '../../db/nutrition';
import {
  recordAdviceShown,
  suppressClaim,
  suppressedClaimIds,
  recentlyShownClaimIds,
  shownInWorkout,
} from '../../db/advice-events';
import { loadAdviceSnapshot } from '../../advice/load-snapshot';
import { EMPTY_SNAPSHOT } from '../../advice/engine';
import type { BuiltSnapshot } from '../../advice/snapshot';
import { selectSurfaceAdvice } from '../../advice/surface-advice';
import type { AdviceItem } from '../../advice/types';
import { CLAIMS } from '../../generated/claims';

vi.mock('../../db/user', async () => {
  const actual = await vi.importActual<typeof import('../../db/user')>('../../db/user');
  return { ...actual, getUser: vi.fn() };
});

vi.mock('../../db/workouts', async () => {
  const actual = await vi.importActual<typeof import('../../db/workouts')>('../../db/workouts');
  return {
    ...actual,
    findOpenWorkout: vi.fn(),
    startWorkout: vi.fn(),
    finishWorkout: vi.fn(),
    getRecentWorkouts: vi.fn(),
    getLastSetForExercise: vi.fn(),
    getOpenSessionSets: vi.fn(),
    getWorkoutTemplate: vi.fn(),
    getRecentExerciseIds: vi.fn(),
    getSetsSince: vi.fn(),
    renameWorkout: vi.fn(),
    logSet: vi.fn(),
  };
});

vi.mock('../../db/weights', async () => {
  const actual = await vi.importActual<typeof import('../../db/weights')>('../../db/weights');
  return { ...actual, getWeightHistory: vi.fn() };
});

vi.mock('../../db/nutrition', async () => {
  const actual = await vi.importActual<typeof import('../../db/nutrition')>('../../db/nutrition');
  return { ...actual, getEntriesSince: vi.fn() };
});

vi.mock('../../db/advice-events', async () => {
  const actual = await vi.importActual<typeof import('../../db/advice-events')>('../../db/advice-events');
  return {
    ...actual,
    recordAdviceShown: vi.fn(),
    suppressClaim: vi.fn(),
    suppressedClaimIds: vi.fn(),
    recentlyShownClaimIds: vi.fn(),
    shownInWorkout: vi.fn(),
  };
});

vi.mock('../../advice/load-snapshot', () => ({ loadAdviceSnapshot: vi.fn() }));
vi.mock('../../advice/surface-advice', async () => {
  const actual = await vi.importActual<typeof import('../../advice/surface-advice')>('../../advice/surface-advice');
  return { ...actual, selectSurfaceAdvice: vi.fn() };
});

const mockGetUser = vi.mocked(getUser);
const mockFindOpenWorkout = vi.mocked(findOpenWorkout);
const mockStartWorkout = vi.mocked(startWorkout);
const mockFinishWorkout = vi.mocked(finishWorkout);
const mockGetRecentWorkouts = vi.mocked(getRecentWorkouts);
const mockGetLastSetForExercise = vi.mocked(getLastSetForExercise);
const mockGetOpenSessionSets = vi.mocked(getOpenSessionSets);
const mockGetWorkoutTemplate = vi.mocked(getWorkoutTemplate);
const mockGetRecentExerciseIds = vi.mocked(getRecentExerciseIds);
const mockGetSetsSince = vi.mocked(getSetsSince);
const mockRenameWorkout = vi.mocked(renameWorkout);
const mockLogSet = vi.mocked(logSet);
const mockGetWeightHistory = vi.mocked(getWeightHistory);
const mockGetEntriesSince = vi.mocked(getEntriesSince);
const mockRecordAdviceShown = vi.mocked(recordAdviceShown);
const mockSuppressClaim = vi.mocked(suppressClaim);
const mockSuppressedClaimIds = vi.mocked(suppressedClaimIds);
const mockRecentlyShownClaimIds = vi.mocked(recentlyShownClaimIds);
const mockShownInWorkout = vi.mocked(shownInWorkout);
const mockLoadAdviceSnapshot = vi.mocked(loadAdviceSnapshot);
const mockSelectSurfaceAdvice = vi.mocked(selectSurfaceAdvice);
const BENCH_ID = 'barbell-bench-press';
const SQUAT_ID = 'barbell-back-squat';

const exerciseAdviceItem: AdviceItem = {
  claimId: 'c-rest-at-least-60-seconds',
  trigger: 'surface-context',
  headline: 'Rest periods affect training performance',
  snapshot: EMPTY_SNAPSHOT,
};

const emptyBuiltSnapshot: BuiltSnapshot = {
  hasAnyLoggedData: false,
  snapshot: EMPTY_SNAPSHOT,
  primaryExerciseId: null,
  latestWeightKg: null,
  reconciliation: {
    verdict: 'unresolved',
    confidence: 'low',
    weightTrend: 'unknown',
    e1rmTrend: 'insufficient_data',
    deficitWeeks: 0,
    unresolved: ['weight', 'strength'],
    observed: {
      weightKgPerWeek: null,
      e1rmPctPerWeek: null,
      e1rmCi95: null,
      e1rmWithinNoise: null,
      windowDays: 0,
      weighIns: 0,
      e1rmSessions: 0,
    },
  },
};

const strengthHoldingSnapshot: BuiltSnapshot = {
  ...emptyBuiltSnapshot,
  hasAnyLoggedData: true,
  primaryExerciseId: BENCH_ID,
  latestWeightKg: 78,
  snapshot: {
    ...EMPTY_SNAPSHOT,
    goal: 'cut',
    deficitWeeks: 8,
    weightTrend: 'down',
    e1rmTrend: 'holding',
  },
  reconciliation: {
    ...emptyBuiltSnapshot.reconciliation,
    verdict: 'on_track',
    confidence: 'high',
    weightTrend: 'down',
    e1rmTrend: 'holding',
    deficitWeeks: 8,
    unresolved: [],
    observed: {
      weightKgPerWeek: -0.35,
      e1rmPctPerWeek: 0.05,
      e1rmCi95: [-0.2, 0.3],
      e1rmWithinNoise: true,
      windowDays: 56,
      weighIns: 20,
      e1rmSessions: 16,
    },
  },
};

const consentedUser: User = {
  id: 'local-user',
  goal: 'maintain',
  sex: 'unspecified',
  heightCm: null,
  numbersHidden: false,
  calorieTargetKcal: null,
  proteinTargetG: null,
  deficitKcal: 0,
  birthYear: null,
  goalStartedAt: null,
  trainingExperience: null,
  consentedAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function makeWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: 'workout-1',
    userId: 'local-user',
    startedAt: '2026-07-27T10:00:00.000Z',
    name: 'Push Day',
    finishedAt: null,
    updatedAt: '2026-07-27T10:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

function makeSet(overrides: Partial<LoggedSet> = {}): LoggedSet {
  return {
    id: 'set-1',
    workoutId: 'workout-1',
    exerciseId: BENCH_ID,
    weightKg: 60,
    reps: 5,
    rir: 2,
    setType: 'working',
    performedAt: '2026-07-27T10:05:00.000Z',
    updatedAt: '2026-07-27T10:05:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

function resetMocks() {
  mockGetUser.mockReset();
  mockFindOpenWorkout.mockReset();
  mockStartWorkout.mockReset();
  mockFinishWorkout.mockReset();
  mockGetRecentWorkouts.mockReset();
  mockGetLastSetForExercise.mockReset();
  mockGetOpenSessionSets.mockReset();
  mockGetWorkoutTemplate.mockReset();
  mockGetRecentExerciseIds.mockReset();
  mockGetSetsSince.mockReset();
  mockRenameWorkout.mockReset();
  mockLogSet.mockReset();
  mockGetWeightHistory.mockReset();
  mockGetEntriesSince.mockReset();
  mockRecordAdviceShown.mockReset();
  mockSuppressClaim.mockReset();
  mockSuppressedClaimIds.mockReset();
  mockRecentlyShownClaimIds.mockReset();
  mockShownInWorkout.mockReset();
  mockLoadAdviceSnapshot.mockReset();
  mockSelectSurfaceAdvice.mockReset();

  mockGetUser.mockResolvedValue(consentedUser);
  mockFindOpenWorkout.mockResolvedValue(undefined);
  mockGetRecentWorkouts.mockResolvedValue([]);
  mockGetLastSetForExercise.mockResolvedValue(undefined);
  mockGetOpenSessionSets.mockResolvedValue([]);
  mockGetWorkoutTemplate.mockResolvedValue([]);
  mockGetRecentExerciseIds.mockResolvedValue([]);
  mockGetSetsSince.mockResolvedValue([]);
  mockRenameWorkout.mockResolvedValue(undefined);
  mockFinishWorkout.mockResolvedValue(undefined);
  mockGetWeightHistory.mockResolvedValue([]);
  mockGetEntriesSince.mockResolvedValue([]);
  mockRecordAdviceShown.mockResolvedValue(undefined as never);
  mockSuppressClaim.mockResolvedValue(undefined);
  mockSuppressedClaimIds.mockResolvedValue([]);
  mockRecentlyShownClaimIds.mockResolvedValue([]);
  mockShownInWorkout.mockResolvedValue(false);
  mockLoadAdviceSnapshot.mockResolvedValue(emptyBuiltSnapshot);
  mockSelectSurfaceAdvice.mockReturnValue(null);
}

async function chooseExercise(exerciseId: string) {
  fireEvent.click(await screen.findByTestId('add-exercise-button'));
  fireEvent.click(
    (await screen.findAllByTestId('exercise-row')).find(
      (row) => row.getAttribute('data-exercise-id') === exerciseId,
    )!,
  );
}

describe('LogWorkout — GR-5: unreachable without consent', () => {
  beforeEach(resetMocks);

  it('does not render the logging screen until consent is recorded', async () => {
    mockGetUser.mockResolvedValue({ ...consentedUser, consentedAt: null });
    render(<LogWorkout />);
    await screen.findByTestId('consent-gate');
    expect(screen.queryByTestId('start-workout-button')).not.toBeInTheDocument();
    expect(mockLoadAdviceSnapshot).not.toHaveBeenCalled();
  });

  it('renders the screen once consent is already recorded', async () => {
    render(<LogWorkout />);
    await screen.findByTestId('start-workout-button');
  });
});

describe('LogWorkout — State A: no open session', () => {
  beforeEach(resetMocks);

  it('shows "Start a workout"; pressing it calls startWorkout', async () => {
    mockStartWorkout.mockResolvedValue(makeWorkout());
    render(<LogWorkout />);

    const button = await screen.findByTestId('start-workout-button');
    fireEvent.click(button);

    await waitFor(() => expect(mockStartWorkout).toHaveBeenCalledWith(null));
  });

  it('omits the previous-sessions section when getRecentWorkouts is empty', async () => {
    render(<LogWorkout />);
    await screen.findByTestId('start-workout-button');
    expect(screen.queryByTestId('recent-workout-row')).not.toBeInTheDocument();
  });

  // CHANGED deliberately. This asserted that repeating a session copied only
  // its NAME, which is what shipped and is not what "pick up a previous
  // session" means to anyone using it — you get the name back and then re-add
  // the same five lifts by hand. Gate 2 specified carrying the exercise list;
  // the implementation followed this test instead of the design.
  it('tapping a previous session lays out its exercises AND its sets, unticked', async () => {
    mockGetRecentWorkouts.mockResolvedValue([makeWorkout({ id: 'w-old', name: 'Leg Day' })]);
    mockStartWorkout.mockResolvedValue(makeWorkout({ id: 'w-new', name: 'Leg Day' }));
    mockGetWorkoutTemplate.mockResolvedValue([
      {
        exerciseId: BENCH_ID,
        sets: [
          { weightKg: 40, reps: 8, setType: 'warmup' },
          { weightKg: 100, reps: 5, setType: 'working' },
          { weightKg: 100, reps: 5, setType: 'working' },
        ],
      },
    ]);

    render(<LogWorkout />);
    const row = await screen.findByTestId('recent-workout-row');
    expect(row).toHaveTextContent('Leg Day');
    fireEvent.click(row);

    await waitFor(() => expect(mockStartWorkout).toHaveBeenCalledWith('Leg Day'));
    expect(mockGetWorkoutTemplate).toHaveBeenCalledWith('w-old');
    expect(await screen.findByText('Barbell Bench Press')).toBeInTheDocument();

    // Three rows, pre-filled with what was actually done last time.
    const weights = await screen.findAllByTestId('weight-input');
    expect(weights).toHaveLength(3);
    expect(weights[0]).toHaveValue('40');
    expect(weights[1]).toHaveValue('100');
    expect(weights[2]).toHaveValue('100');
    expect(screen.getAllByTestId('reps-input')[0]).toHaveValue('8');

    // The warm-up carries its type across.
    expect(screen.getAllByTestId('set-type-toggle')[0]).toHaveTextContent('W');
    expect(screen.getAllByTestId('set-type-toggle')[1]).toHaveTextContent('1');

    // NOTHING is logged by repeating — you are about to do the workout, not
    // copy the record of it.
    expect(mockLogSet).not.toHaveBeenCalled();
    expect(screen.queryByTestId('set-number')).not.toBeInTheDocument();
  });
});

describe('LogWorkout — State B: an open session', () => {
  beforeEach(() => {
    resetMocks();
    mockFindOpenWorkout.mockResolvedValue(makeWorkout());
    mockGetOpenSessionSets.mockResolvedValue([makeSet()]);
  });

  it('shows a data-earned claim from the loaded session snapshot once, without re-evaluating after a set', async () => {
    mockLoadAdviceSnapshot.mockResolvedValue(strengthHoldingSnapshot);
    mockSuppressedClaimIds.mockResolvedValue([
      'c-deficit-beyond-500-blocks-lean-mass',
      'c-deficit-impairs-lean-mass',
    ]);
    mockLogSet.mockResolvedValue(makeSet({ id: 'set-2' }));

    render(<LogWorkout />);

    const peek = await screen.findByTestId('advice-peek');
    expect(peek).toHaveTextContent(/strength appears to hold up better/i);
    expect(peek).toHaveTextContent(/barbell bench press e1rm held over 8 weeks/i);
    expect(mockRecordAdviceShown).toHaveBeenCalledWith(
      'c-strength-holds-through-a-deficit',
      'data-earned',
      'workout-1',
      'workout-start',
    );

    fireEvent.click(await screen.findByTestId('tick-button'));
    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(1));
    expect(mockLoadAdviceSnapshot).toHaveBeenCalledTimes(1);
  });

  it('shows one cited General evidence card after the first chosen exercise', async () => {
    mockGetOpenSessionSets.mockResolvedValue([]);
    mockLoadAdviceSnapshot.mockResolvedValue(null);
    mockGetUser.mockResolvedValue({ ...consentedUser, trainingExperience: 'experienced' });
    mockSelectSurfaceAdvice.mockReturnValue(exerciseAdviceItem);

    render(<LogWorkout />);
    await chooseExercise(BENCH_ID);

    const peek = await screen.findByTestId('advice-peek');
    expect(peek).toHaveTextContent('General evidence');
    fireEvent.click(screen.getByTestId('advice-expand'));
    const card = screen.getByTestId('claim-card');
    expect(card).toHaveAttribute(
      'data-claim-id',
      exerciseAdviceItem.claimId,
    );
    const selectedClaim = CLAIMS.find((claim) => claim.id === exerciseAdviceItem.claimId)!;
    expect(screen.getByTestId('claim-source')).toHaveTextContent(
      selectedClaim.citations[0]!.year.toString(),
    );
    expect(mockSelectSurfaceAdvice).toHaveBeenCalledWith(
      {
        surface: 'exercise-selection',
        exerciseId: BENCH_ID,
        experience: 'experienced',
      },
      expect.any(Array),
      { suppressedClaimIds: [], recentlyShownClaimIds: [] },
    );
    expect(mockRecordAdviceShown).toHaveBeenCalledWith(
      exerciseAdviceItem.claimId,
      'surface-context',
      'workout-1',
      'exercise-selection',
    );
  });

  it('does not select again after a second exercise or a logged set', async () => {
    mockGetOpenSessionSets.mockResolvedValue([]);
    mockLoadAdviceSnapshot.mockResolvedValue(null);
    mockSelectSurfaceAdvice.mockReturnValue(exerciseAdviceItem);
    mockLogSet.mockResolvedValue(makeSet());

    render(<LogWorkout />);
    await chooseExercise(BENCH_ID);
    await screen.findByTestId('advice-peek');
    await chooseExercise(SQUAT_ID);
    fireEvent.click((await screen.findAllByTestId('tick-button'))[0]);

    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(1));
    expect(mockSelectSurfaceAdvice).toHaveBeenCalledTimes(1);
    expect(mockRecordAdviceShown).toHaveBeenCalledTimes(1);
  });

  it('keeps the exercise lane silent when the workout already has an advice event', async () => {
    mockGetOpenSessionSets.mockResolvedValue([]);
    mockShownInWorkout.mockResolvedValue(true);
    mockSelectSurfaceAdvice.mockReturnValue(exerciseAdviceItem);

    render(<LogWorkout />);
    await waitFor(() => expect(mockShownInWorkout).toHaveBeenCalledWith('workout-1'));
    await chooseExercise(BENCH_ID);

    await waitFor(() => expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument());
    expect(mockSelectSurfaceAdvice).not.toHaveBeenCalled();
    expect(mockRecordAdviceShown).not.toHaveBeenCalled();
    expect(screen.queryByTestId('advice-peek')).not.toBeInTheDocument();
  });

  it('is silent when no claim supports the selected exercise', async () => {
    mockGetOpenSessionSets.mockResolvedValue([]);
    mockLoadAdviceSnapshot.mockResolvedValue(null);
    mockSelectSurfaceAdvice.mockReturnValue(null);

    render(<LogWorkout />);
    await chooseExercise(BENCH_ID);

    await waitFor(() => expect(mockSelectSurfaceAdvice).toHaveBeenCalledTimes(1));
    expect(mockRecordAdviceShown).not.toHaveBeenCalled();
    expect(screen.queryByTestId('advice-peek')).not.toBeInTheDocument();
  });

  it('serializes a fast first pick behind opening advice so only one event is written', async () => {
    mockGetOpenSessionSets.mockResolvedValue([]);
    let releaseOpening!: (value: BuiltSnapshot | null) => void;
    mockLoadAdviceSnapshot.mockReturnValue(
      new Promise((resolve) => {
        releaseOpening = resolve;
      }),
    );
    mockSuppressedClaimIds.mockResolvedValue([
      'c-deficit-beyond-500-blocks-lean-mass',
      'c-deficit-impairs-lean-mass',
    ]);
    mockSelectSurfaceAdvice.mockReturnValue(exerciseAdviceItem);

    render(<LogWorkout />);
    await waitFor(() => expect(mockLoadAdviceSnapshot).toHaveBeenCalledTimes(1));
    await chooseExercise(BENCH_ID);
    releaseOpening(strengthHoldingSnapshot);

    await screen.findByTestId('advice-peek');
    await waitFor(() => expect(mockRecordAdviceShown).toHaveBeenCalledTimes(1));
    expect(mockRecordAdviceShown).toHaveBeenCalledWith(
      'c-strength-holds-through-a-deficit',
      'data-earned',
      'workout-1',
      'workout-start',
    );
    expect(mockSelectSurfaceAdvice).not.toHaveBeenCalled();
  });

  it('lets a fast first pick try exercise advice after pending opening advice misses', async () => {
    mockGetOpenSessionSets.mockResolvedValue([]);
    let releaseOpening!: (value: BuiltSnapshot | null) => void;
    mockLoadAdviceSnapshot.mockReturnValue(
      new Promise((resolve) => {
        releaseOpening = resolve;
      }),
    );
    mockSelectSurfaceAdvice.mockReturnValue(exerciseAdviceItem);

    render(<LogWorkout />);
    await waitFor(() => expect(mockLoadAdviceSnapshot).toHaveBeenCalledTimes(1));
    await chooseExercise(BENCH_ID);
    expect(mockSelectSurfaceAdvice).not.toHaveBeenCalled();
    releaseOpening(null);

    expect(await screen.findByTestId('advice-peek')).toHaveTextContent('General evidence');
    expect(mockSelectSurfaceAdvice).toHaveBeenCalledTimes(1);
    expect(mockRecordAdviceShown).toHaveBeenCalledTimes(1);
  });

  it('ticking a row calls logSet with the right weight/reps and rir: null when RIR was left empty', async () => {
    mockGetLastSetForExercise.mockResolvedValue(makeSet({ weightKg: 62.5, reps: 6, rir: 1 }));
    mockLogSet.mockResolvedValue(makeSet({ id: 'set-2', weightKg: 62.5, reps: 6, rir: null }));

    render(<LogWorkout />);
    const weightInput = await screen.findByTestId('weight-input');
    // String values, not numbers: these are text inputs with a decimal keypad
    // rather than type="number", because the spinner arrows are unhittable at
    // thumb scale and put browser chrome on a form meant to read as printed.
    await waitFor(() => expect(weightInput).toHaveValue('62.5'));
    expect(screen.getByTestId('reps-input')).toHaveValue('6');

    fireEvent.click(screen.getByTestId('tick-button'));

    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(1));
    expect(mockLogSet).toHaveBeenCalledWith(
      expect.objectContaining({ exerciseId: BENCH_ID, weightKg: 62.5, reps: 6, rir: null }),
    );
  });

  // OQ-1. Ticking an empty box used to store 0 kg × 0, which counts as a hard
  // set against weekly volume while contributing nothing to the e1RM estimate —
  // so it inflated exactly the number the reconciliation engine will read.
  // This session already has one bench set logged at 60 × 5 (see the beforeEach
  // above), and history holds a heavier 80 × 8. The set from THIS session is the
  // one that carries: "previous" means the last thing actually done, not the
  // best thing ever done.
  it('a blank weight or reps takes the previous set for that exercise, never a zero', async () => {
    mockGetLastSetForExercise.mockResolvedValue(makeSet({ weightKg: 80, reps: 8, rir: 2 }));
    mockLogSet.mockResolvedValue(makeSet({ id: 'set-2', weightKg: 60, reps: 5 }));

    render(<LogWorkout />);
    const weightInput = await screen.findByTestId('weight-input');
    await waitFor(() => expect(weightInput).toHaveValue('80'));

    // Clear both, as a lifter wiping the prefill would.
    fireEvent.change(weightInput, { target: { value: '' } });
    fireEvent.change(screen.getByTestId('reps-input'), { target: { value: '' } });
    fireEvent.click(screen.getByTestId('tick-button'));

    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(1));
    expect(mockLogSet).toHaveBeenCalledWith(
      expect.objectContaining({ exerciseId: BENCH_ID, weightKg: 60, reps: 5 }),
    );
  });

  // An exercise added mid-session has nothing logged against it yet, so the
  // fallback drops back to that exercise's OWN historical last set — never to
  // the bench set sitting above it on the same screen.
  it('falls back to the historical last set for an exercise added mid-session', async () => {
    const SQUAT_ID = 'barbell-back-squat';
    mockGetLastSetForExercise.mockImplementation(async (id: string) =>
      id === SQUAT_ID ? makeSet({ exerciseId: SQUAT_ID, weightKg: 100, reps: 3 }) : makeSet(),
    );
    mockLogSet.mockResolvedValue(makeSet({ id: 'set-2', exerciseId: SQUAT_ID, weightKg: 100, reps: 3 }));

    render(<LogWorkout />);
    fireEvent.click(await screen.findByTestId('add-exercise-button'));
    fireEvent.click(
      (await screen.findAllByTestId('exercise-row')).find(
        (el) => el.getAttribute('data-exercise-id') === SQUAT_ID,
      )!,
    );

    // Re-queried inside waitFor: the squat section mounts after the picker
    // closes, so an array captured before that still holds only the bench row.
    await waitFor(() => {
      const w = screen.getAllByTestId('weight-input');
      expect(w).toHaveLength(2);
      expect(w[1]).toHaveValue('100');
    });

    fireEvent.change(screen.getAllByTestId('weight-input')[1], { target: { value: '' } });
    fireEvent.change(screen.getAllByTestId('reps-input')[1], { target: { value: '' } });
    fireEvent.click(screen.getAllByTestId('tick-button')[1]);

    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(1));
    expect(mockLogSet).toHaveBeenCalledWith(
      expect.objectContaining({ exerciseId: SQUAT_ID, weightKg: 100, reps: 3 }),
    );
  });

  // The other half of the same rule: an explicit zero is a real value, because
  // bodyweight work legitimately weighs nothing. Only a BLANK box falls back.
  it('an explicit 0 weight is stored as 0, not replaced by the previous set', async () => {
    mockGetLastSetForExercise.mockResolvedValue(makeSet({ weightKg: 80, reps: 8, rir: 2 }));
    mockLogSet.mockResolvedValue(makeSet({ id: 'set-2', weightKg: 0, reps: 12 }));

    render(<LogWorkout />);
    const weightInput = await screen.findByTestId('weight-input');
    await waitFor(() => expect(weightInput).toHaveValue('80'));

    fireEvent.change(weightInput, { target: { value: '0' } });
    fireEvent.change(screen.getByTestId('reps-input'), { target: { value: '12' } });
    fireEvent.click(screen.getByTestId('tick-button'));

    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(1));
    expect(mockLogSet).toHaveBeenCalledWith(
      expect.objectContaining({ weightKg: 0, reps: 12 }),
    );
  });

  it('tapping the RIR cell then tapping "2" causes the next logSet to carry rir: 2', async () => {
    mockLogSet.mockResolvedValue(makeSet({ id: 'set-2', rir: 2 }));
    render(<LogWorkout />);

    await screen.findByTestId('weight-input');
    fireEvent.click(screen.getByTestId('rir-cell'));
    fireEvent.click(await screen.findByTestId('rir-option-2'));

    fireEvent.click(screen.getByTestId('tick-button'));

    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(1));
    expect(mockLogSet).toHaveBeenCalledWith(expect.objectContaining({ rir: 2 }));
  });

  it('tapping the set number marks the row a warm-up, and ticking logs it as one', async () => {
    mockLogSet.mockResolvedValue(makeSet({ id: 'set-2', setType: 'warmup' }));
    render(<LogWorkout />);

    await screen.findByTestId('weight-input');
    fireEvent.click(screen.getByTestId('set-type-toggle'));
    fireEvent.click(screen.getByTestId('tick-button'));

    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(1));
    expect(mockLogSet).toHaveBeenCalledWith(expect.objectContaining({ setType: 'warmup' }));
  });

  it('warm-up rows do not consume working-set numbers: after one warm-up and one working set, the working row is labelled 1', async () => {
    mockGetOpenSessionSets.mockResolvedValue([]);
    mockGetLastSetForExercise.mockResolvedValue(undefined);
    mockLogSet
      .mockResolvedValueOnce(makeSet({ id: 'set-warm', setType: 'warmup', weightKg: 40, reps: 8 }))
      .mockResolvedValueOnce(makeSet({ id: 'set-work', setType: 'working', weightKg: 60, reps: 5 }));

    render(<LogWorkout />);
    fireEvent.click(await screen.findByTestId('add-exercise-button'));
    fireEvent.click(await screen.findByTestId('exercise-search'));
    fireEvent.click(
      (await screen.findAllByTestId('exercise-row')).find(
        (el) => el.getAttribute('data-exercise-id') === BENCH_ID,
      )!,
    );

    fireEvent.click(await screen.findByTestId('set-type-toggle'));
    fireEvent.change(screen.getByTestId('weight-input'), { target: { value: '40' } });
    fireEvent.change(screen.getByTestId('reps-input'), { target: { value: '8' } });
    fireEvent.click(screen.getByTestId('tick-button'));

    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(1));

    // Ticking no longer conjures a replacement row — you add the next one
    // deliberately, and it comes back as a working set rather than inheriting
    // the warm-up you just logged.
    expect(screen.queryByTestId('weight-input')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('add-set-button'));
    fireEvent.change(await screen.findByTestId('weight-input'), { target: { value: '60' } });
    fireEvent.change(screen.getByTestId('reps-input'), { target: { value: '5' } });
    fireEvent.click(screen.getByTestId('tick-button'));

    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(2));
    expect(mockLogSet).toHaveBeenNthCalledWith(2, expect.objectContaining({ setType: 'working' }));

    const rows = screen.getAllByTestId('set-number');
    const labels = rows.map((r) => r.textContent);
    expect(labels).toEqual(['W', '1']);
  });

  it('the warm-up exclusion sentence appears only once a warm-up exists', async () => {
    mockGetOpenSessionSets.mockResolvedValue([]);
    mockLogSet.mockResolvedValue(makeSet({ id: 'set-warm', setType: 'warmup' }));

    render(<LogWorkout />);
    fireEvent.click(await screen.findByTestId('add-exercise-button'));
    fireEvent.click(await screen.findByTestId('exercise-search'));
    fireEvent.click(
      (await screen.findAllByTestId('exercise-row')).find(
        (el) => el.getAttribute('data-exercise-id') === BENCH_ID,
      )!,
    );
    await screen.findByTestId('weight-input');

    expect(screen.queryByTestId('warmup-note')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('set-type-toggle'));
    fireEvent.click(screen.getByTestId('tick-button'));

    await waitFor(() => expect(screen.getByTestId('warmup-note')).toBeInTheDocument());
  });

  it('never renders a tonnage / total-volume figure anywhere', async () => {
    mockLogSet.mockResolvedValue(makeSet({ id: 'set-2' }));
    render(<LogWorkout />);
    await screen.findByTestId('weight-input');
    fireEvent.click(screen.getByTestId('tick-button'));
    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(1));

    expect(screen.queryByTestId('tonnage')).not.toBeInTheDocument();
    expect(screen.queryByText(/total/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/volume/i)).not.toBeInTheDocument();
  });

  it('the set number reports which kind the row is, and toggles back', async () => {
    mockLogSet.mockResolvedValue(makeSet({ id: 'set-2' }));
    render(<LogWorkout />);
    await screen.findByTestId('weight-input');

    const toggle = () => screen.getByTestId('set-type-toggle');
    expect(toggle()).toHaveAccessibleName(/working set/i);
    // 2, not 1: this describe's fixture already has one working set logged, so
    // the open row is the session's second.
    expect(toggle()).toHaveTextContent('2');

    fireEvent.click(toggle());
    expect(toggle()).toHaveAccessibleName(/warm-up set/i);
    expect(toggle()).toHaveTextContent('W');

    // Toggling back must be possible — the pair of text buttons this replaced
    // could not do it, because once warm-up was set there was nothing that
    // could set it back.
    fireEvent.click(toggle());
    fireEvent.click(screen.getByTestId('tick-button'));

    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(1));
    expect(mockLogSet).toHaveBeenCalledWith(expect.objectContaining({ setType: 'working' }));
  });

  it('ticking a row does not conjure a replacement — the queue empties and stays empty', async () => {
    mockLogSet.mockResolvedValue(makeSet({ id: 'set-2' }));
    render(<LogWorkout />);
    await screen.findByTestId('weight-input');

    fireEvent.click(screen.getByTestId('tick-button'));
    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(1));

    // The logged set is on screen; nothing open is left behind it.
    expect(screen.getAllByTestId('set-number').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('weight-input')).not.toBeInTheDocument();

    // And a row comes back only when asked for.
    fireEvent.click(screen.getByTestId('add-set-button'));
    expect(await screen.findByTestId('weight-input')).toBeInTheDocument();
  });

  it('several rows can be queued and filled before any of them is ticked', async () => {
    mockGetOpenSessionSets.mockResolvedValue([]);
    mockLogSet.mockResolvedValue(makeSet({ id: 'set-x' }));

    render(<LogWorkout />);
    fireEvent.click(await screen.findByTestId('add-exercise-button'));
    fireEvent.click(await screen.findByTestId('exercise-search'));
    fireEvent.click(
      (await screen.findAllByTestId('exercise-row')).find(
        (el) => el.getAttribute('data-exercise-id') === BENCH_ID,
      )!,
    );
    await screen.findByTestId('weight-input');

    // Queue two more WITHOUT ticking anything — the previous model made the
    // next row impossible until the current one was saved.
    fireEvent.click(screen.getByTestId('add-set-button'));
    fireEvent.click(screen.getByTestId('add-set-button'));

    const weights = screen.getAllByTestId('weight-input');
    expect(weights).toHaveLength(3);

    fireEvent.change(weights[0], { target: { value: '60' } });
    fireEvent.change(weights[2], { target: { value: '80' } });
    expect(screen.getAllByTestId('weight-input')[0]).toHaveValue('60');
    expect(screen.getAllByTestId('weight-input')[2]).toHaveValue('80');

    // Ticking the middle row must not disturb what is typed in the others.
    fireEvent.click(screen.getAllByTestId('tick-button')[1]);
    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(1));
    const left = screen.getAllByTestId('weight-input');
    expect(left).toHaveLength(2);
    expect(left[0]).toHaveValue('60');
    expect(left[1]).toHaveValue('80');
  });

  it('marking a row as a warm-up clears any RIR already tapped in', async () => {
    mockLogSet.mockResolvedValue(makeSet({ id: 'set-2', setType: 'warmup' }));
    render(<LogWorkout />);
    await screen.findByTestId('weight-input');

    fireEvent.click(screen.getByTestId('rir-cell'));
    fireEvent.click(await screen.findByTestId('rir-option-2'));
    fireEvent.click(screen.getByTestId('set-type-toggle'));
    fireEvent.click(screen.getByTestId('tick-button'));

    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(1));
    // A stale RIR on a warm-up would be meaningless, and would be handed to the
    // e1RM qualification check as if it meant something.
    expect(mockLogSet).toHaveBeenCalledWith(expect.objectContaining({ setType: 'warmup', rir: null }));
  });

  it('finishing opens a summary before closing the session, not straight after tapping', async () => {
    render(<LogWorkout />);
    await screen.findByTestId('weight-input');

    fireEvent.click(screen.getByTestId('finish-button'));

    // The summary is a step, not a side effect: nothing is closed yet.
    await screen.findByTestId('confirm-finish-button');
    expect(mockFinishWorkout).not.toHaveBeenCalled();
    expect(screen.getByTestId('summary-working')).toHaveTextContent('1');
  });

  it('names the session before closing it, so it is recognisable in the recent list', async () => {
    mockFinishWorkout.mockResolvedValue(undefined);
    mockRenameWorkout.mockResolvedValue(undefined);

    render(<LogWorkout />);
    await screen.findByTestId('weight-input');
    fireEvent.click(screen.getByTestId('finish-button'));

    const nameInput = await screen.findByTestId('workout-name-input');
    fireEvent.change(nameInput, { target: { value: 'Chest and back' } });
    fireEvent.click(screen.getByTestId('confirm-finish-button'));

    await waitFor(() => expect(mockRenameWorkout).toHaveBeenCalledWith('workout-1', 'Chest and back'));
    expect(mockFinishWorkout).toHaveBeenCalledWith('workout-1');
  });

  it('"keep logging" backs out of the summary without closing the session', async () => {
    render(<LogWorkout />);
    await screen.findByTestId('weight-input');
    fireEvent.click(screen.getByTestId('finish-button'));

    fireEvent.click(await screen.findByTestId('cancel-finish-button'));

    await screen.findByTestId('weight-input');
    expect(mockFinishWorkout).not.toHaveBeenCalled();
  });

  it('the tick control meets the 44px minimum touch target', async () => {
    render(<LogWorkout />);
    const tick = await screen.findByTestId('tick-button');
    expect(tick.className).toMatch(/min-h-\[44px\]/);
    expect(tick.className).toMatch(/min-w-\[44px\]/);
  });
});
