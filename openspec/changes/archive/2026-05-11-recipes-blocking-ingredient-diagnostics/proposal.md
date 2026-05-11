## Why

When rotating generation fails with `missing_ingredient_link` or related recipe curation errors, users cannot easily identify failing ingredients from the recipes workflow itself.

## What Changes

- Add explicit diagnostics in recipes to show which ingredients are blocking curation/generation.
- Provide quick actions from recipes to fix missing link/nutrition issues ingredient-by-ingredient.
- Surface blocking status in recipe cards and edit panel without requiring backend log digging.

## Capabilities

### New Capabilities
- `recipes-blocking-ingredient-visibility`: visibility and fix guidance for ingredients causing recipe blocking states.

### Modified Capabilities
- None.

## Impact

- Affected frontend: `menu-web/pages/recipes.vue` and related helper APIs.
- Optional API extension for diagnostics payload if current data is insufficient.

## Non-goals

- No change to generation nutrition algorithm.
- No redesign of rotating job execution.
