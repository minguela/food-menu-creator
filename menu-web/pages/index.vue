<template>
  <div class="min-h-screen bg-transparent">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 class="ui-title text-3xl font-bold">
              Menús Semanales
            </h1>
            <p class="ui-subtle text-sm mt-1">Planifica tu alimentación esta semana</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="toggleSelectAllMenus"
            class="ui-btn-muted px-4 py-2.5 rounded-xl transition-all text-sm font-medium"
            :disabled="menus.length === 0">
            {{ allMenusSelected ? "Deseleccionar" : "Seleccionar" }} menús
          </button>
          <button @click="deleteSelectedMenus"
            class="px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all text-sm font-medium disabled:opacity-50"
            :disabled="selectedMenuIds.length === 0">
            Eliminar seleccionados ({{ selectedMenuIds.length }})
          </button>
          <button @click="showNewMenuModal = true"
            class="group bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300/30 flex items-center gap-2 active:scale-95">
            <svg class="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span class="font-semibold">Nuevo Menú</span>
          </button>
        </div>
      </div>

      <!-- Estado de carga -->
      <div v-if=" loading " class="flex flex-col items-center justify-center py-20">
        <div class="relative">
          <div class="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin"></div>
          <div
            class="absolute inset-0 w-16 h-16 rounded-full border-4 border-indigo-50 border-b-indigo-200 animate-spin"
            style="animation-direction: reverse; animation-duration: 1.5s;"></div>
        </div>
        <p class="ui-subtle mt-6 font-medium">Cargando menús...</p>
      </div>

      <!-- Lista de menús -->
      <div v-if=" menus.length > 0 " class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for=" ( menu, index ) in menus " :key=" menu.id "
          class="group ui-surface rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          :style=" { animationDelay: `${ index * 50 }ms` } " @click="viewMenu( menu )">
          <div class="flex items-start justify-between gap-3 mb-4">
            <label class="inline-flex items-center pt-1" @click.stop>
              <input type="checkbox" :checked="selectedMenuIds.includes(menu.id)" @change="toggleMenuSelected(menu.id)" />
            </label>
            <div class="flex-1 min-w-0">
              <h3 class="ui-title text-lg font-bold truncate group-hover:text-indigo-300 transition-colors">
                {{ menu.name }}
              </h3>
              <div class="flex items-center gap-2 mt-1">
                <span
                  class="inline-flex items-center gap-1 text-xs font-medium bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Semana {{ menu.week_number }}
                </span>
              </div>
            </div>
            <button type="button"
              class="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Eliminar menú" @click.stop="confirmDeleteMenu( menu )">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v4m0-4v4m-4 4h4m4-4h4m4 4h4m-4-4v4m0-4v4" />
              </svg>
            </button>
          </div>

          <div class="mb-3 grid grid-cols-3 gap-2 text-xs">
            <span class="rounded-lg border px-2 py-1 text-center" :class="mealCountClass(menu, 'desayuno')">
              D {{ menuMealCount(menu, "desayuno") }}/7
            </span>
            <span class="rounded-lg border px-2 py-1 text-center" :class="mealCountClass(menu, 'comida')">
              C {{ menuMealCount(menu, "comida") }}/7
            </span>
            <span class="rounded-lg border px-2 py-1 text-center" :class="mealCountClass(menu, 'cena')">
              N {{ menuMealCount(menu, "cena") }}/7
            </span>
          </div>

          <div class="ui-subtle flex items-center justify-between text-xs">
            <span class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {{ formatDate( menu.created_at ) }}
            </span>
            <span v-if=" isMenuComplete( menu ) "
              class="inline-flex items-center gap-1 text-green-600 font-medium">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Completo
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Sin menús -->
    <div v-if=" !loading && menus.length === 0 "
      class="ui-surface flex flex-col items-center justify-center py-20 rounded-2xl border-dashed">
      <div
        class="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-6">
        <svg class="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <p class="ui-muted font-medium text-lg mb-2">No tienes menús creados</p>
      <p class="ui-subtle text-sm mb-6">Crea tu primer menú semanal para empezar</p>
      <button @click="showNewMenuModal = true"
        class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Crear mi primer menú
      </button>
    </div>

    <!-- Modal para nuevo menú -->
    <div v-if=" showNewMenuModal " class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @click.self="showNewMenuModal = false">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
      <div class="ui-surface relative rounded-2xl shadow-2xl shadow-slate-900/20 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <h2 class="text-xl font-bold text-white">Crear nuevo menú semanal</h2>
          <p class="text-indigo-100 text-sm mt-1">Configura las opciones de tu menú</p>
        </div>

        <div class="p-6 space-y-6 overflow-y-auto">
          <div class="space-y-2">
            <label class="ui-muted block text-sm font-semibold">
              Nombre del menú
            </label>
            <div class="relative">
              <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
                </svg>
              </div>
              <input v-model=" newMenuName " type="text" placeholder="Ej: Semana 1, Menú Fitness..."
                class="ui-input w-full pl-10 pr-4 py-3"
                @keyup.enter=" createMenu " />
            </div>
          </div>

          <div class="rounded-xl p-5 border ui-divider">
            <h3 class="ui-title font-semibold mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Comidas fijas para los 7 días
              <span class="text-xs font-normal text-slate-400">(opcional)</span>
            </h3>
            <div class="flex flex-wrap gap-3 mb-4">
              <label v-for=" type in mealTypes " :key=" `fixed-${ type }` "
                class="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm cursor-pointer transition-all"
                :class=" fixedMealTypes.includes( type ) ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-text-1)]' : 'ui-divider ui-muted hover:bg-[var(--color-surface-3)]' ">
                <input v-model=" fixedMealTypes " type="checkbox" :value=" type " class="sr-only" />
                <span class="font-medium">{{ mealLabel( type ) }}</span>
              </label>
            </div>
            <article v-for=" type in fixedMealTypes " :key=" `fixed-card-${ type }` " class="border rounded-lg p-3">
              <h4 class="ui-title font-medium mb-2">
                {{ mealLabel( type ) }} fija
              </h4>
              <div class="mb-3 grid gap-2 md:grid-cols-2">
                <button type="button" class="rounded-lg border px-3 py-2 text-sm text-left" :class=" fixedMeals[ type ].recipe_mode === 'existing'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'ui-divider ui-muted'
                  " @click="fixedMeals[ type ].recipe_mode = 'existing'">
                  Usar receta existente
                </button>
                <button type="button" class="rounded-lg border px-3 py-2 text-sm text-left" :class=" fixedMeals[ type ].recipe_mode === 'new'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'ui-divider ui-muted'
                  " @click="
                    fixedMeals[ type ].recipe_mode = 'new';
                  fixedMeals[ type ].selected_recipe_id = '';
                  ">
                  Crear receta nueva
                </button>
              </div>
              <label class="block mb-3">
                <span class="ui-muted block text-xs font-medium mb-1">
                  Elegir receta guardada
                </span>
                <select v-model=" fixedMeals[ type ].selected_recipe_id "
                  :disabled=" fixedMeals[ type ].recipe_mode !== 'existing' " class="w-full border rounded-lg px-3 py-2"
                  @change="applySavedRecipeToFixedMeal( type )">
                  <option value="">Seleccionar receta...</option>
                  <option v-for=" recipe in savedRecipes " :key=" `${ type }-${ recipe.id }` " :value=" recipe.id ">
                    {{ recipe.name }}
                  </option>
                </select>
                <span v-if=" savedRecipes.length === 0 " class="mt-1 block text-xs text-amber-700">
                  No tienes recetas guardadas todavía.
                </span>
              </label>
              <div class="grid gap-2 md:grid-cols-2">
                <label class="md:col-span-2">
                  <span class="ui-muted block text-xs font-medium mb-1">
                    Nombre del plato
                  </span>
                  <input v-model.trim=" fixedMeals[ type ].dish_name " class="w-full border rounded-lg px-3 py-2"
                    placeholder="Ej: Yogur con avena y fruta" />
                </label>
                <label class="md:col-span-2">
                  <span class="ui-muted block text-xs font-medium mb-1">
                    Descripción
                  </span>
                  <input v-model.trim=" fixedMeals[ type ].dish_description " class="w-full border rounded-lg px-3 py-2"
                    placeholder="Descripción opcional" />
                </label>
              </div>

              <div class="mt-3 space-y-2">
                <div v-for=" ( ingredient, index ) in fixedMeals[ type ].ingredients " :key=" `${ type }-ing-${ index }` "
                  class="grid grid-cols-[1fr_90px_90px_32px] gap-2">
                  <label>
                    <span class="ui-muted block text-xs font-medium mb-1">
                      Ingrediente
                    </span>
                    <input v-model.trim=" ingredient.name " class="w-full border rounded-lg px-3 py-2"
                      placeholder="Ej: Avena" />
                  </label>
                  <label>
                    <span class="ui-muted block text-xs font-medium mb-1">
                      Cantidad
                    </span>
                    <input v-model.number=" ingredient.quantity " type="number" min="0.01" step="0.01"
                      class="w-full border rounded-lg px-3 py-2" />
                  </label>
                  <label>
                    <span class="ui-muted block text-xs font-medium mb-1">
                      Unidad
                    </span>
                    <select v-model=" ingredient.unit_type " class="w-full border rounded-lg px-3 py-2">
                      <option v-for=" unit in unitTypes " :key=" unit " :value=" unit ">
                        {{ unit }}
                      </option>
                    </select>
                  </label>
                  <button type="button" class="text-red-600 self-end h-10" @click="removeFixedIngredient( type, index )">
                    ×
                  </button>
                </div>
                <button type="button" class="text-sm text-indigo-700" @click="addFixedIngredient( type )">
                  + Ingrediente
                </button>
              </div>
            </article>
          </div>
        </div>
        <div class="flex gap-3 justify-end p-4 border-t ui-divider bg-transparent shrink-0">
          <button @click="showNewMenuModal = false"
            class="ui-btn-muted px-5 py-2.5 rounded-xl font-medium transition-all">
            Cancelar
          </button>
          <button @click=" createMenu "
            class="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300/30 transition-all active:scale-95">
            Crear menú
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WeeklyMenu } from "~/types";

