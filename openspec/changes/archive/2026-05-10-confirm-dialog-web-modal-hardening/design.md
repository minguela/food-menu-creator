## Context

The app now uses a shared confirm modal but lacks a dedicated regression gate for native confirm usage and can be improved visually to align with high-polish modals.

## Goals / Non-Goals

**Goals:**
- Keep all destructive confirmations inside app UI.
- Prevent regressions automatically.
- Improve modal accessibility/interaction polish (ESC close, stronger visual hierarchy).

**Non-Goals:**
- Changing route/business flows.

## Decisions

1. Add `lint:confirm` script to scan the entire `menu-web` codebase for `confirm(` and `window.confirm`.
2. Integrate `lint:confirm` into `lint:full` and CI-like checks.
3. Improve `AppConfirmDialog` styling and ESC handling while preserving existing Promise API.

## Risks / Trade-offs

- **[Risk] False positives in script** → Mitigation: include clear ignore marker for intentional string literals if ever needed.
- **[Trade-off] Slightly stricter CI** → Mitigation: fast script runtime and actionable output.
