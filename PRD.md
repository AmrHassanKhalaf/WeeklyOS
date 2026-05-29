# WeeklyOS PRD / Product Description

Status: Draft  
Last updated: 2026-05-29  
Product: WeeklyOS  
Type: Personal productivity PWA

## 1. Product Summary

WeeklyOS is a personal weekly operating system for planning tasks, tracking focused work, managing habits, capturing unstructured thoughts, and reflecting on progress. The product helps an individual turn a messy week into a clear plan using a 1-3-5 task structure, then supports daily execution through focus sessions, progress tracking, habit accountability, AI assistance, and weekly evaluation.

The current app is a React, TypeScript, Vite PWA backed by Supabase Auth, Postgres, Edge Functions, and client-side state stores. It is designed as a private, authenticated workspace for one user's productivity data.

## 2. Problem Statement

People often plan reactively: tasks live in scattered notes, daily focus depends on mood, recurring responsibilities are remembered manually, and weekly review is skipped because the data is hard to assemble. WeeklyOS solves this by giving the user one place to capture, organize, execute, and review their week.

## 3. Target Users

- Solo builders, students, freelancers, and operators who plan in weekly cycles.
- Users who want a lightweight productivity system without managing multiple separate tools.
- Users who benefit from structured planning, focus timers, habits, and AI-assisted reflection.
- Users who want their workspace to adapt to local schedule preferences such as timezone, week start day, and rest days.

## 4. Product Goals

- Help users capture unstructured thoughts quickly and convert them into actionable weekly tasks.
- Support a weekly planning rhythm using daily task limits: 1 high-priority task, 3 medium tasks, and 5 small tasks per day.
- Make focused execution easier with a dedicated focused-day view and pomodoro-style timer.
- Track task completion, focus time, challenge progress, and habits over time.
- Provide context-aware AI assistance for planning, analysis, reflection, and workspace chat.
- Preserve user privacy through authenticated access, owner-scoped data, and careful handling of API keys and AI requests.

## 5. Non-Goals

- Team collaboration, shared workspaces, comments, or assignments.
- Project management features such as Kanban boards, dependencies, sprints, and external integrations.
- A public social productivity feed.
- Full calendar synchronization in the first release.
- Enterprise administration or role-based access beyond a single authenticated user.

## 6. Core User Journey

1. The user signs in with email/password or Google OAuth.
2. The app loads the current week based on the user's timezone and configured week start day.
3. The user captures loose thoughts in Brain Dump.
4. The user sends selected brain-dump items to Weekly Distribution and assigns day, priority, tags, and estimates.
5. The user executes the plan in Focused Day, choosing a task and running focus or break sessions.
6. The user updates progress from task cards, day cards, and challenge controls.
7. The user tracks build habits and break habits throughout the month.
8. At the end of the week, the user reviews metrics and writes or AI-generates evaluation notes.
9. The user exports a weekly report or starts planning the next week.

## 7. Key Features

### Authentication

- Users can sign up and sign in with email and password.
- Users can continue with Google OAuth.
- Authenticated users are routed into the main app; unauthenticated users see the sign-in flow.
- The app must not expose private service-role credentials in browser-accessible environment variables.

### Dashboard

- Show the current week number, title, date range, weekly score, and completed vs planned task count.
- Show all day plans for the selected week.
- Support weekly challenge creation, editing, daily status tracking, and completion state.
- Generate a short AI challenge from pending tasks.
- Generate a short AI productivity insight from current week data.
- Allow clearing all task and note data for the active week after confirmation.

### Brain Dump

- Provide a large freeform capture area for unstructured thoughts and tasks.
- Convert each line of captured text into a stored brain-dump item.
- Support quick-add, edit, delete, selection, and bulk tagging.
- Let users send selected or all brain-dump items to weekly distribution.

### Weekly Distribution

- Display one card per day in the active week.
- Let users assign brain-dump items to a day and priority.
- Enforce 1 high-priority, 3 medium-priority, and 5 low-priority tasks per day.
- Support tags, estimated time, and rest-day awareness.
- Provide AI auto-distribution that returns strict JSON and avoids configured rest days.
- Remove successfully assigned brain-dump items from the unprocessed list.

### Focused Day

- Show the current day's high, medium, and low-priority tasks grouped as Main Objective, Supporting Tasks, and Quick Wins.
- Let users choose an active task or start a focus session without a task.
- Support preset and custom focus/break durations.
- Track elapsed focus time, break time, and focus session history.
- Save focus session records and update task actual duration.
- Provide a distraction-reduced focus overlay.
- Let users mark the entire day complete.

### Weekly Evaluation

- Display weekly score, completed task count, planned task count, and daily completed vs planned chart.
- Provide reflection fields for what went well, where the user struggled, and lessons learned.
- Auto-save reflection fields.
- AI-generate short reflection text from current week data.

### Habit Tracker

- Support build habits and break habits.
- Group habits by morning, anytime, and evening.
- Track monthly and weekly views.
- Record completions per day.
- Calculate completion rates, current streaks, longest streaks, perfect days, clean rates for break habits, best habits, and habits needing attention.
- Allow adding, editing, disabling, and reordering habits.

### AI Workspace

- Provide an overlay command center with modes for Analyze, Plan, Reflect, and Chat.
- Build AI context from live weekly data including score, completion, pending tasks, focus sessions, risk days, and continuity signals.
- Stage prompts for reviewed user submission rather than silently changing data.
- Support tool-backed workflows where appropriate.
- Return structured UI blocks for planning, reflection, and brain-dump outputs when available.

