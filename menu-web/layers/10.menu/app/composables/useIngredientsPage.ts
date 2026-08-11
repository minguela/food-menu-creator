import { createIngredientRepository } from '#layers/00.core/app/repositories'

export function useIngredientsPage() {
  const repo = createIngredientRepository()
  const ingredients = ref<any[]>([])
  const loading = ref(true)

  async function load() {
    const { data } = await repo.getAll()
    ingredients.value = data || []
    loading.value = false
  }

  return { ingredients, loading, load }
}
