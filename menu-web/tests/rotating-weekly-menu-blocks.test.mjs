import test from "node:test";
import assert from "node:assert/strict";
import { buildRotatingWeeklyMenuBlocks } from "../utils/rotating-weekly-menu-blocks.js";

test("generates rotating menu days from complete weekly menu blocks", () => {
  const meals = ["week-a", "week-b", "week-c"].flatMap((weeklyMenuId) =>
    Array.from({ length: 7 }, (_, index) => {
      const dayNumber = index + 1;
      return [
        meal(weeklyMenuId, dayNumber, "comida"),
        meal(weeklyMenuId, dayNumber, "cena"),
      ];
    }).flat(),
  );

  const days = buildRotatingWeeklyMenuBlocks({
    meals,
    sourceWeeklyMenuIds: ["week-a", "week-b", "week-c"],
    durationDays: 22,
    initialWeeklyMenuId: "week-a",
    rng: sequenceRng([0.99, 0.99]),
  });

  assert.deepEqual(dayDishNames(days[0]), [
    "week-a dia 1 comida",
    "week-a dia 1 cena",
  ]);
  assert.deepEqual(dayDishNames(days[6]), [
    "week-a dia 7 comida",
    "week-a dia 7 cena",
  ]);
  assert.deepEqual(dayDishNames(days[7]), [
    "week-b dia 1 comida",
    "week-b dia 1 cena",
  ]);
  assert.deepEqual(dayDishNames(days[13]), [
    "week-b dia 7 comida",
    "week-b dia 7 cena",
  ]);
  assert.deepEqual(dayDishNames(days[14]), [
    "week-c dia 1 comida",
    "week-c dia 1 cena",
  ]);
  assert.deepEqual(dayDishNames(days[21]), [
    "week-a dia 1 comida",
    "week-a dia 1 cena",
  ]);
});

test("starts from selected weekly menu and does not backfill partial source days", () => {
  const days = buildRotatingWeeklyMenuBlocks({
    meals: [
      meal("week-a", 1, "comida"),
      meal("week-a", 1, "cena"),
      meal("week-b", 1, "comida"),
      meal("week-b", 2, "cena"),
    ],
    sourceWeeklyMenuIds: ["week-a", "week-b"],
    durationDays: 9,
    initialWeeklyMenuId: "week-b",
  });

  assert.deepEqual(dayDishNames(days[0]), ["week-b dia 1 comida"]);
  assert.deepEqual(dayDishNames(days[1]), ["week-b dia 2 cena"]);
  assert.deepEqual(dayDishNames(days[7]), [
    "week-a dia 1 comida",
    "week-a dia 1 cena",
  ]);
});

test("preserves multiple meal slots within the same source day", () => {
  const days = buildRotatingWeeklyMenuBlocks({
    meals: [
      meal("week-a", 1, "comida", 2),
      meal("week-a", 1, "cena"),
      meal("week-a", 1, "comida", 1),
    ],
    sourceWeeklyMenuIds: ["week-a"],
    durationDays: 1,
    initialWeeklyMenuId: "week-a",
  });

  assert.deepEqual(
    days[0].meals.map((item) => `${item.meal_type}:${item.meal_slot || 1}`),
    ["comida:1", "comida:2", "cena:1"],
  );
  assert.deepEqual(dayDishNames(days[0]), [
    "week-a dia 1 comida",
    "week-a dia 1 comida slot 2",
    "week-a dia 1 cena",
  ]);
});

test("pins selected initial menu and shuffles remaining menus before repeating", () => {
  const days = buildRotatingWeeklyMenuBlocks({
    meals: weeklyMeals(["week-a", "week-b", "week-c", "week-d"]),
    sourceWeeklyMenuIds: ["week-a", "week-b", "week-c", "week-d"],
    durationDays: 29,
    initialWeeklyMenuId: "week-d",
    rng: sequenceRng([0.7, 0.1]),
  });

  assert.deepEqual(blockSourceIds(days), [
    "week-d",
    "week-b",
    "week-a",
    "week-c",
    "week-d",
  ]);
  assert.equal(new Set(blockSourceIds(days).slice(0, 4)).size, 4);
});

test("chooses random first menu when initial menu is omitted", () => {
  const days = buildRotatingWeeklyMenuBlocks({
    meals: weeklyMeals(["week-a", "week-b", "week-c", "week-d"]),
    sourceWeeklyMenuIds: ["week-a", "week-b", "week-c", "week-d"],
    durationDays: 28,
    rng: sequenceRng([0.85, 0.1, 0.1]),
  });

  assert.equal(blockSourceIds(days)[0], "week-d");
  assert.equal(new Set(blockSourceIds(days)).size, 4);
});

test("ignores invalid initial menu and falls back to random valid menu", () => {
  const days = buildRotatingWeeklyMenuBlocks({
    meals: weeklyMeals(["week-a", "week-b", "week-c"]),
    sourceWeeklyMenuIds: ["week-a", "week-b", "week-c", "week-missing"],
    durationDays: 7,
    initialWeeklyMenuId: "week-missing",
    rng: sequenceRng([0.5, 0.99, 0.99]),
  });

  assert.equal(days[0].source_weekly_menu_id, "week-b");
});

function meal(weeklyMenuId, dayNumber, mealType, mealSlot = 1) {
  return {
    id: `${weeklyMenuId}-${dayNumber}-${mealType}-${mealSlot}`,
    weekly_menu_id: weeklyMenuId,
    day_number: dayNumber,
    meal_type: mealType,
    meal_slot: mealSlot,
    dish_name: `${weeklyMenuId} dia ${dayNumber} ${mealType} slot ${mealSlot}`,
  };
}

function weeklyMeals(weeklyMenuIds) {
  return weeklyMenuIds.flatMap((weeklyMenuId) =>
    Array.from({ length: 7 }, (_, index) => {
      const dayNumber = index + 1;
      return [
        meal(weeklyMenuId, dayNumber, "comida"),
        meal(weeklyMenuId, dayNumber, "cena"),
      ];
    }).flat(),
  );
}

function blockSourceIds(days) {
  return days
    .filter((day) => day.source_day_number === 1)
    .map((day) => day.source_weekly_menu_id);
}

function sequenceRng(values) {
  let index = 0;
  return () => values[index++] ?? values.at(-1) ?? 0;
}

function dayDishNames(day) {
  return day.meals.map((meal) =>
    String(meal.dish_name).replace(" slot 1", ""),
  );
}
