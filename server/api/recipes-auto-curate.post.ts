import { normalizeIngredientName } from "~/utils/ingredient-normalize";
import { createSupabaseAdminClient } from "~/server/utils/supabase-admin";

type AutoCurateBody = {
  recipeIds?: string[];
  source?: "open_food_facts" | "usda";
};

const asNumberOrNull = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const scoreName = (original: string, candidate: string) => {
  const o = normalizeIngredientName(original);
  const c = normalizeIngredientName(candidate);
  if (!o || !c) return 0;
  if (o === c) return 1;
  if (c.includes(o) || o.includes(c)) return 0.88;
  const oParts = new Set(o.split(" "));
  const cParts = new Set(c.split(" "));
  const overlap = [...oParts].filter((part) => cParts.has(part)).length;
  return overlap / Math.max(oParts.size, 1);
};

const pickBestOffCandidate = (ingredientName: string, products: any[]) => {
  let best: any = null;
  let bestScore = 0;
  for (const product of products || []) {
    const candidateName = String(
      product?.product_name || product?.generic_name || "",
    ).trim();
    if (!candidateName) continue;
    const score = scoreName(ingredientName, candidateName);
    const kcal = asNumberOrNull(product?.nutriments?.["energy-kcal_100g"]);
    const protein = asNumberOrNull(product?.nutriments?.proteins_100g);
    const carbs = asNumberOrNull(product?.nutriments?.carbohydrates_100g);
    const fat = asNumberOrNull(product?.nutriments?.fat_100g);
    const hasComplete = [kcal, protein, carbs, fat].every((v) => v !== null);
    const weighted = hasComplete ? score : score * 0.7;
    if (weighted > bestScore) {
      bestScore = weighted;
      best = {
        name: candidateName,
        source: "open_food_facts",
        external_id: String(product?.id || product?.code || ""),
        barcode: product?.code || null,
        nutrients: {
          kcal_per_100g: kcal,
          protein_per_100g: protein,
          carbs_per_100g: carbs,
          fat_per_100g: fat,
        },
      };
    }
  }
  return { best, score: bestScore };
};

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as AutoCurateBody;
  const recipeIds = Array.isArray(body?.recipeIds)
    ? body.recipeIds.filter(Boolean)
    : [];
  if (recipeIds.length === 0) return { success: true, processed: 0 };

  const config = useRuntimeConfig(event);
  const supabase = createSupabaseAdminClient(config);

  const { data: suggestionRows, error: suggestionsError } = await supabase
    .from("recipe_ingredients")
    .select("*")
    .in("recipe_id", recipeIds)
    .eq("is_confirmed", false);
  if (suggestionsError) {
    throw createError({
      statusCode: 500,
      statusMessage: suggestionsError.message,
    });
  }

  let curated = 0;
  let unresolved = 0;
  const errors: string[] = [];

  for (const row of suggestionRows || []) {
    try {
      const ingredientName = String(row.name || "").trim();
      if (!ingredientName) continue;

      const offResponse = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
          ingredientName,
        )}&search_simple=1&action=process&json=1&page_size=8`,
      );
      if (!offResponse.ok) {
        unresolved += 1;
        continue;
      }

      const offPayload = await offResponse.json();
      const { best, score } = pickBestOffCandidate(
        ingredientName,
        offPayload?.products || [],
      );
      if (!best || score < 0.8) {
        unresolved += 1;
        continue;
      }

      const normalizedName = normalizeIngredientName(ingredientName);
      const payload = {
        name: ingredientName,
        normalized_name: normalizedName,
        default_unit_type: "g",
        unit_type: "g",
        kcal_per_100g: best.nutrients.kcal_per_100g,
        protein_per_100g: best.nutrients.protein_per_100g,
        carbs_per_100g: best.nutrients.carbs_per_100g,
        fat_per_100g: best.nutrients.fat_per_100g,
        source: best.source,
        external_id: best.external_id,
        barcode: best.barcode,
        is_verified: [
          best.nutrients.kcal_per_100g,
          best.nutrients.protein_per_100g,
          best.nutrients.carbs_per_100g,
          best.nutrients.fat_per_100g,
        ].every((v) => v !== null),
        nutrition_status: [
          best.nutrients.kcal_per_100g,
          best.nutrients.protein_per_100g,
          best.nutrients.carbs_per_100g,
          best.nutrients.fat_per_100g,
        ].every((v) => v !== null)
          ? "complete"
          : "needs_review",
      };

      const { data: existingByExternal } = await supabase
        .from("ingredients")
        .select("id")
        .eq("source", "open_food_facts")
        .eq("external_id", best.external_id)
        .maybeSingle();

      let ingredientId = existingByExternal?.id;
      if (!ingredientId) {
        const { data: byName } = await supabase
          .from("ingredients")
          .upsert(payload, { onConflict: "normalized_name" })
          .select("id")
          .single();
        ingredientId = byName?.id;
      } else {
        await supabase
          .from("ingredients")
          .update(payload)
          .eq("id", ingredientId);
      }

      if (!ingredientId) {
        unresolved += 1;
        continue;
      }

      await supabase
        .from("recipe_ingredients")
        .update({
          ingredient_id: ingredientId,
          normalized_name: normalizedName,
          needs_review: false,
        })
        .eq("id", row.id);

      curated += 1;
    } catch (curationError) {
      errors.push(
        `${row.id}: ${
          curationError instanceof Error ? curationError.message : "unknown"
        }`,
      );
    }
  }

  return {
    success: true,
    processed: (suggestionRows || []).length,
    curated,
    unresolved,
    errors,
  };
});
