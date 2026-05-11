create table if not exists public.menu_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending',
  progress int not null default 0,
  error_message text,
  input_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb,
  result_menu_id uuid references public.rotating_menus(id) on delete set null,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint menu_generation_jobs_status_check
    check (status in ('pending', 'processing', 'completed', 'failed')),
  constraint menu_generation_jobs_progress_check
    check (progress between 0 and 100)
);

create index if not exists idx_menu_generation_jobs_user_created
  on public.menu_generation_jobs(user_id, created_at desc);

create index if not exists idx_menu_generation_jobs_status_created
  on public.menu_generation_jobs(status, created_at desc);

create index if not exists idx_menu_generation_jobs_user_status
  on public.menu_generation_jobs(user_id, status);

drop trigger if exists update_menu_generation_jobs_updated_at on public.menu_generation_jobs;
create trigger update_menu_generation_jobs_updated_at
before update on public.menu_generation_jobs
for each row
execute function public.update_updated_at_column();

