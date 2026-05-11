## Context

The rotating menu generation endpoint (`/api/rotating-menu-generate`) loads all unique dish names from the source weekly menus and queries the `dishes` table by `normalized_name`. The API query uses `normalizeDishName()` which strips accents via `String.normalize("NFD")` + regex, but the initial data migration only used `lower(trim(name))` — preserving accented characters.

The `normalize_ingredient_name()` function in migration `20260508153000_recipe_ingredients_normalization_hardening.sql` already demonstrates the correct accent-stripping pattern using `translate()`:

```sql
regexp_replace(
  translate(lower(trim(coalesce(value, ''))), 'áàäâãéèëêíìïîóòöôõúùüûñç', 'aaaaaeeeeiiiiooooouuuunc'),
  '\s+', ' ', 'g'
)
```

We will apply the same pattern to dish names.

## Goals / Non-Goals

**Goals:**
- Ensure dish name lookups succeed regardless of accented characters in the dish name.
- Enforce consistent normalization at the database level so future INSERTs/UPDATEs are always correct.
- Backfill existing data so the fix is immediate.

**Non-Goals:**
- Modifying the API's `normalizeDishName()` function — it is already correct.
- Fixing `recipe_not_validated` failures (separate root cause).
- Adding unit tests (no test suite found in codebase).

## Decisions

### 1. Use `translate()` instead of `regexp_replace` for accent stripping
**Chosen:** `translate()` with a hardcoded character mapping table, followed by `regexp_replace` for whitespace normalization.

**Rationale:** Mirrors the existing `normalize_ingredient_name()` implementation. Also matches the JS behavior where `NFD` normalization decomposes accented characters into base + combining mark, and a regex removes the combining marks.

**Alternative:** Pure `regexp_replace` with Unicode ranges — more compact but less explicit. The `translate()` approach is more readable and consistent with the ingredient function.

### 2. Create a database trigger instead of application-level enforcement
**Chosen:** BEFORE INSERT/UPDATE trigger on `dishes` table.

**Rationale:** Recipes can be created via multiple entry points (Telegram bot, Nuxt frontend, API). A DB trigger guarantees normalization regardless of entry point. The same pattern is already used for `recipe_ingredients`.

**Alternative:** Only do backfill migration — future writes could reintroduce the mismatch. A trigger is the robust solution.

### 3. One migration file vs. separate
**Chosen:** Single migration file containing function + trigger + backfill.

**Rationale:** All parts are atomic in a single transaction. No risk of partial application.

## Risks / Trade-offs

- **[Risk]** Large table scan during backfill — **Mitigation:** Run `SET statement_timeout = '5s'` per migration best practice, or do in batches if table is large.
- **[Risk]** Migration failure mid-backfill leaves partial data — **Mitigation:** All in single transaction so atomic rollback.
- **[Trade-off]** Adding a trigger to every INSERT/UPDATE on `dishes` — **Mitigation:** Minimal overhead; the `normalize_dish_name()` function is immutable and fast.

## Migration Plan

1. **New migration**: `supabase/migrations/<timestamp>_fix_dish_normalized_name_accents.sql`
   - Creates `normalize_dish_name()` function
   - Creates BEFORE INSERT/UPDATE trigger + trigger function
   - Backfills all existing `dishes.normalized_name`
2. **Apply**: `supabase db push` or migrate via CI
3. **Verify**: Retry the failing rotating menu generation request — should return 200 instead of 422

## Open Questions

None.
