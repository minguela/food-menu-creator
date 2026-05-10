import { createSupabaseAdminClient } from "~/server/utils/supabase-admin";
import { buildShoppingListFromRotatingMenu } from "~/server/utils/shopping-from-rotating";
import { createMenuGenerationLogger } from "~/server/utils/menu-generation-logger";
import {
  normalizeMealSlot,
  rotatingMealKey,
  validatePlannedDayCompleteness,
} from "~/utils/rotating-menu-completeness.js";
import { buildRotatingWeeklyMenuBlocks } from "~/utils/rotating-weekly-menu-blocks.js";

type MealType = "desayuno" | "comida" | "cena";

const SPECIAL_MEAL_RESERVED_KCAL = 700;
const MIN_REGULAR_DAY_KCAL_BUDGET = 300;

type GeneratePayload = {
  userId: string;
  name: string;
  durationDays: number;
  startDate: string;
  sourceWeeklyMenuIds: string[];
  profileIds: string[];
  initialWeeklyMenuId?: string | null;
  specialMealKcal?: number;
  jobId?: string;
};

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as GeneratePayload;
  const config = useRuntimeConfig(event);
  const supabase = createSupabaseAdminClient(config);
  const logger = createMenuGenerationLogger({
    supabase,
    jobId: String(body?.jobId || "").trim() || null,
  });

  if (!body?.userId) {
    throw createError({ statusCode: 400, statusMessage: "userId requerido" });
  }
  if (
    !Array.isArray(body.sourceWeeklyMenuIds) ||
    body.sourceWeeklyMenuIds.length === 0
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "sourceWeeklyMenuIds requerido",
    });
  }
  if (!Array.isArray(body.profileIds) || body.profileIds.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "profileIds requerido",
    });
  }

  const targetDays = Math.min(90, Math.max(1, Number(body.durationDays) || 7));

  await logger.log({
    level: "info",
    step: "input_validation",
    status: "completed",
    message: "Payload validado para generación rotativa.",
    metadata: {
      user_id: body.userId,
      duration_days: targetDays,
      start_date: body.startDate,
      source_menu_ids_count: body.sourceWeeklyMenuIds.length,
      initial_weekly_menu_id: body.initialWeeklyMenuId || null,
      profile_ids_count: body.profileIds.length,
      special_meal_kcal: body.specialMealKcal,
    },
    progress: { progress: 8, currentStep: "input_validation" },
  });

  await logger.log({
    level: "info",
    step: "read_profiles",
    status: "running",
    message: "Leyendo usuario, perfiles y comidas semanales fuente.",
    metadata: {
      profile_ids: body.profileIds,
      source_weekly_menu_ids: body.sourceWeeklyMenuIds,
    },
    progress: { progress: 12, currentStep: "read_profiles" },
  });

  const [{ data: user }, { data: profiles }, { data: weeklyMeals }] =
    await Promise.all([
      supabase.from("users").select("*").eq("id", body.userId).single(),
      supabase
        .from("person_profiles")
        .select("*")
        .in("id", body.profileIds || []),
      supabase
        .from("weekly_meals")
        .select(
          "id, weekly_menu_id, day_number, meal_type, meal_slot, dish_name, dish_description, is_special, special_kcal_reserved, compound_day_id",
        )
        .in("weekly_menu_id", body.sourceWeeklyMenuIds),
    ]);

  await logger.log({
    level: "info",
    step: "read_profiles",
    status: "completed",
    message: "Usuario, perfiles y comidas semanales cargados.",
    metadata: {
      has_user: Boolean(user),
      profiles_count: profiles?.length || 0,
      weekly_meals_count: weeklyMeals?.length || 0,
    },
    progress: { progress: 18, currentStep: "read_profiles" },
  });

  if (!user) {
    await logger.log({
      level: "error",
      step: "read_profiles",
      status: "failed",
      message: "Usuario no encontrado.",
      metadata: { user_id: body.userId },
      progress: {
        progress: 100,
        currentStep: "read_profiles",
        status: "failed",
        errorMessage: "Usuario no encontrado",
        completedAt: new Date().toISOString(),
      },
    });
    throw createError({
      statusCode: 404,
      statusMessage: "Usuario no encontrado",
    });
  }

  const profileTargets = (profiles || []).map((profile: any) => {
    const inferredProteinG = Number(
      (Number(profile.daily_kcal_target) *
        (100 - Number(profile.fat_pct_target) - Number(profile.carbs_pct_target))) /
        100 /
        4,
    );
    const proteinTarget = Number(profile.daily_protein_target || inferredProteinG);
    return {
      key: profile.id,
      profile_id: profile.id,
      profile_name: profile.name,
      target_kcal: Number(profile.daily_kcal_target),
      target_protein_g: proteinTarget,
      target_carbs_g: Number(
        (Number(profile.daily_kcal_target) * Number(profile.carbs_pct_target)) /
          100 /
          4,
      ),
      target_fat_g: Number(
        (Number(profile.daily_kcal_target) * Number(profile.fat_pct_target)) /
          100 /
          9,
      ),
    };
  });

  await logger.log({
    level: "info",
    step: "target_kcal",
    status: "completed",
    message: "Objetivos kcal calculados por perfil.",
    metadata: {
      profiles: profileTargets.map((profile) => ({
        profile_id: profile.profile_id,
        profile_name: profile.profile_name,
        target_kcal: profile.target_kcal,
      })),
    },
    progress: { progress: 22, currentStep: "target_kcal" },
  });

  await logger.log({
    level: "info",
    step: "macro_targets",
    status: "completed",
    message: "Macros objetivo calculados por perfil.",
    metadata: {
      profiles: profileTargets.map((profile) => ({
        profile_id: profile.profile_id,
        profile_name: profile.profile_name,
        target_protein_g: profile.target_protein_g,
        target_carbs_g: profile.target_carbs_g,
        target_fat_g: profile.target_fat_g,
      })),
    },
    progress: { progress: 25, currentStep: "macro_targets" },
  });

  if (profileTargets.length === 0) {
    await logger.log({
      level: "error",
      step: "read_profiles",
      status: "failed",
      message: "No hay perfiles válidos seleccionados.",
      metadata: { requested_profile_ids: body.profileIds },
      progress: {
        progress: 100,
        currentStep: "read_profiles",
        status: "failed",
        errorMessage: "Selecciona al menos un perfil",
        completedAt: new Date().toISOString(),
      },
    });
    throw createError({
      statusCode: 400,
      statusMessage: "Selecciona al menos un perfil",
    });
  }

  const mealLibrary: Record<MealType, any[]> = {
    desayuno: [],
    comida: [],
    cena: [],
  };
  for (const meal of weeklyMeals || []) {
    if (mealLibrary[meal.meal_type as MealType]) {
      mealLibrary[meal.meal_type as MealType].push(meal);
    }
  }

  await logger.log({
    level: "info",
    step: "recipe_selection",
    status: "running",
    message: "Preparando biblioteca de recetas y datos nutricionales.",
    metadata: {
      meals_by_type: {
        desayuno: mealLibrary.desayuno.length,
        comida: mealLibrary.comida.length,
        cena: mealLibrary.cena.length,
      },
    },
    progress: { progress: 30, currentStep: "recipe_selection" },
  });

  if (
    mealLibrary.desayuno.length +
      mealLibrary.comida.length +
      mealLibrary.cena.length ===
    0
  ) {
    await logger.log({
      level: "error",
      step: "recipe_selection",
      status: "failed",
      message: "Los menús fuente no tienen comidas disponibles.",
      metadata: { source_weekly_menu_ids: body.sourceWeeklyMenuIds },
      progress: {
        progress: 100,
        currentStep: "recipe_selection",
        status: "failed",
        errorMessage: "Los menús fuente no tienen comidas disponibles.",
        completedAt: new Date().toISOString(),
      },
    });
    throw createError({
      statusCode: 400,
      statusMessage: "Los menús fuente no tienen comidas disponibles.",
    });
  }

  const uniqueDishNames = Array.from(
    new Set(
      (weeklyMeals || [])
        .flatMap((meal: any) => {
          const name = String(meal.dish_name || "").trim();
          if (!name) return [];
          if (name.includes("+")) {
            return [
              name,
              ...name.split(/\s*\+\s*/).map((p) => p.trim()).filter(Boolean),
            ];
          }
          return [name];
        })
        .filter(Boolean),
    ),
  );
  const { data: dishRows } = uniqueDishNames.length
    ? await supabase
        .from("dishes")
        .select(
          "id,name,normalized_name,recipe_status,is_special,special_kcal_reserved",
        )
        .eq("user_id", body.userId)
        .in(
          "normalized_name",
          uniqueDishNames.map((name) => normalizeDishName(name)),
        )
    : { data: [] as any[] };
  const dishByNormalizedName = new Map(
    (dishRows || []).map((row: any) => [
      normalizeDishName(row.normalized_name || row.name),
      row,
    ]),
  );
  const dishById = new Map(
    (dishRows || []).map((row: any) => [String(row.id), row]),
  );

  const compoundDayIds = Array.from(
    new Set(
      (weeklyMeals || [])
        .map((meal: any) => meal.compound_day_id)
        .filter(Boolean),
    ),
  );
  const { data: compoundDayRows } = compoundDayIds.length
    ? await supabase
        .from("compound_day_meals")
        .select("id, name, first_dish_id, second_dish_id")
        .in("id", compoundDayIds)
    : { data: [] as any[] };
  const compoundDayById = new Map(
    (compoundDayRows || []).map((row: any) => [String(row.id), row]),
  );

  const recipeIds = (dishRows || []).map((row: any) => row.id);
  const { data: recipeRows } = recipeIds.length
    ? await supabase
        .from("recipe_ingredients")
        .select("*")
        .in("recipe_id", recipeIds)
    : { data: [] as any[] };
  const recipeIngredientsByRecipeId = new Map<string, any[]>();
  for (const row of recipeRows || []) {
    if (!recipeIngredientsByRecipeId.has(row.recipe_id)) {
      recipeIngredientsByRecipeId.set(row.recipe_id, []);
    }
    recipeIngredientsByRecipeId.get(row.recipe_id)?.push(row);
  }

  const ingredientIds = Array.from(
    new Set(
      (recipeRows || [])
        .filter((row: any) => row.is_confirmed && row.ingredient_id)
        .map((row: any) => row.ingredient_id),
    ),
  );
  const { data: ingredientRows } = ingredientIds.length
    ? await supabase
        .from("ingredients")
        .select(
          "id, name, normalized_name, nutrition_status, caloric_density_level, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g",
        )
        .in("id", ingredientIds)
    : { data: [] as any[] };
  const nutritionById = new Map(
    (ingredientRows || []).map((row: any) => [row.id, row]),
  );

  await logger.log({
    level: "info",
    step: "recipe_selection",
    status: "completed",
    message: "Recetas, ingredientes confirmados y nutrición cargados.",
    metadata: {
      unique_dish_names_count: uniqueDishNames.length,
      matched_dishes_count: dishRows?.length || 0,
      recipe_ingredients_count: recipeRows?.length || 0,
      nutrition_rows_count: ingredientRows?.length || 0,
    },
    progress: { progress: 36, currentStep: "recipe_selection" },
  });

  const uncuredRecipes: Array<{
    dish_id: string;
    dish_name: string;
    reason:
      | "pending_ingredients"
      | "suggested_ingredients"
      | "missing_ingredient_link"
      | "missing_nutrition"
      | "invalid_recipe_data";
    blocking_ingredients?: string[];
    details?: string;
  }> = [];
  const uncuredSet = new Set<string>();

  const validRecipeById = new Map<
    string,
    {
      dish_id: string;
      dish_name: string;
      normalized_name: string;
      ingredient_base: Array<{
        ingredient_id: string;
        name: string;
        normalized_name: string;
        quantity: number;
        unit_type: string;
      }>;
      base_kcal: number;
      base_protein: number;
    }
  >();
  const discardedRecipes: Array<{
    dish_id: string;
    dish_name: string;
    reason: string;
    details?: string;
  }> = [];

  for (const dish of dishRows || []) {
    const normalizedName = normalizeDishName(dish.normalized_name || dish.name);
    const matchingWeeklyMeals = (weeklyMeals || []).filter(
      (meal: any) => normalizeDishName(meal.dish_name) === normalizedName,
    );
    const usedOnlyAsSpecial =
      matchingWeeklyMeals.length > 0 &&
      matchingWeeklyMeals.every((meal: any) =>
        isSpecialMealCandidate(meal, dish),
      );
    if (usedOnlyAsSpecial) {
      continue;
    }
    const rows = recipeIngredientsByRecipeId.get(dish.id) || [];
    const confirmedRows = rows.filter((row: any) => row.is_confirmed);

    if (dish.recipe_status === "pending_ingredients") {
      uncuredSet.add(
        `${dish.id}:pending_ingredients:${normalizedName || dish.id}`,
      );
      uncuredRecipes.push({
        dish_id: dish.id,
        dish_name: dish.name,
        reason: "pending_ingredients",
      });
      discardedRecipes.push({
        dish_id: dish.id,
        dish_name: dish.name,
        reason: "pending_ingredients",
      });
      continue;
    }
    if (dish.recipe_status === "suggested_ingredients") {
      uncuredSet.add(
        `${dish.id}:suggested_ingredients:${normalizedName || dish.id}`,
      );
      uncuredRecipes.push({
        dish_id: dish.id,
        dish_name: dish.name,
        reason: "suggested_ingredients",
      });
      discardedRecipes.push({
        dish_id: dish.id,
        dish_name: dish.name,
        reason: "suggested_ingredients",
      });
      continue;
    }

    if (confirmedRows.length === 0) {
      uncuredSet.add(
        `${dish.id}:pending_ingredients:${normalizedName || dish.id}`,
      );
      uncuredRecipes.push({
        dish_id: dish.id,
        dish_name: dish.name,
        reason: "pending_ingredients",
      });
      discardedRecipes.push({
        dish_id: dish.id,
        dish_name: dish.name,
        reason: "pending_ingredients",
      });
      continue;
    }

    const hasMissingLink = confirmedRows.some((row: any) => !row.ingredient_id);
    if (hasMissingLink) {
      const missingLinkNames = Array.from(
        new Set(
          confirmedRows
            .filter((row: any) => !row.ingredient_id)
            .map((row: any) => String(row.name || "").trim())
            .filter(Boolean),
        ),
      );
      uncuredSet.add(
        `${dish.id}:missing_ingredient_link:${normalizedName || dish.id}`,
      );
      uncuredRecipes.push({
        dish_id: dish.id,
        dish_name: dish.name,
        reason: "missing_ingredient_link",
        blocking_ingredients: missingLinkNames,
      });
      discardedRecipes.push({
        dish_id: dish.id,
        dish_name: dish.name,
        reason: "missing_ingredient_link",
        details: `missing_links:${missingLinkNames.join(",")}`,
      });
      continue;
    }

    const hasMissingNutrition = confirmedRows.some((row: any) => {
      const ingredient = nutritionById.get(row.ingredient_id);
      return (
        !ingredient ||
        ingredient.nutrition_status !== "complete" ||
        ingredient.kcal_per_100g == null ||
        ingredient.protein_per_100g == null ||
        ingredient.carbs_per_100g == null ||
        ingredient.fat_per_100g == null
      );
    });

    if (hasMissingNutrition) {
      const missingNutritionNames = Array.from(
        new Set(
          confirmedRows
            .filter((row: any) => {
              const ingredient = nutritionById.get(row.ingredient_id);
              return (
                !ingredient ||
                ingredient.nutrition_status !== "complete" ||
                ingredient.kcal_per_100g == null ||
                ingredient.protein_per_100g == null ||
                ingredient.carbs_per_100g == null ||
                ingredient.fat_per_100g == null
              );
            })
            .map((row: any) => String(row.name || "").trim())
            .filter(Boolean),
        ),
      );
      uncuredSet.add(
        `${dish.id}:missing_nutrition:${normalizedName || dish.id}`,
      );
      uncuredRecipes.push({
        dish_id: dish.id,
        dish_name: dish.name,
        reason: "missing_nutrition",
        blocking_ingredients: missingNutritionNames,
      });
      discardedRecipes.push({
        dish_id: dish.id,
        dish_name: dish.name,
        reason: "missing_nutrition",
        details: `missing_nutrition:${missingNutritionNames.join(",")}`,
      });
      continue;
    }

    const ingredientBase = confirmedRows.map((ing: any) => ({
      ingredient_id: ing.ingredient_id,
      name: String(ing.name || ""),
      normalized_name: String(ing.normalized_name || ing.name || "").toLowerCase(),
      quantity: Number(ing.quantity),
      unit_type: String(ing.unit_type || ""),
    }));
    const hasInvalidQuantity = ingredientBase.some(
      (ing) => !Number.isFinite(ing.quantity) || ing.quantity <= 0,
    );
    const hasInvalidUnit = ingredientBase.some(
      (ing) => normalizeToGrams(ing.quantity, ing.unit_type) === null,
    );
    if (hasInvalidQuantity || hasInvalidUnit) {
      uncuredSet.add(`${dish.id}:invalid_recipe_data:${normalizedName || dish.id}`);
      uncuredRecipes.push({
        dish_id: dish.id,
        dish_name: dish.name,
        reason: "invalid_recipe_data",
      });
      discardedRecipes.push({
        dish_id: dish.id,
        dish_name: dish.name,
        reason: "invalid_recipe_data",
        details: hasInvalidQuantity
          ? "ingredient_quantity_invalid"
          : "ingredient_unit_not_convertible",
      });
      continue;
    }

    let baseKcal = 0;
    let baseProtein = 0;
    for (const ing of ingredientBase) {
      const nutrition = nutritionById.get(ing.ingredient_id);
      const grams = normalizeToGrams(ing.quantity, ing.unit_type);
      if (!nutrition || grams === null) continue;
      const factor = grams / 100;
      baseKcal += Number(nutrition.kcal_per_100g) * factor;
      baseProtein += Number(nutrition.protein_per_100g) * factor;
    }

    if (baseKcal <= 0 || baseProtein <= 0) {
      uncuredSet.add(`${dish.id}:invalid_recipe_data:${normalizedName || dish.id}`);
      uncuredRecipes.push({
        dish_id: dish.id,
        dish_name: dish.name,
        reason: "invalid_recipe_data",
      });
      discardedRecipes.push({
        dish_id: dish.id,
        dish_name: dish.name,
        reason: "invalid_recipe_data",
        details: "base_macros_not_calculable",
      });
      continue;
    }

    validRecipeById.set(dish.id, {
      dish_id: dish.id,
      dish_name: dish.name,
      normalized_name: normalizedName,
      ingredient_base: ingredientBase,
      base_kcal: baseKcal,
      base_protein: baseProtein,
    });
  }

  for (const [, dish] of dishByNormalizedName) {
    if (!dish._compound) continue;
    const firstValid = validRecipeById.get(dish._firstDishId);
    const secondValid = validRecipeById.get(dish._secondDishId);
    if (!firstValid || !secondValid) {
      discardedRecipes.push({
        dish_id: dish.id,
        dish_name: dish.name,
        reason: "recipe_not_validated",
        details: `compound_missing_valid_recipe:${dish._firstDishId}:${dish._secondDishId}`,
      });
      continue;
    }
    const ingredientMap = new Map<string, any>();
    for (const ing of firstValid.ingredient_base) {
      ingredientMap.set(ing.normalized_name, { ...ing });
    }
    for (const ing of secondValid.ingredient_base) {
      const existing = ingredientMap.get(ing.normalized_name);
      if (existing) {
        existing.quantity += ing.quantity;
      } else {
        ingredientMap.set(ing.normalized_name, { ...ing });
      }
    }
    const combinedIngredientBase = Array.from(ingredientMap.values());
    validRecipeById.set(dish.id, {
      dish_id: dish.id,
      dish_name: dish.name,
      normalized_name: dish.normalized_name,
      ingredient_base: combinedIngredientBase,
      base_kcal: firstValid.base_kcal + secondValid.base_kcal,
      base_protein: firstValid.base_protein + secondValid.base_protein,
    });
  }

  await logger.log({
    level: "info",
    step: "recipe_validation",
    status: "completed",
    message: "Validación de recetas completada.",
    metadata: {
      total_recipes_loaded: dishRows?.length || 0,
      valid_recipes: validRecipeById.size,
      discarded_recipes: discardedRecipes.length,
      discarded_reasons: discardedRecipes.slice(0, 80),
    },
    progress: { progress: 40, currentStep: "recipe_validation" },
  });

  if (validRecipeById.size === 0) {
    await logger.log({
      level: "error",
      step: "recipe_validation",
      status: "failed",
      message: "No hay recetas válidas para generar el menú rotativo.",
      metadata: {
        discarded_recipes: discardedRecipes.slice(0, 80),
      },
      progress: {
        progress: 100,
        currentStep: "recipe_validation",
        status: "failed",
        errorMessage: "No hay recetas válidas para generar el menú rotativo.",
        completedAt: new Date().toISOString(),
      },
    });
    throw createError({
      statusCode: 409,
      statusMessage: "No hay recetas válidas para generar el menú rotativo.",
      data: { discarded_recipes: discardedRecipes },
    });
  }

  if (uncuredSet.size > 0) {
    await logger.log({
      level: "error",
      step: "recipe_validation",
      status: "failed",
      message: "La generación se bloquea por recetas o ingredientes sin curar.",
      metadata: {
        uncured_recipes_count: uncuredRecipes.length,
        uncured_recipes: uncuredRecipes.slice(0, 50),
      },
      progress: {
        progress: 100,
        currentStep: "recipe_validation",
        status: "failed",
        errorMessage:
          "Tienes recetas o ingredientes sin curar. Completa su curación antes de generar el menú rotativo.",
        completedAt: new Date().toISOString(),
        resultPayload: { error_data: { uncured_recipes: uncuredRecipes } },
      },
    });
    throw createError({
      statusCode: 409,
      statusMessage:
        "Tienes recetas o ingredientes sin curar. Completa su curación antes de generar el menú rotativo.",
      data: { uncured_recipes: uncuredRecipes },
    });
  }

  const shares = {
    desayuno: { kcal: 0.25, protein: 0.3 },
    comida: { kcal: 0.4, protein: 0.4 },
    cena: { kcal: 0.35, protein: 0.3 },
  };
  const configuredSpecialMealKcal = Number(body.specialMealKcal);
  const defaultSpecialMealKcal = Math.max(
    0,
    Math.min(
      2000,
      Number.isFinite(configuredSpecialMealKcal)
        ? configuredSpecialMealKcal
        : SPECIAL_MEAL_RESERVED_KCAL,
    ),
  );

  const generatedDays: any[] = [];

  await logger.log({
    level: "info",
    step: "quantity_calculation",
    status: "running",
    message: "Calculando recetas, cantidades base y rotación por día.",
    metadata: { target_days: targetDays },
    progress: { progress: 42, currentStep: "quantity_calculation" },
  });

  const mealOptionsByType: Record<MealType, any[]> = {
    desayuno: [],
    comida: [],
    cena: [],
  };
  const discardedMealOptions: Array<{
    weekly_menu_id: string | null;
    day_number: number | null;
    meal_type: MealType;
    meal_slot: number;
    dish_name: string;
    reason: string;
  }> = [];

  for (const mealType of ["desayuno", "comida", "cena"] as MealType[]) {
    const sourceMeals = mealLibrary[mealType] || [];
    for (const sourceMeal of sourceMeals) {
      let linkedDish =
        dishByNormalizedName.get(normalizeDishName(sourceMeal.dish_name)) || null;

      if (!linkedDish && sourceMeal.compound_day_id) {
        const compoundDay = compoundDayById.get(String(sourceMeal.compound_day_id));
        if (compoundDay) {
          const firstDish = dishById.get(String(compoundDay.first_dish_id)) || null;
          const secondDish = dishById.get(String(compoundDay.second_dish_id)) || null;
          if (firstDish && secondDish) {
            const combinedName = `${firstDish.name} + ${secondDish.name}`;
            linkedDish = {
              id: `compound:${compoundDay.id}`,
              name: combinedName,
              normalized_name: normalizeDishName(combinedName),
              recipe_status:
                firstDish.recipe_status === "complete" &&
                secondDish.recipe_status === "complete"
                  ? "complete"
                  : firstDish.recipe_status === "not_required" &&
                      secondDish.recipe_status === "not_required"
                    ? "not_required"
                    : firstDish.recipe_status === "complete" ||
                        firstDish.recipe_status === "not_required"
                      ? secondDish.recipe_status
                      : firstDish.recipe_status,
              is_special: firstDish.is_special || secondDish.is_special,
              special_kcal_reserved: Math.max(
                firstDish.special_kcal_reserved || 0,
                secondDish.special_kcal_reserved || 0,
              ),
              _compound: true,
              _firstDishId: firstDish.id,
              _secondDishId: secondDish.id,
            };
            dishByNormalizedName.set(
              normalizeDishName(sourceMeal.dish_name),
              linkedDish,
            );
          }
        }
      }

      if (!linkedDish && String(sourceMeal.dish_name || "").includes("+")) {
        const parts = String(sourceMeal.dish_name || "")
          .split(/\s*\+\s*/)
          .map((p) => p.trim())
          .filter(Boolean);
        const matchedParts = parts
          .map((part) => dishByNormalizedName.get(normalizeDishName(part)) || null)
          .filter(Boolean);
        if (matchedParts.length === parts.length && matchedParts.length >= 2) {
          const firstDish = matchedParts[0];
          const secondDish = matchedParts[1];
          const combinedName = `${firstDish.name} + ${secondDish.name}`;
          const allComplete = matchedParts.every((d) => d.recipe_status === "complete");
          const allNotRequired = matchedParts.every((d) => d.recipe_status === "not_required");
          linkedDish = {
            id: `compound:split:${normalizeDishName(sourceMeal.dish_name)}`,
            name: combinedName,
            normalized_name: normalizeDishName(combinedName),
            recipe_status: allComplete
              ? "complete"
              : allNotRequired
                ? "not_required"
                : matchedParts[0].recipe_status,
            is_special: matchedParts.some((d) => d.is_special),
            special_kcal_reserved: Math.max(
              ...matchedParts.map((d) => d.special_kcal_reserved || 0),
            ),
            _compound: true,
            _firstDishId: firstDish.id,
            _secondDishId: secondDish.id,
          };
          dishByNormalizedName.set(
            normalizeDishName(sourceMeal.dish_name),
            linkedDish,
          );
        }
      }

      if (linkedDish && linkedDish._compound) {
        const firstValid = validRecipeById.get(linkedDish._firstDishId);
        const secondValid = validRecipeById.get(linkedDish._secondDishId);
        if (firstValid && secondValid) {
          const ingredientMap = new Map<string, any>();
          for (const ing of firstValid.ingredient_base) {
            ingredientMap.set(ing.normalized_name, { ...ing });
          }
          for (const ing of secondValid.ingredient_base) {
            const existing = ingredientMap.get(ing.normalized_name);
            if (existing) {
              existing.quantity += ing.quantity;
            } else {
              ingredientMap.set(ing.normalized_name, { ...ing });
            }
          }
          validRecipeById.set(linkedDish.id, {
            dish_id: linkedDish.id,
            dish_name: linkedDish.name,
            normalized_name: linkedDish.normalized_name,
            ingredient_base: Array.from(ingredientMap.values()),
            base_kcal: firstValid.base_kcal + secondValid.base_kcal,
            base_protein: firstValid.base_protein + secondValid.base_protein,
          });
        }
      }

      const isSpecial = isSpecialMealCandidate(sourceMeal, linkedDish);
      if (isSpecial) {
        mealOptionsByType[mealType].push({
          ...sourceMeal,
          _linkedDish: linkedDish,
          _isSpecial: true,
        });
        continue;
      }

      if (!linkedDish) {
        discardedMealOptions.push({
          weekly_menu_id: sourceMeal.weekly_menu_id
            ? String(sourceMeal.weekly_menu_id)
            : null,
          day_number: Number(sourceMeal.day_number) || null,
          meal_type: mealType,
          meal_slot: normalizeMealSlot(sourceMeal.meal_slot),
          dish_name: String(sourceMeal.dish_name || ""),
          reason: "recipe_name_not_found",
        });
        continue;
      }

      if (!validRecipeById.has(linkedDish.id)) {
        discardedMealOptions.push({
          weekly_menu_id: sourceMeal.weekly_menu_id
            ? String(sourceMeal.weekly_menu_id)
            : null,
          day_number: Number(sourceMeal.day_number) || null,
          meal_type: mealType,
          meal_slot: normalizeMealSlot(sourceMeal.meal_slot),
          dish_name: String(sourceMeal.dish_name || ""),
          reason: "recipe_not_validated",
        });
        continue;
      }

      mealOptionsByType[mealType].push({
        ...sourceMeal,
        _linkedDish: linkedDish,
        _isSpecial: false,
      });
    }
  }

  const emptyRequiredTypes = (["desayuno", "comida", "cena"] as MealType[]).filter(
    (mealType) =>
      (mealLibrary[mealType] || []).length > 0 &&
      mealOptionsByType[mealType].length === 0,
  );

  await logger.log({
    level: "info",
    step: "recipe_selection",
    status: "completed",
    message: "Selección de recetas por franja completada.",
    metadata: {
      options_by_type: {
        desayuno: mealOptionsByType.desayuno.length,
        comida: mealOptionsByType.comida.length,
        cena: mealOptionsByType.cena.length,
      },
      discarded_meal_options: discardedMealOptions.slice(0, 120),
      empty_required_types: emptyRequiredTypes,
    },
    progress: { progress: 44, currentStep: "recipe_selection" },
  });

  if (emptyRequiredTypes.length > 0) {
    const message = `No hay recetas válidas para: ${emptyRequiredTypes.join(", ")}`;
    await logger.log({
      level: "error",
      step: "recipe_selection",
      status: "failed",
      message,
      metadata: {
        empty_required_types: emptyRequiredTypes,
        discarded_meal_options: discardedMealOptions.slice(0, 120),
      },
      progress: {
        progress: 100,
        currentStep: "recipe_selection",
        status: "failed",
        errorMessage: message,
        completedAt: new Date().toISOString(),
      },
    });
    throw createError({
      statusCode: 409,
      statusMessage: message,
      data: {
        empty_required_types: emptyRequiredTypes,
        discarded_meal_options: discardedMealOptions,
      },
    });
  }

  const weeklyMenuMealOptions = (["desayuno", "comida", "cena"] as MealType[])
    .flatMap((mealType) => mealOptionsByType[mealType])
    .filter((meal) => meal.weekly_menu_id);
  const weeklyMenuIdsWithOptions = new Set(
    weeklyMenuMealOptions.map((meal) => String(meal.weekly_menu_id)),
  );
  const rotationSourceWeeklyMenuIds = Array.from(
    new Set(
      body.sourceWeeklyMenuIds
        .map((id) => String(id || "").trim())
        .filter((id) => id && weeklyMenuIdsWithOptions.has(id)),
    ),
  );
  const plannedDayBlocks = buildRotatingWeeklyMenuBlocks({
    meals: weeklyMenuMealOptions,
    sourceWeeklyMenuIds: rotationSourceWeeklyMenuIds,
    durationDays: targetDays,
    initialWeeklyMenuId: body.initialWeeklyMenuId || null,
  });
  const plannedWeeklyMenuOrder = plannedDayBlocks
    .filter((day) => day.source_day_number === 1)
    .map((day) => day.source_weekly_menu_id);

  await logger.log({
    level: "info",
    step: "recipe_selection",
    status: "completed",
    message: "Rotación por bloques semanales aplicada.",
    metadata: {
      requested_initial_weekly_menu_id: body.initialWeeklyMenuId || null,
      rotation_source_weekly_menu_ids: rotationSourceWeeklyMenuIds,
      planned_weekly_menu_order: plannedWeeklyMenuOrder,
      planned_blocks: plannedDayBlocks
        .filter((day) => day.day_number === 1 || (day.day_number - 1) % 7 === 0)
        .slice(0, 20)
        .map((day) => ({
          day_number: day.day_number,
          source_weekly_menu_id: day.source_weekly_menu_id,
          source_day_number: day.source_day_number,
        })),
    },
    progress: { progress: 45, currentStep: "recipe_selection" },
  });

  const completenessDiagnostics = validatePlannedDayCompleteness({
    plannedDayBlocks,
    sourceMeals: weeklyMeals || [],
    discardedMealOptions: discardedMealOptions as any,
  });

  if (completenessDiagnostics.length > 0) {
    const message =
      "No se puede generar: la rotación dejaría días incompletos respecto a los menús semanales fuente.";
    await logger.log({
      level: "error",
      step: "recipe_selection",
      status: "failed",
      message,
      metadata: {
        missing_source_meals_count: completenessDiagnostics.length,
        missing_source_meals: completenessDiagnostics.slice(0, 120),
      },
      progress: {
        progress: 100,
        currentStep: "recipe_selection",
        status: "failed",
        errorMessage: message,
        completedAt: new Date().toISOString(),
        resultPayload: {
          error_data: { missing_source_meals: completenessDiagnostics },
        },
      },
    });
    throw createError({
      statusCode: 422,
      statusMessage: message,
      data: { missing_source_meals: completenessDiagnostics },
    });
  }

  for (let day = 1; day <= targetDays; day++) {
    const date = new Date(body.startDate);
    date.setDate(date.getDate() + day - 1);
    const dayMeals: any[] = [];
    const dayPlannedMeals: any[] = [];
    const plannedDayBlock = plannedDayBlocks[day - 1];

    for (const picked of plannedDayBlock?.meals || []) {
      const mealType = picked.meal_type as MealType;

      const linkedDish = picked._linkedDish || null;
      const isSpecial = Boolean(picked._isSpecial);
      const specialKcalReserved = isSpecial
        ? resolveSpecialMealKcal({
            picked,
            linkedDish,
            defaultSpecialMealKcal,
          })
        : 0;
      const validRecipe = linkedDish ? validRecipeById.get(linkedDish.id) : null;
      const recipeStatus = linkedDish?.recipe_status || "pending_ingredients";
      const ingredientBase = !isSpecial ? validRecipe?.ingredient_base || [] : [];
      const baseKcal = Math.max(1, Number(validRecipe?.base_kcal || 1));
      const baseProtein = Math.max(1, Number(validRecipe?.base_protein || 1));

      if (isSpecial) {
        await logger.log({
          level: "info",
          step: "special_meals",
          status: "running",
          message: "Special meal detected.",
          metadata: {
            day_number: day,
            meal_type: mealType,
            dish_name: picked.dish_name,
            reserved_kcal: specialKcalReserved,
          },
          progress: { currentStep: "special_meals" },
        });
        await logger.log({
          level: "debug",
          step: "special_meals",
          status: "completed",
          message:
            "Reserved kcal for special meal and skipped ingredient calculation.",
          metadata: {
            day_number: day,
            meal_type: mealType,
            configured_reserved_kcal: specialKcalReserved,
            skipped_ingredient_calculation: true,
            ignored_existing_ingredients: Boolean(
              linkedDish && recipeIngredientsByRecipeId.has(linkedDish.id),
            ),
          },
          progress: { currentStep: "special_meals" },
        });
      }

      dayPlannedMeals.push({
        meal_type: mealType,
        meal_slot: normalizeMealSlot(picked.meal_slot),
        source_weekly_menu_id: picked.weekly_menu_id || null,
        source_day_number: Number(picked.day_number) || null,
        source_weekly_meal_id: picked.id,
        dish_name: picked.dish_name,
        dish_description: picked.dish_description || null,
        is_special: isSpecial,
        special_kcal_reserved: specialKcalReserved,
        base_kcal: baseKcal,
        base_protein: baseProtein,
        recipe_status: recipeStatus,
        ingredient_base: ingredientBase,
      });
    }

    for (const plannedMeal of dayPlannedMeals) {
      const mealType = plannedMeal.meal_type as MealType;
      const isSpecial = Boolean(plannedMeal.is_special);
      const specialKcalReserved = Number(plannedMeal.special_kcal_reserved ?? 0);
      const ingredientBase = plannedMeal.ingredient_base || [];
      const recipeStatus = String(plannedMeal.recipe_status || "");
      const baseKcal = Number(plannedMeal.base_kcal || 1);
      const baseProtein = Number(plannedMeal.base_protein || 1);
      const daySpecialMeals = dayPlannedMeals.filter((meal) => meal.is_special);
      const specialReservedTotal = daySpecialMeals.reduce(
        (acc: number, meal: any) =>
          acc + Number(meal.special_kcal_reserved ?? defaultSpecialMealKcal),
        0,
      );
      const regularMeals = dayPlannedMeals.filter((meal) => !meal.is_special);
      const regularKcalShareSum = regularMeals.reduce(
        (acc: number, meal: any) =>
          acc + Number(shares[meal.meal_type as MealType].kcal),
        0,
      );
      const regularProteinShareSum = regularMeals.reduce(
        (acc: number, meal: any) =>
          acc + Number(shares[meal.meal_type as MealType].protein),
        0,
      );
      const allSpecialDay = regularMeals.length === 0;

      const portions = profileTargets.map((profile) => {
        const rawRemainingKcalBudget =
          Number(profile.target_kcal) - specialReservedTotal;
        const remainingKcalBudget = Math.max(
          regularMeals.length > 0
            ? Math.min(
                MIN_REGULAR_DAY_KCAL_BUDGET,
                Number(profile.target_kcal),
              )
            : 0,
          rawRemainingKcalBudget,
        );
        const lowRegularBudgetWarning =
          regularMeals.length > 0 &&
          rawRemainingKcalBudget < MIN_REGULAR_DAY_KCAL_BUDGET;
        const macroScale =
          Number(profile.target_kcal) > 0
            ? remainingKcalBudget / Number(profile.target_kcal)
            : 0;
        const remainingProteinBudget = Number(profile.target_protein_g) * macroScale;
        const remainingCarbsBudget = Number(profile.target_carbs_g) * macroScale;
        const remainingFatBudget = Number(profile.target_fat_g) * macroScale;

        if (isSpecial) {
          return {
            profile_key: profile.key,
            profile_id: profile.profile_id,
            profile_name: profile.profile_name,
            target_meal_kcal: round(specialKcalReserved),
            target_meal_protein_g: 0,
            target_meal_carbs_g: 0,
            target_meal_fat_g: 0,
            serving_multiplier: 1,
            final_kcal: round(specialKcalReserved),
            final_protein_g: 0,
            final_carbs_g: 0,
            final_fat_g: 0,
            kcal_delta: 0,
            protein_delta_g: 0,
            carbs_delta_g: 0,
            fat_delta_g: 0,
            nutrition_pending: false,
            is_special: true,
            special_kcal_reserved: specialKcalReserved,
            all_special_day: allSpecialDay,
            low_regular_budget_warning: lowRegularBudgetWarning,
            ingredients: [],
          };
        }

        const mealKcalShare = regularKcalShareSum
          ? shares[mealType].kcal / regularKcalShareSum
          : 0;
        const mealProteinShare = regularProteinShareSum
          ? shares[mealType].protein / regularProteinShareSum
          : 0;
        const targetMealKcal = remainingKcalBudget * mealKcalShare;
        const targetMealProtein = remainingProteinBudget * mealProteinShare;
        const targetMealCarbs = remainingCarbsBudget * mealKcalShare;
        const targetMealFat = remainingFatBudget * mealKcalShare;

        const multiplier = Math.max(
          0.55,
          Math.min(
            2.5,
            (targetMealKcal / baseKcal) * 0.65 +
              (targetMealProtein / baseProtein) * 0.35,
          ),
        );
        const hasVeryCaloricIngredient = ingredientBase.some((ing: any) => {
          const nutrition = nutritionById.get(ing.ingredient_id);
          if (!nutrition) return false;
          if (nutrition.caloric_density_level === "very_caloric") return true;
          return Number(nutrition.kcal_per_100g || 0) > 400;
        });
        const hasCaloricIngredient = ingredientBase.some((ing: any) => {
          const nutrition = nutritionById.get(ing.ingredient_id);
          if (!nutrition) return false;
          if (nutrition.caloric_density_level === "caloric") return true;
          const kcal = Number(nutrition.kcal_per_100g || 0);
          return kcal > 200 && kcal <= 400;
        });
        const densityCap = hasVeryCaloricIngredient
          ? 1.35
          : hasCaloricIngredient
            ? 1.7
            : 2.5;
        const adjustedMultiplier = Math.max(0.55, Math.min(multiplier, densityCap));
        let kcal = 0;
        let protein = 0;
        let carbs = 0;
        let fat = 0;
        let pending = false;
        if (ingredientBase.length === 0 && recipeStatus !== "not_required") {
          pending = true;
        }
        if (
          recipeStatus === "pending_ingredients" ||
          recipeStatus === "suggested_ingredients"
        ) {
          pending = true;
        }

        const ingredients = ingredientBase.map((ing: any) => {
          const finalQuantity = round(ing.quantity * adjustedMultiplier);
          const normalized = normalizeToGrams(finalQuantity, ing.unit_type);
          const n = nutritionById.get(ing.ingredient_id);
          let nutritionPending = false;
          if (!n || n.nutrition_status !== "complete" || normalized === null) {
            nutritionPending = true;
            pending = true;
          } else if (
            n.kcal_per_100g == null ||
            n.protein_per_100g == null ||
            n.carbs_per_100g == null ||
            n.fat_per_100g == null
          ) {
            nutritionPending = true;
            pending = true;
          } else {
            const factor = normalized / 100;
            kcal += Number(n.kcal_per_100g) * factor;
            protein += Number(n.protein_per_100g) * factor;
            carbs += Number(n.carbs_per_100g) * factor;
            fat += Number(n.fat_per_100g) * factor;
          }
          return {
            name: ing.name,
            base_quantity: ing.quantity,
            final_quantity: finalQuantity,
            unit_type: ing.unit_type,
            nutrition_pending: nutritionPending,
          };
        });

        return {
          profile_key: profile.key,
          profile_id: profile.profile_id,
          profile_name: profile.profile_name,
          target_meal_kcal: round(targetMealKcal),
          target_meal_protein_g: round(targetMealProtein),
          target_meal_carbs_g: round(targetMealCarbs),
          target_meal_fat_g: round(targetMealFat),
          serving_multiplier: round(multiplier, 3),
          serving_multiplier_density_adjusted: round(adjustedMultiplier, 3),
          final_kcal: Math.round(kcal),
          final_protein_g: round(protein),
          final_carbs_g: round(carbs),
          final_fat_g: round(fat),
          kcal_delta: round(kcal - targetMealKcal),
          protein_delta_g: round(protein - targetMealProtein),
          carbs_delta_g: round(carbs - targetMealCarbs),
          fat_delta_g: round(fat - targetMealFat),
          nutrition_pending: pending,
          is_special: false,
          special_kcal_reserved: 0,
          all_special_day: allSpecialDay,
          low_regular_budget_warning: lowRegularBudgetWarning,
          ingredients,
        };
      });

      dayMeals.push({
        meal_type: mealType,
        meal_slot: normalizeMealSlot(plannedMeal.meal_slot),
        source_weekly_menu_id: plannedMeal.source_weekly_menu_id || null,
        source_day_number: Number(plannedMeal.source_day_number) || null,
        source_weekly_meal_id: plannedMeal.source_weekly_meal_id,
        dish_name: plannedMeal.dish_name,
        dish_description: plannedMeal.dish_description || null,
        is_special: isSpecial,
        special_kcal_reserved: specialKcalReserved,
        profile_portions: portions,
      });
    }

    const dailyProfileTotals = profileTargets.map((profile) => {
      const profileMeals = dayMeals.map((meal) =>
        meal.profile_portions.find((portion: any) => portion.profile_key === profile.key),
      );
      const kcal = profileMeals.reduce(
        (acc: number, meal: any) => acc + Number(meal?.final_kcal || 0),
        0,
      );
      const protein = profileMeals.reduce(
        (acc: number, meal: any) => acc + Number(meal?.final_protein_g || 0),
        0,
      );
      const carbs = profileMeals.reduce(
        (acc: number, meal: any) => acc + Number(meal?.final_carbs_g || 0),
        0,
      );
      const fat = profileMeals.reduce(
        (acc: number, meal: any) => acc + Number(meal?.final_fat_g || 0),
        0,
      );
      const specialKcalReserved = dayMeals
        .filter((meal) => meal.is_special)
        .reduce(
          (acc: number, meal: any) =>
            acc + Number(meal.special_kcal_reserved ?? defaultSpecialMealKcal),
          0,
        );
      const regularKcal = Math.max(0, kcal - specialKcalReserved);
      const allSpecialDay =
        dayMeals.length > 0 && dayMeals.every((meal) => meal.is_special);
      const lowRegularBudgetWarning = dayMeals.some((meal) =>
        meal.profile_portions.some(
          (portion: any) =>
            portion.profile_key === profile.key &&
            Boolean(portion.low_regular_budget_warning),
        ),
      );
      return {
        profile_key: profile.key,
        profile_id: profile.profile_id,
        profile_name: profile.profile_name,
        target_kcal: round(profile.target_kcal),
        target_protein_g: round(profile.target_protein_g),
        target_carbs_g: round(profile.target_carbs_g),
        target_fat_g: round(profile.target_fat_g),
        total_kcal: Math.round(kcal),
        total_protein_g: round(protein),
        total_carbs_g: round(carbs),
        total_fat_g: round(fat),
        special_kcal_reserved: round(specialKcalReserved),
        regular_kcal: Math.round(regularKcal),
        kcal_delta: round(kcal - profile.target_kcal),
        protein_delta_g: round(protein - profile.target_protein_g),
        carbs_delta_g: round(carbs - profile.target_carbs_g),
        fat_delta_g: round(fat - profile.target_fat_g),
        all_special_day: allSpecialDay,
        low_regular_budget_warning: lowRegularBudgetWarning,
      };
    });

    const dayWarnings = dailyProfileTotals.filter(
      (total) => total.low_regular_budget_warning,
    );
    if (dayWarnings.length > 0) {
      await logger.log({
        level: "warn",
        step: "special_meals",
        status: "completed",
        message:
          "Special meal kcal reservations leave a low budget for regular meals.",
        metadata: {
          day_number: day,
          profiles: dayWarnings.map((total) => ({
            profile_id: total.profile_id,
            profile_name: total.profile_name,
            target_kcal: total.target_kcal,
            special_kcal_reserved: total.special_kcal_reserved,
            minimum_regular_budget_kcal: MIN_REGULAR_DAY_KCAL_BUDGET,
          })),
        },
        progress: { currentStep: "special_meals" },
      });
    }

    generatedDays.push({
      day_number: day,
      day_date: date.toISOString().split("T")[0],
      meals: dayMeals,
      profile_totals: dailyProfileTotals,
    });

    if (day === 1 || day === targetDays || day % 10 === 0) {
      await logger.log({
        level: "debug",
        step: "profile_scaling",
        status: "running",
        message: `Escalado por perfil calculado hasta el día ${day}.`,
        metadata: {
          day_number: day,
          meals_count: dayMeals.length,
          profiles_count: profileTargets.length,
          sample_profile_totals: dailyProfileTotals.slice(0, 3),
        },
        progress: {
          progress: 42 + Math.round((day / targetDays) * 24),
          currentStep: "profile_scaling",
        },
      });
    }
  }

  const invalidNormalMeals = generatedDays.flatMap((day: any) =>
    day.meals
      .filter((meal: any) => !meal.is_special)
      .flatMap((meal: any) =>
        (meal.profile_portions || [])
          .filter((portion: any) => {
            const hasNoIngredients = (portion.ingredients || []).length === 0;
            const kcal = Number(portion.final_kcal || 0);
            const protein = Number(portion.final_protein_g || 0);
            const carbs = Number(portion.final_carbs_g || 0);
            const fat = Number(portion.final_fat_g || 0);
            const hasInvalidKcal = kcal <= 0;
            const hasNegativeMacro = protein < 0 || carbs < 0 || fat < 0;
            const hasNoMacroMass = protein + carbs + fat <= 0;
            return (
              hasNoIngredients ||
              hasInvalidKcal ||
              hasNegativeMacro ||
              hasNoMacroMass ||
              Boolean(portion.nutrition_pending)
            );
          })
          .map((portion: any) => ({
            day_number: day.day_number,
            meal_type: meal.meal_type,
            meal_slot: normalizeMealSlot(meal.meal_slot),
            dish_name: meal.dish_name,
            profile_id: portion.profile_id,
            profile_name: portion.profile_name,
            final_kcal: portion.final_kcal,
            final_protein_g: portion.final_protein_g,
            final_carbs_g: portion.final_carbs_g,
            final_fat_g: portion.final_fat_g,
            total_macro_g:
              Number(portion.final_protein_g || 0) +
              Number(portion.final_carbs_g || 0) +
              Number(portion.final_fat_g || 0),
            ingredients_count: (portion.ingredients || []).length,
            nutrition_pending: Boolean(portion.nutrition_pending),
          })),
      ),
  );

  if (invalidNormalMeals.length > 0) {
    await logger.log({
      level: "error",
      step: "macro_validation",
      status: "failed",
      message:
        "Se detectaron comidas normales inválidas (kcal/macros/ingredientes).",
      metadata: {
        invalid_meals_count: invalidNormalMeals.length,
        invalid_meals: invalidNormalMeals.slice(0, 120),
      },
      progress: {
        progress: 100,
        currentStep: "macro_validation",
        status: "failed",
        errorMessage:
          "No se puede completar: hay comidas normales sin ingredientes o sin macros/kcal calculadas.",
        completedAt: new Date().toISOString(),
      },
    });
    throw createError({
      statusCode: 422,
      statusMessage:
        "No se puede completar: hay comidas normales sin ingredientes o sin macros/kcal calculadas.",
      data: { invalid_meals: invalidNormalMeals },
    });
  }

  const specialMealsCount = generatedDays.reduce(
    (acc, day) =>
      acc + day.meals.filter((meal: any) => Boolean(meal.is_special)).length,
    0,
  );

  await logger.log({
    level: "info",
    step: "special_meals",
    status: "completed",
    message: "Comidas especiales/libres procesadas.",
    metadata: {
      special_meals_count: specialMealsCount,
      default_special_meal_kcal: defaultSpecialMealKcal,
    },
    progress: { progress: 68, currentStep: "special_meals" },
  });

  await logger.log({
    level: "info",
    step: "macro_validation",
    status: "completed",
    message: "Totales diarios y desviaciones macro calculadas.",
    metadata: {
      generated_days_count: generatedDays.length,
      profiles_count: profileTargets.length,
      max_abs_kcal_delta: Math.max(
        0,
        ...generatedDays.flatMap((day) =>
          day.profile_totals.map((total: any) =>
            Math.abs(Number(total.kcal_delta || 0)),
          ),
        ),
      ),
      nutrition_pending_portions: generatedDays.reduce(
        (acc, day) =>
          acc +
          day.meals.reduce(
            (mealAcc: number, meal: any) =>
              mealAcc +
              meal.profile_portions.filter((portion: any) =>
                Boolean(portion.nutrition_pending),
              ).length,
            0,
          ),
        0,
      ),
    },
    progress: { progress: 72, currentStep: "macro_validation" },
  });

  const totalTargets = profileTargets.reduce(
    (acc, p) => {
      acc.kcal += p.target_kcal;
      acc.protein += p.target_protein_g;
      acc.carbs += p.target_carbs_g;
      acc.fat += p.target_fat_g;
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  await logger.log({
    level: "info",
    step: "save_supabase",
    status: "running",
    message: "Guardando menú rotativo y entidades relacionadas en Supabase.",
    metadata: {
      generated_days_count: generatedDays.length,
      meals_count: generatedDays.reduce(
        (acc, day) => acc + day.meals.length,
        0,
      ),
      total_targets: totalTargets,
    },
    progress: { progress: 78, currentStep: "save_supabase" },
  });

  const { data: rotatingMenu, error: rotatingError } = await supabase
    .from("rotating_menus")
    .insert({
      user_id: body.userId,
      profile_id: profileTargets.find((p) => p.profile_id)?.profile_id || null,
      name: body.name || "Menú rotativo",
      source_weekly_menu_ids: body.sourceWeeklyMenuIds,
      duration_days: targetDays,
      persons_count: profileTargets.length,
      target_kcal: Math.round(totalTargets.kcal),
      target_protein_g: round(totalTargets.protein),
      target_carbs_g: round(totalTargets.carbs),
      target_fat_g: round(totalTargets.fat),
    })
    .select("id")
    .single();
  if (rotatingError || !rotatingMenu) {
    await logger.log({
      level: "error",
      step: "save_supabase",
      status: "failed",
      message: rotatingError?.message || "Error guardando rotating_menus",
      metadata: { error: rotatingError },
      progress: { currentStep: "save_supabase", progress: 100 },
    });
    throw createError({
      statusCode: 500,
      statusMessage: rotatingError?.message || "Error guardando rotating_menus",
    });
  }

  const realProfiles = profileTargets.filter((p) => p.profile_id);
  if (realProfiles.length > 0) {
    const { error: profileInsertError } = await supabase
      .from("rotating_menu_profiles")
      .insert(
        realProfiles.map((profile) => ({
          rotating_menu_id: rotatingMenu.id,
          profile_id: profile.profile_id,
          target_kcal: Math.round(profile.target_kcal),
          target_protein_g: round(profile.target_protein_g),
          target_carbs_g: round(profile.target_carbs_g),
          target_fat_g: round(profile.target_fat_g),
        })),
      );
    if (profileInsertError) {
      await logger.log({
        level: "error",
        step: "save_supabase",
        status: "failed",
        message: profileInsertError.message,
        metadata: { table: "rotating_menu_profiles", error: profileInsertError },
        progress: { currentStep: "save_supabase", progress: 100 },
      });
      throw createError({
        statusCode: 500,
        statusMessage: profileInsertError.message,
      });
    }
  }

  const persistedDays = generatedDays;

  const dayRows = persistedDays.map((day) => {
    const totals = day.meals.reduce(
      (acc: any, meal: any) => {
        for (const portion of meal.profile_portions) {
          acc.kcal += portion.final_kcal;
          acc.protein += portion.final_protein_g;
          acc.carbs += portion.final_carbs_g;
          acc.fat += portion.final_fat_g;
        }
        return acc;
      },
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    );
    return {
      rotating_menu_id: rotatingMenu.id,
      day_number: day.day_number,
      day_date: day.day_date,
      total_kcal: Math.round(totals.kcal),
      total_protein_g: round(totals.protein),
      total_carbs_g: round(totals.carbs),
      total_fat_g: round(totals.fat),
    };
  });
  const { data: savedDays, error: daysError } = await supabase
    .from("rotating_menu_days")
    .insert(dayRows)
    .select("id, day_number");
  if (daysError || !savedDays) {
    await logger.log({
      level: "error",
      step: "save_supabase",
      status: "failed",
      message: daysError?.message || "Error guardando rotating_menu_days",
      metadata: { table: "rotating_menu_days", error: daysError },
      progress: { currentStep: "save_supabase", progress: 100 },
    });
    throw createError({
      statusCode: 500,
      statusMessage: daysError?.message || "Error guardando rotating_menu_days",
    });
  }
  const dayIdByNumber = new Map(
    savedDays.map((row: any) => [row.day_number, row.id]),
  );

  const mealRows = persistedDays.flatMap((day) =>
    day.meals.map((meal: any) => ({
      rotating_menu_day_id: dayIdByNumber.get(day.day_number),
      meal_type: meal.meal_type,
      meal_slot: normalizeMealSlot(meal.meal_slot),
      source_weekly_meal_id: meal.source_weekly_meal_id,
      dish_name: meal.dish_name,
      dish_description: meal.dish_description || null,
      is_special: Boolean(meal.is_special),
      special_kcal_reserved: Number(meal.special_kcal_reserved ?? 0),
      base_servings: 1,
      serving_multiplier: meal.profile_portions[0]?.serving_multiplier || 1,
      final_kcal: meal.profile_portions[0]?.final_kcal || 0,
      final_protein_g: meal.profile_portions[0]?.final_protein_g || 0,
      final_carbs_g: meal.profile_portions[0]?.final_carbs_g || 0,
      final_fat_g: meal.profile_portions[0]?.final_fat_g || 0,
    })),
  );
  const { data: savedMeals, error: mealsError } = await supabase
    .from("rotating_menu_meals")
    .insert(mealRows)
    .select("id, rotating_menu_day_id, meal_type, meal_slot");
  if (mealsError || !savedMeals) {
    await logger.log({
      level: "error",
      step: "save_supabase",
      status: "failed",
      message: mealsError?.message || "Error guardando rotating_menu_meals",
      metadata: { table: "rotating_menu_meals", error: mealsError },
      progress: { currentStep: "save_supabase", progress: 100 },
    });
    throw createError({
      statusCode: 500,
      statusMessage:
        mealsError?.message || "Error guardando rotating_menu_meals",
    });
  }
  const mealIdByKey = new Map(
    savedMeals.map((meal: any) => [
      rotatingMealKey(
        meal.rotating_menu_day_id,
        meal.meal_type,
        meal.meal_slot,
      ),
      meal.id,
    ]),
  );

  const portionsRows = persistedDays.flatMap((day) =>
    day.meals.flatMap((meal: any) => {
      const dayId = dayIdByNumber.get(day.day_number);
      const mealId = mealIdByKey.get(
        rotatingMealKey(dayId, meal.meal_type, meal.meal_slot),
      );
      return meal.profile_portions
        .filter((p: any) => p.profile_id)
        .map((portion: any) => ({
          rotating_menu_meal_id: mealId,
          profile_id: portion.profile_id,
          serving_multiplier: portion.serving_multiplier,
          final_kcal: portion.final_kcal,
          final_protein_g: portion.final_protein_g,
          final_carbs_g: portion.final_carbs_g,
          final_fat_g: portion.final_fat_g,
          nutrition_pending: portion.nutrition_pending,
        }));
    }),
  );
  const { data: savedPortions, error: portionsError } = await supabase
    .from("rotating_menu_meal_profile_portions")
    .insert(portionsRows)
    .select("id, rotating_menu_meal_id, profile_id");
  if (portionsError || !savedPortions) {
    await logger.log({
      level: "error",
      step: "save_supabase",
      status: "failed",
      message:
        portionsError?.message ||
        "Error guardando rotating_menu_meal_profile_portions",
      metadata: {
        table: "rotating_menu_meal_profile_portions",
        error: portionsError,
      },
      progress: { currentStep: "save_supabase", progress: 100 },
    });
    throw createError({
      statusCode: 500,
      statusMessage:
        portionsError?.message ||
        "Error guardando rotating_menu_meal_profile_portions",
    });
  }
  const portionIdByKey = new Map(
    savedPortions.map((p: any) => [
      `${p.rotating_menu_meal_id}:${p.profile_id}`,
      p.id,
    ]),
  );

  const ingredientsRows = persistedDays.flatMap((day) =>
    day.meals.flatMap((meal: any) => {
      if (meal.is_special) return [];
      const dayId = dayIdByNumber.get(day.day_number);
      const mealId = mealIdByKey.get(
        rotatingMealKey(dayId, meal.meal_type, meal.meal_slot),
      );
      return meal.profile_portions
        .filter((p: any) => p.profile_id)
        .flatMap((portion: any) => {
          const portionId = portionIdByKey.get(
            `${mealId}:${portion.profile_id}`,
          );
          return portion.ingredients
            .filter((ing: any) => ing.name && ing.final_quantity > 0)
            .map((ing: any) => ({
              rotating_menu_meal_profile_portion_id: portionId,
              name: String(ing.name).toLowerCase(),
              base_quantity: ing.base_quantity,
              final_quantity: ing.final_quantity,
              unit_type: ing.unit_type,
              nutrition_pending: !!ing.nutrition_pending,
            }));
        });
    }),
  );
  if (ingredientsRows.length > 0) {
    const { error: ingredientsError } = await supabase
      .from("rotating_menu_meal_profile_ingredients")
      .insert(ingredientsRows);
    if (ingredientsError) {
      await logger.log({
        level: "error",
        step: "save_supabase",
        status: "failed",
        message:
          ingredientsError.message ||
          "Error guardando rotating_menu_meal_profile_ingredients",
        metadata: {
          table: "rotating_menu_meal_profile_ingredients",
          error: ingredientsError,
          rows_count: ingredientsRows.length,
        },
        progress: { currentStep: "save_supabase", progress: 100 },
      });
      throw createError({
        statusCode: 500,
        statusMessage:
          ingredientsError.message ||
          "Error guardando rotating_menu_meal_profile_ingredients",
      });
    }
  }

  await logger.log({
    level: "info",
    step: "save_supabase",
    status: "completed",
    message: "Menú rotativo guardado en Supabase.",
    metadata: {
      rotating_menu_id: rotatingMenu.id,
      days_inserted: savedDays.length,
      meals_inserted: savedMeals.length,
      portions_inserted: savedPortions.length,
      ingredients_inserted: ingredientsRows.length,
    },
    progress: { progress: 88, currentStep: "save_supabase" },
  });

  await logger.log({
    level: "info",
    step: "shopping_list",
    status: "running",
    message: "Generando lista de la compra consolidada.",
    metadata: { rotating_menu_id: rotatingMenu.id },
    progress: { progress: 92, currentStep: "shopping_list" },
  });

  const shoppingBuild = await buildShoppingListFromRotatingMenu({
    supabase,
    userId: body.userId,
    rotatingMenuId: rotatingMenu.id,
  });

  if (shoppingBuild.skippedSpecialMeals > 0) {
    await logger.log({
      level: "info",
      step: "shopping_list",
      status: "completed",
      message: "Skipping shopping list contribution for special meal.",
      metadata: {
        rotating_menu_id: rotatingMenu.id,
        skipped_special_meals: shoppingBuild.skippedSpecialMeals,
      },
      progress: { currentStep: "shopping_list" },
    });
  }

  await logger.log({
    level: "info",
    step: "shopping_list",
    status: "completed",
    message: "Lista de la compra generada.",
    metadata: {
      rotating_menu_id: rotatingMenu.id,
      inserted_items: shoppingBuild.inserted,
      skipped_special_meals: shoppingBuild.skippedSpecialMeals,
    },
    progress: { progress: 96, currentStep: "shopping_list" },
  });

  await logger.log({
    level: "info",
    step: "generation_completed",
    status: "completed",
    message: "Generación de menú rotativo completada.",
    metadata: {
      rotating_menu_id: rotatingMenu.id,
      generated_days_count: generatedDays.length,
      shopping_list_items: shoppingBuild.inserted,
    },
    progress: { progress: 98, currentStep: "generation_completed" },
  });

  return {
    success: true,
    rotating_menu_id: rotatingMenu.id,
    generated_days: persistedDays,
    profiles: profileTargets,
    shopping_list_items: shoppingBuild.inserted,
  };
});

