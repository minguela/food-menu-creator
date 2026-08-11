<script setup lang="ts">
const { recipes, loading, load, remove } = useRecipesPage()
onMounted(load)
useHead({ title: 'Biblioteca de recetas — Food Menu Creator' })
</script>

<template>
  <div class="min-h-screen bg-transparent">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h1 class="ui-title text-3xl font-bold">Biblioteca de recetas</h1>
            <p class="text-slate-500 ui-subtle text-sm mt-1">Revisa y completa tus recetas</p>
          </div>
        </div>
      </header>

      <div v-if="loading" class="text-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-400 mx-auto" /></div>

      <div v-else-if="recipes.length === 0" class="text-center py-16">
        <p class="text-slate-400 text-lg">No hay recetas todavía</p>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="recipe in recipes" :key="recipe.id" class="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h2 class="text-lg font-semibold text-white">{{ recipe.name }}</h2>
          <p v-if="recipe.description" class="text-sm text-slate-400 mt-1">{{ recipe.description }}</p>
          <p class="text-xs text-slate-500 mt-2">{{ recipe.ingredients?.length || 0 }} ingredientes · {{ recipe.servings }} raciones</p>
          <button @click="remove(recipe.id)" class="mt-3 text-xs text-red-400 hover:text-red-300">Eliminar</button>
        </div>
      </div>
    </div>
  </div>
</template>
