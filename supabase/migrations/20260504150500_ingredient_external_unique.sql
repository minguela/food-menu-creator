create unique index if not exists idx_ingredients_source_external_unique
  on public.ingredients(source, external_id);
