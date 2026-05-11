## Why

Currently when ingredients are extracted from OCR-processed menu images (like "ensalada", "tortilla", "paella"), they're stored as-is without expanding to their implicit components. This means the shopping list misses critical ingredients - "ensalada" should expand to "canónigos + tomate + aceite", "tortilla" needs "huevos", etc.

## What Changes

- Add ingredient expansion rules for common dishes
- Auto-expand extracted dish names to their base ingredients
- Store original dish name AND expanded ingredients separately
- UI to manage expansion rules (CRUD)

## Capabilities

### New Capabilities
- `ingredient-expansion`: Expand dish names to their base ingredients based on configurable rules

### Modified Capabilities
- None

## Impact

- **Database**: New table for expansion rules (ingredient_mappings)
- **Backend**: New edge function for ingredient expansion logic
- **Frontend**: UI to manage expansion rules in ingredients page
- **OCR Flow**: Modified ocr-processor to apply expansions automatically