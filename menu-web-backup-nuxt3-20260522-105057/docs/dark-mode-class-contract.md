# Dark-Only Theme Contract

Use this contract when styling pages and shared components.

## Core patterns

- Surface card: `ui-surface`
- Elevated panel: `ui-card`
- Inputs/selects/textarea: `ui-input`, `ui-select`, `ui-textarea`
- Primary action: `ui-btn-primary`
- Secondary action: `ui-btn-muted`
- Primary text: `ui-title` or tokenized `var(--color-text-1)`
- Secondary text: `ui-muted`
- Muted text: `ui-subtle`

## Common blocks

- Modal shell: `ui-surface` + optional accent strip
- Table header text: `ui-muted`
- Empty state: `ui-surface` + `ui-subtle`
- Neutral button: `ui-btn-muted`

## Rules

- Treat the app as dark-only. Do not use `dark:*` variants.
- Do not use legacy light/surface utility tokens in templates (`bg-white`, `bg-slate-50`, `text-gray-*`, `border-slate-200`, etc.).
- Use `ui-*` classes and `theme.css` variables for surfaces, borders, text, and states.
- If an exception is required, annotate with `dark-check-ignore` in the same line and document the reason.
