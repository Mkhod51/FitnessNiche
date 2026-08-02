import { useEffect, useState, type ReactElement } from 'react';
import { ConsentGate } from '../onboarding/ConsentGate';
import { ClaimCard } from '../../components/ClaimCard';
import { Meter } from '../../components/Meter';
import { SEED_EXERCISES } from '../../db/seed-exercises';
import { getWeightHistory } from '../../db/weights';
import { getSetsSince } from '../../db/workouts';
import { getEntriesSince } from '../../db/nutrition';
import { getUser } from '../../db/user';
import { CLAIMS } from '../../generated/claims';
import { buildSnapshot } from '../../advice/snapshot';
import type { Reconciliation, VerdictId } from '../../domain/reconcile';
import type { Claim } from '../../advice/types';

const LABEL = 'font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint';
const FIGURE = 'font-figure tabular-nums';

/** Matches the window the session peek reconciles over. */
const RECONCILE_WINDOW_DAYS = 84;

/**
 * FR-SIG-3 / GR-4: the evidenced POPULATION range, never a personal target.
 * Same values and same reasoning as the Trends screen.
 */
const POPULATION_LOW = 10;
const POPULATION_HIGH = 20;

/**
 * The verdict headline, and the line under it.
 *
 * Every string here describes the lifter's OWN measured state. None of it is a
 * recommendation, and that is a T1/GR-6 requirement rather than a stylistic
 * choice: no render path may carry advice without a stored claim_id, so what the
 * evidence *says* arrives only through the ClaimCard below. The screen states
 * what was measured; the claim record states what it means.
 *
 * `not_landing` and `unresolved` deliberately have no claim attached. Neither is
 * a physiological finding — one is an observation about a scale, the other about
 * a sample size — so there is nothing to cite and nothing is invented to fill
 * the gap.
 */
const VERDICT_COPY: Record<VerdictId, { headline: string; detail: string; claimId: string | null }> = {
  on_track: {
    headline: 'Weight is moving, and your strength has held.',
    detail: 'That is the pattern a deficit is supposed to produce, and it is the one you are getting.',
    claimId: 'c-strength-holds-through-a-deficit',
  },
  ease_the_deficit: {
    headline: 'Your strength is falling while you cut.',
    detail:
      'The interval on your own e1RM trend excludes zero, so this is a measured decline rather than a noisy fortnight.',
    claimId: 'c-deficit-impairs-lean-mass',
  },
  not_landing: {
    headline: 'The scale has not moved.',
    detail: 'Whatever the intake target says, the smoothed trend is flat, so the deficit is not landing.',
    claimId: null,
  },
  strength_falling: {
    headline: 'Your strength is falling, and you are not in a deficit.',
    detail: 'A deficit cannot be the explanation here, so this is a training or recovery question rather than an intake one.',
    claimId: null,
  },
  holding_maintenance: {
    headline: 'You are holding maintenance.',
    detail: 'Weight steady and strength steady is exactly what maintenance is supposed to look like.',
    claimId: null,
  },
  unresolved: {
    headline: 'Not enough logged to reconcile yet.',
    detail: 'Two trends have to be readable before they can be read against each other. One of them is not.',
    claimId: null,
  },
};

/** What each unresolved signal needs before it can be read. */
const UNRESOLVED_COPY: Record<'weight' | 'strength', string> = {
  weight:
    'Bodyweight: a smoothed trend needs a fortnight of weigh-ins before it means anything. Daily readings swing more than a real change does.',
  strength:
    'Strength: the e1RM estimate is a regression across sessions, and there are not enough qualifying ones yet. Only sets at RIR 3 or below, at 10 reps or fewer, can be used.',
};

/**
 * Reconciliation confidence, counted rather than asserted — the same grammar as
 * the evidence counter, deliberately in plain ink and NOT the confidence ramp.
 * The ramp encodes how good the evidence is; this encodes how much of the
 * lifter's own data the verdict rests on. Borrowing its hues would make one
 * colour mean two different things on the same screen.
 */
function ConfidenceMarks({ confidence }: { confidence: Reconciliation['confidence'] }): ReactElement {
  const filled = confidence === 'high' ? 3 : confidence === 'moderate' ? 2 : 1;
  return (
    <div data-testid="reconcile-confidence" className="flex items-center gap-2">
      <div className="flex gap-[2.5px]" role="img" aria-label={`${confidence} confidence`}>
        {Array.from({ length: 3 }, (_, i) => (
          <span
            key={i}
            className={`h-[10px] w-[18px] ${i < filled ? 'mark-fill bg-ink' : 'bg-rule-strong'}`}
            style={i < filled ? { animationDelay: `calc(var(--motion-tap) * ${i})` } : undefined}
          />
        ))}
      </div>
      <span className={LABEL}>{confidence} confidence</span>
    </div>
  );
}

