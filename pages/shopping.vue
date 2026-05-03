<template>
  <div>
    <div class="flex flex-wrap justify-between items-center gap-3 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Lista de la Compra</h1>
        <p class="text-sm text-gray-500">
          Cantidades normalizadas a gramos, con edición manual cuando la
          conversión es dudosa.
        </p>
      </div>
      <button
        @click="loadShoppingList"
        :disabled="loading"
        class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        Actualizar
      </button>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"
      ></div>
      <p class="mt-4 text-gray-600">Cargando lista...</p>
    </div>

    <div
      v-else-if="items.length === 0"
      class="text-center py-12 bg-white rounded-lg border"
    >
      <p class="text-gray-600 mb-4">No hay lista de la compra generada</p>
      <NuxtLink href="/generar" class="text-indigo-600 hover:underline"
        >Generar un menú primero</NuxtLink
      >
    </div>

    <div v-else class="space-y-6">
      <section class="grid gap-4 md:grid-cols-4">
        <div class="bg-white rounded-lg shadow-sm border p-4">
          <p class="text-sm text-gray-600">Total estimado</p>
          <p class="text-2xl font-bold text-gray-900">
            {{ totalPrice.toFixed(2) }}€
          </p>
        </div>
        <div class="bg-white rounded-lg shadow-sm border p-4">
          <p class="text-sm text-gray-600">Artículos</p>
          <p class="text-2xl font-bold text-gray-900">{{ items.length }}</p>
        </div>
        <div class="bg-white rounded-lg shadow-sm border p-4">
          <p class="text-sm text-gray-600">Ambiguos</p>
          <p
            class="text-2xl font-bold"
            :class="ambiguousCount ? 'text-amber-700' : 'text-gray-900'"
          >
            {{ ambiguousCount }}
          </p>
        </div>
        <div class="bg-white rounded-lg shadow-sm border p-4">
          <p class="text-sm text-gray-600">Estado móvil</p>
          <p class="text-lg font-semibold text-gray-900">
            {{ sendStatusLabel }}
          </p>
        </div>
      </section>

      <section class="bg-white rounded-lg shadow-sm border p-4">
        <h2 class="font-semibold text-gray-900 mb-3">Añadir artículo propio</h2>
        <form
          class="grid gap-2 md:grid-cols-[1fr_130px_auto]"
          @submit.prevent="addExtraItem"
        >
          <input
            v-model.trim="extraName"
            class="border rounded-lg px-3 py-2"
            placeholder="Ej. papel higiénico"
            required
          />
          <input
            v-model.number="extraGrams"
            class="border rounded-lg px-3 py-2"
            type="number"
            min="1"
            step="1"
            placeholder="500 g"
            required
          />
          <button
            class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Añadir
          </button>
        </form>
      </section>

      <section class="bg-white rounded-lg shadow-sm border p-4">
        <div class="flex flex-wrap items-end gap-3">
          <label class="flex-1 min-w-[220px]">
            <span class="block text-sm font-medium text-gray-700 mb-1"
              >Número de teléfono</span
            >
            <input
              v-model.trim="phoneNumber"
              class="w-full border rounded-lg px-3 py-2"
              placeholder="+34600111222"
            />
          </label>
          <label>
            <span class="block text-sm font-medium text-gray-700 mb-1"
              >Canal</span
            >
            <select v-model="mobileChannel" class="border rounded-lg px-3 py-2">
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </label>
          <button
            @click="sendToMobile"
            :disabled="sending || !phoneNumber"
            class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {{ sending ? "Enviando..." : "Enviar al móvil" }}
          </button>
        </div>
        <p
          v-if="sendMessage"
          class="text-sm mt-3"
          :class="sendError ? 'text-red-600' : 'text-emerald-700'"
        >
          {{ sendMessage }}
        </p>
      </section>

      <section
        v-for="(categoryItems, category) in itemsByCategory"
        :key="category"
        class="bg-white rounded-lg shadow-sm border overflow-hidden"
      >
        <div class="bg-gray-50 px-4 py-3 border-b">
          <h2 class="font-semibold text-gray-900">{{ category }}</h2>
        </div>
        <div class="divide-y">
          <div
            v-for="item in categoryItems"
            :key="item.id"
            class="grid gap-3 p-4 hover:bg-gray-50 transition-colors md:grid-cols-[1fr_170px_110px]"
          >
            <div class="flex items-start gap-3">
              <input
                type="checkbox"
                :checked="item.purchased"
                @change="togglePurchased(item)"
                class="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 mt-1"
              />
              <div :class="{ 'line-through text-gray-400': item.purchased }">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="font-medium text-gray-900">
                    {{ item.item_name || item.ingredients?.name || "Artículo" }}
                  </p>
                  <span
                    v-if="item.conversion_status === 'ambiguous'"
                    class="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full"
                  >
                    Revisar conversión
                  </span>
                  <span
                    v-else-if="item.conversion_status === 'manual'"
                    class="text-xs bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full"
                  >
                    Manual
                  </span>
                </div>
                <p class="text-sm text-gray-500">
                  {{ item.conversion_note || originalQuantity(item) }}
                </p>
              </div>
            </div>
            <label>
              <span class="sr-only">Cantidad en gramos</span>
              <input
                :value="
                  Math.round(
                    Number(item.quantity_grams || item.quantity_needed || 0),
                  )
                "
                type="number"
                min="1"
                step="1"
                class="w-full border rounded-lg px-3 py-2 text-right"
                @change="updateGrams(item, $event)"
              />
            </label>
            <div class="text-right">
              <p class="font-medium text-gray-900">
                {{ item.estimated_price?.toFixed(2) || "0.00" }}€
              </p>
              <p class="text-sm text-gray-500">
                {{
                  Math.round(
                    Number(item.quantity_grams || item.quantity_needed || 0),
                  )
                }}
                g
              </p>
            </div>
          </div>
        </div>
      </section>

      <div class="flex flex-wrap justify-end gap-2 pt-4">
        <button
          @click="markAllAsPurchased"
          class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          Marcar todo como comprado
        </button>
        <button
          @click="downloadCsv"
          class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Descargar CSV
        </button>
        <button
          @click="printList"
          class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          PDF / Imprimir
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  buildShoppingCsv,
  convertToGrams,
} from "~/utils/shopping-conversions.js";
import type { ShoppingListItem } from "~/types";

