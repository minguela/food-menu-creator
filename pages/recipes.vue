<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Biblioteca de recetas</h1>
        <p class="text-sm text-gray-500">
          Curación de platos detectados por OCR y confirmación de ingredientes
          base.
        </p>
      </div>
      <div class="flex gap-2">
        <NuxtLink
          href="/ingredients"
          class="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
        >
          Ingredientes maestros
        </NuxtLink>
        <button
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          @click="loadRecipes"
        >
          Actualizar
        </button>
      </div>
    </header>

    <section class="bg-white rounded-lg border p-4">
      <div class="flex flex-wrap items-center gap-2">
        <label class="min-w-[220px] flex-1">
          <span class="sr-only">Buscar recetas</span>
          <input
            v-model.trim="searchTerm"
            class="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Buscar receta por nombre..."
          />
        </label>
        <label class="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            :checked="allFilteredSelected"
            @change="toggleSelectAllFiltered"
          />
          <span>Seleccionar visibles</span>
        </label>
        <button
          v-for="item in filterItems"
          :key="item.value"
          class="px-3 py-1.5 rounded-lg border text-sm"
          :class="
            filter === item.value
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'text-gray-700'
          "
          @click="filter = item.value"
        >
          {{ item.label }}
        </button>
        <button
          class="px-3 py-1.5 rounded-lg border text-sm text-gray-700 disabled:opacity-50"
          :disabled="selectedDishIds.length === 0"
          @click="clearSelection"
        >
          Limpiar selección
        </button>
        <button
          class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-50"
          :disabled="selectedDishIds.length === 0 || savingSelectedRecipes"
          @click="saveSelectedRecipes"
        >
          {{
            savingSelectedRecipes
              ? "Guardando recetas..."
              : `Guardar seleccionadas (${selectedDishIds.length})`
          }}
        </button>
        <button
          class="ml-auto px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm disabled:opacity-50"
          :disabled="selectedDishIds.length === 0"
          @click="deleteSelectedRecipes"
        >
          Eliminar recetas ({{ selectedDishIds.length }})
        </button>
        <button
          class="px-3 py-1.5 rounded-lg bg-sky-700 text-white text-sm disabled:opacity-50"
          :disabled="selectedDishIds.length < 2 || mergingRecipes"
          @click="openMergePanel"
        >
          {{ mergingRecipes ? "Fusionando..." : "Fusionar seleccionadas" }}
        </button>
      </div>
      <div v-if="showMergePanel" class="mt-3 border rounded-lg p-3 space-y-2">
        <p class="text-sm font-medium text-gray-900">Fusionar recetas</p>
        <label class="block">
          <span class="block text-xs text-gray-600 mb-1">Receta destino</span>
          <select
            v-model="mergeTargetId"
            class="w-full border rounded-lg px-3 py-2"
          >
            <option
              v-for="dish in mergeCandidates"
              :key="`merge-target-${dish.id}`"
              :value="dish.id"
            >
              {{ dish.name }}
            </option>
          </select>
        </label>
        <label class="block">
          <span class="block text-xs text-gray-600 mb-1">
            Nombre final (opcional)
          </span>
          <input
            v-model.trim="mergeFinalName"
            class="w-full border rounded-lg px-3 py-2"
            placeholder="Si lo dejas vacío, se mantiene el nombre de la receta destino"
          />
        </label>
        <div class="flex justify-end gap-2">
          <button
            class="px-3 py-1.5 rounded-lg border text-sm"
            @click="cancelMergePanel"
          >
            Cancelar
          </button>
          <button
            class="px-3 py-1.5 rounded-lg bg-sky-700 text-white text-sm disabled:opacity-50"
            :disabled="!mergeTargetId || mergingRecipes"
            @click="mergeSelectedRecipes"
          >
            Confirmar fusión
          </button>
        </div>
      </div>
    </section>

    <section class="space-y-3">
      <article
        v-for="dish in filteredDishes"
        :key="dish.id"
        class="bg-white rounded-lg border p-4"
      >
        <div class="flex flex-wrap justify-between gap-3">
          <div class="flex items-start gap-3">
            <label class="mt-1 inline-flex items-center">
              <input
                type="checkbox"
                :checked="isDishSelected(dish.id)"
                @change="toggleDishSelected(dish.id)"
              />
            </label>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="font-semibold text-gray-900">{{ dish.name }}</h2>
                <span
                  class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700"
                >
                  {{ ingredientCount(dish) }} ingredientes
                </span>
              </div>
              <p class="text-sm text-gray-500">
                {{ dish.description || "Sin descripción" }}
              </p>
              <p class="text-xs mt-1" :class="statusMeta(dish).color">
                {{ statusMeta(dish).label }}
              </p>
            </div>
          </div>
          <div class="flex gap-3">
            <button
              class="text-sm text-indigo-700"
              @click="toggleEdit(dish.id)"
            >
              {{ editingDishId === dish.id ? "Cerrar" : "Editar / Curar" }}
            </button>
            <button
              class="text-sm text-emerald-700 disabled:opacity-50"
              :disabled="isRecipeSaving(dish.id)"
              @click="saveRecipeQuick(dish.id)"
            >
              {{ isRecipeSaving(dish.id) ? "Guardando..." : "Guardar" }}
            </button>
            <button class="text-sm text-sky-700" @click="openSplitPanel(dish)">
              Dividir
            </button>
            <button class="text-sm text-red-700" @click="deleteRecipe(dish.id)">
              Eliminar
            </button>
          </div>
        </div>

        <div v-if="editingDishId === dish.id" class="mt-4 space-y-3">
          <div class="rounded-lg border p-3 space-y-2">
            <p class="text-xs font-medium text-gray-700">Datos de receta</p>
            <div class="grid gap-2 md:grid-cols-2">
              <label>
                <span class="block text-xs text-gray-600 mb-1">Nombre</span>
                <input
                  v-model.trim="recipeForm.name"
                  class="w-full border rounded-lg px-3 py-2"
                />
              </label>
              <label>
                <span class="block text-xs text-gray-600 mb-1"
                  >Descripción</span
                >
                <input
                  v-model.trim="recipeForm.description"
                  class="w-full border rounded-lg px-3 py-2"
                />
              </label>
            </div>
            <div class="flex justify-end">
              <button
                class="text-xs px-3 py-1.5 rounded border text-indigo-700"
                @click="saveRecipeMeta(dish.id)"
              >
                Guardar receta
              </button>
            </div>
          </div>

          <p
            class="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2"
          >
            Ingredientes detectados desde el nombre del plato. Revisa y confirma
            antes de usar para cálculos.
          </p>

          <h3 class="text-sm font-medium text-gray-900">
            Sugeridos (sin confirmar)
          </h3>
          <div class="flex justify-end">
            <button
              class="text-xs px-3 py-1.5 rounded border text-green-700 disabled:opacity-50"
              :disabled="pendingRows.length === 0 || savingBatch"
              @click="confirmAllPendingRows(dish.id)"
            >
              {{ savingBatch ? "Confirmando..." : "Confirmar todos" }}
            </button>
          </div>
          <div v-if="pendingRows.length === 0" class="text-sm text-gray-500">
            No hay sugerencias pendientes.
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="row in pendingRows"
              :key="row.id"
              class="grid grid-cols-[1fr_150px_1fr] gap-2"
            >
              <input
                v-model.trim="row.name"
                class="border rounded-lg px-3 py-2"
              />
              <select
                v-model="row.unit_type"
                class="border rounded-lg px-3 py-2"
              >
                <option value="">Unidad</option>
                <option v-for="unit in unitTypes" :key="unit" :value="unit">
                  {{ unit }}
                </option>
              </select>
              <div class="flex gap-2">
                <button
                  class="text-xs text-indigo-700"
                  :disabled="candidateLoading"
                  @click="autoApplyBestCandidate(row)"
                >
                  Curar con OFF
                </button>
                <button
                  class="text-xs text-sky-700"
                  @click="openCandidateSearch(row)"
                >
                  Buscar/curar fuente
                </button>
                <button
                  class="text-xs text-green-700"
                  @click="confirmRow(dish.id, row)"
                >
                  Confirmar
                </button>
                <button
                  class="text-xs text-red-700"
                  @click="deleteRow(dish.id, row.id)"
                >
                  Quitar
                </button>
              </div>
              <div
                v-if="candidateTargetRowId === row.id"
                class="col-span-4 rounded-lg border p-2 space-y-2"
              >
                <div class="grid grid-cols-[1fr_160px_auto] gap-2">
                  <input
                    v-model.trim="candidateQuery"
                    class="border rounded-lg px-2 py-1 text-sm"
                    placeholder="Buscar alimento..."
                  />
                  <select
                    v-model="candidateSource"
                    class="border rounded-lg px-2 py-1 text-sm"
                  >
                    <option value="open_food_facts">Open Food Facts</option>
                    <option value="usda">USDA</option>
                    <option value="bedca">BEDCA (próximamente)</option>
                  </select>
                  <button
                    class="text-xs px-2 py-1 rounded border"
                    :disabled="candidateLoading || !candidateQuery"
                    @click="searchCandidatesForTarget"
                  >
                    {{ candidateLoading ? "Buscando..." : "Buscar" }}
                  </button>
                </div>
                <div
                  v-for="candidate in candidateResults"
                  :key="`${candidate.source}-${candidate.external_id}`"
                  class="text-xs border rounded p-2"
                >
                  <p class="font-medium">{{ candidate.name }}</p>
                  <p class="text-gray-500">
                    {{ candidate.nutrients.kcal_per_100g ?? "?" }} kcal · P
                    {{ candidate.nutrients.protein_per_100g ?? "?" }} · H
                    {{ candidate.nutrients.carbs_per_100g ?? "?" }} · G
                    {{ candidate.nutrients.fat_per_100g ?? "?" }}
                  </p>
                  <button
                    class="mt-1 text-indigo-700"
                    @click="saveIngredientFromCandidate(candidate, row)"
                  >
                    Curar ingrediente
                  </button>
                </div>
              </div>
            </div>
          </div>

          <h3 class="text-sm font-medium text-gray-900">
            Confirmados (base receta)
          </h3>
          <div class="flex justify-end">
            <button
              class="text-xs px-3 py-1.5 rounded border text-indigo-700 disabled:opacity-50"
              :disabled="confirmedRows.length === 0 || savingBatch"
              @click="saveAllConfirmedRows(dish.id)"
            >
              {{ savingBatch ? "Guardando..." : "Guardar todos" }}
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="row in confirmedRows"
              :key="row.id"
              class="grid grid-cols-[1fr_150px_1fr] gap-2"
            >
              <input
                v-model.trim="row.name"
                class="border rounded-lg px-3 py-2"
              />
              <select
                v-model="row.unit_type"
                class="border rounded-lg px-3 py-2"
              >
                <option v-for="unit in unitTypes" :key="unit" :value="unit">
                  {{ unit }}
                </option>
              </select>
              <div class="flex gap-2">
                <button
                  class="text-xs text-indigo-700"
                  :disabled="candidateLoading"
                  @click="autoApplyBestCandidate(row)"
                >
                  Curar con OFF
                </button>
                <button
                  class="text-xs text-sky-700"
                  @click="openCandidateSearch(row)"
                >
                  Buscar/curar fuente
                </button>
                <button
                  class="text-xs text-indigo-700"
                  @click="saveConfirmedRow(dish.id, row)"
                >
                  Guardar
                </button>
                <button
                  class="text-xs text-red-700"
                  @click="deleteRow(dish.id, row.id)"
                >
                  Eliminar
                </button>
              </div>
              <div
                v-if="candidateTargetRowId === row.id"
                class="col-span-4 rounded-lg border p-2 space-y-2"
              >
                <div class="grid grid-cols-[1fr_160px_auto] gap-2">
                  <input
                    v-model.trim="candidateQuery"
                    class="border rounded-lg px-2 py-1 text-sm"
                    placeholder="Buscar alimento..."
                  />
                  <select
                    v-model="candidateSource"
                    class="border rounded-lg px-2 py-1 text-sm"
                  >
                    <option value="open_food_facts">Open Food Facts</option>
                    <option value="usda">USDA</option>
                    <option value="bedca">BEDCA (próximamente)</option>
                  </select>
                  <button
                    class="text-xs px-2 py-1 rounded border"
                    :disabled="candidateLoading || !candidateQuery"
                    @click="searchCandidatesForTarget"
                  >
                    {{ candidateLoading ? "Buscando..." : "Buscar" }}
                  </button>
                </div>
                <div
                  v-for="candidate in candidateResults"
                  :key="`${candidate.source}-${candidate.external_id}`"
                  class="text-xs border rounded p-2"
                >
                  <p class="font-medium">{{ candidate.name }}</p>
                  <p class="text-gray-500">
                    {{ candidate.nutrients.kcal_per_100g ?? "?" }} kcal · P
                    {{ candidate.nutrients.protein_per_100g ?? "?" }} · H
                    {{ candidate.nutrients.carbs_per_100g ?? "?" }} · G
                    {{ candidate.nutrients.fat_per_100g ?? "?" }}
                  </p>
                  <button
                    class="mt-1 text-indigo-700"
                    @click="saveIngredientFromCandidate(candidate, row)"
                  >
                    Curar ingrediente
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            class="text-sm text-indigo-700"
            @click="addManualConfirmed(dish.id)"
          >
            + Añadir ingrediente manual
          </button>
          <div class="rounded-lg border p-3 space-y-2">
            <p class="text-xs font-medium text-gray-700">
              Añadir varios ingredientes (uno por línea)
            </p>
            <textarea
              v-model="bulkIngredientInput"
              class="w-full min-h-[96px] border rounded-lg px-3 py-2 text-sm"
              placeholder="Ej:
