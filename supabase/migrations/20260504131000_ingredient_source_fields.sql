alter table public.ingredients
add column if not exists external_id text,
add column if not exists barcode text,
add column if not exists nutrition_status text not null default 'pending';

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

create index if not exists idx_ingredients_source on public.ingredients(source);
create index if not exists idx_ingredients_external_id on public.ingredients(external_id);
create index if not exists idx_ingredients_barcode on public.ingredients(barcode);
