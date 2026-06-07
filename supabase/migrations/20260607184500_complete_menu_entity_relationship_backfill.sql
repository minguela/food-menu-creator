-- Finish historical backfills so menu entities resolve by IDs, not display names.

create or replace function public.normalize_menu_lookup(value text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    replace(
      replace(
        translate(lower(trim(coalesce(value, ''))), 'áéíóúüñ', 'aeiouun'),
        '_',
        ' '
      ),
      '-',
      ' '
    ),
    '\s+',
    ' ',
    'g'
  );
$$;

update public.weekly_meals
set
  is_special = true,
  special_kcal_reserved = greatest(coalesce(special_kcal_reserved, 0), 700),
  dish_id = null
where public.normalize_menu_lookup(dish_name) = 'libre';

update public.rotating_menu_meals
set
  is_special = true,
  special_kcal_reserved = greatest(coalesce(special_kcal_reserved, 0), 700),
  recipe_id = null
where public.normalize_menu_lookup(dish_name) = 'libre';

create temporary table tmp_ingredient_canonical on commit drop as
with reference_counts as (
  select
    i.id,
    public.normalize_menu_lookup(coalesce(i.normalized_name, i.name)) as lookup_key,
    (
      select count(*) from public.recipe_ingredients ri where ri.ingredient_id = i.id
    ) + (
      select count(*) from public.weekly_meal_ingredients wmi where wmi.ingredient_id = i.id
    ) + (
      select count(*) from public.rotating_menu_meal_profile_ingredients rmi where rmi.ingredient_id = i.id
    ) + (
      select count(*) from public.shopping_lists sl where sl.ingredient_id = i.id
    ) as ref_count,
    i.created_at
  from public.ingredients i
),
ranked as (
  select
    id,
    lookup_key,
    first_value(id) over (
      partition by lookup_key
      order by ref_count desc, created_at asc nulls last, id
    ) as canonical_id
  from reference_counts
  where lookup_key <> ''
)
select id as ingredient_id, canonical_id
from ranked
where id <> canonical_id;

create temporary table tmp_shopping_canonical_matches on commit drop as
select
  sl.id,
  coalesce(c.canonical_id, sl.ingredient_id) as canonical_ingredient_id,
  row_number() over (
    partition by sl.user_id, sl.week_start, coalesce(c.canonical_id, sl.ingredient_id)
    order by sl.created_at, sl.id
  ) as match_rank,
  sum(coalesce(sl.quantity_needed, 0)) over (
    partition by sl.user_id, sl.week_start, coalesce(c.canonical_id, sl.ingredient_id)
  ) as total_quantity_needed,
  sum(coalesce(sl.quantity_grams, sl.quantity_needed, 0)) over (
    partition by sl.user_id, sl.week_start, coalesce(c.canonical_id, sl.ingredient_id)
  ) as total_quantity_grams
from public.shopping_lists sl
left join tmp_ingredient_canonical c on c.ingredient_id = sl.ingredient_id
where sl.ingredient_id is not null
  and coalesce(c.canonical_id, sl.ingredient_id) is not null;

delete from public.shopping_lists sl
using tmp_shopping_canonical_matches m
where sl.id = m.id
  and m.match_rank > 1;

update public.shopping_lists sl
set
  ingredient_id = m.canonical_ingredient_id,
  quantity_needed = round(m.total_quantity_needed::numeric, 2),
  quantity_grams = round(m.total_quantity_grams::numeric, 2),
  original_quantity = round(m.total_quantity_grams::numeric, 2),
  original_unit_type = 'g'
from tmp_shopping_canonical_matches m
where sl.id = m.id
  and m.match_rank = 1;

update public.recipe_ingredients ri
set ingredient_id = c.canonical_id
from tmp_ingredient_canonical c
where ri.ingredient_id = c.ingredient_id;

update public.weekly_meal_ingredients wmi
set ingredient_id = c.canonical_id
from tmp_ingredient_canonical c
where wmi.ingredient_id = c.ingredient_id;

