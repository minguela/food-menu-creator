## Context

Native confirm dialogs are browser-dependent and visually disconnected from the current design language. Multiple pages currently repeat this pattern for destructive actions.

## Goals / Non-Goals

**Goals:**
- Centralize confirmation UX in one reusable modal.
- Ensure every destructive action uses the same confirm/cancel interaction.

**Non-Goals:**
- Changing deletion APIs or permissions.

## Decisions

1. Create `useConfirmDialog` composable with Promise-based API.
2. Render a global `AppConfirmDialog` in `app.vue`.
3. Replace all page-level `confirm(...)` calls with `await confirmDialog(...)`.

## Risks / Trade-offs

- **[Risk] Missing migration in some pages** → Mitigation: grep guard on `confirm(` in `pages/**`.
- **[Trade-off] Slightly more async ceremony** → Mitigation: reusable composable keeps callsites short.
