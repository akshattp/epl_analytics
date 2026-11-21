# EPL Platform Changelog

All notable changes to the Exotica Premier League (EPL) Historical Cricket Analytics & Live Auction Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1-dev] - 2026-11-21 (Four-Tier Player Intelligence & Premium Auction Portal)

### Added
- **Four Independent Player Ranking Systems (`backend/analytics/ranking_engine.py` & `/api/rankings`)**:
  - **BAT Rankings (0–100)**: Evaluates pure batting metrics exclusively (Volume [25], Velocity [30], Reliability [25], Boundary% [10], Milestones [10]) with Bayesian shrinkage towards league median ($28.0$). Bowling has zero weight.
  - **BOWL Rankings (0–100)**: Evaluates pure bowling metrics exclusively (Wicket threat [35], Economy suppression [30], Dot-ball pressure [20], Spell consistency [15]) with Bayesian shrinkage towards league median ($28.0$). Batting has zero weight.
  - **AR Rankings (0–100)**: True all-rounder contribution leaderboard requiring strict qualification ($\ge 20$ runs, $\ge 18$ balls faced, $\ge 3$ wickets, $\ge 18$ legal balls, $\ge 3$ matches). Incorporates exposure weighting, balance ratio bonus (up to $+10.0$ pts), and same-match dual contribution bonus (up to $+8.0$ pts).
  - **OVERALL Rankings (0–100)**: Universal cross-discipline leaderboard encompassing all 73 canonical players with role-specific paths and empirical confidence damping.
  - **Empirical Confidence Metric**: Evaluated independently from score based on observations (`HIGH`, `MEDIUM`, `LOW`, `VERY LOW`).
- **Interactive Four-Tier Rankings UI (`/rankings`)**:
  - Four independent tabs (`OVERALL`, `BATTING`, `BOWLING`, `ALL-ROUND`) with sortable tables, rank indicators, score meters, and confidence badges.
  - Interactive drill-down expanding mathematical component breakdown per player.
  - Collapsible ineligible players registry stating specific exclusion reasons.
- **Dedicated Auction Intelligence Portal (`/auction-portal`)**:
  - Secure entry hub (`/auction-portal/login`) with glassmorphic obsidian styling and brand insignia.
  - Franchise Owner Command Center (`/auction-portal/owner/[teamId]`) with real-time purse monitor, acquired squad roster, 4-tier scouting tabs, and shortlist toggling.
  - Auctioneer Controller (`/auction-portal/auctioneer`) with player lot nomination, live bid stream, team purse status, and lot state declarations (`SOLD`, `UNSOLD`, `PAUSE`, `RESUME`).
  - Super Admin Governance Console (`/auction-portal/admin`) with full user account registry and emergency auction reset.
  - Shared Real-Time Live Bidding Terminal (`/auction-portal/live`) with WebSocket state synchronization, live athlete 4-tier dossier preview, current bid display, and franchise-authenticated bidding actions.
- **Player Profile 4-Tier Dossier Card (`/players/[id]`)**:
  - Added dedicated Four-Tier Independent Rankings section directly to athlete dossiers showing BAT, BOWL, AR, and OVERALL ranks, scores, confidence pills, and role paths.
- **Identity & Access Governance**:
  - Added `admin` account with `super_admin` role for tournament oversight.
  - Enhanced WebSocket verification guaranteeing team owners can only submit bids scoped to their own franchise ID.
- **Comprehensive Test Suite (`tests/test_ranking_engine.py`)**:
  - 11 comprehensive tests validating discipline isolation, small-sample shrinkage, eligibility rules, and API endpoints (full test suite passes 90/90).

---

## [2.0.1-dev] - 2026-11-19 (Luxury Creative Direction, 3D WebGL Cricket Scene & Website-Wide Visual Transformation)

### Added
- **Player Intelligence, Tagging & Classification Rule Engine (`backend/analytics/classification_engine.py`)**:
  - Independent Experience Categories: `Emerging` (1–2 matches), `Developing` (3–5), `Established` (6–9), `Proven` (10+).
  - Multi-tier Evidence & Eligibility Thresholds: Evaluates batting and bowling independently (`Established Evidence`, `Developing Evidence`, `Limited Sample`, `Did Not Bat`/`Did Not Bowl`).
  - Statistical Confidence Metric ($C_f \in [0.0, 1.0]$): Rated into `HIGH` ($\ge 0.70$), `MEDIUM` ($0.45 \le C_f < 0.70$), `LOW` ($0.25 \le C_f < 0.45$), `VERY LOW` ($< 0.25$).
  - Bayesian Shrinkage towards League Baseline ($\mu = 30.0$): Prevents single-match outliers with inflated strike rates from topping rankings.
  - 10 Controlled Vocabulary Performance Tags: `Limited Sample Size`, `Emerging Talent`, `Explosive Batter`, `Consistent Run Scorer`, `High-Impact Batter`, `Reliable Finisher`, `Strike Bowler`, `Economical Bowler`, `Wicket-Taking Specialist`, `Genuine All-round Contributor`.
  - Comprehensive 73-Player Classification Audit: Audited all 73 canonical players with zero anomalies (`/api/players/classification-audit` and `documentation/PLAYER_CLASSIFICATION_AUDIT.md`).
