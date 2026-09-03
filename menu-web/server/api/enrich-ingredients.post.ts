import db from '~~/server/utils/db';
import {
  USDA_ALIASES,
  isNonApplicableIngredient,
  normalizeIngredientName,
  scoreIngredientCandidate,
  toNutrientNumberOrNull,
} from "~~/server/utils/ingredient-enrichment";
import {
  resolveUsdaKey,
  shouldTryOff,
  shouldTryUsda,
} from "~/utils/enrich-runtime";
import { validateIngredientNutritionQuality } from "~/utils/ingredient-nutrition-quality";
import { classifyCaloricDensity } from "~/utils/caloric-density";

type EnrichBody = {
  ingredientId?: string;
  ingredientIds?: string[];
  limit?: number;
  query?: string;
  source?: EnrichSource;
};
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

const OFF_MIN_CONFIDENCE = 0.75;

const hasCompleteCandidateNutrition = (candidate: any) =>
  !validateIngredientNutritionQuality(candidate).needsReview;

const candidateNeedsReview = (candidate: any) =>
  validateIngredientNutritionQuality(candidate).needsReview;

const shouldReplaceBestCandidate = (
  candidate: any,
  score: number,
  bestCandidate: any,
  bestScore: number,
) => {
  if (score > bestScore) return true;
  if (score < bestScore) return false;
  return (
    hasCompleteCandidateNutrition(candidate) &&
    !hasCompleteCandidateNutrition(bestCandidate)
  );
};

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as EnrichBody;
  const ingredientIds = Array.from(
    new Set(
      [
        body?.ingredientId,
        ...(Array.isArray(body?.ingredientIds) ? body.ingredientIds : []),
      ]
        .map((id) => String(id || "").trim())
        .filter(Boolean),
    ),
  );
  const queryText = String(body?.query || "").trim();
  const limit = Math.min(
    10,
    Math.max(1, Number(body?.limit) || ingredientIds.length || 1),
  );
  const source = normalizeEnrichSource(body?.source) as EnrichSource;
  const effectiveSource: EnrichSource =
    source === "auto" || source === "bedca" ? "open_food_facts" : source;
  const config = useRuntimeConfig(event);

  const usdaKey = resolveUsdaKey({
    runtimeUsdaKey: config.usdaFdcApiKey,
    envUsdaFdc: process.env.USDA_FDC_API_KEY,
    envUsdaLegacy: process.env.USDA_API_KEY,
    envNuxtUsda: process.env.NUXT_USDA_FDC_API_KEY,
  });
  if (effectiveSource === "usda" && !usdaKey) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "USDA_FDC_API_KEY no configurada para fuente USDA. Añádela en variables de entorno del servidor.",
    });
  }

  let ingredientsQuery = db
    .from("ingredients")
    .select("*")
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (ingredientIds.length > 0) {
    ingredientsQuery = ingredientsQuery.in("id", ingredientIds);
  } else if (queryText) {
    ingredientsQuery = ingredientsQuery.ilike("name", `%${queryText}%`);
  } else {
    ingredientsQuery = ingredientsQuery.or(
      "nutrition_status.is.null,nutrition_status.eq.pending,nutrition_status.eq.needs_review",
    );
  }

  const { data: ingredients, error } = await ingredientsQuery;

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
        await db
          .from("ingredients")
          .update({ nutrition_status: "pending" })
          .eq("id", ingredient.id);
        continue;
      }

      const normalized = normalizeIngredientName(ingredient.name);
      const aliasQuery = USDA_ALIASES[normalized];
      const usdaQuery = aliasQuery || ingredient.name;
      const offQuery = queryText || ingredient.name;

      let bestCandidate: any = null;
      let bestScore = 0;

      if (shouldTryUsda(effectiveSource) && usdaKey) {
        const usdaRes = await fetch(
          `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${usdaKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: usdaQuery,
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
            if (
              shouldReplaceBestCandidate(
                candidate,
                score,
                bestCandidate,
                bestScore,
              )
            ) {
              bestScore = score;
              bestCandidate = candidate;
            }
          }
        }
      }

      if (
        shouldTryOff(effectiveSource) &&
        (!bestCandidate || bestScore < OFF_MIN_CONFIDENCE)
      ) {
        const offRes = await fetch(
          `https://search.openfoodfacts.org/search?q=${encodeURIComponent(
            offQuery,
          )}&page_size=10&langs=es,en&fields=code,id,product_name,generic_name,nutriments`,
          {
            headers: {
              "User-Agent":
                "FoodMenuCreator/1.0 (https://food-menu-creator-lyart.vercel.app)",
            },
          },
        );
        if (offRes.ok) {
          const offPayload = await offRes.json();
          for (const product of offPayload?.hits || []) {
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
            );
            if (
              shouldReplaceBestCandidate(
                candidate,
                score,
                bestCandidate,
                bestScore,
              )
            ) {
              bestScore = score;
              bestCandidate = candidate;
            }
          }
        }
      }

      if (!bestCandidate || bestScore < OFF_MIN_CONFIDENCE) {
        await db
          .from("ingredients")
          .update({
            nutrition_status: "needs_review",
            is_verified: false,
            review_reason: "off_low_confidence_or_no_match",
          })
          .eq("id", ingredient.id);
        needsReview += 1;
        continue;
      }

      const needsNutritionReview = candidateNeedsReview(bestCandidate);

      if (bestScore >= OFF_MIN_CONFIDENCE && !needsNutritionReview) {
        await db
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
            review_reason: null,
            caloric_density_level: classifyCaloricDensity(
              bestCandidate.kcal_per_100g,
            ),
          })
          .eq("id", ingredient.id);
        completed += 1;
      } else {
        const candidateKey = String(bestCandidate.external_id || "").trim();
        const { data: existingCandidate } = await db
          .from("ingredient_nutrition_candidates")
          .select("id, confidence")
          .eq("ingredient_id", ingredient.id)
          .eq("source", bestCandidate.source)
          .eq("external_id", candidateKey)
          .maybeSingle();

        if (existingCandidate?.id) {
          await db
            .from("ingredient_nutrition_candidates")
            .update({
              name: bestCandidate.name || ingredient.name,
              kcal_per_100g: bestCandidate.kcal_per_100g,
              protein_per_100g: bestCandidate.protein_per_100g,
              carbs_per_100g: bestCandidate.carbs_per_100g,
              fat_per_100g: bestCandidate.fat_per_100g,
              confidence: Math.max(
                Number(existingCandidate.confidence || 0),
                bestScore,
              ),
              raw_payload: bestCandidate.raw_payload ?? null,
            })
            .eq("id", existingCandidate.id);
        } else {
          await db.from("ingredient_nutrition_candidates").insert({
            ingredient_id: ingredient.id,
            source: bestCandidate.source,
            external_id: candidateKey,
            name: bestCandidate.name || ingredient.name,
            kcal_per_100g: bestCandidate.kcal_per_100g,
            protein_per_100g: bestCandidate.protein_per_100g,
            carbs_per_100g: bestCandidate.carbs_per_100g,
            fat_per_100g: bestCandidate.fat_per_100g,
            confidence: bestScore,
            raw_payload: bestCandidate.raw_payload ?? null,
          });
        }
        await db
          .from("ingredients")
          .update({
            nutrition_status: "needs_review",
            is_verified: false,
            review_reason: "candidate_requires_manual_review",
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
    source: effectiveSource,
    processed: (ingredients || []).length,
    completed,
    needs_review: needsReview,
    not_found: notFound,
    errors,
  };
});
