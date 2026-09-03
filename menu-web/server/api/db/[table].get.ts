// GET /api/db/[table] — Generic DB read proxy for client-side queries
// Replaces direct Supabase client queries from the browser
import { defineEventHandler, getQuery, createError } from 'h3';
import db from '~~/server/utils/db';
import { signImageUrls } from '~~/server/utils/private-blob';

export default defineEventHandler(async (event) => {
  const table = getRouterParam(event, 'table');
  if (!table) throw createError({ statusCode: 400, statusMessage: 'Table name required' });
  const tableName = table === 'menus' ? 'weekly_menus' : table;

  const query = getQuery(event);
  const { select, order, limit, single, ...filters } = query;

  let q = db.from(tableName).select(String(select || '*'));

  // Apply filters
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;
    const val = String(value);
    if (key.startsWith('neq.')) {
      q = q.neq(key.slice(4), val);
    } else if (key.startsWith('in.')) {
      q = q.in(key.slice(3), val.split(','));
    } else {
      q = q.eq(key, val);
    }
  }

  // Order
  if (order) {
    const [col, dir] = String(order).split(':');
    q = q.order(col, { ascending: dir !== 'desc' });
  }

  // Limit
  if (limit) q = q.limit(Number(limit));

  // Single
  if (single === 'single') q = q.single();
  else if (single === 'maybeSingle') q = q.maybeSingle();

  const { data, error } = await q;
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });

  return signImageUrls(tableName, data);
});
