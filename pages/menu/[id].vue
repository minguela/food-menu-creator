<template>
  <div>
    <div v-if="loading" class="text-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"
      ></div>
      <p class="mt-4 text-gray-600">Cargando menú...</p>
    </div>

    <div v-else-if="menu" class="space-y-6">
      <header class="flex flex-wrap justify-between gap-4">
        <div>
          <button
            @click="$router.back()"
            class="text-gray-500 hover:text-gray-700 mb-2"
          >
            ← Volver
          </button>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-gray-900">{{ menu.name }}</h1>
            <span
              class="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full"
            >
              Semana {{ menu.week_number }}
            </span>
          </div>
          <p class="text-sm text-gray-500 mt-1">
            {{ mealsCount }}/21 comidas · {{ formatDate(menu.created_at) }}
          </p>
        </div>
        <div class="text-right flex flex-col items-end gap-3">
          <button
            type="button"
            class="text-sm text-red-600 hover:text-red-800"
            @click="deleteMenu"
          >
            Eliminar menú
          </button>
          <p class="text-sm text-gray-500">Ingredientes únicos</p>
          <p class="text-2xl font-semibold text-gray-900">
            {{ consolidatedIngredients.length }}
          </p>
        </div>
      </header>

      <section class="bg-white rounded-lg shadow-sm border p-4">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="font-semibold text-gray-900">Crear desde imagen</h2>
            <p class="text-sm text-gray-500 mt-1">
              Sube una foto por día o una imagen que contenga varios días del
              menú.
            </p>
          </div>
          <div class="inline-flex rounded-lg border overflow-hidden">
            <button
              type="button"
              @click="creationMode = 'daily'"
              class="px-3 py-2 text-sm font-medium"
              :class="
                creationMode === 'daily'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              "
            >
              Día a día
            </button>
            <button
              type="button"
              @click="creationMode = 'block'"
              class="px-3 py-2 text-sm font-medium border-l"
              :class="
                creationMode === 'block'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              "
            >
              Por bloque
            </button>
          </div>
        </div>

        <div v-if="creationMode === 'daily'" class="mt-4 text-sm text-gray-600">
          Usa el botón de imagen de cada día. El OCR rellenará los platos
          detectados y podrás corregirlos debajo.
        </div>

        <div class="mt-4">
          <p class="text-sm font-medium text-gray-700 mb-2">
            Franjas a extraer del OCR
          </p>
          <div class="flex flex-wrap gap-2">
            <label
              v-for="type in mealTypes"
              :key="`ocr-type-${type}`"
              class="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border cursor-pointer"
            >
              <input
                v-model="ocrMealTypes"
                type="checkbox"
                :value="type"
                class="h-4 w-4"
              />
              <span>{{ mealLabel(type) }}</span>
            </label>
          </div>
        </div>

        <div
          v-if="creationMode === 'block'"
          class="mt-4 grid gap-3 md:grid-cols-[140px_140px_1fr]"
        >
          <label>
            <span class="block text-sm font-medium text-gray-700 mb-1"
              >Día inicial</span
            >
            <input
              v-model.number="blockStartDay"
              type="number"
              min="1"
              max="7"
              class="w-full border rounded-lg px-3 py-2"
            />
          </label>
          <label>
            <span class="block text-sm font-medium text-gray-700 mb-1"
              >Días incluidos</span
            >
            <input
              v-model.number="blockDayCount"
              type="number"
              min="1"
              :max="8 - blockStartDay"
              class="w-full border rounded-lg px-3 py-2"
            />
          </label>
          <label class="self-end">
            <span class="sr-only">Subir imagen de bloque</span>
            <input
              type="file"
              accept="image/*"
              class="hidden"
              @change="uploadBlockImage"
            />
            <span
              class="block text-center px-4 py-2 rounded-lg border border-indigo-600 text-indigo-700 cursor-pointer hover:bg-indigo-50"
              :class="imageProcessing ? 'opacity-50 pointer-events-none' : ''"
            >
              {{
                imageProcessing
                  ? "Procesando OCR..."
                  : "Subir imagen del bloque"
              }}
            </span>
          </label>
        </div>

        <p v-if="imageError" class="text-sm text-red-600 mt-3">
          {{ imageError }}
        </p>
      </section>

      <section class="grid gap-4 lg:grid-cols-7">
        <article
          v-for="day in 7"
          :key="day"
          class="bg-white rounded-lg shadow-sm border overflow-hidden"
        >
          <div class="p-3 border-b bg-gray-50">
            <div class="flex justify-between items-center">
              <h2 class="font-semibold text-gray-900">Día {{ day }}</h2>
              <label
                class="text-xs text-indigo-600 cursor-pointer hover:text-indigo-800"
                :class="imageProcessing ? 'opacity-50 pointer-events-none' : ''"
              >
                {{ imageProcessing ? "OCR..." : "Imagen" }}
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="uploadDailyImage(day, $event)"
                />
              </label>
            </div>
            <img
              v-if="getDayImage(day)"
              :src="getDayImage(day)?.image_url"
              alt="Imagen del menú diario"
              class="mt-3 h-28 w-full object-cover rounded"
            />
            <p
              v-if="getDayImage(day)?.ocr_status"
              class="text-[11px] text-gray-500 mt-2"
            >
              OCR: {{ ocrStatusLabel(getDayImage(day)?.ocr_status) }}
            </p>
          </div>

          <div class="divide-y">
            <div
              v-for="type in mealTypes"
              :key="`${day}-${type}`"
              class="p-3 min-h-[130px]"
            >
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-medium" :class="mealColor(type)">
                  {{ mealLabel(type) }}
                </p>
                <button
                  v-if="!getMeal(day, type)"
                  @click="openMealModal(day, type)"
                  class="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  + Añadir
                </button>
              </div>

              <div v-if="getMeal(day, type)" class="space-y-2">
                <p class="text-sm font-semibold text-gray-900">
                  {{ getMeal(day, type)?.dish_name }}
                </p>
                <p class="text-xs text-amber-700">Pendiente de cálculo</p>
                <ul class="text-xs text-gray-600 space-y-1">
                  <li
                    v-for="ingredient in getMeal(day, type)
                      ?.weekly_meal_ingredients || []"
                    :key="ingredient.id"
                  >
                    {{ ingredient.name }} · {{ ingredient.quantity }}
                    {{ ingredient.unit_type }}
                  </li>
                </ul>
                <button
                  @click="openMealModal(day, type, getMeal(day, type)!)"
                  class="text-xs text-indigo-600 hover:text-indigo-800 mr-3"
                >
                  Editar
                </button>
                <button
                  @click="deleteMeal(getMeal(day, type)!.id)"
                  class="text-xs text-red-500 hover:text-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>

          <div class="p-3 bg-gray-50 border-t text-xs text-amber-700">
            Totales nutricionales pendientes de cálculo en menú rotativo
          </div>
        </article>
      </section>

      <section class="bg-white rounded-lg shadow-sm border p-4">
        <h2 class="font-semibold text-gray-900 mb-3">
          Ingredientes consolidados
        </h2>
        <div
          v-if="consolidatedIngredients.length === 0"
          class="text-sm text-gray-500"
        >
          Añade ingredientes exactos a los platos para generar una lista de
          compra deduplicada.
        </div>
        <div v-else class="grid gap-2 md:grid-cols-4">
          <div
            v-for="ingredient in consolidatedIngredients"
            :key="`${ingredient.name}-${ingredient.unit_type}`"
            class="text-sm bg-gray-50 rounded p-2"
          >
            <p class="font-medium text-gray-900">{{ ingredient.name }}</p>
            <p class="text-gray-600">
              {{ ingredient.quantity }} {{ ingredient.unit_type }}
            </p>
          </div>
        </div>
      </section>

      <div
        v-if="showMealModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="closeMealModal"
      >
        <form
          class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          @submit.prevent="saveMeal"
        >
          <h2 class="text-xl font-bold mb-4">
            {{ editingMealId ? "Editar" : "Añadir" }}
            {{ mealLabel(selectedType).toLowerCase() }} · Día {{ selectedDay }}
          </h2>

          <div class="grid gap-3 md:grid-cols-2">
            <label class="md:col-span-2">
              <span class="block text-sm font-medium text-gray-700 mb-1"
                >Plato</span
              >
              <input
                v-model.trim="newMeal.dish_name"
                class="w-full border rounded-lg px-4 py-2"
                required
              />
            </label>
            <label class="md:col-span-2">
              <span class="block text-sm font-medium text-gray-700 mb-1"
                >Descripción</span
              >
              <input
                v-model.trim="newMeal.dish_description"
                class="w-full border rounded-lg px-4 py-2"
              />
            </label>
          </div>

          <div
            v-if="selectedType === 'desayuno'"
            class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3"
          >
            <label class="flex items-start gap-3 text-sm text-emerald-900">
              <input
                v-model="applyBreakfastToWeek"
                type="checkbox"
                class="mt-1 h-4 w-4 accent-emerald-600"
              />
              <span>
                Aplicar este desayuno a los 7 días del menú y guardarlo también
                como receta/plato reutilizable.
              </span>
            </label>
          </div>

          <div class="mt-5">
            <div class="flex justify-between items-center mb-2">
              <h3 class="font-medium text-gray-900">Ingredientes exactos</h3>
              <button
                type="button"
                @click="addIngredientRow"
                class="text-sm text-indigo-600 hover:text-indigo-800"
              >
                + Ingrediente
              </button>
            </div>

            <div class="space-y-2">
              <div
                v-for="(ingredient, index) in ingredientRows"
                :key="index"
                class="grid grid-cols-[1fr_90px_90px_32px] gap-2"
              >
                <input
                  v-model.trim="ingredient.name"
                  class="border rounded-lg px-3 py-2"
                  placeholder="Nombre"
                />
                <input
                  v-model.number="ingredient.quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  class="border rounded-lg px-3 py-2"
                />
                <select
                  v-model="ingredient.unit_type"
                  class="border rounded-lg px-3 py-2"
                >
                  <option v-for="unit in unitTypes" :key="unit" :value="unit">
                    {{ unit }}
                  </option>
                </select>
                <button
                  type="button"
                  @click="removeIngredientRow(index)"
                  class="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          <p v-if="formError" class="text-sm text-red-600 mt-3">
            {{ formError }}
          </p>

          <div class="flex justify-end gap-2 mt-6">
            <button
              type="button"
              @click="closeMealModal"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="savingMeal || !mealFormValid"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {{
                savingMeal
                  ? "Guardando..."
                  : applyBreakfastToWeek && selectedType === "desayuno"
                    ? "Aplicar desayuno"
                    : editingMealId
                      ? "Actualizar plato"
                      : "Guardar plato"
              }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-else class="text-center py-12 bg-white rounded-lg border">
      <p class="text-gray-600">Menú no encontrado</p>
      <button
        @click="$router.push('/')"
        class="mt-4 text-indigo-600 hover:text-indigo-800"
      >
        Volver a la lista
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MEAL_TYPES } from "~/utils/nutrition.js";
import { logError } from "~/utils/log-error";
import {
  extractIngredientCandidatesFromDishName,
  getRecipeStatusFromDishName,
} from "~/utils/ingredient-candidates";
import type {
  WeeklyDayImage,
  WeeklyMeal,
  WeeklyMealIngredient,
  WeeklyMenu,
} from "~/types";

