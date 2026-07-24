# Segment: Science-Based / Evidence-Based Lifters

Followers of RP (Mike Israetel), Stronger By Science / MASS (Greg Nuckols, Eric Helms), Jeff Nippard, Menno Henselmans, 3DMJ. Care about MEV/MV/MAV/MRV volume landmarks, RIR autoregulation, per-muscle weekly volume, mesocycle periodization, SFR, adaptive TDEE.

## 1. Niche size & reachability

| Community | Rough size | Tag |
|---|---|---|
| r/weightroom | ~390-395K members [C] | subredditstats/gummysearch, cross-checked |
| r/bodybuilding | ~2.9M members [C] | subredditstats (general population, not evidence-based specifically) |
| r/naturalbodybuilding | Could not determine precise count — search results referenced a stats page but never returned the number. Known qualitatively to be a large, active, evidence-literature-literate subreddit; do not cite a figure without direct verification. | Absence of evidence |
| Jeff Nippard (YouTube) | ~8.5M subscribers as of July 2026 [C] | HypeAuditor/SocialBlade/vidIQ cross-checked |
| Stronger By Science / MASS Research Review | Monthly PDF subscription, $29/mo (student $15/mo), $299/yr, $999 lifetime — paid research-digest model implies a smaller, high-intent, literature-reading sub-audience than Nippard's mass YouTube reach (inference; no subscriber count found) | [D] pricing page only, no user counts published |
| RP app (Google Play / App Store) | Not able to determine install/user counts from search; app exists on both stores | Absence of evidence |
| Discords (RP, SBS, 3DMJ, r/weightroom) | Known to exist; no member counts found via search | Absence of evidence |

**Reachability**: this niche is not one subreddit — it's layered. Broad top-of-funnel is Nippard's YouTube (~8.5M, mostly casual viewers, evidence-adjacent). Mid-funnel is r/weightroom (~390K, more serious/literate). Narrow, highest-intent is MASS subscribers and RP app payers — a much smaller, unknown-sized, but demonstrably payment-willing group. Community sizing here is mostly [D]/[C]-tier estimation, not hard data; treat any total-addressable-market number built on this as inference, not fact.

## 2. Toolchain map

