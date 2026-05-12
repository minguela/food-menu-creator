<template>
  <div class="min-h-screen bg-transparent">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 8a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </div>
          <div>
            <h1 class="ui-title text-3xl font-bold">
              Lista de la Compra
            </h1>
            <p class="ui-subtle text-sm mt-1">Cantidades normalizadas a gramos</p>
          </div>
        </div>
        <button @click=" loadShoppingList " :disabled=" loading "
          class="group bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-2.5 rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 font-medium shadow-lg shadow-amber-200 hover:shadow-xl transition-all flex items-center gap-2">
          <svg class="w-4 h-4 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor"
            viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.582 0A13.93 13.93 0 0120 10c0 3.866-1.598 7.5-4.236 9.94a13.13 13.13 0 01-3.529 2.168A8.994 8.994 0 004 20c1.885 0 3.615.467 5.082 1.257M4 14h5.418a13.93 13.93 0 002.582 2.246c.927.475 1.986.76 3.04.853a8.997 8.997 0 016.336-3.038A8.978 8.978 0 0120 10c0-2.123-.74-4.09-1.96-5.618M4 14h5.418" />
          </svg>
          Actualizar
        </button>
      </div>

      <!-- Generate from menu section -->
      <section class="ui-surface p-6 mb-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-[var(--color-warning-muted)] flex items-center justify-center">
            <svg class="w-5 h-5 ui-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <div>
             <h2 class="ui-title text-lg font-bold">Generar desde menú rotativo</h2>
             <p class="ui-subtle text-xs">Selecciona un menú para generar la lista</p>
          </div>
        </div>

        <div class="flex flex-wrap gap-4 items-end">
          <label class="flex-1 min-w-[280px]">
            <span class="ui-muted block text-sm font-semibold mb-2">Menú rotativo</span>
            <select v-model=" selectedRotatingMenuId "
              class="ui-select w-full rounded-xl px-4 py-2.5">
              <option value="">Selecciona un menú...</option>
              <option v-for=" menu in rotatingMenus " :key=" menu.id " :value=" menu.id ">
                {{ menu.name }} ({{ menu.duration_days }} días)
              </option>
            </select>
          </label>
          <button
            class="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 font-medium shadow-lg shadow-amber-200 hover:shadow-xl transition-all active:scale-95"
            :disabled=" !selectedRotatingMenuId || loading " @click=" buildFromRotatingMenu ">
            <span class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Generar lista
            </span>
          </button>
        </div>
      </section>

      <div v-if=" loading " class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p class="ui-subtle mt-4">Cargando lista...</p>
      </div>

      <div v-else-if=" items.length === 0 " class="ui-surface text-center py-12 rounded-lg border">
        <p class="ui-subtle mb-4">No hay lista de la compra generada</p>
        <NuxtLink href="/generar" class="text-indigo-600 hover:underline">Generar un menú primero</NuxtLink>
      </div>

      <div v-else class="space-y-6">
        <section class="grid gap-4 md:grid-cols-4">
          <div class="ui-surface rounded-lg p-4">
            <p class="ui-subtle text-sm">Total estimado</p>
            <p class="ui-title text-2xl font-bold">
              {{ totalPrice.toFixed( 2 ) }}€
            </p>
          </div>
          <div class="ui-surface rounded-lg p-4">
            <p class="ui-subtle text-sm">Artículos</p>
            <p class="ui-title text-2xl font-bold">{{ items.length }}</p>
          </div>
          <div class="ui-surface rounded-lg p-4">
            <p class="ui-subtle text-sm">Ambiguos</p>
            <p class="text-2xl font-bold" :class=" ambiguousCount ? 'text-amber-700' : 'ui-title' ">
              {{ ambiguousCount }}
            </p>
          </div>
          <div class="ui-surface rounded-lg p-4">
            <p class="ui-subtle text-sm">Estado móvil</p>
            <p class="ui-title text-lg font-semibold">
              {{ sendStatusLabel }}
            </p>
          </div>
        </section>

        <section class="ui-surface rounded-lg p-4">
          <h2 class="ui-title font-semibold mb-3">Añadir artículo propio</h2>
          <form class="grid gap-2 md:grid-cols-[1fr_130px_auto]" @submit.prevent=" addExtraItem ">
            <input v-model.trim=" extraName " class="ui-input rounded-lg px-3 py-2" placeholder="Ej. papel higiénico"
              required />
            <input v-model.number=" extraGrams " class="ui-input rounded-lg px-3 py-2" type="number" min="1" step="1"
              placeholder="500 g" required />
            <button class="ui-btn-primary px-4 py-2 rounded-lg">
              Añadir
            </button>
          </form>
        </section>

        <section class="ui-surface rounded-lg p-4">
          <div class="flex flex-wrap items-end gap-3">
            <label class="flex-1 min-w-[220px]">
              <span class="ui-muted block text-sm font-medium mb-1">Número de teléfono</span>
              <input v-model.trim=" phoneNumber " class="ui-input w-full rounded-lg px-3 py-2"
                placeholder="+34600111222" />
            </label>
            <label>
              <span class="ui-muted block text-sm font-medium mb-1">Canal</span>
              <select v-model=" mobileChannel " class="ui-select rounded-lg px-3 py-2">
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </label>
            <button @click=" sendToMobile " :disabled=" sending || !phoneNumber "
              class="ui-btn-primary px-4 py-2 rounded-lg disabled:opacity-50">
              {{ sending ? "Enviando..." : "Enviar al móvil" }}
            </button>
          </div>
          <p v-if=" sendMessage " class="text-sm mt-3" :class=" sendError ? 'text-red-600' : 'text-emerald-700' ">
            {{ sendMessage }}
          </p>
        </section>

        <section v-for=" ( categoryItems, category ) in itemsByCategory " :key=" category "
          class="ui-surface rounded-lg overflow-hidden">
          <div class="bg-[var(--color-surface-3)] px-4 py-3 border-b ui-divider">
            <h2 class="ui-title font-semibold">{{ category }}</h2>
          </div>
          <div class="divide-y">
            <div v-for=" item in categoryItems " :key=" item.id "
              class="grid gap-3 p-4 hover:bg-[var(--color-surface-3)] transition-colors md:grid-cols-[1fr_170px_110px]">
              <div class="flex items-start gap-3">
                <input type="checkbox" :checked=" item.purchased " @change="togglePurchased( item )"
                  class="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 mt-1" />
                 <div :class=" { 'line-through ui-subtle': item.purchased } ">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="ui-title font-medium">
                      {{ item.item_name || item.ingredients?.name || "Artículo" }}
                    </p>
                    <span v-if=" item.conversion_status === 'ambiguous' "
                      class="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Revisar conversión
                    </span>
                    <span v-else-if=" item.conversion_status === 'manual' "
                      class="text-xs bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                      Manual
                    </span>
                  </div>
                  <p class="ui-subtle text-sm">
                    {{ item.conversion_note || originalQuantity( item ) }}
                  </p>
                </div>
              </div>
              <label>
                <span class="sr-only">Cantidad en gramos</span>
                <input :value=" Math.round(
                  Number( item.quantity_grams || item.quantity_needed || 0 ),
                )
                   " type="number" min="1" step="1" class="ui-input w-full rounded-lg px-3 py-2 text-right"
                  @change="updateGrams( item, $event )" />
              </label>
              <div class="text-right">
                <p class="ui-title font-medium">
                  {{ item.estimated_price?.toFixed( 2 ) || "0.00" }}€
                </p>
                <p class="ui-subtle text-sm">
                  {{
                    Math.round(
                      Number( item.quantity_grams || item.quantity_needed || 0 ),
                    )
                  }}
                  g
                </p>
              </div>
            </div>
          </div>
        </section>

        <div class="flex flex-wrap justify-end gap-2 pt-4">
          <button @click=" markAllAsPurchased " class="ui-btn-muted px-4 py-2 rounded-lg">
            Marcar todo como comprado
          </button>
          <button @click=" exportAsText " :disabled=" exportLoading "
            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50">
            {{ exportLoading ? "Exportando..." : "Exportar texto" }}
          </button>
          <button @click=" exportAsCsv " :disabled=" exportLoading "
            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50">
            {{ exportLoading ? "Exportando..." : "Exportar CSV" }}
          </button>
          <button @click=" downloadCsv " class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            Descargar CSV
          </button>
          <button @click=" printList " class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            PDF / Imprimir
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  buildShoppingCsv,
  convertToGrams,
} from "~/utils/shopping-conversions.js";
import { logError } from "~/utils/log-error";
import type { ShoppingListItem } from "~/types";
import type { RotatingMenu } from "~/types";