arroz
pollo
aceite de oliva"
            />
            <div class="flex justify-end">
              <button
                class="text-xs px-3 py-1.5 rounded border text-indigo-700 disabled:opacity-50"
                :disabled="!bulkIngredientInput.trim() || savingBulkIngredients"
                @click="addBulkIngredients(dish.id)"
              >
                {{
                  savingBulkIngredients
                    ? "Añadiendo..."
                    : "Añadir ingredientes en bloque"
                }}
              </button>
            </div>
          </div>

          <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
        </div>
      </article>
    </section>
    <div
      v-if="showSplitPanel"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      @click.self="closeSplitPanel"
    >
      <div class="w-full max-w-2xl rounded-lg bg-white p-4 space-y-3">
        <h3 class="text-lg font-semibold text-gray-900">Dividir receta</h3>
        <p class="text-sm text-gray-600">
          Receta original:
          <span class="font-medium">{{ splitSourceDish?.name }}</span>
        </p>
        <div v-if="splitCandidates.length === 0" class="text-sm text-amber-700">
          No detecté separadores claros (`+`, `de segundo`, `primero/segundo`).
        </div>
        <div v-else class="space-y-2">
          <p class="text-xs text-gray-600">
            Partes detectadas (editables antes de crear):
          </p>
          <div
            v-for="(part, index) in splitCandidates"
            :key="`split-${index}`"
            class="grid grid-cols-[1fr_auto] gap-2"
          >
            <input
              v-model.trim="splitCandidates[index]"
              class="border rounded-lg px-3 py-2"
            />
            <button
              class="text-xs text-red-700"
              @click="splitCandidates.splice(index, 1)"
            >
              Quitar
            </button>
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <button
            class="px-3 py-1.5 rounded-lg border"
            @click="closeSplitPanel"
          >
            Cancelar
          </button>
          <button
            class="px-3 py-1.5 rounded-lg bg-sky-700 text-white disabled:opacity-50"
            :disabled="splitCandidates.length < 2 || splittingRecipe"
            @click="splitRecipe"
          >
            {{ splittingRecipe ? "Dividiendo..." : "Crear recetas separadas" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { logError } from "~/utils/log-error";
import { normalizeIngredientName } from "~/utils/ingredient-normalize";
import { saveIngredientFromCandidate as persistCandidate } from "~/utils/save-ingredient-from-candidate";
import type { Dish, Ingredient, RecipeIngredient } from "~/types";

type DishRow = Dish & {
  recipe_ingredients?: Array<
    RecipeIngredient & { ingredients?: Ingredient | null }
  >;
};

const supabase = useSupabase();
const route = useRoute();
const { loadCurrentUser } = useCurrentUser();

const unitTypes: Array<"kg" | "g" | "l" | "ml" | "ud" | "pack" | "unidad"> = [
  "g",
  "kg",
  "ml",
  "l",
  "ud",
  "pack",
  "unidad",
];

const dishes = ref<DishRow[]>([]);
const filter = ref<"all" | "suggested" | "complete" | "not_required">("all");
const filterItems = [
  { value: "all", label: "Todas" },
  { value: "suggested", label: "Sugeridas" },
  { value: "complete", label: "Completas" },
  { value: "not_required", label: "No requiere" },
] as const;

const editingDishId = ref<string | null>(null);
const pendingRows = ref<Array<RecipeIngredient>>([]);
const confirmedRows = ref<Array<RecipeIngredient>>([]);
const formError = ref("");
const candidateTargetRowId = ref<string | null>(null);
const candidateSource = ref<"usda" | "open_food_facts" | "bedca">(
  "open_food_facts",
);
const candidateQuery = ref("");
const candidateResults = ref<any[]>([]);
const candidateLoading = ref(false);
const selectedDishIds = ref<string[]>([]);
const savingDishIds = ref<string[]>([]);
const savingSelectedRecipes = ref(false);
const savingBatch = ref(false);
const savingBulkIngredients = ref(false);
const searchTerm = ref("");
const bulkIngredientInput = ref("");
const showMergePanel = ref(false);
const mergeTargetId = ref("");
const mergeFinalName = ref("");
const mergingRecipes = ref(false);
const showSplitPanel = ref(false);
const splitSourceDish = ref<DishRow | null>(null);
const splitCandidates = ref<string[]>([]);
const splittingRecipe = ref(false);
const recipeForm = reactive({
  name: "",
  description: "",
});

const statusMeta = (dish: DishRow) => {
  const status = dish.recipe_status || "pending_ingredients";
  if (status === "complete")
    return { label: "Completa", color: "text-emerald-700" };
  if (status === "not_required")
    return { label: "No requiere ingredientes", color: "text-gray-500" };
  return { label: "Sugerida", color: "text-amber-700" };
};

const filteredDishes = computed(() =>
  dishes.value.filter((dish) => {
    const query = searchTerm.value.trim().toLowerCase();
    if (
      query &&
      !String(dish.name || "")
        .toLowerCase()
        .includes(query)
    ) {
      return false;
    }
    if (filter.value === "all") return true;
    if (filter.value === "suggested")
      return (
        dish.recipe_status === "suggested_ingredients" ||
        dish.recipe_status === "pending_ingredients" ||
        dish.recipe_status === "incomplete_nutrition"
      );
    if (filter.value === "complete") return dish.recipe_status === "complete";
    return dish.recipe_status === "not_required";
  }),
);

const allFilteredSelected = computed(() => {
  if (filteredDishes.value.length === 0) return false;
  return filteredDishes.value.every((dish) =>
    selectedDishIds.value.includes(dish.id),
  );
});

const ingredientCount = (dish: DishRow) =>
  (dish.recipe_ingredients || []).length;

const isRecipeSaving = (dishId: string) =>
  savingDishIds.value.includes(dishId);

const loadRecipes = async () => {
  const currentUser = await loadCurrentUser();
  if (!currentUser) return;
  const { data, error } = await supabase
    .from("dishes")
    .select("*, recipe_ingredients(*, ingredients(*))")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });
  if (error) {
    await logError("web", error, { context: "recipes.loadRecipes" });
    return;
  }
  dishes.value = (data || []) as DishRow[];
  selectedDishIds.value = selectedDishIds.value.filter((id) =>
    dishes.value.some((dish) => dish.id === id),
  );
};

