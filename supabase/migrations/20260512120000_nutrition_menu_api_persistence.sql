-- Persistence fields for score-based nutrition generated menus.

alter table public.rotating_menus
  add column if not exists generator_type text not null default 'rotating',
  add column if not exists period_type text,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists score numeric(12,4),
  add column if not exists meets_targets boolean,
  add column if not exists diagnostics jsonb not null default '{}'::jsonb;

alter table public.rotating_menus
  drop constraint if exists rotating_menus_generator_type_check;
alter table public.rotating_menus
  add constraint rotating_menus_generator_type_check
  check (generator_type in ('rotating', 'nutrition_scored'));

alter table public.rotating_menus
  drop constraint if exists rotating_menus_period_type_check;
alter table public.rotating_menus
  add constraint rotating_menus_period_type_check
  check (period_type is null or period_type in ('daily', 'weekly', 'monthly'));

alter table public.rotating_menu_meals
  add column if not exists recipe_id uuid references public.dishes(id) on delete set null;

alter table public.rotating_menu_meals
  drop constraint if exists rotating_menu_meals_meal_type_check;
alter table public.rotating_menu_meals
  add constraint rotating_menu_meals_meal_type_check
  check (meal_type in ('desayuno', 'comida', 'cena', 'snack'));

alter table public.rotating_menu_meals
  drop constraint if exists rotating_menu_meals_meal_slot_check;
alter table public.rotating_menu_meals
  add constraint rotating_menu_meals_meal_slot_check
  check (meal_slot in (1, 2, 3, 4));

create index if not exists idx_rotating_menus_generator_type
  on public.rotating_menus(user_id, generator_type, created_at desc);

create index if not exists idx_rotating_menu_meals_recipe
  on public.rotating_menu_meals(recipe_id)
  where recipe_id is not null;
