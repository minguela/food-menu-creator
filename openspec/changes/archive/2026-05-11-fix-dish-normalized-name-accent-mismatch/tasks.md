## 1. Create Database Migration

- [x] 1.1 Create migration file `supabase/migrations/<timestamp>_fix_dish_normalized_name_accents.sql`
- [x] 1.2 Add `normalize_dish_name(text)` function using `translate()` + `regexp_replace`
- [x] 1.3 Add `dishes_before_write()` trigger function and BEFORE INSERT/UPDATE trigger on `dishes`
- [x] 1.4 Add backfill UPDATE for existing `dishes.normalized_name`

## 2. Verify

- [x] 2.1 Apply migration to local/database (dry-run or actual)
- [x] 2.2 Confirm the fix resolves the rotating menu generation 422 error
