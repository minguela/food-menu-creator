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
      <div class="flex flex-wrap items-center gap-2">
        <button
          class="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          :disabled="selectedIds.length === 0"
          @click="deleteSelected"
        >
          Eliminar seleccionados ({{ selectedIds.length }})
        </button>
        <span class="text-xs text-gray-500">
          Valores nutricionales expresados por 100 g.
        </span>
      </div>
    </section>

    <section class="bg-emerald-50 rounded-lg border border-emerald-200 p-4">
      <div class="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h2 class="text-lg font-bold text-emerald-900">Expansiones de ingredientes</h2>
          <p class="text-sm text-emerald-700">
            Define qué ingredientes se añaden al crear platos desde OCR.
          </p>
        </div>
        <button
          class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          @click="openExpansionModal()"
        >
          + Nueva expansión
        </button>
      </div>

      <div v-if="loadingExpansions" class="text-center py-4 text-emerald-600">
        Cargando...
      </div>
      <div v-else-if="expansionMappings.length === 0" class="text-center py-4 text-emerald-600">
        No hay expansiones. Crea una para empezar.
      </div>
      <div v-else class="grid gap-2 md:grid-cols-2">
        <div
          v-for="m in expansionMappings"
          :key="m.id"
          class="bg-white rounded border p-2 flex justify-between items-start"
        >
          <div>
            <p class="font-medium text-sm">{{ m.dish_name }}</p>
            <p class="text-xs text-gray-500">
              {{ m.ingredients?.length || 0 }} ingredientes
              <span v-if="m.is_global" class="text-blue-600 ml-1">[Global]</span>
            </p>
          </div>
          <div class="flex gap-1">
            <button class="text-xs text-indigo-600" @click="openExpansionModal(m)">Edit</button>
            <button class="text-xs text-red-600" @click="deleteExpansion(m.id)">Del</button>
          </div>
        </div>
      </div>
    </section>

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
          @click="searchFoods"
        >
          {{ searchingUsda ? "Buscando..." : "Buscar alimentos" }}
        </button>
      </div>
      <div class="mt-3 flex flex-wrap items-center gap-2">
        <button
          v-for="option in filterOptions"
          :key="option.value"
          class="rounded-full border px-3 py-1.5 text-xs font-medium"
          :class="
            filterMode === option.value
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          "
          @click="filterMode = option.value"
        >
          {{ option.label }} {{ option.count }}
        </button>
      </div>
      <div class="mt-2">
        <label class="text-xs text-gray-600 block mb-1">Fuente</label>
        <select
          v-model="searchSource"
          class="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="open_food_facts">Open Food Facts</option>
          <option value="usda">USDA</option>
          <option value="bedca">BEDCA (próximamente)</option>
        </select>
      </div>
      <div class="mt-3 flex items-center gap-2">
        <button
          class="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
          :disabled="enriching"
          @click="runEnrichment"
        >
          {{
            enriching
              ? "Enriqueciendo..."
              : selectedIds.length > 0
                ? `Enriquecer seleccionados (${selectedIds.length})`
                : query
                  ? "Enriquecer por búsqueda"
                  : "Enriquecer siguiente pendiente"
          }}
        </button>
        <button
          class="px-3 py-2 border rounded-lg text-xs text-gray-700 disabled:opacity-50"
          :disabled="mergingDuplicates"
          @click="mergeDuplicateIngredients"
        >
          {{
            mergingDuplicates
              ? "Fusionando..."
              : "Fusionar duplicados/equivalentes"
          }}
        </button>
        <span v-if="enrichSummary" class="text-xs text-gray-600">
          Procesados {{ enrichSummary.processed }} · completos
          {{ enrichSummary.completed }} · revisión
          {{ enrichSummary.needs_review }} · no encontrados
          {{ enrichSummary.not_found }}
        </span>
        <button
          class="px-3 py-2 border rounded-lg text-xs text-gray-700 disabled:opacity-50"
          :disabled="backfillingAliases"
          @click="backfillAliases"
        >
          {{ backfillingAliases ? "Mapeando..." : "Mapear ES→EN (USDA)" }}
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
      <h2 class="font-semibold text-gray-900">Candidatos nutricionales</h2>
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
            @click="saveIngredientFromCandidate(candidate)"
          >
            Guardar candidato
          </button>
        </div>
      </div>
    </section>

    <section
      v-if="reviewCandidates.length > 0"
      class="rounded-lg border border-sky-100 bg-sky-50 p-3 text-xs text-sky-800"
    >
      Hay {{ reviewCandidates.length }} sugerencias pendientes repartidas en
      las tarjetas de sus ingredientes.
    </section>

    <section class="space-y-3">
      <div
        class="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4"
      >
        <label class="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            :checked="allFilteredSelected"
            @change="toggleSelectAllFiltered"
          />
          Seleccionar visibles
        </label>
        <div class="text-xs text-gray-500">
          Mostrando {{ filtered.length }} de {{ rows.length }} ingredientes
        </div>
      </div>

      <IngredientCard
        v-for="row in filtered"
        :key="row.id"
        :row="row"
        :original="originalForRow(row.id)"
        :quality="qualityForRow(row)"
        :changed-fields="changedFieldsForRow(row)"
        :selected="isSelected(row.id)"
        :active="activeIngredientId === row.id"
        :saving="savingStatusForRow(row.id) === 'saving'"
        :save-state="savingStatusForRow(row.id)"
        :enriching="isRowEnriching(row.id)"
        :is-temporary="String(row.id).startsWith('tmp-')"
        :is-first="filtered.findIndex((item) => item.id === row.id) === 0"
        :is-last="
          filtered.findIndex((item) => item.id === row.id) ===
          filtered.length - 1
        "
        :unit-types="unitTypes"
        :recipes="recipesForIngredient(row.id)"
        :candidates="candidatesForIngredient(row.id)"
        @patch="patchRow(row.id, $event)"
        @save="save(row)"
        @save-next="save(row, { goNext: true })"
        @enrich="enrichOne(row)"
        @autocomplete="autocompleteRow(row)"
        @restore-original="restoreOriginal(row)"
        @toggle-selected="toggleSelected(row.id)"
        @previous="moveActive(row.id, -1)"
        @next="moveActive(row.id, 1)"
        @delete="deleteOne(row.id)"
        @apply-candidate="applyCandidate"
      />
    </section>
  </div>
