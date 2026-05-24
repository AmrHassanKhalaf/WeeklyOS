# WeeklyOS — Lively Design Enhancement

> **Goal:** Transform WeeklyOS into a lively, emotionally engaging daily companion
> that users genuinely want to open every day. Responsive navigation, modern
> animations, glassmorphism, celebrations, and fully reduced-motion-aware.

Implemented against the design brief in
`WeeklyOS Enhancement Prompt - Modern Animations & Lively Design.md`.

---

## Table of Contents

1. [TL;DR](#tldr)
2. [What's New at a Glance](#whats-new-at-a-glance)
3. [Design System Additions](#design-system-additions)
4. [New UI Primitives](#new-ui-primitives)
5. [Navigation Redesign](#navigation-redesign)
6. [Celebrations & Micro-interactions](#celebrations--micro-interactions)
7. [Polished Pages](#polished-pages)
8. [Accessibility](#accessibility)
9. [File Manifest](#file-manifest)
10. [Back-compat & Migration Notes](#back-compat--migration-notes)
11. [Verification](#verification)
12. [Usage Cookbook](#usage-cookbook)

---

## TL;DR

| Area                  | Before                                 | After                                                                                  |
| --------------------- | -------------------------------------- | -------------------------------------------------------------------------------------- |
| **Sidebar**           | 2 modes (open / hidden)                | **3 modes** (expanded 256 / rail 80 / hidden), persisted, glow + stats strip           |
| **Mobile nav**        | No dedicated bottom nav                | **Glass bottom nav** with 5 tabs, layoutId indicator, pending-task badge, ripple       |
| **Top nav**           | Static week nav                        | **Animated hamburger** (3 bars ↔ X), page-title crossfade, pulsing AI button           |
| **Buttons**           | Hover styles only                      | **Material ripple**, `loading` prop, `leftIcon` slot, `focus-ring`                     |
| **Loading states**    | `animate-pulse` blocks                 | **Shimmer Skeletons** that respect reduced-motion                                      |
| **Habit completion**  | Silent                                 | **Confetti burst** on positive actions, **shake** on negatives, animated streak counter |
| **Habit form**        | Instant appearance                     | **Staggered slide-in**, shake on error, green checkmark-pop on save                    |
| **Page transitions**  | None                                   | **Fade + slide** between routes (reduced-motion aware)                                 |
| **Sign-in**           | Flat                                   | **Floating ambient orbs**, glass panel scale-in, shake errors, loading Button          |
| **Theme toggle**      | Buried in settings                     | **One-click toggle** in sidebar with rotating icon (dark → light → system)             |
| **Loading screen**    | Pulsing icon                           | **Floating brand orb** with rotating ring + glow                                       |

---

## What's New at a Glance

### New reusable UI primitives (`src/components/ui/`)

- `Ripple.tsx` — `useRipple()` hook + `<RippleContainer />`
- `Confetti.tsx` — zero-dependency `<ConfettiBurst />`
- `Skeleton.tsx` — shimmer placeholder that replaces `animate-pulse`
- `FloatingActionButton.tsx` — mobile-aware FAB with safe-area insets
- `PageTransition.tsx` — route-level fade + slide wrapper
- `StatusDot.tsx` — pulsing online/away/offline/busy dot
- `ThemeToggle.tsx` — dark → light → system cycler with animated icon

### Upgraded primitives

- `Button.tsx` — now ships with **built-in ripple**, `loading` prop with spinner,
  `leftIcon` slot, `focus-ring`, and `noRipple` opt-out. Fully back-compat.

### New layout components

- `MobileBottomNav.tsx` — 5 tabs + "More" drawer, pending-task badge, layoutId
  active indicator, safe-area aware.

### Rewritten layout components

- `Sidebar.tsx` — rail/expanded/hidden modes, animated brand orb, avatar with
  pulsing status dot, weekly stats strip, embedded theme toggle, edge-cycle button.
- `TopNav.tsx` — animated hamburger icon, page-title crossfade, pulsing AI button,
  cleaner week navigator that adapts to rail-mode padding.
- `AppLayout.tsx` — adaptive left-padding, mobile overlay with backdrop blur,
  `PageTransition` wrapping, `pb-bottom-nav` auto-padding on mobile.

### Store changes

- `useLayoutStore.ts` — new `sidebarMode` state (`'expanded' | 'rail' | 'hidden'`),
  `cycleSidebarMode()`, persisted to localStorage via `zustand/middleware/persist`.

---

## Design System Additions

### Tokens added to `src/index.css`

#### Lively accent palette

```css
--accent-primary: 184 195 255;   /* Soft blue  */
--accent-success: 74 222 128;    /* Soft green */
--accent-danger:  248 113 113;   /* Soft red   */
--accent-warning: 251 191 36;    /* Amber      */
--accent-info:    96 165 250;    /* Blue       */
```

#### Glow effects

```css
--glow-primary: 0 0 20px rgb(var(--accent-primary) / 0.25);
--glow-success: 0 0 20px rgb(var(--accent-success) / 0.28);
--glow-danger:  0 0 20px rgb(var(--accent-danger)  / 0.28);
--glow-warning: 0 0 20px rgb(var(--accent-warning) / 0.28);
```

Usage: `<div className="glow-primary"></div>`

#### Safe-area inset

```css
--safe-bottom: env(safe-area-inset-bottom, 0px);
```

Usage: `.pb-bottom-nav` utility adds `calc(5rem + var(--safe-bottom))` bottom padding.

### Keyframes + animation utilities

All of these are available as `.animate-*` classes:

| Class                   | Timing                                         | Use case                                        |
| ----------------------- | ---------------------------------------------- | ----------------------------------------------- |
| `.animate-fade-up`      | 0.35s ease-out                                 | Card/row entrance                               |
| `.animate-fade-in`      | 0.30s ease-out                                 | Simple opacity reveal                           |
| `.animate-scale-in`     | 0.25s ease-out                                 | Modal / panel entrance                          |
| `.animate-bounce-in`    | 0.45s `cubic-bezier(0.34, 1.56, 0.64, 1)`      | Emphasized entrance with slight overshoot       |
| `.animate-shake`        | 0.40s ease-in-out                              | Error / negative feedback                       |
| `.animate-glow-pulse`   | 2s infinite                                    | Ambient glow (e.g. AI assistant button)         |
| `.animate-float-soft`   | 4s infinite                                    | Idle drift (brand orbs, mini logos)             |
| `.animate-slide-in-r`   | 0.4s ease-out                                  | Right-to-left slide (e.g. drawer, toast)        |
| `.animate-slide-in-l`   | 0.4s ease-out                                  | Left-to-right slide                             |
| `.animate-status-pulse` | 2s infinite                                    | "I'm online" pulsing ring on avatars            |
| `.animate-checkmark`    | 0.4s `cubic-bezier(0.34, 1.56, 0.64, 1)`       | Success-state pop (e.g. "Saved ✓")              |

Stagger helpers: `.stagger-item:nth-child(1..8)` add `40…320ms` animation delays.

### Component-level utilities

| Class            | Purpose                                                                    |
| ---------------- | -------------------------------------------------------------------------- |
| `.ripple-surface` | `position: relative; overflow: hidden` — required container for `<Ripple>` |
| `.ripple-dot`    | Single ripple instance (managed automatically by `useRipple()`)            |
| `.skeleton`     | Shimmer skeleton block with gradient sweep                                 |
| `.glass-hover`  | Adds a gentle lift + border-glow on hover for glass cards                  |
| `.focus-ring`   | 2px accent ring on `:focus-visible` (unified across buttons/links/inputs)  |
| `.glow-primary`, `.glow-success`, `.glow-danger`, `.glow-warning` | Pre-baked glow shadows |
| `.lift-on-hover` | 3px translateY lift + deeper shadow on hover                              |
| `.underline-grow` | Animated underline that scales from left to right                        |
| `.pb-bottom-nav` | Mobile bottom-nav safe-area padding (5rem + env safe-area-inset)           |
| `.confetti-piece` | Single confetti particle (managed by `<ConfettiBurst>`)                   |

---

## New UI Primitives

All of these are re-exported from `@/components/ui` (`src/components/ui/index.ts`).

### `<Button>` — now with ripple + loading

```tsx
import { Button } from '@/components/ui'

<Button loading={isSaving} variant="primary" size="lg">
  Save changes
</Button>

<Button leftIcon={<span className="material-symbols-outlined">add</span>}>
  New Plan
</Button>

<Button noRipple variant="ghost">Plain</Button>
```

**Props** added on top of existing API:

- `loading?: boolean` — replaces `leftIcon` with a spinner and disables the button.
- `leftIcon?: ReactNode` — rendered before the label (hidden while `loading`).
- `noRipple?: boolean` — opt out of the ripple micro-interaction.

Existing code using `<Button>` continues to work unchanged.

### `useRipple()` + `<RippleContainer>`

For custom interactive surfaces that shouldn't use the `<Button>` component
(e.g. nav items, chips, toggles).

```tsx
import { useRipple, RippleContainer } from '@/components/ui'

function TabButton() {
  const { ripples, onPointerDown } = useRipple()
  return (
    <button
      onPointerDown={onPointerDown}
      className="ripple-surface focus-ring rounded-xl px-4 py-2"
    >
      Label
      <RippleContainer ripples={ripples} />
    </button>
  )
}
```

- The container **must** have `.ripple-surface` (which sets
  `position: relative; overflow: hidden; isolation: isolate`).
- Ripples clean themselves up automatically after 600ms.
- Disabled by `prefers-reduced-motion`.

### `<ConfettiBurst>`

Fire a one-shot confetti burst inside any `position: relative` container.

```tsx
import { ConfettiBurst } from '@/components/ui'

const [celebrate, setCelebrate] = useState(false)

<div className="relative">
  {/* …card content… */}
  <ConfettiBurst
    show={celebrate}
    count={16}
    colors={['#4ade80', '#60a5fa', '#f472b6', '#fbbf24']}
    duration={1200}
  />
</div>
```

**Props**

| Prop         | Default                                                  | Purpose                                                |
| ------------ | -------------------------------------------------------- | ------------------------------------------------------ |
| `show`       | —                                                        | When it flips to `true`, one burst plays then hides    |
| `count`      | `14`                                                     | Number of particles                                    |
| `colors`     | `['#4ade80', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa']` | Particle palette                                       |
| `duration`   | `1200`                                                   | Total lifetime (ms) before pieces unmount              |
| `className`  | `''`                                                     | Applied to the absolutely-positioned container         |
| `onDone?`    | —                                                        | Fires after pieces unmount (also fires when motion is reduced) |

Zero dependencies — pure CSS `@keyframes confetti-fall` with randomized
`--tx` and `--tr` CSS variables per piece.

### `<Skeleton>`

Drop-in replacement for `animate-pulse` blocks.

```tsx
import { Skeleton } from '@/components/ui'

<Skeleton className="h-8 w-20" />
<Skeleton className="h-32" />
<Skeleton shape="circle" className="w-10 h-10" />
<Skeleton shape="pill"   className="w-24 h-6" />
```

`shape` defaults to `'rect'` (rounded-xl). The shimmer animation pauses when
`prefers-reduced-motion` is set.

### `<FloatingActionButton>`

```tsx
import { FloatingActionButton } from '@/components/ui'

<FloatingActionButton
  label="Add habit"
  icon={<span className="material-symbols-outlined">add</span>}
  onClick={openAddModal}
  show={!isModalOpen}           // fades out while modals are open
  placement="bottom-right"      // or "bottom-center"
/>
```

- Renders as `fixed` at `right-5 bottom-[5.25rem]` on mobile (above the bottom nav)
  and `right-8 bottom-8` on desktop.
- Automatic safe-area offset (`calc(5.25rem + var(--safe-bottom))`).
- Ripple on press, spring-based hover/tap, primary gradient glow.

### `<PageTransition>`

Wraps route content inside `<AppLayout>` to provide a subtle
fade-up-out transition between routes.

Already wired into `AppLayout` — you only need to touch it when building a
special page that wants to opt out:

```tsx
<AppLayout disableTransition>...</AppLayout>
```

### `<StatusDot>`

```tsx
import { StatusDot } from '@/components/ui'

<StatusDot status="online"  />   // pulsing green
<StatusDot status="away"    />   // amber
<StatusDot status="busy"    />   // red
<StatusDot status="offline" />   // gray
<StatusDot size={12} pulse={false} />
```

Used on the sidebar avatar to indicate an active session.

### `<ThemeToggle>`

```tsx
import { ThemeToggle } from '@/components/ui'

<ThemeToggle              />   // Pill with icon + label
<ThemeToggle compact       />  // Icon-only 40×40 (used in rail mode)
```

Cycles `dark → light → system`, reads/writes `useSettingsStore.theme`.
Icon rotates between `dark_mode`, `light_mode`, `routine` with a spring
transition on change.

---

## Navigation Redesign

### Sidebar — 3 modes

`src/store/useLayoutStore.ts` now exposes `sidebarMode: 'expanded' | 'rail' | 'hidden'`
(persisted) and `cycleSidebarMode()`.

| Mode       | Width     | When                                          |
| ---------- | --------- | --------------------------------------------- |
| `expanded` | **256px** | Default on desktop; full labels + stats strip |
| `rail`     | **80px**  | Icon-only rail; tooltips on hover             |
| `hidden`   | 0px       | Focus mode or manual dismiss                  |

On **mobile** (`< 1024px`), the store auto-sets `hidden` and the sidebar acts as
an overlay drawer (slides in from the left with a blurred backdrop).

Features:

- Brand orb with soft float animation + primary glow.
- Every nav item has a ripple, hover scale on icon, and a shared
  `layoutId="sidebar-active-pill"` that smoothly slides to the new active route.
- Weekly stats strip (score + completed/planned + animated progress bar), only
  visible in expanded mode.
- Avatar with initial + `<StatusDot>` overlay; sign-out button.
- Embedded `<ThemeToggle>` and Feedback button (both ripple-enabled).
- Edge-cycle button (`‹`) on the right edge to rotate through modes.
- Hidden mode edge-toggle (`›`) at `left: 0` brings the sidebar back.

### Top nav

- **Animated hamburger**: three bars morph into an X using `framer-motion`
  spring transforms. Syncs with sidebar state (or drawer state on mobile).
- **Page title crossfade**: derived from `NAV_ITEMS` and animates on each route
  change.
- **Week navigator**: condensed on mobile, with date range visible on `lg`+.
- **AI assistant button**: pulsing glow ring + filled icon to signal it's
  actionable. Now uses ripple.
- **Adaptive offset**: `left` animates between `0 / 80 / 256` to match sidebar.

### Mobile bottom nav

`src/components/layout/MobileBottomNav.tsx`

- Only renders when `isMobile && !isFocusMode`.
- 5 floating tabs inside a rounded glass pill:
  `Home · Plan · Habits · Stats · More`
- `layoutId="bottom-nav-indicator"` slides the 3px pill indicator between tabs.
- Each tab icon scales up + lifts slightly when active.
- **Pending-task badge** on Home tab — reads today's pending tasks from
  `useWeekStore` and shows a red pill with a scale-pop when the count changes.
- "More" button triggers the sidebar drawer, with an animated rotation
  (`rotate: 90deg` when open).
- Safe-area aware via `style={{ paddingBottom: 'var(--safe-bottom)' }}`.

### Page transitions

Every route inside `<AppLayout>` now fades + slides in on mount
(`0.32s ease-out`). Automatically respects
`@media (prefers-reduced-motion: reduce)` via `useReducedMotion()` from
framer-motion — in that mode it falls back to plain opacity transition.

---

## Celebrations & Micro-interactions

### Habit cards now celebrate real progress

`src/components/habittracker/HabitCard.tsx` +
`src/components/habittracker/HabitBubbleGrid.tsx`

- `<HabitBubbleGrid>` emits two new callbacks:
  - `onCelebrate()` — positive outcome (build-habit marked done, or slip cleared)
  - `onNegative()` — negative outcome (build-habit un-ticked, or slip recorded)
- `<HabitCard>` responds with:
  - **Confetti burst** (colors tinted to the habit's accent) on `onCelebrate`
  - **`.animate-shake`** on the card on `onNegative`
  - **Spring-animated streak counter** that pops whenever `streak` changes
  - **Progress bar** with inner glow matching the habit color
  - **`.glass-hover` lift** on hover

### Habit form modal polish

`src/components/habittracker/HabitFormModal.tsx`

- Each form section (Category → Name → When → Reason → Actions) has a
  staggered slide-in-from-left entrance (40 / 80 / 120 / 160 / 200 ms delays).
- Error shows up with `AnimatePresence` fade + downshift.
- On validation error **or** server error the entire form shakes.
- On successful save, the submit button morphs to a green gradient with a
  `check_circle` icon that does a `.animate-checkmark` pop for 520ms before
  the modal dismisses.

### Mobile FAB on habits

`<HabitTracker>` renders a `<FloatingActionButton>` on mobile to open the add
modal. The FAB hides while the modal or detail drawer is open.

---

## Polished Pages

### `src/pages/Dashboard.tsx`

- `LoadingCard` now uses `<Skeleton>` instead of `animate-pulse`.
- Hero stats (score, completed/planned) animate in with a spring when values
  change.
- Day cards are rendered in a staggered entrance using `framer-motion`
  (60ms per card).

### `src/pages/SignIn.tsx`

- Two ambient floating radial-gradient orbs in opposite corners.
- Logo mark now uses `glow-primary` + `animate-float-soft`.
- Panel scales in via `.animate-scale-in`.
- All inputs promoted to the shared `.input-base` class with `.focus-ring`.
- Errors use `animate-shake`, success messages use `animate-fade-up`.
- Submit button uses the new `loading` prop on `<Button>`.
- Toggle text uses `.underline-grow`.

### `src/App.tsx` — loading screen

Replaces the pulsing square with a floating brand orb wrapped in a rotating
primary ring.

---

## Accessibility

- **`prefers-reduced-motion: reduce`** — all decorative animations are either
  disabled or reduced to a 0.01ms duration. Specifically disabled: confetti,
  ripples, shimmer, glow-pulse, float-soft, status-pulse, lift-on-hover
  transforms.
- **Focus-visible rings** — every interactive surface that adopts `.focus-ring`
  gets a 2px accent-primary outline on keyboard focus.
- **Color contrast** — all accent tokens have matching light-mode overrides in
  `body.light { ... }`, keeping AA contrast.
- **ARIA** — MobileBottomNav has `aria-label="Primary"`. Sidebar has
  `aria-hidden` when hidden. Buttons with loading state set `aria-busy`.
  The status dot, confetti, and decorative orbs all carry `aria-hidden`.

---

## File Manifest

### Added

| File                                                       | Purpose                                  |
| ---------------------------------------------------------- | ---------------------------------------- |
| `src/components/ui/Ripple.tsx`                             | `useRipple` + `<RippleContainer>`        |
| `src/components/ui/Confetti.tsx`                           | `<ConfettiBurst>`                        |
| `src/components/ui/Skeleton.tsx`                           | Shimmer skeleton                         |
| `src/components/ui/FloatingActionButton.tsx`               | Mobile FAB                               |
| `src/components/ui/PageTransition.tsx`                     | Route-level fade/slide wrapper           |
| `src/components/ui/StatusDot.tsx`                          | Animated presence indicator              |
| `src/components/ui/ThemeToggle.tsx`                        | Dark/light/system cycler                 |
| `src/components/layout/MobileBottomNav.tsx`                | Glass bottom navigation                  |

### Modified

| File                                                       | Change                                                                        |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/index.css`                                            | Tokens (glows, safe-area), keyframes, utilities, reduced-motion guard         |
| `src/components/ui/Button.tsx`                             | Ripple + `loading` + `leftIcon` + `focus-ring`                                |
| `src/components/ui/index.ts`                               | Re-exports for all new primitives                                             |
| `src/store/useLayoutStore.ts`                              | `sidebarMode`, `cycleSidebarMode`, persistence                                |
| `src/components/layout/Sidebar.tsx`                        | Full rewrite — rail mode, glow, stats strip, theme toggle, status dot         |
| `src/components/layout/TopNav.tsx`                         | Animated hamburger, page-title crossfade, pulsing AI button                   |
| `src/components/layout/AppLayout.tsx`                      | `sidebarMode`-aware padding, bottom-nav safe-area, `PageTransition`           |
| `src/components/habittracker/HabitCard.tsx`                | Confetti + shake + streak animation + glass-hover                             |
| `src/components/habittracker/HabitBubbleGrid.tsx`          | `onCelebrate` / `onNegative` callbacks                                        |
| `src/components/habittracker/HabitFormModal.tsx`           | Staggered fields, shake on error, success checkmark-pop                       |
| `src/pages/Dashboard.tsx`                                  | Shimmer skeletons, staggered day cards, animated score counters               |
| `src/pages/HabitTracker.tsx`                               | Skeleton loading, mobile FAB                                                  |
| `src/pages/SignIn.tsx`                                     | Ambient orbs, glass panel, shared input classes, animated submit state        |
| `src/App.tsx`                                              | Lively loading screen (floating orb + rotating ring)                          |

### Untouched

All data-layer files (stores except `useLayoutStore`, hooks, lib/*, supabase
integration, tRPC, workers, tests) were not modified. The enhancement is
purely presentational.

---

## Back-compat & Migration Notes

Everything below is **non-breaking** — existing code keeps working. These are
optional upgrades to take advantage of the new primitives.

### `Button` — additive props

The new `loading`, `leftIcon`, and `noRipple` props are all optional. Existing
`<Button variant="primary" onClick={...}>…</Button>` usages are unchanged.

Recommended: replace manual spinner/disabled patterns with `loading`:

```diff
- <Button disabled={isSaving}>{isSaving ? <Spinner/> : 'Save'}</Button>
+ <Button loading={isSaving}>Save</Button>
```

### `useLayoutStore`

- `isLeftSidebarOpen` still exists and is kept in sync with `sidebarMode !== 'hidden'`.
- `toggleLeftSidebar()` still works — it now cycles `hidden ↔ expanded` (or
  toggles the drawer on mobile). No callers needed an update.
- New escape-hatches if you want finer control:
  - `cycleSidebarMode()` — rotate `expanded → rail → hidden`
  - `setSidebarMode(mode)` — jump directly

### Replacing `animate-pulse`

Prefer `<Skeleton>`:

```diff
- <div className="h-8 w-20 bg-surface-container-low rounded-lg animate-pulse" />
+ <Skeleton className="h-8 w-20" />
```

This gives you the shimmer effect AND the reduced-motion guard for free.

### Adding page transitions to custom layouts

If you render outside of `<AppLayout>` for any reason, wrap in `<PageTransition>`
or add the `.animate-fade-up` utility to your root element.

---

## Verification

### Production build

```bash
npm run build
# ✓ 537 modules transformed
# ✓ built in 2.90s
```

All bundles emit cleanly; no warnings. The new primitives are tree-shaken —
`Skeleton` = 0.26 kB, `Button` = 1.40 kB.

### TypeScript

`npx tsc --noEmit` reports **only pre-existing errors** (test files,
`useHabitStore` DB cast, `dbQuery` generics, `RotatingText`'s `Intl.Segmenter`
narrowing, etc.). None of the files added or modified in this enhancement
appear in the error list.

### Reduced motion

Tested via the OS-level `prefers-reduced-motion: reduce` setting. All
animations either disable cleanly or fall back to a 0.01ms no-op.

---

## Usage Cookbook

### Add a ripple to any button-like element

```tsx
function Chip({ children, ...rest }) {
  const { ripples, onPointerDown } = useRipple()
  return (
    <button
      {...rest}
      onPointerDown={onPointerDown}
      className="ripple-surface focus-ring rounded-full px-3 py-1.5 bg-surface-container-low"
    >
      {children}
      <RippleContainer ripples={ripples} />
    </button>
  )
}
```

### Celebrate a success inside any container

```tsx
const [celebrate, setCelebrate] = useState(false)

const handleSuccess = () => {
  setCelebrate(true)
  // It auto-hides after `duration`. Trigger it again by flipping to false/true.
}

return (
  <div className="relative">
    <button onClick={handleSuccess}>Complete</button>
    <ConfettiBurst show={celebrate} onDone={() => setCelebrate(false)} />
  </div>
)
```

### Shake on error

```tsx
const [shake, setShake] = useState(false)

const onError = () => {
  setShake(true)
  setTimeout(() => setShake(false), 420)
}

return <form className={shake ? 'animate-shake' : ''}>{…}</form>
```

### Entrance animations on lists

```tsx
{items.map((item, i) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay: i * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
  >
    <ItemCard {...item} />
  </motion.div>
))}
```

Or use the CSS-only stagger:

```tsx
{items.map((item) => (
  <div key={item.id} className="animate-fade-up stagger-item">
    <ItemCard {...item} />
  </div>
))}
```

### Add a mobile FAB to any page

```tsx
import { FloatingActionButton } from '@/components/ui'
import { useLayoutStore } from '@/store/useLayoutStore'

function MyPage() {
  const { isMobile } = useLayoutStore()
  return (
    <>
      <MainContent />
      {isMobile && (
        <FloatingActionButton
          label="New"
          icon={<span className="material-symbols-outlined">add</span>}
          onClick={openCreate}
        />
      )}
    </>
  )
}
```

---

## Design Philosophy

The guiding principle is **"Lively Calm"** — the app should feel:

- **Alive** — responsive, animated, engaging.
- **Calm** — smooth, never jarring, soothing colors.
- **Rewarding** — celebrate progress, encourage daily use.
- **Belonging** — personal, warm, supportive tone.
- **Focused** — animations support, never distract.

Every interaction now delights, every animation guides, and the whole thing
respects the user's motion preferences.
