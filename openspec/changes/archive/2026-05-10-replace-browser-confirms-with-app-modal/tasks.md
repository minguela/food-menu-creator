## 1. Shared confirm infrastructure

- [x] 1.1 Create `useConfirmDialog` Promise-based composable.
- [x] 1.2 Create and mount global `AppConfirmDialog` in `app.vue`.

## 2. Page migration

- [x] 2.1 Replace all `confirm(...)` calls in pages with `confirmDialog(...)`.
- [x] 2.2 Keep action behavior identical after confirmation.

## 3. Validation

- [x] 3.1 Verify no `confirm(` remains in `menu-web/pages/**/*.vue`.
- [x] 3.2 Build and smoke-check destructive flows.
