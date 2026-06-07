import test from "node:test";
import assert from "node:assert/strict";
import { chooseRotatingMealSource } from "../server/utils/rotating-meal-source.js";

test("falls back to linked recipe when explicit weekly ingredients are invalid", () => {
  const result = chooseRotatingMealSource({
    hasExplicitWeeklyIngredients: true,
    weeklyMealVirtualRecipeId: "weekly-meal:1",
    validRecipeById: new Map([["dish-1", { dish_id: "dish-1" }]]),
    linkedDish: { id: "dish-1" },
    invalidWeeklyMealReason: "missing_ingredient_link",
  });

  assert.deepEqual(result, { mode: "linked_fallback" });
});

test("keeps weekly source when explicit weekly ingredients are valid", () => {
  const result = chooseRotatingMealSource({
    hasExplicitWeeklyIngredients: true,
    weeklyMealVirtualRecipeId: "weekly-meal:1",
    validRecipeById: new Map([["weekly-meal:1", { dish_id: "weekly-meal:1" }]]),
    linkedDish: { id: "dish-1" },
    invalidWeeklyMealReason: "missing_ingredient_link",
  });

  assert.deepEqual(result, { mode: "weekly" });
});

test("discards when neither weekly nor linked recipe are valid", () => {
  const result = chooseRotatingMealSource({
    hasExplicitWeeklyIngredients: true,
    weeklyMealVirtualRecipeId: "weekly-meal:1",
    validRecipeById: new Map(),
    linkedDish: { id: "dish-1" },
    invalidWeeklyMealReason: "missing_ingredient_link",
  });

  assert.deepEqual(result, {
    mode: "discard",
    reason: "missing_ingredient_link",
  });
});
