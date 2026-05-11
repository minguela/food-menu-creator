alter table public.ingredients
add column if not exists normalized_name text,
add column if not exists default_unit_type text,
add column if not exists source text not null default 'manual',
add column if not exists external_id text,
add column if not exists barcode text,
add column if not exists is_verified boolean not null default false,
add column if not exists nutrition_status text not null default 'pending',
add column if not exists updated_at timestamptz not null default now();

update public.ingredients
set nutrition_status = case
  when kcal_per_100g is not null
    and protein_per_100g is not null
    and carbs_per_100g is not null
    and fat_per_100g is not null
  then 'complete'
  else 'pending'
end
where nutrition_status is null;

alter table public.ingredients
drop constraint if exists ingredients_nutrition_status_check;
alter table public.ingredients
add constraint ingredients_nutrition_status_check
check (nutrition_status in ('complete', 'pending', 'needs_review'));

update public.ingredients
set normalized_name = lower(trim(name))
where normalized_name is null;

update public.ingredients
set default_unit_type = unit_type
where default_unit_type is null and unit_type is not null;

create unique index if not exists idx_ingredients_normalized_name_unique
  on public.ingredients(normalized_name);
create index if not exists idx_ingredients_source on public.ingredients(source);
create index if not exists idx_ingredients_external_id on public.ingredients(external_id);
create index if not exists idx_ingredients_barcode on public.ingredients(barcode);

alter table public.dishes
add column if not exists normalized_name text,
add column if not exists source text not null default 'manual',
add column if not exists updated_at timestamptz not null default now();

alter table public.dishes
drop constraint if exists dishes_recipe_status_check;
alter table public.dishes
add constraint dishes_recipe_status_check
check (
  recipe_status in (
    'pending_ingredients',
    'suggested_ingredients',
    'complete',
    'not_required',
    'incomplete_nutrition'
  )
);

update public.dishes
set normalized_name = lower(trim(name))
where normalized_name is null;

create index if not exists idx_dishes_user_normalized_name
  on public.dishes(user_id, normalized_name);

create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.dishes(id) on delete cascade,
  ingredient_id uuid references public.ingredients(id) on delete set null,
  name text not null,
  normalized_name text not null,
  quantity decimal(10,2),
  unit_type varchar(20) check (unit_type in ('kg', 'g', 'l', 'ml', 'ud', 'pack', 'unidad')),
  is_confirmed boolean not null default false,
  is_suggested boolean not null default false,
  needs_review boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_recipe_ingredients_recipe_normalized_name_unique
  on public.recipe_ingredients(recipe_id, normalized_name);

create index if not exists idx_recipe_ingredients_recipe_confirmed
  on public.recipe_ingredients(recipe_id, is_confirmed);

insert into public.recipe_ingredients (
  recipe_id,
  ingredient_id,
  name,
  normalized_name,
  quantity,
  unit_type,
  is_confirmed,
  is_suggested,
  needs_review
)
select
  di.dish_id as recipe_id,
  di.ingredient_id,
  coalesce(i.name, 'ingrediente') as name,
  lower(trim(coalesce(i.name, 'ingrediente'))) as normalized_name,
  di.quantity,
  coalesce(di.unit_type, i.unit_type) as unit_type,
  true as is_confirmed,
  false as is_suggested,
  false as needs_review
from public.dish_ingredients di
left join public.ingredients i on i.id = di.ingredient_id
on conflict (recipe_id, normalized_name) do update set
  ingredient_id = excluded.ingredient_id,
  quantity = excluded.quantity,
  unit_type = excluded.unit_type,
  is_confirmed = true,
  is_suggested = false,
  needs_review = false,
  updated_at = now();

insert into public.recipe_ingredients (
  recipe_id,
  ingredient_id,
  name,
  normalized_name,
  quantity,
  unit_type,
  is_confirmed,
  is_suggested,
  needs_review
)
select
  dis.dish_id as recipe_id,
  null as ingredient_id,
  dis.name,
  lower(trim(dis.name)) as normalized_name,
  null as quantity,
  null as unit_type,
  false as is_confirmed,
  true as is_suggested,
  coalesce(dis.needs_review, true) as needs_review
from public.dish_ingredient_suggestions dis
where coalesce(dis.confirmed, false) = false
on conflict (recipe_id, normalized_name) do nothing;

drop trigger if exists update_ingredients_updated_at on public.ingredients;
create trigger update_ingredients_updated_at
before update on public.ingredients
for each row
execute function public.update_updated_at_column();

drop trigger if exists update_dishes_updated_at on public.dishes;
create trigger update_dishes_updated_at
before update on public.dishes
for each row
execute function public.update_updated_at_column();

drop trigger if exists update_recipe_ingredients_updated_at on public.recipe_ingredients;
create trigger update_recipe_ingredients_updated_at
before update on public.recipe_ingredients
for each row
execute function public.update_updated_at_column();
