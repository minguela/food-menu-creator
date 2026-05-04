import { resolveSupabaseServerKey } from "~/utils/enrich-runtime";

type SearchSource = "usda" | "open_food_facts" | "bedca";

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as {
    query?: string;
    source?: SearchSource;
  };

  const query = String(body?.query || "").trim();
  const source = (String(body?.source || "usda").trim().toLowerCase() ||
    "usda") as SearchSource;

  if (!query) {
    throw createError({
      statusCode: 400,
      statusMessage: "query es obligatorio",
    });
  }

  const config = useRuntimeConfig(event);
  const supabaseKey = resolveSupabaseServerKey({
    runtimeServiceKey: config.supabaseServiceKey,
    envServiceRole: process.env.SUPABASE_SERVICE_ROLE_KEY,
    envNuxtServiceKey: process.env.NUXT_SUPABASE_SERVICE_KEY,
    envSupabaseKey: process.env.SUPABASE_KEY,
    envAnonKey: process.env.SUPABASE_ANON_KEY,
    envNuxtPublicAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    publicAnonKey: config.public.supabaseAnonKey,
  });

  if (!config.public.supabaseUrl || !supabaseKey) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "Configuración Supabase incompleta en runtime (URL/KEY faltante).",
    });
  }

  const response = await fetch(
    `${config.public.supabaseUrl}/functions/v1/ingredient-search`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ query, source }),
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage:
        String(payload?.error || payload?.message || "").trim() ||
        "Error consultando ingredient-search",
      data: payload,
    });
  }

  return payload;
});

