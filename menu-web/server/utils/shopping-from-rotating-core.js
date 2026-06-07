const DENSITY_BY_KEYWORD = [
  { match: /aceite|oil/i, gramsPerMl: 0.92 },
  { match: /miel|honey/i, gramsPerMl: 1.42 },
  { match: /leche|milk|caldo|zumo|agua|vinagre|salsa/i, gramsPerMl: 1 },
  { match: /yogur|nata|crema/i, gramsPerMl: 1.03 },
];

const PIECE_WEIGHTS = [
  { match: /huevo/i, grams: 60 },
  { match: /cebolla/i, grams: 150 },
  { match: /ajo/i, grams: 5 },
  { match: /tomate/i, grams: 125 },
  { match: /pimiento/i, grams: 160 },
  { match: /zanahoria/i, grams: 75 },
  { match: /lechuga/i, grams: 300 },
  { match: /pan/i, grams: 250 },
  { match: /yogur/i, grams: 125 },
  { match: /fruta|manzana|pera|naranja/i, grams: 180 },
];

const TABLESPOON_ML = 15;
const TEASPOON_ML = 5;

function convertToGrams({ name = "", quantity = 0, unitType = "g" }) {
  const amount = Number(quantity) || 0;
  const unit = String(unitType || "g").trim().toLowerCase();

  if (amount <= 0) return { grams: 1, status: "ambiguous" };
  if (unit === "g") return gramsResult(amount, "exact");
  if (unit === "kg") return gramsResult(amount * 1000, "exact");

  if (unit === "ml" || unit === "l") {
    const density = densityFor(name);
    const ml = unit === "l" ? amount * 1000 : amount;
    return gramsResult(ml * density.gramsPerMl, density.known ? "estimated" : "ambiguous");
  }

  if (unit === "cucharada" || unit === "tbsp") {
    const density = densityFor(name);
    return gramsResult(
      amount * TABLESPOON_ML * density.gramsPerMl,
      density.known ? "estimated" : "ambiguous",
    );
  }

  if (unit === "cucharadita" || unit === "tsp") {
    const density = densityFor(name);
    return gramsResult(
      amount * TEASPOON_ML * density.gramsPerMl,
      density.known ? "estimated" : "ambiguous",
    );
  }

  if (unit === "ud" || unit === "unidad" || unit === "pieza" || unit === "pack") {
    return gramsResult(amount * (pieceWeightFor(name) || 100), "estimated");
  }

  return gramsResult(amount, "ambiguous");
}

function densityFor(name) {
  const found = DENSITY_BY_KEYWORD.find((entry) => entry.match.test(name));
  return found
    ? { known: true, gramsPerMl: found.gramsPerMl }
    : { known: false, gramsPerMl: 1 };
}

function pieceWeightFor(name) {
  return PIECE_WEIGHTS.find((entry) => entry.match.test(name))?.grams || null;
}

function gramsResult(grams, status) {
  return {
    grams: Math.max(1, Math.round((Number(grams) || 0) * 10) / 10),
    status,
  };
}

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
      const ingredientId = ingredient.ingredient_id || null;
      const key = `${ingredientId || String(ingredient.name || "").toLowerCase()}::${String(
        ingredient.unit_type || "",
      ).toLowerCase()}`;
      if (!consolidated[key]) {
        consolidated[key] = {
          ingredient_id: ingredientId,
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
    ingredient_id: item.ingredient_id || null,
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
    const { error } = await supabase.from("shopping_lists").upsert(rowsWithOwner, {
      ignoreDuplicates: true,
      onConflict: "user_id,week_start,ingredient_id",
    });
    if (error) throw error;
  }

  return { inserted: rowsWithOwner.length };
};
