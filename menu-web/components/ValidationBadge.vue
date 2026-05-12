<template>
  <span
    class="inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium"
    :class="classes"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import type { IngredientNutritionQuality } from "~/utils/ingredient-nutrition-quality";

const props = defineProps<{
  quality: IngredientNutritionQuality;
}>();

const label = computed(() => {
  if (props.quality.status === "ok") return "OK";
  if (props.quality.status === "incomplete") return "Datos incompletos";
  return "Datos inconsistentes";
});

const classes = computed(() => {
  if (props.quality.status === "ok") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (props.quality.status === "incomplete") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-red-200 bg-red-50 text-red-700";
});
</script>

