## Why

The current rotating menu flow calculates portions from existing weekly menu blocks, but it does not yet choose daily recipes by nutritional score, profile tolerance, and deterministic serving multipliers. Users need generated daily, weekly, and monthly menus whose final macros come only from real recipe ingredients and quantities, not inferred or invented values.

## What Changes

- Add a score-based nutrition menu generator that selects existing recipes by meal type and evaluates real macro totals against each profile target.
- Centralize recipe macro calculation from `recipe_ingredients` plus `ingredients` and profile target conversion from kcal/protein/carbs/fat settings.
- Add profile tolerance support and daily compliance diagnostics for kcal, protein, carbs, and fat.
- Add fixed serving multiplier candidates (`0.75`, `1`, `1.25`, `1.5`) and scale meal macros and shopping quantities proportionally.
- Persist generated menu days/meals with total macros, score, selected recipes, multipliers, and warnings.
- Extend APIs and UI so users can generate, inspect, save, reopen, and build shopping lists from scored menus.
- Add focused unit tests for macro calculation, targets, scoring, tolerance validation, best-combination selection, and multiplier scaling.

## Capabilities

### New Capabilities
- `nutrition-menu-generator`: Covers nutrition profile targets, recipe macro calculation, scoring, tolerances, deterministic daily/weekly/monthly generation, persistence, and shopping-list aggregation for scored generated menus.

### Modified Capabilities
- None. Existing rotating-menu behavior is preserved; implementation can reuse shared utilities without changing those specs' requirements.

## Non-goals

- Do not generate recipes or ingredient macros with AI.
- Do not remove the existing rotating menu workflow.
- Do not require perfect daily target matching when the best available combination is outside tolerance.
- Do not replace manual recipe/ingredient curation.

## Impact

- Supabase migrations for profile tolerance and generated-day scoring metadata, plus optional recipe metadata if missing (`meal_type`, `servings`, `tags`).
- Nuxt server services/routes for generation, persistence, detail, and shopping-list aggregation.
- Shared TypeScript nutrition utilities and tests.
- UI updates in generation/config/detail/shopping screens while preserving current flows documented in `PROJECT_CONTEXT.md`.
