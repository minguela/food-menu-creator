<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Ingredientes maestros</h1>
        <p class="text-sm text-gray-500">
          Base nutricional por 100g para cálculos del menú rotativo.
        </p>
      </div>
      <button
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        @click="addIngredient"
      >
        Nuevo ingrediente
      </button>
    </header>

    <section class="bg-white rounded-lg border p-4">
      <input
        v-model.trim="query"
        class="w-full border rounded-lg px-3 py-2"
        placeholder="Buscar ingrediente..."
      />
    </section>

    <section class="bg-white rounded-lg border overflow-hidden">
      <div
        class="grid grid-cols-[1.4fr_80px_80px_80px_80px_90px_80px] gap-2 p-3 text-xs font-semibold text-gray-600 border-b"
      >
        <span>Ingrediente</span><span>kcal</span><span>P</span><span>H</span
        ><span>G</span><span>Unidad</span><span>Verif.</span>
      </div>
      <div
        v-for="row in filtered"
        :key="row.id"
        class="grid grid-cols-[1.4fr_80px_80px_80px_80px_90px_80px] gap-2 p-3 border-b items-center"
      >
        <input
          v-model.trim="row.name"
          class="border rounded px-2 py-1 text-sm"
        />
        <input
          v-model.number="row.kcal_per_100g"
          type="number"
          min="0"
          step="0.1"
          class="border rounded px-2 py-1 text-sm"
        />
        <input
          v-model.number="row.protein_per_100g"
          type="number"
          min="0"
          step="0.1"
          class="border rounded px-2 py-1 text-sm"
        />
        <input
          v-model.number="row.carbs_per_100g"
          type="number"
          min="0"
          step="0.1"
          class="border rounded px-2 py-1 text-sm"
        />
        <input
          v-model.number="row.fat_per_100g"
          type="number"
          min="0"
          step="0.1"
          class="border rounded px-2 py-1 text-sm"
        />
        <select
          v-model="row.default_unit_type"
          class="border rounded px-2 py-1 text-sm"
        >
          <option v-for="unit in unitTypes" :key="unit" :value="unit">
            {{ unit }}
          </option>
        </select>
        <label class="inline-flex items-center justify-center">
          <input v-model="row.is_verified" type="checkbox" />
        </label>
        <div class="col-span-7 flex justify-end gap-2">
          <button class="text-xs text-indigo-700" @click="save(row)">
            Guardar
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { logError } from "~/utils/log-error";
import type { Ingredient } from "~/types";

type IngredientRow = Ingredient & {
  default_unit_type: "kg" | "g" | "l" | "ml" | "ud" | "pack" | "unidad";
  is_verified: boolean;
};

const supabase = useSupabase();
const query = ref("");
const rows = ref<IngredientRow[]>([]);
const unitTypes: Array<"kg" | "g" | "l" | "ml" | "ud" | "pack" | "unidad"> = [
  "g",
  "kg",
  "ml",
  "l",
  "ud",
  "pack",
  "unidad",
];

const filtered = computed(() => {
  const q = query.value.toLowerCase();
  if (!q) return rows.value;
  return rows.value.filter((item) => item.name.toLowerCase().includes(q));
});

const load = async () => {
  const { data } = await supabase
    .from("ingredients")
    .select("*")
    .order("name", { ascending: true })
    .limit(500);
  rows.value = (data || []).map((row: any) => ({
    ...row,
    default_unit_type: row.default_unit_type || row.unit_type || "g",
    is_verified: Boolean(row.is_verified),
  }));
};

const addIngredient = () => {
  rows.value.unshift({
    id: `tmp-${Date.now()}` as any,
    name: "",
    normalized_name: "",
    unit_type: "g",
    default_unit_type: "g",
    kcal_per_100g: null,
    protein_per_100g: null,
    carbs_per_100g: null,
    fat_per_100g: null,
    source: "manual",
    is_verified: false,
    created_at: new Date().toISOString(),
  } as IngredientRow);
};

const save = async (row: IngredientRow) => {
  if (!row.name.trim()) return;
  const payload = {
    name: row.name.trim(),
    normalized_name: row.name.toLowerCase().trim(),
    default_unit_type: row.default_unit_type,
    unit_type: row.default_unit_type,
    kcal_per_100g: row.kcal_per_100g,
    protein_per_100g: row.protein_per_100g,
    carbs_per_100g: row.carbs_per_100g,
    fat_per_100g: row.fat_per_100g,
    source: row.source || "manual",
    is_verified: !!row.is_verified,
  };
  try {
    if (String(row.id).startsWith("tmp-")) {
      await supabase.from("ingredients").insert(payload);
    } else {
      await supabase.from("ingredients").update(payload).eq("id", row.id);
    }
    await load();
  } catch (error) {
    await logError("web", error, { context: "ingredients.save" });
  }
};

onMounted(load);
</script>
