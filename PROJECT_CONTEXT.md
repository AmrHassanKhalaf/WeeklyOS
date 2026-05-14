# WeeklyOS - Project Handoff & Technical Context

This document serves as the master architectural and technical context file for WeeklyOS. It is intended for senior engineers and AI agents who will maintain, improve, or scale the application. 

---

## 1. Project Overview

* **Project Name**: WeeklyOS
* **Purpose and vision**: A lively, emotionally engaging daily companion application designed to help users plan their weeks, track habits, reflect on progress, and focus deeply on daily tasks. It functions as a complete "operating system" for personal productivity, powered by AI to provide insights and schedule optimization.
* **Target Users**: Professionals, students, and productivity enthusiasts who need a unified system for task management, habit building, and AI-assisted scheduling.
* **Current Development Stage**: Production-Ready (v1.0). Core features, database schemas, edge functions, and UI animations are fully implemented and verified with 245 passing tests.
* **Main Features**:
  * Dashboard & Weekly Planning
  * Task Distribution & Brain Dump
  * Habit Tracking with streaks and celebrations
  * Pomodoro Timer (Focused Day)
  * AI Assistant (Challenge generation, reflections, scheduling)
  * Real-time Sync & Offline capability (localStorage + Supabase)
* **Planned Future Features**: Advanced analytics, team/social sharing, push notifications, offline-first PWA architecture.

---

## 2. Tech Stack

* **Framework**: React 18, Vite (for fast builds and optimized bundling).
* **Languages**: TypeScript (Strict mode enabled, no `any` allowed).
* **State Management**: Zustand (with Persist middleware for localStorage hydration and Real-time sync mechanisms).
* **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Row Level Security).
* **Database**: PostgreSQL (Managed via Supabase).
* **Authentication**: Supabase Auth (JWT based).
* **APIs**: 
  * Gemini API (`@google/generative-ai`) routed securely via Supabase Edge Functions (`ai-handler`).
* **Packages/Libraries**:
  * `framer-motion`: For advanced page transitions, spring physics, and micro-interactions.
  * `lucide-react` / Material Symbols: Icons.
  * `date-fns`: Date manipulation and formatting.
  * `html2canvas` & `jspdf`: For exporting weekly reports to PDF.
  * `vitest`: Testing framework.
  * `tailwindcss` & `autoprefixer`: Styling.
* **Deployment**: Configured for Vercel (indicated by `vercel.json`), with standard build scripts (`npm run build`).

---

## 3. Architecture

* **Folder Structure**: Feature-grouped inside `src/`. Clean separation of UI (`components/ui`), layouts (`components/layout`), state (`store/`), API (`lib/`), and business logic.
* **Feature-based Structure**: Components are grouped by feature domain (e.g., `habittracker`, `ai`, `effects`).
* **Clean Architecture Layers**:
  * **Data Layer**: Supabase DB + RLS.
  * **Service Layer**: `lib/supabase.ts`, `lib/dbQuery.ts` for database interactions. Edge functions handle AI logic.
  * **State Layer**: Zustand stores (`useWeekStore`, `useHabitStore`, etc.) hold application state and subscribe to Supabase Realtime channels.
  * **Presentation Layer**: React components (`pages/`, `components/`) consume Zustand stores.
* **Data Flow**: 
  1. Component triggers Store action (e.g., `createTask`).
  2. Store sends an optimistic UI update, then hits Supabase API.
  3. Supabase applies RLS, processes the query, and broadcasts changes via Realtime Subscriptions.
  4. Store receives real-time update and reconciles state.
* **Navigation Flow**: Standard client-side routing via React Router DOM (`<AppLayout>` wraps `<PageTransition>`).
* **Dependency Injection**: Hooks (`useApi`, `useAuth`) act as bridges between the presentation layer and external services.
* **Theme System**: Custom Tailwind config extending Material 3 colors, glassmorphism, and dynamic tokens (`var(--accent-primary)`). Fully supports dark/light/system modes via `<ThemeToggle>`.

---

## 4. Current Features Status

