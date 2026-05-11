alter table public.rotating_menu_days
  add column if not exists source_weekly_menu_id uuid;
