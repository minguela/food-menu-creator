import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateDensityScaledQuantity,
  computeAppliedMultiplier,
  resolveCaloricDensityBucket,
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
        tolerance_percent: 10,
        kcal_lower_bound: 1710,
      },
    ],
    minKcalRatio: 0.8,
    minProteinRatio: 0.75,
  });

  assert.equal(violations.length, 1);
  assert.equal(violations[0].profile_id, "david");
  assert.equal(violations[0].kcal_lower_bound, 1710);
  assert.ok(violations[0].kcal_ratio < 0.8);
  assert.ok(violations[0].protein_ratio < 0.75);
});

test("uses profile-specific kcal tolerance instead of one global ratio", () => {
  const strictViolations = validateDayNutritionTotals({
    dayTotals: [
      {
        profile_id: "strict",
        profile_name: "Strict",
        all_special_day: false,
        target_kcal: 1900,
        regular_kcal: 1660,
        total_kcal: 1660,
        target_protein_g: 120,
        total_protein_g: 120,
        tolerance_percent: 10,
        kcal_lower_bound: 1710,
      },
    ],
    minKcalRatio: 0.8,
    minProteinRatio: 0.75,
  });
  const relaxedViolations = validateDayNutritionTotals({
    dayTotals: [
      {
        profile_id: "relaxed",
        profile_name: "Relaxed",
        all_special_day: false,
        target_kcal: 1900,
        regular_kcal: 1660,
        total_kcal: 1660,
        target_protein_g: 120,
        total_protein_g: 120,
        tolerance_percent: 15,
        kcal_lower_bound: 1615,
      },
    ],
    minKcalRatio: 0.95,
    minProteinRatio: 0.75,
  });

  assert.equal(strictViolations.length, 1);
  assert.equal(relaxedViolations.length, 0);
});

test("weekly fixed meal ingredient bases scale above their curated quantities", () => {
  const decision = computeAppliedMultiplier({
    desiredMultiplier: 1.8,
    minMultiplier: 1,
    densityCap: 8,
    maxMultiplier: 8,
  });
  const bread = calculateDensityScaledQuantity({
    baseQuantity: 120,
    mealMultiplier: decision.appliedMultiplier,
    caloricDensityLevel: "normal",
    kcalPer100g: 250,
  });

  assert.ok(bread.finalQuantity >= 120);
  assert.ok(bread.finalQuantity > 120);
});

test("scales low density ingredients more than very caloric ingredients", () => {
  const oil = calculateDensityScaledQuantity({
    baseQuantity: 10,
    mealMultiplier: 4,
    caloricDensityLevel: "very_caloric",
    kcalPer100g: 884,
  });
  const tomato = calculateDensityScaledQuantity({
    baseQuantity: 10,
    mealMultiplier: 4,
    caloricDensityLevel: "low",
    kcalPer100g: 20,
  });

  assert.equal(oil.densityBucket, "very_caloric");
  assert.equal(tomato.densityBucket, "low");
  assert.ok(oil.finalQuantity > 10);
  assert.ok(tomato.finalQuantity > oil.finalQuantity);
  assert.ok(tomato.ingredientMultiplier > oil.ingredientMultiplier);
});

test("infers density bucket from kcal per 100g when label is missing", () => {
  assert.equal(resolveCaloricDensityBucket({ kcalPer100g: 500 }), "very_caloric");
  assert.equal(resolveCaloricDensityBucket({ kcalPer100g: 250 }), "caloric");
  assert.equal(resolveCaloricDensityBucket({ kcalPer100g: 35 }), "low");
  assert.equal(resolveCaloricDensityBucket({ kcalPer100g: 120 }), "normal");
});
