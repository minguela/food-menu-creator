const MEAL_TYPE_ORDER = new Map([
  ["desayuno", 0],
  ["comida", 1],
  ["cena", 2],
]);

export function buildRotatingWeeklyMenuBlocks({
  meals,
  sourceWeeklyMenuIds,
  durationDays,
  initialWeeklyMenuId = null,
  rng = Math.random,
}) {
  const sourceIds = uniqueStrings(sourceWeeklyMenuIds);
  const mealsWithSource = (Array.isArray(meals) ? meals : []).filter(
    (meal) => meal?.weekly_menu_id && Number(meal?.day_number) > 0,
  );
  const menusWithMeals = new Set(
    mealsWithSource.map((meal) => String(meal.weekly_menu_id)),
  );
  const availableSourceIds = sourceIds.filter((id) => menusWithMeals.has(id));
  if (availableSourceIds.length === 0) return [];

  const orderedSourceIds = buildSourceOrder({
    availableSourceIds,
    initialWeeklyMenuId,
    rng,
  });

  const mealsByMenuDay = new Map();
  for (const meal of mealsWithSource) {
    const key = menuDayKey(meal.weekly_menu_id, meal.day_number);
    const dayMeals = mealsByMenuDay.get(key) || [];
    dayMeals.push(meal);
    mealsByMenuDay.set(key, dayMeals);
  }

  for (const dayMeals of mealsByMenuDay.values()) {
    dayMeals.sort(compareMealsByType);
  }

  return Array.from(
    { length: Math.max(0, Number(durationDays) || 0) },
    (_, index) => {
      const dayNumber = index + 1;
      const blockIndex = Math.floor(index / 7);
      const sourceDayNumber = (index % 7) + 1;
      const sourceWeeklyMenuId =
        orderedSourceIds[blockIndex % orderedSourceIds.length];
      const dayMeals = mealsByMenuDay.get(
        menuDayKey(sourceWeeklyMenuId, sourceDayNumber),
      );

      return {
        day_number: dayNumber,
        source_weekly_menu_id: sourceWeeklyMenuId,
        source_day_number: sourceDayNumber,
        meals: dayMeals ? [...dayMeals] : [],
      };
    },
  );
}

function uniqueStrings(values) {
  const seen = new Set();
  const result = [];
  for (const value of Array.isArray(values) ? values : []) {
    const normalized = String(value || "").trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

function buildSourceOrder({ availableSourceIds, initialWeeklyMenuId, rng }) {
  const requestedInitial = String(initialWeeklyMenuId || "").trim();
  const hasRequestedInitial = availableSourceIds.includes(requestedInitial);
  const firstSourceId = hasRequestedInitial
    ? requestedInitial
    : availableSourceIds[randomIndex(availableSourceIds.length, rng)];
  const remainingSourceIds = shuffle(
    availableSourceIds.filter((id) => id !== firstSourceId),
    rng,
  );

  return [firstSourceId, ...remainingSourceIds];
}

function shuffle(values, rng) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = randomIndex(index + 1, rng);
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

function randomIndex(length, rng) {
  if (length <= 1) return 0;
  const value = Number(typeof rng === "function" ? rng() : Math.random());
  const normalized = Number.isFinite(value) ? Math.max(0, Math.min(0.999999, value)) : 0;
  return Math.floor(normalized * length);
}

function menuDayKey(weeklyMenuId, dayNumber) {
  return `${String(weeklyMenuId)}:${Number(dayNumber) || 0}`;
}

function compareMealsByType(a, b) {
  const aOrder = MEAL_TYPE_ORDER.get(String(a.meal_type)) ?? 99;
  const bOrder = MEAL_TYPE_ORDER.get(String(b.meal_type)) ?? 99;
  return aOrder - bOrder;
}
