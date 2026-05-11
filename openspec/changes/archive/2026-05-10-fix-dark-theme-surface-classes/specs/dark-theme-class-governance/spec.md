## ADDED Requirements

### Requirement: Dark-safe surface classes in all user pages
All user-facing pages under `menu-web/pages/**` MUST define dark-mode-safe surface, text, and border classes for primary containers, cards, modals, tables, and empty states using Tailwind `dark:*` variants.

#### Scenario: Page section uses light surface class
- **WHEN** a template section uses a light surface utility such as `bg-white`
- **THEN** the same element MUST include an explicit dark variant (for example `dark:bg-slate-900`) and compatible dark text/border classes

#### Scenario: Modal and panel containers in dark mode
- **WHEN** the application runs in dark mode
- **THEN** modal and panel containers MUST remain readable with contrast-safe dark background, border, and text classes

### Requirement: No global utility semantic overrides
Global CSS MUST NOT override Tailwind utility class semantics for color/background/border utilities (for example redefining `.bg-white`, `.text-slate-*`, `.border-*`).

#### Scenario: Global stylesheet review
- **WHEN** `menu-web/assets/css/main.css` is evaluated
- **THEN** it MUST not contain global selectors that remap Tailwind utility meaning for backgrounds, text colors, or borders

### Requirement: Automated guardrail against dark-mode regressions
The frontend project MUST include an automated check that detects light-only utility usage in templates where dark mode is required.

#### Scenario: New light-only class introduced
- **WHEN** a pull request introduces a surface/text/border class in a page without a dark counterpart
- **THEN** the automated check MUST fail and report file and class context to fix before merge

#### Scenario: Intentional exception
- **WHEN** a class is intentionally light-only for a documented UX reason
- **THEN** the check MUST allow a scoped, explicit ignore marker so exceptions are auditable