const supabase = useSupabase();
const { loadCurrentUser, user } = useCurrentUser();

const items = ref<ShoppingListItem[]>([]);
const loading = ref(true);
const sending = ref(false);
const sendMessage = ref("");
const sendError = ref(false);
const extraName = ref("");
const extraGrams = ref<number | null>(null);
const phoneNumber = ref("");
const mobileChannel = ref<"sms" | "whatsapp">("sms");

const itemsByCategory = computed(() => {
  return items.value.reduce(
    (acc, item) => {
      const category = item.is_extra
        ? "Añadidos por ti"
        : item.ingredients?.carrefour_category || "Otros";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, ShoppingListItem[]>,
  );
});

const totalPrice = computed(() =>
  items.value.reduce((sum, item) => sum + (item.estimated_price || 0), 0),
);
const ambiguousCount = computed(
  () =>
    items.value.filter((item) => item.conversion_status === "ambiguous").length,
);
const sendStatusLabel = computed(() => {
  const status =
    items.value.find(
      (item) => item.send_status && item.send_status !== "pending",
    )?.send_status || "pending";
  if (status === "delivered") return "Entregado";
  if (status === "sent") return "Enviado";
  if (status === "error") return "Error";
  return "Pendiente";
});

const loadShoppingList = async () => {
  loading.value = true;
  const currentUser = await loadCurrentUser();

  if (!currentUser) {
    items.value = [];
    loading.value = false;
    return;
  }

  phoneNumber.value = currentUser.phone_number || "";
  mobileChannel.value = currentUser.mobile_channel || "sms";

  const { data, error } = await supabase
    .from("shopping_lists")
    .select("*, ingredients(name, carrefour_category, unit_type)")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false })
    .limit(120);

  if (error) {
    console.error("Error cargando lista:", error);
    items.value = [];
  } else {
    items.value = await ensureGramFields((data || []) as ShoppingListItem[]);
  }

  loading.value = false;
};

