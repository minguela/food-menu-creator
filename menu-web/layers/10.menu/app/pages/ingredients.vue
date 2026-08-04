<script setup lang="ts">
const { ingredients, loading, load } = useIngredientsPage()
onMounted(load)
useHead({ title: 'Ingredientes — Food Menu Creator' })
</script>
<template>
  <div class="min-h-screen bg-transparent max-w-6xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">🥕 Ingredientes</h1>
    <div v-if="loading" class="text-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto" /></div>
    <div v-else-if="ingredients.length === 0" class="text-center py-16 text-slate-400">No hay ingredientes</div>
    <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="ing in ingredients" :key="ing.id" class="p-4 rounded-xl bg-white/5 border border-white/10">
        <p class="text-white font-medium">{{ ing.name }}</p>
        <p v-if="ing.category" class="text-xs text-slate-500 mt-1">{{ ing.category }}</p>
      </div>
    </div>
  </div>
</template>
