import {
  consolidateShoppingRowsFromPortions,
  persistShoppingListRows,
} from "./shopping-from-rotating-core.js";

type SupabaseAdmin = {
  from: (table: string) => any;
};

type BuildShoppingParams = {
  supabase: SupabaseAdmin;
  userId: string;
  rotatingMenuId: string;
  weekStart?: string;
  clearExisting?: boolean;
};

export const buildShoppingListFromRotatingMenu = async ({
  supabase,
  userId,
  rotatingMenuId,
  weekStart = new Date().toISOString().split("T")[0],
  clearExisting = true,
}: BuildShoppingParams) => {
  const { data: dayRows } = await supabase
    .from("rotating_menu_days")
    .select("id")
    .eq("rotating_menu_id", rotatingMenuId);

  const dayIds = (dayRows || []).map((row: any) => row.id);
  if (dayIds.length === 0) {
    return { inserted: 0 };
  }

  const { data: mealRows } = await supabase
    .from("rotating_menu_meals")
    .select("id,is_special")
    .in("rotating_menu_day_id", dayIds);

  const mealIds = (mealRows || [])
    .filter((row: any) => !row.is_special)
    .map((row: any) => row.id);
  const skippedSpecialMeals = (mealRows || []).filter((row: any) =>
    Boolean(row.is_special),
  ).length;
  if (mealIds.length === 0) {
    return { inserted: 0, skippedSpecialMeals };
  }

  const { data: portionRows } = await supabase
    .from("rotating_menu_meal_profile_portions")
    .select("rotating_menu_meal_profile_ingredients(*)")
    .in("rotating_menu_meal_id", mealIds);

  const rows = consolidateShoppingRowsFromPortions(portionRows || []);
  const persistResult = await persistShoppingListRows({
    supabase,
    userId,
    weekStart,
    rows,
    clearExisting,
  });

  return { inserted: persistResult.inserted, skippedSpecialMeals };
};