update public.rotating_menu_meal_profile_ingredients rmi
set ingredient_id = c.canonical_id
from tmp_ingredient_canonical c
where rmi.ingredient_id = c.ingredient_id;

delete from public.ingredients i
using tmp_ingredient_canonical c
where i.id = c.ingredient_id
  and not exists (
    select 1 from public.recipe_ingredients ri where ri.ingredient_id = i.id
  )
  and not exists (
    select 1 from public.weekly_meal_ingredients wmi where wmi.ingredient_id = i.id
  )
  and not exists (
    select 1 from public.rotating_menu_meal_profile_ingredients rmi where rmi.ingredient_id = i.id
  )
  and not exists (
    select 1 from public.shopping_lists sl where sl.ingredient_id = i.id
  );

insert into public.dishes (
  user_id,
  name,
  normalized_name,
  recipe_status,
  source,
  meal_type,
  is_special,
  special_kcal_reserved
)
select
  source_meals.user_id,
  source_meals.dish_name,
  public.normalize_menu_lookup(source_meals.dish_name),
  'pending_ingredients',
  'weekly_menu_backfill',
  source_meals.meal_type,
  false,
  700
from (
  select
    menu.user_id,
    min(wm.dish_name::text) as dish_name,
    min(wm.meal_type::text) as meal_type
  from public.weekly_meals wm
  join public.weekly_menus menu on menu.id = wm.weekly_menu_id
  where wm.dish_id is null
    and not coalesce(wm.is_special, false)
    and public.normalize_menu_lookup(wm.dish_name) <> 'libre'
  group by menu.user_id, public.normalize_menu_lookup(wm.dish_name)
) source_meals
where not exists (
  select 1
  from public.dishes d
  where d.user_id = source_meals.user_id
    and public.normalize_menu_lookup(coalesce(d.normalized_name, d.name))
      = public.normalize_menu_lookup(source_meals.dish_name)
);

update public.weekly_meals wm
set dish_id = d.id
from public.weekly_menus menu
join public.dishes d on d.user_id = menu.user_id
where wm.weekly_menu_id = menu.id
  and wm.dish_id is null
  and not coalesce(wm.is_special, false)
  and public.normalize_menu_lookup(coalesce(d.normalized_name, d.name))
    = public.normalize_menu_lookup(wm.dish_name);

update public.recipe_ingredients ri
set ingredient_id = (
  select i.id
  from public.ingredients i
  where public.normalize_menu_lookup(coalesce(i.normalized_name, i.name))
      = public.normalize_menu_lookup(coalesce(ri.normalized_name, ri.name))
    or public.normalize_menu_lookup(i.name)
      = public.normalize_menu_lookup(coalesce(ri.normalized_name, ri.name))
  order by i.created_at asc nulls last, i.id
  limit 1
)
where ri.ingredient_id is null
  and exists (
    select 1
    from public.ingredients i
    where public.normalize_menu_lookup(coalesce(i.normalized_name, i.name))
        = public.normalize_menu_lookup(coalesce(ri.normalized_name, ri.name))
      or public.normalize_menu_lookup(i.name)
        = public.normalize_menu_lookup(coalesce(ri.normalized_name, ri.name))
  );

update public.weekly_meal_ingredients wmi
set ingredient_id = (
  select i.id
  from public.ingredients i
  where public.normalize_menu_lookup(coalesce(i.normalized_name, i.name))
      = public.normalize_menu_lookup(wmi.name)
    or public.normalize_menu_lookup(i.name)
      = public.normalize_menu_lookup(wmi.name)
  order by i.created_at asc nulls last, i.id
  limit 1
)
where wmi.ingredient_id is null
  and exists (
    select 1
    from public.ingredients i
    where public.normalize_menu_lookup(coalesce(i.normalized_name, i.name))
        = public.normalize_menu_lookup(wmi.name)
      or public.normalize_menu_lookup(i.name)
        = public.normalize_menu_lookup(wmi.name)
  );

