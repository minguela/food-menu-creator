import { normalizeIngredientLookupKey } from "./ingredient-nutrition-lookup.js";

/**
 * @param {{
 *   confirmedRows?: any[];
 *   nutritionByNormalizedName?: Map<string, any>;
 * }} params
 */
export const resolveRecipeIngredientRows = ({
  confirmedRows = [],
  nutritionByNormalizedName = new Map(),
}) => {
  const ingredientBase = confirmedRows.map((row) => {
    const normalizedName = normalizeIngredientLookupKey(
      row.normalized_name || row.name,
    );
    const matchedIngredient =
      row.ingredient_id || !normalizedName
        ? null
        : nutritionByNormalizedName.get(normalizedName);

    return {
      ingredient_id: row.ingredient_id || matchedIngredient?.id || null,
      name: String(row.name || ""),
      normalized_name: normalizedName,
      quantity: Number(row.quantity),
      unit_type: String(row.unit_type || ""),
    };
  });

  const unresolvedIngredientNames = Array.from(
    new Set(
      ingredientBase
        .filter((row) => !row.ingredient_id)
        .map((row) => String(row.name || "").trim())
        .filter(Boolean),
    ),
  );

  return {
    ingredientBase,
    unresolvedIngredientNames,
  };
};

/**
 * @param {{
 *   ingredientRows?: any[];
 *   nutritionById?: Map<string, any>;
 *   nutritionByNormalizedName?: Map<string, any>;
 * }} params
 */
export const resolveWeeklyIngredientRows = ({
  ingredientRows = [],
  nutritionById = new Map(),
  nutritionByNormalizedName = new Map(),
}) => {
  const ingredientBase = ingredientRows.map((row) => {
    const explicitIngredientId = row.ingredient_id
      ? String(row.ingredient_id)
      : null;
    const ingredientFromId = explicitIngredientId
      ? nutritionById.get(explicitIngredientId)
      : null;
    const normalizedName = normalizeIngredientLookupKey(
      ingredientFromId?.normalized_name || ingredientFromId?.name || row.name,
    );
    const matchedIngredient =
      explicitIngredientId || !normalizedName
        ? null
        : nutritionByNormalizedName.get(normalizedName);

    return {
      ingredient_id: explicitIngredientId || matchedIngredient?.id || null,
      name: String(row.name || ingredientFromId?.name || ""),
      normalized_name: normalizedName,
      quantity: Number(row.quantity),
      unit_type: String(row.unit_type || ""),
    };
  });

  const unresolvedIngredientNames = Array.from(
    new Set(
      ingredientBase
        .filter((row) => !row.ingredient_id)
        .map((row) => String(row.name || "").trim())
        .filter(Boolean),
    ),
  );

  return {
    ingredientBase,
    unresolvedIngredientNames,
  };
};
