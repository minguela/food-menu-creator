import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

type SearchBody = { query?: string };
type SearchSource = "usda" | "bedca" | "open_food_facts";

const extractNutrient = (foodNutrients: any[], keys: string[]) => {
  for (const item of foodNutrients || []) {
    const nutrientNumber = String(item?.nutrientNumber || "").trim();
    const nutrientName = String(item?.nutrientName || "")
      .toLowerCase()
      .trim();
    if (
      keys.includes(nutrientNumber) ||
      keys.some((key) => nutrientName.includes(key.toLowerCase()))
    ) {
      const value = Number(item?.value);
      if (Number.isFinite(value)) return value;
    }
  }
  return null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST" && req.method !== "GET") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let body: SearchBody & { source?: SearchSource } = {};
    if (req.method === "POST") {
      body = (await req.json()) as SearchBody & { source?: SearchSource };
    } else {
      const url = new URL(req.url);
      body = {
        query: url.searchParams.get("query") || "",
        source: (url.searchParams.get("source") || "usda") as SearchSource,
      };
    }
    const query = String(body?.query || "").trim();
    const source = (String(body?.source || "usda").trim().toLowerCase() ||
      "usda") as SearchSource;
    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: "query es obligatorio" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const usdaApiKey = Deno.env.get("USDA_FDC_API_KEY");
    if (source === "usda" && !usdaApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "USDA_FDC_API_KEY no configurada. Añádela en secrets de Supabase.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const normalizedQuery = query
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
    const { data: aliasRow } = await supabase
      .from("ingredient_aliases")
      .select("alias_en")
      .eq("normalized_alias_es", normalizedQuery)
      .maybeSingle();
    const effectiveQuery = String(aliasRow?.alias_en || query);

    if (source === "bedca") {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "BEDCA aún no está integrada por API en esta función. Usa USDA u Open Food Facts por ahora.",
        }),
        {
          status: 501,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let candidates: any[] = [];
    if (source === "open_food_facts") {
      const offResponse = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(effectiveQuery)}&search_simple=1&action=process&json=1&page_size=10`,
      );
      if (!offResponse.ok) {
        const text = await offResponse.text();
        return new Response(
          JSON.stringify({
            success: false,
            error: `Open Food Facts search error (${offResponse.status})`,
            details: text,
          }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      const offPayload = await offResponse.json();
      candidates = (offPayload?.products || []).map((product: any) => {
        const kcal = Number(product?.nutriments?.["energy-kcal_100g"]);
        const protein = Number(product?.nutriments?.proteins_100g);
        const carbs = Number(product?.nutriments?.carbohydrates_100g);
        const fat = Number(product?.nutriments?.fat_100g);
        const safe = (value: number) => (Number.isFinite(value) ? value : null);
        const safeKcal = safe(kcal);
        const safeProtein = safe(protein);
        const safeCarbs = safe(carbs);
        const safeFat = safe(fat);
        const hasFullNutrition = [safeKcal, safeProtein, safeCarbs, safeFat].every(
          (value) => value !== null,
        );
        return {
          name: product?.product_name || product?.generic_name || "Producto",
          source: "open_food_facts",
          external_id: String(product?.id || product?.code || ""),
          barcode: product?.code || null,
          nutrients: {
            kcal_per_100g: safeKcal,
            protein_per_100g: safeProtein,
            carbs_per_100g: safeCarbs,
            fat_per_100g: safeFat,
          },
          reliability: hasFullNutrition ? "high" : "needs_review",
        };
      });
    } else {
      const response = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${usdaApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: effectiveQuery,
            dataType: ["Foundation", "SR Legacy"],
            pageSize: 10,
            pageNumber: 1,
          }),
        },
      );

      if (!response.ok) {
        const text = await response.text();
        return new Response(
          JSON.stringify({
            success: false,
            error: `USDA search error (${response.status})`,
            details: text,
          }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const payload = await response.json();
      candidates = (payload?.foods || []).map((food: any) => {
        const kcal = extractNutrient(food.foodNutrients, ["1008", "Energy"]);
        const protein = extractNutrient(food.foodNutrients, ["1003", "Protein"]);
        const carbs = extractNutrient(
          food.foodNutrients,
          ["1005", "Carbohydrate"],
        );
        const fat = extractNutrient(food.foodNutrients, ["1004", "Total lipid"]);
        const hasFullNutrition = [kcal, protein, carbs, fat].every(
          (value) => value !== null,
        );

        return {
          name: food.description,
          source: "usda",
          external_id: String(food.fdcId),
          nutrients: {
            kcal_per_100g: kcal,
            protein_per_100g: protein,
            carbs_per_100g: carbs,
            fat_per_100g: fat,
          },
          reliability: hasFullNutrition ? "high" : "needs_review",
        };
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        query,
        source,
        effective_query: effectiveQuery,
        candidates,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
