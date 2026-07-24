# MacroFactor — Deep Teardown, with focused answer to the Phase-1 threat question

## Headline finding — read this first

Phase 1 flagged MacroFactor as "the single biggest competitive threat" because its Stronger-by-Science audience already lifts, so a lift logger would "erase a competitor's differentiation overnight." **This is no longer hypothetical.** MacroFactor shipped a dedicated workout-tracking app — **MacroFactor Workouts** — publicly announced in the company's own newsletter/blog cadence through late 2025 and **launched in January 2026** **[B]** (MacroFactor's own annual report and monthly-update posts; Google Play/App Store listings confirm live availability). This directly tests and substantially confirms Phase 1's inference — MacroFactor did move into training logging — but the *shape* of the move changes the competitive read materially. See "The threat, re-assessed" below.

## What exists today (as of this research pass, mid-2026)

MacroFactor is now a **two-app product line**, not one app with a new tab:

1. **MacroFactor** (nutrition) — the original app, iOS + Android, $11.99/mo or $71.99/yr, no free tier beyond a 7-day trial.
2. **MacroFactor Workouts** (training) — a **separate app**, package name `com.sbs.train` (the "sbs" — Stronger By Science — namespace is a tell that this shipped from the same engineering org, not a new acquisition), also $11.99/mo or $71.99/yr standalone, with 6-month ($47.99) and annual ($71.99, ≈$5.99/mo) tiers, 7-day trial, no free tier, and **bundle pricing for existing Nutrition subscribers** **[B]** ([macrofactor.com/workouts/](https://macrofactor.com/workouts/), confirmed via direct fetch).

### MacroFactor Workouts — feature inventory
- 900+ exercise library, with **638 exercise demo videos recorded by Jeff Nippard** (co-owner) **[B]**
- Program generator + custom program builder + at-launch import of six of Nippard's existing named programs (Min-Max Program, Bodybuilding Transformation System, etc.) **[C]**
- "Smart Progression" — auto-adjusts the training plan day-to-day based on logged performance, explicitly styled as **"rule-based logic, not generative AI"** — the company's own framing is "clear rules versus black-box guidance," positioned to mirror how a human coach would manage a program while preserving user autonomy **[B]** (direct paraphrase/quote per macrofactor.com/workouts/)
- Set/rep/weight logging, RIR tracking, drop sets, failure sets, partial reps, supersets, myoreps, rest timer, plate calculator
- Dashboard/Levels views, PR tracking, volume tracking, progress photos
- Resistance-training only at launch — **explicitly no formal cardio support**: "the current version of the app focuses on resistance training, so it does not have cardio options formally built in at this time," with custom-exercise workarounds available **[B]** (direct quote, Workouts Quick Start Guide)
- Ad-free, positioned on data privacy

### The critical architectural fact: the two apps are NOT algorithmically integrated at launch

This is the single most important finding for the architect. From MacroFactor's own materials:

> "MacroFactor Workouts operates as a separate app from the MacroFactor Nutrition platform, though they're designed to work together. The apps share body metrics, scale weight, progress photos, and select habits across both platforms. However, at launch there are **no shared coaching features or automatic program adjustments between nutrition and training**." **[B]** (paraphrase of macrofactor.com/workouts/ content, direct-fetched)

In other words: MacroFactor chose **data-sharing without algorithmic fusion**. The adaptive-TDEE engine in Nutrition does not (yet) consume training-volume data from Workouts to refine expenditure estimates, and Workouts' progression logic does not (yet) consume nutrition/recovery data from the Nutrition app. This is confirmed by two independent fetches (the product page and the Quick Start Guide) neither of which describes cross-app algorithmic integration, and the official framing language ("a strong duo," "teaming up to create a larger MacroFactor ecosystem") is aspirational/future-tense, not a description of shipped integration.

No official statement was found committing to *when or whether* that integration will ship — this is a genuine forward-looking gap, not a confirmed roadmap item.

## The threat, re-assessed

Phase 1's inference was directionally correct (MacroFactor would move into training) but the specific mechanism it worried about — "adding a lift logger... erase a competitor's differentiation overnight," implying a single unified app with integrated adaptive coaching across both domains — has **not** happened. What shipped instead:

- **Two separately-priced, separately-branded, separately-purchased apps** that merely sync body-metric data. A user who wants "one app, one login, one adaptive engine spanning food and training" still cannot get that from MacroFactor as of this research pass — they get two apps that need to be bought (or bundled) and used side by side.
- This is a meaningfully weaker competitive threat to a single-app, cross-domain product than a fully unified MacroFactor would have been. The gap Phase 1 identified — "no incumbent spans both strength logging and nutrition as first-class features in one product" — **is arguably still open**, because MacroFactor Workouts + MacroFactor Nutrition is two products with shared login/metrics, not one integrated product with a shared adaptive brain.
- At the same time, this is not a reason for complacency: MacroFactor has the engineering team, the audience (Stronger By Science + Jeff Nippard's following), the bootstrapped profitability to fund it, and an explicit stated intent ("ecosystem") to eventually fuse the two. A solo developer's window here is a **head start on true integration**, not a permanent gap MacroFactor can't close — treat it as temporary and monitor for a "unified algorithm" announcement.
- The separate-app choice is undocumented as to *why* — no official statement was found explaining the architectural decision (technical debt from the existing Nutrition codebase? distinct subscription-testing strategy? desire to let Workouts stand alone for lifters who don't want nutrition tracking? all inference). **Absence of evidence — flag as genuinely unknown, do not guess further.**

## Business model and revenue mechanics

- **Fully bootstrapped, no external funding, no VC/PE money** **[B]** (multiple converging sources, including a direct company statement that it has "remained profitable without relying on external funding, choosing instead to reinvest its profits to fuel further growth").
- Founded 2021, spun out of Stronger By Science (the research-driven fitness media brand founded by Greg Nuckols and Eric Trexler).
- **Five co-equal owners**: Greg Nuckols, Cory Davis, Rebecca Kekelishvili, Lyndsey Nuckols, Jeff Nippard **[B]** ([MacroFactor team page](https://macrofactor.com/team/) per search results).
- Growth: ~35,000 users (2022) → **400,000+ users** by the 2025 annual report **[B]** (company's own annual report). No subscriber or revenue dollar figures are disclosed publicly — a genuine gap; do not estimate ARR without labeling it a guess.
- **Team size: 17 employees as of April 2026** **[C]** (Tracxn, per search) — small relative to MyFitnessPal or Noom, consistent with "bootstrapped, profit-funded growth" rather than VC-scale headcount.
- **Premium-only, no free tier, explicitly by design** — the company's own stated reasoning: *"A premium-only business model ensures that interests are always aligned with users' interests, because when anyone could leave MacroFactor for a free alternative, the only way to succeed is by creating a truly exceptional product."* **[B]** (direct paraphrase of company messaging, converging across sources).
- **No lifetime/one-time-payment tier — and they explain why, on the record.** Cronometer/Duolingo-style "pay once" is explicitly rejected. MacroFactor's own help-center article gives three specific reasons **[B]** (direct quotes, fetched from help.macrofactorapp.com):
  1. *"Most products that don't offer one-time payment options, including MacroFactor, do have significant per-user costs post-sale."*
  2. They cannot reliably forecast how long a user stays or how per-user costs evolve, making a one-time price risky to set.
  3. A lifetime tier would create **misaligned incentives** — profiting more from users who cancel quickly than from those who stay, which would undercut the incentive to keep improving the product long-term.

  This is the clearest "what they will not build and why" statement found for any company in this research pass — and it is a direct statement of business philosophy, not a capacity excuse (contrast with Cronometer's "small team" framing above).
- Affiliate program is deliberately narrow: *"We don't want to partner with folks who are just interested in seeking out affiliate programs to join, regardless of whether or not they actually believe in the product they're promoting."* Explicitly not intended as a peer-referral discount scheme or a coach-referral channel **[B]** (direct quote, macrofactor.com/affiliate-application/).

## Food data sources

Confirms Phase 1: **licensed, not self-curated** — FatSecret, Open Food Facts, and research/USDA-style databases, consistent with the "algorithm company, not a database company" bet. This pass adds one nuance: MacroFactor's AI food-logging feature (photo/description-based entry) is explicitly marketed as using **"real, lab-analyzed results with complete nutrition data"** with **"full transparency into the ingredients"** rather than a generic LLM guessing at nutrition values — positioned as a "more serious alternative" to the wave of "hundreds of apps... flooding the market with LLM-based food loggers" **[B]** (direct paraphrase, 2025 annual report). This is a direct, named contrast with the Cal-AI-style photo-guessing approach MyFitnessPal just acquired — MacroFactor is publicly positioning its AI logging as more rigorous, grounded in verified nutrition data rather than model inference alone.

## Adaptive-TDEE algorithm — described as precisely as public information allows

This is MacroFactor's core differentiator and the best-documented mechanism of any app covered in this research pass.

- **Initial estimate:** at onboarding, MacroFactor computes a starting TDEE using a standard predictive equation (age/height/weight/activity-level style), same as any static-formula app, and sets initial intake targets from that.
- **Continuous re-estimation:** thereafter, the algorithm **compares the trend in logged calorie intake against the trend in logged scale weight**. If weight is changing faster or slower than logged intake alone would predict, it infers that the person's true metabolic rate differs from the initial estimate and **adjusts the estimated TDEE accordingly** **[C]** (consistent description across multiple independent reviews plus MacroFactor's own "Expenditure Modifiers" white-paper-style page).
- **Recalculation cadence:** described as recalculating **weekly**, using the actual weight trend and food-intake trend — e.g., losing slower than the current target implies → target adjusts down; losing faster than intended → target adjusts up **[C]**.
- **"Expenditure V3" (2025 update):** the company's own 2025 annual report describes an algorithm revision emphasizing **"responsiveness"** and **"resilience to missing data"** — i.e., explicit engineering work to make the adaptive model degrade more gracefully when logging is sporadic. This is directly relevant to the Phase 1 structural-weakness point that "the adaptive algorithm only works if logging is sustained" — MacroFactor is aware of and actively working against exactly that weakness, rather than treating it as fixed. Note this is a stated *improvement direction*, not evidence the underlying dependency on consistent logging has been eliminated — the fundamental sensitivity-to-input-quality tradeoff Phase 1 named is still architecturally real, just being actively mitigated.
- **Measured accuracy claim:** MacroFactor states that enabling the algorithm's "modifiers" reduces monthly weight-change absolute prediction error by around **6% overall**, and close to **20% more accurate in the long term** **[D]** — this is a company self-reported figure from MacroFactor's own "How Accurate is MacroFactor's Expenditure Algorithm?" marketing page, not an independently replicated study; treat as marketing-grade evidence, not verified science, until a third-party or peer-reviewed source is found.

## Platform coverage

iOS + Android for both apps (Nutrition and Workouts); no dedicated web app found for either product; watch support (Apple Watch integration is mentioned as an existing Nutrition-app feature, referenced in passing in the 2025 annual report re: "Recipe importer, favorites system, and Apple Watch integration all streamline existing workflows" — full detail on Wear OS/watch parity for either app was not independently verified in this pass and should be treated as a minor gap).

## Recent product direction (last ~24 months)

1. **Expenditure V3** algorithm update (2025) — responsiveness + missing-data resilience.
2. **AI food logging**, positioned against "generic LLM" competitors on the strength of "real, lab-analyzed" backing data (2025).
3. **MacroFactor Workouts** — the major 2025→2026 push: announced through 2025 monthly updates, AMA'd in December 2025, launched January 2026, built around Jeff Nippard's content and a "rule-based, not generative AI" progression philosophy.
4. Continuing content-marketing cadence (an "Annual Report" format, monthly "MM-" blog updates) that functions as both changelog and de facto investor-relations-style transparency for a company with no external investors to report to — worth noting as a distinctive communications style: MacroFactor is unusually transparent, in public blog form, about growth numbers, feature reasoning, and roadmap philosophy compared to every other company in this file.

## What they have publicly said they will NOT build

1. **No lifetime/one-time-payment subscription tier** — explicit, reasoned, on the record (see Business Model section above). This is the strongest "will not build" statement found in the entire incumbent set.
2. **No open, low-bar affiliate/referral program** — deliberately restricts affiliate partnerships to committed creators/athletes with real audiences, explicitly excluding peer-referral-for-discount and small-scale coach-referral use cases.
3. Implicitly, by omission rather than direct quote: **no free tier** (7-day trial only) — consistent with the stated "premium-only aligns incentives" philosophy, though this is a business-model statement more than a feature-scope statement.

No statement was found of MacroFactor explicitly declining to ever build cross-app nutrition/training integration — the "no shared coaching features... at launch" language is a launch-state description, not a permanent scope commitment, so do not over-read it as a "we will never integrate" pledge.

## Sources

- https://apps.apple.com/us/app/macrofactor-workouts-tracker/id6737156524
- https://play.google.com/store/apps/details?id=com.sbs.train
- https://macrofactor.com/workouts/ (direct-fetched)
- https://macrofactor.com/welcome-to-macrofactor-workouts/ (direct-fetched, Quick Start Guide)
- https://help.macrofactorapp.com/en/collections/24-workout-logging-workouts
- https://macrofactor.com/annual-report-2025/ (direct-fetched)
- https://macrofactor.com/mm-jan-2026/
- https://macrofactor.com/mm-dec-2025/
- https://macrofactor.com/mm-oct-2025/
- https://www.strongerbyscience.com/macrofactor-history-team/
- https://macrofactor.com/team/
- https://tracxn.com/d/companies/macrofactor/
- https://www.crunchbase.com/organization/macrofactor
- https://help.macrofactorapp.com/en/articles/115-why-doesn-t-macrofactor-have-a-lifetime-subscription-tier-with-a-one-time-payment (direct-fetched, direct quotes)
- https://macrofactorapp.com/expenditure-modifiers/
- https://help.macrofactorapp.com/en/articles/26-how-should-i-interpret-changes-to-my-energy-expenditure
- https://macrofactor.com/algorithm-accuracy/
- https://forums.cronometer.com/discussion/5132/adaptive-tdee-would-make-cronometer-perfect (cross-reference: MacroFactor named by Cronometer's own users as the adaptive-TDEE benchmark)
- https://macrofactor.com/affiliate-application/
- https://dr-muscle.com/macrofactor-workouts/
