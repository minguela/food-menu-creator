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
      <div class="flex flex-wrap gap-2">
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
      </div>
    </section>

    <section class="space-y-3">
      <article
        v-for="dish in filteredDishes"
        :key="dish.id"
        class="bg-white rounded-lg border p-4"
      >
        <div class="flex flex-wrap justify-between gap-3">
          <div>
            <h2 class="font-semibold text-gray-900">{{ dish.name }}</h2>
            <p class="text-sm text-gray-500">
              {{ dish.description || "Sin descripción" }}
            </p>
            <p class="text-xs mt-1" :class="statusMeta(dish).color">
              {{ statusMeta(dish).label }}
            </p>
          </div>
          <button class="text-sm text-indigo-700" @click="toggleEdit(dish.id)">
            {{ editingDishId === dish.id ? "Cerrar" : "Editar / Curar" }}
          </button>
        </div>

        <div v-if="editingDishId === dish.id" class="mt-4 space-y-3">
          <p
            class="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2"
          >
            Ingredientes detectados desde el nombre del plato. Revisa y confirma
            antes de usar para cálculos.
          </p>

          <h3 class="text-sm font-medium text-gray-900">
            Sugeridos (sin confirmar)
          </h3>
          <div v-if="pendingRows.length === 0" class="text-sm text-gray-500">
            No hay sugerencias pendientes.
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="row in pendingRows"
              :key="row.id"
              class="grid grid-cols-[1fr_120px_100px_140px] gap-2"
            >
              <input
                v-model.trim="row.name"
                class="border rounded-lg px-3 py-2"
              />
              <input
                v-model.number="row.quantity"
                type="number"
                min="0.01"
                step="0.01"
                class="border rounded-lg px-3 py-2"
                placeholder="Cantidad"
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
                  Buscar y aplicar mejor
                </button>
                <button
                  class="text-xs text-sky-700"
                  @click="openCandidateSearch(row)"
                >
                  Buscar fuente
                </button>
                <button
                  class="text-xs text-green-700"
                  @click="confirmRow(dish.id, row)"
                >
                  Confirmar
                </button>
                <button class="text-xs text-red-700" @click="deleteRow(row.id)">
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
                    <option value="usda">USDA</option>
                    <option value="open_food_facts">Open Food Facts</option>
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
                    Usar candidato
                  </button>
                </div>
              </div>
            </div>
          </div>

          <h3 class="text-sm font-medium text-gray-900">
            Confirmados (base receta)
          </h3>
          <div class="space-y-2">
            <div
              v-for="row in confirmedRows"
              :key="row.id"
              class="grid grid-cols-[1fr_120px_100px_140px] gap-2"
            >
              <input
                v-model.trim="row.name"
                class="border rounded-lg px-3 py-2"
              />
              <input
                v-model.number="row.quantity"
                type="number"
                min="0.01"
                step="0.01"
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
                  Buscar y aplicar mejor
                </button>
                <button
                  class="text-xs text-sky-700"
                  @click="openCandidateSearch(row)"
                >
                  Buscar fuente
                </button>
                <button
                  class="text-xs text-indigo-700"
                  @click="saveConfirmedRow(row)"
                >
                  Guardar
                </button>
                <button class="text-xs text-red-700" @click="deleteRow(row.id)">
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
                    <option value="usda">USDA</option>
                    <option value="open_food_facts">Open Food Facts</option>
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
                    Usar candidato
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

          <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { logError } from "~/utils/log-error";
import { calculateRecipeNutrition } from "~/utils/recipe-nutrition";
import { normalizeIngredientName } from "~/utils/ingredient-normalize";
import { saveIngredientFromCandidate as persistCandidate } from "~/utils/save-ingredient-from-candidate";
import type { Dish, Ingredient, RecipeIngredient } from "~/types";

type DishRow = Dish & {
  recipe_ingredients?: Array<
    RecipeIngredient & { ingredients?: Ingredient | null }
  >;
};

const supabase = useSupabase();
const runtimeConfig = useRuntimeConfig();
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
const filter = ref<
  | "all"
  | "pending"
  | "suggested"
  | "complete"
  | "incomplete_nutrition"
  | "not_required"
>("all");
const filterItems = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "suggested", label: "Sugeridas" },
  { value: "complete", label: "Completas" },
  { value: "incomplete_nutrition", label: "Nutrición incompleta" },
  { value: "not_required", label: "No requiere" },
] as const;

const editingDishId = ref<string | null>(null);
const pendingRows = ref<Array<RecipeIngredient>>([]);
const confirmedRows = ref<Array<RecipeIngredient>>([]);
const formError = ref("");
const candidateTargetRowId = ref<string | null>(null);
const candidateSource = ref<"usda" | "open_food_facts" | "bedca">("usda");
const candidateQuery = ref("");
const candidateResults = ref<any[]>([]);
const candidateLoading = ref(false);

const statusMeta = (dish: DishRow) => {
  const status = dish.recipe_status || "pending_ingredients";
  if (status === "complete")
    return { label: "Completa", color: "text-emerald-700" };
  if (status === "not_required")
    return { label: "No requiere ingredientes", color: "text-gray-500" };
  if (status === "incomplete_nutrition")
    return {
      label: "Pendiente de datos nutricionales",
      color: "text-amber-700",
    };
  if (status === "suggested_ingredients")
    return { label: "Sugerencias por confirmar", color: "text-amber-700" };
  return { label: "Pendiente de ingredientes", color: "text-amber-700" };
};

