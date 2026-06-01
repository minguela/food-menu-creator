import { resolveSupabaseServerKey } from "~/utils/enrich-runtime";
import {
  scoreIngredientCandidate,
  toNutrientNumberOrNull,
} from "~~/server/utils/ingredient-enrichment";

type SearchSource = "usda" | "open_food_facts" | "bedca";

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as {
    query?: string;
    source?: SearchSource;
  };

  const query = String(body?.query || "").trim();
  const source = (String(body?.source || "usda").trim().toLowerCase() ||
    "usda") as SearchSource;

  if (!query) {
    throw createError({
      statusCode: 400,
      statusMessage: "query es obligatorio",
    });
  }

  if (source === "open_food_facts") {
    const offResponse = await fetch(
      `https://search.openfoodfacts.org/search?q=${encodeURIComponent(
        query,
      )}&page_size=10&langs=es,en&fields=code,id,product_name,generic_name,nutriments`,
      {
        headers: {
          "User-Agent": "FoodMenuCreator/1.0 (https://food-menu-creator-lyart.vercel.app)",
        },
      },
    );
    const offPayload = await offResponse.json().catch(() => ({}));
    if (!offResponse.ok) {
      throw createError({
        statusCode: 502,
        statusMessage:
          String(offPayload?.error || "").trim() ||
          `Open Food Facts search error (${offResponse.status})`,
        data: offPayload,
      });
    }

    const candidates = (Array.isArray(offPayload?.hits)
      ? offPayload.hits
      : []
    )
      .map((product: any) => {
        const candidate = {
          name: String(
            product?.product_name || product?.generic_name || "",
          ).trim(),
          source: "open_food_facts",
          external_id: String(product?.id || product?.code || ""),
          barcode: product?.code || null,
          nutrients: {
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
          },
        };
        const confidence = scoreIngredientCandidate(query, candidate.name);
        const hasFullNutrition = [
          candidate.nutrients.kcal_per_100g,
          candidate.nutrients.protein_per_100g,
          candidate.nutrients.carbs_per_100g,
          candidate.nutrients.fat_per_100g,
        ].every((value) => value !== null);
        return {
          ...candidate,
          confidence,
          reliability: hasFullNutrition ? "high" : "needs_review",
        };
      })
      .filter((candidate: any) => Number(candidate.confidence || 0) >= 0.75);

    return {
      success: true,
      query,
      source,
      effective_query: query,
      candidates,
    };
  }

  const config = useRuntimeConfig(event);
  const supabaseKey = resolveSupabaseServerKey({
    runtimeServiceKey: config.supabaseServiceKey,
    envServiceRole: process.env.SUPABASE_SERVICE_ROLE_KEY,
    envNuxtServiceKey: process.env.NUXT_SUPABASE_SERVICE_KEY,
    envSupabaseKey: process.env.SUPABASE_KEY,
    envAnonKey: process.env.SUPABASE_ANON_KEY,
    envNuxtPublicAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    publicAnonKey: config.public.supabaseAnonKey,
  });

  if (!config.public.supabaseUrl || !supabaseKey) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "Configuración Supabase incompleta en runtime (URL/KEY faltante).",
    });
  }

  const response = await fetch(
    `${config.public.supabaseUrl}/functions/v1/ingredient-search`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ query, source }),
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage:
        String(payload?.error || payload?.message || "").trim() ||
        "Error consultando ingredient-search",
      data: payload,
    });
  }

  const candidates = Array.isArray(payload?.candidates)
    ? payload.candidates
        .map((candidate: any) => ({
          ...candidate,
          confidence: scoreIngredientCandidate(
            query,
            String(candidate?.name || ""),
          ),
        }))
        .filter((candidate: any) => Number(candidate.confidence || 0) >= 0.75)
    : [];

  return { ...payload, candidates };
});
