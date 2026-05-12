import { expect, test } from "@playwright/test";
import {
  calculateDensityScaledQuantity,
  computeAppliedMultiplier,
  resolveCaloricDensityBucket,
  validateDayNutritionTotals,
  validateRecipeBase,
} from "../utils/rotating-portion-scaling.js";

test.describe("rotating menu scaling guardrails", () => {
  test("placeholder 1g recipes do not become hard 409 blockers", async () => {
    const result = validateRecipeBase({
      ingredientBase: [
        { name: "tomate", quantity: 1, unit_type: "g", grams: 1 },
        { name: "pan integral", quantity: 1, unit_type: "g", grams: 1 },
        { name: "jamon iberico", quantity: 1, unit_type: "g", grams: 1 },
      ],
      baseKcal: 20,
      minIngredientGrams: 5,
      minBaseKcal: 50,
      isSpecial: false,
    });

    expect(result.valid).toBe(true);
    expect(result.usesRelativeQuantities).toBe(true);
    expect(result.issues.map((issue) => issue.code)).toContain(
      "implausible_recipe_quantity",
    );
  });

  test("relative recipes can escape the old x2.50 cap", async () => {
    const decision = computeAppliedMultiplier({
      desiredMultiplier: 120,
      minMultiplier: 1,
      densityCap: 500,
      maxMultiplier: 500,
    });

    expect(decision.appliedMultiplier).toBe(120);
    expect(decision.appliedMultiplier).toBeGreaterThan(2.5);
    expect(decision.capReason).toBe("none");
  });

  test("collapsed 54 kcal days are reported as warning diagnostics", async () => {
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

    expect(violations).toHaveLength(1);
    expect(violations[0].kcal_ratio).toBeLessThan(0.8);
  });

  test("density-aware scaling grows low-density ingredients more than very caloric ones", async () => {
    const oil = calculateDensityScaledQuantity({
      baseQuantity: 20,
      mealMultiplier: 3,
      caloricDensityLevel: "very_caloric",
      kcalPer100g: 884,
    });
    const cucumber = calculateDensityScaledQuantity({
      baseQuantity: 20,
      mealMultiplier: 3,
      caloricDensityLevel: "low",
      kcalPer100g: 15,
    });

    expect(oil.finalQuantity).toBeGreaterThanOrEqual(20);
    expect(cucumber.finalQuantity).toBeGreaterThan(oil.finalQuantity);
    expect(cucumber.ingredientMultiplier).toBeGreaterThan(oil.ingredientMultiplier);
    expect(oil.densityBucket).toBe("very_caloric");
    expect(cucumber.densityBucket).toBe("low");
  });

  test("missing density labels fall back to kcal per 100g buckets", async () => {
    expect(resolveCaloricDensityBucket({ kcalPer100g: 450 })).toBe("very_caloric");
    expect(resolveCaloricDensityBucket({ kcalPer100g: 50 })).toBe("low");
  });
});
