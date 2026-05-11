## Context

The project uses Nuxt + Tailwind utilities directly in Vue templates. Dark mode exists visually but is not systematically enforced, so light-only utilities (`bg-white`, light borders, dark text on dark surfaces) still appear in several pages. Previous global CSS overrides temporarily masked the issue but broke utility semantics and created maintenance risk.

In parallel, ingredient CSV import currently fails with `500 duplicate key value violates unique constraint "ingredients_name_key"` when the file includes names that already exist (or duplicates resolve to the same normalized key). This should be treated as a recoverable data condition, not a hard server error.

## Goals / Non-Goals

**Goals:**
- Make dark mode reliable without overriding Tailwind utility meaning globally.
- Ensure every user-facing page and shared surface component has explicit dark-safe classes.
- Introduce a repeatable audit mechanism to detect regressions before merge.
- Make CSV ingredient import idempotent so repeated imports do not crash and provide a useful per-row outcome summary.

**Non-Goals:**
- Implementing theme toggles or user preference storage.
- Rebuilding page layouts or changing data flows.
- Altering Supabase functions, migrations, or API contracts.
- Replacing the manual-first ingredient workflow.

## Decisions

1. **Tailwind-first theming contract**
   - Use explicit dual classes in templates for semantic surfaces (`bg-white dark:bg-slate-900`, `text-slate-900 dark:text-slate-100`, etc.).
   - Rationale: keeps behavior local and predictable, avoids hidden global side effects.
   - Alternative considered: global CSS remapping of utility classes. Rejected because it breaks class semantics and surprises contributors.

2. **Tokenized reusable patterns for repeated blocks**
   - Define canonical class combinations for common UI primitives (card, modal, panel, table row, empty state, alert).
   - Rationale: reduces copy-paste drift and improves consistency across pages.
   - Alternative considered: leaving per-page handcrafted class sets. Rejected due to regression risk.

3. **Automated static audit for light-only classes**
   - Add script/check to flag suspicious light-only usages in page/component templates where no `dark:` counterpart exists.
   - Rationale: catches regressions early during CI and local checks.
   - Alternative considered: manual QA only. Rejected because it does not scale.

4. **Keep global CSS minimal and non-destructive**
   - `main.css` may define brand tokens and background atmosphere but MUST NOT reinterpret Tailwind utilities globally.
    - Rationale: preserves expected Tailwind behavior and reduces debugging complexity.

5. **Idempotent CSV import strategy**
   - Normalize each incoming ingredient key and deduplicate input rows before persistence.
   - Persist using conflict-safe semantics (upsert/update merge path) keyed by stable identity (`name`/`normalized_name` as implemented in current schema).
   - Return structured import results: `inserted`, `updated`, `skipped`, `conflicts`, and optional row-level diagnostics.
   - Rationale: imports are operational workflows; duplicate rows are expected and should not produce 500.
   - Alternative considered: keep strict insert-only and force users to pre-clean files. Rejected due to poor UX and repeated failures.

6. **Frontend feedback alignment for CSV import**
   - Surface import summary in UI toast/modal after import, including conflict/skipped counts.
   - Rationale: user can resolve issues immediately without guessing backend behavior.

## Risks / Trade-offs

- **[Risk] False positives in class audit script** → Mitigation: allow targeted inline ignore comments for justified exceptions.
- **[Risk] Large touch surface across many pages** → Mitigation: rollout by page groups with checklist verification.
- **[Risk] Visual mismatch between old and new class patterns** → Mitigation: define and apply shared patterns before sweeping replacements.
- **[Trade-off] More verbose class attributes** → Mitigation: centralize repetitive patterns into agreed snippets/components over time.
- **[Risk] Over-merging distinct ingredients with similar normalized keys** → Mitigation: preserve original display name where possible and report merged/skipped rows explicitly.
- **[Risk] Behavior change for existing import expectations** → Mitigation: include deterministic summary contract and update UI copy/documentation.
