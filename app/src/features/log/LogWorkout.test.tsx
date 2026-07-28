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
  getWorkoutExerciseIds,
  renameWorkout,
  logSet,
  type Workout,
  type LoggedSet,
} from '../../db/workouts';

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
    getWorkoutExerciseIds: vi.fn(),
    renameWorkout: vi.fn(),
    logSet: vi.fn(),
  };
});

const mockGetUser = vi.mocked(getUser);
const mockFindOpenWorkout = vi.mocked(findOpenWorkout);
const mockStartWorkout = vi.mocked(startWorkout);
const mockFinishWorkout = vi.mocked(finishWorkout);
const mockGetRecentWorkouts = vi.mocked(getRecentWorkouts);
const mockGetLastSetForExercise = vi.mocked(getLastSetForExercise);
const mockGetOpenSessionSets = vi.mocked(getOpenSessionSets);
const mockGetWorkoutExerciseIds = vi.mocked(getWorkoutExerciseIds);
const mockRenameWorkout = vi.mocked(renameWorkout);
const mockLogSet = vi.mocked(logSet);

const consentedUser: User = {
  id: 'local-user',
  goal: 'maintain',
  sex: 'unspecified',
  heightCm: null,
  numbersHidden: false,
  consentedAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const BENCH_ID = 'barbell-bench-press';

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
  mockGetWorkoutExerciseIds.mockReset();
  mockRenameWorkout.mockReset();
  mockLogSet.mockReset();

  mockGetUser.mockResolvedValue(consentedUser);
  mockFindOpenWorkout.mockResolvedValue(undefined);
  mockGetRecentWorkouts.mockResolvedValue([]);
  mockGetLastSetForExercise.mockResolvedValue(undefined);
  mockGetOpenSessionSets.mockResolvedValue([]);
  mockGetWorkoutExerciseIds.mockResolvedValue([]);
  mockRenameWorkout.mockResolvedValue(undefined);
  mockFinishWorkout.mockResolvedValue(undefined);
}

describe('LogWorkout — GR-5: unreachable without consent', () => {
  beforeEach(resetMocks);

  it('does not render the logging screen until consent is recorded', async () => {
    mockGetUser.mockResolvedValue({ ...consentedUser, consentedAt: null });
    render(<LogWorkout />);
    await screen.findByTestId('consent-gate');
    expect(screen.queryByTestId('start-workout-button')).not.toBeInTheDocument();
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
  it('tapping a previous session brings its exercises back, not just its name', async () => {
    mockGetRecentWorkouts.mockResolvedValue([makeWorkout({ id: 'w-old', name: 'Leg Day' })]);
    mockStartWorkout.mockResolvedValue(makeWorkout({ id: 'w-new', name: 'Leg Day' }));
    mockGetWorkoutExerciseIds.mockResolvedValue([BENCH_ID]);

    render(<LogWorkout />);
    const row = await screen.findByTestId('recent-workout-row');
    expect(row).toHaveTextContent('Leg Day');
    fireEvent.click(row);

    await waitFor(() => expect(mockStartWorkout).toHaveBeenCalledWith('Leg Day'));
    expect(mockGetWorkoutExerciseIds).toHaveBeenCalledWith('w-old');
    // The carried exercise is on screen with a live row ready, so the next set
    // is one tap away rather than five.
    expect(await screen.findByText('Barbell Bench Press')).toBeInTheDocument();
    await screen.findByTestId('weight-input');
  });
});

describe('LogWorkout — State B: an open session', () => {
  beforeEach(() => {
    resetMocks();
    mockFindOpenWorkout.mockResolvedValue(makeWorkout());
    mockGetOpenSessionSets.mockResolvedValue([makeSet()]);
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

  it('"+ Warm-up" then ticking calls logSet with setType: \'warmup\'', async () => {
    mockLogSet.mockResolvedValue(makeSet({ id: 'set-2', setType: 'warmup' }));
    render(<LogWorkout />);

    await screen.findByTestId('weight-input');
    fireEvent.click(screen.getByTestId('add-warmup-button'));
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
    fireEvent.change(screen.getByTestId('add-exercise-select'), { target: { value: BENCH_ID } });

    fireEvent.click(await screen.findByTestId('add-warmup-button'));
    fireEvent.change(screen.getByTestId('weight-input'), { target: { value: '40' } });
    fireEvent.change(screen.getByTestId('reps-input'), { target: { value: '8' } });
    fireEvent.click(screen.getByTestId('tick-button'));

    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(1));

    // next live row should already be reset to 'working' by default
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
    fireEvent.change(screen.getByTestId('add-exercise-select'), { target: { value: BENCH_ID } });
    await screen.findByTestId('weight-input');

    expect(screen.queryByTestId('warmup-note')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('add-warmup-button'));
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

  it('the set-type control shows which kind the pending row is, and toggles back', async () => {
    mockLogSet.mockResolvedValue(makeSet({ id: 'set-2' }));
    render(<LogWorkout />);
    await screen.findByTestId('weight-input');

    // Defaults to working, and says so rather than leaving it implicit.
    expect(screen.getByTestId('set-type-working')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('add-warmup-button')).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(screen.getByTestId('add-warmup-button'));
    expect(screen.getByTestId('add-warmup-button')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('set-type-working')).toHaveAttribute('aria-pressed', 'false');

    // Toggling back must be possible — the old "+ Add set" could not do this,
    // because it set the type it was already on.
    fireEvent.click(screen.getByTestId('set-type-working'));
    fireEvent.click(screen.getByTestId('tick-button'));

    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(1));
    expect(mockLogSet).toHaveBeenCalledWith(expect.objectContaining({ setType: 'working' }));
  });

  it('marking the pending row as a warm-up clears any RIR already tapped in', async () => {
    mockLogSet.mockResolvedValue(makeSet({ id: 'set-2', setType: 'warmup' }));
    render(<LogWorkout />);
    await screen.findByTestId('weight-input');

    fireEvent.click(screen.getByTestId('rir-cell'));
    fireEvent.click(await screen.findByTestId('rir-option-2'));
    fireEvent.click(screen.getByTestId('add-warmup-button'));
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
