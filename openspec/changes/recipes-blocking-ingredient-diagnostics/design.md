## Context

Current blocking feedback is coarse (recipe-level reason) and does not always reveal exact ingredient-level blockers directly in recipes view.

## Goals / Non-Goals

**Goals:**
- Show ingredient-level blockers inside recipe curation UI.
- Enable quick correction path from the same screen.

**Non-Goals:**
- Replacing existing rotating-job logs UI.

## Decisions

1. Add a computed diagnostics section in recipe edit that highlights rows with:
   - missing `ingredient_id`
   - missing/incomplete nutrition
2. Add summary chips on recipe cards (`X bloqueos`).
3. Optionally extend backend endpoint payload for consistency with rotating errors.

## Risks / Trade-offs

- **[Risk] Information overload** → Mitigation: collapsible diagnostics block.
- **[Risk] Extra queries** → Mitigation: derive from already loaded recipe rows when possible.
