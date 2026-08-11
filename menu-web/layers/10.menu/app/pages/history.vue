<script setup lang="ts">
const { menus, loading, load } = useHistoryPage()
onMounted(load)
useHead({ title: 'Historial — Food Menu Creator' })
</script>
<template>
  <div class="min-h-screen bg-transparent max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">📋 Historial de menús</h1>
    <div v-if="loading" class="text-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto" /></div>
    <div v-else-if="menus.length === 0" class="text-center py-16 text-slate-400">No hay menús generados</div>
    <div v-else class="space-y-3">
      <NuxtLink v-for="menu in menus" :key="menu.id" :to="`/menu/${menu.id}`"
        class="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-400/50 transition">
        <span class="text-xl">📅</span>
        <div><p class="text-white font-medium">{{ menu.name }}</p><p class="text-xs text-slate-500">Semana {{ menu.week_number }}</p></div>
        <span class="ml-auto text-xs text-slate-500">{{ menu.days?.length || 0 }} días</span>
      </NuxtLink>
    </div>
  </div>
</template>
