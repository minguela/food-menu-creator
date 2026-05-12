import { createClient } from "@supabase/supabase-js";
import { resolveSupabaseServerKey } from "~/utils/enrich-runtime";

export const createSupabaseAdminClient = (
  config: ReturnType<typeof useRuntimeConfig>,
) => {
  const supabaseKey = resolveSupabaseServerKey({
    runtimeServiceKey: config.supabaseServiceKey,
    envServiceRole: process.env.SUPABASE_SERVICE_ROLE_KEY,
    envNuxtServiceKey: process.env.NUXT_SUPABASE_SERVICE_KEY,
    envSupabaseKey: process.env.SUPABASE_KEY,
    envAnonKey: process.env.SUPABASE_ANON_KEY,
    envNuxtPublicAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    publicAnonKey: config.public.supabaseAnonKey,
  });

  if (!supabaseKey) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "SUPABASE_SERVICE_ROLE_KEY no configurada en runtime. Configúrala en Vercel/Supabase.",
    });
  }

  return createClient(config.public.supabaseUrl, supabaseKey);
};
