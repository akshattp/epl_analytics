# EPL Platform Changelog

All notable changes to the Exotica Premier League (EPL) Historical Cricket Analytics & Live Auction Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.1-dev] - 2026-11-19 (Landing Page Reconstruction & Scroll-Driven Parallel Motion)

### Fixed
- **Hero Vertical Whitespace Defect (B2)**: Eliminated massive top gap pushing the headline down (`y: 391px`). Resolved container margin collapse and `min-h-[85vh]` flex spacing. Playwright visual test confirms headline now begins at `y: 159px` (tightly integrated at the top fold).
- **Hero Orphaned Loader Defect (B1)**: Removed solitary blue pulsing dot `<span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse">` that appeared as an unresolved loader above the headline. Replaced with structured static badge with `<Sparkles />` icon.
- **Landing Page Runs & Wickets Zero Bug**: Fixed critical data binding bug in `frontend/src/app/page.tsx` and `backend/services/player_service.py` where featured player cards displayed `0` for Career Runs and Wickets. Enriched `get_all_players_summary` to provide both flat properties (`total_runs`, `wickets`) and nested objects (`career_batting`, `career_bowling`). Added fallback coalition (`p.total_runs ?? p.career_batting?.total_runs ?? 0`).
- **Statistical Reconciliation**: Verified that all 73 canonical players have reconciled statistics between `/api/players`, `/api/players/{id}`, the directory, and the landing page.

### Added
- **Asymmetric Hero Architecture (B3)**: Reconstructed hero into a 12-column asymmetric grid:
  - **Left (7 cols)**: Editorial typography, Space Grotesk headline, format description, and 3 high-contrast action CTAs (Launch Terminal, Live Auction Room, Explore 73 Athlete Dossiers).
  - **Right (5 cols)**: High-impact dark glass Cricket Telemetry HUD displaying verified tournament records: 62/2 (Highest Innings Total, Exotica Warriors), Sagar Kapadia 138 Runs (All-Time Leader, 17 boundaries), Smeet Shah 3.57 Econ (Benchmark Restrictive Spell), and atomic concurrency telemetry.
- **GSAP Opposing-Direction Parallel Motion (`ParallelScrollColumns.tsx`)**: Implemented 3 independent vertical columns moving at distinct velocities tied to scroll progress via GSAP `ScrollTrigger` and `scrub: 1.2`:
  - Column 1: Ascends upward (`y: -140px`).
  - Column 2: Moves in opposite direction downward (`y: +120px`).
  - Column 3: Ascends at faster velocity (`y: -200px`).
- **GSAP Pinned Horizontal Scrolling Dossiers (`HorizontalScrollDossiers.tsx`)**: Vertical scroll drives smooth horizontal scrubbing across verified athlete cards with dynamic `scrollWidth` calculation, `gsap.context()` cleanup, and natural touch swiping fallback on mobile.
- **Asymmetric Competition Architecture**: Completely eliminated generic 3-box layouts, replacing Section 01 with an asymmetric split-screen showcasing 6-over high-leverage geometry, 36-ball dynamics, and an interactive 6-franchise team telemetry matrix.
- **Asymmetric Section Storytelling**: Redesigned all repetitive card sections with bespoke layouts (Batting Velocity Engine with 10+, 15+, 20+ milestone distribution + Bowling Dot-Ball Suppression).
- **Responsive Verification Across 6 Viewports**: Automated Playwright test captures screenshots across 1440px, 1280px, 1024px, 768px, 390px, and 375px.
- **Automated Documentation Governance**: Created `scripts/verify_documentation_governance.py` and instituted mandatory change-tracking rules.
- **Automated Regression Suite**: Added `tests/test_v2_0_1_governance_and_fixes.py` verifying non-zero runs/wickets, version governance, and 72/72 passing backend tests.

### Changed
- **Athlete Dossiers (`/players/[id]`)**: Deepened role-adaptive prominence (batting-first, bowling-first, dual-impact) and interactive match timeline filtering.
- **Brand Consistency**: Reinforced custom vector crest (`EplBrandLogo.tsx`) and polished 3D page-curl theme transition.

---

## [2.0.0] - 2026-11-19 (Signature Release)

