import test from "node:test";
import assert from "node:assert/strict";
import { summarizeRotatingGenerationErrorData } from "../app/utils/rotating-job-failure.js";

test("summarizes discarded rotating meal options and affected dishes", () => {
  const summary = summarizeRotatingGenerationErrorData({
    empty_required_types: ["desayuno"],
    discarded_meal_options: [
      { reason: "missing_ingredient_link", meal_type: "desayuno", dish_name: "Jamon con tomate" },
      { reason: "missing_ingredient_link", meal_type: "desayuno", dish_name: "Jamon con tomate" },
      { reason: "recipe_not_validated", meal_type: "comida", dish_name: "Pasta" },
    ],
  });

  assert.deepEqual(summary.empty_required_types, ["desayuno"]);
  assert.equal(summary.discarded_total, 3);
  assert.deepEqual(summary.discarded_by_reason, {
    missing_ingredient_link: 2,
    recipe_not_validated: 1,
  });
  assert.deepEqual(summary.affected_dishes, ["Jamon con tomate", "Pasta"]);
});

test("summarizes uncured recipes and blocking ingredients", () => {
  const summary = summarizeRotatingGenerationErrorData({
    uncured_recipes: [
      {
        reason: "missing_nutrition",
        blocking_ingredients: ["tomate", "jamon"],
      },
      {
        reason: "missing_nutrition",
        blocking_ingredients: ["tomate"],
      },
    ],
  });

  assert.equal(summary.uncured_total, 2);
  assert.deepEqual(summary.uncured_by_reason, { missing_nutrition: 2 });
  assert.deepEqual(summary.blocking_ingredients, ["tomate", "jamon"]);
});
