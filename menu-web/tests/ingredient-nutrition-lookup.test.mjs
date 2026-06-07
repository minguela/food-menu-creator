import assert from "node:assert/strict";
import test from "node:test";

import { buildNutritionLookups } from "../server/utils/ingredient-nutrition-lookup.js";

test("indexes nutrition rows by display name when normalized_name uses underscores", () => {
  const ingredient = {
    id: "ing-pan",
    name: "pan integral",
    normalized_name: "pan_integral",
    nutrition_status: "complete",
  };

  const { nutritionByNormalizedName } = buildNutritionLookups([ingredient]);

  assert.equal(nutritionByNormalizedName.get("pan integral"), ingredient);
});
