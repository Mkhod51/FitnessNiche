import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { getUser } from '../../db/user';
import { logFood, type MealSlot } from '../../db/nutrition';
import { isPlausibleBarcode } from '../../food/barcode';
import { useOnline } from '../../food/connectivity';
import { getCommonFoods, getRecentFoods, saveFoodItem, searchFoodLocal } from '../../food/local';
import { macrosForQuantity } from '../../food/macros';
import { lookupBarcode, searchFoodOnline } from '../../food/off';
import { prefersReducedMotion } from '../../motion';
import type { FoodItem, FoodItemDraft } from '../../food/types';
import { BarcodeScanner } from './BarcodeScanner';

type FoodPickerProps = {
  mealSlot: MealSlot;
  day: Date;
  onLogged: () => void | Promise<void>;
  onClose: () => void;
};

type PickedFood = FoodItem | FoodItemDraft;
type SearchPhase = 'idle' | 'searching' | 'done';

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

function formatKcal(value: number): string {
  return String(Math.round(value));
}

function formatMacro(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
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
              {formatKcal(food.kcalPer100g)} kcal · {formatMacro(food.proteinGPer100g)} P /100g ·{' '}
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

function SearchProgress(): ReactElement {
  return (
    <div
      data-testid="food-searching"
      role="status"
      aria-live="polite"
      className="mx-4 mb-1 mt-1 flex min-h-[34px] items-center justify-between border-y border-rule bg-paper-sunk px-3"
    >
      <span className={`${LABEL} text-ink-soft`}>Searching database</span>
      <span aria-hidden="true" className="flex items-end gap-1">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className="food-search-mark h-3 w-[3px] bg-ink"
            style={{ animationDelay: `${index * 90}ms` }}
          />
        ))}
      </span>
    </div>
  );
}

function NoResults({ online }: { online: boolean }): ReactElement {
  return (
    <div data-testid="food-no-results" className="mx-4 mb-2 mt-2 bg-paper-sunk px-3.5 py-3">
      <p className="font-serif text-[13.5px] leading-[1.45] text-ink-soft">
        {online
          ? 'No matching foods found. Try a simpler name, scan a barcode, or quick add it.'
          : 'No matching local foods found. Recent and common foods are still here when the search is cleared.'}
      </p>
    </div>
  );
}

