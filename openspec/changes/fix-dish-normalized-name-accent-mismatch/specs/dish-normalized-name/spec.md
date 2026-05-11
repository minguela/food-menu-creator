# dish-normalized-name

## Overview

Enforces consistent dish name normalization across the database so that accent-bearing dish names (e.g., "Ensalada verde con piña", "Café con leche") can be reliably matched by the rotating menu generation API, which strips accents before querying.

## Requirements

### RQ-001: Normalized name is accent-stripped
When a recipe is inserted or updated in `dishes`, its `normalized_name` column must be populated with the accent-stripped, lowercased, trimmed version of the dish name.

**Examples:**
| Original name | Expected `normalized_name` |
|---|---|
| "Ensalada verde con piña" | "ensalada verde con pina" |
| "Lomitos de bacalao con salsa de tomate y guarnición de arroz" | "lomitos de bacalao con salsa de tomate y guarnicion de arroz" |
| "Corazones de alcachofa con jamón y vino blanco" | "corazones de alcachofa con jamon y vino blanco" |
| "Kéfir" | "kefir" |

### RQ-002: Normalization function is reusable
A PostgreSQL function `normalize_dish_name(text)` must be available in the `public` schema for use in queries, migrations, and potential future triggers.

### RQ-003: Existing data is backfilled
A migration must update all existing rows in `dishes` where `normalized_name` does not match the accent-stripped value, fixing current recipes.

### RQ-004: Lookup compatibility
After normalization, the rotating menu generation API query (which uses `normalizeDishName()` in JS) must successfully find dishes by their accent-bearing names stored in `weekly_meals.dish_name`.
