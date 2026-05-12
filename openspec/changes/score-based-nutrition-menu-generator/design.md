## Context

The app already stores profiles in `person_profiles`, ingredients in `ingredients`, recipes as `dishes`, recipe ingredients in `recipe_ingredients`, and generated rotating menus in `rotating_menus` plus related day/meal/portion tables. The current generator in `server/api/rotating-menu-generate.post.ts` is effective for rotating weekly blocks, but it mixes orchestration, macro calculation, scaling, persistence, and logging in one large route.

This change adds a score-based generator that works from existing curated recipes and real ingredient nutrition. It must not invent macros and must stay compatible with the existing rotating menu UI and data model.

## Goals / Non-Goals

**Goals:**
- Calculate recipe macros only from confirmed recipe ingredients and complete ingredient nutrition.
- Convert profile targets into kcal, protein grams, carbs grams, fat grams, and tolerance bounds in one reusable module.
- Generate daily, weekly, and monthly menus by scoring candidate recipe combinations and serving multipliers.
- Persist generated results with recipe selections, multipliers, total macros, score, compliance status, and diagnostics.
- Aggregate shopping-list quantities from persisted generated meals.
- Keep generation bounded and deterministic where possible.

**Non-Goals:**
- No AI-generated recipes or macro values.
- No removal of the existing weekly/rotating menu workflow.
- No guarantee that every day meets tolerance when available recipes make that impossible.
- No broad UI redesign beyond clear functional presentation.

## Decisions

1. Reuse existing domain tables instead of introducing parallel recipe tables.
   - Use `dishes` as recipes and `recipe_ingredients` as recipe ingredients.
   - Add missing recipe metadata to `dishes` only if needed: `meal_type`, `servings`, `tags`.
   - Alternative considered: create `recipes` and `generated_menus` from scratch. Rejected initially because it duplicates existing curation, ingredients, and generated-menu flows.

2. Add shared nutrition modules before changing generation.
   - Create `utils/nutrition/calculateRecipeMacros.ts` for ingredient-based macro totals.
   - Create `utils/nutrition/profileTargets.ts` for profile target conversion and tolerance validation.
   - Create `utils/nutrition/menuScoring.ts` for scoring and compliance.
   - Rationale: prevents macro math from staying duplicated in route handlers.

3. Implement generation as a server service.
   - Create `server/services/menuGenerator.ts` and keep route handlers thin.
   - The service loads candidates, computes macros, tests bounded combinations, scores them, and returns a preview or persisted payload.
   - Rationale: makes unit testing feasible without Supabase route plumbing.

4. Use deterministic bounded search.
   - Sort candidates by approximate compatibility with target meal macro ranges.
   - Limit to at most 30 recipes per meal type, with lower internal top-N if needed for combination loops.
   - Test serving multipliers `[0.75, 1, 1.25, 1.5]`.
   - Generate stable choices by score, then deterministic tie-breakers such as recipe id/name.

5. Preserve generated result even outside tolerance.
   - Every generated day returns the best score found, `meetsTargets`, deviations, and tolerance diagnostics.
   - Invalid input data, such as missing nutrition or unconfirmed ingredients, excludes a candidate and reports diagnostics; it does not invent values.

## Data Model

Preferred minimal migration path:
- `person_profiles.tolerance_percent numeric(5,2) not null default 10` with reasonable check bounds.
- `dishes.meal_type text null check (meal_type in ('desayuno','comida','cena','snack'))` if recipe meal type is not otherwise available.
- `dishes.servings numeric(8,2) not null default 1` if serving base is needed beyond existing `servings_base`.
- `dishes.tags text[] not null default '{}'` for variety scoring if missing.
- Add scoring/compliance columns to generated day rows if reusing `rotating_menu_days`: `score numeric`, `meets_targets boolean`, `diagnostics jsonb`.

If reusing `rotating_menus` creates UI or naming confusion, a later phase may introduce `generated_menus`, `generated_menu_days`, and `generated_menu_meals`. That should be a documented decision before implementation; the safer first phase is to extend current tables minimally.

## API Shape

- `POST /api/nutrition-menu-generate`: generate a preview for profile, period, date range, and options.
- `POST /api/nutrition-menu-save`: persist a generated preview, unless generation and save are intentionally combined.
- `GET /api/nutrition-menu-detail`: load generated menu with day totals and meals.
- `GET /api/nutrition-menu-shopping-list`: aggregate persisted meal ingredients in grams/kg.

Existing `rotating-menu-generate` remains unchanged until shared utilities are introduced safely.

## Risks / Trade-offs

- Search can become expensive with many recipes -> cap candidates per meal type, pre-sort by approximate compatibility, and log candidate counts.
- Existing recipes may lack meal type -> infer from `weekly_meals` where safe or require user assignment in UI before using recipe as candidate.
- Some recipes may be incomplete -> exclude candidates with diagnostics rather than generating bad macros.
- Reusing `rotating_menus` may blur old/new generator concepts -> add explicit metadata/period fields if needed or split tables in a later phase.
- Multi-profile generation can complicate scoring -> first implementation should target one selected profile, then expand to multiple profiles once daily scoring is stable.

## Migration Plan

1. Add nullable/defaulted fields with non-destructive migrations.
2. Backfill `tolerance_percent` to `10` for existing profiles.
3. Backfill recipe `meal_type` from existing `weekly_meals` usage only when a recipe has a clear single meal type; otherwise leave unset and exclude until assigned.
4. Deploy utility/tests first, then APIs, then UI.
5. Rollback by disabling the new UI/API path; migrations are additive and do not remove current behavior.

## Open Questions

- Should scored generated menus be stored in existing `rotating_menus` tables or new `generated_menus` tables after the first implementation pass?
- Should weekly/monthly generation optimize averages globally after daily picks, or only apply repetition penalties day by day initially?
- Should snack be enabled immediately, or only after recipe meal types support it in UI?
