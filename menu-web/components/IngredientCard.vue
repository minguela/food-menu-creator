<template>
  <article
<<<<<<< Updated upstream
    class="rounded-lg border bg-[var(--surface-1)] p-4 shadow-sm"
    :class="[ active ? 'border-[rgba(255,255,255,0.25)] ring-2 ring-[rgba(187,222,242,0.3)] ' : 'border-[var(--border-soft)]',
      quality.status === 'inconsistent' ? 'border-[rgba(255,100,103,0.2)]' : '',
      quality.status === 'incomplete' ? 'border-[rgba(255,214,0,0.2)]' : '',
=======
    class="rounded-lg border bg-surface-1 p-4 shadow-sm"
    :class="[ active ? 'border-[rgba(255,255,255,0.25)]  ring-2 ring-[rgba(187,222,242,0.3)] ' : 'border-border-soft',
      quality.status === 'inconsistent' ? 'border-red-200' : '',
      quality.status === 'incomplete' ? 'border-amber-200' : '',
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
            class="rounded-full bg-[rgba(187,222,242,0.08)] px-2 py-1 text-xs font-medium text-[var(--accent)]"
=======
            class="rounded-full bg-accent/10 px-2 py-1 text-xs font-medium text-indigo-700"
>>>>>>> Stashed changes
          >
            Editado
          </span>
          <span class="rounded-full bg-[rgba(255,154,0,0.08)] px-2 py-1 text-xs font-medium text-[var(--goldenrod)]">
            {{ caloricLabel }}
          </span>
          <span
            v-if="row.review_reason"
            class="rounded-full bg-[rgba(255,214,0,0.06)] px-2 py-1 text-xs font-medium text-[var(--goldenrod)]"
          >
            revisión: {{ row.review_reason }}
          </span>
        </div>
        <input
          :value="row.name"
          class="w-full rounded-md border border-border-soft bg-transparent px-3 py-2 text-base font-semibold text-text-1"
          placeholder="Nombre del ingrediente"
          @input="patchName"
        />
        <input
          :value="row.english_name || ''"
          class="w-full rounded-md border border-border-soft bg-transparent px-3 py-2 text-sm text-text-2"
          placeholder="Nombre en inglés (opcional)"
          @input="patchEnglishName"
        />
      </div>

      <div class="flex flex-wrap justify-end gap-2">
        <button
<<<<<<< Updated upstream
          class="rounded-md border border-[var(--border-soft)] px-3 py-2 text-xs font-medium text-[var(--text-2)] hover:bg-[rgba(255,255,255,0.06)] disabled:opacity-50"
=======
          class="rounded-md border border-border-soft px-3 py-2 text-xs font-medium text-text-2 hover:bg-gray-50 disabled:opacity-50"
>>>>>>> Stashed changes
          :disabled="saving || isFirst"
          @click="$emit('previous')"
        >
          Anterior
        </button>
        <button
<<<<<<< Updated upstream
          class="rounded-md border border-[var(--border-soft)] px-3 py-2 text-xs font-medium text-[var(--text-2)] hover:bg-[rgba(255,255,255,0.06)] disabled:opacity-50"
=======
          class="rounded-md border border-border-soft px-3 py-2 text-xs font-medium text-text-2 hover:bg-gray-50 disabled:opacity-50"
>>>>>>> Stashed changes
          :disabled="saving || isLast"
          @click="$emit('next')"
        >
          Siguiente
        </button>
      </div>
    </div>

    <div class="mt-4 grid gap-3 lg:grid-cols-[140px_1fr]">
      <label class="space-y-1">
        <span class="text-xs font-medium text-text-2">Unidad</span>
        <select
          :value="row.default_unit_type"
          class="w-full rounded-md border border-border-soft bg-transparent px-3 py-2 text-sm text-text-2"
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
<<<<<<< Updated upstream
      :class="quality.status === 'inconsistent' ? 'border-[rgba(255,100,103,0.2)] bg-[rgba(255,100,103,0.06)] text-[var(--danger)]' : 'border-[rgba(255,214,0,0.2)] bg-[rgba(255,214,0,0.06)] text-[var(--goldenrod)]'"
=======
      :class="quality.status === 'inconsistent' ? 'border-red-200 bg-danger/6 text-danger' : 'border-amber-200 bg-amber-50 text-amber-700'"
