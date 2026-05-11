## Why

Rotating generation currently fails with 422 for valid low-carb meals (for example fish-only dishes) because validation incorrectly requires every macro (protein/carbs/fat) to be greater than zero.

## What Changes

- Relax macro validation for non-special meals so zero carbs is allowed when kcal and at least one macro are valid.
- Keep blocking for truly invalid meals: no ingredients, no kcal, all macros zero, or nutrition pending.
- Improve validation metadata clarity for debugging.

## Capabilities

### New Capabilities
- `rotating-meal-macro-validation`: robust validation for naturally zero-carb/non-zero-protein meals.

### Modified Capabilities
- None.

## Impact

- Affected API: `menu-web/server/api/rotating-menu-generate.post.ts`.
- No DB changes.

## Non-goals

- No changes to target macro computation or scaling algorithm.
- No changes to special meal behavior.
