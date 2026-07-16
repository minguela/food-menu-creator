// Client-side error logger — uses server API instead of Supabase REST
type ErrorSource = "web" | "telegram" | "ocr";

type LogErrorOptions = {
  context?: string;
  extra?: Record<string, any>;
};

function extractErrorPayload(err: unknown) {
  if (err instanceof Error) {
    return { message: err.message, stack_trace: err.stack || null };
  }
  if (typeof err === "string") {
    return { message: err, stack_trace: null };
  }
  try {
    return { message: JSON.stringify(err), stack_trace: null };
  } catch {
    return { message: "Unknown error", stack_trace: null };
  }
}

export async function logError(
  source: ErrorSource,
  err: unknown,
  options: LogErrorOptions = {},
) {
  try {
    const payload = extractErrorPayload(err);
    const message = options.context
      ? `[${options.context}] ${payload.message}`
      : payload.message;

    await $fetch("/api/db/rpc/insert_error_log", {
      method: "POST",
      body: {
        p_source: source,
        p_message: message,
        p_stack_trace: payload.stack_trace,
      },
    });
  } catch (logErr) {
    console.error("No se pudo persistir error log:", logErr);
  }
}
