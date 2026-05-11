## 1. Generator Behavior

- [x] 1.1 Change day nutrition tolerance branch from `error/failed` to `warn/completed`.
- [x] 1.2 Remove `422` throw for day nutrition tolerance misses.
- [x] 1.3 Return warning diagnostics in successful response.

## 2. Regression Tests

- [x] 2.1 Update Playwright scaling guardrail wording to ensure tolerance misses are warning diagnostics.
- [x] 2.2 Run rotating unit tests.
- [x] 2.3 Run Playwright rotating scaling tests.
- [x] 2.4 Run production build.

## 3. Documentation

- [x] 3.1 Update task log with previous scaling fixes and this warning behavior change.
- [x] 3.2 Archive this OpenSpec after validation.
