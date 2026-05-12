import type { RecipeIngredientMacroInput } from "../../utils/nutrition/calculateRecipeMacros";

export const nutritionProfileFixture = {
  id: "profile-balanced",
  name: "Perfil equilibrado",
  daily_kcal_target: 2000,
  daily_protein_target: 130,
  carbs_pct_target: 45,
  fat_pct_target: 30,
  protein_pct_target: 25,
  tolerance_percent: 10,
};

export const ingredientsFixture = {
  oats: ingredient("ing-oats", "Avena", 389, 16.9, 66.3, 6.9),
  milk: ingredient("ing-milk", "Leche", 60, 3.2, 4.8, 3.3),
  banana: ingredient("ing-banana", "Platano", 89, 1.1, 22.8, 0.3),
  egg: ingredient("ing-egg", "Huevo", 143, 12.6, 0.7, 9.5),
  chicken: ingredient("ing-chicken", "Pollo", 165, 31, 0, 3.6),
  rice: ingredient("ing-rice", "Arroz cocido", 130, 2.7, 28, 0.3),
  oliveOil: ingredient("ing-olive-oil", "Aceite de oliva", 884, 0, 0, 100),
  salmon: ingredient("ing-salmon", "Salmon", 208, 20, 0, 13),
  potato: ingredient("ing-potato", "Patata", 77, 2, 17, 0.1),
  yogurt: ingredient("ing-yogurt", "Yogur griego", 97, 9, 3.6, 5),
  almonds: ingredient("ing-almonds", "Almendras", 579, 21.2, 21.6, 49.9),
};

export const recipeFixtures = {
  breakfasts: [
    recipe("breakfast-oats", "desayuno", "Avena con leche", [
      recipeIngredient("ri-oats", ingredientsFixture.oats, 60),
      recipeIngredient("ri-milk", ingredientsFixture.milk, 200),
      recipeIngredient("ri-banana", ingredientsFixture.banana, 100),
    ]),
    recipe("breakfast-eggs", "desayuno", "Huevos con patata", [
      recipeIngredient("ri-egg", ingredientsFixture.egg, 120),
      recipeIngredient("ri-potato-breakfast", ingredientsFixture.potato, 180),
    ]),
    recipe("breakfast-yogurt", "desayuno", "Yogur con almendras", [
      recipeIngredient("ri-yogurt", ingredientsFixture.yogurt, 200),
      recipeIngredient("ri-almonds-breakfast", ingredientsFixture.almonds, 25),
    ]),
  ],
  lunches: [
    recipe("lunch-chicken-rice", "comida", "Pollo con arroz", [
      recipeIngredient("ri-chicken", ingredientsFixture.chicken, 180),
      recipeIngredient("ri-rice", ingredientsFixture.rice, 250),
      recipeIngredient("ri-oil-lunch", ingredientsFixture.oliveOil, 10),
    ]),
    recipe("lunch-salmon-potato", "comida", "Salmon con patata", [
      recipeIngredient("ri-salmon-lunch", ingredientsFixture.salmon, 180),
      recipeIngredient("ri-potato-lunch", ingredientsFixture.potato, 300),
    ]),
    recipe("lunch-rice-egg", "comida", "Arroz con huevo", [
      recipeIngredient("ri-rice-egg-rice", ingredientsFixture.rice, 300),
      recipeIngredient("ri-rice-egg-egg", ingredientsFixture.egg, 100),
    ]),
    recipe("lunch-chicken-potato", "comida", "Pollo con patata", [
      recipeIngredient("ri-chicken-potato-chicken", ingredientsFixture.chicken, 180),
      recipeIngredient("ri-chicken-potato-potato", ingredientsFixture.potato, 300),
    ]),
    recipe("lunch-salmon-rice", "comida", "Salmon con arroz", [
      recipeIngredient("ri-salmon-rice-salmon", ingredientsFixture.salmon, 160),
      recipeIngredient("ri-salmon-rice-rice", ingredientsFixture.rice, 220),
    ]),
  ],
  dinners: [
    recipe("dinner-salmon-potato", "cena", "Salmon con patata", [
      recipeIngredient("ri-dinner-salmon", ingredientsFixture.salmon, 160),
      recipeIngredient("ri-dinner-potato", ingredientsFixture.potato, 220),
    ]),
    recipe("dinner-chicken-yogurt", "cena", "Pollo con yogur", [
      recipeIngredient("ri-dinner-chicken", ingredientsFixture.chicken, 160),
      recipeIngredient("ri-dinner-yogurt", ingredientsFixture.yogurt, 150),
    ]),
    recipe("dinner-eggs-potato", "cena", "Huevos con patata", [
      recipeIngredient("ri-dinner-eggs", ingredientsFixture.egg, 140),
      recipeIngredient("ri-dinner-potato-eggs", ingredientsFixture.potato, 250),
    ]),
    recipe("dinner-rice-chicken", "cena", "Arroz con pollo", [
      recipeIngredient("ri-dinner-rice", ingredientsFixture.rice, 180),
      recipeIngredient("ri-dinner-rice-chicken", ingredientsFixture.chicken, 140),
    ]),
    recipe("dinner-yogurt-oats", "cena", "Yogur con avena", [
      recipeIngredient("ri-dinner-yogurt-oats", ingredientsFixture.yogurt, 250),
      recipeIngredient("ri-dinner-oats", ingredientsFixture.oats, 40),
    ]),
  ],
  snacks: [
    recipe("snack-yogurt", "snack", "Yogur", [
      recipeIngredient("ri-snack-yogurt", ingredientsFixture.yogurt, 180),
    ]),
    recipe("snack-almonds", "snack", "Almendras", [
      recipeIngredient("ri-snack-almonds", ingredientsFixture.almonds, 30),
    ]),
  ],
};

function ingredient(
  id: string,
  name: string,
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
) {
  return {
    id,
    name,
    nutrition_status: "complete" as const,
    kcal_per_100g: kcal,
    protein_per_100g: protein,
    carbs_per_100g: carbs,
    fat_per_100g: fat,
  };
}

function recipe(
  id: string,
  mealType: "desayuno" | "comida" | "cena" | "snack",
  name: string,
  ingredients: RecipeIngredientMacroInput[],
) {
  return { id, mealType, name, ingredients };
}

function recipeIngredient(
  id: string,
  ingredientRow: ReturnType<typeof ingredient>,
  quantityG: number,
): RecipeIngredientMacroInput {
  return {
    id,
    ingredient_id: ingredientRow.id,
    name: ingredientRow.name,
    quantity: quantityG,
    unit_type: "g",
    is_confirmed: true,
    ingredients: ingredientRow,
  };
}
