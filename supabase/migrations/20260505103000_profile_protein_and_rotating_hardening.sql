-- Global hardening for profile targets, rotating integrity and shopping performance

alter table public.person_profiles
add column if not exists daily_protein_target numeric(8,2);

update public.person_profiles
set daily_protein_target = round(
  ((daily_kcal_target * (100 - fat_pct_target - carbs_pct_target)) / 100.0 / 4.0)::numeric,
  2
)
where daily_protein_target is null;

alter table public.person_profiles
alter column daily_protein_target set not null;

alter table public.person_profiles
alter column daily_protein_target set default 120;

alter table public.person_profiles
drop constraint if exists person_profiles_daily_protein_target_check;

alter table public.person_profiles
add constraint person_profiles_daily_protein_target_check
check (daily_protein_target between 20 and 400);

alter table public.person_profiles
drop constraint if exists person_profiles_macro_balance_check;

alter table public.person_profiles
add constraint person_profiles_macro_balance_check
check (fat_pct_target + carbs_pct_target <= 85);

create index if not exists idx_rotating_menu_days_menu_day
  on public.rotating_menu_days(rotating_menu_id, day_number);

create index if not exists idx_rotating_menu_meals_day_meal
  on public.rotating_menu_meals(rotating_menu_day_id, meal_type);

create index if not exists idx_rotating_menu_portions_meal_profile
  on public.rotating_menu_meal_profile_portions(rotating_menu_meal_id, profile_id);

create index if not exists idx_rotating_menu_profile_ingredients_portion
  on public.rotating_menu_meal_profile_ingredients(rotating_menu_meal_profile_portion_id);

create index if not exists idx_shopping_lists_user_week
  on public.shopping_lists(user_id, week_start, created_at desc);

create index if not exists idx_shopping_lists_user_purchased
  on public.shopping_lists(user_id, purchased);

