## 1. Hardening checks

- [x] 1.1 Add `lint:confirm` script to detect `confirm(` / `window.confirm` usage in `menu-web` source.
- [x] 1.2 Wire `lint:confirm` into `lint:full` and workflow checks.

## 2. Modal polish

- [x] 2.1 Improve shared confirm modal visual design to match app modal quality.
- [x] 2.2 Add ESC key cancel behavior and preserve current Promise API semantics.

## 3. Validation

- [x] 3.1 Run `npm run lint:confirm` and ensure no native confirms remain.
- [x] 3.2 Run `npm run build` and verify critical delete/cleanup flows manually.
