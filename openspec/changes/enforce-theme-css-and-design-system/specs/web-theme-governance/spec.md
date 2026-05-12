## ADDED Requirements

### Requirement: Dark-only themed surfaces across web UI
The system SHALL render all page and component surfaces in `menu-web` using the dark-only theme contract, without light-mode utility fallbacks such as `bg-white` or `dark:*` class pairs.

#### Scenario: Page surface class compliance
- **WHEN** a page in `menu-web/pages/**/*.vue` declares section, card, modal, or panel containers
- **THEN** those containers MUST use approved dark-theme classes or tokens (`ui-surface`, `ui-card`, `--color-surface-*`) and MUST NOT include `bg-white` or `dark:*` variants

#### Scenario: Component surface class compliance
- **WHEN** a shared component in `menu-web/components/**/*.vue` declares container/background classes
- **THEN** the component MUST use approved dark-theme classes/tokens and MUST NOT include light-mode surface fallback classes

### Requirement: Tokenized typography and borders for consistency
The system SHALL use theme tokens or approved utility classes for text and borders in user-facing views instead of legacy gray/slate utility color classes.

#### Scenario: Text color normalization
- **WHEN** user-facing text classes are defined in pages or shared components
- **THEN** text color MUST map to theme tokens or approved semantic utility classes and MUST NOT rely on legacy `text-gray-*` dark-mode pairings for base typography

#### Scenario: Border color normalization
- **WHEN** borders are used for cards, inputs, and controls
- **THEN** border colors MUST use theme token mappings (`--color-border-*`) or approved utilities rather than mixed light/dark utility pairings

### Requirement: Automated style policy enforcement
The system MUST provide an automated repository check that detects forbidden class patterns that violate the dark-only theme contract.

#### Scenario: Forbidden class detection
- **WHEN** frontend style validation scripts run in CI or local checks
- **THEN** the check MUST fail if newly introduced templates include forbidden patterns such as `bg-white` or `dark:*` classes outside documented exceptions

#### Scenario: Exception handling
- **WHEN** a forbidden pattern is required for a constrained technical reason
- **THEN** the script MUST allow only explicitly documented file-level exceptions with justification in project docs

### Requirement: Style guidance alignment
The system SHALL keep frontend style documentation aligned with the enforced dark-only contract.

#### Scenario: Legacy guidance replacement
- **WHEN** documentation includes legacy dual-mode examples that conflict with the contract
- **THEN** those examples MUST be updated or removed so contributor guidance matches enforced implementation rules
