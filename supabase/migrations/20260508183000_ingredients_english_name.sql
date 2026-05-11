alter table public.ingredients
add column if not exists english_name text;

create index if not exists idx_ingredients_english_name
  on public.ingredients(english_name);
