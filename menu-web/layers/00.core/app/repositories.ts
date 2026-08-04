import type { Menu, Recipe, ShoppingItem, Ingredient } from '../../00.core/app/domain/models'

// Generic query builder wrapper for the Supabase proxy API
// This replaces direct useSupabase() calls with typed repositories

type QueryResult<T = any> = { data: T | null; error: Error | null }

function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  return $fetch<T>(`/api/${path}`, options)
}

function tableQuery(table: string) {
  return {
    select: async <T>(filters: Record<string, any> = {}): Promise<QueryResult<T[]>> => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => params.set(k, String(v)))
      try {
        const result = await apiFetch<T[]>(`db/${table}?${params}`)
        return { data: result, error: null }
      } catch (err: any) { return { data: null, error: err } }
    },
    getById: async <T>(id: string): Promise<QueryResult<T>> => {
      const params = new URLSearchParams({ id })
      params.set('single', 'maybeSingle')
      try {
        const result = await apiFetch<T>(`db/${table}?${params}`)
        return { data: result, error: null }
      } catch (err: any) { return { data: null, error: err } }
    },
    insert: async <T>(data: Record<string, any> | Record<string, any>[]): Promise<QueryResult<T>> => {
      try {
        const result = await apiFetch<T>(`db/${table}`, { method: 'POST', body: data })
        return { data: result, error: null }
      } catch (err: any) { return { data: null, error: err } }
    },
    update: async <T>(data: Record<string, any>): Promise<QueryResult<T>> => {
      try {
        const result = await apiFetch<T>(`db/${table}`, { method: 'PUT', body: data })
        return { data: result, error: null }
      } catch (err: any) { return { data: null, error: err } }
    },
    delete: async (id: string): Promise<QueryResult> => {
      try {
        const result = await apiFetch(`db/${table}`, { method: 'DELETE', query: { id } })
        return { data: result, error: null }
      } catch (err: any) { return { data: null, error: err } }
    },
  }
}

// === Menu Repository ===
export function createMenuRepository() {
  const menus = tableQuery('menus')
  return {
    getAll: () => menus.select<Menu>({ order: 'created_at:desc' }),
    getById: (id: string) => menus.getById<Menu>(id),
    create: (data: Partial<Menu>) => menus.insert<Menu>(data),
    update: (id: string, data: Partial<Menu>) => menus.update<Menu>({ ...data, id }),
    delete: (id: string) => menus.delete(id),
    getByWeek: (week: number) => menus.select<Menu>({ week_number: String(week), single: 'maybeSingle' }),
  }
}

// === Recipe Repository ===
export function createRecipeRepository() {
  const recipes = tableQuery('recipes')
  return {
    getAll: () => recipes.select<Recipe>({ order: 'name:asc' }),
    getById: (id: string) => recipes.getById<Recipe>(id),
    create: (data: Partial<Recipe>) => recipes.insert<Recipe>(data),
    update: (id: string, data: Partial<Recipe>) => recipes.update<Recipe>({ ...data, id }),
    delete: (id: string) => recipes.delete(id),
    getByCategory: (category: string) => recipes.select<Recipe>({ category: category }),
  }
}

// === Shopping List Repository ===
export function createShoppingRepository() {
  const items = tableQuery('shopping_items')
  return {
    getAll: () => items.select<ShoppingItem>({ order: 'name:asc' }),
    create: (data: Partial<ShoppingItem>) => items.insert<ShoppingItem>(data),
    update: (id: string, data: Partial<ShoppingItem>) => items.update<ShoppingItem>({ ...data, id }),
    delete: (id: string) => items.delete(id),
    toggleCheck: (id: string, checked: boolean) => items.update<ShoppingItem>({ id, checked }),
  }
}

// === Ingredients Repository ===
export function createIngredientRepository() {
  const ingredients = tableQuery('ingredients')
  return {
    getAll: () => ingredients.select<Ingredient>({ order: 'name:asc' }),
    getById: (id: string) => ingredients.getById<Ingredient>(id),
    create: (data: Partial<Ingredient>) => ingredients.insert<Ingredient>(data),
    update: (id: string, data: Partial<Ingredient>) => ingredients.update<Ingredient>({ ...data, id }),
  }
}

// === RPC (stored procedures) ===
export async function callRpc<T = any>(fn: string, params?: Record<string, any>): Promise<QueryResult<T>> {
  try {
    const result = await apiFetch<T>(`db/rpc/${fn}`, { method: 'POST', body: params })
    return { data: result, error: null }
  } catch (err: any) { return { data: null, error: err } }
}
