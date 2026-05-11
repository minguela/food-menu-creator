## Why

Currently, when users create weekly menus with days containing 2 dishes (e.g., "ensalada granada + pollo asado"), each day is curated independently. If the same first dish appears in multiple days (like "ensalada granada" in day 1 and day 4), users must curate it multiple times. This creates redundancy and makes maintenance difficult.

## What Changes

- Add support for "compound days" - days with 2 dishes that are always linked together
- Allow reuse of individual dishes across multiple compound days
- When generating rotating menus, compound days stay intact (both dishes together)
- UI to create/manage compound days with linked dishes

## Capabilities

### New Capabilities
- `compound-day-meals`: Manage days with 2 linked dishes that are always used together in rotating menus

### Modified Capabilities
- None

## Impact

- **Database**: New table for compound_day_meals linking 2 dishes
- **Backend**: Modified generate-monthly-menu to respect compound day integrity
- **Frontend**: New UI to create and manage compound days in menu/[id].vue
- **Bot**: Updated /semanal command to handle compound days