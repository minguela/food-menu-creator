import { createSupabaseAdminClient } from "~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as {
    userId?: string;
  };
  const userId = String(body?.userId || "").trim();
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: "userId obligatorio" });
  }

  const config = useRuntimeConfig(event);
  const supabase = createSupabaseAdminClient(config);
  const { error } = await supabase
    .from("menu_generation_jobs")
    .delete()
    .eq("user_id", userId)
    .in("status", ["completed", "failed"]);

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return { success: true };
});
