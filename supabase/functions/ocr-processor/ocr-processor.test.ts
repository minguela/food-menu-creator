import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import {
  buildV2WeeklyResponse,
  validateWeeklyMealsV2,
} from "./index.ts";

Deno.test("buildV2WeeklyResponse devuelve 14 elementos únicos comida/cena", () => {
  const meals = [];
  for (let day = 1; day <= 7; day++) {
    meals.push({
      day_number: day,
      meal_type: "comida",
      name: `Comida ${day}`,
      description: `Comida ${day}`,
    });
    meals.push({
      day_number: day,
      meal_type: "cena",
      name: `Cena ${day}`,
      description: `Cena ${day}`,
    });
  }

  meals.push({
    day_number: 7,
    meal_type: "comida",
    name: "Comida 7",
    description: "Comida 7",
  });

  const result = buildV2WeeklyResponse(
    meals as any,
    ["comida", "cena"],
    "OCR raw",
  );

  assertEquals(result.success, true);
  assertEquals(result.dishes_count, 14);
  assertEquals(result.meals.length, 14);

  const uniqueKeys = new Set(
    result.meals.map((meal: any) => `${meal.day_number}:${meal.meal_type}`),
  );
  assertEquals(uniqueKeys.size, 14);
  assertEquals(result.dishes_count, result.meals.length);
  assertEquals(result.schema, "v2");
});

Deno.test("v2 mantiene Libre y elimina ruido/campos vacíos", () => {
  const result = buildV2WeeklyResponse(
    [
      {
        day_number: 6,
        meal_type: "cena",
        name: "Libre",
        description: "Libre",
        kcal: 0,
        ingredients: [],
      },
      {
        day_number: 1,
        meal_type: "comida",
        name: "Lydia nutricion.arguello@gmail.com",
      },
      {
        day_number: 1,
        meal_type: "comida",
        name: "Ensalada mixta",
        description: "Ensalada mixta",
        kcal: 0,
      },
    ] as any,
    ["comida", "cena"],
    "raw",
  );

  assertEquals(result.meals.some((m: any) => m.name === "Libre"), true);
  assertEquals(
    result.meals.some((m: any) => /lydia|@gmail|ayuno/i.test(m.name)),
    false,
  );
  const comida = result.meals.find(
    (m: any) => m.day_number === 1 && m.meal_type === "comida",
  );
  assertEquals("description" in (comida || {}), false);
  assertEquals("kcal" in (comida || {}), false);
  assertEquals("ingredients" in (comida || {}), false);
});

Deno.test("validateWeeklyMealsV2 exige 14 slots y sin duplicados", () => {
  const okMeals = [];
  for (let day = 1; day <= 7; day++) {
    okMeals.push({ day_number: day, meal_type: "comida", name: `C${day}` });
    okMeals.push({ day_number: day, meal_type: "cena", name: `N${day}` });
  }
  assertEquals(
    validateWeeklyMealsV2(okMeals as any, ["comida", "cena"], 7),
    { success: true },
  );

  const duplicated = [...okMeals, { day_number: 7, meal_type: "cena", name: "dup" }];
  const invalid = validateWeeklyMealsV2(
    duplicated as any,
    ["comida", "cena"],
    7,
  );
  assertEquals(invalid.success, false);
});
