<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Platos / Recetas</h1>
        <p class="text-sm text-gray-500">
          Completa ingredientes base y datos nutricionales pendientes.
        </p>
      </div>
      <button
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        @click="loadRecipes"
      >
        Actualizar
      </button>
    </header>

    <section class="bg-white rounded-lg border p-4">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="f in filters"
          :key="f"
          class="px-3 py-1.5 rounded-lg border text-sm"
          :class="
            filter === f
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'text-gray-700'
          "
          @click="filter = f"
        >
          {{ filterLabel(f) }}
        </button>
      </div>
    </section>

    <section class="space-y-3">
      <article
        v-for="dish in filteredDishes"
        :key="dish.id"
        class="bg-white rounded-lg border p-4"
      >
        <div class="flex flex-wrap justify-between gap-3">
          <div>
            <h2 class="font-semibold text-gray-900">{{ dish.name }}</h2>
            <p class="text-sm text-gray-500">
              {{ dish.description || "Sin descripción" }}
            </p>
            <p class="text-xs mt-1" :class="dishState(dish).color">
              {{ dishState(dish).label }}
            </p>
          </div>
          <button class="text-sm text-indigo-700" @click="toggleEdit(dish.id)">
            {{ editingDishId === dish.id ? "Cerrar" : "Editar" }}
          </button>
        </div>

        <div v-if="editingDishId === dish.id" class="mt-3 space-y-2">
          <div
            v-for="(row, index) in editRows"
            :key="`${dish.id}-${index}`"
            class="grid grid-cols-[1fr_90px_110px_70px_70px_70px_70px_32px] gap-2"
          >
            <input
              v-model.trim="row.name"
              class="border rounded-lg px-3 py-2"
              placeholder="Ingrediente"
            />
            <input
              v-model.number="row.quantity"
              type="number"
              min="0.01"
              step="0.01"
              class="border rounded-lg px-3 py-2"
            />
            <select v-model="row.unit_type" class="border rounded-lg px-3 py-2">
              <option v-for="unit in unitTypes" :key="unit" :value="unit">
                {{ unit }}
              </option>
            </select>
            <input
              v-model.number="row.kcal_per_100g"
              type="number"
              min="0"
              step="0.1"
              class="border rounded-lg px-2 py-2"
              placeholder="kcal"
            />
            <input
              v-model.number="row.protein_per_100g"
              type="number"
              min="0"
              step="0.1"
              class="border rounded-lg px-2 py-2"
              placeholder="P"
            />
            <input
              v-model.number="row.carbs_per_100g"
              type="number"
              min="0"
              step="0.1"
              class="border rounded-lg px-2 py-2"
              placeholder="H"
            />
            <input
              v-model.number="row.fat_per_100g"
              type="number"
              min="0"
              step="0.1"
              class="border rounded-lg px-2 py-2"
              placeholder="G"
            />
            <button class="text-red-700" @click="removeRow(index)">×</button>
          </div>
          <div class="flex gap-2">
            <button class="text-sm text-indigo-700" @click="addRow">
              + Ingrediente
            </button>
            <button
              class="text-sm text-green-700"
              @click="saveDishIngredients(dish)"
            >
              Guardar
            </button>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { logError } from "~/utils/log-error";
import type { Dish } from "~/types";

const supabase = useSupabase();
const { loadCurrentUser } = useCurrentUser();

type DishRow = Dish & { dish_ingredients?: any[] };
type EditRow = {
  name: string;
  quantity: number;
  unit_type: string;
  kcal_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
};

const dishes = ref<DishRow[]>([]);
const filter = ref<"all" | "complete" | "pending">("all");
const filters: Array<"all" | "complete" | "pending"> = [
  "all",
  "complete",
  "pending",
];
const editingDishId = ref<string | null>(null);
const editRows = ref<EditRow[]>([]);
const unitTypes = ["g", "kg", "ml", "l", "ud", "pack", "unidad"];

const filterLabel = (f: string) =>
  f === "all" ? "Todos" : f === "complete" ? "Completos" : "Pendientes";

