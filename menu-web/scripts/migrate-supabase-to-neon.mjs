import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";
import { Client } from "pg";

const SOURCE_TABLES = [
  "users",
  "person_profiles",
  "weekly_menus",
  "weekly_meals",
  "weekly_day_images",
  "weekly_meal_ingredients",
  "menu_images",
  "ingredients",
  "dishes",
  "dish_ingredients",
  "recipe_ingredients",
  "ingredient_aliases",
  "ingredient_mappings",
  "ingredient_nutrition_candidates",
  "shopping_lists",
  "saved_fixed_meals",
  "saved_fixed_meal_ingredients",
  "fixed_meal_profile_portions",
  "fixed_meal_profile_ingredients",
  "rotating_menus",
  "rotating_menu_profiles",
  "rotating_menu_days",
  "rotating_menu_meals",
  "rotating_menu_meal_ingredients",
  "rotating_menu_meal_profile_portions",
  "rotating_menu_meal_profile_ingredients",
  "monthly_menus",
  "compound_day_meals",
  "menu_generation_jobs",
  "menu_generation_logs",
  "ocr_image_cache",
  "error_logs",
  "dish_ingredient_suggestions",
];

const IMPORT_ORDER = [
  "users",
  "person_profiles",
  "ingredients",
  "menu_images",
  "dishes",
  "recipes",
  "weekly_menus",
  "weekly_meals",
  "weekly_day_images",
  "weekly_meal_ingredients",
  "dish_ingredients",
  "recipe_ingredients",
  "ingredient_aliases",
  "ingredient_mappings",
  "ingredient_nutrition_candidates",
  "shopping_lists",
  "saved_fixed_meals",
  "saved_fixed_meal_ingredients",
  "fixed_meal_profile_portions",
  "fixed_meal_profile_ingredients",
  "rotating_menus",
  "rotating_menu_profiles",
  "rotating_menu_days",
  "rotating_menu_meals",
  "rotating_menu_meal_ingredients",
  "rotating_menu_meal_profile_portions",
  "rotating_menu_meal_profile_ingredients",
  "monthly_menus",
  "compound_day_meals",
  "menu_generation_jobs",
  "menu_generation_logs",
  "ocr_image_cache",
  "error_logs",
  "dish_ingredient_suggestions",
];

const JSON_COLUMNS = new Set([
  "diagnostics",
  "input_payload",
  "result_payload",
  "metadata",
  "menu_data",
  "shopping_list",
  "raw_payload",
  "ingredients",
  "source_weekly_menu_ids",
]);

const CONFLICT_KEYS = {
  dish_ingredients: ["dish_id", "ingredient_id"],
  ocr_image_cache: ["file_hash"],
};

function parseEnvFile(contents) {
  const values = {};
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match) continue;
    const raw = match[2].trim();
    values[match[1]] = raw.startsWith('"') && raw.endsWith('"')
      ? JSON.parse(raw)
      : raw.replace(/^'|'$/g, "");
  }
  return values;
}

async function loadConfig() {
  const envFile = process.env.MIGRATION_ENV_FILE;
  const fileValues = envFile ? parseEnvFile(await readFile(envFile, "utf8")) : {};
  const env = { ...fileValues, ...process.env };
  const supabaseUrl = (env.NUXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const supabaseKey = env.NUXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const neonConnection = env.NEON_CONN || env.NEON_DATABASE_URL;

  if (!supabaseUrl || !supabaseKey || !neonConnection) {
    throw new Error("Migration requires Supabase public URL/key and NEON_CONN");
  }

  return { supabaseUrl, supabaseKey, neonConnection };
}

async function fetchSourceRows(config, table) {
  const rows = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const response = await fetch(
      `${config.supabaseUrl}/rest/v1/${table}?select=*`,
      {
        headers: {
          apikey: config.supabaseKey,
          Authorization: `Bearer ${config.supabaseKey}`,
          Prefer: "count=exact",
          Range: `${offset}-${offset + pageSize - 1}`,
        },
      },
    );

    const body = await response.text();
    if (!response.ok) {
      throw new Error(`Supabase read failed for ${table}: HTTP ${response.status} ${body.slice(0, 180)}`);
    }

    const page = body ? JSON.parse(body) : [];
    if (!Array.isArray(page)) throw new Error(`Supabase returned non-array data for ${table}`);
    rows.push(...page);
    if (page.length < pageSize) break;
    offset += page.length;
  }

  return rows;
}

