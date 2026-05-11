## ADDED Requirements

### Requirement: Weekly menu block rotation
The system SHALL generate rotating menu days by copying complete source days from weekly menus in 7-day blocks.

#### Scenario: First weekly menu fills first block
- **WHEN** a rotating menu is generated from weekly menus A, B, and C for at least 7 days
- **THEN** rotating days 1 through 7 use source days 1 through 7 from the first selected weekly menu without mixing meals from other weekly menus

#### Scenario: Next weekly menu starts on day eight
- **WHEN** a rotating menu reaches day 8 and another weekly menu is available
- **THEN** rotating day 8 uses source day 1 from the next weekly menu and rotating day 9 uses source day 2 from that same weekly menu

#### Scenario: Rotation cycles after available menus are exhausted
- **WHEN** a rotating menu duration requires more 7-day blocks than there are selected weekly menus
- **THEN** the generator SHALL continue from the first weekly menu chosen for that rotating menu

#### Scenario: All selected menus are used before repetition
- **WHEN** a rotating menu is generated from weekly menus A, B, C, and D for enough days to require four weekly blocks
- **THEN** each selected weekly menu SHALL be used once before any selected weekly menu is repeated

### Requirement: Source day meal integrity
The system SHALL keep all meals from the same source weekly menu day together in the generated rotating day.

#### Scenario: Lunch and dinner stay together
- **WHEN** source day 3 in a weekly menu contains comida X and cena Y
- **THEN** the generated rotating day mapped to source day 3 SHALL contain comida X and cena Y together, without replacing either with a meal from another source day or weekly menu

#### Scenario: Partial source day is not backfilled from another day
- **WHEN** a source day has only one valid meal available
- **THEN** the generated rotating day SHALL use that available meal and SHALL NOT backfill the missing meal from another source day or weekly menu

### Requirement: Optional initial weekly menu
The system SHALL allow the user to choose an optional initial weekly menu for rotating menu generation.

#### Scenario: User-selected initial menu starts the rotation
- **WHEN** the user selects weekly menu D as the initial menu and generates a rotating menu from weekly menus A, B, C, and D
- **THEN** rotating days 1 through 7 SHALL use source days 1 through 7 from weekly menu D

#### Scenario: Remaining menus are randomized without repetition
- **WHEN** the user selects weekly menu D as the initial menu and weekly menus A, B, and C remain available
- **THEN** the generator SHALL place A, B, and C after D in random order and SHALL NOT repeat D, A, B, or C until all four menus have been used

#### Scenario: No initial menu selected
- **WHEN** the user does not select an initial weekly menu
- **THEN** the generator SHALL choose the first weekly menu randomly and SHALL still use every selected weekly menu once before repeating any selected weekly menu

#### Scenario: Invalid initial menu is ignored
- **WHEN** the selected initial weekly menu is not included in the selected source menus or has no valid meals after validation
- **THEN** the generator SHALL fall back to random first-menu selection among valid selected weekly menus