type MealType = WeeklyMeal["meal_type"];

const supabase = useSupabase();
const route = useRoute();
const router = useRouter();
const runtimeConfig = useRuntimeConfig();
const { loadCurrentUser } = useCurrentUser();

const mealTypes = MEAL_TYPES as MealType[];
const unitTypes: WeeklyMealIngredient["unit_type"][] = [
  "g",
  "kg",
  "ml",
  "l",
  "ud",
  "pack",
  "unidad",
];

const menu = ref<WeeklyMenu | null>(null);
const meals = ref<WeeklyMeal[]>([]);
const dayImages = ref<WeeklyDayImage[]>([]);
const loading = ref(true);
const showMealModal = ref(false);
const savingMeal = ref(false);
const imageProcessing = ref(false);
const formError = ref("");
const imageError = ref("");
const selectedDay = ref(1);
const selectedType = ref<MealType>("comida");
const editingMealId = ref<string | null>(null);
const creationMode = ref<"daily" | "block">("daily");
const blockStartDay = ref(1);
const blockDayCount = ref(3);
const ocrMealTypes = ref<MealType[]>(["comida", "cena"]);
const applyBreakfastToWeek = ref(false);
const newMeal = ref({
  dish_name: "",
  dish_description: "",
});
const ingredientRows = ref<
  Array<{
    name: string;
    quantity: number;
    unit_type: WeeklyMealIngredient["unit_type"];
  }>
