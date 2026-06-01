import { createSupabaseAdminClient } from "~~/server/utils/supabase-admin";
import { buildEnglishAliasForIngredient } from "~~/server/utils/ingredient-aliases";

export default defineEventHandler(async (event) => {
  const body = (await readBody(event).catch(() => ({}))) as { limit?: number };
  const limit = Math.min(500, Math.max(1, Number(body?.limit) || 500));

  const config = useRuntimeConfig(event);
  const supabase = createSupabaseAdminClient(config);

  const { data: ingredients, error } = await supabase
    .from("ingredients")
    .select("id,name,normalized_name")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  let mapped = 0;
  const errors: string[] = [];

  for (const ingredient of ingredients || []) {
    try {
      const alias = buildEnglishAliasForIngredient(ingredient.name);
      const { error: upsertError } = await supabase
        .from("ingredient_aliases")
        .upsert(
          {
            ingredient_id: ingredient.id,
            alias_es: alias.aliasEs,
            alias_en: alias.aliasEn,
            normalized_alias_es: alias.normalizedAliasEs,
            normalized_alias_en: alias.normalizedAliasEn,
            source: alias.source,
          },
          { onConflict: "normalized_alias_es" },
        );
      if (upsertError) throw upsertError;
      mapped += 1;
    } catch (mapError) {
      errors.push(
        `${ingredient.id}: ${mapError instanceof Error ? mapError.message : "unknown"}`,
      );
    }
  }

  return {
    success: true,
    processed: (ingredients || []).length,
    mapped,
    errors,
  };
});

