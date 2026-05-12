import { expect, test } from "@playwright/test";
import {
  calculateRecipeMacros,
  scaleNutritionTotals,
} from "../utils/nutrition/calculateRecipeMacros";
import {
  profileTargetsFromProfile,
  ProfileTargetValidationError,
} from "../utils/nutrition/profileTargets";
import {
  scoreMenu,
  selectBestScoredOption,
} from "../utils/nutrition/menuScoring";
import {
  ingredientsFixture,
  nutritionProfileFixture,
  recipeFixtures,
} from "./helpers/nutrition-generator-fixtures";

test.describe("nutrition generator primitives", () => {
  test("calculates recipe macros from real ingredient quantities", () => {
    const result = calculateRecipeMacros([
      {
        id: "ri-test-chicken",
        ingredient_id: ingredientsFixture.chicken.id,
        name: ingredientsFixture.chicken.name,
        quantity: 150,
        unit_type: "g",
        is_confirmed: true,
        ingredients: ingredientsFixture.chicken,
      },
    ]);

    expect(result.complete).toBe(true);
    expect(result.totals).toEqual({
      kcal: 247.5,
      proteinG: 46.5,
      carbsG: 0,
      fatG: 5.4,
    });
  });

  test("excludes incomplete nutrition instead of inventing macros", () => {
    const result = calculateRecipeMacros([
      {
        id: "ri-missing",
        ingredient_id: "ing-missing",
        name: "Ingrediente incompleto",
        quantity: 100,
        unit_type: "g",
        is_confirmed: true,
        ingredients: {
          id: "ing-missing",
          name: "Ingrediente incompleto",
          nutrition_status: "pending",
          kcal_per_100g: null,
          protein_per_100g: null,
          carbs_per_100g: null,
          fat_per_100g: null,
        },
      },
    ]);

    expect(result.complete).toBe(false);
    expect(result.totals.kcal).toBe(0);
    expect(result.issues.map((issue) => issue.code)).toContain(
      "incomplete_nutrition",
    );
  });

  test("converts profile percentages to daily gram targets", () => {
    const targets = profileTargetsFromProfile(nutritionProfileFixture);

    expect(targets.targetKcal).toBe(2000);
    expect(targets.targetProteinG).toBe(130);
    expect(targets.targetCarbsG).toBe(225);
    expect(targets.targetFatG).toBe(66.67);
    expect(targets.bounds.kcal).toEqual({ min: 1800, max: 2200 });
    expect(targets.bounds.proteinG.min).toBe(117);
  });

  test("rejects incoherent profile percentages", () => {
    expect(() =>
      profileTargetsFromProfile({
        ...nutritionProfileFixture,
        carbs_pct_target: 70,
        fat_pct_target: 40,
      }),
    ).toThrow(ProfileTargetValidationError);
  });

  test("scores deviations and penalizes protein shortfall", () => {
    const targets = profileTargetsFromProfile(nutritionProfileFixture);
    const result = scoreMenu({
      totals: {
        kcal: 2000,
        proteinG: 100,
        carbsG: 225,
        fatG: 66.67,
      },
      targets,
    });

    expect(result.meetsTargets).toBe(false);
    expect(result.proteinG.withinTolerance).toBe(false);
    expect(result.penalties.proteinShortfall).toBe(180);
    expect(result.score).toBe(300);
  });

  test("marks a day compliant when totals are inside tolerance", () => {
    const targets = profileTargetsFromProfile(nutritionProfileFixture);
    const result = scoreMenu({
      totals: {
        kcal: 1990,
        proteinG: 132,
        carbsG: 220,
        fatG: 65,
      },
      targets,
    });

    expect(result.meetsTargets).toBe(true);
    expect(result.kcal.withinTolerance).toBe(true);
    expect(result.proteinG.withinTolerance).toBe(true);
  });

  test("scales meal macros by serving multiplier", () => {
    const recipe = calculateRecipeMacros(
      recipeFixtures.lunches.find((item) => item.id === "lunch-chicken-rice")!
        .ingredients,
    );

    const scaled = scaleNutritionTotals(recipe.totals, 1.25);

    expect(scaled.kcal).toBeCloseTo(recipe.totals.kcal * 1.25, 2);
    expect(scaled.proteinG).toBeCloseTo(recipe.totals.proteinG * 1.25, 2);
  });

  test("selects the lowest score with deterministic tie breaker", () => {
    const best = selectBestScoredOption([
      { id: "recipe-c", score: 80, tieBreaker: "recipe-c" },
      { id: "recipe-b", score: 20, tieBreaker: "recipe-b" },
      { id: "recipe-a", score: 20, tieBreaker: "recipe-a" },
    ]);

    expect(best?.id).toBe("recipe-a");
  });

  test("fixtures include requested meal-type coverage", () => {
    expect(recipeFixtures.breakfasts).toHaveLength(3);
    expect(recipeFixtures.lunches).toHaveLength(5);
    expect(recipeFixtures.dinners).toHaveLength(5);
    expect(recipeFixtures.snacks).toHaveLength(2);
  });
});
