## Context

All Vue pages and components inherit `main.css` which defines a dark-only design system. The system provides utility classes (`ui-surface`, `ui-card`, `ui-btn-primary`, `ui-btn-muted`, `ui-input`, `ui-select`, `ui-textarea`, `ui-chip`, `ui-kicker`, `ui-muted`, `ui-subtle`, `ui-divider`, `ui-title`, `ui-danger`, `ui-success`) and CSS variables (`--text-1`, `--text-2`, `--text-3`, `--surface-1`, `--surface-2`, `--surface-3`, `--border-soft`, `--accent`, `--success`, `--danger`, `--goldenrod`).

## Decisions

- Use `ui-surface` for all card/section containers instead of manual `bg-[var(--surface-1)] rounded-2xl border border-[var(--border-soft)]`.
- Use `ui-btn-primary` for primary actions, `ui-btn-muted` for secondary.
- Use `ui-input`/`ui-select`/`ui-textarea` for all form elements.
- Replace all hardcoded Tailwind v3 colors with CSS variable tokens.
- Remove all `dark:` variants (design is dark-only).
- Remove all `bg-transparent` when immediately followed by a background class.
- Fix all broken `hover:`/`placeholder:` classes (space after colon).

## Migration

1. Fix components (smallest files).
2. Fix minor-issue pages.
3. Full-rewrite pages.
4. Verify build + tests.
