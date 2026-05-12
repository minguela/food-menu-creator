## 1. Component Fixes (smallest first)

- [ ] 1.1 Rewrite `components/ValidationBadge.vue` — replace 3 light-mode color sets with rgba/var tokens.
- [ ] 1.2 Fix `components/NutritionInputs.vue` — remove `dark:bg-indigo-950/40`.
- [ ] 1.3 Rewrite `components/AppConfirmDialog.vue` — remove `hover:bg-slate-50`, hardcoded colors, use `ui-btn-primary`/`ui-btn-muted`.
- [ ] 1.4 Rewrite `components/IngredientCard.vue` — remove 10+ light-mode classes, use `ui-input`/`ui-select`/`ui-surface`.

## 2. Page Minor Fixes

- [ ] 2.1 Fix `pages/admin/errors.vue` — replace `border-zinc-700`, `border-sky-400`.
- [ ] 2.2 Fix `pages/history.vue` — replace redundant `bg-transparent`, broken `hover:`, use `ui-btn-muted`.
- [ ] 2.3 Fix `pages/ingredients.vue` — replace `bg-red-600`, redundant `bg-transparent`, use `ui-input`/`ui-btn-*`.
- [ ] 2.4 Fix `pages/ingredients/expansions.vue` — fix `bg-transparent/10` typo, `border-white/N`.
- [ ] 2.5 Fix `pages/rotating/[id].vue` — remove 12+ `bg-transparent bg-[var(--surface-1)]` redundancies, `border-indigo-500`.
- [ ] 2.6 Fix `pages/shopping.vue` — unify token system to `main.css` vars, replace `#25D366`.
- [ ] 2.7 Fix `app.vue` — replace `bg-black/80`/`bg-black/90` with var tokens.

## 3. Page Full Rewrites

- [ ] 3.1 Rewrite `pages/index.vue` — remove custom gradients, light shadows, broken hover, redundant bg patterns, use `ui-*` classes.
- [ ] 3.2 Rewrite `pages/generar.vue` — remove broken hover, light borders, custom gradients, use `ui-surface`/`ui-btn-*`/`ui-input`.
- [ ] 3.3 Rewrite `pages/recipes.vue` — remove malformed `dark:`, broken `hover:`, `bg-red-600`, use `ui-input`/`ui-select`/`ui-btn-*`.
- [ ] 3.4 Rewrite `pages/menu/[id].vue` — remove malformed class fragments, broken classes, `shadow-sm`, use `ui-*` classes.

## 4. Verification

- [ ] 4.1 Build and fix any compilation errors.
- [ ] 4.2 Run nutrition/rotating tests.
- [ ] 4.3 Update `task_log.md`.
- [ ] 4.4 Commit, PR, merge.