const supabase = useSupabase();
const router = useRouter();
const { loadCurrentUser } = useCurrentUser();
const appToast = useAppToast();
const { confirm: confirmDialog } = useConfirmDialog();

const menus = ref<WeeklyMenu[]>( [] );
const selectedMenuIds = ref<string[]>( [] );
const loading = ref( true );
const showNewMenuModal = ref( false );
const newMenuName = ref( "" );
const mealTypes = [ "desayuno", "comida", "cena" ] as const;
const unitTypes = [ "g", "kg", "ml", "l", "ud", "pack", "unidad" ] as const;
const savedRecipes = ref<
  Array<{
    id: string;
    name: string;
    description?: string | null;
    recipe_ingredients?: Array<{
      name: string;
      quantity: number | null;
      unit_type: string;
      is_confirmed?: boolean;
    }>;
  }>
>( [] );
const fixedMealTypes = ref<Array<( typeof mealTypes )[ number ]>>( [] );
const fixedMeals = reactive(
  Object.fromEntries(
    mealTypes.map( ( type ) => [
      type,
      {
        recipe_mode: "existing" as "existing" | "new",
        selected_recipe_id: "",
        dish_name: "",
        dish_description: "",
        ingredients: [ { name: "", quantity: 1, unit_type: "g" as const } ],
      },
    ] ),
  ) as Record<
    ( typeof mealTypes )[ number ],
    {
      recipe_mode: "existing" | "new";
      selected_recipe_id: string;
      dish_name: string;
      dish_description: string;
      ingredients: Array<{ name: string; quantity: number; unit_type: string }>;
    }
  >,
);

