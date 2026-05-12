# Dark Mode Class Contract

Use this contract when styling pages and shared components.

## Core patterns

- Surface card: `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700`
- Elevated panel: `bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700`
- Primary text: `text-slate-900 dark:text-slate-100`
- Secondary text: `text-slate-600 dark:text-slate-300`
- Muted text: `text-slate-500 dark:text-slate-400`

## Common blocks

- Modal shell: `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700`
- Table header text: `text-slate-600 dark:text-slate-300`
- Empty state: `bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400`
- Neutral button: `border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800`

## Rules

- Never rely on global CSS to reinterpret Tailwind utility classes.
- If an element uses a light-only utility (`bg-white`, `text-gray-900`, `border-gray-200`, etc.), add explicit `dark:*` variants.
- If a light-only style is intentional, annotate with `dark-check-ignore` in the same line so automated checks can skip it intentionally.
