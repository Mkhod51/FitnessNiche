import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogWorkout } from './LogWorkout';
import { getUser, type User } from '../../db/user';
import { getLastSetForExercise, getOpenSessionSets, logSet, type LoggedSet } from '../../db/workouts';

vi.mock('../../db/user', async () => {
  const actual = await vi.importActual<typeof import('../../db/user')>('../../db/user');
  return { ...actual, getUser: vi.fn() };
});

vi.mock('../../db/workouts', async () => {
  const actual = await vi.importActual<typeof import('../../db/workouts')>('../../db/workouts');
  return { ...actual, getLastSetForExercise: vi.fn(), getOpenSessionSets: vi.fn(), logSet: vi.fn() };
});

const mockGetUser = vi.mocked(getUser);
const mockGetLastSetForExercise = vi.mocked(getLastSetForExercise);
const mockGetTodaysSets = vi.mocked(getOpenSessionSets);
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
const SQUAT_ID = 'barbell-back-squat';

function makeSet(overrides: Partial<LoggedSet> = {}): LoggedSet {
  return {
    id: 'set-1',
    workoutId: 'workout-1',
    exerciseId: BENCH_ID,
    weightKg: 60,
    reps: 5,
    rir: 2,
    setType: 'working',
    performedAt: '2026-07-25T09:00:00.000Z',
    updatedAt: '2026-07-25T09:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

describe('LogWorkout — GR-5: unreachable without consent', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockGetLastSetForExercise.mockReset();
    mockGetTodaysSets.mockReset();
    mockLogSet.mockReset();
    mockGetTodaysSets.mockResolvedValue([]);
    mockGetLastSetForExercise.mockResolvedValue(undefined);
  });

  it('does not render the logging form until consent is recorded', async () => {
    mockGetUser.mockResolvedValue({ ...consentedUser, consentedAt: null });
    render(<LogWorkout />);
    await screen.findByTestId('consent-gate');
    expect(screen.queryByTestId('log-set-button')).not.toBeInTheDocument();
  });

  it('renders the logging form once consent is already recorded', async () => {
    mockGetUser.mockResolvedValue(consentedUser);
    render(<LogWorkout />);
    await screen.findByTestId('log-set-button');
  });
});