function canonicalValue(value, key = "") {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) {
    const iso = value.toISOString();
    if (key.endsWith("_at")) return iso;
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${value.getFullYear()}-${month}-${day}`;
  }
  if (Array.isArray(value)) return value.map((item) => canonicalValue(item, key));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([name, item]) => [name, canonicalValue(item, name)]),
    );
  }
  if (typeof value === "string" && key.endsWith("_at")) {
    const date = new Date(value);
    if (!Number.isNaN(date.valueOf())) return date.toISOString();
  }
  if (typeof value === "string" && key.endsWith("_date")) {
    const date = new Date(value);
    if (!Number.isNaN(date.valueOf())) return date.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}

function hashRows(rows, keysForRow = null) {
  const normalized = rows
    .map((row) => {
      const keys = keysForRow ? keysForRow(row) : Object.keys(row);
      return Object.fromEntries(
        keys.sort().map((key) => [key, canonicalValue(row[key], key)]),
      );
    })
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

function toTargetRow(table, sourceRow) {
  if (table === "ingredient_aliases") {
    return {
      ...sourceRow,
      alias: sourceRow.alias_es || sourceRow.alias_en || sourceRow.normalized_alias_es,
    };
  }
  if (table === "rotating_menu_meal_profile_ingredients") {
    return { ...sourceRow, quantity: sourceRow.final_quantity };
  }
  return { ...sourceRow };
}

function recipeRowFromDish(dish) {
  return {
    id: dish.id,
    name: dish.name,
    user_id: dish.user_id,
    description: dish.description,
    servings: dish.servings ?? dish.servings_base,
    meal_type: dish.meal_type,
    tags: dish.tags || [],
    recipe_status: dish.recipe_status,
    is_special: dish.is_special,
    special_kcal_reserved: dish.special_kcal_reserved,
    created_at: dish.created_at,
    updated_at: dish.updated_at,
  };
}

function valueForColumn(column, value) {
  if (value === undefined) return null;
  if (JSON_COLUMNS.has(column) && value !== null) return JSON.stringify(value);
  return value;
}

async function getTargetColumns(client) {
  const result = await client.query(
    "select table_name,column_name from information_schema.columns where table_schema=$1",
    ["public"],
  );
  const columns = new Map();
  for (const row of result.rows) {
    if (!columns.has(row.table_name)) columns.set(row.table_name, new Set());
    columns.get(row.table_name).add(row.column_name);
  }
  return columns;
}

async function insertRows(client, table, rows, targetColumns) {
  if (rows.length === 0) return;
  const columns = [...targetColumns.get(table) || []];
  if (columns.length === 0) throw new Error(`Target table is missing: ${table}`);

  const conflictKeys = CONFLICT_KEYS[table] || ["id"];
  const insertedColumns = [...new Set(
    rows.flatMap((row) => Object.keys(row).filter((key) => columns.includes(key))),
  )];
  if (table === "ingredient_aliases" && !insertedColumns.includes("alias")) insertedColumns.push("alias");
  if (insertedColumns.length === 0) throw new Error(`No compatible columns for ${table}`);

  const quotedTable = `"${table}"`;
  const quotedColumns = insertedColumns.map((column) => `"${column}"`).join(", ");
  const updateColumns = insertedColumns.filter((column) => !conflictKeys.includes(column));
  const updateClause = updateColumns.length === 0
    ? "DO NOTHING"
    : `DO UPDATE SET ${updateColumns.map((column) => `"${column}" = EXCLUDED."${column}"`).join(", ")}`;

  for (const row of rows) {
    const values = insertedColumns.map((column) => valueForColumn(column, row[column]));
    const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
    await client.query(
      `INSERT INTO ${quotedTable} (${quotedColumns}) VALUES (${placeholders}) ON CONFLICT (${conflictKeys.map((key) => `"${key}"`).join(", ")}) ${updateClause}`,
      values,
    );
  }
}

async function countRows(client, table) {
  const result = await client.query(`SELECT count(*)::int AS count FROM "${table}"`);
  return result.rows[0].count;
}

async function readTargetRows(client, table) {
  const result = await client.query(`SELECT * FROM "${table}"`);
  return result.rows;
}

async function main() {
  const config = await loadConfig();
  const client = new Client({
    connectionString: config.neonConnection,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
  const source = {};

  for (const table of SOURCE_TABLES) {
    source[table] = await fetchSourceRows(config, table);
    console.log(`Read ${table}: ${source[table].length}`);
  }

  const dishes = source.dishes.map(recipeRowFromDish);
  const expectedRows = { ...source, recipes: dishes };

  await client.connect();
  try {
    const targetColumns = await getTargetColumns(client);
    await client.query("BEGIN");

    const targetNonIngredientTables = [
      "users", "person_profiles", "weekly_menus", "weekly_meals", "weekly_day_images",
      "weekly_meal_ingredients", "dishes", "recipes", "shopping_lists", "rotating_menus",
      "rotating_menu_days", "rotating_menu_meals", "rotating_menu_meal_profile_portions",
      "rotating_menu_meal_profile_ingredients", "saved_fixed_meals", "monthly_menus",
    ];
    const existingTargetRows = [];
    for (const table of targetNonIngredientTables) {
      const count = await countRows(client, table);
      if (count > 0) existingTargetRows.push(`${table}:${count}`);
    }
    if (existingTargetRows.length > 0) {
      throw new Error(`Target is not an empty migration target: ${existingTargetRows.join(", ")}`);
    }

    const sourceIngredientIds = source.ingredients.map((row) => row.id);
    if (sourceIngredientIds.length === 0) throw new Error("Source has no ingredients; refusing migration");
    await client.query(
      "DELETE FROM ingredients WHERE NOT (id = ANY($1::uuid[]))",
      [sourceIngredientIds],
    );

    for (const table of IMPORT_ORDER) {
      const rows = table === "recipes" ? dishes : source[table];
      await insertRows(client, table, rows.map((row) => toTargetRow(table, row)), targetColumns);
      console.log(`Imported ${table}: ${rows.length}`);
    }

    const manifest = { source: {}, target: {}, hashes: {}, importedAt: new Date().toISOString() };
    for (const table of Object.keys(expectedRows)) {
      manifest.source[table] = expectedRows[table].length;
      manifest.target[table] = await countRows(client, table);
      const targetRows = await readTargetRows(client, table);
      const compatibleKeys = Object.keys(toTargetRow(table, expectedRows[table][0] || {}))
        .filter((key) => targetColumns.get(table)?.has(key));
      const keySelector = (row) => compatibleKeys;
      manifest.hashes[table] = {
        source: hashRows(expectedRows[table].map((row) => toTargetRow(table, row)), keySelector),
        target: hashRows(targetRows, keySelector),
      };
      if (manifest.source[table] !== manifest.target[table]) {
        throw new Error(`Count mismatch for ${table}: source=${manifest.source[table]} target=${manifest.target[table]}`);
      }
      if (manifest.hashes[table].source !== manifest.hashes[table].target) {
        throw new Error(`Content hash mismatch for ${table}`);
      }
    }

    await client.query("COMMIT");
    const manifestPath = process.env.MIGRATION_MANIFEST || "/private/tmp/menu-planner-migration-manifest.json";
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), { mode: 0o600 });
    console.log(`Migration committed; manifest=${manifestPath}`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`Migration failed: ${error.message}`);
  process.exitCode = 1;
});
