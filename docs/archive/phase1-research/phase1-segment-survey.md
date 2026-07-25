# Phase 1 Segment Survey (baseline)

> **Status:** Phase 1 baseline — six segments. Wave 1 Stream E goes much wider (~18+), one file per segment in this directory.
> Verbatim Phase 1 source archived at `04-sources/raw-notes/phase1/data-and-segments.md`.
> Sizes below are **[D]-grade estimates** and must be re-sourced.

## Phase 1 top-5 table

| Segment | Binding need | Constraint-hardness | Rough size | Reachability |
|---|---|---|---|---|
| **Eating-disorder recovery** | Must never surface calorie/weight numbers, yet still needs structured logging for a clinician or for self | **Hard** — incumbents are number-first by architecture; hiding numbers is a bolt-on toggle at best. Dedicated apps exist (Recovery Record, Pippa) proving the model, but they are clinician-facing/B2B [C] | UK ~1.25M diagnosed ED (Beat estimate) [C]; recovery-phase subset smaller | r/EDrecovery, Beat forums, therapist networks — but clinically sensitive; a solo student project should treat this as design inspiration, not a target to build clinical claims around |
| **Weight-class combat/strength athletes (cutting)** | Time-anchored plan tied to a fixed weigh-in date: water manipulation + rehydration, not a flat deficit | **Hard** — generic trackers have no concept of "make weight Friday, rehydrate Saturday"; needs date-driven sport-specific logic in the data model | UK powerlifting ~20K+ registered competitive lifters [D]; global amateur combat circuits add many more | Very reachable — tight gym/Discord/Reddit communities. Dedicated apps exist (CutCoach, CUTCHECK): demand proven, competition present |
| **Vegans tracking protein quality (leucine/EAA)** | Per-meal leucine threshold (~2–3g) and full EAA profile, not total grams — [B] evidence that ~half of vegans meeting protein totals still miss lysine/leucine | **Hard** — requires an amino-acid-profile-per-ingredient data layer, rarer and harder to source than macros; a genuine data-architecture differentiator | UK vegan adults ~1–3% (~600K–1.8M) [D]; strength-training subset plausibly tens of thousands | r/vegangainz, r/PlantBasedDiet, vegan bodybuilding communities — small but highly engaged and vocal about this exact gap |
| **GLP-1 medication users** | Protein/micronutrient adequacy at 800–1,200 kcal is the binding constraint, since up to ~40% of weight lost can be lean mass [C] | **Medium** — needs a protein-first, deficiency-warning UI rather than calorie-first (an architectural flip), but several apps (MyNetDiary, MeAgain) are already retrofitting, so less defensible | Huge and growing — millions across UK/US; fastest-growing of the six | Very reachable (r/Ozempic, r/Semaglutide, Facebook groups) but the most contested niche |
| **CKD / diabetes micronutrient ceilings** | Hard ceilings (potassium, phosphorus, sodium) tied to disease stage — architecture must warn on *excess*, not track toward a deficit | **Hard** but clinically loaded — opposite UX pattern from every gamified tracker, and error carries real health/liability risk for a non-clinician-reviewed app | CKD ~3.5M UK adults; diabetes ~4.3M UK [D] | Harder to reach — patients use clinician-issued resources; high trust barrier for an unvetted solo app |

## Considered and rejected in Phase 1

- **Masters athletes (40+):** need is real (higher per-meal protein, longer recovery [B]) but it is a *soft* preference — a custom target or slider handles it; no incumbent architecture actively fights it, so no defensibility. **Wave 1 note:** Phase 2 brief asks specifically about 50+, where the physiological case (anabolic resistance, sarcopenia) may be materially stronger than the 40+ framing Phase 1 rejected. Re-examine rather than inherit the rejection.
- **General/generic weight-loss dieters:** no hard constraint distinguishes them from MyFitnessPal's core audience — the most saturated, least defensible segment possible.
- **Bodybuilding/physique show-prep:** substantially overlaps weight-class cutting (same date-anchored logic) — not distinct enough to separate.

## What Phase 1 never considered

Wave 1 Stream E must cover, at minimum: pregnant and postpartum lifters; perimenopausal and menopausal women; T1D, IBD, coeliac; ADHD (logging friction is categorically different); shift workers and irregular schedules; adaptive athletes and wheelchair users; religious fasting practitioners (Ramadan, Orthodox fasts); high-altitude and extreme-environment athletes; medical caloric surplus (cachexia, illness recovery); tactical/occupational populations (military, fire service); youth athletes and safeguarding — plus any segment the research itself surfaces.
