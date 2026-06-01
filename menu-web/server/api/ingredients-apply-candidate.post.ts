import { createSupabaseAdminClient } from "~~/server/utils/supabase-admin";
import { validateIngredientNutritionQuality } from "~/utils/ingredient-nutrition-quality";

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as { candidateId?: string };
  const candidateId = String(body?.candidateId || "").trim();
  if (!candidateId) {
    throw createError({
      statusCode: 400,
      statusMessage: "candidateId requerido",
    });
  }

  const config = useRuntimeConfig(event);
  const supabase = createSupabaseAdminClient(config);

  const { data: candidate, error: candidateError } = await supabase
    .from("ingredient_nutrition_candidates")
    .select("*")
    .eq("id", candidateId)
    .single();
  if (candidateError || !candidate) {
    throw createError({
      statusCode: 404,
      statusMessage: candidateError?.message || "Candidato no encontrado",
    });
  }

  const nutritionQuality = validateIngredientNutritionQuality({
    kcal_per_100g: candidate.kcal_per_100g,
    protein_per_100g: candidate.protein_per_100g,
    carbs_per_100g: candidate.carbs_per_100g,
    fat_per_100g: candidate.fat_per_100g,
  });

  const { error: updateError } = await supabase
    .from("ingredients")
    .update({
      kcal_per_100g: candidate.kcal_per_100g,
      protein_per_100g: candidate.protein_per_100g,
      carbs_per_100g: candidate.carbs_per_100g,
      fat_per_100g: candidate.fat_per_100g,
      source: candidate.source,
      external_id: candidate.external_id,
      is_verified: !nutritionQuality.needsReview,
      nutrition_status: nutritionQuality.needsReview
        ? "needs_review"
        : "complete",
    })
    .eq("id", candidate.ingredient_id);
  if (updateError) {
    throw createError({ statusCode: 500, statusMessage: updateError.message });
  }

  await supabase
    .from("ingredient_nutrition_candidates")
    .delete()
    .eq("ingredient_id", candidate.ingredient_id);

  return { success: true, ingredient_id: candidate.ingredient_id };
});
