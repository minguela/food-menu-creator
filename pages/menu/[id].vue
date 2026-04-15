<template>
  <div>
    <!-- Estado de carga -->
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      <p class="mt-4 text-gray-600">Cargando menú...</p>
    </div>

    <div v-else-if="menu" class="space-y-6">
      <!-- Cabecera -->
      <div class="flex justify-between items-start">
        <div>
          <div class="flex items-center gap-3">
            <button @click="$router.back()" class="text-gray-500 hover:text-gray-700">
              ← Volver
            </button>
            <h1 class="text-2xl font-bold text-gray-900">{{ menu.name }}</h1>
            <span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
              Semana {{ menu.week_number }}
            </span>
          </div>
          <p class="text-sm text-gray-500 mt-1">
            {{ mealsCount }}/14 platos • Creado: {{ formatDate(menu.created_at) }}
          </p>
        </div>
        <button
          v-if="mealsCount >= 14"
          class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          ✅ Completo
        </button>
      </div>

      <!-- Grid de días -->
      <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div class="grid grid-cols-7 border-b">
          <div
            v-for="day in 7"
            :key="day"
            class="p-3 text-center font-semibold text-gray-700 border-r last:border-r-0 bg-gray-50"
          >
            Día {{ day }}
          </div>
        </div>

        <!-- Comida -->
        <div class="border-b">
          <div class="bg-amber-50 px-3 py-2 font-medium text-amber-800 text-sm">
            🍽️ Comida
          </div>
          <div class="grid grid-cols-7">
            <div
              v-for="day in 7"
              :key="`comida-${day}`"
              class="p-2 border-r last:border-r-0 min-h-[80px]"
              :class="getMeal(day, 'comida') ? 'bg-white' : 'bg-gray-50'"
            >
              <div
                v-if="getMeal(day, 'comida')"
                class="text-sm"
              >
                <p class="font-medium text-gray-900">{{ getMeal(day, 'comida')?.dish_name }}</p>
                <button
                  @click="deleteMeal(getMeal(day, 'comida')!.id)"
                  class="text-xs text-red-500 hover:text-red-700 mt-1"
                >
                  Eliminar
                </button>
              </div>
              <button
                v-else
                @click="openMealModal(day, 'comida')"
                class="text-xs text-indigo-600 hover:text-indigo-800"
              >
                + Añadir
              </button>
            </div>
          </div>
        </div>

        <!-- Cena -->
        <div>
          <div class="bg-indigo-50 px-3 py-2 font-medium text-indigo-800 text-sm">
            🌙 Cena
          </div>
          <div class="grid grid-cols-7">
            <div
              v-for="day in 7"
              :key="`cena-${day}`"
              class="p-2 border-r last:border-r-0 min-h-[80px]"
              :class="getMeal(day, 'cena') ? 'bg-white' : 'bg-gray-50'"
            >
              <div
                v-if="getMeal(day, 'cena')"
                class="text-sm"
              >
                <p class="font-medium text-gray-900">{{ getMeal(day, 'cena')?.dish_name }}</p>
                <button
                  @click="deleteMeal(getMeal(day, 'cena')!.id)"
                  class="text-xs text-red-500 hover:text-red-700 mt-1"
                >
                  Eliminar
                </button>
              </div>
              <button
                v-else
                @click="openMealModal(day, 'cena')"
                class="text-xs text-indigo-600 hover:text-indigo-800"
              >
                + Añadir
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal para añadir plato -->
      <div
        v-if="showMealModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        @click.self="showMealModal = false"
      >
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 class="text-xl font-bold mb-4">
            Añadir plato - Día {{ selectedDay }} {{ selectedType === 'comida' ? '🍽️' : '🌙' }}
          </h2>
          <input
            v-model="newMealName"
            type="text"
            placeholder="Nombre del plato (ej: Pollo al horno)"
            class="w-full border rounded-lg px-4 py-2 mb-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            @keyup.enter="addMeal"
          />
          <input
            v-model="newMealDescription"
            type="text"
            placeholder="Descripción opcional"
            class="w-full border rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            @keyup.enter="addMeal"
          />
          <div class="flex gap-2 justify-end">
            <button
              @click="showMealModal = false"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              @click="addMeal"
              :disabled="!newMealName.trim()"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12 bg-white rounded-lg border">
      <p class="text-gray-600">Menú no encontrado</p>
      <button @click="$router.push('/')" class="mt-4 text-indigo-600 hover:text-indigo-800">
        Volver a la lista
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WeeklyMenu, WeeklyMeal } from '~/types'

const supabase = useSupabase()
const route = useRoute()

const menu = ref<WeeklyMenu | null>(null)
const meals = ref<WeeklyMeal[]>([])
const loading = ref(true)
const showMealModal = ref(false)
const selectedDay = ref(1)
const selectedType = ref<'comida' | 'cena'>('comida')
const newMealName = ref('')
const newMealDescription = ref('')

const mealsCount = computed(() => meals.value.length)

const loadMenu = async () => {
  loading.value = true

  const { data: menuData } = await supabase
    .from('weekly_menus')
    .select('*')
    .eq('id', route.params.id)
    .single()

  if (menuData) {
    menu.value = menuData

    const { data: mealsData } = await supabase
      .from('weekly_meals')
      .select('*')
      .eq('weekly_menu_id', route.params.id as string)
      .order('day_number', { ascending: true })

    meals.value = mealsData || []
  }

  loading.value = false
}

const getMeal = (day: number, type: 'comida' | 'cena') => {
  return meals.value.find(m => m.day_number === day && m.meal_type === type)
}

const openMealModal = (day: number, type: 'comida' | 'cena') => {
  selectedDay.value = day
  selectedType.value = type
  newMealName.value = ''
  newMealDescription.value = ''
  showMealModal.value = true
}

const addMeal = async () => {
  if (!newMealName.trim() || !menu.value) return

  const { error } = await supabase.from('weekly_meals').insert({
    weekly_menu_id: menu.value.id,
    day_number: selectedDay.value,
    meal_type: selectedType.value,
    dish_name: newMealName.trim(),
    dish_description: newMealDescription.trim() || null,
  })

  if (error) {
    if (error.code === '23505') {
      alert('Ya hay un plato para este día y tipo. Elimínalo primero.')
    } else {
      alert('Error: ' + error.message)
    }
    return
  }

  showMealModal.value = false
  await loadMenu()
}

const deleteMeal = async (mealId: string) => {
  if (!confirm('¿Eliminar este plato?')) return

  const { error } = await supabase
    .from('weekly_meals')
    .delete()
    .eq('id', mealId)

  if (error) {
    alert('Error: ' + error.message)
    return
  }

  await loadMenu()
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

onMounted(() => {
  loadMenu()
})
</script>
