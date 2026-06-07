export const chooseRotatingMealSource = ({
  hasExplicitWeeklyIngredients,
  weeklyMealVirtualRecipeId,
  validRecipeById,
  linkedDish,
  invalidWeeklyMealReason,
}) => {
  if (!hasExplicitWeeklyIngredients) {
    return linkedDish?.id && validRecipeById.has(linkedDish.id)
      ? { mode: "linked" }
      : { mode: "none", reason: "recipe_not_validated" };
  }

  if (validRecipeById.has(weeklyMealVirtualRecipeId)) {
    return { mode: "weekly" };
  }

  if (linkedDish?.id && validRecipeById.has(linkedDish.id)) {
    return { mode: "linked_fallback" };
  }

  return {
    mode: "discard",
    reason: invalidWeeklyMealReason || "weekly_meal_ingredients_not_validated",
  };
};