const supabase = useSupabase();
const { loadCurrentUser, user } = useCurrentUser();
const appToast = useAppToast();

const items = ref<ShoppingListItem[]>( [] );
const loading = ref( true );
const sending = ref( false );
const sendMessage = ref( "" );
const sendError = ref( false );
const extraName = ref( "" );
const extraGrams = ref<number | null>( null );
const phoneNumber = ref( "" );
const mobileChannel = ref<"sms" | "whatsapp">( "sms" );
const rotatingMenus = ref<RotatingMenu[]>( [] );
const selectedRotatingMenuId = ref( "" );
const exportLoading = ref( false );

const itemsByCategory = computed( () => {
  return items.value.reduce(
    ( acc, item ) => {
      const category = item.is_extra
        ? "Añadidos por ti"
        : item.ingredients?.carrefour_category || "Otros";
      if ( !acc[ category ] ) acc[ category ] = [];
      acc[ category ].push( item );
      return acc;
    },
    {} as Record<string, ShoppingListItem[]>,
  );
} );

const totalPrice = computed( () =>
  items.value.reduce( ( sum, item ) => sum + ( item.estimated_price || 0 ), 0 ),
);
const ambiguousCount = computed(
  () =>
    items.value.filter( ( item ) => item.conversion_status === "ambiguous" ).length,
);
const sendStatusLabel = computed( () => {
  const status =
    items.value.find(
      ( item ) => item.send_status && item.send_status !== "pending",
    )?.send_status || "pending";
  if ( status === "delivered" ) return "Entregado";
  if ( status === "sent" ) return "Enviado";
  if ( status === "error" ) return "Error";
  return "Pendiente";
} );

