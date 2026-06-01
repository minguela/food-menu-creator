import { generateNutritionMenu, type MenuPeriodType } from "~~/server/services/menuGenerator";
import { saveNutritionGeneratedMenu } from "~~/server/services/menuGeneratorPersistence";
import { createSupabaseAdminClient } from "~~/server/utils/supabase-admin";

type SaveBody = {
  userId?: string;
  profileId?: string;
  name?: string;
  periodType?: MenuPeriodType;
  startDate?: string;
  days?: number;
  includeSnack?: boolean;
};

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as SaveBody;
  const userId = String(body.userId || "").trim();
  const profileId = String(body.profileId || "").trim();
  const periodType = normalizePeriodType(body.periodType);
  const startDate = String(body.startDate || new Date().toISOString().slice(0, 10));

  if (!userId || !profileId) {
    throw createError({
      statusCode: 400,
      statusMessage: "userId y profileId son obligatorios",
    });
  }

  const supabase = createSupabaseAdminClient(useRuntimeConfig(event));
  const profile = await loadProfile({ supabase, userId, profileId });

  const result = await generateNutritionMenu({
    supabase,
    userId,
    profile,
    periodType,
    startDate,
    days: body.days,
    includeSnack: body.includeSnack,
    logger: (entry) => console.log("nutrition-menu-save", entry),
  });
  const saved = await saveNutritionGeneratedMenu({
    supabase,
    userId,
    profileId,
    name: body.name || "Menu nutricional",
    result,
  });

  return {
    success: true,
    rotating_menu_id: saved.id,
    generated_menu: result,
  };
});

async function loadProfile({
  supabase,
  userId,
  profileId,
}: {
  supabase: any;
  userId: string;
  profileId: string;
}) {
  const { data, error } = await supabase
    .from("person_profiles")
    .select("*")
    .eq("id", profileId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw createError({ statusCode: 404, statusMessage: "Perfil no encontrado" });
  }
  return data;
}

function normalizePeriodType(value?: string): MenuPeriodType {
  if (value === "weekly" || value === "monthly" || value === "daily") return value;
  return "daily";
}