const loadMenus = async () => {
  loading.value = true;
  const currentUser = await loadCurrentUser();

  if ( !currentUser ) {
    menus.value = [];
    loading.value = false;
    return;
  }

  const { data, error } = await supabase
    .from( "weekly_menus" )
    .select(
      `
      *,
      meals_count:weekly_meals(count)
    `,
    )
    .eq( "user_id", currentUser.id )
    .order( "week_number", { ascending: true } );

  if ( error ) {
    console.error( "Error cargando menús:", error );
  } else {
    const baseMenus = ( data || [] ).map( ( m ) => ( {
      ...m,
      meals_count: m.meals_count?.[ 0 ]?.count || 0,
    } ) );

    const menuIds = baseMenus.map( ( menu ) => menu.id );
    const mealBreakdownByMenu: Record<string, Record<string, number>> = {};

    if ( menuIds.length > 0 ) {
      const { data: mealRows, error: mealRowsError } = await supabase
        .from( "weekly_meals" )
        .select( "weekly_menu_id, meal_type, day_number" )
        .in( "weekly_menu_id", menuIds );

      if ( mealRowsError ) {
        console.error( "Error cargando breakdown de comidas:", mealRowsError );
      } else {
        const daySetByMenuType: Record<string, Set<number>> = {};

        for ( const row of mealRows || [] ) {
          const menuId = String( ( row as any ).weekly_menu_id || "" );
          const mealType = String( ( row as any ).meal_type || "" );
          const dayNumber = Number( ( row as any ).day_number || 0 );
          if ( !menuId || !mealType ) continue;
          if ( !mealBreakdownByMenu[ menuId ] ) {
            mealBreakdownByMenu[ menuId ] = { desayuno: 0, comida: 0, cena: 0 };
          }
          if ( mealType in mealBreakdownByMenu[ menuId ] ) {
            const key = `${ menuId }:${ mealType }`;
            if ( !daySetByMenuType[ key ] ) daySetByMenuType[ key ] = new Set<number>();
            if ( dayNumber >= 1 && dayNumber <= 7 ) {
              daySetByMenuType[ key ].add( dayNumber );
              mealBreakdownByMenu[ menuId ][ mealType ] = daySetByMenuType[ key ].size;
            }
          }
        }
      }
    }

    menus.value = baseMenus.map( ( menu ) => ( {
      ...menu,
      meal_breakdown: mealBreakdownByMenu[ menu.id ] || {
        desayuno: 0,
        comida: 0,
        cena: 0,
      },
    } as WeeklyMenu & { meal_breakdown: Record<string, number> } ) );

    selectedMenuIds.value = selectedMenuIds.value.filter( ( id ) =>
      menus.value.some( ( menu ) => menu.id === id ),
    );
  }

  loading.value = false;
};

