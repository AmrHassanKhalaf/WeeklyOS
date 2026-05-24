create index if not exists idx_focus_sessions_task_id
  on public.focus_sessions (task_id)
  where task_id is not null;

create index if not exists idx_habit_completions_user_id
  on public.habit_completions (user_id);

create index if not exists idx_tasks_pinned_task_id
  on public.tasks (pinned_task_id)
  where pinned_task_id is not null;

create index if not exists idx_user_feedback_user_id
  on public.user_feedback (user_id);
