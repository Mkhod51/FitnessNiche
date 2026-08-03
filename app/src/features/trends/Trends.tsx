import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { ConsentGate } from '../onboarding/ConsentGate';
import { TrendChart } from '../../components/TrendChart';
import { getWeightHistory, type WeightReading } from '../../db/weights';
import { getSetsSince, type LoggedSet } from '../../db/workouts';
import { SEED_EXERCISES } from '../../db/seed-exercises';
import { getUser } from '../../db/user';
import { ewma } from '../../domain/trends';
import { weeklySetsByMuscle } from '../../domain/volume';
import { setE1rm, e1rmTrend } from '../../domain/e1rm';

const LABEL = 'font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint';
const FIGURE = 'font-figure tabular-nums';

/** FR-SIG-4: raw daily weight is never the signal. */
const HALF_LIFE_DAYS = 7;

/**
 * FR-SIG-3 / GR-4. Roughly 10-20 sets per muscle per week is the evidenced
 * POPULATION range — well supported only in its direction, with the exact
 * cutpoints resting on much weaker evidence than the shape of the curve does.
 * It is shown as a range across studied groups and labelled as such: never a
 * personal target, and this app does not compute an individual MEV or MRV,
 * because the research says those are not identifiable from a training log.
 *
 * (Grades are written out rather than bracketed. The provenance guard forbids a
 * raw grade letter in brackets appearing as text under src/, and it is right to.)
 */
const POPULATION_LOW = 10;
const POPULATION_HIGH = 20;

