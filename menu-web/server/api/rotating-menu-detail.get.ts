import { createSupabaseAdminClient } from "~/server/utils/supabase-admin";
import { buildShoppingListFromRotatingMenu } from "~/server/utils/shopping-from-rotating";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const userId = String(query.userId || "").trim();
  const rotatingMenuId = String(query.rotatingMenuId || query.id || "").trim();

  if (!userId || !rotatingMenuId) {
    throw createError({
      statusCode: 400,
      statusMessage: "userId y rotatingMenuId son obligatorios",
    });
  }

  const config = useRuntimeConfig(event);
  const supabase = createSupabaseAdminClient(config);
  const debug: Record<string, unknown> = {
    requested_user_id: userId,
    requested_rotating_menu_id: rotatingMenuId,
    started_at: new Date().toISOString(),
  };

  const { data: menu, error: menuError } = await supabase
    .from("rotating_menus")
    .select("*")
    .eq("id", rotatingMenuId)
    .eq("user_id", userId)
    .maybeSingle();

  if (menuError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error cargando menú rotativo: ${menuError.message}`,
      data: { debug: { ...debug, menu_error: menuError } },
    });
  }
  if (!menu) {
    throw createError({
      statusCode: 404,
      statusMessage: "Menú rotativo no encontrado para este usuario.",
      data: { debug: { ...debug, menu_found: false } },
    });
  }

  const { data: jobRows, error: jobsError } = await supabase
    .from("menu_generation_jobs")
    .select("id,status,progress,current_step,error_message,result_menu_id,created_at,completed_at")
    .eq("user_id", userId)
    .eq("result_menu_id", rotatingMenuId)
    .order("created_at", { ascending: false })
    .limit(1);

  const { data: menuProfiles, error: profilesError } = await supabase
    .from("rotating_menu_profiles")
    .select("*")
    .eq("rotating_menu_id", rotatingMenuId)
    .order("created_at", { ascending: true });

  const { data: days, error: daysError } = await supabase
    .from("rotating_menu_days")
    .select("*")
    .eq("rotating_menu_id", rotatingMenuId)
    .order("day_number", { ascending: true });

  if (jobsError || profilesError || daysError) {
    throw createError({
      statusCode: 500,
      statusMessage:
        jobsError?.message ||
        profilesError?.message ||
        daysError?.message ||
        "Error cargando cabecera del menú rotativo.",
      data: {
        debug: {
          ...debug,
          jobs_error: jobsError,
          profiles_error: profilesError,
          days_error: daysError,
        },
      },
    });
  }

  const sourceWeeklyMenuIds = Array.from(
    new Set(
      (days || [])
        .map((day: any) => day.source_weekly_menu_id)
        .filter(Boolean),
    ),
  );
  const { data: sourceMenus, error: sourceMenusError } = sourceWeeklyMenuIds.length
    ? await supabase
        .from("weekly_menus")
        .select("id, name")
        .in("id", sourceWeeklyMenuIds)
    : { data: [] as any[], error: null };
  if (sourceMenusError) {
    console.warn("Error cargando nombres de menús semanales:", sourceMenusError.message);
  }
  const weeklyMenuNameById = new Map(
    (sourceMenus || []).map((menu: any) => [String(menu.id), menu.name || "Menú semanal"]),
  );

  const dayIds = (days || []).map((day: any) => day.id);
  const { data: meals, error: mealsError } = dayIds.length
    ? await supabase
        .from("rotating_menu_meals")
        .select("*")
        .in("rotating_menu_day_id", dayIds)
        .order("meal_type", { ascending: true })
        .order("meal_slot", { ascending: true })
    : { data: [] as any[], error: null };

  if (mealsError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error cargando comidas del menú: ${mealsError.message}`,
      data: { debug: { ...debug, meals_error: mealsError, day_ids: dayIds } },
    });
  }

  const mealIds = (meals || []).map((meal: any) => meal.id);
  const { data: portions, error: portionsError } = mealIds.length
    ? await supabase
        .from("rotating_menu_meal_profile_portions")
        .select("*")
        .in("rotating_menu_meal_id", mealIds)
    : { data: [] as any[], error: null };

  if (portionsError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error cargando cantidades por perfil: ${portionsError.message}`,
      data: {
        debug: { ...debug, portions_error: portionsError, meal_ids: mealIds },
      },
    });
  }

  const profileIds = Array.from(
    new Set(
      [...(menuProfiles || []), ...(portions || [])]
        .map((row: any) => row.profile_id)
        .filter(Boolean),
    ),
  );
  const { data: personProfiles, error: personProfilesError } = profileIds.length
    ? await supabase
        .from("person_profiles")
        .select("id,name")
        .in("id", profileIds)
    : { data: [] as any[], error: null };

  if (personProfilesError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error cargando perfiles personales: ${personProfilesError.message}`,
      data: {
        debug: {
          ...debug,
          person_profiles_error: personProfilesError,
          profile_ids: profileIds,
        },
      },
    });
  }
  const profileById = new Map(
    (personProfiles || []).map((profile: any) => [profile.id, profile]),
  );
  const effectiveMenuProfiles =
    (menuProfiles || []).length > 0
      ? menuProfiles || []
      : profileIds.map((profileId) => ({
          profile_id: profileId,
          target_kcal: 0,
          target_protein_g: 0,
          target_carbs_g: 0,
          target_fat_g: 0,
        }));

  const portionIds = (portions || []).map((portion: any) => portion.id);
  const { data: ingredients, error: ingredientsError } = portionIds.length
    ? await supabase
        .from("rotating_menu_meal_profile_ingredients")
        .select("*")
        .in("rotating_menu_meal_profile_portion_id", portionIds)
        .order("name", { ascending: true })
    : { data: [] as any[], error: null };

  if (ingredientsError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error cargando ingredientes calculados: ${ingredientsError.message}`,
      data: {
        debug: {
          ...debug,
          ingredients_error: ingredientsError,
          portion_ids: portionIds,
        },
      },
    });
  }

  const shoppingBuild = await buildShoppingListFromRotatingMenu({
    supabase,
    userId,
    rotatingMenuId,
  });

  const { data: shoppingItems, error: shoppingError } = await supabase
    .from("shopping_lists")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", new Date().toISOString().split("T")[0])
    .order("item_name", { ascending: true });

  if (shoppingError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error cargando lista de la compra: ${shoppingError.message}`,
      data: { debug: { ...debug, shopping_error: shoppingError } },
    });
  }

  const ingredientsByPortion = groupBy(
    ingredients || [],
    "rotating_menu_meal_profile_portion_id",
  );
  const portionsByMeal = groupBy(portions || [], "rotating_menu_meal_id");
  const mealsByDay = groupBy(meals || [], "rotating_menu_day_id");

  const assembledDays = (days || []).map((day: any) => {
    const dayMeals = (mealsByDay.get(day.id) || [])
      .sort(
        (a: any, b: any) =>
          mealOrder(a.meal_type) - mealOrder(b.meal_type) ||
          normalizeMealSlot(a.meal_slot) - normalizeMealSlot(b.meal_slot),
      )
      .map((meal: any) => {
        const profilePortions = (portionsByMeal.get(meal.id) || []).map(
          (portion: any) => ({
            ...portion,
            profile_name:
              profileById.get(portion.profile_id)?.name ||
              "Perfil",
            ingredients:
              meal.is_special
                ? []
                : ingredientsByPortion.get(portion.id) || [],
          }),
        );
        return { ...meal, profile_portions: profilePortions };
      });
    return {
      ...day,
      source_weekly_menu_name: weeklyMenuNameById.get(String(day.source_weekly_menu_id || "")) || null,
      meals: dayMeals,
      profile_totals: buildProfileTotals(dayMeals, effectiveMenuProfiles, profileById),
    };
  });

  const detailDebug = {
    ...debug,
    menu_found: true,
    result_job_found: Boolean(jobRows?.[0]),
    result_job_id: jobRows?.[0]?.id || null,
    result_menu_id_matches: jobRows?.[0]
      ? jobRows[0].result_menu_id === rotatingMenuId
      : null,
    profiles_count: effectiveMenuProfiles.length,
    person_profiles_count: personProfiles?.length || 0,
    days_count: days?.length || 0,
    meals_count: meals?.length || 0,
    portions_count: portions?.length || 0,
    ingredients_count: ingredients?.length || 0,
    shopping_items_count: shoppingItems?.length || 0,
    shopping_inserted: shoppingBuild.inserted,
    shopping_skipped_special_meals: shoppingBuild.skippedSpecialMeals,
    empty_relations: {
      days: (days || []).length === 0,
      meals: (meals || []).length === 0,
      portions: (portions || []).length === 0,
    },
    completed_at: new Date().toISOString(),
  };

  console.log("rotating-menu-detail", detailDebug);

  return {
    success: true,
    menu,
    job: jobRows?.[0] || null,
    profiles: effectiveMenuProfiles.map((profile: any) => ({
      ...profile,
      profile_name: profileById.get(profile.profile_id)?.name || "Perfil",
    })),
    days: assembledDays,
    source_weekly_menu_names: Object.fromEntries(weeklyMenuNameById),
    shopping_items: shoppingItems || [],
    debug: detailDebug,
  };
});

