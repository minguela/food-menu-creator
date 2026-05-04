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
      <div class="grid gap-2 md:grid-cols-[1fr_auto]">
        <input
          v-model.trim="query"
          class="w-full border rounded-lg px-3 py-2"
          placeholder="Buscar ingrediente..."
        />
        <button
          class="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
          :disabled="searchingUsda || !query"
          @click="searchUsda"
        >
          {{ searchingUsda ? "Buscando..." : "Buscar en USDA" }}
        </button>
      </div>
    </section>

    <section class="bg-white rounded-lg border p-4 space-y-2">
      <h2 class="font-semibold text-gray-900">Importar CSV</h2>
      <p class="text-xs text-gray-500">
        Cabeceras:
        `name,normalized_name,default_unit_type,kcal_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,source,external_id,barcode,is_verified`
      </p>
      <textarea
        v-model="csvInput"
        class="w-full min-h-[140px] border rounded-lg px-3 py-2 text-sm"
        placeholder="name,normalized_name,default_unit_type,kcal_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,source,external_id,barcode,is_verified"
      />
      <div class="flex gap-2">
        <button
          class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          :disabled="importingCsv || !csvInput.trim()"
          @click="importCsv"
        >
          {{ importingCsv ? "Importando..." : "Importar CSV" }}
        </button>
      </div>
    </section>

    <section
      v-if="usdaCandidates.length > 0"
      class="bg-white rounded-lg border p-4 space-y-2"
    >
      <h2 class="font-semibold text-gray-900">Candidatos USDA</h2>
      <p class="text-xs text-gray-500">
        No se guarda nada automáticamente: selecciona y confirma manualmente.
      </p>
      <div
        v-for="candidate in usdaCandidates"
        :key="candidate.external_id"
        class="border rounded-lg p-3"
      >
        <p class="font-medium text-gray-900">{{ candidate.name }}</p>
        <p class="text-xs text-gray-500">
          {{ candidate.nutrients.kcal_per_100g ?? "?" }} kcal · P
          {{ candidate.nutrients.protein_per_100g ?? "?" }} · H
          {{ candidate.nutrients.carbs_per_100g ?? "?" }} · G
          {{ candidate.nutrients.fat_per_100g ?? "?" }}
        </p>
        <div class="mt-2 flex gap-2">
          <button
            class="text-xs text-indigo-700"
            @click="createFromCandidate(candidate)"
          >
            Crear ingrediente desde candidato
          </button>
        </div>
      </div>
    </section>

    <section class="bg-white rounded-lg border overflow-hidden">
      <div
        class="grid grid-cols-[1.2fr_80px_80px_80px_80px_90px_90px_90px] gap-2 p-3 text-xs font-semibold text-gray-600 border-b"
      >
        <span>Ingrediente</span><span>kcal</span><span>P</span><span>H</span
        ><span>G</span><span>Unidad</span><span>Fuente</span><span>Verif.</span>
      </div>
      <div
        v-for="row in filtered"
        :key="row.id"
        class="grid grid-cols-[1.2fr_80px_80px_80px_80px_90px_90px_90px] gap-2 p-3 border-b items-center"
      >
        <input
          v-model.trim="row.name"
          class="border rounded px-2 py-1 text-sm"
          placeholder="Nombre"
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
        <select v-model="row.source" class="border rounded px-2 py-1 text-sm">
          <option value="manual">manual</option>
          <option value="system">system</option>
          <option value="imported">imported</option>
          <option value="usda">usda</option>
          <option value="open_food_facts">open_food_facts</option>
        </select>
        <label class="inline-flex items-center justify-center">
          <input v-model="row.is_verified" type="checkbox" />
        </label>
        <div class="col-span-8 flex justify-end gap-2">
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
import { normalizeIngredientName } from "~/utils/ingredient-normalize";
import type { Ingredient } from "~/types";

type IngredientRow = Ingredient & {
  default_unit_type: "kg" | "g" | "l" | "ml" | "ud" | "pack" | "unidad";
  is_verified: boolean;
  source: string;
  external_id?: string | null;
  barcode?: string | null;
  nutrition_status?: "complete" | "pending" | "needs_review";
};

const supabase = useSupabase();
const runtimeConfig = useRuntimeConfig();
const query = ref("");
const rows = ref<IngredientRow[]>([]);
const csvInput = ref("");
const importingCsv = ref(false);
const usdaCandidates = ref<any[]>([]);
const searchingUsda = ref(false);
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
    source: row.source || "manual",
  }));
};

const searchUsda = async () => {
  if (!query.value.trim()) return;
  searchingUsda.value = true;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken =
      session?.access_token || runtimeConfig.public.supabaseAnonKey;
    const response = await fetch(
      `${runtimeConfig.public.supabaseUrl}/functions/v1/ingredient-search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: runtimeConfig.public.supabaseAnonKey,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ query: query.value.trim() }),
      },
    );
    const payload = await response.json();
    usdaCandidates.value = Array.isArray(payload?.candidates)
      ? payload.candidates
      : [];
  } catch (error) {
    await logError("web", error, { context: "ingredients.searchUsda" });
  } finally {
    searchingUsda.value = false;
  }
};

const createFromCandidate = (candidate: any) => {
  rows.value.unshift({
    id: `tmp-${Date.now()}` as any,
    name: candidate.name,
    normalized_name: normalizeIngredientName(candidate.name),
    unit_type: "g",
    default_unit_type: "g",
    kcal_per_100g: candidate.nutrients.kcal_per_100g,
    protein_per_100g: candidate.nutrients.protein_per_100g,
    carbs_per_100g: candidate.nutrients.carbs_per_100g,
    fat_per_100g: candidate.nutrients.fat_per_100g,
    source: "usda",
    external_id: candidate.external_id,
    barcode: null,
    is_verified: true,
    nutrition_status:
      candidate.nutrients.kcal_per_100g != null &&
      candidate.nutrients.protein_per_100g != null &&
      candidate.nutrients.carbs_per_100g != null &&
      candidate.nutrients.fat_per_100g != null
        ? "complete"
        : "needs_review",
    created_at: new Date().toISOString(),
  } as IngredientRow);
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
    external_id: null,
    barcode: null,
    is_verified: false,
    nutrition_status: "pending",
    created_at: new Date().toISOString(),
  } as IngredientRow);
};

const save = async (row: IngredientRow) => {
  if (!row.name.trim()) return;
  const payload = {
    name: row.name.trim(),
    normalized_name: normalizeIngredientName(row.name),
    default_unit_type: row.default_unit_type,
    unit_type: row.default_unit_type,
    kcal_per_100g: row.kcal_per_100g,
    protein_per_100g: row.protein_per_100g,
    carbs_per_100g: row.carbs_per_100g,
    fat_per_100g: row.fat_per_100g,
    source: row.source || "manual",
    external_id: row.external_id || null,
    barcode: row.barcode || null,
    is_verified: !!row.is_verified,
    nutrition_status:
      row.kcal_per_100g != null &&
      row.protein_per_100g != null &&
      row.carbs_per_100g != null &&
      row.fat_per_100g != null
        ? "complete"
        : "pending",
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

const importCsv = async () => {
  if (!csvInput.value.trim()) return;
  importingCsv.value = true;
  try {
    await $fetch("/api/ingredients-import-csv", {
      method: "POST",
      body: { csv: csvInput.value },
    });
    csvInput.value = "";
    await load();
  } catch (error) {
    await logError("web", error, { context: "ingredients.importCsv" });
  } finally {
    importingCsv.value = false;
  }
};

onMounted(load);
</script>
