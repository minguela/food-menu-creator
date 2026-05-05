<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Flujo guiado</h1>
        <p class="text-sm text-gray-500">
          Estado global para crear perfiles, curar datos, generar menú y compra.
        </p>
      </div>
      <button
        class="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        :disabled="loading"
        @click="loadWorkflow"
      >
        {{ loading ? "Actualizando..." : "Actualizar estado" }}
      </button>
    </header>

    <section
      v-if="loading"
      class="rounded-lg border bg-white p-8 text-center text-sm text-gray-500"
    >
      Calculando estado...
    </section>

    <section
      v-else
      class="grid gap-3"
    >
      <article
        v-for="step in steps"
        :key="step.id"
        class="rounded-lg border bg-white p-4"
        :class="
          step.status === 'done'
            ? 'border-emerald-200'
            : step.status === 'blocked'
              ? 'border-red-200'
              : 'border-amber-200'
        "
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-xs font-medium text-gray-500">Paso {{ step.order }}</p>
            <h2 class="text-lg font-semibold text-gray-900">{{ step.title }}</h2>
            <p class="text-sm text-gray-600">{{ step.detail }}</p>
          </div>
          <NuxtLink
            :href="step.path"
            class="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Abrir
          </NuxtLink>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { logError } from "~/utils/log-error";

type StepState = {
  id: string;
  order: number;
  title: string;
  path: string;
  status: "done" | "pending" | "blocked";
  detail: string;
};

const supabase = useSupabase();
const { loadCurrentUser } = useCurrentUser();

const loading = ref(true);
const steps = ref<StepState[]>([]);

const loadWorkflow = async () => {
  loading.value = true;
  try {
    const currentUser = await loadCurrentUser();
    if (!currentUser) {
      steps.value = [];
      return;
    }

    const [
      { count: profilesCount },
      { count: ingredientsCount },
      { count: completeIngredientsCount },
      { count: dishesCount },
      { count: completeDishesCount },
      { count: rotatingMenusCount },
      { count: shoppingCount },
    ] = await Promise.all([
      supabase
        .from("person_profiles")
        .select("id", { count: "exact", head: true })
        .eq("user_id", currentUser.id),
      supabase.from("ingredients").select("id", { count: "exact", head: true }),
      supabase
        .from("ingredients")
        .select("id", { count: "exact", head: true })
        .eq("nutrition_status", "complete"),
      supabase
        .from("dishes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", currentUser.id),
      supabase
        .from("dishes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", currentUser.id)
        .eq("recipe_status", "complete"),
      supabase
        .from("rotating_menus")
        .select("id", { count: "exact", head: true })
        .eq("user_id", currentUser.id),
      supabase
        .from("shopping_lists")
        .select("id", { count: "exact", head: true })
        .eq("user_id", currentUser.id),
    ]);

    const profileCount = Number(profilesCount || 0);
    const ingredientTotal = Number(ingredientsCount || 0);
    const ingredientComplete = Number(completeIngredientsCount || 0);
    const recipesTotal = Number(dishesCount || 0);
    const recipesComplete = Number(completeDishesCount || 0);
    const generatedMenus = Number(rotatingMenusCount || 0);
    const shoppingLines = Number(shoppingCount || 0);

    steps.value = [
      {
        id: "profiles",
        order: 1,
        title: "Perfiles nutricionales",
        path: "/config",
        status: profileCount > 0 ? "done" : "blocked",
        detail:
          profileCount > 0
            ? `${profileCount} perfiles configurados.`
            : "Crea al menos un perfil con kcal, proteína y macros.",
      },
      {
        id: "ingredients",
        order: 2,
        title: "Curación de ingredientes",
        path: "/ingredients",
        status:
          ingredientTotal > 0 && ingredientComplete === ingredientTotal
            ? "done"
            : ingredientTotal === 0
              ? "blocked"
              : "pending",
        detail: `${ingredientComplete}/${ingredientTotal} ingredientes con nutrición completa.`,
      },
      {
        id: "recipes",
        order: 3,
        title: "Curación de recetas",
        path: "/recipes",
        status:
          recipesTotal > 0 && recipesComplete === recipesTotal
            ? "done"
            : recipesTotal === 0
              ? "blocked"
              : "pending",
        detail: `${recipesComplete}/${recipesTotal} recetas completas.`,
      },
      {
        id: "generate",
        order: 4,
        title: "Generar menú rotativo",
        path: "/generar",
        status: generatedMenus > 0 ? "done" : "pending",
        detail:
          generatedMenus > 0
            ? `${generatedMenus} menús rotativos generados.`
            : "Aún no hay menús rotativos generados.",
      },
      {
        id: "shopping",
        order: 5,
        title: "Lista de la compra",
        path: "/shopping",
        status: shoppingLines > 0 ? "done" : "pending",
        detail:
          shoppingLines > 0
            ? `${shoppingLines} líneas en listas de compra.`
            : "No hay lista de compra generada.",
      },
    ];
  } catch (error) {
    await logError("web", error, { context: "workflow.loadWorkflow" });
    steps.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(loadWorkflow);
</script>

