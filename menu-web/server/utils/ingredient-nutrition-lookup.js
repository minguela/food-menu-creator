const normalizeLookupKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

export const buildNutritionLookups = (ingredientRows = []) => {
  const nutritionById = new Map();
  const nutritionByNormalizedName = new Map();

  for (const row of ingredientRows || []) {
    if (!row?.id) continue;
    nutritionById.set(String(row.id), row);

    for (const value of [row.normalized_name, row.name]) {
      const key = normalizeLookupKey(value);
      if (key && !nutritionByNormalizedName.has(key)) {
        nutritionByNormalizedName.set(key, row);
      }
    }
  }

  return { nutritionById, nutritionByNormalizedName };
};

export const normalizeIngredientLookupKey = normalizeLookupKey;
