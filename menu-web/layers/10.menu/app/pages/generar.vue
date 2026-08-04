<script setup lang="ts">
const { generating, error, menu, days, mealsPerDay, generate } = useGenerateMenuPage()
useHead({ title: 'Generar menú — Food Menu Creator' })
</script>

<template>
  <div class="min-h-screen bg-transparent">
    <div class="max-w-3xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-6">✨ Generar Menú Semanal</h1>
      
      <div class="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 mb-8">
        <div>
          <label class="block text-sm text-slate-300 mb-1">Días</label>
          <input v-model.number="days" type="number" min="1" max="14" class="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white" />
        </div>
        <div>
          <label class="block text-sm text-slate-300 mb-1">Comidas por día</label>
          <input v-model.number="mealsPerDay" type="number" min="1" max="5" class="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white" />
        </div>
        <button @click="generate" :disabled="generating"
          class="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition">
          {{ generating ? 'Generando...' : 'Generar menú' }}
        </button>
      </div>

      <div v-if="error" class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">{{ error }}</div>

      <div v-if="menu" class="p-6 rounded-2xl bg-white/5 border border-white/10">
        <h2 class="text-xl font-semibold text-white mb-4">{{ menu.name }}</h2>
        <div v-for="day in menu.days" :key="day.day" class="mb-6">
          <h3 class="text-sm text-indigo-400 font-medium mb-2">{{ day.day }}</h3>
          <div v-for="meal in day.meals" :key="meal.recipe_id" class="flex items-center gap-2 py-1 text-sm text-slate-300">
            <span class="text-xs text-slate-500 w-16">{{ meal.type }}</span>
            <span>{{ meal.recipe_name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
