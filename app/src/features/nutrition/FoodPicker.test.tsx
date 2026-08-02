import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getUser, type User } from '../../db/user';
import { logFood } from '../../db/nutrition';
import { useOnline } from '../../food/connectivity';
import { getCommonFoods, getRecentFoods, saveFoodItem, searchFoodLocal } from '../../food/local';
import { macrosForQuantity } from '../../food/macros';
import { lookupBarcode, searchFoodOnline } from '../../food/off';
import type { FoodItem, FoodItemDraft } from '../../food/types';
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
vi.mock('../../food/off', () => ({ lookupBarcode: vi.fn(), searchFoodOnline: vi.fn() }));
vi.mock('./BarcodeScanner', () => ({
  BarcodeScanner: ({ onDetected }: { onDetected: (code: string) => void }) => (
    <button data-testid="scan-fire" onClick={() => onDetected('5000159484695')}>fire</button>
  ),
}));

const mockGetUser = vi.mocked(getUser);
const mockLogFood = vi.mocked(logFood);
const mockUseOnline = vi.mocked(useOnline);
const mockGetCommonFoods = vi.mocked(getCommonFoods);
const mockGetRecentFoods = vi.mocked(getRecentFoods);
const mockSaveFoodItem = vi.mocked(saveFoodItem);
const mockSearchFoodLocal = vi.mocked(searchFoodLocal);
const mockMacrosForQuantity = vi.mocked(macrosForQuantity);
const mockLookupBarcode = vi.mocked(lookupBarcode);
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

function offDraft(overrides: Partial<FoodItemDraft> = {}): FoodItemDraft {
  return {
    source: 'off',
    name: 'Skyr Plain',
    kcalPer100g: 62,
    proteinGPer100g: 11,
    carbsGPer100g: 4,
    fatGPer100g: 0.2,
    ...overrides,
  };
}

function renderPicker(
  day = new Date(2026, 6, 31),
  onLogged: () => void | Promise<void> = vi.fn(),
  onClose = vi.fn(),
) {
  const rendered = render(<FoodPicker mealSlot="dinner" day={day} onLogged={onLogged} onClose={onClose} />);
  return { ...rendered, onLogged, onClose };
}

