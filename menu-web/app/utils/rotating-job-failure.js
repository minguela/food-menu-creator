const countBy = (items, keyFn) => {
  const counts = {};
  for (const item of items || []) {
    const key = keyFn(item);
    if (!key) continue;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
};

const uniqueNames = (items, valueFn, limit = 8) =>
  Array.from(
    new Set(
      (items || [])
        .map((item) => String(valueFn(item) || "").trim())
        .filter(Boolean),
    ),
  ).slice(0, limit);

export const summarizeRotatingGenerationErrorData = (errorData) => {
  const payload = errorData?.data || errorData || {};
  const discardedMealOptions = Array.isArray(payload.discarded_meal_options)
    ? payload.discarded_meal_options
    : [];
  const uncuredRecipes = Array.isArray(payload.uncured_recipes)
    ? payload.uncured_recipes
    : [];
  const emptyRequiredTypes = Array.isArray(payload.empty_required_types)
    ? payload.empty_required_types
    : [];

  return {
    empty_required_types: emptyRequiredTypes,
    discarded_total: discardedMealOptions.length,
    discarded_by_reason: countBy(
      discardedMealOptions,
      (item) => item?.reason || "unknown",
    ),
    discarded_by_meal_type: countBy(
      discardedMealOptions,
      (item) => item?.meal_type || "unknown",
    ),
    affected_dishes: uniqueNames(
      discardedMealOptions,
      (item) => item?.dish_name,
      10,
    ),
    uncured_total: uncuredRecipes.length,
    uncured_by_reason: countBy(uncuredRecipes, (item) => item?.reason || "unknown"),
    blocking_ingredients: uniqueNames(
      uncuredRecipes.flatMap((item) => item?.blocking_ingredients || []),
      (item) => item,
      12,
    ),
  };
};