const loadShoppingList = async () => {
  loading.value = true;
  const currentUser = await loadCurrentUser();

  if ( !currentUser ) {
    items.value = [];
    loading.value = false;
    return;
  }

  phoneNumber.value = currentUser.phone_number || "";
  mobileChannel.value = currentUser.mobile_channel || "sms";

  const { data, error } = await supabase
    .from( "shopping_lists" )
    .select( "*, ingredients(name, carrefour_category, unit_type)" )
    .eq( "user_id", currentUser.id )
    .order( "created_at", { ascending: false } )
    .limit( 120 );

  if ( error ) {
    console.error( "Error cargando lista:", error );
    items.value = [];
  } else {
    items.value = await ensureGramFields( ( data || [] ) as ShoppingListItem[] );
  }

  loading.value = false;
};

const loadRotatingMenus = async () => {
  const currentUser = await loadCurrentUser();
  if ( !currentUser ) {
    rotatingMenus.value = [];
    return;
  }

  const { data } = await supabase
    .from( "rotating_menus" )
    .select(
      "id, name, duration_days, user_id, created_at, updated_at, profile_id, source_weekly_menu_ids, persons_count, target_kcal, target_protein_g, target_carbs_g, target_fat_g",
    )
    .eq( "user_id", currentUser.id )
    .order( "created_at", { ascending: false } );

  rotatingMenus.value = ( data || [] ) as RotatingMenu[];
};