function TrendsSurface(): ReactElement {
  const [readings, setReadings] = useState<WeightReading[]>([]);
  const [sets, setSets] = useState<LoggedSet[]>([]);
  const [hidden, setHidden] = useState(false);
  const weekStart = useMemo(() => new Date(Date.now() - 7 * 86_400_000).toISOString(), []);

  useEffect(() => {
    let off = false;
    void (async () => {
      const [u, w, s] = await Promise.all([getUser(), getWeightHistory(), getSetsSince(weekStart)]);
      if (off) return;
      setHidden(u.numbersHidden);
      setReadings(w);
      setSets(s);
    })();
    return () => {
      off = true;
    };
  }, [weekStart]);

  const smoothed = useMemo(
    () =>
      readings.length === 0
        ? []
        : ewma(
            readings.map((r) => ({ date: r.measuredAt, value: r.valueKg })),
            HALF_LIFE_DAYS,
          ),
    [readings],
  );

  /**
   * AC-2. Only qualifying sets reach the regression: setE1rm returns null past
   * 10 reps or RIR 3, and a set with no RIR cannot be used at all — so a session
   * logged without RIR contributes nothing here. That is the honest behaviour,
   * not a bug, and the empty state says so rather than drawing a line anyway.
   */
  const strength = useMemo(() => {
    const qualifying = sets
      .filter((s) => s.setType === 'working' && s.rir !== null)
      .map((s) => ({ date: s.performedAt, e1rm: setE1rm(s.weightKg, s.reps, s.rir as number) }))
      .filter((p): p is { date: string; e1rm: number } => p.e1rm !== null)
      .sort((a, b) => a.date.localeCompare(b.date));

    return { qualifying, trend: e1rmTrend(qualifying) };
  }, [sets]);

  const byMuscle = useMemo(
    () => weeklySetsByMuscle(sets, SEED_EXERCISES, weekStart),
    [sets, weekStart],
  );

  const muscles = useMemo(
    () => Object.entries(byMuscle).sort((a, b) => b[1] - a[1]),
    [byMuscle],
  );

  return (
    <div className="mx-auto max-w-[480px] px-4 pt-5 pb-10">
      <h1 className="font-serif text-[20px] leading-[1.2] text-ink">Trends</h1>

      <section data-testid="bodyweight-trend" className="mt-5 border-t border-rule pt-4">
        <p className={LABEL}>Bodyweight · smoothed</p>
        {hidden ? (
          <p className="mt-1 font-serif text-[15px] leading-[1.45] text-ink-soft">
            Figures are hidden. Your training below is unaffected.
          </p>
        ) : (
          <>
            <TrendChart points={smoothed} withinNoise={false} unit="kg" />
            {smoothed.length > 0 && (
              <p className="mt-1 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
                Smoothed over a fortnight. The raw daily figure is never the signal — it moves
                with water and food long before it moves with fat.
              </p>
            )}
          </>
        )}
      </section>

      <section data-testid="strength-trend" className="mt-6 border-t border-rule pt-4">
        <p className={LABEL}>Estimated 1RM</p>
        {strength.trend === 'insufficient_data' ? (
          <p data-testid="strength-insufficient" className="mt-1 font-serif text-[15px] leading-[1.45] text-ink-soft">
            {strength.qualifying.length === 0
              ? 'No sets yet that can be used to estimate a 1RM. Only working sets at RIR 3 or closer, and 10 reps or fewer, qualify — and a set logged without an RIR cannot be used at all.'
              : `${strength.qualifying.length} qualifying set${strength.qualifying.length === 1 ? '' : 's'} so far. A trend needs at least eight before it can say anything a single reading could not.`}
          </p>
        ) : (
          <>
            {/* FR-SIG-2: when the interval spans zero, this renders copy rather
                than a confident slope. That is the requirement most easily lost,
                and losing it would be the app inventing progress. */}
            <TrendChart
              points={strength.qualifying.map((p) => ({ date: p.date, value: p.e1rm }))}
              band={strength.trend.band}
              withinNoise={strength.trend.withinNoise}
              unit="kg"
            />
            {!strength.trend.withinNoise && (
              <p data-testid="strength-slope" className={`${FIGURE} mt-1 text-[15px] text-ink`}>
                {strength.trend.slopePctPerWeek >= 0 ? '+' : '−'}
                {Math.abs(strength.trend.slopePctPerWeek).toFixed(2)}% / week
              </p>
            )}
          </>
        )}
      </section>

      <section className="mt-6 border-t border-rule pt-4">
        <p className={LABEL}>Weekly sets per muscle</p>

        {muscles.length === 0 ? (
          <p data-testid="volume-empty" className="mt-1 font-serif text-[15px] leading-[1.45] text-ink-soft">
            Nothing logged in the last seven days, so there is nothing to count. This fills in as
            you train — it is not an estimate waiting on more data.
          </p>
        ) : (
          <>
            <ul className="mt-2">
              {muscles.map(([muscle, count]) => (
                <li
                  key={muscle}
                  data-testid={`volume-row-${muscle}`}
                  className="flex items-baseline justify-between gap-3 border-b border-rule py-2"
                >
                  <span className="font-serif text-[15px] text-ink">{muscle.replace(/_/g, ' ')}</span>
                  <span className="flex items-baseline gap-3">
                    <span className={`${FIGURE} text-[15px] text-ink`}>
                      {Math.round(count * 10) / 10}
                    </span>
                    <span className={`${LABEL} whitespace-nowrap`}>
                      population {POPULATION_LOW}–{POPULATION_HIGH}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            {/* GR-4 in the copy, not just the absence of a number: the range is
                across studied groups, and this app will not compute a personal
                MEV or MRV because the research says they are not identifiable
                from a training log. */}
            <p className="mt-2 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
              10–20 sets a week is the range across studied groups, not a target set for you.
              Warm-ups are not counted. Where your own best number sits inside that range is not
              something a training log can tell you, so this app does not guess it.
            </p>
          </>
        )}
      </section>
    </div>
  );
}

/** GR-5: renders user health data, so it is unreachable without consent. */
export function Trends(): ReactElement {
  return (
    <ConsentGate>
      <TrendsSurface />
    </ConsentGate>
  );
}