const openRecipeFromRoute = async () => {
  const recipeId = String(route.query.recipe || "").trim();
  if (!recipeId || editingDishId.value === recipeId) return;
  const dish = dishes.value.find((item) => item.id === recipeId);
  if (!dish) return;
  searchTerm.value = dish.name || "";
  await toggleEdit(recipeId);
};

const refreshEditingDish = async (dishId: string) => {
  const { data, error } = await supabase
    .from("dishes")
    .select("*, recipe_ingredients(*, ingredients(*))")
    .eq("id", dishId)
    .maybeSingle();

  if (error || !data) {
    await logError("web", error || new Error("Receta no encontrada"), {
      context: "recipes.refreshEditingDish",
    });
    return;
  }

  const currentIndex = dishes.value.findIndex((dish) => dish.id === dishId);
  if (currentIndex >= 0) {
    dishes.value[currentIndex] = data as DishRow;
  } else {
    dishes.value.unshift(data as DishRow);
  }

  const dish = data as DishRow;
  recipeForm.name = dish.name || "";
  recipeForm.description = dish.description || "";
  pendingRows.value = (dish.recipe_ingredients || [])
    .filter((row) => !row.is_confirmed)
    .map((row) => ({ ...row, unit_type: row.unit_type || "g" }));
  confirmedRows.value = (dish.recipe_ingredients || [])
    .filter((row) => row.is_confirmed)
    .map((row) => ({ ...row, unit_type: row.unit_type || "g" }));
};