<div v-if="showExpansionModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showExpansionModal = false">
  <div class="bg-white rounded-lg p-4 w-full max-w-md">
    <h2 class="text-lg font-bold mb-4">{{ editingExpansion ? 'Editar' : 'Nueva' }} expansión</h2>
    <div class="space-y-3">
      <div>
        <label class="block text-sm font-medium">Nombre del plato</label>
        <input v-model="expansionForm.dishName" class="w-full border rounded px-2 py-1" placeholder="ej: tortilla" />
      </div>
      <div>
        <label class="block text-sm font-medium">Alias (separados por coma)</label>
        <input v-model="expansionForm.aliases" class="w-full border rounded px-2 py-1" placeholder="ej: tortilla española, tortilla de patatas" />
      </div>
      <div>
        <label class="block text-sm font-medium">Ingredientes (JSON)</label>
        <textarea v-model="expansionForm.ingredients" class="w-full border rounded px-2 py-1 font-mono text-xs" rows="4" placeholder='[{"name": "huevos", "quantity": 3, "unit_type": "ud"}]'></textarea>
      </div>
      <div>
        <label class="flex items-center gap-2">
          <input v-model="expansionForm.isGlobal" type="checkbox" />
          <span class="text-sm">Regla global (visible a todos)</span>
        </label>
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button class="px-3 py-1 border rounded" @click="showExpansionModal = false">Cancelar</button>
      <button class="px-3 py-1 bg-emerald-600 text-white rounded" @click="saveExpansion">Guardar</button>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { logError } from "~/utils/log-error";
import { normalizeIngredientName } from "~/utils/ingredient-normalize";
import { validateIngredientNutritionQuality } from "~/utils/ingredient-nutrition-quality";
import { saveIngredientFromCandidate as persistCandidate } from "~/utils/save-ingredient-from-candidate";
import type { Ingredient } from "~/types";

