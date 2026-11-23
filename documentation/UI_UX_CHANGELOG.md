# EPL Platform UI/UX Changelog & Visual Evolution Register

**Current UI Version:** `2.1-dev`  
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
Gen 2.0.1 (Nov 19): Luxury Obsidian-Ivory-Vermilion & Three.js 3D Cricket WebGL Scene
        ↓
Gen 2.1 (Current): Four-Tier Leaderboards & Dedicated Live Auction Intelligence Portal
        ↓
Gen 2.1-unslop (Current): Full Unslop Design System Overhaul (Restraint, Calm Chrome, Nested Radii)
```

---

## 2. Granular UI/UX Changelog

### Version 2.1-dev (Unslopped) — Design Craftsmanship & Noise Elimination
* **Skill Integration (`unslop`)**:
  * Adopted the modern frontend craftsmanship methodology from Damir's `unslop` system.
  * Formulated and executed strict design direction:
    * *Character:* Exact, authoritative, quiet, athletic.
    * *World:* Leather ball under stadium lights, scorecard paper and ink, scoreboard digits.
    * *Moments:* Authentic Three.js 3D match ball with physically raised Torus seam; real tournament records.
    * *Signature:* Discrete scorecard delivery pips (`●`/`○`), monospace tabular figures (`tabular-nums`), and hairline borders.
* **Elimination of AI Visual Clutter & Slop**:
  * Removed artificial custom cursor trails (`CustomCursor.tsx`) to restore native OS accessibility and responsiveness.
  * Removed decorative SVG gradient glows and blur filters (`#epl-vermilion-glow` / `feGaussianBlur`).
  * Removed background animated kinetic trajectory vectors (`trajectoryY1` SVG loops) on the landing page.
  * Converted shouting all-caps headings (`MORE THAN A GAME. A GAME OF NUMBERS.`) into exact, solid sentence-case typography (`The numbers behind every over.`).
  * Eliminated sparkles (`<Sparkles>`) and hype badges in favor of verified factual telemetry strips (`3 seasons • 27 matches • 73 athletes`).
  * Replaced opposing parallel scroll parallax (`ParallelScrollColumns`) with a static, balanced 3-column performance intelligence grid (Velocity Records, Defensive Suppression, Knockout Dynamics).
  * Replaced ubiquitous `rounded-full` pills with calculated nested radii (controls: `rounded-lg` 8px, cards: `rounded-xl` 12px, panels: `rounded-2xl` 16px).
  * Set `tabular-nums` on all historical statistics, milestone numbers, and monetary figures to prevent layout shift.
  * Removed artificial micro-animation bounce (`hover:scale-[1.02]`) and perpetual pulsing (`animate-pulse`) across CTAs and stat cards.
* **Global Consistency & Verification**:
  * Refined Landing Page (`/`), Dashboard (`/dashboard`), Rankings (`/rankings`), and Player Profile Dossiers (`/players/[id]`).
  * All 27 Next.js routes compile cleanly in production builds (`next build`).
  * 100% test pass rate preserved (90/90 backend tests passing).

---

### Version 2.1-dev — Four-Tier Player Intelligence & Premium Auction Portal
* **Four-Tier Rankings Leaderboard Experience (`/rankings`)**:
  * Four distinct discipline tabs (`OVERALL`, `BATTING`, `BOWLING`, `ALL-ROUND`) with luxury dark styling.
  * Score progress bars color-coded by performance tiers.
  * Interactive row expansion revealing transparent mathematical breakdowns (Volume, Velocity, Reliability, Milestones, Boundary Share, Wicket Threat, Economy, Dot Balls, Balance Bonus, Same-Match Bonus).
  * Collapsible disqualification register explaining specific thresholds missed by ineligible players.
* **Dedicated Franchise Auction Portal (`/auction-portal`)**:
  * Luxury Obsidian login interface (`/auction-portal/login`) with radial warmth glow and brand crest.
  * Franchise Owner Command Hub (`/auction-portal/owner/[teamId]`) with custom franchise theme accent palettes (Victory Vipers Emerald, Warriors Royal Blue, Ultimates Purple, Panthers Orange, Legenda Gold, Lions Red), live purse usage meters, current squad roster, 4-tier scouting tabs, and shortlist stars.
  * Auctioneer Lot Controller (`/auction-portal/auctioneer`) with nominated athlete spotlight, single-click decision buttons (`SOLD`, `UNSOLD`, `PAUSE`), live bid history feed, and franchise purse overview.
  * Super Admin Console (`/auction-portal/admin`) with full identity and access matrix, role badges, and emergency auction state reset.
  * Synchronized Live Bidding Terminal (`/auction-portal/live`) with real-time WebSocket state, athlete 4-tier dossier preview, animated leading bid counters, and authenticated bidding buttons.
* **Athlete Performance Dossier Upgrade (`/players/[id]`)**:
  * Added prominent Four-Tier Independent Rankings section directly to athlete dossiers showing BAT, BOWL, AR, and OVERALL ranks, scores, confidence pills, and role paths.
* **Global Navigation Integration (`Navbar.tsx`)**:
  * Added Rankings link to desktop and mobile navigation menus with active dot indicator.
  * Updated Auction CTA to point to the dedicated Auction Portal.
  * Bumped version badge to `v2.1-dev`.

---

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
  * `/players`: Vermilion role pills, ivory card containers, obsidian typography, hairline borders, and experience filter dropdown (`Proven`, `Established`, `Developing`, `Emerging`).
  * `/players/[id]`: Monogram crests, 100-Point PIS scorecard with micro-meters, pressure splits, auction economics, confidence rating indicator, interactive performance tags with category badges, and sample size volatility warnings.
  * `/dashboard`: Luxury KPI cards, updated `v2.0.1-dev` release strip, Recharts custom-themed charts.
  * `/teams`: Franchise matrix with net run rate color coding and win distribution charts.
  * `/comparison`: Head-to-head comparison table with leader stars, category banners, and experience level / performance tags comparison.
  * `/auction`: Authenticated six-owner live bidding cockpit with atomic reserve verification.
* **Player Intelligence & Confidence Micro-UI Components**:
  * Experience tier pills (`Proven`, `Established`, `Developing`, `Emerging`) with subtle hairline border framing.
  * Confidence level pills (`HIGH`, `MEDIUM`, `LOW`, `VERY LOW`) with color-coded dot indicators.
  * Controlled vocabulary performance tag badges with category-coded fills (Electric Vermilion for explosive, Emerald for consistency, Laser Cyan for bowling, Amber for sample warnings) and hover tooltip descriptions.
  * High-visibility sample size warning callout on profiles with low statistical confidence ($C_f < 0.35$).
* **Automated Visual Verification**:
  * Playwright automated testing across all 6 viewports (1440 light/dark, 1280, 1024, 768, 390, 375).
  * 79/79 backend pytests passing, 21/21 Next.js routes compiling with 0 errors.

---

### Version 2.0.0 (Signature Release)
* **Brand Logo System (`EplBrandLogo.tsx`)**: Geometric vector identity replacing clipart.
* **3D Page-Curl Transition (`PageCurlTransition.tsx`)**: Tactile page peeling corner animation when switching themes.
* **Custom Magnetic Cursor (`CustomCursor.tsx`)**: Desktop spring follower with hover state expansions.
* **Cinematic Landing Page (`/`)**: Staggered typography reveals and live telemetry counters.
