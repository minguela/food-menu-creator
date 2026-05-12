<template>
  <div class="min-h-screen bg-gradient-to-br from-deep-space via-ghost-white/5 to-deep-space">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div class="flex items-center gap-4">
          <div
            class="w-14 h-14 rounded-2xl bg-gradient-to-br from-iridescent-glow to-spectrum-flare flex items-center justify-center shadow-lg shadow-iridescent-glow/20 backdrop-blur-sm border border-ghost-white/10">
            <span class="text-2xl">🛒</span>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-ghost-white tracking-tight">
              Lista de la Compra
            </h1>
            <p class="text-iron-slate text-sm mt-1">Cantidades normalizadas a gramos</p>
          </div>
        </div>
        <button @click="loadShoppingList" :disabled="loading"
          class="group flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 bg-ghost-white/10 text-ghost-white border border-ghost-white/20 hover:bg-ghost-white/20 hover:border-iridescent-glow/50 hover:shadow-lg hover:shadow-iridescent-glow/10 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none">
          <svg class="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor"
            viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.582 0A13.93 13.93 0 0120 10c0 3.866-1.598 7.5-4.236 9.94a13.13 13.13 0 01-3.529 2.168A8.994 8.994 0 004 20c1.885 0 3.615.467 5.082 1.257M4 14h5.418a13.93 13.93 0 002.582 2.246c.927.475 1.986.76 3.04.853a8.997 8.997 0 016.336-3.038A8.978 8.978 0 0120 10c0-2.123-.74-4.09-1.96-5.618M4 14h5.418" />
          </svg>
          Actualizar
        </button>
      </div>

      <!-- Generate from menu section -->
      <section class="backdrop-blur-sm bg-ghost-white/5 rounded-2xl border border-ghost-white/10 p-6 mb-6 transition-all duration-200 hover:border-iridescent-glow/30 hover:shadow-lg hover:shadow-iridescent-glow/5">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-iridescent-glow/20 flex items-center justify-center">
            <span class="text-lg">📋</span>
          </div>
          <div>
            <h2 class="text-lg font-bold text-ghost-white">Generar desde menú rotativo</h2>
            <p class="text-xs text-iron-slate">Selecciona un menú para generar la lista</p>
          </div>
        </div>

        <div class="flex flex-wrap gap-4 items-end">
          <label class="flex-1 min-w-[280px]">
            <span class="block text-sm font-semibold text-ghost-white/90 mb-2">Menú rotativo</span>
            <select v-model="selectedRotatingMenuId"
              class="w-full rounded-xl border border-ghost-white/20 bg-ghost-white/5 px-4 py-2.5 text-ghost-white focus:ring-2 focus:ring-iridescent-glow/50 focus:border-iridescent-glow/50 transition-all appearance-none cursor-pointer hover:bg-ghost-white/10">
              <option value="" class="bg-deep-space text-ghost-white">Selecciona un menú...</option>
              <option v-for="menu in rotatingMenus" :key="menu.id" :value="menu.id" class="bg-deep-space text-ghost-white">
                {{ menu.name }} ({{ menu.duration_days }} días)
              </option>
            </select>
          </label>
          <button
            class="px-6 py-2.5 bg-gradient-to-r from-iridescent-glow to-spectrum-flare text-deep-space rounded-xl font-medium shadow-lg shadow-iridescent-glow/20 transition-all duration-200 hover:shadow-xl hover:shadow-iridescent-glow/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            :disabled="!selectedRotatingMenuId || loading" @click="buildFromRotatingMenu">
            <span class="flex items-center gap-2">
              <span class="text-sm">📦</span>
              Generar lista
            </span>
          </button>
        </div>
      </section>

      <!-- Loading state -->
      <div v-if="loading" class="text-center py-16">
        <div class="animate-spin rounded-full h-12 w-12 border-2 border-iridescent-glow/30 border-t-iridescent-glow mx-auto"></div>
        <p class="mt-4 text-iron-slate">Cargando lista...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="items.length === 0" class="text-center py-16 backdrop-blur-sm bg-ghost-white/5 rounded-2xl border border-ghost-white/10">
        <span class="text-5xl mb-4 block">🛍️</span>
        <p class="text-ghost-white/80 mb-4 text-lg">No hay lista de la compra generada</p>
        <NuxtLink href="/generar" class="text-iridescent-glow hover:text-spectrum-flare transition-colors underline underline-offset-4">Generar un menú primero</NuxtLink>
      </div>

      <!-- Shopping list content -->
      <div v-else class="space-y-6">
        <!-- Stats cards -->
        <section class="grid gap-4 md:grid-cols-4">
          <div class="backdrop-blur-sm bg-ghost-white/5 rounded-xl border border-ghost-white/10 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-iridescent-glow/10 hover:border-iridescent-glow/30">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-emerald-green/20 flex items-center justify-center">
                <span class="text-lg">💰</span>
              </div>
              <div>
                <p class="text-xs text-iron-slate uppercase tracking-wider">Total estimado</p>
                <p class="text-2xl font-bold text-ghost-white">{{ totalPrice.toFixed(2) }}€</p>
              </div>
            </div>
          </div>
          <div class="backdrop-blur-sm bg-ghost-white/5 rounded-xl border border-ghost-white/10 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-iridescent-glow/10 hover:border-iridescent-glow/30">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-iridescent-glow/20 flex items-center justify-center">
                <span class="text-lg">📦</span>
              </div>
              <div>
                <p class="text-xs text-iron-slate uppercase tracking-wider">Artículos</p>
                <p class="text-2xl font-bold text-ghost-white">{{ items.length }}</p>
              </div>
            </div>
          </div>
          <div class="backdrop-blur-sm bg-ghost-white/5 rounded-xl border border-ghost-white/10 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-iridescent-glow/10 hover:border-iridescent-glow/30">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-goldenrod/20 flex items-center justify-center">
                <span class="text-lg">⚠️</span>
              </div>
              <div>
                <p class="text-xs text-iron-slate uppercase tracking-wider">Ambiguos</p>
                <p class="text-2xl font-bold" :class="ambiguousCount ? 'text-goldenrod' : 'text-ghost-white'">
                  {{ ambiguousCount }}
                </p>
              </div>
            </div>
          </div>
          <div class="backdrop-blur-sm bg-ghost-white/5 rounded-xl border border-ghost-white/10 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-iridescent-glow/10 hover:border-iridescent-glow/30">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg" :class="sendStatusColor">
                <span class="text-lg">{{ sendStatusIcon }}</span>
              </div>
              <div>
                <p class="text-xs text-iron-slate uppercase tracking-wider">Estado móvil</p>
                <p class="text-lg font-semibold text-ghost-white">{{ sendStatusLabel }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Add extra item -->
        <section class="backdrop-blur-sm bg-ghost-white/5 rounded-xl border border-ghost-white/10 p-4">
          <h2 class="font-semibold text-ghost-white mb-3 flex items-center gap-2">
            <span>➕</span> Añadir artículo propio
          </h2>
          <form class="grid gap-2 md:grid-cols-[1fr_130px_auto]" @submit.prevent="addExtraItem">
            <input v-model.trim="extraName" class="border border-ghost-white/20 rounded-lg px-3 py-2 bg-ghost-white/5 text-ghost-white placeholder-iron-slate focus:ring-2 focus:ring-iridescent-glow/50 focus:border-iridescent-glow/50 transition-all" placeholder="Ej. papel higiénico"
              required />
            <input v-model.number="extraGrams" class="border border-ghost-white/20 rounded-lg px-3 py-2 bg-ghost-white/5 text-ghost-white placeholder-iron-slate focus:ring-2 focus:ring-iridescent-glow/50 focus:border-iridescent-glow/50 transition-all" type="number" min="1" step="1"
              placeholder="500 g" required />
            <button class="bg-iridescent-glow/20 text-ghost-white border border-iridescent-glow/30 px-4 py-2 rounded-lg hover:bg-iridescent-glow/30 hover:border-iridescent-glow/50 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0">
              Añadir
            </button>
          </form>
        </section>

        <!-- Share section - FREE ROUTE -->
        <section class="backdrop-blur-sm bg-ghost-white/5 rounded-xl border border-ghost-white/10 p-4">
          <h2 class="font-semibold text-ghost-white mb-3 flex items-center gap-2">
            <span>📤</span> Compartir lista
          </h2>
          <div class="flex flex-wrap gap-3">
            <!-- WhatsApp button -->
            <button @click="shareWhatsApp" :disabled="!canShare"
              class="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/30 hover:border-[#25D366]/50 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0">
              <span class="text-lg">💬</span>
              WhatsApp
            </button>
            <!-- Copy to clipboard -->
            <button @click="copyToClipboard" :disabled="!canShare"
              class="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 bg-ghost-white/10 text-ghost-white border border-ghost-white/20 hover:bg-ghost-white/20 hover:border-ghost-white/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0">
              <span class="text-lg">{{ copied ? '✅' : '📋' }}</span>
              {{ copied ? 'Copiado!' : 'Copiar' }}
            </button>
            <!-- Native share (mobile only) -->
            <button v-if="canNativeShare" @click="nativeShare" :disabled="!canShare"
              class="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 bg-iridescent-glow/20 text-iridescent-glow border border-iridescent-glow/30 hover:bg-iridescent-glow/30 hover:border-iridescent-glow/50 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0">
              <span class="text-lg">📱</span>
              Compartir
            </button>
            <!-- SMS native (mobile only) -->
            <button @click="shareSMS" :disabled="!canShare || !phoneNumber"
              class="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 bg-ghost-white/10 text-ghost-white border border-ghost-white/20 hover:bg-ghost-white/20 hover:border-ghost-white/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0">
              <span class="text-lg">✉️</span>
              SMS
            </button>
          </div>
          <p v-if="shareMessage" class="text-sm mt-3" :class="shareError ? 'text-vivid-crimson' : 'text-emerald-green'">
            {{ shareMessage }}
          </p>
        </section>

        <!-- Categories -->
        <section v-for="(categoryItems, category) in itemsByCategory" :key="category"
          class="backdrop-blur-sm bg-ghost-white/5 rounded-xl border border-ghost-white/10 overflow-hidden transition-all duration-200 hover:border-ghost-white/20">
          <div class="bg-ghost-white/5 px-4 py-3 border-b border-ghost-white/10 flex items-center justify-between">
            <h2 class="font-semibold text-ghost-white flex items-center gap-2">
              <span>{{ categoryEmoji(category) }}</span>
              {{ category }}
            </h2>
            <span class="text-xs text-iron-slate bg-ghost-white/10 px-2 py-1 rounded-full">{{ categoryItems.length }} items</span>
          </div>
          <div class="divide-y divide-ghost-white/5">
            <div v-for="item in categoryItems" :key="item.id"
              class="grid gap-3 p-4 transition-all duration-200 hover:bg-ghost-white/5 md:grid-cols-[1fr_170px_110px]"
              :class="{ 'opacity-60': item.purchased }">
              <div class="flex items-start gap-3">
                <label class="relative flex items-center cursor-pointer mt-1">
                  <input type="checkbox" :checked="item.purchased" @change="togglePurchased(item)"
                    class="sr-only peer" />
                  <div class="w-5 h-5 rounded border-2 border-ghost-white/30 peer-checked:border-emerald-green peer-checked:bg-emerald-green transition-all duration-200 flex items-center justify-center hover:border-iridescent-glow/50">
                    <svg v-if="item.purchased" class="w-3 h-3 text-deep-space" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </label>
                <div :class="{ 'line-through text-iron-slate': item.purchased }">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-medium text-ghost-white">
                      {{ item.item_name || item.ingredients?.name || "Artículo" }}
                    </p>
                    <span v-if="item.conversion_status === 'ambiguous'"
                      class="text-xs bg-goldenrod/20 text-goldenrod px-2 py-0.5 rounded-full">
                      Revisar conversión
                    </span>
                    <span v-else-if="item.conversion_status === 'manual'"
                      class="text-xs bg-iridescent-glow/20 text-iridescent-glow px-2 py-0.5 rounded-full">
                      Manual
                    </span>
                  </div>
                  <p class="text-sm text-iron-slate">
                    {{ item.conversion_note || originalQuantity(item) }}
                  </p>
                </div>
              </div>
              <label>
                <span class="sr-only">Cantidad en gramos</span>
                <input :value="Math.round(Number(item.quantity_grams || item.quantity_needed || 0))" type="number" min="1" step="1" class="w-full border border-ghost-white/20 rounded-lg px-3 py-2 text-right bg-ghost-white/5 text-ghost-white focus:ring-2 focus:ring-iridescent-glow/50 focus:border-iridescent-glow/50 transition-all"
                  @change="updateGrams(item, $event)" />
              </label>
              <div class="text-right">
                <p class="font-medium text-ghost-white">
                  {{ item.estimated_price?.toFixed(2) || "0.00" }}€
                </p>
                <p class="text-sm text-iron-slate">
                  {{ Math.round(Number(item.quantity_grams || item.quantity_needed || 0)) }} g
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Export buttons -->
        <div class="flex flex-wrap justify-end gap-2 pt-4">
          <button @click="markAllAsPurchased" class="px-4 py-2 text-ghost-white/80 hover:text-ghost-white hover:bg-ghost-white/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0">
            Marcar todo como comprado
          </button>
          <button @click="exportAsText" :disabled="exportLoading"
            class="px-4 py-2 bg-ghost-white/5 text-ghost-white border border-ghost-white/20 rounded-lg hover:bg-ghost-white/10 hover:border-ghost-white/40 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0">
            {{ exportLoading ? "Exportando..." : "📄 TXT" }}
          </button>
          <button @click="exportAsCsv" :disabled="exportLoading"
            class="px-4 py-2 bg-ghost-white/5 text-ghost-white border border-ghost-white/20 rounded-lg hover:bg-ghost-white/10 hover:border-ghost-white/40 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0">
            {{ exportLoading ? "Exportando..." : "📊 CSV" }}
          </button>
          <button @click="downloadCsv"
            class="px-4 py-2 bg-ghost-white/5 text-ghost-white border border-ghost-white/20 rounded-lg hover:bg-ghost-white/10 hover:border-ghost-white/40 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0">
            ⬇️ Descargar CSV
          </button>
          <button @click="printList"
            class="px-4 py-2 bg-ghost-white/5 text-ghost-white border border-ghost-white/20 rounded-lg hover:bg-ghost-white/10 hover:border-ghost-white/40 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0">
            🖨️ PDF / Imprimir
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  buildShoppingCsv,
  buildShoppingListText,
  convertToGrams,
} from "~/utils/shopping-conversions.js";
import { logError } from "~/utils/log-error";
import type { ShoppingListItem } from "~/types";
import type { RotatingMenu } from "~/types";

