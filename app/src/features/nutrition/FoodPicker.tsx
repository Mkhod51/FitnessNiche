import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { getUser } from '../../db/user';
import { logFood, type MealSlot } from '../../db/nutrition';
import { useOnline } from '../../food/connectivity';
import { getCommonFoods, getRecentFoods, saveFoodItem, searchFoodLocal } from '../../food/local';
import { macrosForQuantity } from '../../food/macros';
import { lookupBarcode, searchFoodOnline } from '../../food/off';
import type { FoodItem, FoodItemDraft } from '../../food/types';

type FoodPickerProps = {
  mealSlot: MealSlot;
  day: Date;
  onLogged: () => void | Promise<void>;
  onClose: () => void;
};

type PickedFood = FoodItem | FoodItemDraft;

const LABEL = 'font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint';
const FIGURE = 'font-figure tabular-nums';
const PICKER_MOTION_MS = 200;
const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

function sourceLabel(source: string): string {
  return source === 'cofid' ? 'CoFID' : source === 'off' ? 'OFF' : source.toUpperCase();
}

function isStoredFood(food: PickedFood): food is FoodItem {
  return 'id' in food;
}

function asDraft(food: PickedFood): FoodItemDraft {
  if (!isStoredFood(food)) return food;
  return {
    source: 'off',
    name: food.name,
    brand: food.brand ?? undefined,
    barcode: food.barcode ?? undefined,
    kcalPer100g: food.kcalPer100g,
    proteinGPer100g: food.proteinGPer100g,
    carbsGPer100g: food.carbsGPer100g,
    fatGPer100g: food.fatGPer100g,
    fibreGPer100g: food.fibreGPer100g ?? undefined,
    servingGrams: food.servingGrams ?? undefined,
    servingLabel: food.servingLabel ?? undefined,
  };
}

function loggedAtFor(day: Date): Date {
  const today = new Date();
  const isToday =
    day.getFullYear() === today.getFullYear() &&
    day.getMonth() === today.getMonth() &&
    day.getDate() === today.getDate();
  return isToday ? new Date() : new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12);
}

function isPlausibleBarcode(term: string): boolean {
  return /^\d{8,14}$/.test(term);
}

export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function FoodRow({ food, hidden, onSelect }: { food: PickedFood; hidden: boolean; onSelect: () => void }): ReactElement {
  return (
    <li className="border-b border-rule last:border-b-0">
      <button
        type="button"
        onClick={onSelect}
        className="flex min-h-[54px] w-full items-center justify-between gap-3 px-4 py-2.5 text-left"
      >
        <span className="min-w-0">
          <span className="block font-serif text-[15.5px] leading-[1.18] text-ink">{food.name}</span>
          {!hidden && (
            <span className={`${FIGURE} mt-1 block text-[11px] text-ink-faint`}>
              {'brand' in food && food.brand ? `${food.brand} · ` : ''}
              {Math.round(food.kcalPer100g)} kcal · {food.proteinGPer100g} P /100g ·{' '}
              <span className={`${LABEL} text-[8.5px] ${food.source === 'cofid' ? 'text-ink-soft' : ''}`}>
                {sourceLabel(food.source)}
              </span>
            </span>
          )}
          {hidden && (
            <span className={`${LABEL} mt-1 block text-[8.5px] ${food.source === 'cofid' ? 'text-ink-soft' : ''}`}>
              {sourceLabel(food.source)}
            </span>
          )}
        </span>
        <span aria-hidden="true" className="text-[14px] text-ink-faint">&rsaquo;</span>
      </button>
    </li>
  );
}

function WifiNotice({ quickAddAvailable }: { quickAddAvailable: boolean }): ReactElement {
  return (
    <div data-testid="food-offline-notice" className="mx-4 mb-3 mt-1 bg-paper-sunk px-3.5 py-3">
      <p className="font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
        You&apos;ll need wifi to search for new foods. Your recent and common foods are still here
        {quickAddAvailable ? <> &mdash; and quick-add works without a connection.</> : '.'}
      </p>
    </div>
  );
}

