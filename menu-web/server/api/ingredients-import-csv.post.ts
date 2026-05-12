import { createSupabaseAdminClient } from "~/server/utils/supabase-admin";
import { validateIngredientNutritionQuality } from "~/utils/ingredient-nutrition-quality";
import { classifyCaloricDensity } from "~/utils/caloric-density";
import type { CaloricDensityLevel } from "~/utils/caloric-density";

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

type ImportPayload = {
  csv?: string;
};

type PreparedIngredient = {
  name: string;
  english_name: string | null;
  normalized_name: string;
  default_unit_type: string;
  unit_type: string;
  kcal_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  source: "manual_csv";
  external_id: string | null;
  barcode: string | null;
  is_verified: boolean;
  nutrition_status: "complete" | "needs_review";
  review_reason: string | null;
  caloric_density_level: CaloricDensityLevel | null;
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
  const body = await readBody<ImportPayload>(event);
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

  const preparedRows = rows
    .filter((row) => row.name && row.name.trim())
    .map<PreparedIngredient>((row) => {
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

  if (preparedRows.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "CSV sin ingredientes válidos",
    });
  }

  const dedupedByNormalized = Array.from(
    new Map(preparedRows.map((row) => [row.normalized_name, row])).values(),
  );
  const duplicateRowsInCsv = preparedRows.length - dedupedByNormalized.length;

  const normalizedKeys = dedupedByNormalized.map((row) => row.normalized_name);
  const ingredientNames = dedupedByNormalized.map((row) => row.name);

  const [{ data: existingByNormalized, error: normalizedError }, { data: existingByName, error: nameError }] =
    await Promise.all([
      supabase
        .from("ingredients")
        .select("id,normalized_name,name")
        .in("normalized_name", normalizedKeys),
      supabase
        .from("ingredients")
        .select("id,normalized_name,name")
        .in("name", ingredientNames),
    ]);

  if (normalizedError || nameError) {
    throw createError({
      statusCode: 500,
      statusMessage:
        normalizedError?.message || nameError?.message || "Error consultando ingredientes existentes",
    });
  }

  const existingByNormalizedMap = new Map(
    (existingByNormalized || []).map((row: any) => [String(row.normalized_name), row]),
  );
  const existingByNameMap = new Map(
    (existingByName || []).map((row: any) => [String(row.name), row]),
  );

  const inserts: PreparedIngredient[] = [];
  const updates: Array<{ id: string; payload: PreparedIngredient }> = [];
  const conflicts: Array<{ name: string; reason: string }> = [];

  for (const row of dedupedByNormalized) {
    const existingByNormalizedRow = existingByNormalizedMap.get(row.normalized_name);
    const existingByNameRow = existingByNameMap.get(row.name);

    if (existingByNormalizedRow?.id) {
      updates.push({ id: String(existingByNormalizedRow.id), payload: row });
      continue;
    }

    if (existingByNameRow?.id) {
      updates.push({ id: String(existingByNameRow.id), payload: row });
      continue;
    }

    inserts.push(row);
  }

  if (inserts.length > 0) {
    const { error: insertError } = await supabase.from("ingredients").insert(inserts);
    if (insertError) {
      throw createError({ statusCode: 500, statusMessage: insertError.message });
    }
  }

  for (const rowUpdate of updates) {
    const { error: updateError } = await supabase
      .from("ingredients")
      .update(rowUpdate.payload)
      .eq("id", rowUpdate.id);
    if (updateError) {
      conflicts.push({
        name: rowUpdate.payload.name,
        reason: updateError.message,
      });
    }
  }

  if (conflicts.length > 0 && inserts.length === 0 && updates.length === 0) {
    throw createError({
      statusCode: 500,
      statusMessage: "No se pudo importar ningún ingrediente por conflictos",
    });
  }

  return {
    success: true,
    imported: inserts.length + updates.length,
    inserted: inserts.length,
    updated: updates.length - conflicts.length,
    skipped: duplicateRowsInCsv,
    conflicts,
    completed: dedupedByNormalized.filter((row) => row.nutrition_status === "complete")
      .length,
    needs_review: dedupedByNormalized.filter((row) => row.nutrition_status === "needs_review")
      .length,
  };
});
