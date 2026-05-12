## Why

The web UI still mixes legacy light/dark Tailwind utilities (`bg-white`, `dark:*`, `text-gray-*`) with the dark-only design system, causing inconsistent backgrounds, contrast drift, and repeated visual regressions. This should be corrected now to align implementation with `PROJECT_CONTEXT.md` frontend conventions and the established `DESIGN.md` + `theme.css` token model.

## What Changes

- Audit all Nuxt pages and shared components for non-compliant visual classes and hardcoded colors.
- Enforce a single dark-only contract based on `menu-web/assets/css/theme.css` tokens and shared `ui-*` utility classes.
- Replace legacy surface, border, and text classes with themed equivalents in prioritized batches (layout shell, core pages, dense pages, shared components).
- Add/adjust automated checks to block reintroduction of forbidden classes (e.g., `bg-white`, `dark:*`) outside documented exceptions.
- Update frontend style guidance so contributors use tokenized classes by default.

## Capabilities

### New Capabilities
- `web-theme-governance`: Defines and enforces a repository-wide visual contract for dark-only styling via tokens, reusable classes, and automated policy checks.

### Modified Capabilities
- None.

## Non-goals

- No business-logic, API, database, or Supabase function changes.
- No navigation or feature-flow redesign.
- No typography rebrand beyond adopting existing theme tokens where missing.

## Impact

- Affected code: `menu-web/pages/**/*.vue`, `menu-web/components/**/*.vue`, `menu-web/assets/css/main.css`, `menu-web/assets/css/theme.css`, `menu-web/scripts/check-dark-classes.mjs`, and related docs.
- Operational impact: frontend-only visual migration with zero backend contract changes.
- Risk: medium visual regression risk, mitigated via incremental batches and automated class-policy checks.
