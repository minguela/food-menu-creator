alter table public.dishes
add column if not exists recipe_status text not null default 'pending_ingredients'
check (recipe_status in ('pending_ingredients', 'suggested_ingredients', 'complete', 'not_required'));

create table if not exists public.dish_ingredient_suggestions (
  id uuid primary key default gen_random_uuid(),
  dish_id uuid not null references public.dishes(id) on delete cascade,
  name text not null,
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  source text not null check (source in ('dish_name')),
  needs_review boolean not null default true,
  confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (dish_id, name)
);

create index if not exists idx_dish_ingredient_suggestions_dish
  on public.dish_ingredient_suggestions(dish_id, confirmed);
