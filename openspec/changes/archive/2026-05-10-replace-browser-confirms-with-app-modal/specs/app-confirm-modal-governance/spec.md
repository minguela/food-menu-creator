## ADDED Requirements

### Requirement: Destructive actions MUST use in-app confirmation modal
Destructive user actions SHALL use a shared app confirmation modal instead of browser-native dialogs.

#### Scenario: Delete action triggered
- **WHEN** a user invokes a destructive action
- **THEN** the app SHALL present a styled confirmation modal with cancel and confirm actions

#### Scenario: User cancels action
- **WHEN** the user dismisses or cancels the modal
- **THEN** the destructive action SHALL not execute

### Requirement: Browser confirms MUST be removed from page handlers
User page handlers MUST NOT call `window.confirm` directly.

#### Scenario: Page action audit
- **WHEN** scanning `menu-web/pages/**/*.vue`
- **THEN** no direct `confirm(` usage SHALL remain
