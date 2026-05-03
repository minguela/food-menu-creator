import type { User } from "~/types";

export const useCurrentUser = () => {
  const supabase = useSupabase();
  const user = useState<User | null>("current-user", () => null);

  const loadCurrentUser = async () => {
    if (user.value) return user.value;

    const storedUserId = import.meta.client
      ? window.localStorage.getItem("menuplanner:user_id")
      : null;

    let query = supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1);

    if (storedUserId) {
      query = supabase
        .from("users")
        .select("*")
        .eq("id", storedUserId)
        .limit(1);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("Error cargando usuario actual:", error);
      return null;
    }

    user.value = data || null;

    if (import.meta.client && user.value?.id) {
      window.localStorage.setItem("menuplanner:user_id", user.value.id);
    }

    return user.value;
  };

  return {
    user,
    loadCurrentUser,
  };
};
