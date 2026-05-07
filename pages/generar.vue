<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    
    <!-- Notification Toast -->
    <div
      v-if="notificationMessage"
      class="fixed right-4 top-20 z-50 max-w-sm rounded-xl border bg-white p-4 shadow-xl"
      :class="notificationLevel === 'error' ? 'border-red-200' : 'border-emerald-200'"
    >
      <div class="flex items-start justify-between gap-3">
        <p class="text-sm" :class="notificationLevel === 'error' ? 'text-red-700' : 'text-emerald-700'">
          {{ notificationMessage }}
        </p>
        <button class="text-xs text-gray-400 hover:text-gray-600" @click="notificationMessage = ''">
          ✕
        </button>
      </div>
    </div>

    <!-- Header -->
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </div>
        <div>
          <h1 class="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Generar menú rotativo
          </h1>
          <p class="text-slate-500 text-sm mt-1">Mismas recetas, cantidades ajustadas por objetivos</p>
        </div>
      </div>
      <div class="flex gap-3">
        <NuxtLink
          href="/shopping"
          class="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium"
        >
          Ir a compra
        </NuxtLink>
        <button
          class="px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 disabled:opacity-50 text-sm font-medium shadow-lg shadow-slate-200 hover:shadow-xl transition-all disabled:cursor-not-allowed"
          :disabled="generatedDays.length === 0"
          @click="printMenu"
        >
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            PDF / Imprimir
          </span>
        </button>
      </div>
    </header>

    <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <!-- Config Section -->
      <article class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.83-1.14 2.423-1.14 3.253 0 .83 1.14.83 2.99 0 4.13-.83 1.14-2.423 1.14-3.253 0-.83-1.14-.83-2.99 0-4.13zM12 12h.01M19 12h.01M6 12h.01" />
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-bold text-slate-900">Configuración</h2>
            <p class="text-xs text-slate-500">Ajusta los parámetros del menú</p>
          </div>
        </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label class="space-y-2">
              <span class="block text-sm font-semibold text-slate-700">
                Nombre
              </span>
              <input
                v-model.trim="name"
                class="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="Mi menú rotativo"
              />
            </label>
            <label class="space-y-2">
              <span class="block text-sm font-semibold text-slate-700">
                Duración (días)
              </span>
              <input
                v-model.number="days"
                type="number"
                min="1"
                max="90"
                class="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </label>
            <label class="space-y-2">
              <span class="block text-sm font-semibold text-slate-700">
                Inicio
              </span>
              <input
                v-model="startDate"
                type="date"
                class="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </label>
            <label class="space-y-2">
              <span class="block text-sm font-semibold text-slate-700">
                kcal comida libre
              </span>
              <input
                v-model.number="specialMealKcal"
                type="number"
                min="0"
                max="2000"
                step="10"
                class="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="700"
              />
            </label>
          </div>

        <div class="mt-4">
          <p class="mb-2 text-sm font-medium text-gray-700">Perfiles</p>
          <p
            v-if="profiles.length === 0"
            class="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
          >
            No tienes perfiles creados.
            <NuxtLink href="/config" class="font-semibold underline">
              Crear perfil ahora
            </NuxtLink>
          </p>
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
          <NuxtLink
            v-if="profiles.length === 0"
            href="/config"
            class="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Ir a crear perfiles
          </NuxtLink>
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
          <div class="mt-3 h-2 w-full overflow-hidden rounded bg-white/70">
            <div
              class="h-2 rounded bg-indigo-600 transition-all"
              :class="
                currentJob.status === 'failed'
                  ? 'bg-red-500'
                  : currentJob.status === 'completed'
                    ? 'bg-emerald-500'
                    : 'bg-indigo-600'
              "
              :style="{ width: `${Math.max(0, Math.min(100, currentJob.progress || 0))}%` }"
            />
          </div>
          <p v-if="currentJob.current_step" class="text-xs mt-2">
            Paso actual: {{ stepLabel(currentJob.current_step) }}
          </p>
          <p v-if="currentJob.error_message" class="text-xs mt-1">
            {{ currentJob.error_message }}
          </p>
          <NuxtLink
            v-if="currentJob.status === 'completed' && currentJob.result_menu_id"
            :href="`/rotating/${currentJob.result_menu_id}`"
            class="mt-2 inline-block rounded border px-2 py-1 text-xs"
          >
            Abrir menú generado
          </NuxtLink>
        </div>
        <div
          v-if="currentJob"
          class="mt-4 rounded-lg border bg-zinc-950 p-3 text-sm text-zinc-100"
        >
          <div class="mb-3 flex items-center justify-between gap-2">
            <div>
              <h3 class="font-semibold">Debug del job</h3>
              <p class="text-xs text-zinc-400">
                Logs persistidos en Supabase · {{ generationLogs.length }} eventos
              </p>
            </div>
            <span
              class="rounded-full px-2 py-1 text-xs"
              :class="statusPillClass(currentJob.status)"
            >
              {{ statusLabel(currentJob.status) }}
            </span>
          </div>
          <div v-if="generationLogs.length === 0" class="rounded border border-zinc-800 p-3 text-xs text-zinc-400">
            Esperando eventos del proceso...
          </div>
          <ol v-else class="max-h-80 space-y-2 overflow-y-auto pr-1">
            <li
              v-for="log in generationLogs"
              :key="log.id"
              class="rounded border border-zinc-800 bg-zinc-900 p-2"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="rounded px-1.5 py-0.5 text-[10px] uppercase" :class="levelClass(log.level)">
                    {{ log.level }}
                  </span>
                  <span class="text-xs font-medium text-zinc-100">
                    {{ stepLabel(log.step) }}
                  </span>
                  <span class="text-[11px] text-zinc-500">
                    {{ log.metadata?.status || "running" }}
                  </span>
                </div>
                <time class="text-[11px] text-zinc-500">
                  {{ formatTime(log.created_at) }}
                </time>
              </div>
              <p class="mt-1 text-xs text-zinc-300">{{ log.message }}</p>
              <details
                v-if="hasLogMetadata(log)"
                class="mt-2 text-[11px] text-zinc-400"
              >
                <summary class="cursor-pointer select-none">metadata</summary>
                <pre class="mt-2 overflow-x-auto rounded border border-zinc-800 p-2">{{ JSON.stringify(log.metadata, null, 2) }}</pre>
              </details>
            </li>
          </ol>
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
              <span
                v-if="meal.is_special"
                class="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-800"
              >
                Comida libre · {{ meal.special_kcal_reserved ?? specialMealKcal }} kcal
              </span>
            </p>
            <div
              v-if="meal.is_special"
              class="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
            >
              <p class="font-medium">
                {{ meal.special_kcal_reserved ?? specialMealKcal }} kcal reservadas
              </p>
              <p class="mt-1">
                Esta comida no tiene macros definidos, no calcula cantidades y
                no se incluye en la lista de la compra.
              </p>
            </div>
            <div v-else class="mt-2 overflow-x-auto">
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
                <th class="px-2 py-2">kcal estimadas</th>
                <th class="px-2 py-2">kcal libres</th>
                <th class="px-2 py-2">kcal resto</th>
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
                <td class="px-2 py-2 font-medium">
                  {{ total.profile_name }}
                  <span
                    v-if="total.all_special_day"
                    class="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800"
                  >
                    Día libre completo
                  </span>
                  <span
                    v-if="total.low_regular_budget_warning"
                    class="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] text-red-800"
                  >
                    Poco margen
                  </span>
                </td>
                <td class="px-2 py-2">
                  {{ total.total_kcal }} / {{ Math.round(total.target_kcal) }}
                </td>
                <td class="px-2 py-2">
                  {{ Math.round(total.special_kcal_reserved || 0) }}
                </td>
                <td class="px-2 py-2">
                  {{ Math.round(total.regular_kcal || 0) }}
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
  is_special?: boolean;
  special_kcal_reserved?: number;
  ingredients: RotatingIngredient[];
};

