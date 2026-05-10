import { createSupabaseAdminClient } from "~/server/utils/supabase-admin";
import {
  createMenuGenerationLogger,
  sanitizeGenerationMetadata,
} from "~/server/utils/menu-generation-logger";

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as { jobId?: string };
  const jobId = String(body?.jobId || "").trim();
  if (!jobId) {
    throw createError({ statusCode: 400, statusMessage: "jobId requerido" });
  }

  const config = useRuntimeConfig(event);
  const supabase = createSupabaseAdminClient(config);
  const logger = createMenuGenerationLogger({ supabase, jobId });

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
    await logger.log({
      level: "info",
      step: "job_skip",
      status: "completed",
      message: "El job ya estaba completado; no se reprocesa.",
      metadata: { job_id: jobId },
      progress: { currentStep: "job_skip", progress: 100 },
    });
    return { success: true, skipped: true };
  }

  if (job.status === "processing" && job.heartbeat_at) {
    const heartbeatAgeMs =
      Date.now() - new Date(String(job.heartbeat_at)).getTime();
    if (heartbeatAgeMs < 20 * 60 * 1000) {
      await logger.log({
        level: "warn",
        step: "job_lock",
        status: "completed",
        message: "El job parece estar procesándose en otra ejecución.",
        metadata: { heartbeat_age_ms: heartbeatAgeMs },
        progress: {
          currentStep: "job_lock",
          progress: Number(job.progress || 0),
        },
      });
      return { success: true, skipped: true, reason: "already_processing" };
    }
  }

  const startedAt = new Date().toISOString();
  await logger.log({
    level: "info",
    step: "job_start",
    status: "completed",
    message: "Inicio del job de generación de menú rotativo.",
    metadata: {
      input_summary: {
        duration_days: job.input_payload?.durationDays,
        profile_ids_count: job.input_payload?.profileIds?.length || 0,
        source_menu_ids_count:
          job.input_payload?.sourceWeeklyMenuIds?.length || 0,
        initial_weekly_menu_id: job.input_payload?.initialWeeklyMenuId || null,
        start_date: job.input_payload?.startDate,
      },
    },
    progress: {
      status: "processing",
      progress: 5,
      currentStep: "job_start",
      errorMessage: null,
      startedAt,
    },
  });

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
      body: { ...input, jobId },
    });

    await logger.log({
      level: "info",
      step: "job_completed",
      status: "completed",
      message: "Job finalizado correctamente.",
      metadata: {
        rotating_menu_id: result.rotating_menu_id,
        generated_days_count: result.generated_days?.length || 0,
        profiles_count: result.profiles?.length || 0,
        shopping_list_items: result.shopping_list_items,
      },
      progress: {
        status: "completed",
        progress: 100,
        currentStep: "job_completed",
        resultMenuId: result.rotating_menu_id,
        resultPayload: {
          generated_days: result.generated_days,
          profiles: result.profiles,
          shopping_list_items: result.shopping_list_items,
        },
        completedAt: new Date().toISOString(),
      },
    });

    return { success: true, completed: true };
  } catch (error: any) {
    const errorData = error?.data?.data || error?.data || null;
    const errorMessage =
      error?.data?.message ||
      error?.data?.statusMessage ||
      error?.statusMessage ||
      error?.message ||
      "Error generando menú";
    await logger.log({
      level: "error",
      step: "job_failed",
      status: "failed",
      message: errorMessage,
      metadata: {
        error: sanitizeGenerationMetadata(error),
        error_data: errorData,
        status_code: error?.statusCode || 500,
      },
      progress: {
        status: "failed",
        progress: 100,
        currentStep: "job_failed",
        errorMessage,
        resultPayload: {
          error_data: errorData,
          status_code: error?.statusCode || 500,
        },
        completedAt: new Date().toISOString(),
      },
    });

    throw createError({
      statusCode: 500,
      statusMessage:
        error?.statusMessage || error?.message || "Error procesando job",
    });
  }
});
