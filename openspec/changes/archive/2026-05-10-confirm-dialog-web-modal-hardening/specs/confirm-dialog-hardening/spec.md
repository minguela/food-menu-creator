## ADDED Requirements

### Requirement: Confirmations MUST remain app-native
Destructive actions SHALL be confirmed through the shared in-app modal, not browser native dialogs.

#### Scenario: Native confirm accidentally introduced
- **WHEN** code introduces `confirm(` or `window.confirm`
- **THEN** automated checks SHALL fail before merge

### Requirement: Confirmation modal MUST provide polished interaction
The shared confirmation modal SHALL provide clear hierarchy, danger emphasis, and keyboard escape dismissal.

#### Scenario: User presses Escape
- **WHEN** confirmation modal is open and Escape is pressed
- **THEN** modal SHALL close as cancel action
