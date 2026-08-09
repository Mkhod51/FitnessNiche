import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router';
import { ConsentGate } from '../onboarding/ConsentGate';
import { ClaimCard } from '../../components/ClaimCard';
import { CLAIMS } from '../../generated/claims';
import { getUser, updateProfile, setCalorieTarget, type User } from '../../db/user';
import { getWeightHistory } from '../../db/weights';
import {
  estimateMaintenance,
  proteinTargetG,
  ageFromBirthYear,
  type ActivityLevel,
  type Sex,
} from '../../domain/energy';
import { targetForDeficit, maxAllowedDeficit, MAX_DAILY_DEFICIT_KCAL } from '../../domain/guards';
import type { TrainingExperience } from '../../advice/types';
import type { AdviceItem, Claim } from '../../advice/types';
import { selectSurfaceAdvice } from '../../advice/surface-advice';
import {
  recordAdviceShown,
  recentlyShownClaimIds,
  suppressedClaimIds,
} from '../../db/advice-events';

const LABEL = 'font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint';
const FIGURE = 'font-figure tabular-nums';
const TAP = 'transition-colors duration-[var(--motion-tap)] ease-[var(--motion-ease)]';
const FIELD =
  'h-[44px] w-full border border-rule bg-paper px-2 text-right text-[16px] text-ink outline-none focus:border-ink';

/**
 * The claim that GR-1's deficit cap is built on. The cap does not have to be
 * asserted — there is a curated, graded claim saying exactly this, so it renders
 * through the same ClaimCard machinery as any other advice, at its own grade and
 * with its own uncertainty. The safety guard and the differentiator turn out to
 * be one mechanism.
 */
const DEFICIT_CAP_CLAIM_ID = 'c-deficit-beyond-500-blocks-lean-mass';

const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  desk: 'Desk',
  light: 'Light',
  active: 'Active',
  heavy: 'Heavy',
};

type Goal = 'cut' | 'maintain' | 'bulk';
type ExperienceSelection = TrainingExperience | 'skip';
type DraftAdvice = { claim: Claim; item: AdviceItem; goal: Goal };

