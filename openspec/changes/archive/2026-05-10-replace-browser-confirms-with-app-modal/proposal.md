## Why

The app still used native `window.confirm(...)` dialogs in critical actions (deletes/cleanup), which breaks visual consistency and feels low quality compared to the rest of the UI.

## What Changes

- Replace browser confirms with a shared in-app confirm modal component.
- Migrate all confirm flows in pages to the shared modal pattern.
- Standardize danger/safe button semantics and copy style for destructive actions.

## Capabilities

### New Capabilities
- `app-confirm-modal-governance`: unified modal confirmation UX for destructive actions.

### Modified Capabilities
- None.

## Impact

- Affected frontend: `menu-web/app.vue`, `menu-web/components/**`, `menu-web/composables/**`, and page action handlers.
- No backend or database changes.

## Non-goals

- No business logic changes in deletion semantics.
- No redesign of non-confirmation modals.
