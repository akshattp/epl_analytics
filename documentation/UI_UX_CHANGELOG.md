# EPL Platform UI/UX Changelog & Visual Evolution Register

**Current UI Version:** `2.0.1-dev`  
**Aesthetic Standard:** Premium Sports Intelligence & Contemporary Broadcasting Editorial  
**Design Systems Lead:** Principal UI/UX Designer & Motion Director  

---

## 1. Summary of Visual Generations

```text
Gen 1.0 (Nov 17): Beige/Brown Functional Dashboard (Bootstrap-style, basic tables)
        ↓
Gen 1.4 (Nov 19): Dark Sports Intelligence (High-contrast slate/navy dark cards)
        ↓
Gen 1.5 (Nov 19): Global Dual-Theme Redesign (Space Grotesk, Electric Blue & Laser Cyan)
        ↓
Gen 2.0 (Nov 19): Signature Design Experience (Custom Vector Crest, 3D Page-Curl, Magnetic Cursor)
        ↓
Gen 2.0.1 (Current): Creative Overhaul & Parallel Scrolling (Asymmetric Layouts, Parallax, Zero AI Clichés)
```

---

## 2. Granular UI/UX Changelog

### Version 2.0.1-dev (Sprint in Progress)
* **Zero Runs/Wickets Bug Resolution**: Fixed display glitch in `frontend/src/app/page.tsx` where athlete cards showed 0 runs and 0 wickets due to accessing undefined nested properties. Now properly pulls verified database figures.
* **Landing Page Complete Reconstruction**:
  * Eliminated repetitive 3-box sections in Section 01 and Section 03.
  * Introduced an **Asymmetric Competition Architecture Section** displaying 6-over match dynamics (36 balls, high leverage) and an interactive 6-Franchise Competition Grid.
  * Integrated **Multi-Layer Parallel Scrolling**: Typography and background kinetic vector trajectories move at distinct scroll velocities via `framer-motion` (`useScroll`, `useTransform`).
  * Horizontal athlete dossier sequence with high-fashion typography.
* **Athlete Performance Dossier (`/players/[id]`)**:
  * Enhanced role-prioritized metric layout (batters highlight runs, SR, boundary %; bowlers highlight wickets, economy, dots; all-rounders highlight dual balance).
  * Season filterable match timeline log.

### Version 2.0.0 (Signature Release)
* **Brand Logo System (`EplBrandLogo.tsx`)**: Geometric vector identity replacing clipart.
* **3D Page-Curl Transition (`PageCurlTransition.tsx`)**: Tactile page peeling corner animation when switching themes.
* **Custom Magnetic Cursor (`CustomCursor.tsx`)**: Desktop spring follower with hover state expansions.
* **Cinematic Landing Page (`/`)**: Staggered typography reveals and live telemetry counters.

### Version 1.5.0 (Reconstructed from Git commit 6e434ef)
* **Dual-Theme System**: Integrated light and dark theme mode toggle with CSS custom properties.
* **Space Grotesk & Inter Typography**: Bold geometric headers and legible data typography.
* **Palette Refresh**: Electric Blue (`#2563EB`) and Laser Cyan (`#0891B2`).

### Version 1.4.0 (Reconstructed from Git commit c2a0b9a)
* **Dark Sports Modernization**: Dark backgrounds (`#0B1120`, `#151F32`), high-contrast borders (`#334155`), and elevated stat cards.