function Segmented<T extends string>({
  value,
  options,
  onChange,
  testId,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  testId: string;
}): ReactElement {
  return (
    <div className="mt-1 flex border border-rule-strong" role="group" data-testid={testId}>
      {options.map((o, i) => (
        <button
          key={o.id}
          type="button"
          data-testid={`${testId}-${o.id}`}
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`min-h-[44px] flex-1 px-2 font-sans text-[11px] font-semibold uppercase tracking-[0.06em] ${TAP} ${
            i > 0 ? 'border-l border-rule-strong' : ''
          } ${value === o.id ? 'bg-ink text-paper' : 'bg-paper text-ink-faint'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function GoalForm(): ReactElement {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [sex, setSex] = useState<Sex>('unspecified');
  const [heightCm, setHeightCm] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activity, setActivity] = useState<ActivityLevel>('light');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [trainingExperience, setTrainingExperience] = useState<TrainingExperience | null>(null);
  const [deficit, setDeficit] = useState(0);
  const [saved, setSaved] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [draftAdvice, setDraftAdvice] = useState<DraftAdvice | null>(null);
  const draftAdviceRef = useRef<DraftAdvice | null>(null);
  const selectionVersion = useRef(0);
  const shownClaimIds = useRef(new Set<string>());
  const recordedClaimIds = useRef(new Set<string>());

  useEffect(() => {
    let off = false;
    void (async () => {
      const u = await getUser();
      const history = await getWeightHistory();
      if (off) return;
      setUser(u);
      setSex(u.sex);
      setGoal(u.goal);
      setTrainingExperience(u.trainingExperience);
      setDeficit(u.deficitKcal);
      if (u.heightCm) setHeightCm(String(u.heightCm));
      if (u.birthYear) setBirthYear(String(u.birthYear));
      // The weight the estimate uses comes from the log rather than being asked
      // for twice — it is already the most recent thing the user told us.
      if (history.length > 0) setWeightKg(String(history[history.length - 1].valueKg));
      setProfileLoaded(true);
    })();
    return () => {
      off = true;
    };
  }, []);

  const age = useMemo(() => ageFromBirthYear(Number(birthYear)), [birthYear]);

  const estimate = useMemo(
    () =>
      age === null
        ? null
        : estimateMaintenance({
            sex,
            heightCm: Number(heightCm),
            weightKg: Number(weightKg),
            ageYears: age,
            activity,
          }),
    [sex, heightCm, weightKg, age, activity],
  );

  const profile = useMemo(
    () => (estimate ? { sex, maintenanceKcal: estimate.maintenanceKcal } : null),
    [sex, estimate],
  );

  // The slider STOPS at what is actually allowed for this person, rather than
  // letting them drag to 500 and silently clamping back. A limit you can cross
  // and have quietly undone is a warning, not a guard.
  const allowedDeficit = profile ? maxAllowedDeficit(profile) : 0;
  const clamped = profile ? targetForDeficit(profile, goal === 'cut' ? deficit : 0) : null;

  const capClaim = CLAIMS.find((c) => c.id === DEFICIT_CAP_CLAIM_ID);

  useEffect(() => {
    const version = ++selectionVersion.current;
    if (!profileLoaded) {
      draftAdviceRef.current = null;
      setDraftAdvice(null);
      return;
    }

    let cancelled = false;
    const currentClaimId =
      draftAdviceRef.current?.goal === goal ? draftAdviceRef.current.claim.id : null;
    if (currentClaimId === null) {
      draftAdviceRef.current = null;
      setDraftAdvice(null);
    }
    void (async () => {
      const [suppressed, recent] = await Promise.all([
        suppressedClaimIds(),
        recentlyShownClaimIds(),
      ]);
      if (cancelled || version !== selectionVersion.current) return;

      const item = selectSurfaceAdvice(
        {
          surface: 'goal-draft',
          goal,
          hasEstimate: estimate !== null,
          deficitKcal: goal === 'cut' ? Math.min(deficit, allowedDeficit) : null,
        },
        CLAIMS,
        {
          suppressedClaimIds: [
            ...suppressed,
            ...[...shownClaimIds.current].filter((claimId) => claimId !== currentClaimId),
          ],
          recentlyShownClaimIds: recent.filter((claimId) => claimId !== currentClaimId),
        },
      );
      if (!item) {
        draftAdviceRef.current = null;
        setDraftAdvice(null);
        return;
      }
      const claim = CLAIMS.find((candidate) => candidate.id === item.claimId);
      if (!claim || cancelled || version !== selectionVersion.current) return;

      shownClaimIds.current.add(claim.id);
      const selected = { claim, item, goal };
      draftAdviceRef.current = selected;
      setDraftAdvice(selected);
    })().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [allowedDeficit, estimate, goal, profileLoaded]);

  const visibleDraftAdvice = draftAdvice?.goal === goal ? draftAdvice : null;

  useEffect(() => {
    if (!visibleDraftAdvice || recordedClaimIds.current.has(visibleDraftAdvice.claim.id)) return;
    recordedClaimIds.current.add(visibleDraftAdvice.claim.id);
    void recordAdviceShown(
      visibleDraftAdvice.claim.id,
      visibleDraftAdvice.item.trigger,
      null,
      'goal-draft',
    ).catch(() => undefined);
  }, [visibleDraftAdvice]);

  async function save() {
    if (!profile || !clamped) return;
    await updateProfile({
      sex,
      heightCm: Number(heightCm) || null,
      birthYear: Number(birthYear) || null,
      goal,
      trainingExperience,
    });
    const protein = proteinTargetG(Number(weightKg));
    setUser(
      await setCalorieTarget({
        calorieTargetKcal: clamped.value,
        proteinTargetG: protein ?? 0,
        deficitKcal: goal === 'cut' ? Math.min(deficit, allowedDeficit) : 0,
      }),
    );
    setSaved(true);
  }

  return (
    <div className="mx-auto max-w-[480px] px-4 pt-5 pb-10">
      <header className="flex items-start gap-3">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate(-1)}
          className={`${LABEL} -ml-2 flex min-h-[44px] min-w-[44px] items-center justify-center text-ink ${TAP} active:bg-paper-sunk`}
        >
          &lsaquo;
        </button>
        <div className="min-w-0 pt-0.5">
          <h1 className="font-serif text-[20px] leading-[1.2] text-ink">Your goal</h1>
          <p className="mt-1 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
            You can change this whenever you like.
          </p>
        </div>
      </header>

      <section className="mt-5">
        <p className={LABEL}>Goal</p>
        <Segmented
          testId="goal"
          value={goal}
          onChange={setGoal}
          options={[
            { id: 'cut', label: 'Cut' },
            { id: 'maintain', label: 'Maintain' },
            { id: 'bulk', label: 'Bulk' },
          ]}
        />
        <p className="mt-2 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
          Maintenance is the default. Nothing here is set up to push you off it.
        </p>
      </section>

      {visibleDraftAdvice && (
        <section
          aria-label="General evidence"
          className="mt-6 border-t border-rule pt-4"
        >
          <h2 className={LABEL}>General evidence</h2>
          <div className="-mx-4 mt-2 border-t border-rule">
            <ClaimCard claim={visibleDraftAdvice.claim} />
          </div>
        </section>
      )}

      <section className="mt-6 border-t border-rule pt-4">
        <p className={LABEL}>Training experience (optional)</p>
        <Segmented<ExperienceSelection>
          testId="experience"
          value={trainingExperience ?? 'skip'}
          onChange={(value) => setTrainingExperience(value === 'skip' ? null : value)}
          options={[
            { id: 'new', label: 'New' },
            { id: 'returning', label: 'Returning' },
            { id: 'experienced', label: 'Experienced' },
            { id: 'skip', label: 'Skip' },
          ]}
        />
        <p className="mt-2 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
          You can skip this question or clear your answer at any time.
        </p>
      </section>

      <section className="mt-6 border-t border-rule pt-4">
        <p className={LABEL}>Starting estimate</p>
        <p className="mt-1 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
          Four numbers, then the app stops guessing and starts measuring.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <label>
            <span className={LABEL}>Height (cm)</span>
            <input
              data-testid="height-input"
              className={`${FIGURE} ${FIELD}`}
              inputMode="numeric"
              autoComplete="off"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </label>
          <label>
            <span className={LABEL}>Born (year)</span>
            <input
              data-testid="birth-year-input"
              className={`${FIGURE} ${FIELD}`}
              inputMode="numeric"
              autoComplete="off"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </label>
          <label>
            <span className={LABEL}>Weight (kg)</span>
            <input
              data-testid="weight-input"
              className={`${FIGURE} ${FIELD}`}
              inputMode="decimal"
              autoComplete="off"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value.replace(/[^0-9.]/g, ''))}
            />
          </label>
          <div>
            <span className={LABEL}>Sex</span>
            <Segmented
              testId="sex"
              value={sex}
              onChange={setSex}
              options={[
                { id: 'male', label: 'M' },
                { id: 'female', label: 'F' },
                { id: 'unspecified', label: '-' },
              ]}
            />
          </div>
        </div>

        <p className={`${LABEL} mt-4`}>Day-to-day activity, excluding training</p>
        <Segmented
          testId="activity"
          value={activity}
          onChange={setActivity}
          options={(['desk', 'light', 'active', 'heavy'] as ActivityLevel[]).map((id) => ({
            id,
            label: ACTIVITY_LABEL[id],
          }))}
        />
      </section>

      {estimate === null ? (
        <p data-testid="estimate-missing" className="mt-5 font-serif text-[15px] leading-[1.45] text-ink-soft">
          Fill in height, year of birth and weight and the estimate appears here. Nothing is
          guessed from a partial answer.
        </p>
      ) : (
        <>
          <section className="mt-6 border-t border-rule pt-4">
            <p className={LABEL}>Estimated maintenance</p>
            <p data-testid="maintenance-estimate" className={`${FIGURE} mt-1 text-[28px] text-ink`}>
              {estimate.maintenanceKcal.toLocaleString()}
              <span className="ml-1 text-[15px] text-ink-faint">kcal / day</span>
            </p>
            {/* T3: a bare point value here is pseudo-precision. The band is not a
                footnote, it is part of the number. */}
            <p data-testid="maintenance-band" className={`${FIGURE} mt-1 text-[15px] text-ink-soft`}>
              Plausibly {estimate.lowKcal.toLocaleString()} – {estimate.highKcal.toLocaleString()}
            </p>
            <p className="mt-2 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
              Mifflin–St Jeor with an activity multiplier. These equations sit within about 10% of
              measured expenditure for most people and further out for some. The range above is
              that error, not a rounding.
            </p>
            <p className="mt-3 font-serif text-[15px] leading-[1.45] text-ink">
              This is a starting point, and the app will replace it.
            </p>
            <p className="mt-1 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
              After a few weeks of logged weight and intake, your own data gives a better
              maintenance figure than any equation can.
            </p>
          </section>

          {goal === 'cut' && (
            <section className="mt-6 border-t border-rule pt-4">
              <div className="flex items-baseline justify-between">
                <p className={LABEL}>Daily deficit</p>
                <p className={`${FIGURE} ${LABEL}`}>max {allowedDeficit}</p>
              </div>
              <p data-testid="deficit-value" className={`${FIGURE} mt-1 text-[22px] text-ink`}>
                {Math.min(deficit, allowedDeficit)}
                <span className="ml-1 text-[14px] text-ink-faint">kcal / day</span>
              </p>
              <input
                data-testid="deficit-slider"
                type="range"
                min={0}
                max={allowedDeficit}
                step={50}
                value={Math.min(deficit, allowedDeficit)}
                onChange={(e) => setDeficit(Number(e.target.value))}
                className="mt-3 h-[44px] w-full accent-[var(--color-ink)]"
                aria-label="daily deficit"
              />
              <p className="mt-1 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
                The control stops here. It is not a warning you can push past.
              </p>

              {allowedDeficit < MAX_DAILY_DEFICIT_KCAL && (
                <p data-testid="floor-note" className="mt-2 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
                  {allowedDeficit === 0
                    ? 'Your estimated maintenance is low enough that a deficit is not something this app will set. Maintenance it is.'
                    : 'Smaller than the usual limit, because the intake floor is reached before the deficit cap is.'}
                </p>
              )}

              {/* D-G3.4: the cap renders its own evidence, at its own grade, through
                  the same component as any other claim. */}
              {capClaim && (
                <div className="mt-4 border-t border-rule">
                  <ClaimCard claim={capClaim} />
                  <p className="px-4 pb-4 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
                    A population-level threshold from one meta-regression, not a number
                    calculated for you.
                  </p>
                </div>
              )}
            </section>
          )}

          <section className="mt-6 border-t border-rule pt-4">
            <p className={LABEL}>Your target</p>
            <p data-testid="resulting-target" className={`${FIGURE} mt-1 text-[24px] text-ink`}>
              {clamped?.value.toLocaleString()}
              <span className="ml-1 text-[14px] text-ink-faint">kcal / day</span>
            </p>
            <p className={`${FIGURE} mt-1 text-[15px] text-ink-soft`}>
              Protein {proteinTargetG(Number(weightKg)) ?? '-'} g
            </p>
            <p className="mt-1 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
              Protein follows 1.6 g per kg, where the evidence puts the plateau, a
              population dose-response, not a prescription for you.
            </p>

            <button
              type="button"
              data-testid="save-goal-button"
              onClick={() => void save()}
              className={`mt-4 min-h-[48px] w-full bg-ink px-4 font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-paper ${TAP} active:opacity-80`}
            >
              Use {clamped?.value.toLocaleString()} as my target
            </button>
            {saved && (
              <p data-testid="goal-saved" className="row-open mt-2 font-serif text-[13px] italic text-ink-soft">
                Saved. The Eat tab will compare against this from now on.
              </p>
            )}
            {user?.numbersHidden && (
              <p className="mt-2 font-serif text-[12.5px] italic leading-[1.45] text-ink-soft">
                Numbers are hidden elsewhere in the app; this screen shows them because setting a
                target requires seeing one.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

/** GR-5: reads and writes user health data, so it is unreachable without consent. */
export function GoalSetup(): ReactElement {
  return (
    <ConsentGate>
      <GoalForm />
    </ConsentGate>
  );
}
