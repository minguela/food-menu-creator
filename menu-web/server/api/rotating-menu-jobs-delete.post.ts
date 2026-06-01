import { createSupabaseAdminClient } from "~~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as {
    userId?: string;
    jobId?: string;
  };
  const userId = String(body?.userId || "").trim();
  const jobId = String(body?.jobId || "").trim();
  if (!userId || !jobId) {
    throw createError({
      statusCode: 400,
      statusMessage: "userId y jobId son obligatorios",
    });
  }

  const config = useRuntimeConfig(event);
  const supabase = createSupabaseAdminClient(config);
  const { error } = await supabase
    .from("menu_generation_jobs")
    .delete()
    .eq("id", jobId)
    .eq("user_id", userId);

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return { success: true };
});