function normalizeToGrams(quantity: number, unitType: string): number | null {
  if (!Number.isFinite(quantity) || quantity <= 0) return 0;
  if (unitType === "g") return quantity;
  if (unitType === "kg") return quantity * 1000;
  if (unitType === "ml") return quantity;
  if (unitType === "l") return quantity * 1000;
  return null;
}

function normalizeDishName(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isSpecialMealCandidate(meal: any, dish?: any | null) {
  const normalizedName = normalizeDishName(
    meal?.dish_name || meal?.name || dish?.name || dish?.normalized_name,
  );
  const normalizedMealType = normalizeDishName(meal?.meal_type);
  return (
    Boolean(meal?.is_special) ||
    Boolean(meal?.is_free) ||
    Boolean(meal?.special) ||
    Boolean(dish?.is_special) ||
    Boolean(dish?.is_free) ||
    Boolean(dish?.special) ||
    normalizedName === "libre" ||
    normalizedName === "comida libre" ||
    normalizedName === "cena libre" ||
    normalizedName === "desayuno libre" ||
    normalizedName.includes("comida libre") ||
    normalizedName.includes("cena libre") ||
    normalizedMealType === "especial" ||
    normalizedMealType === "libre" ||
    normalizedMealType === "free"
  );
}

function resolveSpecialMealKcal({
  picked,
  linkedDish,
  defaultSpecialMealKcal,
}: {
  picked: any;
  linkedDish?: any | null;
  defaultSpecialMealKcal: number;
}) {
  const reservedKcal = [
    picked?.special_kcal_reserved,
    linkedDish?.special_kcal_reserved,
    defaultSpecialMealKcal,
    SPECIAL_MEAL_RESERVED_KCAL,
  ].find((value) => Number.isFinite(Number(value)));
  return Math.max(
    0,
    Math.min(2000, Number(reservedKcal ?? SPECIAL_MEAL_RESERVED_KCAL)),
  );
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