- **Bold Luxury Colour Identity**: Replaced generic blue/purple AI palettes with Obsidian (`#111318`), Warm Ivory (`#F1EBDD`), and Electric Vermilion (`#FF4B35`). Light and dark themes art-directed as two distinct editorial experiences.
- **Blender-Level 3D WebGL Cricket Scene (`Cricket3DScene.tsx`)**: Embedded Three.js (v187) 3D cricket match ball into the hero with procedural leather pores bump map, physically raised warm ivory seam (Torus geometry), 72 criss-cross cotton thread stitches, 3-point stadium lighting rig, cursor tracking with spring lerping, scroll scrubbing, and orbital motes.
- **Redesigned Brand Identity & Top Navigation (`EplBrandLogo.tsx` & `Navbar.tsx`)**: Geometric architectural cricket crest with interlocking wickets and vermilion trajectory arc; dynamic scroll-responsive compacting (`h-16` -> `h-14`), luxury pills with vermilion active dot indicators, and live auction CTA.
- **Website-Wide Luxury System Extension**: Fully extended the luxury obsidian, warm ivory, and electric vermilion design system across all 21 routes (`/players`, `/players/[id]`, `/dashboard`, `/teams`, `/comparison`, `/auction`).
- **Asymmetric Hero Architecture (B3)**: Reconstructed hero into a 12-column asymmetric grid:
  - **Left (7 cols)**: Editorial typography, Space Grotesk headline, format description, and 3 high-contrast action CTAs.
  - **Right (5 cols)**: 3D WebGL cricket match ball layered with real-time record telemetry cards (62/2 score, Sagar Kapadia 138 runs, Smeet Shah 3.57 econ).
- **GSAP Opposing-Direction Parallel Motion (`ParallelScrollColumns.tsx`)**: 3 independent vertical columns moving at distinct velocities tied to scroll progress via GSAP `ScrollTrigger` and `scrub: 1.2` (`y: -140px`, `y: +120px`, `y: -200px`).
- **GSAP Pinned Horizontal Scrolling Dossiers (`HorizontalScrollDossiers.tsx`)**: Vertical scroll drives smooth horizontal scrubbing across verified athlete cards with dynamic `scrollWidth` calculation and `gsap.context()` cleanup.
- **Automated Documentation Governance & Regression**: Created `scripts/verify_documentation_governance.py` and `tests/test_v2_0_1_governance_and_fixes.py` (72/72 backend tests passing, 21/21 routes compiling).

### Fixed
- **All-Rounder Over-Classification Defect**: Eliminated fall-through `else: primary_role = "All-rounder"` bug in `ratings_engine.py` that previously misclassified 37 players (50.7% of the league) as all-rounders; strict two-way evidence gating reduced this to 16 genuine all-rounders.
- **Sample-Size Ranking Bias**: Prevented low-sample players (e.g. Vikas Yadav, Yogesh Chandorkar, Shailesh Mali) from acquiring unearned consistency or all-rounder badges without requisite tournament sample sizes.
- **Hero Vertical Whitespace Defect (B2)**: Eliminated massive top gap pushing the headline down (`y: 391px`). Verified via Playwright automation: H1 begins at `y: 167px` (tightly integrated at top fold).
- **Hero Orphaned Loader Defect (B1)**: Removed solitary blue pulsing dot that appeared as an unresolved loader above the headline. Replaced with structured static badge with `<Sparkles />` icon.
- **Landing Page Runs & Wickets Zero Bug**: Fixed data binding bug in `frontend/src/app/page.tsx` and `backend/services/player_service.py` where featured player cards displayed `0` for Career Runs and Wickets. Enriched `get_all_players_summary` to provide both flat and nested properties with fallback coalition.
- **Statistical Reconciliation**: Verified all 73 canonical players have reconciled statistics across directory, detail pages, and landing page.

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
