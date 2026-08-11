import { useMenuCases, generateWeeklyMenu } from '#layers/00.core/app/use-cases'

export function useGenerateMenuPage() {
  const { createMenu } = useMenuCases()
  const generating = ref(false)
  const error = ref<string | null>(null)
  const menu = ref<any>(null)
  const days = ref(7)
  const mealsPerDay = ref(3)

  async function generate() {
    generating.value = true
    error.value = null
    const { data, error: err } = await generateWeeklyMenu({
      days: days.value,
      meals_per_day: mealsPerDay.value,
    })
    if (err) error.value = err.message
    else menu.value = data
    generating.value = false
  }

  return { generating, error, menu, days, mealsPerDay, generate }
}
