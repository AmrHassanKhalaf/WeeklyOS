alter table public.weeks
  add column if not exists title text null,
  add column if not exists overview_note text null;
