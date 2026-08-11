import { useRecipeCases } from '#layers/00.core/app/use-cases'

export function useRecipesPage() {
  const { listRecipes, deleteRecipe } = useRecipeCases()
  const recipes = ref<any[]>([])
  const loading = ref(true)

  async function load() {
    loading.value = true
    const { data } = await listRecipes()
    recipes.value = data || []
    loading.value = false
  }

  async function remove(id: string) {
    await deleteRecipe(id)
    await load()
  }

  return { recipes, loading, load, remove }
}
