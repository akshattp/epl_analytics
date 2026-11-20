# EPL v2.0 Design System & Brand Guidelines
## Luxury Obsidian, Warm Ivory & Electric Vermilion Visual Identity

**Version:** `2.0.1-dev`  
**Foundational Typefaces:** Space Grotesk, Inter, JetBrains Mono  
**Brand Essence:** Luxury Sports Intelligence, Editorial Restraint, High-Craft 3D WebGL Physics, Contemporary Broadcasting Authority  

---

## 1. Master Luxury Colour Palette & Surface Tokens

The visual identity is deliberately built on high-contrast luxury restraint: 90% obsidian and warm ivory, with electric vermilion applied with laser discipline for key records, active states, ratings, and primary CTAs. Generic blue-purple gradients and Bootstrap styling are completely eliminated.

### Primary Color Tokens
* **Obsidian (Near-Black)**:
  * Canvas Dark: `#111318`
  * Card Dark (Surface 1): `#181A20`
  * Elevated Dark (Surface 2): `#22252D`
  * Hairline Border Dark: `#2A2E38`
* **Warm Ivory (Heritage Editorial)**:
  * Canvas Light: `#F1EBDD`
  * Card Light (Surface 1): `#FAF7F0`
  * Subtle Surface Light: `#E8E1D1`
  * Hairline Border Light: `#DDD5C3`
* **Electric Vermilion (Kinetic High-Impact Accent)**:
  * Primary Vermilion: `#FF4B35`
  * Hover / Deep Vermilion: `#E03E29`
  * Subtle Vermilion Pill Background: `rgba(255, 75, 53, 0.10)`
  * Vermilion Border Tint: `rgba(255, 75, 53, 0.25)`

---

## 2. Intentionally Art-Directed Themes

The Light and Dark themes are two distinct, editorial experiences, not automated color inversions:

### Light Theme: "Warm Ivory Editorial"
* **Background Canvas**: `#F1EBDD` (Warm Ivory Canvas)
* **Card & Module Surfaces**: `#FAF7F0` (Pure Warm White) with hairline border `#DDD5C3`
* **Typography Primary**: `#111318` (Obsidian Ink)
* **Typography Secondary**: `#5C584E` (Muted Warm Umber)
* **Active Indicator / High-Impact Numerals**: `#FF4B35` (Electric Vermilion)
* **Table Striping**: Alternate rows in `rgba(241, 235, 221, 0.4)`

### Dark Theme: "Obsidian Stadium Night"
* **Background Canvas**: `#111318` (Deep Obsidian Void)
* **Card & Module Surfaces**: `#181A20` (Matte Obsidian) with hairline border `#2A2E38`
* **Typography Primary**: `#F1EBDD` (Warm Ivory Glow)
* **Typography Secondary**: `#A8A296` (Muted Ivory Smoke)
* **Active Indicator / High-Impact Numerals**: `#FF4B35` (Electric Vermilion)
* **Table Striping**: Alternate rows in `rgba(24, 26, 32, 0.6)`

---

## 3. Typography Architecture

| Style Role | Font Family | Weight | Tracking | Recommended Use |
| :--- | :--- | :---: | :---: | :--- |
| **Hero Display** | Space Grotesk | 900 (Black) | `-0.03em` | Landing headlines, athlete hero titles |
| **Section Display** | Space Grotesk | 800 (Extrabold) | `-0.02em` | Section headers, card titles |
| **Data Numerals** | Space Grotesk / JetBrains Mono | 700 / 800 | `normal` | Metric counters, milestone numbers |
| **Body & Labels** | Inter | 400 / 500 | `normal` | Explanations, table cells, descriptions |
| **Telemetry & IDs** | JetBrains Mono | 600 / 700 | `tight` | IDs (`EPL-P-001`), formulas, timestamps |

---

## 4. Blender-Level 3D WebGL Experience (`Cricket3DScene.tsx`)

A custom 3D WebGL cricket match ball built with Three.js (v187):
1. **Physical Mesh & Texture**: High-subdivision sphere (64x64 segments) rendered with procedural leather pores bump map and ACESFilmic tone mapping.
2. **Physical Raised Seam**: Procedural Torus geometry forming a physical raised warm ivory spine, adorned with 72 criss-cross cotton thread relief stitches.
3. **3-Point Stadium Lighting Rig**:
   * Key light: Pure white stadium floodlight from above-left (`#FFFFFF`, intensity 3.2).
   * Fill light: Soft warm ivory ground bounce (`#F1EBDD`, intensity 1.5).
   * Kick / Rim light: Electric vermilion edge glow (`#FF4B35`, intensity 2.4).
   * Cursor spotlight: Interactive cursor tracking light (`#FFFFFF`, intensity 1.8).
4. **Interactive Motion & Performance**:
   * Cursor tracking with spring lerping (`lerp(current, target, 0.05)`).
   * Scroll-driven acceleration and orbital ambient lighting motes.
   * `IntersectionObserver` auto-pauses rendering loop when out of viewport.
   * Graceful vector SVG fallback if WebGL is unavailable.

---

## 5. Navigation & Brand Identity (`EplBrandLogo.tsx` & `Navbar.tsx`)

1. **Brand Crest (`EplBrandLogo.tsx`)**:
   * Architectural geometric cricket crest with interlocking obsidian and ivory wickets.
   * Kinetic electric vermilion trajectory arc piercing the wickets.
   * Apex diamond telemetry beacon with subtle glow.
2. **Top Navigation (`Navbar.tsx`)**:
   * Dynamic scroll-responsive compacting (`h-16` on top -> `h-14` on scroll with intensified backdrop blur).
   * Luxury pill links with electric vermilion dot indicators on active routes.
   * Live Auction Room vermilion CTA pill with pulse indicator.
   * Tactile page-curl theme switch with vermilion foil edge.

---

## 6. Website-Wide Extension

The luxury design system is strictly propagated across all 21 compiled routes:
* **Landing Page (`/`)**: 12-column asymmetric hero embedding the 3D cricket match ball, telemetry HUD, GSAP parallel scrolling columns, and pinned horizontal dossiers.
* **Master Player Directory (`/players`)**: Vermilion role badges, ivory card containers, obsidian typography, and hairline border data tables.
* **Athlete Performance Dossiers (`/players/[id]`)**: Monogram heraldic crests, 100-Point PIS scorecards with micro-meters, situational pressure splits, and auction economics.
* **Tournament Overview (`/dashboard`)**: Luxury KPI tiles, updated version strip (`v2.0.1-dev`), and custom-themed Recharts analytics.
* **Franchise Performance (`/teams`)**: Pinned franchise data tables, win distribution bar charts, and net run rate indicators.
* **Head-to-Head Comparison (`/comparison`)**: Side-by-side metric matrix with leader star indicators.
* **Auction Command Center (`/auction`)**: Authenticated six-owner live bidding cockpit, atomic reserve verification, and real-time WebSocket sync.
