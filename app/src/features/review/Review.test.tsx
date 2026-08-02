import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Review } from './Review';
import { getUser } from '../../db/user';
import { getWeightHistory } from '../../db/weights';
import { getSetsSince, type LoggedSet } from '../../db/workouts';
import type { User } from '../../db/user';
import type { WeightReading } from '../../db/weights';

vi.mock('../../db/user', async () => {
  const actual = await vi.importActual<typeof import('../../db/user')>('../../db/user');
  return { ...actual, getUser: vi.fn() };
});
vi.mock('../../db/weights', () => ({ getWeightHistory: vi.fn() }));
vi.mock('../../db/nutrition', () => ({ getEntriesSince: vi.fn(async () => []) }));
vi.mock('../../db/workouts', async () => {
  const actual = await vi.importActual<typeof import('../../db/workouts')>('../../db/workouts');
  return { ...actual, getSetsSince: vi.fn() };
});

const mockGetUser = vi.mocked(getUser);
const mockWeights = vi.mocked(getWeightHistory);
const mockSets = vi.mocked(getSetsSince);

const DAY = 86_400_000;
const T0 = Date.now() - 80 * DAY;

const user: User = {
  id: 'local-user',
  goal: 'cut',
  sex: 'unspecified',
  heightCm: null,
  numbersHidden: false,
  calorieTargetKcal: null,
  proteinTargetG: null,
  deficitKcal: 0,
  birthYear: null,
  goalStartedAt: new Date(T0).toISOString(),
  trainingExperience: null,
  consentedAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

function weigh(i: number, kg: number): WeightReading {
  return {
    id: `w${i}`,
    userId: 'local-user',
    valueKg: kg,
    measuredAt: new Date(T0 + i * 2 * DAY).toISOString(),
    updatedAt: new Date(T0 + i * 2 * DAY).toISOString(),
    deletedAt: null,
  };
}

function set(i: number, weightKg: number): LoggedSet {
  return {
    id: `s${i}`,
    workoutId: `w${i}`,
    exerciseId: 'barbell-bench-press',
    weightKg,
    reps: 5,
    rir: 2,
    setType: 'working',
    performedAt: new Date(T0 + i * 3 * DAY).toISOString(),
    updatedAt: new Date(T0 + i * 3 * DAY).toISOString(),
    deletedAt: null,
  };
}

/** A clean cut: 24 weigh-ins trending down, 20 bench sessions holding. */
const fullHistory = {
  weights: Array.from({ length: 24 }, (_, i) => weigh(i, 82 - i * 0.13)),
  sets: Array.from({ length: 20 }, (_, i) => set(i, 100)),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue(user);
  mockWeights.mockResolvedValue(fullHistory.weights);
  mockSets.mockResolvedValue(fullHistory.sets);
});

describe('Review — the reconciliation', () => {
  it('leads with a verdict and shows both measured halves together', async () => {
    render(<Review />);
    expect(await screen.findByTestId('verdict-headline')).toBeInTheDocument();
    expect(screen.getByTestId('measured-weight')).toHaveTextContent(/kg\/week/);
    expect(screen.getByTestId('measured-strength')).toHaveTextContent(/held|%\/week/);
    expect(screen.getByTestId('reconcile-confidence')).toBeInTheDocument();
  });

  // OQ-4. What separates this from two overlaid charts is that it names the
  // half it cannot read, rather than drawing a confident line through it.
  it('names what it cannot see when the strength half is unreadable', async () => {
    mockSets.mockResolvedValue(fullHistory.sets.slice(0, 3)); // under the regression minimum
    render(<Review />);

    expect(await screen.findByTestId('unresolved-block')).toBeInTheDocument();
    expect(screen.getByTestId('measured-strength')).toHaveTextContent('not readable yet');
    const items = screen.getAllByTestId('unresolved-item');
    expect(items.length).toBeGreaterThan(0);
    expect(items.map((i) => i.textContent).join(' ')).toMatch(/Strength/);
  });

  it('shows no unresolved block when both halves read cleanly', async () => {
    render(<Review />);
    await screen.findByTestId('verdict-headline');
    expect(screen.queryByTestId('unresolved-block')).not.toBeInTheDocument();
  });

  // FR-SIG-2: an interval spanning zero is "held", never a quoted slope.
  it('reports a within-noise strength trend as held rather than as a number', async () => {
    render(<Review />);
    expect(await screen.findByTestId('measured-strength')).toHaveTextContent('held');
  });

  // GR-1: numbers-hidden is a first-class state, not a settings flag that blanks
  // one widget. The verdict still renders; the figure does not.
  it('hides the bodyweight figure in numbers-hidden mode but keeps the verdict', async () => {
    mockGetUser.mockResolvedValue({ ...user, numbersHidden: true });
    render(<Review />);
    expect(await screen.findByTestId('verdict-headline')).toBeInTheDocument();
    expect(screen.getByTestId('measured-weight')).toHaveTextContent('hidden');
    expect(screen.getByTestId('measured-weight')).not.toHaveTextContent(/kg\/week/);
  });

  it('degrades to an honest refusal with nothing logged', async () => {
    mockWeights.mockResolvedValue([]);
    mockSets.mockResolvedValue([]);
    render(<Review />);

    expect(await screen.findByTestId('unresolved-block')).toBeInTheDocument();
    expect(screen.getByTestId('measured-weight')).toHaveTextContent('not readable yet');
    expect(screen.getByTestId('measured-strength')).toHaveTextContent('not readable yet');
  });
});

describe('Review — provenance (T1/AC-4)', () => {
  // The screen states what was measured; the claim record states what it means.
  // A recommendation rendered without a claim_id ancestor is the one thing this
  // product may never do.
  it('renders any evidence statement inside a claim-id ancestor', async () => {
    render(<Review />);
    await screen.findByTestId('verdict-headline');

    const statements = screen.queryAllByTestId('claim-statement');
    for (const statement of statements) {
      let node: HTMLElement | null = statement.parentElement;
      let found = false;
      while (node) {
        const id = node.getAttribute('data-claim-id');
        if (id && id.trim() !== '') {
          found = true;
          break;
        }
        node = node.parentElement;
      }
      expect(found).toBe(true);
    }
  });
});