### Settings

- Configure AI provider, active model, fallback behavior, and provider API keys.
- Configure timezone, week start day, and rest days.
- Configure theme: dark, light, or system.
- Configure notification preferences.
- Configure pinned tasks that repeat weekly until disabled, deleted, or expired.
- Configure weekly report included days and closing quote.
- Export the current or previous weekly report.
- Toggle analytics tracking.
- Install the app as a PWA when supported by the browser.

## 8. Data Model Overview

Primary persisted entities:

- `weeks`: weekly summary, score, challenge, reflections, activities, daily notes, and week metadata.
- `tasks`: scheduled tasks with priority, status, day, estimates, actual duration, tags, and optional pinned-task source.
- `brain_dump_items`: unprocessed captured items and tags.
- `focus_sessions`: focus and break session records.
- `habits`: active habit definitions by month, category, group, color, and sort order.
- `habit_completions`: per-day habit completions or break-habit slips.
- `pinned_tasks`: recurring task templates materialized into weekly tasks.
- `user_settings`: schedule, theme, notification, privacy, and report preferences.
- `ai_settings`: default AI provider, active model, and fallback setting.
- `ai_keys`: user-provided provider API keys.
- `user_feedback`: authenticated feedback records.

All user-owned data should be scoped by `user_id` and protected with Supabase Row Level Security policies.

## 9. AI Requirements

- AI calls must require an authenticated Supabase session.
- The frontend sends requests to the Supabase `ai-handler` Edge Function.
- The Edge Function validates the JWT and loads the user's provider settings and API key from Supabase.
- Supported providers in the current UI are Google Gemini and xAI Grok, though the current Edge Function implementation uses Gemini-compatible generation.
- Schedule generation must return strict JSON with a `tasks` array.
- Workspace requests may include structured messages and optional function declarations.
- AI responses should be grounded in the provided WeeklyOS context and should avoid generic productivity advice when concrete data is available.

## 10. Privacy, Security, and Reliability Requirements

- Only authenticated users can access the app shell.
- Public frontend code may use only Supabase publishable or anon keys.
- Supabase service-role keys must never be exposed in `VITE_*` variables.
- Tables in exposed schemas should have RLS enabled and owner-scoped policies.
- AI provider keys should never appear in exports, reports, logs, or client-generated report files.
- Mutations should use optimistic UI updates with rollback or reload on failure where possible.
- The app should remain usable during brief connectivity issues where offline queue support exists.
- Edge Function failures should produce user-facing error messages that are clear and non-destructive.

## 11. User Experience Requirements

- The first screen after sign-in is the user's actual workspace, not marketing content.
- Primary navigation must work on desktop through the sidebar and on mobile through bottom navigation.
- Task-heavy screens should prioritize scanning, quick action, and low friction.
- Empty states should explain what the user can do next without requiring documentation.
- Loading states should use skeletons or clear progress indicators.
- Destructive actions such as clearing week data should require confirmation.
- The app should support dark, light, and system appearance modes.

## 12. Technical Architecture

- Frontend: React 18, TypeScript, Vite, React Router, Tailwind CSS, Framer Motion, Lucide React.
- State: Zustand stores with persisted settings and feature-specific stores for week, habits, brain dump, pinned tasks, and layout.
- Backend: Supabase Auth, Postgres, RLS policies, Edge Functions, and generated database types.
- PWA: Vite PWA and Workbox for installability and offline-oriented behavior.
- Deployment: Vercel configuration is present.

## 13. Success Metrics

- Activation: percentage of new users who create at least one brain-dump item and one scheduled task.
- Planning completion: percentage of users who schedule tasks across at least three days in a week.
- Focus usage: number of focus sessions saved per active user per week.
- Habit engagement: number of habit completions or break-habit clean days tracked per active user.
- Reflection completion: percentage of users who complete at least one weekly evaluation field.
- Retention: weekly active users returning for a second planning cycle.
- Reliability: AI request success rate and average time to response.

## 14. MVP Scope

The MVP should include:

- Authentication.
- Current-week creation and navigation.
- Brain dump capture and assignment to weekly plan.
- Task CRUD with 1-3-5 daily limits.
- Focused-day timer and focus session persistence.
- Weekly evaluation fields and basic completion chart.
- Habit tracker with monthly and weekly views.
- Settings for schedule, theme, AI provider, and reports.
- AI challenge, insight, schedule distribution, reflection, and workspace chat.
- PWA install support.

## 15. Future Opportunities

- Calendar import and export.
- Notification delivery for reminders and summaries.
- Richer weekly analytics across multiple weeks.
- Smart rollover of incomplete tasks.
- Recurring non-task routines beyond pinned tasks.
- Full provider abstraction for non-Gemini AI APIs.
- Voice capture transcription into Brain Dump and AI Workspace.
- Local-first sync improvements and conflict resolution UI.

## 16. Open Questions

- Should WeeklyOS support multiple workspaces, such as personal, school, and client work?
- Should AI provider keys remain user-supplied, or should the product offer managed AI usage?
- Should reports export as PDF directly instead of opening generated HTML for printing?
- How should the product handle incomplete tasks at week rollover?
- What level of offline editing should be guaranteed beyond queued mutations?
- Should habits be monthly snapshots, continuous habits, or both?
