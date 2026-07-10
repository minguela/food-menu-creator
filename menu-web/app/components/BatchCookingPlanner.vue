<template>
  <div class="batch-cooking-planner ui-surface rounded-lg p-6 shadow-sm space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold ui-title">Batch Cooking Planner</h2>
        <p class="text-sm ui-subtle">
          Optimiza tus recetas del domingo para cubrir toda la semana minimizando el desperdicio.
        </p>
      </div>
    </div>

    <!-- Configuración -->
    <section class="rounded-lg border ui-divider p-4 space-y-4">
      <h3 class="font-semibold ui-muted">Configuración</h3>

      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label class="space-y-1">
          <span class="text-xs font-medium ui-muted">Horas disponibles el domingo</span>
          <input
            v-model.number="availableHours"
            type="number"
            min="1"
            max="12"
            step="0.5"
            class="ui-input w-full rounded-md px-3 py-2 text-sm"
          />
        </label>

        <label class="space-y-1">
          <span class="text-xs font-medium ui-muted">Días a cubrir</span>
          <select v-model.number="daysToCover" class="ui-select w-full rounded-md px-3 py-2 text-sm">
            <option v-for="d in 7" :key="d" :value="d">{{ d }} días</option>
          </select>
        </label>

        <label class="space-y-1">
          <span class="text-xs font-medium ui-muted">Comidas por día</span>
          <select v-model.number="mealsPerDay" class="ui-select w-full rounded-md px-3 py-2 text-sm">
            <option :value="1">Solo comida</option>
            <option :value="2">Comida + cena</option>
            <option :value="3">Desayuno, comida y cena</option>
          </select>
        </label>

        <label class="space-y-1">
          <span class="text-xs font-medium ui-muted">Kcal objetivo diarias</span>
          <input
            v-model.number="targetKcal"
            type="number"
            min="800"
            max="4000"
            step="50"
            class="ui-input w-full rounded-md px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div class="flex flex-wrap gap-2">
        <label class="inline-flex items-center gap-2 text-sm ui-muted">
          <input v-model="preferLowWaste" type="checkbox" class="h-3.5 w-3.5" />
          Priorizar reducción de desperdicio
        </label>
        <label class="inline-flex items-center gap-2 text-sm ui-muted">
          <input v-model="includeSnacks" type="checkbox" class="h-3.5 w-3.5" />
          Incluir snacks
        </label>
      </div>

      <button
        class="ui-btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
        :disabled="!availableHours || availableHours <= 0"
        @click="computePlan"
      >
        {{ computing ? "Calculando..." : "Generar plan óptimo" }}
      </button>
    </section>

    <!-- Resultados -->
    <section v-if="plan" class="space-y-4">
      <!-- Resumen -->
      <div class="grid gap-3 md:grid-cols-4">
        <div class="rounded-lg border ui-divider p-3 text-center">
          <p class="text-xs ui-subtle">Tiempo total</p>
          <p class="text-lg font-bold ui-title">{{ plan.total_time_min }} min</p>
          <p class="text-[11px] ui-subtle">de {{ plan.available_time_min }} min disponibles</p>
        </div>
        <div class="rounded-lg border ui-divider p-3 text-center">
          <p class="text-xs ui-subtle">Ingredientes únicos</p>
          <p class="text-lg font-bold ui-title">{{ plan.unique_ingredients }}</p>
          <p class="text-[11px] ui-subtle">compartidos entre recetas</p>
        </div>
        <div class="rounded-lg border ui-divider p-3 text-center">
          <p class="text-xs ui-subtle">Kcal/día promedio</p>
          <p class="text-lg font-bold ui-title">{{ plan.avg_kcal_per_day }}</p>
          <p class="text-[11px]" :class="plan.avg_kcal_per_day <= targetKcal * 1.15 ? 'text-emerald-600' : 'text-amber-600'">
            {{ plan.avg_kcal_per_day <= targetKcal * 1.15 ? '✓ En objetivo' : '⚠️ Excede' }}
          </p>
        </div>
        <div class="rounded-lg border ui-divider p-3 text-center">
          <p class="text-xs ui-subtle">Desperdicio estimado</p>
          <p class="text-lg font-bold" :class="plan.waste_score <= 20 ? 'text-emerald-600' : 'text-amber-600'">
            {{ plan.waste_score }}%
          </p>
          <p class="text-[11px] ui-subtle">{{ plan.waste_label }}</p>
        </div>
      </div>

      <!-- Plan diario -->
      <h3 class="font-semibold ui-muted pt-2">Plan semanal</h3>
      <div class="space-y-3">
        <div
          v-for="day in plan.days"
          :key="day.day_number"
          class="rounded-lg border ui-divider p-4 space-y-2"
        >
          <div class="flex items-center justify-between">
            <h4 class="font-semibold ui-title">
              Día {{ day.day_number }} — {{ day.day_name }}
            </h4>
            <span class="text-xs ui-subtle">{{ day.total_kcal }} kcal · {{ day.total_time_min }} min</span>
          </div>

          <div class="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="meal in day.meals"
              :key="meal.name"
              class="rounded bg-[var(--color-surface-3)] p-3 text-sm"
            >
              <p class="flex items-center gap-1 font-medium ui-muted">
                <span class="text-xs uppercase tracking-wide opacity-60">{{ meal.meal_type }}</span>
                <span
                  v-if="meal.is_batch_parent"
                  class="rounded-full bg-[var(--color-accent-soft)] px-1.5 py-0.5 text-[10px]"
                >
                  batch base
                </span>
              </p>
              <p class="mt-1 font-semibold">{{ meal.name }}</p>
              <p class="text-xs ui-subtle mt-1">
                {{ meal.kcal }} kcal · {{ meal.time_min }} min · {{ meal.difficulty }}
              </p>
              <p v-if="meal.uses_leftover_from" class="text-xs text-indigo-300 mt-1">
                🔄 Aprovecha: {{ meal.uses_leftover_from }}
              </p>
              <p v-if="meal.shared_ingredients?.length" class="text-xs text-emerald-300 mt-1">
                🟢 Comparte: {{ meal.shared_ingredients.join(", ") }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Lista de la compra optimizada -->
      <h3 class="font-semibold ui-muted pt-2">Lista de la compra optimizada</h3>
      <div class="rounded-lg border ui-divider p-4">
        <div class="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="item in plan.shopping_list"
            :key="item.name"
            class="flex items-center justify-between rounded bg-[var(--color-surface-3)] px-3 py-2 text-sm"
          >
            <span>{{ item.name }}</span>
            <span class="text-xs ui-subtle">
              {{ item.total_quantity_g }}g
              <span v-if="item.used_in_count > 1" class="text-emerald-300 ml-1">
                (×{{ item.used_in_count }})
              </span>
            </span>
          </div>
        </div>
      </div>

      <!-- Alertas -->
      <div v-if="plan.alerts.length > 0" class="space-y-1">
        <div
          v-for="(alert, idx) in plan.alerts"
          :key="idx"
          class="rounded-lg border p-3 text-sm"
          :class="alert.type === 'warning' ? 'border-amber-700 bg-amber-950/50 text-amber-300' : 'border-red-700 bg-red-950/50 text-red-300'"
        >
          {{ alert.message }}
        </div>
      </div>
    </section>

    <!-- Estado vacío -->
    <section v-if="!plan && !computing" class="rounded-lg border ui-divider p-6 text-center">
      <p class="ui-subtle">Configura las horas disponibles y pulsa "Generar plan óptimo".</p>
      <p class="text-xs ui-subtle mt-1">
        El sistema seleccionará recetas que maximicen la cobertura semanal minimizando el desperdicio de ingredientes.
      </p>
    </section>

    <!-- Cargando -->
    <section v-if="computing" class="rounded-lg border ui-divider p-6 text-center">
      <div class="w-8 h-8 mx-auto rounded-full border-2 border-indigo-100 border-t-indigo-500 animate-spin"></div>
      <p class="ui-subtle mt-3">Optimizando plan de batch cooking...</p>
    </section>
  </div>
</template>

<script setup lang="ts">
interface BatchMealInput {
  name: string;
  meal_type: "desayuno" | "comida" | "cena" | "snack";
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  time_min: number;
  difficulty: "fácil" | "media" | "difícil";
  ingredients: string[];
  ingredients_grams: Record<string, number>;
  tags: string[];
  makes_leftovers?: string; // nombre del ingrediente sobrante que produce
}

interface PlannedMeal {
  name: string;
  meal_type: string;
  kcal: number;
  time_min: number;
  difficulty: string;
  is_batch_parent: boolean;
  shared_ingredients: string[];
  uses_leftover_from?: string;
}

interface PlannedDay {
  day_number: number;
  day_name: string;
  meals: PlannedMeal[];
  total_kcal: number;
  total_time_min: number;
}

interface ShoppingItem {
  name: string;
  total_quantity_g: number;
  used_in_count: number;
}

interface PlanAlert {
  type: "warning" | "error";
  message: string;
}

interface BatchPlan {
  total_time_min: number;
  available_time_min: number;
  unique_ingredients: number;
  avg_kcal_per_day: number;
  waste_score: number;
  waste_label: string;
  days: PlannedDay[];
  shopping_list: ShoppingItem[];
  alerts: PlanAlert[];
}

// Props
const props = withDefaults(
  defineProps<{
    initialMeals?: BatchMealInput[];
    initialHours?: number;
  }>(),
  {
    initialMeals: () => [],
    initialHours: 4,
  },
);

const emit = defineEmits<{
  "plan-generated": [plan: BatchPlan];
}>();

// Estado
const availableHours = ref(props.initialHours || 4);
const daysToCover = ref(5); // lunes a viernes
const mealsPerDay = ref(2);
const targetKcal = ref(2000);
const preferLowWaste = ref(true);
const includeSnacks = ref(false);
const computing = ref(false);
const plan = ref<BatchPlan | null>(null);

const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// Catálogo base de recetas optimizadas para batch cooking
const batchRecipeCatalog: BatchMealInput[] = [
  // PROTEÍNAS BASE (se cocinan en batch y se reutilizan)
  {
    name: "Pollo asado al horno (batch)",
    meal_type: "comida",
    kcal: 480,
    protein_g: 52,
    carbs_g: 8,
    fat_g: 26,
    time_min: 60,
    difficulty: "media",
    ingredients: ["pollo entero", "limón", "ajo", "aceite de oliva", "romero", "sal", "pimienta"],
    ingredients_grams: { "pollo entero": 1500, "limón": 60, "ajo": 10, "aceite de oliva": 30, "romero": 5, "sal": 5, "pimienta": 2 },
    tags: ["proteína base", "batch"],
    makes_leftovers: "pollo asado",
  },
  {
    name: "Lentejas estofadas (batch grande)",
    meal_type: "comida",
    kcal: 380,
    protein_g: 22,
    carbs_g: 52,
    fat_g: 8,
    time_min: 45,
    difficulty: "fácil",
    ingredients: ["lentejas", "zanahoria", "cebolla", "pimiento", "tomate", "ajo", "pimentón", "laurel", "aceite de oliva", "caldo de pollo"],
    ingredients_grams: { "lentejas": 400, "zanahoria": 100, "cebolla": 100, "pimiento": 80, "tomate": 150, "ajo": 8, "pimentón": 5, "laurel": 1, "aceite de oliva": 20, "caldo de pollo": 500 },
    tags: ["legumbre", "vegano", "batch"],
    makes_leftovers: "lentejas cocidas",
  },
  {
    name: "Arroz blanco (batch)",
    meal_type: "comida",
    kcal: 260,
    protein_g: 5.4,
    carbs_g: 56,
    fat_g: 0.6,
    time_min: 20,
    difficulty: "fácil",
    ingredients: ["arroz blanco", "agua", "sal", "aceite de oliva"],
    ingredients_grams: { "arroz blanco": 300, "agua": 600, "sal": 5, "aceite de oliva": 10 },
    tags: ["carbohidrato base", "batch"],
    makes_leftovers: "arroz cocido",
  },
  {
    name: "Verduras asadas al horno (batch)",
    meal_type: "comida",
    kcal: 180,
    protein_g: 4,
    carbs_g: 22,
    fat_g: 9,
    time_min: 40,
    difficulty: "fácil",
    ingredients: ["pimiento", "calabacín", "berenjena", "cebolla", "aceite de oliva", "sal", "pimienta", "orégano"],
    ingredients_grams: { "pimiento": 150, "calabacín": 150, "berenjena": 150, "cebolla": 100, "aceite de oliva": 30, "sal": 5, "pimienta": 2, "orégano": 3 },
    tags: ["verdura base", "vegano", "batch"],
    makes_leftovers: "verduras asadas",
  },
  {
    name: "Salmón al horno (batch ×4)",
    meal_type: "cena",
    kcal: 420,
    protein_g: 40,
    carbs_g: 2,
    fat_g: 28,
    time_min: 25,
    difficulty: "fácil",
    ingredients: ["salmón", "limón", "eneldo", "aceite de oliva", "sal", "pimienta"],
    ingredients_grams: { "salmón": 600, "limón": 40, "eneldo": 5, "aceite de oliva": 20, "sal": 5, "pimienta": 2 },
    tags: ["pescado", "batch"],
    makes_leftovers: "salmón cocido",
  },
  {
    name: "Huevos duros (batch)",
    meal_type: "cena",
    kcal: 155,
    protein_g: 13,
    carbs_g: 1.1,
    fat_g: 11,
    time_min: 12,
    difficulty: "fácil",
    ingredients: ["huevos", "agua", "sal"],
    ingredients_grams: { "huevos": 400, "agua": 1000, "sal": 5 },
    tags: ["proteína rápida", "batch"],
    makes_leftovers: "huevos cocidos",
  },

  // RECETAS DE APROVECHAMIENTO (usan sobras)
  {
    name: "Ensalada de pollo con verduras asadas",
    meal_type: "comida",
    kcal: 350,
    protein_g: 30,
    carbs_g: 14,
    fat_g: 19,
    time_min: 10,
    difficulty: "fácil",
    ingredients: ["pollo asado", "verduras asadas", "lechuga", "tomate", "aceite de oliva", "vinagre"],
    ingredients_grams: { "lechuga": 100, "tomate": 80, "aceite de oliva": 10, "vinagre": 10 },
    tags: ["aprovechamiento", "ensalada"],
  },
  {
    name: "Tacos de pollo con pimientos",
    meal_type: "cena",
    kcal: 420,
    protein_g: 28,
    carbs_g: 38,
    fat_g: 16,
    time_min: 10,
    difficulty: "fácil",
    ingredients: ["pollo asado", "pimiento", "cebolla", "tortillas de maíz", "aguacate", "lima"],
    ingredients_grams: { "pimiento": 60, "cebolla": 40, "tortillas de maíz": 120, "aguacate": 80, "lima": 20 },
    tags: ["aprovechamiento", "mexicano"],
  },
  {
    name: "Bowl de arroz con salmón y aguacate",
    meal_type: "cena",
    kcal: 480,
    protein_g: 32,
    carbs_g: 42,
    fat_g: 20,
    time_min: 8,
    difficulty: "fácil",
    ingredients: ["arroz cocido", "salmón cocido", "aguacate", "pepino", "salsa de soja", "sésamo"],
    ingredients_grams: { "aguacate": 80, "pepino": 60, "salsa de soja": 10, "sésamo": 5 },
    tags: ["aprovechamiento", "poke", "asiático"],
  },
  {
    name: "Sopa de lentejas express",
    meal_type: "cena",
    kcal: 280,
    protein_g: 18,
    carbs_g: 34,
    fat_g: 8,
    time_min: 10,
    difficulty: "fácil",
    ingredients: ["lentejas cocidas", "zanahoria", "caldo de pollo", "comino", "perejil"],
    ingredients_grams: { "zanahoria": 60, "caldo de pollo": 200, "comino": 2, "perejil": 3 },
    tags: ["aprovechamiento", "sopa"],
  },
  {
    name: "Huevos rellenos de atún",
    meal_type: "cena",
    kcal: 220,
    protein_g: 20,
    carbs_g: 2,
    fat_g: 15,
    time_min: 10,
    difficulty: "fácil",
    ingredients: ["huevos cocidos", "atún", "mayonesa", "pimentón", "perejil"],
    ingredients_grams: { "atún": 80, "mayonesa": 20, "pimentón": 2, "perejil": 2 },
    tags: ["aprovechamiento", "proteico", "rápido"],
  },

  // DESAYUNOS
  {
    name: "Porridge de avena con fruta",
    meal_type: "desayuno",
    kcal: 350,
    protein_g: 12,
    carbs_g: 58,
    fat_g: 8,
    time_min: 10,
    difficulty: "fácil",
    ingredients: ["avena", "leche", "plátano", "nueces", "miel"],
    ingredients_grams: { "avena": 60, "leche": 200, "plátano": 100, "nueces": 15, "miel": 10 },
    tags: ["desayuno", "energético"],
  },
  {
    name: "Tostadas con aguacate y huevo duro",
    meal_type: "desayuno",
    kcal: 380,
    protein_g: 16,
    carbs_g: 30,
    fat_g: 22,
    time_min: 5,
    difficulty: "fácil",
    ingredients: ["pan integral", "aguacate", "huevos cocidos", "sal", "pimienta"],
    ingredients_grams: { "pan integral": 80, "aguacate": 80, "sal": 1, "pimienta": 1 },
    tags: ["desayuno", "aprovechamiento"],
  },

  // SNACKS
  {
    name: "Yogur con granola y fruta",
    meal_type: "snack",
    kcal: 200,
    protein_g: 8,
    carbs_g: 28,
    fat_g: 6,
    time_min: 3,
    difficulty: "fácil",
    ingredients: ["yogur", "avena", "fresas", "miel"],
    ingredients_grams: { "yogur": 150, "avena": 20, "fresas": 50, "miel": 8 },
    tags: ["snack", "rápido"],
  },
  {
    name: "Hummus con crudités",
    meal_type: "snack",
    kcal: 180,
    protein_g: 8,
    carbs_g: 18,
    fat_g: 9,
    time_min: 5,
    difficulty: "fácil",
    ingredients: ["garbanzos", "aceite de oliva", "limón", "ajo", "comino", "zanahoria", "pepino"],
    ingredients_grams: { "garbanzos": 200, "aceite de oliva": 15, "limón": 15, "ajo": 5, "comino": 2, "zanahoria": 60, "pepino": 60 },
    tags: ["snack", "vegano"],
  },
];

// Identifica ingredientes sobrantes que produce una receta
function leftoverIngredientName(meal: BatchMealInput): string | null {
  return meal.makes_leftovers || null;
}

// Encuentra recetas que usan un ingrediente sobrante concreto
function findRecipesUsingLeftover(leftover: string): BatchMealInput[] {
  const norm = leftover.toLowerCase().trim();
  return batchRecipeCatalog.filter((r) => {
    // Buscar en nombre del ingrediente sobrante
    if (r.ingredients.some((i) => i.toLowerCase().trim().includes(norm))) return true;
    // Buscar en tags
    if (r.tags.includes("aprovechamiento") && r.name.toLowerCase().includes(norm)) return true;
    return false;
  });
}

// Agrupa ingredientes: suma cantidades y cuenta usos
function aggregateShoppingList(
  selectedMeals: { meal: BatchMealInput; day: number; isBatch: boolean }[],
): { name: string; total_quantity_g: number; used_in_count: number }[] {
  const map = new Map<string, { total: number; count: number }>();

  for (const { meal } of selectedMeals) {
    for (const [ingName, grams] of Object.entries(meal.ingredients_grams)) {
      const existing = map.get(ingName);
      if (existing) {
        existing.total += grams;
        existing.count += 1;
      } else {
        map.set(ingName, { total: grams, count: 1 });
      }
    }
  }

  return Array.from(map.entries())
    .map(([name, data]) => ({
      name,
      total_quantity_g: Math.round(data.total),
      used_in_count: data.count,
    }))
    .sort((a, b) => b.total_quantity_g - a.total_quantity_g);
}

// Encuentra ingredientes compartidos entre recetas
function findSharedIngredients(
  meal: BatchMealInput,
  allMeals: BatchMealInput[],
): string[] {
  const myIngredients = new Set(Object.keys(meal.ingredients_grams));
  const shared: string[] = [];

  for (const other of allMeals) {
    if (other.name === meal.name) continue;
    for (const ing of Object.keys(other.ingredients_grams)) {
      if (myIngredients.has(ing) && !shared.includes(ing)) {
        shared.push(ing);
      }
    }
  }

  return shared;
}

// Calcula el score de desperdicio (menor es mejor)
function calculateWasteScore(
  selectedMeals: BatchMealInput[],
  shoppingList: { name: string; total_quantity_g: number; used_in_count: number }[],
): number {
  // El desperdicio es menor cuantos más ingredientes se compartan
  const totalIngredientUses = shoppingList.reduce((sum, item) => sum + item.used_in_count, 0);
  const totalUniqueIngredients = shoppingList.length;

  if (totalUniqueIngredients === 0) return 100;

  // Ratio de reutilización: usos por ingrediente único
  const reuseRatio = totalIngredientUses / totalUniqueIngredients;

  // Menos ingredientes únicos por receta = mejor
  const ingredientsPerRecipe = totalUniqueIngredients / Math.max(1, selectedMeals.length);

  // Score combinado (0-100, menor = menos desperdicio)
  const score = Math.max(0, Math.min(100, Math.round(50 / Math.max(0.5, reuseRatio) + ingredientsPerRecipe * 15)));

  return score;
}

function computePlan() {
  if (!availableHours.value || availableHours.value <= 0) return;

  computing.value = true;

  // Simular cálculo asíncrono para dar feedback visual
  setTimeout(() => {
    try {
      const availableTimeMin = Math.round(availableHours.value * 60);
      const totalMealsNeeded = daysToCover.value * mealsPerDay.value;

      // Fase 1: Seleccionar recetas base (batch) que maximizan cobertura
      const batchMeals = batchRecipeCatalog.filter((m) => m.tags.includes("batch"));
      const regularMeals = batchRecipeCatalog.filter((m) => !m.tags.includes("batch"));

      // Priorizar recetas batch que producen leftovers
      const selectedBatchMeals: BatchMealInput[] = [];
      let remainingTime = availableTimeMin;

      // Ordenar batch meals por eficiencia (kcal por minuto de cocción)
      const sortedBatchMeals = [...batchMeals].sort(
        (a, b) => b.kcal / Math.max(1, b.time_min) - a.kcal / Math.max(1, a.time_min),
      );

      for (const meal of sortedBatchMeals) {
        if (remainingTime >= meal.time_min && selectedBatchMeals.length < 4) {
          selectedBatchMeals.push(meal);
          remainingTime -= meal.time_min;
        }
      }

      // Fase 2: Seleccionar recetas de aprovechamiento para el resto de días
      const leftoverMap = new Map<string, BatchMealInput>();
      for (const meal of selectedBatchMeals) {
        const leftover = leftoverIngredientName(meal);
        if (leftover) leftoverMap.set(leftover.toLowerCase().trim(), meal);
      }

      const selectedMeals: { meal: BatchMealInput; day: number; isBatch: boolean }[] = [];
      const usedMealNames = new Set<string>();

      // Día 0 (domingo): solo batch cooking
      let mealCounter = 0;
      for (const meal of selectedBatchMeals) {
        selectedMeals.push({ meal, day: 0, isBatch: true });
        usedMealNames.add(meal.name);
        mealCounter++;
      }

      // Días 1..N: combinar leftovers + comidas frescas
      for (let day = 1; day <= daysToCover.value; day++) {
        let dayMealsPlanned = 0;

        // Intentar usar leftovers primero
        const availableLeftovers = Array.from(leftoverMap.keys());
        const leftoverRecipes: BatchMealInput[] = [];

        for (const leftover of availableLeftovers) {
          const recipes = findRecipesUsingLeftover(leftover).filter(
            (r) => !usedMealNames.has(r.name),
          );
          leftoverRecipes.push(...recipes);
        }

        // Eliminar duplicados y priorizar por tiempo de preparación
        const uniqueLeftoverRecipes = leftoverRecipes.filter(
          (r, idx, self) => self.findIndex((x) => x.name === r.name) === idx,
        ).sort((a, b) => a.time_min - b.time_min);

        // Asignar recetas de leftovers a este día
        for (const recipe of uniqueLeftoverRecipes) {
          if (dayMealsPlanned >= mealsPerDay.value) break;
          if (remainingTime < recipe.time_min) break;
          if (usedMealNames.has(recipe.name)) continue;

          const relevantLeftover = Array.from(leftoverMap.keys()).find((l) =>
            recipe.ingredients.some((i) => i.toLowerCase().trim().includes(l)),
          );

          selectedMeals.push({
            meal: recipe,
            day,
            isBatch: false,
          });
          usedMealNames.add(recipe.name);
          remainingTime -= recipe.time_min;
          dayMealsPlanned++;
        }

        // Si faltan comidas, añadir recetas regulares
        if (dayMealsPlanned < mealsPerDay.value) {
          const neededType =
            mealsPerDay.value === 3
              ? dayMealsPlanned === 0
                ? "desayuno"
                : dayMealsPlanned === 1
                  ? "comida"
                  : "cena"
              : mealsPerDay.value === 2
                ? dayMealsPlanned === 0
                  ? "comida"
                  : "cena"
                : "comida";

          const candidates = regularMeals
            .filter(
              (r) =>
                r.meal_type === neededType &&
                !usedMealNames.has(r.name) &&
                r.time_min <= remainingTime,
            )
            .sort((a, b) => a.time_min - b.time_min);

          for (const candidate of candidates.slice(0, mealsPerDay.value - dayMealsPlanned)) {
            selectedMeals.push({ meal: candidate, day, isBatch: false });
            usedMealNames.add(candidate.name);
            remainingTime -= candidate.time_min;
            dayMealsPlanned++;
          }
        }
      }

      // Incluir snacks si se solicita
      if (includeSnacks.value) {
        const snackRecipes = regularMeals
          .filter((r) => r.meal_type === "snack" && !usedMealNames.has(r.name) && r.time_min <= remainingTime)
          .sort((a, b) => a.time_min - b.time_min)
          .slice(0, 3);

        for (const snack of snackRecipes) {
          selectedMeals.push({ meal: snack, day: 1 + Math.floor(Math.random() * daysToCover.value), isBatch: false });
          usedMealNames.add(snack.name);
          remainingTime -= snack.time_min;
        }
      }

      // Construir shopping list agregada
      const allSelectedMeals = selectedMeals.map((s) => s.meal);
      const shoppingList = aggregateShoppingList(selectedMeals);

      // Calcular waste score
      const wasteScore = calculateWasteScore(allSelectedMeals, shoppingList);

      // Construir plan diario
      const daysMap = new Map<number, { meal: BatchMealInput; isBatch: boolean }[]>();
      for (const item of selectedMeals) {
        if (!daysMap.has(item.day)) daysMap.set(item.day, []);
        daysMap.get(item.day)!.push(item);
      }

      const plannedDays: PlannedDay[] = [];
      const alerts: PlanAlert[] = [];
      let totalKcalAll = 0;

      for (let d = 0; d <= daysToCover.value; d++) {
        const items = daysMap.get(d) || [];
        if (items.length === 0 && d > 0) continue;

        const meals: PlannedMeal[] = items.map((item) => {
          totalKcalAll += item.meal.kcal;

          // Buscar si esta receta usa un leftover
          let usesLeftoverFrom: string | undefined;
          if (!item.isBatch) {
            for (const [leftover, batchMeal] of leftoverMap.entries()) {
              if (
                item.meal.ingredients.some((i) => i.toLowerCase().trim().includes(leftover)) ||
                item.meal.name.toLowerCase().includes(leftover.replace("cocidas", "").replace("cocido", "").replace("asado", "").trim())
              ) {
                usesLeftoverFrom = batchMeal.name;
                break;
              }
            }
          }

          const sharedIngredients = findSharedIngredients(
            item.meal,
            allSelectedMeals.filter((m) => m.name !== item.meal.name),
          );

          return {
            name: item.meal.name,
            meal_type: item.meal.meal_type,
            kcal: item.meal.kcal,
            time_min: item.meal.time_min,
            difficulty: item.meal.difficulty,
            is_batch_parent: item.isBatch,
            shared_ingredients: sharedIngredients.slice(0, 4),
            uses_leftover_from: usesLeftoverFrom,
          };
        });

        const dayTotalKcal = meals.reduce((sum, m) => sum + m.kcal, 0);
        const dayTotalTime = meals.reduce((sum, m) => sum + m.time_min, 0);

        plannedDays.push({
          day_number: d,
          day_name: d === 0 ? "Domingo (prep)" : dayNames[d - 1],
          meals,
          total_kcal: dayTotalKcal,
          total_time_min: dayTotalTime,
        });
      }

      // Alertas
      const totalTimeUsed = availableTimeMin - remainingTime;
      if (totalTimeUsed > availableTimeMin * 0.95) {
        alerts.push({
          type: "warning",
          message: `Estás usando ${Math.round(totalTimeUsed)} de ${availableTimeMin} min disponibles (${Math.round((totalTimeUsed / availableTimeMin) * 100)}%). Considera ampliar el tiempo o reducir días.`,
        });
      }

      if (wasteScore > 30) {
        alerts.push({
          type: "warning",
          message: `Nivel de desperdicio elevado (${wasteScore}%). Intenta seleccionar más recetas que compartan ingredientes.`,
        });
      }

      const effectiveDays = plannedDays.filter((d) => d.meals.length > 0).length;

      if (totalMealsNeeded > selectedMeals.filter((s) => s.day > 0).length * 2) {
        alerts.push({
          type: "error",
          message: `No se pudieron cubrir todas las comidas. Faltan ${totalMealsNeeded - selectedMeals.filter((s) => s.day > 0).length} comidas. Aumenta las horas o reduce los días.`,
        });
      }

      const planResult: BatchPlan = {
        total_time_min: totalTimeUsed,
        available_time_min: availableTimeMin,
        unique_ingredients: shoppingList.length,
        avg_kcal_per_day: Math.round(totalKcalAll / Math.max(1, effectiveDays)),
        waste_score: wasteScore,
        waste_label:
          wasteScore <= 10
            ? "Óptimo (mínimo desperdicio)"
            : wasteScore <= 20
              ? "Bueno (bajo desperdicio)"
              : wasteScore <= 35
                ? "Aceptable"
                : "Mejorable",
        days: plannedDays,
        shopping_list: shoppingList,
        alerts,
      };

      plan.value = planResult;
      emit("plan-generated", planResult);
    } catch (err) {
      console.error("BatchCookingPlanner: error generando plan", err);
    } finally {
      computing.value = false;
    }
  }, 600);
}
</script>
