<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <NuxtLink href="/history" class="text-sm text-sky-300 underline">
          Volver a rotativos
        </NuxtLink>
        <h1 class="mt-2 text-2xl font-bold text-gray-900">
          {{ detail?.menu?.name || "Menú rotativo" }}
        </h1>
        <p class="text-sm text-gray-500">
          {{ detail?.menu?.duration_days || 0 }} días ·
          {{ detail?.profiles?.length || 0 }} perfiles ·
          {{ detail?.days?.length || 0 }} días cargados
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <NuxtLink href="/shopping" class="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
          Abrir compra
        </NuxtLink>
        <button class="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          @click="showDebug = !showDebug">
          {{ showDebug ? "Ocultar debug" : "Ver debug" }}
        </button>
      </div>
    </header>

    <section v-if=" loading " class="rounded-lg border bg-white p-6 text-sm text-gray-500">
      Cargando menú generado...
    </section>

    <section v-else-if=" error " class="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800">
      <p class="font-semibold">No se pudo visualizar el menú generado</p>
      <p class="mt-1">{{ error }}</p>
      <pre v-if=" debug "
        class="mt-3 max-h-80 overflow-auto rounded border border-red-200 bg-white p-3 text-xs">{{ JSON.stringify( debug, null, 2 ) }}</pre>
    </section>

    <section v-else-if=" !detail || detail.days.length === 0 "
      class="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
      <p class="font-semibold">El menú existe, pero no tiene días guardados.</p>
      <p class="mt-1">
        Revisa los logs del job: la recuperación no recibió filas de
        `rotating_menu_days`.
      </p>
    </section>

    <template v-else>
      <section class="grid gap-3 md:grid-cols-4">
        <article class="rounded-lg border bg-white p-4 text-gray-900">
          <p class="text-xs text-gray-500">Estado job</p>
          <p class="mt-1 font-semibold text-gray-900">
            {{ detail.job?.status || "Sin job vinculado" }}
          </p>
        </article>
        <article class="rounded-lg border bg-white p-4 text-gray-900">
          <p class="text-xs text-gray-500">Días</p>
          <p class="mt-1 font-semibold text-gray-900">{{ detail.days.length }}</p>
        </article>
        <article class="rounded-lg border bg-white p-4 text-gray-900">
          <p class="text-xs text-gray-500">Comidas</p>
          <p class="mt-1 font-semibold text-gray-900">{{ mealsCount }}</p>
        </article>
        <article class="rounded-lg border bg-white p-4 text-gray-900">
          <p class="text-xs text-gray-500">Compra</p>
          <p class="mt-1 font-semibold text-gray-900">
            {{ detail.shopping_items.length }} líneas
          </p>
        </article>
      </section>

      <section class="rounded-lg border bg-white p-4 text-gray-900">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="font-semibold text-gray-900">Navegación por días</h2>
            <p class="text-xs text-gray-500">
              Salta entre días y colapsa los que no estés revisando.
            </p>
          </div>
          <button class="rounded border px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50" @click=" toggleAllDays ">
            {{ allExpanded ? "Colapsar días" : "Expandir días" }}
          </button>
        </div>
        <div class="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button v-for=" day in detail.days " :key=" `nav-${ day.id }` " class="min-w-16 rounded border px-3 py-2 text-xs"
            :class=" selectedDayNumber === day.day_number
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'text-gray-700 hover:bg-gray-50'
              " @click="selectDay( day.day_number )">
            Día {{ day.day_number }}
          </button>
        </div>
      </section>

      <section v-if=" showDebug " class="rounded-lg border bg-zinc-950 p-4 text-xs text-zinc-100">
        <h2 class="mb-2 font-semibold">Debug recuperación/render</h2>
        <pre
          class="max-h-96 overflow-auto rounded border border-zinc-800 p-3">{{ JSON.stringify( detail.debug, null, 2 ) }}</pre>
      </section>

      <section class="space-y-4">
        <article v-for=" day in visibleDays " :id=" `day-${ day.day_number }` " :key=" day.id "
          class="rounded-lg border bg-white p-4 text-gray-900">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-gray-900">
                Día {{ day.day_number }} · {{ formatDate( day.day_date ) }}
              </h2>
              <p class="text-xs text-gray-500">
                {{ day.meals.length }} comidas · {{ day.profile_totals.length }} perfiles
              </p>
            </div>
            <button class="rounded border px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              @click="toggleDay( day.day_number )">
              {{ collapsedDays.has( day.day_number ) ? "Expandir" : "Colapsar" }}
            </button>
          </div>

          <div v-if=" !collapsedDays.has( day.day_number ) " class="mt-4 space-y-3">
            <article v-for=" meal in day.meals " :key=" meal.id " class="rounded-lg border p-3"
              :class=" meal.is_special ? 'border-amber-200 bg-amber-50' : 'bg-white' ">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-semibold uppercase text-gray-500">
                    {{ mealLabel( meal.meal_type ) }}
                  </p>
                  <h3 class="font-semibold text-gray-900">{{ meal.dish_name }}</h3>
                  <p v-if=" meal.dish_description " class="text-xs text-gray-500">
                    {{ meal.dish_description }}
                  </p>
                </div>
                <span v-if=" meal.is_special " class="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">
                  Comida libre · {{ meal.special_kcal_reserved ?? 700 }} kcal reservadas
                </span>
              </div>

              <div v-if=" meal.is_special "
                class="mt-3 rounded border border-amber-200 bg-white/70 p-3 text-xs text-amber-800">
                Esta comida no tiene ingredientes calculados, no fuerza macros y
                no se incluye en la lista de la compra.
              </div>

              <div v-else class="mt-3 overflow-x-auto">
                <table class="min-w-[900px] w-full text-xs">
                  <thead class="text-left text-gray-600">
                    <tr>
                      <th class="px-2 py-2">Perfil</th>
                      <th class="px-2 py-2">x ración</th>
                      <th class="px-2 py-2">kcal</th>
                      <th class="px-2 py-2">Proteína</th>
                      <th class="px-2 py-2">Hidratos</th>
                      <th class="px-2 py-2">Grasas</th>
                      <th class="px-2 py-2">Ingredientes/cantidades</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for=" portion in meal.profile_portions " :key=" portion.id " class="border-t">
                      <td class="px-2 py-2 font-medium">{{ portion.profile_name }}</td>
                      <td class="px-2 py-2">x{{ Number( portion.serving_multiplier || 1 ).toFixed( 2 ) }}</td>
                      <td class="px-2 py-2">{{ Math.round( Number( portion.final_kcal || 0 ) ) }}</td>
                      <td class="px-2 py-2">{{ fixed( portion.final_protein_g ) }}g</td>
                      <td class="px-2 py-2">{{ fixed( portion.final_carbs_g ) }}g</td>
                      <td class="px-2 py-2">{{ fixed( portion.final_fat_g ) }}g</td>
                      <td class="px-2 py-2">
                        <div v-if=" portion.ingredients.length > 0 " class="flex flex-wrap gap-1">
                          <span v-for=" ingredient in portion.ingredients " :key=" ingredient.id "
                            class="rounded bg-gray-100 px-1.5 py-0.5">
                            {{ ingredient.name }}:
                            {{ fixed( ingredient.final_quantity ) }}
                            {{ ingredient.unit_type }}
                          </span>
                        </div>
                        <span v-else class="text-amber-700">
                          Sin ingredientes calculados
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </article>

            <div class="overflow-x-auto rounded-lg border bg-white">
              <table class="min-w-[820px] w-full text-sm text-gray-900">
                <thead class="text-left text-gray-600">
                  <tr>
                    <th class="px-3 py-2">Perfil</th>
                    <th class="px-3 py-2">kcal total</th>
                    <th class="px-3 py-2">kcal libres</th>
                    <th class="px-3 py-2">kcal calculadas</th>
                    <th class="px-3 py-2">P/H/G</th>
                    <th class="px-3 py-2">Δ kcal</th>
                    <th class="px-3 py-2">Δ proteína</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for=" total in day.profile_totals " :key=" `${ day.id }-${ total.profile_id }` " class="border-t">
                    <td class="px-3 py-2 font-medium">{{ total.profile_name }}</td>
                    <td class="px-3 py-2">{{ total.total_kcal }} / {{ total.target_kcal }}</td>
                    <td class="px-3 py-2">{{ total.special_kcal_reserved }}</td>
                    <td class="px-3 py-2">{{ total.regular_kcal }}</td>
                    <td class="px-3 py-2">
                      {{ fixed( total.total_protein_g ) }} /
                      {{ fixed( total.total_carbs_g ) }} /
                      {{ fixed( total.total_fat_g ) }}
                    </td>
                    <td class="px-3 py-2" :class=" deltaClass( total.kcal_delta ) ">
                      {{ signed( total.kcal_delta ) }}
                    </td>
                    <td class="px-3 py-2" :class=" deltaClass( total.protein_delta_g ) ">
                      {{ signed( total.protein_delta_g ) }}g
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </article>
      </section>

      <section class="rounded-lg border bg-white p-4 text-gray-900">
        <h2 class="font-semibold text-gray-900">Lista de la compra generada</h2>
        <p class="mt-1 text-xs text-gray-500">
          Generada desde este menú. Las comidas libres/especiales se ignoran.
        </p>
        <div v-if=" detail.shopping_items.length === 0 "
          class="mt-3 rounded border border-dashed p-4 text-sm text-gray-500">
          No hay líneas de compra para este menú.
        </div>
        <div v-else class="mt-3 grid gap-2 md:grid-cols-2">
          <div v-for=" item in detail.shopping_items " :key=" item.id " class="rounded border p-3 text-sm">
            <p class="font-medium text-gray-900">{{ item.item_name }}</p>
            <p class="text-xs text-gray-500">
              {{ Math.round( Number( item.quantity_grams || item.quantity_needed || 0 ) ) }} g
              · {{ item.conversion_status || "exact" }}
            </p>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { logError } from "~/utils/log-error";

