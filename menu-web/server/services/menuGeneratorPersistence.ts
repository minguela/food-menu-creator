import type { MealType } from "~/types";
import type { GeneratedMenuResult } from "~/server/services/menuGenerator";
import { normalizeQuantityToGrams } from "~/utils/nutrition/calculateRecipeMacros";

type SupabaseClientLike = {
  from: (table: string) => any;
};

export type SaveNutritionMenuParams = {
  supabase: SupabaseClientLike;
  userId: string;
  profileId: string;
  name: string;
  result: GeneratedMenuResult;
};

export type SavedNutritionMenu = {
  id: string;
  name: string;
};

export type NutritionShoppingListItem = {
  ingredient_id?: string | null;
  item_name: string;
  quantity_grams: number;
  display_quantity: number;
  display_unit: "g" | "kg";
};

export async function saveNutritionGeneratedMenu({
  supabase,
  userId,
  profileId,
  name,
  result,
}: SaveNutritionMenuParams): Promise<SavedNutritionMenu> {
  const firstDay = result.days[0];
  const lastDay = result.days[result.days.length - 1] || firstDay;

  const { data: menu, error: menuError } = await supabase
    .from("rotating_menus")
    .insert({
      user_id: userId,
      profile_id: profileId || null,
      name: name || "Menu nutricional",
      source_weekly_menu_ids: [],
      duration_days: result.days.length,
      persons_count: 1,
      target_kcal: Math.round(result.targets.targetKcal),
      target_protein_g: result.targets.targetProteinG,
      target_carbs_g: result.targets.targetCarbsG,
      target_fat_g: result.targets.targetFatG,
      generator_type: "nutrition_scored",
      period_type: result.periodType,
      start_date: firstDay?.dayDate || null,
      end_date: lastDay?.dayDate || null,
      score: result.summary.globalScore,
      meets_targets: result.summary.compliantDays === result.days.length,
      diagnostics: toJsonSafe(result.summary),
    })
    .select("id,name")
    .single();

  if (menuError || !menu) throw menuError || new Error("Menu insert failed.");

  const { error: profileError } = await supabase.from("rotating_menu_profiles").insert({
    rotating_menu_id: menu.id,
    profile_id: profileId,
    target_kcal: Math.round(result.targets.targetKcal),
    target_protein_g: result.targets.targetProteinG,
    target_carbs_g: result.targets.targetCarbsG,
    target_fat_g: result.targets.targetFatG,
  });
  if (profileError) throw profileError;

  const dayRows = result.days.map((day) => ({
    rotating_menu_id: menu.id,
    day_number: day.dayIndex,
    day_date: day.dayDate,
    total_kcal: Math.round(day.totals.kcal),
    total_protein_g: day.totals.proteinG,
    total_carbs_g: day.totals.carbsG,
    total_fat_g: day.totals.fatG,
    score: day.score,
    meets_targets: day.meetsTargets,
    diagnostics: toJsonSafe(day.diagnostics),
  }));

  const { data: savedDays, error: daysError } = await supabase
    .from("rotating_menu_days")
    .insert(dayRows)
    .select("id,day_number");
  if (daysError || !savedDays) throw daysError || new Error("Day insert failed.");

  const dayIdByIndex = new Map(
    savedDays.map((day: any) => [Number(day.day_number), String(day.id)]),
  );
  const mealRows = result.days.flatMap((day) =>
    day.meals.map((meal, mealIndex) => ({
      rotating_menu_day_id: dayIdByIndex.get(day.dayIndex),
      recipe_id: meal.recipeId,
      meal_type: meal.mealType,
      meal_slot: mealSlotFor(day.meals, meal.mealType, mealIndex),
      dish_name: meal.name,
      dish_description: null,
      base_servings: 1,
      serving_multiplier: meal.servingMultiplier,
      final_kcal: Math.round(meal.totals.kcal),
      final_protein_g: meal.totals.proteinG,
      final_carbs_g: meal.totals.carbsG,
      final_fat_g: meal.totals.fatG,
    })),
  );

  const { error: mealsError } = await supabase
    .from("rotating_menu_meals")
    .insert(mealRows);
  if (mealsError) throw mealsError;

  return { id: menu.id, name: menu.name };
}

