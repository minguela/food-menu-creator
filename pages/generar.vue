<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Menú rotativo</h1>
        <p class="text-sm text-gray-500">
          Genera menús guardables con ajuste nutricional y cantidades reales.
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
            >Perfil</span
          >
          <select
            v-model="selectedProfileId"
            class="w-full border rounded-lg px-3 py-2"
          >
            <option value="">Objetivo global del usuario</option>
            <option
              v-for="profile in profiles"
              :key="profile.id"
              :value="profile.id"
            >
              {{ profile.name }}
            </option>
          </select>
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

        <label>
          <span class="block text-sm font-medium text-gray-700 mb-1"
            >Personas</span
          >
          <input
            v-model.number="personsCount"
            type="number"
            min="1"
            max="12"
            class="w-full border rounded-lg px-3 py-2"
          />
        </label>
      </div>

      <div class="mt-4">
        <p class="text-sm font-medium text-gray-700 mb-2">Menús fuente</p>
        <div class="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          <label
            v-for="menu in menus"
            :key="menu.id"
            class="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm"
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
      <h2 class="font-semibold text-gray-900 mb-3">Resultado</h2>
      <div class="grid gap-3 md:grid-cols-2">
        <article
          v-for="day in generatedDays"
          :key="day.day_number"
          class="border rounded-lg p-3"
        >
          <div class="flex items-center justify-between mb-2">
            <p class="font-medium text-gray-900">
              Día {{ day.day_number }} · {{ formatDate(day.day_date) }}
            </p>
            <button
              type="button"
              class="text-xs text-indigo-700 hover:text-indigo-900"
              @click="regenerateDay(day.day_number)"
            >
              Regenerar día
            </button>
          </div>
          <div class="space-y-1 text-sm">
            <p v-for="meal in day.meals" :key="meal.meal_type">
              <strong>{{ mealLabel(meal.meal_type) }}:</strong>
              {{ meal.dish_name }}
              <span class="text-gray-500">
                (x{{ meal.serving_multiplier.toFixed(2) }},
                {{ Math.round(meal.final_kcal) }} kcal,
                {{ Number(meal.final_protein_g).toFixed(1) }}g P)
              </span>
            </p>
            <p class="text-xs text-gray-500 pt-1">
              Total día: {{ Math.round(day.total_kcal) }} kcal ·
              {{ Number(day.total_protein_g).toFixed(1) }}g P
            </p>
          </div>
        </article>
      </div>
    </section>

    <section class="bg-white rounded-lg border p-4">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-semibold text-gray-900">Rotativos guardados</h2>
        <button
          class="text-sm text-indigo-700 hover:text-indigo-900"
          @click="loadRotatingMenus"
        >
          Actualizar
        </button>
      </div>
      <div v-if="rotatingMenus.length === 0" class="text-sm text-gray-500">
        Aún no hay menús rotativos guardados.
      </div>
      <div v-else class="space-y-2">
        <article
          v-for="menu in rotatingMenus"
          :key="menu.id"
          class="flex flex-wrap items-center justify-between gap-2 border rounded-lg px-3 py-2"
        >
          <div class="text-sm">
            <p class="font-medium text-gray-900">{{ menu.name }}</p>
            <p class="text-gray-500">
              {{ menu.duration_days }} días · {{ menu.target_kcal }} kcal
              objetivo
            </p>
          </div>
          <div class="flex gap-2">
            <button
              class="text-sm text-indigo-700"
              @click="openRotating(menu.id)"
            >
              Abrir
            </button>
            <button
              class="text-sm text-emerald-700"
              @click="generateShoppingFromRotating(menu.id)"
            >
              Lista compra
            </button>
            <button
              class="text-sm text-amber-700"
              @click="duplicateRotating(menu.id)"
            >
              Duplicar
            </button>
            <button
              class="text-sm text-red-700"
              @click="deleteRotating(menu.id)"
            >
              Eliminar
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { macroTargetsFromCalories } from "~/utils/nutrition.js";
import { convertToGrams } from "~/utils/shopping-conversions.js";
import { logError } from "~/utils/log-error";
import type { PersonProfile, RotatingMenu, WeeklyMenu } from "~/types";

