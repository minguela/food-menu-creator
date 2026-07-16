// POST /api/expand-ingredients — Replaces Supabase edge function
// Matches dish names against ingredient_mappings table
import { defineEventHandler, readBody, createError } from 'h3';
import db from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  const { dishNames, userId } = await readBody(event);

  if (!dishNames || !Array.isArray(dishNames)) {
    throw createError({ statusCode: 400, statusMessage: 'dishNames array required' });
  }

  // Query ingredient mappings (global + user-specific)
  const { data: mappings, error } = await db
    .from('ingredient_mappings')
    .select('id, dish_name, aliases, ingredients');

  if (error) throw createError({ statusCode: 500, statusMessage: error.message });

  const mappingMap = new Map<string, any>();
  for (const m of mappings || []) {
    const normalized = (m.dish_name || '').toLowerCase().trim();
    mappingMap.set(normalized, m);
    for (const alias of m.aliases || []) {
      mappingMap.set(String(alias).toLowerCase().trim(), m);
    }
  }

  const results = dishNames.map((dishName: string) => {
    const normalized = dishName.toLowerCase().trim();
    const mapping = mappingMap.get(normalized);
    if (mapping) {
      return {
        original: dishName,
        expanded: true,
        ingredients: mapping.ingredients,
        mappingId: mapping.id,
      };
    }
    return { original: dishName, expanded: false, ingredients: [], mappingId: null };
  });

  return { success: true, results };
});
