import { createSupabaseAdminClient } from "~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const id = String(body.id || "").trim();
  const userId = String(body.userId || "").trim();
  const dishName = String(body.dishName || "").trim();
  const aliases = body.aliases || [];
  const ingredients = body.ingredients || [];
  const isGlobal = Boolean(body.isGlobal);

  if (!id || !userId || !dishName || ingredients.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "id, userId, dishName e ingredients son obligatorios",
    });
  }

  const config = useRuntimeConfig(event);
  const supabase = createSupabaseAdminClient(config);

  const { data: mapping, error } = await supabase
    .from("ingredient_mappings")
    .update({
      dish_name: dishName,
      aliases: aliases,
      ingredients: ingredients,
      is_global: isGlobal,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error actualizando expansión: ${error.message}`,
    });
  }

  return {
    success: true,
    mapping,
  };
});