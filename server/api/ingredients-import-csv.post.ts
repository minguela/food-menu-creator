import { createSupabaseAdminClient } from "~/server/utils/supabase-admin";
import { validateIngredientNutritionQuality } from "~/utils/ingredient-nutrition-quality";
import { classifyCaloricDensity } from "~/utils/caloric-density";

type CsvRow = {
  name: string;
  english_name?: string;
  normalized_name?: string;
  default_unit_type?: string;
  kcal_per_100g?: string;
  protein_per_100g?: string;
  carbs_per_100g?: string;
  fat_per_100g?: string;
  source?: string;
  external_id?: string;
  barcode?: string;
  is_verified?: string;
};

const normalizeIngredientName = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const parseNumber = (value?: string) => {
  if (!value || !value.trim()) return null;
  const normalized = value.replace(",", ".");
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
};

const parseCsv = (csv: string): CsvRow[] => {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headerLine = lines[0] || "";
  const headers = headerLine.split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = cells[idx] || "";
    });
    return row as CsvRow;
  });
};

export default defineEventHandler(async (event) => {
  const body = await readBody<{ csv?: string }>(event);
  const csv = String(body?.csv || "");
  if (!csv.trim()) {
    throw createError({ statusCode: 400, statusMessage: "CSV vacío" });
  }

  const config = useRuntimeConfig(event);
  const supabase = createSupabaseAdminClient(config);

  const rows = parseCsv(csv);
  if (rows.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "CSV sin filas válidas",
    });
  }

  const upserts = rows
    .filter((row) => row.name && row.name.trim())
    .map((row) => {
      const normalizedName = row.normalized_name?.trim()
        ? row.normalized_name.trim()
        : normalizeIngredientName(row.name);
      const kcal = parseNumber(row.kcal_per_100g);
      const protein = parseNumber(row.protein_per_100g);
      const carbs = parseNumber(row.carbs_per_100g);
      const fat = parseNumber(row.fat_per_100g);
      const quality = validateIngredientNutritionQuality({
        kcal_per_100g: kcal,
        protein_per_100g: protein,
        carbs_per_100g: carbs,
        fat_per_100g: fat,
      });
      const complete = quality.hasCompleteNutrition && !quality.needsReview;
      const reviewReason = !quality.hasCompleteNutrition
        ? "missing_required_macros"
        : quality.needsReview
          ? quality.warnings.join(" | ") || "nutrition_consistency_check_failed"
          : null;
      return {
        name: row.name.trim(),
        english_name: row.english_name?.trim() || null,
        normalized_name: normalizedName,
        default_unit_type: row.default_unit_type || "g",
        unit_type: row.default_unit_type || "g",
        kcal_per_100g: kcal,
        protein_per_100g: protein,
        carbs_per_100g: carbs,
        fat_per_100g: fat,
        source: "manual_csv",
        external_id: row.external_id || null,
        barcode: row.barcode || null,
        is_verified: complete,
        nutrition_status: complete ? "complete" : "needs_review",
        review_reason: reviewReason,
        caloric_density_level: classifyCaloricDensity(kcal),
      };
    });

  if (upserts.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "CSV sin ingredientes válidos",
    });
  }

  const { error } = await supabase
    .from("ingredients")
    .upsert(upserts, { onConflict: "normalized_name" });
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return {
    success: true,
    imported: upserts.length,
    completed: upserts.filter((row) => row.nutrition_status === "complete").length,
    needs_review: upserts.filter((row) => row.nutrition_status === "needs_review")
      .length,
  };
});
