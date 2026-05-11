## 1. Testable Utilities

- [x] 1.1 Extract rotating source-day completeness validation into a pure utility.
- [x] 1.2 Ensure planner utilities accept deterministic RNG for tests.
- [x] 1.3 Add fixture helpers for weekly menus, weekly meals and multi-slot days.

## 2. Local Regression Tests

- [x] 2.1 Add tests for selected initial weekly menu occupying the first 7-day block.
- [x] 2.2 Add tests for random first menu when no initial menu is selected.
- [x] 2.3 Add tests proving no weekly menu repeats before all selected menus are used.
- [x] 2.4 Add tests proving comida/cena stay together from the same source day.
- [x] 2.5 Add tests proving multiple `meal_slot` values in the same meal type are preserved.
- [x] 2.6 Add tests proving missing expected meals fail with structured diagnostics.

## 3. Supabase Live Contrast

- [x] 3.1 Add a read-only live test script that loads real `weekly_menus` and `weekly_meals` from Supabase.
- [x] 3.2 Make the live script skip clearly when required environment variables are missing.
- [x] 3.3 Assert live planned blocks preserve complete weekly menu structure without writing data.

## 4. Scripts And Documentation

- [x] 4.1 Add `test:rotating` script to run only local rotating regression tests.
- [x] 4.2 Add `test:rotating:live` script for the optional Supabase contrast.
- [x] 4.3 Document required live-test environment variables in `menu-web/README.md` or test comments.

## 5. Verification

- [x] 5.1 Run `npm run test:rotating` from `menu-web`.
- [x] 5.2 Run full `npm test` from `menu-web` when local rotating tests pass.
- [x] 5.3 Optionally run `npm run test:rotating:live` with Supabase variables configured.
