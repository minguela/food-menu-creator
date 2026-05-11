## Purpose
Guarantee the deployed root runtime uses the same rotating menu scaling behavior as the maintained app code.

## Requirements

### Requirement: Deployed rotating runtime MUST enforce non-collapsing scaling
The deployed runtime SHALL treat positive placeholder quantities as relative weights, SHALL avoid normal portions below base, and SHALL warn for collapsed days before returning the menu.

#### Scenario: Placeholder recipe quantities in deployed runtime
- **WHEN** a normal recipe arrives with quantities around `1 g`
- **THEN** generation SHALL use relative quantities and SHALL allow multipliers above `x2.50` instead of failing with `409`

### Requirement: Deployed runtime MUST expose day-level target warnings
The deployed runtime SHALL expose tolerance misses as warnings while still returning generated menus.

#### Scenario: Collapsed day around 54 kcal
- **WHEN** a day calculates far below target, such as `54 / 1900 kcal`
- **THEN** the process SHALL include warning diagnostics and SHALL still return the generated menu for inspection
