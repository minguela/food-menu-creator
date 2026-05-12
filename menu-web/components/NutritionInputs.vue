<template>
  <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <label
      v-for="field in fields"
      :key="field.key"
      class="space-y-1"
    >
      <span class="ui-muted text-xs font-medium">{{ field.label }}</span>
      <input
        :value="modelValue[field.key] ?? ''"
        type="number"
        min="0"
        max="999"
        step="0.1"
        inputmode="decimal"
        class="ui-input w-full rounded-md px-3 py-2 text-sm"
        :class="changedFields.includes(field.key)
          ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
          : ''"
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
