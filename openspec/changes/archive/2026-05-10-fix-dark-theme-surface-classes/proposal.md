## Why

Dark mode is currently fragile because many templates still contain light-only utility classes (for example `bg-white`) without a dark variant. This causes inconsistent surfaces in dark theme and repeated regressions each time UI changes are merged.

Also, CSV ingredient import can fail with a 500 error (`duplicate key value violates unique constraint "ingredients_name_key"`), which blocks bulk curation and provides poor operator feedback.

## What Changes

- Define a clear dark-mode contract for page surfaces, text, borders, and interactive states using Tailwind `dark:*` variants.
- Add an audit + remediation pass across all `menu-web/pages/**` and shared UI components to remove light-only class usage in dark contexts.
- Add guardrails (lint/check script + review checklist) so new PRs do not reintroduce light-only classes in dark screens.
- Standardize a small set of reusable class patterns for cards, sections, empty states, tables, modals, and alerts.
- Make ingredient CSV import idempotent and resilient to duplicates by handling repeated names safely instead of throwing 500.
- Return actionable import summaries (inserted/updated/skipped/conflicts) so users know what happened in each CSV import.

## Capabilities

### New Capabilities
- `dark-theme-class-governance`: enforce consistent dark-mode behavior using explicit Tailwind dark variants and automated class auditing.
- `ingredient-csv-import-idempotency`: ensure CSV imports handle duplicate ingredient keys safely and report detailed outcomes instead of failing with 500 errors.

### Modified Capabilities
- None.

## Impact

- Affected frontend files: `menu-web/pages/**/*.vue`, shared app shell (`menu-web/app.vue`), and shared styles in `menu-web/assets/css/main.css`.
- Affected import API: `menu-web/server/api/ingredients-import-csv.post.ts` and related ingredient normalization helpers.
- Optional database hardening may be added only if needed for deterministic conflict handling.
- Adds one frontend quality gate (script/check) in `menu-web/package.json` and CI workflow (if applicable).

## Non-goals

- No redesign of spacing, copy, navigation, or business workflows.
- No runtime theme switcher feature (this change targets correctness/consistency only).
- No changes to rotating menu generation logic beyond import reliability and diagnostics.
