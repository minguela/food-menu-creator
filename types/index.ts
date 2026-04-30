export interface User {
  id: string
  telegram_id?: number
  telegram_chat_id?: number
  daily_kcal_target: number
  daily_protein_target: number
  persons_count: number
  created_at: string
  updated_at: string
}

export interface WeeklyMenu {
  id: string
  user_id: string
  name: string
  week_number: number
  created_at: string
  meals_count?: number
}

export interface WeeklyMeal {
  id: string
  weekly_menu_id: string
  day_number: number
  meal_type: 'comida' | 'cena'
  dish_name: string
  dish_description?: string
  image_url?: string
  created_at: string
}

export interface Dish {
  id: string
  menu_image_id?: string
  name: string
  description?: string
  kcal?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  servings_base: number
  created_at: string
}

export interface Ingredient {
  id: string
  name: string
  carrefour_category?: string
  carrefour_product_id?: string
  unit_type: 'kg' | 'g' | 'l' | 'ml' | 'ud' | 'pack' | 'unidad'
  created_at: string
}

export interface DishIngredient {
  dish_id: string
  ingredient_id: string
  quantity: number
  unit_type?: string
}

export interface MealPlan {
  id: string
  user_id: string
  plan_date: string
  meal_type: 'comida' | 'cena'
  dish_id?: string
  day_original?: number
  kcal?: number
  protein_g?: number
  created_at: string
}

export interface ShoppingListItem {
  id: string
  user_id: string
  week_start: string
  ingredient_id: string
  quantity_needed: number
  estimated_price?: number
  purchased: boolean
  created_at: string
  ingredients?: Ingredient
}

export interface MenuImage {
  id: string
  user_id: string
  telegram_message_id?: number
  image_url: string
  meal_type: 'comida' | 'cena'
  day_number: number
  ocr_raw_text?: string
  processed: boolean
  created_at: string
}

export interface GeneratedMenu {
  day: number
  date: string
  menu_name: string
  comida: string
  cena: string
}
