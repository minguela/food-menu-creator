alter table public.rotating_menu_meals
  add column if not exists meal_slot smallint not null default 1;

alter table public.rotating_menu_meals
  drop constraint if exists unique_rotating_day_meal;

alter table public.rotating_menu_meals
  drop constraint if exists rotating_menu_meals_meal_slot_check;

alter table public.rotating_menu_meals
  add constraint rotating_menu_meals_meal_slot_check
  check (meal_slot in (1, 2));

alter table public.rotating_menu_meals
  drop constraint if exists unique_rotating_day_meal_slot;

alter table public.rotating_menu_meals
  add constraint unique_rotating_day_meal_slot
  unique (rotating_menu_day_id, meal_type, meal_slot);

create index if not exists idx_rotating_menu_meals_day_type_slot
  on public.rotating_menu_meals (rotating_menu_day_id, meal_type, meal_slot);