* **Dashboard**: ✅ Completed (Optimized with Shimmer Skeletons, Staggered entries)
* **Weekly Distribution**: ✅ Completed (Drag & drop/click to assign tasks)
* **Focused Day**: ✅ Completed (Pomodoro worker runs accurately)
* **Brain Dump**: ✅ Completed (Captures ideas instantly)
* **Habit Tracker**: ✅ Completed (Includes confetti bursts, streak counts)
* **Weekly Evaluation**: ✅ Completed (Export to PDF works)
* **AI Chat/Assistant**: ✅ Completed (Integrated with Gemini via Edge Function)
* **Settings & Sync**: ✅ Completed (Real-time and local storage sync)

*Note: All current features are 100% functional with zero known breaking bugs as per the final testing report.*

---

## 5. UI/UX System

* **Design Philosophy**: "Lively Calm" - The app must feel alive (animations, glassmorphism) but remain calm and focused. 
* **Color System**: Highly customized Tailwind setup (`index.css`) with CSS variables (`--accent-primary`, etc.). Soft blues, greens, and ambers.
* **Typography**: Clean sans-serif (Inter/Roboto) relying on Tailwind utility classes.
* **Components System**: Reusable primitives in `src/components/ui/` (e.g., `Button`, `Skeleton`, `Confetti`, `Ripple`, `FloatingActionButton`).
* **Animations**: Powered by `framer-motion`. Includes micro-interactions (ripples, shakes on error, confetti on success, glowing rings for AI buttons).
* **Responsive Behavior**: Adaptive Sidebar (Expanded/Rail/Hidden). Mobile uses a floating bottom glass nav (`MobileBottomNav`) with safe-area insets.
* **Accessibility**: Fully respects `prefers-reduced-motion` (animations fall back cleanly), uses focus rings, ARIA labels, and logical tab orders.

---

## 6. Important Files

* **`src/store/useWeekStore.ts`**: The core brain of task and week management. Handles DB interactions, real-time subscriptions, and local state sync.
* **`src/lib/supabase.ts`**: Supabase client initialization and core config.
* **`supabase/functions/ai-handler/index.ts`** (Assumed based on architecture): The Edge Function handling all Gemini API logic securely without exposing keys to the client.
* **`src/components/layout/AppLayout.tsx`**: Manages the adaptive sidebar, mobile bottom navigation, and page transition wrappers.
* **`src/index.css`**: The source of truth for the entire design system (colors, glow effects, custom keyframes).

---

## 7. Backend & Database

* **API Structure**: Edge Functions handle AI and complex back-end operations. Direct REST access for CRUD via Supabase JS Client.
* **Models / Tables**:
  * `weeks`: Weekly planning metadata.
  * `tasks`: Tasks tied to weeks/days.
  * `brain_dump`: Unsorted tasks and thoughts.
  * `pinned_tasks`: Recurring/Important tasks.
  * `user_settings`: Preferences and UI settings.
  * `ai_settings` & `ai_keys`: Management of AI contexts and provider keys.
* **Sync Logic**: Zustand stores update locally and dispatch to Supabase. Supabase Realtime channels listen for changes and merge updates back.
* **Authentication**: Supabase Auth (Email/Password or OAuth). JWT is used for securing API requests and Edge Functions.
* **Security Considerations**: Strict Row Level Security (RLS) policies on all 7 tables enforcing `auth.uid() = user_id`. Edge functions validate JWTs before calling external AI APIs.

---

## 8. State Management

* **State Architecture**: Decentralized feature stores using Zustand.
* **Global States**: `useLayoutStore` (Sidebar mode, Mobile detection).
* **Feature States**: `useWeekStore`, `useHabitStore`, `useBrainDumpStore`, `usePinnedTaskStore`, `useSettingsStore`.
* **Providers**: `AuthContext` provides user session details throughout the component tree.
* **Existing Problems**: Zustand `persist` middleware can cause edge-case hydration mismatches if local schema drifts from DB schema. It requires careful `version` bumping in persist config if the data shape changes.

---

## 9. Performance Notes

* **Current Bottlenecks**: High dependence on real-time WebSockets. If the user creates many tasks rapidly, the optimistic update + Realtime broadcast loop could cause slight UI jank or race conditions if not debounced.
* **Expensive Rebuilds**: Large component trees inside `Dashboard.tsx` can re-render if global state updates too broadly. Selectors in Zustand must be strictly scoped.
* **Memory Issues**: Real-time subscriptions *must* be cleared on unmount. The current implementation does this, but new engineers must remain vigilant. Confetti and Ripple animations are GPU-accelerated but can cause dropped frames on very low-end mobile devices (mitigated by reduced-motion settings).

