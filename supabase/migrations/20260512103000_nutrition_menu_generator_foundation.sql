-- Foundation for score-based nutrition menu generation.

alter table public.person_profiles
  add column if not exists tolerance_percent numeric(5,2) not null default 10;

alter table public.person_profiles
  drop constraint if exists person_profiles_tolerance_percent_check;
alter table public.person_profiles
  add constraint person_profiles_tolerance_percent_check
  check (tolerance_percent between 0 and 50);

alter table public.dishes
  add column if not exists meal_type text,
  add column if not exists servings numeric(8,2) not null default 1,
  add column if not exists tags text[] not null default '{}'::text[];

alter table public.dishes
  drop constraint if exists dishes_meal_type_check;
alter table public.dishes
  add constraint dishes_meal_type_check
  check (meal_type is null or meal_type in ('desayuno', 'comida', 'cena', 'snack'));

alter table public.dishes
  drop constraint if exists dishes_servings_check;
alter table public.dishes
  add constraint dishes_servings_check
  check (servings > 0 and servings <= 20);

with recipe_meal_types as (
  select
    d.id,
    min(wm.meal_type) as meal_type
  from public.dishes d
  join public.weekly_meals wm
    on coalesce(d.normalized_name, lower(trim(d.name))) = lower(trim(wm.dish_name))
  where wm.meal_type in ('desayuno', 'comida', 'cena')
  group by d.id
  having count(distinct wm.meal_type) = 1
)
update public.dishes d
set meal_type = rmt.meal_type
from recipe_meal_types rmt
where d.id = rmt.id
  and d.meal_type is null;

create index if not exists idx_dishes_user_meal_type
  on public.dishes(user_id, meal_type)
  where meal_type is not null;

create index if not exists idx_dishes_tags
  on public.dishes using gin(tags);

alter table public.rotating_menu_days
  add column if not exists score numeric(12,4),
  add column if not exists meets_targets boolean,
  add column if not exists diagnostics jsonb not null default '{}'::jsonb;

create index if not exists idx_rotating_menu_days_score
  on public.rotating_menu_days(rotating_menu_id, score)
  where score is not null;
