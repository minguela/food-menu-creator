type SupabaseAdmin = {
  from: (table: string) => any;
};

type LogLevel = "debug" | "info" | "warn" | "error";

type ProgressUpdate = {
  progress?: number;
  currentStep?: string;
  status?: "pending" | "processing" | "completed" | "failed";
  errorMessage?: string | null;
  resultMenuId?: string | null;
  resultPayload?: Record<string, unknown> | null;
  startedAt?: string;
  completedAt?: string;
};

type LogOptions = {
  level?: LogLevel;
  step: string;
  message: string;
  status?: string;
  metadata?: Record<string, unknown>;
  progress?: ProgressUpdate;
};

export const sanitizeGenerationMetadata = (value: unknown): unknown => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitizeGenerationMetadata(item));
  }
  if (!value || typeof value !== "object") {
    return value;
  }

  const unsafeKeys = new Set([
    "authorization",
    "apikey",
    "api_key",
    "token",
    "service_role",
    "password",
    "secret",
  ]);
  const record = value as Record<string, unknown>;
  const entries = Object.entries(record).slice(0, 80);
  return Object.fromEntries(
    entries.map(([key, item]) => [
      key,
      unsafeKeys.has(key.toLowerCase())
        ? "[redacted]"
        : sanitizeGenerationMetadata(item),
    ]),
  );
};

export const createMenuGenerationLogger = ({
  supabase,
  jobId,
}: {
  supabase: SupabaseAdmin;
  jobId?: string | null;
}) => {
  const updateJob = async (update: ProgressUpdate) => {
    if (!jobId) return;
    const patch: Record<string, unknown> = {
      heartbeat_at: new Date().toISOString(),
    };
    if (update.status) patch.status = update.status;
    if (typeof update.progress === "number") {
      patch.progress = Math.max(0, Math.min(100, Math.round(update.progress)));
    }
    if (update.currentStep !== undefined) patch.current_step = update.currentStep;
    if (update.errorMessage !== undefined) patch.error_message = update.errorMessage;
    if (update.resultMenuId !== undefined) patch.result_menu_id = update.resultMenuId;
    if (update.resultPayload !== undefined) patch.result_payload = update.resultPayload;
    if (update.startedAt !== undefined) patch.started_at = update.startedAt;
    if (update.completedAt !== undefined) patch.completed_at = update.completedAt;

    const { error } = await supabase
      .from("menu_generation_jobs")
      .update(patch)
      .eq("id", jobId);
    if (error) {
      console.error("menu_generation_jobs update failed", error);
    }
  };

  const log = async ({
    level = "info",
    step,
    message,
    status = "running",
    metadata = {},
    progress,
  }: LogOptions) => {
    if (!jobId) {
      console.log(`[menu-generation:${level}] ${step} ${status} ${message}`, metadata);
      return;
    }

    await updateJob({
      currentStep: step,
      progress: progress?.progress,
      status: progress?.status,
      errorMessage: progress?.errorMessage,
      resultMenuId: progress?.resultMenuId,
      resultPayload: progress?.resultPayload,
      startedAt: progress?.startedAt,
      completedAt: progress?.completedAt,
    });

    const { error } = await supabase.from("menu_generation_logs").insert({
      job_id: jobId,
      level,
      step,
      message,
      metadata: {
        status,
        timestamp: new Date().toISOString(),
        ...((sanitizeGenerationMetadata(metadata) as Record<string, unknown>) || {}),
      },
    });
    if (error) {
      console.error("menu_generation_logs insert failed", error);
    }
  };

  return { log, updateJob };
};