const menuMealCount = ( menu: WeeklyMenu, type: "desayuno" | "comida" | "cena" ) => {
  const breakdown = ( menu as any ).meal_breakdown || {};
  return Number( breakdown[ type ] || 0 );
};

const mealCountClass = ( menu: WeeklyMenu, type: "desayuno" | "comida" | "cena" ) =>
  menuMealCount( menu, type ) >= 7
    ? "border-green-200 bg-green-50 text-green-700"
    : "border-amber-200 bg-amber-50 text-amber-700";

const isMenuComplete = ( menu: WeeklyMenu ) =>
  menuMealCount( menu, "desayuno" ) >= 7 &&
  menuMealCount( menu, "comida" ) >= 7 &&
  menuMealCount( menu, "cena" ) >= 7;

const toggleMenuSelected = ( menuId: string ) => {
  if ( selectedMenuIds.value.includes( menuId ) ) {
    selectedMenuIds.value = selectedMenuIds.value.filter( ( id ) => id !== menuId );
  } else {
    selectedMenuIds.value.push( menuId );
  }
};

const allMenusSelected = computed( () =>
  menus.value.length > 0 && menus.value.every( ( menu ) => selectedMenuIds.value.includes( menu.id ) ),
);

const toggleSelectAllMenus = () => {
  if ( allMenusSelected.value ) {
    selectedMenuIds.value = [];
  } else {
    selectedMenuIds.value = menus.value.map( ( menu ) => menu.id );
  }
};