type RotatingMeal = {
  meal_type: "desayuno" | "comida" | "cena";
  dish_name: string;
  dish_description?: string | null;
  serving_multiplier: number;
  final_kcal: number;
  final_protein_g: number;
  final_carbs_g: number;
  final_fat_g: number;
  ingredients: Array<{
    name: string;
    base_quantity: number;
    final_quantity: number;
    unit_type: string;
  }>;
  source_weekly_meal_id?: string | null;
};

type RotatingDay = {
  day_number: number;
  day_date: string;
  meals: RotatingMeal[];
  total_kcal: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
};

const supabase = useSupabase();
const { loadCurrentUser } = useCurrentUser();

const name = ref("Menú rotativo");
const days = ref(30);
const startDate = ref(new Date().toISOString().split("T")[0]);
const personsCount = ref(1);
const selectedProfileId = ref("");
const menus = ref<WeeklyMenu[]>([]);
const profiles = ref<PersonProfile[]>([]);
const selectedMenuIds = ref<string[]>([]);
const rotatingMenus = ref<RotatingMenu[]>([]);
const generatedDays = ref<RotatingDay[]>([]);
const loading = ref(false);
const error = ref("");
const currentRotatingId = ref<string | null>(null);

const mealLabel = (mealType: string) =>
  mealType === "desayuno"
    ? "Desayuno"
    : mealType === "comida"
      ? "Comida"
      : "Cena";

const loadBaseData = async () => {
  const currentUser = await loadCurrentUser();
  if (!currentUser) return;
  personsCount.value = currentUser.persons_count || 1;

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
  await loadRotatingMenus();
};

const getProfileTargets = async () => {
  const currentUser = await loadCurrentUser();
  if (!currentUser) throw new Error("Usuario no disponible");

  const profile = profiles.value.find(
    (item) => item.id === selectedProfileId.value,
  );
  const kcal = profile?.daily_kcal_target || currentUser.daily_kcal_target;
  const fatPct = profile?.fat_pct_target ?? currentUser.fat_pct_target;
  const carbsPct = profile?.carbs_pct_target ?? currentUser.carbs_pct_target;
  const macroTargets = macroTargetsFromCalories(kcal, {
    fatPct,
    carbsPct,
  });
  return {
    kcal,
    protein_g: macroTargets.protein_g,
    carbs_g: macroTargets.carbs_g,
    fat_g: macroTargets.fat_g,
  };
};

const generateRotatingMenu = async () => {
  error.value = "";
  loading.value = true;
  try {
    if (selectedMenuIds.value.length === 0) {
      throw new Error("Selecciona al menos un menú fuente");
    }
    const targetDays = Math.min(90, Math.max(1, Number(days.value) || 7));
    const targets = await getProfileTargets();
    const library = await buildMealLibrary(selectedMenuIds.value);
    const result = buildRotatingDays({
      targetDays,
      startDate: startDate.value,
      library,
      targets,
      personsCount: Math.max(1, Number(personsCount.value) || 1),
    });
    const rotatingId = await persistRotatingMenu(result, targets);
    currentRotatingId.value = rotatingId;
    generatedDays.value = result;
    await loadRotatingMenus();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Error generando menú";
    await logError("web", err, { context: "generar.generateRotatingMenu" });
  } finally {
    loading.value = false;
  }
};

const buildMealLibrary = async (weeklyMenuIds: string[]) => {
  const { data, error: queryError } = await supabase
    .from("weekly_meals")
    .select(
      "id, meal_type, dish_name, dish_description, kcal, protein_g, carbs_g, fat_g, weekly_meal_ingredients(*)",
    )
    .in("weekly_menu_id", weeklyMenuIds)
    .order("day_number", { ascending: true });
  if (queryError) throw new Error(queryError.message);

  const grouped: Record<string, any[]> = {
    desayuno: [],
    comida: [],
    cena: [],
  };
  for (const item of data || []) {
    if (!grouped[item.meal_type]) continue;
    grouped[item.meal_type].push(item);
  }
  for (const type of ["desayuno", "comida", "cena"]) {
    if (grouped[type].length === 0) {
      throw new Error(`No hay platos suficientes para ${type}`);
    }
  }
  return grouped;
};

