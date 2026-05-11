## Design Overview

This change separates two related workflows without changing user permissions or backend contracts.

### Information architecture

- Keep `/ingredients` as the primary curation screen.
- Introduce `/ingredients/expansions` as a dedicated subpage for expansion rules.
- Add clear cross-links so users can move between both areas in one click.

### UX behavior

- Expansion list and CRUD modal are moved from `ingredients.vue` to the new page.
- Existing CRUD payloads remain unchanged (`userId`, `dishName`, `aliases`, `ingredients`, `isGlobal`).
- Confirmation dialog remains in place for destructive deletes.

### Non-goals

- No changes to expansion matching logic.
- No schema or edge function changes.