const deleteSelectedMenus = async () => {
  if ( selectedMenuIds.value.length === 0 ) return;
  const confirmed = await confirmDialog( {
    title: "Eliminar menús",
    message: `¿Eliminar ${ selectedMenuIds.value.length } menús semanales seleccionados?`,
    confirmText: "Eliminar",
    danger: true,
  } );
  if ( !confirmed ) return;

  const currentUser = await loadCurrentUser();
  if ( !currentUser ) {
    appToast.error( "No hay usuario configurado. Usa /start en Telegram primero." );
    return;
  }

  const { error } = await supabase
    .from( "weekly_menus" )
    .delete()
    .eq( "user_id", currentUser.id )
    .in( "id", selectedMenuIds.value );

  if ( error ) {
    appToast.error( "Error eliminando menús: " + error.message );
    return;
  }

  selectedMenuIds.value = [];
  await loadMenus();
  appToast.success( "Menús eliminados correctamente." );
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
      "id, name, description, recipe_ingredients(name, quantity, unit_type, is_confirmed)",
    )
    .eq( "user_id", currentUser.id )
    .order( "name", { ascending: true } );

  if ( error ) {
    console.error( "Error cargando recetas guardadas:", error );
    savedRecipes.value = [];
    return;
  }

  savedRecipes.value = data || [];
};

