<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <NuxtLink href="/history" class="text-sm text-[var(--accent)] underline">
          Volver a rotativos
        </NuxtLink>
        <h1 class="mt-2 text-2xl font-bold text-[var(--text-1)]">
          {{ detail?.menu?.name || "Menú rotativo" }}
        </h1>
        <p class="text-sm text-[var(--text-3)]">
          {{ detail?.menu?.duration_days || 0 }} días ·
          {{ detail?.profiles?.length || 0 }} perfiles ·
          {{ detail?.days?.length || 0 }} días cargados
          <span v-if=" detail?.menu?.generator_type === 'nutrition_scored' ">
            · scoring nutricional
          </span>
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <NuxtLink href="/shopping" class="rounded-lg border px-4 py-2 text-sm text-[var(--text-2)] hover:bg-[rgba(255,255,255,0.06)] bg-[var(--surface-1)]">
          Abrir compra
        </NuxtLink>
        <button class="rounded-lg border px-4 py-2 text-sm text-[var(--text-2)] hover:bg-[rgba(255,255,255,0.06)] bg-[var(--surface-1)]"
          @click="showDebug = !showDebug">
          {{ showDebug ? "Ocultar debug" : "Ver debug" }}
        </button>
      </div>
    </header>

    <section v-if=" loading " class="rounded-lg border bg-transparent bg-[var(--surface-1)] p-6 text-sm text-[var(--text-3)]">
      Cargando menú generado...
    </section>

    <section v-else-if=" error " class="rounded-lg border border-[rgba(255,100,103,0.2)] bg-[rgba(255,100,103,0.06)] p-5 text-sm ">
      <p class="font-semibold">No se pudo visualizar el menú generado</p>
      <p class="mt-1">{{ error }}</p>
      <pre v-if=" debug "
        class="mt-3 max-h-80 overflow-auto rounded border border-[rgba(255,100,103,0.2)] bg-transparent bg-[var(--surface-1)] p-3 text-xs">{{ JSON.stringify( debug, null, 2 ) }}</pre>
    </section>

    <section v-else-if=" !detail || detail.days.length === 0 "
      class="rounded-lg border border-[rgba(255,214,0,0.2)] bg-[rgba(255,214,0,0.06)] p-5 text-sm text-[var(--goldenrod)]">
      <p class="font-semibold">El menú existe, pero no tiene días guardados.</p>
      <p class="mt-1">
        Revisa los logs del job: la recuperación no recibió filas de
        `rotating_menu_days`.
      </p>
    </section>

    <template v-else>
      <section class="grid gap-3 md:grid-cols-4">
        <article class="rounded-lg border bg-transparent bg-[var(--surface-1)] p-4 text-[var(--text-1)]">
          <p class="text-xs text-[var(--text-3)]">Estado job</p>
          <p class="mt-1 font-semibold text-[var(--text-1)]">
            {{ detail.job?.status || "Sin job vinculado" }}
          </p>
        </article>
        <article class="rounded-lg border bg-transparent bg-[var(--surface-1)] p-4 text-[var(--text-1)]">
          <p class="text-xs text-[var(--text-3)]">Días</p>
          <p class="mt-1 font-semibold text-[var(--text-1)]">{{ detail.days.length }}</p>
        </article>
        <article class="rounded-lg border bg-transparent bg-[var(--surface-1)] p-4 text-[var(--text-1)]">
          <p class="text-xs text-[var(--text-3)]">Comidas</p>
          <p class="mt-1 font-semibold text-[var(--text-1)]">{{ mealsCount }}</p>
        </article>
        <article class="rounded-lg border bg-transparent bg-[var(--surface-1)] p-4 text-[var(--text-1)]">
          <p class="text-xs text-[var(--text-3)]">Compra</p>
          <p class="mt-1 font-semibold text-[var(--text-1)]">
            {{ detail.shopping_items.length }} líneas
          </p>
        </article>
        <article v-if=" detail.menu?.generator_type === 'nutrition_scored' " class="rounded-lg border bg-transparent bg-[var(--surface-1)] p-4 text-[var(--text-1)]">
          <p class="text-xs text-[var(--text-3)]">Score</p>
          <p class="mt-1 font-semibold text-[var(--text-1)]">
            {{ fixed( detail.menu?.score ) }} · {{ detail.menu?.meets_targets ? "cumple" : "revisar" }}
          </p>
        </article>
      </section>

      <section class="rounded-lg border bg-transparent bg-[var(--surface-1)] p-4 text-[var(--text-1)]">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="font-semibold text-[var(--text-1)]">Semanas</h2>
            <p class="text-xs text-[var(--text-3)]">
              Selecciona una semana para ver sus 7 días.
            </p>
          </div>
        </div>
        <div class="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button v-for=" week in weeks " :key=" `nav-week-${ week.weekNumber }` "
            class="min-w-28 rounded-lg border px-4 py-2.5 text-sm"
            :class="selectedWeekNumber === week.weekNumber ? 'border-indigo-500 text-[var(--text-1)]'
                : ' text-[var(--text-2)] hover:bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.06)]'
              " @click=" selectedWeekNumber = week.weekNumber">
            <div class="font-semibold">Semana {{ week.weekNumber }}</div>
            <div class="text-xs opacity-70">Días {{ week.startDay }}-{{ week.endDay }}</div>
          </button>
        </div>
      </section>

      <section v-if=" showDebug " class="rounded-lg border bg-[var(--bg-shell)] p-4 text-xs text-[var(--text-1)]">
        <h2 class="mb-2 font-semibold">Debug recuperación/render</h2>
        <pre
          class="max-h-96 overflow-auto rounded border border-[var(--border-soft)] p-3">{{ JSON.stringify( detail.debug, null, 2 ) }}</pre>
      </section>

      <section class="space-y-6">
        <template v-for="week in weeks" :key="`week-${week.weekNumber}`">
          <section v-if=" selectedWeekNumber === week.weekNumber ">
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 class="text-base font-semibold text-[var(--text-1)]">
                Semana {{ week.weekNumber }}
                <span class="font-normal text-[var(--text-3)]">
                  · Días {{ week.startDay }}-{{ week.endDay }}
                </span>
              </h2>
              <span v-if="week.sourceMenuName" class="rounded-full bg-[rgba(187,222,242,0.08)] dark:/30 px-3 py-1 text-xs dark:">
                {{ week.sourceMenuName }}
              </span>
            </div>

          <div class="space-y-4">
            <article v-for=" day in week.days " :id=" `day-${ day.day_number }` " :key=" day.id "
              class="rounded-lg border bg-transparent bg-[var(--surface-1)] p-4 text-[var(--text-1)]">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 class="text-lg font-semibold text-[var(--text-1)]">
                    Día {{ day.day_number }} · {{ formatDate( day.day_date ) }}
                  </h3>
                  <p class="text-xs text-[var(--text-3)]">
                    {{ day.meals.length }} comidas · {{ day.profile_totals.length }} perfiles
                  </p>
                </div>
                <span v-if=" day.score != null " class="rounded-full px-2 py-1 text-xs font-semibold" :class="day.meets_targets ? ' text-[var(--success)]' : ' text-[var(--goldenrod)]' ">
                  score {{ fixed( day.score ) }} · {{ day.meets_targets ? "cumple" : "mejor disponible" }}
                </span>
              </div>

              <div class="mt-4 space-y-3">
                <article v-for=" meal in day.meals " :key=" meal.id " class="rounded-lg border p-3 bg-transparent bg-[var(--surface-1)]"
                  :class="meal.is_special ? '' : ''">
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p class="text-xs font-semibold uppercase text-[var(--text-3)]">
                        {{ mealLabel( meal.meal_type ) }}
                        <span v-if=" Number( meal.meal_slot || 1 ) > 1 ">
                          · Plato {{ meal.meal_slot }}
                        </span>
                      </p>
                      <h4 class="font-semibold text-[var(--text-1)]">{{ meal.dish_name }}</h4>
                      <p v-if=" meal.dish_description " class="text-xs text-[var(--text-3)]">
                        {{ meal.dish_description }}
                      </p>
                    </div>
                    <span v-if=" meal.is_special " class="rounded-full bg-[var(--surface-3)] px-2 py-1 text-xs text-[var(--text-2)]">
                      Comida libre · {{ meal.special_kcal_reserved ?? 700 }} kcal reservadas
                    </span>
                  </div>

                  <div v-if=" meal.is_special "
                    class="mt-3 rounded border border-[var(--border-soft)] bg-[var(--surface-2)]/50 p-3 text-xs text-[var(--text-3)]">
                    Esta comida no tiene ingredientes calculados, no fuerza macros y
                    no se incluye en la lista de la compra.
                  </div>

                  <div v-else class="mt-3 overflow-x-auto">
                    <table class="min-w-[900px] w-full text-xs">
                      <thead class="text-left text-[var(--text-2)]">
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
                                class="rounded bg-[var(--surface-3)] px-1.5 py-0.5">
                                {{ ingredient.name }}:
                                {{ fixed( ingredient.final_quantity ) }}
                                {{ ingredient.unit_type }}
                              </span>
                            </div>
                            <span v-else class="text-[var(--text-3)]">
                              Sin ingredientes calculados
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </article>

                <div class="overflow-x-auto rounded-lg border bg-transparent bg-[var(--surface-1)]">
                  <table class="min-w-[820px] w-full text-sm text-[var(--text-1)]">
                    <thead class="text-left text-[var(--text-2)]">
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
                        <td class="px-3 py-2" :class="deltaClass( total.kcal_delta ) ">
                          {{ signed( total.kcal_delta ) }}
                        </td>
                        <td class="px-3 py-2" :class="deltaClass( total.protein_delta_g ) ">
                          {{ signed( total.protein_delta_g ) }}g
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </article>
          </div>
          </section>
        </template>
      </section>

      <section class="rounded-lg border bg-transparent bg-[var(--surface-1)] p-4 text-[var(--text-1)]">
        <h2 class="font-semibold text-[var(--text-1)]">Lista de la compra generada</h2>
        <p class="mt-1 text-xs text-[var(--text-3)]">
          Generada desde este menú. Las comidas libres/especiales se ignoran.
        </p>
        <div v-if=" detail.shopping_items.length === 0 "
          class="mt-3 rounded border border-dashed p-4 text-sm text-[var(--text-3)]">
          No hay líneas de compra para este menú.
        </div>
        <div v-else class="mt-3 grid gap-2 md:grid-cols-2">
          <div v-for=" item in detail.shopping_items " :key=" item.id " class="rounded border p-3 text-sm">
            <p class="font-medium text-[var(--text-1)]">{{ item.item_name }}</p>
            <p class="text-xs text-[var(--text-3)]">
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
  source_weekly_menu_names: Record<string, string>;
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
const selectedWeekNumber = ref( 1 );

const mealsCount = computed( () =>
  ( detail.value?.days || [] ).reduce(
    ( acc: number, day: any ) => acc + ( day.meals?.length || 0 ),
    0,
  ),
);

const weeks = computed( () => {
  const days = detail.value?.days || [];
  const grouped: Array<{
    weekNumber: number;
    startDay: number;
    endDay: number;
    sourceMenuName: string | null;
    days: any[];
  }> = [];
  let currentWeek: typeof grouped[0] | null = null;
  for (const day of days) {
    const weekNum = Math.ceil(day.day_number / 7);
    if (!currentWeek || currentWeek.weekNumber !== weekNum) {
      currentWeek = {
        weekNumber: weekNum,
        startDay: (weekNum - 1) * 7 + 1,
        endDay: Math.min(weekNum * 7, days.length),
        sourceMenuName: day.source_weekly_menu_name || null,
        days: [],
      };
      grouped.push(currentWeek);
    }
    currentWeek.days.push(day);
  }
  return grouped;
});

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
    selectedWeekNumber.value = 1;

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
  if ( abs <= 30 ) return "";
  if ( abs <= 90 ) return "";
  return "";
};

onMounted( loadDetail );
</script>
