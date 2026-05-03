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
import { macroTargetsFromCalories } from "~/utils/nutrition.js";
import { logError } from "~/utils/log-error";
import type { PersonProfile, WeeklyMenu } from "~/types";

type ProfileTarget = {
  profile_key: string;
  profile_id: string | null;
  profile_name: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

type ProfilePortion = {
  profile_key: string;
  profile_id: string | null;
  profile_name: string;
  serving_multiplier: number;
  final_kcal: number;
  final_protein_g: number;
  final_carbs_g: number;
  final_fat_g: number;
  nutrition_pending: boolean;
  ingredients: Array<{
    name: string;
    base_quantity: number;
    final_quantity: number;
    unit_type: string;
    nutrition_pending: boolean;
  }>;
};

type RotatingMeal = {
  meal_type: "desayuno" | "comida" | "cena";
  source_weekly_meal_id: string | null;
  dish_name: string;
  dish_description?: string | null;
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

const buildProfileTargets = async (): Promise<ProfileTarget[]> => {
  const currentUser = await loadCurrentUser();
  if (!currentUser) throw new Error("Usuario no disponible");

  const selectedProfiles = profiles.value.filter((profile) =>
    selectedProfileIds.value.includes(profile.id),
  );
  const targets: ProfileTarget[] = selectedProfiles.map((profile) => {
    const macroTargets = macroTargetsFromCalories(profile.daily_kcal_target, {
      fatPct: profile.fat_pct_target,
      carbsPct: profile.carbs_pct_target,
    });
    return {
      profile_key: profile.id,
      profile_id: profile.id,
      profile_name: profile.name,
      kcal: profile.daily_kcal_target,
      protein_g: macroTargets.protein_g,
      carbs_g: macroTargets.carbs_g,
      fat_g: macroTargets.fat_g,
    };
  });

  if (useGlobalProfileFallback.value) {
    const globalMacros = macroTargetsFromCalories(
      currentUser.daily_kcal_target,
      {
        fatPct: currentUser.fat_pct_target,
        carbsPct: currentUser.carbs_pct_target,
      },
    );
    targets.push({
      profile_key: "global",
      profile_id: null,
      profile_name: "Perfil global",
      kcal: currentUser.daily_kcal_target,
      protein_g: globalMacros.protein_g,
      carbs_g: globalMacros.carbs_g,
      fat_g: globalMacros.fat_g,
    });
  }

  if (targets.length === 0) {
    throw new Error("Selecciona al menos un perfil o activa el perfil global");
  }

  return targets;
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
  for (const row of data || []) {
    if (grouped[row.meal_type]) grouped[row.meal_type].push(row);
  }
  return grouped;
};

const fetchIngredientNutrition = async (ingredientNames: string[]) => {
  if (ingredientNames.length === 0) return new Map<string, any>();
  const { data } = await supabase
    .from("ingredients")
    .select(
      "name, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g",
    )
    .in(
      "name",
      ingredientNames.map((name) => name.toLowerCase()),
    );
  return new Map(
    (data || []).map((item: any) => [item.name.toLowerCase(), item]),
  );
};

const calculateFromIngredients = (
  ingredients: Array<{ name: string; quantity: number; unit_type: string }>,
  nutritionMap: Map<string, any>,
  multiplier: number,
) => {
  let kcal = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let pending = false;

  for (const ingredient of ingredients) {
    const key = ingredient.name.toLowerCase();
    const data = nutritionMap.get(key);
    const finalQuantity = Number(ingredient.quantity || 0) * multiplier;
    const grams = normalizeToGrams(finalQuantity, ingredient.unit_type);
    if (!data || grams === null) {
      pending = true;
      continue;
    }
    const factor = grams / 100;
    if (
      data.kcal_per_100g == null ||
      data.protein_per_100g == null ||
      data.carbs_per_100g == null ||
      data.fat_per_100g == null
    ) {
      pending = true;
      continue;
    }
    kcal += Number(data.kcal_per_100g) * factor;
    protein += Number(data.protein_per_100g) * factor;
    carbs += Number(data.carbs_per_100g) * factor;
    fat += Number(data.fat_per_100g) * factor;
  }

  return {
    kcal: Math.round(kcal),
    protein_g: round(protein),
    carbs_g: round(carbs),
    fat_g: round(fat),
    pending,
  };
};

const normalizeToGrams = (
  quantity: number,
  unitType: string,
): number | null => {
  if (!Number.isFinite(quantity) || quantity <= 0) return 0;
  if (unitType === "g") return quantity;
  if (unitType === "kg") return quantity * 1000;
  if (unitType === "ml") return quantity;
  if (unitType === "l") return quantity * 1000;
  return null;
};

const buildRotatingDays = async ({
  targetDays,
  library,
  profileTargets,
}: {
  targetDays: number;
  library: Record<string, any[]>;
  profileTargets: ProfileTarget[];
}) => {
  const allIngredientNames = new Set<string>();
  for (const mealType of ["desayuno", "comida", "cena"]) {
    for (const meal of library[mealType] || []) {
      for (const ingredient of meal.weekly_meal_ingredients || []) {
        allIngredientNames.add(String(ingredient.name || "").toLowerCase());
      }
    }
  }
  const nutritionMap = await fetchIngredientNutrition(
    [...allIngredientNames].filter(Boolean),
  );

  const shares = {
    desayuno: { kcal: 0.25, protein: 0.3 },
    comida: { kcal: 0.4, protein: 0.4 },
    cena: { kcal: 0.35, protein: 0.3 },
  };
  const lastByType: Record<string, string> = {};
  const result: RotatingDay[] = [];

  for (let day = 1; day <= targetDays; day++) {
    const dayDate = new Date(startDate.value);
    dayDate.setDate(dayDate.getDate() + day - 1);
    const meals: RotatingMeal[] = [];

    for (const mealType of ["desayuno", "comida", "cena"] as const) {
      const options = library[mealType] || [];
      if (options.length === 0) continue;
      let pickIndex = (day - 1) % options.length;
      if (
        options.length > 1 &&
        options[pickIndex].dish_name === lastByType[mealType]
      ) {
        pickIndex = (pickIndex + 1) % options.length;
      }
      const picked = options[pickIndex];
      lastByType[mealType] = picked.dish_name;

      const baseKcal = Math.max(1, Number(picked.kcal) || 1);
      const baseProtein = Math.max(1, Number(picked.protein_g) || 1);
      const ingredientBase: Array<{
        name: string;
        quantity: number;
        unit_type: string;
      }> = (picked.weekly_meal_ingredients || []).map((ingredient: any) => ({
        name: ingredient.name,
        quantity: Number(ingredient.quantity) || 0,
        unit_type: ingredient.unit_type,
      }));

      const profilePortions: ProfilePortion[] = profileTargets.map((target) => {
        const targetMealKcal = target.kcal * shares[mealType].kcal;
        const targetMealProtein = target.protein_g * shares[mealType].protein;
        const multiplier = Math.max(
          0.55,
          Math.min(
            2.5,
            (targetMealKcal / baseKcal) * 0.65 +
              (targetMealProtein / baseProtein) * 0.35,
          ),
        );

        const ingredients = ingredientBase.map((ingredient) => ({
          name: ingredient.name,
          base_quantity: ingredient.quantity,
          final_quantity: round(ingredient.quantity * multiplier),
          unit_type: ingredient.unit_type,
          nutrition_pending: false,
        }));

        const nutrition = calculateFromIngredients(
          ingredientBase,
          nutritionMap,
          multiplier,
        );

        for (const ingredient of ingredients) {
          const n = nutritionMap.get(String(ingredient.name).toLowerCase());
          if (
            !n ||
            normalizeToGrams(
              ingredient.final_quantity,
              ingredient.unit_type,
            ) === null
          ) {
            ingredient.nutrition_pending = true;
          } else if (
            n.kcal_per_100g == null ||
            n.protein_per_100g == null ||
            n.carbs_per_100g == null ||
            n.fat_per_100g == null
          ) {
            ingredient.nutrition_pending = true;
          }
        }

        return {
          profile_key: target.profile_key,
          profile_id: target.profile_id,
          profile_name: target.profile_name,
          serving_multiplier: round(multiplier, 3),
          final_kcal: nutrition.kcal,
          final_protein_g: nutrition.protein_g,
          final_carbs_g: nutrition.carbs_g,
          final_fat_g: nutrition.fat_g,
          nutrition_pending: nutrition.pending,
          ingredients,
        };
      });

      meals.push({
        meal_type: mealType,
        source_weekly_meal_id: picked.id || null,
        dish_name: picked.dish_name,
        dish_description: picked.dish_description || null,
        profile_portions: profilePortions,
      });
    }

    result.push({
      day_number: day,
      day_date: dayDate.toISOString().split("T")[0],
      meals,
    });
  }
  return result;
};

const generateRotatingMenu = async () => {
  error.value = "";
  loading.value = true;
  try {
    if (selectedMenuIds.value.length === 0) {
      throw new Error("Selecciona al menos un menú fuente");
    }
    const profileTargets = await buildProfileTargets();
    const library = await buildMealLibrary(selectedMenuIds.value);
    const targetDays = Math.min(90, Math.max(1, Number(days.value) || 7));
    const result = await buildRotatingDays({
      targetDays,
      library,
      profileTargets,
    });
    await persistRotatingMenu(result, profileTargets);
    generatedDays.value = result;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Error generando menú";
    await logError("web", err, {
      context: "generar.generateRotatingMenuMultiProfile",
    });
  } finally {
    loading.value = false;
  }
};

const persistRotatingMenu = async (
  daysData: RotatingDay[],
  profileTargets: ProfileTarget[],
) => {
  const currentUser = await loadCurrentUser();
  if (!currentUser) throw new Error("Usuario no disponible");

  const totalTargets = profileTargets.reduce(
    (totals, profile) => ({
      kcal: totals.kcal + profile.kcal,
      protein: totals.protein + profile.protein_g,
      carbs: totals.carbs + profile.carbs_g,
      fat: totals.fat + profile.fat_g,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const { data: rotating, error: rotatingError } = await supabase
    .from("rotating_menus")
    .insert({
      user_id: currentUser.id,
      profile_id:
        profileTargets.find((item) => item.profile_id)?.profile_id || null,
      name: name.value.trim() || "Menú rotativo",
      source_weekly_menu_ids: selectedMenuIds.value,
      duration_days: daysData.length,
      persons_count: profileTargets.length,
      target_kcal: Math.round(totalTargets.kcal),
      target_protein_g: round(totalTargets.protein),
      target_carbs_g: round(totalTargets.carbs),
      target_fat_g: round(totalTargets.fat),
    })
    .select("id")
    .single();

  if (rotatingError || !rotating) {
    throw new Error(rotatingError?.message || "Error guardando menú rotativo");
  }

  const realProfiles = profileTargets.filter((item) => item.profile_id);
  if (realProfiles.length > 0) {
    const { error: profilesError } = await supabase
      .from("rotating_menu_profiles")
      .insert(
        realProfiles.map((profile) => ({
          rotating_menu_id: rotating.id,
          profile_id: profile.profile_id,
          target_kcal: Math.round(profile.kcal),
          target_protein_g: profile.protein_g,
          target_carbs_g: profile.carbs_g,
          target_fat_g: profile.fat_g,
        })),
      );
    if (profilesError) throw new Error(profilesError.message);
  }

  for (const day of daysData) {
    const totals = day.meals.reduce(
      (acc, meal) => {
        for (const portion of meal.profile_portions) {
          acc.kcal += portion.final_kcal;
          acc.protein += portion.final_protein_g;
          acc.carbs += portion.final_carbs_g;
          acc.fat += portion.final_fat_g;
        }
        return acc;
      },
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    );

    const { data: dayRow, error: dayError } = await supabase
      .from("rotating_menu_days")
      .insert({
        rotating_menu_id: rotating.id,
        day_number: day.day_number,
        day_date: day.day_date,
        total_kcal: Math.round(totals.kcal),
        total_protein_g: round(totals.protein),
        total_carbs_g: round(totals.carbs),
        total_fat_g: round(totals.fat),
      })
      .select("id")
      .single();
    if (dayError || !dayRow)
      throw new Error(dayError?.message || "Error guardando día");

    for (const meal of day.meals) {
      const fallback = meal.profile_portions[0];
      const { data: mealRow, error: mealError } = await supabase
        .from("rotating_menu_meals")
        .insert({
          rotating_menu_day_id: dayRow.id,
          meal_type: meal.meal_type,
          source_weekly_meal_id: meal.source_weekly_meal_id,
          dish_name: meal.dish_name,
          dish_description: meal.dish_description || null,
          base_servings: 1,
          serving_multiplier: fallback?.serving_multiplier || 1,
          final_kcal: fallback?.final_kcal || 0,
          final_protein_g: fallback?.final_protein_g || 0,
          final_carbs_g: fallback?.final_carbs_g || 0,
          final_fat_g: fallback?.final_fat_g || 0,
        })
        .select("id")
        .single();
      if (mealError || !mealRow)
        throw new Error(mealError?.message || "Error guardando meal");

      for (const portion of meal.profile_portions) {
        if (!portion.profile_id) continue;
        const { data: portionRow, error: portionError } = await supabase
          .from("rotating_menu_meal_profile_portions")
          .insert({
            rotating_menu_meal_id: mealRow.id,
            profile_id: portion.profile_id,
            serving_multiplier: portion.serving_multiplier,
            final_kcal: portion.final_kcal,
            final_protein_g: portion.final_protein_g,
            final_carbs_g: portion.final_carbs_g,
            final_fat_g: portion.final_fat_g,
            nutrition_pending: portion.nutrition_pending,
          })
          .select("id")
          .single();
        if (portionError || !portionRow)
          throw new Error(portionError?.message || "Error guardando porción");

        const ingredientRows = portion.ingredients
          .filter(
            (ingredient) => ingredient.name && ingredient.final_quantity > 0,
          )
          .map((ingredient) => ({
            rotating_menu_meal_profile_portion_id: portionRow.id,
            name: ingredient.name.toLowerCase(),
            base_quantity: ingredient.base_quantity,
            final_quantity: ingredient.final_quantity,
            unit_type: ingredient.unit_type,
            nutrition_pending: ingredient.nutrition_pending,
          }));
        if (ingredientRows.length > 0) {
          const { error: ingError } = await supabase
            .from("rotating_menu_meal_profile_ingredients")
            .insert(ingredientRows);
          if (ingError) throw new Error(ingError.message);
        }
      }
    }
  }
};

const copySummary = async () => {
  const lines = generatedDays.value.flatMap((day) => [
    `Día ${day.day_number} (${day.day_date})`,
    ...day.meals.map((meal) => {
      const profileParts = meal.profile_portions.map(
        (portion) =>
          `${portion.profile_name}: x${portion.serving_multiplier.toFixed(2)} ${Math.round(portion.final_kcal)} kcal ${portion.final_protein_g.toFixed(1)}g P${portion.nutrition_pending ? " [pendiente nutrición]" : ""}`,
      );
      return `- ${mealLabel(meal.meal_type)} ${meal.dish_name} | ${profileParts.join(" | ")}`;
    }),
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
