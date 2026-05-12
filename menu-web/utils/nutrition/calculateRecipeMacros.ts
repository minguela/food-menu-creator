import type { Ingredient, RecipeIngredient } from "~/types";

export type NutritionTotals = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type RecipeMacroIssueCode =
  | "unconfirmed_ingredient"
  | "missing_quantity"
  | "unsupported_unit"
  | "missing_ingredient"
  | "incomplete_nutrition";

export type RecipeMacroIssue = {
  code: RecipeMacroIssueCode;
  ingredientName: string;
  recipeIngredientId?: string;
};

export type IngredientMacroContribution = NutritionTotals & {
  recipeIngredientId?: string;
  ingredientId?: string | null;
  ingredientName: string;
  quantityG: number;
};

type IngredientNutrition = Pick<
  Ingredient,
  | "id"
  | "name"
  | "nutrition_status"
  | "kcal_per_100g"
  | "protein_per_100g"
  | "carbs_per_100g"
  | "fat_per_100g"
>;

export type RecipeIngredientMacroInput = Pick<
  RecipeIngredient,
  | "id"
  | "ingredient_id"
  | "name"
  | "quantity"
  | "unit_type"
  | "is_confirmed"
> & {
  quantity_g?: number | null;
  ingredients?: IngredientNutrition | null;
  ingredient?: IngredientNutrition | null;
};

export type RecipeMacroCalculation = {
  complete: boolean;
  totals: NutritionTotals;
  ingredientContributions: IngredientMacroContribution[];
  issues: RecipeMacroIssue[];
};

export const EMPTY_NUTRITION_TOTALS: NutritionTotals = {
  kcal: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
};

export const SERVING_MULTIPLIERS = [0.75, 1, 1.25, 1.5] as const;

export type ServingMultiplier = (typeof SERVING_MULTIPLIERS)[number];

export function calculateRecipeMacros(
  recipeIngredients: RecipeIngredientMacroInput[],
): RecipeMacroCalculation {
  const issues: RecipeMacroIssue[] = [];
  const ingredientContributions: IngredientMacroContribution[] = [];
  let totals = { ...EMPTY_NUTRITION_TOTALS };

  for (const row of recipeIngredients) {
    const ingredientName = String(row.name || "Ingrediente");
    if (!row.is_confirmed) {
      issues.push({
        code: "unconfirmed_ingredient",
        ingredientName,
        recipeIngredientId: row.id,
      });
      continue;
    }

    const quantityG = resolveQuantityG(row);
    if (quantityG === null) {
      issues.push({
        code: Number(row.quantity ?? row.quantity_g ?? 0) > 0
          ? "unsupported_unit"
          : "missing_quantity",
        ingredientName,
        recipeIngredientId: row.id,
      });
      continue;
    }

    const nutrition = row.ingredients || row.ingredient || null;
    if (!nutrition) {
      issues.push({
        code: "missing_ingredient",
        ingredientName,
        recipeIngredientId: row.id,
      });
      continue;
    }

    if (!hasCompleteNutrition(nutrition)) {
      issues.push({
        code: "incomplete_nutrition",
        ingredientName,
        recipeIngredientId: row.id,
      });
      continue;
    }

    const factor = quantityG / 100;
    const contribution = roundTotals({
      kcal: Number(nutrition.kcal_per_100g) * factor,
      proteinG: Number(nutrition.protein_per_100g) * factor,
      carbsG: Number(nutrition.carbs_per_100g) * factor,
      fatG: Number(nutrition.fat_per_100g) * factor,
    });

    ingredientContributions.push({
      ...contribution,
      recipeIngredientId: row.id,
      ingredientId: row.ingredient_id,
      ingredientName,
      quantityG,
    });
    totals = addNutritionTotals(totals, contribution);
  }

  return {
    complete: issues.length === 0 && ingredientContributions.length > 0,
    totals: roundTotals(totals),
    ingredientContributions,
    issues,
  };
}

export function normalizeQuantityToGrams(
  quantity: number,
  unitType?: string | null,
): number | null {
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  const unit = String(unitType || "").trim().toLowerCase();
  if (unit === "g") return quantity;
  if (unit === "kg") return quantity * 1000;
  if (unit === "ml") return quantity;
  if (unit === "l") return quantity * 1000;
  return null;
}

export function addNutritionTotals(
  left: NutritionTotals,
  right: NutritionTotals,
): NutritionTotals {
  return roundTotals({
    kcal: Number(left.kcal || 0) + Number(right.kcal || 0),
    proteinG: Number(left.proteinG || 0) + Number(right.proteinG || 0),
    carbsG: Number(left.carbsG || 0) + Number(right.carbsG || 0),
    fatG: Number(left.fatG || 0) + Number(right.fatG || 0),
  });
}

export function scaleNutritionTotals(
  totals: NutritionTotals,
  multiplier: number,
): NutritionTotals {
  const factor = Number(multiplier);
  return roundTotals({
    kcal: Number(totals.kcal || 0) * factor,
    proteinG: Number(totals.proteinG || 0) * factor,
    carbsG: Number(totals.carbsG || 0) * factor,
    fatG: Number(totals.fatG || 0) * factor,
  });
}

export function roundNutrition(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function resolveQuantityG(row: RecipeIngredientMacroInput): number | null {
  if (Number.isFinite(Number(row.quantity_g)) && Number(row.quantity_g) > 0) {
    return Number(row.quantity_g);
  }
  return normalizeQuantityToGrams(Number(row.quantity), row.unit_type);
}

function hasCompleteNutrition(ingredient: IngredientNutrition): boolean {
  if (
    ingredient.nutrition_status != null &&
    ingredient.nutrition_status !== "complete"
  ) {
    return false;
  }

  return [
    ingredient.kcal_per_100g,
    ingredient.protein_per_100g,
    ingredient.carbs_per_100g,
    ingredient.fat_per_100g,
  ].every((value) => Number.isFinite(Number(value)));
}

function roundTotals(totals: NutritionTotals): NutritionTotals {
  return {
    kcal: roundNutrition(totals.kcal),
    proteinG: roundNutrition(totals.proteinG),
    carbsG: roundNutrition(totals.carbsG),
    fatG: roundNutrition(totals.fatG),
  };
}
