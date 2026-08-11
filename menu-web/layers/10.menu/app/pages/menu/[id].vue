<script setup lang="ts">
const { menu, loading, load, remove } = useMenuDetailPage()
onMounted(load)
useHead(() => ({ title: menu.value?.name || 'Menú — Food Menu Creator' }))
</script>

<template>
  <div class="min-h-screen bg-transparent p-6">
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto" />
    </div>
    <div v-else-if="menu" class="max-w-4xl mx-auto">
      <button @click="$router.back()" class="text-slate-400 hover:text-white mb-4">← Volver</button>
      <div class="flex items-center gap-3 mb-6">
        <h1 class="text-2xl font-bold text-white">{{ menu.name }}</h1>
        <span class="text-xs bg-indigo-500/20 text-indigo-200 px-2 py-1 rounded-full">Sem {{ menu.week_number }}</span>
      </div>
      <div v-for="day in menu.days" :key="day.day" class="mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
        <h3 class="text-lg font-semibold text-white mb-3">{{ day.day }}</h3>
        <div v-for="meal in day.meals" :key="meal.recipe_id" class="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
          <span class="text-xs text-slate-500 w-20 capitalize">{{ meal.type }}</span>
          <span class="text-slate-200">{{ meal.recipe_name }}</span>
          <span class="text-xs text-slate-500 ml-auto">{{ meal.servings }} raciones</span>
        </div>
      </div>
      <button @click="remove" class="mt-4 text-sm text-red-400 hover:text-red-300">Eliminar menú</button>
    </div>
    <div v-else class="text-center py-16 text-slate-400">Menú no encontrado</div>
  </div>
</template>
