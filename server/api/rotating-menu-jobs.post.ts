import { createSupabaseAdminClient } from "~/server/utils/supabase-admin";
import { createMenuGenerationLogger } from "~/server/utils/menu-generation-logger";

type CreateJobPayload = {
  userId: string;
  name: string;
  durationDays: number;
  startDate: string;
  sourceWeeklyMenuIds: string[];
  profileIds: string[];
  specialMealKcal?: number;
};

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as CreateJobPayload;
  const userId = String(body?.userId || "").trim();
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: "userId requerido" });
  }
  if (!Array.isArray(body?.sourceWeeklyMenuIds) || body.sourceWeeklyMenuIds.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Selecciona al menos un menú fuente",
    });
  }
  if (!Array.isArray(body?.profileIds) || body.profileIds.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Selecciona al menos un perfil",
    });
  }

  const config = useRuntimeConfig(event);
  const supabase = createSupabaseAdminClient(config);

  const { data: existingRunning } = await supabase
    .from("menu_generation_jobs")
    .select("id,status,progress,current_step,created_at")
    .eq("user_id", userId)
    .in("status", ["pending", "processing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingRunning?.id) {
    const logger = createMenuGenerationLogger({
      supabase,
      jobId: existingRunning.id,
    });
    await logger.log({
      level: "info",
      step: "job_deduplicated",
      status: "completed",
      message: "Ya existe un job activo para este usuario; se reutiliza.",
      metadata: { user_id: userId, existing_job_id: existingRunning.id },
      progress: {
        currentStep: "job_deduplicated",
        progress: Number(existingRunning.progress || 0),
      },
    });
    const origin = getRequestURL(event).origin;
    fetch(`${origin}/api/rotating-menu-jobs-process`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: existingRunning.id }),
    }).catch(() => {});

    return {
      success: true,
      job: existingRunning,
      deduplicated: true,
    };
  }

  const inputPayload = {
    userId,
    name: String(body?.name || "").trim() || "Menú rotativo",
    durationDays: Math.min(90, Math.max(1, Number(body?.durationDays) || 7)),
    startDate: String(body?.startDate || "").trim(),
    sourceWeeklyMenuIds: body.sourceWeeklyMenuIds || [],
    profileIds: Array.isArray(body?.profileIds) ? body.profileIds : [],
    specialMealKcal: Math.max(
      0,
      Math.min(2000, Number(body?.specialMealKcal) || 700),
    ),
  };

  const { data: createdJob, error: createErrorJob } = await supabase
    .from("menu_generation_jobs")
    .insert({
      user_id: userId,
      status: "pending",
      progress: 0,
      current_step: "job_created",
      heartbeat_at: new Date().toISOString(),
      input_payload: inputPayload,
    })
    .select("id,user_id,status,progress,current_step,created_at")
    .single();

  if (createErrorJob || !createdJob) {
    throw createError({
      statusCode: 500,
      statusMessage: createErrorJob?.message || "No se pudo crear el job",
    });
  }

  const logger = createMenuGenerationLogger({
    supabase,
    jobId: createdJob.id,
  });
  await logger.log({
    level: "info",
    step: "job_created",
    status: "completed",
    message: "Job de generación creado y encolado.",
    metadata: {
      user_id: userId,
      duration_days: inputPayload.durationDays,
      profiles_count: inputPayload.profileIds.length,
      source_menus_count: inputPayload.sourceWeeklyMenuIds.length,
      start_date: inputPayload.startDate,
    },
    progress: { currentStep: "job_created", progress: 0, status: "pending" },
  });

  const origin = getRequestURL(event).origin;
  fetch(`${origin}/api/rotating-menu-jobs-process`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobId: createdJob.id }),
  }).catch(() => {});

  return {
    success: true,
    job: createdJob,
    deduplicated: false,
  };
});
