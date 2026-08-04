import { useMenuCases } from '#layers/00.core/app/use-cases'

export function useMenuListPage() {
  const { listMenus, deleteMenu } = useMenuCases()
  const menus = ref<any[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    const { data, error: err } = await listMenus()
    menus.value = data || []
    error.value = err?.message || null
    loading.value = false
  }

  async function remove(id: string) {
    await deleteMenu(id)
    await load()
  }

  return { menus, loading, error, load, remove }
}