>>>>>>> Stashed changes
    >
      <p class="font-medium">{{ quality.warnings.join(" · ") }}</p>
      <p v-if="quality.calculatedKcal !== null" class="mt-1">
        kcal calculadas por macros:
        {{ Number(quality.calculatedKcal).toFixed(1) }}
      </p>
    </div>

    <div class="mt-3 grid gap-3 lg:grid-cols-2">
      <div class="rounded-md bg-surface-2 p-3 text-xs text-text-2">
        <p class="font-medium text-text-2">Valores originales</p>
        <p>
          {{ original.kcal_per_100g ?? "?" }} kcal · P
          {{ original.protein_per_100g ?? "?" }} · H
          {{ original.carbs_per_100g ?? "?" }} · G
          {{ original.fat_per_100g ?? "?" }}
        </p>
      </div>
      <div class="rounded-md bg-surface-2 p-3 text-xs text-text-2">
        <p class="font-medium text-text-2">Recetas</p>
        <div class="mt-1 flex flex-wrap gap-1">
          <NuxtLink
            v-for="recipe in recipes.slice(0, 4)"
            :key="recipe.id"
            :to="{ path: '/recipes', query: { recipe: recipe.id } }"
<<<<<<< Updated upstream
            class="rounded border border-[var(--border-soft)] bg-[var(--surface-1)] px-2 py-1 text-[var(--accent)] hover:bg-[rgba(187,222,242,0.08)] "
=======
            class="rounded border border-border-soft bg-surface-1 px-2 py-1 text-sky-700 hover:bg-accent/10 "
>>>>>>> Stashed changes
          >
            {{ recipe.name }}
          </NuxtLink>
          <span v-if="recipes.length > 4" class="px-2 py-1 text-text-3">
            +{{ recipes.length - 4 }}
          </span>
          <span v-if="recipes.length === 0" class="text-text-3">
            Sin recetas
          </span>
        </div>
      </div>
    </div>

<<<<<<< Updated upstream
    <div v-if="candidates.length > 0" class="mt-3 rounded-md border border-[rgba(187,222,242,0.2)] bg-[rgba(187,222,242,0.08)] p-3">
      <p class="text-xs font-medium text-[var(--accent)] ">Sugerencias disponibles</p>
=======
    <div v-if="candidates.length > 0" class="mt-3 rounded-md border border-accent/20 bg-accent/10  p-3">
      <p class="text-xs font-medium text-accent ">Sugerencias disponibles</p>
>>>>>>> Stashed changes
      <div class="mt-2 space-y-2">
        <div
          v-for="candidate in candidates.slice(0, 2)"
          :key="candidate.id"
<<<<<<< Updated upstream
          class="flex flex-wrap items-center justify-between gap-2 rounded-md bg-[var(--surface-1)] p-2 text-xs"
=======
          class="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface-1 p-2 text-xs"
>>>>>>> Stashed changes
        >
          <span class="text-text-2">
            {{ candidate.name }} · {{ candidate.kcal_per_100g ?? "?" }} kcal ·
            confianza {{ Number(candidate.confidence || 0).toFixed(2) }}
          </span>
          <button
            class="font-medium text-[var(--accent)]"
            @click="$emit('apply-candidate', candidate.id)"
          >
            Aplicar
          </button>
          <button
            class="font-medium text-text-2"
            @click="$emit('show-candidate-debug', candidate.id)"
          >
            Ver debug
          </button>
        </div>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap items-center justify-end gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <span v-if="saveState === 'success'" class="text-xs text-[var(--success)]">
          Guardado
        </span>
        <span v-if="saveState === 'error'" class="text-xs text-danger">
          Error al guardar
        </span>
        <button
<<<<<<< Updated upstream
          class="rounded-md bg-[var(--accent)] px-3 py-2 text-xs font-medium text-[var(--text-1)] hover:brightness-110 disabled:opacity-50"
=======
          class="rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-text-1 hover:bg-indigo-700 disabled:opacity-50"
>>>>>>> Stashed changes
          :disabled="saving || !row.name.trim()"
          @click="$emit('save')"
        >
          {{ saving ? "Guardando..." : "Guardar ingrediente" }}
        </button>
        <button
<<<<<<< Updated upstream
          class="rounded-md bg-[var(--success)] px-3 py-2 text-xs font-medium text-[var(--text-1)] hover:brightness-110 disabled:opacity-50"
=======
          class="rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-text-1 hover:bg-emerald-700 disabled:opacity-50"
>>>>>>> Stashed changes
          :disabled="saving || !row.name.trim()"
          @click="$emit('save-next')"
        >
          Guardar y siguiente
        </button>
        <button
          class="rounded-md border border-danger/20 px-3 py-2 text-xs font-medium text-danger hover:bg-danger/10"
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
