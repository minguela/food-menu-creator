import { createSupabaseAdminClient } from "~/server/utils/supabase-admin";

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

  const hasFull = [
    candidate.kcal_per_100g,
    candidate.protein_per_100g,
    candidate.carbs_per_100g,
    candidate.fat_per_100g,
  ].every((v) => v != null);

  const { error: updateError } = await supabase
    .from("ingredients")
    .update({
      kcal_per_100g: candidate.kcal_per_100g,
      protein_per_100g: candidate.protein_per_100g,
      carbs_per_100g: candidate.carbs_per_100g,
      fat_per_100g: candidate.fat_per_100g,
      source: candidate.source,
      external_id: candidate.external_id,
      is_verified: hasFull,
      nutrition_status: hasFull ? "complete" : "needs_review",
    })
    .eq("id", candidate.ingredient_id);
  if (updateError) {
    throw createError({ statusCode: 500, statusMessage: updateError.message });
  }

  if (candidate.source && candidate.external_id) {
    await supabase
      .from("ingredient_nutrition_candidates")
      .delete()
      .eq("ingredient_id", candidate.ingredient_id)
      .eq("source", candidate.source)
      .eq("external_id", candidate.external_id);
  } else {
    await supabase
      .from("ingredient_nutrition_candidates")
      .delete()
      .eq("id", candidateId);
  }

  return { success: true, ingredient_id: candidate.ingredient_id };
});
