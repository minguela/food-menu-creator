<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Menú rotativo multi-perfil
        </h1>
        <p class="text-sm text-gray-500">
          Calcula cantidades y macros por perfil usando ingredientes reales.
        </p>
      </div>
      <button
        class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        :disabled="generatedDays.length === 0"
        @click="printMenu"
      >
        PDF / Imprimir
      </button>
    </header>

    <section class="bg-white rounded-lg border p-4">
      <h2 class="font-semibold text-gray-900 mb-3">Configuración</h2>

      <div class="grid gap-3 lg:grid-cols-2">
        <label>
          <span class="block text-sm font-medium text-gray-700 mb-1"
            >Nombre</span
          >
          <input
            v-model.trim="name"
            class="w-full border rounded-lg px-3 py-2"
          />
        </label>
        <label>
          <span class="block text-sm font-medium text-gray-700 mb-1"
            >Duración (días)</span
          >
          <input
            v-model.number="days"
            type="number"
            min="1"
            max="90"
            class="w-full border rounded-lg px-3 py-2"
          />
        </label>
        <label>
          <span class="block text-sm font-medium text-gray-700 mb-1"
            >Fecha inicio</span
          >
          <input
            v-model="startDate"
            type="date"
            class="w-full border rounded-lg px-3 py-2"
          />
        </label>
      </div>

      <div class="mt-4">
        <p class="text-sm font-medium text-gray-700 mb-2">Perfiles</p>
        <label
          class="inline-flex items-center gap-2 border rounded-lg px-3 py-2 text-sm mb-2"
        >
          <input v-model="useGlobalProfileFallback" type="checkbox" />
          <span>Incluir perfil global del usuario</span>
        </label>
        <div class="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          <label
            v-for="profile in profiles"
            :key="profile.id"
            class="inline-flex items-center gap-2 border rounded-lg px-3 py-2 text-sm"
          >
            <input
              v-model="selectedProfileIds"
              type="checkbox"
              :value="profile.id"
            />
            <span>{{ profile.name }}</span>
          </label>
        </div>
      </div>

      <div class="mt-4">
        <p class="text-sm font-medium text-gray-700 mb-2">Menús fuente</p>
        <div class="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          <label
            v-for="menu in menus"
            :key="menu.id"
            class="inline-flex items-center gap-2 border rounded-lg px-3 py-2 text-sm"
          >
            <input v-model="selectedMenuIds" type="checkbox" :value="menu.id" />
            <span>{{ menu.name }}</span>
          </label>
        </div>
      </div>

      <p v-if="error" class="text-sm text-red-600 mt-3">{{ error }}</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <button
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          :disabled="loading"
          @click="generateRotatingMenu"
        >
          {{ loading ? "Generando..." : "Generar y guardar" }}
        </button>
        <button
          class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          :disabled="generatedDays.length === 0"
          @click="copySummary"
        >
          Copiar resumen
        </button>
      </div>
    </section>

    <section
      v-if="generatedDays.length > 0"
      class="bg-white rounded-lg border p-4"
    >
      <h2 class="font-semibold text-gray-900 mb-3">Resultado por perfil</h2>
      <div class="space-y-3">
        <article
          v-for="day in generatedDays"
          :key="day.day_number"
          class="border rounded-lg p-3"
        >
          <p class="font-medium text-gray-900 mb-2">
            Día {{ day.day_number }} · {{ formatDate(day.day_date) }}
          </p>
          <div class="space-y-2">
            <div
              v-for="meal in day.meals"
              :key="meal.meal_type"
              class="rounded border p-2"
            >
              <p class="text-sm font-medium text-gray-900">
                {{ mealLabel(meal.meal_type) }}: {{ meal.dish_name }}
              </p>
              <div class="text-xs text-gray-600 mt-1 space-y-1">
                <p
                  v-for="portion in meal.profile_portions"
                  :key="`${meal.meal_type}-${portion.profile_key}`"
                >
                  {{ portion.profile_name }}: x{{
                    portion.serving_multiplier.toFixed(2)
                  }}
                  · {{ Math.round(portion.final_kcal) }} kcal ·
                  {{ portion.final_protein_g.toFixed(1) }}g P
                  <span v-if="portion.nutrition_pending" class="text-amber-700">
                    · Pendiente de datos nutricionales
                  </span>
                </p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { logError } from "~/utils/log-error";
