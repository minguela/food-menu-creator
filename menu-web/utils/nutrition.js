export const MEAL_TYPES = ["desayuno", "comida", "cena"];

export function validateMacroTargets({ fatPct, carbsPct }) {
  const fat = Number(fatPct);
  const carbs = Number(carbsPct);
  const protein = 100 - fat - carbs;

  if (!Number.isFinite(fat) || !Number.isFinite(carbs)) {
    return {
      valid: false,
      proteinPct: protein,
      message: "Los porcentajes deben ser numéricos.",
    };
  }

  if (fat <= 0 || carbs <= 0 || protein <= 0) {
    return {
      valid: false,
      proteinPct: protein,
      message: "Cada macronutriente debe ser mayor que 0.",
    };
  }

  if (fat > 70 || carbs > 80 || protein > 50) {
    return {
      valid: false,
      proteinPct: protein,
      message: "La distribución de macros no es nutricionalmente razonable.",
    };
  }

  return { valid: true, proteinPct: protein, message: "" };
}

export function macroTargetsFromCalories(kcal, { fatPct, carbsPct }) {
  const validation = validateMacroTargets({ fatPct, carbsPct });
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const calories = Number(kcal);

  return {
    kcal: calories,
    fat_g: round((calories * Number(fatPct)) / 100 / 9),
    carbs_g: round((calories * Number(carbsPct)) / 100 / 4),
    protein_g: round((calories * validation.proteinPct) / 100 / 4),
    protein_pct: validation.proteinPct,
  };
}

export function summarizeDailyMeals(meals) {
  return meals.reduce(
    (total, meal) => ({
      kcal: total.kcal + toNumber(meal.kcal),
      protein_g: round(total.protein_g + toNumber(meal.protein_g)),
      carbs_g: round(total.carbs_g + toNumber(meal.carbs_g)),
      fat_g: round(total.fat_g + toNumber(meal.fat_g)),
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
}

export function macroPercentagesFromGrams({ protein_g, carbs_g, fat_g }) {
  const proteinKcal = toNumber(protein_g) * 4;
  const carbsKcal = toNumber(carbs_g) * 4;
  const fatKcal = toNumber(fat_g) * 9;
  const total = proteinKcal + carbsKcal + fatKcal;

  if (total === 0) {
    return { protein_pct: 0, carbs_pct: 0, fat_pct: 0 };
  }

  return {
    protein_pct: round((proteinKcal / total) * 100),
    carbs_pct: round((carbsKcal / total) * 100),
    fat_pct: round((fatKcal / total) * 100),
  };
}

function toNumber(value) {
  return Number(value) || 0;
}

function round(value) {
  return Math.round(value * 10) / 10;
}