type IngredientRow = Ingredient & {
  default_unit_type: "kg" | "g" | "l" | "ml" | "ud" | "pack" | "unidad";
  is_verified: boolean;
  source: string;
  external_id?: string | null;
  barcode?: string | null;
  nutrition_status?: "complete" | "pending" | "needs_review" | "not_found";
};
type EnrichSummary = {
  processed: number;
  completed: number;
  needs_review: number;
  not_found: number;
};
type ReviewCandidate = {
  id: string;
  ingredient_id: string;
  source: string;
  name: string;
  kcal_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  confidence: number;
};
type RecipeLink = {
  id: string;
  name: string;
};
type FilterMode = "all" | "review" | "incomplete" | "inconsistent" | "ok";
type SaveState = "idle" | "saving" | "success" | "error";
type OriginalIngredientSnapshot = Pick<
  IngredientRow,
  | "name"
  | "default_unit_type"
  | "kcal_per_100g"
  | "protein_per_100g"
  | "carbs_per_100g"
  | "fat_per_100g"
  | "source"
>;

const supabase = useSupabase();
const query = ref("");
const rows = ref<IngredientRow[]>([]);
const originalsById = ref<Record<string, OriginalIngredientSnapshot>>({});
const csvInput = ref("");
const importingCsv = ref(false);
const usdaCandidates = ref<any[]>([]);
const searchingUsda = ref(false);
const searchSource = ref<"usda" | "open_food_facts" | "bedca">(
  "open_food_facts",
);
const enriching = ref(false);
const enrichSummary = ref<EnrichSummary | null>(null);
const mergingDuplicates = ref(false);
const backfillingAliases = ref(false);
const reviewCandidates = ref<ReviewCandidate[]>([]);
const selectedIds = ref<string[]>([]);
const enrichingRowIds = ref<string[]>([]);
const savingRowStates = ref<Record<string, SaveState>>({});
const activeIngredientId = ref<string | null>(null);
const filterMode = ref<FilterMode>("all");
const recipeLinksByIngredientId = ref<Record<string, RecipeLink[]>>({});
const unitTypes: Array<"kg" | "g" | "l" | "ml" | "ud" | "pack" | "unidad"> = [
  "g",
  "kg",
  "ml",
  "l",
  "ud",
  "pack",
  "unidad",
];

const qualityForRow = (row: IngredientRow) =>
  validateIngredientNutritionQuality({
    kcal_per_100g: row.kcal_per_100g,
    protein_per_100g: row.protein_per_100g,
    carbs_per_100g: row.carbs_per_100g,
    fat_per_100g: row.fat_per_100g,
  });

const filtered = computed(() => {
  const q = query.value.toLowerCase();
  return rows.value.filter((item) => {
    const byName = item.name.toLowerCase().includes(q);
    const byNormalized = String(item.normalized_name || "")
      .toLowerCase()
      .includes(q);
    const matchesSearch = !q || byName || byNormalized;
    if (!matchesSearch) return false;

    const quality = qualityForRow(item);
    if (filterMode.value === "review") {
      return item.nutrition_status === "needs_review" || quality.needsReview;
    }
    if (filterMode.value === "incomplete") {
      return quality.status === "incomplete";
    }
    if (filterMode.value === "inconsistent") {
      return quality.status === "inconsistent";
    }
    if (filterMode.value === "ok") {
      return quality.status === "ok";
    }
    return true;
  });
});

const filterStats = computed(() => {
  return rows.value.reduce(
    (stats, row) => {
      const quality = qualityForRow(row);
      stats.all += 1;
      if (row.nutrition_status === "needs_review" || quality.needsReview) {
        stats.review += 1;
      }
      if (quality.status === "incomplete") stats.incomplete += 1;
      if (quality.status === "inconsistent") stats.inconsistent += 1;
      if (quality.status === "ok") stats.ok += 1;
      return stats;
    },
    { all: 0, review: 0, incomplete: 0, inconsistent: 0, ok: 0 },
  );
});

const filterOptions = computed<Array<{ value: FilterMode; label: string; count: number }>>(
  () => [
    { value: "all", label: "Todos", count: filterStats.value.all },
    { value: "review", label: "A revisar", count: filterStats.value.review },
    {
      value: "incomplete",
      label: "Incompletos",
      count: filterStats.value.incomplete,
    },
    {
      value: "inconsistent",
      label: "Inconsistentes",
      count: filterStats.value.inconsistent,
    },
    { value: "ok", label: "OK", count: filterStats.value.ok },
  ],
);

