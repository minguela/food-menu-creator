<template>
  <article
    class="ui-surface rounded-lg p-4 shadow-sm"
    :class="[
      active ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent-soft)]' : 'ui-divider',
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
            class="rounded-full bg-[var(--color-accent-soft)] px-2 py-1 text-xs font-medium ui-muted"
          >
            Editado
          </span>
          <span class="rounded-full bg-[var(--color-warning-muted)] px-2 py-1 text-xs font-medium text-[var(--color-warning)]">
            {{ caloricLabel }}
          </span>
          <span
            v-if="row.review_reason"
            class="rounded-full bg-[var(--color-warning-muted)] px-2 py-1 text-xs font-medium text-[var(--color-warning)]"
          >
            revisión: {{ row.review_reason }}
          </span>
        </div>
        <input
          :value="row.name"
          class="ui-input w-full rounded-md px-3 py-2 text-base font-semibold"
          placeholder="Nombre del ingrediente"
          @input="patchName"
        />
        <input
          :value="row.english_name || ''"
          class="ui-input w-full rounded-md px-3 py-2 text-sm ui-muted"
          placeholder="Nombre en inglés (opcional)"
          @input="patchEnglishName"
        />
      </div>

      <div class="flex flex-wrap justify-end gap-2">
        <button
          class="ui-btn-muted rounded-md px-3 py-2 text-xs font-medium disabled:opacity-50"
          :disabled="saving || isFirst"
          @click="$emit('previous')"
        >
          Anterior
        </button>
        <button
          class="ui-btn-muted rounded-md px-3 py-2 text-xs font-medium disabled:opacity-50"
          :disabled="saving || isLast"
          @click="$emit('next')"
        >
          Siguiente
        </button>
      </div>
    </div>

    <div class="mt-4 grid gap-3 lg:grid-cols-[140px_1fr]">
      <label class="space-y-1">
        <span class="ui-muted text-xs font-medium">Unidad</span>
        <select
          :value="row.default_unit_type"
          class="ui-select w-full rounded-md px-3 py-2 text-sm ui-muted"
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
      :class="quality.status === 'inconsistent' ? 'border-[var(--color-danger)] bg-[var(--color-danger-muted)] ui-danger' : 'border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]'"
    >
      <p class="font-medium">{{ quality.warnings.join(" · ") }}</p>
      <p v-if="quality.calculatedKcal !== null" class="mt-1">
        kcal calculadas por macros:
        {{ Number(quality.calculatedKcal).toFixed(1) }}
      </p>
    </div>

    <div class="mt-3 grid gap-3 lg:grid-cols-2">
      <div class="rounded-md bg-[var(--color-surface-3)] p-3 text-xs ui-subtle">
        <p class="font-medium ui-muted">Valores originales</p>
        <p>
          {{ original.kcal_per_100g ?? "?" }} kcal · P
          {{ original.protein_per_100g ?? "?" }} · H
          {{ original.carbs_per_100g ?? "?" }} · G
          {{ original.fat_per_100g ?? "?" }}
        </p>
      </div>
      <div class="rounded-md bg-[var(--color-surface-3)] p-3 text-xs ui-subtle">
        <p class="font-medium ui-muted">Recetas</p>
        <div class="mt-1 flex flex-wrap gap-1">
          <NuxtLink
            v-for="recipe in recipes.slice(0, 4)"
            :key="recipe.id"
            :to="{ path: '/recipes', query: { recipe: recipe.id } }"
            class="rounded border ui-divider bg-[var(--color-surface-2)] px-2 py-1 text-sky-300 hover:bg-[var(--color-surface-3)]"
          >
            {{ recipe.name }}
          </NuxtLink>
          <span v-if="recipes.length > 4" class="px-2 py-1 ui-subtle">
            +{{ recipes.length - 4 }}
          </span>
          <span v-if="recipes.length === 0" class="ui-subtle">
            Sin recetas
          </span>
        </div>
      </div>
    </div>

    <div v-if="candidates.length > 0" class="mt-3 rounded-md border border-sky-700/50 bg-sky-950/30 p-3">
      <p class="text-xs font-medium text-sky-300">Sugerencias disponibles</p>
      <div class="mt-2 space-y-2">
        <div
          v-for="candidate in candidates.slice(0, 2)"
          :key="candidate.id"
           class="flex flex-wrap items-center justify-between gap-2 rounded-md bg-[var(--color-surface-2)] p-2 text-xs"
        >
          <span class="ui-muted">
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
            class="font-medium ui-subtle"
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
          class="ui-btn-primary rounded-md px-3 py-2 text-xs font-medium disabled:opacity-50"
          :disabled="saving || !row.name.trim()"
          @click="$emit('save')"
        >
          {{ saving ? "Guardando..." : "Guardar ingrediente" }}
        </button>
        <button
          class="ui-btn-primary rounded-md px-3 py-2 text-xs font-medium disabled:opacity-50"
          :disabled="saving || !row.name.trim()"
          @click="$emit('save-next')"
        >
          Guardar y siguiente
        </button>
        <button
          class="ui-btn-danger rounded-md px-3 py-2 text-xs font-medium"
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
