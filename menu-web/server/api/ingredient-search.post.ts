// POST /api/ingredient-search — inlines what was the Supabase edge function
// Searches USDA FoodData Central API for ingredient nutrition data
import { defineEventHandler, readBody, createError } from 'h3';
import {
  scoreIngredientCandidate,
  toNutrientNumberOrNull,
} from '~~/server/utils/ingredient-enrichment';

type SearchSource = 'usda' | 'open_food_facts' | 'bedca';

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as {
    query?: string;
    source?: SearchSource;
  };

  const query = String(body?.query || '').trim();
  const source = (String(body?.source || 'usda').trim().toLowerCase() || 'usda') as SearchSource;

  if (!query) {
    throw createError({ statusCode: 400, statusMessage: 'query es obligatorio' });
  }

  // Open Food Facts search (local, no Supabase needed)
  if (source === 'open_food_facts') {
    const offResponse = await fetch(
      `https://search.openfoodfacts.org/search?q=${encodeURIComponent(query)}&page_size=10&langs=es,en&fields=code,id,product_name,generic_name,nutriments`,
      {
        headers: {
          'User-Agent': 'FoodMenuCreator/1.0',
        },
      },
    );
    const offPayload = await offResponse.json().catch(() => ({}));
    if (!offResponse.ok) {
      throw createError({
        statusCode: 502,
        statusMessage: String(offPayload?.error || '').trim() || `Open Food Facts error (${offResponse.status})`,
      });
    }

    const candidates = (Array.isArray(offPayload?.hits) ? offPayload.hits : [])
      .map((product: any) => {
        const candidate = {
          name: String(product?.product_name || product?.generic_name || '').trim(),
          source: 'open_food_facts',
          external_id: String(product?.id || product?.code || ''),
          barcode: product?.code || null,
          nutrients: {
            kcal_per_100g: toNutrientNumberOrNull(product?.nutriments?.['energy-kcal_100g']),
            protein_per_100g: toNutrientNumberOrNull(product?.nutriments?.proteins_100g),
            carbs_per_100g: toNutrientNumberOrNull(product?.nutriments?.carbohydrates_100g),
            fat_per_100g: toNutrientNumberOrNull(product?.nutriments?.fat_100g),
          },
        };
        const confidence = scoreIngredientCandidate(query, candidate.name);
        const hasFullNutrition = [
          candidate.nutrients.kcal_per_100g,
          candidate.nutrients.protein_per_100g,
          candidate.nutrients.carbs_per_100g,
          candidate.nutrients.fat_per_100g,
        ].every((value) => value !== null);
        return { ...candidate, confidence, reliability: hasFullNutrition ? 'high' : 'needs_review' };
      })
      .filter((candidate: any) => Number(candidate.confidence || 0) >= 0.75);

    return { success: true, query, source, effective_query: query, candidates };
  }

  // USDA FoodData Central search
  const config = useRuntimeConfig(event);
  const apiKey = config.usdaFdcApiKey || process.env.USDA_FDC_API_KEY || process.env.USDA_API_KEY;

  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'USDA API key not configured' });
  }

  const usdaResponse = await fetch(
    `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(query)}&pageSize=10&dataType=Foundation,SR Legacy`,
    { headers: { 'Content-Type': 'application/json' } },
  );

  const usdaPayload = await usdaResponse.json().catch(() => ({}));
  if (!usdaResponse.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `USDA search error (${usdaResponse.status})`,
    });
  }

  const candidates = (Array.isArray(usdaPayload?.foods) ? usdaPayload.foods : [])
    .map((food: any) => {
      const nutrients: Record<string, number> = {};
      for (const fn of food.foodNutrients || []) {
        if (fn.nutrientId === 1008) nutrients.kcal_per_100g = fn.value; // Energy
        if (fn.nutrientId === 1003) nutrients.protein_per_100g = fn.value;
        if (fn.nutrientId === 1005) nutrients.carbs_per_100g = fn.value;
        if (fn.nutrientId === 1004) nutrients.fat_per_100g = fn.value;
      }
      const candidate = {
        name: String(food?.description || '').trim(),
        source: 'usda',
        external_id: String(food?.fdcId || ''),
        nutrients: {
          kcal_per_100g: toNutrientNumberOrNull(nutrients.kcal_per_100g),
          protein_per_100g: toNutrientNumberOrNull(nutrients.protein_per_100g),
          carbs_per_100g: toNutrientNumberOrNull(nutrients.carbs_per_100g),
          fat_per_100g: toNutrientNumberOrNull(nutrients.fat_per_100g),
        },
      };
      const confidence = scoreIngredientCandidate(query, candidate.name);
      return { ...candidate, confidence };
    })
    .filter((candidate: any) => Number(candidate.confidence || 0) >= 0.75);

  return { success: true, query, source, candidates };
});
