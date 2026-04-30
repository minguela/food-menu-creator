<template>
  <div>
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      <p class="mt-4 text-gray-600">Cargando menú...</p>
    </div>

    <div v-else-if="menu" class="space-y-6">
      <header class="flex flex-wrap justify-between gap-4">
        <div>
          <button @click="$router.back()" class="text-gray-500 hover:text-gray-700 mb-2">
            ← Volver
          </button>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-gray-900">{{ menu.name }}</h1>
            <span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
              Semana {{ menu.week_number }}
            </span>
          </div>
          <p class="text-sm text-gray-500 mt-1">
            {{ mealsCount }}/21 comidas · {{ formatDate(menu.created_at) }}
          </p>
        </div>
        <div class="text-right">
          <p class="text-sm text-gray-500">Ingredientes únicos</p>
          <p class="text-2xl font-semibold text-gray-900">{{ consolidatedIngredients.length }}</p>
        </div>
      </header>

      <section class="grid gap-4 lg:grid-cols-7">
        <article
          v-for="day in 7"
          :key="day"
          class="bg-white rounded-lg shadow-sm border overflow-hidden"
        >
          <div class="p-3 border-b bg-gray-50">
            <div class="flex justify-between items-center">
              <h2 class="font-semibold text-gray-900">Día {{ day }}</h2>
              <label class="text-xs text-indigo-600 cursor-pointer hover:text-indigo-800">
                Imagen
                <input type="file" accept="image/*" class="hidden" @change="uploadDailyImage(day, $event)" />
              </label>
            </div>
            <img
              v-if="getDayImage(day)"
              :src="getDayImage(day)?.image_url"
              alt="Imagen del menú diario"
              class="mt-3 h-28 w-full object-cover rounded"
            />
          </div>

          <div class="divide-y">
            <div v-for="type in mealTypes" :key="`${day}-${type}`" class="p-3 min-h-[130px]">
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-medium" :class="mealColor(type)">
                  {{ mealLabel(type) }}
                </p>
                <button
                  v-if="!getMeal(day, type)"
                  @click="openMealModal(day, type)"
                  class="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  + Añadir
                </button>
              </div>

              <div v-if="getMeal(day, type)" class="space-y-2">
                <p class="text-sm font-semibold text-gray-900">{{ getMeal(day, type)?.dish_name }}</p>
                <p class="text-xs text-gray-500">
                  {{ getMeal(day, type)?.kcal || 0 }} kcal ·
                  P {{ getMeal(day, type)?.protein_g || 0 }}g ·
                  H {{ getMeal(day, type)?.carbs_g || 0 }}g ·
                  G {{ getMeal(day, type)?.fat_g || 0 }}g
                </p>
                <ul class="text-xs text-gray-600 space-y-1">
                  <li v-for="ingredient in getMeal(day, type)?.weekly_meal_ingredients || []" :key="ingredient.id">
                    {{ ingredient.name }} · {{ ingredient.quantity }} {{ ingredient.unit_type }}
                  </li>
                </ul>
                <button
                  @click="deleteMeal(getMeal(day, type)!.id)"
                  class="text-xs text-red-500 hover:text-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>

          <div class="p-3 bg-gray-50 border-t text-xs text-gray-600">
            <p class="font-medium text-gray-900">Total día: {{ daySummary(day).kcal }} kcal</p>
            <p>P {{ daySummary(day).protein_g }}g · H {{ daySummary(day).carbs_g }}g · G {{ daySummary(day).fat_g }}g</p>
          </div>
        </article>
      </section>

      <section class="bg-white rounded-lg shadow-sm border p-4">
        <h2 class="font-semibold text-gray-900 mb-3">Ingredientes consolidados</h2>
        <div v-if="consolidatedIngredients.length === 0" class="text-sm text-gray-500">
          Añade ingredientes exactos a los platos para generar una lista de compra deduplicada.
        </div>
        <div v-else class="grid gap-2 md:grid-cols-4">
          <div v-for="ingredient in consolidatedIngredients" :key="`${ingredient.name}-${ingredient.unit_type}`" class="text-sm bg-gray-50 rounded p-2">
            <p class="font-medium text-gray-900">{{ ingredient.name }}</p>
            <p class="text-gray-600">{{ ingredient.quantity }} {{ ingredient.unit_type }}</p>
          </div>
        </div>
      </section>

      <div
        v-if="showMealModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="closeMealModal"
      >
        <form class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" @submit.prevent="addMeal">
          <h2 class="text-xl font-bold mb-4">
            Añadir {{ mealLabel(selectedType).toLowerCase() }} · Día {{ selectedDay }}
          </h2>

          <div class="grid gap-3 md:grid-cols-2">
            <label class="md:col-span-2">
              <span class="block text-sm font-medium text-gray-700 mb-1">Plato</span>
              <input v-model.trim="newMeal.dish_name" class="w-full border rounded-lg px-4 py-2" required />
            </label>
            <label class="md:col-span-2">
              <span class="block text-sm font-medium text-gray-700 mb-1">Descripción</span>
              <input v-model.trim="newMeal.dish_description" class="w-full border rounded-lg px-4 py-2" />
            </label>
            <label>
              <span class="block text-sm font-medium text-gray-700 mb-1">kcal</span>
              <input v-model.number="newMeal.kcal" type="number" min="0" class="w-full border rounded-lg px-4 py-2" />
            </label>
            <label>
              <span class="block text-sm font-medium text-gray-700 mb-1">Proteína (g)</span>
              <input v-model.number="newMeal.protein_g" type="number" min="0" step="0.1" class="w-full border rounded-lg px-4 py-2" />
            </label>
            <label>
              <span class="block text-sm font-medium text-gray-700 mb-1">Hidratos (g)</span>
              <input v-model.number="newMeal.carbs_g" type="number" min="0" step="0.1" class="w-full border rounded-lg px-4 py-2" />
            </label>
            <label>
              <span class="block text-sm font-medium text-gray-700 mb-1">Grasas (g)</span>
              <input v-model.number="newMeal.fat_g" type="number" min="0" step="0.1" class="w-full border rounded-lg px-4 py-2" />
            </label>
          </div>

          <div class="mt-5">
            <div class="flex justify-between items-center mb-2">
              <h3 class="font-medium text-gray-900">Ingredientes exactos</h3>
              <button type="button" @click="addIngredientRow" class="text-sm text-indigo-600 hover:text-indigo-800">
                + Ingrediente
              </button>
            </div>

            <div class="space-y-2">
              <div v-for="(ingredient, index) in ingredientRows" :key="index" class="grid grid-cols-[1fr_90px_90px_32px] gap-2">
                <input v-model.trim="ingredient.name" class="border rounded-lg px-3 py-2" placeholder="Nombre" required />
                <input v-model.number="ingredient.quantity" type="number" min="0.01" step="0.01" class="border rounded-lg px-3 py-2" required />
                <select v-model="ingredient.unit_type" class="border rounded-lg px-3 py-2">
                  <option v-for="unit in unitTypes" :key="unit" :value="unit">{{ unit }}</option>
                </select>
                <button type="button" @click="removeIngredientRow(index)" class="text-red-500 hover:text-red-700">×</button>
              </div>
            </div>
          </div>

          <p v-if="formError" class="text-sm text-red-600 mt-3">{{ formError }}</p>

          <div class="flex justify-end gap-2 mt-6">
            <button type="button" @click="closeMealModal" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="savingMeal || !mealFormValid"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {{ savingMeal ? 'Guardando...' : 'Guardar plato' }}
            </button>
          </div>
        </form>
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
import { MEAL_TYPES, summarizeDailyMeals } from '~/utils/nutrition.js'
import type { WeeklyDayImage, WeeklyMeal, WeeklyMealIngredient, WeeklyMenu } from '~/types'

