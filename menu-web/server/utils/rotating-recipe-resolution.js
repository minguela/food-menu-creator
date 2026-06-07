const normalizeValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export const resolveRecipeIngredientRows = ({
  confirmedRows = [],
  nutritionByNormalizedName = new Map(),
}) => {
  const ingredientBase = confirmedRows.map((row) => {
    const normalizedName = normalizeValue(row.normalized_name || row.name);
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
