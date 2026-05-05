<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Generar menú rotativo</h1>
        <p class="text-sm text-gray-500">
          Mismas recetas para todos los perfiles, cantidades ajustadas por
          objetivos.
        </p>
      </div>
      <div class="flex gap-2">
        <NuxtLink
          href="/shopping"
          class="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Ir a compra
        </NuxtLink>
        <button
          class="rounded-lg bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
          :disabled="generatedDays.length === 0"
          @click="printMenu"
        >
          PDF / Imprimir
        </button>
      </div>
    </header>

    <section class="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <article class="rounded-lg border bg-white p-4">
        <h2 class="mb-3 font-semibold text-gray-900">Configuración</h2>
        <div class="grid gap-3 md:grid-cols-2">
          <label>
            <span class="mb-1 block text-xs font-medium text-gray-600">
              Nombre
            </span>
            <input
              v-model.trim="name"
              class="w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label>
            <span class="mb-1 block text-xs font-medium text-gray-600">
              Duración (días)
            </span>
            <input
              v-model.number="days"
              type="number"
              min="1"
              max="90"
              class="w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label>
            <span class="mb-1 block text-xs font-medium text-gray-600">
              Inicio
            </span>
            <input
              v-model="startDate"
              type="date"
              class="w-full rounded-lg border px-3 py-2"
            />
          </label>
        </div>

        <div class="mt-4">
          <p class="mb-2 text-sm font-medium text-gray-700">Perfiles</p>
          <label
            class="mb-2 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
          >
            <input v-model="useGlobalProfileFallback" type="checkbox" />
            <span>Incluir perfil global</span>
          </label>
          <div class="grid gap-2 md:grid-cols-2">
            <label
              v-for="profile in profiles"
              :key="profile.id"
              class="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <input
                v-model="selectedProfileIds"
                type="checkbox"
                :value="profile.id"
              />
              <span>
                {{ profile.name }} · {{ profile.daily_kcal_target }} kcal ·
                {{ profile.daily_protein_target }}g P
              </span>
            </label>
          </div>
        </div>

        <div class="mt-4">
          <p class="mb-2 text-sm font-medium text-gray-700">Menús fuente</p>
          <div class="grid gap-2 md:grid-cols-2">
            <label
              v-for="menu in menus"
              :key="menu.id"
              class="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <input v-model="selectedMenuIds" type="checkbox" :value="menu.id" />
              <span>{{ menu.name }}</span>
            </label>
          </div>
        </div>

        <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>

        <div class="mt-4 flex flex-wrap gap-2">
          <button
            class="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
            :disabled="loading || currentJob?.status === 'processing'"
            @click="generateRotatingMenu"
          >
            {{
              loading || currentJob?.status === "processing"
                ? "Creando menú..."
                : "Generar menú + compra"
            }}
          </button>
          <button
            class="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            :disabled="generatedDays.length === 0"
            @click="copySummary"
          >
            Copiar resumen
          </button>
        </div>
      </article>

      <article class="rounded-lg border bg-white p-4">
        <h2 class="mb-3 font-semibold text-gray-900">Flujo</h2>
        <ol class="space-y-2 text-sm text-gray-700">
          <li class="rounded-md bg-gray-50 px-3 py-2">
            1. Selecciona perfiles y menús fuente
          </li>
          <li class="rounded-md bg-gray-50 px-3 py-2">
            2. Genera recetas comunes con cantidades por perfil
          </li>
          <li class="rounded-md bg-gray-50 px-3 py-2">
            3. Revisa desviaciones de macros y kcal
          </li>
          <li class="rounded-md bg-gray-50 px-3 py-2">
            4. Ajusta en recetas/ingredientes si hace falta
          </li>
          <li class="rounded-md bg-gray-50 px-3 py-2">
            5. Lista de compra creada automáticamente
          </li>
        </ol>
        <div
          v-if="currentJob"
          class="mt-4 rounded-lg border p-3 text-sm"
          :class="
            currentJob.status === 'failed'
              ? 'border-red-200 bg-red-50 text-red-700'
              : currentJob.status === 'completed'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
          "
        >
          <p class="font-medium">
            {{
              currentJob.status === "completed"
                ? "Tu menú rotativo está listo"
                : currentJob.status === "failed"
                  ? "Error al crear el menú"
                  : "Estamos creando tu menú rotativo"
            }}
          </p>
          <p class="text-xs mt-1">
            Estado: {{ currentJob.status }} · progreso
            {{ currentJob.progress ?? 0 }}%
          </p>
          <p v-if="currentJob.error_message" class="text-xs mt-1">
            {{ currentJob.error_message }}
          </p>
          <NuxtLink
            v-if="currentJob.status === 'completed' && currentJob.result_menu_id"
            href="/shopping"
            class="mt-2 inline-block rounded border px-2 py-1 text-xs"
          >
            Ver menú/lista
          </NuxtLink>
        </div>
        <div
          v-if="shoppingItemsCreated !== null"
          class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          Lista de compra generada con {{ shoppingItemsCreated }} líneas.
        </div>
      </article>
    </section>

    <section
      v-if="profilesSummary.length > 0"
      class="rounded-lg border bg-white p-4"
    >
      <h2 class="mb-3 font-semibold text-gray-900">Objetivos por perfil</h2>
      <div class="overflow-x-auto">
        <table class="min-w-[760px] w-full text-sm">
          <thead class="text-left text-gray-600">
            <tr>
              <th class="px-2 py-2">Perfil</th>
              <th class="px-2 py-2">kcal</th>
              <th class="px-2 py-2">Proteína</th>
              <th class="px-2 py-2">Hidratos</th>
              <th class="px-2 py-2">Grasa</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="profile in profilesSummary"
              :key="profile.key"
              class="border-t"
            >
              <td class="px-2 py-2 font-medium">{{ profile.profile_name }}</td>
              <td class="px-2 py-2">{{ Math.round(profile.target_kcal) }}</td>
              <td class="px-2 py-2">{{ profile.target_protein_g.toFixed(1) }}g</td>
              <td class="px-2 py-2">{{ profile.target_carbs_g.toFixed(1) }}g</td>
              <td class="px-2 py-2">{{ profile.target_fat_g.toFixed(1) }}g</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section
      v-if="generatedDays.length > 0"
      class="space-y-4"
    >
      <article
        v-for="day in generatedDays"
        :key="day.day_number"
        class="rounded-lg border bg-white p-4"
      >
        <h3 class="mb-3 text-lg font-semibold text-gray-900">
          Día {{ day.day_number }} · {{ formatDate(day.day_date) }}
        </h3>

        <div class="space-y-3">
          <div
            v-for="meal in day.meals"
            :key="`${day.day_number}-${meal.meal_type}`"
            class="rounded-lg border p-3"
          >
            <p class="font-medium text-gray-900">
              {{ mealLabel(meal.meal_type) }}: {{ meal.dish_name }}
            </p>
            <div class="mt-2 overflow-x-auto">
              <table class="min-w-[880px] w-full text-xs">
                <thead class="text-left text-gray-600">
                  <tr>
                    <th class="px-2 py-1">Perfil</th>
                    <th class="px-2 py-1">x ración</th>
                    <th class="px-2 py-1">kcal</th>
                    <th class="px-2 py-1">P/H/G</th>
                    <th class="px-2 py-1">Desviación kcal</th>
                    <th class="px-2 py-1">Cantidades</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="portion in meal.profile_portions"
                    :key="`${meal.meal_type}-${portion.profile_key}`"
                    class="border-t"
                  >
                    <td class="px-2 py-1 font-medium">{{ portion.profile_name }}</td>
                    <td class="px-2 py-1">{{ portion.serving_multiplier.toFixed(2) }}</td>
                    <td class="px-2 py-1">{{ Math.round(portion.final_kcal) }}</td>
                    <td class="px-2 py-1">
                      {{ portion.final_protein_g.toFixed(1) }} /
                      {{ portion.final_carbs_g.toFixed(1) }} /
                      {{ portion.final_fat_g.toFixed(1) }}
                    </td>
                    <td
                      class="px-2 py-1"
                      :class="deltaClass(portion.kcal_delta)"
                    >
                      {{ signed(portion.kcal_delta) }}
                    </td>
                    <td class="px-2 py-1">
                      <div class="flex flex-wrap gap-1">
                        <span
                          v-for="ingredient in portion.ingredients"
                          :key="`${portion.profile_key}-${ingredient.name}`"
                          class="rounded bg-gray-100 px-1.5 py-0.5"
                        >
                          {{ ingredient.name }}:
                          {{ ingredient.final_quantity.toFixed(1) }}
                          {{ ingredient.unit_type }}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="mt-4 overflow-x-auto">
          <table class="min-w-[760px] w-full text-sm rounded-lg border">
            <thead class="text-left text-gray-600">
              <tr>
                <th class="px-2 py-2">Perfil</th>
                <th class="px-2 py-2">Totales kcal</th>
                <th class="px-2 py-2">Totales P/H/G</th>
                <th class="px-2 py-2">Δ kcal</th>
                <th class="px-2 py-2">Δ proteína</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="total in day.profile_totals"
                :key="`${day.day_number}-${total.profile_key}`"
                class="border-t"
              >
                <td class="px-2 py-2 font-medium">{{ total.profile_name }}</td>
                <td class="px-2 py-2">
                  {{ total.total_kcal }} / {{ Math.round(total.target_kcal) }}
                </td>
                <td class="px-2 py-2">
                  {{ total.total_protein_g.toFixed(1) }} /
                  {{ total.total_carbs_g.toFixed(1) }} /
                  {{ total.total_fat_g.toFixed(1) }}
                </td>
                <td class="px-2 py-2" :class="deltaClass(total.kcal_delta)">
                  {{ signed(total.kcal_delta) }}
                </td>
                <td
                  class="px-2 py-2"
                  :class="deltaClass(total.protein_delta_g)"
                >
                  {{ signed(total.protein_delta_g) }}g
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { logError } from "~/utils/log-error";
import type { PersonProfile, RotatingProfileTarget, WeeklyMenu } from "~/types";

