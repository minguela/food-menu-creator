<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">⚙️ Configuración</h1>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Configuración nutricional -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <h2 class="text-lg font-semibold mb-4">🎯 Objetivos nutricionales</h2>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Calorías diarias objetivo (kcal)
          </label>
          <input
            v-model.number="config.daily_kcal_target"
            type="number"
            min="1000"
            max="4000"
            step="50"
            class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Proteína diaria objetivo (g)
          </label>
          <input
            v-model.number="config.daily_protein_target"
            type="number"
            min="50"
            max="300"
            step="5"
            class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Número de personas
          </label>
          <input
            v-model.number="config.persons_count"
            type="number"
            min="1"
            max="10"
            class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <p class="text-xs text-gray-500 mt-1">
            Usado para ajustar cantidades de ingredientes
          </p>
        </div>

        <button
          @click="saveConfig"
          :disabled="saving || !isDirty"
          class="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {{ saving ? 'Guardando...' : 'Guardar configuración' }}
        </button>

        <p v-if="saved" class="text-green-600 text-sm mt-2 text-center">
          ✅ Configuración guardada
        </p>
      </div>

      <!-- Información de usuario -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <h2 class="text-lg font-semibold mb-4">📊 Información</h2>

        <div class="space-y-4">
          <div class="flex justify-between py-2 border-b">
            <span class="text-gray-600">ID Usuario</span>
            <span class="font-mono text-sm">{{ user?.id?.slice(0, 8) }}...</span>
          </div>
          <div class="flex justify-between py-2 border-b">
            <span class="text-gray-600">Telegram</span>
            <span class="text-gray-900">
              {{ user?.telegram_id ? `@${user.telegram_id}` : 'No vinculado' }}
            </span>
          </div>
          <div class="flex justify-between py-2 border-b">
            <span class="text-gray-600">Creado</span>
            <span class="text-gray-900">{{ formatDate(user?.created_at) }}</span>
          </div>
        </div>

        <!-- Ejemplo de distribución -->
        <div class="mt-6 p-4 bg-indigo-50 rounded-lg">
          <h3 class="font-medium text-indigo-900 mb-2">📋 Distribución por comida</h3>
          <div class="space-y-2 text-sm text-indigo-800">
            <div class="flex justify-between">
              <span>Comida (50%)</span>
              <span>{{ Math.round(config.daily_kcal_target / 2) }} kcal</span>
            </div>
            <div class="flex justify-between">
              <span>Cena (50%)</span>
              <span>{{ Math.round(config.daily_kcal_target / 2) }} kcal</span>
            </div>
            <div class="flex justify-between pt-2 border-t border-indigo-200">
              <span>Proteína por comida</span>
              <span>{{ Math.round(config.daily_protein_target / 2) }} g</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enlaces rápidos -->
    <div class="mt-6 bg-white rounded-lg shadow-sm border p-6">
      <h2 class="text-lg font-semibold mb-4">🔗 Enlaces rápidos</h2>
      <div class="flex flex-wrap gap-3">
        <NuxtLink
          href="/"
          class="px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          📅 Ver menús
        </NuxtLink>
        <NuxtLink
          href="/generar"
          class="px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          🔄 Generar menú
        </NuxtLink>
        <NuxtLink
          href="/shopping"
          class="px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          🛒 Lista de compra
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User } from '~/types'

const supabase = useSupabase()

const user = ref<User | null>(null)
const config = ref({
  daily_kcal_target: 1900,
  daily_protein_target: 120,
  persons_count: 2
})

const saving = ref(false)
const saved = ref(false)

const isDirty = computed(() => {
  if (!user.value) return false
  return (
    config.value.daily_kcal_target !== user.value.daily_kcal_target ||
    config.value.daily_protein_target !== user.value.daily_protein_target ||
    config.value.persons_count !== user.value.persons_count
  )
})

const loadUser = async () => {
  // Obtener usuario por defecto (primero encontrado)
  // En producción: usar sesión o telegram_id almacenado
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    console.error('Error cargando usuario:', error)
    return
  }

  user.value = data
  config.value = {
    daily_kcal_target: data.daily_kcal_target || 1900,
    daily_protein_target: Number(data.daily_protein_target) || 120,
    persons_count: data.persons_count || 2
  }
}

const saveConfig = async () => {
  if (!user.value) return

  saving.value = true
  saved.value = false

  const { error } = await supabase
    .from('users')
    .update({
      daily_kcal_target: config.value.daily_kcal_target,
      daily_protein_target: config.value.daily_protein_target,
      persons_count: config.value.persons_count,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.value.id)

  if (error) {
    console.error('Error guardando:', error)
    alert('Error guardando configuración: ' + error.message)
  } else {
    saved.value = true
    // Recargar para actualizar valores
    await loadUser()
    setTimeout(() => saved.value = false, 3000)
  }

  saving.value = false
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Desconocido'
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

onMounted(() => {
  loadUser()
})
</script>
