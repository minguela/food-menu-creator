## Why

The `/api/rotating-menu-generate` endpoint fails with HTTP 422 because dishes stored in the `dishes` table cannot be matched when their `normalized_name` contains accented characters (á, é, í, ó, ú, ñ), but the API query removes accents before searching. This causes 30+ meals to be discarded as `recipe_name_not_found`, breaking the rotating menu generation.

The root cause: `normalizeDishName()` in the API strips accents using Unicode NFD normalization + regex, but the database's `normalized_name` column was populated with `lower(trim(name))` which **preserves accents**.

## What Changes

1. **Create DB function `normalize_dish_name(text)`** — PostgreSQL function mirroring the JS `normalizeDishName()` logic (lowercase, trim, remove accents via `translate()`).
2. **Create before-write trigger on `dishes`** — Automatically populates `normalized_name` on INSERT/UPDATE.
3. **Run data migration** — Backfill existing `dishes.normalized_name` with accent-stripped values.
4. **Verify** — Confirm recipes with accented names now match during rotating menu generation.

## Capabilities

### New Capabilities
- `dish-normalized-name`: Normalization of dish names with accent stripping enforced at the database level via a reusable function and trigger.

## Non-Goals

- Fixing `recipe_not_validated` failures — separate concern.
- Changing the API's `normalizeDishName()` function — the JS function is correct; the DB must match it.

## Impact

- **Database**: New function, trigger, and migration on `public.dishes`. Minimal risk — migration updates existing data in place.
- **API**: No code changes needed in `rotating-menu-generate.post.ts` — it will start matching once DB data is fixed.
- **Frontend**: None affected.
