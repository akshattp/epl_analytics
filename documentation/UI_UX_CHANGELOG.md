# EPL Platform UI/UX Changelog & Visual Evolution Register

**Current UI Version:** `2.0.1-dev`  
**Aesthetic Standard:** Luxury Sports Intelligence, Editorial Restraint & High-Craft 3D WebGL Motion  
**Design Systems Lead:** Creative Director & Principal UI/UX Architect  

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
Gen 2.0.1 (Current): Luxury Obsidian-Ivory-Vermilion & Three.js 3D Cricket WebGL Scene
```

---

## 2. Granular UI/UX Changelog

### Version 2.0.1-dev — Luxury Creative Direction & 3D WebGL Transformation
* **Bold Luxury Colour Identity**:
  * Completely reassessed colour scheme, eliminating generic blue/purple AI gradients and Bootstrap dashboard conventions.
  * Primary Canvas: Obsidian (`#111318`) for dark theme, Warm Ivory (`#F1EBDD`) for light theme.
  * Surfaces: Matte obsidian (`#181A20`, `#22252D`) and warm ivory cards (`#FAF7F0`, `#E8E1D1`) with hairline borders (`#DDD5C3` / `#2A2E38`).
  * Accent: Electric Vermilion (`#FF4B35`, `#E03E29`) used with laser discipline for ~10% of elements (key records, active dot indicators, rating badges, auction CTAs).
* **Blender-Level 3D WebGL Cricket Scene (`Cricket3DScene.tsx`)**:
  * Interactive 3D cricket match ball embedded directly into the hero viewport.
  * High-subdivision sphere (64x64 segments) with procedural leather pores bump map and ACESFilmic tone mapping.
  * Physical raised warm ivory seam (Torus geometry) with 72 criss-cross cotton thread relief stitches.
  * 3-point stadium lighting rig (Key floodlight, warm ground fill, electric vermilion rim light, cursor spotlight).
  * Cursor tracking with spring lerping (`lerp(current, target, 0.05)`), scroll-driven acceleration, and orbital floating motes.
  * Viewport optimization via `IntersectionObserver` auto-pausing render loop; graceful SVG fallback.
* **Redesigned Top Navigation & Brand Crest (`EplBrandLogo.tsx` & `Navbar.tsx`)**:
  * Architectural geometric cricket crest with interlocking obsidian/ivory wickets and vermilion trajectory arc.
  * Dynamic scroll-responsive compacting (`h-16` -> `h-14`, intensified glassmorphism backdrop blur).
  * Luxury pill navigation links with electric vermilion dot indicators on active routes.
  * Live Auction Room vermilion CTA pill with pulsing state.
* **12-Column Asymmetric Hero Stage**:
  * Left (7 cols): Oversized Space Grotesk headline with vermilion gradient accent, format manifesto, and 3 high-contrast CTAs.
  * Right (5 cols): Embedded 3D cricket match ball layered with real-time record telemetry cards (62/2 score, Sagar Kapadia 138 runs, Smeet Shah 3.57 econ).
  * Resolved Defect B2: H1 headline vertical position verified at `y = 167px` (tightly integrated at top fold).
* **GSAP Parallel Motion & Horizontal Dossiers**:
  * Opposing-direction parallel columns (`ParallelScrollColumns.tsx`) moving at distinct vertical velocities (`y: -140px`, `y: +120px`, `y: -200px`).
  * Pinned horizontal scrolling dossiers (`HorizontalScrollDossiers.tsx`) driven smoothly by vertical scroll.
* **Website-Wide Luxury Extension**:
  * `/players`: Vermilion role pills, ivory card containers, obsidian typography, hairline borders.
  * `/players/[id]`: Monogram crests, 100-Point PIS scorecard with micro-meters, pressure splits, auction economics.
  * `/dashboard`: Luxury KPI cards, updated `v2.0.1-dev` release strip, Recharts custom-themed charts.
  * `/teams`: Franchise matrix with net run rate color coding and win distribution charts.
  * `/comparison`: Head-to-head comparison table with leader stars and category banners.
  * `/auction`: Authenticated six-owner live bidding cockpit with atomic reserve verification.
* **Automated Visual Verification**:
  * Playwright automated testing across all 6 viewports (1440 light/dark, 1280, 1024, 768, 390, 375).
  * 72/72 backend pytests passing, 21/21 Next.js routes compiling with 0 errors.

---

### Version 2.0.0 (Signature Release)
* **Brand Logo System (`EplBrandLogo.tsx`)**: Geometric vector identity replacing clipart.
* **3D Page-Curl Transition (`PageCurlTransition.tsx`)**: Tactile page peeling corner animation when switching themes.
* **Custom Magnetic Cursor (`CustomCursor.tsx`)**: Desktop spring follower with hover state expansions.
* **Cinematic Landing Page (`/`)**: Staggered typography reveals and live telemetry counters.
