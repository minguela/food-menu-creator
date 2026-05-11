## 1. Implement name-based compound meal fallback

- [ ] 1.1 In the recipe matching loop, after checking `compound_day_id`, add a fallback when `linkedDish` is null and `dish_name` contains `+`
- [ ] 1.2 Split `dish_name` by `/\s*\+\s*/`, normalize each part
- [ ] 1.3 Look up each part in `dishByNormalizedName`
- [ ] 1.4 If all parts found, construct virtual compound dish and add to `dishByNormalizedName`
- [ ] 1.5 If any part missing, discard with `recipe_name_not_found`

## 2. Validation and testing

- [ ] 2.1 Verify virtual compound dishes from name-splitting are validated in the same loop as compound_day_id-based ones
- [ ] 2.2 Test build passes
- [ ] 2.3 Commit, push, and create PR
- [ ] 2.4 Merge to main
