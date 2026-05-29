# WeeklyOS — Full Feature ↔ DB Audit

## Summary

After reading every store, page, and feature in the codebase and cross-referencing with the live DB schema, here are the gaps:

---

## ✅ Features Already Fully Backed by DB

| Feature | Tables | Status |
|---|---|---|
| Weeks & Week Data | `weeks` | ✅ Complete |
| Tasks (CRUD, day, priority, tags) | `tasks` | ✅ Complete |
| Brain Dump | `brain_dump` | ✅ Complete |
| Habits + Completions | `habits`, `habit_completions` | ✅ Complete |
| Pinned Tasks | `pinned_tasks` | ✅ Complete |
| Focus Sessions | `focus_sessions` | ✅ Complete |
| AI Keys | `ai_keys` | ✅ Complete (hardened) |
| AI Settings | `ai_settings` | ✅ Complete (hardened) |
| User Settings (theme, reminders, rest days, timezone) | `user_settings` | ✅ Complete |
| Weekly Evaluation | `weeks.eval_*` columns | ✅ Complete |
| Challenge Tracker | `weeks.challenge_*` columns | ✅ Complete |
| Daily Notes | `weeks.daily_notes` jsonb | ✅ Complete |
| Activities | `weeks.activities` jsonb | ✅ Complete |
| AI Tool Permissions | `ai_tool_permissions` | ✅ Just added |
| AI Pending Confirmations | `ai_pending_confirmations` | ✅ Just added |
| AI Telemetry | `ai_telemetry_events` | ✅ Just added |
| AI Runs | `ai_runs` | ✅ Just added |
| Offline Queue | localStorage only | ✅ By design — ephemeral queue |
| Layout Preferences | localStorage only | ✅ By design — UI-only state |

---

## ❌ Gaps Found — Missing DB Columns

### Gap 1 — `user_settings` missing `report_included_days` + `report_closing_quote`

**Code:** `useSettingsStore.ts` lines 56-57 manages `reportIncludedDays` and `reportClosingQuote`.
**DB:** `user_settings` has NO `report_included_days` or `report_closing_quote` column.
**Impact:** These preferences are lost on page refresh (only in localStorage). If user clears browser data, their report configuration is gone.
**Fix:** Add 2 columns.

### Gap 2 — `tasks` missing `updated_at`

**Code:** `offlineQueueStore.ts` line 90 reads `updated_at` for conflict resolution:
```ts
const { id, updated_at: localUpdatedAt, ...fields } = payload
```
**DB:** `tasks` table has NO `updated_at` column. The conflict check silently skips (server never newer = always apply).
**Impact:** Offline conflict resolution is broken for tasks — last write always wins regardless of server state.
**Fix:** Add `updated_at timestamptz` with trigger.

### Gap 3 — `weeks` missing `updated_at`

**Code:** `offlineQueueStore.ts` same conflict resolution applies to weeks table.
**DB:** `weeks` has NO `updated_at` column.
**Impact:** Same as Gap 2.
**Fix:** Add `updated_at timestamptz` with trigger.

### Gap 4 — `habits` has unused `difficulty` column

**Code:** `useHabitStore.ts` — `Habit` interface has NO `difficulty` field.
**DB:** `habits.difficulty text NOT NULL DEFAULT 'medium'` — column exists but is never read/written.
**Impact:** Wasted column, not blocking. Low priority.
**Fix:** No code change needed now. Can be dropped in a future cleanup migration.

### Gap 5 — `user_settings` missing `pomodoro_focus_min` + `pomodoro_break_min`

**Code:** `useWeekStore.ts` lines 148-152 manages:
```ts
pomodoroTime: number
pomodoroFocusMin: number
pomodoroBreakMin: number
```
These are set via `setPomodoroPreset` but only persist in Zustand (in-memory, lost on refresh).
**DB:** No pomodoro columns in `user_settings`.
**Impact:** User's custom pomodoro timers reset on every page refresh.
**Fix:** Add 2 columns to `user_settings`.

---

## Migration Plan

### Migration A — `tasks` + `weeks` updated_at (Gap 2 + 3)
```sql
-- tasks.updated_at
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
UPDATE public.tasks SET updated_at = created_at WHERE updated_at IS NULL;
ALTER TABLE public.tasks ALTER COLUMN updated_at SET NOT NULL;
DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- weeks.updated_at
ALTER TABLE public.weeks ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
UPDATE public.weeks SET updated_at = created_at WHERE updated_at IS NULL;
ALTER TABLE public.weeks ALTER COLUMN updated_at SET NOT NULL;
DROP TRIGGER IF EXISTS weeks_updated_at ON public.weeks;
CREATE TRIGGER weeks_updated_at
  BEFORE UPDATE ON public.weeks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

### Migration B — `user_settings` report columns (Gap 1)
```sql
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS report_included_days jsonb DEFAULT '["saturday","sunday","monday","tuesday","wednesday","thursday","friday"]'::jsonb,
  ADD COLUMN IF NOT EXISTS report_closing_quote  text  DEFAULT 'The secret of getting ahead is getting started.';
```

### Migration C — `user_settings` pomodoro columns (Gap 5)
```sql
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS pomodoro_focus_min  smallint DEFAULT 25,
  ADD COLUMN IF NOT EXISTS pomodoro_break_min  smallint DEFAULT 5;
```

---

## What Requires Manual / Frontend Work After Migrations

| Item | What needs to change |
|---|---|
| `reportIncludedDays` + `reportClosingQuote` | After Migration B: update `syncSettingsToDb` and `loadFromDb` in `useSettingsStore.ts` to read/write these columns |
| Pomodoro preset persistence | After Migration C: update `setPomodoroPreset` in `useWeekStore.ts` to persist to `user_settings` and load on startup |
| Offline conflict resolution for tasks/weeks | After Migration A: no code change needed — `offlineQueueStore` already reads `updated_at`, it just wasn't in DB |
