## Why

Profile nutrition targets currently mix global macro percentages with profile-level kcal/protein grams, making the generator harder to reason about per person. Profiles should own their full macro split so protein is derived consistently from carbs/fat percentages and displayed in grams per profile.

## What Changes

- Move macro percentage editing from global objectives to each profile.
- Store carbs, fat, and protein percentages per profile with an exact 100% total.
- Make protein percentage read-only/deduced as `100 - carbs_pct_target - fat_pct_target`.
- Keep `daily_protein_target` in grams for compatibility, but calculate it from kcal and deduced protein percentage.
- Hide/remove the global objectives panel from `pages/config.vue`; profile forms become the source of truth for nutrition targets.
- Keep the deduced protein/grams summary, but render it per profile with the same visual style as the rest of the app.
- Backfill existing profiles using their current carbs/fat percentages and deducing protein from those values.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `nutrition-menu-generator`: Profile target conversion changes from explicit protein grams plus carbs/fat percentages to profile-owned macro percentages with calculated protein grams.

## Non-goals

- Do not implement recipe/menu generation changes beyond consuming the updated profile targets.
- Do not remove `daily_protein_target` from the database in this change.
- Do not preserve global objective editing in the configuration UI.
- Do not support editable protein percentage unless a future change explicitly requests it.

## Impact

- Supabase migration for `person_profiles.protein_pct_target`, checks, and calculated `daily_protein_target` backfill/update behavior.
- Updates to profile target utilities and nutrition tests.
- Updates to `pages/config.vue`, profile forms, validation, and profile cards.
- Potential updates to generated menu APIs/services that read profile targets.
- `task_log.md` entries and phased implementation tracking, following `PROJECT_CONTEXT.md` conventions.
