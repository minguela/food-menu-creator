import { createSupabaseAdminClient } from "~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const userId = String(query.userId || "").trim();

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: "userId es obligatorio",
    });
  }

  const config = useRuntimeConfig(event);
  const supabase = createSupabaseAdminClient(config);

  const { data: mappings, error } = await supabase
    .from("ingredient_mappings")
    .select("id, dish_name, aliases, ingredients, is_global, created_at, updated_at")
    .or(`user_id.eq.${userId},is_global.eq.true`)
    .order("is_global", { ascending: false })
    .order("dish_name", { ascending: true });

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error cargando expansiones: ${error.message}`,
    });
  }

  return {
    success: true,
    mappings: mappings || [],
  };
});