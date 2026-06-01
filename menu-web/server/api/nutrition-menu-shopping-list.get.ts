import { buildNutritionMenuShoppingList } from "~~/server/services/menuGeneratorPersistence";
import { createSupabaseAdminClient } from "~~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const userId = String(query.userId || "").trim();
  const menuId = String(query.menuId || query.id || "").trim();

  if (!userId || !menuId) {
    throw createError({
      statusCode: 400,
      statusMessage: "userId y menuId son obligatorios",
    });
  }

  const supabase = createSupabaseAdminClient(useRuntimeConfig(event));
  const result = await buildNutritionMenuShoppingList({ supabase, userId, menuId });

  return { success: true, ...result };
});
