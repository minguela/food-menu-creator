create or replace function public.normalize_ingredient_name(value text)
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

create or replace function public.recipe_ingredients_before_write()
returns trigger
language plpgsql
as $$
declare
  ingredient_row public.ingredients%rowtype;
  matched_ingredient_id uuid;
  existing_row_id uuid;
begin
  if new.ingredient_id is not null then
    select *
    into ingredient_row
    from public.ingredients
    where id = new.ingredient_id;

    if found then
      new.name := ingredient_row.name;
      new.normalized_name := coalesce(
        ingredient_row.normalized_name,
        public.normalize_ingredient_name(ingredient_row.name)
      );
      new.unit_type := coalesce(new.unit_type, ingredient_row.default_unit_type, ingredient_row.unit_type);
    else
      new.name := trim(coalesce(new.name, ''));
      new.normalized_name := public.normalize_ingredient_name(new.name);
    end if;
  else
    new.name := trim(coalesce(new.name, ''));
    new.normalized_name := public.normalize_ingredient_name(new.name);

    if new.normalized_name <> '' then
      select id
      into matched_ingredient_id
      from public.ingredients
      where normalized_name = new.normalized_name
      limit 1;

      if matched_ingredient_id is not null then
        new.ingredient_id := matched_ingredient_id;

        select *
        into ingredient_row
        from public.ingredients
        where id = matched_ingredient_id;

        new.name := ingredient_row.name;
        new.unit_type := coalesce(new.unit_type, ingredient_row.default_unit_type, ingredient_row.unit_type);
      end if;
    end if;
  end if;

  if coalesce(new.normalized_name, '') = '' then
    raise exception 'recipe_ingredients.name cannot be empty'
      using errcode = '22023';
  end if;

  if tg_op = 'INSERT' then
    select id
    into existing_row_id
    from public.recipe_ingredients
    where recipe_id = new.recipe_id
      and normalized_name = new.normalized_name
    limit 1;

    if existing_row_id is not null then
      update public.recipe_ingredients
      set
        ingredient_id = coalesce(recipe_ingredients.ingredient_id, new.ingredient_id),
        name = coalesce(new.name, recipe_ingredients.name),
        quantity = coalesce(new.quantity, recipe_ingredients.quantity),
        unit_type = coalesce(new.unit_type, recipe_ingredients.unit_type),
        is_confirmed = (coalesce(recipe_ingredients.is_confirmed, false) or coalesce(new.is_confirmed, false)),
        is_suggested = (coalesce(recipe_ingredients.is_suggested, false) and not coalesce(new.is_confirmed, false)),
        needs_review = (coalesce(recipe_ingredients.needs_review, true) and coalesce(new.needs_review, true)),
        updated_at = now()
      where id = existing_row_id;

      return null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists recipe_ingredients_before_write_trigger on public.recipe_ingredients;
create trigger recipe_ingredients_before_write_trigger
before insert or update on public.recipe_ingredients
for each row
execute function public.recipe_ingredients_before_write();

update public.ingredients
set normalized_name = public.normalize_ingredient_name(name)
where normalized_name is distinct from public.normalize_ingredient_name(name);

with ranked as (
  select
    id,
    recipe_id,
    public.normalize_ingredient_name(name) as normalized_target,
    row_number() over (
      partition by recipe_id, public.normalize_ingredient_name(name)
      order by is_confirmed desc, updated_at desc nulls last, created_at desc nulls last, id
    ) as rn
  from public.recipe_ingredients
)
delete from public.recipe_ingredients ri
using ranked r
where ri.id = r.id
  and r.rn > 1;

update public.recipe_ingredients
set
  name = trim(name),
  normalized_name = public.normalize_ingredient_name(name)
where
  name is distinct from trim(name)
  or normalized_name is distinct from public.normalize_ingredient_name(name);