const createMenu = async () => {
  if ( !newMenuName.value.trim() ) {
    appToast.error( "Pon un nombre para el menú semanal." );
    return;
  }
  const currentUser = await loadCurrentUser();
  if ( !currentUser ) {
    appToast.error( "No hay usuario configurado. Usa /start en Telegram primero." );
    return;
  }

  // Obtener siguiente week_number
  const maxWeek = menus.value.reduce(
    ( max, m ) => Math.max( max, m.week_number ),
    0,
  );

  const { data, error } = await supabase
    .from( "weekly_menus" )
    .insert( {
      user_id: currentUser.id,
      name: newMenuName.value.trim(),
      week_number: maxWeek + 1,
    } )
    .select()
    .single();

  if ( error ) {
    appToast.error( "Error creando menú: " + error.message );
    return;
  }

  if ( data?.id && fixedMealTypes.value.length > 0 ) {
    const recipeByNormalizedName = new Map(
      savedRecipes.value.map( ( recipe ) => [ normalizeName( recipe.name ), recipe ] ),
    );

    const ensureRecipeExists = async ( type: ( typeof mealTypes )[ number ] ) => {
      const fixed = fixedMeals[ type ];
      if ( fixed.selected_recipe_id ) return fixed.selected_recipe_id;
      if ( !fixed.dish_name.trim() ) return null;

      const normalizedDishName = normalizeName( fixed.dish_name );
      const existing = recipeByNormalizedName.get( normalizedDishName );
      if ( existing?.id ) {
        fixed.selected_recipe_id = existing.id;
        return existing.id;
      }

      const { data: createdDish, error: createdDishError } = await supabase
        .from( "dishes" )
        .insert( {
          user_id: currentUser.id,
          name: fixed.dish_name.trim(),
          normalized_name: normalizedDishName,
          description: fixed.dish_description.trim() || null,
          recipe_status: "pending_ingredients",
        } )
        .select( "id" )
        .single();

      if ( createdDishError || !createdDish?.id ) {
        console.error( "Error creando receta desde menú semanal:", createdDishError );
        return null;
      }

      const recipeIngredients = fixed.ingredients
        .filter( ( ingredient ) => ingredient.name && ingredient.quantity > 0 )
        .map( ( ingredient ) => ( {
          recipe_id: createdDish.id,
          name: ingredient.name.toLowerCase(),
          normalized_name: normalizeName( ingredient.name ),
          quantity: ingredient.quantity,
          unit_type: ingredient.unit_type,
          is_confirmed: true,
        } ) );

      if ( recipeIngredients.length > 0 ) {
        const { error: recipeIngredientsError } = await supabase
          .from( "recipe_ingredients" )
          .insert( recipeIngredients );
        if ( recipeIngredientsError ) {
          console.error(
            "Error guardando ingredientes de receta desde menú semanal:",
            recipeIngredientsError,
          );
        }
      }

      fixed.selected_recipe_id = createdDish.id;
      return createdDish.id;
    };

    const fixedRows = [];
    const fixedIngredientRows: Array<{
      weekly_meal_id: string;
      name: string;
      quantity: number;
      unit_type: string;
    }> = [];

    for ( const type of fixedMealTypes.value ) {
      const fixed = fixedMeals[ type ];
      if (
        fixed.recipe_mode === "existing" &&
        !fixed.selected_recipe_id &&
        !fixed.dish_name.trim()
      ) {
        continue;
      }
      if ( fixed.recipe_mode === "new" && fixed.dish_name.trim() ) {
        await ensureRecipeExists( type );
      }
      if ( !fixed.dish_name.trim() ) continue;
      for ( let day = 1; day <= 7; day++ ) {
        fixedRows.push( {
          weekly_menu_id: data.id,
          day_number: day,
          meal_type: type,
          meal_slot: 1,
          dish_name: fixed.dish_name.trim(),
          dish_description: fixed.dish_description.trim() || null,
          kcal: 0,
          protein_g: 0,
          carbs_g: 0,
          fat_g: 0,
        } );
      }
    }

    if ( fixedRows.length > 0 ) {
      let insertedMeals: Array<{ id: string; meal_type: string; day_number: number }> | null =
        null;
      let fixedError: any = null;

      const firstAttempt = await supabase
        .from( "weekly_meals" )
        .upsert( fixedRows, {
          onConflict: "weekly_menu_id,day_number,meal_type,meal_slot",
        } )
        .select( "id, meal_type, day_number" );

      insertedMeals = firstAttempt.data as any;
      fixedError = firstAttempt.error;

      if ( fixedError?.code === "42P10" ) {
        const fallbackAttempt = await supabase
          .from( "weekly_meals" )
          .upsert(
            fixedRows.map( ( { meal_slot, ...row } ) => row ),
            { onConflict: "weekly_menu_id,day_number,meal_type" },
          )
          .select( "id, meal_type, day_number" );
        insertedMeals = fallbackAttempt.data as any;
        fixedError = fallbackAttempt.error;
      }

      if ( fixedError ) {
        appToast.error( "Menú creado, pero falló la comida fija: " + fixedError.message );
      } else if ( insertedMeals ) {
        for ( const meal of insertedMeals ) {
          const mealType = meal.meal_type as ( typeof mealTypes )[ number ];
          const ingredientRows = fixedMeals[ mealType ].ingredients.filter(
            ( ingredient ) => ingredient.name && ingredient.quantity > 0,
          );
          for ( const ing of ingredientRows ) {
            fixedIngredientRows.push( {
              weekly_meal_id: meal.id,
              name: ing.name.toLowerCase(),
              quantity: ing.quantity,
              unit_type: ing.unit_type,
            } );
          }
        }
        if ( fixedIngredientRows.length > 0 ) {
          await supabase
            .from( "weekly_meal_ingredients" )
            .insert( fixedIngredientRows );
        }
      }
    }

    // Save reusable fixed meals
    for ( const type of fixedMealTypes.value ) {
      const fixed = fixedMeals[ type ];
      if ( !fixed.dish_name.trim() ) continue;
      const { data: savedFixedMeal } = await supabase
        .from( "saved_fixed_meals" )
        .insert( {
          user_id: currentUser.id,
          meal_type: type,
          dish_name: fixed.dish_name.trim(),
          dish_description: fixed.dish_description.trim() || null,
          kcal: 0,
          protein_g: 0,
          carbs_g: 0,
          fat_g: 0,
        } )
        .select( "id" )
        .maybeSingle();

      if ( savedFixedMeal?.id ) {
        const rows = fixed.ingredients
          .filter( ( ingredient ) => ingredient.name && ingredient.quantity > 0 )
          .map( ( ingredient ) => ( {
            fixed_meal_id: savedFixedMeal.id,
            name: ingredient.name.toLowerCase(),
            quantity: ingredient.quantity,
            unit_type: ingredient.unit_type,
          } ) );
        if ( rows.length > 0 ) {
          await supabase.from( "saved_fixed_meal_ingredients" ).insert( rows );
        }
      }
    }
  }

  newMenuName.value = "";
  resetFixedMeals();
  showNewMenuModal.value = false;
  await loadMenus();
  appToast.success( "Menú creado correctamente." );

  // Ir a la página de detalle del menú creado
  router.push( `/menu/${ data.id }` );
};

