<template>
  <div class="space-y-6 text-slate-100">
    <div v-if=" loading " class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto"></div>
      <p class="mt-4 text-slate-300">Cargando menú...</p>
    </div>

    <div v-else-if=" menu " class="space-y-6">
      <header class="flex flex-wrap justify-between gap-4">
        <div>
          <button @click="$router.back()" class="text-slate-400 hover:text-white mb-2">
            ← Volver
          </button>

          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-white">{{ menu.name }}</h1>
            <span class="text-xs bg-indigo-500/20 text-indigo-200 px-2 py-1 rounded-full border border-indigo-400/30">
              Semana {{ menu.week_number }}
            </span>
          </div>

          <p class="text-sm text-slate-400 mt-1">
            {{ mealsCount }}/14 comidas y cenas · {{ formatDate( menu.created_at ) }}
          </p>
        </div>

        <div class="text-right flex flex-col items-end gap-3">
          <button type="button" class="text-sm text-red-400 hover:text-red-300" @click=" deleteMenu ">
            Eliminar menú
          </button>

          <div>
            <p class="text-sm text-slate-400">Ingredientes únicos</p>
            <p class="text-2xl font-semibold text-white">
              {{ consolidatedIngredients.length }}
            </p>
          </div>
        </div>
      </header>

      <section class="bg-slate-900 rounded-xl shadow-sm border border-slate-700 p-4">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="font-semibold text-white">Crear desde imagen</h2>
            <p class="text-sm text-slate-400 mt-1">
              Sube una foto del menú. El OCR solo extraerá comida y cena,
              manteniendo cada día completo.
            </p>
          </div>

          <div class="inline-flex rounded-lg border border-slate-700 overflow-hidden">
            <button type="button" @click="creationMode = 'daily'" class="px-3 py-2 text-sm font-medium" :class=" creationMode === 'daily'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              ">
              Día a día
            </button>
            <button type="button" @click="creationMode = 'block'"
              class="px-3 py-2 text-sm font-medium border-l border-slate-700" :class=" creationMode === 'block'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                ">
              Por bloque
            </button>
          </div>
        </div>

        <div class="mt-4 rounded-lg bg-indigo-500/10 border border-indigo-400/20 p-3">
          <p class="text-sm font-medium text-indigo-100">
            El OCR extrae únicamente Comida y Cena
          </p>
          <p class="text-xs text-indigo-200/80 mt-1">
            Desayuno y merienda se omiten porque el desayuno se elegirá como fijo.
          </p>
        </div>

        <div v-if=" creationMode === 'block' " class="mt-4 grid gap-3 md:grid-cols-[140px_140px_1fr]">
          <label>
            <span class="block text-sm font-medium text-slate-300 mb-1">
              Día inicial
            </span>
            <input v-model.number=" blockStartDay " type="number" min="1" max="7"
              class="w-full border border-[var(--color-border-strong)] rounded-lg px-3 py-2 text-white bg-slate-800" />
          </label>

          <label>
            <span class="block text-sm font-medium text-slate-300 mb-1">
              Días incluidos
            </span>
            <input v-model.number=" blockDayCount " type="number" min="1" :max=" 8 - blockStartDay "
              class="w-full border border-[var(--color-border-strong)] rounded-lg px-3 py-2 text-white bg-slate-800" />
          </label>

          <label class="self-end">
            <span class="sr-only">Subir imagen de bloque</span>
            <input type="file" accept="image/*" class="hidden" @change=" uploadBlockImage " />
            <span
              class="block text-center px-4 py-2 rounded-lg border border-indigo-400 text-indigo-200 cursor-pointer hover:bg-indigo-500/10"
              :class=" imageProcessing ? 'opacity-50 pointer-events-none' : '' ">
              {{
                imageProcessing
                  ? "Procesando OCR..."
                  : "Subir imagen del bloque"
              }}
            </span>
          </label>
        </div>

        <div v-else class="mt-4 text-sm text-slate-400">
          Usa el botón de imagen de cada día si prefieres procesar días individuales.
        </div>

        <p v-if=" imageError " class="text-sm text-red-400 mt-3">
          {{ imageError }}
        </p>
      </section>

      <section class="bg-slate-900 rounded-xl shadow-sm border border-slate-700 p-4">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="font-semibold text-white">Días compuestos</h2>
            <p class="text-sm text-slate-400 mt-1">
              Crea días con 2 platos que siempre irán juntos en los menús rotativos.
            </p>
          </div>
          <button type="button" @click="openCompoundDayModal()"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium">
            + Nuevo día compuesto
          </button>
        </div>

        <div v-if=" loadingCompoundDays " class="mt-4 text-center text-slate-400">
          Cargando...
        </div>

        <div v-else-if=" compoundDays.length === 0 " class="mt-4 text-sm text-slate-400">
          No hay días compuestos todavía. Crea uno para empezar.
        </div>

        <div v-else class="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div v-for=" cd in compoundDays " :key=" cd.id " class="bg-slate-800 rounded-lg p-3 border border-slate-700">
            <div class="flex justify-between items-start">
              <h3 class="font-medium text-white">{{ cd.name }}</h3>
              <div class="flex gap-2">
                <button @click="openCompoundDayModal( cd )" class="text-indigo-400 hover:text-indigo-300 text-sm">
                  Editar
                </button>
                <button @click="deleteCompoundDay( cd.id )" class="text-red-400 hover:text-red-300 text-sm">
                  Eliminar
                </button>
              </div>
            </div>
            <p class="text-sm text-slate-400 mt-2">
              1º: {{ cd.first_dish?.name || "Sin asignar" }}
            </p>
            <p class="text-sm text-slate-400">
              2º: {{ cd.second_dish?.name || "Sin asignar" }}
            </p>
          </div>
        </div>
      </section>

      <section class="bg-slate-900 rounded-xl shadow-sm border border-slate-700 overflow-hidden">
        <div class="px-4 py-3 border-b border-slate-700 bg-slate-950">
          <h2 class="font-semibold text-white">Menú semanal</h2>
          <p class="text-sm text-slate-400 mt-1">
            Haz clic en cualquier comida o cena para editarla, marcarla como libre
            o curar sus ingredientes.
          </p>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full border-collapse">
            <thead>
              <tr class="bg-slate-950">
                <th
                  class="sticky left-0 z-10 bg-slate-950 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300 border-r border-slate-700">
                  Franja
                </th>
                <th v-for=" day in 7 " :key=" `head-${ day }` "
                  class="min-w-[170px] px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-300 border-r border-slate-700 last:border-r-0">
                  <div class="flex items-center justify-center gap-2">
                    <span>Día {{ day }}</span>
                    <label class="text-[11px] normal-case text-indigo-300 cursor-pointer hover:text-indigo-200"
                      :class=" imageProcessing ? 'opacity-50 pointer-events-none' : '' ">
                      {{ imageProcessing ? "OCR..." : "Imagen" }}
                      <input type="file" accept="image/*" class="hidden" @change="uploadDailyImage( day, $event )" />
                    </label>
                  </div>

                  <img v-if=" getDayImage( day ) " :src=" getDayImage( day )?.image_url " alt="Imagen del menú diario"
                    class="mt-2 h-16 w-full object-cover rounded border border-slate-700" />

                  <p v-if=" getDayImage( day )?.ocr_status " class="text-[11px] text-slate-400 mt-1 normal-case">
                    OCR: {{ ocrStatusLabel( getDayImage( day )?.ocr_status ) }}
                  </p>
                </th>
              </tr>
            </thead>

            <tbody>
              <tr v-for=" type in displayMealTypes " :key=" `row-${ type }` " class="border-t border-slate-700">
                <th
                  class="sticky left-0 z-10 bg-slate-950 px-4 py-4 text-left text-sm font-bold text-slate-100 border-r border-slate-700 align-top">
                  {{ mealLabel( type ) }}
                </th>

                <td v-for=" day in 7 " :key=" `${ day }-${ type }` "
                  class="align-top border-r border-slate-700 last:border-r-0 p-2 bg-slate-900">
                  <div class="space-y-2">
                    <button type="button" v-for=" meal in getMealsForDayType( day, type ) " :key=" meal.id "
                      class="w-full min-h-[92px] rounded-lg border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      :class=" cellClass( meal ) " @click="openMealModal( day, type, meal)">
                      <div class="mb-1 flex items-center justify-between gap-2">
                        <p class="text-[11px] font-semibold text-slate-300">Plato {{ meal.meal_slot || 1 }}</p>
                        <p v-if=" meal.is_special " class="text-[11px] text-amber-200">Libre · {{ meal.special_kcal_reserved || 700 }} kcal</p>
                      </div>
                      <p class="text-sm font-semibold leading-snug text-white">{{ meal.dish_name }}</p>
                      <p v-if=" recipeStatusText( meal ) " class="mt-2 text-[11px] text-slate-400">{{ recipeStatusText( meal ) }}</p>
                    </button>

                    <button type="button"
                      class="w-full rounded-lg border border-dashed border-[var(--color-border-strong)] bg-slate-950/40 px-3 py-2 text-left text-xs text-slate-300 hover:border-indigo-400 hover:text-indigo-300"
                      @click="openMealModal( day, type )">
                      + Añadir plato {{ mealLabel( type ).toLowerCase() }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="bg-slate-900 rounded-xl shadow-sm border border-slate-700 p-4">
        <h2 class="font-semibold text-white mb-3">
          Ingredientes consolidados
        </h2>

        <div v-if=" consolidatedIngredients.length === 0 " class="text-sm text-slate-400">
          Añade ingredientes exactos a los platos para generar una lista de compra
          deduplicada.
        </div>

        <div v-else class="grid gap-2 md:grid-cols-4">
          <div v-for=" ingredient in consolidatedIngredients " :key=" `${ ingredient.name }-${ ingredient.unit_type }` "
            class="text-sm bg-slate-800 rounded-lg p-3 border border-slate-700">
            <p class="font-medium text-white">{{ ingredient.name }}</p>
            <p class="text-slate-300">
              {{ ingredient.quantity }} {{ ingredient.unit_type }}
            </p>
          </div>
        </div>
      </section>

      <div v-if=" showMealModal " class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
        @click.self=" closeMealModal ">
        <form
          class="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col"
          @submit.prevent=" saveMeal ">
          <div class="p-6 overflow-y-auto">
          <div class="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 class="text-xl font-bold text-white">
                {{ editingMealId ? "Editar" : "Añadir" }}
                {{ mealLabel( selectedType ).toLowerCase() }} · Día {{ selectedDay }}
              </h2>
              <p class="text-sm text-slate-400 mt-1">
                Si hay dos platos, mantenlos unidos con “ + ”.
              </p>
            </div>

            <button type="button" class="text-slate-400 hover:text-white" @click=" closeMealModal ">
              ✕
            </button>
          </div>

          <label class="block mb-4">
            <span class="block text-sm font-medium text-slate-300 mb-1">
              Usar receta existente o día compuesto
            </span>
            <select v-model=" selectedRecipeId "
              class="w-full border border-[var(--color-border-strong)] rounded-lg px-4 py-2 text-white bg-slate-800"
              @change=" applySavedRecipeToModal ">
              <option value="">Editar manualmente...</option>
              <optgroup label="Días compuestos" v-if=" compoundDays.length > 0 ">
                <option v-for=" cd in compoundDays " :key=" cd.id " :value=" 'COMPOUND:' + cd.id ">
                  {{ cd.name }} ({{ cd.first_dish?.name }} + {{ cd.second_dish?.name }})
                </option>
              </optgroup>
              <optgroup label="Recetas">
                <option v-for=" recipe in savedRecipes " :key=" recipe.id " :value=" recipe.id ">
                  {{ recipe.name }}
                </option>
              </optgroup>
            </select>
          </label>

          <div class="grid gap-3 md:grid-cols-2">
            <label class="md:col-span-2">
              <span class="block text-sm font-medium text-slate-300 mb-1">
                Plato o platos unidos
              </span>
              <textarea v-model.trim=" newMeal.dish_name " rows="3"
                class="w-full border border-[var(--color-border-strong)] rounded-lg px-4 py-2 text-white bg-slate-800 placeholder:text-slate-500 ui-subtle"
                placeholder="Ej: Crema de calabacín + Pescado a elegir" required />
            </label>

            <label class="md:col-span-2">
              <span class="block text-sm font-medium text-slate-300 mb-1">
                Descripción
              </span>
              <input v-model.trim=" newMeal.dish_description "
                class="w-full border border-[var(--color-border-strong)] rounded-lg px-4 py-2 text-white bg-slate-800 placeholder:text-slate-500 ui-subtle" />
            </label>

            <label class="md:col-span-2">
              <span class="inline-flex items-center gap-2 text-sm text-slate-300">
                <input v-model=" newMeal.is_special " type="checkbox" />
                <span>Marcar como comida libre/especial</span>
              </span>
            </label>

            <label v-if=" newMeal.is_special " class="md:col-span-2">
              <span class="block text-sm font-medium text-slate-300 mb-1">
                kcal reservadas para comida libre
              </span>
              <input v-model.number=" newMeal.special_kcal_reserved " type="number" min="0" max="2000" step="10"
                class="w-full border border-[var(--color-border-strong)] rounded-lg px-4 py-2 text-white bg-slate-800" />
            </label>
          </div>

          <div v-if=" getCompositeParts( newMeal.dish_name ).length > 1 "
            class="mt-4 rounded-lg border border-indigo-400/20 bg-indigo-500/10 p-3">
            <p class="text-sm font-medium text-indigo-100">
              Esta celda contiene varios platos:
            </p>
            <ul class="mt-2 space-y-1">
              <li v-for=" part in getCompositeParts( newMeal.dish_name ) " :key=" part "
                class="text-sm text-indigo-200">
                · {{ part }}
              </li>
            </ul>
          </div>

          <div class="mt-5">
            <div class="flex justify-between items-center mb-2">
              <h3 class="font-medium text-white">Ingredientes exactos</h3>
              <button type="button" @click=" addIngredientRow " class="text-sm text-indigo-300 hover:text-indigo-200">
                + Ingrediente
              </button>
            </div>

            <div v-if=" newMeal.is_special "
              class="rounded-lg border border-amber-300/20 bg-amber-400/10 p-3 text-sm text-amber-200">
              Esta comida es libre. Sus ingredientes no se usarán para el cálculo
              del menú rotativo ni para la lista de la compra.
            </div>

            <div v-else class="space-y-2">
              <div v-for=" ( ingredient, index ) in ingredientRows " :key=" index "
                class="grid grid-cols-[1fr_90px_90px_32px] gap-2">
                <input v-model.trim=" ingredient.name "
                  class="border border-[var(--color-border-strong)] rounded-lg px-3 py-2 text-white bg-slate-800 placeholder:text-slate-500 ui-subtle"
                  placeholder="Nombre" />
                <input v-model.number=" ingredient.quantity " type="number" min="0.01" step="0.01"
                  class="border border-[var(--color-border-strong)] rounded-lg px-3 py-2 text-white bg-slate-800" />
                <select v-model=" ingredient.unit_type "
                  class="border border-[var(--color-border-strong)] rounded-lg px-3 py-2 text-white bg-slate-800">
                  <option v-for=" unit in unitTypes " :key=" unit " :value=" unit ">
                    {{ unit }}
                  </option>
                </select>
                <button type="button" @click="removeIngredientRow( index )" class="text-red-400 hover:text-red-300">
                  ×
                </button>
              </div>
            </div>
          </div>

          <p v-if=" formError " class="text-sm text-red-400 mt-3">
            {{ formError }}
          </p>

          <div class="flex justify-between gap-2 mt-6">
            <button v-if=" editingMealId " type="button" @click=" deleteCurrentMeal "
              class="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg">
              Eliminar
            </button>
            <span v-else></span>

            <div class="flex justify-end gap-2">
              <button type="button" @click=" closeMealModal "
                class="px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg">
                Cancelar
              </button>
              <button type="submit" :disabled=" savingMeal || !mealFormValid "
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50">
                {{ savingMeal ? "Guardando..." : editingMealId ? "Actualizar" : "Guardar" }}
              </button>
            </div>
          </div>
          </div>
        </form>
      </div>
    </div>

    <div v-else class="text-center py-12 bg-slate-900 rounded-lg border border-slate-700">
      <p class="text-slate-300">Menú no encontrado</p>
      <button @click="$router.push( '/' )" class="mt-4 text-indigo-300 hover:text-indigo-200">
        Volver a la lista
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
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

type MealType = WeeklyMeal[ "meal_type" ];

const supabase = useSupabase();
const route = useRoute();
const router = useRouter();
const runtimeConfig = useRuntimeConfig();
const { loadCurrentUser } = useCurrentUser();
const appToast = useAppToast();
const { confirm: confirmDialog } = useConfirmDialog();

const displayMealTypes: MealType[] = [ "comida", "cena" ];
const unitTypes: WeeklyMealIngredient[ "unit_type" ][] = [
  "g",
  "kg",
  "ml",
  "l",
  "ud",
  "pack",
  "unidad",
];

const menu = ref<WeeklyMenu | null>( null );
const meals = ref<WeeklyMeal[]>( [] );
const dayImages = ref<WeeklyDayImage[]>( [] );
const loading = ref( true );
const showMealModal = ref( false );
const savingMeal = ref( false );
const imageProcessing = ref( false );
const formError = ref( "" );
const imageError = ref( "" );
const recipeStatusByName = ref<Record<string, string>>( {} );
const selectedDay = ref( 1 );
const selectedType = ref<MealType>( "comida" );
const selectedRecipeId = ref( "" );
const editingMealId = ref<string | null>( null );
const creationMode = ref<"daily" | "block">( "daily" );
const blockStartDay = ref( 1 );
const blockDayCount = ref( 7 );
const OCR_WEEKLY_MEAL_TYPES: MealType[] = [ "comida", "cena" ];

const compoundDays = ref<any[]>( [] );
const showCompoundDayModal = ref( false );
const editingCompoundDay = ref<any>( null );
const compoundDayForm = ref( {
  name: "",
  firstDishId: "",
  secondDishId: "",
} );
const allDishes = ref<Array<{ id: string; name: string }>>( [] );
const loadingCompoundDays = ref( false );

const savedRecipes = ref<
  Array<{
    id: string;
    name: string;
    normalized_name?: string | null;
    description?: string | null;
    recipe_ingredients?: Array<{
      ingredient_id?: string | null;
      name: string;
      quantity: number | null;
      unit_type: string | null;
      is_confirmed?: boolean;
    }>;
  }>
>( [] );

const newMeal = ref( {
  dish_name: "",
  dish_description: "",
  is_special: false,
  special_kcal_reserved: 700,
} );

const ingredientRows = ref<
  Array<{
    ingredient_id?: string | null;
    name: string;
    quantity: number;
    unit_type: WeeklyMealIngredient[ "unit_type" ];
  }>
>( [] );

const mealsCount = computed(
  () =>
    meals.value.filter( ( meal ) =>
      displayMealTypes.includes( meal.meal_type as MealType ),
    ).length,
);

const consolidatedIngredients = computed( () => {
  const consolidated: Record<
    string,
    { name: string; quantity: number; unit_type: string }
  > = {};

  for ( const meal of meals.value ) {
    if ( meal.is_special ) continue;

    for ( const ingredient of meal.weekly_meal_ingredients || [] ) {
      const key = `${ ingredient.name.toLowerCase() }::${ ingredient.unit_type }`;

      if ( !consolidated[ key ] ) {
        consolidated[ key ] = {
          name: ingredient.name,
          quantity: 0,
          unit_type: ingredient.unit_type,
        };
      }

      consolidated[ key ].quantity += Number( ingredient.quantity ) || 0;
    }
  }

  return Object.values( consolidated )
    .map( ( item ) => ( {
      ...item,
      quantity: Math.round( item.quantity * 100 ) / 100,
    } ) )
    .sort( ( a, b ) => a.name.localeCompare( b.name ) );
} );

const mealFormValid = computed( () => {
  if ( !newMeal.value.dish_name.trim() ) return false;
  if ( newMeal.value.is_special ) return true;

  return ingredientRows.value.every(
    ( ingredient ) => !ingredient.name || Number( ingredient.quantity ) > 0,
  );
} );

const loadMenu = async () => {
  loading.value = true;

  const currentUser = await loadCurrentUser();

  if ( !currentUser ) {
    menu.value = null;
    loading.value = false;
    return;
  }

  const { data: menuData } = await supabase
    .from( "weekly_menus" )
    .select( "*" )
    .eq( "id", route.params.id )
    .eq( "user_id", currentUser.id )
    .maybeSingle();

  if ( !menuData ) {
    menu.value = null;
    loading.value = false;
    return;
  }

  menu.value = menuData;

  const [ { data: mealsData }, { data: imagesData } ] = await Promise.all( [
    supabase
      .from( "weekly_meals" )
      .select( "*, weekly_meal_ingredients(*)" )
      .eq( "weekly_menu_id", route.params.id as string )
      .in( "meal_type", displayMealTypes )
      .order( "day_number", { ascending: true } )
      .order( "meal_type", { ascending: true } )
      .order( "meal_slot", { ascending: true } ),
    supabase
      .from( "weekly_day_images" )
      .select( "*" )
      .eq( "weekly_menu_id", route.params.id as string )
      .order( "day_number", { ascending: true } ),
  ] );

  meals.value = ( mealsData || [] ).map( ( meal: WeeklyMeal ) => ( {
    ...meal,
    dish_name: normalizeCompositeDishName( meal.dish_name || "" ),
    meal_slot: 1,
  } ) );

  dayImages.value = imagesData || [];

  await ensureRecipeLibrary( meals.value );
  await loadRecipeStatuses();

  loading.value = false;
};

const loadRecipeStatuses = async () => {
  const currentUser = await loadCurrentUser();
  if ( !currentUser ) return;

  const names = getUniqueRecipePartsFromMeals( meals.value );

  if ( names.length === 0 ) {
    recipeStatusByName.value = {};
    return;
  }

  const { data } = await supabase
    .from( "dishes" )
    .select( "name,recipe_status" )
    .eq( "user_id", currentUser.id )
    .in( "name", names );

  const map: Record<string, string> = {};

  for ( const row of data || [] ) {
    map[ String( row.name ) ] = String( row.recipe_status || "pending_ingredients" );
  }

  recipeStatusByName.value = map;
};

const loadSavedRecipes = async () => {
  const currentUser = await loadCurrentUser();

  if ( !currentUser ) {
    savedRecipes.value = [];
    return;
  }

  const { data, error } = await supabase
    .from( "dishes" )
    .select(
      "id,name,normalized_name,description,recipe_ingredients(ingredient_id,name,quantity,unit_type,is_confirmed)",
    )
    .eq( "user_id", currentUser.id )
    .order( "name", { ascending: true } );

  if ( error ) {
    savedRecipes.value = [];
    return;
  }

  savedRecipes.value = data || [];
};

const normalizeLookupName = ( value: string ) =>
  String( value || "" )
    .trim()
    .toLowerCase()
    .normalize( "NFD" )
    .replace( /[\u0300-\u036f]/g, "" )
    .replace( /[_-]+/g, " " )
    .replace( /\s+/g, " " );

const findRecipeIdByName = ( dishName: string ) => {
  const normalizedDishName = normalizeLookupName( dishName );
  return (
    savedRecipes.value.find(
      ( recipe ) =>
        normalizeLookupName( recipe.normalized_name || recipe.name ) ===
        normalizedDishName,
    )?.id || null
  );
};

const ensureMasterIngredientId = async ( name: string, unitType: string ) => {
  const normalizedIngredientName = normalizeLookupName( name );
  if ( !normalizedIngredientName ) return null;

  const normalizedUnderscoreName = normalizedIngredientName.replace( /\s+/g, "_" );
  const { data: existingByNormalized } = await supabase
    .from( "ingredients" )
    .select( "id" )
    .in( "normalized_name", [ normalizedIngredientName, normalizedUnderscoreName ] )
    .limit( 1 )
    .maybeSingle();

  if ( existingByNormalized?.id ) return existingByNormalized.id;

  const { data: existingByName } = await supabase
    .from( "ingredients" )
    .select( "id" )
    .eq( "name", name.trim().toLowerCase() )
    .maybeSingle();

  if ( existingByName?.id ) return existingByName.id;

  const { data: createdIngredient, error: createdIngredientError } = await supabase
    .from( "ingredients" )
    .insert( {
      name: name.trim().toLowerCase(),
      normalized_name: normalizedIngredientName,
      default_unit_type: unitType,
      unit_type: unitType,
      source: "manual",
      is_verified: false,
    } )
    .select( "id" )
    .single();

  if ( createdIngredientError ) {
    console.error( "Error creando ingrediente maestro desde menú semanal:", createdIngredientError );
    return null;
  }

  return createdIngredient?.id || null;
};

const ensureRecipeLibrary = async ( weeklyMeals: WeeklyMeal[] ) => {
  const currentUser = await loadCurrentUser();
  if ( !currentUser ) return;

  const names = getUniqueRecipePartsFromMeals( weeklyMeals ).filter(
    ( name ) => !isFreeMealName( name ),
  );

  if ( names.length === 0 ) return;

  const { data: existing } = await supabase
    .from( "dishes" )
    .select( "id,name,recipe_status" )
    .eq( "user_id", currentUser.id )
    .in( "name", names );

  const existingByName = new Map(
    ( existing || [] ).map( ( item: any ) => [ item.name, item ] ),
  );

  const toInsert = names
    .filter( ( name ) => !existingByName.has( name ) )
    .map( ( name ) => {
      const candidates = extractIngredientCandidatesFromDishName( name );

      return {
        user_id: currentUser.id,
        name,
        normalized_name: name.toLowerCase().trim(),
        description: null,
        source: "ocr",
        kcal: null,
        protein_g: null,
        carbs_g: null,
        fat_g: null,
        servings_base: 1,
        recipe_status: getRecipeStatusFromDishName( name, candidates ),
      };
    } );

  if ( toInsert.length === 0 ) return;

  const { data: insertedDishes } = await supabase
    .from( "dishes" )
    .insert( toInsert )
    .select( "id,name" );

  const suggestions = ( insertedDishes || [] ).flatMap( ( dish: any ) => {
    const candidates = extractIngredientCandidatesFromDishName( dish.name || "" );

    return candidates.map( ( candidate ) => ( {
      recipe_id: dish.id,
      ingredient_id: null,
      name: candidate.name,
      normalized_name: candidate.name.toLowerCase().trim(),
      quantity: null,
      unit_type: null,
      is_confirmed: false,
      is_suggested: true,
      needs_review: candidate.needs_review,
    } ) );
  } );

  if ( suggestions.length > 0 ) {
    await supabase
      .from( "recipe_ingredients" )
      .upsert( suggestions, { onConflict: "recipe_id,normalized_name" } );
  }

  if ( ( insertedDishes || [] ).length > 0 ) {
    try {
      await $fetch( "/api/recipes-auto-curate", {
        method: "POST",
        body: {
          recipeIds: ( insertedDishes || [] ).map( ( dish: any ) => dish.id ),
          source: "open_food_facts",
        },
      } );
    } catch ( curationError ) {
      await logError( "web", curationError, {
        context: "menu.ensureRecipeLibrary.autoCurate",
      } );
    }

    await expandAndMergeIngredients( currentUser.id, insertedDishes || [] );
  }
};

const expandAndMergeIngredients = async ( userId: string, dishes: any[] ) => {
  if ( !dishes || dishes.length === 0 ) return;

  const config = useRuntimeConfig();
  const dishNames = dishes.map( ( d: any ) => d.name );

  try {
    const response = await fetch(
      `${ config.public.supabaseUrl }/functions/v1/expand-ingredients`,
      {
        method: "POST",
        headers: {
          apikey: config.public.supabaseAnonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify( { dishNames, userId } ),
      },
    );

    const { results } = await response.json();

    for ( const result of results || [] ) {
      if ( !result.expanded || !result.ingredients?.length ) continue;

      const dish = dishes.find( ( d: any ) => d.name === result.original );
      if ( !dish ) continue;

      const expandedIngredients = result.ingredients.map( ( ing: any ) => ( {
        recipe_id: dish.id,
        ingredient_id: null,
        name: ing.name,
        normalized_name: ing.name.toLowerCase().trim(),
        quantity: ing.quantity || null,
        unit_type: ing.unit_type || null,
        is_confirmed: true,
        is_suggested: false,
        needs_review: false,
        source: "expansion_rule",
      } ) );

      await supabase
        .from( "recipe_ingredients" )
        .upsert( expandedIngredients, { onConflict: "recipe_id,normalized_name" } );
    }
  } catch ( error ) {
    console.error( "expandAndMergeIngredients error:", error );
  }
};

const getPrimaryMeal = ( day: number, type: MealType ) => {
  return getMealsForDayType( day, type )[ 0 ] || null;
};

const getMealsForDayType = ( day: number, type: MealType ) => {
  return meals.value
    .filter( ( meal ) => meal.day_number === day && meal.meal_type === type )
    .sort( ( a, b ) => Number( a.meal_slot || 1 ) - Number( b.meal_slot || 1 ) );
};

const getDayImage = ( day: number ) => {
  return dayImages.value.find( ( image ) => image.day_number === day );
};

const getCompositeParts = ( dishName?: string | null ) => {
  return splitCompositeDishName( dishName || "" );
};

const getUniqueRecipePartsFromMeals = ( weeklyMeals: WeeklyMeal[] ) => {
  return Array.from(
    new Set(
      weeklyMeals
        .filter( ( meal ) => displayMealTypes.includes( meal.meal_type as MealType ) )
        .flatMap( ( meal ) => splitCompositeDishName( meal.dish_name || "" ) )
        .map( ( name ) => name.trim() )
        .filter( Boolean ),
    ),
  );
};

const splitCompositeDishName = ( dishName: string ) => {
  const normalized = normalizeCompositeDishName( dishName );

  if ( !normalized ) return [];

  if ( isFreeMealName( normalized ) ) return [ "Libre" ];

  return normalized
    .split( /\s+\+\s+/g )
    .map( ( part ) => part.trim() )
    .filter( Boolean );
};

const normalizeCompositeDishName = ( dishName: string ) => {
  return String( dishName || "" )
    .replace( /\s+/g, " " )
    .replace( /\s*\(\s*ver foto\s*\)\s*/gi, " " )
    .replace( /\s*\(\s*ver doc anexo\s*\)\s*/gi, " " )
    .replace( /\s*\(\s*ver dox anexo\s*\)\s*/gi, " " )
    .replace( /\s*\(\s*ver anexo\s*\)\s*/gi, " " )
    .replace( /\s*\+\s*/g, " + " )
    .replace( /\s{2,}/g, " " )
    .trim();
};

const isFreeMealName = ( dishName: string ) => {
  return /^libre$/i.test( String( dishName || "" ).trim() );
};

watch( blockStartDay, ( day ) => {
  const normalizedDay = Math.min( 7, Math.max( 1, Number( day ) || 1 ) );
  if ( normalizedDay !== day ) blockStartDay.value = normalizedDay;
  blockDayCount.value = Math.min( blockDayCount.value, 8 - normalizedDay );
} );

watch( blockDayCount, ( count ) => {
  const normalizedCount = Math.min(
    8 - blockStartDay.value,
    Math.max( 1, Number( count ) || 1 ),
  );

  if ( normalizedCount !== count ) blockDayCount.value = normalizedCount;
} );

const openMealModal = ( day: number, type: MealType, meal?: WeeklyMeal | null ) => {
  selectedDay.value = day;
  selectedType.value = type;
  editingMealId.value = meal?.id || null;
  selectedRecipeId.value = "";

  newMeal.value = meal
    ? {
      dish_name: normalizeCompositeDishName( meal.dish_name ),
      dish_description: meal.dish_description || "",
      is_special: Boolean( meal.is_special ) || isFreeMealName( meal.dish_name ),
      special_kcal_reserved: Number( meal.special_kcal_reserved || 700 ),
    }
    : {
      dish_name: "",
      dish_description: "",
      is_special: false,
      special_kcal_reserved: 700,
    };

  ingredientRows.value = meal?.weekly_meal_ingredients?.length
    ? meal.weekly_meal_ingredients.map( ( ingredient ) => ( {
      ingredient_id: ingredient.ingredient_id || null,
      name: ingredient.name,
      quantity: Number( ingredient.quantity ) || 1,
      unit_type: ingredient.unit_type,
    } ) )
    : [ { name: "", quantity: 1, unit_type: "g" } ];

  formError.value = "";
  showMealModal.value = true;
};

const applySavedRecipeToModal = () => {
  if ( !selectedRecipeId.value ) return;

  if ( selectedRecipeId.value.startsWith( "COMPOUND:" ) ) {
    const compoundDayId = selectedRecipeId.value.replace( "COMPOUND:", "" );
    const compoundDay = compoundDays.value.find( ( cd ) => cd.id === compoundDayId );
    if ( !compoundDay ) return;

    newMeal.value.dish_name = `${ compoundDay.first_dish?.name } + ${ compoundDay.second_dish?.name }`;
    newMeal.value.dish_description = `Día compuesto: ${ compoundDay.name }`;
    ingredientRows.value = [ { name: "", quantity: 1, unit_type: "g" } ];
    return;
  }

  const recipe = savedRecipes.value.find(
    ( item ) => item.id === selectedRecipeId.value,
  );

  if ( !recipe ) return;

  newMeal.value.dish_name = recipe.name || "";
  newMeal.value.dish_description = recipe.description || "";

  const confirmedIngredients = ( recipe.recipe_ingredients || [] ).filter(
    ( ingredient ) => ingredient.is_confirmed !== false && ingredient.name,
  );

  ingredientRows.value =
    confirmedIngredients.length > 0
      ? confirmedIngredients.map( ( ingredient ) => ( {
        ingredient_id: ingredient.ingredient_id || null,
        name: ingredient.name,
        quantity:
          Number( ingredient.quantity ) > 0 ? Number( ingredient.quantity ) : 1,
        unit_type:
          ( ingredient.unit_type as WeeklyMealIngredient[ "unit_type" ] ) || "g",
      } ) )
      : [ { name: "", quantity: 1, unit_type: "g" } ];
};

const closeMealModal = () => {
  showMealModal.value = false;
  editingMealId.value = null;
  selectedRecipeId.value = "";
  formError.value = "";
};

const addIngredientRow = () => {
  ingredientRows.value.push( { name: "", quantity: 1, unit_type: "g" } );
};

const removeIngredientRow = ( index: number ) => {
  ingredientRows.value.splice( index, 1 );
};

const saveMeal = async () => {
  if ( !menu.value || !mealFormValid.value ) return;

  savingMeal.value = true;
  formError.value = "";

  const normalizedDishName = normalizeCompositeDishName( newMeal.value.dish_name );

  const isSpecial =
    Boolean( newMeal.value.is_special ) || isFreeMealName( normalizedDishName );

  const rowsToInsert = isSpecial
    ? []
    : ingredientRows.value.filter(
      ( ingredient ) => ingredient.name && Number( ingredient.quantity ) > 0,
    );
  const dishId =
    !isSpecial && selectedRecipeId.value && !selectedRecipeId.value.startsWith( "COMPOUND:" )
      ? selectedRecipeId.value
      : !isSpecial
        ? findRecipeIdByName( normalizedDishName )
        : null;
  const resolvedRowsToInsert = await Promise.all(
    rowsToInsert.map( async ( ingredient ) => ( {
      ...ingredient,
      ingredient_id:
        ingredient.ingredient_id ||
        ( await ensureMasterIngredientId( ingredient.name, ingredient.unit_type ) ),
    } ) ),
  );

  const nextMealSlot = editingMealId.value
    ? Number( meals.value.find( ( meal ) => meal.id === editingMealId.value )?.meal_slot || 1 )
    : getMealsForDayType( selectedDay.value, selectedType.value ).length + 1;

  const payload = {
    weekly_menu_id: menu.value.id,
    day_number: selectedDay.value,
    meal_type: selectedType.value,
    meal_slot: Math.max( 1, nextMealSlot ),
    dish_id: dishId,
    dish_name: normalizedDishName,
    dish_description: newMeal.value.dish_description || null,
    is_special: isSpecial,
    special_kcal_reserved: isSpecial
      ? Math.max(
        0,
        Math.min( 2000, Number( newMeal.value.special_kcal_reserved ) || 700 ),
      )
      : 0,
    kcal: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
  };

  let savedMeal: any = null;
  let upsertError: any = null;

  const firstAttempt = await supabase
    .from( "weekly_meals" )
    .upsert( payload, {
      onConflict: "weekly_menu_id,day_number,meal_type,meal_slot",
    } )
    .select()
    .single();

  savedMeal = firstAttempt.data;
  upsertError = firstAttempt.error;

  if ( upsertError?.code === "42P10" ) {
    const { meal_slot, ...legacyPayload } = payload;

    const fallbackAttempt = await supabase
      .from( "weekly_meals" )
      .upsert( legacyPayload, {
        onConflict: "weekly_menu_id,day_number,meal_type",
      } )
      .select()
      .single();

    savedMeal = fallbackAttempt.data;
    upsertError = fallbackAttempt.error;
  }

  if ( upsertError || !savedMeal ) {
    savingMeal.value = false;
    formError.value = `Error guardando el plato: ${ upsertError?.message || "desconocido"
      }`;
    return;
  }

  const { error: deleteIngredientsError } = await supabase
    .from( "weekly_meal_ingredients" )
    .delete()
    .eq( "weekly_meal_id", savedMeal.id );

  if ( deleteIngredientsError ) {
    savingMeal.value = false;
    formError.value = `Error limpiando ingredientes: ${ deleteIngredientsError.message }`;
    return;
  }

  if ( resolvedRowsToInsert.length > 0 ) {
    const { error: ingredientsError } = await supabase
      .from( "weekly_meal_ingredients" )
      .insert(
        resolvedRowsToInsert.map( ( ingredient ) => ( {
          weekly_meal_id: savedMeal.id,
          ingredient_id: ingredient.ingredient_id,
          name: ingredient.name.toLowerCase(),
          quantity: ingredient.quantity,
          unit_type: ingredient.unit_type,
        } ) ),
      );

    if ( ingredientsError ) {
      savingMeal.value = false;
      formError.value = `Error guardando ingredientes: ${ ingredientsError.message }`;
      return;
    }
  }

  savingMeal.value = false;
  closeMealModal();
  await loadMenu();
};

const deleteCurrentMeal = async () => {
  if ( !editingMealId.value ) return;
  await deleteMeal( editingMealId.value );
  closeMealModal();
};

const deleteMeal = async ( mealId: string ) => {
  const confirmed = await confirmDialog( {
    title: "Eliminar comida",
    message: "¿Eliminar esta comida/cena?",
    confirmText: "Eliminar",
    danger: true,
  } );
  if ( !confirmed ) return;

  const { error } = await supabase
    .from( "weekly_meals" )
    .delete()
    .eq( "id", mealId );

  if ( error ) {
    appToast.error( "Error: " + error.message );
    return;
  }

  await loadMenu();
  appToast.success( "Comida eliminada." );
};

const deleteMenu = async () => {
  if ( !menu.value ) return;

  const confirmed = await confirmDialog( {
    title: "Eliminar menú",
    message: `¿Eliminar el menú "${ menu.value.name }" y todo su contenido?`,
    confirmText: "Eliminar",
    danger: true,
  } );
  if ( !confirmed ) {
    return;
  }

  const currentUser = await loadCurrentUser();

  if ( !currentUser ) {
    appToast.error( "No hay usuario configurado. Usa /start en Telegram primero." );
    return;
  }

  const { error } = await supabase
    .from( "weekly_menus" )
    .delete()
    .eq( "id", menu.value.id )
    .eq( "user_id", currentUser.id );

  if ( error ) {
    appToast.error( "Error eliminando menú: " + error.message );
    return;
  }

  appToast.success( "Menú eliminado." );
  await router.push( "/" );
};

const uploadDailyImage = async ( day: number, event: Event ) => {
  creationMode.value = "daily";

  await uploadMenuImage( {
    event,
    startDay: day,
    dayCount: 1,
    sourceMode: "daily",
  } );
};

const uploadBlockImage = async ( event: Event ) => {
  await uploadMenuImage( {
    event,
    startDay: blockStartDay.value,
    dayCount: blockDayCount.value,
    sourceMode: "block",
  } );
};

const uploadMenuImage = async ( {
  event,
  startDay,
  dayCount,
  sourceMode,
}: {
  event: Event;
  startDay: number;
  dayCount: number;
  sourceMode: "daily" | "block";
} ) => {
  if ( !menu.value ) return;

  const target = event.target as HTMLInputElement;
  const file = target.files?.[ 0 ];

  if ( !file ) return;

  const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

  if ( file.size > MAX_IMAGE_BYTES ) {
    imageError.value =
      "La imagen supera 2MB. Reduce tamaño/resolución e inténtalo de nuevo.";
    target.value = "";
    return;
  }

  imageProcessing.value = true;
  imageError.value = "";

  const normalizedStartDay = Math.min( 7, Math.max( 1, startDay ) );
  const normalizedDayCount = Math.min(
    8 - normalizedStartDay,
    Math.max( 1, dayCount ),
  );

  const affectedDays = Array.from(
    { length: normalizedDayCount },
    ( _, index ) => normalizedStartDay + index,
  );

  const extension = file.name.split( "." ).pop() || "jpg";
  const fileName = `${ menu.value.id }/${ sourceMode }_${ normalizedStartDay }_${ normalizedDayCount }_${ Date.now() }.${ extension }`;

  const { error: uploadError } = await supabase.storage
    .from( "menu-images" )
    .upload( fileName, file );

  if ( uploadError ) {
    imageProcessing.value = false;
    imageError.value = "Error subiendo imagen: " + uploadError.message;
    target.value = "";
    return;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from( "menu-images" ).getPublicUrl( fileName );

  const rows = affectedDays.map( ( day ) => ( {
    weekly_menu_id: menu.value!.id,
    day_number: day,
    image_url: publicUrl,
    source_mode: sourceMode,
    day_span_count: normalizedDayCount,
    ocr_status: "processing",
    ocr_error: null,
    updated_at: new Date().toISOString(),
  } ) );

  const { data: imageRows, error } = await supabase
    .from( "weekly_day_images" )
    .upsert( rows, {
      onConflict: "weekly_menu_id,day_number",
    } )
    .select();

  if ( error ) {
    imageProcessing.value = false;
    imageError.value = "Error guardando imagen: " + error.message;
    target.value = "";
    return;
  }

  const { error: ocrError } = await invokeOcrWithRetry( {
    file,
    payload: {
      weekly_menu_id: menu.value.id,
      weekly_day_image_ids: ( imageRows || [] ).map( ( image ) => image.id ),
      image_url: publicUrl,
      start_day: normalizedStartDay,
      day_count: normalizedDayCount,
      source_mode: sourceMode,
      meal_types: OCR_WEEKLY_MEAL_TYPES,
    },
  } );

  if ( ocrError ) {
    const ocrMessage = String( ocrError.message || "" );
    const mappingError = ocrMessage.includes( "OCR_1TO1_MAPPING_ERROR" );

    imageError.value = mappingError
      ? "No se pudo mapear día/comida/cena desde la imagen. Revisa calidad o recorte."
      : "La imagen se guardó, pero el OCR falló: " + ocrError.message;

    await logError( "ocr", ocrError, {
      context: "menu.uploadMenuImage.invokeOcrWithRetry",
    } );

    await supabase
      .from( "weekly_day_images" )
      .update( {
        ocr_status: "error",
        ocr_error: ocrError.message,
      } )
      .in(
        "id",
        ( imageRows || [] ).map( ( image ) => image.id ),
      );
  }

  imageProcessing.value = false;
  target.value = "";
  await loadMenu();
};

const sleep = ( ms: number ) =>
  new Promise( ( resolve ) => {
    setTimeout( resolve, ms );
  } );

const invokeOcrWithRetry = async ( {
  file,
  payload,
}: {
  file: File;
  payload: Record<string, unknown>;
} ) => {
  const maxAttempts = 3;
  let lastError: Error | null = null;

  for ( let attempt = 1; attempt <= maxAttempts; attempt++ ) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken =
        session?.access_token || runtimeConfig.public.supabaseAnonKey;

      const formData = new FormData();
      formData.append( "file", file );

      for ( const [ key, value ] of Object.entries( payload ) ) {
        if ( value === undefined || value === null ) continue;

        if ( Array.isArray( value ) || typeof value === "object" ) {
          formData.append( key, JSON.stringify( value ) );
        } else {
          formData.append( key, String( value ) );
        }
      }

      const response = await fetch( "/api/ocr", {
        method: "POST",
        headers: {
          apikey: runtimeConfig.public.supabaseAnonKey,
          Authorization: `Bearer ${ accessToken }`,
        },
        body: formData,
      } );

      if ( response.ok ) return { error: null };

      const body = await response.json().catch( () => ( {} ) );
      lastError = new Error( body?.error || `OCR error HTTP ${ response.status }` );
    } catch ( error ) {
      lastError =
        error instanceof Error ? error : new Error( "Error OCR desconocido" );
    }

    if ( attempt < maxAttempts ) {
      const backoffMs = 500 * 2 ** ( attempt - 1 );
      await sleep( backoffMs );
    }
  }

  return { error: lastError };
};

const mealLabel = ( type: MealType ) => {
  if ( type === "comida" ) return "Comida";
  if ( type === "cena" ) return "Cena";
  return "Desayuno";
};

const ocrStatusLabel = ( status?: WeeklyDayImage[ "ocr_status" ] ) => {
  if ( status === "processing" ) return "procesando";
  if ( status === "processed" ) return "procesado";
  if ( status === "error" ) return "error";
  return "pendiente";
};

const cellClass = ( meal?: WeeklyMeal | null ) => {
  if ( !meal ) {
    return "border-dashed border-[var(--color-border-strong)] border-[var(--color-border-strong)] bg-[var(--color-surface-3)] bg-[var(--color-surface-2)] text-slate-500 ui-subtle";
  }

  if ( meal.is_special || isFreeMealName( meal.dish_name ) ) {
    return "border-amber-200 bg-amber-50";
  }

  return "ui-divider ui-surface";
};

const recipeStatusText = ( meal?: WeeklyMeal | null ) => {
  if ( !meal?.dish_name ) return "";

  const parts = splitCompositeDishName( meal.dish_name ).filter(
    ( part ) => !isFreeMealName( part ),
  );

  if ( parts.length === 0 ) return "Comida libre";

  const statuses = parts.map( ( part ) => recipeStatusByName.value[ part ] );

  if ( statuses.every( ( status ) => status === "complete" ) ) {
    return "Receta completa";
  }

  if ( statuses.some( ( status ) => status === "incomplete_nutrition" ) ) {
    return "Pendiente de nutrición";
  }

  if (
    statuses.some(
      ( status ) =>
        status === "suggested_ingredients" ||
        status === "pending_ingredients" ||
        !status,
    )
  ) {
    return "Pendiente de curar ingredientes";
  }

  return "";
};

const formatDate = ( dateString: string ): string => {
  return new Date( dateString ).toLocaleDateString( "es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  } );
};

const loadCompoundDays = async () => {
  const user = await loadCurrentUser();
  if ( !user ) return;

  loadingCompoundDays.value = true;
  try {
    const result = await $fetch<{ compoundDays: any[] }>( "/api/compound-day-meals", {
      query: { userId: user.id },
    } );
    if ( result?.compoundDays ) {
      compoundDays.value = result.compoundDays;
    }
  } catch ( error ) {
    console.error( "Error loading compound days:", error );
  } finally {
    loadingCompoundDays.value = false;
  }
};

const loadAllDishes = async () => {
  const user = await loadCurrentUser();
  if ( !user ) return;

  const result = await $fetch<{ dishes: any[] }>( "/api/dishes", {
    query: { userId: user.id },
  } );
  if ( result?.dishes ) {
    allDishes.value = result.dishes.map( ( d: any ) => ( {
      id: d.id,
      name: d.name,
    } ) );
  }
};

const openCompoundDayModal = ( compoundDay?: any ) => {
  if ( compoundDay ) {
    editingCompoundDay.value = compoundDay;
    compoundDayForm.value = {
      name: compoundDay.name,
      firstDishId: compoundDay.first_dish?.id || "",
      secondDishId: compoundDay.second_dish?.id || "",
    };
  } else {
    editingCompoundDay.value = null;
    compoundDayForm.value = {
      name: "",
      firstDishId: "",
      secondDishId: "",
    };
  }
  showCompoundDayModal.value = true;
};

const saveCompoundDay = async () => {
  const user = await loadCurrentUser();
  if ( !user ) return;

  if ( !compoundDayForm.value.name || !compoundDayForm.value.firstDishId || !compoundDayForm.value.secondDishId ) {
    formError.value = "Todos los campos son obligatorios";
    return;
  }

  if ( compoundDayForm.value.firstDishId === compoundDayForm.value.secondDishId ) {
    formError.value = "Los dos platos deben ser diferentes";
    return;
  }

  try {
    if ( editingCompoundDay.value ) {
      await useFetch( "/api/compound-day-meals", {
        method: "PUT",
        body: {
          id: editingCompoundDay.value.id,
          userId: user.id,
          name: compoundDayForm.value.name,
          firstDishId: compoundDayForm.value.firstDishId,
          secondDishId: compoundDayForm.value.secondDishId,
        },
      } );
    } else {
      await useFetch( "/api/compound-day-meals", {
        method: "POST",
        body: {
          userId: user.id,
          name: compoundDayForm.value.name,
          firstDishId: compoundDayForm.value.firstDishId,
          secondDishId: compoundDayForm.value.secondDishId,
        },
      } );
    }

    showCompoundDayModal.value = false;
    await loadCompoundDays();
  } catch ( error: any ) {
    formError.value = error.message || "Error guardando día compuesto";
  }
};

const deleteCompoundDay = async ( id: string ) => {
  const user = await loadCurrentUser();
  if ( !user ) return;

  const confirmed = await confirmDialog( {
    title: "Eliminar día compuesto",
    message: "¿Estás seguro de que quieres eliminar este día compuesto?",
    confirmText: "Eliminar",
    danger: true,
  } );
  if ( !confirmed ) return;

  try {
    await useFetch( "/api/compound-day-meals", {
      method: "DELETE",
      body: { id, userId: user.id },
    } );
    await loadCompoundDays();
  } catch ( error ) {
    console.error( "Error deleting compound day:", error );
  }
};

onMounted( async () => {
  await Promise.all( [ loadMenu(), loadSavedRecipes(), loadCompoundDays() ] );
} );
</script>
