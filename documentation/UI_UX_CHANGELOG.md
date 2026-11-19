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

### Version 2.0.1-dev (Landing Page Reconstruction & Scroll-Driven Parallel Motion)
* **Hero Whitespace & Bounding Box Optimization**:
  * Corrected container margin collapse that pushed the headline down to `y: 391px`.
  * Verified via Playwright automation: H1 begins at `y: 159px` (tightly integrated at top fold).
* **Elimination of Orphaned Pulsing Loader**:
  * Removed solitary pulsing blue dot in the top eyebrow badge that resembled an unresolved spinner.
  * Replaced with structured badge with `<Sparkles />` icon.
* **12-Column Asymmetric Hero Stage**:
  * Left (7 cols): Bold editorial typography, Space Grotesk headline, format description, and 3 high-contrast CTAs.
  * Right (5 cols): High-impact dark glass Cricket Telemetry HUD displaying verified tournament records (62/2 score, Sagar Kapadia 138 runs, Smeet Shah 3.57 econ, atomic concurrency indicator).
* **GSAP Opposing-Direction Parallel Motion (`ParallelScrollColumns.tsx`)**:
  * 3 independent vertical columns moving at distinct velocities tied to scroll progress via GSAP `ScrollTrigger` and `scrub: 1.2`.
  * Column 1: Ascends upward (`y: -140px`).
  * Column 2: Descends downward in opposite direction (`y: +120px`).
  * Column 3: Ascends at faster velocity (`y: -200px`).
* **GSAP Pinned Horizontal Scrolling Dossiers (`HorizontalScrollDossiers.tsx`)**:
  * Vertical scroll drives smooth horizontal scrubbing across verified athlete cards with dynamic `scrollWidth` calculation and `gsap.context()` cleanup.
  * Natural touch swiping fallback on mobile (< 768px).
* **Zero Runs/Wickets Bug Resolution**:
  * Fixed display glitch where athlete cards showed 0 runs and 0 wickets due to accessing undefined nested properties. Now pulls verified database figures.
* **Elimination of Repetitive 3-Box Clichés**:
  * Section 01: Asymmetric split-screen (sticky 36-ball manifesto left, 6-team interactive competition grid right).
  * Section 04: Data Intelligence Cockpit (Dominant Batting Velocity Engine with 10+, 15+, 20+ milestone distribution + Restrictive Bowling Suppression).
* **Cross-Device Responsive Verification**:
  * Automated testing across 6 viewports: 1440px, 1280px, 1024px, 768px, 390px, 375px.
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