describe('LogWorkout — defaults and one-tap repeat', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockGetLastSetForExercise.mockReset();
    mockGetTodaysSets.mockReset();
    mockLogSet.mockReset();
    mockGetUser.mockResolvedValue(consentedUser);
    mockGetTodaysSets.mockResolvedValue([]);
  });

  it('defaults weight and reps from the previous set of the currently-selected exercise', async () => {
    mockGetLastSetForExercise.mockImplementation(async (exerciseId) =>
      exerciseId === BENCH_ID ? makeSet({ weightKg: 62.5, reps: 6, rir: 1 }) : undefined,
    );

    render(<LogWorkout />);
    const weightInput = await screen.findByTestId('weight-input');
    const repsInput = screen.getByTestId('reps-input');
    const rirInput = screen.getByTestId('rir-input');

    await waitFor(() => expect(weightInput).toHaveValue(62.5));
    expect(repsInput).toHaveValue(6);
    expect(rirInput).toHaveValue(1);
  });

  it('switching exercise re-fetches THAT exercise\'s own last set, not a global last set', async () => {
    mockGetLastSetForExercise.mockImplementation(async (exerciseId) => {
      if (exerciseId === BENCH_ID) return makeSet({ exerciseId: BENCH_ID, weightKg: 60, reps: 5, rir: 2 });
      if (exerciseId === SQUAT_ID) return makeSet({ exerciseId: SQUAT_ID, weightKg: 100, reps: 3, rir: 0 });
      return undefined;
    });

    render(<LogWorkout />);
    const weightInput = await screen.findByTestId('weight-input');
    await waitFor(() => expect(weightInput).toHaveValue(60));

    const exerciseSelect = screen.getByTestId('exercise-select');
    fireEvent.change(exerciseSelect, { target: { value: SQUAT_ID } });

    await waitFor(() => expect(weightInput).toHaveValue(100));
    expect(screen.getByTestId('reps-input')).toHaveValue(3);
    expect(screen.getByTestId('rir-input')).toHaveValue(0);
  });

  it('repeat-last-set is ONE tap: with unchanged defaults, clicking Log Set writes immediately with no confirm dialog', async () => {
    mockGetLastSetForExercise.mockResolvedValue(makeSet({ weightKg: 60, reps: 5, rir: 2 }));
    mockLogSet.mockResolvedValue(makeSet({ id: 'set-2', weightKg: 60, reps: 5, rir: 2 }));

    render(<LogWorkout />);
    const weightInput = await screen.findByTestId('weight-input');
    await waitFor(() => expect(weightInput).toHaveValue(60));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('log-set-button'));

    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(1));
    expect(mockLogSet).toHaveBeenCalledWith(
      expect.objectContaining({ exerciseId: BENCH_ID, weightKg: 60, reps: 5, rir: 2 }),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('a logged set appears in the session list right away — confirming the write landed, no page reload needed', async () => {
    mockGetLastSetForExercise.mockResolvedValue(undefined);
    mockLogSet.mockResolvedValue(makeSet({ id: 'set-9', weightKg: 40, reps: 10, rir: null }));

    render(<LogWorkout />);
    const weightInput = await screen.findByTestId('weight-input');
    fireEvent.change(weightInput, { target: { value: '40' } });
    fireEvent.change(screen.getByTestId('reps-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('log-set-button'));

    await waitFor(() => expect(screen.getAllByTestId('logged-set-row')).toHaveLength(1));
    expect(screen.getByTestId('logged-set-row')).toHaveTextContent('40');
    expect(screen.getByTestId('logged-set-row')).toHaveTextContent('10');
  });
});

describe('LogWorkout — RIR is genuinely optional (FR-LOG-1)', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockGetLastSetForExercise.mockReset();
    mockGetTodaysSets.mockReset();
    mockLogSet.mockReset();
    mockGetUser.mockResolvedValue(consentedUser);
    mockGetTodaysSets.mockResolvedValue([]);
    mockGetLastSetForExercise.mockResolvedValue(undefined);
  });

  it('submits with rir: null when the field is left blank — never a default number', async () => {
    mockLogSet.mockResolvedValue(makeSet({ rir: null }));

    render(<LogWorkout />);
    const weightInput = await screen.findByTestId('weight-input');
    fireEvent.change(weightInput, { target: { value: '50' } });
    fireEvent.change(screen.getByTestId('reps-input'), { target: { value: '8' } });
    // RIR field is left untouched — must not block submission and must not
    // have been pre-filled with a number of its own.
    expect(screen.getByTestId('rir-input')).toHaveValue(null);

    fireEvent.click(screen.getByTestId('log-set-button'));

    await waitFor(() => expect(mockLogSet).toHaveBeenCalledTimes(1));
    expect(mockLogSet).toHaveBeenCalledWith(expect.objectContaining({ rir: null }));
  });

  it('the RIR field is never disabled and never required to submit', async () => {
    render(<LogWorkout />);
    const rirInput = await screen.findByTestId('rir-input');
    expect(rirInput).toBeEnabled();
    expect(rirInput).not.toBeRequired();
  });
});

describe('LogWorkout — exercise picker selects from the seeded list only, never free text', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockGetLastSetForExercise.mockReset();
    mockGetTodaysSets.mockReset();
    mockGetUser.mockResolvedValue(consentedUser);
    mockGetTodaysSets.mockResolvedValue([]);
    mockGetLastSetForExercise.mockResolvedValue(undefined);
  });

  it('the exercise field is a <select>, not a free-text input', async () => {
    render(<LogWorkout />);
    const exerciseField = await screen.findByTestId('exercise-select');
    expect(exerciseField.tagName).toBe('SELECT');
  });
});

describe('LogWorkout — touch targets (NFR-3: one-handed operation)', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockGetLastSetForExercise.mockReset();
    mockGetTodaysSets.mockReset();
    mockGetUser.mockResolvedValue(consentedUser);
    mockGetTodaysSets.mockResolvedValue([]);
    mockGetLastSetForExercise.mockResolvedValue(undefined);
  });

  it('the Log Set button meets the 44px minimum touch target', async () => {
    render(<LogWorkout />);
    const button = await screen.findByTestId('log-set-button');
    expect(button.className).toContain('min-h-[44px]');
  });
});
