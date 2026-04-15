export interface WeeklyMenu {
  id: string
  user_id: string
  name: string
  week_number: number
  created_at: string
}

export interface WeeklyMeal {
  id: string
  weekly_menu_id: string
  day_number: number
  meal_type: 'comida' | 'cena'
  dish_name: string
  dish_description: string
  image_url: string
  created_at: string
}

export interface GeneratedMenu {
  day: number
  date: string
  menu_name: string
  comida: string
  cena: string
}
