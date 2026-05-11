## Why

Ingredient expansions have grown into a sizable management workflow and currently share space with the master ingredient curation screen, increasing cognitive load and visual density.

## What Changes

- Move expansions management into a dedicated full page under ingredients.
- Keep ingredients page focused on master ingredient curation while linking to expansions as a sub-area.
- Preserve existing expansion CRUD behavior and APIs.

## Capabilities

### New Capabilities
- `ingredient-expansions-subpage`: dedicated page for listing and managing expansion rules.

### Modified Capabilities
- `ingredients-curation-screen`: no longer embeds expansion cards and modal directly.

## Impact

- Affected UI files:
  - `menu-web/pages/ingredients.vue`
  - `menu-web/pages/ingredients/expansions.vue` (new)
- API endpoints reused:
  - `/api/ingredient-mappings` (GET/POST/PUT/DELETE)
