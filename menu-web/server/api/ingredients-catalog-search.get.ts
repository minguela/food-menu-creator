import { createSupabaseAdminClient } from "~~/server/utils/supabase-admin";
import { normalizeIngredientName } from "~/utils/ingredient-normalize";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const rawQuery = String(query.query || "").trim();
  const normalizedQuery = normalizeIngredientName(rawQuery);
  const limit = Math.min(25, Math.max(1, Number(query.limit || 8) || 8));

  if (normalizedQuery.length < 2) {
    return { success: true, ingredients: [] };
  }

  const config = useRuntimeConfig(event);
  const supabase = createSupabaseAdminClient(config);

  const ilikePattern = `%${normalizedQuery}%`;
  const { data, error } = await supabase
    .from("ingredients")
    .select("id,name,normalized_name,default_unit_type,unit_type")
    .or(`normalized_name.ilike.${ilikePattern},name.ilike.%${rawQuery}%`)
    .order("name", { ascending: true })
    .limit(limit);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error buscando ingredientes: ${error.message}`,
    });
  }

  return {
    success: true,
    ingredients: data || [],
  };
});
