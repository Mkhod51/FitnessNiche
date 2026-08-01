import { useEffect, useState, type ReactElement } from 'react';
import { Link } from 'react-router';
import { Logo } from '../../components/Logo';
import { AdviceFeed } from '../advice/AdviceFeed';
import { AskEvidence } from '../advice/AskEvidence';
import { getWeightHistory } from '../../db/weights';
import { ewma } from '../../domain/trends';

const LABEL = 'font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint';
const FIGURE = 'font-figure tabular-nums';

/** FR-SIG-4: raw daily weight is never the signal. Smoothed over a fortnight first. */
const HALF_LIFE_DAYS = 7;
const SMOOTHING_WINDOW_DAYS = 14;

/**
 * The hub.
 *
 * Evidence lives here rather than in a tab of its own — a four-tab bar would
 * spend the home position on the tab users press least, and this product's
 * whole differentiator lives in it.
 *
 * The empty state is not a placeholder to design later: it is what the app is
 * today, and what every new user sees for their first week. It says plainly
 * that nothing is earned yet rather than showing sample data, because the top
 * product risk is whether de-mythologising is a thing people sustain using,
 * and that question gets answered on this screen.
 */
export function Hub(): ReactElement {
  const [trend, setTrend] = useState<{ latest: number; perWeek: number | null } | null>(null);

  useEffect(() => {
    let off = false;
    void (async () => {
      const history = await getWeightHistory();
      if (off || history.length === 0) return;

      const smoothed = ewma(
        history.map((r) => ({ date: r.measuredAt, value: r.valueKg })),
        HALF_LIFE_DAYS,
      );
      const last = smoothed[smoothed.length - 1];

      // Only quote a rate once there is a window wide enough to carry one.
      // A "per week" figure from three days of readings is invented precision.
      const first = smoothed[0];
      const spanDays =
        (new Date(last.date).getTime() - new Date(first.date).getTime()) / 86_400_000;
      const perWeek =
        spanDays >= SMOOTHING_WINDOW_DAYS
          ? ((last.value - first.value) / spanDays) * 7
          : null;

      setTrend({ latest: last.value, perWeek });
    })();
    return () => {
      off = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-[480px] px-4 pt-4 pb-8">
      <header className="flex items-center justify-between">
        <Logo />
        <Link
          to="/settings"
          aria-label="Settings"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center border border-rule-strong font-serif text-[15px] text-ink-soft transition-colors duration-[var(--motion-tap)] ease-[var(--motion-ease)] active:bg-paper-sunk"
        >
          &#9881;
        </Link>
      </header>

      <section className="mt-5 border-t border-rule pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className={LABEL}>Bodyweight</p>
          <Link
            to="/weight"
            className={`${LABEL} min-h-[44px] leading-[44px] text-ink transition-colors duration-[var(--motion-tap)] ease-[var(--motion-ease)]`}
          >
            Log today &rsaquo;
          </Link>
        </div>

        {trend === null ? (
          <p className="font-serif text-[15px] leading-[1.45] text-ink-soft">
            Nothing logged yet. A weight trend needs a couple of weeks before it can say
            anything the daily number cannot.
          </p>
        ) : (
          <>
            <p className={`${FIGURE} text-[24px] text-ink`}>
              {trend.latest.toFixed(1)} kg
              {trend.perWeek !== null && (
                <span className="ml-2 text-[14px] text-ink-faint">
                  {trend.perWeek >= 0 ? '+' : '−'}
                  {Math.abs(trend.perWeek).toFixed(2)} / wk
                </span>
              )}
            </p>
            <p className="mt-1 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
              {trend.perWeek === null
                ? 'Smoothed. Too short a run to quote a weekly rate yet.'
                : 'Smoothed over a fortnight. The raw daily figure is never the signal.'}
            </p>
          </>
        )}
      </section>

      <section className="mt-6 border-t border-rule pt-4">
        <h1 className="font-serif text-[19px] leading-[1.3] tracking-[-0.005em] text-ink">
          The evidence base
        </h1>
        <p className="mt-1 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
          Every claim graded and cited. None of them is about you yet — that needs logged data.
        </p>
      </section>

      {/* The M1 evidence surface carries no user health data, so it needs no
          consent and renders unconditionally regardless of ConsentGate state. */}
      <AskEvidence />
      <AdviceFeed />
    </div>
  );
}
