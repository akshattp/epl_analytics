# EPL v2.0 — MOTION DESIGN & INTERACTION CHOREOGRAPHY SPECIFICATION

**Product**: EPL (Exotica Premier League) Historical Cricket Analytics & Live Auction Platform  
**Version**: 2.0.0 Signature Release  
**Status**: Interaction Architecture Document  
**Date**: November 19, 2026  
**Core Technologies**: `framer-motion`, CSS Transforms, Spring Physics  

---

## 1. Motion Design Philosophy

In EPL v2.0, animation is not treated as mere visual embellishment, but as a functional vehicle for spatial continuity, data hierarchy, and emotional delight. Every motion follows three governing tenets:

1. **Physical Plausibility & Inertia**: Transitions use spring physics with natural damping and stiffness rather than linear easing, mimicking the physical weight of athletic equipment and tactile print editorial pages.
2. **Contextual Directionality**: Elements enter and exit along purposeful geometric axes—dossier cards rise upward on load, tabs slide on a shared spring axis, and theme transitions fold across diagonal planes.
3. **Graceful Degradation (`prefers-reduced-motion`)**: Users who prefer reduced motion bypass complex 3D transforms; all elements immediately snap to their final rest positions.

---

## 2. Signature Page-Curl Theme Transition

The standout micro-interaction in EPL v2.0 is the **Signature Page-Curl / Corner-Fold Transition** (`frontend/src/components/PageCurlTransition.tsx`).

### Visual Concept:
When a user clicks the celestial Sun/Moon toggle in the navigation header, the page does not suffer a harsh, jarring flash of unstyled content or a generic CSS opacity fade. Instead, the top-right corner of the interface visibly peels back like the glossy page of a luxury athletic magazine or physical tournament matchbook:

```
Step 1: User clicks Sun/Moon toggle
Step 2 (0ms - 320ms): Top-right sheet peels back with 3D perspective fold, dynamic shadow crease, and subtle sheet illumination.
Step 3 (320ms): Theme state toggles in the root DOM (e.g. `dark` class added/removed) while the folded sheet covers the corner.
Step 4 (320ms - 680ms): The peeled sheet smoothly flattens down to reveal the newly activated theme across the entire application.
Step 5 (680ms): The transition layer unmounts, restoring 100% interactivity.
```

### Component Architecture:
* **File**: `frontend/src/components/PageCurlTransition.tsx`
* **Context**: `PageCurlProvider` embedded directly inside `frontend/src/lib/theme.tsx`.
* **State Trigger**: `toggleTheme()` in `useTheme()` invokes `triggerCurl(callback)`.
* **CSS 3D Transforms**: `perspective(1200px) rotateX(...) rotateY(...)` with linear-gradient shadow creases that render with hardware-accelerated 60fps smoothness.

---

## 3. Desktop Custom Interactive Cursor

To deliver an agency-grade, bespoke feel on desktop displays, EPL v2.0 introduces a custom interactive cursor (`frontend/src/components/CustomCursor.tsx`).

### Core Behaviors:
1. **Spring-Follower Physics**: The outer ring follows the native pointer with a subtle spring lag (`damping: 28, stiffness: 320`), giving it an organic, magnetic weight.
2. **Precision Inner Dot**: A 6px high-contrast center dot tracks mouse coordinates with 0ms latency for pixel-perfect clicking.
3. **Hover Expansions**:
   - Over standard buttons & links: The outer ring expands from 32px to 48px with high-contrast border brightening.
   - Over elements with `data-cursor="view"`: The cursor expands to 64px, displaying a micro-typography `"VIEW"` badge inside the circle.
4. **Touch & Mobile Isolation**: The cursor automatically detects touchscreen and non-fine-pointer devices via `window.matchMedia("(pointer: fine)")` and disables itself entirely on smartphones and tablets to prevent touch interference.

---

## 4. Scroll Choreography & Telemetry Counters

On the cinematic landing page (`frontend/src/app/page.tsx`):
1. **Kinetic Hero Entrances**: The hero title, slogan, and action buttons enter using staggered spring animations (`staggerChildren: 0.15s, delayChildren: 0.2s`).
2. **Live Telemetry Counters (`<AnimatedCounter />`)**:
   - Numbers (e.g. 2,829 runs, 186 wickets, 56 innings, 73 players) animate smoothly from 0 to their canonical values only when the section scrolls into the viewport (`useInView`).
   - Powered by `useMotionValue` and `useSpring(value, { duration: 1800, bounce: 0 })`.
3. **Interactive Athlete Dossier Cards**:
   - Cards float with micro-elevation on cursor hover (`scale: 1.02, y: -4px`).
   - Active tabs in player dossiers switch with smooth shared layout bounds (`layoutId="activeTabUnderline"`).
