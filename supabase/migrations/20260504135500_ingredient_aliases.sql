create table if not exists public.ingredient_aliases (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid references public.ingredients(id) on delete set null,
  alias_es text not null,
  alias_en text not null,
  normalized_alias_es text not null,
  normalized_alias_en text not null,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_ingredient_aliases_norm_es_unique
  on public.ingredient_aliases(normalized_alias_es);
create index if not exists idx_ingredient_aliases_norm_en
  on public.ingredient_aliases(normalized_alias_en);

drop trigger if exists update_ingredient_aliases_updated_at on public.ingredient_aliases;
create trigger update_ingredient_aliases_updated_at
before update on public.ingredient_aliases
for each row
execute function public.update_updated_at_column();

insert into public.ingredient_aliases (
  ingredient_id,
  alias_es,
  alias_en,
  normalized_alias_es,
  normalized_alias_en,
  source
)
select
  i.id,
  'arroz',
  'rice',
  'arroz',
  'rice',
  'system'
from public.ingredients i
where i.normalized_name = 'arroz'
on conflict (normalized_alias_es) do nothing;

insert into public.ingredient_aliases (
  ingredient_id,
  alias_es,
  alias_en,
  normalized_alias_es,
  normalized_alias_en,
  source
)
select
  i.id,
  'calabacin',
  'zucchini',
  'calabacin',
  'zucchini',
  'system'
from public.ingredients i
where i.normalized_name = 'calabacin'
on conflict (normalized_alias_es) do nothing;
