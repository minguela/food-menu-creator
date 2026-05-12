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

const singularizeToken = (token: string) => {
  if (token.endsWith("es") && token.length > 4) return token.slice(0, -2);
  if (token.endsWith("s") && token.length > 3) return token.slice(0, -1);
  return token;
};

const simplifyMergeKey = (name: string) =>
  normalizeIngredientName(name)
    .split(" ")
    .filter(Boolean)
    .map(singularizeToken)
    .join(" ");

const exactEquivalentKeys = new Map<string, string>(
  ( [
    ["atun", "atun bonito conserva"],
    ["atun lata", "atun bonito conserva"],
    ["atun en lata", "atun bonito conserva"],
    ["atun conserva", "atun bonito conserva"],
    ["atun en conserva", "atun bonito conserva"],
    ["bonito", "atun bonito conserva"],
    ["bonito lata", "atun bonito conserva"],
    ["bonito en lata", "atun bonito conserva"],
    ["bonito conserva", "atun bonito conserva"],
    ["bonito en conserva", "atun bonito conserva"],
    ["bonito del norte", "atun bonito conserva"],
    ["escarola", "escarola canonigos"],
    ["canonigo", "escarola canonigos"],
    ["canonigos", "escarola canonigos"],
    ["canonigos escarola", "escarola canonigos"],
    ["escarola canonigos", "escarola canonigos"],
  ] as Array<[string, string]> ).map(([alias, key]) => [simplifyMergeKey(alias), key]),
);

const ingredientMergeKey = (name: string) => {
  const simplified = simplifyMergeKey(name);
  if (!simplified) return "";
  const exactKey = exactEquivalentKeys.get(simplified);
  if (exactKey) return exactKey;

  const words = new Set(simplified.split(" "));
  const hasTunaLike = words.has("atun") || words.has("bonito");
  const hasConserveLike =
    words.has("lata") || words.has("conserva") || words.has("natural");
  if (hasTunaLike && hasConserveLike) return "atun bonito conserva";

  const hasEscarola = words.has("escarola");
  const hasCanonigos = words.has("canonigo");
  if (hasEscarola || hasCanonigos) return "escarola canonigos";

  return simplified;
};

const mergeRecipeRowPayload = (
  existing: any,
  source: any,
  target: IngredientRow,
) => ({
  ingredient_id: existing.ingredient_id || target.id,
  quantity: existing.quantity ?? source.quantity ?? null,
  unit_type: existing.unit_type || source.unit_type || null,
  is_confirmed: Boolean(existing.is_confirmed || source.is_confirmed),
  is_suggested: Boolean(existing.is_suggested && !source.is_confirmed),
  needs_review: Boolean(existing.needs_review || source.needs_review),
});

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
    const key = ingredientMergeKey(item.name || "");
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
    if (!target) continue;
    const sources = sorted.slice(1);
    const targetNormalized =
      target.normalized_name || normalizeIngredientName(target.name);

    for (const source of sources) {
      const { data: linkedRecipeRows, error: linkedRowsError } = await supabase
        .from("recipe_ingredients")
        .select("*")
        .eq("ingredient_id", source.id);
      if (linkedRowsError) {
        throw createError({
          statusCode: 500,
          statusMessage: linkedRowsError.message,
        });
      }

      for (const row of linkedRecipeRows || []) {
        const { data: existingTargetRow, error: existingTargetError } =
          await supabase
            .from("recipe_ingredients")
            .select("*")
            .eq("recipe_id", row.recipe_id)
            .eq("normalized_name", targetNormalized)
            .neq("id", row.id)
            .maybeSingle();
        if (existingTargetError) {
          throw createError({
            statusCode: 500,
            statusMessage: existingTargetError.message,
          });
        }

        if (existingTargetRow?.id) {
          const { error: updateExistingError } = await supabase
            .from("recipe_ingredients")
            .update(mergeRecipeRowPayload(existingTargetRow, row, target))
            .eq("id", existingTargetRow.id);
          if (updateExistingError) {
            throw createError({
              statusCode: 500,
              statusMessage: updateExistingError.message,
            });
          }

          const { error: deleteDuplicateRowError } = await supabase
            .from("recipe_ingredients")
            .delete()
            .eq("id", row.id);
          if (deleteDuplicateRowError) {
            throw createError({
              statusCode: 500,
              statusMessage: deleteDuplicateRowError.message,
            });
          }
        } else {
          const { error: recipeUpdateError } = await supabase
            .from("recipe_ingredients")
            .update({
              ingredient_id: target.id,
              name: target.name,
              normalized_name: targetNormalized,
            })
            .eq("id", row.id);
          if (recipeUpdateError) {
            throw createError({
              statusCode: 500,
              statusMessage: recipeUpdateError.message,
            });
          }
        }

        updatedRecipeLinks += 1;
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

      const { data: orphanRows, error: orphanRowsError } = await supabase
        .from("recipe_ingredients")
        .select("*")
        .is("ingredient_id", null)
        .eq("normalized_name", normalizeIngredientName(source.name));
      if (orphanRowsError) {
        throw createError({
          statusCode: 500,
          statusMessage: orphanRowsError.message,
        });
      }

      for (const row of orphanRows || []) {
        const { data: existingTargetRow, error: existingTargetError } =
          await supabase
            .from("recipe_ingredients")
            .select("*")
            .eq("recipe_id", row.recipe_id)
            .eq("normalized_name", targetNormalized)
            .neq("id", row.id)
            .maybeSingle();
        if (existingTargetError) {
          throw createError({
            statusCode: 500,
            statusMessage: existingTargetError.message,
          });
        }

        if (existingTargetRow?.id) {
          const { error: updateExistingError } = await supabase
            .from("recipe_ingredients")
            .update(mergeRecipeRowPayload(existingTargetRow, row, target))
            .eq("id", existingTargetRow.id);
          if (updateExistingError) {
            throw createError({
              statusCode: 500,
              statusMessage: updateExistingError.message,
            });
          }

          const { error: deleteDuplicateRowError } = await supabase
            .from("recipe_ingredients")
            .delete()
            .eq("id", row.id);
          if (deleteDuplicateRowError) {
            throw createError({
              statusCode: 500,
              statusMessage: deleteDuplicateRowError.message,
            });
          }
        } else {
          const { error: orphanRecipeRowsError } = await supabase
            .from("recipe_ingredients")
            .update({
              ingredient_id: target.id,
              name: target.name,
              normalized_name: targetNormalized,
            })
            .eq("id", row.id);
          if (orphanRecipeRowsError) {
            throw createError({
              statusCode: 500,
              statusMessage: orphanRecipeRowsError.message,
            });
          }
        }

        updatedRecipeLinks += 1;
      }

      const { error: deleteError } = await supabase
        .from("ingredients")
        .delete()
        .eq("id", source.id);
      if (deleteError) {
        throw createError({
          statusCode: 500,
          statusMessage: deleteError.message,
        });
      }

      mergedIngredients += 1;
    }
  }

  return {
    success: true,
    merged_ingredients: mergedIngredients,
    updated_recipe_links: updatedRecipeLinks,
  };
});
