alter table public.weekly_meals
  add column if not exists is_special boolean not null default false,
  add column if not exists special_kcal_reserved integer not null default 700;

alter table public.weekly_meals
  drop constraint if exists weekly_meals_special_kcal_reserved_check;
alter table public.weekly_meals
  add constraint weekly_meals_special_kcal_reserved_check
  check (special_kcal_reserved between 0 and 2000);

alter table public.rotating_menu_meals
  add column if not exists is_special boolean not null default false,
  add column if not exists special_kcal_reserved integer not null default 0;

alter table public.rotating_menu_meals
  drop constraint if exists rotating_menu_meals_special_kcal_reserved_check;
alter table public.rotating_menu_meals
  add constraint rotating_menu_meals_special_kcal_reserved_check
  check (special_kcal_reserved between 0 and 2000);

create index if not exists idx_weekly_meals_special
  on public.weekly_meals(weekly_menu_id, day_number, is_special);
