## Context

After implementing `compound_day_id` support in the rotating menu generator, compound meals that have a `compound_day_id` are now resolved correctly. However, many existing `weekly_meals` rows have compound names (`X + Y`) but `compound_day_id = null`.

The generator's current logic:
1. Tries to match the full compound name against `dishes.normalized_name` → fails
2. Checks `compound_day_id` → null, so no compound resolution
3. Discards the meal with `recipe_name_not_found`

## Goals / Non-Goals

**Goals:**
- Compound meals without `compound_day_id` are resolved by splitting the name on `+`.
- Both constituent dishes must exist in `dishes` for the compound meal to be valid.
- The virtual dish construction and validation reuse the existing compound meal logic.

**Non-Goals:**
- Auto-creating `compound_day_meals` rows.
- Changing the OCR processor or Telegram bot.

## Decisions

### 1. Split dish_name by `+` as fallback
**Chosen:** When `linkedDish` is null and `compound_day_id` is null/invalid, check if `dish_name` contains `+`. If so, split by `/\s*\+\s*/`, normalize each part, look up each part in `dishByNormalizedName`, and construct a virtual compound dish.

**Rationale:** Handles the case where `compound_day_id` was never set. Minimal code addition.

### 2. Reuse existing virtual dish construction
**Chosen:** The same virtual dish object format used for `compound_day_id` resolution will be used for the name-splitting fallback.

**Rationale:** Consistent handling. The validation loop already knows how to process virtual compound dishes.

### 3. No auto-linking of compound_day_id in weekly_meals
**Chosen:** Do not UPDATE `weekly_meals.compound_day_id` during generation.

**Rationale:** The generator should be read-only for source data. Data cleanup should be a separate migration or admin task.

## Risks / Trade-offs

- **[Risk]** False positives for names that legitimately contain `+` (unlikely in dish names).
- **[Risk]** If one constituent dish is missing, the entire compound meal is discarded — but this is correct behavior.
- **[Trade-off]** Name-based matching is less reliable than `compound_day_id` FK — but it's the only option for legacy data.

## Open Questions

None.
