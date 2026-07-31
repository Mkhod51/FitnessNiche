import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getUser, type User } from '../../db/user';
import { logFood } from '../../db/nutrition';
import { useOnline } from '../../food/connectivity';
import { getCommonFoods, getRecentFoods, saveFoodItem, searchFoodLocal } from '../../food/local';
import { macrosForQuantity } from '../../food/macros';
import { searchFoodOnline } from '../../food/off';
import type { FoodItem } from '../../food/types';
import { FoodPicker } from './FoodPicker';

vi.mock('../../db/user', async () => {
  const actual = await vi.importActual<typeof import('../../db/user')>('../../db/user');
  return { ...actual, getUser: vi.fn() };
});

vi.mock('../../db/nutrition', async () => {
  const actual = await vi.importActual<typeof import('../../db/nutrition')>('../../db/nutrition');
  return { ...actual, logFood: vi.fn() };
});

vi.mock('../../food/connectivity', () => ({ useOnline: vi.fn() }));
vi.mock('../../food/local', () => ({
  getCommonFoods: vi.fn(),
  getRecentFoods: vi.fn(),
  saveFoodItem: vi.fn(),
  searchFoodLocal: vi.fn(),
}));
vi.mock('../../food/macros', () => ({ macrosForQuantity: vi.fn() }));
vi.mock('../../food/off', () => ({ searchFoodOnline: vi.fn() }));

const mockGetUser = vi.mocked(getUser);
const mockLogFood = vi.mocked(logFood);
const mockUseOnline = vi.mocked(useOnline);
const mockGetCommonFoods = vi.mocked(getCommonFoods);
const mockGetRecentFoods = vi.mocked(getRecentFoods);
const mockSaveFoodItem = vi.mocked(saveFoodItem);
const mockSearchFoodLocal = vi.mocked(searchFoodLocal);
const mockMacrosForQuantity = vi.mocked(macrosForQuantity);
const mockSearchFoodOnline = vi.mocked(searchFoodOnline);

const user: User = {
  id: 'local-user',
  sex: 'unspecified',
  heightCm: null,
  birthYear: null,
  goal: 'maintain',
  goalStartedAt: null,
  calorieTargetKcal: null,
  proteinTargetG: null,
  deficitKcal: 0,
  numbersHidden: false,
  consentedAt: '2026-07-31T08:00:00.000Z',
  updatedAt: '2026-07-31T08:00:00.000Z',
};

function food(overrides: Partial<FoodItem> = {}): FoodItem {
  return {
    id: 'food-1',
    source: 'cofid',
    name: 'Chicken breast, grilled',
    brand: null,
    barcode: null,
    kcalPer100g: 165,
    proteinGPer100g: 31,
    carbsGPer100g: 0,
    fatGPer100g: 3.6,
    fibreGPer100g: null,
    servingGrams: null,
    servingLabel: null,
    updatedAt: '2026-07-31T08:00:00.000Z',
    ...overrides,
  };
}

function renderPicker(day = new Date(2026, 6, 31)) {
  return render(<FoodPicker mealSlot="dinner" day={day} onLogged={vi.fn()} onClose={vi.fn()} />);
}

