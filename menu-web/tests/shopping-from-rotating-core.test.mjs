import test from "node:test";
import assert from "node:assert/strict";
import {
  consolidateShoppingRowsFromPortions,
  persistShoppingListRows,
} from "../server/utils/shopping-from-rotating-core.js";

const createSupabaseStub = () => {
  const operations = [];

  const buildDeleteChain = () => {
    const filters = [];
    const chain = {
      eq(column, value) {
        filters.push({ column, value });
        return chain;
      },
      then(resolve) {
        operations.push({ type: "delete", filters });
        return Promise.resolve({ error: null }).then(resolve);
      },
      catch(reject) {
        return Promise.resolve({ error: null }).catch(reject);
      },
    };
    return chain;
  };

  return {
    operations,
    from(table) {
      return {
        delete() {
          operations.push({ type: "delete:start", table });
          return buildDeleteChain();
        },
        insert(rows) {
          operations.push({ type: "insert", table, rows });
          return Promise.resolve({ error: null });
        },
        upsert(rows, options) {
          operations.push({ type: "upsert", table, rows, options });
          return Promise.resolve({ error: null });
        },
      };
    },
  };
};

test("does not clear previous shopping rows when clearExisting is false", async () => {
  const supabase = createSupabaseStub();

  await persistShoppingListRows({
    supabase,
    userId: "user-1",
    weekStart: "2026-06-07",
    rows: [{ item_name: "Tomate", quantity_grams: 500 }],
    clearExisting: false,
  });

  assert.equal(
    supabase.operations.some((operation) => operation.type === "delete"),
    false,
  );
  assert.equal(
    supabase.operations.some((operation) => operation.type === "upsert"),
    true,
  );
});

test("clears previous shopping rows when clearExisting is true", async () => {
  const supabase = createSupabaseStub();

  await persistShoppingListRows({
    supabase,
    userId: "user-1",
    weekStart: "2026-06-07",
    rows: [{ item_name: "Tomate", quantity_grams: 500 }],
    clearExisting: true,
  });

  const deleteOperation = supabase.operations.find(
    (operation) => operation.type === "delete",
  );

  assert.ok(deleteOperation);
  assert.deepEqual(deleteOperation.filters, [
    { column: "user_id", value: "user-1" },
    { column: "week_start", value: "2026-06-07" },
  ]);
});

test("keeps ingredient_id when consolidating and persisting shopping rows", async () => {
  const supabase = createSupabaseStub();
  const rows = consolidateShoppingRowsFromPortions([
    {
      rotating_menu_meal_profile_ingredients: [
        {
          ingredient_id: "ing-tomate",
          name: "tomate",
          final_quantity: 100,
          unit_type: "g",
        },
        {
          ingredient_id: "ing-tomate",
          name: "tomate",
          final_quantity: 50,
          unit_type: "g",
        },
      ],
    },
  ]);

  assert.equal(rows[0].ingredient_id, "ing-tomate");

  await persistShoppingListRows({
    supabase,
    userId: "user-1",
    weekStart: "2026-06-07",
    rows,
    clearExisting: false,
  });

  const insertOperation = supabase.operations.find(
    (operation) => operation.type === "upsert",
  );

  assert.equal(insertOperation.rows[0].ingredient_id, "ing-tomate");
});

test("ignores duplicate shopping ingredients instead of failing unique constraints", async () => {
  const supabase = createSupabaseStub();

  await persistShoppingListRows({
    supabase,
    userId: "user-1",
    weekStart: "2026-06-07",
    rows: [{ ingredient_id: "ing-tomate", item_name: "Tomate", quantity_grams: 500 }],
    clearExisting: false,
  });

  const upsertOperation = supabase.operations.find(
    (operation) => operation.type === "upsert",
  );

  assert.deepEqual(upsertOperation.options, {
    ignoreDuplicates: true,
    onConflict: "user_id,week_start,ingredient_id",
  });
});