const buildFromRotatingMenu = async () => {
  const currentUser = await loadCurrentUser();
  if ( !currentUser || !selectedRotatingMenuId.value ) return;
  loading.value = true;
  try {
    await $fetch( "/api/shopping-from-rotating", {
      method: "POST",
      body: {
        userId: currentUser.id,
        rotatingMenuId: selectedRotatingMenuId.value,
      },
    } );
    await loadShoppingList();
  } catch ( err ) {
    await logError( "web", err, { context: "shopping.buildFromRotatingMenu" } );
    appToast.fromError( "Error generando lista", err );
  } finally {
    loading.value = false;
  }
};

const ensureGramFields = async ( list: ShoppingListItem[] ) => {
  const patched: ShoppingListItem[] = [];

  for ( const item of list ) {
    if ( item.quantity_grams && item.item_name ) {
      patched.push( item );
      continue;
    }

    const conversion = convertToGrams( {
      name: item.item_name || item.ingredients?.name || "",
      quantity: item.original_quantity || item.quantity_needed,
      unitType: item.original_unit_type || item.ingredients?.unit_type || "g",
    } );

    const payload = {
      item_name: item.item_name || item.ingredients?.name || "Artículo",
      quantity_grams: conversion.grams,
      original_quantity: item.original_quantity || item.quantity_needed,
      original_unit_type:
        item.original_unit_type || item.ingredients?.unit_type || "g",
      conversion_status: conversion.status,
      conversion_note: conversion.note,
    };

    await supabase.from( "shopping_lists" ).update( payload ).eq( "id", item.id );
    patched.push( { ...item, ...payload } as ShoppingListItem );
  }

  return patched;
};

const togglePurchased = async ( item: ShoppingListItem ) => {
  const { error } = await supabase
    .from( "shopping_lists" )
    .update( { purchased: !item.purchased } )
    .eq( "id", item.id );

  if ( error ) return console.error( "Error actualizando:", error );
  item.purchased = !item.purchased;
};

const updateGrams = async ( item: ShoppingListItem, event: Event ) => {
  const target = event.target as HTMLInputElement;
  const grams = Math.max( 1, Number( target.value ) || 1 );
  const { error } = await supabase
    .from( "shopping_lists" )
    .update( {
      quantity_grams: grams,
      quantity_needed: grams,
      conversion_status: "manual",
      conversion_note: "Cantidad editada manualmente.",
    } )
    .eq( "id", item.id );

  if ( error ) {
    appToast.error( "Error guardando cantidad: " + error.message );
    return;
  }

  item.quantity_grams = grams;
  item.quantity_needed = grams;
  item.conversion_status = "manual";
  item.conversion_note = "Cantidad editada manualmente.";
};

const addExtraItem = async () => {
  const currentUser = await loadCurrentUser();
  if ( !currentUser || !extraName.value || !extraGrams.value ) return;

  const { error } = await supabase.from( "shopping_lists" ).insert( {
    user_id: currentUser.id,
    week_start: new Date().toISOString().split( "T" )[ 0 ],
    item_name: extraName.value,
    quantity_needed: extraGrams.value,
    quantity_grams: extraGrams.value,
    original_quantity: extraGrams.value,
    original_unit_type: "g",
    conversion_status: "manual",
    conversion_note: "Artículo añadido por el usuario.",
    is_extra: true,
    purchased: false,
    estimated_price: 0,
  } );

  if ( error ) {
    appToast.error( "Error añadiendo artículo: " + error.message );
    return;
  }

  extraName.value = "";
  extraGrams.value = null;
  await loadShoppingList();
  appToast.success( "Artículo añadido correctamente." );
};

