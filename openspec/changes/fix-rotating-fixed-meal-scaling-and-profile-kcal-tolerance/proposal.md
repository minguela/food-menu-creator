## Why

The rotating generator already scales curated recipe ingredients and preserves menus with nutrition warnings, but two gaps remain:

- weekly fixed meals created through `weekly_meal_ingredients` are not part of the scaling path, so their quantities stay unchanged or lose nutrition context during rotating generation;
- daily kcal validation still uses flat hardcoded ratios (`0.8` / `0.75`) instead of the tolerance configured on each selected profile.

This makes rotating menus inconsistent with the latest profile-based nutrition model documented in `task_log.md` and with the expected behavior for recurring weekly meals.

## What Changes

- Load and use `weekly_meal_ingredients` during rotating generation as a first-class ingredient base for fixed weekly meals.
- Resolve weekly fixed meal ingredients against the ingredient catalog so rotating portions can scale and compute nutrition even when no reusable `dish` recipe is linked.
- Reuse shared profile target/tolerance logic (`profileTargetsFromProfile`) in the rotating generator instead of duplicating inline kcal/macro math.
- Replace flat kcal warning thresholds with profile-specific kcal lower bounds derived from each profile's tolerance.
- Extend regression coverage for weekly fixed meal scaling and strict-vs-relaxed kcal tolerance behavior.

## Capabilities

### Modified Capabilities
- `rotating-menu-portion-scaling`: weekly fixed meal ingredient bases also participate in rotating scaling.
- `rotating-menu-nutrition-warnings`: kcal warnings are evaluated against the selected profile tolerance instead of a global hardcoded ratio.

## Non-goals

- No redesign of weekly menu creation UX.
- No change to shopping-list persistence format beyond whatever is required to carry scaled weekly fixed meal quantities correctly.
- No redefinition of protein warning rules unless implementation discovers they are inseparable from the kcal tolerance fix.

## Impact

- Likely affected code: `menu-web/server/api/rotating-menu-generate.post.ts`, `menu-web/utils/rotating-portion-scaling.js`, `menu-web/utils/nutrition/profileTargets.ts`, rotating tests, and related types if weekly-meal ingredient payloads need typing.
- No database migration is expected; this change should reuse `weekly_meal_ingredients`, `ingredients`, and existing profile fields.