describe('FoodPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue(user);
    mockUseOnline.mockReturnValue(true);
    mockGetRecentFoods.mockResolvedValue([]);
    mockGetCommonFoods.mockResolvedValue([]);
    mockSearchFoodLocal.mockResolvedValue([]);
    mockLookupBarcode.mockResolvedValue(null);
    mockSearchFoodOnline.mockResolvedValue({ drafts: [], hidden: 0 });
    mockSaveFoodItem.mockResolvedValue(food({ id: 'saved-off', source: 'off' }));
    mockMacrosForQuantity.mockReturnValue({ kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6 });
    mockLogFood.mockResolvedValue({} as Awaited<ReturnType<typeof logFood>>);
  });

  it('opens as an inline panel so adding food has a visible transition', async () => {
    renderPicker();

    const panel = await screen.findByTestId('food-picker-panel');

    expect(panel).toHaveAttribute('data-state', 'open');
  });

  it('plays the close transition before asking the meal section to unmount it', async () => {
    const onClose = vi.fn();
    renderPicker(new Date(2026, 6, 31), vi.fn(), onClose);
    const panel = await screen.findByTestId('food-picker-panel');

    vi.useFakeTimers();
    try {
      fireEvent.click(screen.getByRole('button', { name: /back/i }));

      expect(panel).toHaveAttribute('data-state', 'closing');
      expect(onClose).not.toHaveBeenCalled();

      act(() => {
        vi.runOnlyPendingTimers();
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
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
      drafts: [offDraft()],
      hidden: 2,
    });
    renderPicker();

    const input = await screen.findByRole('searchbox');
    fireEvent.change(input, { target: { value: 'skyr' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(await screen.findByText(/2 results hidden \u2014 missing enough nutrition data/i)).toBeInTheDocument();
  });

  it('keeps the incomplete-result warning qualitative when figures are hidden', async () => {
    mockGetUser.mockResolvedValue({ ...user, numbersHidden: true });
    mockSearchFoodOnline.mockResolvedValue({ drafts: [offDraft()], hidden: 2 });
    renderPicker();

    const input = await screen.findByRole('searchbox');
    fireEvent.change(input, { target: { value: 'skyr' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(await screen.findByText(/some results hidden because they did not include enough nutrition data/i)).toBeInTheDocument();
    expect(screen.queryByText(/2 results hidden/i)).not.toBeInTheDocument();
  });

  it('filters local foods and searches OFF automatically while typing', async () => {
    mockSearchFoodLocal.mockResolvedValue([food({ name: 'Skyr, plain' })]);
    mockSearchFoodOnline.mockResolvedValue({ drafts: [offDraft({ name: 'Skyr Plain OFF' })], hidden: 0 });
    renderPicker();

    const input = await screen.findByRole('searchbox');
    fireEvent.change(input, { target: { value: 'skyr' } });

    expect(await screen.findByText('Skyr, plain')).toBeInTheDocument();
    expect(await screen.findByText('Skyr Plain OFF')).toBeInTheDocument();
    expect(mockSearchFoodOnline).toHaveBeenCalledWith('skyr');
    expect(mockLookupBarcode).not.toHaveBeenCalled();
  });

  it('looks up a plausible barcode automatically and renders the matching OFF food', async () => {
    const barcode = '5000159484695';
    const draft = offDraft({ name: 'Heinz Baked Beans', barcode, kcalPer100g: 78, proteinGPer100g: 4.7, carbsGPer100g: 12.5, fatGPer100g: 0.2 });
    mockLookupBarcode.mockResolvedValue(draft);
    renderPicker();

    const input = await screen.findByRole('searchbox');
    fireEvent.change(input, { target: { value: ` ${barcode} ` } });

    expect(await screen.findByText('Heinz Baked Beans')).toBeInTheDocument();
    expect(mockLookupBarcode).toHaveBeenCalledWith(barcode);
    expect(mockSearchFoodOnline).not.toHaveBeenCalled();
  });

  it('keeps the online results empty when a barcode has no OFF match', async () => {
    mockLookupBarcode.mockResolvedValue(null);
    renderPicker();

    const input = await screen.findByRole('searchbox');
    fireEvent.change(input, { target: { value: '5000159484695' } });

    await waitFor(() => expect(mockLookupBarcode).toHaveBeenCalledWith('5000159484695'));
    expect(screen.queryByText('Results · Open Food Facts')).not.toBeInTheDocument();
    expect(screen.queryByTestId('food-offline-notice')).not.toBeInTheDocument();
  });

  it('shows a searching state while the database lookup is in flight', async () => {
    mockSearchFoodOnline.mockReturnValue(new Promise(() => undefined));
    renderPicker();

    const input = await screen.findByRole('searchbox');
    fireEvent.change(input, { target: { value: 'skyr' } });

    expect(await screen.findByTestId('food-searching')).toHaveTextContent(/searching database/i);
  });

  it('makes an empty completed search explicit', async () => {
    mockSearchFoodLocal.mockResolvedValue([]);
    mockSearchFoodOnline.mockResolvedValue({ drafts: [], hidden: 0 });
    renderPicker();

    const input = await screen.findByRole('searchbox');
    fireEvent.change(input, { target: { value: 'zzzzzz' } });

    expect(await screen.findByTestId('food-no-results')).toHaveTextContent(/no matching foods found/i);
  });

  it('searches OFF by keyword automatically for a non-barcode query', async () => {
    mockSearchFoodOnline.mockResolvedValue({
      drafts: [offDraft()],
      hidden: 0,
    });
    renderPicker();

    const input = await screen.findByRole('searchbox');
    fireEvent.change(input, { target: { value: 'skyr' } });

    expect(await screen.findByText('Skyr Plain')).toBeInTheDocument();
    expect(mockSearchFoodOnline).toHaveBeenCalledWith('skyr');
    expect(mockLookupBarcode).not.toHaveBeenCalled();
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

  it('awaits the selected-food refresh before closing the picker', async () => {
    let finishRefresh: () => void;
    const onLogged = vi.fn(() => new Promise<void>((resolve) => {
      finishRefresh = resolve;
    }));
    const onClose = vi.fn();
    mockGetCommonFoods.mockResolvedValue([food({ id: 'cofid-chicken' })]);
    renderPicker(new Date(2026, 6, 31), onLogged, onClose);

    fireEvent.click(await screen.findByRole('button', { name: /chicken breast, grilled/i }));
    fireEvent.click(screen.getByRole('button', { name: /add to dinner/i }));

    await waitFor(() => expect(onLogged).toHaveBeenCalledTimes(1));
    expect(onClose).not.toHaveBeenCalled();
    finishRefresh!();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('cannot log the selected food twice during the closing transition', async () => {
    let finishRefresh: () => void;
    const onLogged = vi.fn(() => new Promise<void>((resolve) => {
      finishRefresh = resolve;
    }));
    const onClose = vi.fn();
    mockGetCommonFoods.mockResolvedValue([food({ id: 'cofid-chicken' })]);
    renderPicker(new Date(2026, 6, 31), onLogged, onClose);

    fireEvent.click(await screen.findByRole('button', { name: /chicken breast, grilled/i }));
    const addButton = screen.getByRole('button', { name: /add to dinner/i });
    fireEvent.click(addButton);
    await waitFor(() => expect(onLogged).toHaveBeenCalledTimes(1));

    vi.useFakeTimers();
    try {
      await act(async () => {
        finishRefresh!();
      });

      expect(screen.getByTestId('food-picker-panel')).toHaveAttribute('data-state', 'closing');
      expect(addButton).toBeDisabled();
      fireEvent.click(addButton);
      expect(mockLogFood).toHaveBeenCalledTimes(1);

      act(() => {
        vi.runOnlyPendingTimers();
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('awaits the quick-add refresh before closing the picker', async () => {
    let finishRefresh: () => void;
    const onLogged = vi.fn(() => new Promise<void>((resolve) => {
      finishRefresh = resolve;
    }));
    const onClose = vi.fn();
    renderPicker(new Date(2026, 6, 31), onLogged, onClose);

    fireEvent.click(await screen.findByRole('button', { name: /can't find it.*quick add/i }));
    fireEvent.change(screen.getByTestId('food-name-input'), { target: { value: 'Chicken and rice' } });
    fireEvent.change(screen.getByTestId('food-kcal-input'), { target: { value: '760' } });
    fireEvent.click(screen.getByTestId('food-save-button'));

    await waitFor(() => expect(onLogged).toHaveBeenCalledTimes(1));
    expect(onClose).not.toHaveBeenCalled();
    finishRefresh!();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
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

  it('replaces quick-add with a hidden-safe route back to sourced foods', async () => {
    mockGetUser.mockResolvedValue({ ...user, numbersHidden: true });
    renderPicker();

    fireEvent.click(await screen.findByRole('button', { name: /can't find it.*quick add/i }));

    expect(screen.getByText(/quick add with nutrition figures is unavailable while figures are hidden/i)).toBeInTheDocument();
    expect(screen.queryByTestId('food-kcal-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('food-protein-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('food-save-button')).not.toBeInTheDocument();
    expect(mockLogFood).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /back to sourced foods/i }));
    expect(await screen.findByRole('searchbox')).toBeInTheDocument();
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
    let resolveSearch: (value: { drafts: FoodItemDraft[]; hidden: number }) => void;
    const pendingSearch = new Promise<{ drafts: FoodItemDraft[]; hidden: number }>((resolve) => {
      resolveSearch = resolve;
    });
    mockSearchFoodOnline.mockReturnValueOnce(pendingSearch);
    renderPicker();

    const input = await screen.findByRole('searchbox');
    fireEvent.change(input, { target: { value: 'skyr' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    fireEvent.change(input, { target: { value: 'yogurt' } });
    await act(async () => {
      resolveSearch!({ drafts: [offDraft()], hidden: 0 });
    });

    expect(screen.queryByText('Skyr Plain')).not.toBeInTheDocument();
  });

  it('keeps hidden-mode quantity editable and logs it without rendering nutrition figures', async () => {
    mockGetUser.mockResolvedValue({ ...user, numbersHidden: true });
    mockGetCommonFoods.mockResolvedValue([food({ id: 'cofid-chicken' })]);
    mockMacrosForQuantity.mockReturnValue({ kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6 });
    renderPicker();

    fireEvent.click(await screen.findByRole('button', { name: /chicken breast, grilled/i }));

    expect(screen.getByTestId('food-grams-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add to dinner/i })).toBeInTheDocument();
    expect(screen.queryByText(/165 kcal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/31 g protein/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/per 100 g/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByTestId('food-grams-input'), { target: { value: '200' } });
    fireEvent.click(screen.getByRole('button', { name: /add to dinner/i }));
    await waitFor(() =>
      expect(mockLogFood).toHaveBeenCalledWith(
        expect.objectContaining({ foodItemId: 'cofid-chicken', quantityGrams: 200, quantityLabel: '200 g' }),
        expect.any(Date),
      ),
    );
  });

  it('caches an OFF selection before logging it', async () => {
    mockSearchFoodOnline.mockResolvedValue({
      drafts: [offDraft()],
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

  it('runs the OFF barcode lookup when the scanner delivers a code', async () => {
    const barcode = '5000159484695';
    const draft = offDraft({ name: 'Heinz Baked Beans', barcode, kcalPer100g: 78, proteinGPer100g: 4.7, carbsGPer100g: 12.5, fatGPer100g: 0.2 });
    mockLookupBarcode.mockResolvedValue(draft);
    renderPicker();

    fireEvent.click(await screen.findByRole('button', { name: /scan barcode/i }));
    fireEvent.click(await screen.findByTestId('scan-fire'));

    expect(await screen.findByText('Heinz Baked Beans')).toBeInTheDocument();
    expect(mockLookupBarcode).toHaveBeenCalledWith(barcode);
    expect(mockSearchFoodOnline).not.toHaveBeenCalled();
  });
});
