## MODIFIED Requirements

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

## ADDED Requirements

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
