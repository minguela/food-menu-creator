export interface User {
  id: string;
  telegram_id?: number;
  telegram_chat_id?: number;
  phone_number?: string;
  mobile_channel?: "sms" | "whatsapp";
  daily_kcal_target: number;
  daily_protein_target: number;
  fat_pct_target: number;
  carbs_pct_target: number;
  persons_count: number;
  created_at: string;
  updated_at: string;
}

export interface PersonProfile {
  id: string;
  user_id: string;
  name: string;
  sex: "female" | "male" | "other";
  age: number;
  daily_kcal_target: number;
  daily_protein_target: number;
  fat_pct_target: number;
  carbs_pct_target: number;
  created_at: string;
  updated_at: string;
}

export interface WeeklyMenu {
  id: string;
  user_id: string;
  name: string;
  week_number: number;
  created_at: string;
  meals_count?: number;
}

export interface WeeklyMeal {
  id: string;
  weekly_menu_id: string;
  day_number: number;
  meal_type: "desayuno" | "comida" | "cena";
  meal_slot?: 1 | 2;
  dish_name: string;
  dish_description?: string;
  image_url?: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  is_special?: boolean;
  special_kcal_reserved?: number;
  created_at: string;
  weekly_meal_ingredients?: WeeklyMealIngredient[];
}

export interface WeeklyDayImage {
  id: string;
  weekly_menu_id: string;
  day_number: number;
  image_url: string;
  source_mode?: "daily" | "block";
  day_span_count?: number;
  ocr_status?: "pending" | "processing" | "processed" | "error";
  ocr_raw_text?: string;
  ocr_error?: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklyMealIngredient {
  id: string;
  weekly_meal_id: string;
  name: string;
  quantity: number;
  unit_type: "kg" | "g" | "l" | "ml" | "ud" | "pack" | "unidad";
  created_at: string;
}

export interface Dish {
  id: string;
  user_id?: string | null;
  menu_image_id?: string;
  name: string;
  english_name?: string | null;
  normalized_name?: string;
  description?: string;
  recipe_status?:
    | "pending_ingredients"
    | "suggested_ingredients"
    | "complete"
    | "not_required"
    | "incomplete_nutrition";
  source?: "ocr" | "manual" | "fixed_meal" | "imported" | string;
  kcal?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  is_special?: boolean;
  special_kcal_reserved?: number;
  servings_base: number;
  created_at: string;
}

export interface Ingredient {
  id: string;
  name: string;
  normalized_name?: string;
  carrefour_category?: string;
  carrefour_product_id?: string;
  default_unit_type?: "kg" | "g" | "l" | "ml" | "ud" | "pack" | "unidad";
  unit_type: "kg" | "g" | "l" | "ml" | "ud" | "pack" | "unidad";
  kcal_per_100g?: number | null;
  protein_per_100g?: number | null;
  carbs_per_100g?: number | null;
  fat_per_100g?: number | null;
  source?: "manual" | "system" | "imported" | string;
  external_id?: string | null;
  barcode?: string | null;
  is_verified?: boolean;
  nutrition_status?: "complete" | "pending" | "needs_review" | "not_found";
  review_reason?: string | null;
  caloric_density_level?:
    | "very_low"
    | "low"
    | "normal"
    | "caloric"
    | "very_caloric"
    | null;
  created_at: string;
  updated_at?: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id?: string | null;
  name: string;
  normalized_name: string;
  quantity?: number | null;
  unit_type?: "kg" | "g" | "l" | "ml" | "ud" | "pack" | "unidad" | null;
  is_confirmed: boolean;
  is_suggested: boolean;
  needs_review: boolean;
  created_at: string;
  updated_at?: string;
  ingredients?: Ingredient | null;
}

export interface DishIngredient {
  dish_id: string;
  ingredient_id: string;
  quantity: number;
  unit_type?: string;
}

export interface MealPlan {
  id: string;
  user_id: string;
  plan_date: string;
  meal_type: "desayuno" | "comida" | "cena";
  dish_id?: string;
  day_original?: number;
  kcal?: number;
  protein_g?: number;
  created_at: string;
}

export interface ShoppingListItem {
  id: string;
  user_id: string;
  week_start: string;
  ingredient_id?: string;
  item_name?: string;
  quantity_needed: number;
  quantity_grams?: number;
  original_quantity?: number;
  original_unit_type?: string;
  conversion_status?: "exact" | "estimated" | "ambiguous" | "manual";
  conversion_note?: string;
  is_extra?: boolean;
  send_status?: "pending" | "sent" | "delivered" | "error";
  send_error?: string;
  estimated_price?: number;
  purchased: boolean;
  created_at: string;
  ingredients?: Ingredient;
}

export interface MenuImage {
  id: string;
  user_id: string;
  telegram_message_id?: number;
  image_url: string;
  meal_type: "comida" | "cena";
  day_number: number;
  ocr_raw_text?: string;
  processed: boolean;
  created_at: string;
}

export interface GeneratedMenu {
  day: number;
  date: string;
  menu_name: string;
  comida: string;
  cena: string;
  desayuno?: string;
}

export interface MonthlyMenu {
  id: string;
  user_id: string;
  name: string;
  month: number;
  year: number;
  start_date: string;
  end_date: string;
  menu_data: GeneratedMenu[];
  shopping_list: ShoppingListItem[];
  reused_from?: string;
  created_at: string;
  updated_at: string;
}

export interface ErrorLog {
  id: string;
  source: "web" | "telegram" | "ocr";
  message: string;
  stack_trace?: string | null;
  created_at: string;
}

export interface SavedFixedMeal {
  id: string;
  user_id: string;
  meal_type: "desayuno" | "comida" | "cena";
  dish_name: string;
  dish_description?: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  created_at: string;
  updated_at: string;
  saved_fixed_meal_ingredients?: SavedFixedMealIngredient[];
}

export interface SavedFixedMealIngredient {
  id: string;
  fixed_meal_id: string;
  name: string;
  quantity: number;
  unit_type: "kg" | "g" | "l" | "ml" | "ud" | "pack" | "unidad";
}

export interface RotatingMenu {
  id: string;
  user_id: string;
  profile_id?: string | null;
  name: string;
  source_weekly_menu_ids: string[];
  duration_days: number;
  persons_count: number;
  target_kcal: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  created_at: string;
  updated_at: string;
}

export interface RotatingProfileTarget {
  key: string;
  profile_id?: string | null;
  profile_name: string;
  target_kcal: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
}
