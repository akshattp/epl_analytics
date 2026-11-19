# EPL v2.0 — BESPOKE BRAND IDENTITY & CREST SPECIFICATION

**Product**: EPL (Exotica Premier League) Historical Cricket Analytics & Live Auction Platform  
**Version**: 2.0.0 Signature Release  
**Status**: Official Brand Guidelines  
**Date**: November 19, 2026  
**Component Implementation**: `frontend/src/components/EplBrandLogo.tsx`  
**Favicon Asset**: `frontend/public/favicon.svg`  

---

## 1. Brand Concept & Semantic Architecture

The EPL brand mark was designed from the ground up to replace generic sports clipart with a sophisticated, original geometric vector identity. It integrates four core cricket and technological motifs into a unified dynamic emblem:

```
                  ▲ Precision Telemetry Sensor (Dot)
                 / \
                /   \
       Kinetic /     \ Kinetic
       Stumps |   ●   | Ball Seam
      Pillars |  EPL  | Trajectory
              |       |
               \     /
                \___/  Aerodynamic Ribbon Base
```

### Visual Metaphors:
1. **Three Kinetic Stump Pillars**: Vertical linear geometry representing the cricket stumps and stability, angled slightly forward to suggest kinetic forward momentum.
2. **Aerodynamic Ribbons Forming 'E-P-L'**: Interlocking curved paths that subtly trace the letterforms **E** (left wing), **P** (central loop), and **L** (right base).
3. **Dynamic Cricket Ball Seam Sweep**: A high-velocity elliptical arc wrapping through the center, symbolizing a swinging cricket ball in flight.
4. **Apex Precision Telemetry Dot**: A circular telemetry target at the crest's apex, referencing the algorithmic data intelligence driving the platform.

---

## 2. Logo Variants & Component API

The brand mark is implemented as a resolution-independent React SVG component in `frontend/src/components/EplBrandLogo.tsx`:

```tsx
<EplBrandLogo
  variant="full" | "monogram" | "icon" | "hero" | "horizontal"
  size="sm" | "md" | "lg" | "xl"
  animated?: boolean
  className?: string
/>
```

### Variant Matrix:
| Variant | Dimensions | Use Cases | Visual Composition |
| :--- | :--- | :--- | :--- |
| **`full`** | Adaptive | Primary navbar, report covers, footer | Vector crest + Space Grotesk "EPL" wordmark + "EXOTICA PREMIER LEAGUE" sub-label. |
| **`hero`** | 96px - 140px | Landing page hero stage, hero splash | Massive 3D layered crest with dual radial gradients, subtle glow halo, and animated pulse. |
| **`monogram`** | 40px - 64px | Athlete dossiers, mobile navbar, cards | Compact geometric shield highlighting the 'EPL' monogram ribbons. |
| **`icon`** | 24px - 32px | Browser favicon, mobile headers, table icons | Minimalist silhouette optimized for crisp rendering at 16px to 32px. |
| **`horizontal`** | 180px - 260px | Auction screen broadcast header, print banner | Horizontal lockup of icon left, uppercase title and descriptor right. |

---

## 3. Geometric Construction & Vector Specs

The vector mark is built on a `0 0 100 100` coordinate grid with mathematically balanced bezier curves:

```xml
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Primary Brand Linear Gradient -->
    <linearGradient id="eplBrandGradient" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#2563EB" />
      <stop offset="50%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#0891B2" />
    </linearGradient>

    <!-- Ambient Glow Radial Gradient -->
    <radialGradient id="eplGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#2563EB" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Ambient Glow -->
  <circle cx="50" cy="50" r="44" fill="url(#eplGlow)" />

  <!-- Kinetic Stump Pillars (Triple Bars) -->
  <rect x="36" y="24" width="5.5" height="42" rx="2.75" fill="url(#eplBrandGradient)" />
  <rect x="47.25" y="18" width="5.5" height="48" rx="2.75" fill="url(#eplBrandGradient)" />
  <rect x="58.5" y="24" width="5.5" height="42" rx="2.75" fill="url(#eplBrandGradient)" />

  <!-- Aerodynamic Seam Swoosh Arc -->
  <path d="M22 66C22 66 38 78 50 78C62 78 78 66 78 66" stroke="url(#eplBrandGradient)" stroke-width="4.5" stroke-linecap="round" />

  <!-- Ball Seam Trajectory Orbit -->
  <path d="M20 40C32 26 68 26 80 40C92 54 82 72 68 76" stroke="#38BDF8" stroke-width="2.5" stroke-dasharray="3 3" stroke-linecap="round" />

  <!-- Apex Precision Telemetry Sensor -->
  <circle cx="50" cy="14" r="4" fill="#38BDF8" />
</svg>
```

---

## 4. Favicon & Metadata Deployment

The favicon is saved at `frontend/public/favicon.svg` and linked directly in the root Next.js metadata within `frontend/src/app/layout.tsx`:

```tsx
export const metadata: Metadata = {
  title: "EPL — Exotica Premier League Analytics & Auction Platform",
  description: "Official historical cricket intelligence, Bayesian player ratings, and real-time live auction engine for EPL.",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};
```

This guarantees that browser tabs, desktop shortcuts, and mobile bookmarking instantly render the custom geometric EPL crest rather than default boilerplate icons.
