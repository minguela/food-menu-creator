## Why

Rotating menu generation currently returns `422` when daily kcal/protein totals are outside tolerance, which prevents users from seeing the generated menu. The desired behavior is to persist and display the menu, while surfacing nutrition shortfalls as warnings for later correction.

## What Changes

- Convert day-level kcal/protein tolerance failures from blocking errors to warnings.
- Preserve diagnostics in logs and API response under `warnings.day_nutrition_violations`.
- Keep hard failures only for structurally invalid meals, missing ingredients/nutrition, or non-positive macros.
- Add regression coverage so tolerance warnings cannot reintroduce `422` blocking.

## Capabilities

### New Capabilities
- `rotating-menu-nutrition-warnings`: Non-blocking nutrition tolerance warnings for rotating menu generation.

### Modified Capabilities

## Impact

- Affects `server/api/rotating-menu-generate.post.ts`, `menu-web/server/api/rotating-menu-generate.post.ts`, tests and OpenSpec task log.
- No database schema changes.

## Non-goals

- No automatic recipe quantity cleanup.
- No hiding nutrition deviations; warnings remain explicit.
