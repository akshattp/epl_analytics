# EPL – Exotica Premier League
## Version 1.1.0 Release Notes & Changelog

**Release Version:** `1.1.0`  
**Release Date:** November 18, 2026  
**Codename:** *Advanced Analytics, Chromium Exports & Complete Auction Lifecycle*  
**Provenance Note:** No local `.git` history exists in the project directory; all version history from `v1.0.0` to `v1.1.0` has been verified directly against implemented source code, SQLite migrations, and documented audit reports.

---

## Summary of Version 1.1.0

Version 1.1.0 transforms EPL into three interconnected sports intelligence products while preserving the existing FastAPI + Next.js architecture, SQLite historical database, canonical player IDs, 100-point rating engine, cryptographic authentication, and five-colour brand system (`#02000D`, `#07203F`, `#EBDED4`, `#D9AA90`, `#A65E46`):

1. **Cricket Intelligence**: Exact wicket-by-wicket partnerships, canonical fielding dismissals, advanced batting & bowling metrics (verified bowling dot-ball %), player impact modeling, and the **EPL Intelligence Lab**.
2. **Player Auction Intelligence**: Filtered CSV/Excel/PDF exports, headless Chromium individual player PDF dossiers, shareable read-only public profile links, and visual analytics charts across every dashboard.
3. **Tournament Auction Management**: Complete 4-step Pre-Auction Setup Wizard (18 configurable parameters, team editor, player pool CRUD + duplicate-safe CSV import, pre-auction preview), explicit `START AUCTION` confirmation & config locking, Pause/Resume/Complete lifecycle, and Auction Results PDF/Excel reports.

---

## Categorized Changes

### New Features
- Added `/api/version`, `/api/changelog`, top navigation `v1.1.0` version indicator with unseen-release badge, and dedicated `/changelog` page.
- Added `/analytics/advanced` featuring Partnerships, Fielding Analytics (with admin manual entry), Advanced Batting, Advanced Bowling, Player Impact Model, and Data Availability Matrix.
- Added `/intelligence-lab` exploring 2-player & 3-player franchise combinations, winning patterns, recurring semifinal cores, consistent finalists, and 5 empirical tournament hypotheses.
- Added `/api/exports/players` (CSV, Excel `.xlsx`, Chromium PDF respecting active filters across the entire dataset), `/api/exports/player/{id}/pdf` (Playwright Chromium rendering of `/players/{id}?print=1`), and `/api/exports/auction-results` (PDF & Excel).
- Added Shareable Player Profile modal with stable `/players/EPL-P-XXX` URLs, read-only public mode (`?public=1`), and honest local-network/tunnel accessibility notice.
- Added 4-step Pre-Auction Setup Wizard, Next Player Queue, Pause/Resume/Complete lifecycle, and Post-Auction Results reporting on `/auction`.

### Analytics Improvements
- Recovered complete multi-line Fall of Wickets for 11 previously truncated innings directly from untouched source CricHeroes PDFs in `data/raw/EPL Data/`.
- Reconstructed **252 exact wicket-by-wicket partnerships** across all 56 innings (`partnerships` table).
- Extracted **163 canonical fielding dismissals** (37 catches/c&b, 93 direct & joint run-outs, 12 stumpings; 161/163 resolved to canonical Player IDs) into `fielding_events`.
- Exposed directly verified Bowling Dot-Ball % (827 dot balls across 277 spells) while transparently marking Batting Dot-Ball % as `NOT AVAILABLE` (never fabricated).
- Upgraded Player Comparison (`/comparison`) to support 2–4 players with normalized 0–100 Recharts Radar and Season Progression charts.

### Auction Improvements
- Added persistent `auction_configs` and `auction_pool_entries` tables so auction configuration, active nomination pointer, bid history, and lock state survive backend restarts via `LiveAuctionManager.sync_from_db()`.
- Added duplicate-safe CSV bulk player import matching existing canonical players by normalized name.
- Added Post-Auction Analytics highlighting Most Expensive Acquisition, Best-Value Purchases (vs historical valuation), squad depth metrics, and unsold pool.

### UI/UX Improvements
- Fixed critical CSS specificity bug in `frontend/src/app/globals.css` (`.table-editorial th { color: #07203F; }`) that rendered dark navy text on dark navy table headers.
- Built reusable `<DataTable>` component (`frontend/src/components/DataTable.tsx`) with opaque sticky `#07203F` headers, pinned first identifying column (`table-sticky-col`), wrapped/tooltip headings, sorting, search, pagination, and responsive horizontal scrolling across all application tables.
- Built shared Recharts visual system (`frontend/src/components/EplCharts.tsx`) strictly adhering to the 5 EPL brand colours with titles, metric definitions, axis labels, tooltips, empty states, and analytical interpretations across Overview, Player Profiles, Player Comparison, Teams, Advanced Analytics, and Intelligence Lab.

### Bug Fixes
- Added missing `import json` and `AuctionBidAudit` imports in `backend/routers/auction.py`.
- Aligned WebSocket event names (`NEW_HIGHEST_BID`, `TIMER_UPDATED`, `PLAYER_SOLD`, `AUCTION_PAUSED`, `AUCTION_RESUMED`) between `LiveAuctionManager` and `/auction`.
- Aligned `legal_balls`, `season_breakdown`, and `personas` response keys across backend analytics/export services and frontend pages.

### Security Improvements
- Restricted Auction Setup mutations, team edits, pool CRUD, CSV imports, manual fielding entries, and lifecycle start/pause/complete actions to authenticated `auctioneer` role tokens.
- Added read-only Public Profile mode (`?public=1`) ensuring no private shortlists, credentials, or administrative actions leak via shared links.

### Performance Improvements
- Persisted pre-computed `partnerships` and `fielding_events` in indexed SQLite tables rather than re-parsing PDFs per request.

---

## Previous Releases Summary
- **v1.0.2 (2026-11-17)**: PBKDF2-HMAC-SHA256 authentication, 24-hr bearer tokens, WebSocket auth, Owner Dashboard API, Market Scarcity Index, Zero-Mutation AI Auction Simulator (43 tests).
- **v1.0.1 (2026-11-17)**: Phase 1 technical audit, Super Over segregation, orthogonal Bayesian ratings, dynamic recalculation of all 16 tournament insights, atomic bid locking (36 tests).
- **v1.0.0 (2026-11-17, estimated)**: Initial 27-PDF ingestion, 73 canonical players, 14-page Next.js platform, 5-colour design system (18 tests).
