<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Generar Menú Rotativo</h1>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Formulario -->
      <div class="bg-white rounded-lg shadow-sm border p-6 h-fit">
        <h2 class="text-lg font-semibold mb-4">Configuración</h2>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Número de días
          </label>
          <input
            v-model.number="days"
            type="number"
            min="1"
            max="90"
            class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <p class="text-xs text-gray-500 mt-1">Máximo 90 días</p>
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Fecha de inicio
          </label>
          <input
            v-model="startDate"
            type="date"
            class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <button
          @click="generateMenu"
          :disabled="loading || menus.length === 0"
          class="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {{ loading ? "Generando..." : "Generar Menú" }}
        </button>

        <!-- Menús disponibles -->
        <div class="mt-6 pt-6 border-t">
          <h3 class="text-sm font-medium text-gray-700 mb-3">
            Menús disponibles ({{ menus.length }})
          </h3>
          <div v-if="menus.length > 0" class="space-y-2">
            <div
              v-for="menu in menus"
              :key="menu.id"
              class="flex justify-between items-center text-sm p-2 bg-gray-50 rounded"
            >
              <span>{{ menu.name }}</span>
              <span
                :class="
                  (menu.meals_count || 0) >= 21
                    ? 'text-green-600'
                    : 'text-amber-600'
                "
              >
                {{ menu.meals_count }}/21
              </span>
            </div>
          </div>
          <p v-else class="text-sm text-gray-500">
            No hay menús creados.
            <NuxtLink href="/" class="text-indigo-600 hover:underline"
              >Crear uno</NuxtLink
            >
          </p>
        </div>
      </div>

      <!-- Resultado -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <h2 class="text-lg font-semibold mb-4">Resultado</h2>

        <div
          v-if="generatedMenu.length > 0"
          class="max-h-[600px] overflow-y-auto space-y-3"
        >
          <div
            v-for="day in generatedMenu"
            :key="day.day"
            class="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
          >
            <div class="flex justify-between items-center mb-2">
              <span class="font-medium text-gray-900">Día {{ day.day }}</span>
              <span class="text-xs text-gray-500">{{
                formatDate(day.date)
              }}</span>
            </div>
            <div class="text-sm space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-emerald-600">☕</span>
                <span class="text-gray-700">{{ day.desayuno }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-amber-600">🍽️</span>
                <span class="text-gray-700">{{ day.comida }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-indigo-600">🌙</span>
                <span class="text-gray-700">{{ day.cena }}</span>
              </div>
              <div class="text-xs text-gray-400 mt-1">
                Menú: {{ day.menu_name }} · {{ day.kcal }} kcal
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="!loading" class="text-center py-12 text-gray-500">
          <p>Selecciona los días y haz clic en "Generar Menú"</p>
        </div>

        <div v-else class="text-center py-12">
          <div
            class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"
          ></div>
          <p class="mt-4 text-gray-600">Generando menú...</p>
        </div>
      </div>
    </div>

    <!-- Botón de imprimir/exportar -->
    <div v-if="generatedMenu.length > 0" class="mt-6 flex justify-end gap-2">
      <button
        @click="printMenu"
        class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
      >
        🖨️ Imprimir
      </button>
      <button
        @click="copyToClipboard"
        class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
      >
        📋 Copiar texto
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { convertToGrams } from "~/utils/shopping-conversions.js";
import { logError } from "~/utils/log-error";
import type { WeeklyMenu } from "~/types";

const supabase = useSupabase();
const { loadCurrentUser } = useCurrentUser();

const days = ref(30);
const startDate = ref(new Date().toISOString().split("T")[0]);
const menus = ref<WeeklyMenu[]>([]);
const generatedMenu = ref<any[]>([]);
const loading = ref(false);

const loadMenus = async () => {
  const currentUser = await loadCurrentUser();
  if (!currentUser) {
    menus.value = [];
    return;
  }

  const { data, error } = await supabase
    .from("weekly_menus")
    .select(
      `
      *,
      meals_count:weekly_meals(count)
    `,
    )
    .eq("user_id", currentUser.id)
    .order("week_number", { ascending: true });

  if (error) {
    console.error("Error cargando menús:", error);
  } else {
    menus.value = (data || []).map((m) => ({
      ...m,
      meals_count: m.meals_count?.[0]?.count || 0,
    }));
  }
};

const generateMenu = async () => {
  loading.value = true;
  generatedMenu.value = [];

  try {
    const result: any[] = [];

    for (let i = 0; i < days.value; i++) {
      const menuIndex = Math.floor(i / 7) % menus.value.length;
      const dayInWeek = (i % 7) + 1;
      const menu = menus.value[menuIndex];

      const { data: dayMeals } = await supabase
        .from("weekly_meals")
        .select("meal_type, dish_name, kcal, protein_g, carbs_g, fat_g")
        .eq("weekly_menu_id", menu.id)
        .eq("day_number", dayInWeek);

      const desayuno = dayMeals?.find((m) => m.meal_type === "desayuno");
      const comida = dayMeals?.find((m) => m.meal_type === "comida");
      const cena = dayMeals?.find((m) => m.meal_type === "cena");
      const kcal = (dayMeals || []).reduce(
        (sum, meal) => sum + (Number(meal.kcal) || 0),
        0,
      );

      const date = new Date(startDate.value);
      date.setDate(date.getDate() + i);

      result.push({
        day: i + 1,
        date: date.toISOString(),
        menu_name: menu.name,
        desayuno: desayuno?.dish_name || "No disponible",
        comida: comida?.dish_name || "No disponible",
        cena: cena?.dish_name || "No disponible",
        kcal,
      });
    }

    generatedMenu.value = result;
    await saveMonthlyHistory(result);
  } catch (error) {
    console.error("Error generando menú:", error);
    await logError("web", error, { context: "generar.generateMenu" });
    alert("Error generando menú");
  } finally {
    loading.value = false;
  }
};

const saveMonthlyHistory = async (menuData: any[]) => {
  const currentUser = await loadCurrentUser();
  if (!currentUser || menuData.length === 0) return;

  const shopping = await buildShoppingSnapshot();
  const start = new Date(startDate.value);
  const end = new Date(start);
  end.setDate(start.getDate() + days.value - 1);

  const { error } = await supabase.from("monthly_menus").insert({
    user_id: currentUser.id,
    name: `Menú ${formatDate(start.toISOString())} - ${formatDate(end.toISOString())}`,
    month: start.getMonth() + 1,
    year: start.getFullYear(),
    start_date: start.toISOString().split("T")[0],
    end_date: end.toISOString().split("T")[0],
    menu_data: menuData,
    shopping_list: shopping,
  });

  if (error) {
    console.error("Error guardando histórico mensual:", error);
    await logError("web", error, { context: "generar.saveMonthlyHistory" });
  }
};

const buildShoppingSnapshot = async () => {
  const consolidated: Record<string, any> = {};

  for (let i = 0; i < days.value; i++) {
    const menuIndex = Math.floor(i / 7) % menus.value.length;
    const dayInWeek = (i % 7) + 1;
    const menu = menus.value[menuIndex];

    const { data: meals } = await supabase
      .from("weekly_meals")
      .select("weekly_meal_ingredients(*)")
      .eq("weekly_menu_id", menu.id)
      .eq("day_number", dayInWeek);

    for (const meal of meals || []) {
      for (const ingredient of meal.weekly_meal_ingredients || []) {
        const conversion = convertToGrams({
          name: ingredient.name,
          quantity: ingredient.quantity,
          unitType: ingredient.unit_type,
        });
        const key = ingredient.name.toLowerCase();
        if (!consolidated[key]) {
          consolidated[key] = {
            item_name: ingredient.name,
            quantity_grams: 0,
            purchased: false,
            conversion_status: conversion.status,
            conversion_note: conversion.note,
          };
        }
        consolidated[key].quantity_grams += conversion.grams;
        if (conversion.status === "ambiguous") {
          consolidated[key].conversion_status = "ambiguous";
          consolidated[key].conversion_note = conversion.note;
        }
      }
    }
  }

  return Object.values(consolidated)
    .map((item: any) => ({
      ...item,
      quantity_grams: Math.round(item.quantity_grams),
    }))
    .sort((a: any, b: any) => a.item_name.localeCompare(b.item_name));
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
};

const printMenu = () => {
  window.print();
};

const copyToClipboard = () => {
  const text = generatedMenu.value
    .map(
      (day) =>
        `Día ${day.day} (${formatDate(day.date)}) - ${day.menu_name}\n` +
        `  ☕ Desayuno: ${day.desayuno}\n` +
        `  🍽️ Comida: ${day.comida}\n` +
        `  🌙 Cena: ${day.cena}\n` +
        `  Total: ${day.kcal} kcal`,
    )
    .join("\n\n");

  navigator.clipboard.writeText(text).then(() => {
    alert("Copiado al portapapeles");
  });
};

onMounted(() => {
  loadMenus();
});
</script>

<style scoped>
@media print {
  nav,
  button {
    display: none !important;
  }
}
</style>
