<template>
  <button
    type="button"
    :title="label"
    :aria-label="label"
    :disabled="disabled"
    class="inline-flex items-center justify-center rounded-xl border transition-all disabled:cursor-not-allowed disabled:opacity-50"
    :class="[toneClass, compact ? 'h-11 w-11' : 'gap-2 px-3 py-2 text-sm font-medium']"
  >
    <FontAwesomeIcon :icon="icon" :class="compact ? 'text-base' : 'text-sm'" />
    <span v-if="!compact">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

const props = withDefaults(
  defineProps<{
    label: string;
    icon: IconDefinition;
    compact?: boolean;
    disabled?: boolean;
    tone?: "default" | "primary" | "danger" | "success";
  }>(),
  {
    compact: true,
    disabled: false,
    tone: "default",
  },
);

const toneClass = computed(() => {
  if (props.tone === "primary") {
    return "border-amber-400/50 bg-amber-500 text-white shadow-lg shadow-amber-200 hover:bg-amber-600";
  }
  if (props.tone === "danger") {
    return "border-red-300 bg-red-50 text-red-700 hover:border-red-400 hover:bg-red-100";
  }
  if (props.tone === "success") {
    return "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100";
  }
  return "border-[var(--color-border-strong)] bg-[var(--color-surface-2)] ui-muted hover:bg-[var(--color-surface-3)]";
});
</script>