const buildRotatingDays = ({
  targetDays,
  startDate,
  library,
  targets,
  personsCount,
}: {
  targetDays: number;
  startDate: string;
  library: Record<string, any[]>;
  targets: { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
  personsCount: number;
}) => {
  const shares = {
    desayuno: { kcal: 0.25, protein: 0.3 },
    comida: { kcal: 0.4, protein: 0.4 },
    cena: { kcal: 0.35, protein: 0.3 },
  };
  const daysResult: RotatingDay[] = [];
  const lastByType: Record<string, string> = {};
  const mealTypes: Array<"desayuno" | "comida" | "cena"> = [
    "desayuno",
    "comida",
    "cena",
  ];

  for (let day = 1; day <= targetDays; day++) {
    const meals: RotatingMeal[] = [];
    for (const type of mealTypes) {
      const options = library[type];
      let pickIndex = (day - 1) % options.length;
      if (
        options.length > 1 &&
        options[pickIndex].dish_name === lastByType[type]
      ) {
        pickIndex = (pickIndex + 1) % options.length;
      }
      const picked = options[pickIndex];
      lastByType[type] = picked.dish_name;

      const targetMealKcal = targets.kcal * shares[type].kcal;
      const targetMealProtein = targets.protein_g * shares[type].protein;
      const baseKcal = Math.max(1, Number(picked.kcal) || 1);
      const baseProtein = Math.max(1, Number(picked.protein_g) || 1);
      const kcalFactor = targetMealKcal / baseKcal;
      const proteinFactor = targetMealProtein / baseProtein;
      const multiplier = Math.max(
        0.6,
        Math.min(
          2.4,
          (kcalFactor * 0.65 + proteinFactor * 0.35) * personsCount,
        ),
      );

      const ingredients = (picked.weekly_meal_ingredients || []).map(
        (ingredient: any) => ({
          name: ingredient.name,
          base_quantity: Number(ingredient.quantity) || 0,
          final_quantity: round(
            (Number(ingredient.quantity) || 0) * multiplier,
          ),
          unit_type: ingredient.unit_type,
        }),
      );

      meals.push({
        meal_type: type,
        dish_name: picked.dish_name,
        dish_description: picked.dish_description || null,
        serving_multiplier: round(multiplier, 3),
        final_kcal: Math.round((Number(picked.kcal) || 0) * multiplier),
        final_protein_g: round((Number(picked.protein_g) || 0) * multiplier),
        final_carbs_g: round((Number(picked.carbs_g) || 0) * multiplier),
        final_fat_g: round((Number(picked.fat_g) || 0) * multiplier),
        ingredients,
        source_weekly_meal_id: picked.id,
      });
    }

    const date = new Date(startDate);
    date.setDate(date.getDate() + day - 1);
    daysResult.push({
      day_number: day,
      day_date: date.toISOString().split("T")[0],
      meals,
      total_kcal: meals.reduce((sum, meal) => sum + meal.final_kcal, 0),
      total_protein_g: round(
        meals.reduce((sum, meal) => sum + meal.final_protein_g, 0),
      ),
      total_carbs_g: round(
        meals.reduce((sum, meal) => sum + meal.final_carbs_g, 0),
      ),
      total_fat_g: round(
        meals.reduce((sum, meal) => sum + meal.final_fat_g, 0),
      ),
    });
  }
  return daysResult;
};

const persistRotatingMenu = async (
  result: RotatingDay[],
  targets: { kcal: number; protein_g: number; carbs_g: number; fat_g: number },
) => {
  const currentUser = await loadCurrentUser();
  if (!currentUser) throw new Error("Usuario no disponible");

  const { data: rotating, error: rotatingError } = await supabase
    .from("rotating_menus")
    .insert({
      user_id: currentUser.id,
      profile_id: selectedProfileId.value || null,
      name: name.value.trim() || "Menú rotativo",
      source_weekly_menu_ids: selectedMenuIds.value,
      duration_days: result.length,
      persons_count: personsCount.value,
      target_kcal: targets.kcal,
      target_protein_g: targets.protein_g,
      target_carbs_g: targets.carbs_g,
      target_fat_g: targets.fat_g,
    })
    .select("id")
    .single();
  if (rotatingError || !rotating)
    throw new Error(rotatingError?.message || "Error creando rotativo");

  for (const day of result) {
    const { data: dayRow, error: dayError } = await supabase
      .from("rotating_menu_days")
      .insert({
        rotating_menu_id: rotating.id,
        day_number: day.day_number,
        day_date: day.day_date,
        total_kcal: day.total_kcal,
        total_protein_g: day.total_protein_g,
        total_carbs_g: day.total_carbs_g,
        total_fat_g: day.total_fat_g,
      })
      .select("id")
      .single();
    if (dayError || !dayRow)
      throw new Error(
        dayError?.message || `Error guardando día ${day.day_number}`,
      );

    for (const meal of day.meals) {
      const { data: mealRow, error: mealError } = await supabase
        .from("rotating_menu_meals")
        .insert({
          rotating_menu_day_id: dayRow.id,
          meal_type: meal.meal_type,
          source_weekly_meal_id: meal.source_weekly_meal_id || null,
          dish_name: meal.dish_name,
          dish_description: meal.dish_description || null,
          base_servings: 1,
          serving_multiplier: meal.serving_multiplier,
          final_kcal: meal.final_kcal,
          final_protein_g: meal.final_protein_g,
          final_carbs_g: meal.final_carbs_g,
          final_fat_g: meal.final_fat_g,
        })
        .select("id")
        .single();
      if (mealError || !mealRow) {
        throw new Error(mealError?.message || "Error guardando meal rotativo");
      }

      const ingredientRows = meal.ingredients
        .filter(
          (ingredient) => ingredient.name && ingredient.final_quantity > 0,
        )
        .map((ingredient) => ({
          rotating_menu_meal_id: mealRow.id,
          name: ingredient.name.toLowerCase(),
          base_quantity: ingredient.base_quantity,
          final_quantity: ingredient.final_quantity,
          unit_type: ingredient.unit_type,
        }));
      if (ingredientRows.length > 0) {
        const { error: ingredientsError } = await supabase
          .from("rotating_menu_meal_ingredients")
          .insert(ingredientRows);
        if (ingredientsError) throw new Error(ingredientsError.message);
      }
    }
  }
  return rotating.id as string;
};

const loadRotatingMenus = async () => {
  const currentUser = await loadCurrentUser();
  if (!currentUser) return;
  const { data } = await supabase
    .from("rotating_menus")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });
  rotatingMenus.value = (data || []) as RotatingMenu[];
};