const isDishSelected = (dishId: string) =>
  selectedDishIds.value.includes(dishId);

const toggleDishSelected = (dishId: string) => {
  if (isDishSelected(dishId)) {
    selectedDishIds.value = selectedDishIds.value.filter((id) => id !== dishId);
    return;
  }
  selectedDishIds.value.push(dishId);
};

const toggleSelectAllFiltered = () => {
  const filteredIds = filteredDishes.value.map((dish) => dish.id);
  if (filteredIds.length === 0) return;

  if (allFilteredSelected.value) {
    selectedDishIds.value = selectedDishIds.value.filter(
      (id) => !filteredIds.includes(id),
    );
    return;
  }

  selectedDishIds.value = Array.from(
    new Set([...selectedDishIds.value, ...filteredIds]),
  );
};

const clearSelection = () => {
  selectedDishIds.value = [];
};

const saveRecipeQuick = async (dishId: string) => {
  if (isRecipeSaving(dishId)) return;
  savingDishIds.value.push(dishId);
  formError.value = "";
  try {
    await syncRecipeStatus(dishId);
    if (editingDishId.value === dishId) {
      await refreshEditingDish(dishId);
    }
  } catch (error) {
    await logError("web", error, { context: "recipes.saveRecipeQuick" });
    formError.value = "No se pudo guardar la receta.";
  } finally {
    savingDishIds.value = savingDishIds.value.filter((id) => id !== dishId);
  }
};

const saveSelectedRecipes = async () => {
  if (selectedDishIds.value.length === 0 || savingSelectedRecipes.value) return;
  savingSelectedRecipes.value = true;
  formError.value = "";
  try {
    for (const dishId of selectedDishIds.value) {
      await saveRecipeQuick(dishId);
    }
  } finally {
    savingSelectedRecipes.value = false;
  }
};

const mergeCandidates = computed(() =>
  dishes.value.filter((dish) => selectedDishIds.value.includes(dish.id)),
);

const openMergePanel = () => {
  if (selectedDishIds.value.length < 2) return;
  showMergePanel.value = true;
  mergeTargetId.value = selectedDishIds.value[0];
  const target = dishes.value.find((dish) => dish.id === mergeTargetId.value);
  mergeFinalName.value = target?.name || "";
};

const cancelMergePanel = () => {
  showMergePanel.value = false;
  mergeTargetId.value = "";
  mergeFinalName.value = "";
};

const normalizeSplitParts = (rawParts: string[]) => {
  return Array.from(
    new Set(
      rawParts
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => part.replace(/\s+/g, " ")),
    ),
  );
};

