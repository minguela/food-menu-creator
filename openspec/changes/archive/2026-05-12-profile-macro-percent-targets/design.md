## Context

`person_profiles` currently stores `daily_kcal_target`, `daily_protein_target`, `fat_pct_target`, `carbs_pct_target`, and `tolerance_percent`. The configuration screen still exposes global objectives and profile protein grams as editable fields. The nutrition generator now relies on `profileTargetsFromProfile`, so profile target semantics must be made explicit and centralized before further generator work.

The desired model is profile-owned macro percentages: users edit kcal, carbs %, and fat % per profile; protein % is deduced and saved; protein grams remain stored for compatibility but are calculated.

## Goals / Non-Goals

**Goals:**
- Add `protein_pct_target` to profiles and enforce `protein + carbs + fat = 100`.
- Calculate `protein_pct_target = 100 - carbs_pct_target - fat_pct_target` in UI/server-side persistence paths.
- Calculate `daily_protein_target = daily_kcal_target * protein_pct_target / 100 / 4` and keep it stored.
- Remove/disable global objective editing from `pages/config.vue` so profiles are the source of truth.
- Show per-profile macro percentages and gram conversions with app-consistent styling.
- Update utilities/tests so generated menus consume calculated protein grams from profile percentages.

**Non-Goals:**
- Removing `daily_protein_target` from the database.
- Allowing users to directly edit protein percentage.
- Changing recipe macro calculation, scoring, or menu persistence behavior beyond target inputs.
- Maintaining global objectives as a user-facing editor.

## Decisions

1. Store protein percentage explicitly even though it is deduced.
   - Rationale: makes profile snapshots and debugging clear, and allows DB constraints to validate the full split.
   - Alternative: calculate protein % only at runtime. Rejected because the requirement says each profile should save protein percentage.

2. Keep `daily_protein_target` as calculated compatibility data.
   - Rationale: existing services/routes/tests expect grams, and removing it would be disruptive.
   - Alternative: migrate all consumers to percentage-only now. Rejected as larger than the requested profile UI/model change.

3. Exact 100% split validation.
   - UI should prevent invalid save when carbs + fat exceeds 100 or deduced protein is below allowed floor.
   - DB should enforce exact total after rounding using a check constraint.

4. Backfill from existing carbs/fat percentages.
   - For existing profiles, set `protein_pct_target = 100 - carbs_pct_target - fat_pct_target` and recalculate `daily_protein_target` from kcal.
   - If existing carbs/fat data is invalid, use a migration-safe fallback that preserves data validity and logs/notes the fallback in migration comments.

## Risks / Trade-offs

- [Risk] Existing profiles may have invalid carbs/fat values that make protein <= 0. -> Mitigation: migration uses guarded fallback values only for invalid rows.
- [Risk] Existing code still writes `daily_protein_target` manually. -> Mitigation: update all profile save paths and utilities in this change; add tests.
- [Risk] Hiding global objectives could remove a shortcut users expect. -> Mitigation: keep current profile defaults internally, but not as a visible global editor unless a later change restores templates.
- [Risk] Floating/rounding checks can reject valid rows. -> Mitigation: use integer percentage fields or numeric fields with explicit rounding policy; implementation should keep percentages as whole-number inputs initially.

## Migration Plan

1. Add `person_profiles.protein_pct_target` with default/backfill.
2. Backfill using existing carbs/fat percentages and recalculate `daily_protein_target`.
3. Add DB check constraints for percentage ranges and exact total.
4. Update `types/index.ts` and nutrition utilities.
5. Update `pages/config.vue` to remove global objective editor and make profile macro percentages self-contained.
6. Add/update tests for target conversion and profile validation.
7. Verify with focused tests, build, and OpenSpec validation.

## Open Questions

- None for the plan. The implementation follows the decisions confirmed by the user: protein deduced, `daily_protein_target` calculated/kept, exact 100%, backfill from carbs/fat, global objectives hidden.