const markAllAsPurchased = async () => {
  const ids = items.value
    .filter( ( item ) => !item.purchased )
    .map( ( item ) => item.id );
  if ( ids.length === 0 ) return;

  const { error } = await supabase
    .from( "shopping_lists" )
    .update( { purchased: true } )
    .in( "id", ids );
  if ( error ) return console.error( "Error marcando todos:", error );
  items.value.forEach( ( item ) => {
    item.purchased = true;
  } );
};

const sendToMobile = async () => {
  const currentUser = user.value || ( await loadCurrentUser() );
  if ( !currentUser ) return;

  sending.value = true;
  sendMessage.value = "";
  sendError.value = false;

  try {
    const result = await $fetch<{ status: string; providerStatus: string }>(
      "/api/send-shopping-list",
      {
        method: "POST",
        body: {
          userId: currentUser.id,
          phoneNumber: phoneNumber.value,
          channel: mobileChannel.value,
        },
      },
    );
    sendMessage.value =
      result.status === "delivered"
        ? "Lista entregada en el móvil."
        : `Lista enviada. Estado proveedor: ${ result.providerStatus }.`;
    await loadShoppingList();
  } catch ( error: any ) {
    sendError.value = true;
    sendMessage.value = error?.statusMessage || "No se pudo enviar la lista.";
    await logError( "web", error, { context: "shopping.sendToMobile" } );
    await loadShoppingList();
  } finally {
    sending.value = false;
  }
};

const originalQuantity = ( item: ShoppingListItem ) => {
  const quantity = item.original_quantity || item.quantity_needed;
  const unit = item.original_unit_type || item.ingredients?.unit_type || "g";
  return `Original: ${ quantity } ${ unit }`;
};

const downloadCsv = () => {
  const blob = new Blob( [ buildShoppingCsv( items.value ) ], {
    type: "text/csv;charset=utf-8",
  } );
  const url = URL.createObjectURL( blob );
  const link = document.createElement( "a" );
  link.href = url;
  link.download = "lista-compra.csv";
  link.click();
  URL.revokeObjectURL( url );
};

const exportAsText = async () => {
  const currentUser = await loadCurrentUser();
  if ( !currentUser ) return;

  exportLoading.value = true;
  try {
    const response = await fetch(
      `${ useRuntimeConfig().public.supabaseUrl }/functions/v1/export-shopping-list?user_id=${ currentUser.id }&format=text`
    );
    const text = await response.text();

    const blob = new Blob( [ text ], { type: "text/plain;charset=utf-8" } );
    const url = URL.createObjectURL( blob );
    const link = document.createElement( "a" );
    link.href = url;
    link.download = "lista-compra.txt";
    link.click();
    URL.revokeObjectURL( url );
  } catch ( err ) {
    console.error( "Export error:", err );
    appToast.fromError( "Error al exportar", err );
  } finally {
    exportLoading.value = false;
  }
};

const exportAsCsv = async () => {
  const currentUser = await loadCurrentUser();
  if ( !currentUser ) return;

  exportLoading.value = true;
  try {
    const response = await fetch(
      `${ useRuntimeConfig().public.supabaseUrl }/functions/v1/export-shopping-list?user_id=${ currentUser.id }&format=csv`
    );
    const text = await response.text();

    const blob = new Blob( [ text ], { type: "text/csv;charset=utf-8" } );
    const url = URL.createObjectURL( blob );
    const link = document.createElement( "a" );
    link.href = url;
    link.download = "lista-compra.csv";
    link.click();
    URL.revokeObjectURL( url );
  } catch ( err ) {
    console.error( "Export error:", err );
    appToast.fromError( "Error al exportar", err );
  } finally {
    exportLoading.value = false;
  }
};

const printList = () => window.print();

onMounted( async () => {
  await loadShoppingList();
  await loadRotatingMenus();
} );
</script>

<style scoped>
@media print {

  nav,
  button,
  form,
  select,
  input[type="checkbox"] {
    display: none !important;
  }

  .ui-surface {
    break-inside: avoid;
  }
}
</style>
