import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { ReactElement } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EatDay } from './EatDay';
import { getUser, type User } from '../../db/user';
import {
  logFood,
  getEntriesForDay,
  getEntriesSince,
  deleteFoodEntry,
  type FoodEntry,
} from '../../db/nutrition';
import { useOnline } from '../../food/connectivity';
import { getCommonFoods, getRecentFoods, searchFoodLocal } from '../../food/local';
import { searchFoodOnline } from '../../food/off';

vi.mock('../../db/user', async () => {
  const actual = await vi.importActual<typeof import('../../db/user')>('../../db/user');
  return { ...actual, getUser: vi.fn() };
});

vi.mock('../../db/nutrition', async () => {
  const actual = await vi.importActual<typeof import('../../db/nutrition')>('../../db/nutrition');
  return {
    ...actual,
    logFood: vi.fn(),
    getEntriesForDay: vi.fn(),
    getEntriesSince: vi.fn(),
    deleteFoodEntry: vi.fn(),
  };
});

vi.mock('../../food/connectivity', () => ({ useOnline: vi.fn() }));
vi.mock('../../food/local', () => ({
  getCommonFoods: vi.fn(),
  getRecentFoods: vi.fn(),
  saveFoodItem: vi.fn(),
  searchFoodLocal: vi.fn(),
}));
vi.mock('../../food/off', () => ({ searchFoodOnline: vi.fn() }));

// EatDay links to the goal screen, so it needs router context to render at all.
const render = (ui: ReactElement) => rtlRender(<MemoryRouter>{ui}</MemoryRouter>);

const mockGetUser = vi.mocked(getUser);
const mockGetEntriesForDay = vi.mocked(getEntriesForDay);
const mockGetEntriesSince = vi.mocked(getEntriesSince);
const mockLogFood = vi.mocked(logFood);
const mockDelete = vi.mocked(deleteFoodEntry);
const mockUseOnline = vi.mocked(useOnline);
const mockGetRecentFoods = vi.mocked(getRecentFoods);
const mockGetCommonFoods = vi.mocked(getCommonFoods);
const mockSearchFoodLocal = vi.mocked(searchFoodLocal);
const mockSearchFoodOnline = vi.mocked(searchFoodOnline);

const baseUser: User = {
  id: 'local-user',
  goal: 'maintain',
  sex: 'male',
  heightCm: 178,
  numbersHidden: false,
  calorieTargetKcal: 2500,
  proteinTargetG: 180,
  deficitKcal: 0,
  birthYear: 1999,
  goalStartedAt: null,
  consentedAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

function entry(over: Partial<FoodEntry> = {}): FoodEntry {
  return {
    id: 'e1',
    userId: 'local-user',
    foodItemId: null,
    name: 'Greek yoghurt',
    mealSlot: 'breakfast',
    quantityGrams: null,
    quantityLabel: null,
    kcal: 180,
    proteinG: 20,
    carbsG: 12,
    fatG: 1,
    loggedAt: '2026-07-28T08:00:00.000Z',
    updatedAt: '2026-07-28T08:00:00.000Z',
    deletedAt: null,
    ...over,
  } as FoodEntry;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue(baseUser);
  mockGetEntriesForDay.mockResolvedValue([]);
  mockGetEntriesSince.mockResolvedValue([]);
  mockLogFood.mockResolvedValue(entry());
  mockDelete.mockResolvedValue(undefined);
  mockUseOnline.mockReturnValue(true);
  mockGetRecentFoods.mockResolvedValue([]);
  mockGetCommonFoods.mockResolvedValue([]);
  mockSearchFoodLocal.mockResolvedValue([]);
  mockSearchFoodOnline.mockResolvedValue({ drafts: [], hidden: 0 });
});

describe('EatDay — GR-1 is structural here, not a tone of voice', () => {
  // The single most important test on this screen. GR-1 names eat-back-to-zero
  // framing specifically, and it is the pattern MyFitnessPal is built around.
  it('never renders a remaining / left / budget counter, or a streak', async () => {
    mockGetEntriesForDay.mockResolvedValue([entry({ kcal: 1910, proteinG: 142 })]);
    render(<EatDay />);
    await waitFor(() => expect(screen.getByTestId('kcal-total')).toHaveTextContent('1,910'));

    expect(screen.queryByText(/remaining/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bleft\b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/budget/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/streak/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/under\b/i)).not.toBeInTheDocument();
  });

  it('shows what was eaten, not what is left', async () => {
    mockGetEntriesForDay.mockResolvedValue([entry({ kcal: 1910 })]);
    render(<EatDay />);
    // Wait for the CONTENT, not merely the element: the total renders
    // immediately at 0 while the entries are still loading, so findByTestId
    // alone asserts against the first paint and passes or fails on timing.
    await waitFor(() => expect(screen.getByTestId('kcal-total')).toHaveTextContent('1,910'));
    expect(screen.getByText(/energy eaten today/i)).toBeInTheDocument();
    // 2500 - 1910 = 590 is the number GR-1 forbids. It must appear nowhere.
    expect(screen.queryByText(/590/)).not.toBeInTheDocument();
  });

  it('says the bar fills toward the target rather than counting down from it', async () => {
    render(<EatDay />);
    await waitFor(() => expect(screen.getByText(/fills toward the target/i)).toBeInTheDocument());
  });

  // Protein is the asymmetry: a floor you are reaching, so a countdown here
  // encourages eating and GR-1 has no quarrel with it.
  it('does count protein down, because that one encourages eating', async () => {
    mockGetEntriesForDay.mockResolvedValue([entry({ proteinG: 140 })]);
    render(<EatDay />);
    await waitFor(() => expect(screen.getByText(/40 g to go/i)).toBeInTheDocument());
  });
});

