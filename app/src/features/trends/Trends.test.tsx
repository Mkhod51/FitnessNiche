import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Trends } from './Trends';
import { getUser, type User } from '../../db/user';
import { getWeightHistory, type WeightReading } from '../../db/weights';
import { getSetsSince, type LoggedSet } from '../../db/workouts';

vi.mock('../../db/user', async () => {
  const actual = await vi.importActual<typeof import('../../db/user')>('../../db/user');
  return { ...actual, getUser: vi.fn() };
});

vi.mock('../../db/weights', async () => {
  const actual = await vi.importActual<typeof import('../../db/weights')>('../../db/weights');
  return { ...actual, getWeightHistory: vi.fn() };
});

vi.mock('../../db/workouts', async () => {
  const actual = await vi.importActual<typeof import('../../db/workouts')>('../../db/workouts');
  return { ...actual, getSetsSince: vi.fn() };
});

const mockGetUser = vi.mocked(getUser);
const mockGetWeightHistory = vi.mocked(getWeightHistory);
const mockGetSetsSince = vi.mocked(getSetsSince);

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
  consentedAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function makeReading(overrides: Partial<WeightReading> = {}): WeightReading {
  return {
    id: 'weight-1',
    userId: 'local-user',
    valueKg: 80,
    measuredAt: '2026-07-20T09:00:00.000Z',
    updatedAt: '2026-07-20T09:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

function makeSet(overrides: Partial<LoggedSet> = {}): LoggedSet {
  return {
    id: 'set-1',
    workoutId: 'workout-1',
    exerciseId: 'barbell-bench-press',
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

describe('Trends — GR-5: unreachable without consent', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockGetWeightHistory.mockReset();
    mockGetSetsSince.mockReset();
    mockGetWeightHistory.mockResolvedValue([]);
    mockGetSetsSince.mockResolvedValue([]);
  });

  it('does not render trend content until consent is recorded', async () => {
    mockGetUser.mockResolvedValue({ ...consentedUser, consentedAt: null });
    render(<Trends />);
    await screen.findByTestId('consent-gate');
    expect(screen.queryByTestId('bodyweight-trend')).not.toBeInTheDocument();
  });
});

describe('Trends — bodyweight and volume, once consented', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockGetWeightHistory.mockReset();
    mockGetSetsSince.mockReset();
    mockGetUser.mockResolvedValue(consentedUser);
  });

  it('shows the honest empty state when no weight has been logged', async () => {
    mockGetWeightHistory.mockResolvedValue([]);
    mockGetSetsSince.mockResolvedValue([]);
    render(<Trends />);
    await waitFor(() =>
      expect(
        screen.getByTestId('bodyweight-trend').querySelector('[data-testid="trend-empty"]'),
      ).toBeInTheDocument(),
    );
  });

  it('renders a bodyweight trend line once readings exist', async () => {
    mockGetWeightHistory.mockResolvedValue([
      makeReading({ id: 'w1', valueKg: 80, measuredAt: '2026-07-10T09:00:00.000Z' }),
      makeReading({ id: 'w2', valueKg: 81, measuredAt: '2026-07-20T09:00:00.000Z' }),
    ]);
    mockGetSetsSince.mockResolvedValue([]);
    render(<Trends />);
    // Wait for the CONTENT. The section itself renders immediately and empty
    // while the readings load, so findByTestId alone resolves against the first
    // paint — it passed alone and failed under full-suite load.
    await waitFor(() =>
      expect(
        screen.getByTestId('bodyweight-trend').querySelector('[data-testid="trend-line"]'),
      ).toBeInTheDocument(),
    );
  });

  it('renders weekly volume per muscle against the labelled population range, never as a personal target', async () => {
    mockGetWeightHistory.mockResolvedValue([]);
    mockGetSetsSince.mockResolvedValue([makeSet()]);
    render(<Trends />);
    await waitFor(() => expect(screen.getByTestId('volume-row-chest')).toHaveTextContent(/population/i));
  });

  it('shows an honest empty state for volume when nothing was logged this week', async () => {
    mockGetWeightHistory.mockResolvedValue([]);
    mockGetSetsSince.mockResolvedValue([]);
    render(<Trends />);
    expect(await screen.findByTestId('volume-empty')).toBeInTheDocument();
  });
});

describe('Trends — FR-SIG-2, the requirement most easily lost', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockGetWeightHistory.mockReset();
    mockGetSetsSince.mockReset();
    mockGetUser.mockResolvedValue(consentedUser);
    mockGetWeightHistory.mockResolvedValue([]);
  });

  it('says why there is no 1RM estimate rather than showing nothing', async () => {
    mockGetSetsSince.mockResolvedValue([]);
    render(<Trends />);
    await waitFor(() =>
      expect(screen.getByTestId('strength-insufficient')).toHaveTextContent(/without an RIR cannot be used/i),
    );
  });

  // A set with no RIR yields no e1RM point at all. Saying so is the difference
  // between an honest empty state and an app that looks broken.
  it('does not count sets logged without an RIR toward the estimate', async () => {
    mockGetSetsSince.mockResolvedValue(
      Array.from({ length: 12 }, (_, i) =>
        makeSet({ id: `s${i}`, rir: null, performedAt: `2026-07-${10 + i}T09:00:00.000Z` }),
      ),
    );
    render(<Trends />);
    // Every one of these waits on CONTENT rather than the element. The section
    // renders immediately in its pre-load state, so asserting on first paint
    // passes or fails on scheduling — which is exactly how these went flaky.
    await waitFor(() =>
      expect(screen.getByTestId('strength-insufficient')).toHaveTextContent(/No sets yet that can be used/i),
    );
  });

  it('refuses to draw a line from a handful of points', async () => {
    mockGetSetsSince.mockResolvedValue(
      Array.from({ length: 3 }, (_, i) =>
        makeSet({ id: `s${i}`, performedAt: `2026-07-${10 + i}T09:00:00.000Z` }),
      ),
    );
    render(<Trends />);
    await waitFor(() =>
      expect(screen.getByTestId('strength-insufficient')).toHaveTextContent(/needs at least eight/i),
    );
  });

  // The whole point: a flat series with scatter must say so, not draw a slope.
  it('renders honest copy instead of a trend line when the signal is inside the noise', async () => {
    const noisy = Array.from({ length: 12 }, (_, i) =>
      makeSet({
        id: `s${i}`,
        weightKg: 100 + (i % 2 === 0 ? 4 : -4), // scatter, no real direction
        reps: 5,
        rir: 2,
        performedAt: `2026-07-${10 + i}T09:00:00.000Z`,
      }),
    );
    mockGetSetsSince.mockResolvedValue(noisy);
    render(<Trends />);
    await waitFor(() =>
      expect(
        screen.getByTestId('strength-trend').querySelector('[data-testid="trend-noise-copy"]'),
      ).toBeInTheDocument(),
    );
    const section = screen.getByTestId('strength-trend');
    expect(section.querySelector('[data-testid="trend-line"]')).not.toBeInTheDocument();
    expect(screen.queryByTestId('strength-slope')).not.toBeInTheDocument();
  });
});