type MealType = WeeklyMeal['meal_type']

const supabase = useSupabase()
const route = useRoute()
const { loadCurrentUser } = useCurrentUser()

const mealTypes = MEAL_TYPES as MealType[]
const unitTypes: WeeklyMealIngredient['unit_type'][] = ['g', 'kg', 'ml', 'l', 'ud', 'pack', 'unidad']

const menu = ref<WeeklyMenu | null>(null)
const meals = ref<WeeklyMeal[]>([])
const dayImages = ref<WeeklyDayImage[]>([])
const loading = ref(true)
const showMealModal = ref(false)
const savingMeal = ref(false)
const formError = ref('')
const selectedDay = ref(1)
const selectedType = ref<MealType>('comida')
const newMeal = ref({
  dish_name: '',
  dish_description: '',
  kcal: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
})
const ingredientRows = ref<Array<{ name: string; quantity: number; unit_type: WeeklyMealIngredient['unit_type'] }>>([])

const mealsCount = computed(() => meals.value.length)

const consolidatedIngredients = computed(() => {
  const consolidated: Record<string, { name: string; quantity: number; unit_type: string }> = {}

  for (const meal of meals.value) {
    for (const ingredient of meal.weekly_meal_ingredients || []) {
      const key = `${ingredient.name.toLowerCase()}::${ingredient.unit_type}`
      if (!consolidated[key]) {
        consolidated[key] = { name: ingredient.name, quantity: 0, unit_type: ingredient.unit_type }
      }
      consolidated[key].quantity += Number(ingredient.quantity) || 0
    }
  }

  return Object.values(consolidated)
    .map((item) => ({ ...item, quantity: Math.round(item.quantity * 100) / 100 }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

const mealFormValid = computed(() =>
  Boolean(newMeal.value.dish_name) &&
  newMeal.value.kcal >= 0 &&
  ingredientRows.value.length > 0 &&
  ingredientRows.value.every((ingredient) => ingredient.name && ingredient.quantity > 0)
)

const loadMenu = async () => {
  loading.value = true
  const currentUser = await loadCurrentUser()

  if (!currentUser) {
    menu.value = null
    loading.value = false
    return
  }

  const { data: menuData } = await supabase
    .from('weekly_menus')
    .select('*')
    .eq('id', route.params.id)
    .eq('user_id', currentUser.id)
    .maybeSingle()

  if (!menuData) {
    menu.value = null
    loading.value = false
    return
  }

  menu.value = menuData

  const [{ data: mealsData }, { data: imagesData }] = await Promise.all([
    supabase
      .from('weekly_meals')
      .select('*, weekly_meal_ingredients(*)')
      .eq('weekly_menu_id', route.params.id as string)
      .order('day_number', { ascending: true }),
    supabase
      .from('weekly_day_images')
      .select('*')
      .eq('weekly_menu_id', route.params.id as string)
      .order('day_number', { ascending: true }),
  ])

  meals.value = mealsData || []
  dayImages.value = imagesData || []
  loading.value = false
}

const getMeal = (day: number, type: MealType) => {
  return meals.value.find((meal) => meal.day_number === day && meal.meal_type === type)
}

const getDayImage = (day: number) => {
  return dayImages.value.find((image) => image.day_number === day)
}

const daySummary = (day: number) => {
  return summarizeDailyMeals(meals.value.filter((meal) => meal.day_number === day))
}

const openMealModal = (day: number, type: MealType) => {
  selectedDay.value = day
  selectedType.value = type
  newMeal.value = {
    dish_name: '',
    dish_description: '',
    kcal: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
  }
  ingredientRows.value = [{ name: '', quantity: 1, unit_type: 'g' }]
  formError.value = ''
  showMealModal.value = true
}

const closeMealModal = () => {
  showMealModal.value = false
  formError.value = ''
}

const addIngredientRow = () => {
  ingredientRows.value.push({ name: '', quantity: 1, unit_type: 'g' })
}

const removeIngredientRow = (index: number) => {
  ingredientRows.value.splice(index, 1)
}

const addMeal = async () => {
  if (!menu.value || !mealFormValid.value) return

  savingMeal.value = true
  formError.value = ''

  const { data: meal, error } = await supabase
    .from('weekly_meals')
    .insert({
      weekly_menu_id: menu.value.id,
      day_number: selectedDay.value,
      meal_type: selectedType.value,
      dish_name: newMeal.value.dish_name,
      dish_description: newMeal.value.dish_description || null,
      kcal: newMeal.value.kcal,
      protein_g: newMeal.value.protein_g,
      carbs_g: newMeal.value.carbs_g,
      fat_g: newMeal.value.fat_g,
    })
    .select()
    .single()

  if (error || !meal) {
    savingMeal.value = false
    formError.value = error?.code === '23505'
      ? 'Ya existe una comida para este día y tipo.'
      : `Error guardando plato: ${error?.message || 'desconocido'}`
    return
  }

  const { error: ingredientsError } = await supabase
    .from('weekly_meal_ingredients')
    .insert(ingredientRows.value.map((ingredient) => ({
      weekly_meal_id: meal.id,
      name: ingredient.name.toLowerCase(),
      quantity: ingredient.quantity,
      unit_type: ingredient.unit_type,
    })))

  savingMeal.value = false

  if (ingredientsError) {
    formError.value = `Error guardando ingredientes: ${ingredientsError.message}`
    return
  }

  closeMealModal()
  await loadMenu()
}

const deleteMeal = async (mealId: string) => {
  if (!confirm('¿Eliminar este plato y sus ingredientes?')) return

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

const uploadDailyImage = async (day: number, event: Event) => {
  if (!menu.value) return

  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const fileName = `${menu.value.id}/day_${day}_${Date.now()}.${file.name.split('.').pop()}`
  const { error: uploadError } = await supabase.storage
    .from('menu-images')
    .upload(fileName, file)

  if (uploadError) {
    alert('Error subiendo imagen: ' + uploadError.message)
    return
  }

  const { data: { publicUrl } } = supabase.storage
    .from('menu-images')
    .getPublicUrl(fileName)

  const { error } = await supabase
    .from('weekly_day_images')
    .upsert({
      weekly_menu_id: menu.value.id,
      day_number: day,
      image_url: publicUrl,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'weekly_menu_id,day_number',
    })

  if (error) {
    alert('Error guardando imagen diaria: ' + error.message)
    return
  }

  await loadMenu()
}

const mealLabel = (type: MealType) => {
  if (type === 'desayuno') return 'Desayuno'
  if (type === 'comida') return 'Comida'
  return 'Cena'
}

const mealColor = (type: MealType) => {
  if (type === 'desayuno') return 'text-emerald-700'
  if (type === 'comida') return 'text-amber-700'
  return 'text-indigo-700'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

onMounted(loadMenu)
</script>
