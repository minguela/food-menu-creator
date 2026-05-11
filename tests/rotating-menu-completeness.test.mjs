import test from "node:test";
import assert from "node:assert/strict";
import { buildRotatingWeeklyMenuBlocks } from "../utils/rotating-weekly-menu-blocks.js";
import { validatePlannedDayCompleteness } from "../utils/rotating-menu-completeness.js";
import { meal, sequenceRng, weeklyMeals } from "./helpers/rotating-fixtures.mjs";

test("validates complete source days without diagnostics", () => {
  const sourceMeals = weeklyMeals(["week-a", "week-b", "week-c", "week-d"]);
  const days = buildRotatingWeeklyMenuBlocks({
    meals: sourceMeals,
    sourceWeeklyMenuIds: ["week-a", "week-b", "week-c", "week-d"],
    durationDays: 28,
    initialWeeklyMenuId: "week-d",
    rng: sequenceRng([0.1, 0.8, 0.3]),
  });

  assert.deepEqual(validatePlannedDayCompleteness({
    plannedDayBlocks: days,
    sourceMeals,
  }), []);
});

test("reports missing expected source meals with structured diagnostics", () => {
  const sourceMeals = [
    meal("week-a", 1, "comida", 1),
    meal("week-a", 1, "comida", 2),
    meal("week-a", 1, "cena", 1),
  ];
  const plannedDayBlocks = [
    {
      day_number: 1,
      source_weekly_menu_id: "week-a",
      source_day_number: 1,
      meals: [sourceMeals[0], sourceMeals[2]],
    },
  ];

  assert.deepEqual(validatePlannedDayCompleteness({
    plannedDayBlocks,
    sourceMeals,
    discardedMealOptions: [
      {
        weekly_menu_id: "week-a",
        day_number: 1,
        meal_type: "comida",
        meal_slot: 2,
        dish_name: sourceMeals[1].dish_name,
        reason: "recipe_not_validated",
      },
    ],
  }), [
    {
      rotating_day_number: 1,
      source_weekly_menu_id: "week-a",
      source_day_number: 1,
      meal_type: "comida",
      meal_slot: 2,
      dish_name: sourceMeals[1].dish_name,
      reason: "recipe_not_validated",
    },
  ]);
});
