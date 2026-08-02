# Advice Surface Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface claim-bound, evidence-graded advice at first exercise selection and draft-goal choice while preserving the existing data-earned advice path for logged history.

**Architecture:** Keep `UserStateSnapshot` for aggregate predicates and introduce a separate validated `SurfaceContext` selector for non-personal general-evidence cards. Claim records declare authored surface eligibility; components never author advice copy, citations, or grades. Workout-start, exercise-selection, and goal-draft lanes coordinate through one deterministic selection budget and the existing event ledger.

**Tech Stack:** React, TypeScript strict, Zod, JSON Logic, YAML claim records, Vitest, React Testing Library, Playwright, and curation-time Firecrawl/PubMed/Crossref/Europe PMC.

## Global Constraints

- Every rendered advice item must come from a stored claim and render its claim id, grade, and citation (T1/GR-6).
- Runtime, build, and test paths remain offline and deterministic; scholarly network access is curation-time only.
- Preserve calorie floors, the 500-kcal/day deficit cap, maintenance default, numbers-hidden behaviour, and wellness framing (GR-1/GR-2).
- A general context claim is not `data-earned`, does not assert a personal conclusion, and has no invented explanatory fact (GR-4).
- Keep source population visible. Optional training experience ranks relevance but does not rewrite or hide a source's population applicability (FR-CLAIM-5).
- No publisher figures; every stored source value must be directly read, ledgered, and hostile-reviewed before a claim ships (GR-3).
- Do not create advice from a single weigh-in, a single food entry, or a just-logged set. The session has one automatic-card budget.

---

### Task 1: Record the surface map and source queue before feature authoring

**Files:**
- Modify: `docs/00-meta/claim-review-queue.md`
- Modify: `app/claims/review-ledger.json`
- Create: no YAML until the source gate is complete

**Interfaces:**
- Produces a queue entry for first-exercise/general-knowledge, cut, bulk, and maintenance context claims.
- Produces ledger rows with direct-source access route, source locations, applicability limits, null rationales, and two empty review slots before YAML drafting.

- [ ] **Step 1: Write the explicit non-personal surface policy in the queue.**

Add four lanes: `hub-empty`, `exercise-selection`, `goal-draft`, and existing
longitudinal advice. State that no one-day food, weigh-in, or individual set
can earn an automatic claim.

- [ ] **Step 2: Build a candidate source queue without drafting claims.**

Discover separately for exercise selection, plain-language hypertrophy
mechanisms, cut-rate context, bulk-rate context, and maintenance context. Use
Firecrawl/PubMed for discovery and Crossref only to resolve a DOI. Record
candidate identifiers and access state in the ledger; search snippets and
agent reports are leads only.

- [ ] **Step 3: Directly read the primary paper or review for each candidate.**

For every field intended for storage, record the exact source section/table,
population, outcome, limitations, and why the claim can or cannot surface in
each context. Reject a candidate that only supports a personal target,
unlabelled generalisation, or mechanism speculation.

- [ ] **Step 4: Obtain both hostile reviews before claim authoring.**

Each reviewer verifies the proposed scope, population label, draft
surface-context eligibility, grade, every stored field, and null rationale.
Do not add a YAML file until both ledger reviews are complete.

- [ ] **Step 5: Commit the reviewed queue state.**

Run: `jq empty app/claims/review-ledger.json && git diff --check`

Commit: `queue source review for advice surfaces`

### Task 2: Define validated surface-context claim metadata

**Files:**
- Modify: `app/src/advice/types.ts`
- Modify: `app/src/advice/claim-schema.ts`
- Modify: `app/src/advice/claim-schema.test.ts`
- Modify: `app/scripts/build-claims.ts`
- Modify: `app/scripts/build-claims.test.ts`
- Modify: `app/claims/schema.md`
- Modify: `app/claims/ADDING-A-CLAIM.md`
- Modify: `app/src/generated/claims.ts`

**Interfaces:**
- Adds `AdviceSurface`, `TrainingExperience`, `SurfaceContext`, and nullable claim `surfaceContexts` metadata.
- Adds `validateSurfaceContexts(value)` that rejects unknown surfaces, unknown exercise ids, impossible goal combinations, and a populated context list on a data-earned claim.

- [ ] **Step 1: Write failing schema tests.**

```ts
it('accepts a general exercise-selection context without training experience', () => {
  expect(claimSchema.parse({ ...valid, surfaceContexts: [{ surface: 'exercise-selection' }] })).toBeTruthy();
});

it('rejects a data-earned claim with a general surface context', () => {
  expect(() => claimSchema.parse({ ...dataEarned, surfaceContexts: [{ surface: 'hub-empty' }] })).toThrow();
});
```