import type { PersonProfile, WeeklyMenu } from "~/types";

type ProfilePortion = {
  profile_key: string;
  profile_name: string;
  serving_multiplier: number;
  final_kcal: number;
  final_protein_g: number;
  nutrition_pending: boolean;
};

type RotatingMeal = {
  meal_type: "desayuno" | "comida" | "cena";
  dish_name: string;
  profile_portions: ProfilePortion[];
};

type RotatingDay = {
  day_number: number;
  day_date: string;
  meals: RotatingMeal[];
};

const supabase = useSupabase();
const { loadCurrentUser } = useCurrentUser();

const name = ref("Menú rotativo");
const days = ref(30);
const startDate = ref(new Date().toISOString().split("T")[0]);
const menus = ref<WeeklyMenu[]>([]);
const profiles = ref<PersonProfile[]>([]);
const selectedMenuIds = ref<string[]>([]);
const selectedProfileIds = ref<string[]>([]);
const useGlobalProfileFallback = ref(true);
const generatedDays = ref<RotatingDay[]>([]);
const loading = ref(false);
const error = ref("");

const mealLabel = (type: string) =>
  type === "desayuno" ? "Desayuno" : type === "comida" ? "Comida" : "Cena";

const loadBaseData = async () => {
  const currentUser = await loadCurrentUser();
  if (!currentUser) return;

  const [{ data: weeklyMenus }, { data: profilesData }] = await Promise.all([
    supabase
      .from("weekly_menus")
      .select("id, user_id, name, week_number, created_at")
      .eq("user_id", currentUser.id)
      .order("week_number", { ascending: true }),
    supabase
      .from("person_profiles")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: true }),
  ]);

  menus.value = weeklyMenus || [];
  profiles.value = profilesData || [];
  selectedMenuIds.value = (weeklyMenus || []).map((menu) => menu.id);
};

const generateRotatingMenu = async () => {
  error.value = "";
  loading.value = true;

  try {
    const currentUser = await loadCurrentUser();
    if (!currentUser) throw new Error("Usuario no disponible");
    if (selectedMenuIds.value.length === 0) {
      throw new Error("Selecciona al menos un menú fuente");
    }

    const response = await $fetch<{
      success: boolean;
      generated_days: RotatingDay[];
    }>("/api/rotating-menu-generate", {
      method: "POST",
      body: {
        userId: currentUser.id,
        name: name.value.trim() || "Menú rotativo",
        durationDays: Math.min(90, Math.max(1, Number(days.value) || 7)),
        startDate: startDate.value,
        sourceWeeklyMenuIds: selectedMenuIds.value,
        profileIds: selectedProfileIds.value,
        includeGlobalProfile: useGlobalProfileFallback.value,
      },
    });

    if (!response.success) {
      throw new Error("No se pudo generar el menú rotativo");
    }

    generatedDays.value = response.generated_days || [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Error generando menú";
    await logError("web", err, {
      context: "generar.generateRotatingMenuMultiProfile",
    });
  } finally {
    loading.value = false;
  }
};

const copySummary = async () => {
  const lines: string[] = [];
  for (const day of generatedDays.value) {
    lines.push(`Día ${day.day_number} (${formatDate(day.day_date)})`);
    for (const meal of day.meals) {
      lines.push(`- ${mealLabel(meal.meal_type)}: ${meal.dish_name}`);
      for (const portion of meal.profile_portions) {
        lines.push(
          `  · ${portion.profile_name}: x${portion.serving_multiplier.toFixed(2)} · ${Math.round(
            portion.final_kcal,
          )} kcal · ${portion.final_protein_g.toFixed(1)}g P${portion.nutrition_pending ? " · pendiente nutricional" : ""}`,
        );
      }
    }
    lines.push("");
  }
  await navigator.clipboard.writeText(lines.join("\n"));
};

const printMenu = () => {
  window.print();
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

onMounted(loadBaseData);
</script>
