export function validatePlannedDayCompleteness({
  plannedDayBlocks,
  sourceMeals,
  discardedMealOptions = [],
}) {
  const sourceMealsByMenuDay = new Map();
  for (const meal of Array.isArray(sourceMeals) ? sourceMeals : []) {
    const weeklyMenuId = String(meal?.weekly_menu_id || "").trim();
    const dayNumber = Number(meal?.day_number || 0);
    if (!weeklyMenuId || dayNumber <= 0) continue;
    const key = sourceMenuDayKey(weeklyMenuId, dayNumber);
    if (!sourceMealsByMenuDay.has(key)) sourceMealsByMenuDay.set(key, []);
    sourceMealsByMenuDay.get(key).push(meal);
  }

  const discardReasonBySourceMealKey = new Map(
    (Array.isArray(discardedMealOptions) ? discardedMealOptions : []).map((item) => [
      sourceMealKey({
        weekly_menu_id: item.weekly_menu_id,
        day_number: item.day_number,
        meal_type: item.meal_type,
        meal_slot: item.meal_slot,
        dish_name: item.dish_name,
      }),
      item.reason,
    ]),
  );

  const diagnostics = [];

  for (const block of Array.isArray(plannedDayBlocks) ? plannedDayBlocks : []) {
    const weeklyMenuId = String(block?.source_weekly_menu_id || "").trim();
    const sourceDayNumber = Number(block?.source_day_number || 0);
    if (!weeklyMenuId || sourceDayNumber <= 0) {
      diagnostics.push({
        rotating_day_number: Number(block?.day_number || 0),
        source_weekly_menu_id: weeklyMenuId || null,
        source_day_number: sourceDayNumber || null,
        meal_type: null,
        meal_slot: null,
        dish_name: null,
        reason: "missing_source_day_mapping",
      });
      continue;
    }

    const expectedMeals =
      sourceMealsByMenuDay.get(sourceMenuDayKey(weeklyMenuId, sourceDayNumber)) || [];
    const plannedKeys = new Set(
      (Array.isArray(block.meals) ? block.meals : []).map((meal) =>
        sourceMealKey({
          weekly_menu_id: meal.weekly_menu_id,
          day_number: meal.day_number,
          meal_type: meal.meal_type,
          meal_slot: meal.meal_slot,
          dish_name: meal.dish_name,
        }),
      ),
    );

    for (const expectedMeal of expectedMeals) {
      const expectedKey = sourceMealKey(expectedMeal);
      if (plannedKeys.has(expectedKey)) continue;
      diagnostics.push({
        rotating_day_number: Number(block.day_number || 0),
        source_weekly_menu_id: weeklyMenuId,
        source_day_number: sourceDayNumber,
        meal_type: String(expectedMeal.meal_type || "") || null,
        meal_slot: normalizeMealSlot(expectedMeal.meal_slot),
        dish_name: String(expectedMeal.dish_name || "") || null,
        reason:
          discardReasonBySourceMealKey.get(expectedKey) ||
          "source_meal_missing_after_planning",
      });
    }
  }

  return diagnostics;
}

export function rotatingMealKey(dayId, mealType, mealSlot) {
  return `${String(dayId || "")}:${String(mealType || "")}:${normalizeMealSlot(
    mealSlot,
  )}`;
}

export function normalizeMealSlot(value) {
  const slot = Number(value || 1);
  return Number.isFinite(slot) && slot > 0 ? Math.round(slot) : 1;
}

function sourceMenuDayKey(weeklyMenuId, dayNumber) {
  return `${String(weeklyMenuId || "").trim()}:${Number(dayNumber) || 0}`;
}

function sourceMealKey(meal) {
  return [
    String(meal?.weekly_menu_id || "").trim(),
    Number(meal?.day_number || 0),
    String(meal?.meal_type || "").trim().toLowerCase(),
    normalizeMealSlot(meal?.meal_slot),
    normalizeDishName(meal?.dish_name),
  ].join(":");
}

function normalizeDishName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