function ReviewSurface(): ReactElement {
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | {
        status: 'ready';
        reconciliation: Reconciliation;
        primaryExerciseId: string | null;
        byMuscle: Record<string, number>;
        proteinPerKg7d: number | null;
        hidden: boolean;
      }
  >({ status: 'loading' });

  useEffect(() => {
    let off = false;
    void (async () => {
      const user = await getUser();
      const windowStart = new Date(Date.now() - RECONCILE_WINDOW_DAYS * 86_400_000).toISOString();
      const built = buildSnapshot({
        goal: user.goal,
        numbersHidden: user.numbersHidden,
        goalStartedAt: user.goalStartedAt,
        weights: await getWeightHistory(),
        sets: await getSetsSince(windowStart),
        exercises: SEED_EXERCISES,
        food: (await getEntriesSince(windowStart)).map((e) => ({ loggedAt: e.loggedAt, proteinG: e.proteinG })),
      });
      if (off) return;
      setState({
        status: 'ready',
        reconciliation: built.reconciliation,
        primaryExerciseId: built.primaryExerciseId,
        byMuscle: built.snapshot.weeklySetsByMuscle,
        proteinPerKg7d: built.snapshot.proteinPerKg7d,
        hidden: user.numbersHidden,
      });
    })().catch((err) => {
      // A screen that stays blank forever is the worst failure this can have —
      // it reads as a broken app rather than as a store that could not be read.
      if (!off) setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    });
    return () => {
      off = true;
    };
  }, []);

  if (state.status === 'loading') return <div className="mx-auto max-w-[480px] px-4 pt-5" />;
  if (state.status === 'error') {
    return (
      <p data-testid="review-error" className="mx-auto max-w-[480px] px-4 pt-5 font-serif text-[15px] leading-[1.45] text-flag">
        Couldn&rsquo;t read your history: {state.message}. Nothing has been changed.
      </p>
    );
  }

  const { reconciliation: r, primaryExerciseId, byMuscle, hidden, proteinPerKg7d } = state;
  const copy = VERDICT_COPY[r.verdict];
  const claim: Claim | undefined = copy.claimId ? CLAIMS.find((c) => c.id === copy.claimId) : undefined;
  const liftName = primaryExerciseId
    ? (SEED_EXERCISES.find((e) => e.id === primaryExerciseId)?.name ?? primaryExerciseId)
    : null;

  const weekly = Object.entries(byMuscle).sort((a, b) => b[1] - a[1]);

  return (
    <div className="step-in mx-auto max-w-[480px] px-4 pt-5 pb-10">
      <p className={LABEL}>Weekly review</p>

      <h1 data-testid="verdict-headline" className="mt-2 font-serif text-[21px] leading-[1.25] tracking-[-0.005em] text-ink">
        {copy.headline}
      </h1>
      <p className="mt-2 font-serif text-[15px] leading-[1.45] text-ink-soft">{copy.detail}</p>

      <div className="mt-4">
        <ConfidenceMarks confidence={r.confidence} />
      </div>

      {/* The reconciliation itself: the two halves as ONE reading, in one
          ledger, rather than two charts left for the reader to combine. */}
      <section className="figure-settle mt-6 border-t border-rule pt-4">
        <p className={LABEL}>What was measured</p>

        <dl className="mt-2">
          <div className="flex items-baseline justify-between gap-3 border-b border-rule py-2">
            <dt className="font-serif text-[15px] text-ink">Bodyweight</dt>
            <dd data-testid="measured-weight" className={`${FIGURE} text-[15px] text-ink`}>
              {hidden ? (
                <span className="text-ink-faint">hidden</span>
              ) : r.observed.weightKgPerWeek === null ? (
                <span className="text-ink-faint">not readable yet</span>
              ) : (
                `${r.observed.weightKgPerWeek > 0 ? '+' : ''}${r.observed.weightKgPerWeek.toFixed(2)} kg/week`
              )}
            </dd>
          </div>

          <div className="flex items-baseline justify-between gap-3 border-b border-rule py-2">
            <dt className="font-serif text-[15px] text-ink">
              {liftName ? `${liftName} e1RM` : 'Strength'}
            </dt>
            <dd data-testid="measured-strength" className={`${FIGURE} text-[15px] text-ink`}>
              {r.e1rmTrend === 'insufficient_data' ? (
                <span className="text-ink-faint">not readable yet</span>
              ) : r.e1rmTrend === 'holding' ? (
                // FR-SIG-2: an interval spanning zero is reported as held, never
                // as a slope. Quoting "+0.1%/week" off it would be precision the
                // regression does not carry.
                'held'
              ) : (
                `${r.observed.e1rmPctPerWeek! > 0 ? '+' : ''}${r.observed.e1rmPctPerWeek!.toFixed(1)} %/week`
              )}
            </dd>
          </div>
        </dl>

        <p className="mt-2 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
          {r.observed.weighIns} weigh-ins and {r.observed.e1rmSessions} qualifying sessions, over{' '}
          {Math.max(1, Math.round(r.observed.windowDays / 7))} weeks.
        </p>
      </section>

      {/* The part a pair of charts cannot do. First-class, never a footnote:
          principle 7 says nuance is the default state, not a disclosure layer. */}
      {r.unresolved.length > 0 && (
        <section
          data-testid="unresolved-block"
          className="figure-settle mt-6 border-t border-rule pt-4"
          style={{ animationDelay: 'calc(var(--motion-settle) * 0.1)' }}
        >
          <p className={LABEL}>What this cannot see</p>
          <ul className="mt-2">
            {r.unresolved.map((signal) => (
              <li
                key={signal}
                data-testid="unresolved-item"
                className="border-b border-rule py-2 font-serif text-[14px] leading-[1.45] text-ink"
              >
                {UNRESOLVED_COPY[signal]}
              </li>
            ))}
          </ul>
          <p className="mt-2 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
            The verdict above is held back rather than guessed. Nothing here is a failure. It is a
            sample size.
          </p>
        </section>
      )}

      <section
        className="figure-settle mt-6 border-t border-rule pt-4"
        style={{ animationDelay: 'calc(var(--motion-settle) * 0.2)' }}
      >
        <p className={LABEL}>Sets per muscle, last 7 days</p>
        {weekly.length === 0 ? (
          <p className="mt-2 font-serif text-[14px] leading-[1.45] text-ink-soft">
            Nothing logged in the last week.
          </p>
        ) : (
          <ul className="mt-2">
            {weekly.map(([muscle, sets]) => (
              <li key={muscle} data-testid="volume-row" className="border-b border-rule py-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-serif text-[14px] text-ink">{muscle.replace(/_/g, ' ')}</span>
                  <span className={`${FIGURE} text-[14px] text-ink`}>{Math.round(sets * 10) / 10}</span>
                </div>
                {/* Counted against the studied range, never a personal target.
                    The meter runs to POPULATION_HIGH so the range itself is the
                    scale; marks past it go faint rather than red, because
                    exceeding a population range is not an error (GR-4). */}
                <Meter
                  filled={Math.round(sets)}
                  total={POPULATION_HIGH}
                  overFrom={POPULATION_HIGH}
                />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
          Roughly {POPULATION_LOW}&ndash;{POPULATION_HIGH} sets per muscle per week is the range studied
          groups landed in. It is a population range, not a target for you, and this app does not compute
          a personal one.
        </p>
      </section>

      <section
        className="figure-settle mt-6 border-t border-rule pt-4"
        style={{ animationDelay: 'calc(var(--motion-settle) * 0.3)' }}
      >
        <p className={LABEL}>Protein on training days</p>
        {hidden ? (
          <p className="mt-1 font-serif text-[15px] leading-[1.45] text-ink">
            Logged. Figures are hidden, and your training log is unaffected.
          </p>
        ) : proteinPerKg7d === null ? (
          <p className="mt-1 font-serif text-[14px] leading-[1.45] text-ink-soft">
            Nothing to measure yet. This needs food logged on a day you trained.
          </p>
        ) : (
          <>
            <p data-testid="protein-per-kg" className={`${FIGURE} mt-1 text-[24px] text-ink`}>
              {proteinPerKg7d.toFixed(1)}
              <span className="ml-1 text-[15px] text-ink-faint">g/kg</span>
            </p>
            <p className="mt-1 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
              Averaged across the training days you logged food on, against your latest bodyweight.
              Rest days are a different question and are left out of it.
            </p>
          </>
        )}
      </section>

      {claim && (
        <section
          className="figure-settle mt-6 border-t border-rule pt-4"
          style={{ animationDelay: 'calc(var(--motion-settle) * 0.4)' }}
        >
          <p className={LABEL}>What the evidence says</p>
          <div className="mt-2 border border-rule">
            <ClaimCard claim={claim} />
          </div>
        </section>
      )}
    </div>
  );
}

/** GR-5: renders health data, so it is unreachable without consent. */
export function Review(): ReactElement {
  return (
    <ConsentGate>
      <ReviewSurface />
    </ConsentGate>
  );
}