type DetailResponse = {
  success: boolean;
  menu: any;
  job: any | null;
  profiles: any[];
  days: Array<any>;
  shopping_items: any[];
  debug: Record<string, any>;
};

const route = useRoute();
const { loadCurrentUser } = useCurrentUser();

const loading = ref( true );
const error = ref( "" );
const debug = ref<Record<string, any> | null>( null );
const detail = ref<DetailResponse | null>( null );
const showDebug = ref( false );
const collapsedDays = ref<Set<number>>( new Set() );
const selectedDayNumber = ref<number | null>( null );

const mealsCount = computed( () =>
  ( detail.value?.days || [] ).reduce(
    ( acc: number, day: any ) => acc + ( day.meals?.length || 0 ),
    0,
  ),
);

const allExpanded = computed( () => collapsedDays.value.size === 0 );
const visibleDays = computed( () => detail.value?.days || [] );

const loadDetail = async () => {
  loading.value = true;
  error.value = "";
  debug.value = null;
  try {
    const currentUser = await loadCurrentUser();
    if ( !currentUser ) throw new Error( "Usuario no disponible" );

    const data = await $fetch<DetailResponse>( "/api/rotating-menu-detail", {
      query: {
        userId: currentUser.id,
        rotatingMenuId: String( route.params.id || "" ),
      },
    } );

    detail.value = data;
    debug.value = data.debug;
    selectedDayNumber.value = data.days?.[ 0 ]?.day_number || null;

    console.log( "rotating menu detail loaded", data.debug );

    if ( !data.days || data.days.length === 0 ) showDebug.value = true;
  } catch ( err: any ) {
    error.value =
      err?.data?.message ||
      err?.statusMessage ||
      err?.message ||
      "Error cargando el menú generado.";
    debug.value = err?.data?.data?.debug || err?.data?.debug || null;
    await logError( "web", err, {
      context: "rotating.detail.loadDetail",
      extra: { rotatingMenuId: String( route.params.id || "" ) },
    } );
  } finally {
    loading.value = false;
  }
};

