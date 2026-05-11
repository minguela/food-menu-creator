create or replace function public.normalize_dish_name(value text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    translate(lower(trim(coalesce(value, ''))), 'áàäâãéèëêíìïîóòöôõúùüûñç', 'aaaaaeeeeiiiiooooouuuunc'),
    '\s+',
    ' ',
    'g'
  )
$$;

create or replace function public.dishes_before_write()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.name, '') <> '' then
    new.normalized_name := public.normalize_dish_name(new.name);
  end if;
  return new;
end;
$$;

drop trigger if exists dishes_before_write_trigger on public.dishes;
create trigger dishes_before_write_trigger
before insert or update on public.dishes
for each row
execute function public.dishes_before_write();

update public.dishes
set normalized_name = public.normalize_dish_name(name)
where normalized_name is distinct from public.normalize_dish_name(name);
