alter table public.ingredients
add column if not exists review_reason text,
add column if not exists caloric_density_level text;

alter table public.ingredients
drop constraint if exists ingredients_caloric_density_level_check;

alter table public.ingredients
add constraint ingredients_caloric_density_level_check
check (
  caloric_density_level is null
  or caloric_density_level in (
    'very_low',
    'low',
    'normal',
    'caloric',
    'very_caloric'
  )
);

update public.ingredients
set caloric_density_level = case
  when kcal_per_100g is null then null
  when kcal_per_100g < 50 then 'very_low'
  when kcal_per_100g < 100 then 'low'
  when kcal_per_100g <= 200 then 'normal'
  when kcal_per_100g <= 400 then 'caloric'
  else 'very_caloric'
end
where caloric_density_level is null;

create index if not exists idx_ingredients_caloric_density_level
  on public.ingredients(caloric_density_level);
