import test from "node:test";
import assert from "node:assert/strict";
import { resolveRecipeIngredientRows } from "../server/utils/rotating-recipe-resolution.js";

test("resolves confirmed recipe rows by normalized name when ingredient_id is missing", () => {
  const nutritionByNormalizedName = new Map([
    [
      "jamon serrano",
      {
        id: "ing-jamon",
        nutrition_status: "complete",
        kcal_per_100g: 240,
        protein_per_100g: 30,
        carbs_per_100g: 0,
        fat_per_100g: 14,
      },
    ],
  ]);

  const result = resolveRecipeIngredientRows({
    confirmedRows: [
      {
        ingredient_id: null,
        name: "Jamón Serrano",
        normalized_name: "jamon serrano",
        quantity: 60,
        unit_type: "g",
      },
    ],
    nutritionByNormalizedName,
  });

  assert.equal(result.unresolvedIngredientNames.length, 0);
  assert.equal(result.ingredientBase[0].ingredient_id, "ing-jamon");
});

test("keeps unresolved ingredient names when no normalized match exists", () => {
  const result = resolveRecipeIngredientRows({
    confirmedRows: [
      {
        ingredient_id: null,
        name: "Pan misterioso",
        normalized_name: "pan misterioso",
        quantity: 60,
        unit_type: "g",
      },
    ],
    nutritionByNormalizedName: new Map(),
  });

  assert.deepEqual(result.unresolvedIngredientNames, ["Pan misterioso"]);
});
