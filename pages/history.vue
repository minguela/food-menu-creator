<template>
  <div class="space-y-6">
    <header class="flex flex-wrap justify-between gap-3 items-end">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Histórico de menús mensuales
        </h1>
        <p class="text-sm text-gray-500">
          Busca, revisa, reutiliza y exporta menús ya generados.
        </p>
      </div>
      <input
        v-model.trim="search"
        class="border rounded-lg px-3 py-2 min-w-[260px]"
        placeholder="Buscar por nombre o plato"
        @input="page = 1"
      />
    </header>

    <div v-if="loading" class="text-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"
      ></div>
      <p class="mt-4 text-gray-600">Cargando histórico...</p>
    </div>

    <div
      v-else-if="pagedMenus.length === 0"
      class="text-center py-12 bg-white rounded-lg border"
    >
      <p class="text-gray-600">Todavía no hay menús mensuales guardados.</p>
    </div>

    <section v-else class="space-y-4">
      <article
        v-for="menu in pagedMenus"
        :key="menu.id"
        class="bg-white rounded-lg border shadow-sm p-4"
      >
        <div class="flex flex-wrap justify-between gap-3">
          <div>
            <h2 class="font-semibold text-gray-900">{{ menu.name }}</h2>
            <p class="text-sm text-gray-500">
              {{ formatDate(menu.start_date) }} -
              {{ formatDate(menu.end_date) }} ·
              {{ menu.menu_data?.length || 0 }} días
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              @click="selected = menu"
              class="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Ver
            </button>
            <button
              @click="reuseMenu(menu)"
              class="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Volver a usar
            </button>
            <button
              @click="downloadCsv(menu)"
              class="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              CSV
            </button>
            <button
              @click="printMenu(menu)"
              class="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              PDF
            </button>
          </div>
        </div>
      </article>
    </section>

    <footer
      v-if="totalPages > 1"
      class="flex justify-center items-center gap-3"
    >
      <button
        :disabled="page === 1"
        @click="page--"
        class="px-3 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-40"
      >
        Anterior
      </button>
      <span class="text-sm text-gray-600"
        >Página {{ page }} de {{ totalPages }}</span
      >
      <button
        :disabled="page === totalPages"
        @click="page++"
        class="px-3 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-40"
      >
        Siguiente
      </button>
    </footer>

    <div
      v-if="selected"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 p-4 overflow-y-auto"
      @click.self="selected = null"
    >
      <div class="bg-white rounded-lg max-w-4xl mx-auto p-6">
        <div class="flex justify-between gap-3 mb-4">
          <h2 class="text-xl font-bold text-gray-900">{{ selected.name }}</h2>
          <button
            @click="selected = null"
            class="text-gray-500 hover:text-gray-800"
          >
            Cerrar
          </button>
        </div>
        <div class="grid gap-3 md:grid-cols-2">
          <div
            v-for="day in selected.menu_data"
            :key="day.day"
            class="border rounded-lg p-3"
          >
            <p class="font-medium text-gray-900">
              Día {{ day.day }} · {{ formatDate(day.date) }}
            </p>
            <p class="text-sm text-gray-600">Desayuno: {{ day.desayuno }}</p>
            <p class="text-sm text-gray-600">Comida: {{ day.comida }}</p>
            <p class="text-sm text-gray-600">Cena: {{ day.cena }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { buildShoppingCsv } from "~/utils/shopping-conversions.js";
import type { MonthlyMenu } from "~/types";

const supabase = useSupabase();
const { loadCurrentUser } = useCurrentUser();

const menus = ref<MonthlyMenu[]>([]);
const loading = ref(true);
const search = ref("");
const page = ref(1);
const pageSize = 8;
const selected = ref<MonthlyMenu | null>(null);

const filteredMenus = computed(() => {
  const term = search.value.toLowerCase();
  if (!term) return menus.value;

  return menus.value.filter((menu) => {
    const haystack = [
      menu.name,
      ...(menu.menu_data || []).flatMap((day: any) => [
        day.desayuno,
        day.comida,
        day.cena,
        day.menu_name,
      ]),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredMenus.value.length / pageSize)),
);
const pagedMenus = computed(() =>
  filteredMenus.value.slice((page.value - 1) * pageSize, page.value * pageSize),
);

const loadHistory = async () => {
  loading.value = true;
  const currentUser = await loadCurrentUser();
  if (!currentUser) {
    menus.value = [];
    loading.value = false;
    return;
  }

  const { data, error } = await supabase
    .from("monthly_menus")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando histórico:", error);
    menus.value = [];
  } else {
    menus.value = data || [];
  }
  loading.value = false;
};

const reuseMenu = async (menu: MonthlyMenu) => {
  const currentUser = await loadCurrentUser();
  if (!currentUser) return;

  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() + Math.max(0, (menu.menu_data?.length || 1) - 1));

  const { error } = await supabase.from("monthly_menus").insert({
    user_id: currentUser.id,
    name: `${menu.name} reutilizado`,
    month: today.getMonth() + 1,
    year: today.getFullYear(),
    start_date: today.toISOString().split("T")[0],
    end_date: end.toISOString().split("T")[0],
    menu_data: (menu.menu_data || []).map((day: any, index: number) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      return { ...day, day: index + 1, date: date.toISOString() };
    }),
    shopping_list: menu.shopping_list || [],
    reused_from: menu.id,
  });

  if (error) return alert("Error reutilizando menú: " + error.message);

  await supabase
    .from("shopping_lists")
    .delete()
    .eq("user_id", currentUser.id)
    .eq("week_start", today.toISOString().split("T")[0]);
  const rows = (menu.shopping_list || []).map((item: any) => ({
    user_id: currentUser.id,
    week_start: today.toISOString().split("T")[0],
    item_name: item.item_name || item.ingredients?.name || "Artículo",
    quantity_needed: item.quantity_grams || item.quantity_needed || 1,
    quantity_grams: item.quantity_grams || item.quantity_needed || 1,
    original_quantity: item.quantity_grams || item.quantity_needed || 1,
    original_unit_type: "g",
    conversion_status: item.conversion_status || "manual",
    conversion_note: item.conversion_note || "Reutilizado desde histórico.",
    is_extra: true,
    purchased: false,
    estimated_price: item.estimated_price || 0,
  }));

  if (rows.length > 0) {
    await supabase.from("shopping_lists").insert(rows);
  }

  alert("Menú reutilizado y lista de compra cargada para hoy.");
  await loadHistory();
};

const downloadCsv = (menu: MonthlyMenu) => {
  const blob = new Blob([buildShoppingCsv(menu.shopping_list || [])], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${menu.name.replaceAll(/\s+/g, "-").toLowerCase()}-compra.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const printMenu = (menu: MonthlyMenu) => {
  selected.value = menu;
  nextTick(() => window.print());
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

onMounted(loadHistory);
</script>