- [ ] **Step 2: Run the focused tests and confirm the metadata is currently rejected.**

Run: `npm test -- --run src/advice/claim-schema.test.ts scripts/build-claims.test.ts`

Expected: FAIL because `surfaceContexts` is not part of `Claim` or the build schema.

- [ ] **Step 3: Add the minimal discriminated metadata model.**

```ts
export type AdviceSurface = 'hub-empty' | 'exercise-selection' | 'goal-draft';
export type TrainingExperience = 'new' | 'returning' | 'experienced';
export type SurfaceContext =
  | { surface: 'hub-empty' }
  | { surface: 'exercise-selection'; exerciseIds?: string[]; populations?: Population[] }
  | { surface: 'goal-draft'; goals: Array<'cut' | 'bulk' | 'maintain'> };
```

`surfaceContexts` defaults to `null`. Keep existing snapshot predicates and
`trigger` semantics unchanged; surface context is selection metadata, not a
JSON-Logic predicate.

- [ ] **Step 4: Regenerate and run focused checks.**

Run: `npm run claims && npm test -- --run src/advice/claim-schema.test.ts scripts/build-claims.test.ts && npm run typecheck`

Expected: PASS with generated claims produced only by the generator.

- [ ] **Step 5: Commit the metadata contract.**

Commit: `define claim surface contexts`

### Task 3: Persist optional training experience without treating it as a gate

**Files:**
- Modify: `app/src/db/schema.ts`
- Create: `app/src/db/migrations/0005_training_experience.sql`
- Modify: `app/src/db/user.ts`
- Modify: `app/src/db/user.test.ts`
- Modify: `app/src/features/nutrition/GoalSetup.tsx`
- Modify: `app/src/features/nutrition/GoalSetup.test.tsx`

**Interfaces:**
- Adds `trainingExperience: TrainingExperience | null` to `User` and `updateProfile`.
- Goal setup renders an optional three-choice experience control with an explicit "skip" state.

- [ ] **Step 1: Write failing persistence and form tests.**

```ts
it('round-trips an optional training experience value', async () => {
  await updateProfile({ trainingExperience: 'experienced' });
  expect((await getUser()).trainingExperience).toBe('experienced');
});

it('allows saving a goal without choosing experience', async () => {
  renderGoalSetup();
  await completeRequiredEstimateFields();
  fireEvent.click(screen.getByTestId('save-goal-button'));
  expect(await screen.findByTestId('goal-saved')).toBeVisible();
});
```

- [ ] **Step 2: Run the focused tests and confirm the column/control is absent.**

Run: `npm test -- --run src/db/user.test.ts src/features/nutrition/GoalSetup.test.tsx`

Expected: FAIL because `trainingExperience` is unknown.

- [ ] **Step 3: Add the migration, local model, and optional control.**

Use a nullable text column with a database check matching `new`, `returning`,
or `experienced`. Do not infer the value from first app use. The UI labels it
as optional and permits clearing it.

- [ ] **Step 4: Run the focused tests and typecheck.**

Run: `npm test -- --run src/db/user.test.ts src/features/nutrition/GoalSetup.test.tsx && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit the optional profile field.**

Commit: `store optional training experience`

### Task 4: Build deterministic surface-context selection and event auditing

**Files:**
- Create: `app/src/advice/surface-advice.ts`
- Create: `app/src/advice/surface-advice.test.ts`
- Modify: `app/src/db/schema.ts`
- Create: `app/src/db/migrations/0006_advice_surface.sql`
- Modify: `app/src/db/advice-events.ts`
- Modify: `app/src/db/advice-events.test.ts`
- Modify: `app/src/advice/types.ts`

**Interfaces:**
- `selectSurfaceAdvice(context, claims, filters): AdviceItem | null`
- `recordAdviceShown(claimId, trigger, workoutId, surface, now?)`
- Advice events record `surface: AdviceSurface | 'hub' | 'weekly-review' | 'search'`.

- [ ] **Step 1: Write failing selection tests.**

```ts
it('prefers an exercise-specific claim after the first selected exercise', () => {
  expect(selectSurfaceAdvice(
    { surface: 'exercise-selection', exerciseId: 'barbell-back-squat', experience: null },
    contextClaims,
    noFilters,
  )?.claimId).toBe(contextClaims[0].id);
});

it('does not reject a novice-population general claim for an experienced user', () => {
  expect(selectSurfaceAdvice(
    { surface: 'exercise-selection', exerciseId: 'machine-leg-press', experience: 'experienced' },
    noviceOnlyContextClaims,
    noFilters,
  )?.claimId).toBe(noviceOnlyContextClaims[0].id);
});

