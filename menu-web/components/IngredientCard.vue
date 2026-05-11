<template>
  <article
    class="rounded-lg border bg-white dark:bg-slate-900 p-4 shadow-sm"
    :class="[
      active ? 'border-indigo-300 dark:border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-900/50' : 'border-gray-200 dark:border-slate-700',
      quality.status === 'inconsistent' ? 'border-red-200' : '',
      quality.status === 'incomplete' ? 'border-amber-200' : '',
    ]"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-[220px] flex-1 space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <label class="inline-flex items-center">
            <input
              type="checkbox"
              :checked="selected"
              @change="$emit('toggle-selected')"
            />
          </label>
          <ValidationBadge :quality="quality" />
          <span
            v-if="changedFields.length > 0"
            class="rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700"
          >
            Editado
          </span>
          <span class="rounded-full bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700">
            {{ caloricLabel }}
          </span>
          <span
            v-if="row.review_reason"
            class="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700"
          >
            revisión: {{ row.review_reason }}
          </span>
        </div>
        <input
          :value="row.name"
          class="w-full rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-base font-semibold text-gray-900 dark:text-slate-100"
          placeholder="Nombre del ingrediente"
          @input="patchName"
        />
        <input
          :value="row.english_name || ''"
          class="w-full rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-gray-700 dark:text-slate-200"
          placeholder="Nombre en inglés (opcional)"
          @input="patchEnglishName"
        />
      </div>

      <div class="flex flex-wrap justify-end gap-2">
        <button
          class="rounded-md border border-gray-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50"
          :disabled="saving || isFirst"
          @click="$emit('previous')"
        >
          Anterior
        </button>
        <button
          class="rounded-md border border-gray-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50"
          :disabled="saving || isLast"
          @click="$emit('next')"
        >
          Siguiente
        </button>
      </div>
    </div>

    <div class="mt-4 grid gap-3 lg:grid-cols-[140px_1fr]">
      <label class="space-y-1">
        <span class="text-xs font-medium text-gray-600 dark:text-slate-300">Unidad</span>
        <select
          :value="row.default_unit_type"
          class="w-full rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-gray-700 dark:text-slate-200"
          @change="patchUnit"
        >
          <option v-for="unit in unitTypes" :key="unit" :value="unit">
            {{ unit }}
          </option>
        </select>
      </label>

      <NutritionInputs
        :model-value="nutrition"
        :changed-fields="changedFields"
        @update:model-value="updateNutrition"
      />
    </div>

    <div
      v-if="quality.warnings.length > 0"
      class="mt-3 rounded-md border p-3 text-xs"
      :class="quality.status === 'inconsistent' ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700'"
    >
      <p class="font-medium">{{ quality.warnings.join(" · ") }}</p>
      <p v-if="quality.calculatedKcal !== null" class="mt-1">
        kcal calculadas por macros:
        {{ Number(quality.calculatedKcal).toFixed(1) }}
      </p>
    </div>

    <div class="mt-3 grid gap-3 lg:grid-cols-2">
      <div class="rounded-md bg-gray-50 dark:bg-slate-800 p-3 text-xs text-gray-600 dark:text-slate-300">
        <p class="font-medium text-gray-700 dark:text-slate-200">Valores originales</p>
        <p>
          {{ original.kcal_per_100g ?? "?" }} kcal · P
          {{ original.protein_per_100g ?? "?" }} · H
          {{ original.carbs_per_100g ?? "?" }} · G
          {{ original.fat_per_100g ?? "?" }}
        </p>
      </div>
      <div class="rounded-md bg-gray-50 dark:bg-slate-800 p-3 text-xs text-gray-600 dark:text-slate-300">
        <p class="font-medium text-gray-700 dark:text-slate-200">Recetas</p>
        <div class="mt-1 flex flex-wrap gap-1">
          <NuxtLink
            v-for="recipe in recipes.slice(0, 4)"
            :key="recipe.id"
            :to="{ path: '/recipes', query: { recipe: recipe.id } }"
            class="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-slate-800"
          >
            {{ recipe.name }}
          </NuxtLink>
          <span v-if="recipes.length > 4" class="px-2 py-1 text-gray-500 dark:text-slate-400">
            +{{ recipes.length - 4 }}
          </span>
          <span v-if="recipes.length === 0" class="text-gray-400 dark:text-slate-500">
            Sin recetas
          </span>
        </div>
      </div>
    </div>

    <div v-if="candidates.length > 0" class="mt-3 rounded-md border border-sky-100 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/40 p-3">
      <p class="text-xs font-medium text-sky-800 dark:text-sky-300">Sugerencias disponibles</p>
      <div class="mt-2 space-y-2">
        <div
          v-for="candidate in candidates.slice(0, 2)"
          :key="candidate.id"
          class="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white dark:bg-slate-900 p-2 text-xs"
        >
          <span class="text-gray-700 dark:text-slate-200">
            {{ candidate.name }} · {{ candidate.kcal_per_100g ?? "?" }} kcal ·
            confianza {{ Number(candidate.confidence || 0).toFixed(2) }}
          </span>
          <button
            class="font-medium text-sky-700"
            @click="$emit('apply-candidate', candidate.id)"
          >
            Aplicar
          </button>
          <button
            class="font-medium text-gray-600 dark:text-slate-300"
            @click="$emit('show-candidate-debug', candidate.id)"
          >
            Ver debug
          </button>
        </div>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap items-center justify-end gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <span v-if="saveState === 'success'" class="text-xs text-emerald-700">
          Guardado
        </span>
        <span v-if="saveState === 'error'" class="text-xs text-red-700">
          Error al guardar
        </span>
        <button
          class="rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          :disabled="saving || !row.name.trim()"
          @click="$emit('save')"
        >
          {{ saving ? "Guardando..." : "Guardar ingrediente" }}
        </button>
        <button
          class="rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          :disabled="saving || !row.name.trim()"
          @click="$emit('save-next')"
        >
          Guardar y siguiente
        </button>
        <button
          class="rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
          @click="$emit('delete')"
        >
          Eliminar
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { IngredientNutritionQuality, IngredientNutritionValues } from "~/utils/ingredient-nutrition-quality";