---

## 10. Known Bugs

* *The application currently reports a 100% test pass rate with no critical bugs.*
* **Minor Technical Debt/Risks (Severity: Low)**:
  * Potential Edge Function cold starts: Initial AI queries might take > 2 seconds.
  * Offline Mode Limitations: Zustand persist helps, but without an active Service Worker / PWA setup, creating tasks offline will fail the Supabase DB insert and won't sync when reconnected unless custom retry queues are implemented.

---

## 11. Refactor Opportunities

* **Tight Coupling**: UI components sometimes directly call Supabase `from('table')` instead of routing exclusively through Store actions or a dedicated Repository pattern layer.
* **Technical Debt**: Managing optimistic UI updates manually in Zustand is error-prone. Migrating from Zustand + Supabase to a more robust data-fetching layer like React Query or SWR could eliminate custom real-time reconciliation logic.
* **Duplicate Logic**: Handling loading/error states across multiple stores is slightly repetitive. A shared factory for async store slices would be cleaner.

---

## 12. Setup Instructions

1. **Prerequisites**: Node.js v24.x (as per package.json engines). Supabase CLI (optional for local DB).
2. **Install dependencies**: `npm install`
3. **Environment Setup**: Copy `.env.example` to `.env.local`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. **Running Locally**: `npm run dev`
5. **Testing**: `npm test` or `npm run test:watch` (Vitest).
6. **Build for Prod**: `npm run build`
7. **Deployment**: Connect the GitHub repo to Vercel. Ensure Vercel environment variables mirror `.env.local`. Vercel will automatically build using `npm run build` and output to the `dist/` folder.

---

## 13. AI Development Notes

**CRITICAL GUIDELINES FOR FUTURE AI AGENTS**:
* **Architecture Pattern**: Use the existing UI primitives (`src/components/ui`). Do not install new UI libraries (like Material UI or Chakra) or write custom CSS unless absolutely necessary. Rely on Tailwind.
* **Animations**: All animations MUST respect `prefers-reduced-motion`. Do not use `animate-pulse`; use `<Skeleton>` instead. Use `framer-motion` for complex state transitions.
* **State**: Do not use React Context for rapidly changing data. Use Zustand stores with strict selectors (`const activeWeek = useWeekStore(state => state.activeWeek)`).
* **Never Change**: Do not bypass Row Level Security (RLS) under any circumstances. Do not expose `service_role` keys in the frontend.
* **Dangerous Areas**: `useWeekStore` real-time subscription logic. Modifying this without understanding the hydration cycle will break syncing.
* **Naming Conventions**: PascalCase for React components, camelCase for functions and hooks. Suffix stores with `Store` (e.g., `useHabitStore`).
* **Next Priority**: Implement a proper offline sync queue.

---

## 14. Future Roadmap

* **v1.1 Goals**: PWA Support (Service Workers for offline caching), Push Notifications for Habit reminders.
* **v2.0 Goals**: Social features (Share week summary with accountability partners), Advanced AI scheduling (Calendar integration via Google/Outlook APIs).
* **Scaling Ideas**: Migrate database queries from client-side RPCs to a GraphQL layer (pg_graphql) if relational complexity grows.
* **Monetization**: Premium AI tokens. The current `ai_keys` table supports BYOK (Bring Your Own Key). A SaaS model could charge for a managed backend API key.
* **Production-Readiness Checklist**: 
  * [x] RLS Policies Enforced
  * [x] Error boundaries caught
  * [x] CI/CD Pipeline Configured
  * [ ] Performance audits (Lighthouse score > 95)
  * [ ] Service Worker Implementation

---

## 15. Screens & Flows

* **Authentication (`SignIn.tsx`)**: Email/Password login -> Redirects to Dashboard.
* **Dashboard (`Dashboard.tsx`)**: Central hub. Views current week, AI summary, and day cards.
* **Weekly Distribution (`WeeklyDistribution.tsx`)**: Drag-and-drop view to plan tasks across the week.
* **Focused Day (`FocusedDay.tsx`)**: Pomodoro timer and today's focused task list.
* **Habit Tracker (`HabitTracker.tsx`)**: Visual grid of habits, streak counters, and add/edit forms.
* **Brain Dump (`BrainDump.tsx`)**: Quick text input for capturing thoughts before categorization.
* **Weekly Evaluation (`WeeklyEvaluation.tsx`)**: End of week review, scoring, and PDF export.
* **Settings (`Settings.tsx`)**: UI preferences, AI provider settings, Account management.

