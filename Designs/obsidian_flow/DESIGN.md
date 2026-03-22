# Design System Specification: High-End Productivity

## 1. Overview & Creative North Star: "The Digital Obsidian"
This design system moves away from the cluttered density of traditional productivity tools toward a "High-End Editorial" experience. We are merging the surgical precision of **Linear** with the flexible canvas of **Notion**, filtered through a premium, dark-mode lens.

**The Creative North Star: The Digital Obsidian.** 
Like a polished volcanic glass, the UI should feel deep, monolithic, and sharp. We break the "template" look by rejecting the standard grid in favor of **Intentional Asymmetry**. Key information is anchored to a rigid vertical axis, while secondary meta-data "floats" in the periphery using generous negative space. We do not use borders to define structure; we use light and depth.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule
The palette is built on a foundation of `#131313`, layered with varying intensities of charcoal to create a sense of physical space.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders (`#262626`) for general sectioning or layout containment. 
*   **Alternative:** Boundaries must be defined solely through background color shifts. For example, a sidebar using `surface_container_low` (#1C1B1B) should sit directly against the `surface` (#131313) main canvas.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked sheets of fine paper. Depth is achieved through the hierarchy of containers:
*   **Base Layer:** `surface` (#131313) – The infinite canvas.
*   **Secondary Workspaces:** `surface_container_low` (#1C1B1B) – Navbars and sidebars.
*   **Active Focus Elements:** `surface_container_high` (#2A2A2A) – Task cards and modals.
*   **Peak Elevation:** `surface_container_highest` (#353534) – Tooltips and context menus.

### The "Glass & Gradient" Rule
To elevate the "out-of-the-box" feel, use **Glassmorphism** for floating action buttons or temporary overlays. Use `surface_variant` (#353534) at 60% opacity with a `backdrop-filter: blur(20px)`. 

**Signature Texture:** For primary CTAs, use a linear gradient: `primary_container` (#2F5CFF) to `primary` (#B8C3FF) at a 135-degree angle. This provides a "glow" that flat colors cannot replicate.

---

## 3. Typography: Editorial Authority
We use **Inter** as the sole typeface. The hierarchy is driven by extreme contrast in scale and weight to ensure the user’s eyes land exactly where intended.

*   **Display (The Bold Statement):** Use `display-md` (2.75rem) for empty states or dashboard headers. This communicates confidence.
*   **Headline & Title (Structure):** `headline-sm` (1.5rem) should be used for project titles. Pair this with `label-sm` (0.6875rem) in `on_surface_variant` for meta-data to create a sophisticated "Large/Small" dynamic.
*   **Body (Utility):** `body-md` (0.875rem) is the workhorse. Increase the line-height to 1.6 for long-form task descriptions to maintain an editorial feel.
*   **The "Mono" Accent:** While not in the primary scale, use Inter’s tabular numbers for timers and progress percentages to maintain visual alignment.

---

## 4. Elevation & Depth: Tonal Layering
Traditional structural lines are replaced by **Tonal Layering**.

*   **The Layering Principle:** Place a `surface_container_lowest` (#0E0E0E) card on a `surface_container_low` (#1C1B1B) background. This "sunken" effect creates a natural container without a single pixel of border.
*   **Ambient Shadows:** When a card must "float" (e.g., during a drag-and-drop action), use a shadow with a blur of `32px` at 6% opacity. The shadow color should be a tinted version of `primary` to mimic an atmospheric glow rather than a grey drop shadow.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke (e.g., focus states), use `outline_variant` (#434656) at **20% opacity**. Never use 100% opaque borders.

---

## 5. Components: Precision & Affordance

### Buttons
*   **Primary:** Gradient fill (`primary_container` to `primary`). `DEFAULT` (8px) roundedness. No border.
*   **Secondary:** `surface_bright` (#3A3939) background. High contrast `on_surface` text.
*   **Tertiary:** Transparent background. Hover state shifts to `surface_container_high` (#2A2A2A) with a soft transition (200ms ease-out).

### Cards & Lists
*   **The Divider Ban:** Vertical lines are forbidden. Use Spacing Scale `6` (1.5rem) or `8` (2rem) to separate list items.
*   **Interactive State:** Upon hover, a card should shift from `surface` to `surface_container_low`. Do not use a border highlight; use a background "lift."

### Progress Indicators
*   **The Status Glow:** Use `tertiary` (#4EDEA3) for completion. Instead of a simple checkmark, use a circular track where the fill is a subtle glow.
*   **Task Urgency:** Use `error` (#FFB4AB) for overdue tasks, but apply it only to a 2px vertical "accent bar" on the far left of the card to maintain minimalism.

### Input Fields
*   **Minimalist Inputs:** No background fill. Only a `surface_variant` (#353534) bottom border (2px). On focus, the border transitions to `primary` (#B8C3FF) and the label floats using `label-sm`.

---

## 6. Do’s and Don’ts

### Do
*   **DO** use white space as a structural element. If a section feels crowded, double the spacing token (e.g., move from `8` to `16`).
*   **DO** use `surface_container_highest` for hover states on small interactive icons to create a "spotlight" effect.
*   **DO** align text-heavy content to a strict 640px centered column for readability, even if the screen is wide.

### Don't
*   **DON'T** use 100% white (#FFFFFF). Always use `on_surface` (#E5E2E1) to reduce eye strain in dark mode.
*   **DON'T** use standard "drop shadows" with black. Always tint your shadows with the background hue to maintain the "Obsidian" depth.
*   **DON'T** use "Heavy" weights for body text. Reserve Bold for `title-lg` and above to keep the interface feeling light and "Modern."