## ADDED Requirements

### Requirement: Backend tests MUST cover weekly block rotation
The system SHALL include backend regression tests for rotating menu planning by complete weekly menu blocks.

#### Scenario: Initial menu selected
- **WHEN** a test generates a rotating plan with weekly menu D selected as initial menu
- **THEN** the test SHALL assert that days 1 through 7 map to weekly menu D source days 1 through 7

#### Scenario: No initial menu selected
- **WHEN** a test generates a rotating plan without an initial menu and with deterministic RNG
- **THEN** the test SHALL assert the first weekly block follows the RNG-selected weekly menu

#### Scenario: No repetition before exhaustion
- **WHEN** a test generates enough days to use all selected weekly menus once
- **THEN** the test SHALL assert no weekly menu ID repeats before every selected weekly menu ID has appeared

### Requirement: Backend tests MUST cover source-day integrity
The system SHALL include backend regression tests that prove generated days preserve the complete source day meal structure.

#### Scenario: Lunch and dinner preserved together
- **WHEN** fixture weekly menu day 2 contains comida and cena
- **THEN** the test SHALL assert the generated mapped day contains those exact meals from the same weekly menu and source day

#### Scenario: Multiple slots preserved
- **WHEN** fixture weekly menu day 4 contains comida slot 1 and comida slot 2
- **THEN** the test SHALL assert both slots appear in the generated day and no slot is dropped

#### Scenario: Missing meal is reported
- **WHEN** validation receives a generated day missing an expected source meal
- **THEN** the test SHALL assert validation fails with diagnostic fields for weekly menu, source day, meal type, slot and dish name

### Requirement: Backend tests MUST be fast by default
The system SHALL provide a local backend test command that runs rotating regressions without external services.

#### Scenario: Run targeted rotating tests
- **WHEN** the developer runs the rotating regression test script
- **THEN** it SHALL execute only local Node tests for rotating planning and validation

#### Scenario: Default tests remain deterministic
- **WHEN** tests use random weekly menu ordering
- **THEN** they SHALL inject deterministic RNG so assertions are stable

### Requirement: Supabase contrast MUST be optional and read-only
The system SHALL provide an opt-in test path that contrasts real Supabase weekly menus without mutating production data.

#### Scenario: Missing live environment configuration
- **WHEN** live Supabase variables are absent
- **THEN** the live contrast test SHALL skip or exit with a clear configuration message without failing local regressions

#### Scenario: Real weekly meals are contrasted
- **WHEN** live Supabase variables and test menu IDs are provided
- **THEN** the test SHALL read `weekly_menus` and `weekly_meals` and assert the planned rotating structure preserves complete weekly menu blocks

#### Scenario: Live test avoids persistence
- **WHEN** the live contrast test runs
- **THEN** it SHALL NOT insert, update or delete rotating menus, weekly menus, meals, recipes or shopping-list rows
