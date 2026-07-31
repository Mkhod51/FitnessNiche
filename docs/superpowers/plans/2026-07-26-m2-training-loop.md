# M2 — Training Loop and Honest Signals: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A lifter can log sets and bodyweight offline without losing a write, and see an e1RM trend and per-muscle volume that refuse to overstate what the data can support.

**Architecture:** Pure, framework-free domain functions in `src/domain/` (e1RM regression, fractional volume, EWMA trends) over the existing SQLite-on-OPFS store. UI in `src/features/`. The honesty requirement is load-bearing rather than cosmetic: `e1rmTrend` must return an explicit `withinNoise` verdict and the UI must render that as copy, not as a confident line.

**Tech Stack:** Existing — Vite 8 / React 19 / TS 6 strict / Tailwind v4 / Vitest 4 / Playwright / drizzle over sqlite-wasm. Added this milestone: `react-router` (M2 is the first multi-screen milestone). No charting library — hand-rolled SVG, per M1 decision #11.

## Global Constraints

- **Repo path contains a space:** `/Users/mkhoder/Career/Internship apps /Projects/FitnessNiche`. Quote every path.
- **NFR-1 / T4 — no write is ever lost.** This is the milestone that introduces user writes, so it is the milestone where this stops being theoretical.
- **GR-5 / NFR-4 / FR-ONB-3 — explicit, separate consent for health data before any logging.** `users.consentedAt` already exists in the schema carrying the comment "GR-5: no logging before this is set". Enforce it.
- **FR-SIG-1 — e1RM is a many-point regression, never point-to-point.** Only sets with **RIR ≤ 3 and reps ≤ 10** qualify. Always rendered with a confidence band.
- **FR-SIG-2 — noise-floor honesty.** When the trend is inside measurement noise, the app says so instead of drawing a confident line. This is the hardest requirement in M2 and the one most likely to be quietly dropped.
- **FR-SIG-3 — per-muscle weekly volume** with fractional counting for compounds, shown against the **population range (~10–20 sets/muscle/week)**. **GR-4: never compute or display an individualized MEV/MRV.**
- **FR-SIG-4 — bodyweight is smoothed (EWMA) before display.** Raw daily weight is never the signal.
- **T3 — measurement honesty.** Never display a number the app cannot defend.
- **T1 / GR-6** — unchanged from M1: no advice renders without a stored `claim_id`; no LLM in the runtime trust path.
- **GR-1** — harm guards land in M3 via `src/domain/guards.ts`. **Do not create a competing path.** M2 shows weight as a trend; it sets no calorie targets.
- **NFR-6 / the scene** — one hand, phone at arm's length, ~90 seconds between sets. Set entry is the most latency-sensitive interaction in the product.
- **DESIGN.md is the visual contract.** Warm paper, serif for language, sans caps for labels, mono for figures, flat, no gradients. Tokens are Tailwind v4 `@theme` in `app/src/index.css`, namespaced `--color-*`. Add no new colours without updating DESIGN.md.
- **Commits:** the developer asked for fewer, larger commits — **one commit per task** unless a task says otherwise. Human-sounding, lowercase, imperative, no conventional-commit prefixes, no AI attribution. **Date commits `2026-07-26` or later** using `GIT_AUTHOR_DATE`/`GIT_COMMITTER_DATE`.
- **Definition of done:** `npm run typecheck && npm test -- --run && npm run build && npm run e2e` green from `app/`.

## Inherited state

Branch `m2-training-loop`, branched from `m1-advice-interaction` (unmerged). At branch point: typecheck clean, **189 unit tests / 19 files**, build OK, **e2e 7/7**, 17 curated claims.

`src/advice/` (types, schema, language, engine, search), `src/components/` (ConfidenceTicks, ClaimCard, EvidencePanel, FigureChart) and `src/features/advice/` are **M1 work and are not in scope**. Do not restyle or refactor them.

## Open findings carried in from M1's review, to fix opportunistically

Not blocking, but a task touching the relevant file should close them:
- `ConfidenceTicks` uses `role="img"` with an `aria-label`, which swallows the tick count from screen readers — the encoding described as primary is unavailable non-visually.
- The evidence panel's 12–14px body text is below the ≥16px floor `DESIGN.md` sets for itself.
- The provenance render-walk starts from already-tagged statements, so it cannot catch untagged advice prose.
- The source scan skips `src/App.tsx`.

---

## Task 1: Close D6 and D8 — make a write survivable

