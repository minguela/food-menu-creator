import { createSupabaseAdminClient } from "~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as { jobId?: string };
  const jobId = String(body?.jobId || "").trim();
  if (!jobId) {
    throw createError({ statusCode: 400, statusMessage: "jobId requerido" });
  }

  const config = useRuntimeConfig(event);
  const supabase = createSupabaseAdminClient(config);

  const { data: job, error: jobError } = await supabase
    .from("menu_generation_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    throw createError({
      statusCode: 404,
      statusMessage: jobError?.message || "Job no encontrado",
    });
  }

  if (job.status === "completed") {
    return { success: true, skipped: true };
  }

  await supabase
    .from("menu_generation_jobs")
    .update({
      status: "processing",
      progress: 10,
      started_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", jobId);

  try {
    const input = job.input_payload || {};
    const origin = getRequestURL(event).origin;
    const result = await $fetch<{
      success: boolean;
      rotating_menu_id: string;
      generated_days: any[];
      profiles: any[];
      shopping_list_items: number;
    }>(`${origin}/api/rotating-menu-generate`, {
      method: "POST",
      body: input,
    });

    await supabase
      .from("menu_generation_jobs")
      .update({
        status: "completed",
        progress: 100,
        result_menu_id: result.rotating_menu_id,
        result_payload: {
          generated_days: result.generated_days,
          profiles: result.profiles,
          shopping_list_items: result.shopping_list_items,
        },
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    return { success: true, completed: true };
  } catch (error: any) {
    await supabase
      .from("menu_generation_jobs")
      .update({
        status: "failed",
        progress: 100,
        error_message:
          error?.data?.message ||
          error?.statusMessage ||
          error?.message ||
          "Error generando menú",
        result_payload: {
          error_data: error?.data || null,
          status_code: error?.statusCode || 500,
        },
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    throw createError({
      statusCode: 500,
      statusMessage:
        error?.statusMessage || error?.message || "Error procesando job",
    });
  }
});