const dishState = (dish: DishRow) => {
  if (/^libre$/i.test(dish.name))
    return { label: "No requiere ingredientes", color: "text-gray-500" };
  const rows = dish.dish_ingredients || [];
  if (rows.length === 0)
    return { label: "Pendiente de ingredientes", color: "text-amber-700" };
  const hasPendingNutrition = rows.some((row) => {
    const ing = row.ingredients;
    return (
      !ing ||
      ing.kcal_per_100g == null ||
      ing.protein_per_100g == null ||
      ing.carbs_per_100g == null ||
      ing.fat_per_100g == null
    );
  });
  return hasPendingNutrition
    ? { label: "Pendiente de datos nutricionales", color: "text-amber-700" }
    : { label: "Completo", color: "text-emerald-700" };
};

const filteredDishes = computed(() =>
  dishes.value.filter((dish) => {
    const pending = dishState(dish).label !== "Completo";
    if (filter.value === "all") return true;
    if (filter.value === "pending") return pending;
    return !pending;
  }),
);

const loadRecipes = async () => {
  const currentUser = await loadCurrentUser();
  if (!currentUser) {
    dishes.value = [];
    return;
  }
  const { data, error } = await supabase
    .from("dishes")
    .select(
      "*, dish_ingredients(quantity, unit_type, ingredients(id, name, unit_type, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g))",
    )
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) {
    await logError("web", error, { context: "recipes.loadRecipes" });
    dishes.value = [];
    return;
  }
  dishes.value = (data || []) as DishRow[];
};

const toggleEdit = (dishId: string) => {
  if (editingDishId.value === dishId) {
    editingDishId.value = null;
    editRows.value = [];
    return;
  }
  const dish = dishes.value.find((d) => d.id === dishId);
  editingDishId.value = dishId;
  editRows.value =
    (dish?.dish_ingredients || []).map((row: any) => ({
      name: row.ingredients?.name || "",
      quantity: Number(row.quantity) || 1,
      unit_type: row.unit_type || row.ingredients?.unit_type || "g",
      kcal_per_100g: row.ingredients?.kcal_per_100g ?? null,
      protein_per_100g: row.ingredients?.protein_per_100g ?? null,
      carbs_per_100g: row.ingredients?.carbs_per_100g ?? null,
      fat_per_100g: row.ingredients?.fat_per_100g ?? null,
    })) || [];
  if (editRows.value.length === 0) {
    addRow();
  }
};

const addRow = () => {
  editRows.value.push({
    name: "",
    quantity: 1,
    unit_type: "g",
    kcal_per_100g: null,
    protein_per_100g: null,
    carbs_per_100g: null,
    fat_per_100g: null,
  });
};

const removeRow = (index: number) => {
  editRows.value.splice(index, 1);
};

const saveDishIngredients = async (dish: DishRow) => {
  const validRows = editRows.value.filter(
    (row) => row.name && row.quantity > 0,
  );
  await supabase.from("dish_ingredients").delete().eq("dish_id", dish.id);

  const links: Array<{
    dish_id: string;
    ingredient_id: string;
    quantity: number;
    unit_type: string;
  }> = [];
  for (const row of validRows) {
    const ingredientName = row.name.toLowerCase();
    let ingredient = await supabase
      .from("ingredients")
      .select("id")
      .eq("name", ingredientName)
      .maybeSingle();

    if (!ingredient.data?.id) {
      const created = await supabase
        .from("ingredients")
        .insert({
          name: ingredientName,
          unit_type: row.unit_type,
          kcal_per_100g: row.kcal_per_100g,
          protein_per_100g: row.protein_per_100g,
          carbs_per_100g: row.carbs_per_100g,
          fat_per_100g: row.fat_per_100g,
        })
        .select("id")
        .single();
      ingredient = { data: created.data as any } as any;
    } else {
      await supabase
        .from("ingredients")
        .update({
          unit_type: row.unit_type,
          kcal_per_100g: row.kcal_per_100g,
          protein_per_100g: row.protein_per_100g,
          carbs_per_100g: row.carbs_per_100g,
          fat_per_100g: row.fat_per_100g,
        })
        .eq("id", ingredient.data.id);
    }

    const ingredientId = ingredient.data?.id;
    if (!ingredientId) continue;

    links.push({
      dish_id: dish.id,
      ingredient_id: ingredientId,
      quantity: row.quantity,
      unit_type: row.unit_type,
    });
  }

  if (links.length > 0) {
    await supabase.from("dish_ingredients").insert(links);
  }
  await loadRecipes();
  toggleEdit(dish.id);
};

onMounted(loadRecipes);
</script>
