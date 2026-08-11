export interface Menu {
  id: string
  name: string
  week_number: number
  days: MenuDay[]
  created_at: string
}

export interface MenuDay {
  day: string
  meals: Meal[]
}

export interface Meal {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  recipe_id: string
  recipe_name: string
  servings: number
}

export interface Recipe {
  id: string
  name: string
  description?: string
  ingredients: RecipeIngredient[]
  instructions: string
  prep_time?: number
  cook_time?: number
  servings: number
  category?: string
  image_url?: string
}

export interface RecipeIngredient {
  name: string
  quantity: number
  unit: string
}

export interface ShoppingItem {
  name: string
  quantity: number
  unit: string
  checked: boolean
}

export interface Ingredient {
  id: string
  name: string
  category?: string
  nutritional_info?: NutritionalInfo
}

export interface NutritionalInfo {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}
