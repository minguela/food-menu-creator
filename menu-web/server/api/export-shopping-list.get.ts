// GET /api/export-shopping-list — Replaces Supabase edge function
// Exports shopping list as text or CSV
import { defineEventHandler, getQuery, createError } from 'h3';
import db from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const userId = String(query.user_id || '').trim();
  const format = query.format === 'csv' ? 'csv' : 'text';

  if (!userId) throw createError({ statusCode: 400, statusMessage: 'user_id parameter required' });

  const { data: items, error } = await db
    .from('shopping_lists')
    .select('item_name, quantity_needed, quantity_grams, original_unit_type, purchased, ingredients(name, carrefour_category, unit_type)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw createError({ statusCode: 500, statusMessage: error.message });

  const rows = items || [];

  if (format === 'csv') {
    const csvRows = [['ingredient', 'quantity', 'unit', 'category']];
    for (const item of rows) {
      csvRows.push([
        item.item_name || item.ingredients?.name || 'Artículo',
        Math.round(Number(item.quantity_grams || item.quantity_needed || 0)),
        'g',
        item.ingredients?.carrefour_category || 'Otros',
      ]);
    }
    const csv = csvRows.map(row => row.map(v => csvEscape(v)).join(',')).join('\n');
    setHeader(event, 'Content-Type', 'text/csv;charset=utf-8');
    setHeader(event, 'Content-Disposition', 'attachment; filename=shopping-list.csv');
    return csv;
  }

  const text = rows.length === 0
    ? 'Shopping list is empty'
    : rows.map(item => {
        const name = item.item_name || item.ingredients?.name || 'Artículo';
        const qty = Math.round(Number(item.quantity_grams || item.quantity_needed || 0));
        return `${qty} g ${name}`;
      }).join('\n');

  setHeader(event, 'Content-Type', 'text/plain;charset=utf-8');
  return text;
});

function csvEscape(value: unknown): string {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