update public.rotating_menu_meal_profile_ingredients rmi
set ingredient_id = (
  select i.id
  from public.ingredients i
  where public.normalize_menu_lookup(coalesce(i.normalized_name, i.name))
      = public.normalize_menu_lookup(rmi.name)
    or public.normalize_menu_lookup(i.name)
      = public.normalize_menu_lookup(rmi.name)
  order by i.created_at asc nulls last, i.id
  limit 1
)
where rmi.ingredient_id is null
  and exists (
    select 1
    from public.ingredients i
    where public.normalize_menu_lookup(coalesce(i.normalized_name, i.name))
        = public.normalize_menu_lookup(rmi.name)
      or public.normalize_menu_lookup(i.name)
        = public.normalize_menu_lookup(rmi.name)
  );

create temporary table tmp_shopping_lookup_matches on commit drop as
select
  sl.id,
  coalesce(sl.ingredient_id, matched.ingredient_id) as ingredient_id,
  row_number() over (
    partition by sl.user_id, sl.week_start, coalesce(sl.ingredient_id, matched.ingredient_id)
    order by sl.created_at, sl.id
  ) as match_rank,
  sum(coalesce(sl.quantity_needed, 0)) over (
    partition by sl.user_id, sl.week_start, coalesce(sl.ingredient_id, matched.ingredient_id)
  ) as total_quantity_needed,
  sum(coalesce(sl.quantity_grams, sl.quantity_needed, 0)) over (
    partition by sl.user_id, sl.week_start, coalesce(sl.ingredient_id, matched.ingredient_id)
  ) as total_quantity_grams
from public.shopping_lists sl
left join lateral (
  select i.id as ingredient_id
  from public.ingredients i
  where public.normalize_menu_lookup(coalesce(i.normalized_name, i.name))
      = public.normalize_menu_lookup(sl.item_name)
    or public.normalize_menu_lookup(i.name)
      = public.normalize_menu_lookup(sl.item_name)
  order by i.created_at asc nulls last, i.id
  limit 1
) matched on true
where coalesce(sl.ingredient_id, matched.ingredient_id) is not null
;

delete from public.shopping_lists sl
using tmp_shopping_lookup_matches m
where sl.id = m.id
  and m.match_rank > 1;

update public.shopping_lists sl
set
  ingredient_id = m.ingredient_id,
  quantity_needed = round(m.total_quantity_needed::numeric, 2),
  quantity_grams = round(m.total_quantity_grams::numeric, 2),
  original_quantity = round(m.total_quantity_grams::numeric, 2),
  original_unit_type = 'g'
from tmp_shopping_lookup_matches m
where sl.id = m.id
  and m.match_rank = 1;

update public.rotating_menu_meals rmm
set recipe_id = wm.dish_id
from public.weekly_meals wm
where rmm.recipe_id is null
  and rmm.source_weekly_meal_id = wm.id
  and wm.dish_id is not null
  and not coalesce(rmm.is_special, false);

update public.rotating_menu_meals rmm
set recipe_id = d.id
from public.rotating_menu_days rmd
join public.rotating_menus rm on rm.id = rmd.rotating_menu_id
join public.dishes d on d.user_id = rm.user_id
where rmm.recipe_id is null
  and rmm.rotating_menu_day_id = rmd.id
  and not coalesce(rmm.is_special, false)
  and public.normalize_menu_lookup(coalesce(d.normalized_name, d.name))
    = public.normalize_menu_lookup(rmm.dish_name);

create unique index if not exists idx_dishes_user_lookup_unique
  on public.dishes(user_id, public.normalize_menu_lookup(coalesce(normalized_name, name)))
  where user_id is not null;

create unique index if not exists idx_ingredients_lookup_unique
  on public.ingredients(public.normalize_menu_lookup(coalesce(normalized_name, name)));