### Added
- **Original Bespoke Brand Identity (`EplBrandLogo.tsx`)**: Created geometric vector cricket crest featuring three kinetic stump pillars, aerodynamic ribbons tracing 'EPL', dynamic ball seam sweep, and apex telemetry sensor.
- **3D Page-Curl Theme Transition (`PageCurlTransition.tsx`)**: Physics-based folded glossy page reveal when toggling light/dark themes without FOUC.
- **Desktop Magnetic Interactive Cursor (`CustomCursor.tsx`)**: Spring-lagged cursor with contextual `"VIEW"` badge expansion (dormant on mobile/touch).
- **Cinematic Landing Page (`/`)**: High-impact editorial hero with Space Grotesk typography, live telemetry counters, and preserved operational dashboard at `/dashboard`.
- **Athlete Performance Dossiers (`/players/[id]`)**: Transformed raw player profiles into athletic dossiers with custom monogram crests and 6-over milestone grid.

---

## [1.5.0] - 2026-11-19 (Historically Implemented — Reconstructed from Git commit 6e434ef)

### Added
- **Dual-Theme System**: Implemented full Light and Dark theme switching with CSS variables and localStorage persistence.
- **Typography Modernization**: Integrated Space Grotesk Google Font for headings and Inter for high-density data.
- **Electric Blue & Laser Cyan Palette**: Modernized color scheme replacing earlier brown/beige tones.

---

## [1.4.0] - 2026-11-19 (Historically Implemented — Reconstructed from Git commit c2a0b9a)

### Changed
- **Premium Dark UI Modernization**: Standardized dark sports intelligence theme across all 19 application routes with elevated card styling and high-contrast tables.

---

## [1.3.0] - 2026-11-19 (Confirmed Release)

### Added
- **100-Point EPL Player Intelligence Score (PIS)**: Multi-discipline rating suite calculating BIS, BoIS, AIS, CIS, and MIS.
- **6-Axis Dimensional Performance Radar**: Visual profiles for batting power, reliability, economy, penetration, impact, and consistency.
- **Tournament All-Time Records & Milestones Engine (`/analytics/records`)**: Top 10 individual scores, best bowling figures, highest partnerships, and most economical spells.
- **Micro-Situational Splits**: Separate tracking for setting targets (Innings 1) vs chasing totals (Innings 2), and bowling first vs defending totals.
- **Strict Overs Conversion**: Standardized overs conversion using legal deliveries (`balls // 6` and `balls % 6`).
- **Dynamic Missing Discipline Protection**: Specialist batsmen or bowlers are never penalized for missing disciplines.

---

## [1.2.0] - 2026-11-18 (Confirmed Release)

### Added
- **Unified Single-Tunnel Gateway**: Node.js gateway on port 8080 routing frontend and backend through a single public domain.
- **6-Team Live Auction Concurrency Rehearsal**: Multi-session automated simulation with zero database mutations.
- **Security Hardening**: Cryptographic role isolation, zero secret leakage in public payloads, and WebSocket locking.
- **Database Corruption & Recovery Runbook**: Verified zero-downtime database recovery procedures.

---

## [1.1.0] - 2026-11-18 (Confirmed Release)

### Added
- **Partnership Analytics**: Reconstructed 252 exact wicket-by-wicket partnerships across all 56 innings.
- **Fielding Analytics**: Extracted 163 canonical dismissals (catches, run-outs, stumpings).
- **EPL Intelligence Lab**: Combination finder for 2-player and 3-player franchise synergy.
- **Full Auction Setup Wizard**: 18 configurable auction parameters with squad size limits and purse controls.
- **Headless PDF Export Engine**: Server-side Playwright PDF exports for player dossiers and tournament reports.

---

## [1.0.2] - 2026-11-17 (Confirmed Release)

### Added
- **Auction Cryptographic Authentication**: PIN-based and token-based authentication for auctioneer and 6 team owners.
- **Market Scarcity Indicator**: Real-time unsold talent scarcity multiplier.
- **In-Memory AI Auction Simulator**: Risk-free dry-run auction engine.

---

## [1.0.1] - 2026-11-17 (Post-Audit Hardening)

### Fixed
- **Super Over Career Segregation**: Filtered regulation career statistics to strictly exclude Super Over runs and wickets.
- **Rating Engine Orthogonality**: Eliminated collinearity between volume and batting average.
- **Atomic Bid Recording**: Added `asyncio.Lock()` and SQLite persistence for auction bids.

---

## [1.0.0] - 2026-11-17 (Initial Baseline Delivery)

### Added
- **Historical Scorecard Parsing**: Ingestion of 27 CricHeroes match PDFs (2023, 2024, 2025).
- **Canonical Player Identity Resolution**: Disambiguation of 102 raw scorecard names into 73 canonical athletes.
- **Foundational Live Auction WebSocket Engine**: Multi-team bidding with purse limits.
