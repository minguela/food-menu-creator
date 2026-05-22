<template>
  <div
    v-if="state.open"
    class="fixed inset-0 z-[70] flex items-center justify-center p-4"
    @click.self="confirmCancel"
  >
    <div class="absolute inset-0 bg-slate-950/65 backdrop-blur-[1px]" />
    <div
      ref="dialogRef"
      class="ui-surface relative w-full max-w-md overflow-hidden shadow-2xl"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="messageId"
    >
      <div class="h-1.5" :class="state.danger ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-indigo-500 to-sky-600'" />
      <div class="p-5">
      <h3 :id="titleId" class="ui-title text-lg font-semibold">
        {{ state.title }}
      </h3>
      <p :id="messageId" class="ui-muted mt-2 text-sm">
        {{ state.message }}
      </p>
      <div class="mt-5 flex justify-end gap-2">
        <button
          ref="cancelButtonRef"
          class="ui-btn-muted px-3 py-2 text-sm"
          @click="confirmCancel"
        >
          {{ state.cancelText }}
        </button>
        <button
          class="rounded-lg px-3 py-2 text-sm text-white"
          :class="state.danger ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30'"
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
const dialogRef = ref<HTMLElement | null>(null);
const cancelButtonRef = ref<HTMLButtonElement | null>(null);
const titleId = "app-confirm-dialog-title";
const messageId = "app-confirm-dialog-message";

const onKeydown = (event: KeyboardEvent) => {
  if (!state.value.open) return;
  if (event.key === "Escape") {
    confirmCancel();
  }
};

watch(
  () => state.value.open,
  (isOpen) => {
    if (!isOpen) return;
    nextTick(() => {
      cancelButtonRef.value?.focus();
    });
  },
);

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
});
</script>
