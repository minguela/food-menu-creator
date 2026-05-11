## Why

Rotating menu generation is producing impossible nutrition outputs: example days land around 54 kcal total with 1-3 g ingredient quantities while profiles target 1400-1900 kcal. Per `PROJECT_CONTEXT.md`, reliable personalized rotating menus and shopping lists are core product behavior, so fixed/base recipe quantities must be preserved and any profile scaling must be bounded by realistic nutritional targets, not by arbitrary tiny quantities.

## What Changes

- Treat confirmed recipe ingredient quantities as the minimum fixed/base portion for a dish; generation SHALL NOT reduce fixed meal quantities below recipe base values.
- Replace the current hard cap that clamps regular meal scaling to `2.5` when base kcal is tiny with validated serving calculation rules that can reach profile kcal/protein targets or fail loudly.
- Add validation that blocks persistence when calculated day totals are materially below target or ingredient quantities are implausibly small.
- Add diagnostics exposing base kcal, base ingredient grams, chosen multiplier, cap reason, and day/profile deltas.
- Add regression tests covering the reported `Jamon con tomate`, `Gazpacho`, `Pollo`, salad and fish/rice pattern so totals cannot silently collapse again.

## Capabilities

### New Capabilities
- `rotating-menu-portion-scaling`: Correct kcal, macro and ingredient quantity scaling for rotating menu generation while preserving fixed/base recipe quantities.

### Modified Capabilities

## Impact

- Affects `menu-web/server/api/rotating-menu-generate.post.ts`, rotating-menu tests, and possibly small utility extraction under `menu-web/utils/`.
- Affects persisted `rotating_menu_meal_profile_portions` and `rotating_menu_meal_profile_ingredients` values generated after the fix.
- No database schema change is expected.

## Non-goals

- No redesign of recipe curation UI.
- No automatic rewriting of existing recipe ingredient quantities unless they are invalid and must block generation.
- No post-generation patching of already persisted broken menus; users should regenerate after the fix.