type RotatingIngredient = {
  name: string;
  final_quantity: number;
  unit_type: string;
};

type ProfilePortion = {
  profile_key: string;
  profile_name: string;
  serving_multiplier: number;
  final_kcal: number;
  final_protein_g: number;
  final_carbs_g: number;
  final_fat_g: number;
  kcal_delta: number;
  ingredients: RotatingIngredient[];
};

type RotatingMeal = {
  meal_type: "desayuno" | "comida" | "cena";
  dish_name: string;
  profile_portions: ProfilePortion[];
};

type DayProfileTotal = {
  profile_key: string;
  profile_name: string;
  target_kcal: number;
  total_kcal: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  kcal_delta: number;
  protein_delta_g: number;
};

type RotatingDay = {
  day_number: number;
  day_date: string;
  meals: RotatingMeal[];
  profile_totals: DayProfileTotal[];
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
const profilesSummary = ref<RotatingProfileTarget[]>([]);
const shoppingItemsCreated = ref<number | null>(null);
const currentJob = ref<{
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  error_message?: string | null;
  result_menu_id?: string | null;
} | null>(null);
const jobChannel = ref<any>(null);
const loading = ref(false);
const error = ref("");

const mealLabel = (type: string) =>
  type === "desayuno" ? "Desayuno" : type === "comida" ? "Comida" : "Cena";

const signed = (value: number) => {
  const rounded = Math.round((Number(value) || 0) * 10) / 10;
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
};

const deltaClass = (value: number) => {
  const abs = Math.abs(Number(value) || 0);
  if (abs <= 30) return "text-emerald-700";
  if (abs <= 90) return "text-amber-700";
  return "text-red-700";
};

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
  profiles.value = (profilesData || []) as PersonProfile[];
  selectedMenuIds.value = (weeklyMenus || []).map((menu) => menu.id);
};