const extractSplitCandidates = (dishName: string) => {
  const normalized = dishName
    .replace(/\s+\+\s+/g, " + ")
    .replace(/\s+y\s+de\s+segundo\s+/gi, " + ")
    .replace(/\s+de\s+segundo\s+/gi, " + ")
    .replace(/\s+primero:\s*/gi, "")
    .replace(/\s+segundo:\s*/gi, " + ");
  const byPlus = normalized.split("+");
  return normalizeSplitParts(byPlus);
};

const openSplitPanel = (dish: DishRow) => {
  splitSourceDish.value = dish;
  splitCandidates.value = extractSplitCandidates(String(dish.name || ""));
  showSplitPanel.value = true;
};

const closeSplitPanel = () => {
  showSplitPanel.value = false;
  splitSourceDish.value = null;
  splitCandidates.value = [];
};

const updateOpenDishRows = () => {
  if (!editingDishId.value) return;
  const dish = dishes.value.find((row) => row.id === editingDishId.value);
  if (!dish) return;
  dish.recipe_ingredients = [
    ...pendingRows.value.map((row) => ({ ...row })),
    ...confirmedRows.value.map((row) => ({ ...row })),
  ] as any;
};

const saveRecipeMeta = async (dishId: string) => {
  formError.value = "";
  if (!recipeForm.name.trim()) {
    formError.value = "El nombre de la receta no puede estar vacío.";
    return;
  }
  const { error } = await supabase
    .from("dishes")
    .update({
      name: recipeForm.name.trim(),
      normalized_name: normalizeIngredientName(recipeForm.name),
      description: recipeForm.description.trim() || null,
    })
    .eq("id", dishId);
  if (error) {
    formError.value = error.message;
    await logError("web", error, { context: "recipes.saveRecipeMeta" });
    return;
  }
  const dish = dishes.value.find((row) => row.id === dishId);
  if (dish) {
    dish.name = recipeForm.name.trim();
    dish.description = recipeForm.description.trim() || undefined;
  }
};

const toggleEdit = async (dishId: string) => {
  formError.value = "";
  if (editingDishId.value === dishId) {
    editingDishId.value = null;
    pendingRows.value = [];
    confirmedRows.value = [];
    recipeForm.name = "";
    recipeForm.description = "";
    bulkIngredientInput.value = "";
    return;
  }
  editingDishId.value = dishId;
  await ensureRecipeIngredientLinks(dishId);
  await refreshEditingDish(dishId);
};

const ensureRecipeIngredientLinks = async (dishId: string) => {
  const { data: recipeRows } = await supabase
    .from("recipe_ingredients")
    .select("*")
    .eq("recipe_id", dishId);

  const toLink = (recipeRows || []).filter(
    (row) => row.is_confirmed && !row.ingredient_id && row.name,
  );
  if (toLink.length === 0) return;

  for (const row of toLink) {
    const ingredientId = await upsertMasterIngredient(
      row.name,
      row.unit_type || "g",
    );
    if (!ingredientId) continue;
    await supabase
      .from("recipe_ingredients")
      .update({
        ingredient_id: ingredientId,
        normalized_name: normalizeIngredientName(row.name),
      })
      .eq("id", row.id);
  }
};

const upsertMasterIngredient = async (name: string, unitType: string) => {
  const normalizedName = normalizeIngredientName(name);
  const existing = await supabase
    .from("ingredients")
    .select("id")
    .eq("normalized_name", normalizedName)
    .maybeSingle();
  if (existing.data?.id) return existing.data.id;

  const created = await supabase
    .from("ingredients")
    .insert({
      name,
      normalized_name: normalizedName,
      default_unit_type: unitType,
      unit_type: unitType,
      source: "manual",
      is_verified: false,
    })
    .select("id")
    .single();
  return created.data?.id || null;
};

const openCandidateSearch = (row: RecipeIngredient) => {
  candidateTargetRowId.value = row.id;
  candidateQuery.value = row.name || "";
  candidateResults.value = [];
};

const searchCandidatesForTarget = async () => {
  if (!candidateTargetRowId.value || !candidateQuery.value.trim()) return;
  candidateLoading.value = true;
  try {
    const payload = await $fetch<{
      success: boolean;
      candidates?: any[];
    }>("/api/ingredient-search", {
      method: "POST",
      body: {
        query: candidateQuery.value.trim(),
        source: candidateSource.value,
      },
    });
    candidateResults.value = Array.isArray(payload?.candidates)
      ? payload.candidates
      : [];
  } catch (error) {
    await logError("web", error, {
      context: "recipes.searchCandidatesForTarget",
    });
  } finally {
    candidateLoading.value = false;
  }
};

const removeDuplicateSuggestedRows = async (
  dishId: string,
  row: RecipeIngredient,
) => {
  const normalizedName = normalizeIngredientName(row.name || "");
  if (!normalizedName) return;

  const duplicateRows = pendingRows.value.filter(
    (item) =>
      item.id !== row.id &&
      normalizeIngredientName(item.name || "") === normalizedName,
  );
  if (duplicateRows.length === 0) return;

  const duplicateIds = duplicateRows.map((item) => item.id);
  const { error } = await supabase
    .from("recipe_ingredients")
    .delete()
    .in("id", duplicateIds);
  if (error) throw error;

  pendingRows.value = pendingRows.value.filter(
    (item) => !duplicateIds.includes(item.id),
  );
  const dish = dishes.value.find((item) => item.id === dishId);
  if (dish?.recipe_ingredients) {
    dish.recipe_ingredients = dish.recipe_ingredients.filter(
      (item) => !duplicateIds.includes(item.id),
    );
  }
};

