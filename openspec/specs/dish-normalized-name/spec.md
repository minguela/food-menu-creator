## Purpose
Keep dish name normalization consistent between database writes and rotating menu generation lookups, including accent stripping.

## Requirements

### Requirement: Dish normalized names MUST strip accents
The database SHALL populate `dishes.normalized_name` with an accent-stripped, lowercased, trimmed, whitespace-normalized value derived from `dishes.name`.

#### Scenario: Dish name includes accents
- **WHEN** a dish named `Ensalada verde con piña` is inserted or updated
- **THEN** its `normalized_name` SHALL be `ensalada verde con pina`

#### Scenario: Dish name includes repeated whitespace
- **WHEN** a dish name contains repeated whitespace around words
- **THEN** its `normalized_name` SHALL collapse whitespace to single spaces

### Requirement: Dish normalization MUST be reusable in SQL
The database SHALL expose `public.normalize_dish_name(text)` for migrations, triggers, and future queries.

#### Scenario: SQL normalization is called directly
- **WHEN** `public.normalize_dish_name('Kéfir')` is evaluated
- **THEN** it SHALL return `kefir`

### Requirement: Existing dish data MUST be backfilled
The migration SHALL update existing `dishes.normalized_name` values that do not match `public.normalize_dish_name(name)`.

#### Scenario: Existing normalized_name preserves accents
- **WHEN** an existing dish has `normalized_name = 'guarnición de arroz'`
- **THEN** the backfill SHALL update it to `guarnicion de arroz`

### Requirement: Rotating dish lookup MUST match accent-bearing source names
The rotating menu generation API SHALL be able to find dishes by normalized names generated from accent-bearing `weekly_meals.dish_name` values.

#### Scenario: Source meal has accented dish name
- **WHEN** `weekly_meals.dish_name` contains accents and the corresponding dish exists
- **THEN** rotating menu generation SHALL match the dish instead of discarding it with `recipe_name_not_found`