const mealLabel = ( type: ( typeof mealTypes )[ number ] ) => {
  if ( type === "desayuno" ) return "Desayuno";
  if ( type === "comida" ) return "Comida";
  return "Cena";
};

const addFixedIngredient = ( type: ( typeof mealTypes )[ number ] ) => {
  fixedMeals[ type ].ingredients.push( {
    name: "",
    quantity: 1,
    unit_type: "g",
  } );
};

const applySavedRecipeToFixedMeal = ( type: ( typeof mealTypes )[ number ] ) => {
  const recipeId = fixedMeals[ type ].selected_recipe_id;
  if ( !recipeId ) return;

  const selectedRecipe = savedRecipes.value.find(
    ( recipe ) => recipe.id === recipeId,
  );
  if ( !selectedRecipe ) return;

  fixedMeals[ type ].dish_name = selectedRecipe.name || "";
  fixedMeals[ type ].dish_description = selectedRecipe.description || "";
  fixedMeals[ type ].recipe_mode = "existing";

  const confirmedIngredients = ( selectedRecipe.recipe_ingredients || [] ).filter(
    ( ingredient ) => ingredient.is_confirmed !== false && ingredient.name,
  );

  fixedMeals[ type ].ingredients =
    confirmedIngredients.length > 0
      ? confirmedIngredients.map( ( ingredient ) => ( {
        name: ingredient.name,
        quantity:
          Number( ingredient.quantity ) > 0 ? Number( ingredient.quantity ) : 1,
        unit_type: ingredient.unit_type || "g",
      } ) )
      : [ { name: "", quantity: 1, unit_type: "g" } ];
};

const removeFixedIngredient = (
  type: ( typeof mealTypes )[ number ],
  index: number,
) => {
  fixedMeals[ type ].ingredients.splice( index, 1 );
};

const resetFixedMeals = () => {
  fixedMealTypes.value = [];
  for ( const type of mealTypes ) {
    fixedMeals[ type ] = {
      recipe_mode: "existing",
      selected_recipe_id: "",
      dish_name: "",
      dish_description: "",
      ingredients: [ { name: "", quantity: 1, unit_type: "g" } ],
    };
  }
};

const normalizeName = ( value: string ) =>
  String( value || "" )
    .trim()
    .toLowerCase()
    .normalize( "NFD" )
    .replace( /[\u0300-\u036f]/g, "" );

const viewMenu = ( menu: WeeklyMenu ) => {
  router.push( `/menu/${ menu.id }` );
};

const confirmDeleteMenu = async ( menu: WeeklyMenu ) => {
  const confirmed = await confirmDialog( {
    title: "Eliminar menú",
    message: `¿Eliminar el menú "${ menu.name }"?`,
    confirmText: "Eliminar",
    danger: true,
  } );
  if ( !confirmed ) return;

  const currentUser = await loadCurrentUser();
  if ( !currentUser ) {
    appToast.error( "No hay usuario configurado. Usa /start en Telegram primero." );
    return;
  }

  const { error } = await supabase
    .from( "weekly_menus" )
    .delete()
    .eq( "id", menu.id )
    .eq( "user_id", currentUser.id );

  if ( error ) {
    appToast.error( "Error eliminando menú: " + error.message );
    return;
  }

  await loadMenus();
  appToast.success( "Menú eliminado." );
};

const formatDate = ( dateString: string ) => {
  return new Date( dateString ).toLocaleDateString( "es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  } );
};

onMounted( () => {
  loadMenus();
  loadSavedRecipes();
} );
</script>
