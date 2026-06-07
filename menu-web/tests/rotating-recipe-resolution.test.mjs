import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveRecipeIngredientRows,
  resolveWeeklyIngredientRows,
} from "../server/utils/rotating-recipe-resolution.js";

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

test("resolves confirmed recipe rows when stored normalized_name uses underscores", () => {
  const nutritionByNormalizedName = new Map([
    [
      "pan integral",
      {
        id: "ing-pan",
        nutrition_status: "complete",
        kcal_per_100g: 247,
        protein_per_100g: 13,
        carbs_per_100g: 41,
        fat_per_100g: 4.2,
      },
    ],
  ]);

  const result = resolveRecipeIngredientRows({
    confirmedRows: [
      {
        ingredient_id: null,
        name: "pan integral",
        normalized_name: "pan_integral",
        quantity: 60,
        unit_type: "g",
      },
    ],
    nutritionByNormalizedName,
  });

  assert.equal(result.unresolvedIngredientNames.length, 0);
  assert.equal(result.ingredientBase[0].ingredient_id, "ing-pan");
});

test("resolves weekly ingredient rows by ingredient_id before falling back to names", () => {
  const nutritionById = new Map([
    [
      "ing-pina",
      {
        id: "ing-pina",
        name: "piña",
        normalized_name: "pina",
        nutrition_status: "complete",
        kcal_per_100g: 50,
        protein_per_100g: 0.5,
        carbs_per_100g: 13,
        fat_per_100g: 0.1,
      },
    ],
  ]);

  const result = resolveWeeklyIngredientRows({
    ingredientRows: [
      {
        ingredient_id: "ing-pina",
        name: "nombre antiguo que ya no coincide",
        quantity: 100,
        unit_type: "g",
      },
    ],
    nutritionById,
    nutritionByNormalizedName: new Map(),
  });

  assert.equal(result.unresolvedIngredientNames.length, 0);
  assert.equal(result.ingredientBase[0].ingredient_id, "ing-pina");
  assert.equal(result.ingredientBase[0].normalized_name, "pina");
});
