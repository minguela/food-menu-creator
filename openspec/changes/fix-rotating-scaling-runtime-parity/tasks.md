## 1. Runtime Root Parity

- [x] 1.1 Port root `server/api/rotating-menu-generate.post.ts` to non-collapsing scaling rules.
- [x] 1.2 Add root utility helpers for recipe-base validation, multiplier capping and day guardrails.
- [x] 1.3 Ensure persisted `serving_multiplier` equals applied multiplier.

## 2. Regression Coverage

- [x] 2.1 Add root tests for implausible 1 g recipes.
- [x] 2.2 Add root tests for collapsed day guardrail.
- [x] 2.3 Wire tests into root `test:rotating` script.
- [x] 2.4 Add Playwright coverage for placeholder recipes, x2.50 cap regression and collapsed-day guardrail.

## 3. Verification

- [x] 3.1 Run `npm run test:rotating` at repository root.
- [x] 3.2 Run `npm run build` at repository root.
- [x] 3.3 Mark OpenSpec complete for apply-ready status.
