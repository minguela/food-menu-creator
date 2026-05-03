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
      <div class="bg-white rounded-lg p-6 w-full max-w-3xl">
        <h2 class="text-xl font-bold mb-4">Crear nuevo menú semanal</h2>
        <label class="block mb-4">
          <span class="block text-sm font-medium text-gray-700 mb-1">
            Nombre del menú
          </span>
          <input
            v-model="newMenuName"
            type="text"
            placeholder="Nombre del menú (ej: Semana 1)"
            class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            @keyup.enter="createMenu"
          />
        </label>

        <section class="border rounded-lg p-4 mb-4">
          <h3 class="font-semibold text-gray-900 mb-2">
            Comidas fijas para los 7 días (opcional)
          </h3>
          <div class="flex flex-wrap gap-2 mb-3">
            <label
              v-for="type in mealTypes"
              :key="`fixed-${type}`"
              class="inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm"
            >
              <input v-model="fixedMealTypes" type="checkbox" :value="type" />
              <span>{{ mealLabel(type) }}</span>
            </label>
          </div>

          <div v-if="fixedMealTypes.length > 0" class="space-y-4">
            <article
              v-for="type in fixedMealTypes"
              :key="`fixed-card-${type}`"
              class="border rounded-lg p-3"
            >
              <h4 class="font-medium text-gray-900 mb-2">
                {{ mealLabel(type) }} fija
              </h4>
              <div class="grid gap-2 md:grid-cols-2">
                <label class="md:col-span-2">
                  <span class="block text-xs font-medium text-gray-700 mb-1">
                    Nombre del plato
                  </span>
                  <input
                    v-model.trim="fixedMeals[type].dish_name"
                    class="w-full border rounded-lg px-3 py-2"
                    placeholder="Ej: Yogur con avena y fruta"
                  />
                </label>
                <label class="md:col-span-2">
                  <span class="block text-xs font-medium text-gray-700 mb-1">
                    Descripción
                  </span>
                  <input
                    v-model.trim="fixedMeals[type].dish_description"
                    class="w-full border rounded-lg px-3 py-2"
                    placeholder="Descripción opcional"
                  />
                </label>
              </div>

              <div class="mt-3 space-y-2">
                <div
                  v-for="(ingredient, index) in fixedMeals[type].ingredients"
                  :key="`${type}-ing-${index}`"
                  class="grid grid-cols-[1fr_90px_90px_32px] gap-2"
                >
                  <label>
                    <span class="block text-xs font-medium text-gray-700 mb-1">
                      Ingrediente
                    </span>
                    <input
                      v-model.trim="ingredient.name"
                      class="w-full border rounded-lg px-3 py-2"
                      placeholder="Ej: Avena"
                    />
                  </label>
                  <label>
                    <span class="block text-xs font-medium text-gray-700 mb-1">
                      Cantidad
                    </span>
                    <input
                      v-model.number="ingredient.quantity"
                      type="number"
                      min="0.01"
                      step="0.01"
                      class="w-full border rounded-lg px-3 py-2"
                    />
                  </label>
                  <label>
                    <span class="block text-xs font-medium text-gray-700 mb-1">
                      Unidad
                    </span>
                    <select
                      v-model="ingredient.unit_type"
                      class="w-full border rounded-lg px-3 py-2"
                    >
                      <option
                        v-for="unit in unitTypes"
                        :key="unit"
                        :value="unit"
                      >
                        {{ unit }}
                      </option>
                    </select>
                  </label>
                  <button
                    type="button"
                    class="text-red-600 self-end h-10"
                    @click="removeFixedIngredient(type, index)"
                  >
                    ×
                  </button>
                </div>
                <button
                  type="button"
                  class="text-sm text-indigo-700"
                  @click="addFixedIngredient(type)"
                >
                  + Ingrediente
                </button>
              </div>
            </article>
          </div>
        </section>
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
const mealTypes = ["desayuno", "comida", "cena"] as const;
const unitTypes = ["g", "kg", "ml", "l", "ud", "pack", "unidad"] as const;
const fixedMealTypes = ref<Array<(typeof mealTypes)[number]>>([]);
const fixedMeals = reactive(
  Object.fromEntries(
    mealTypes.map((type) => [
      type,
      {
        dish_name: "",
        dish_description: "",
        ingredients: [{ name: "", quantity: 1, unit_type: "g" as const }],
      },
    ]),
  ) as Record<
    (typeof mealTypes)[number],
    {
      dish_name: string;
      dish_description: string;
      ingredients: Array<{ name: string; quantity: number; unit_type: string }>;
    }
  >,
);

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

  if (data?.id && fixedMealTypes.value.length > 0) {
    const fixedRows = [];
    const fixedIngredientRows: Array<{
      weekly_meal_id: string;
      name: string;
      quantity: number;
      unit_type: string;
    }> = [];

    for (const type of fixedMealTypes.value) {
      const fixed = fixedMeals[type];
      if (!fixed.dish_name.trim()) continue;
      for (let day = 1; day <= 7; day++) {
        fixedRows.push({
          weekly_menu_id: data.id,
          day_number: day,
          meal_type: type,
          dish_name: fixed.dish_name.trim(),
          dish_description: fixed.dish_description.trim() || null,
          kcal: 0,
          protein_g: 0,
          carbs_g: 0,
          fat_g: 0,
        });
      }
    }

    if (fixedRows.length > 0) {
      const { data: insertedMeals, error: fixedError } = await supabase
        .from("weekly_meals")
        .upsert(fixedRows, {
          onConflict: "weekly_menu_id,day_number,meal_type",
        })
        .select("id, meal_type, day_number");

      if (fixedError) {
        alert("Menú creado, pero falló la comida fija: " + fixedError.message);
      } else if (insertedMeals) {
        for (const meal of insertedMeals) {
          const mealType = meal.meal_type as (typeof mealTypes)[number];
          const ingredientRows = fixedMeals[mealType].ingredients.filter(
            (ingredient) => ingredient.name && ingredient.quantity > 0,
          );
          for (const ing of ingredientRows) {
            fixedIngredientRows.push({
              weekly_meal_id: meal.id,
              name: ing.name.toLowerCase(),
              quantity: ing.quantity,
              unit_type: ing.unit_type,
            });
          }
        }
        if (fixedIngredientRows.length > 0) {
          await supabase
            .from("weekly_meal_ingredients")
            .insert(fixedIngredientRows);
        }
      }
    }

    // Save reusable fixed meals
    for (const type of fixedMealTypes.value) {
      const fixed = fixedMeals[type];
      if (!fixed.dish_name.trim()) continue;
      const { data: savedFixedMeal } = await supabase
        .from("saved_fixed_meals")
        .insert({
          user_id: currentUser.id,
          meal_type: type,
          dish_name: fixed.dish_name.trim(),
          dish_description: fixed.dish_description.trim() || null,
          kcal: 0,
          protein_g: 0,
          carbs_g: 0,
          fat_g: 0,
        })
        .select("id")
        .maybeSingle();

      if (savedFixedMeal?.id) {
        const rows = fixed.ingredients
          .filter((ingredient) => ingredient.name && ingredient.quantity > 0)
          .map((ingredient) => ({
            fixed_meal_id: savedFixedMeal.id,
            name: ingredient.name.toLowerCase(),
            quantity: ingredient.quantity,
            unit_type: ingredient.unit_type,
          }));
        if (rows.length > 0) {
          await supabase.from("saved_fixed_meal_ingredients").insert(rows);
        }
      }
    }
  }

  newMenuName.value = "";
  resetFixedMeals();
  showNewMenuModal.value = false;
  await loadMenus();

  // Ir a la página de detalle del menú creado
  router.push(`/menu/${data.id}`);
};

const mealLabel = (type: (typeof mealTypes)[number]) => {
  if (type === "desayuno") return "Desayuno";
  if (type === "comida") return "Comida";
  return "Cena";
};

const addFixedIngredient = (type: (typeof mealTypes)[number]) => {
  fixedMeals[type].ingredients.push({
    name: "",
    quantity: 1,
    unit_type: "g",
  });
};

const removeFixedIngredient = (
  type: (typeof mealTypes)[number],
  index: number,
) => {
  fixedMeals[type].ingredients.splice(index, 1);
};

const resetFixedMeals = () => {
  fixedMealTypes.value = [];
  for (const type of mealTypes) {
    fixedMeals[type] = {
      dish_name: "",
      dish_description: "",
      ingredients: [{ name: "", quantity: 1, unit_type: "g" }],
    };
  }
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
