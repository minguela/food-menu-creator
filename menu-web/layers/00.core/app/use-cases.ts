import type { Menu, Recipe, ShoppingItem } from '../domain/models'
import { createMenuRepository, createRecipeRepository, createShoppingRepository, createIngredientRepository, callRpc } from './repositories'

// === Menu Use Cases ===
export function useMenuCases() {
  const repo = createMenuRepository()
  return {
    listMenus: () => repo.getAll(),
    getMenu: (id: string) => repo.getById(id),
    createMenu: (data: Partial<Menu>) => repo.create(data),
    updateMenu: (id: string, data: Partial<Menu>) => repo.update(id, data),
    deleteMenu: (id: string) => repo.delete(id),
  }
}

// === Recipe Use Cases ===
export function useRecipeCases() {
  const repo = createRecipeRepository()
  return {
    listRecipes: () => repo.getAll(),
    getRecipe: (id: string) => repo.getById(id),
    createRecipe: (data: Partial<Recipe>) => repo.create(data),
    updateRecipe: (id: string, data: Partial<Recipe>) => repo.update(id, data),
    deleteRecipe: (id: string) => repo.delete(id),
  }
}

// === Shopping Use Cases ===
export function useShoppingCases() {
  const repo = createShoppingRepository()
  return {
    listItems: () => repo.getAll(),
    createItem: (data: Partial<ShoppingItem>) => repo.create(data),
    updateItem: (id: string, data: Partial<ShoppingItem>) => repo.update(id, data),
    deleteItem: (id: string) => repo.delete(id),
    toggleCheck: (id: string, checked: boolean) => repo.toggleCheck(id, checked),
  }
}

// === Generate Menu Use Case ===
export async function generateWeeklyMenu(params: {
  days?: number
  meals_per_day?: number
  user_id?: string
  preferences?: Record<string, any>
}) {
  return callRpc<Menu>('generate_weekly_menu', params)
}

// === Generate Shopping List ===
export async function generateShoppingList(menuId: string) {
  return callRpc<ShoppingItem[]>('generate_shopping_list', { menu_id: menuId })
}
