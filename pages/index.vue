<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Menús Semanales</h1>
      <button
        @click="showNewMenuModal = true"
        class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
      >
        <span class="text-xl">+</span> Nuevo Menú
      </button>
    </div>

    <!-- Estado de carga -->
    <div v-if="loading" class="text-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"
      ></div>
      <p class="mt-4 text-gray-600">Cargando menús...</p>
    </div>

    <!-- Lista de menús -->
    <div
      v-else-if="menus.length > 0"
      class="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      <div
        v-for="menu in menus"
        :key="menu.id"
        class="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer"
        @click="viewMenu(menu)"
      >
        <div class="flex justify-between items-start gap-3 mb-2">
          <h3 class="text-lg font-semibold text-gray-900">{{ menu.name }}</h3>
          <div class="flex items-center gap-2">
            <span
              class="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full"
            >
              Semana {{ menu.week_number }}
            </span>
            <button
              type="button"
              class="text-red-600 hover:text-red-800 text-sm"
              title="Eliminar menú"
              @click.stop="confirmDeleteMenu(menu)"
            >
              🗑️
            </button>
          </div>
        </div>
        <div class="flex items-center gap-2 text-sm">
          <span
            :class="
              (menu.meals_count || 0) >= 21
                ? 'text-green-600'
                : 'text-amber-600'
            "
          >
            {{ (menu.meals_count || 0) >= 21 ? "✅" : "⏳" }}
            {{ menu.meals_count }}/21 comidas
          </span>
        </div>
        <p class="text-xs text-gray-500 mt-2">
          Creado: {{ formatDate(menu.created_at) }}
        </p>
      </div>
    </div>

    <!-- Sin menús -->
    <div v-else class="text-center py-12 bg-white rounded-lg border">
      <p class="text-gray-600 mb-4">No tienes menús creados</p>
      <button
        @click="showNewMenuModal = true"
        class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Crear primer menú
      </button>
    </div>

    <!-- Modal para nuevo menú -->
    <div
      v-if="showNewMenuModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showNewMenuModal = false"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Crear nuevo menú semanal</h2>
        <input
          v-model="newMenuName"
          type="text"
          placeholder="Nombre del menú (ej: Semana 1)"
          class="w-full border rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          @keyup.enter="createMenu"
        />
        <div class="flex gap-2 justify-end">
          <button
            @click="showNewMenuModal = false"
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancelar
          </button>
          <button
            @click="createMenu"
            :disabled="!newMenuName.trim()"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Crear
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

const menus = ref<WeeklyMenu[]>([]);
const loading = ref(true);
const showNewMenuModal = ref(false);
const newMenuName = ref("");

const loadMenus = async () => {
  loading.value = true;
  const currentUser = await loadCurrentUser();

  if (!currentUser) {
    menus.value = [];
    loading.value = false;
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

  loading.value = false;
};

const createMenu = async () => {
  if (!newMenuName.value.trim()) return;
  const currentUser = await loadCurrentUser();
  if (!currentUser) {
    alert("No hay usuario configurado. Usa /start en Telegram primero.");
    return;
  }

  // Obtener siguiente week_number
  const maxWeek = menus.value.reduce(
    (max, m) => Math.max(max, m.week_number),
    0,
  );

  const { data, error } = await supabase
    .from("weekly_menus")
    .insert({
      user_id: currentUser.id,
      name: newMenuName.value.trim(),
      week_number: maxWeek + 1,
    })
    .select()
    .single();

  if (error) {
    alert("Error creando menú: " + error.message);
    return;
  }

  newMenuName.value = "";
  showNewMenuModal.value = false;
  await loadMenus();

  // Ir a la página de detalle del menú creado
  router.push(`/menu/${data.id}`);
};

const viewMenu = (menu: WeeklyMenu) => {
  router.push(`/menu/${menu.id}`);
};

const confirmDeleteMenu = async (menu: WeeklyMenu) => {
  if (!confirm(`¿Eliminar el menú "${menu.name}"?`)) return;

  const currentUser = await loadCurrentUser();
  if (!currentUser) {
    alert("No hay usuario configurado. Usa /start en Telegram primero.");
    return;
  }

  const { error } = await supabase
    .from("weekly_menus")
    .delete()
    .eq("id", menu.id)
    .eq("user_id", currentUser.id);

  if (error) {
    alert("Error eliminando menú: " + error.message);
    return;
  }

  await loadMenus();
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

onMounted(() => {
  loadMenus();
});
</script>
