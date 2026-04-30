<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">🛒 Lista de la Compra</h1>
      <button
        @click="loadShoppingList"
        :disabled="loading"
        class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        🔄 Actualizar
      </button>
    </div>

    <!-- Estado de carga -->
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      <p class="mt-4 text-gray-600">Cargando lista...</p>
    </div>

    <!-- Sin lista -->
    <div v-else-if="items.length === 0" class="text-center py-12 bg-white rounded-lg border">
      <p class="text-gray-600 mb-4">No hay lista de la compra generada</p>
      <NuxtLink href="/generar" class="text-indigo-600 hover:underline">
        Generar un menú primero
      </NuxtLink>
    </div>

    <!-- Lista agrupada por categoría -->
    <div v-else class="space-y-6">
      <!-- Resumen -->
      <div class="bg-white rounded-lg shadow-sm border p-4">
        <div class="flex justify-between items-center">
          <div>
            <p class="text-sm text-gray-600">Total estimado</p>
            <p class="text-2xl font-bold text-gray-900">{{ totalPrice.toFixed(2) }}€</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-600">Ingredientes</p>
            <p class="text-xl font-semibold text-gray-900">{{ items.length }}</p>
          </div>
        </div>
      </div>

      <!-- Categorías -->
      <div
        v-for="(categoryItems, category) in itemsByCategory"
        :key="category"
        class="bg-white rounded-lg shadow-sm border overflow-hidden"
      >
        <div class="bg-gray-50 px-4 py-3 border-b">
          <h2 class="font-semibold text-gray-900">{{ category }}</h2>
        </div>
        <div class="divide-y">
          <div
            v-for="item in categoryItems"
            :key="item.id"
            class="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center gap-3">
              <input
                type="checkbox"
                :checked="item.purchased"
                @change="togglePurchased(item)"
                class="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div :class="{ 'line-through text-gray-400': item.purchased }">
                <p class="font-medium text-gray-900">{{ item.ingredients?.name || 'Desconocido' }}</p>
                <p class="text-sm text-gray-500">
                  {{ formatQuantity(item.quantity_needed, item.ingredients?.unit_type) }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-medium text-gray-900">{{ item.estimated_price?.toFixed(2) || '0.00' }}€</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Botón imprimir -->
      <div class="flex justify-end gap-2 pt-4">
        <button
          @click="markAllAsPurchased"
          class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          ✅ Marcar todo como comprado
        </button>
        <button
          @click="printList"
          class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          🖨️ Imprimir
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ShoppingListItem } from '~/types'

const supabase = useSupabase()
const { loadCurrentUser } = useCurrentUser()

const items = ref<ShoppingListItem[]>([])
const loading = ref(true)

const itemsByCategory = computed(() => {
  return items.value.reduce((acc, item) => {
    const category = item.ingredients?.carrefour_category || 'Otros'
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {} as Record<string, ShoppingListItem[]>)
})

const totalPrice = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.estimated_price || 0), 0)
})

const loadShoppingList = async () => {
  loading.value = true
  const currentUser = await loadCurrentUser()

  if (!currentUser) {
    items.value = []
    loading.value = false
    return
  }

  const { data, error } = await supabase
    .from('shopping_lists')
    .select(`
      *,
      ingredients (
        name,
        carrefour_category,
        unit_type
      )
    `)
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error cargando lista:', error)
  } else {
    items.value = data || []
  }

  loading.value = false
}

const togglePurchased = async (item: ShoppingListItem) => {
  const { error } = await supabase
    .from('shopping_lists')
    .update({ purchased: !item.purchased })
    .eq('id', item.id)

  if (error) {
    console.error('Error actualizando:', error)
    return
  }

  const found = items.value.find(i => i.id === item.id)
  if (found) {
    found.purchased = !found.purchased
  }
}

const markAllAsPurchased = async () => {
  const unpurchasedIds = items.value.filter(i => !i.purchased).map(i => i.id)

  if (unpurchasedIds.length === 0) return

  const { error } = await supabase
    .from('shopping_lists')
    .update({ purchased: true })
    .in('id', unpurchasedIds)

  if (error) {
    console.error('Error marcando todos:', error)
    return
  }

  items.value.forEach(item => {
    item.purchased = true
  })
}

const formatQuantity = (quantity: number, unitType?: string) => {
  if (!unitType) return `${quantity.toFixed(0)} g`

  if (unitType === 'kg' || unitType === 'g') {
    if (quantity >= 1000 && unitType === 'g') {
      return `${(quantity / 1000).toFixed(2)} kg`
    }
    return `${quantity.toFixed(quantity % 1 === 0 ? 0 : 2)} ${unitType}`
  }

  if (unitType === 'l' || unitType === 'ml') {
    if (quantity >= 1000 && unitType === 'ml') {
      return `${(quantity / 1000).toFixed(2)} l`
    }
    return `${quantity.toFixed(quantity % 1 === 0 ? 0 : 2)} ${unitType}`
  }

  return `${quantity.toFixed(0)} ${unitType}`
}

const printList = () => {
  window.print()
}

onMounted(() => {
  loadShoppingList()
})
</script>

<style scoped>
@media print {
  nav, button {
    display: none !important;
  }
  .bg-white {
    break-inside: avoid;
  }
}
</style>
