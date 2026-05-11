## Why

Rotating menu portions currently scale every ingredient in a dish by the same multiplier, so oil, rice, vegetables and lean protein grow together even though their kcal/100g are very different. Per `PROJECT_CONTEXT.md`, personalized menus should make nutritional sense: high-density ingredients must grow more cautiously while low-density ingredients can absorb more volume.

## What Changes

- Add density-aware ingredient scaling for normal rotating meals.
- Use `caloric_density_level` and `kcal_per_100g` to assign ingredient growth weights.
- Keep base quantities as minimums, but distribute extra portion growth unevenly by density.
- Preserve existing hard failures for invalid nutrition/ingredients and warning behavior for day-level target misses.
- Add Node and Playwright regression tests proving high-density ingredients scale less than low-density ingredients.

## Capabilities

### New Capabilities
- `caloric-density-ingredient-scaling`: Density-aware per-ingredient quantity distribution during rotating menu generation.

### Modified Capabilities

## Impact

- Affects `utils/rotating-portion-scaling.js`, root and `menu-web` rotating generators, package scripts/tests and OpenSpec/task log.
- No database schema changes.

## Non-goals

- No recipe data rewrite or automatic curation.
- No exact optimizer/linear programming; this is deterministic weighted scaling.