const openRotating = async (rotatingMenuId: string) => {
  const { data: daysData } = await supabase
    .from("rotating_menu_days")
    .select(
      "id, day_number, day_date, total_kcal, total_protein_g, total_carbs_g, total_fat_g, rotating_menu_meals(*, rotating_menu_meal_ingredients(*))",
    )
    .eq("rotating_menu_id", rotatingMenuId)
    .order("day_number", { ascending: true });

  generatedDays.value = (daysData || []).map((day: any) => ({
    day_number: day.day_number,
    day_date: day.day_date,
    total_kcal: day.total_kcal,
    total_protein_g: day.total_protein_g,
    total_carbs_g: day.total_carbs_g,
    total_fat_g: day.total_fat_g,
    meals: (day.rotating_menu_meals || []).map((meal: any) => ({
      meal_type: meal.meal_type,
      dish_name: meal.dish_name,
      dish_description: meal.dish_description,
      serving_multiplier: Number(meal.serving_multiplier) || 1,
      final_kcal: Number(meal.final_kcal) || 0,
      final_protein_g: Number(meal.final_protein_g) || 0,
      final_carbs_g: Number(meal.final_carbs_g) || 0,
      final_fat_g: Number(meal.final_fat_g) || 0,
      ingredients: (meal.rotating_menu_meal_ingredients || []).map(
        (ingredient: any) => ({
          name: ingredient.name,
          base_quantity: Number(ingredient.base_quantity) || 0,
          final_quantity: Number(ingredient.final_quantity) || 0,
          unit_type: ingredient.unit_type,
        }),
      ),
    })),
  }));
  currentRotatingId.value = rotatingMenuId;
};

