# Nutrition Utilities

These modules are the shared calculation surface for the score-based nutrition
menu generator:

- `calculateRecipeMacros.ts` calculates recipe totals only from confirmed recipe
  ingredients and complete ingredient nutrition per 100g.
- `profileTargets.ts` converts profile kcal/protein/carbs/fat/tolerance settings
  into daily targets and tolerance bounds.
- `menuScoring.ts` calculates deviations, compliance, and score penalties.

The existing `server/api/rotating-menu-generate.post.ts` still contains legacy
macro calculation and scaling logic. It is intentionally left unchanged in the
foundation phase to avoid breaking the current rotating-menu workflow; new
nutrition generator code should use these utilities first, then the legacy route
can be refactored once parity tests exist.
