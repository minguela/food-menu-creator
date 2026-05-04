import { createClient } from "@supabase/supabase-js";
import {
  USDA_ALIASES,
  isNonApplicableIngredient,
  normalizeIngredientName,
  scoreIngredientCandidate,
  toNutrientNumberOrNull,
} from "~/server/utils/ingredient-enrichment";

type EnrichBody = { limit?: number; source?: EnrichSource };
type EnrichSource = "auto" | "usda" | "open_food_facts" | "bedca";

const extractUsdaNutrient = (foodNutrients: any[], keys: string[]) => {
  for (const item of foodNutrients || []) {
    const nutrientNumber = String(item?.nutrientNumber || "").trim();
    const nutrientName = String(item?.nutrientName || "")
      .toLowerCase()
      .trim();
    if (
      keys.includes(nutrientNumber) ||
      keys.some((key) => nutrientName.includes(key.toLowerCase()))
    ) {
      return toNutrientNumberOrNull(item?.value);
    }
  }
  return null;
};

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as EnrichBody;
  const limit = Math.min(50, Math.max(1, Number(body?.limit) || 20));
  const source = String(body?.source || "auto")
    .trim()
    .toLowerCase() as EnrichSource;
  const config = useRuntimeConfig(event);

  const usdaKey =
    config.usdaFdcApiKey ||
    process.env.USDA_FDC_API_KEY ||
    process.env.USDA_API_KEY;
  if (source === "usda" && !usdaKey) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "USDA_FDC_API_KEY no configurada para fuente USDA. Añádela en variables de entorno del servidor.",
    });
  }

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey,
  );

  const { data: ingredients, error } = await supabase
    .from("ingredients")
    .select("*")
    .or(
      "nutrition_status.is.null,nutrition_status.eq.pending,kcal_per_100g.is.null,protein_per_100g.is.null,carbs_per_100g.is.null,fat_per_100g.is.null",
    )
    .limit(limit);

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  let completed = 0;
  let needsReview = 0;
  let notFound = 0;
  const errors: string[] = [];

  for (const ingredient of ingredients || []) {
    try {
      if (isNonApplicableIngredient(ingredient.name)) {
        await supabase
          .from("ingredients")
          .update({ nutrition_status: "pending" })
          .eq("id", ingredient.id);
        continue;
      }

      const normalized = normalizeIngredientName(ingredient.name);
      const aliasQuery = USDA_ALIASES[normalized];
      const query = aliasQuery || ingredient.name;

      let bestCandidate: any = null;
      let bestScore = 0;

      const shouldTryUsda = source === "auto" || source === "usda";
      const shouldTryOff = source === "auto" || source === "open_food_facts";

      if (shouldTryUsda && usdaKey) {
        const usdaRes = await fetch(
          `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${usdaKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query,
              dataType: ["Foundation", "SR Legacy"],
              pageSize: 8,
              pageNumber: 1,
            }),
          },
        );

        if (usdaRes.ok) {
          const usdaPayload = await usdaRes.json();
          for (const food of usdaPayload?.foods || []) {
            const candidate = {
              source: "usda",
              external_id: String(food.fdcId),
              name: String(food.description || "").trim(),
              kcal_per_100g: extractUsdaNutrient(food.foodNutrients, [
                "1008",
                "Energy",
              ]),
              protein_per_100g: extractUsdaNutrient(food.foodNutrients, [
                "1003",
                "Protein",
              ]),
              carbs_per_100g: extractUsdaNutrient(food.foodNutrients, [
                "1005",
                "Carbohydrate",
              ]),
              fat_per_100g: extractUsdaNutrient(food.foodNutrients, [
                "1004",
                "Total lipid",
              ]),
              raw_payload: food,
            };
            const score = scoreIngredientCandidate(
              ingredient.name,
              candidate.name,
              aliasQuery,
            );
            if (score > bestScore) {
              bestScore = score;
              bestCandidate = candidate;
            }
          }
        }
      }

      if (shouldTryOff && (!bestCandidate || bestScore < 0.85)) {
        const offRes = await fetch(
          `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
            ingredient.name,
          )}&search_simple=1&action=process&json=1&page_size=8`,
        );
        if (offRes.ok) {
          const offPayload = await offRes.json();
          for (const product of offPayload?.products || []) {
            const candidate = {
              source: "open_food_facts",
              external_id: String(product?.id || product?.code || ""),
              barcode: product?.code || null,
              name: String(
                product?.product_name || product?.generic_name || "",
              ).trim(),
              kcal_per_100g: toNutrientNumberOrNull(
                product?.nutriments?.["energy-kcal_100g"],
              ),
              protein_per_100g: toNutrientNumberOrNull(
                product?.nutriments?.proteins_100g,
              ),
              carbs_per_100g: toNutrientNumberOrNull(
                product?.nutriments?.carbohydrates_100g,
              ),
              fat_per_100g: toNutrientNumberOrNull(
                product?.nutriments?.fat_100g,
              ),
              raw_payload: product,
            };
            const score = scoreIngredientCandidate(
              ingredient.name,
              candidate.name,
              aliasQuery,
            );
            if (score > bestScore) {
              bestScore = score;
              bestCandidate = candidate;
            }
          }
        }
      }

      if (!bestCandidate) {
        await supabase
          .from("ingredients")
          .update({
            nutrition_status: "not_found",
            is_verified: false,
          })
          .eq("id", ingredient.id);
        notFound += 1;
        continue;
      }

      const hasFull = [
        bestCandidate.kcal_per_100g,
        bestCandidate.protein_per_100g,
        bestCandidate.carbs_per_100g,
        bestCandidate.fat_per_100g,
      ].every((v) => v !== null);

      if (bestScore >= 0.85 && hasFull) {
        await supabase
          .from("ingredients")
          .update({
            kcal_per_100g: bestCandidate.kcal_per_100g,
            protein_per_100g: bestCandidate.protein_per_100g,
            carbs_per_100g: bestCandidate.carbs_per_100g,
            fat_per_100g: bestCandidate.fat_per_100g,
            source: bestCandidate.source,
            external_id: bestCandidate.external_id,
            barcode: bestCandidate.barcode || null,
            is_verified: true,
            nutrition_status: "complete",
          })
          .eq("id", ingredient.id);
        completed += 1;
      } else {
        await supabase.from("ingredient_nutrition_candidates").insert({
          ingredient_id: ingredient.id,
          source: bestCandidate.source,
          external_id: bestCandidate.external_id,
          name: bestCandidate.name || ingredient.name,
          kcal_per_100g: bestCandidate.kcal_per_100g,
          protein_per_100g: bestCandidate.protein_per_100g,
          carbs_per_100g: bestCandidate.carbs_per_100g,
          fat_per_100g: bestCandidate.fat_per_100g,
          confidence: bestScore,
          raw_payload: bestCandidate.raw_payload ?? null,
        });
        await supabase
          .from("ingredients")
          .update({
            nutrition_status: "needs_review",
            is_verified: false,
          })
          .eq("id", ingredient.id);
        needsReview += 1;
      }
    } catch (enrichError) {
      errors.push(
        `${ingredient.name}: ${
          enrichError instanceof Error ? enrichError.message : "unknown"
        }`,
      );
    }
  }

  return {
    success: true,
    source,
    processed: (ingredients || []).length,
    completed,
    needs_review: needsReview,
    not_found: notFound,
    errors,
  };
});
