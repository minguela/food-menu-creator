import { createSupabaseAdminClient } from "~~/server/utils/supabase-admin";

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

  const { data: compoundDays, error } = await supabase
    .from("compound_day_meals")
    .select(`
      id,
      name,
      user_id,
      created_at,
      updated_at,
      first_dish:dishes!compound_day_meals_first_dish_id_fkey(
        id,
        name,
        description,
        kcal,
        protein_g,
        carbs_g,
        fat_g
      ),
      second_dish:dishes!compound_day_meals_second_dish_id_fkey(
        id,
        name,
        description,
        kcal,
        protein_g,
        carbs_g,
        fat_g
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error cargando días compuestos: ${error.message}`,
    });
  }

  return {
    success: true,
    compoundDays: compoundDays || [],
  };
});