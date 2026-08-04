import { useShoppingCases } from '#layers/00.core/app/use-cases'

export function useShoppingPage() {
  const { listItems, toggleCheck, deleteItem } = useShoppingCases()
  const items = ref<any[]>([])
  const loading = ref(true)

  async function load() {
    loading.value = true
    const { data } = await listItems()
    items.value = data || []
    loading.value = false
  }

  async function toggle(id: string, checked: boolean) {
    await toggleCheck(id, !checked)
    await load()
  }

  async function remove(id: string) {
    await deleteItem(id)
    await load()
  }

  const uncheckedItems = computed(() => items.value.filter(i => !i.checked))
  const checkedItems = computed(() => items.value.filter(i => i.checked))

  return { items, loading, uncheckedItems, checkedItems, load, toggle, remove }
}