const selectDay = async ( dayNumber: number ) => {
  selectedDayNumber.value = dayNumber;
  collapsedDays.value.delete( dayNumber );
  await nextTick();
  document.getElementById( `day-${ dayNumber }` )?.scrollIntoView( {
    behavior: "smooth",
    block: "start",
  } );
};

const toggleDay = ( dayNumber: number ) => {
  if ( collapsedDays.value.has( dayNumber ) ) {
    collapsedDays.value.delete( dayNumber );
  } else {
    collapsedDays.value.add( dayNumber );
  }
};

const toggleAllDays = () => {
  if ( !detail.value ) return;
  if ( collapsedDays.value.size === 0 ) {
    collapsedDays.value = new Set(
      detail.value.days.map( ( day: any ) => day.day_number ),
    );
  } else {
    collapsedDays.value.clear();
  }
};

const mealLabel = ( type: string ) =>
  type === "desayuno"
    ? "Desayuno"
    : type === "comida"
      ? "Comida"
      : type === "snack"
        ? "Snack"
        : "Cena";

const formatDate = ( value: string ) =>
  value
    ? new Date( value ).toLocaleDateString( "es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    } )
    : "Sin fecha";

const fixed = ( value: number | string | null | undefined ) =>
  ( Number( value ) || 0 ).toFixed( 1 );

const signed = ( value: number | string | null | undefined ) => {
  const rounded = Math.round( ( Number( value ) || 0 ) * 10 ) / 10;
  return rounded > 0 ? `+${ rounded }` : `${ rounded }`;
};

const deltaClass = ( value: number | string | null | undefined ) => {
  const abs = Math.abs( Number( value ) || 0 );
  if ( abs <= 30 ) return "text-emerald-700";
  if ( abs <= 90 ) return "text-amber-700";
  return "text-red-700";
};

onMounted( loadDetail );
</script>
