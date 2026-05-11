alter table public.menu_generation_jobs
  add column if not exists current_step text,
  add column if not exists heartbeat_at timestamptz;

create table if not exists public.menu_generation_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.menu_generation_jobs(id) on delete cascade,
  level text not null default 'info',
  step text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint menu_generation_logs_level_check
    check (level in ('debug', 'info', 'warn', 'error'))
);

create index if not exists idx_menu_generation_logs_job_created
  on public.menu_generation_logs(job_id, created_at asc);

create index if not exists idx_menu_generation_logs_job_level
  on public.menu_generation_logs(job_id, level, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'menu_generation_jobs'
  ) then
    alter publication supabase_realtime add table public.menu_generation_jobs;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'menu_generation_logs'
  ) then
    alter publication supabase_realtime add table public.menu_generation_logs;
  end if;
end $$;
