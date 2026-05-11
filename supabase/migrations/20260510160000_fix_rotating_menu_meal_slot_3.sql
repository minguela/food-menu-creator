alter table public.rotating_menu_meals
  drop constraint if exists rotating_menu_meals_meal_slot_check;

alter table public.rotating_menu_meals
  add constraint rotating_menu_meals_meal_slot_check
  check (meal_slot in (1, 2, 3));