describe('EatDay — numbers-hidden is a state, not a blanked widget', () => {
  it('hides every figure while keeping the log itself readable', async () => {
    mockGetUser.mockResolvedValue({ ...baseUser, numbersHidden: true });
    mockGetEntriesForDay.mockResolvedValue([entry({ name: 'Greek yoghurt', kcal: 180 })]);

    render(<EatDay />);
    await screen.findByTestId('numbers-hidden-summary');

    expect(screen.queryByTestId('kcal-total')).not.toBeInTheDocument();
    expect(screen.queryByTestId('protein-total')).not.toBeInTheDocument();
    expect(screen.queryByTestId('week-average')).not.toBeInTheDocument();
    expect(screen.queryByText('180')).not.toBeInTheDocument();

    // The food log is not the risk and stays fully usable.
    expect(screen.getByText('Greek yoghurt')).toBeInTheDocument();
    expect(screen.getByTestId('add-food-breakfast')).toBeInTheDocument();
  });

  it('offers no count of good days — a count of good days is a streak in a lab coat', async () => {
    mockGetUser.mockResolvedValue({ ...baseUser, numbersHidden: true });
    render(<EatDay />);
    await screen.findByTestId('numbers-hidden-summary');
    expect(screen.queryByText(/\d+ of \d+ days/i)).not.toBeInTheDocument();
  });
});

describe('EatDay — logging', () => {
  it('quick-adds without any food database behind it', async () => {
    render(<EatDay />);
    fireEvent.click(await screen.findByTestId('add-food-lunch'));
    fireEvent.click(await screen.findByRole('button', { name: /can't find it.*quick add/i }));

    fireEvent.change(screen.getByTestId('food-name-input'), { target: { value: 'Chicken and rice' } });
    fireEvent.change(screen.getByTestId('food-kcal-input'), { target: { value: '760' } });
    fireEvent.change(screen.getByTestId('food-protein-input'), { target: { value: '62' } });
    fireEvent.click(screen.getByTestId('food-save-button'));

    await waitFor(() => expect(mockLogFood).toHaveBeenCalledTimes(1));
    expect(mockLogFood).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Chicken and rice', mealSlot: 'lunch', kcal: 760, proteinG: 62 }),
      expect.any(Date),
    );
    await waitFor(() => expect(screen.queryByTestId('food-save-button')).not.toBeInTheDocument());
    expect(screen.getByTestId('add-food-lunch')).toBeInTheDocument();
  });

  it('refuses an entry with no energy — unlike a set, that records nothing', async () => {
    render(<EatDay />);
    fireEvent.click(await screen.findByTestId('add-food-lunch'));
    fireEvent.click(await screen.findByRole('button', { name: /can't find it.*quick add/i }));
    fireEvent.change(screen.getByTestId('food-name-input'), { target: { value: 'Air' } });
    fireEvent.click(screen.getByTestId('food-save-button'));

    await new Promise((r) => setTimeout(r, 0));
    expect(mockLogFood).not.toHaveBeenCalled();
  });

  it('keeps the grams as entered rather than inventing a portion', async () => {
    render(<EatDay />);
    fireEvent.click(await screen.findByTestId('add-food-breakfast'));
    fireEvent.click(await screen.findByRole('button', { name: /can't find it.*quick add/i }));
    fireEvent.change(screen.getByTestId('food-name-input'), { target: { value: 'Oats' } });
    fireEvent.change(screen.getByTestId('food-kcal-input'), { target: { value: '340' } });
    fireEvent.change(screen.getByTestId('food-grams-input'), { target: { value: '80' } });
    fireEvent.click(screen.getByTestId('food-save-button'));

    await waitFor(() => expect(mockLogFood).toHaveBeenCalledTimes(1));
    expect(mockLogFood).toHaveBeenCalledWith(
      expect.objectContaining({ quantityGrams: 80, quantityLabel: '80 g' }),
      expect.any(Date),
    );
  });

  it('says plainly that no target is set rather than comparing against nothing', async () => {
    mockGetUser.mockResolvedValue({ ...baseUser, calorieTargetKcal: null, proteinTargetG: null });
    render(<EatDay />);
    await waitFor(() => expect(screen.getByText(/no target set/i)).toBeInTheDocument());
  });

  it('renders the empty meal state as supporting copy close to the meal label', async () => {
    render(<EatDay />);

    const breakfast = await screen.findByTestId('meal-breakfast');
    const empty = screen.getAllByText('Nothing added')[0];

    expect(breakfast).toContainElement(empty);
    expect(empty).toHaveClass('mt-1.5');
    expect(empty).toHaveClass('font-serif');
    expect(empty).not.toHaveClass('uppercase');
  });

  it('renders the add-food control inside its return animation shell', async () => {
    render(<EatDay />);

    expect(await screen.findByTestId('add-food-lunch')).toBeInTheDocument();
    expect(screen.getByTestId('add-food-lunch-shell')).toHaveClass('food-add-return');
  });

  it('reports the weekly average over days actually logged, and says so', async () => {
    mockGetEntriesSince.mockResolvedValue([
      entry({ id: 'a', kcal: 2000, loggedAt: '2026-07-26T08:00:00.000Z' }),
      entry({ id: 'b', kcal: 3000, loggedAt: '2026-07-27T08:00:00.000Z' }),
    ]);
    render(<EatDay />);
    await waitFor(() => expect(screen.getByTestId('week-average')).toHaveTextContent('2,500'));
    expect(screen.getByText(/over 2 logged days/i)).toBeInTheDocument();
  });
});
