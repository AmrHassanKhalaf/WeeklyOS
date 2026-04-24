alter table public.tasks drop constraint if exists tasks_type_check;

alter table public.tasks
  add constraint tasks_type_check
  check (type is null or type in ('main', 'medium', 'small', 'pinned'));
