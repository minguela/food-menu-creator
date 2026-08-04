import { useMenuCases } from '#layers/00.core/app/use-cases'

export function useMenuDetailPage() {
  const { getMenu, deleteMenu } = useMenuCases()
  const route = useRoute()
  const menu = ref<any>(null)
  const loading = ref(true)

  async function load() {
    const id = route.params.id as string
    const { data } = await getMenu(id)
    menu.value = data
    loading.value = false
  }

  async function remove() {
    if (menu.value) {
      await deleteMenu(menu.value.id)
      navigateTo('/')
    }
  }

  return { menu, loading, load, remove }
}
