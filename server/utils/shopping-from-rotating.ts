import { convertToGrams } from "~/utils/shopping-conversions.js";

type SupabaseAdmin = {
  from: (table: string) => any;
};

type BuildShoppingParams = {
  supabase: SupabaseAdmin;
  userId: string;
  rotatingMenuId: string;
  weekStart?: string;
};

export const buildShoppingListFromRotatingMenu = async ({
  supabase,
  userId,
  rotatingMenuId,
  weekStart = new Date().toISOString().split("T")[0],
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
    .select("id")
    .in("rotating_menu_day_id", dayIds);

  const mealIds = (mealRows || []).map((row: any) => row.id);
  if (mealIds.length === 0) {
    return { inserted: 0 };
  }

  const { data: portionRows } = await supabase
    .from("rotating_menu_meal_profile_portions")
    .select("rotating_menu_meal_profile_ingredients(*)")
    .in("rotating_menu_meal_id", mealIds);

  const consolidated: Record<
    string,
    {
      item_name: string;
      quantity_grams: number;
      conversion_status: string;
      conversion_note: string;
    }
  > = {};

  for (const portion of portionRows || []) {
    for (const ingredient of portion.rotating_menu_meal_profile_ingredients ||
      []) {
      const conversion = convertToGrams({
        name: ingredient.name,
        quantity: ingredient.final_quantity,
        unitType: ingredient.unit_type,
      });
      const key = `${String(ingredient.name || "").toLowerCase()}::${String(
        ingredient.unit_type || "",
      ).toLowerCase()}`;
      if (!consolidated[key]) {
        consolidated[key] = {
          item_name: ingredient.name,
          quantity_grams: 0,
          conversion_status: conversion.status,
          conversion_note: conversion.note,
        };
      }
      consolidated[key].quantity_grams += conversion.grams;
    }
  }

  await supabase
    .from("shopping_lists")
    .delete()
    .eq("user_id", userId)
    .eq("week_start", weekStart);

  const rows = Object.values(consolidated).map((item) => ({
    user_id: userId,
    week_start: weekStart,
    item_name: item.item_name,
    quantity_needed: Math.round(item.quantity_grams),
    quantity_grams: Math.round(item.quantity_grams),
    original_quantity: Math.round(item.quantity_grams),
    original_unit_type: "g",
    conversion_status: item.conversion_status,
    conversion_note: item.conversion_note || "Generado desde menú rotativo",
    is_extra: true,
    purchased: false,
    estimated_price: 0,
  }));

  if (rows.length > 0) {
    const { error } = await supabase.from("shopping_lists").insert(rows);
    if (error) throw error;
  }

  return { inserted: rows.length };
};