const allFilteredSelected = computed(() => {
  const visibleIds = filtered.value
    .map((row) => row.id)
    .filter((id) => !String(id).startsWith("tmp-"));
  if (visibleIds.length === 0) return false;
  return visibleIds.every((id) => selectedIds.value.includes(id));
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
  originalsById.value = Object.fromEntries(
    rows.value.map((row) => [
      row.id,
      {
        name: row.name,
        default_unit_type: row.default_unit_type,
        kcal_per_100g: row.kcal_per_100g,
        protein_per_100g: row.protein_per_100g,
        carbs_per_100g: row.carbs_per_100g,
        fat_per_100g: row.fat_per_100g,
        source: row.source,
      },
    ]),
  );
  if (!activeIngredientId.value && rows.value.length > 0) {
    activeIngredientId.value = rows.value[0].id;
  }
  selectedIds.value = selectedIds.value.filter((id) =>
    rows.value.some((row) => row.id === id),
  );
  const { data: candidateRows } = await supabase
    .from("ingredient_nutrition_candidates")
    .select("*")
    .gte("confidence", 0.75)
    .order("created_at", { ascending: false })
    .limit(60);
  reviewCandidates.value = (candidateRows || []) as ReviewCandidate[];

  const ingredientIds = rows.value
    .map((row) => row.id)
    .filter((id) => !String(id).startsWith("tmp-"));
  if (ingredientIds.length === 0) {
    recipeLinksByIngredientId.value = {};
    return;
  }

  const { data: recipeRows, error: recipeRowsError } = await supabase
    .from("recipe_ingredients")
    .select("ingredient_id, dishes(id, name)")
    .in("ingredient_id", ingredientIds)
    .not("ingredient_id", "is", null);
  if (recipeRowsError) {
    await logError("web", recipeRowsError, {
      context: "ingredients.loadRecipeLinks",
    });
    recipeLinksByIngredientId.value = {};
    return;
  }

  const nextLinks: Record<string, RecipeLink[]> = {};
  for (const item of recipeRows || []) {
    const ingredientId = String((item as any).ingredient_id || "");
    const dish = (item as any).dishes;
    if (!ingredientId || !dish?.id) continue;
    if (!nextLinks[ingredientId]) nextLinks[ingredientId] = [];
    if (!nextLinks[ingredientId].some((recipe) => recipe.id === dish.id)) {
      nextLinks[ingredientId].push({
        id: dish.id,
        name: dish.name || "Receta",
      });
    }
  }
  recipeLinksByIngredientId.value = nextLinks;
};

const recipesForIngredient = (ingredientId: string) =>
  recipeLinksByIngredientId.value[ingredientId] || [];

const candidatesForIngredient = (ingredientId: string) =>
  reviewCandidates.value.filter(
    (candidate) => candidate.ingredient_id === ingredientId,
  );

const originalForRow = (ingredientId: string) =>
  originalsById.value[ingredientId] || {
    kcal_per_100g: null,
    protein_per_100g: null,
    carbs_per_100g: null,
    fat_per_100g: null,
  };

const changedFieldsForRow = (row: IngredientRow) => {
  const original = originalsById.value[row.id];
  if (!original) return [];
  return [
    "name",
    "default_unit_type",
    "kcal_per_100g",
    "protein_per_100g",
    "carbs_per_100g",
    "fat_per_100g",
    "source",
  ].filter((field) => {
    return (
      (row as any)[field] !== (original as any)[field] &&
      !((row as any)[field] == null && (original as any)[field] == null)
    );
  });
};

const patchRow = (ingredientId: string, patch: Partial<IngredientRow>) => {
  const row = rows.value.find((item) => item.id === ingredientId);
  if (!row) return;
  Object.assign(row, patch);
  activeIngredientId.value = ingredientId;
};

const savingStatusForRow = (ingredientId: string) =>
  savingRowStates.value[ingredientId] || "idle";

const isRowEnriching = (ingredientId: string) =>
  enrichingRowIds.value.includes(ingredientId);

const isSelected = (id: string) => selectedIds.value.includes(id);

const toggleSelected = (id: string) => {
  if (isSelected(id)) {
    selectedIds.value = selectedIds.value.filter((current) => current !== id);
    return;
  }
  if (!String(id).startsWith("tmp-")) {
    selectedIds.value.push(id);
  }
};

const toggleSelectAllFiltered = () => {
  const visibleIds = filtered.value
    .map((row) => row.id)
    .filter((id) => !String(id).startsWith("tmp-"));
  if (visibleIds.length === 0) return;
  if (allFilteredSelected.value) {
    selectedIds.value = selectedIds.value.filter(
      (id) => !visibleIds.includes(id),
    );
    return;
  }
  selectedIds.value = Array.from(
    new Set([...selectedIds.value, ...visibleIds]),
  );
};

const searchFoods = async () => {
  if (!query.value.trim()) return;
  searchingUsda.value = true;
  try {
    const payload = await $fetch<{
      success: boolean;
      candidates?: any[];
    }>("/api/ingredient-search", {
      method: "POST",
      body: {
        query: query.value.trim(),
        source: searchSource.value,
      },
    });
    usdaCandidates.value = Array.isArray(payload?.candidates)
      ? payload.candidates
      : [];
  } catch (error) {
    await logError("web", error, { context: "ingredients.searchUsda" });
  } finally {
    searchingUsda.value = false;
  }
};

const saveIngredientFromCandidate = async (candidate: any) => {
  try {
    const result = await persistCandidate(candidate);
    if (!result?.success) {
      throw new Error("No se pudo guardar candidato");
    }
    await load();
  } catch (error) {
    await logError("web", error, {
      context: "ingredients.saveIngredientFromCandidate",
    });
  }
};

const runEnrichment = async () => {
  enriching.value = true;
  try {
    const result = await $fetch<{
      success: boolean;
      source: "auto" | "usda" | "open_food_facts" | "bedca";
      processed: number;
      completed: number;
      needs_review: number;
      not_found: number;
    }>("/api/enrich-ingredients", {
      method: "POST",
      body: {
        ingredientIds: selectedIds.value,
        limit: selectedIds.value.length > 0 ? selectedIds.value.length : 1,
        query: selectedIds.value.length === 0 ? query.value.trim() : "",
        source: searchSource.value === "usda" ? "usda" : "open_food_facts",
      },
    });

    enrichSummary.value = {
      processed: result.processed || 0,
      completed: result.completed || 0,
      needs_review: result.needs_review || 0,
      not_found: result.not_found || 0,
    };
    await load();
  } catch (error) {
    await logError("web", error, { context: "ingredients.runEnrichment" });
  } finally {
    enriching.value = false;
  }
};

const enrichOne = async (row: IngredientRow) => {
  if (String(row.id).startsWith("tmp-") || isRowEnriching(row.id)) return;
  enrichingRowIds.value.push(row.id);
  try {
    const result = await $fetch<{
      success: boolean;
      processed: number;
      completed: number;
      needs_review: number;
      not_found: number;
    }>("/api/enrich-ingredients", {
      method: "POST",
      body: {
        ingredientId: row.id,
        limit: 1,
        source: "open_food_facts",
      },
    });

    enrichSummary.value = {
      processed: result.processed || 0,
      completed: result.completed || 0,
      needs_review: result.needs_review || 0,
      not_found: result.not_found || 0,
    };
    await load();
  } catch (error) {
    await logError("web", error, { context: "ingredients.enrichOne" });
  } finally {
    enrichingRowIds.value = enrichingRowIds.value.filter((id) => id !== row.id);
  }
};

const backfillAliases = async () => {
  backfillingAliases.value = true;
  try {
    await $fetch("/api/ingredient-aliases-backfill", {
      method: "POST",
      body: { limit: 1000 },
    });
  } catch (error) {
    await logError("web", error, { context: "ingredients.backfillAliases" });
  } finally {
    backfillingAliases.value = false;
  }
};

const mergeDuplicateIngredients = async () => {
  mergingDuplicates.value = true;
  try {
    await $fetch("/api/ingredients-merge-duplicates", {
      method: "POST",
    });
    await load();
  } catch (error) {
    await logError("web", error, {
      context: "ingredients.mergeDuplicateIngredients",
    });
  } finally {
    mergingDuplicates.value = false;
  }
};

const applyCandidate = async (candidateId: string) => {
  try {
    await $fetch("/api/ingredients-apply-candidate", {
      method: "POST",
      body: { candidateId },
    });
    await load();
  } catch (error) {
    await logError("web", error, { context: "ingredients.applyCandidate" });
  }
};

const moveActive = (ingredientId: string, direction: -1 | 1) => {
  const currentIndex = filtered.value.findIndex((row) => row.id === ingredientId);
  if (currentIndex < 0) return;
  const next = filtered.value[currentIndex + direction];
  if (next) activeIngredientId.value = next.id;
};

const autocompleteRow = async (row: IngredientRow) => {
  const candidate = candidatesForIngredient(row.id)[0];
  if (candidate) {
    patchRow(row.id, {
      kcal_per_100g: candidate.kcal_per_100g,
      protein_per_100g: candidate.protein_per_100g,
      carbs_per_100g: candidate.carbs_per_100g,
      fat_per_100g: candidate.fat_per_100g,
      source: candidate.source,
    } as Partial<IngredientRow>);
    return;
  }
  await enrichOne(row);
};

const restoreOriginal = (row: IngredientRow) => {
  const original = originalsById.value[row.id];
  if (!original) return;
  patchRow(row.id, original as Partial<IngredientRow>);
};

const addIngredient = () => {
  const id = `tmp-${Date.now()}` as any;
  const newRow = {
    id,
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
  } as IngredientRow;
  rows.value.unshift(newRow);
  originalsById.value = {
    ...originalsById.value,
    [id]: {
      name: "",
      default_unit_type: "g",
      kcal_per_100g: null,
      protein_per_100g: null,
      carbs_per_100g: null,
      fat_per_100g: null,
      source: "manual",
    },
  };
  activeIngredientId.value = id;
};

const save = async (row: IngredientRow, options: { goNext?: boolean } = {}) => {
  if (!row.name.trim()) return;
  activeIngredientId.value = row.id;
  const nutritionQuality = validateIngredientNutritionQuality({
    kcal_per_100g: row.kcal_per_100g,
    protein_per_100g: row.protein_per_100g,
    carbs_per_100g: row.carbs_per_100g,
    fat_per_100g: row.fat_per_100g,
  });
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
    is_verified: !!row.is_verified && !nutritionQuality.needsReview,
    nutrition_status: !nutritionQuality.hasCompleteNutrition
      ? "pending"
      : nutritionQuality.needsReview
        ? "needs_review"
        : "complete",
  };
  savingRowStates.value = { ...savingRowStates.value, [row.id]: "saving" };
  try {
    if (String(row.id).startsWith("tmp-")) {
      const { data: inserted, error } = await supabase
        .from("ingredients")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      if (inserted?.id) activeIngredientId.value = inserted.id;
    } else {
      const { error } = await supabase
        .from("ingredients")
        .update(payload)
        .eq("id", row.id);
      if (error) throw error;
    }
    savingRowStates.value = { ...savingRowStates.value, [row.id]: "success" };
    await load();
    if (options.goNext && activeIngredientId.value) {
      moveActive(activeIngredientId.value, 1);
    }
  } catch (error) {
    savingRowStates.value = { ...savingRowStates.value, [row.id]: "error" };
    await logError("web", error, { context: "ingredients.save" });
  }
};

