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

      <!-- Botón ver ingredientes -->
      <div class="flex justify-end">
        <button
          @click="showIngredientsView = !showIngredientsView"
          class="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          {{ showIngredientsView ? '🍽️ Ver platos' : '🥕 Ver ingredientes' }}
        </button>
      </div>

      <!-- Vista de ingredientes consolidados -->
      <div v-if="showIngredientsView" class="bg-white rounded-lg shadow-sm border p-4">
        <h3 class="font-semibold text-gray-900 mb-3">🥕 Ingredientes del menú</h3>
        <div v-if="consolidatedIngredients.length === 0" class="text-gray-500 text-sm">
          No hay ingredientes registrados para los platos de este menú.
        </div>
        <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div
            v-for="ing in consolidatedIngredients"
            :key="ing.name"
            class="text-sm p-2 bg-gray-50 rounded"
          >
            <p class="font-medium text-gray-900">{{ ing.name }}</p>
            <p class="text-gray-600">{{ ing.quantity }} {{ ing.unit_type }}</p>
          </div>
        </div>
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
            @keyup.enter="focusDescription()"
          />
          <input
            ref="descriptionInput"
            v-model="newMealDescription"
            type="text"
            placeholder="Descripción opcional"
            class="w-full border rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            @keyup.enter="addMeal"
          />
          <!-- Subida de imagen -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              📷 Foto del plato (opcional)
            </label>
            <input
              type="file"
              accept="image/*"
              @change="handleImageUpload"
              class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <div v-if="imagePreview" class="mt-2">
              <img :src="imagePreview" alt="Vista previa" class="h-32 rounded-lg object-cover" />
            </div>
          </div>
          <div class="flex gap-2 justify-end">
            <button
              @click="showMealModal = false"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              @click="addMeal"
              :disabled="!newMealName.trim() || uploadingImage"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ uploadingImage ? 'Subiendo...' : 'Guardar' }}
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
const showIngredientsView = ref(false)
const selectedDay = ref(1)
const selectedType = ref<'comida' | 'cena'>('comida')
const newMealName = ref('')
const newMealDescription = ref('')
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const uploadingImage = ref(false)
const dishIngredients = ref<any[]>([])

const descriptionInput = ref<HTMLInputElement | null>(null)

const mealsCount = computed(() => meals.value.length)

const consolidatedIngredients = computed(() => {
  const consolidated: Record<string, { name: string; quantity: number; unit_type: string }> = {}

  for (const item of dishIngredients.value) {
    const name = item.ingredients?.name || 'Desconocido'
    if (!consolidated[name]) {
      consolidated[name] = { name, quantity: 0, unit_type: item.unit_type || 'g' }
    }
    consolidated[name].quantity += Number(item.quantity) || 0
  }

  return Object.values(consolidated).sort((a, b) => a.name.localeCompare(b.name))
})

const focusDescription = () => {
  setTimeout(() => descriptionInput.value?.focus(), 10)
}

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    imageFile.value = file
    imagePreview.value = URL.createObjectURL(file)
  }
}

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

    // Cargar ingredientes de los platos
    await loadDishIngredients()
  }

  loading.value = false
}

const loadDishIngredients = async () => {
  // Obtener dishes por nombre de plato (match por dish_name)
  const dishNames = meals.value.map(m => m.dish_name)

  if (dishNames.length === 0) {
    dishIngredients.value = []
    return
  }

  const { data: dishesData } = await supabase
    .from('dishes')
    .select('id, name')
    .in('name', dishNames)

  if (!dishesData || dishesData.length === 0) {
    dishIngredients.value = []
    return
  }

  const dishIds = dishesData.map(d => d.id)

  const { data: ingredientsData } = await supabase
    .from('dish_ingredients')
    .select(`
      *,
      ingredients (
        name,
        unit_type
      )
    `)
    .in('dish_id', dishIds)

  dishIngredients.value = ingredientsData || []
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

  let imageUrl = null
  let menuImageId = null

  // Subir imagen si existe y procesar con OCR
  if (imageFile.value) {
    uploadingImage.value = true
    const fileName = `${menu.value.id}/${selectedDay.value}_${selectedType.value}_${Date.now()}.${imageFile.value.name.split('.').pop()}`

    const { error: uploadError, data } = await supabase.storage
      .from('menu-images')
      .upload(fileName, imageFile.value)

    if (uploadError) {
      alert('Error subiendo imagen: ' + uploadError.message)
      uploadingImage.value = false
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('menu-images')
      .getPublicUrl(fileName)

    imageUrl = publicUrl

    // Guardar en menu_images para OCR
    const { data: menuImageData } = await supabase
      .from('menu_images')
      .insert({
        user_id: (await getUser()).id,
        image_url: imageUrl,
        meal_type: selectedType.value,
        day_number: selectedDay.value,
        ocr_raw_text: newMealDescription.trim() || null,
        processed: false,
      })
      .select()
      .single()

    menuImageId = menuImageData?.id

    // Trigger OCR
    if (menuImageId) {
      try {
        await fetch(`${supabase.functionsUrl || 'https://tceusgxbfpekjcthrrqu.supabase.co'}/functions/v1/ocr-processor`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabase.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meal_type: selectedType.value,
            day_number: selectedDay.value,
            image_url: imageUrl,
            menu_image_id: menuImageId,
          }),
        })
      } catch (e) {
        console.error('Error trigger OCR:', e)
      }
    }

    uploadingImage.value = false
  }

  const { error } = await supabase.from('weekly_meals').insert({
    weekly_menu_id: menu.value.id,
    day_number: selectedDay.value,
    meal_type: selectedType.value,
    dish_name: newMealName.trim(),
    dish_description: newMealDescription.trim() || null,
    image_url: imageUrl,
  })

  if (error) {
    if (error.code === '23505') {
      alert('Ya hay un plato para este día y tipo. Elimínalo primero.')
    } else {
      alert('Error: ' + error.message)
    }
    return
  }

  // Notificar a Telegram
  if (menuImageId || imageUrl) {
    await notifyTelegramNewDish(selectedDay.value, selectedType.value, newMealName.trim())
  }

  showMealModal.value = false
  await loadMenu()
}

const getUser = async () => {
  const { data } = await supabase
    .from('users')
    .select('id, telegram_chat_id')
    .limit(1)
    .single()
  return data
}

const notifyTelegramNewDish = async (day: number, type: string, dishName: string) => {
  try {
    const user = await getUser()
    if (!user?.telegram_chat_id) return

    await fetch(`${supabase.functionsUrl || 'https://tceusgxbfpekjcthrrqu.supabase.co'}/functions/v1/telegram-webhook`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabase.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'web_notification',
        chat_id: user.telegram_chat_id,
        message: `🌐 Web: Añadido ${dishName} para día ${day} - ${type}`,
      }),
    })
  } catch (e) {
    console.error('Error notificando Telegram:', e)
  }
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
