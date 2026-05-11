## 1. Define dark-mode class contract

- [x] 1.1 Document canonical Tailwind class patterns for surfaces, text, borders, modals, tables, empty states, and alerts.
- [x] 1.2 Update shared shell/style files (`app.vue`, `assets/css/main.css`) to enforce token usage without overriding Tailwind utility semantics.

## 2. Apply contract across pages and shared components

- [x] 2.1 Audit `menu-web/pages/**/*.vue` and `menu-web/components/**/*.vue` for light-only surface/text/border utilities.
- [x] 2.2 Patch all affected templates with explicit `dark:*` variants and verify visual consistency page by page.

## 3. Add regression guardrails

- [x] 3.1 Add a frontend check script that flags light-only utility usage in dark-mode-required templates.
- [x] 3.2 Wire the check into local validation and CI flow, with explicit scoped ignore markers for justified exceptions.

## 4. Validate and close

- [x] 4.1 Run `npm run lint` and `npm run build` in `menu-web` and resolve regressions.
- [x] 4.2 Perform manual QA sweep in dark mode across all routes and update `task_log.md` with outcomes.

## 5. Harden ingredient CSV import duplicate handling

- [x] 5.1 Refactor `ingredients-import-csv` API to deduplicate input rows and apply conflict-safe persistence (no 500 on duplicate key).
- [x] 5.2 Return structured import summary payload (`inserted`, `updated`, `skipped`, optional conflicts/details) and document response shape.

## 6. Wire import diagnostics in UI and validate

- [x] 6.1 Update ingredients CSV import UI feedback to show summary counts, including duplicate-related updates/skips.
- [x] 6.2 Add regression checks (manual/automated) for repeated imports and same-file duplicates to confirm idempotent behavior.