const deleteOne = async (id: string) => {
  if (String(id).startsWith("tmp-")) {
    rows.value = rows.value.filter((row) => row.id !== id);
    return;
  }
  if (!confirm("¿Eliminar este ingrediente?")) return;
  try {
    const { error } = await supabase.from("ingredients").delete().eq("id", id);
    if (error) throw error;
    selectedIds.value = selectedIds.value.filter((item) => item !== id);
    await load();
  } catch (error) {
    await logError("web", error, { context: "ingredients.deleteOne" });
  }
};

const deleteSelected = async () => {
  if (selectedIds.value.length === 0) return;
  if (!confirm(`¿Eliminar ${selectedIds.value.length} ingredientes?`)) return;
  try {
    const { error } = await supabase
      .from("ingredients")
      .delete()
      .in("id", selectedIds.value);
    if (error) throw error;
    selectedIds.value = [];
    await load();
  } catch (error) {
    await logError("web", error, { context: "ingredients.deleteSelected" });
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

onMounted(() => {
  load();
  loadExpansions();
});

const expansionMappings = ref<any[]>([]);
const loadingExpansions = ref(false);

const loadExpansions = async () => {
  const user = await loadCurrentUser();
  if (!user) return;
  loadingExpansions.value = true;
  try {
    const { data } = await useFetch("/api/ingredient-mappings", {
      query: { userId: user.id },
    });
    if (data.value?.mappings) {
      expansionMappings.value = data.value.mappings;
    }
  } catch (error) {
    console.error("loadExpansions error:", error);
  } finally {
    loadingExpansions.value = false;
  }
};

const openExpansionModal = (mapping?: any) => {
  if (mapping) {
    editingExpansion.value = mapping;
    expansionForm.value = {
      dishName: mapping.dish_name || "",
      aliases: (mapping.aliases || []).join(", "),
      ingredients: JSON.stringify(mapping.ingredients || [], null, 2),
      isGlobal: mapping.is_global || false,
    };
  } else {
    editingExpansion.value = null;
    expansionForm.value = {
      dishName: "",
      aliases: "",
      ingredients: "[]",
      isGlobal: false,
    };
  }
  showExpansionModal.value = true;
};

const saveExpansion = async () => {
  const user = await loadCurrentUser();
  if (!user) return;

  try {
    let parsedIngredients;
    try {
      parsedIngredients = JSON.parse(expansionForm.value.ingredients);
    } catch {
      throw new Error("JSON de ingredientes inválido");
    }

    const aliases = expansionForm.value.aliases
      .split(",")
      .map((a: string) => a.trim())
      .filter(Boolean);

    const body = {
      userId: user.id,
      dishName: expansionForm.value.dishName,
      aliases,
      ingredients: parsedIngredients,
      isGlobal: expansionForm.value.isGlobal,
    };

    if (editingExpansion.value) {
      await useFetch("/api/ingredient-mappings", {
        method: "PUT",
        body: { id: editingExpansion.value.id, ...body },
      });
    } else {
      await useFetch("/api/ingredient-mappings", {
        method: "POST",
        body,
      });
    }

    showExpansionModal.value = false;
    await loadExpansions();
  } catch (error: any) {
    alert(error.message || "Error guardando");
  }
};

const deleteExpansion = async (id: string) => {
  if (!confirm("¿Eliminar esta expansión?")) return;
  const user = await loadCurrentUser();
  if (!user) return;

  try {
    await useFetch("/api/ingredient-mappings", {
      method: "DELETE",
      body: { id, userId: user.id },
    });
    await loadExpansions();
  } catch (error) {
    console.error("deleteExpansion error:", error);
  }
};

const showExpansionModal = ref(false);
const editingExpansion = ref<any>(null);
const expansionForm = ref({
  dishName: "",
  aliases: "",
  ingredients: "[]",
  isGlobal: false,
});

const openExpansionModal = (mapping?: any) => {
  if (mapping) {
    editingExpansion.value = mapping;
    expansionForm.value = {
      dishName: mapping.dish_name || "",
      aliases: (mapping.aliases || []).join(", "),
      ingredients: JSON.stringify(mapping.ingredients || [], null, 2),
      isGlobal: mapping.is_global || false,
    };
  } else {
    editingExpansion.value = null;
    expansionForm.value = { dishName: "", aliases: "", ingredients: "[]", isGlobal: false };
  }
  showExpansionModal.value = true;
};

const saveExpansion = async () => {
  const user = await loadCurrentUser();
  if (!user) return;
  try {
    let parsed = JSON.parse(expansionForm.value.ingredients);
    const aliases = expansionForm.value.aliases.split(",").map((a: string) => a.trim()).filter(Boolean);
    const body = {
      userId: user.id,
      dishName: expansionForm.value.dishName,
      aliases,
      ingredients: parsed,
      isGlobal: expansionForm.value.isGlobal,
    };
    if (editingExpansion.value) {
      await useFetch("/api/ingredient-mappings", { method: "PUT", body: { id: editingExpansion.value.id, ...body } });
    } else {
      await useFetch("/api/ingredient-mappings", { method: "POST", body });
    }
    showExpansionModal.value = false;
    await loadExpansions();
  } catch (e: any) {
    alert(e.message || "Error");
  }
};
</script>
