# rotating-menu-compound-fallback

## Overview

Fallback mechanism for compound meals in the rotating menu generator when `compound_day_id` is null. Splits the `dish_name` on `+` and looks up each constituent dish individually.

## Requirements

### RQ-001: Detect compound meals by name
When a source meal's `dish_name` contains `+` and the dish is not found by full name, treat it as a compound meal candidate.

### RQ-002: Split dish_name and look up individual dishes
Split `dish_name` by `/\s*\+\s*/` (optional whitespace around `+`). For each part:
- Trim whitespace
- Normalize the name
- Look up in `dishByNormalizedName`

### RQ-003: Construct virtual compound dish from parts
If all parts are found as individual dishes:
- Construct a virtual dish with the same format as compound_day_id-based virtual dishes
- Use a synthetic ID like `compound:name:${hash}` or `compound:split:${parts}`
- Combine recipe_status: `complete` only if all parts are `complete`
- Combine is_special and special_kcal_reserved

### RQ-004: Discard if any part is missing
If any constituent dish is not found, discard the meal with `recipe_name_not_found`.

### RQ-005: Support 2+ parts
While the primary use case is 2 parts (e.g., "X + Y"), the splitting logic should handle N parts generically.

## Examples

| dish_name | compound_day_id | Parts found | Result |
|---|---|---|---|
| "Pescado blanco + ensalada" | null | Both found | Virtual compound dish |
| "Pescado blanco + ensalada" | null | Pescado not found | Discarded |
| "Arroz con pollo" | null | No `+` | Normal lookup (existing behavior) |
| "Pescado blanco + ensalada" | "abc-123" | Uses compound_day_id path | Existing behavior |