**Files:**
- Create: `app/src/db/snapshot.ts`, `app/src/db/snapshot.test.ts`
- Modify: `app/src/db/sqlite.worker.ts`, `app/src/db/protocol.ts`, `app/src/db/client.ts`, `app/src/db/rpc.ts`

**Interfaces:**
- Produces: `saveSnapshot(bytes: Uint8Array): Promise<void>`, `loadSnapshot(): Promise<Uint8Array | null>`, `clearSnapshot(): Promise<void>` from `src/db/snapshot.ts`. `DbResponse`'s `exec` variant gains `changes: number`.

**Why this is task 1.** Decision log #8 records that the non-OPFS fallback is `:memory:` with no export, deviating from BUILD-PLAN §M0's "graceful IndexedDB fallback", and states it **must close before M2 introduces user writes**. It is reachable today — OPFS SAHPool is single-connection, so a second tab falls back — and this was confirmed in a real browser during M1. The day a user logs a workout in a second tab, that workout is silently lost, which breaks NFR-1 outright.

D8 rides along because it touches the same protocol: `db.changes()` is never surfaced, so drizzle's `.run()` cannot report rows-affected, and M2 is the first milestone with update paths.

- [ ] **Step 1: Write the failing snapshot test**

`app/src/db/snapshot.test.ts`. IndexedDB is available in jsdom via `fake-indexeddb` — if it is not already a dependency, add it as a devDependency and import `fake-indexeddb/auto` in the test file.

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { saveSnapshot, loadSnapshot, clearSnapshot } from './snapshot';