it('returns no card for an unrelated goal context', () => {
  expect(selectSurfaceAdvice({ surface: 'goal-draft', goal: 'bulk', hasEstimate: true, deficitKcal: null }, cutClaims, noFilters)).toBeNull();
});
```

- [ ] **Step 2: Run the focused tests and confirm the selector does not exist.**

Run: `npm test -- --run src/advice/surface-advice.test.ts src/db/advice-events.test.ts`

Expected: FAIL with missing module and event-surface column.

- [ ] **Step 3: Implement the selector with conservative ranking.**

Choose only claims declaring the requested surface context. Prefer an exact
exercise and matching population, then an exercise-agnostic general fact. A
population mismatch is rank-lowered, never relabelled. Reuse suppression and
cooldown filters, return no card on ambiguity, and never call the aggregate
predicate engine from this path.

- [ ] **Step 4: Add the event migration and keep existing event callers explicit.**

Backfill no historical surface as `unknown`; require new callers to pass their
surface. Preserve local-only writes and sync marking.

- [ ] **Step 5: Run the focused tests and typecheck.**

Run: `npm test -- --run src/advice/surface-advice.test.ts src/db/advice-events.test.ts src/advice/session-advice.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit selection and audit support.**

Commit: `select advice for explicit surfaces`

### Task 5: Integrate the one-card workout lane after first exercise selection

**Files:**
- Modify: `app/src/features/log/LogWorkout.tsx`
- Modify: `app/src/features/log/LogWorkout.test.tsx`
- Modify: `app/src/features/exercises/ExercisePicker.tsx`
- Modify: `app/src/features/advice/AdvicePeek.tsx`
- Modify: `app/src/features/advice/AdvicePeek.test.tsx`

**Interfaces:**
- `tryExerciseSelectionAdvice(workoutId, exerciseId)` runs only after the first successful selection in an open workout.
- `AdvicePeek` receives an optional `kind: 'general-evidence' | 'snapshot'` and labels general evidence without a personal `why` line.

- [ ] **Step 1: Write failing component tests.**

```tsx
it('shows one general-evidence card after the first exercise is selected in a new workout', async () => {
  mockSelectSurfaceAdvice.mockReturnValue(exerciseContextItem);
  await startWorkoutAndChoose('barbell-back-squat');
  expect(await screen.findByTestId('advice-peek')).toHaveTextContent('General evidence');
});

it('does not select another card after a second exercise or a logged set', async () => {
  await startWorkoutAndChoose('barbell-back-squat');
  await chooseExercise('dumbbell-bench-press');
  await tickFirstWorkingSet();
  expect(mockSelectSurfaceAdvice).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run the focused test and confirm no post-selection advice path exists.**

Run: `npm test -- --run src/features/log/LogWorkout.test.tsx src/features/advice/AdvicePeek.test.tsx`

Expected: FAIL because selecting an exercise only adds an exercise section.

- [ ] **Step 3: Implement a shared session budget.**

If aggregate advice was already shown when the workout opened, do not surface a
second card. Otherwise select after the first exercise pick, record its surface,
and render the existing claim card with a general-evidence label. Do not run
the selector from set ticking, RIR controls, or workout finish.

- [ ] **Step 4: Run focused tests and a targeted browser flow.**

Run: `npm test -- --run src/features/log/LogWorkout.test.tsx src/features/advice/AdvicePeek.test.tsx && npm run typecheck`

Playwright: start an empty workout, select a supported first exercise, verify
one cited card appears, log a set and choose another exercise, verify no second
card appears; repeat with an unsupported exercise and verify silence.

- [ ] **Step 5: Commit the first-workout lane.**

Commit: `show evidence after first exercise selection`

### Task 6: Integrate draft-goal and zero-data Hub context lanes

**Files:**
- Modify: `app/src/features/nutrition/GoalSetup.tsx`
- Modify: `app/src/features/nutrition/GoalSetup.test.tsx`
- Modify: `app/src/features/advice/AdviceFeed.tsx`
- Modify: `app/src/features/advice/AdviceFeed.test.tsx`
- Modify: `app/src/features/hub/Hub.tsx`

**Interfaces:**
- `selectSurfaceAdvice({ surface: 'goal-draft', goal, hasEstimate, deficitKcal }, ...)`
- Goal setup renders an eligible `ClaimCard` below the selected goal before save.
- Hub empty state may render one `hub-empty` general-evidence card labelled as such.

- [ ] **Step 1: Write failing goal and Hub tests.**

```tsx
it('renders a claim-bound bulk context card before a draft goal is saved', async () => {
  renderGoalSetup();
  fireEvent.click(screen.getByTestId('goal-bulk'));
  expect(await screen.findByTestId('claim-card')).toHaveAttribute('data-claim-id', bulkContextClaim.id);
});