type RotatingMeal = {
  meal_type: "desayuno" | "comida" | "cena";
  dish_name: string;
  is_special?: boolean;
  special_kcal_reserved?: number;
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
  special_kcal_reserved?: number;
  regular_kcal?: number;
  kcal_delta: number;
  protein_delta_g: number;
  all_special_day?: boolean;
  low_regular_budget_warning?: boolean;
};

type RotatingDay = {
  day_number: number;
  day_date: string;
  meals: RotatingMeal[];
  profile_totals: DayProfileTotal[];
};

type MenuGenerationLog = {
  id: string;
  job_id: string;
  level: "debug" | "info" | "warn" | "error";
  step: string;
  message: string;
  metadata?: Record<string, any> | null;
  created_at: string;
};

const supabase = useSupabase();
const { loadCurrentUser } = useCurrentUser();

const name = ref("Menú rotativo");
const days = ref(30);
const specialMealKcal = ref(700);
const startDate = ref(new Date().toISOString().split("T")[0]);
const menus = ref<WeeklyMenu[]>([]);
const profiles = ref<PersonProfile[]>([]);
const selectedMenuIds = ref<string[]>([]);
const selectedProfileIds = ref<string[]>([]);
const generatedDays = ref<RotatingDay[]>([]);
const profilesSummary = ref<RotatingProfileTarget[]>([]);
const shoppingItemsCreated = ref<number | null>(null);
const currentJob = ref<{
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  current_step?: string | null;
  error_message?: string | null;
  result_menu_id?: string | null;
} | null>(null);
const jobChannel = ref<any>(null);
const generationLogs = ref<MenuGenerationLog[]>([]);
const loading = ref(false);
const error = ref("");
const notificationMessage = ref("");
const notificationLevel = ref<"success" | "error">("success");

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

const hasLogMetadata = (log: MenuGenerationLog) => {
  const metadata = log.metadata || {};
  return Object.keys(metadata).some(
    (key) => !["timestamp", "status"].includes(key),
  );
};

