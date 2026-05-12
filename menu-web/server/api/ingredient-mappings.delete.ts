import { createSupabaseAdminClient } from "~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const id = String(body.id || "").trim();
  const userId = String(body.userId || "").trim();

  if (!id || !userId) {
    throw createError({
      statusCode: 400,
      statusMessage: "id y userId son obligatorios",
    });
  }

  const config = useRuntimeConfig(event);
  const supabase = createSupabaseAdminClient(config);

  const { error } = await supabase
    .from("ingredient_mappings")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error eliminando expansión: ${error.message}`,
    });
  }

  return { success: true };
});