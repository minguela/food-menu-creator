alter table public.dishes
  add column if not exists is_special boolean not null default false,
  add column if not exists special_kcal_reserved integer not null default 700;

alter table public.dishes
  drop constraint if exists dishes_special_kcal_reserved_check;
alter table public.dishes
  add constraint dishes_special_kcal_reserved_check
  check (special_kcal_reserved between 0 and 2000);

create index if not exists idx_dishes_user_special
  on public.dishes(user_id, is_special);
