# Cronometer — Deep Teardown

Confirms Phase 1's core thesis on Cronometer without contradiction: the verified-only pipeline is real, staff-confirmed as slow to widen (small team, capacity-constrained), and functions as the deliberate trade-off against MyFitnessPal's breadth. New in this pass: Cronometer is bootstrapped/unfunded (like MacroFactor, unlike Lifesum/Yazio), which matters for the architect's competitive-response modeling — Cronometer cannot out-fund a well-capitalized entrant, but also has no investor pressure to relax its curation standard.

## Feature inventory

- Food diary with 82+ (free) to 92 (as of Feb 2026, Gold) tracked nutrients/compounds — including granular items like soluble/insoluble fiber, omega-3/omega-6 subtypes, and phytate **[B]** (Cronometer's own blog, per search results)
- Custom recipes, biometric tracking, basic reports (free tier)
- Barcode scanning — **not paywalled**, available free (explicit contrast with MyFitnessPal) **[C]**
- Gold tier adds: ad removal, custom charts/reporting, nutrient-gap-based food suggestions, timestamp-based tracking, priority support, and (new, Feb 2026) a Calcium Absorption Score that estimates likely-usable calcium rather than just total calcium **[C]**
- Pro tier: client management, HIPAA-oriented compliance features, professional reporting — targeted at registered dietitians/health professionals, not consumers
- Fasting-reminder notifications on watch platforms

## Pricing tiers and paywall placement

Three tiers, with some figure variance across sources (likely reflecting regional pricing/promos — treat exact numbers as indicative):
- **Free/Basic:** unlimited logging, full micronutrient tracking, barcode scanning, biometrics, custom recipes, basic reports. Ad-supported.
- **Gold:** reported between $4.99–$8.99/mo (annual billing) or ~$10.99/mo (monthly); annual figures cited range $49.99–$59.88/yr across sources **[C]** (figures vary; [NutriScan](https://nutriscan.app/blog/posts/cronometer-pricing-2026-basic-vs-gold-vs-pro-b28e621201), [Nutrola](https://nutrola.app/en/blog/is-cronometer-free-2026)). Paywall sits at: ad removal, advanced charting, and (new) the Calcium Absorption Score — i.e., depth/analysis features, not core logging or barcode scan.
- **Pro:** $39.99/mo, professional/clinical tier.

The Phase 1 framing holds precisely: **the paywall is not at data-entry breadth (barcode is free) but at analysis depth** — the opposite placement from MyFitnessPal, where the paywall sits at data-entry convenience (barcode scan itself).

## Business model and revenue mechanics

- Unfunded/bootstrapped company — no VC or PE money **[B]** ([Crunchbase](https://www.crunchbase.com/organization/cronometer-com) per search results: "Cronometer has not raised any funding yet").
- Reported $3.8M revenue, 10M+ lifetime users **[C]** ([Latka interview](https://getlatka.com/companies/cronometer-software/team) per search results) — note this figure and the "10M+ users" claim likely reflect different time windows/definitions (revenue figure looks dated relative to the 10M user claim); treat both as approximate, not reconciled.
- Founder Aaron Davidson bootstrapped from personal funds; reportedly could not get a conventional bank loan to hire staff because "they don't understand the modern software business" **[C]** ([Revelstoke Review](https://www.revelstokereview.com/business/how-a-39-year-old-revelstoke-man-turned-a-nerdy-hobby-into-a-million-dollar-startup/) per search results) — illustrative of how far outside VC-normal patterns this company's growth has been.
- Company based in Revelstoke, BC, Canada (small-town HQ, not a tech hub) — consistent with a lean, non-venture-scale operation.

## Food data sources

Sources from 10+ reputable databases including USDA and the Nutrition Coordinating Center, plus a **Cronometer Community Database (CRDB)** of user-submitted foods **that are reviewed by a curation team before publication** **[B]** (Cronometer's own support documentation, per search: "Every user submitted food is reviewed by our curation team before being added to the database"). Branded/user-submitted products are restricted to only the nutrition-facts-panel data from packaging or the brand's official site — i.e., curators are checking against a source-of-truth label, not accepting freeform user claims. This is the concrete mechanism behind the "verified-only" differentiation Phase 1 named.

## Platform coverage

iOS, Android, web, Apple Watch (updated November 2025 for "improved performance and a more seamless experience"), Wear OS **[C]**. Confirmed presence on both major watch platforms, showing today's Energy Summary, Nutrition Scores, and Highlighted Nutrients, plus optional logging/fasting reminder notifications.

## Known technical architecture

Cronometer maintains a public engineering-facing presence ("Under The Hood" blog category on cronometer.com/blog) described as focused on "development" and "building software," but the specific technical content of these posts was not retrievable in this research pass — flag as a lead worth a direct follow-up read, not confirmed detail. Known concretely: the **mobile Android app uses Flutter**, communicating with a REST API at `mobile.cronometer.com` that the desktop/web client also uses **[C]** (inferred from Validic's third-party API-integration documentation referencing this endpoint). A limited partner API exists — third-party platforms **Everfit, Kalix, and Practice Better** have been granted access to pull select nutrition data from Cronometer **[C]**. However, when asked directly on the community forum whether a general public API would be released, Cronometer staff replied **"We don't have this in our plans for this year"** **[B]** (direct quote per forum search) — i.e., API access is being kept deliberately narrow/partnered rather than opened, mirroring MyFitnessPal's closed-API posture for different reasons (MFP: legacy/monetization control; Cronometer: small-team capacity).

## Funding and ownership history

Founded by Aaron Davidson, who built the original CRON-diet-inspired tracker for personal use in 2005 and formally launched Cronometer as a company in 2011. Bootstrapped throughout; no acquisition, no funding round found. Ownership remains with Davidson/the founding team as far as public information shows — no evidence of any sale, PE investment, or VC round at any point.

## Recent product direction (last ~24 months)

- Nutrient-tracking depth continues to expand (82 → 92 tracked nutrients/compounds by Feb 2026), reinforcing the "micronutrient precision" identity rather than chasing MyFitnessPal-style database breadth or AI photo logging.
- Calcium Absorption Score (Gold-tier, 2026) — a new example of Cronometer adding *interpretation* features on top of existing verified data, rather than adding new unverified data sources. This is the pattern to watch: Cronometer's growth investment goes into deeper analysis of a smaller, trusted corpus, not wider coverage.
- Web app reported by users as slow/laggy for extended periods (Phase 1 finding) — no evidence found here that this has been resolved; treat as an open, acknowledged-by-users-but-not-by-company issue.
- No adaptive-TDEE feature shipped, despite a standing, upvoted community feature request (see below).

## What they have publicly said they will NOT build / deferred

- **Public API:** explicitly deferred — "We don't have this in our plans for this year" **[B]** (forum reply, direct quote per search).
- **Meal plan builder:** deferred, not rejected — staff said **"We would still love to implement a big feature like a meal planner! We are a small team and haven't been able to tackle this yet"** **[B]** (direct quote per search) — this is a capacity admission, not a philosophical no, and is worth noting precisely because it's an incumbent openly saying "small team" as the constraint, not "not on brand."
- **Pre-planning/scheduling feature:** staff said **"We do not have a timeline for this feature to share with you"** **[B]** (direct quote).
- **Adaptive TDEE:** a well-supported community forum thread ("Adaptive TDEE would make Cronometer Perfect," multiple upvotes/agreement) exists asking Cronometer to add MacroFactor-style adaptive expenditure calculation. **No Cronometer staff reply was found in that thread** — this is a live, unaddressed feature gap, not a declined one. One community reply in that same thread noted that competitors MacroFactor and "MacroCodex" (a free Health-Connect-integrated tool) already do this **[C]** ([forum thread](https://forums.cronometer.com/discussion/5132/adaptive-tdee-would-make-cronometer-perfect)) — i.e., users are actively pointing Cronometer's own community at MacroFactor as the feature-gap benchmark.

Overall pattern: Cronometer's public "won't build" statements consistently cite **team size**, not product philosophy, as the limiting factor. This differs from MacroFactor, whose declines (e.g., no lifetime-subscription tier) are argued on business-model-alignment grounds. Cronometer looks resource-constrained; MacroFactor looks strategically restrained. That distinction matters for the architect: Cronometer's gaps (API, meal planner, adaptive TDEE) look like genuinely open opportunities that Cronometer itself would plausibly want to close if it could, not lines it has drawn on purpose.

## Adaptive-TDEE / goal-adjustment algorithm

**None.** Cronometer uses static, formula-based calorie/macro targets, set at profile creation and changed only on manual user edit. This is now confirmed from two angles: (1) no feature announcement or documentation describing an adaptive/learning expenditure model was found anywhere in Cronometer's own materials, and (2) Cronometer's own user community has an active, unaddressed feature request asking for exactly this, explicitly benchmarked against MacroFactor. This is a clean, evidenced confirmation of the Phase 1 structural-weakness table's framing (Cronometer's verified-only pipeline caps breadth; separately and additionally, it has no adaptive algorithm at all).

## Sources

- https://www.amyfoodjournal.com/blog/cronometer-review
- https://nutriscan.app/blog/posts/cronometer-pricing-2026-basic-vs-gold-vs-pro-b28e621201
- https://nutrola.app/en/blog/is-cronometer-free-2026
- https://www.crunchbase.com/organization/cronometer-com
- https://kootenaybiz.com/10people/article/aaron_davidson
- https://www.revelstokereview.com/business/how-a-39-year-old-revelstoke-man-turned-a-nerdy-hobby-into-a-million-dollar-startup/
- https://getlatka.com/companies/cronometer-software/team
- https://support.cronometer.com/hc/en-us/articles/360018239472-Data-Sources
- https://cronometer.com/blog/cronometer-pro-faq/
- https://help.validic.com/space/VCS/5542739969/Cronometer+API+Integration+for+Developers
- https://cronometer.com/blog/development/ (Under The Hood engineering blog — content not fully retrieved, flagged as a follow-up lead)
- https://forums.cronometer.com/discussion/5132/adaptive-tdee-would-make-cronometer-perfect
- https://forums.cronometer.com/discussion/3365/any-chance-a-public-api-for-cronometer-will-be-available
- https://forums.cronometer.com/discussion/2815/meal-plan-builder
- https://support.cronometer.com/hc/en-us/articles/26644592588692-Apple-Watch-App
- https://support.cronometer.com/hc/en-us/articles/4404692615700-Wear-OS-Watch-App