type UnitType = "kg" | "g" | "l" | "ml" | "ud" | "pack" | "unidad";
type IngredientCardRow = IngredientNutritionValues & {
  id: string;
  name: string;
  default_unit_type: UnitType;
  english_name?: string | null;
  review_reason?: string | null;
};
type RecipeLink = { id: string; name: string };
type ReviewCandidate = IngredientNutritionValues & {
  id: string;
  name: string;
  confidence: number;
  raw_payload?: any;
};

const props = defineProps<{
  row: IngredientCardRow;
  original: IngredientNutritionValues;
  quality: IngredientNutritionQuality;
  changedFields: string[];
  selected: boolean;
  active: boolean;
  saving: boolean;
  saveState?: "idle" | "saving" | "success" | "error";
  isTemporary: boolean;
  isFirst: boolean;
  isLast: boolean;
  unitTypes: UnitType[];
  recipes: RecipeLink[];
  candidates: ReviewCandidate[];
  caloricLabel: string;
}>();

const emit = defineEmits<{
  patch: [value: Partial<IngredientCardRow>];
  save: [];
  "save-next": [];
  "toggle-selected": [];
  previous: [];
  next: [];
  delete: [];
  "apply-candidate": [candidateId: string];
  "show-candidate-debug": [candidateId: string];
}>();

const nutrition = computed(() => ({
  kcal_per_100g: props.row.kcal_per_100g,
  protein_per_100g: props.row.protein_per_100g,
  carbs_per_100g: props.row.carbs_per_100g,
  fat_per_100g: props.row.fat_per_100g,
}));

const patch = (value: Partial<IngredientCardRow>) => emit("patch", value);

const patchName = (event: Event) => {
  patch({ name: (event.target as HTMLInputElement).value });
};

const patchUnit = (event: Event) => {
  patch({
    default_unit_type: (event.target as HTMLSelectElement).value as UnitType,
  });
};

const patchEnglishName = (event: Event) => {
  patch({ english_name: (event.target as HTMLInputElement).value || null });
};

const updateNutrition = (value: IngredientNutritionValues) => {
  patch(value);
};
</script>