export async function loadNutritionGeneratedMenuDetail({
  supabase,
  userId,
  menuId,
}: {
  supabase: SupabaseClientLike;
  userId: string;
  menuId: string;
}) {
  const { data: menu, error: menuError } = await supabase
    .from("rotating_menus")
    .select("*")
    .eq("id", menuId)
    .eq("user_id", userId)
    .maybeSingle();
  if (menuError) throw menuError;
  if (!menu) return null;

  const { data: days, error: daysError } = await supabase
    .from("rotating_menu_days")
    .select("*")
    .eq("rotating_menu_id", menuId)
    .order("day_number", { ascending: true });
  if (daysError) throw daysError;

  const dayIds = (days || []).map((day: any) => day.id);
  const { data: meals, error: mealsError } = dayIds.length
    ? await supabase
        .from("rotating_menu_meals")
        .select("*")
        .in("rotating_menu_day_id", dayIds)
        .order("meal_type", { ascending: true })
        .order("meal_slot", { ascending: true })
    : { data: [] as any[], error: null };
  if (mealsError) throw mealsError;

  const mealsByDay = groupBy(meals || [], "rotating_menu_day_id");
  return {
    menu,
    days: (days || []).map((day: any) => ({
      ...day,
      meals: mealsByDay.get(day.id) || [],
    })),
  };
}

export async function buildNutritionMenuShoppingList({
  supabase,
  userId,
  menuId,
}: {
  supabase: SupabaseClientLike;
  userId: string;
  menuId: string;
}): Promise<{ items: NutritionShoppingListItem[]; skipped: string[] }> {
  const detail = await loadNutritionGeneratedMenuDetail({ supabase, userId, menuId });
  if (!detail) return { items: [], skipped: ["menu_not_found"] };

  const meals = detail.days.flatMap((day: any) => day.meals || []);
  const recipeIds = Array.from(
    new Set(meals.map((meal: any) => meal.recipe_id).filter(Boolean)),
  );
  if (recipeIds.length === 0) return { items: [], skipped: ["no_recipe_ids"] };

  const { data: recipeIngredients, error } = await supabase
    .from("recipe_ingredients")
    .select("recipe_id,ingredient_id,name,quantity,unit_type,is_confirmed,ingredients(id,name)")
    .in("recipe_id", recipeIds)
    .eq("is_confirmed", true);
  if (error) throw error;

  const ingredientsByRecipeId = groupBy(recipeIngredients || [], "recipe_id");
  const aggregate = new Map<string, NutritionShoppingListItem>();
  const skipped: string[] = [];

  for (const meal of meals) {
    const rows = ingredientsByRecipeId.get(meal.recipe_id) || [];
    for (const row of rows) {
      const grams = normalizeQuantityToGrams(Number(row.quantity), row.unit_type);
      if (grams === null) {
        skipped.push(`${row.name}:unsupported_unit`);
        continue;
      }
      const quantityGrams = grams * Number(meal.serving_multiplier || 1);
      const ingredient = Array.isArray(row.ingredients)
        ? row.ingredients[0]
        : row.ingredients;
      const key = String(row.ingredient_id || row.name || "").toLowerCase();
      const existing = aggregate.get(key) || {
        ingredient_id: row.ingredient_id,
        item_name: ingredient?.name || row.name || "Ingrediente",
        quantity_grams: 0,
        display_quantity: 0,
        display_unit: "g" as const,
      };
      existing.quantity_grams += quantityGrams;
      aggregate.set(key, existing);
    }
  }

  const items = Array.from(aggregate.values())
    .map((item) => formatShoppingItem(item))
    .sort((left, right) => left.item_name.localeCompare(right.item_name));

  return { items, skipped };
}

function mealSlotFor(meals: Array<{ mealType: MealType }>, mealType: MealType, index: number) {
  return meals.slice(0, index + 1).filter((meal) => meal.mealType === mealType).length;
}

function formatShoppingItem(item: NutritionShoppingListItem): NutritionShoppingListItem {
  const grams = Math.round(item.quantity_grams);
  if (grams >= 1000) {
    return {
      ...item,
      quantity_grams: grams,
      display_quantity: Math.round((grams / 1000) * 100) / 100,
      display_unit: "kg",
    };
  }
  return {
    ...item,
    quantity_grams: grams,
    display_quantity: grams,
    display_unit: "g",
  };
}

function groupBy(rows: any[], key: string): Map<string, any[]> {
  const grouped = new Map<string, any[]>();
  for (const row of rows) {
    const value = String(row?.[key] || "");
    if (!grouped.has(value)) grouped.set(value, []);
    grouped.get(value)?.push(row);
  }
  return grouped;
}

function toJsonSafe(value: unknown): unknown {
  return JSON.parse(
    JSON.stringify(value, (_key, item) =>
      typeof item === "number" && !Number.isFinite(item) ? null : item,
    ),
  );
}
