import { createSupabaseAdminClient } from "~/server/utils/supabase-admin";
import { normalizeIngredientName } from "~/utils/ingredient-normalize";

type IngredientRow = {
  id: string;
  name: string;
  normalized_name: string | null;
  source: string | null;
  nutrition_status: string | null;
  is_verified: boolean | null;
};

const ingredientScore = (row: IngredientRow) => {
  let score = 0;
  if (row.nutrition_status === "complete") score += 10;
  if (row.is_verified) score += 6;
  if (row.source === "open_food_facts") score += 4;
  if (row.source === "usda") score += 3;
  if (row.name?.length) score += Math.min(3, row.name.length / 20);
  return score;
};

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const supabase = createSupabaseAdminClient(config);

  const { data: ingredients, error } = await supabase
    .from("ingredients")
    .select("id,name,normalized_name,source,nutrition_status,is_verified");

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  const groups = new Map<string, IngredientRow[]>();
  for (const item of (ingredients || []) as IngredientRow[]) {
    const key = normalizeIngredientName(item.name || "");
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  let mergedIngredients = 0;
  let updatedRecipeLinks = 0;

  for (const [, group] of groups) {
    if (group.length < 2) continue;
    const sorted = [...group].sort(
      (a, b) => ingredientScore(b) - ingredientScore(a),
    );
    const target = sorted[0];
    const sources = sorted.slice(1);

    for (const source of sources) {
      const { error: recipeUpdateError } = await supabase
        .from("recipe_ingredients")
        .update({
          ingredient_id: target.id,
          name: target.name,
          normalized_name:
            target.normalized_name || normalizeIngredientName(target.name),
        })
        .eq("ingredient_id", source.id);
      if (recipeUpdateError) {
        throw createError({
          statusCode: 500,
          statusMessage: recipeUpdateError.message,
        });
      }

      const { error: aliasUpdateError } = await supabase
        .from("ingredient_aliases")
        .update({ ingredient_id: target.id })
        .eq("ingredient_id", source.id);
      if (aliasUpdateError) {
        throw createError({
          statusCode: 500,
          statusMessage: aliasUpdateError.message,
        });
      }

      const { error: candidatesUpdateError } = await supabase
        .from("ingredient_nutrition_candidates")
        .update({ ingredient_id: target.id })
        .eq("ingredient_id", source.id);
      if (candidatesUpdateError) {
        throw createError({
          statusCode: 500,
          statusMessage: candidatesUpdateError.message,
        });
      }

      const { error: orphanRecipeRowsError } = await supabase
        .from("recipe_ingredients")
        .update({
          ingredient_id: target.id,
          name: target.name,
          normalized_name:
            target.normalized_name || normalizeIngredientName(target.name),
        })
        .is("ingredient_id", null)
        .eq("normalized_name", normalizeIngredientName(source.name));
      if (orphanRecipeRowsError) {
        throw createError({
          statusCode: 500,
          statusMessage: orphanRecipeRowsError.message,
        });
      }

      const { error: deleteError } = await supabase
        .from("ingredients")
        .delete()
        .eq("id", source.id);
      if (deleteError) {
        throw createError({ statusCode: 500, statusMessage: deleteError.message });
      }

      mergedIngredients += 1;
      updatedRecipeLinks += 1;
    }
  }

  return {
    success: true,
    merged_ingredients: mergedIngredients,
    updated_recipe_links: updatedRecipeLinks,
  };
});

