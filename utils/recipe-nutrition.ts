import type { Ingredient, RecipeIngredient } from "~/types";

export type NutritionTotals = {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  complete: boolean;
  missing_ingredients: string[];
};

const round = (value: number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export const normalizeToGrams = (
  quantity: number,
  unitType?: string | null,
): number | null => {
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  if (unitType === "g") return quantity;
  if (unitType === "kg") return quantity * 1000;
  if (unitType === "ml") return quantity;
  if (unitType === "l") return quantity * 1000;
  return null;
};

export const calculateIngredientNutrition = ({
  quantity,
  unit_type,
  ingredientNutrition,
}: {
  quantity: number;
  unit_type?: string | null;
  ingredientNutrition?: Ingredient | null;
}) => {
  const grams = normalizeToGrams(quantity, unit_type);
  if (!ingredientNutrition || grams === null) {
    return { complete: false, kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  }
  const { kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g } =
    ingredientNutrition;
  if (
    kcal_per_100g == null ||
    protein_per_100g == null ||
    carbs_per_100g == null ||
    fat_per_100g == null
  ) {
    return { complete: false, kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  }
  const factor = grams / 100;
  return {
    complete: true,
    kcal: round(Number(kcal_per_100g) * factor),
    protein_g: round(Number(protein_per_100g) * factor),
    carbs_g: round(Number(carbs_per_100g) * factor),
    fat_g: round(Number(fat_per_100g) * factor),
  };
};

export const calculateRecipeNutrition = (
  recipeIngredients: Array<
    RecipeIngredient & { ingredients?: Ingredient | null }
  >,
): NutritionTotals => {
  const totals: NutritionTotals = {
    kcal: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    complete: true,
    missing_ingredients: [],
  };

  for (const row of recipeIngredients) {
    if (!row.is_confirmed) continue;
    if (!row.quantity || row.quantity <= 0 || !row.unit_type) {
      totals.complete = false;
      totals.missing_ingredients.push(row.name);
      continue;
    }
    const nutrition = calculateIngredientNutrition({
      quantity: Number(row.quantity),
      unit_type: row.unit_type,
      ingredientNutrition: row.ingredients || null,
    });
    if (!nutrition.complete) {
      totals.complete = false;
      totals.missing_ingredients.push(row.name);
      continue;
    }
    totals.kcal += nutrition.kcal;
    totals.protein_g += nutrition.protein_g;
    totals.carbs_g += nutrition.carbs_g;
    totals.fat_g += nutrition.fat_g;
  }

  totals.kcal = round(totals.kcal);
  totals.protein_g = round(totals.protein_g);
  totals.carbs_g = round(totals.carbs_g);
  totals.fat_g = round(totals.fat_g);
  totals.missing_ingredients = Array.from(new Set(totals.missing_ingredients));
  return totals;
};
