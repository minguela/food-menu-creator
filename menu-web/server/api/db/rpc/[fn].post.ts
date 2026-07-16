// POST /api/db/rpc/[fn] — RPC proxy for stored procedures
import { defineEventHandler, readBody, createError } from 'h3';
import db from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  const fn = getRouterParam(event, 'fn');
  if (!fn) throw createError({ statusCode: 400, statusMessage: 'Function name required' });

  const params = await readBody(event);
  const { data, error } = await db.rpc(fn, params || {});
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });

  return data;
});
