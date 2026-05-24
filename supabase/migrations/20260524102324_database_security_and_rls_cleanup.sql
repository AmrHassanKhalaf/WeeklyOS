-- Remove unused test artifact.
drop table if exists public.test_table cascade;

-- Keep pinned tasks tied to auth.users like the rest of user-owned tables.
alter table public.pinned_tasks
  drop constraint if exists pinned_tasks_user_id_fkey;

alter table public.pinned_tasks
  add constraint pinned_tasks_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- Move Slack feedback notification out of the exposed public schema and remove
-- hardcoded webhook secrets. Configure the webhook as a Vault secret named:
-- slack_feedback_webhook_url
create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

drop trigger if exists notify_slack_feedback_trigger on public.user_feedback;
drop function if exists public.notify_slack_on_feedback();

create or replace function private.notify_slack_on_feedback()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  payload jsonb;
  request_id bigint;
  webhook_url text;
begin
  select decrypted_secret
    into webhook_url
  from vault.decrypted_secrets
  where name = 'slack_feedback_webhook_url'
  limit 1;

  if webhook_url is null or btrim(webhook_url) = '' then
    return new;
  end if;

  payload := jsonb_build_object(
    'text', 'New WeeklyOS feedback received' || chr(10) ||
            'Type: ' || upper(coalesce(new.type, 'other')) || chr(10) ||
            'Message: ' || left(coalesce(new.message, ''), 2000) || chr(10) ||
            'Time: ' || new.created_at::text
  );

  select net.http_post(
    url := webhook_url,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := payload
  ) into request_id;

  return new;
end;
$$;

create trigger notify_slack_feedback_trigger
after insert on public.user_feedback
for each row execute function private.notify_slack_on_feedback();

-- Optimize RLS policies to avoid per-row auth.uid() re-evaluation.
drop policy if exists "habits_select_own" on public.habits;
drop policy if exists "habits_insert_own" on public.habits;
drop policy if exists "habits_update_own" on public.habits;
drop policy if exists "habits_delete_own" on public.habits;
create policy "habits_select_own" on public.habits for select using ((select auth.uid()) = user_id);
create policy "habits_insert_own" on public.habits for insert with check ((select auth.uid()) = user_id);
create policy "habits_update_own" on public.habits for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "habits_delete_own" on public.habits for delete using ((select auth.uid()) = user_id);

drop policy if exists "completions_select_own" on public.habit_completions;
drop policy if exists "completions_insert_own" on public.habit_completions;
drop policy if exists "completions_delete_own" on public.habit_completions;
create policy "completions_select_own" on public.habit_completions for select using ((select auth.uid()) = user_id);
create policy "completions_insert_own" on public.habit_completions for insert with check ((select auth.uid()) = user_id);
create policy "completions_delete_own" on public.habit_completions for delete using ((select auth.uid()) = user_id);

drop policy if exists "Pinned tasks are readable by owner" on public.pinned_tasks;
drop policy if exists "Pinned tasks are insertable by owner" on public.pinned_tasks;
drop policy if exists "Pinned tasks are updatable by owner" on public.pinned_tasks;
drop policy if exists "Pinned tasks are deletable by owner" on public.pinned_tasks;
create policy "Pinned tasks are readable by owner" on public.pinned_tasks for select using ((select auth.uid()) = user_id);
create policy "Pinned tasks are insertable by owner" on public.pinned_tasks for insert with check ((select auth.uid()) = user_id);
create policy "Pinned tasks are updatable by owner" on public.pinned_tasks for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Pinned tasks are deletable by owner" on public.pinned_tasks for delete using ((select auth.uid()) = user_id);

drop policy if exists "Users can manage their own focus sessions" on public.focus_sessions;
create policy "Users can manage their own focus sessions" on public.focus_sessions
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own feedback" on public.user_feedback;
drop policy if exists "Users can view their own feedback" on public.user_feedback;
create policy "Users can insert their own feedback" on public.user_feedback for insert with check ((select auth.uid()) = user_id);
create policy "Users can view their own feedback" on public.user_feedback for select using ((select auth.uid()) = user_id);
