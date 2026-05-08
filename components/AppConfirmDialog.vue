<template>
  <div
    v-if="state.open"
    class="fixed inset-0 z-[70] flex items-center justify-center p-4"
    @click.self="confirmCancel"
  >
    <div class="absolute inset-0 bg-black/55" />
    <div class="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-2xl">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {{ state.title }}
      </h3>
      <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {{ state.message }}
      </p>
      <div class="mt-5 flex justify-end gap-2">
        <button
          class="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          @click="confirmCancel"
        >
          {{ state.cancelText }}
        </button>
        <button
          class="rounded-lg px-3 py-2 text-sm text-white"
          :class="state.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'"
          @click="confirmAccept"
        >
          {{ state.confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { state, confirmAccept, confirmCancel } = useConfirmDialog();
</script>
