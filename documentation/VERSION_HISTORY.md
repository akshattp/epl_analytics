# EPL Platform Version History & Evolutionary Lineage

**Current Version:** `2.0.1-dev` (Active Development)  
**Last Formally Released Version:** `2.0.0`  
**Last Previously Detailed Documented Version:** `1.3.0`  
**Governance Policy:** Non-negotiable permanent rule. Every change must be tracked and recorded.

---

## 1. Version Lineage Matrix

| Version | Status | Release Date | Provenance & Documentation Evidence | Key Focus Area |
| :--- | :--- | :---: | :--- | :--- |
| **`2.0.1-dev`** | Active Dev | 2026-11-19 | Active development sprint | Luxury Obsidian-Ivory-Vermilion palette, Three.js 3D WebGL cricket match ball, website-wide visual transformation, player intelligence & classification rule engine with Bayesian shrinkage, 73-player audit, and permanent documentation governance. |
| **`2.0.0`** | Released | 2026-11-19 | Confirmed (Git commit `ab69371`, `epl_v2_*.md`) | Custom brand mark, 3D page curl transition, magnetic cursor, athlete dossier profile. |
| **`1.5.0`** | Released | 2026-11-19 | Reconstructed from Git history (commit `6e434ef`) | Dual-theme system (Light/Dark), Space Grotesk typography, electric blue & cyan palette. |
| **`1.4.0`** | Released | 2026-11-19 | Reconstructed from Git history (commit `c2a0b9a`) | Dark sports intelligence modernization across all 19 application routes. |
| **`1.3.0`** | Released | 2026-11-19 | Confirmed (Previous detailed baseline) | Advanced cricket analytics, 100-pt PIS, situational splits, milestones, tournament records. |
| **`1.2.0`** | Released | 2026-11-18 | Confirmed (Git commit `267d08c`, acceptance tests) | Acceptance rehearsal, 6-team concurrency, zero credential leakage, single-tunnel gateway. |
| **`1.1.0`** | Released | 2026-11-18 | Confirmed (`version_1_1_release_notes.md`) | Partnerships, fielding events, exports, auction setup wizard, intelligence lab. |
| **`1.0.2`** | Released | 2026-11-17 | Confirmed (`phase2_verification.md`) | Cryptographic owner authentication, market scarcity indicator, auction simulation engine. |
| **`1.0.1`** | Released | 2026-11-17 | Confirmed (`changelog.md`) | Super Over segregation, rating engine orthogonality, atomic bid serialization. |
| **`1.0.0`** | Released | 2026-11-17 | Confirmed (`PROJECT_DOCUMENTATION.md`) | Initial PDF ingestion (27 matches), identity resolution (73 players), live auction room. |

---

## 2. Reconstructed Evolution (v1.3.0 to v2.0.0)

Between v1.3.0 and v2.0.0, the platform underwent significant front-end aesthetic transformations:

### Phase A: Premium Dark Theme Modernization (v1.4.0)
* *Provenance*: Reconstructed from Git commit `c2a0b9a` and `documentation/ui_ux_enhancement_report.md`.
* *Scope*: Transformed the previous light beige/brown UI into a modern dark sports dashboard. Introduced elevated dark cards, improved contrast ratios, and responsive table wrappers.

### Phase B: Global Dual-Theme Redesign (v1.5.0)
* *Provenance*: Reconstructed from Git commit `6e434ef` and `documentation/global_visual_redesign_report.md`.
* *Scope*: Replaced hardcoded dark styling with a centralized CSS custom variable theme system (`data-theme="dark"` / `data-theme="light"`). Integrated Space Grotesk Google Font for bold editorial display and Inter for body text. Replaced brown/peach palette with Electric Royal Blue (`#2563EB`) and Laser Cyan (`#0891B2`).

### Phase C: Signature Design Experience (v2.0.0)
* *Provenance*: Confirmed from Git commit `ab69371` and `documentation/epl_v2_*.md`.
* *Scope*: Replaced generic clipart with an original custom geometric vector brand mark (`EplBrandLogo.tsx`). Built a physics-based 3D Page-Curl transition originating from the Sun/Moon toggle. Created a desktop magnetic interactive cursor (`CustomCursor.tsx`). Introduced a cinematic landing page at `/` (preserving `/dashboard`) and transformed player profiles into athletic performance dossiers.

---

## 3. Current Sprint: v2.0.1-dev

* *Focus*:
  1. **Bold Luxury Colour Identity**: Transformed visual language around Obsidian (`#111318`), Warm Ivory (`#F1EBDD`), and Electric Vermilion (`#FF4B35`), art-directing light and dark themes as two distinct editorial experiences.
  2. **Blender-Level 3D WebGL Cricket Scene (`Cricket3DScene.tsx`)**: Created interactive Three.js 3D cricket match ball with procedural leather pores bump map, physically raised seam with 72 stitches, 3-point stadium lighting rig, and cursor tracking.
  3. **Website-Wide Luxury Transformation**: Extended the new palette, typography, hairline borders, and glassmorphism across `/players`, `/players/[id]`, `/dashboard`, `/teams`, `/comparison`, and `/auction`.
  4. **Landing Page Reconstruction & Parallel Motion**: 12-column asymmetric hero, GSAP opposing parallel columns, pinned horizontal dossiers, and resolution of Defect B2 (H1 vertical position verified at `y = 167px`).
  5. **Player Intelligence, Tagging & Classification Rule Engine**: Introduced independent experience tiers (`Emerging`, `Developing`, `Established`, `Proven`), independent evidence gating, statistical confidence scores, Bayesian shrinkage towards league baseline ($\mu=30.0$), 10 controlled vocabulary performance tags, and full 73-player audit.
  6. **Bug Resolution**: Fixed 0 runs/wickets data binding glitch on landing page and dossiers; fixed all-rounder fall-through overclassification bug (reduced from 37 to 16 genuine all-rounders).
  7. **Permanent Documentation Governance**: Created automated verification script enforcing documented change tracking across all 7 registers.