const filteredDishes = computed(() =>
  dishes.value.filter((dish) => {
    if (filter.value === "all") return true;
    if (filter.value === "pending")
      return dish.recipe_status === "pending_ingredients";
    if (filter.value === "suggested")
      return dish.recipe_status === "suggested_ingredients";
    if (filter.value === "complete") return dish.recipe_status === "complete";
    if (filter.value === "incomplete_nutrition")
      return dish.recipe_status === "incomplete_nutrition";
    return dish.recipe_status === "not_required";
  }),
);

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
};

const toggleEdit = (dishId: string) => {
  formError.value = "";
  if (editingDishId.value === dishId) {
    editingDishId.value = null;
    pendingRows.value = [];
    confirmedRows.value = [];
    return;
  }
  editingDishId.value = dishId;
  const dish = dishes.value.find((row) => row.id === dishId);
  pendingRows.value = (dish?.recipe_ingredients || [])
    .filter((row) => !row.is_confirmed)
    .map((row) => ({ ...row }));
  confirmedRows.value = (dish?.recipe_ingredients || [])
    .filter((row) => row.is_confirmed)
    .map((row) => ({ ...row }));
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
        body: JSON.stringify({
          query: candidateQuery.value.trim(),
          source: candidateSource.value,
        }),
      },
    );
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error || "No se pudo buscar candidato");
    }
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

const saveIngredientFromCandidate = async (
  candidate: any,
  row: RecipeIngredient,
) => {
  try {
    const result = await persistCandidate(candidate);
    if (!result?.success || !result.ingredient_id) {
      throw new Error("No se pudo guardar el candidato");
    }
    row.ingredient_id = result.ingredient_id;
    row.name = row.name || candidate.name;
    row.normalized_name = normalizeIngredientName(row.name);
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
      body: JSON.stringify({
        query: queryText.trim(),
        source,
      }),
    },
  );
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || "No se pudo buscar candidato");
  }
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
    let candidates = await fetchCandidates(row.name, "usda");
    let bestCandidate = pickBestCandidate(candidates);

    if (!bestCandidate) {
      candidates = await fetchCandidates(row.name, "open_food_facts");
      bestCandidate = pickBestCandidate(candidates);
    }

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
    return;
  }

  const { data: recipeRows } = await supabase
    .from("recipe_ingredients")
    .select("*, ingredients(*)")
    .eq("recipe_id", dishId);
  const confirmed = (recipeRows || []).filter((row: any) => row.is_confirmed);
  if (confirmed.length === 0) {
    const suggested = (recipeRows || []).some((row: any) => row.is_suggested);
    await supabase
      .from("dishes")
      .update({
        recipe_status: suggested
          ? "suggested_ingredients"
          : "pending_ingredients",
      })
      .eq("id", dishId);
    return;
  }

  const nutrition = calculateRecipeNutrition(confirmed as any);
  await supabase
    .from("dishes")
    .update({
      recipe_status: nutrition.complete ? "complete" : "incomplete_nutrition",
    })
    .eq("id", dishId);
};

const confirmRow = async (dishId: string, row: RecipeIngredient) => {
  formError.value = "";
  if (!row.name || !row.quantity || row.quantity <= 0 || !row.unit_type) {
    formError.value = "Para confirmar, indica nombre, cantidad y unidad.";
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
      quantity: row.quantity,
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
  await loadRecipes();
  toggleEdit(dishId);
};

const saveConfirmedRow = async (row: RecipeIngredient) => {
  formError.value = "";
  if (!row.name || !row.quantity || row.quantity <= 0 || !row.unit_type) {
    formError.value =
      "Ingrediente confirmado inválido: revisa nombre/cantidad/unidad.";
    return;
  }
  const ingredientId =
    row.ingredient_id ||
    (await upsertMasterIngredient(row.name, row.unit_type));
  const { error } = await supabase
    .from("recipe_ingredients")
    .update({
      ingredient_id: ingredientId,
      name: row.name,
      normalized_name: normalizeIngredientName(row.name),
      quantity: row.quantity,
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
  if (editingDishId.value) await syncRecipeStatus(editingDishId.value);
  await loadRecipes();
  if (editingDishId.value) toggleEdit(editingDishId.value);
};

const deleteRow = async (rowId: string) => {
  await supabase.from("recipe_ingredients").delete().eq("id", rowId);
  if (editingDishId.value) await syncRecipeStatus(editingDishId.value);
  await loadRecipes();
  if (editingDishId.value) toggleEdit(editingDishId.value);
};

const addManualConfirmed = async (dishId: string) => {
  await supabase.from("recipe_ingredients").insert({
    recipe_id: dishId,
    ingredient_id: null,
    name: "nuevo ingrediente",
    normalized_name: normalizeIngredientName("nuevo ingrediente"),
    quantity: 1,
    unit_type: "g",
    is_confirmed: true,
    is_suggested: false,
    needs_review: false,
  });
  await syncRecipeStatus(dishId);
  await loadRecipes();
  toggleEdit(dishId);
};

onMounted(loadRecipes);
</script>
