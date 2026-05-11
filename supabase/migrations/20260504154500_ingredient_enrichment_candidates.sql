alter table public.ingredients
drop constraint if exists ingredients_nutrition_status_check;

alter table public.ingredients
add constraint ingredients_nutrition_status_check
check (nutrition_status in ('complete', 'pending', 'needs_review', 'not_found'));

create table if not exists public.ingredient_nutrition_candidates (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  source text not null,
  external_id text,
  name text not null,
  kcal_per_100g numeric,
  protein_per_100g numeric,
  carbs_per_100g numeric,
  fat_per_100g numeric,
  confidence numeric not null default 0,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ingredient_nutrition_candidates_ingredient
  on public.ingredient_nutrition_candidates(ingredient_id, created_at desc);

create index if not exists idx_ingredient_nutrition_candidates_source_external
  on public.ingredient_nutrition_candidates(source, external_id);