function groupBy(rows: any[], key: string) {
  const map = new Map<string, any[]>();
  for (const row of rows) {
    const value = String(row[key] || "");
    if (!map.has(value)) map.set(value, []);
    map.get(value)?.push(row);
  }
  return map;
}

function mealOrder(type: string) {
  if (type === "desayuno") return 1;
  if (type === "comida") return 2;
  if (type === "cena") return 3;
  return 4;
}

function normalizeMealSlot(value: unknown) {
  const slot = Number(value || 1);
  return Number.isFinite(slot) && slot > 0 ? Math.round(slot) : 1;
}

function buildProfileTotals(
  meals: any[],
  menuProfiles: any[],
  profileById: Map<string, any>,
) {
  return (menuProfiles || []).map((profile: any) => {
    const portions = meals.flatMap((meal) =>
      (meal.profile_portions || []).filter(
        (portion: any) => portion.profile_id === profile.profile_id,
      ),
    );
    const totals = portions.reduce(
      (acc: any, portion: any) => {
        acc.kcal += Number(portion.final_kcal || 0);
        acc.protein += Number(portion.final_protein_g || 0);
        acc.carbs += Number(portion.final_carbs_g || 0);
        acc.fat += Number(portion.final_fat_g || 0);
        return acc;
      },
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    );
    const specialKcal = meals
      .filter((meal) => meal.is_special)
      .reduce(
        (acc, meal) => acc + Number(meal.special_kcal_reserved ?? 0),
        0,
      );
    return {
      profile_id: profile.profile_id,
      profile_name: profileById.get(profile.profile_id)?.name || "Perfil",
      target_kcal: Number(profile.target_kcal || 0),
      target_protein_g: Number(profile.target_protein_g || 0),
      target_carbs_g: Number(profile.target_carbs_g || 0),
      target_fat_g: Number(profile.target_fat_g || 0),
      total_kcal: Math.round(totals.kcal),
      total_protein_g: round(totals.protein),
      total_carbs_g: round(totals.carbs),
      total_fat_g: round(totals.fat),
      special_kcal_reserved: specialKcal,
      regular_kcal: Math.max(0, Math.round(totals.kcal - specialKcal)),
      kcal_delta: Math.round(totals.kcal - Number(profile.target_kcal || 0)),
      protein_delta_g: round(totals.protein - Number(profile.target_protein_g || 0)),
      carbs_delta_g: round(totals.carbs - Number(profile.target_carbs_g || 0)),
      fat_delta_g: round(totals.fat - Number(profile.target_fat_g || 0)),
    };
  });
}

function round(value: number) {
  return Math.round((Number(value) || 0) * 10) / 10;
}
