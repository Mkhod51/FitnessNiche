import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { Link } from 'react-router';
import { ConsentGate } from '../onboarding/ConsentGate';
import { getUser, type User } from '../../db/user';
import {
  logFood,
  getEntriesForDay,
  getEntriesSince,
  deleteFoodEntry,
  totalsOf,
  averageKcalPerLoggedDay,
  localDayBounds,
  MEAL_SLOTS,
  type FoodEntry,
  type MealSlot,
} from '../../db/nutrition';

const LABEL = 'font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint';
const FIGURE = 'font-figure tabular-nums';
const TAP = 'transition-colors duration-[var(--motion-tap)] ease-[var(--motion-ease)]';
const FIELD =
  'h-[44px] w-full border border-rule bg-paper px-2 text-right text-[16px] text-ink outline-none focus:border-ink';

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

/** Each mark is 100 kcal / 10 g — Isotype's rule: repeat a mark, never scale one. */
const KCAL_PER_MARK = 100;
const PROTEIN_PER_MARK = 10;

function Meter({ filled, total, tone }: { filled: number; total: number; tone: 'ink' | 'conf' }): ReactElement {
  const marks = Math.max(total, filled);
  return (
    <div className="mt-2 flex gap-[2.5px]" aria-hidden="true">
      {Array.from({ length: marks }, (_, i) => (
        <span
          key={i}
          className={`h-[16px] min-w-0 flex-1 ${
            i < filled ? (tone === 'conf' ? 'bg-conf-b' : 'bg-ink') : 'bg-rule-strong'
          }`}
        />
      ))}
    </div>
  );
}