export function FoodPicker({ mealSlot, day, onLogged, onClose }: FoodPickerProps): ReactElement {
  const online = useOnline();
  const [hidden, setHidden] = useState<boolean | null>(null);
  const [recent, setRecent] = useState<FoodItem[]>([]);
  const [common, setCommon] = useState<FoodItem[]>([]);
  const [query, setQuery] = useState('');
  const [localResults, setLocalResults] = useState<FoodItem[]>([]);
  const [onlineResults, setOnlineResults] = useState<FoodItemDraft[]>([]);
  const [onlineResultsQuery, setOnlineResultsQuery] = useState('');
  const [onlineHidden, setOnlineHidden] = useState(0);
  const [onlineFailed, setOnlineFailed] = useState(false);
  const [selected, setSelected] = useState<PickedFood | null>(null);
  const [grams, setGrams] = useState('100');
  const [quickAdd, setQuickAdd] = useState(false);
  const [quickDraft, setQuickDraft] = useState({ name: '', kcal: '', protein: '', grams: '' });
  const [busy, setBusy] = useState(false);
  const [closing, setClosing] = useState(false);
  const queryRef = useRef(query);
  const onlineRef = useRef(online);
  const searchRequestRef = useRef(0);
  const closeTimerRef = useRef<number | null>(null);

  function closeWithMotion() {
    if (closing) return;
    setClosing(true);
    if (prefersReducedMotion()) {
      onClose();
      return;
    }
    closeTimerRef.current = window.setTimeout(onClose, PICKER_MOTION_MS);
  }

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  const controlsDisabled = busy || closing;

  function pickerFrame(label: string, children: ReactElement): ReactElement {
    return (
      <section
        aria-label={label}
        data-testid="food-picker-panel"
        data-state={closing ? 'closing' : 'open'}
        className={`border-y border-rule ${closing ? 'food-picker-exit' : 'food-picker-enter'}`}
      >
        <div>{children}</div>
      </section>
    );
  }

  function PickerHeader({
    title,
    subtitle,
    onBack,
    subtitleClassName = '',
  }: {
    title: string;
    subtitle: string;
    onBack: () => void;
    subtitleClassName?: string;
  }): ReactElement {
    return (
      <header className="border-b border-rule px-4 pb-4 pt-3">
        <button
          type="button"
          onClick={onBack}
          className={`${LABEL} -ml-2 flex min-h-[44px] items-center px-2 text-ink transition-colors duration-[var(--motion-tap)] ease-[var(--motion-ease)] active:bg-paper-sunk`}
        >
          Back
        </button>
        <div className="mt-1">
          <p className="font-serif text-[20px] leading-[1.1] text-ink">{title}</p>
          <p className={`${LABEL} mt-1 ${subtitleClassName}`}>{subtitle}</p>
        </div>
      </header>
    );
  }

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getUser(), getRecentFoods(), getCommonFoods()]).then(([user, recentFoods, commonFoods]) => {
      if (cancelled) return;
      setHidden(user.numbersHidden);
      setRecent(recentFoods);
      setCommon(commonFoods);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    onlineRef.current = online;
    if (!online) {
      searchRequestRef.current += 1;
      setOnlineResults([]);
      setOnlineResultsQuery('');
      setOnlineHidden(0);
    }
  }, [online]);

  useEffect(() => {
    let cancelled = false;
    const term = query.trim();
    searchRequestRef.current += 1;
    setOnlineResults([]);
    setOnlineResultsQuery('');
    setOnlineHidden(0);
    setOnlineFailed(false);
    if (!term) {
      setLocalResults([]);
      return () => {
        cancelled = true;
      };
    }
    void searchFoodLocal(term).then((foods) => {
      if (!cancelled) setLocalResults(foods);
    });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const figuresHidden = hidden !== false;

  const quantity = Number(grams);
  const validQuantity = Number.isFinite(quantity) && quantity > 0;
  const macros = useMemo(
    () => (selected && validQuantity ? macrosForQuantity(selected, quantity) : null),
    [selected, quantity, validQuantity],
  );

  function pick(food: PickedFood) {
    setSelected(food);
    setQuickAdd(false);
    setGrams(String(food.servingGrams ?? 100));
  }

  async function runOnlineSearch() {
    const term = queryRef.current.trim();
    if (!term || !online) return;
    const request = ++searchRequestRef.current;
    try {
      const result = isPlausibleBarcode(term)
        ? await lookupBarcode(term).then((draft) => ({ drafts: draft ? [draft] : [], hidden: 0 }))
        : await searchFoodOnline(term);
      if (request !== searchRequestRef.current || queryRef.current.trim() !== term || !onlineRef.current) return;
      setOnlineResults(result.drafts);
      setOnlineResultsQuery(term);
      setOnlineHidden(result.hidden);
      setOnlineFailed(false);
    } catch {
      if (request !== searchRequestRef.current || queryRef.current.trim() !== term || !onlineRef.current) return;
      setOnlineResults([]);
      setOnlineResultsQuery('');
      setOnlineHidden(0);
      setOnlineFailed(true);
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runOnlineSearch();
  }

  async function addSelected() {
    if (!selected || !macros || !validQuantity || controlsDisabled) return;
    setBusy(true);
    try {
      const item = selected.source === 'off' ? await saveFoodItem(asDraft(selected)) : selected;
      await logFood(
        {
          name: selected.name,
          mealSlot,
          foodItemId: isStoredFood(item) ? item.id : undefined,
          kcal: macros.kcal,
          proteinG: macros.proteinG,
          carbsG: macros.carbsG,
          fatG: macros.fatG,
          quantityGrams: quantity,
          quantityLabel: `${grams} g`,
        },
        loggedAtFor(day),
      );
      await onLogged();
      closeWithMotion();
    } finally {
      setBusy(false);
    }
  }

  async function addQuickFood() {
    if (controlsDisabled) return;
    const kcal = Number(quickDraft.kcal);
    const protein = Number(quickDraft.protein);
    if (!quickDraft.name.trim() || !Number.isFinite(kcal) || kcal <= 0) return;
    setBusy(true);
    try {
      await logFood(
        {
          name: quickDraft.name.trim(),
          mealSlot,
          kcal,
          proteinG: Number.isFinite(protein) ? protein : 0,
          quantityGrams: quickDraft.grams ? Number(quickDraft.grams) : null,
          quantityLabel: quickDraft.grams ? `${quickDraft.grams} g` : null,
        },
        loggedAtFor(day),
      );
      await onLogged();
      closeWithMotion();
    } finally {
      setBusy(false);
    }
  }

  if (quickAdd && figuresHidden) {
    return pickerFrame(
      'Quick add unavailable while figures are hidden',
      <>
        <PickerHeader title="Quick add unavailable" subtitle="Figures are hidden" onBack={() => setQuickAdd(false)} />
        <div className="p-4">
          <p className="font-serif text-[14px] leading-[1.5] text-ink-soft">
            Quick add with nutrition figures is unavailable while figures are hidden. Sourced foods can still be logged without showing their figures.
          </p>
          <button
            type="button"
            onClick={() => setQuickAdd(false)}
            className="mt-3 min-h-[48px] w-full bg-ink font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-paper"
          >
            Back to sourced foods
          </button>
        </div>
      </>,
    );
  }

  if (quickAdd) {
    return pickerFrame(
      `Quick add to ${SLOT_LABEL[mealSlot]}`,
      <>
        <PickerHeader title="Quick add" subtitle={`Add to ${SLOT_LABEL[mealSlot]}`} onBack={() => setQuickAdd(false)} />
        <div className="p-4">
          <input
            data-testid="food-name-input"
            value={quickDraft.name}
            onChange={(event) => setQuickDraft({ ...quickDraft, name: event.target.value })}
            className="h-[44px] w-full border border-rule-strong bg-paper px-3 font-serif text-[16px] text-ink outline-none focus:border-ink"
            placeholder="What did you eat?"
            autoComplete="off"
          />
          <div className="mt-2 grid grid-cols-3 gap-2">
            {([
              ['kcal', 'Energy', 'food-kcal-input'],
              ['protein', 'Protein', 'food-protein-input'],
              ['grams', 'Grams', 'food-grams-input'],
            ] as const).map(([field, label, testId]) => (
              <label key={field}>
                <span className={LABEL}>{label}</span>
                <input
                  data-testid={testId}
                  value={quickDraft[field]}
                  onChange={(event) => setQuickDraft({ ...quickDraft, [field]: event.target.value.replace(/[^0-9]/g, '') })}
                  className={`${FIGURE} mt-1 h-[44px] w-full border border-rule-strong bg-paper px-2 text-right text-[16px] text-ink outline-none focus:border-ink`}
                  inputMode="numeric"
                  autoComplete="off"
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            data-testid="food-save-button"
            onClick={() => void addQuickFood()}
            disabled={controlsDisabled}
            className="mt-3 min-h-[48px] w-full bg-ink font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-paper disabled:opacity-50"
          >
            Add to {SLOT_LABEL[mealSlot]}
          </button>
        </div>
      </>,
    );
  }

  if (selected) {
    const serving = selected.servingGrams;
    return pickerFrame(
      `Add ${selected.name} to ${SLOT_LABEL[mealSlot]}`,
      <>
        <PickerHeader title={selected.name} subtitle={sourceLabel(selected.source)} onBack={() => setSelected(null)} />
        {!figuresHidden && (
          <p className={`${FIGURE} px-4 py-3 text-[12.5px] text-ink-faint`}>
            {Math.round(selected.kcalPer100g)} kcal · {selected.proteinGPer100g} g protein · {selected.carbsGPer100g} g carbs ·{' '}
            {selected.fatGPer100g} g fat - per 100 g
          </p>
        )}
        <div className="px-4 pt-2">
          <label className="block">
            <span className={LABEL}>Grams</span>
            <span className="mt-2 flex h-[52px] items-center border border-rule-strong bg-paper px-3">
              <input
                data-testid="food-grams-input"
                value={grams}
                onChange={(event) => setGrams(event.target.value.replace(/[^0-9.]/g, ''))}
                className={`${FIGURE} min-w-0 flex-1 bg-transparent text-right text-[22px] text-ink outline-none`}
                inputMode="decimal"
                autoComplete="off"
                aria-label="Grams"
              />
              <span className={`${LABEL} ml-2`}>g</span>
            </span>
          </label>
          {serving && (
            <div className={`${FIGURE} flex flex-wrap gap-x-3 gap-y-1 py-3 text-[11.5px] text-ink-faint`}>
              <span>or</span>
              <button type="button" onClick={() => setGrams(String(serving))} className="text-left text-ink underline decoration-rule-strong underline-offset-4">
                {selected.servingLabel ?? '1 serving'} approx. {serving} g
              </button>
              <button type="button" onClick={() => setGrams(String(serving * 2))} className="text-left text-ink underline decoration-rule-strong underline-offset-4">
                2 servings approx. {serving * 2} g
              </button>
            </div>
          )}
        </div>
        {!figuresHidden && macros && (
          <div className="mx-4 mt-3 bg-paper-sunk px-4 py-3.5">
            <p className={`${FIGURE} text-[26px] leading-none text-ink`}>
              {macros.kcal} <span className={`${LABEL} align-middle`}>kcal</span>
            </p>
            <p className={`${FIGURE} mt-2 text-[13px] text-ink-soft`}>
              {macros.proteinG} g protein · {macros.carbsG} g carbs · {macros.fatG} g fat
            </p>
          </div>
        )}
        <div className="p-4">
          <button
            type="button"
            onClick={() => void addSelected()}
            disabled={!macros || controlsDisabled}
            className="min-h-[48px] w-full bg-ink font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-paper disabled:opacity-50"
          >
            Add to {SLOT_LABEL[mealSlot]}
          </button>
          <button type="button" onClick={() => setQuickAdd(true)} className={`${LABEL} mt-2 min-h-[44px] w-full text-ink-faint`}>
            Quick add instead &rsaquo;
          </button>
        </div>
      </>,
    );
  }

  const isSearching = query.trim().length > 0;
  const showWifiNotice = !online || onlineFailed;
  const showOnlineResults = online && onlineResultsQuery === query.trim();

  return pickerFrame(
    `Add food to ${SLOT_LABEL[mealSlot]}`,
    <>
      <PickerHeader
        title={`Add to ${SLOT_LABEL[mealSlot]}`}
        subtitle={online ? 'Food database' : 'No connection'}
        subtitleClassName={!online ? 'text-flag' : ''}
        onBack={closeWithMotion}
      />
      <form onSubmit={(event) => void submitSearch(event)} className={`mx-4 my-3 flex h-[48px] items-center border border-rule-strong bg-paper px-3 ${!online ? 'opacity-45' : ''}`}>
        <input
          type="search"
          role="searchbox"
          value={query}
          onChange={(event) => {
            queryRef.current = event.target.value;
            setQuery(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            void runOnlineSearch();
          }}
          className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-faint"
          placeholder="Search foods, brands or barcode"
          autoComplete="off"
        />
        <button type="submit" disabled={!online || !query.trim()} className={`${LABEL} min-h-[44px] pl-3 text-ink disabled:text-ink-faint`}>
          Search
        </button>
      </form>
      {showWifiNotice && <WifiNotice quickAddAvailable={!figuresHidden} />}
      {isSearching ? (
        <>
          {localResults.length > 0 && (
            <section>
              <div className="px-4 pb-1 pt-3"><p className={LABEL}>Local results</p></div>
              <ul>{localResults.map((food) => <FoodRow key={food.id} food={food} hidden={figuresHidden} onSelect={() => pick(food)} />)}</ul>
            </section>
          )}
          {showOnlineResults && onlineResults.length > 0 && (
            <section>
              <div className="px-4 pb-1 pt-3"><p className={LABEL}>Results · Open Food Facts</p></div>
              <ul>{onlineResults.map((food, index) => <FoodRow key={`${food.barcode ?? food.name}-${index}`} food={food} hidden={figuresHidden} onSelect={() => pick(food)} />)}</ul>
            </section>
          )}
          {showOnlineResults && onlineHidden > 0 && (
            <p className="px-4 py-2 font-serif text-[10px] italic text-ink-faint">
              {figuresHidden ? (
                'Some results hidden because they did not include enough nutrition data. Not shown rather than guessed.'
              ) : (
                <>{onlineHidden} {onlineHidden === 1 ? 'result' : 'results'} hidden &mdash; missing enough nutrition data. Not shown rather than guessed.</>
              )}
            </p>
          )}
        </>
      ) : (
        <>
          {recent.length > 0 && (
            <section>
              <div className="px-4 pb-1 pt-3"><p className={LABEL}>Recent</p></div>
              <ul>{recent.map((food) => <FoodRow key={food.id} food={food} hidden={figuresHidden} onSelect={() => pick(food)} />)}</ul>
            </section>
          )}
          {common.length > 0 && (
            <section>
              <div className="px-4 pb-1 pt-3"><p className={LABEL}>Common foods</p></div>
              <ul>{common.map((food) => <FoodRow key={food.id} food={food} hidden={figuresHidden} onSelect={() => pick(food)} />)}</ul>
            </section>
          )}
        </>
      )}
      <button type="button" onClick={() => setQuickAdd(true)} className={`${LABEL} min-h-[48px] w-full border-t border-rule px-4 text-left text-ink-faint`}>
        Can&apos;t find it? Quick add &rsaquo;
      </button>
    </>,
  );
}