| Tool | Job it does for this niche | Gap |
|---|---|---|
| RP Hypertrophy App | Mesocycle templates built around MEV/MV/MAV/MRV, auto-progresses load/reps based on logged RIR and pump/soreness feedback, auto-deloads | $34.99/mo (or $24.99/mo annual) — steep for a solo/portfolio-scale comparison point; no confirmed CSV export or public API found in search (see §4); locks users into RP's own methodology and exercise list; nutrition is not integrated (separate RP Diet app) |
| Boostcamp | Hosts popular pre-built programs (incl. some evidence-based templates), simple logging | Not built specifically around per-muscle volume landmarks or RIR-based autoregulation; no native Strong import (per Boostcamp's own comparison page); third-party Chrome extension needed to CSV-export history — no first-party export |
| Hevy | Fast, free-tier set/rep/RPE logging, exercise history, free CSV export | No MEV/MV/MAV/MRV volume-landmark view; no automatic deload logic; per-muscle weekly volume requires manual tagging/spreadsheet work outside the app |
| Strong | Long-established, simple logging | CSV export is paywalled behind Strong PRO ($4.99/mo, $29.99/yr, or £99.99 lifetime) — free-tier users cannot get their own data out; no volume-landmark or autoregulation features; exported files can't be re-imported into Strong itself |
| SBS / community spreadsheets (e.g., Nuckols' program spreadsheets on LiftVault) | Manual, fully customizable volume/load tracking against MEV/MV/MAV/MRV; free | No automation — user manually enters every set, manually tallies weekly sets per muscle, no logging-app convenience (no phone-friendly set timer, rest timer, exercise database); breaks down over months as sheets get unwieldy |
| MacroFactor | Adaptive TDEE from logged weight + intake (algorithmic, not fixed formula), macro tracking | Purely nutrition — zero training data; a lifter has to mentally reconcile "I'm in a stalling MRV cut" against MacroFactor's calorie feedback with no app doing that reconciliation |

**Where the toolchain fractures**: the reported job (autoregulate training using MEV/MV/MAV/MRV + RIR) has no single tool that also handles nutrition. The RP app aims to do training-side auto-regulation but is priced far above logging apps and, per available search, offers no confirmed self-service data export. Logging apps (Hevy/Strong/Boostcamp) do the daily entry job cheaply/free but leave volume-landmark math and periodization to the user's own spreadsheet. Nutrition is a fully separate subscription (MacroFactor) with no training awareness. The user is stitching: log sets in Hevy/Strong → manually tally weekly volume per muscle in a spreadsheet against remembered MEV/MRV numbers → separately track weight/food in MacroFactor → mentally judge deload timing from felt fatigue, soreness notes, and stalling lifts.

## 3. Jobs-to-be-done

**Recurring / daily-weekly jobs**
- Log a session's sets, reps, load, RIR quickly during a workout (all logging apps do this; table stakes).
- See running weekly hard-set count per muscle group vs. that muscle's known MEV/MV/MAV/MRV range, updated as sessions are logged — the specific automation missing from Hevy/Strong/Boostcamp.
- Autoregulate next session's load/reps from last session's logged RIR (RP app's core pitch — evidence this is a named want, since RP built and prices a whole product around it).
- Track daily weight + intake and get an adaptive TDEE estimate (MacroFactor's core pitch, evidenced by ~200-300K paying users).

**One-off / periodic decision jobs**
- Decide when to deload: literature and practitioner content (Stronger By Science, RP) frame this as either pre-planned (fixed interval) or autoregulated (triggered by stalling performance, accumulated soreness/joint ache, or motivation drop) [C] — no single tool in the mapped toolchain surfaces "you're 3 sessions past your usual deload trigger" as a proactive nudge; users infer it themselves from felt fatigue plus spreadsheet trends.
- Reconcile a cut/bulk against training performance: MacroFactor adjusts calories from weight-trend data alone; it has no visibility into whether strength/volume tolerance is dropping because of the deficit, so the reconciliation is currently a manual, cross-app judgment call (inference — no tool found that does this natively; this is the most defensible gap because it requires nutrition+training data neither current toolchain half owns).
- Decide whether a mesocycle/program as a whole "worked" (progressing across successive blocks) — requires cross-session, cross-mesocycle history, which spreadsheet users maintain manually and logging-app users generally cannot see without exporting and analyzing themselves.

**Priority read**: the most-cited, most product-anchored job-to-be-done is per-muscle weekly volume vs. MEV/MAV/MRV — it is the one job an entire commercial product (RP Hypertrophy App, $24.99-34.99/mo) is built around and priced steeply for, which is stronger evidence of unmet demand than any forum quote. RIR-based autoregulation is the second-most-anchored (same product, same evidence). Deload-timing and cut/bulk-vs-performance reconciliation are real but currently un-productized jobs — no dedicated tool claims to solve either, which is itself the finding (a gap, not a crowded feature).

## 4. CSV / export verification (load-bearing — do not treat casually)

| App | Export exists? | Tier | Contains per-set load + reps? | Public API? |
|---|---|---|---|---|
| **Hevy** | Yes — confirmed. Settings → Export Data, exports workout data and/or measurements as CSV (may arrive as .csv or .tsv). [C] Source: Hevy Help Centre article title/summary and third-party migration guides (Arvo, Gainflow) that all describe importing a Hevy CSV export. | **Free tier** — no Pro subscription required, per Hevy's own help-centre framing and third-party guides that assume free-tier users can export. | Could not directly inspect column headers (Hevy's own help article returned HTTP 403 to automated fetch). Strongly implied by function (it's the standard source format multiple import tools, e.g. Strength Journeys, Gainflow, Arvo, ingest directly) that it includes exercise, date, set, weight, and reps at minimum — but this is inference from third-party tool compatibility, not a directly read column list. |No public API found in search. |
| **Strong** | Yes — confirmed. Settings → Export. Exported files **cannot be re-imported into Strong itself.** [C] Source: Strong Help Center article "Can I export my workout data?" | **Paywalled — Strong PRO required** ($4.99/mo, $29.99/yr, or a lifetime one-time option). Per a review/comparison source: "progress charts, advanced analytics, and data export are locked behind the paywall." This contradicts treating Strong-CSV-import as a free, frictionless universal path — a meaningful fraction of Strong's free-tier users cannot self-export at all. | Not independently confirmed which columns are present; third-party parsing tools (blog "Parsing workout data from strong app on iOS", GitHub StrongAppAnalytics, Strength Journeys' Strong importer) exist specifically to read Strong's CSV, and Strong's format is described as using **semicolon delimiters and weight-unit-specific headers** — implying it is fully structured with weight and reps, but this is inferred from the existence and purpose of those parsing tools, not a directly verified header list. | No public API found in search. |
| **Boostcamp** | No confirmed first-party CSV export. Workaround only: a third-party Chrome extension ("Boostcamp History → CSV") scrapes boostcamp.app/history, and a community GitHub tool converts Boostcamp's JSON history into CSV/XLSX. Boostcamp's own comparison page against Strong states it lacks even a one-click Strong-import feature, consistent with no polished native export. | N/A (no first-party feature confirmed either tier) | Not verifiable — data comes from an unofficial scrape, not a documented export schema. | No public API found in search. |
| **RP Hypertrophy App** | Could not determine. Search surfaced only third-party review/SEO content (dr-muscle.com, alibaba "wellness" pages) making vague claims like "export and logging features... track trends," with no help-centre article, no forum confirmation, and no description of an actual export mechanism or file format. | Whole app is $24.99-34.99/mo — no free tier exists at all, so export tier-gating is moot; the open question is whether export exists in any form. | Could not determine. | No public API found in search; the closest thing found is an unrelated third-party open-source project ("MyFit") "inspired by" the RP app, using its own backend — not an RP-provided API. |

**Verdict on the CSV-import survival requirement**: partially true, materially incomplete as previously stated. Hevy's CSV export is genuinely free and low-friction — that half of the claim holds. But "import from Strong" assumes Strong users can freely export, and they cannot without paying for Strong PRO; a design that requires Strong-CSV-import as an onboarding path will silently fail for every free-tier Strong user (evidence suggests a meaningful share of the base, since PRO gates several other high-value features too, so unclear what fraction has already paid). Boostcamp has no first-party export at all — only unofficial scraping tools. RP app's export status is simply unknown from available sources — treat "RP users can migrate their history in" as unverified, not assumed-true, until someone actually tests an RP export. Column-level content (does the CSV really carry per-set RIR/RPE, not just weight and reps?) was not directly confirmed for any app — inferred only from the existence of third-party tools built to consume these exports.

## 5. Willingness-to-pay and monetisation reality

- **RP Hypertrophy App**: $24.99-34.99/mo depending on term, no free tier, 30-day money-back guarantee. [C] Premium pricing for a single-purpose training app — signals a segment willing to pay real money for auto-regulated programming specifically.
- **MacroFactor**: $5.99-11.99/mo (or ~$6/mo effective annual, $71.99/yr), 7-14 day free trial. Reported 200-300K+ paying users and roughly $500K-2M/mo revenue range across differing estimates (source disagreement — treat exact revenue as [D], the fact of substantial paid scale as [C]). This is strong evidence nutrition-tracking WTP exists at a moderate ($6-12/mo) price point, distinct from RP's premium point.
- **MASS Research Review** (Stronger By Science): $29/mo standard, $15/mo student, $299/yr, $999 lifetime — a paid research-digest product, evidencing that a slice of this audience pays specifically for synthesized primary literature, not just for a tracking tool.
- **Stacking**: no direct evidence was found of measured overlap (e.g., a survey of "% of RP subscribers who also pay for MacroFactor"), but the pricing and positioning make simultaneous subscription plausible (inference): RP handles training auto-regulation, MacroFactor handles nutrition auto-regulation, and neither talks to the other — which is the toolchain fracture in commercial form. If true, a combined user could be paying ~$30-45/mo across two disconnected subscriptions for a single overall goal (optimize physique via evidence-based training + nutrition). This combined-spend claim is inference, not a sourced statistic — worth validating directly (e.g., r/naturalbodybuilding or r/weightroom threads asking "do you use both RP and MacroFactor") before treating it as a positioning fact.

## Sources

- Hevy Help Centre — CSV import/export: https://help.hevyapp.com/hc/en-us/articles/38001424401943-How-to-Import-Strong-App-CSV-Files-and-Export-Your-Data-in-Hevy
- Hevy Help Centre — logging/import tutorial: https://help.hevyapp.com/hc/en-us/articles/35687878672663-Tutorial-Log-Previous-Workouts-and-Import-CSV
- Strong Help Center — export: https://help.strongapp.io/article/235-export-workout-data
- Strong Help Center — Strong PRO: https://help.strongapp.io/article/132-strong-pro
- Strength Journeys — Hevy import: https://www.strengthjourneys.xyz/import/hevy
- Strength Journeys — Strong import: https://www.strengthjourneys.xyz/import/strong
- Boostcamp vs Strong comparison: https://www.boostcamp.app/vs/strong
- Boostcamp History → CSV (Chrome extension): https://chromewebstore.google.com/detail/boostcamp-history-%E2%86%92-csv/ndldfeicfhokabalcjmjhhdhinjilllo
- boostc_2_dataframe (GitHub): https://github.com/blaekhossa/boostc_2_dataframe
- RP Hypertrophy App (App Store): https://apps.apple.com/us/app/rp-hypertrophy/id1555614554
- RP Hypertrophy App (Google Play): https://play.google.com/store/apps/details?id=com.rp.hypertrophy&hl=en_US
- MyFit (third-party, RP-inspired, unofficial): https://github.com/WhyAsh5114/MyFit
- MacroFactor Workouts pricing: https://macrofactor.com/workouts/price/
- MASS Research Review student pricing: https://www.strongerbyscience.com/mass-student-accounts/
- Sigma Nutrition — MASS overview: https://sigmanutrition.com/mass/
- r/weightroom subreddit stats: https://subredditstats.com/r/weightroom, https://gummysearch.com/r/weightroom/
- r/naturalbodybuilding subreddit stats page (count not retrieved): https://subredditstats.com/r/naturalbodybuilding
- Jeff Nippard YouTube stats: https://hypeauditor.com/youtube/UC68TLK0mAEzUyHx5x5k-S1Q/, https://socialblade.com/youtube/handle/jeffnippard
