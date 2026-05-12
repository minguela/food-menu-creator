import test from "node:test";
import assert from "node:assert/strict";
import {
  macroPercentagesFromGrams,
  macroTargetsFromCalories,
  summarizeDailyMeals,
  validateMacroTargets,
} from "../utils/nutrition.js";

test("deduces protein percentage from fat and carbs", () => {
  const result = validateMacroTargets({ fatPct: 30, carbsPct: 45 });

  assert.equal(result.valid, true);
  assert.equal(result.proteinPct, 25);
});

test("rejects macro combinations without carbohydrates or protein floor", () => {
  const result = validateMacroTargets({ fatPct: 50, carbsPct: 0 });

  assert.equal(result.valid, false);
  assert.match(result.message, /al menos/);
});

test("converts macro percentages to grams from calories", () => {
  const result = macroTargetsFromCalories(2000, { fatPct: 30, carbsPct: 45 });

  assert.equal(result.fat_g, 66.7);
  assert.equal(result.carbs_g, 225);
  assert.equal(result.protein_g, 125);
});

test("summarizes desayuno, comida and cena into daily balance", () => {
  const result = summarizeDailyMeals([
    { kcal: 400, protein_g: 20, carbs_g: 50, fat_g: 10 },
    { kcal: 700, protein_g: 45, carbs_g: 80, fat_g: 20 },
    { kcal: 600, protein_g: 35, carbs_g: 45, fat_g: 22 },
  ]);

  assert.deepEqual(result, {
    kcal: 1700,
    protein_g: 100,
    carbs_g: 175,
    fat_g: 52,
  });
});

test("calculates realized macro percentages from grams", () => {
  const result = macroPercentagesFromGrams({
    protein_g: 100,
    carbs_g: 175,
    fat_g: 52,
  });

  assert.equal(result.protein_pct, 25.5);
  assert.equal(result.carbs_pct, 44.6);
  assert.equal(result.fat_pct, 29.8);
});
