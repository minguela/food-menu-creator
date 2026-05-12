import { createSupabaseAdminClient } from "~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    selectedIngredientIds?: string[];
    destinationIngredientId?: string;
  }>(event);

  const selectedIds = Array.from(
    new Set(
      (Array.isArray(body?.selectedIngredientIds) ? body.selectedIngredientIds : [])
        .map((id) => String(id || "").trim())
        .filter(Boolean),
    ),
  );
  const destinationId = String(body?.destinationIngredientId || "").trim();

  if (!destinationId || selectedIds.length < 2 || !selectedIds.includes(destinationId)) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Debes seleccionar al menos 2 ingredientes y elegir destino dentro de la selección.",
    });
  }

  const sourceIds = selectedIds.filter((id) => id !== destinationId);
  const config = useRuntimeConfig(event);
  const supabase = createSupabaseAdminClient(config);

  const { data: destination, error: destinationError } = await supabase
    .from("ingredients")
    .select("id,name")
    .eq("id", destinationId)
    .maybeSingle();
  if (destinationError || !destination?.id) {
    throw createError({ statusCode: 404, statusMessage: "Ingrediente destino no encontrado." });
  }

  for (const sourceId of sourceIds) {
    const { data: sourceRows, error: sourceRowsError } = await supabase
      .from("recipe_ingredients")
      .select("id,recipe_id,quantity,unit_type,is_confirmed,is_suggested,needs_review")
      .eq("ingredient_id", sourceId);
    if (sourceRowsError) throw createError({ statusCode: 500, statusMessage: sourceRowsError.message });

    for (const row of sourceRows || []) {
      const { data: existing, error: existingError } = await supabase
        .from("recipe_ingredients")
        .select("id,quantity,unit_type,is_confirmed,is_suggested,needs_review")
        .eq("recipe_id", row.recipe_id)
        .eq("ingredient_id", destinationId)
        .maybeSingle();
      if (existingError) throw createError({ statusCode: 500, statusMessage: existingError.message });

      if (existing?.id) {
        const { error: mergeUpdateError } = await supabase
          .from("recipe_ingredients")
          .update({
            quantity: existing.quantity ?? row.quantity ?? 1,
            unit_type: existing.unit_type || row.unit_type || "g",
            is_confirmed: Boolean(existing.is_confirmed || row.is_confirmed),
            is_suggested: Boolean(existing.is_suggested && !row.is_confirmed),
            needs_review: Boolean(existing.needs_review || row.needs_review),
          })
          .eq("id", existing.id);
        if (mergeUpdateError) {
          throw createError({ statusCode: 500, statusMessage: mergeUpdateError.message });
        }
        const { error: deleteDupError } = await supabase
          .from("recipe_ingredients")
          .delete()
          .eq("id", row.id);
        if (deleteDupError) throw createError({ statusCode: 500, statusMessage: deleteDupError.message });
      } else {
        const { error: reassignError } = await supabase
          .from("recipe_ingredients")
          .update({ ingredient_id: destinationId, name: destination.name })
          .eq("id", row.id);
        if (reassignError) throw createError({ statusCode: 500, statusMessage: reassignError.message });
      }
    }

    const { error: candidateUpdateError } = await supabase
      .from("ingredient_nutrition_candidates")
      .update({ ingredient_id: destinationId })
      .eq("ingredient_id", sourceId);
    if (candidateUpdateError) throw createError({ statusCode: 500, statusMessage: candidateUpdateError.message });

    const { error: deleteSourceError } = await supabase
      .from("ingredients")
      .delete()
      .eq("id", sourceId);
    if (deleteSourceError) throw createError({ statusCode: 500, statusMessage: deleteSourceError.message });
  }

  return { success: true, merged: sourceIds.length, destinationIngredientId: destinationId };
});
