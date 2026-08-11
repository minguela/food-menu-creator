<script setup lang="ts">
const { menus, loading, error, load, remove } = useMenuListPage()
const user = useCurrentUser()

onMounted(load)

useHead({ title: 'Menús Semanales — Food Menu Creator' })
</script>

<template>
  <div class="min-h-screen bg-transparent">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 class="ui-title text-3xl font-bold">Menús Semanales</h1>
            <p class="ui-subtle text-sm mt-1">Planifica tu alimentación esta semana</p>
          </div>
        </div>
        <NuxtLink to="/generar" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition">
          <span>+ Generar menú</span>
        </NuxtLink>
      </div>

      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto" />
        <p class="mt-4 text-slate-300">Cargando menús...</p>
      </div>

      <div v-else-if="error" class="text-center py-12 text-red-400">
        Error: {{ error }}
      </div>

      <div v-else-if="menus.length === 0" class="text-center py-16">
        <p class="text-slate-400 text-lg mb-4">No tienes menús todavía</p>
        <NuxtLink to="/generar" class="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition">Crear tu primer menú</NuxtLink>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink v-for="menu in menus" :key="menu.id" :to="`/menu/${menu.id}`"
          class="block p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-400/50 hover:bg-white/[0.08] transition">
          <div class="flex justify-between items-start">
            <h2 class="text-lg font-semibold text-white">{{ menu.name }}</h2>
            <span class="text-xs bg-indigo-500/20 text-indigo-200 px-2 py-1 rounded-full">Sem {{ menu.week_number }}</span>
          </div>
          <p class="text-sm text-slate-400 mt-2">{{ menu.days?.length || 0 }} días</p>
          <button @click.prevent="remove(menu.id)" class="mt-3 text-xs text-red-400 hover:text-red-300">Eliminar</button>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