---

## 16. Dependency Map

```text
[UI Layer (React/Tailwind)] ---> [State Layer (Zustand)]
        |                               |
        |                               v
[framer-motion]              [API Layer (useApi/Supabase JS)]
                                        |
                                        v
                            [Supabase Managed Backend]
                             /          |          \
                    [PostgreSQL] [Auth/RLS]  [Edge Functions (ai-handler)]
                                                        |
                                                        v
                                                 [Gemini API]
```

---

## 17. Final Project Evaluation

* **Code Quality**: High. Strong TypeScript usage, rigorous testing (245 unit/integration tests), and clear separation of concerns.
* **Scalability**: Medium-High. Supabase handles backend scaling effortlessly. However, the client-side Zustand real-time synchronization might become difficult to manage if the application state grows exponentially.
* **Maintainability**: High. Well-documented, strictly typed, and modular. Custom UI primitives make adding new features simple.
* **UI Quality**: Exceptional. The "Lively Design" enhancement provides a premium, native-feeling experience with glassmorphism, fluid physics, and contextual feedback.
* **Production Readiness**: Ready for deployment. Needs real-world user load testing to verify Edge Function limits and Supabase connection pooling behavior.

---

### Folder Tree

```text
E:\MY CODES\PROJECTS\WEEKLYOS\
|   .env.local
|   index.html
|   package.json
|   postcss.config.js
|   tailwind.config.js
|   vite.config.ts
|   vitest.config.ts
|   
+---public/
+---supabase/
|   +---functions/
|   \---migrations/
\---src/
    |   App.tsx
    |   index.css
    |   main.tsx
    |   
    +---components/
    |   +---ai/
    |   +---effects/
    |   +---habittracker/
    |   +---layout/
    |   \---ui/ (Button, Card, Confetti, Ripple, Skeleton, etc.)
    +---context/
    +---data/
    +---hooks/
    +---lib/ (supabase.ts, dbQuery.ts, generateWeeklyReportHTML.ts)
    +---pages/
    +---store/ (useWeekStore, useHabitStore, useSettingsStore, etc.)
    \---workers/ (pomodoroWorker.ts)
```

### All Used Dependencies with Purpose

**Production:**
* `@google/generative-ai`: Interacting with the Gemini API for smart task scheduling and reflections.
* `@supabase/supabase-js`: Backend communication, authentication, real-time WebSockets.
* `date-fns`: Lightweight date parsing and formatting.
* `framer-motion`: High-performance, physics-based UI animations and page transitions.
* `html2canvas` & `jspdf`: For taking DOM snapshots and converting the weekly evaluation into a downloadable PDF.
* `lucide-react`: Modern vector icons.
* `react` & `react-dom`: UI rendering engine.
* `react-router-dom`: SPA routing and navigation.
* `zustand`: Lightweight, scalable state management with persist capabilities.

**Development:**
* `typescript`, `@types/react`: Static typing.
* `vite`, `@vitejs/plugin-react`: Extremely fast build tooling and hot module replacement.
* `tailwindcss`, `autoprefixer`, `postcss`: Utility-first CSS styling engine.
* `vitest`, `jsdom`: Unit and component testing environment.
* `eslint`, various plugins: Code quality and linting.

### Suggested Immediate Next Tasks (Priority Order)

1. **Implement Service Worker / Offline Support (PWA)**: Crucial for a daily productivity app. Users must be able to view their tasks without a network connection. Implement a robust background sync queue for offline mutations.
2. **Refactor Zustand Real-time Sync**: Evaluate moving complex DB queries and optimistic UI updates to `React Query` (TanStack Query) to reduce boilerplate and improve caching behavior.
3. **Calendar Integration**: Add Google Calendar / Apple Calendar OAuth so scheduled tasks sync automatically to the user's native calendar.
4. **Push Notifications**: Use Web Push API to send habit reminders or Pomodoro timer completions natively to the device.
5. **E2E Testing**: Add Playwright or Cypress to cover critical user flows (e.g., login -> create task -> complete habit -> logout) in an actual browser environment.
