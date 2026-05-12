## Why

The web UI uses at least three different visual styles across pages and components: raw Tailwind v3 light-mode classes, `dark:` dual-mode utilities, and partially-adopted CSS variable tokens defined in `main.css`. This fragments the Midnight Command Center dark-only design system and causes inconsistent spacing, colors, borders, button styles, and shadows.

## What Changes

- Apply `ui-surface`, `ui-btn-primary`, `ui-btn-muted`, `ui-input`/`ui-select`/`ui-textarea`, `ui-kicker`, `ui-chip`, `ui-muted`, `ui-subtle` classes from `main.css` uniformly.
- Remove all remaining `bg-white`, `bg-gray-*`, `bg-slate-*`, `text-gray-*`, `text-slate-*`, `border-gray-*`, `border-slate-*`, hardcoded `red-*`/`green-*`/`indigo-*`/`amber-*`/`emerald-*`/`sky-*`/`purple-*`/`orange-*`/`rose-*` color classes.
- Remove all `dark:` variants.
- Remove redundant `bg-transparent bg-[var(--surface-1)]` patterns (40+ occurrences).
- Repair broken `hover:` and `placeholder:` classes.
- Replace `shadow-sm`, `shadow-2xl`, `shadow-xl` with `ui-surface`/`ui-card` shadows.
- Full rewrite templates for 6 files with pervasive issues; targeted fixes for 8 files; unify `shopping.vue` parallel token system.

## Capabilities

### Modified Capabilities
- `nutrition-menu-generator`: UI styling requirements now specify mandatory use of `ui-*` classes and CSS variable tokens defined in `main.css`.

## Non-goals

- Do not change business logic, state management, or API calls.
- Do not alter `DESIGN.md` or `theme.css` tokens.
- Do not touch `supabase/`, `server/`, `openspec/`, or `scripts/`.

## Impact

- 14 Vue files in `menu-web/pages/` and `menu-web/components/`.
- 1 CSS bundle shrinkage expected from class consolidation.
- No database or server-side changes.
