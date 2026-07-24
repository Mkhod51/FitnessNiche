# MyFitnessPal — Deep Teardown

Confirms Phase 1's core thesis: the database-quality problem is a business-model lock-in, not an engineering gap, and the 2026 Cal AI acquisition is fresh evidence that the org buys AI-native features rather than building them, consistent with "decade-old codebase/org under cost-reduction pressure." Nothing found here contradicts Phase 1; several items sharpen it with dates and numbers.

## Feature inventory

- Food diary with crowdsourced + brand + restaurant database (20M+ entries, 68,500+ brands, meals from 380+ restaurant chains) **[B]** (company figures, cited across press: [TechCrunch](https://techcrunch.com/2026/03/02/myfitnesspal-has-acquired-cal-ai-the-viral-calorie-app-built-by-teens/))
- Barcode scanner (Premium-gated, see pricing below)
- Macro tracking, custom goals, recipe importer
- "Today" tab redesign (2026) — Phase 1 already flagged user complaints that it made navigation harder **[C]**
- AI photo-based calorie estimation — arrived via the Cal AI acquisition (see below), not built in-house **[B]**
- Advertising Media Network (2025/2026) — MyFitnessPal now sells display, video, interstitial, sponsored-content, email, and social ad placements to brands targeting its user base, with "advanced targeting, shoppable experiences, and immersive brand formats" planned through 2026 **[B]** ([Yahoo Finance / press release](https://finance.yahoo.com/news/myfitnesspal-launches-advertising-media-network-130000188.html))
- Platform coverage: iOS, Android, web, Apple Watch, and Wear OS. Sources conflict on current Wear OS status — official MyFitnessPal support documentation (updated as recently as March 2026) still lists the Wear OS companion app (8 complications, 3 tiles) as live, but at least one independent 2026 review claims Wear OS support has lapsed **[C]** — flag as unresolved, do not treat as settled either way. Apple Watch support is undisputed.

## Pricing tiers and paywall placement

Three tiers as of 2026: Free ($0), Premium ($19.99/mo or $79.99/yr), Premium+ ($24.99/mo or $99.99/yr) **[C]** (converging figures across [Business of Apps](https://www.businessofapps.com/data/myfitnesspal-statistics/), [NutriScan](https://nutriscan.app/blog/posts/myfitnesspal-pricing-2026-guide-2ff09c399a), [Nutrola](https://nutrola.app/en/blog/why-did-myfitnesspal-increase-their-price)). This is roughly double the $9.99/mo Premium price that prevailed under Under Armour ownership — a direct, dated data point for the "monetize the base, don't invest in the corpus" thesis.

- **Free tier:** food diary, weight tracking, ads, limited to core logging.
- **The paywall sits exactly at barcode scanning** (Phase 1's finding, confirmed) — the single most reliable non-crowdsourced input method a free user has is locked behind Premium.
- Premium also unlocks macro-level targets, meal-plan features, and ad removal.
- Premium+ (top tier) adds deeper analytics/insights.

Evidence tag: [C] — pricing figures are consistent across multiple independent trackers, though none of them are MyFitnessPal's own pricing page (paywalled behind app-store region logic), so treat exact figures as "as reported," not primary-sourced.

## Business model and revenue mechanics

- 2023 revenue reported at ~$310M, primarily subscriptions **[C]** ([Business of Apps](https://www.businessofapps.com/data/myfitnesspal-statistics/)).
- Reported 5.7M free monthly active users in the US alone, visiting the app ~5x/day on average **[C]** (same source) — this is the ad-inventory logic behind the 2025/2026 ad network launch: high-frequency, high-intent food-logging visits are valuable ad real estate.
- Explicit strategic framing from ownership: "Francisco Partners' goal is financial return — either through improved profitability, a future sale, or an IPO" **[C]** (paraphrased across sourcing, not a direct quote from Francisco Partners itself — treat as informed press characterization, not a company statement).
- Revenue mix is shifting toward a third leg (advertising) on top of subscriptions and (historically) data/analytics licensing — this is new information beyond Phase 1, which only covered subscription/paywall mechanics. It reinforces rather than contradicts the "monetize, don't curate" reading: an ad network is additive extraction from the existing user base, not investment in the underlying data asset.

## Food data sources

Crowdsourced entries (unpaid user submission, the core growth engine per Phase 1) + branded/restaurant partnerships + (post-acquisition) Cal AI's photo-recognition layer sitting on top of the same 20M-entry database. No evidence found of a verified-only or curator-review pipeline analogous to Cronometer's — consistent with Phase 1's framing that MFP's database is an asset built by volume, not verification.

## Platform coverage

iOS, Android, web, Apple Watch confirmed; Wear OS status contested (see above). No evidence of a native desktop app beyond the web client.

## Known technical architecture

This is a genuine evidence gap, and it is worth stating plainly: **MyFitnessPal has no public engineering blog with current technical detail**, and its developer/API program is effectively closed — "MyFitnessPal is not accepting requests for API access at this time," with API access limited to previously-approved integration partners contacted via api@myfitnesspal.com **[B]** (stated on MFP's own developer portal, per search results). Third-party "system design" writeups (e.g., a Prezi deck) exist but are unofficial reverse-engineering, not documented architecture, and are not reliable enough to cite as fact. **Absence of evidence finding:** there is no publicly documented tech stack, database schema, or infrastructure description from MyFitnessPal itself as of 2026. Treat any specific architecture claim about MFP found elsewhere as speculation unless traced to an official source.

## Funding and ownership history

- Founded independently; acquired by **Under Armour in 2015 for $475M** (final adjusted transaction value reported at $474.0M) **[B]** ([Forbes](https://www.forbes.com/sites/maggiemcgrath/2015/02/04/under-armour-posts-31-revenue-growth-buys-myfitnesspal-for-475-million/), [TechCrunch](https://techcrunch.com/?p=2068026)). This was part of a ~$710M UA digital-fitness buying spree that also included Endomondo ($85M, Jan 2015) and MapMyFitness.
- Under Armour sold MyFitnessPal to **Francisco Partners (private equity) in 2020 for $345M** — a **$130M loss** on the 2015 purchase price **[B]** ([TechCrunch](https://techcrunch.com/?p=2068026), [SportsPro](https://www.sportspromedia.com/news/under-armour-myfitnesspal-sale-francisco-partners-q4-2020-financial-results/)).
- Since 2020: Francisco Partners ownership, oriented to "financial return... through improved profitability, a future sale, or an IPO" per press characterization.
- **March 2026: MyFitnessPal acquires Cal AI**, the teen-built (two high-school-age founders, Zach Yadegari and a co-founder) viral AI calorie-counting app. Deal reportedly closed December 2025, publicized March 2026. Cal AI had >15M downloads, reportedly >$50M ARR, and its ~7-person team (including founders) joined MyFitnessPal. Cal AI is being kept as an **independent, separately-branded app**, now integrated with MFP's food database on the backend, rather than folded into the MyFitnessPal app itself **[B]** ([TechCrunch](https://techcrunch.com/2026/03/02/myfitnesspal-has-acquired-cal-ai-the-viral-calorie-app-built-by-teens/), [Forbes](https://www.forbes.com/sites/zoyahasan/2026/03/06/this-u30-kept-launching-apps-until-one-worked-then-sold-it-to-myfitnesspal/)). Note the structural parallel to MacroFactor's separate-app strategy for Workouts (see macrofactor.md) — two very differently-motivated companies both concluded that bolting a new capability onto the flagship app was not the way to ship it, though MFP's reason (Gen-Z brand distance from a legacy app) looks different from MacroFactor's (clean data model, no forced feature coupling).

## Recent product direction (last ~24 months)

1. Price increases (roughly doubling Premium/Premium+ pricing vs. Under Armour-era levels).
2. Ad Network launch (2025/2026) — treating the free user base as a monetizable audience for brand advertising, not just a subscription funnel.
3. "Today" tab redesign — user-facing UX change reported to have hurt navigability (Phase 1 finding, unverified further here but not contradicted).
4. Cal AI acquisition (Dec 2025 close / March 2026 announcement) — inorganic acquisition of AI-native photo-logging capability rather than in-house build, run as a parallel branded app.

## What they have publicly said they will NOT build

**Evidence gap.** No MyFitnessPal staff statement, changelog note, or founder/executive interview was found in which the company explicitly commits to *not* building a specific feature. The clearest inferable "will not" is behavioral rather than declared: MyFitnessPal has not opened barcode scanning to free users, has not published API access broadly, and chose acquisition over in-house build for AI food-photo logging — but these are inferences from **absence of action**, not direct quotes, and should not be cited as if MFP said so on the record. Flag this as a genuine gap for the architect: MyFitnessPal, unlike MacroFactor or Cronometer, has left no public trail of stated product philosophy or declined feature requests found in this research pass.

## Adaptive-TDEE / goal-adjustment algorithm

**None found.** No evidence that MyFitnessPal has an adaptive expenditure-learning algorithm comparable to MacroFactor's or Carbon Diet Coach's. MFP's calorie/macro targets appear to be static, formula-derived (age/height/weight/activity-level style calculation) at setup, adjusted only when the user manually changes their profile or goal — this is consistent with, and does not update, Phase 1's framing that adaptive TDEE is specifically the MacroFactor/Carbon differentiator that MFP has not replicated.

## Sources

- https://www.forbes.com/sites/maggiemcgrath/2015/02/04/under-armour-posts-31-revenue-growth-buys-myfitnesspal-for-475-million/
- https://techcrunch.com/?p=2068026
- https://www.sportspromedia.com/news/under-armour-myfitnesspal-sale-francisco-partners-q4-2020-financial-results/
- https://www.businessofapps.com/data/myfitnesspal-statistics/
- https://nutriscan.app/blog/posts/myfitnesspal-pricing-2026-guide-2ff09c399a
- https://nutrola.app/en/blog/why-did-myfitnesspal-increase-their-price
- https://finance.yahoo.com/news/myfitnesspal-launches-advertising-media-network-130000188.html
- https://techcrunch.com/2026/03/02/myfitnesspal-has-acquired-cal-ai-the-viral-calorie-app-built-by-teens/
- https://www.forbes.com/sites/zoyahasan/2026/03/06/this-u30-kept-launching-apps-until-one-worked-then-sold-it-to-myfitnesspal/
- https://www.beneschlaw.com/news/benesch-advises-myfitnesspal-on-acquisition-of-cal-ai-the-viral-calorie-app/
- https://thenextweb.com/news/myfitnesspal-acquires-cal-ai-the-viral-calorie-tracking-app-built-by-teens
- https://support.myfitnesspal.com/hc/en-us/articles/4407940713869-Wear-OS-App
- https://9to5google.com/2023/10/05/myfitnesspal-wear-os-app/
