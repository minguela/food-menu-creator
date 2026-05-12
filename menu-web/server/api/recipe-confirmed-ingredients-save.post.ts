import { createSupabaseAdminClient } from "~/server/utils/supabase-admin";

type SaveRowInput = {
  id?: string;
  name?: string;
  unit_type?: string;
};

type SavePayload = {
  dishId?: string;
  rows?: SaveRowInput[];
};

const normalizeIngredientName = (name: string) =>
  String(name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export default defineEventHandler(async (event) => {
  const body = await readBody<SavePayload>(event);
  const dishId = String(body?.dishId || "").trim();
  const inputRows = Array.isArray(body?.rows) ? body.rows : [];

  if (!dishId) {
    throw createError({ statusCode: 400, statusMessage: "dishId requerido" });
  }
  if (inputRows.length === 0) {
    return { success: true, savedRows: [] };
  }

  const rows = inputRows
    .map((row) => {
      const name = String(row?.name || "").trim();
      const normalized = normalizeIngredientName(name);
      const unit = String(row?.unit_type || "g").trim() || "g";
      return {
        id: String(row?.id || ""),
        isDraft: String(row?.id || "").startsWith("draft-"),
        name,
        normalized_name: normalized,
        unit_type: unit,
      };
    })
    .filter((row) => row.name && row.normalized_name);

  if (rows.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "No hay ingredientes válidos para guardar",
    });
  }

  const dedupedRows = Array.from(
    new Map(rows.map((row) => [row.normalized_name, row])).values(),
  );

  const config = useRuntimeConfig(event);
  const supabase = createSupabaseAdminClient(config);

  const normalizedNames = dedupedRows.map((row) => row.normalized_name);

  const { data: existingIngredients, error: existingIngredientsError } = await supabase
    .from("ingredients")
    .select("id,name,normalized_name")
    .in("normalized_name", normalizedNames);
  if (existingIngredientsError) {
    throw createError({ statusCode: 500, statusMessage: existingIngredientsError.message });
  }

  const names = dedupedRows.map((row) => row.name);
  const { data: existingByName, error: existingByNameError } = await supabase
    .from("ingredients")
    .select("id,name,normalized_name")
    .in("name", names);
  if (existingByNameError) {
    throw createError({ statusCode: 500, statusMessage: existingByNameError.message });
  }

  const ingredientByNormalized = new Map<string, any>();
  const ingredientByNameLower = new Map<string, any>();

  for (const row of existingIngredients || []) {
    ingredientByNormalized.set(String(row.normalized_name), row);
    ingredientByNameLower.set(String(row.name).toLowerCase(), row);
  }
  for (const row of existingByName || []) {
    const normalized = normalizeIngredientName(row.name);
    ingredientByNormalized.set(normalized, row);
    ingredientByNameLower.set(String(row.name).toLowerCase(), row);
  }

  const missingIngredients = dedupedRows
    .filter((row) => {
      const byNormalized = ingredientByNormalized.get(row.normalized_name);
      const byName = ingredientByNameLower.get(row.name.toLowerCase());
      return !byNormalized && !byName;
    })
    .map((row) => ({
      name: row.name,
      normalized_name: row.normalized_name,
      default_unit_type: row.unit_type,
      unit_type: row.unit_type,
      source: "manual",
      is_verified: false,
    }));

  if (missingIngredients.length > 0) {
    const { error: insertIngredientsError } = await supabase
      .from("ingredients")
      .upsert(missingIngredients, { onConflict: "normalized_name" });
    if (insertIngredientsError) {
      throw createError({ statusCode: 500, statusMessage: insertIngredientsError.message });
    }

    const { data: refreshedIngredients, error: refreshedIngredientsError } = await supabase
      .from("ingredients")
      .select("id,name,normalized_name")
      .in("normalized_name", normalizedNames);
    if (refreshedIngredientsError) {
      throw createError({ statusCode: 500, statusMessage: refreshedIngredientsError.message });
    }
    for (const item of refreshedIngredients || []) {
      ingredientByNormalized.set(String(item.normalized_name), item);
    }
  }

  const existingIds = dedupedRows
    .filter((row) => !row.isDraft && row.id)
    .map((row) => row.id);
  const { data: existingRecipeRows, error: existingRecipeRowsError } = existingIds.length
    ? await supabase
        .from("recipe_ingredients")
        .select("id,normalized_name")
        .in("id", existingIds)
    : { data: [], error: null };
  if (existingRecipeRowsError) {
    throw createError({ statusCode: 500, statusMessage: existingRecipeRowsError.message });
  }
  const existingRecipeRowById = new Map(
    (existingRecipeRows || []).map((row: any) => [String(row.id), row]),
  );

  const rowsToDelete: string[] = [];
  for (const row of dedupedRows) {
    if (row.isDraft || !row.id) continue;
    const current = existingRecipeRowById.get(row.id);
    if (current && String(current.normalized_name || "") !== row.normalized_name) {
      rowsToDelete.push(row.id);
    }
  }
  if (rowsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("recipe_ingredients")
      .delete()
      .in("id", rowsToDelete);
    if (deleteError) {
      throw createError({ statusCode: 500, statusMessage: deleteError.message });
    }
  }

  const payloads = dedupedRows.map((row) => {
    const ingredient = ingredientByNormalized.get(row.normalized_name)
      || ingredientByNameLower.get(row.name.toLowerCase());
    return {
      recipe_id: dishId,
      ingredient_id: ingredient?.id || null,
      name: ingredient?.name || row.name,
      normalized_name: row.normalized_name,
      quantity: 1,
      unit_type: row.unit_type,
      is_confirmed: true,
      is_suggested: false,
      needs_review: false,
    };
  });

  const { error: saveRowsError } = await supabase
    .from("recipe_ingredients")
    .upsert(payloads, { onConflict: "recipe_id,normalized_name" });
  if (saveRowsError) {
    throw createError({ statusCode: 500, statusMessage: saveRowsError.message });
  }

  const { data: savedRows, error: savedRowsError } = await supabase
    .from("recipe_ingredients")
    .select("*")
    .eq("recipe_id", dishId)
    .in(
      "normalized_name",
      payloads.map((row) => row.normalized_name),
    );
  if (savedRowsError) {
    throw createError({ statusCode: 500, statusMessage: savedRowsError.message });
  }

  return {
    success: true,
    savedRows: savedRows || [],
    createdIngredients: missingIngredients.length,
    savedRecipeIngredients: payloads.length,
  };
});
