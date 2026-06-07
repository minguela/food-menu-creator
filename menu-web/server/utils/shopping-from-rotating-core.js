import { convertToGrams } from "../../app/utils/shopping-conversions.js";

export const consolidateShoppingRowsFromPortions = (portionRows = []) => {
  const consolidated = {};

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

  return Object.values(consolidated).map((item) => ({
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
};

export const persistShoppingListRows = async ({
  supabase,
  userId,
  weekStart,
  rows,
  clearExisting = true,
}) => {
  if (clearExisting) {
    await supabase
      .from("shopping_lists")
      .delete()
      .eq("user_id", userId)
      .eq("week_start", weekStart);
  }

  const rowsWithOwner = rows.map((row) => ({
    user_id: userId,
    week_start: weekStart,
    ...row,
  }));

  if (rowsWithOwner.length > 0) {
    const { error } = await supabase.from("shopping_lists").insert(rowsWithOwner);
    if (error) throw error;
  }

  return { inserted: rowsWithOwner.length };
};
