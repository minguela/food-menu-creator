export type IngredientNutritionValues = {
  kcal_per_100g?: number | null;
  protein_per_100g?: number | null;
  carbs_per_100g?: number | null;
  fat_per_100g?: number | null;
};

export type IngredientNutritionQuality = {
  hasCompleteNutrition: boolean;
  calculatedKcal: number | null;
  macroAboveLimit: boolean;
  kcalMismatch: boolean;
  zeroSuspicious: boolean;
  missingFields: Array<keyof IngredientNutritionValues>;
  warnings: string[];
  status: "ok" | "incomplete" | "inconsistent";
  needsReview: boolean;
};

const toFiniteNumberOrNull = (value: number | null | undefined) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

export const validateIngredientNutritionQuality = (
  nutrition?: IngredientNutritionValues | null,
  options: { kcalTolerance?: number } = {},
) => {
  const kcalTolerance = options.kcalTolerance ?? 50;
  const kcal = toFiniteNumberOrNull(nutrition?.kcal_per_100g);
  const protein = toFiniteNumberOrNull(nutrition?.protein_per_100g);
  const carbs = toFiniteNumberOrNull(nutrition?.carbs_per_100g);
  const fat = toFiniteNumberOrNull(nutrition?.fat_per_100g);
  const values = {
    kcal_per_100g: kcal,
    protein_per_100g: protein,
    carbs_per_100g: carbs,
    fat_per_100g: fat,
  };
  const missingFields = Object.entries(values)
    .filter(([, value]) => value === null)
    .map(([key]) => key as keyof IngredientNutritionValues);
  const hasCompleteNutrition = missingFields.length === 0;
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
    Math.abs(kcal - calculatedKcal) > kcalTolerance;
  const zeroSuspicious =
    hasCompleteNutrition &&
    (kcal === 0 || (protein === 0 && carbs === 0 && fat === 0));
  const warnings: string[] = [];

  if (missingFields.length > 0) warnings.push("Datos incompletos");
  if (macroAboveLimit) warnings.push("Macros por encima de 100g");
  if (kcalMismatch) warnings.push("kcal incoherentes con macros");
  if (zeroSuspicious) warnings.push("Valores 0 sospechosos");

  const status =
    missingFields.length > 0
      ? "incomplete"
      : macroAboveLimit || kcalMismatch || zeroSuspicious
        ? "inconsistent"
        : "ok";

  return {
    hasCompleteNutrition,
    calculatedKcal,
    macroAboveLimit,
    kcalMismatch,
    zeroSuspicious,
    missingFields,
    warnings,
    status,
    needsReview: status !== "ok",
  } satisfies IngredientNutritionQuality;
};
