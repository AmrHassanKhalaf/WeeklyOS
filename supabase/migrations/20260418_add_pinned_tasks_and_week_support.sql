create table if not exists public.pinned_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text null,
  priority text not null default 'medium',
  day_of_week text not null,
  start_time text null,
  end_time text null,
  tags text[] null,
  is_active boolean not null default true,
  until_date date null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint pinned_tasks_priority_check check (priority in ('high', 'medium', 'low')),
  constraint pinned_tasks_day_of_week_check check (day_of_week in ('saturday','sunday','monday','tuesday','wednesday','thursday','friday'))
);

create index if not exists idx_pinned_tasks_user_active on public.pinned_tasks (user_id, is_active);
create index if not exists idx_pinned_tasks_user_day on public.pinned_tasks (user_id, day_of_week);

alter table public.tasks
  add column if not exists pinned_task_id uuid null references public.pinned_tasks(id) on delete set null;

create unique index if not exists idx_tasks_week_pinned_unique
  on public.tasks (week_id, pinned_task_id)
  where pinned_task_id is not null;

alter table public.user_settings
  add column if not exists auto_download_completed_week_report boolean null;

alter table public.user_settings
  add column if not exists timezone text null;

alter table public.user_settings
  add column if not exists week_start_day text null;

update public.user_settings
set
  auto_download_completed_week_report = coalesce(auto_download_completed_week_report, false),
  timezone = coalesce(timezone, 'Africa/Cairo'),
  week_start_day = coalesce(week_start_day, 'saturday');
