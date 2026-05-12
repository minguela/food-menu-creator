## 1. Baseline audit and contract definition

- [x] 1.1 Inventory all non-compliant frontend classes (`bg-white`, `dark:*`, `text-gray-*`, `border-slate-*`) in `menu-web/pages` and `menu-web/components`.
- [x] 1.2 Create OpenSpec artifacts (`proposal.md`, `design.md`, `specs/web-theme-governance/spec.md`) defining dark-only contract and enforcement requirements.
- [ ] 1.3 Produce per-file replacement map for remaining non-compliant routes/components.

## 2. Shared foundation migration

- [x] 2.1 Replace legacy modal shell styles in shared confirm dialog with tokenized `ui-*` classes.
- [x] 2.2 Rewrite style guidance document to dark-only token contract and remove dual light/dark examples.
- [x] 2.3 Strengthen `check-dark-classes.mjs` to fail on forbidden light and `dark:*` classes.

## 3. Route and component migration batches

- [ ] 3.1 Migrate app shell + primary pages (`index`, `generar`, `config`, `history`) to tokenized surfaces and typography.
- [ ] 3.2 Migrate dense pages (`recipes`, `shopping`, `rotating/[id]`, `ingredients*`) to `ui-*` classes/tokens.
- [ ] 3.3 Migrate shared components (`IngredientCard`, `NutritionInputs`, other reusable cards/forms) to tokenized classes.

## 4. Verification and regression prevention

- [ ] 4.1 Run frontend build and dark-class audit; fix failures.
- [ ] 4.2 Perform desktop/mobile visual QA on main routes and dialogs.
- [ ] 4.3 Document any explicit style-policy exceptions with rationale.
