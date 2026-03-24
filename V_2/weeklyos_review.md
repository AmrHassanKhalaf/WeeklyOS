# WeeklyOS — Comprehensive End-to-End Review

**Reviewed:** March 24, 2026 | **Stack:** Vite + React 18 + TypeScript + Zustand + Supabase + TailwindCSS

---

## 1. Project Overview

WeeklyOS is a personal weekly planner SPA with the following key areas:

| Area | Details |
|---|---|
| **Frontend** | Vite 5 / React 18 / TypeScript / Zustand / TailwindCSS / Framer Motion |
| **Backend** | Supabase (Postgres + Auth + Realtime + Edge Functions) |
| **AI Layer** | Supabase Edge Function (`ai-handler`) routing to Gemini / Grok |
| **Deployment** | Vercel (via `vercel.json`) |
| **Pages** | Dashboard, Weekly Distribution, Focused Day, Brain Dump, Weekly Evaluation, Settings |

---

## 2. Database (Supabase) Review

### 2.1 Schema Summary

| Table | Rows | RLS | Notes |
|---|---|---|---|
| `weeks` | 2 | ✅ | Core anchor for planning. Contains many embedded text fields. |
| `tasks` | 8 | ✅ | FK → `weeks.id`. Missing covering index. |
| `brain_dump` | 1 | ✅ | OK. |
| `daily_logs` | 0 | ✅ | **Completely unused** — no reads/writes found in codebase. |
| `user_settings` | 2 | ✅ | Separate from `ai_settings` unnecessarily. |
| `ai_settings` | 4 | ✅ | Could be merged into `user_settings`. |
| `ai_keys` | 3 | ✅ | API keys stored in **plain text**. Critical. |

### 2.2 Database Issues

#### 🔴 Critical — AI Keys Stored as Plain Text
The `ai_keys.api_key` column stores user-provided API keys (Gemini, Grok) as plaintext in Postgres. While RLS protects inter-user access, this is a significant security risk if any DB breach or admin compromise occurs.

#### 🟡 Warning — 30 RLS Initialization Plan Issues (All Tables)
Every table uses `auth.uid()` directly in policy expressions. Supabase's own linter flags this as a **WARN**: the function is re-evaluated for every row rather than once per query. This causes suboptimal performance at scale.

**Fix pattern:** Replace `auth.uid()` with `(select auth.uid())` in all RLS policies.

#### 🟡 Warning — Unindexed Foreign Key on `tasks.week_id`
The `tasks_week_id_fkey` constraint has no covering index. Since the most common query pattern is `SELECT * FROM tasks WHERE week_id = ?`, this causes a sequential scan on the tasks table.

#### 🔵 Info — Unused Indexes
- `idx_tasks_user_week` on `tasks` — never used
- `idx_daily_logs_user_date` on `daily_logs` — never used (table itself is empty/unused)

#### 🔵 Info — `daily_logs` Table Is Dead Code
The `daily_logs` table exists with a full schema and RLS policies, but there are **zero reads or writes** to it anywhere in the codebase. Either this feature is planned but not started, or it's orphaned.

#### 🔵 Info — Schema Denormalization in `weeks`
The `weeks` table embeds several fields that could arguably live in separate tables (`eval_went_well`, `eval_struggle`, `eval_lessons`, `challenge_title`, `challenge_description`, `challenge_progress`, `challenge_ends_in`). For the current scale this is fine, but it's worth noting for future maintainability.

#### 🔵 Info — `activities` Stored as a JSON String in Postgres
The `weeks.activities` column is of type `text` and contains a JSON-stringified array. This means Postgres cannot query into the activities. It should be `jsonb` for consistency with `daily_notes` (which is already `jsonb`).

---

## 3. API & Backend Logic

### 3.1 Architecture
All AI requests are routed through a single Supabase Edge Function (`ai-handler`). The function is invoked via `supabase.functions.invoke()` (for non-streaming) and direct `fetch` (for streaming voice). This dual-path approach works but creates some inconsistency.

### 3.2 Issues

