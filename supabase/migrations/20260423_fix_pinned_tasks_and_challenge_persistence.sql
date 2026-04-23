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

alter table public.pinned_tasks
  add column if not exists user_id uuid;

alter table public.pinned_tasks
  add column if not exists title text;

alter table public.pinned_tasks
  add column if not exists description text;

alter table public.pinned_tasks
  add column if not exists priority text not null default 'medium';

alter table public.pinned_tasks
  add column if not exists day_of_week text;

alter table public.pinned_tasks
  add column if not exists start_time text;

alter table public.pinned_tasks
  add column if not exists end_time text;

alter table public.pinned_tasks
  add column if not exists tags text[];

alter table public.pinned_tasks
  add column if not exists is_active boolean not null default true;

alter table public.pinned_tasks
  add column if not exists until_date date;

alter table public.pinned_tasks
  add column if not exists created_at timestamp with time zone not null default now();

alter table public.pinned_tasks
  add column if not exists updated_at timestamp with time zone not null default now();

create index if not exists idx_pinned_tasks_user_active on public.pinned_tasks (user_id, is_active);
create index if not exists idx_pinned_tasks_user_day on public.pinned_tasks (user_id, day_of_week);

alter table public.pinned_tasks enable row level security;

drop policy if exists "Pinned tasks are readable by owner" on public.pinned_tasks;
drop policy if exists "Pinned tasks are insertable by owner" on public.pinned_tasks;
drop policy if exists "Pinned tasks are updatable by owner" on public.pinned_tasks;
drop policy if exists "Pinned tasks are deletable by owner" on public.pinned_tasks;

create policy "Pinned tasks are readable by owner"
  on public.pinned_tasks
  for select
  using (auth.uid() = user_id);

create policy "Pinned tasks are insertable by owner"
  on public.pinned_tasks
  for insert
  with check (auth.uid() = user_id);

create policy "Pinned tasks are updatable by owner"
  on public.pinned_tasks
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Pinned tasks are deletable by owner"
  on public.pinned_tasks
  for delete
  using (auth.uid() = user_id);

alter table public.weeks
  add column if not exists challenge_days jsonb null default '[]'::jsonb;

update public.weeks
set challenge_days = coalesce(challenge_days, '[]'::jsonb);