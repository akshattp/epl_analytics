# EPL v2.0 Design System & Brand Guidelines

**Version:** `2.0.1-dev`  
**Foundational Typefaces:** Space Grotesk, Inter, JetBrains Mono  
**Brand Essence:** High-Precision Telemetry, Athletic Kinetic Power, Contemporary Sports Broadcasting  

---

## 1. Color System & Surface Tokens

### Light Theme: "Editorial Stadium Daylight"
* **Canvas / Surface 0**: `#F8FAFC` (Slate 50)
* **Surface 1 (Cards)**: `#FFFFFF` (Pure White) with border `#E2E8F0`
* **Surface 2 (Elevated)**: `#F1F5F9` (Slate 100)
* **Ink Primary**: `#101828` (Slate 950)
* **Ink Secondary**: `#64748B` (Slate 500)
* **Primary Brand Accent**: `#2563EB` (Electric Royal Blue)
* **Secondary Brand Accent**: `#0891B2` (Cyan 600)
* **Border Token**: `border-slate-200` (`#E2E8F0`)

### Dark Theme: "Night Match Atmosphere"
* **Canvas / Surface 0**: `#02000D` / `#0B1120` (Midnight Slate)
* **Surface 1 (Cards)**: `#101828` / `#151F32` with border `#1E293B`
* **Surface 2 (Elevated)**: `#1E293B`
* **Ink Primary**: `#F8FAFC` (Off-White)
* **Ink Secondary**: `#94A3B8` (Cool Gray)
* **Primary Brand Accent**: `#38BDF8` / `#2563EB` (Kinetic Sky / Electric Blue)
* **Secondary Brand Accent**: `#22D3EE` (Laser Cyan)
* **Border Token**: `border-slate-800` (`#1E293B` / `#334155`)

---

## 2. Typography Hierarchy

| Style Role | Font Family | Weight | Tracking | Recommended Use |
| :--- | :--- | :---: | :---: | :--- |
| **Hero Display** | Space Grotesk | 900 (Black) | `-0.03em` | Landing headlines, athlete hero titles |
| **Section Display** | Space Grotesk | 800 (Extrabold) | `-0.02em` | Section headers, card titles |
| **Data Numerals** | Space Grotesk / Mono | 700 / 800 | `normal` | Metric counters, milestone numbers |
| **Body & Labels** | Inter | 400 / 500 | `normal` | Explanations, table cells, descriptions |
| **Telemetry / Formulations** | JetBrains Mono | 600 / 700 | `tight` | IDs (`EPL-P-001`), formulas, timestamps |

---

## 3. Component Architecture & Principles

1. **Avoid Generic AI Clichés**:
   - Never use repetitive 3-column identical card rows without visual hierarchy.
   - Introduce deliberate asymmetry: pair wide dominant panels with stacked telemetry rails.
2. **Layered Depth**:
   - Subtle background kinetic lines and SVG trajectories that scroll at a distinct parallax offset.
   - Glassmorphic panels with `backdrop-blur-md` and 1px high-contrast borders.
3. **Motion with Purpose**:
   - Staggered entrances for list items (`staggerChildren: 0.1s`).
   - Springs over linear easing (`type: "spring", stiffness: 350, damping: 28`).
   - Tactile 3D page curl on theme toggle.
