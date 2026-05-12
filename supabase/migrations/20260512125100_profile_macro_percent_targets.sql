-- Add protein_pct_target to profiles and enforce exact 100% macro split.

alter table public.person_profiles
  add column if not exists protein_pct_target int not null default 25;

update public.person_profiles
set protein_pct_target = greatest(5, 100 - coalesce(carbs_pct_target, 0) - coalesce(fat_pct_target, 0))
where protein_pct_target is null
   or protein_pct_target != (100 - coalesce(carbs_pct_target, 0) - coalesce(fat_pct_target, 0));

alter table public.person_profiles
  drop constraint if exists person_profiles_macro_split_check;
alter table public.person_profiles
  add constraint person_profiles_macro_split_check
  check (
    carbs_pct_target is not null
    and fat_pct_target is not null
    and protein_pct_target is not null
    and carbs_pct_target + fat_pct_target + protein_pct_target = 100
    and carbs_pct_target > 0
    and fat_pct_target > 0
    and protein_pct_target > 0
  );

alter table public.person_profiles
  drop constraint if exists person_profiles_macro_range_check;
alter table public.person_profiles
  add constraint person_profiles_macro_range_check
  check (
    carbs_pct_target between 5 and 80
    and fat_pct_target between 5 and 70
    and protein_pct_target between 5 and 50
  );

update public.person_profiles
set daily_protein_target = round((daily_kcal_target * protein_pct_target) / 100.0 / 4, 1)
where daily_protein_target is null
   or daily_protein_target != round((daily_kcal_target * protein_pct_target) / 100.0 / 4, 1)
   or daily_kcal_target > 0;
