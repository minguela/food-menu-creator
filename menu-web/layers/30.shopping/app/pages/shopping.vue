<script setup lang="ts">
const { items, loading, uncheckedItems, checkedItems, load, toggle, remove } = useShoppingPage()
onMounted(load)
useHead({ title: 'Lista de la compra — Food Menu Creator' })
</script>

<template>
  <div class="min-h-screen bg-transparent">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 8a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </div>
          <div><h1 class="ui-title text-3xl font-bold">Lista de la Compra</h1></div>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto" /></div>

      <div v-else-if="items.length === 0" class="text-center py-16"><p class="text-slate-400 text-lg">No hay items en la lista</p></div>

      <div v-else class="space-y-4">
        <div v-for="item in uncheckedItems" :key="item.id" class="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
          <input type="checkbox" :checked="item.checked" @change="toggle(item.id, item.checked)" class="rounded" />
          <span class="flex-1 text-white">{{ item.name }}</span>
          <span class="text-sm text-slate-400">{{ item.quantity }} {{ item.unit }}</span>
          <button @click="remove(item.id)" class="text-red-400 hover:text-red-300 text-sm">✕</button>
        </div>
        <div v-if="checkedItems.length" class="mt-6">
          <h3 class="text-sm text-slate-500 mb-2">Comprado</h3>
          <div v-for="item in checkedItems" :key="item.id" class="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 opacity-50">
            <input type="checkbox" :checked="true" @change="toggle(item.id, true)" class="rounded" />
            <span class="flex-1 text-white line-through">{{ item.name }}</span>
            <span class="text-sm text-slate-400">{{ item.quantity }} {{ item.unit }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
