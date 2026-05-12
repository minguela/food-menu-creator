# nutrition-menu-generator Specification

## Purpose
TBD - created by archiving change score-based-nutrition-menu-generator. Update Purpose after archive.
## Requirements
### Requirement: Profile targets MUST be converted consistently
The system SHALL convert a selected nutrition profile into daily targets using profile-owned kcal target, carbs percentage, fat percentage, deduced protein percentage, calculated protein grams, and tolerance percentage.

#### Scenario: Percent targets become grams
- **WHEN** a profile has `daily_kcal_target = 2000`, `carbs_pct_target = 45`, `fat_pct_target = 30`, and deduced `protein_pct_target = 25`
- **THEN** the generated target set SHALL contain `targetProteinG = 125`, `targetCarbsG = 225`, and `targetFatG = 66.67` rounded consistently

#### Scenario: Protein percentage is deduced from carbs and fat
- **WHEN** a user edits a profile to `carbs_pct_target = 40` and `fat_pct_target = 30`
- **THEN** the system SHALL calculate and persist `protein_pct_target = 30`

#### Scenario: Protein grams are calculated for compatibility
- **WHEN** a profile has `daily_kcal_target = 1800` and `protein_pct_target = 25`
- **THEN** the system SHALL calculate and persist `daily_protein_target = 112.5`

#### Scenario: Invalid macro percentages are rejected
- **WHEN** `carbs_pct_target + fat_pct_target + protein_pct_target` is not exactly `100`
- **THEN** generation and profile saving SHALL fail validation before using the profile and SHALL explain that macro percentages must total 100

#### Scenario: Tolerance is bounded
- **WHEN** a profile has a missing tolerance percentage
- **THEN** the system SHALL use the configured default tolerance and validate it against reasonable minimum and maximum bounds

### Requirement: Recipe macros MUST come from ingredients
The system SHALL calculate recipe macros by summing confirmed recipe ingredient quantities against complete ingredient nutrition per 100g.

#### Scenario: Recipe macro calculation uses per-100g nutrition
- **WHEN** a recipe ingredient has `quantity_g = 150` and an ingredient has `kcal_per_100g = 100`, `protein_per_100g = 10`, `carbs_per_100g = 5`, and `fat_per_100g = 2`
- **THEN** the recipe contribution SHALL be `150 kcal`, `15g protein`, `7.5g carbs`, and `3g fat`

#### Scenario: Missing nutrition excludes candidate
- **WHEN** a recipe contains a confirmed ingredient without complete kcal, protein, carbs, or fat per 100g
- **THEN** that recipe SHALL be excluded from generation and reported in diagnostics rather than using invented macro values

### Requirement: Daily generator MUST score real recipe combinations
The system SHALL generate daily menus by testing bounded combinations of existing candidate recipes by meal type and scoring their real macro totals against the selected profile targets.

#### Scenario: Daily combination is scored
- **WHEN** breakfast, lunch, and dinner candidates have complete calculated macros
- **THEN** the generator SHALL calculate total kcal, protein, carbs, and fat for each tested combination and assign a numeric score

#### Scenario: Best combination is returned when none meet tolerance
- **WHEN** no tested combination satisfies all tolerance checks
- **THEN** the generator SHALL return the lowest-score combination with `meetsTargets = false` and deviation diagnostics

#### Scenario: Protein shortfall is penalized more heavily
- **WHEN** two combinations have similar kcal deviation but one is below protein target
- **THEN** the protein-short combination SHALL receive the configured extra protein shortfall penalty

### Requirement: Serving multipliers MUST be tested deterministically
The system SHALL test fixed serving multipliers `0.75`, `1`, `1.25`, and `1.5` for generated meals and scale macros and ingredients proportionally.

#### Scenario: Meal macros scale by multiplier
- **WHEN** a recipe has `400 kcal` and `30g protein` and is selected with multiplier `1.25`
- **THEN** the generated meal SHALL contain `500 kcal` and `37.5g protein`

#### Scenario: Shopping ingredients scale by multiplier
- **WHEN** a generated meal uses `200g` of an ingredient with multiplier `0.75`
- **THEN** the shopping-list aggregation SHALL count `150g` for that meal contribution

#### Scenario: Tie breaks are stable
- **WHEN** two candidate combinations have the same score
- **THEN** the generator SHALL use deterministic tie breakers so repeated runs with the same inputs produce the same selected menu

### Requirement: Tolerance compliance MUST be explicit
The system SHALL mark generated daily menus as compliant only when kcal, protein, carbs, and fat are within the selected profile tolerance rules.

#### Scenario: Day meets tolerance
- **WHEN** all macro totals are within the configured tolerance and protein meets or exceeds the accepted minimum
- **THEN** the day SHALL be marked `meetsTargets = true`

#### Scenario: Day misses tolerance
- **WHEN** any required macro total is outside tolerance
- **THEN** the day SHALL be marked `meetsTargets = false` and SHALL include kcal, protein, carbs, and fat deviations