>([]);

const mealsCount = computed(() => meals.value.length);

const consolidatedIngredients = computed(() => {
  const consolidated: Record<
    string,
    { name: string; quantity: number; unit_type: string }
  > = {};

  for (const meal of meals.value) {
    for (const ingredient of meal.weekly_meal_ingredients || []) {
      const key = `${ingredient.name.toLowerCase()}::${ingredient.unit_type}`;
      if (!consolidated[key]) {
        consolidated[key] = {
          name: ingredient.name,
          quantity: 0,
          unit_type: ingredient.unit_type,
        };
      }
      consolidated[key].quantity += Number(ingredient.quantity) || 0;
    }
  }

  return Object.values(consolidated)
    .map((item) => ({
      ...item,
      quantity: Math.round(item.quantity * 100) / 100,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
});

const mealFormValid = computed(
  () =>
    Boolean(newMeal.value.dish_name) &&
    ingredientRows.value.every(
      (ingredient) => !ingredient.name || ingredient.quantity > 0,
    ),
);

const loadMenu = async () => {
  loading.value = true;
  const currentUser = await loadCurrentUser();

  if (!currentUser) {
    menu.value = null;
    loading.value = false;
    return;
  }

  const { data: menuData } = await supabase
    .from("weekly_menus")
    .select("*")
    .eq("id", route.params.id)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (!menuData) {
    menu.value = null;
    loading.value = false;
    return;
  }

  menu.value = menuData;

  const [{ data: mealsData }, { data: imagesData }] = await Promise.all([
    supabase
      .from("weekly_meals")
      .select("*, weekly_meal_ingredients(*)")
      .eq("weekly_menu_id", route.params.id as string)
      .order("day_number", { ascending: true }),
    supabase
      .from("weekly_day_images")
      .select("*")
      .eq("weekly_menu_id", route.params.id as string)
      .order("day_number", { ascending: true }),
  ]);

  meals.value = mealsData || [];
  dayImages.value = imagesData || [];
  await ensureRecipeLibrary(meals.value);
  loading.value = false;
};

const ensureRecipeLibrary = async (weeklyMeals: WeeklyMeal[]) => {
  const currentUser = await loadCurrentUser();
  if (!currentUser) return;
  const names = Array.from(
    new Set(weeklyMeals.map((meal) => meal.dish_name?.trim())),
  ).filter(Boolean) as string[];
  if (names.length === 0) return;

  const { data: existing } = await supabase
    .from("dishes")
    .select("id,name,recipe_status")
    .eq("user_id", currentUser.id)
    .in("name", names);
  const existingByName = new Map(
    (existing || []).map((item: any) => [item.name, item]),
  );

  const toInsert = names
    .filter((name) => !existingByName.has(name))
    .map((name) => {
      const candidates = extractIngredientCandidatesFromDishName(name);
      return {
        user_id: currentUser.id,
        name,
        description: null,
        kcal: null,
        protein_g: null,
        carbs_g: null,
        fat_g: null,
        servings_base: 1,
        recipe_status: getRecipeStatusFromDishName(name, candidates),
      };
    });

  if (toInsert.length > 0) {
    const { data: insertedDishes } = await supabase
      .from("dishes")
      .insert(toInsert)
      .select("id,name");

    const suggestions = (insertedDishes || []).flatMap((dish: any) => {
      const candidates = extractIngredientCandidatesFromDishName(
        dish.name || "",
      );
      return candidates.map((candidate) => ({
        dish_id: dish.id,
        name: candidate.name,
        confidence: candidate.confidence,
        source: candidate.source,
        needs_review: candidate.needs_review,
        confirmed: false,
      }));
    });

    if (suggestions.length > 0) {
      await supabase
        .from("dish_ingredient_suggestions")
        .upsert(suggestions, { onConflict: "dish_id,name" });
    }
  }
};

const getMeal = (day: number, type: MealType) => {
  return meals.value.find(
    (meal) => meal.day_number === day && meal.meal_type === type,
  );
};

const getDayImage = (day: number) => {
  return dayImages.value.find((image) => image.day_number === day);
};

watch(blockStartDay, (day) => {
  const normalizedDay = Math.min(7, Math.max(1, Number(day) || 1));
  if (normalizedDay !== day) blockStartDay.value = normalizedDay;
  blockDayCount.value = Math.min(blockDayCount.value, 8 - normalizedDay);
});

watch(blockDayCount, (count) => {
  const normalizedCount = Math.min(
    8 - blockStartDay.value,
    Math.max(1, Number(count) || 1),
  );
  if (normalizedCount !== count) blockDayCount.value = normalizedCount;
});

const openMealModal = (day: number, type: MealType, meal?: WeeklyMeal) => {
  selectedDay.value = day;
  selectedType.value = type;
  editingMealId.value = meal?.id || null;
  applyBreakfastToWeek.value = false;
  newMeal.value = meal
    ? {
        dish_name: meal.dish_name,
        dish_description: meal.dish_description || "",
      }
    : {
        dish_name: "",
        dish_description: "",
      };
  ingredientRows.value = meal?.weekly_meal_ingredients?.length
    ? meal.weekly_meal_ingredients.map((ingredient) => ({
        name: ingredient.name,
        quantity: Number(ingredient.quantity) || 1,
        unit_type: ingredient.unit_type,
      }))
    : [{ name: "", quantity: 1, unit_type: "g" }];
  formError.value = "";
  showMealModal.value = true;
};

const closeMealModal = () => {
  showMealModal.value = false;
  editingMealId.value = null;
  applyBreakfastToWeek.value = false;
  formError.value = "";
};

const addIngredientRow = () => {
  ingredientRows.value.push({ name: "", quantity: 1, unit_type: "g" });
};

const removeIngredientRow = (index: number) => {
  ingredientRows.value.splice(index, 1);
};

const saveMeal = async () => {
  if (!menu.value || !mealFormValid.value) return;
  const currentUser = await loadCurrentUser();
  if (!currentUser) return;

  savingMeal.value = true;
  formError.value = "";

  const rowsToInsert = ingredientRows.value.filter(
    (ingredient) => ingredient.name && ingredient.quantity > 0,
  );

  const targetDays =
    applyBreakfastToWeek.value && selectedType.value === "desayuno"
      ? [1, 2, 3, 4, 5, 6, 7]
      : [selectedDay.value];

  for (const day of targetDays) {
    const { data: savedMeal, error: upsertError } = await supabase
      .from("weekly_meals")
      .upsert(
        {
          weekly_menu_id: menu.value.id,
          day_number: day,
          meal_type: selectedType.value,
          dish_name: newMeal.value.dish_name,
          dish_description: newMeal.value.dish_description || null,
          kcal: 0,
          protein_g: 0,
          carbs_g: 0,
          fat_g: 0,
        },
        {
          onConflict: "weekly_menu_id,day_number,meal_type",
        },
      )
      .select()
      .single();

    if (upsertError || !savedMeal) {
      savingMeal.value = false;
      formError.value = `Error guardando el plato del día ${day}: ${upsertError?.message || "desconocido"}`;
      return;
    }

    const { error: deleteIngredientsError } = await supabase
      .from("weekly_meal_ingredients")
      .delete()
      .eq("weekly_meal_id", savedMeal.id);

    if (deleteIngredientsError) {
      savingMeal.value = false;
      formError.value = `Error limpiando ingredientes del día ${day}: ${deleteIngredientsError.message}`;
      return;
    }

    if (rowsToInsert.length > 0) {
      const { error: ingredientsError } = await supabase
        .from("weekly_meal_ingredients")
        .insert(
          rowsToInsert.map((ingredient) => ({
            weekly_meal_id: savedMeal.id,
            name: ingredient.name.toLowerCase(),
            quantity: ingredient.quantity,
            unit_type: ingredient.unit_type,
          })),
        );

      if (ingredientsError) {
        savingMeal.value = false;
        formError.value = `Error guardando ingredientes del día ${day}: ${ingredientsError.message}`;
        return;
      }
    }
  }

  if (applyBreakfastToWeek.value && selectedType.value === "desayuno") {
    const { data: savedDish, error: dishError } = await supabase
      .from("dishes")
      .insert({
        user_id: currentUser.id,
        name: newMeal.value.dish_name,
        description: newMeal.value.dish_description || null,
        kcal: null,
        protein_g: null,
        carbs_g: null,
        fat_g: null,
        servings_base: 1,
      })
      .select()
      .single();

    if (dishError || !savedDish) {
      console.error("Error guardando receta de desayuno:", dishError);
    } else if (rowsToInsert.length > 0) {
      const ingredientLinks = [];

      for (const ingredient of rowsToInsert) {
        const { data: existingIngredient } = await supabase
          .from("ingredients")
          .select("id")
          .eq("name", ingredient.name.toLowerCase())
          .limit(1)
          .maybeSingle();

        let ingredientId = existingIngredient?.id;

        if (!ingredientId) {
          const { data: createdIngredient } = await supabase
            .from("ingredients")
            .insert({
              name: ingredient.name.toLowerCase(),
              unit_type: ingredient.unit_type,
            })
            .select("id")
            .single();

          ingredientId = createdIngredient?.id;
        }

        if (ingredientId) {
          ingredientLinks.push({
            dish_id: savedDish.id,
            ingredient_id: ingredientId,
            quantity: ingredient.quantity,
            unit_type: ingredient.unit_type,
          });
        }
      }

      if (ingredientLinks.length > 0) {
        const { error: dishIngredientsError } = await supabase
          .from("dish_ingredients")
          .insert(ingredientLinks);

        if (dishIngredientsError) {
          console.error(
            "Error guardando ingredientes de la receta de desayuno:",
            dishIngredientsError,
          );
        }
      }
    }
  }

  savingMeal.value = false;
  closeMealModal();
  await loadMenu();
};

const deleteMeal = async (mealId: string) => {
  if (!confirm("¿Eliminar este plato y sus ingredientes?")) return;

  const { error } = await supabase
    .from("weekly_meals")
    .delete()
    .eq("id", mealId);

  if (error) {
    alert("Error: " + error.message);
    return;
  }

  await loadMenu();
};

const deleteMenu = async () => {
  if (!menu.value) return;
  if (!confirm(`¿Eliminar el menú "${menu.value.name}" y todo su contenido?`))
    return;

  const currentUser = await loadCurrentUser();
  if (!currentUser) {
    alert("No hay usuario configurado. Usa /start en Telegram primero.");
    return;
  }

  const { error } = await supabase
    .from("weekly_menus")
    .delete()
    .eq("id", menu.value.id)
    .eq("user_id", currentUser.id);

  if (error) {
    alert("Error eliminando menú: " + error.message);
    return;
  }

  await router.push("/");
};

const uploadDailyImage = async (day: number, event: Event) => {
  creationMode.value = "daily";
  await uploadMenuImage({
    event,
    startDay: day,
    dayCount: 1,
    sourceMode: "daily",
  });
};

const uploadBlockImage = async (event: Event) => {
  await uploadMenuImage({
    event,
    startDay: blockStartDay.value,
    dayCount: blockDayCount.value,
    sourceMode: "block",
  });
};

const uploadMenuImage = async ({
  event,
  startDay,
  dayCount,
  sourceMode,
}: {
  event: Event;
  startDay: number;
  dayCount: number;
  sourceMode: "daily" | "block";
}) => {
  if (!menu.value) return;
  if (ocrMealTypes.value.length === 0) {
    imageError.value = "Selecciona al menos una franja (desayuno/comida/cena).";
    return;
  }

  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
  if (file.size > MAX_IMAGE_BYTES) {
    imageError.value =
      "La imagen supera 2MB. Reduce tamaño/resolución (recomendado 300 DPI) e inténtalo de nuevo.";
    target.value = "";
    return;
  }

  imageProcessing.value = true;
  imageError.value = "";

  const normalizedStartDay = Math.min(7, Math.max(1, startDay));
  const normalizedDayCount = Math.min(
    8 - normalizedStartDay,
    Math.max(1, dayCount),
  );
  const affectedDays = Array.from(
    { length: normalizedDayCount },
    (_, index) => normalizedStartDay + index,
  );
  const fileName = `${menu.value.id}/${sourceMode}_${normalizedStartDay}_${normalizedDayCount}_${Date.now()}.${file.name.split(".").pop()}`;

  const { error: uploadError } = await supabase.storage
    .from("menu-images")
    .upload(fileName, file);

  if (uploadError) {
    imageProcessing.value = false;
    imageError.value = "Error subiendo imagen: " + uploadError.message;
    target.value = "";
    return;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("menu-images").getPublicUrl(fileName);

  const rows = affectedDays.map((day) => ({
    weekly_menu_id: menu.value!.id,
    day_number: day,
    image_url: publicUrl,
    source_mode: sourceMode,
    day_span_count: normalizedDayCount,
    ocr_status: "processing",
    ocr_error: null,
    updated_at: new Date().toISOString(),
  }));

  const { data: imageRows, error } = await supabase
    .from("weekly_day_images")
    .upsert(rows, {
      onConflict: "weekly_menu_id,day_number",
    })
    .select();

  if (error) {
    imageProcessing.value = false;
    imageError.value = "Error guardando imagen: " + error.message;
    target.value = "";
    return;
  }

  const { error: ocrError } = await invokeOcrWithRetry({
    file,
    payload: {
      weekly_menu_id: menu.value.id,
      weekly_day_image_ids: (imageRows || []).map((image) => image.id),
      image_url: publicUrl,
      start_day: normalizedStartDay,
      day_count: normalizedDayCount,
      source_mode: sourceMode,
      meal_types: ocrMealTypes.value,
    },
  });

  if (ocrError) {
    imageError.value =
      "La imagen se guardó, pero el OCR falló: " + ocrError.message;
    await logError("ocr", ocrError, {
      context: "menu.uploadMenuImage.invokeOcrWithRetry",
    });
    await supabase
      .from("weekly_day_images")
      .update({
        ocr_status: "error",
        ocr_error: ocrError.message,
      })
      .in(
        "id",
        (imageRows || []).map((image) => image.id),
      );
  }

  imageProcessing.value = false;
  target.value = "";
  await loadMenu();
};

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const invokeOcrWithRetry = async ({
  file,
  payload,
}: {
  file: File;
  payload: Record<string, unknown>;
}) => {
  const maxAttempts = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken =
        session?.access_token || runtimeConfig.public.supabaseAnonKey;
      const formData = new FormData();
      formData.append("file", file);

      for (const [key, value] of Object.entries(payload)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value) || typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }

      const response = await fetch(
        `${runtimeConfig.public.supabaseUrl}/functions/v1/ocr-processor`,
        {
          method: "POST",
          headers: {
            apikey: runtimeConfig.public.supabaseAnonKey,
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        },
      );

      if (response.ok) return { error: null };
      const body = await response.json().catch(() => ({}));
      lastError = new Error(body?.error || `OCR error HTTP ${response.status}`);
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Error OCR desconocido");
    }

    if (attempt < maxAttempts) {
      const backoffMs = 500 * 2 ** (attempt - 1);
      await sleep(backoffMs);
    }
  }

  return { error: lastError };
};

const mealLabel = (type: MealType) => {
  if (type === "desayuno") return "Desayuno";
  if (type === "comida") return "Comida";
  return "Cena";
};

const mealColor = (type: MealType) => {
  if (type === "desayuno") return "text-emerald-700";
  if (type === "comida") return "text-amber-700";
  return "text-indigo-700";
};

const ocrStatusLabel = (status?: WeeklyDayImage["ocr_status"]) => {
  if (status === "processing") return "procesando";
  if (status === "processed") return "procesado";
  if (status === "error") return "error";
  return "pendiente";
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

onMounted(loadMenu);
</script>