function SearchFailed(): ReactElement {
  return (
    <div data-testid="food-search-failed" className="mx-4 mb-2 mt-2 bg-paper-sunk px-3.5 py-3">
      <p className="font-serif text-[13.5px] leading-[1.45] text-ink-soft">
        Food database did not respond. Search again, try a simpler name, or quick add it.
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
  const [scanning, setScanning] = useState(false);
  const [searchPhase, setSearchPhase] = useState<SearchPhase>('idle');
  const [searchNonce, setSearchNonce] = useState(0);
  const [completedSearchQuery, setCompletedSearchQuery] = useState('');
  const [localResults, setLocalResults] = useState<FoodItem[]>([]);
  const [localResultsQuery, setLocalResultsQuery] = useState('');
  const [onlineResults, setOnlineResults] = useState<FoodItemDraft[]>([]);
  const [onlineResultsQuery, setOnlineResultsQuery] = useState('');
  const [onlineHidden, setOnlineHidden] = useState(0);
  const [searchFailed, setSearchFailed] = useState(false);
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
  const searchInputRef = useRef<HTMLInputElement | null>(null);

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
  }, [online]);

  useEffect(() => {
    let cancelled = false;
    const term = query.trim();
    queryRef.current = query;
    const request = ++searchRequestRef.current;
    setLocalResultsQuery('');
    setOnlineResults([]);
    setOnlineResultsQuery('');
    setOnlineHidden(0);
    setSearchFailed(false);
    setCompletedSearchQuery('');
    if (!term) {
      setLocalResults([]);
      setSearchPhase('idle');
      return () => {
        cancelled = true;
      };
    }

    setSearchPhase('searching');
    let localDone = false;
    let onlineDone = !online;
    const finishIfCurrent = () => {
      if (cancelled || request !== searchRequestRef.current || queryRef.current.trim() !== term) return;
      if (!localDone || !onlineDone) return;
      setCompletedSearchQuery(term);
      setSearchPhase('done');
    };

    void searchFoodLocal(term).then((foods) => {
      if (!cancelled && request === searchRequestRef.current && queryRef.current.trim() === term) {
        setLocalResults(foods);
        setLocalResultsQuery(term);
      }
    }).catch(() => {
      if (!cancelled && request === searchRequestRef.current && queryRef.current.trim() === term) {
        setLocalResults([]);
        setLocalResultsQuery(term);
      }
    }).finally(() => {
      localDone = true;
      finishIfCurrent();
    });

    if (online) {
      void (async () => {
        try {
          const result = isPlausibleBarcode(term)
            ? await lookupBarcode(term).then((draft) => ({ drafts: draft ? [draft] : [], hidden: 0 }))
            : await searchFoodOnline(term);
          if (cancelled || request !== searchRequestRef.current || queryRef.current.trim() !== term || !onlineRef.current) return;
          setOnlineResults(result.drafts);
          setOnlineResultsQuery(term);
          setOnlineHidden(result.hidden);
          setSearchFailed(false);
        } catch {
          if (cancelled || request !== searchRequestRef.current || queryRef.current.trim() !== term || !onlineRef.current) return;
          setOnlineResults([]);
          setOnlineResultsQuery('');
          setOnlineHidden(0);
          setSearchFailed(true);
        } finally {
          onlineDone = true;
          finishIfCurrent();
        }
      })();
    }

    return () => {
      cancelled = true;
    };
  }, [query, online, searchNonce]);

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

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (queryRef.current.trim()) setSearchNonce((value) => value + 1);
  }

  function clearSearch() {
    queryRef.current = '';
    setQuery('');
    setSearchNonce((value) => value + 1);
    searchInputRef.current?.focus();
  }

  // A scanned code takes the same path as a typed barcode: drop it into the
  // search field, so scan and manual entry share one OFF resolution route and
  // one result UI through the automatic query effect.
  function handleBarcode(code: string) {
    queryRef.current = code;
    setQuery(code);
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
            {formatKcal(selected.kcalPer100g)} kcal · {formatMacro(selected.proteinGPer100g)} g protein ·{' '}
            {formatMacro(selected.carbsGPer100g)} g carbs · {formatMacro(selected.fatGPer100g)} g fat - per 100 g
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
              {formatKcal(macros.kcal)} <span className={`${LABEL} align-middle`}>kcal</span>
            </p>
            <p className={`${FIGURE} mt-2 text-[13px] text-ink-soft`}>
              {formatMacro(macros.proteinG)} g protein · {formatMacro(macros.carbsG)} g carbs · {formatMacro(macros.fatG)} g fat
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
  const showWifiNotice = !online;
  const currentLocalResults = localResultsQuery === query.trim() ? localResults : [];
  const showOnlineResults = online && onlineResultsQuery === query.trim();
  const searchComplete = searchPhase === 'done' && completedSearchQuery === query.trim();
  const showSearchFailure = online && searchComplete && searchFailed;
  const showNoResults =
    searchComplete &&
    currentLocalResults.length === 0 &&
    onlineResults.length === 0 &&
    onlineHidden === 0 &&
    !searchFailed;

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
        <button
          type="button"
          onClick={() => setScanning(true)}
          disabled={!online}
          aria-label="Scan barcode"
          className="flex min-h-[44px] items-center pr-3 text-ink disabled:text-ink-faint"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M3 8a2 2 0 0 1 2-2h2.3l1.3-1.7a1 1 0 0 1 .8-.4h5.2a1 1 0 0 1 .8.4L17.4 6H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
            <circle cx="12" cy="12.5" r="3.2" />
          </svg>
        </button>
        <input
          ref={searchInputRef}
          type="search"
          role="searchbox"
          value={query}
          onChange={(event) => {
            queryRef.current = event.target.value;
            setQuery(event.target.value);
          }}
          className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-faint"
          placeholder="Search foods, brands or barcode"
          autoComplete="off"
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-ink-faint transition-colors duration-[var(--motion-tap)] ease-[var(--motion-ease)] active:bg-paper-sunk"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
        <button type="submit" disabled={!online || !query.trim() || searchPhase === 'searching'} className={`${LABEL} min-h-[44px] pl-3 text-ink disabled:text-ink-faint`}>
          {searchPhase === 'searching' ? 'Searching' : 'Search'}
        </button>
      </form>
      {showWifiNotice && <WifiNotice quickAddAvailable={!figuresHidden} />}
      {isSearching ? (
        <>
          {searchPhase === 'searching' && <SearchProgress />}
          {currentLocalResults.length > 0 && (
            <section>
              <div className="px-4 pb-1 pt-3"><p className={LABEL}>Local results</p></div>
              <ul>{currentLocalResults.map((food) => <FoodRow key={food.id} food={food} hidden={figuresHidden} onSelect={() => pick(food)} />)}</ul>
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
          {showSearchFailure && <SearchFailed />}
          {showNoResults && <NoResults online={online} />}
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
      {scanning && <BarcodeScanner onDetected={handleBarcode} onClose={() => setScanning(false)} />}
    </>,
  );
}