### Requirement: Weekly and monthly generation MUST avoid excessive repetition
The system SHALL generate weekly and monthly menus day by day while penalizing recipes repeated too close together and allowing repetition when recipe supply is limited.

#### Scenario: Consecutive repeat is penalized
- **WHEN** the same recipe appears in the previous generated day
- **THEN** candidate combinations containing that recipe SHALL receive an additional repeat penalty

#### Scenario: Limited recipes still generate a menu
- **WHEN** there are not enough candidates to avoid repeats across the requested period
- **THEN** the generator SHALL still return the best available period menu with repetition diagnostics

#### Scenario: Period summary is calculated
- **WHEN** a weekly or monthly menu is generated
- **THEN** the response SHALL include daily scores, a global score, and average kcal, protein, carbs, and fat across the period

### Requirement: Generated menus MUST be persisted and retrievable
The system SHALL provide server routes to generate, save, list, and retrieve generated menus with daily totals and selected meals.

#### Scenario: Generated menu is saved
- **WHEN** the user saves a generated menu
- **THEN** the system SHALL persist menu metadata, days, meals, recipe ids, serving multipliers, macros, scores, and compliance status

#### Scenario: Menu detail is retrieved
- **WHEN** the user opens a saved generated menu
- **THEN** the system SHALL return each day with target-vs-real totals, deviations, score, compliance status, selected recipes, and serving multipliers

### Requirement: Shopping list MUST aggregate generated meal ingredients
The system SHALL aggregate a shopping list from persisted generated meals by recipe ingredient and serving multiplier.

#### Scenario: Ingredients are summed by ingredient id
- **WHEN** two generated meals contain the same ingredient
- **THEN** the shopping list SHALL sum their scaled gram quantities into one line for that ingredient

#### Scenario: Quantity display uses grams or kilograms
- **WHEN** an aggregated ingredient quantity is less than `1000g`
- **THEN** the shopping list SHALL display grams

#### Scenario: Quantity display uses kilograms
- **WHEN** an aggregated ingredient quantity is at least `1000g`
- **THEN** the shopping list SHALL display kilograms with a clear converted amount

### Requirement: Generation UI MUST expose targets and deviations
The generation UI SHALL show the selected profile, daily targets, tolerance, generation action, generated days, meals, serving multipliers, target-vs-real macro totals, deviations, compliance status, score, and save action using the dark-only design system CSS variable tokens and `ui-*` utility classes defined in `main.css`.

#### Scenario: Generated result is inspectable
- **WHEN** generation completes
- **THEN** the UI SHALL display each generated day with kcal, protein, carbs, and fat target-vs-real values and deviations using `text-[var(--text-1)]`, `text-[var(--text-3)]`, `ui-surface` cards, and `ui-btn-primary`/`ui-btn-muted` buttons

#### Scenario: Save action is available
- **WHEN** a generated preview exists
- **THEN** the UI SHALL offer a save action using `ui-btn-primary` without requiring the user to regenerate the menu

### Requirement: Tests MUST cover nutrition generator primitives
The system SHALL include unit tests for recipe macro calculation, profile target conversion, scoring, tolerance validation, best-combination selection, and multiplier scaling.

#### Scenario: Local tests validate core behavior
- **WHEN** the targeted nutrition generator tests run locally
- **THEN** they SHALL execute without external Supabase calls and verify deterministic expected outputs

### Requirement: Profile configuration MUST own macro percentages
The configuration UI SHALL make profiles the source of truth for nutrition macro percentages and SHALL not expose editable global objective controls.

#### Scenario: Global objectives are hidden
- **WHEN** the user opens the configuration screen
- **THEN** the UI SHALL show profile nutrition controls and SHALL NOT show the previous editable global objectives panel

#### Scenario: Profile form edits carbs and fat percentages
- **WHEN** the user creates or edits a profile
- **THEN** the form SHALL allow editing kcal target, carbs percentage, fat percentage, tolerance, and basic profile fields while showing protein percentage as deduced

#### Scenario: Per-profile gram summary is shown
- **WHEN** a profile has valid kcal and macro percentages
- **THEN** the UI SHALL display protein, carbs, and fat gram conversions for that profile using app-consistent card/badge styling

#### Scenario: Invalid total blocks save
- **WHEN** profile macro percentages do not total exactly 100 after deducing protein
- **THEN** the profile save action SHALL be disabled or rejected with a clear validation message

### Requirement: Existing profiles MUST be migrated safely
The system SHALL migrate existing profiles to profile-owned macro percentages without losing compatibility with existing generation code.

#### Scenario: Existing profile uses current carbs and fat percentages
- **WHEN** an existing profile has valid `carbs_pct_target` and `fat_pct_target`
- **THEN** migration SHALL set `protein_pct_target = 100 - carbs_pct_target - fat_pct_target` and recalculate `daily_protein_target`

#### Scenario: Existing profile has invalid macro percentages
- **WHEN** an existing profile cannot produce a valid positive deduced protein percentage from current carbs and fat
- **THEN** migration SHALL apply safe valid fallback percentages and recalculate `daily_protein_target`

