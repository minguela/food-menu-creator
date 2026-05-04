import { createClient } from "@supabase/supabase-js";
import { normalizeIngredientName } from "~/utils/ingredient-normalize";

type CandidatePayload = {
  name?: string;
  source?: string;
  external_id?: string | null;
  barcode?: string | null;
  nutrients?: {
    kcal_per_100g?: number | null;
    protein_per_100g?: number | null;
    carbs_per_100g?: number | null;
    fat_per_100g?: number | null;
  };
};

const toNumberOrNull = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as { candidate?: CandidatePayload };
  const candidate = body?.candidate;
  const name = String(candidate?.name || "").trim();
  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: "candidate.name es obligatorio",
    });
  }

  const source = String(candidate?.source || "manual")
    .trim()
    .toLowerCase();
  const externalId = String(candidate?.external_id || "").trim() || null;
  const normalizedName = normalizeIngredientName(name);
  const kcal = toNumberOrNull(candidate?.nutrients?.kcal_per_100g);
  const protein = toNumberOrNull(candidate?.nutrients?.protein_per_100g);
  const carbs = toNumberOrNull(candidate?.nutrients?.carbs_per_100g);
  const fat = toNumberOrNull(candidate?.nutrients?.fat_per_100g);
  const hasCompleteNutrition = [kcal, protein, carbs, fat].every(
    (value) => value !== null,
  );

  const config = useRuntimeConfig(event);
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey,
  );

  const payload = {
    name,
    normalized_name: normalizedName,
    default_unit_type: "g",
    unit_type: "g",
    kcal_per_100g: kcal,
    protein_per_100g: protein,
    carbs_per_100g: carbs,
    fat_per_100g: fat,
    source,
    external_id: externalId,
    barcode: candidate?.barcode || null,
    is_verified: hasCompleteNutrition,
    nutrition_status: hasCompleteNutrition ? "complete" : "needs_review",
    updated_at: new Date().toISOString(),
  };

  if (source && externalId) {
    const { data: byExternal, error: byExternalError } = await supabase
      .from("ingredients")
      .select("id")
      .eq("source", source)
      .eq("external_id", externalId)
      .maybeSingle();
    if (byExternalError) {
      throw createError({
        statusCode: 500,
        statusMessage: byExternalError.message,
      });
    }
    if (byExternal?.id) {
      const { error: updateError } = await supabase
        .from("ingredients")
        .update(payload)
        .eq("id", byExternal.id);
      if (updateError) {
        throw createError({
          statusCode: 500,
          statusMessage: updateError.message,
        });
      }
      return {
        success: true,
        ingredient_id: byExternal.id,
        strategy: "source_external_id",
      };
    }
  }

  const { data: byName, error: byNameError } = await supabase
    .from("ingredients")
    .upsert(payload, { onConflict: "normalized_name" })
    .select("id")
    .single();

  if (byNameError || !byName?.id) {
    throw createError({
      statusCode: 500,
      statusMessage: byNameError?.message || "No se pudo guardar ingrediente",
    });
  }

  return {
    success: true,
    ingredient_id: byName.id,
    strategy: "normalized_name",
  };
});
