import { createClient } from "@supabase/supabase-js";

let supabaseClient: ReturnType<typeof createClient> | null = null;

export const useSupabase = () => {
  if (supabaseClient) return supabaseClient;

  const config = useRuntimeConfig();
  const supabaseUrl = String(config.public.supabaseUrl || "");
  const supabaseAnonKey = String(config.public.supabaseAnonKey || "");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Supabase public configuration is missing.",
    });
  }

  supabaseClient = createClient(
    supabaseUrl,
    supabaseAnonKey,
  );

  return supabaseClient;
};