describe('FoodPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue(user);
    mockUseOnline.mockReturnValue(true);
    mockGetRecentFoods.mockResolvedValue([]);
    mockGetCommonFoods.mockResolvedValue([]);
    mockSearchFoodLocal.mockResolvedValue([]);
    mockSearchFoodOnline.mockResolvedValue({ drafts: [], hidden: 0 });
    mockSaveFoodItem.mockResolvedValue(food({ id: 'saved-off', source: 'off' }));
    mockMacrosForQuantity.mockReturnValue({ kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6 });
    mockLogFood.mockResolvedValue({} as Awaited<ReturnType<typeof logFood>>);
  });

  it('keeps recent foods available and explains the connection requirement offline', async () => {
    mockUseOnline.mockReturnValue(false);
    mockGetRecentFoods.mockResolvedValue([food()]);

    renderPicker();

    expect(await screen.findByText(/You'll need wifi to search for new foods/i)).toHaveTextContent(
      'Your recent and common foods are still here \u2014 and quick-add works without a connection.',
    );
    expect(screen.getByText('Chicken breast, grilled')).toBeInTheDocument();
  });

  it('shows an honesty note after a submitted OFF search hides incomplete foods', async () => {
    mockSearchFoodOnline.mockResolvedValue({
      drafts: [{ source: 'off', name: 'Skyr Plain', kcalPer100g: 62, proteinGPer100g: 11 }],
      hidden: 2,
    });
    renderPicker();

    const input = await screen.findByRole('searchbox');
    fireEvent.change(input, { target: { value: 'skyr' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(await screen.findByText(/2 results hidden \u2014 missing protein or energy/i)).toBeInTheDocument();
  });

  it('filters local foods while typing without calling OFF until the query is submitted', async () => {
    mockSearchFoodLocal.mockResolvedValue([food({ name: 'Skyr, plain' })]);
    renderPicker();

    const input = await screen.findByRole('searchbox');
    fireEvent.change(input, { target: { value: 'skyr' } });

    expect(await screen.findByText('Skyr, plain')).toBeInTheDocument();
    expect(mockSearchFoodOnline).not.toHaveBeenCalled();
  });

  it('renders CoFID and OFF provenance labels on food rows', async () => {
    mockGetRecentFoods.mockResolvedValue([food({ source: 'off', name: 'Whey isolate' })]);
    mockGetCommonFoods.mockResolvedValue([food()]);
    renderPicker();

    expect(await screen.findByText('OFF')).toBeInTheDocument();
    expect(screen.getByText('CoFID')).toBeInTheDocument();
  });

  it('logs a selected common food with its stored id and computed macros', async () => {
    mockGetCommonFoods.mockResolvedValue([food({ id: 'cofid-chicken' })]);
    mockMacrosForQuantity.mockReturnValue({ kcal: 330, proteinG: 62, carbsG: 0, fatG: 7.2 });
    renderPicker();

    fireEvent.click(await screen.findByRole('button', { name: /chicken breast, grilled/i }));
    fireEvent.change(screen.getByTestId('food-grams-input'), { target: { value: '200' } });
    fireEvent.click(screen.getByRole('button', { name: /add to dinner/i }));

    await waitFor(() => {
      expect(mockLogFood).toHaveBeenCalledWith(
        {
          name: 'Chicken breast, grilled',
          mealSlot: 'dinner',
          foodItemId: 'cofid-chicken',
          kcal: 330,
          proteinG: 62,
          carbsG: 0,
          fatG: 7.2,
          quantityGrams: 200,
          quantityLabel: '200 g',
        },
        expect.any(Date),
      );
    });
  });

  it('keeps names and provenance visible without exposing figures in numbers-hidden mode', async () => {
    mockGetUser.mockResolvedValue({ ...user, numbersHidden: true });
    mockGetCommonFoods.mockResolvedValue([food()]);
    renderPicker();

    expect(await screen.findByText('Chicken breast, grilled')).toBeInTheDocument();
    expect(screen.getByText('CoFID')).toBeInTheDocument();
    expect(screen.queryByText(/165 kcal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/31 P/i)).not.toBeInTheDocument();
  });

  it('does not expose figures before the numbers-hidden preference has loaded', async () => {
    let resolveUser: (value: User) => void;
    const pendingUser = new Promise<User>((resolve) => {
      resolveUser = resolve;
    });
    mockGetUser.mockReturnValueOnce(pendingUser);
    mockSearchFoodLocal.mockResolvedValue([food({ name: 'Skyr, plain' })]);

    renderPicker();

    fireEvent.change(await screen.findByRole('searchbox'), { target: { value: 'skyr' } });
    expect(await screen.findByText('Skyr, plain')).toBeInTheDocument();
    expect(screen.queryByText(/165 kcal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/31 P/i)).not.toBeInTheDocument();

    resolveUser!(user);
    await waitFor(() => expect(screen.getByText(/165 kcal/i)).toBeInTheDocument());
  });

  it('ignores a submitted OFF response once the query has changed', async () => {
    let resolveSearch: (value: { drafts: Array<{ source: 'off'; name: string; kcalPer100g: number; proteinGPer100g: number }>; hidden: number }) => void;
    const pendingSearch = new Promise<{ drafts: Array<{ source: 'off'; name: string; kcalPer100g: number; proteinGPer100g: number }>; hidden: number }>((resolve) => {
      resolveSearch = resolve;
    });
    mockSearchFoodOnline.mockReturnValueOnce(pendingSearch);
    renderPicker();

    const input = await screen.findByRole('searchbox');
    fireEvent.change(input, { target: { value: 'skyr' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    fireEvent.change(input, { target: { value: 'yogurt' } });
    await act(async () => {
      resolveSearch!({ drafts: [{ source: 'off', name: 'Skyr Plain', kcalPer100g: 62, proteinGPer100g: 11 }], hidden: 0 });
    });

    expect(screen.queryByText('Skyr Plain')).not.toBeInTheDocument();
  });

  it('keeps the hidden-mode selected-food workflow usable without rendering figures', async () => {
    mockGetUser.mockResolvedValue({ ...user, numbersHidden: true });
    mockGetCommonFoods.mockResolvedValue([food({ id: 'cofid-chicken' })]);
    mockMacrosForQuantity.mockReturnValue({ kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6 });
    renderPicker();

    fireEvent.click(await screen.findByRole('button', { name: /chicken breast, grilled/i }));

    expect(screen.getByRole('button', { name: /add to dinner/i })).toBeInTheDocument();
    expect(screen.queryByText(/165 kcal/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /add to dinner/i }));
    await waitFor(() => expect(mockLogFood).toHaveBeenCalledWith(expect.objectContaining({ foodItemId: 'cofid-chicken' }), expect.any(Date)));
  });

  it('caches an OFF selection before logging it', async () => {
    mockSearchFoodOnline.mockResolvedValue({
      drafts: [{ source: 'off', name: 'Skyr Plain', kcalPer100g: 62, proteinGPer100g: 11 }],
      hidden: 0,
    });
    mockSaveFoodItem.mockResolvedValue(food({ id: 'saved-skyr', source: 'off', name: 'Skyr Plain' }));
    renderPicker();

    const input = await screen.findByRole('searchbox');
    fireEvent.change(input, { target: { value: 'skyr' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    fireEvent.click(await screen.findByRole('button', { name: /skyr plain/i }));
    fireEvent.click(screen.getByRole('button', { name: /add to dinner/i }));

    await waitFor(() => expect(mockLogFood).toHaveBeenCalledWith(expect.objectContaining({ foodItemId: 'saved-skyr' }), expect.any(Date)));
    expect(mockSaveFoodItem.mock.invocationCallOrder[0]).toBeLessThan(mockLogFood.mock.invocationCallOrder[0]);
  });

  it('shows the wifi notice when the submitted OFF search fails', async () => {
    mockSearchFoodOnline.mockRejectedValueOnce(new Error('network failed'));
    renderPicker();

    const input = await screen.findByRole('searchbox');
    fireEvent.change(input, { target: { value: 'skyr' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(await screen.findByTestId('food-offline-notice')).toBeInTheDocument();
  });

  it('timestamps a historical selected-food entry at local noon', async () => {
    mockGetCommonFoods.mockResolvedValue([food({ id: 'cofid-chicken' })]);
    renderPicker(new Date(2020, 0, 2));

    fireEvent.click(await screen.findByRole('button', { name: /chicken breast, grilled/i }));
    fireEvent.click(screen.getByRole('button', { name: /add to dinner/i }));

    await waitFor(() => expect(mockLogFood).toHaveBeenCalled());
    const loggedAt = mockLogFood.mock.calls[0][1] as Date;
    expect(loggedAt.getFullYear()).toBe(2020);
    expect(loggedAt.getMonth()).toBe(0);
    expect(loggedAt.getDate()).toBe(2);
    expect(loggedAt.getHours()).toBe(12);
  });

  it('timestamps a today selected-food entry at the current time', async () => {
    const today = new Date();
    mockGetCommonFoods.mockResolvedValue([food({ id: 'cofid-chicken' })]);
    renderPicker(today);

    fireEvent.click(await screen.findByRole('button', { name: /chicken breast, grilled/i }));
    fireEvent.click(screen.getByRole('button', { name: /add to dinner/i }));

    await waitFor(() => expect(mockLogFood).toHaveBeenCalled());
    const loggedAt = mockLogFood.mock.calls[0][1] as Date;
    expect(Math.abs(loggedAt.getTime() - Date.now())).toBeLessThan(1_000);
  });
});
