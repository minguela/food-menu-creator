import { createClient } from "@supabase/supabase-js";

let supabaseClient: ReturnType<typeof createClient> | null = null;

export const useSupabase = () => {
  if (supabaseClient) return supabaseClient;

  const config = useRuntimeConfig();

  supabaseClient = createClient(
    config.public.supabaseUrl || "https://tceusgxbfpekjcthrrqu.supabase.co",
    config.public.supabaseAnonKey ||
      "sb_publishable__ar3t49-ts89flpoWupqTA_44jctdfW",
  );

  return supabaseClient;
};