const generateRotatingMenu = async () => {
  error.value = "";
  shoppingItemsCreated.value = null;
  loading.value = true;

  try {
    const currentUser = await loadCurrentUser();
    if (!currentUser) throw new Error("Usuario no disponible");
    if (selectedMenuIds.value.length === 0) {
      throw new Error("Selecciona al menos un menú fuente");
    }

    const response = await $fetch<{
      success: boolean;
      job: {
        id: string;
        status: "pending" | "processing" | "completed" | "failed";
        progress: number;
      };
      deduplicated: boolean;
    }>("/api/rotating-menu-jobs", {
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

    currentJob.value = {
      id: response.job.id,
      status: response.job.status,
      progress: Number(response.job.progress || 0),
    };
    subscribeToJob(response.job.id);
  } catch (err) {
    const maybeErr = err as
      | (Error & { data?: any })
      | { data?: any; message?: string };
    const uncured = maybeErr?.data?.uncured_recipes;
    if (Array.isArray(uncured) && uncured.length > 0) {
      const preview = uncured
        .slice(0, 6)
        .map((item: any) => `${item.dish_name} (${item.reason})`)
        .join(", ");
      error.value = `No se puede generar todavía: hay recetas/ingredientes sin curar (${preview}).`;
    } else {
      error.value = err instanceof Error ? err.message : "Error generando menú";
    }
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
          )} kcal · P:${portion.final_protein_g.toFixed(1)} H:${portion.final_carbs_g.toFixed(1)} G:${portion.final_fat_g.toFixed(1)} · Δkcal ${signed(portion.kcal_delta)}`,
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

const hydrateFromJobResult = async (jobId: string) => {
  const { data, error: jobError } = await supabase
    .from("menu_generation_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();
  if (jobError || !data) return;
  currentJob.value = {
    id: data.id,
    status: data.status,
    progress: Number(data.progress || 0),
    error_message: data.error_message,
    result_menu_id: data.result_menu_id,
  };
  if (data.status === "completed" && data.result_payload) {
    generatedDays.value = (data.result_payload.generated_days || []) as RotatingDay[];
    profilesSummary.value = (data.result_payload.profiles || []) as RotatingProfileTarget[];
    shoppingItemsCreated.value = Number(
      data.result_payload.shopping_list_items || 0,
    );
  }
};

const subscribeToJob = (jobId: string) => {
  if (jobChannel.value) {
    supabase.removeChannel(jobChannel.value);
  }
  const channel = supabase
    .channel(`menu-job-${jobId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "menu_generation_jobs",
        filter: `id=eq.${jobId}`,
      },
      async (payload: any) => {
        const next = payload.new;
        currentJob.value = {
          id: next.id,
          status: next.status,
          progress: Number(next.progress || 0),
          error_message: next.error_message,
          result_menu_id: next.result_menu_id,
        };
        if (next.status === "completed") {
          await hydrateFromJobResult(jobId);
        }
      },
    )
    .subscribe();
  jobChannel.value = channel;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

onMounted(loadBaseData);
onUnmounted(() => {
  if (jobChannel.value) {
    supabase.removeChannel(jobChannel.value);
    jobChannel.value = null;
  }
});
</script>
