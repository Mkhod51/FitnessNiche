import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogWeight } from './LogWeight';
import { getUser, type User } from '../../db/user';
import { getWeightHistory, logWeight, type WeightReading } from '../../db/weights';

vi.mock('../../db/user', async () => {
  const actual = await vi.importActual<typeof import('../../db/user')>('../../db/user');
  return { ...actual, getUser: vi.fn() };
});

vi.mock('../../db/weights', async () => {
  const actual = await vi.importActual<typeof import('../../db/weights')>('../../db/weights');
  return { ...actual, getWeightHistory: vi.fn(), logWeight: vi.fn() };
});

const mockGetUser = vi.mocked(getUser);
const mockGetWeightHistory = vi.mocked(getWeightHistory);
const mockLogWeight = vi.mocked(logWeight);

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
  consentedAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function makeReading(overrides: Partial<WeightReading> = {}): WeightReading {
  return {
    id: 'weight-1',
    userId: 'local-user',
    valueKg: 80,
    measuredAt: '2026-07-25T09:00:00.000Z',
    updatedAt: '2026-07-25T09:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

describe('LogWeight — GR-5: unreachable without consent', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockGetWeightHistory.mockReset();
    mockLogWeight.mockReset();
    mockGetWeightHistory.mockResolvedValue([]);
  });

  it('does not render the logging form until consent is recorded', async () => {
    mockGetUser.mockResolvedValue({ ...consentedUser, consentedAt: null });
    render(<LogWeight />);
    await screen.findByTestId('consent-gate');
    expect(screen.queryByTestId('log-weight-button')).not.toBeInTheDocument();
  });

  it('renders the logging form once consent is already recorded', async () => {
    mockGetUser.mockResolvedValue(consentedUser);
    render(<LogWeight />);
    await screen.findByTestId('log-weight-button');
  });
});

describe('LogWeight — logging a reading', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockGetWeightHistory.mockReset();
    mockLogWeight.mockReset();
    mockGetUser.mockResolvedValue(consentedUser);
    mockGetWeightHistory.mockResolvedValue([]);
  });

  it('writes the entered value and shows it in the recent-readings list, no save button beyond the log tap', async () => {
    mockLogWeight.mockResolvedValue(makeReading({ valueKg: 83.2 }));

    render(<LogWeight />);
    const input = await screen.findByTestId('weight-value-input');
    fireEvent.change(input, { target: { value: '83.2' } });
    fireEvent.click(await screen.findByTestId('log-weight-button'));

    await waitFor(() => expect(mockLogWeight).toHaveBeenCalledWith(83.2));
    expect(await screen.findByTestId('weight-reading-row')).toHaveTextContent('83.2');
  });

  it('does not write on a non-positive or empty value', async () => {
    render(<LogWeight />);
    const button = await screen.findByTestId('log-weight-button');
    fireEvent.click(button);
    expect(mockLogWeight).not.toHaveBeenCalled();

    const input = await screen.findByTestId('weight-value-input');
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.click(button);
    expect(mockLogWeight).not.toHaveBeenCalled();
  });

  it('loads existing history on mount', async () => {
    mockGetWeightHistory.mockResolvedValue([makeReading({ id: 'w-old', valueKg: 79.5 })]);
    render(<LogWeight />);
    expect(await screen.findByText(/79.5/)).toBeInTheDocument();
  });
});