#### 🔴 Critical — Hardcoded Supabase URL & Anon Key in Source Code
In [supabase.ts](file:///e:/My%20Codes/Projects/WeeklyOS/src/lib/supabase.ts#L4-L6), both `SUPABASE_URL` and `SUPABASE_ANON_KEY` are hardcoded strings. The `useApi.ts` hook then reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `import.meta.env` for the stream path — meaning there are **two sources of truth** for the same credentials. The hardcoded values will be bundled into the public JS bundle and committed to git.

```diff
// supabase.ts — should use env vars
-const SUPABASE_URL = "https://vdbscudaljbxqcndwovp.supabase.co";
-const SUPABASE_ANON_KEY = "eyJhbG...";
+const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
+const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

#### 🟡 Warning — No Rollback on Failed Mutations (Optimistic Updates)
`toggleTaskComplete`, `createTask`, `updateTask`, and similar functions perform an optimistic UI update first, then write to the DB. If the DB write fails, only a `console.error` fires — the UI is **never reverted** to the correct state. Users see a desync between what they see and what's actually saved.

#### 🟡 Warning — `useWeekStore` Has a God-Object Anti-Pattern
At 824 lines, `useWeekStore.ts` mixes types, helper functions, DB logic, realtime subscriptions, pomodoro state, brain dump CRUD, and evaluation logic all in one file. This violates separation of concerns and makes the file extremely hard to test or extend.

#### 🟡 Warning — `as any` Casts on DB Queries in `useSettingsStore`
Every Supabase query in `useSettingsStore.ts` uses `as any` casting (e.g. `supabase.from('user_settings' as any)`). This defeats the purpose of generated TypeScript types and hides type errors. The generated types in `database.types.ts` cover these tables, so the `as any` is unnecessary.

#### 🔵 Info — Week Number Calculation is Non-Standard
`getCurrentWeekInfo()` in the store uses a custom calculation that doesn't align with ISO 8601 week numbering and is Saturday-anchored. This is fine as a product choice, but the code is fragile — a one-liner built on `getDay()` without proper edge-case handling (e.g. Dec 31/Jan 1 boundary years).

#### 🔵 Info — Realtime Subscription Filters on `week_id` But Not `user_id`
The realtime channel subscribes to `week_id=eq.${week.id}` at the Supabase filter level. While RLS ensures the user only gets their own data, there is no user-level filter on the realtime channel. This could result in slight over-delivery if RLS is ever loosened.

#### 🔵 Info — `exportWeeklyReport` Exports Settings State (Not Weekly Data)
In `useSettingsStore.ts`, `exportWeeklyReport()` exports the entire settings store state as JSON — this includes AI keys stored in localStorage. This should export week/task data instead, or at minimum, should strip sensitive keys before download.

---

## 4. Frontend & UX Review

### 4.1 Architecture

The app uses a **client-side-only** architecture with:
- `BrowserRouter` placed *inside* the authenticated `AppRouter` (not at the root `App` level)
- Single `AuthContext` for user state
- Two Zustand stores: `useWeekStore` (data) and `useSettingsStore` (settings, persisted to localStorage)

### 4.2 Issues

#### 🟡 Warning — `BrowserRouter` is Inside Auth Gate
The `BrowserRouter` is instantiated inside `AppRouter`, which is already conditionally rendered after auth check. This means unauthenticated users get no router at all. If you add any public routes (e.g., a landing page, password reset callback), this structure won't support them without significant refactoring.

**Fix:** Hoist `BrowserRouter` to the top-level `App` component.

#### 🟡 Warning — Dashboard Uses `alert()` for Error Feedback
In `Dashboard.tsx` (line 39), AI errors are surfaced with a native `alert()` call. This is a poor UX pattern — it blocks the thread, looks unprofessional, and can't be styled.

#### 🟡 Warning — Challenge Progress Slider Is Missing
The `challenge_progress` field exists in the DB and is displayed in the UI as a percentage bar, but there is no input that lets the user actually update the progress value. The user can only mark it as "done/not done" as a binary toggle (`toggleChallengeComplete`). The progress percentage is never incremented by any UI action.

#### 🟡 Warning — No Error Boundary
There is no React Error Boundary anywhere in the component tree. If a deep render throws (e.g., on a null week state edge case), the whole app goes white with no recovery UI.

#### 🔵 Info — Week Title is Hardcoded Fallback
In `buildWeekData()`, the week title defaults to `'The Digital Obsidian'` if no title is set. There is no `title` column in the `weeks` DB schema, meaning this string is always shown. Either add a `title` column or remove the dead code.

#### 🔵 Info — Friday is Hardcoded as Rest Day
`isRestDay: day === 'friday'` is hardcoded in the store. Users with different work weeks have no way to configure this. A `rest_days` field in `user_settings` would make this user-configurable.

#### 🔵 Info — No Loading / Error State for Brain Dump Submission
`BrainDumpInput.tsx` has a submit path but no visible loading indicator or error feedback if the DB write fails. Users don't know if their thought was saved.

#### 🔵 Info — `Roadmap` is Placeholder Code in Production
`RoadmapPlaceholder` is a production JSX component that's in the router and linked in the sidebar. It renders a "Coming Soon" message. This should either be built or removed from navigation entirely.

---

## 5. Security Summary

| Issue | Severity | Type |
|---|---|---|
| Hardcoded Supabase anon key in source | 🔴 High | AI-Fixable |
| AI API keys stored as plain text in DB | 🔴 High | Manual (needs encryption design) |
| Leaked password protection disabled | 🟡 Medium | Manual (Supabase dashboard toggle) |
| `exportWeeklyReport()` includes AI keys | 🟡 Medium | AI-Fixable |
| No HTTP security headers (CSP, HSTS) | 🔵 Low | AI-Fixable (vercel.json) |

---

## 6. Recommended Changes

### 🤖 AI-Automatable Fixes

| # | Fix | Files |
|---|---|---|
| 1 | Move Supabase URL & anon key to `VITE_*` env vars | `src/lib/supabase.ts`, `.env` |
| 2 | Fix all RLS policies to use `(select auth.uid())` pattern | DB migration |
| 3 | Add index on `tasks.week_id` | DB migration |
| 4 | Change `weeks.activities` column from `text` to `jsonb` | DB migration |
| 5 | Remove `as any` casts in `useSettingsStore.ts`, use generated types | `src/store/useSettingsStore.ts` |
| 6 | Add optimistic update rollback on mutation failures | `src/store/useWeekStore.ts` |
| 7 | Replace `alert()` in Dashboard with toast/inline error | `src/pages/Dashboard.tsx` |
| 8 | Hoist `BrowserRouter` to `App.tsx` top level | `src/App.tsx` |
| 9 | Add a global `ErrorBoundary` component | New component + `src/App.tsx` |
| 10 | Strip AI keys from `exportWeeklyReport()` output | `src/store/useSettingsStore.ts` |
| 11 | Add security headers (CSP, X-Frame-Options) | `vercel.json` |

### 🧑‍💻 Manual Developer Intervention Required

| # | Fix | Why Manual |
|---|---|---|
| 1 | **Encrypt AI keys at rest** | Requires deciding on an encryption strategy (e.g., Supabase Vault, server-side encryption via Edge Function). Product/security decision. |
| 2 | **Enable leaked password protection** | Toggle in Supabase Dashboard → Auth → Password Security settings. |
| 3 | **Split `useWeekStore.ts` into domain slices** | Large refactor — `useBrainDumpStore`, `useEvaluationStore`, `useChallengeStore`. Risk of regressions. |
| 4 | **Design and implement the `daily_logs` feature** | Table exists but is dead. Decide if the feature should be built or the table dropped. |
| 5 | **Make rest days user-configurable** | Requires UX design for a settings field and DB column addition to `user_settings`. |
| 6 | **Build or remove the Roadmap page** | Product decision on scope. |
| 7 | **Implement challenge progress increment UI** | Needs UX design (slider, +/- stepper, etc.) and a new store action. |
| 8 | **Fix week number calculation** | Replace custom logic with a tested ISO week utility (e.g. `date-fns/getISOWeek`). |

---

## 7. Tooling & Best Practices Recommendations

| Tool / Practice | Reason |
|---|---|
| **`date-fns`** | Replace the fragile custom week calculation with a battle-tested library |
| **`react-hot-toast` or `sonner`** | Replace `alert()` calls with a non-blocking toast notification system |
| **`react-error-boundary`** | Drop-in package for adding Error Boundaries with fallback UI |
| **Supabase Vault** | For encrypting user-supplied AI API keys at rest |
| **`@supabase/supabase-js` v2 typed client** | Remove all `as any` casts by properly using the generated `Database` type from `database.types.ts` |
| **Vitest + React Testing Library** | No test suite exists. Add at minimum unit tests for the store helper functions (`buildWeekData`, `processTasksForDay`, week number calc) |
| **ESLint `no-console` rule** | The codebase uses `console.error` and `console.warn` extensively for error handling. These should go to a real logger or error tracking (e.g. Sentry). |
