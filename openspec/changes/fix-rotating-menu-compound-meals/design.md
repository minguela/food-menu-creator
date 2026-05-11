## Context

The rotating menu generator (`menu-web/server/api/rotating-menu-generate.post.ts`) currently:
1. Loads `weekly_meals` without selecting `compound_day_id`
2. Collects unique `dish_name` strings and queries `dishes` by `normalized_name`
3. Matches each meal to a single dish; fails for `"X + Y"` compound names
4. Validates recipe completeness per dish
5. Calculates portions based on a single dish's ingredient base

The `compound_day_meals` table (migration `20260507100000_compound_day_meals.sql`) stores:
- `first_dish_id` → references `dishes`
- `second_dish_id` → references `dishes`
- `name` → the combined display name

`weekly_meals` has `compound_day_id` FK to this table.

## Goals / Non-Goals

**Goals:**
- Compound meals are correctly resolved to their two constituent dishes during rotating menu generation.
- Both constituent recipes are validated individually.
- Ingredient bases are combined for portion calculation and shopping lists.
- The generation no longer fails with `recipe_name_not_found` for compound meals.

**Non-Goals:**
- No DB schema changes.
- No changes to how compound meals are created or stored.
- No frontend changes.

## Decisions

### 1. Use `compound_day_id` as the primary resolution mechanism
**Chosen:** Load `compound_day_id` from `weekly_meals`, query `compound_day_meals` with `first_dish` and `second_dish`, and build a lookup map by `compound_day_id`.

**Rationale:** This is the canonical, structured way. The OCR processor and monthly menu generator already use this.

**Fallback:** If `compound_day_id` is null but `dish_name` contains `+`, we could split by `+` and try to match individual names. This is **out of scope** for now — we rely on the structured FK.

### 2. Represent a compound meal as a virtual "dish" object
**Chosen:** When a meal has a compound day, construct a virtual dish object that combines both dishes' IDs, names, and ingredient bases.

**Rationale:** This minimizes changes to the downstream validation and portion calculation logic, which expects a single `linkedDish` object.

**Virtual dish structure:**
```ts
{
  id: `${firstDish.id}:${secondDish.id}`, // synthetic ID
  name: `${firstDish.name} + ${secondDish.name}`,
  normalized_name: normalizeDishName(`${firstDish.name} + ${secondDish.name}`),
  recipe_status: combinedStatus, // 'complete' only if both are complete
  is_special: firstDish.is_special || secondDish.is_special,
  special_kcal_reserved: Math.max(firstDish.special_kcal_reserved || 0, secondDish.special_kcal_reserved || 0),
  _compound: true,
  _firstDish: firstDish,
  _secondDish: secondDish,
}
```

### 3. Combine ingredient bases for portion calculation
**Chosen:** When computing `ingredientBase` for a compound meal, concatenate the ingredient lists from both dishes and sum quantities for identical ingredients by `normalized_name`.

**Rationale:** The shopping list and portion multiplier logic expect a flat list of ingredients. Summing identical ingredients prevents duplicates in the shopping list.

### 4. Validation: both dishes must have valid recipes
**Chosen:** A compound meal is considered valid only if both constituent dishes have `recipe_status === 'complete'` (or `'not_required'` for special meals).

**Rationale:** If one dish is missing ingredients, the entire compound meal is incomplete.

### 5. No DB migration needed
**Chosen:** Reuse existing `compound_day_meals` and `compound_day_id` columns.

**Rationale:** The data model already supports this. The bug is purely in the generator's resolution logic.

## Risks / Trade-offs

- **[Risk]** Synthetic ID (`firstId:secondId`) could conflict with real dish IDs — **Mitigation:** Use a prefix like `compound:` or a delimiter unlikely to appear in UUIDs.
- **[Risk]** Existing code that checks `linkedDish.id` against `validRecipeById` will break — **Mitigation:** Add both constituent IDs to `validRecipeById` and update the check.
- **[Trade-off]** Virtual dish adds complexity — **Mitigation:** Keep it localized to the resolution phase; downstream code mostly unchanged.

## Open Questions

None.
