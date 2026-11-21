# EPL Current System Inventory & Architectural Topology

**Version:** `2.1-dev`  
**Date:** November 21, 2026  
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
* `backend/analytics/ranking_engine.py`: Four-Tier Independent Player Intelligence & Leaderboards Engine (BAT, BOWL, AR, OVERALL) with Bayesian small-sample shrinkage and empirical confidence grading.
* `backend/routers/rankings.py`: Independent leaderboard APIs (`/api/rankings/batting`, `/bowling`, `/allround`, `/overall`, `/player/{player_id}`).
* `backend/analytics/classification_engine.py`: Canonical Player Classification, Sample Gating, Statistical Confidence ($C_f$), Bayesian Shrinkage, and Tagging Engine.
* `backend/analytics/ratings_engine.py`: 100-Point PIS Suite (BIS, BoIS, AIS, CIS, MIS) with strict role assignment.
* `backend/services/player_service.py`: Service layer orchestrating database queries, career stats, and classification engine enrichment.
* `backend/routers/overview.py`: Tournament KPIs, champions, season totals.
* `backend/routers/players.py`: Player directory, full athlete profile, similar cohort lookup, and 73-player classification audit (`/api/players/classification-audit`).
* `backend/routers/analytics.py`: Batting, bowling, all-rounder leaderboards, tournament records.
* `backend/routers/insights.py`: 16 dynamic tournament insights with ground-truth verification.
* `backend/routers/teams.py`: 6 franchise head-to-head records and net run rate telemetry.
* `backend/routers/seasons.py`: Multi-year comparative analytics (2023–2025).
* `backend/routers/auction.py`: Live auction state machine, bids, WebSocket channel.
* `backend/routers/auction_setup.py`: 18-parameter auction configuration and team manager.
* `backend/routers/auth.py`: Token authentication for auctioneer, 6 franchise owners, and super_admin.
* `backend/routers/exports.py`: PDF, Excel, and CSV streaming exports.
* `backend/routers/version.py`: Centralized version and changelog registry.

---

## 3. Frontend Architecture (`Next.js 14 App Router` on Port 3000)

Total: **27 Compiled Routes**:
1. `/` — Reconstructed Cinematic Landing Page with Parallel Parallax
2. `/dashboard` — Preserved Operational Telemetry Terminal
3. `/players` — Filterable 73-Athlete Directory
4. `/players/[id]` — Signature Athlete Performance Dossier with 4-Tier Intelligence Card
5. `/rankings` — Four-Tier Independent Player Intelligence Leaderboards (BAT, BOWL, AR, OVERALL)
6. `/comparison` — Multi-Player Radar & Head-to-Head Comparison
7. `/similar-players` — Cosine Similarity Tactical Cohorts
8. `/analytics/batting` — Batting Velocity, Boundary % & Milestones
9. `/analytics/bowling` — Restrictive Bowling Economy & Dot-Ball Pressure
10. `/analytics/all-rounders` — Dual-Discipline Impact Index
11. `/analytics/records` — All-Time Tournament Records & Milestones
12. `/analytics/advanced` — Situational Splits, Phase Distributions
13. `/intelligence-lab` — 2/3 Player Franchise Combination Finder
14. `/insights` — 16 Verified Tournament Intelligence Insights
15. `/teams` — Franchise Standings & Telemetry
16. `/seasons` — 3-Season Historical Breakdown
17. `/auction` — Real-Time WebSocket Auction Terminal
18. `/auction-portal` — Dedicated Auction Intelligence Portal Redirect Hub
19. `/auction-portal/login` — Secured Authentication Terminal
20. `/auction-portal/owner/[teamId]` — Franchise Owner Command Center
21. `/auction-portal/auctioneer` — Auctioneer Lot Controller Terminal
22. `/auction-portal/admin` — Super Admin Auction Governance Console
23. `/auction-portal/live` — Synchronized Live Bidding Terminal
24. `/shortlists` — Franchise Private Bidding Board
25. `/admin` — Data Quality & Integrity Controls
26. `/changelog` — Complete Interactive Release History
27. `/_not-found` — 404 Handler

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

---

## 5. Verification & Governance Assets

* `documentation/PLAYER_CLASSIFICATION_AUDIT.md`: Complete 73-player ground-truth classification audit table and anomaly report.
* `documentation/screenshots/`: Responsive visual verification captures across 6 viewports.
* `scripts/verify_documentation_governance.py`: Automated documentation verification gate.
* `tests/`: 79 automated pytest test suites (100% passing across extraction, calculations, auction concurrency, and classification rules).