it('shows a general-evidence card, not a personalised card, on an empty Hub', async () => {
  mockLoadAdviceSnapshot.mockResolvedValue(emptyBuiltSnapshot);
  render(<AdviceFeed />);
  expect(await screen.findByText('General evidence')).toBeVisible();
});
```

- [ ] **Step 2: Run the focused tests and confirm only the hard-wired cut cap can render today.**

Run: `npm test -- --run src/features/nutrition/GoalSetup.test.tsx src/features/advice/AdviceFeed.test.tsx`

Expected: FAIL because neither component calls the surface selector.

- [ ] **Step 3: Implement draft-only selection without weakening guards.**

Keep `targetForDeficit`, `maxAllowedDeficit`, the current cap card, and all
calorie-floor behaviour unchanged. A goal-context card describes study scope;
it must not compute a personal gain/loss rate or override the target control.
For numbers-hidden users, do not add automatic energy/protein cards outside
Goal Setup.

- [ ] **Step 4: Implement the Hub empty-state lane.**

Render at most one curated `hub-empty` claim under a clear general-evidence
heading. Do not call it "For you," record a general surface event, and apply
suppression/cooldown.

- [ ] **Step 5: Run focused tests and a targeted browser flow.**

Run: `npm test -- --run src/features/nutrition/GoalSetup.test.tsx src/features/advice/AdviceFeed.test.tsx && npm run typecheck`

Playwright: choose cut, bulk, and maintain without saving and verify only the
eligible cited card appears; verify the cut slider cannot cross its hard cap;
open an empty Hub and verify the card is labelled general evidence.

- [ ] **Step 6: Commit the context surfaces.**

Commit: `surface evidence during goal setup`

### Task 7: Curate and ship only reviewed zero-data and goal-context claims

**Files:**
- Create: reviewed `app/claims/c-exercise-*.yaml`, `c-mechanism-*.yaml`, and `c-*-goal-context.yaml` records as evidence permits
- Modify: `app/claims/review-ledger.json`
- Modify: `docs/00-meta/claim-review-queue.md`
- Modify: `app/src/generated/claims.ts`

**Interfaces:**
- New claims use `predicates: null`, `trigger: null`, and reviewed `surfaceContexts` metadata.
- General facts never receive a data-earned trigger or a personal rate calculation.

- [ ] **Step 1: Complete one curation topic at a time.**

For each candidate: discover, resolve DOI, read direct source, extract only
supported fields, record ledger rationale, obtain two hostile reviews, then
draft one atomic YAML. Reject evidence that only supports a mechanism theory,
a novice-specific prescription presented as universal, or a personal rate.

- [ ] **Step 2: Generate and run focused authoring tests after each small batch.**

Run: `npm run claims && npm test -- --run src/advice scripts/build-claims.test.ts && npm run typecheck`

Expected: PASS; generated output changes only through the claim builder.

- [ ] **Step 3: Review surface applicability before each commit.**

Verify the source population is retained in the claim, the surface metadata
does not claim personal applicability, and any experience ranking is optional
and visible rather than a silent generalisation.

- [ ] **Step 4: Commit each coherent evidence batch.**

Commit examples: `add first-workout exercise evidence`, `add goal-context evidence`, `explain hypertrophy mechanisms`.

### Task 8: Verify the complete advice-surface contract

**Files:**
- Modify: `docs/PROJECT-STATE.md`
- Modify: `docs/00-meta/decision-log.md`
- Test: `app/src/advice/*.test.ts`, `app/src/features/**/*.test.tsx`, targeted Playwright coverage

**Interfaces:**
- Documents the distinction among general context, generic rule, and data-earned advice.

- [ ] **Step 1: Add cross-surface regression tests.**

Cover consent denial, empty data, optional/mismatched experience, unsupported
exercise, one-card workout budget, dismissal, seven-day cooldown, numbers
hidden, cut cap/floor, bulk/maintenance silence where no claim applies, and no
advice from a single meal/weigh-in/set.

- [ ] **Step 2: Run the complete deterministic verification suite.**

Run: `npm run claims && npm test && npm run typecheck && npm run build`

Expected: PASS with no scholarly network access.

- [ ] **Step 3: Run the targeted Playwright scenarios.**

Verify first-exercise, goal-draft, Hub-empty, cooldown, suppression, and
numbers-hidden behaviour in a browser. Do not use Playwright for curation.

- [ ] **Step 4: Audit documentation and commit.**

Record only shipped context claims and honestly deferred contexts; do not claim
maintenance or rate coverage that source review did not establish.

Commit: `verify advice across user contexts`
