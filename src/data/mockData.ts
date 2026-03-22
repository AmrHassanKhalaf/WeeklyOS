// ─────────────────────────────────────────────────────────────────────────────
// mockData.ts now only re-exports types from the store.
// All actual mock data has been removed – the app uses live Supabase data.
// ─────────────────────────────────────────────────────────────────────────────
export type {
  Priority,
  TaskStatus,
  DayOfWeek,
  Task,
  BrainDumpItem,
  DayPlan,
  WeekData,
} from '../store/useWeekStore'
