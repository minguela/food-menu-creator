## 1. Scaling Utility

- [x] 1.1 Add density bucket and density factor helpers to `rotating-portion-scaling`.
- [x] 1.2 Add a helper to calculate ingredient final quantity from base quantity, meal multiplier and density metadata.
- [x] 1.3 Cover fallback from `kcal_per_100g` when `caloric_density_level` is missing.

## 2. Generator Integration

- [x] 2.1 Use density-aware ingredient scaling in root `server/api/rotating-menu-generate.post.ts`.
- [x] 2.2 Apply the same integration in `menu-web/server/api/rotating-menu-generate.post.ts`.
- [x] 2.3 Preserve final macro/kcal calculation from actual final ingredient quantities.
- [x] 2.4 Include density diagnostics in generated ingredient output for debugging.

## 3. Regression Tests

- [x] 3.1 Add Node tests proving very caloric ingredients scale less than normal/low-density ingredients.
- [x] 3.2 Add Playwright tests for density-aware scaling behavior.
- [x] 3.3 Run `npm run test:rotating`.
- [x] 3.4 Run `npm run test:rotating:playwright`.
- [x] 3.5 Run `npm run build`.

## 4. Documentation And Archive

- [x] 4.1 Update `task_log.md` with the density-aware scaling work.
- [x] 4.2 Sync main OpenSpec spec and validate specs.
- [x] 4.3 Archive completed OpenSpec change.
