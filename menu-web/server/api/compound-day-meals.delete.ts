import { createSupabaseAdminClient } from "~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const compoundDayId = body.id;
  const userId = body.userId;

  if (!compoundDayId || !userId) {
    throw createError({
      statusCode: 400,
      statusMessage: "id y userId son obligatorios",
    });
  }

  const config = useRuntimeConfig(event);
  const supabase = createSupabaseAdminClient(config);

  const { error } = await supabase
    .from("compound_day_meals")
    .delete()
    .eq("id", compoundDayId)
    .eq("user_id", userId);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error eliminando día compuesto: ${error.message}`,
    });
  }

  return {
    success: true,
  };
});