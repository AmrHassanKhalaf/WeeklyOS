# WeeklyOS — Fix Implementation Plan

## Goal
Apply all 11 AI-automatable fixes identified in the review, clearly documenting what is changed and why.

---

## Group A — Database Migrations

### A1. Fix RLS `auth.uid()` Re-evaluation (WARN × 30 policies)

**Problem:** Every RLS policy across all tables calls `auth.uid()` bare, causing Postgres to re-evaluate it per row instead of once per query.

**Fix:** Run a migration that drops and recreates all policies using the `(select auth.uid())` pattern.

**Tables affected:** `weeks`, `tasks`, `brain_dump`, `daily_logs`, `user_settings`, `ai_settings`, `ai_keys`

---

### A2. Add Covering Index on `tasks.week_id`

**Problem:** No covering index exists on `tasks.week_id` despite it being the primary filter on the most common query (`SELECT * FROM tasks WHERE week_id = ?`).

**Fix:** `CREATE INDEX IF NOT EXISTS tasks_week_id_idx ON public.tasks (week_id);`

---

### A3. Migrate `weeks.activities` from `text` → `jsonb`

**Problem:** The `activities` column stores JSON as a raw text string, preventing Postgres from indexing or querying into it.

**Fix:** `ALTER TABLE public.weeks ALTER COLUMN activities TYPE jsonb USING activities::jsonb;`

**Also update:** `database.types.ts` to change `activities: string | null` → `activities: Json | null` so TypeScript stays in sync.

---

## Group B — Environment Variables & Security Headers

### B1. Remove Hardcoded Supabase Credentials from `supabase.ts`

**Problem:** `SUPABASE_URL` and `SUPABASE_ANON_KEY` are hardcoded string literals — they get bundled into the public JS. The env vars already live in `.env`, they just aren't being used in the client initialization.

**Fix:** Replace the literals with `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`.

#### [MODIFY] [supabase.ts](file:///e:/My%20Codes/Projects/WeeklyOS/src/lib/supabase.ts)
---

### B2. Add Security Headers to `vercel.json`

**Problem:** No HTTP security headers are set. The app is missing `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and a basic CSP.

**Fix:** Add a `headers` array to `vercel.json`.

#### [MODIFY] [vercel.json](file:///e:/My%20Codes/Projects/WeeklyOS/vercel.json)

---

## Group C — Frontend Code Fixes

### C1. Remove `as any` Casts in `useSettingsStore.ts`

**Problem:** Every Supabase call uses `supabase.from('table' as any)` defeating the generated TypeScript types.

**Fix:** Remove the `as any` casts — the typed client (`createClient<Database>`) already knows these tables.

#### [MODIFY] [useSettingsStore.ts](file:///e:/My%20Codes/Projects/WeeklyOS/src/store/useSettingsStore.ts)

---

### C2. Add Optimistic Update Rollback in `useWeekStore.ts`

**Problem:** `toggleTaskComplete`, `createTask`, `updateTask`, `deleteTask`, and `deleteDayData` all optimistically update UI state but never revert if the DB write fails.

**Fix:** Snapshot state before mutation; on error, revert to snapshot and surface an error.

#### [MODIFY] [useWeekStore.ts](file:///e:/My%20Codes/Projects/WeeklyOS/src/store/useWeekStore.ts)

---

### C3. Replace `alert()` with Inline Error UI in `Dashboard.tsx`

**Problem:** `alert(e.message)` is used for AI error feedback. This blocks the thread and looks unprofessional.

**Fix:** Add a local `errorMessage` state and render it as an inline dismissible error banner. No library needed.

#### [MODIFY] [Dashboard.tsx](file:///e:/My%20Codes/Projects/WeeklyOS/src/pages/Dashboard.tsx)

---

### C4. Hoist `BrowserRouter` to `App.tsx`

**Problem:** `BrowserRouter` is placed inside `AppRouter`, which is only rendered after auth. This makes it impossible to add any public routes (e.g., auth/callback, password reset).

**Fix:** Move `<BrowserRouter>` to the top of `App.tsx` so it wraps `AuthProvider`.

#### [MODIFY] [App.tsx](file:///e:/My%20Codes/Projects/WeeklyOS/src/App.tsx)

---

### C5. Add Global `ErrorBoundary` Component

**Problem:** No React Error Boundary exists. Any uncaught render error shows a blank white screen.

**Fix:** Create `src/components/ErrorBoundary.tsx` as a class component with a fallback UI, then add it to `App.tsx`.

#### [NEW] [ErrorBoundary.tsx](file:///e:/My%20Codes/Projects/WeeklyOS/src/components/ErrorBoundary.tsx)
#### [MODIFY] [App.tsx](file:///e:/My%20Codes/Projects/WeeklyOS/src/App.tsx)

---

### C6. Strip AI Keys from `exportWeeklyReport()`

**Problem:** `exportWeeklyReport()` serializes the entire settings store including `aiKeys`. A downloaded JSON file could expose the user's Gemini/Grok API keys.

**Fix:** Destructure and omit `aiKeys` before serializing.

#### [MODIFY] [useSettingsStore.ts](file:///e:/My%20Codes/Projects/WeeklyOS/src/store/useSettingsStore.ts)

---

### C7. Fix Week Number Calculation with `date-fns`

**Problem:** `getCurrentWeekInfo()` uses a fragile manual calculation that doesn't handle year-boundary edge cases correctly.

**Fix:** Install `date-fns` and use `getISOWeek` + `getISOWeekYear`. Since the app uses a Saturday-anchored week, keep the Saturday start logic in `getWeekStartDate` but fix the week-number source.

#### [MODIFY] [useWeekStore.ts](file:///e:/My%20Codes/Projects/WeeklyOS/src/store/useWeekStore.ts)

---

## Verification Plan

### Automated — TypeScript Compilation
Run `npx tsc --noEmit` to confirm no TypeScript errors after removing `as any` casts and updating types.

```
cd "e:\My Codes\Projects\WeeklyOS"
npx tsc --noEmit
```

### Automated — Dev Server Smoke Test
Run `npm run dev` and confirm the app loads without console errors.

```
cd "e:\My Codes\Projects\WeeklyOS"
npm run dev
```

### Manual — Verify Optimistic Rollback
1. Open dashboard, open browser DevTools → Network tab
2. Block requests to Supabase (right-click → Block request URL)
3. Try to toggle a task complete
4. Confirm the task visually reverts after the blocked request fails

### Manual — Verify Error Boundary
1. Temporarily throw in `Dashboard.tsx` render: `throw new Error('test')`
2. Confirm the styled fallback UI renders instead of a blank white screen
3. Remove the test throw

### Manual — Verify No Hardcoded Keys in Bundle
1. Run `npm run build`
2. Open `dist/assets/*.js` and search for `vdbscudaljbxqcndwovp` — the Supabase project ref
3. The anon key JWT string should NOT appear in the bundle (env vars are inlined by Vite at build time, but the key will still be in the bundle — this confirms it reads from `.env` rather than being a stale hardcoded string, and that the key in `.env` is the one used)

### Manual — Verify Security Headers on Vercel
After deploying: `curl -I https://your-vercel-url.vercel.app` — confirm `x-frame-options: DENY` and `x-content-type-options: nosniff` are present.