const supabase = useSupabase();
const { loadCurrentUser, user } = useCurrentUser();
const appToast = useAppToast();

const items = ref<ShoppingListItem[]>([]);
const loading = ref(true);
const sending = ref(false);
const shareMessage = ref("");
const shareError = ref(false);
const extraName = ref("");
const extraGrams = ref<number | null>(null);
const phoneNumber = ref("");
const mobileChannel = ref<"sms" | "whatsapp">("sms");
const rotatingMenus = ref<RotatingMenu[]>([]);
const selectedRotatingMenuId = ref("");
const exportLoading = ref(false);
const copied = ref(false);
const canNativeShare = ref(false);

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
const sendStatusColor = computed(() => {
  const status = sendStatusLabel.value;
  if (status === "Entregado") return "bg-emerald-green/20";
  if (status === "Enviado") return "bg-iridescent-glow/20";
  if (status === "Error") return "bg-vivid-crimson/20";
  return "bg-ghost-white/10";
});
const sendStatusIcon = computed(() => {
  const status = sendStatusLabel.value;
  if (status === "Entregado") return "✅";
  if (status === "Enviado") return "📤";
  if (status === "Error") return "❌";
  return "⏳";
});
const canShare = computed(() => items.value.length > 0);

const formattedListText = computed(() => {
  const lines = ["🛒 Lista de la Compra", "─".repeat(25)];
  const byCategory = itemsByCategory.value;
  for (const [category, categoryItems] of Object.entries(byCategory)) {
    lines.push(`${categoryEmoji(category)} ${category}`);
    for (const item of categoryItems) {
      const name = item.item_name || item.ingredients?.name || "Artículo";
      const grams = Math.round(Number(item.quantity_grams || item.quantity_needed || 0));
      lines.push(`• ${name} - ${grams}g`);
    }
  }
  lines.push("─".repeat(25));
  lines.push(`💰 Total estimado: ${totalPrice.value.toFixed(2)}€`);
  return lines.join("\n");
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

const loadRotatingMenus = async () => {
  const currentUser = await loadCurrentUser();
  if (!currentUser) {
    rotatingMenus.value = [];
    return;
  }

  const { data } = await supabase
    .from("rotating_menus")
    .select(
      "id, name, duration_days, user_id, created_at, updated_at, profile_id, source_weekly_menu_ids, persons_count, target_kcal, target_protein_g, target_carbs_g, target_fat_g",
    )
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  rotatingMenus.value = (data || []) as RotatingMenu[];
};

const buildFromRotatingMenu = async () => {
  const currentUser = await loadCurrentUser();
  if (!currentUser || !selectedRotatingMenuId.value) return;
  loading.value = true;
  try {
    await $fetch("/api/shopping-from-rotating", {
      method: "POST",
      body: {
        userId: currentUser.id,
        rotatingMenuId: selectedRotatingMenuId.value,
      },
    });
    await loadShoppingList();
  } catch (err) {
    await logError("web", err, { context: "shopping.buildFromRotatingMenu" });
    appToast.fromError("Error generando lista", err);
  } finally {
    loading.value = false;
  }
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

  if (error) {
    appToast.error("Error guardando cantidad: " + error.message);
    return;
  }

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

  if (error) {
    appToast.error("Error añadiendo artículo: " + error.message);
    return;
  }

  extraName.value = "";
  extraGrams.value = null;
  await loadShoppingList();
  appToast.success("Artículo añadido correctamente.");
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

// FREE SHARE FUNCTIONS
const shareWhatsApp = () => {
  const encoded = encodeURIComponent(formattedListText.value);
  const url = phoneNumber.value
    ? `https://wa.me/${phoneNumber.value.replace(/[^0-9]/g, "")}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(url, "_blank");
  shareMessage.value = "WhatsApp abierto";
  shareError.value = false;
};

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(formattedListText.value);
    copied.value = true;
    shareMessage.value = "Lista copiada al portapapeles ✓";
    shareError.value = false;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    shareError.value = true;
    shareMessage.value = "No se pudo copiar la lista";
  }
};

const nativeShare = async () => {
  if (!navigator.share) return;
  try {
    await navigator.share({
      title: "Lista de la Compra",
      text: formattedListText.value,
    });
    shareMessage.value = "Lista compartida";
    shareError.value = false;
  } catch (err: any) {
    if (err.name !== "AbortError") {
      shareError.value = true;
      shareMessage.value = "No se pudo compartir";
    }
  }
};

const shareSMS = () => {
  const encoded = encodeURIComponent(formattedListText.value);
  const url = `sms:${phoneNumber.value}?body=${encoded}`;
  window.location.href = url;
  shareMessage.value = "App de SMS abierta";
  shareError.value = false;
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

const exportAsText = async () => {
  const currentUser = await loadCurrentUser();
  if (!currentUser) return;

  exportLoading.value = true;
  try {
    const response = await fetch(
      `${useRuntimeConfig().public.supabaseUrl}/functions/v1/export-shopping-list?user_id=${currentUser.id}&format=text`
    );
    const text = await response.text();

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lista-compra.txt";
    link.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Export error:", err);
    appToast.fromError("Error al exportar", err);
  } finally {
    exportLoading.value = false;
  }
};

const exportAsCsv = async () => {
  const currentUser = await loadCurrentUser();
  if (!currentUser) return;

  exportLoading.value = true;
  try {
    const response = await fetch(
      `${useRuntimeConfig().public.supabaseUrl}/functions/v1/export-shopping-list?user_id=${currentUser.id}&format=csv`
    );
    const text = await response.text();

    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lista-compra.csv";
    link.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Export error:", err);
    appToast.fromError("Error al exportar", err);
  } finally {
    exportLoading.value = false;
  }
};

const printList = () => window.print();

const categoryEmoji = (category: string) => {
  const map: Record<string, string> = {
    "Verduras": "🥬",
    "Frutas": "🍎",
    "Carnes": "🥩",
    "Pescados": "🐟",
    "Lácteos": "🥛",
    "Panadería": "🍞",
    "Bebidas": "🥤",
    "Congelados": "❄️",
    "Limpieza": "🧹",
    "Añadidos por ti": "➕",
    "Otros": "📦",
  };
  return map[category] || "📦";
};

onMounted(async () => {
  canNativeShare.value = typeof navigator !== "undefined" && !!navigator.share;
  await loadShoppingList();
  await loadRotatingMenus();
});
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

  .bg-ghost-white\/5,
  .backdrop-blur-sm {
    background: white !important;
    border-color: #e5e7eb !important;
  }
}

select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}
</style>
