## 1. Selection Logic

- [x] 1.1 Add weekly-menu/day metadata to loaded weekly meals.
- [x] 1.2 Implement a pure planner for 7-day weekly menu blocks.
- [x] 1.3 Replace independent per-meal-type offsets with block-based day planning.
- [x] 1.4 Add optional `initialWeeklyMenuId` support to the generation payload.
- [x] 1.5 Update the planner to pin a valid initial menu first when provided.
- [x] 1.6 Shuffle remaining menus without repetition before cycling the full order.

## 2. UI

- [x] 2.1 Add a selector in `/generar` for optional initial weekly menu.
- [x] 2.2 Send `initialWeeklyMenuId` only when the user chooses one.

## 3. Verification

- [x] 3.1 Add a node test covering 15+ generated days across multiple weekly menus.
- [x] 3.2 Verify generated days preserve comida/cena from the same source day.
- [x] 3.3 Run the targeted rotating planner test.
- [x] 3.4 Add planner tests for selected initial menu, random initial fallback, and no repetition before all menus are used.
- [x] 3.5 Run targeted planner tests and Nuxt build.