function DayView(): ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [day, setDay] = useState(() => new Date());
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [weekAvg, setWeekAvg] = useState<{ kcal: number; days: number } | null>(null);
  const [adding, setAdding] = useState<MealSlot | null>(null);
  const [draft, setDraft] = useState({ name: '', kcal: '', protein: '', grams: '' });
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async (d: Date) => {
    setEntries(await getEntriesForDay(d));
    const weekAgo = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 6);
    setWeekAvg(averageKcalPerLoggedDay(await getEntriesSince(localDayBounds(weekAgo).start)));
  }, []);

  useEffect(() => {
    let off = false;
    void (async () => {
      const u = await getUser();
      if (off) return;
      setUser(u);
      await reload(day);
    })();
    return () => {
      off = true;
    };
  }, [day, reload]);

  const totals = useMemo(() => totalsOf(entries), [entries]);
  const hidden = user?.numbersHidden ?? false;
  const kcalTarget = user?.calorieTargetKcal ?? null;
  const proteinTarget = user?.proteinTargetG ?? null;

  const isToday = useMemo(() => {
    const now = new Date();
    return (
      day.getFullYear() === now.getFullYear() &&
      day.getMonth() === now.getMonth() &&
      day.getDate() === now.getDate()
    );
  }, [day]);

  function shiftDay(by: number) {
    setDay((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + by));
  }

  async function submitQuickAdd(slot: MealSlot) {
    if (busy) return;
    const kcal = Number(draft.kcal);
    const protein = Number(draft.protein);
    // Unlike a set, an entry with no energy is not a record of anything — there
    // is no equivalent of a bodyweight set here, so this gate costs nothing.
    if (!draft.name.trim() || !Number.isFinite(kcal) || kcal <= 0) return;

    setBusy(true);
    try {
      await logFood(
        {
          name: draft.name.trim(),
          mealSlot: slot,
          kcal,
          proteinG: Number.isFinite(protein) ? protein : 0,
          quantityGrams: draft.grams ? Number(draft.grams) : null,
          quantityLabel: draft.grams ? `${draft.grams} g` : null,
        },
        isToday ? new Date() : new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12),
      );
      setDraft({ name: '', kcal: '', protein: '', grams: '' });
      setAdding(null);
      await reload(day);
    } finally {
      setBusy(false);
    }
  }

  async function removeEntry(id: string) {
    await deleteFoodEntry(id);
    await reload(day);
  }

  return (
    <div className="mx-auto max-w-[480px] pb-10">
      <header className="flex items-center justify-between border-b border-rule px-4 py-3">
        <button type="button" aria-label="Previous day" onClick={() => shiftDay(-1)} className={`${LABEL} min-h-[44px] min-w-[44px] text-ink ${TAP}`}>
          &lsaquo;
        </button>
        <p className="font-serif text-[15.5px] text-ink">
          {isToday ? 'Today' : day.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <button type="button" aria-label="Next day" onClick={() => shiftDay(1)} className={`${LABEL} min-h-[44px] min-w-[44px] text-ink ${TAP}`}>
          &rsaquo;
        </button>
      </header>

      {/* GR-1: numbers-hidden is a state the whole surface has a rendering for,
          not a settings flag that blanks one widget. Performance framing stays;
          anything that reads as compliance against a restriction target goes. */}
      {hidden ? (
        <section data-testid="numbers-hidden-summary" className="border-b border-rule px-4 py-4">
          <p className={LABEL}>Protein, across the week</p>
          <p className="mt-1 font-serif text-[16px] leading-[1.45] text-ink">
            {entries.length === 0
              ? 'Nothing logged today yet.'
              : 'Logged. Figures are hidden, and your training log is unaffected.'}
          </p>
          <p className="mt-2 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
            Performance framing only — no figures, no target, nothing to fall short of.
          </p>
        </section>
      ) : (
        <section className="border-b border-rule px-4 py-4">
          <div className="flex items-baseline justify-between">
            <p className={LABEL}>Energy eaten today</p>
            {kcalTarget !== null && <p className={LABEL}>Target {kcalTarget.toLocaleString()}</p>}
          </div>
          <p data-testid="kcal-total" className={`${FIGURE} mt-1 text-[32px] leading-none tracking-[-0.015em] text-ink`}>
            {Math.round(totals.kcal).toLocaleString()}
            <span className="ml-1 text-[15px] text-ink-faint">kcal</span>
          </p>
          {kcalTarget !== null && (
            <Meter
              filled={Math.round(totals.kcal / KCAL_PER_MARK)}
              total={Math.round(kcalTarget / KCAL_PER_MARK)}
              tone="ink"
            />
          )}
          <p className="mt-2 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
            {kcalTarget === null
              ? 'No target set. Nothing here is compared against anything yet.'
              : `Each mark is ${KCAL_PER_MARK} kcal. The bar fills toward the target; it does not count down from it.`}
          </p>
          <Link
            to="/goal"
            data-testid="goal-link"
            className={`${LABEL} mt-2 inline-flex min-h-[44px] items-center text-ink ${TAP}`}
          >
            {kcalTarget === null ? 'Set a goal ›' : 'Change your goal ›'}
          </Link>

          <div className="mt-4 flex items-baseline justify-between">
            <p className={LABEL}>
              Protein
              {proteinTarget !== null && totals.proteinG < proteinTarget
                ? ` · ${Math.round(proteinTarget - totals.proteinG)} g to go`
                : ''}
            </p>
          </div>
          <p data-testid="protein-total" className={`${FIGURE} mt-1 text-[24px] text-ink`}>
            {Math.round(totals.proteinG)}
            {proteinTarget !== null && <span className="text-[15px] text-ink-faint"> / {proteinTarget} g</span>}
            {proteinTarget === null && <span className="text-[15px] text-ink-faint"> g</span>}
          </p>
          {proteinTarget !== null && (
            <Meter
              filled={Math.round(totals.proteinG / PROTEIN_PER_MARK)}
              total={Math.round(proteinTarget / PROTEIN_PER_MARK)}
              tone="conf"
            />
          )}

          <div className="mt-4 flex gap-6">
            <div>
              <p className={LABEL}>Carbs</p>
              <p className={`${FIGURE} text-[16px] text-ink`}>{Math.round(totals.carbsG)} g</p>
            </div>
            <div>
              <p className={LABEL}>Fat</p>
              <p className={`${FIGURE} text-[16px] text-ink`}>{Math.round(totals.fatG)} g</p>
            </div>
          </div>
        </section>
      )}

      {!hidden && weekAvg !== null && (
        <section className="border-b border-rule px-4 py-4">
          <p className={LABEL}>Energy · average of the days you logged</p>
          <p data-testid="week-average" className={`${FIGURE} mt-1 text-[19px] text-ink`}>
            {weekAvg.kcal.toLocaleString()} <span className="text-[14px] text-ink-faint">kcal / day</span>
          </p>
          <p className="mt-1 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
            Over {weekAvg.days} logged {weekAvg.days === 1 ? 'day' : 'days'} in the last seven. The week is
            the number that means something — a single logged day carries far more error than the
            difference you are looking for.
          </p>
        </section>
      )}

      {MEAL_SLOTS.map((slot) => {
        const rows = entries.filter((e) => e.mealSlot === slot);
        const slotKcal = rows.reduce((a, e) => a + e.kcal, 0);
        return (
          <section key={slot} data-testid={`meal-${slot}`} className="border-b border-rule px-4 py-3">
            <div className="flex items-baseline justify-between">
              <p className={LABEL}>{SLOT_LABEL[slot]}</p>
              {rows.length > 0 && !hidden && (
                <p className={`${LABEL} ${FIGURE}`}>{Math.round(slotKcal)}</p>
              )}
            </div>

            {rows.length === 0 && <p className={`${LABEL} mt-1`}>Nothing logged</p>}

            <ul>
              {rows.map((e) => (
                <li key={e.id} className="row-open flex items-baseline justify-between gap-3 py-1.5">
                  <span className="min-w-0">
                    <span className="font-serif text-[15px] text-ink">{e.name}</span>
                    {e.quantityLabel && (
                      <span className="font-serif text-[12px] italic text-ink-faint"> · {e.quantityLabel}</span>
                    )}
                  </span>
                  <span className="flex flex-none items-baseline gap-3">
                    {!hidden && <span className={`${FIGURE} text-[14px] text-ink-soft`}>{Math.round(e.kcal)}</span>}
                    <button
                      type="button"
                      aria-label={`Remove ${e.name}`}
                      onClick={() => void removeEntry(e.id)}
                      className={`${LABEL} min-h-[44px] min-w-[44px] text-ink-faint ${TAP}`}
                    >
                      &times;
                    </button>
                  </span>
                </li>
              ))}
            </ul>

            {adding === slot ? (
              <div className="mt-2 border-t border-rule pt-3">
                <input
                  data-testid="food-name-input"
                  className="h-[44px] w-full border border-rule bg-paper px-2 font-serif text-[16px] text-ink outline-none focus:border-ink"
                  placeholder="What did you eat?"
                  autoComplete="off"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <label>
                    <span className={LABEL}>kcal</span>
                    <input
                      data-testid="food-kcal-input"
                      className={`${FIGURE} ${FIELD}`}
                      inputMode="numeric"
                      autoComplete="off"
                      value={draft.kcal}
                      onChange={(e) => setDraft({ ...draft, kcal: e.target.value.replace(/[^0-9]/g, '') })}
                    />
                  </label>
                  <label>
                    <span className={LABEL}>Protein g</span>
                    <input
                      data-testid="food-protein-input"
                      className={`${FIGURE} ${FIELD}`}
                      inputMode="numeric"
                      autoComplete="off"
                      value={draft.protein}
                      onChange={(e) => setDraft({ ...draft, protein: e.target.value.replace(/[^0-9]/g, '') })}
                    />
                  </label>
                  <label>
                    <span className={LABEL}>Grams</span>
                    <input
                      data-testid="food-grams-input"
                      className={`${FIGURE} ${FIELD}`}
                      inputMode="numeric"
                      autoComplete="off"
                      value={draft.grams}
                      onChange={(e) => setDraft({ ...draft, grams: e.target.value.replace(/[^0-9]/g, '') })}
                    />
                  </label>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    data-testid="food-save-button"
                    onClick={() => void submitQuickAdd(slot)}
                    className={`min-h-[44px] flex-1 bg-ink font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-paper ${TAP} active:opacity-80`}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdding(null)}
                    className={`${LABEL} min-h-[44px] px-3 text-ink ${TAP}`}
                  >
                    Cancel
                  </button>
                </div>
                <p className="mt-2 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
                  No food database yet, so this is a quick-add. Approximate is the point — logging
                  something sustainably beats logging nothing precisely.
                </p>
              </div>
            ) : (
              <button
                type="button"
                data-testid={`add-food-${slot}`}
                onClick={() => setAdding(slot)}
                className={`${LABEL} mt-2 min-h-[44px] text-ink ${TAP}`}
              >
                + Add food
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}

/** GR-5: renders user health data, so it is unreachable without consent. */
export function EatDay(): ReactElement {
  return (
    <ConsentGate>
      <DayView />
    </ConsentGate>
  );
}
