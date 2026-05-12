export function weeklyMeals(weeklyMenuIds) {
  return weeklyMenuIds.flatMap((weeklyMenuId) =>
    Array.from({ length: 7 }, (_, index) => {
      const dayNumber = index + 1;
      return [
        meal(weeklyMenuId, dayNumber, "desayuno"),
        meal(weeklyMenuId, dayNumber, "comida"),
        meal(weeklyMenuId, dayNumber, "cena"),
      ];
    }).flat(),
  );
}

export function meal(weeklyMenuId, dayNumber, mealType, mealSlot = 1) {
  return {
    id: `${weeklyMenuId}-${dayNumber}-${mealType}-${mealSlot}`,
    weekly_menu_id: weeklyMenuId,
    day_number: dayNumber,
    meal_type: mealType,
    meal_slot: mealSlot,
    dish_name: `${weeklyMenuId} dia ${dayNumber} ${mealType} slot ${mealSlot}`,
  };
}

export function sequenceRng(values) {
  let index = 0;
  return () => values[index++] ?? values.at(-1) ?? 0;
}

export function blockSourceIds(days) {
  return days
    .filter((day) => day.source_day_number === 1)
    .map((day) => day.source_weekly_menu_id);
}
