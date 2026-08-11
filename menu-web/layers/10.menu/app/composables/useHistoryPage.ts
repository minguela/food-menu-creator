import { useMenuCases } from '#layers/00.core/app/use-cases'

export function useHistoryPage() {
  const { listMenus } = useMenuCases()
  const menus = ref<any[]>([])
  const loading = ref(true)

  async function load() {
    const { data } = await listMenus()
    menus.value = data || []
    loading.value = false
  }

  return { menus, loading, load }
}
