alter table public.weekly_meals
  add column if not exists meal_slot smallint not null default 1;

alter table public.weekly_meals
  drop constraint if exists weekly_meals_meal_slot_check;
alter table public.weekly_meals
  add constraint weekly_meals_meal_slot_check
  check (meal_slot in (1, 2));

alter table public.weekly_meals
  drop constraint if exists unique_weekly_meal_slot;

update public.weekly_meals
set meal_slot = 1
where meal_slot is null;

alter table public.weekly_meals
  add constraint unique_weekly_meal_slot_v2
  unique (weekly_menu_id, day_number, meal_type, meal_slot);

create index if not exists idx_weekly_meals_day_type_slot
  on public.weekly_meals (weekly_menu_id, day_number, meal_type, meal_slot);
