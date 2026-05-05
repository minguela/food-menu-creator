type IngredientNutritionValues = {
  kcal_per_100g?: number | null;
  protein_per_100g?: number | null;
  carbs_per_100g?: number | null;
  fat_per_100g?: number | null;
};

const toFiniteNumberOrNull = (value: number | null | undefined) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

export const validateIngredientNutritionQuality = (
  nutrition?: IngredientNutritionValues | null,
) => {
  const kcal = toFiniteNumberOrNull(nutrition?.kcal_per_100g);
  const protein = toFiniteNumberOrNull(nutrition?.protein_per_100g);
  const carbs = toFiniteNumberOrNull(nutrition?.carbs_per_100g);
  const fat = toFiniteNumberOrNull(nutrition?.fat_per_100g);
  const hasCompleteNutrition = [kcal, protein, carbs, fat].every(
    (value) => value !== null,
  );
  const macroAboveLimit =
    (protein !== null && protein > 100) ||
    (carbs !== null && carbs > 100) ||
    (fat !== null && fat > 100);
  const calculatedKcal =
    protein !== null && carbs !== null && fat !== null
      ? protein * 4 + carbs * 4 + fat * 9
      : null;
  const kcalMismatch =
    kcal !== null &&
    calculatedKcal !== null &&
    Math.abs(kcal - calculatedKcal) > 50;

  return {
    hasCompleteNutrition,
    calculatedKcal,
    macroAboveLimit,
    kcalMismatch,
    needsReview: !hasCompleteNutrition || macroAboveLimit || kcalMismatch,
  };
};