const appendGenerationLog = (log: MenuGenerationLog) => {
  if (generationLogs.value.some((item) => item.id === log.id)) return;
  generationLogs.value = [...generationLogs.value, log].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
};

const statusLabel = (status: string) => {
  if (status === "pending") return "Pendiente";
  if (status === "processing") return "Procesando";
  if (status === "completed") return "Completado";
  return "Error";
};

const statusPillClass = (status: string) => {
  if (status === "completed") return "bg-emerald-900 text-emerald-200";
  if (status === "failed") return "bg-red-900 text-red-200";
  return "bg-amber-900 text-amber-200";
};

const levelClass = (level: string) => {
  if (level === "error") return "bg-red-900 text-red-100";
  if (level === "warn") return "bg-amber-900 text-amber-100";
  if (level === "debug") return "bg-zinc-700 text-zinc-100";
  return "bg-sky-900 text-sky-100";
};

const stepLabel = (step: string) =>
  ({
    job_created: "Job creado",
    job_deduplicated: "Job reutilizado",
    job_start: "Inicio del job",
    input_validation: "Validación de entrada",
    read_profiles: "Lectura de perfiles",
    target_kcal: "Cálculo kcal objetivo",
    macro_targets: "Cálculo de macros",
    recipe_selection: "Selección de recetas",
    recipe_validation: "Validación de recetas",
    quantity_calculation: "Cálculo de cantidades",
    profile_scaling: "Escalado por perfil",
    special_meals: "Comidas libres",
    macro_validation: "Validación de macros",
    save_supabase: "Guardado en Supabase",
    shopping_list: "Lista de la compra",
    generation_completed: "Generación completada",
    job_completed: "Job completado",
    job_failed: "Error del job",
  })[step] || step;

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
  selectedProfileIds.value = (profilesData || []).map((profile) => profile.id);

  if ((profilesData || []).length === 0) {
    error.value = "Necesitas crear al menos un perfil en Config antes de generar.";
  }
};


const generateRotatingMenu = async () => {
  error.value = "";
  notificationMessage.value = "";
  shoppingItemsCreated.value = null;
  loading.value = true;

  try {
    const currentUser = await loadCurrentUser();
    if (!currentUser) throw new Error("Usuario no disponible");
    if (selectedMenuIds.value.length === 0) {
      throw new Error("Selecciona al menos un menú fuente");
    }
    if (selectedProfileIds.value.length === 0) {
      throw new Error("Selecciona al menos un perfil");
    }

    const response = await $fetch<{
      success: boolean;
      job: {
        id: string;
        status: "pending" | "processing" | "completed" | "failed";
        progress: number;
        current_step?: string | null;
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
        specialMealKcal: Math.max(0, Math.min(2000, Number(specialMealKcal.value) || 700)),
      },
    });

    if (!response.success) {
      throw new Error("No se pudo generar el menú rotativo");
    }

    currentJob.value = {
      id: response.job.id,
      status: response.job.status,
      progress: Number(response.job.progress || 0),
      current_step: response.job.current_step || "job_created",
    };
    subscribeToJob(response.job.id);
  } catch (err) {
    const maybeErr = err as
      | (Error & { data?: any })
      | { data?: any; message?: string };
    const uncured =
      maybeErr?.data?.uncured_recipes ||
      maybeErr?.data?.data?.uncured_recipes;
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
      lines.push(
        `- ${mealLabel(meal.meal_type)}: ${meal.dish_name}${
          meal.is_special ? ` [libre ${meal.special_kcal_reserved ?? specialMealKcal.value} kcal]` : ""
        }`,
      );
      if (meal.is_special) {
        lines.push("  · Sin ingredientes ni lista de la compra");
        continue;
      }
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
    current_step: data.current_step,
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
  await loadGenerationLogs(jobId);
};

const loadGenerationLogs = async (jobId: string) => {
  const { data } = await supabase
    .from("menu_generation_logs")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: true })
    .limit(300);
  generationLogs.value = ((data || []) as MenuGenerationLog[]).sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
};

const subscribeToJob = (jobId: string) => {
  if (jobChannel.value) {
    supabase.removeChannel(jobChannel.value);
  }
  generationLogs.value = [];
  loadGenerationLogs(jobId);
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
          current_step: next.current_step,
          error_message: next.error_message,
          result_menu_id: next.result_menu_id,
        };
        if (next.status === "completed") {
          notificationLevel.value = "success";
          notificationMessage.value = "Menú rotativo generado correctamente.";
          await hydrateFromJobResult(jobId);
        } else if (next.status === "failed") {
          notificationLevel.value = "error";
          notificationMessage.value =
            next.error_message || "La generación del menú ha fallado.";
        }
      },
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "menu_generation_logs",
        filter: `job_id=eq.${jobId}`,
      },
      (payload: any) => {
        appendGenerationLog(payload.new as MenuGenerationLog);
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

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

onMounted(loadBaseData);
onUnmounted(() => {
  if (jobChannel.value) {
    supabase.removeChannel(jobChannel.value);
    jobChannel.value = null;
  }
});
</script>
