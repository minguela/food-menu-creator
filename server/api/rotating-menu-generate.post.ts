import { createSupabaseAdminClient } from "~/server/utils/supabase-admin";
import { buildShoppingListFromRotatingMenu } from "~/server/utils/shopping-from-rotating";

type MealType = "desayuno" | "comida" | "cena";

type GeneratePayload = {
  userId: string;
  name: string;
  durationDays: number;
  startDate: string;
  sourceWeeklyMenuIds: string[];
  profileIds: string[];
  specialMealKcal?: number;
};

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as GeneratePayload;
  const config = useRuntimeConfig(event);
  const supabase = createSupabaseAdminClient(config);

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
          "id, day_number, meal_type, dish_name, dish_description, is_special, special_kcal_reserved",
        )
        .in("weekly_menu_id", body.sourceWeeklyMenuIds),
    ]);

  if (!user) {
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

  if (profileTargets.length === 0) {
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

  const uniqueDishNames = Array.from(
    new Set(
      (weeklyMeals || [])
        .map((meal: any) => String(meal.dish_name || "").trim())
        .filter(Boolean),
    ),
  );
  const { data: dishRows } = await supabase
    .from("dishes")
    .select("id,name,normalized_name,recipe_status")
    .eq("user_id", body.userId)
    .in(
      "normalized_name",
      uniqueDishNames.map((name) => name.toLowerCase()),
    );
  const dishByNormalizedName = new Map(
    (dishRows || []).map((row: any) => [
      String(row.normalized_name || row.name || "").toLowerCase(),
      row,
    ]),
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
  const { data: ingredientRows } = await supabase
    .from("ingredients")
    .select(
      "id, name, normalized_name, nutrition_status, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g",
    )
    .in("id", ingredientIds);
  const nutritionById = new Map(
    (ingredientRows || []).map((row: any) => [row.id, row]),
  );

  const uncuredRecipes: Array<{
    dish_id: string;
    dish_name: string;
    reason:
      | "pending_ingredients"
      | "suggested_ingredients"
      | "missing_ingredient_link"
      | "missing_nutrition";
  }> = [];
  const uncuredSet = new Set<string>();

  for (const dish of dishRows || []) {
    const normalizedName = String(
      dish.normalized_name || dish.name || "",
    ).toLowerCase();
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
      continue;
    }

    const hasMissingLink = confirmedRows.some((row: any) => !row.ingredient_id);
    if (hasMissingLink) {
      uncuredSet.add(
        `${dish.id}:missing_ingredient_link:${normalizedName || dish.id}`,
      );
      uncuredRecipes.push({
        dish_id: dish.id,
        dish_name: dish.name,
        reason: "missing_ingredient_link",
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
      uncuredSet.add(
        `${dish.id}:missing_nutrition:${normalizedName || dish.id}`,
      );
      uncuredRecipes.push({
        dish_id: dish.id,
        dish_name: dish.name,
        reason: "missing_nutrition",
      });
    }
  }

  if (uncuredSet.size > 0) {
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
  const defaultSpecialMealKcal = Math.max(
    0,
    Math.min(2000, Number(body.specialMealKcal) || 700),
  );

  const generatedDays: any[] = [];
  const lastByType: Record<string, string> = {};

  for (let day = 1; day <= targetDays; day++) {
    const date = new Date(body.startDate);
    date.setDate(date.getDate() + day - 1);
    const dayMeals: any[] = [];

    const dayPlannedMeals: any[] = [];

    for (const mealType of ["desayuno", "comida", "cena"] as MealType[]) {
      const options = mealLibrary[mealType] || [];
      if (options.length === 0) continue;
      let pickIndex = (day - 1) % options.length;
      if (
        options.length > 1 &&
        options[pickIndex].dish_name === lastByType[mealType]
      ) {
        pickIndex = (pickIndex + 1) % options.length;
      }
      const picked = options[pickIndex];
      lastByType[mealType] = picked.dish_name;

      const linkedDish =
        dishByNormalizedName.get(
          String(picked.dish_name || "").toLowerCase(),
        ) || null;
      const recipeStatus = linkedDish?.recipe_status || "pending_ingredients";
      const recipeRowsForDish = linkedDish
        ? recipeIngredientsByRecipeId.get(linkedDish.id) || []
        : [];
      const ingredientBase = recipeRowsForDish
        .filter((row: any) => row.is_confirmed && row.ingredient_id)
        .map((ing: any) => ({
          ingredient_id: ing.ingredient_id,
          name: String(ing.name || ""),
          normalized_name: String(
            ing.normalized_name || ing.name || "",
          ).toLowerCase(),
          quantity: Number(ing.quantity) || 1,
          unit_type: ing.unit_type,
        }));

      let baseKcal = 0;
      let baseProtein = 0;
      for (const baseIng of ingredientBase) {
        const n = nutritionById.get(baseIng.ingredient_id);
        const normalized = normalizeToGrams(
          baseIng.quantity,
          baseIng.unit_type,
        );
        if (
          !n ||
          n.nutrition_status !== "complete" ||
          normalized === null ||
          n.kcal_per_100g == null ||
          n.protein_per_100g == null
        ) {
          continue;
        }
        const factor = normalized / 100;
        baseKcal += Number(n.kcal_per_100g) * factor;
        baseProtein += Number(n.protein_per_100g) * factor;
      }
      baseKcal = Math.max(1, baseKcal || 1);
      baseProtein = Math.max(1, baseProtein || 1);

      dayPlannedMeals.push({
        meal_type: mealType,
        source_weekly_meal_id: picked.id,
        dish_name: picked.dish_name,
        dish_description: picked.dish_description || null,
        is_special: Boolean(picked.is_special),
        special_kcal_reserved: Boolean(picked.is_special)
          ? Math.max(
              0,
              Math.min(
                2000,
                Number(picked.special_kcal_reserved || defaultSpecialMealKcal),
              ),
            )
          : 0,
        base_kcal: baseKcal,
        base_protein: baseProtein,
        recipe_status: recipeStatus,
        ingredient_base: ingredientBase,
      });
    }

    for (const plannedMeal of dayPlannedMeals) {
      const mealType = plannedMeal.meal_type as MealType;
      const isSpecial = Boolean(plannedMeal.is_special);
      const specialKcalReserved = Number(plannedMeal.special_kcal_reserved || 0);
      const ingredientBase = plannedMeal.ingredient_base || [];
      const recipeStatus = String(plannedMeal.recipe_status || "");
      const baseKcal = Number(plannedMeal.base_kcal || 1);
      const baseProtein = Number(plannedMeal.base_protein || 1);
      const daySpecialMeals = dayPlannedMeals.filter((meal) => meal.is_special);
      const specialReservedTotal = daySpecialMeals.reduce(
        (acc: number, meal: any) =>
          acc + Number(meal.special_kcal_reserved || defaultSpecialMealKcal),
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
        const remainingKcalBudget = Math.max(
          0,
          Number(profile.target_kcal) - specialReservedTotal,
        );
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
            ingredients: ingredientBase.map((ing: any) => ({
              name: ing.name,
              base_quantity: ing.quantity,
              final_quantity: ing.quantity,
              unit_type: ing.unit_type,
              nutrition_pending: false,
            })),
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
          const finalQuantity = round(ing.quantity * multiplier);
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
          ingredients,
        };
      });

      dayMeals.push({
        meal_type: mealType,
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
            acc + Number(meal.special_kcal_reserved || defaultSpecialMealKcal),
          0,
        );
      const allSpecialDay =
        dayMeals.length > 0 && dayMeals.every((meal) => meal.is_special);
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
        kcal_delta: round(kcal - profile.target_kcal),
        protein_delta_g: round(protein - profile.target_protein_g),
        carbs_delta_g: round(carbs - profile.target_carbs_g),
        fat_delta_g: round(fat - profile.target_fat_g),
        all_special_day: allSpecialDay,
      };
    });

    generatedDays.push({
      day_number: day,
      day_date: date.toISOString().split("T")[0],
      meals: dayMeals,
      profile_totals: dailyProfileTotals,
    });
  }

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
      throw createError({
        statusCode: 500,
        statusMessage: profileInsertError.message,
      });
    }
  }

  const dayRows = generatedDays.map((day) => {
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
    throw createError({
      statusCode: 500,
      statusMessage: daysError?.message || "Error guardando rotating_menu_days",
    });
  }
  const dayIdByNumber = new Map(
    savedDays.map((row: any) => [row.day_number, row.id]),
  );

  const mealRows = generatedDays.flatMap((day) =>
    day.meals.map((meal: any) => ({
      rotating_menu_day_id: dayIdByNumber.get(day.day_number),
      meal_type: meal.meal_type,
      source_weekly_meal_id: meal.source_weekly_meal_id,
      dish_name: meal.dish_name,
      dish_description: meal.dish_description || null,
      is_special: Boolean(meal.is_special),
      special_kcal_reserved: Number(meal.special_kcal_reserved || 0),
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
    .select("id, rotating_menu_day_id, meal_type");
  if (mealsError || !savedMeals) {
    throw createError({
      statusCode: 500,
      statusMessage:
        mealsError?.message || "Error guardando rotating_menu_meals",
    });
  }
  const mealIdByKey = new Map(
    savedMeals.map((meal: any) => [
      `${meal.rotating_menu_day_id}:${meal.meal_type}`,
      meal.id,
    ]),
  );

  const portionsRows = generatedDays.flatMap((day) =>
    day.meals.flatMap((meal: any) => {
      const dayId = dayIdByNumber.get(day.day_number);
      const mealId = mealIdByKey.get(`${dayId}:${meal.meal_type}`);
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

  const ingredientsRows = generatedDays.flatMap((day) =>
    day.meals.flatMap((meal: any) => {
      const dayId = dayIdByNumber.get(day.day_number);
      const mealId = mealIdByKey.get(`${dayId}:${meal.meal_type}`);
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
      throw createError({
        statusCode: 500,
        statusMessage:
          ingredientsError.message ||
          "Error guardando rotating_menu_meal_profile_ingredients",
      });
    }
  }

  const shoppingBuild = await buildShoppingListFromRotatingMenu({
    supabase,
    userId: body.userId,
    rotatingMenuId: rotatingMenu.id,
  });

  return {
    success: true,
    rotating_menu_id: rotatingMenu.id,
    generated_days: generatedDays,
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

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
