# EPL Current System Inventory & Architectural Topology

**Version:** `2.0.1-dev`  
**Date:** November 19, 2026  
**Status:** Operational Production Baseline  

---

## 1. Ground-Truth Data Assets

* **Historical Source Archive**: `data/raw/EPL Data/`
  * 2023: 9 Match PDFs (M1 to M6, Semifinal 1, Semifinal 2, Final)
  * 2024: 9 Match PDFs (M1 to M6, Semifinal 1, Semifinal 2, Final)
  * 2025: 9 Match PDFs (M1 to M6, SemiFinal1, SemiFinal2, Final)
  * Total: **27 Verified CricHeroes Match Scorecards**
* **Active Production Database**: `data/database/epl_analytics.db` (SQLite 3)
  * Matches: 27
  * Innings: 56 (including Super Overs segregated into `innings_type == 'SUPER_OVER'`)
  * Canonical Players: 73 unique disambiguated athletes
  * Batting Scorecard Lines: 312
  * Bowling Scorecard Lines: 277
  * Partnerships: 252 wicket-by-wicket partnerships
  * Fielding Events: 163 canonical dismissals
  * Auction Teams: 6 franchise entries
  * Auction Pool Entries: 73 players

---

## 2. Backend Services & API Endpoints (`FastAPI` on Port 8000)

* `backend/main.py`: Entry point, CORS middleware, API route mounting.
* `backend/routers/overview.py`: Tournament KPIs, champions, season totals.
* `backend/routers/players.py`: Player directory, full athlete profile, similar cohort lookup.
* `backend/routers/analytics.py`: Batting, bowling, all-rounder leaderboards, tournament records.
* `backend/routers/insights.py`: 16 dynamic tournament insights with ground-truth verification.
* `backend/routers/teams.py`: 6 franchise head-to-head records and net run rate telemetry.
* `backend/routers/seasons.py`: Multi-year comparative analytics (2023–2025).
* `backend/routers/auction.py`: Live auction state machine, bids, WebSocket channel.
* `backend/routers/auction_setup.py`: 18-parameter auction configuration and team manager.
* `backend/routers/auth.py`: Token authentication for auctioneer and 6 franchise owners.
* `backend/routers/exports.py`: PDF, Excel, and CSV streaming exports.
* `backend/routers/version.py`: Centralized version and changelog registry.

---

## 3. Frontend Architecture (`Next.js 14 App Router` on Port 3000)

Total: **21 Compiled Routes**:
1. `/` — Reconstructed Cinematic Landing Page with Parallel Parallax
2. `/dashboard` — Preserved Operational Telemetry Terminal
3. `/players` — Filterable 73-Athlete Directory
4. `/players/[id]` — Signature Athlete Performance Dossier
5. `/comparison` — Multi-Player Radar & Head-to-Head Comparison
6. `/similar-players` — Cosine Similarity Tactical Cohorts
7. `/analytics/batting` — Batting Velocity, Boundary % & Milestones
8. `/analytics/bowling` — Restrictive Bowling Economy & Dot-Ball Pressure
9. `/analytics/all-rounders` — Dual-Discipline Impact Index
10. `/analytics/records` — All-Time Tournament Records & Milestones
11. `/analytics/advanced` — Situational Splits, Phase Distributions
12. `/intelligence-lab` — 2/3 Player Franchise Combination Finder
13. `/insights` — 16 Verified Tournament Intelligence Insights
14. `/teams` — Franchise Standings & Telemetry
15. `/seasons` — 3-Season Historical Breakdown
16. `/auction` — Real-Time WebSocket Auction Terminal
17. `/shortlists` — Franchise Private Bidding Board
18. `/admin` — Data Quality & Integrity Controls
19. `/changelog` — Complete Interactive Release History
20. `/_not-found` — 404 Handler
21. Root Metadata / Favicon (`/favicon.svg`)

---

## 4. Key Custom Frontend Components

* `EplBrandLogo.tsx`: Custom vector architectural geometric crest (interlocking wicket pillars, vermilion trajectory arc, apex diamond).
* `Cricket3DScene.tsx`: Custom Three.js 3D WebGL cricket match ball with procedural leather bump mapping, raised Torus seam, 72 cotton thread relief stitches, 3-point stadium lighting, interactive cursor spring lerping, scroll scrubbing, and IntersectionObserver auto-pausing.
* `PageCurlTransition.tsx`: 3D corner-fold glossy sheet theme transition with electric vermilion foil edge.
* `CustomCursor.tsx`: Desktop spring-follower cursor with electric vermilion aura and precision dot.
* `ParallelScrollColumns.tsx`: GSAP ScrollTrigger opposing-direction 3-column kinetic motion.
* `HorizontalScrollDossiers.tsx`: GSAP ScrollTrigger pinned horizontal scrolling athlete showcase.
* `AnimatedCounter.tsx`: Scroll-triggered high-performance numeric counter.
* `DataTable.tsx`: Accessible, sortable, paginated data table with hairline borders and sticky headers.
* `EplCharts.tsx`: Luxury-themed Recharts charts (Radar, Scatter, Progression, Comparison) driven by `EPL_PALETTE`.
* `StatCard.tsx`: Luxury telemetry KPI card with obsidian/ivory container, micro-meter bar, and hairline borders.
* `RatingBadge.tsx`: 100-Point PIS score badge with electric vermilion tier accents.
* `ExportButtonsBar.tsx`: Luxury-themed CSV/JSON/Print export action bar.
* `Navbar.tsx`: Header navigation with brand logo, scroll-responsive compacting (`h-16` -> `h-14`), glassmorphism blur, and electric vermilion dot active indicators.
