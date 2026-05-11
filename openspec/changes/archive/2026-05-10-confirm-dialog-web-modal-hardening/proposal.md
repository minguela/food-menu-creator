## Why

Although destructive actions were migrated away from native confirms, we need explicit guardrails to ensure browser dialogs never come back and we want a more polished, app-native confirmation modal experience.

## What Changes

- Polish the shared confirmation modal visuals and interactions to match current app modal quality.
- Add an automated frontend check that fails if `confirm(` or `window.confirm` is reintroduced.
- Wire the check into project scripts/CI validation.

## Capabilities

### New Capabilities
- `confirm-dialog-hardening`: enforce app-native confirmation UX and prevent browser confirm regressions.

### Modified Capabilities
- `app-confirm-modal-governance`: strengthen requirements with automation and polished interaction behavior.

## Impact

- Affected frontend files: confirmation component/composable and validation scripts.
- No backend/database changes.

## Non-goals

- No business logic changes in delete/cleanup actions.
- No redesign of unrelated modals.