const saveIngredientFromCandidate = async (
  candidate: any,
  row: RecipeIngredient,
) => {
  try {
    const result = await persistCandidate(candidate);
    if (!result?.success || !result.ingredient_id) {
      throw new Error("No se pudo guardar el candidato");
    }
    const name = row.name || candidate.name;
    const normalizedName = normalizeIngredientName(name);
    const { error } = await supabase
      .from("recipe_ingredients")
      .update({
        ingredient_id: result.ingredient_id,
        name,
        normalized_name: normalizedName,
        unit_type: row.unit_type || "g",
        quantity: row.quantity ?? 1,
        is_confirmed: true,
        is_suggested: false,
        needs_review: false,
      })
      .eq("id", row.id);
    if (error) throw error;

    row.ingredient_id = result.ingredient_id;
    row.name = name;
    row.normalized_name = normalizedName;
    row.unit_type = row.unit_type || "g";
    row.quantity = row.quantity ?? 1;
    row.is_confirmed = true;
    row.is_suggested = false;
    row.needs_review = false;
    await removeDuplicateSuggestedRows(row.recipe_id, row);
    await syncRecipeStatus(row.recipe_id);
    pendingRows.value = pendingRows.value.filter((item) => item.id !== row.id);
    const confirmedIndex = confirmedRows.value.findIndex(
      (item) => item.id === row.id,
    );
    if (confirmedIndex >= 0) {
      confirmedRows.value[confirmedIndex] = { ...row };
    } else {
      confirmedRows.value.unshift({ ...row });
    }
    updateOpenDishRows();
    candidateTargetRowId.value = null;
    candidateResults.value = [];
  } catch (error) {
    await logError("web", error, {
      context: "recipes.saveIngredientFromCandidate",
    });
  }
};

const hasCompleteNutrition = (candidate: any) =>
  [
    candidate?.nutrients?.kcal_per_100g,
    candidate?.nutrients?.protein_per_100g,
    candidate?.nutrients?.carbs_per_100g,
    candidate?.nutrients?.fat_per_100g,
  ].every((value) => value != null);

const pickBestCandidate = (candidates: any[]) => {
  const fullAndHigh = candidates.filter(
    (candidate) =>
      candidate?.reliability === "high" && hasCompleteNutrition(candidate),
  );
  if (fullAndHigh.length > 0) return fullAndHigh[0];
  const fullAny = candidates.filter((candidate) =>
    hasCompleteNutrition(candidate),
  );
  return fullAny[0] || null;
};

const fetchCandidates = async (
  queryText: string,
  source: "usda" | "open_food_facts",
) => {
  const payload = await $fetch<{
    success: boolean;
    candidates?: any[];
  }>("/api/ingredient-search", {
    method: "POST",
    body: {
      query: queryText.trim(),
      source,
    },
  });
  return Array.isArray(payload?.candidates) ? payload.candidates : [];
};

const autoApplyBestCandidate = async (row: RecipeIngredient) => {
  if (!row.name?.trim()) {
    formError.value =
      "El ingrediente debe tener nombre para buscar candidatos.";
    return;
  }

  formError.value = "";
  candidateLoading.value = true;
  try {
    const candidates = await fetchCandidates(row.name, "open_food_facts");
    const bestCandidate = pickBestCandidate(candidates);

    if (!bestCandidate) {
      formError.value =
        "No encontré un candidato nutricional claro. Revisa manualmente con 'Buscar fuente'.";
      return;
    }

    await saveIngredientFromCandidate(bestCandidate, row);
  } catch (error) {
    await logError("web", error, { context: "recipes.autoApplyBestCandidate" });
    formError.value = "No se pudo aplicar el mejor candidato automáticamente.";
  } finally {
    candidateLoading.value = false;
  }
};

const syncRecipeStatus = async (dishId: string) => {
  const dish = dishes.value.find((row) => row.id === dishId);
  if (!dish) return;
  if (/^libre$/i.test(dish.name)) {
    await supabase
      .from("dishes")
      .update({ recipe_status: "not_required" })
      .eq("id", dishId);
    dish.recipe_status = "not_required";
    return;
  }

  const { data: recipeRows } = await supabase
    .from("recipe_ingredients")
    .select("*, ingredients(*)")
    .eq("recipe_id", dishId);
  const confirmed = (recipeRows || []).filter((row: any) => row.is_confirmed);
  if (confirmed.length === 0) {
    await supabase
      .from("dishes")
      .update({
        recipe_status: "suggested_ingredients",
      })
      .eq("id", dishId);
    dish.recipe_status = "suggested_ingredients";
    return;
  }

  await supabase
    .from("dishes")
    .update({
      recipe_status: "complete",
    })
    .eq("id", dishId);
  dish.recipe_status = "complete";
};

const confirmRow = async (dishId: string, row: RecipeIngredient) => {
  formError.value = "";
  if (!row.name || !row.unit_type) {
    formError.value = "Para confirmar, indica nombre y unidad.";
    return;
  }
  const ingredientId =
    row.ingredient_id ||
    (await upsertMasterIngredient(row.name, row.unit_type));
  if (!ingredientId) {
    formError.value = "No se pudo asociar el ingrediente maestro.";
    return;
  }
  const { error } = await supabase
    .from("recipe_ingredients")
    .update({
      ingredient_id: ingredientId,
      name: row.name,
      normalized_name: normalizeIngredientName(row.name),
      quantity: 1,
      unit_type: row.unit_type,
      is_confirmed: true,
      is_suggested: false,
      needs_review: false,
    })
    .eq("id", row.id);
  if (error) {
    formError.value = error.message;
    await logError("web", error, { context: "recipes.confirmRow" });
    return;
  }
  await syncRecipeStatus(dishId);
  row.ingredient_id = ingredientId;
  row.is_confirmed = true;
  row.is_suggested = false;
  pendingRows.value = pendingRows.value.filter((item) => item.id !== row.id);
  confirmedRows.value.unshift({ ...row, quantity: 1, needs_review: false });
  updateOpenDishRows();
};

const saveConfirmedRow = async (dishId: string, row: RecipeIngredient) => {
  formError.value = "";
  if (!row.name || !row.unit_type) {
    formError.value = "Ingrediente confirmado inválido: revisa nombre/unidad.";
    return;
  }
  const ingredientId =
    row.ingredient_id ||
    (await upsertMasterIngredient(row.name, row.unit_type));
  if (!ingredientId) {
    formError.value = "No se pudo asociar el ingrediente maestro.";
    return;
  }
  const { error } = await supabase
    .from("recipe_ingredients")
    .update({
      ingredient_id: ingredientId,
      name: row.name,
      normalized_name: normalizeIngredientName(row.name),
      quantity: 1,
      unit_type: row.unit_type,
      is_confirmed: true,
      is_suggested: false,
    })
    .eq("id", row.id);
  if (error) {
    formError.value = error.message;
    await logError("web", error, { context: "recipes.saveConfirmedRow" });
    return;
  }
  await syncRecipeStatus(dishId);
  const current = confirmedRows.value.find((item) => item.id === row.id);
  if (current) {
    current.name = row.name;
    current.unit_type = row.unit_type;
    current.ingredient_id = ingredientId;
    current.normalized_name = normalizeIngredientName(row.name);
  }
  updateOpenDishRows();
};

