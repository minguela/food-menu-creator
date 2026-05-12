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
    return "border-[rgba(114,206,123,0.2)] bg-emerald-50 text-[var(--success)]";
  }
  if (props.quality.status === "incomplete") {
    return "border-[rgba(255,214,0,0.2)] bg-[rgba(255,214,0,0.06)] text-[var(--goldenrod)]";
  }
<<<<<<< Updated upstream
  return "border-[rgba(255,100,103,0.2)] bg-[rgba(255,100,103,0.06)] text-[var(--danger)]";
=======
  return "border-red-200 bg-danger/6 text-danger";
>>>>>>> Stashed changes
});
</script>

