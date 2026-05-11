## Why

The rotating menu generator fails with `recipe_name_not_found` for compound meals like `"Pescado blanco a elegir + ensalada de hoja verde"`. The generator treats the entire compound string as a single dish name and looks it up in the `dishes` table, where only individual recipes exist.

The `compound_day_meals` table already exists to link two individual dishes into a compound meal, and `weekly_meals` already stores `compound_day_id`. However, `rotating-menu-generate.post.ts` completely ignores this mechanism, causing compound meals to be discarded and the entire generation to fail.

## What Changes

1. **Load `compound_day_id`** from `weekly_meals` in the rotating menu generator.
2. **Query `compound_day_meals`** with their associated `first_dish` and `second_dish` recipes.
3. **Resolve compound meals**: when a meal has `compound_day_id`, look up both constituent dishes individually instead of matching the combined name.
4. **Combine ingredients**: for portion calculation and shopping lists, merge the ingredient bases of both constituent dishes.
5. **Update validation**: validate both recipes individually; a compound meal is valid if both dishes have valid recipes.

## Capabilities

### New Capabilities
- `rotating-menu-compound-meals`: Support for compound meals (two dishes combined with `+`) in the rotating menu generation pipeline, including lookup, validation, ingredient combination, and portion calculation.

## Non-Goals

- Changing how compound meals are stored in `weekly_meals` — the data model is correct.
- Modifying the OCR processor or Telegram bot — they already handle compound days correctly.
- Adding UI changes — this is a backend-only fix.

## Impact

- **API**: Significant changes to `rotating-menu-generate.post.ts` (~100 lines).
- **Database**: No schema changes required; `compound_day_meals` and `compound_day_id` already exist.
- **Frontend**: None.
- **Shopping lists**: Will work automatically once ingredient bases are combined correctly.
