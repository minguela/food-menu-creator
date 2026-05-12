<template>
  <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <label
      v-for="field in fields"
      :key="field.key"
      class="space-y-1"
    >
      <span class="text-xs font-medium text-text-2">{{ field.label }}</span>
      <input
        :value="modelValue[field.key] ?? ''"
        type="number"
        min="0"
        max="999"
        step="0.1"
        inputmode="decimal"
        class="w-full rounded-md border px-3 py-2 text-sm"
<<<<<<< Updated upstream
        :class="changedFields.includes(field.key) ? 'border-[rgba(255,255,255,0.25)] bg-[rgba(187,222,242,0.08)] bg-[var(--surface-3)] text-[var(--text-1)]'
          : 'border-[var(--border-soft)] bg-transparent  text-[var(--text-1)]'"
=======
        :class="changedFields.includes(field.key) ? 'border-[rgba(255,255,255,0.25)]  bg-accent/10 dark:bg-indigo-950/40 text-text-1'
          : 'border-border-soft bg-transparent  text-text-1'"
>>>>>>> Stashed changes
        @input="updateValue(field.key, $event)"
      />
    </label>
  </div>
</template>

<script setup lang="ts">
import type { IngredientNutritionValues } from "~/utils/ingredient-nutrition-quality";

type NutritionField = keyof IngredientNutritionValues;

const props = defineProps<{
  modelValue: IngredientNutritionValues;
  changedFields: string[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: IngredientNutritionValues];
}>();

const fields: Array<{ key: NutritionField; label: string }> = [
  { key: "kcal_per_100g", label: "kcal/100g" },
  { key: "protein_per_100g", label: "Proteína/100g" },
  { key: "carbs_per_100g", label: "Hidratos/100g" },
  { key: "fat_per_100g", label: "Grasa/100g" },
];

const updateValue = (key: NutritionField, event: Event) => {
  const rawValue = (event.target as HTMLInputElement).value;
  const nextValue = rawValue === "" ? null : Number(rawValue);
  emit("update:modelValue", {
    ...props.modelValue,
    [key]: Number.isFinite(nextValue) ? nextValue : null,
  });
};
</script>