const ensureGramFields = async (list: ShoppingListItem[]) => {
  const patched: ShoppingListItem[] = [];

  for (const item of list) {
    if (item.quantity_grams && item.item_name) {
      patched.push(item);
      continue;
    }

    const conversion = convertToGrams({
      name: item.item_name || item.ingredients?.name || "",
      quantity: item.original_quantity || item.quantity_needed,
      unitType: item.original_unit_type || item.ingredients?.unit_type || "g",
    });

    const payload = {
      item_name: item.item_name || item.ingredients?.name || "Artículo",
      quantity_grams: conversion.grams,
      original_quantity: item.original_quantity || item.quantity_needed,
      original_unit_type:
        item.original_unit_type || item.ingredients?.unit_type || "g",
      conversion_status: conversion.status,
      conversion_note: conversion.note,
    };

    await supabase.from("shopping_lists").update(payload).eq("id", item.id);
    patched.push({ ...item, ...payload } as ShoppingListItem);
  }

  return patched;
};

const togglePurchased = async (item: ShoppingListItem) => {
  const { error } = await supabase
    .from("shopping_lists")
    .update({ purchased: !item.purchased })
    .eq("id", item.id);

  if (error) return console.error("Error actualizando:", error);
  item.purchased = !item.purchased;
};

const updateGrams = async (item: ShoppingListItem, event: Event) => {
  const target = event.target as HTMLInputElement;
  const grams = Math.max(1, Number(target.value) || 1);
  const { error } = await supabase
    .from("shopping_lists")
    .update({
      quantity_grams: grams,
      quantity_needed: grams,
      conversion_status: "manual",
      conversion_note: "Cantidad editada manualmente.",
    })
    .eq("id", item.id);

  if (error) return alert("Error guardando cantidad: " + error.message);

  item.quantity_grams = grams;
  item.quantity_needed = grams;
  item.conversion_status = "manual";
  item.conversion_note = "Cantidad editada manualmente.";
};

const addExtraItem = async () => {
  const currentUser = await loadCurrentUser();
  if (!currentUser || !extraName.value || !extraGrams.value) return;

  const { error } = await supabase.from("shopping_lists").insert({
    user_id: currentUser.id,
    week_start: new Date().toISOString().split("T")[0],
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
  });

  if (error) return alert("Error añadiendo artículo: " + error.message);

  extraName.value = "";
  extraGrams.value = null;
  await loadShoppingList();
};

const markAllAsPurchased = async () => {
  const ids = items.value
    .filter((item) => !item.purchased)
    .map((item) => item.id);
  if (ids.length === 0) return;

  const { error } = await supabase
    .from("shopping_lists")
    .update({ purchased: true })
    .in("id", ids);
  if (error) return console.error("Error marcando todos:", error);
  items.value.forEach((item) => {
    item.purchased = true;
  });
};

const sendToMobile = async () => {
  const currentUser = user.value || (await loadCurrentUser());
  if (!currentUser) return;

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
        : `Lista enviada. Estado proveedor: ${result.providerStatus}.`;
    await loadShoppingList();
  } catch (error: any) {
    sendError.value = true;
    sendMessage.value = error?.statusMessage || "No se pudo enviar la lista.";
    await loadShoppingList();
  } finally {
    sending.value = false;
  }
};

const originalQuantity = (item: ShoppingListItem) => {
  const quantity = item.original_quantity || item.quantity_needed;
  const unit = item.original_unit_type || item.ingredients?.unit_type || "g";
  return `Original: ${quantity} ${unit}`;
};

const downloadCsv = () => {
  const blob = new Blob([buildShoppingCsv(items.value)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "lista-compra.csv";
  link.click();
  URL.revokeObjectURL(url);
};

const printList = () => window.print();

onMounted(loadShoppingList);
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
  .bg-white {
    break-inside: avoid;
  }
}
</style>
