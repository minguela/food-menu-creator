import { createSupabaseAdminClient } from "~/server/utils/supabase-admin";

type CreateJobPayload = {
  userId: string;
  name: string;
  durationDays: number;
  startDate: string;
  sourceWeeklyMenuIds: string[];
  profileIds: string[];
  includeGlobalProfile: boolean;
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

  const config = useRuntimeConfig(event);
  const supabase = createSupabaseAdminClient(config);

  const { data: existingRunning } = await supabase
    .from("menu_generation_jobs")
    .select("id,status,created_at")
    .eq("user_id", userId)
    .in("status", ["pending", "processing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingRunning?.id) {
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
    includeGlobalProfile: Boolean(body?.includeGlobalProfile),
  };

  const { data: createdJob, error: createErrorJob } = await supabase
    .from("menu_generation_jobs")
    .insert({
      user_id: userId,
      status: "pending",
      progress: 0,
      input_payload: inputPayload,
    })
    .select("id,user_id,status,progress,created_at")
    .single();

  if (createErrorJob || !createdJob) {
    throw createError({
      statusCode: 500,
      statusMessage: createErrorJob?.message || "No se pudo crear el job",
    });
  }

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

