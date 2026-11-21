# EPL v2.0 Design System & Brand Guidelines
## Luxury Obsidian, Warm Ivory & Electric Vermilion Visual Identity

**Version:** `2.1-dev`  
**Foundational Typefaces:** Space Grotesk, Inter, JetBrains Mono  
**Brand Essence:** Luxury Sports Intelligence, Editorial Restraint, High-Craft 3D WebGL Physics, Contemporary Broadcasting Authority  

---

## 0. Version 2.1-dev Extensions

### 0.1 Four-Tier Intelligence Tokens & Visual Hierarchy
* **BAT (Batting)**: Blue-500 accent (`#3B82F6`) for volume, velocity (SR), reliability (average), boundary share, and milestone metrics.
* **BOWL (Bowling)**: Emerald-500 accent (`#10B981`) for wicket threat, economy run-suppression, dot-ball pressure, and spell consistency.
* **AR (All-Round)**: Purple-400 accent (`#C084FC`) indicating qualified dual-discipline athletes with balanced contributions and same-match dual bonuses.
* **OVERALL (Composite)**: Electric Vermilion accent (`#FF4B35`) representing universal cross-discipline performance damped by empirical sample confidence.
* **Confidence Badges**:
  * `HIGH`: Emerald-500 badge (`bg-emerald-500/15 text-emerald-500 border-emerald-500/30`)
  * `MEDIUM`: Amber-500 badge (`bg-amber-500/15 text-amber-500 border-amber-500/30`)
  * `LOW`: Orange-500 badge (`bg-orange-500/15 text-orange-500 border-orange-500/30`)
  * `VERY LOW`: Red-500 badge (`bg-red-500/15 text-red-500 border-red-500/30`)

### 0.2 Auction Portal Franchise Accent System
* Victory Vipers: Emerald (`#10B981`)
* Exotica Warriors: Royal Blue (`#3B82F6`)
* The Ultimates: Purple (`#8B5CF6`)
* Exotica Panthers: Orange (`#F97316`)
* Living Legenda: Gold (`#EAB308`)
* Lions Pride: Crimson Red (`#EF4444`)

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

---

## 7. Player Classification, Experience & Evidence System

To prevent statistical misrepresentation of limited-sample players, the platform enforces a formal classification and evidence engine (`backend/analytics/classification_engine.py`):

### 1. Experience Tiers
Experience is evaluated independently from performance:
* **Emerging**: 1–2 matches (limited tournament exposure).
* **Developing**: 3–5 matches (building sample size).
* **Established**: 6–9 matches (substantive league track record).
* **Proven**: 10+ matches (comprehensive, multi-season campaign history).

### 2. Evidence & Sample-Size Thresholds
Batting and bowling disciplines are evaluated independently:
* **Batting Evidence**:
  * `Established Evidence`: $\ge 6$ innings OR $\ge 50$ balls faced.
  * `Developing Evidence`: 3–5 innings OR 20–49 balls faced.
  * `Limited Sample`: 1–2 innings AND $< 20$ balls faced.
  * `Did Not Bat`: 0 innings and 0 balls faced.
* **Bowling Evidence**:
  * `Established Evidence`: $\ge 6$ innings bowled OR $\ge 48$ legal balls (8.0 overs).
  * `Developing Evidence`: 3–5 innings bowled OR 18–47 legal balls (3.0–7.5 overs).
  * `Limited Sample`: 1–2 innings bowled AND $< 18$ legal balls.
  * `Did Not Bowl`: 0 innings and 0 legal balls bowled.
* **Two-Way All-Rounder Gating**:
  * Genuine All-Rounder status requires either both disciplines to meet $\ge \text{Developing Evidence}$, OR one discipline $\ge \text{Established Evidence}$ while the other meets $\ge \text{Developing Evidence}$ (minimum 2 wickets and 18 legal balls, and minimum 20 runs and 20 balls faced). Eliminates fall-through default misclassifications.

### 3. Statistical Confidence Score
Calculated as a harmonic, sample-weighted metric ($C_f \in [0.0, 1.0]$):
$$C_f = \min(1.0, 0.40 \cdot \frac{M}{10} + 0.35 \cdot \frac{\min(BF, 60)}{60} + 0.25 \cdot \frac{\min(LB, 48)}{48})$$
* **HIGH**: $C_f \ge 0.70$ (Proven/Established sample size across both facets).
* **MEDIUM**: $0.45 \le C_f < 0.70$ (Developing sample with dependable core data).
* **LOW**: $0.25 \le C_f < 0.45$ (Limited sample, high volatility).
* **VERY LOW**: $C_f < 0.25$ (Extreme sample constraint; 1–2 matches or single-ball exposure).

### 4. Bayesian Shrinkage towards League Prior
To prevent 1-match debutants with inflated averages or strike rates from outranking proven veterans, the Player Intelligence Score (PIS) shrinks towards the league replacement baseline ($\mu = 30.0$):
$$PIS_{adjusted} = C_f \cdot PIS_{raw} + (1.0 - C_f) \cdot 30.0$$
Discipline ratings shrink proportionally to evidence:
$$BIS_{adj} = \frac{BF}{BF + 30} \cdot BIS_{raw} + \frac{30}{BF + 30} \cdot 30.0$$
$$BoIS_{adj} = \frac{LB}{LB + 24} \cdot BoIS_{raw} + \frac{24}{LB + 24} \cdot 30.0$$

### 5. Controlled Vocabulary Performance Tags
1. `Limited Sample Size`: Assigned when $C_f < 0.35$ or matches $\le 2$, warning analysts of volatility.
2. `Emerging Talent`: Assigned to 1–3 match players demonstrating high raw efficiency (Raw PIS $\ge 50.0$).
3. `Explosive Batter`: Strike Rate $\ge 140.0$, boundary run $\% \ge 50.0\%$, and balls faced $\ge 20$.
4. `Consistent Run Scorer`: Batting Average $\ge 25.0$, Innings $\ge 4$, runs per inning $\ge 18.0$.
5. `High-Impact Batter`: Boundary $\% \ge 55.0\%$, Strike Rate $\ge 130.0$, balls faced $\ge 30$.
6. `Reliable Finisher`: Batting Average $\ge 25.0$, Strike Rate $\ge 130.0$, Not Outs $\ge 2$, Innings $\ge 4$.
7. `Strike Bowler`: Bowling Strike Rate $\le 10.0$ balls/wkt, wickets $\ge 5$, legal balls $\ge 30$.
8. `Economical Bowler`: Economy Rate $\le 7.50$ RPO, legal balls $\ge 36$ (6.0 overs).
9. `Wicket-Taking Specialist`: Wickets per match $\ge 1.0$, total wickets $\ge 6$, legal balls $\ge 36$.
10. `Genuine All-round Contributor`: Meets two-way eligibility, runs $\ge 50$, wickets $\ge 4$, matches $\ge 5$.

