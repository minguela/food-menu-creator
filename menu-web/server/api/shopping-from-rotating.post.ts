import { createSupabaseAdminClient } from "~~/server/utils/supabase-admin";
import { buildShoppingListFromRotatingMenu } from "~~/server/utils/shopping-from-rotating";

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as {
    userId?: string;
    rotatingMenuId?: string;
    weekStart?: string;
    clearExisting?: boolean;
  };
  const userId = String(body?.userId || "").trim();
  const rotatingMenuId = String(body?.rotatingMenuId || "").trim();

  if (!userId || !rotatingMenuId) {
    throw createError({
      statusCode: 400,
      statusMessage: "userId y rotatingMenuId son obligatorios",
    });
  }

  const config = useRuntimeConfig(event);
  const supabase = createSupabaseAdminClient(config);
  const result = await buildShoppingListFromRotatingMenu({
    supabase,
    userId,
    rotatingMenuId,
    weekStart: body?.weekStart,
    clearExisting: body?.clearExisting !== false,
  });

  return {
    success: true,
    inserted: result.inserted,
    skipped_special_meals: result.skippedSpecialMeals,
  };
});
