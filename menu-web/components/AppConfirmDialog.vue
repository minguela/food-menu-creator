<template>
  <div
    v-if="state.open"
    class="fixed inset-0 z-[70] flex items-center justify-center p-4"
    @click.self="confirmCancel"
  >
    <div class="absolute inset-0 bg-[var(--bg-canvas)]/70 backdrop-blur-[1px]" />
    <div class="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-1)] shadow-2xl">
      <div class="h-1.5" :class="state.danger ? 'bg-gradient-to-r from-[rgba(255,100,103,0.25)] to-[rgba(255,100,103,0.1)]' : 'bg-gradient-to-r from-[rgba(187,222,242,0.15)] to-sky-600'" />
      <div class="p-5">
      <h3 class="text-lg font-semibold text-[var(--text-1)]">
        {{ state.title }}
      </h3>
      <p class="mt-2 text-sm text-[var(--text-2)]">
        {{ state.message }}
      </p>
      <div class="mt-5 flex justify-end gap-2">
        <button
          class="rounded-lg border border-[var(--border-soft)] px-3 py-2 text-sm text-[var(--text-2)] hover:bg-[rgba(255,255,255,0.06)] "
          @click="confirmCancel"
        >
          {{ state.cancelText }}
        </button>
        <button
          class="rounded-lg px-3 py-2 text-sm text-[var(--text-1)]"
          :class="state.danger ? 'bg-[var(--danger)] hover:brightness-110 shadow-lg shadow-black/40' : 'bg-[var(--accent)] hover:brightness-110 shadow-lg shadow-black/40'"
          @click="confirmAccept"
        >
          {{ state.confirmText }}
        </button>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { state, confirmAccept, confirmCancel } = useConfirmDialog();

const onKeydown = (event: KeyboardEvent) => {
  if (!state.value.open) return;
  if (event.key === "Escape") {
    confirmCancel();
  }
};

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
});
</script>
