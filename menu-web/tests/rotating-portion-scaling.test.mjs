import test from "node:test";
import assert from "node:assert/strict";
import {
  computeAppliedMultiplier,
  validateDayNutritionTotals,
  validateRecipeBase,
} from "../utils/rotating-portion-scaling.js";

test("marks implausible 1g ingredient recipe bases as relative quantities", () => {
  const result = validateRecipeBase({
    ingredientBase: [
      { name: "tomate", quantity: 1, unit_type: "g", grams: 1 },
      { name: "pan", quantity: 1, unit_type: "g", grams: 1 },
      { name: "jamon", quantity: 1, unit_type: "g", grams: 1 },
    ],
    baseKcal: 20,
    minIngredientGrams: 5,
    minBaseKcal: 50,
    isSpecial: false,
  });

  assert.equal(result.valid, true);
  assert.equal(result.usesRelativeQuantities, true);
  assert.ok(result.issues.some((issue) => issue.code === "implausible_recipe_quantity"));
  assert.ok(result.issues.some((issue) => issue.code === "implausible_recipe_base_kcal"));
});

test("allows relative placeholder recipes to use large target-fitting multipliers", () => {
  const decision = computeAppliedMultiplier({
    desiredMultiplier: 120,
    minMultiplier: 1,
    densityCap: 500,
    maxMultiplier: 500,
  });

  assert.equal(decision.appliedMultiplier, 120);
  assert.equal(decision.capReason, "none");
});

test("keeps applied multiplier at or above base quantity", () => {
  const decision = computeAppliedMultiplier({
    desiredMultiplier: 0.6,
    minMultiplier: 1,
    densityCap: 2.5,
    maxMultiplier: 8,
  });

  assert.equal(decision.appliedMultiplier, 1);
  assert.equal(decision.capReason, "none");
});

test("flags collapsed day totals against kcal and protein guardrails", () => {
  const violations = validateDayNutritionTotals({
    dayTotals: [
      {
        profile_id: "david",
        profile_name: "David",
        all_special_day: false,
        target_kcal: 1900,
        regular_kcal: 54,
        total_kcal: 54,
        target_protein_g: 120,
        total_protein_g: 1.2,
      },
    ],
    minKcalRatio: 0.8,
    minProteinRatio: 0.75,
  });

  assert.equal(violations.length, 1);
  assert.equal(violations[0].profile_id, "david");
  assert.ok(violations[0].kcal_ratio < 0.8);
  assert.ok(violations[0].protein_ratio < 0.75);
});
