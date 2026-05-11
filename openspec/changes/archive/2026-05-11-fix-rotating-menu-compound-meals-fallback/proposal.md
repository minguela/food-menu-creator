## Why

The rotating menu generator fails for compound meals like `"Pescado blanco a elegir + ensalada de hoja verde"` even after adding `compound_day_id` support, because the `weekly_meals` row has `compound_day_id = null`. The compound day relationship was never established when the meal was created.

The generator must fall back to splitting the `dish_name` by `+` and looking up each individual dish when:
1. The dish is not found by its full name, AND
2. The name contains `+`, AND
3. Either `compound_day_id` is null or the compound day lookup fails

## What Changes

1. **Add name-based fallback** in the rotating menu generator: when a meal's dish is not found and the name contains `+`, split by `+`, normalize each part, look up individual dishes, and construct a virtual compound dish.
2. **Auto-link compound_day_id** (optional enhancement): when a compound meal is detected by name, query `compound_day_meals` by name or by constituent dishes and update `weekly_meals.compound_day_id`.
3. **No database schema changes** required.

## Capabilities

### New Capabilities
- `rotating-menu-compound-fallback`: Fallback mechanism for compound meals without `compound_day_id`, using name splitting.

## Non-Goals

- Modifying how compound meals are created in the OCR processor or Telegram bot.
- Database migrations.

## Impact

- **API**: Changes to `rotating-menu-generate.post.ts` (add fallback logic in the recipe matching loop).
- **Database**: Optional UPDATE of `weekly_meals.compound_day_id`.
- **Frontend**: None.