const regenerateDay = async (dayNumber: number) => {
  const day = generatedDays.value.find((item) => item.day_number === dayNumber);
  if (!day) return;
  const targets = await getProfileTargets();
  const library = await buildMealLibrary(selectedMenuIds.value);
  const replacement = buildRotatingDays({
    targetDays: 1,
    startDate: day.day_date,
    library,
    targets,
    personsCount: personsCount.value,
  })[0];
  const index = generatedDays.value.findIndex(
    (item) => item.day_number === dayNumber,
  );
  generatedDays.value[index] = {
    ...replacement,
    day_number: dayNumber,
  };
};

const generateShoppingFromRotating = async (rotatingMenuId: string) => {
  const currentUser = await loadCurrentUser();
  if (!currentUser) return;
  const { data: meals } = await supabase
    .from("rotating_menu_meals")
    .select("id, rotating_menu_day_id, rotating_menu_meal_ingredients(*)")
    .in(
      "rotating_menu_day_id",
      (
        await supabase
          .from("rotating_menu_days")
          .select("id")
          .eq("rotating_menu_id", rotatingMenuId)
      ).data?.map((d: any) => d.id) || [],
    );

  const consolidated: Record<
    string,
    {
      item_name: string;
      quantity_grams: number;
      conversion_status: string;
      conversion_note: string;
    }
  > = {};
  for (const meal of meals || []) {
    for (const ingredient of meal.rotating_menu_meal_ingredients || []) {
      const conversion = convertToGrams({
        name: ingredient.name,
        quantity: ingredient.final_quantity,
        unitType: ingredient.unit_type,
      });
      const key = `${ingredient.name.toLowerCase()}::${ingredient.unit_type}`;
      if (!consolidated[key]) {
        consolidated[key] = {
          item_name: ingredient.name,
          quantity_grams: 0,
          conversion_status: conversion.status,
          conversion_note: conversion.note,
        };
      }
      consolidated[key].quantity_grams += conversion.grams;
    }
  }

  const weekStart = new Date().toISOString().split("T")[0];
  await supabase
    .from("shopping_lists")
    .delete()
    .eq("user_id", currentUser.id)
    .eq("week_start", weekStart);
  const rows = Object.values(consolidated).map((item) => ({
    user_id: currentUser.id,
    week_start: weekStart,
    item_name: item.item_name,
    quantity_needed: round(item.quantity_grams),
    quantity_grams: round(item.quantity_grams),
    original_quantity: round(item.quantity_grams),
    original_unit_type: "g",
    conversion_status: item.conversion_status,
    conversion_note: item.conversion_note || "Generado desde menú rotativo",
    is_extra: true,
    purchased: false,
    estimated_price: 0,
  }));
  if (rows.length > 0) {
    await supabase.from("shopping_lists").insert(rows);
  }
  alert("Lista de compra generada desde el menú rotativo.");
};

const duplicateRotating = async (rotatingMenuId: string) => {
  const base = rotatingMenus.value.find((menu) => menu.id === rotatingMenuId);
  if (!base) return;
  await openRotating(rotatingMenuId);
  name.value = `${base.name} (copia)`;
  await generateRotatingMenu();
};

const deleteRotating = async (rotatingMenuId: string) => {
  if (!confirm("¿Eliminar este menú rotativo?")) return;
  await supabase.from("rotating_menus").delete().eq("id", rotatingMenuId);
  await loadRotatingMenus();
  if (currentRotatingId.value === rotatingMenuId) {
    currentRotatingId.value = null;
    generatedDays.value = [];
  }
};

const copySummary = async () => {
  const lines = generatedDays.value.flatMap((day) => [
    `Día ${day.day_number} (${day.day_date})`,
    ...day.meals.map(
      (meal) =>
        `- ${mealLabel(meal.meal_type)}: ${meal.dish_name} x${meal.serving_multiplier.toFixed(2)} (${Math.round(meal.final_kcal)} kcal, ${Number(meal.final_protein_g).toFixed(1)}g P)`,
    ),
    `  Total: ${Math.round(day.total_kcal)} kcal · ${Number(day.total_protein_g).toFixed(1)}g P`,
    "",
  ]);
  await navigator.clipboard.writeText(lines.join("\n"));
  alert("Resumen copiado.");
};

const printMenu = () => window.print();

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const round = (value: number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

onMounted(loadBaseData);
</script>
