# WeeklyOS

WeeklyOS is a personal weekly operating system for planning tasks, tracking focused work, managing habits, capturing brain-dump items, and reflecting on weekly progress. The app is built as a client-side React PWA backed by Supabase.

## Tech Stack

- React 18, TypeScript, Vite
- React Router
- Tailwind CSS
- Zustand for client state
- Supabase Auth, Postgres, Storage/API access, and Edge Functions
- Vite PWA / Workbox
- Framer Motion and Lucide React for UI motion/icons

## Getting Started

Use Node.js `>=20 <25`.

```bash
npm install
npm run dev
```

The dev server defaults to `http://localhost:5173`.

## Scripts

```bash
npm run dev        # Start Vite locally
npm run build      # Build production assets
npm run preview    # Preview the production build
npm run lint       # ESLint with zero-warning policy
npm run typecheck  # TypeScript type checking
```

There is no test script configured yet.

## Environment Variables

Copy `.env.example` to `.env.local` for local development. Do not commit real secrets.

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
# Optional legacy/current alias supported by the app:
VITE_SUPABASE_PUBLISHABLE_KEY=
# Optional analytics:
VITE_CLARITY_PROJECT_ID=
```

The frontend must only use Supabase publishable/anon keys. Never expose a Supabase service-role key in `VITE_*` variables.

## Project Structure

```text
src/
  app/          App shell, auth provider/context, authenticated router, loading/PWA UI
  components/   Shared UI, layout, focus, effects, and feature-specific components
  hooks/        Reusable React hooks
  lib/          Supabase client, generated database types, shared helpers
  pages/        Route-level screens
  services/     Supabase data-access modules
  store/        Zustand stores and store-local helpers
  utils/        Shared pure utilities
  workers/      Web workers bundled by Vite
supabase/
  functions/    Supabase Edge Functions
  migrations/   Database migrations
public/
  Static PWA assets and images
```

## Development Notes

- Keep route-level pages lazy-loaded unless a route is needed for first paint.
- Prefer service modules in `src/services` for Supabase table access instead of raw queries scattered through components.
- Keep global listeners registered from app/layout boot paths, not inside frequently called data-loading functions.
- Run `npm run lint`, `npm run typecheck`, and `npm run build` before shipping.
- Supabase schema or RLS changes should be made through migrations in `supabase/migrations`.
