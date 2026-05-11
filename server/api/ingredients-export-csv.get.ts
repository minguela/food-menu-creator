import { createSupabaseAdminClient } from "~/server/utils/supabase-admin";

const escapeCsv = (value: unknown) => {
  if (value == null) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const supabase = createSupabaseAdminClient(config);

  const { data, error } = await supabase
    .from("ingredients")
    .select(
      "name,english_name,normalized_name,default_unit_type,kcal_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g",
    )
    .order("name", { ascending: true });

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  const lines = [
    "name,english_name,normalized_name,default_unit_type,kcal_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g",
  ];
  for (const row of data || []) {
    lines.push(
      [
        escapeCsv(row.name),
        escapeCsv((row as any).english_name),
        escapeCsv(row.normalized_name),
        escapeCsv(row.default_unit_type),
        escapeCsv(row.kcal_per_100g),
        escapeCsv(row.protein_per_100g),
        escapeCsv(row.carbs_per_100g),
        escapeCsv(row.fat_per_100g),
      ].join(","),
    );
  }

  setHeader(event, "Content-Type", "text/csv; charset=utf-8");
  setHeader(
    event,
    "Content-Disposition",
    `attachment; filename="ingredients-export-${new Date().toISOString().slice(0, 10)}.csv"`,
  );
  return lines.join("\n");
});