describe('snapshot', () => {
  beforeEach(async () => { await clearSnapshot(); });

  it('returns null when nothing has been saved', async () => {
    expect(await loadSnapshot()).toBeNull();
  });

  it('round-trips bytes unchanged', async () => {
    const bytes = new Uint8Array([1, 2, 3, 250, 0, 99]);
    await saveSnapshot(bytes);
    const back = await loadSnapshot();
    expect(back).not.toBeNull();
    expect(Array.from(back as Uint8Array)).toEqual([1, 2, 3, 250, 0, 99]);
  });

  it('overwrites rather than accumulating', async () => {
    await saveSnapshot(new Uint8Array([1]));
    await saveSnapshot(new Uint8Array([2, 2]));
    expect(Array.from((await loadSnapshot()) as Uint8Array)).toEqual([2, 2]);
  });

  it('clears', async () => {
    await saveSnapshot(new Uint8Array([1]));
    await clearSnapshot();
    expect(await loadSnapshot()).toBeNull();
  });

  it('resolves rather than throwing when IndexedDB is unavailable', async () => {
    // Private browsing can refuse IndexedDB outright. Losing the fallback's
    // fallback must degrade to "no snapshot", never crash the boot.
    const real = globalThis.indexedDB;
    // @ts-expect-error deliberately removing the API to simulate a hostile environment
    delete globalThis.indexedDB;
    await expect(saveSnapshot(new Uint8Array([1]))).resolves.toBeUndefined();
    await expect(loadSnapshot()).resolves.toBeNull();
    globalThis.indexedDB = real;
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --run src/db/snapshot.test.ts
```

Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/db/snapshot.ts`**

A single-record IndexedDB store (`db: 'etl-snapshot'`, store `'db'`, key `'main'`) holding one `Uint8Array`. No versioning scheme beyond `onupgradeneeded` creating the store. Every exported function must swallow environment failures and resolve to a safe value — `loadSnapshot` to `null`, `saveSnapshot`/`clearSnapshot` to `undefined` — because this code path exists precisely for degraded environments and must not become a new crash source.

- [ ] **Step 4: Run to verify pass**

- [ ] **Step 5: Wire export/restore into the worker**

In `app/src/db/sqlite.worker.ts`:

- After falling back to `new sqlite3.oo1.DB(':memory:')`, attempt `loadSnapshot()`. If bytes come back, deserialize them into the open database:

```ts
const p = sqlite3.wasm.allocFromTypedArray(bytes);
sqlite3.capi.sqlite3_deserialize(
  db.pointer!, 'main', p, bytes.length, bytes.length,
  sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE | sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE,
);
```

- After any successful `exec` **that mutated rows** (`db.changes() > 0`) while `storage === 'memory-fallback'`, export and persist:

```ts
await saveSnapshot(sqlite3.capi.sqlite3_js_db_export(db));
```

Debounce this — exporting the whole database on every insert is O(db) per write. A trailing debounce of ~250 ms is sufficient and must be **flushed on `visibilitychange` → hidden**, or a user who closes the tab immediately after logging loses the write, which is the exact failure this task exists to prevent.

**Only do this in `memory-fallback`.** In `opfs-sahpool` the VFS already persists and an export per write would be pure waste.

- [ ] **Step 6: Surface `changes` over the RPC (D8)**

Add `changes: number` to the `exec` success variant in `protocol.ts`; populate it from `db.changes()` in the worker; thread it through `rpc.ts` and `client.ts` so the drizzle adapter can report rows-affected. Update the existing drizzle contract test to assert a `.run()` reports a non-zero count for an insert and zero for a no-op update.

- [ ] **Step 7: Prove the fallback now persists**

Add an e2e spec, `app/e2e/fallback-persistence.spec.ts`, that opens two tabs on the same origin so the second falls into `memory-fallback`, writes through the `window.__db` hatch in the second tab, reloads it, and asserts the write survived. If two tabs prove awkward to drive, force the mode instead — but **the test must exercise the real fallback path, not a mock**, and you must fault-inject by disabling `saveSnapshot` and confirming the test then FAILS.

- [ ] **Step 8: Full suite, then one commit**

```bash
npm run typecheck && npm test -- --run && npm run build && npm run e2e
```

```bash
GIT_AUTHOR_DATE="2026-07-26T12:00:00" GIT_COMMITTER_DATE="2026-07-26T12:00:00" \
  git commit -m "stop a second tab silently throwing away everything you log"
```

---

## Task 2: The consent gate

**Files:**
- Create: `app/src/features/onboarding/ConsentGate.tsx`, `.test.tsx`
- Create: `app/src/db/user.ts`, `app/src/db/user.test.ts`
- Modify: `app/src/App.tsx`

**Interfaces:**
- Produces: `getUser()`, `recordConsent()`, `hasConsented(user)` from `src/db/user.ts`; `<ConsentGate>` wrapping any logging surface.

**Spec conflict, resolved deliberately.** BUILD-PLAN schedules onboarding and the consent flow in M3, but FR-ONB-3 and GR-5 require explicit separate consent **before any logging**, and M2 is the logging milestone. Shipping M2 without it would leave the product in violation for a whole milestone. The schema already anticipated this: `users.consentedAt` exists carrying the comment "GR-5: no logging before this is set". This task enforces that column; the fuller onboarding (goal setup, maintenance default, numbers-hidden) stays in M3 as planned.

- [ ] **Step 1:** Write failing tests: no logging surface renders until `consentedAt` is set; consent is a deliberate action, not a pre-ticked box or an implied acceptance; consent persists across reload; declining leaves the app usable for browsing the evidence base, since M1's surface needs no health data.
- [ ] **Step 2:** Run, watch fail.
- [ ] **Step 3:** Implement. The copy states plainly what is stored, that it stays on the device, and that it is special-category health data under UK GDPR. **No dark patterns**: no pre-checked box, decline is as prominent as accept.
- [ ] **Step 4:** Run, watch pass. Full suite. One commit: `ask before storing anything about someone's body`.

---

## Task 3: `e1rm.ts` — the honest signal

**Files:** Create `app/src/domain/e1rm.ts`, `app/src/domain/e1rm.test.ts`

**Interfaces (pinned in BUILD-PLAN §Interfaces — do not rename):**

```ts
function setE1rm(weightKg: number, reps: number, rir: number): number | null;
function e1rmTrend(points: { date: string; e1rm: number }[]):
  | { slopePctPerWeek: number; ci95: [number, number]; withinNoise: boolean;
      band: { date: string; lo: number; hi: number }[] }
  | 'insufficient_data';
```

**The evidence this must honour** (`docs/01-research/domain/science-based-training-evidence.md`, and it is unusually specific — read it):

- Epley on **effective reps = reps + RIR**. Formulas agree within ~2–3% at 2–6 reps and hold to ~±5% through 10 reps; **beyond 10 reps they diverge ±15–20%**, so `setE1rm` returns `null` for `reps > 10`.
- RIR self-report is accurate to ~1 rep at RIR 0–2 and degrades to **>2 reps of error at RIR 7–10**, so `setE1rm` returns `null` for `rir > 3`.
- A single e1RM reading carries **CV ≈ 5–10%**; single-test MDC is **≈10 kg on squat, ≈5.6 kg on bench**.
- A regression over n≈8–24 points cuts the trend's effective SEM by roughly √n, to ~1–3.5%.
- Real intermediate progress over 4–8 weeks is **≈0.5–5 kg on a 100 kg squat** — the same order of magnitude as the noise, not larger.
- **The verdict the research reaches:** for advanced lifters a well-built trendline may still not resolve real progress inside 4–8 weeks, and **the app should say so rather than imply false precision.** That sentence is what `withinNoise` exists to encode.

- [ ] **Step 1: Write the failing tests**

Cover at minimum, each as a real assertion:
- `setE1rm` returns `null` for `reps > 10` and for `rir > 3`; returns a number at the boundaries `reps === 10` and `rir === 3` (boundary inclusive — the spec says ≤).
- Epley on effective reps: `setE1rm(100, 5, 0)` and `setE1rm(100, 3, 2)` must agree, because both are 5 effective reps. Assert the exact expected value from the formula rather than a range.
- `setE1rm(w, 1, 0) === w` — a true single is its own 1RM.
- Rejects nonsense input: zero or negative weight, zero or negative reps, negative RIR.
- `e1rmTrend` returns `'insufficient_data'` below a stated minimum point count. **Pick the threshold from the research and write the reason in a comment** — the research says a regression needs n≈8+ before the trend SEM drops usefully, and that two widely-spaced readings cannot distinguish real progress from noise.
- A clean upward series returns a positive `slopePctPerWeek`; a flat series returns ~0.
- **The band widens as points get sparser** — same slope, fewer points, wider `ci95`. Assert the relationship, not a magic number.
- **`withinNoise` is true when the confidence interval spans zero**, and false when it does not. This is the FR-SIG-2 gate and must be tested both ways.
- A series whose slope is real but tiny relative to its scatter reports `withinNoise: true`.

- [ ] **Step 2:** Run, watch fail.
- [ ] **Step 3:** Implement. Ordinary least squares on (days-since-first, e1rm), slope converted to percent-per-week against the fitted intercept; `ci95` from the standard error of the slope with a t-multiplier; `withinNoise = ci95[0] <= 0 && ci95[1] >= 0`. Keep it pure — no dates library, no I/O.
- [ ] **Step 4:** Run, watch pass. **Then prove the noise gate can fail**: hard-code `withinNoise: false` and confirm the covering tests go RED. Report the output.
- [ ] **Step 5:** One commit: `estimate 1rm from a set, and admit when the trend is just noise`.

---

## Task 4: `volume.ts` — fractional per-muscle sets

**Files:** Create `app/src/domain/volume.ts`, `app/src/domain/volume.test.ts`

**Interfaces:** `weeklySetsByMuscle(sets: SetRow[], exercises: ExerciseRow[], weekStart: string): Record<string, number>`

`exercises.contributions` is already `Record<string, number>` in the schema and the 56 seeded exercises carry real muscle contributions — read `app/src/db/seed-exercises.ts` for the shape before designing anything.

- [ ] **Step 1:** Failing tests: a compound set contributes fractionally to each muscle per its `contributions` map; an isolation set contributes 1.0 to its single muscle; sets outside the week window are excluded; soft-deleted sets (`deletedAt` non-null) are excluded; the output for a muscle with no work is absent rather than `0`, or present as `0` — pick one and test it.
- [ ] **Step 2:** Run, watch fail. **Step 3:** Implement. **Step 4:** Run, watch pass.
- [ ] **Step 5:** One commit: `count a compound set fractionally against every muscle it works`.

**GR-4 is binding here.** This function returns counts. It must not compute, infer, or expose an individualized MEV or MRV. The population range (~10–20 sets/muscle/week) belongs in the UI as a *population* comparison, labelled as such, and the research grades the exact cutpoint only [C] — so the UI must not present 10 or 20 as a personal target.

---

## Task 5: `trends.ts` — EWMA bodyweight

**Files:** Create `app/src/domain/trends.ts`, `app/src/domain/trends.test.ts`

**Interfaces:** `ewma(points: { date: string; value: number }[], halfLifeDays: number): { date: string; value: number }[]`

FR-SIG-4: raw daily weight is never the signal. Smooth over ≥1–2 weeks before display.

- [ ] Failing tests: a constant series smooths to that constant; a single spike is attenuated, not followed; the smoothed series is the same length as the input and preserves dates; a shorter half-life tracks more closely than a longer one (assert the relationship); an empty input returns empty. **Step 2–4** as usual. One commit: `smooth bodyweight before it is allowed to mean anything`.

---

## Task 6: Set logging — the latency-critical screen

**Files:** Create `app/src/features/log/LogWorkout.tsx` + test, `app/src/db/workouts.ts` + test. Modify `App.tsx`, add `react-router`.

**The scene is the spec:** one hand, phone at arm's length, ~90 seconds between sets, possibly sweaty. Repeat-last-set must be one tap. Weight and reps default from the previous set of the same exercise. Nothing may block on the network. Writes go to SQLite immediately (FR-LOG-4) — no "save" button that can be missed.

- [ ] Failing tests: logging a set writes it and it survives a reload; RIR is **optional** (nullable in the schema — FR-LOG-1 says optional, and OQ-2 means imports may lack it); the surface is unreachable without consent (Task 2); an offline write succeeds. Then implement, then an e2e proving a set logged with the network cut is still there after reload — the AC-1 foundation.
- [ ] One commit: `log a set in one thumb and never wait for the network`.

---

## Task 7: Weight logging + trends screen

**Files:** `app/src/features/log/LogWeight.tsx`, `app/src/features/trends/Trends.tsx`, `app/src/components/TrendChart.tsx`, all with tests.

- [ ] `TrendChart` is hand-rolled SVG per decision #11, renders the EWMA line with a confidence band, and **when `e1rmTrend` reports `withinNoise` it must render honest copy instead of a confident slope** (FR-SIG-2). Test that specifically: a within-noise series must not render a trend line, and must render text saying the signal cannot be distinguished from noise.
- [ ] Volume renders against the population range with the range labelled as population-level, never as a personal target (GR-4).
- [ ] One commit: `show the trend, and say plainly when there isn't one yet`.

---

## Task 8: Hevy CSV import, and resolving OQ-2

**Files:** `app/src/features/import/hevy.ts` + test, fixtures under `app/src/features/import/__fixtures__/`.

**OQ-2 is an open question this task closes:** does Hevy's free CSV export carry an RIR column? Do not guess. Find a real exported sample, or state plainly in the report that none could be obtained and that the parser therefore treats RIR as absent.

- [ ] Fixture-driven tests over a real Hevy CSV shape: rows parse into `sets`; **if no RIR column exists, imported sets get `rir: null`** and are therefore excluded from e1RM by Task 3's qualification rule; malformed rows are reported to the user, not silently dropped; import is idempotent (re-importing the same file does not double the data — M0's seeding bug is the precedent).
- [ ] One commit: `import a hevy export without inventing the data it doesn't carry`.
- [ ] **Record the OQ-2 answer in `docs/00-meta/decision-log.md`.**

---

## Milestone close

- [ ] `superpowers:verification-before-completion` against BUILD-PLAN §M2's checks: **AC-2** (e1RM trend with a confidence band that refuses to over-claim inside noise) and volume-vs-population-range with no personal MEV/MRV.
- [ ] Whole-branch review on the most capable model; point it at the remaining M1 findings and at D9/D10.
- [ ] Update `PROJECT-STATE.md`; append M2 decisions to `00-meta/decision-log.md`, including the OQ-2 answer and the consent-timing deviation.
- [ ] Append to `.superpowers/sdd/progress.md` after every task.
- [ ] Ask the user before merging anything.

## Self-review

**Spec coverage:** workout logging UI → Task 6. `e1rm.ts` with property tests → Task 3. `volume.ts` fractional → Task 4. Trend charts with bands and `withinNoise` as copy → Task 7. Hevy CSV + OQ-2 → Task 8. Weight logging + EWMA → Tasks 5 and 7. AC-2 → Tasks 3 and 7. GR-4 → Tasks 4 and 7.

**Added beyond BUILD-PLAN §M2, each with a reason:** Task 1 closes D6/D8, which the decision log requires before user writes. Task 2 pulls the consent gate forward from M3 because GR-5 forbids logging without it and M2 introduces logging.

**Type consistency:** `setE1rm`/`e1rmTrend` match BUILD-PLAN §Interfaces exactly. `weeklySetsByMuscle` returns the same `Record<string, number>` shape `UserStateSnapshot.weeklySetsByMuscle` already declares, so M4's engine wiring needs no adapter. `DbResponse.exec` gains `changes` — a widening, so M1 callers are unaffected.

**Deliberately deferred:** `reconcile.ts` and data-earned advice are M4. `guards.ts` and nutrition are M3. Sync is M5.