const deleteRow = async (dishId: string, rowId: string) => {
  await supabase.from("recipe_ingredients").delete().eq("id", rowId);
  await syncRecipeStatus(dishId);
  pendingRows.value = pendingRows.value.filter((item) => item.id !== rowId);
  confirmedRows.value = confirmedRows.value.filter((item) => item.id !== rowId);
  updateOpenDishRows();
};

const addManualConfirmed = async (dishId: string) => {
  const { data, error } = await supabase
    .from("recipe_ingredients")
    .insert({
      recipe_id: dishId,
      ingredient_id: null,
      name: "nuevo ingrediente",
      normalized_name: normalizeIngredientName("nuevo ingrediente"),
      quantity: 1,
      unit_type: "g",
      is_confirmed: true,
      is_suggested: false,
      needs_review: false,
    })
    .select("*")
    .single();
  if (error) {
    await logError("web", error, { context: "recipes.addManualConfirmed" });
    formError.value = "No se pudo añadir el ingrediente.";
    return;
  }
  await syncRecipeStatus(dishId);
  confirmedRows.value.unshift(data as RecipeIngredient);
  updateOpenDishRows();
};

const confirmAllPendingRows = async (dishId: string) => {
  if (pendingRows.value.length === 0) return;
  savingBatch.value = true;
  formError.value = "";
  try {
    const rows = [...pendingRows.value];
    for (const row of rows) {
      await confirmRow(dishId, row);
    }
  } finally {
    savingBatch.value = false;
  }
};

const saveAllConfirmedRows = async (dishId: string) => {
  if (confirmedRows.value.length === 0) return;
  savingBatch.value = true;
  formError.value = "";
  try {
    const rows = [...confirmedRows.value];
    for (const row of rows) {
      await saveConfirmedRow(dishId, row);
    }
  } finally {
    savingBatch.value = false;
  }
};

const deleteRecipe = async (dishId: string) => {
  if (!confirm("¿Eliminar esta receta y sus ingredientes?")) return;
  try {
    const { error } = await supabase.from("dishes").delete().eq("id", dishId);
    if (error) throw error;
    selectedDishIds.value = selectedDishIds.value.filter((id) => id !== dishId);
    if (editingDishId.value === dishId) {
      editingDishId.value = null;
    }
    await loadRecipes();
  } catch (error) {
    await logError("web", error, { context: "recipes.deleteRecipe" });
  }
};

const deleteSelectedRecipes = async () => {
  if (selectedDishIds.value.length === 0) return;
  if (!confirm(`¿Eliminar ${selectedDishIds.value.length} recetas?`)) return;
  try {
    const { error } = await supabase
      .from("dishes")
      .delete()
      .in("id", selectedDishIds.value);
    if (error) throw error;
    selectedDishIds.value = [];
    editingDishId.value = null;
    await loadRecipes();
  } catch (error) {
    await logError("web", error, { context: "recipes.deleteSelectedRecipes" });
  }
};

const mergeSelectedRecipes = async () => {
  if (!mergeTargetId.value || selectedDishIds.value.length < 2) return;
  mergingRecipes.value = true;
  formError.value = "";
  try {
    const targetDish = dishes.value.find(
      (dish) => dish.id === mergeTargetId.value,
    );
    if (!targetDish) throw new Error("Receta destino no encontrada");

    const sourceIds = selectedDishIds.value.filter(
      (id) => id !== mergeTargetId.value,
    );
    const finalName = (mergeFinalName.value || targetDish.name).trim();
    if (!finalName) throw new Error("Nombre final inválido");

    const { data: targetRows } = await supabase
      .from("recipe_ingredients")
      .select("*")
      .eq("recipe_id", mergeTargetId.value);
    const targetByNormalized = new Map(
      (targetRows || []).map((row: any) => [String(row.normalized_name), row]),
    );

    for (const sourceId of sourceIds) {
      const sourceDish = dishes.value.find((dish) => dish.id === sourceId);
      const sourceName = sourceDish?.name?.trim();
      const { data: sourceRows } = await supabase
        .from("recipe_ingredients")
        .select("*")
        .eq("recipe_id", sourceId);

      for (const row of sourceRows || []) {
        const key = String(row.normalized_name || "").trim();
        if (!key) continue;
        const existing = targetByNormalized.get(key);
        if (!existing) {
          const { data: inserted, error: insertError } = await supabase
            .from("recipe_ingredients")
            .insert({
              recipe_id: mergeTargetId.value,
              ingredient_id: row.ingredient_id || null,
              name: row.name,
              normalized_name: key,
              quantity: row.quantity ?? null,
              unit_type: row.unit_type ?? null,
              is_confirmed: !!row.is_confirmed,
              is_suggested: !!row.is_suggested,
              needs_review: !!row.needs_review,
            })
            .select("*")
            .single();
          if (insertError) throw insertError;
          if (inserted) targetByNormalized.set(key, inserted);
          continue;
        }

        const needsUpgrade =
          (!existing.is_confirmed && row.is_confirmed) ||
          (!existing.ingredient_id && row.ingredient_id) ||
          (existing.quantity == null && row.quantity != null) ||
          (!existing.unit_type && row.unit_type);
        if (needsUpgrade) {
          const { error: updateError } = await supabase
            .from("recipe_ingredients")
            .update({
              ingredient_id:
                existing.ingredient_id || row.ingredient_id || null,
              quantity: existing.quantity ?? row.quantity ?? null,
              unit_type: existing.unit_type || row.unit_type || null,
              is_confirmed: Boolean(existing.is_confirmed || row.is_confirmed),
              is_suggested: Boolean(existing.is_suggested && !row.is_confirmed),
              needs_review: Boolean(existing.needs_review && row.needs_review),
            })
            .eq("id", existing.id);
          if (updateError) throw updateError;
        }
      }

      if (sourceName) {
        await supabase
          .from("weekly_meals")
          .update({ dish_name: finalName })
          .eq("dish_name", sourceName);
        await supabase
          .from("saved_fixed_meals")
          .update({ dish_name: finalName })
          .eq("dish_name", sourceName);
        await supabase
          .from("rotating_menu_meals")
          .update({ dish_name: finalName })
          .eq("dish_name", sourceName);
      }

      const { error: deleteSourceError } = await supabase
        .from("dishes")
        .delete()
        .eq("id", sourceId);
      if (deleteSourceError) throw deleteSourceError;
    }

    const { error: renameError } = await supabase
      .from("dishes")
      .update({
        name: finalName,
        normalized_name: normalizeIngredientName(finalName),
      })
      .eq("id", mergeTargetId.value);
    if (renameError) throw renameError;

    selectedDishIds.value = [];
    cancelMergePanel();
    await loadRecipes();
  } catch (error) {
    formError.value =
      error instanceof Error ? error.message : "No se pudo fusionar recetas";
    await logError("web", error, { context: "recipes.mergeSelectedRecipes" });
  } finally {
    mergingRecipes.value = false;
  }
};

