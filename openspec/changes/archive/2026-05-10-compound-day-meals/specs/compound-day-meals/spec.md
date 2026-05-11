## ADDED Requirements

### Requirement: Users can create compound days with 2 linked dishes
The system SHALL allow users to create a compound day by linking 2 dishes that must always be used together.

#### Scenario: Create compound day from existing dishes
- **WHEN** user selects "ensalada granada" and "pollo asado" to create a compound day
- **THEN** system creates compound_day_meals record linking both dishes
- **AND** compound day appears as single selectable unit in UI

#### Scenario: Compound day appears in rotation pool
- **WHEN** user generates rotating menu with compound days available
- **THEN** compound day appears as atomic option alongside individual dishes

#### Scenario: Rotate menu uses compound day intact
- **WHEN** rotating menu algorithm selects compound day "ensalada + pollo"
- **THEN** both dishes are added together to the generated menu
- **AND** they stay together regardless of other selections

#### Scenario: Same first dish in multiple compound days
- **WHEN** user creates compound day 1: "ensalada granada" + "pollo asado"
- **AND** user creates compound day 2: "ensalada granada" + "solomillo con arroz"
- **THEN** "ensalada granada" is stored once but linked to both compound days
- **AND** editing "ensalada granada" updates it in both compound days

#### Scenario: Delete compound day
- **WHEN** user deletes compound day "ensalada + pollo"
- **THEN** the underlying dishes remain in dishes table
- **AND** only the compound day relationship is removed

#### Scenario: Generate menu with limited days
- **WHEN** user requests 4-day rotating menu with 3 compound days available
- **THEN** algorithm selects first 3 compound days as atomic units
- **AND** each compound day contributes 2 dishes to the final menu