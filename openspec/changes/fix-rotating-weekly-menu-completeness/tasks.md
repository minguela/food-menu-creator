## 1. Database Model

- [x] 1.1 Add a Supabase migration for `rotating_menu_meals.meal_slot smallint not null default 1`.
- [x] 1.2 Replace `unique_rotating_day_meal` with `unique_rotating_day_meal_slot` on `(rotating_menu_day_id, meal_type, meal_slot)`.
- [x] 1.3 Add/update an index for loading rotating meals by day, meal type and slot.

## 2. Source Meal Planning

- [x] 2.1 Select `meal_slot` from `weekly_meals` in `rotating-menu-generate.post.ts`.
- [x] 2.2 Update `buildRotatingWeeklyMenuBlocks` to sort and return meals by `meal_type` and `meal_slot`.
- [x] 2.3 Ensure chosen weekly menu order remains random without repetition, except optional selected first menu.
- [x] 2.4 Include source weekly menu/day metadata in generated day diagnostics.

## 3. Completeness Validation

- [x] 3.1 Build expected source-day meal keys from selected Supabase `weekly_meals` after validity filtering.
- [x] 3.2 Validate generated day meals against expected `weekly_menu_id`, `day_number`, `meal_type`, `meal_slot` and `dish_name`.
- [x] 3.3 Fail generation before persistence when any expected meal is missing or replaced.
- [x] 3.4 Return/log diagnostics with weekly menu, source day, meal type, slot, dish name and discard reason.

## 4. Persistence And Loading

- [x] 4.1 Remove the current deduplication by `meal_type` before saving rotating meals.
- [x] 4.2 Persist `meal_slot` for each row in `rotating_menu_meals`.
- [x] 4.3 Update meal ID mapping for portions/ingredients to include `meal_slot`.
- [x] 4.4 Update rotating menu detail loading to order by `meal_type` and `meal_slot`.
- [x] 4.5 Confirm shopping-list generation handles all persisted slot rows without dropping any.

## 5. UI And Verification

- [x] 5.1 Display multiple dishes in the same meal type in generated and detail views without overwriting keys.
- [x] 5.2 Verify a generation starting with menu 4 produces days 1-7 from menu 4 only.
- [x] 5.3 Verify days 8-14 use another complete weekly menu and no menu repeats before all selected menus are used.
- [x] 5.4 Run targeted rotating tests and `npm run build` from `menu-web`.
