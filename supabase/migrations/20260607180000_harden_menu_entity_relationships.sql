-- Store menu relationships by IDs while keeping names as display snapshots.

alter table public.weekly_meals
add column if not exists dish_id uuid;

alter table public.weekly_meal_ingredients
add column if not exists ingredient_id uuid;

alter table public.rotating_menu_meal_profile_ingredients
add column if not exists ingredient_id uuid;

update public.weekly_meals wm
set dish_id = d.id
from public.weekly_menus menu
join public.dishes d
  on d.user_id = menu.user_id
where wm.weekly_menu_id = menu.id
  and wm.dish_id is null
  and regexp_replace(replace(lower(coalesce(d.normalized_name, d.name)), '_', ' '), '\s+', ' ', 'g')
    = regexp_replace(replace(lower(wm.dish_name), '_', ' '), '\s+', ' ', 'g');

update public.weekly_meal_ingredients wmi
set ingredient_id = i.id
from public.ingredients i
where wmi.ingredient_id is null
  and regexp_replace(replace(lower(coalesce(i.normalized_name, i.name)), '_', ' '), '\s+', ' ', 'g')
    = regexp_replace(replace(lower(wmi.name), '_', ' '), '\s+', ' ', 'g');

update public.rotating_menu_meals rmm
set recipe_id = wm.dish_id
from public.weekly_meals wm
where rmm.recipe_id is null
  and rmm.source_weekly_meal_id = wm.id
  and wm.dish_id is not null;

update public.rotating_menu_meals rmm
set recipe_id = d.id
from public.rotating_menu_days rmd
join public.rotating_menus rm on rm.id = rmd.rotating_menu_id
join public.dishes d on d.user_id = rm.user_id
where rmm.recipe_id is null
  and rmm.rotating_menu_day_id = rmd.id
  and regexp_replace(replace(lower(coalesce(d.normalized_name, d.name)), '_', ' '), '\s+', ' ', 'g')
    = regexp_replace(replace(lower(rmm.dish_name), '_', ' '), '\s+', ' ', 'g');

update public.rotating_menu_meal_profile_ingredients rmi
set ingredient_id = i.id
from public.ingredients i
where rmi.ingredient_id is null
  and regexp_replace(replace(lower(coalesce(i.normalized_name, i.name)), '_', ' '), '\s+', ' ', 'g')
    = regexp_replace(replace(lower(rmi.name), '_', ' '), '\s+', ' ', 'g');

create temporary table tmp_shopping_ingredient_matches on commit drop as
select
  sl.id,
  i.id as ingredient_id,
  row_number() over (
    partition by sl.user_id, sl.week_start, i.id
    order by sl.created_at, sl.id
  ) as match_rank,
  sum(coalesce(sl.quantity_needed, 0)) over (
    partition by sl.user_id, sl.week_start, i.id
  ) as total_quantity_needed,
  sum(coalesce(sl.quantity_grams, sl.quantity_needed, 0)) over (
    partition by sl.user_id, sl.week_start, i.id
  ) as total_quantity_grams
from public.shopping_lists sl
join public.ingredients i
  on regexp_replace(replace(lower(coalesce(i.normalized_name, i.name)), '_', ' '), '\s+', ' ', 'g')
   = regexp_replace(replace(lower(sl.item_name), '_', ' '), '\s+', ' ', 'g')
where sl.ingredient_id is null;

delete from public.shopping_lists sl
using tmp_shopping_ingredient_matches m
where sl.id = m.id
  and m.match_rank > 1;

update public.shopping_lists sl
set
  ingredient_id = m.ingredient_id,
  quantity_needed = round(m.total_quantity_needed::numeric, 2),
  quantity_grams = round(m.total_quantity_grams::numeric, 2),
  original_quantity = round(m.total_quantity_grams::numeric, 2),
  original_unit_type = 'g'
from tmp_shopping_ingredient_matches m
where sl.id = m.id
  and m.match_rank = 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'weekly_meals_dish_id_fkey'
  ) then
    alter table public.weekly_meals
    add constraint weekly_meals_dish_id_fkey
    foreign key (dish_id) references public.dishes(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'weekly_meal_ingredients_ingredient_id_fkey'
  ) then
    alter table public.weekly_meal_ingredients
    add constraint weekly_meal_ingredients_ingredient_id_fkey
    foreign key (ingredient_id) references public.ingredients(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'rotating_menu_meals_recipe_id_fkey'
  ) then
    alter table public.rotating_menu_meals
    add constraint rotating_menu_meals_recipe_id_fkey
    foreign key (recipe_id) references public.dishes(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'rotating_menu_profile_ingredients_ingredient_id_fkey'
  ) then
    alter table public.rotating_menu_meal_profile_ingredients
    add constraint rotating_menu_profile_ingredients_ingredient_id_fkey
    foreign key (ingredient_id) references public.ingredients(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'shopping_lists_ingredient_id_fkey'
  ) then
    alter table public.shopping_lists
    add constraint shopping_lists_ingredient_id_fkey
    foreign key (ingredient_id) references public.ingredients(id) on delete set null;
  end if;
end $$;

create index if not exists idx_weekly_meals_dish_id
  on public.weekly_meals(dish_id);

create index if not exists idx_weekly_meal_ingredients_ingredient_id
  on public.weekly_meal_ingredients(ingredient_id);

create index if not exists idx_rotating_menu_meals_recipe_id
  on public.rotating_menu_meals(recipe_id);

create index if not exists idx_rotating_profile_ingredients_ingredient_id
  on public.rotating_menu_meal_profile_ingredients(ingredient_id);

create index if not exists idx_shopping_lists_ingredient_id
  on public.shopping_lists(ingredient_id);
