## Context

The Nuxt frontend currently mixes two styling models: a dark-only tokenized theme (`menu-web/assets/css/theme.css` + shared `ui-*` classes in `main.css`) and older utility-class patterns (`bg-white`, `text-gray-*`, `border-slate-*`, `dark:*`). This causes white surfaces and inconsistent contrast in multiple routes and reusable components.

The migration is cross-cutting because it touches app shell, pages, shared components, and style governance scripts. No backend/database change is required, but consistency and regression prevention require explicit technical decisions and rollout sequencing.

## Goals / Non-Goals

**Goals:**
- Enforce a single dark-only visual contract in all user-facing Nuxt pages and shared components.
- Standardize surfaces, controls, and text to `ui-*` classes and `theme.css` tokens.
- Remove legacy `dark:*` variants and light-mode fallback classes from frontend templates.
- Add automated checks that fail when forbidden classes are introduced.

**Non-Goals:**
- No feature behavior, API, or data model changes.
- No Supabase Edge Function changes.
- No full visual redesign beyond alignment to existing `DESIGN.md` and current token palette.

## Decisions

1. **Adopt dark-only contract as source of truth**
   - Decision: Use tokenized classes (`ui-surface`, `ui-card`, `ui-input`, `ui-select`, `ui-btn-*`) and `--color-*` variables as the only approved styling primitives for surfaces and typography.
   - Rationale: This matches existing theme intent and avoids duplicated class logic.
   - Alternative considered: Keep dual light/dark classes and rely on `dark:` variants. Rejected because the product design is dark-only and dual definitions keep creating drift.

2. **Batch migration by blast radius**
   - Decision: Migrate shell/modals first, then core routes, then dense routes/components.
   - Rationale: Early stabilization of shared UI patterns reduces repeated fixes downstream.
   - Alternative considered: Big-bang rewrite. Rejected due to high regression risk and hard review scope.

3. **Enforce policy with static class guard**
   - Decision: Extend `menu-web/scripts/check-dark-classes.mjs` to include current forbidden patterns and integrate it into standard verification commands.
   - Rationale: Prevents recurrence after migration.
   - Alternative considered: Manual PR review only. Rejected due to inconsistent enforcement.

4. **Resolve documentation conflict explicitly**
   - Decision: Update/remove guidance in `menu-web/docs/dark-mode-class-contract.md` that still recommends `bg-white dark:bg-slate-900` patterns.
   - Rationale: Documentation must not contradict the enforced contract.
   - Alternative considered: Keep legacy doc for historical context. Rejected because contributors will copy stale patterns.

## Risks / Trade-offs

- [Visual regressions in dense screens] -> Mitigation: route-by-route QA checklist and incremental PR-sized batches.
- [Some ad-hoc utility classes encode subtle state cues] -> Mitigation: map each replaced class to explicit tokenized semantic states (`ui-danger`, `ui-success`, warning token classes).
- [Policy script false positives] -> Mitigation: allow explicit, documented exception list in script with file-pattern comments.
- [Migration effort across many files] -> Mitigation: prioritize top-traffic pages first and defer low-impact views to later batch tasks.

## Migration Plan

1. Baseline scan and produce per-file replacement map.
2. Migrate app shell + shared modal components.
3. Migrate primary routes (`index`, `generar`, `config`, `history`).
4. Migrate dense routes (`recipes`, `shopping`, `rotating/[id]`, `ingredients*`) and shared form/list components.
5. Update docs and static checker; run full frontend validation.

Rollback strategy: Revert only the latest migration batch commit if a critical visual regression appears; keep prior successful batches intact.

## Open Questions

- Should brand-gradient button treatments be normalized into shared `ui-btn-*` variants now, or tracked as a separate enhancement after contract enforcement?
