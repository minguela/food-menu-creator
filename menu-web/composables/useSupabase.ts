import { createClient } from "@supabase/supabase-js";

export const useSupabase = () => {
  const config = useRuntimeConfig();

  return createClient(
    config.public.supabaseUrl || "https://tceusgxbfpekjcthrrqu.supabase.co",
    config.public.supabaseAnonKey ||
      "sb_publishable__ar3t49-ts89flpoWupqTA_44jctdfW",
  );
};