const splitRecipe = async () => {
  if (!splitSourceDish.value) return;
  splittingRecipe.value = true;
  formError.value = "";
  try {
    const currentUser = await loadCurrentUser();
    if (!currentUser) throw new Error("Usuario no disponible");

    const parts = normalizeSplitParts(splitCandidates.value).filter(
      (part) => part.length >= 3,
    );
    if (parts.length < 2) {
      throw new Error("No hay suficientes partes para dividir la receta.");
    }

    const sourceRecipeId = splitSourceDish.value.id;
    const { data: sourceIngredients } = await supabase
      .from("recipe_ingredients")
      .select("*")
      .eq("recipe_id", sourceRecipeId);

    const createdOrFound: Array<{ id: string; name: string }> = [];
    for (const partName of parts) {
      const normalized = normalizeIngredientName(partName);
      const { data: existing, error: existingError } = await supabase
        .from("dishes")
        .select("id,name")
        .eq("user_id", currentUser.id)
        .eq("normalized_name", normalized)
        .maybeSingle();
      if (existingError) throw existingError;

      if (existing?.id) {
        createdOrFound.push({ id: existing.id, name: existing.name });
        continue;
      }

      const { data: insertedDish, error: insertError } = await supabase
        .from("dishes")
        .insert({
          user_id: currentUser.id,
          name: partName,
          normalized_name: normalized,
          description: null,
          recipe_status: "suggested_ingredients",
          source: "manual",
          servings_base: 1,
        })
        .select("id,name")
        .single();
      if (insertError) throw insertError;
      if (insertedDish) {
        createdOrFound.push({ id: insertedDish.id, name: insertedDish.name });
      }
    }

    // Reparte sugerencias de ingredientes de la receta original en las nuevas partes
    for (const targetDish of createdOrFound) {
      const splitNameTokens = tokenize(
        normalizeIngredientName(targetDish.name),
      );
      const candidates = (sourceIngredients || []).filter((ingredient: any) => {
        const ingredientTokens = tokenize(
          normalizeIngredientName(ingredient.name || ""),
        );
        return ingredientTokens.some((token) =>
          splitNameTokens.includes(token),
        );
      });
      if (candidates.length === 0) continue;

      for (const candidate of candidates) {
        const normalizedName = normalizeIngredientName(candidate.name || "");
        if (!normalizedName) continue;
        await supabase.from("recipe_ingredients").upsert(
          {
            recipe_id: targetDish.id,
            ingredient_id: candidate.ingredient_id || null,
            name: candidate.name,
            normalized_name: normalizedName,
            quantity: candidate.quantity ?? 1,
            unit_type: candidate.unit_type || "g",
            is_confirmed: false,
            is_suggested: true,
            needs_review: true,
          },
          {
            onConflict: "recipe_id,normalized_name",
          },
        );
      }
    }

    closeSplitPanel();
    await loadRecipes();
  } catch (error) {
    formError.value =
      error instanceof Error ? error.message : "No se pudo dividir la receta";
    await logError("web", error, { context: "recipes.splitRecipe" });
  } finally {
    splittingRecipe.value = false;
  }
};

const tokenize = (value: string) =>
  value
    .split(/[^a-z0-9]+/gi)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);

const addBulkIngredients = async (dishId: string) => {
  if (!bulkIngredientInput.value.trim()) return;
  savingBulkIngredients.value = true;
  formError.value = "";
  try {
    const parsedRows = bulkIngredientInput.value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const normalized = normalizeIngredientName(line);
        return {
          recipe_id: dishId,
          ingredient_id: null,
          name: line,
          normalized_name: normalized,
          quantity: 1,
          unit_type: "g",
          is_confirmed: true,
          is_suggested: false,
          needs_review: false,
        };
      })
      .filter((row) => row.normalized_name);

    if (parsedRows.length === 0) {
      formError.value = "No se encontraron ingredientes válidos para añadir.";
      return;
    }

    const dedupedRows = Array.from(
      new Map(parsedRows.map((row) => [row.normalized_name, row])).values(),
    );

    const { error } = await supabase
      .from("recipe_ingredients")
      .upsert(dedupedRows, {
        onConflict: "recipe_id,normalized_name",
      });
    if (error) throw error;

    await syncRecipeStatus(dishId);
    await refreshEditingDish(dishId);
    bulkIngredientInput.value = "";
  } catch (error) {
    formError.value =
      error instanceof Error ? error.message : "Error añadiendo ingredientes";
    await logError("web", error, { context: "recipes.addBulkIngredients" });
  } finally {
    savingBulkIngredients.value = false;
  }
};

onMounted(async () => {
  await loadRecipes();
  await openRecipeFromRoute();
});

watch(
  () => route.query.recipe,
  async () => {
    await openRecipeFromRoute();
  },
);
</script>
