alter table public.user_settings
  add column if not exists missed_task_resolution text null;

alter table public.user_settings
  alter column missed_task_resolution set default 'missed_copy_to_braindump';

alter table public.user_settings
  drop constraint if exists user_settings_missed_task_resolution_check;

alter table public.user_settings
  add constraint user_settings_missed_task_resolution_check
  check (
    missed_task_resolution is null
    or missed_task_resolution in (
      'missed_copy_to_braindump',
      'return_to_braindump_delete',
      'delete'
    )
  );

update public.user_settings
set missed_task_resolution = coalesce(missed_task_resolution, 'missed_copy_to_braindump');

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.tasks'::regclass
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%status%'
  loop
    execute format('alter table public.tasks drop constraint if exists %I', constraint_name);
  end loop;
end $$;

alter table public.tasks
  add constraint tasks_status_check
  check (status in ('pending', 'done', 'missed'));
