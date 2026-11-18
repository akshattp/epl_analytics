# EPL Platform Engineering Changelog & Audit Corrections

**Release Version:** 1.0.1 (Post-Audit Hardening)  
**Date:** November 17, 2026  
**Auditor & Lead Engineer:** Principal Software Architect & QA Lead  

---

## 1. P0 Critical Corrections

### Fix P0-01: Auction Bidding Concurrency, Purse Limits & Atomic Persistence
* **Issue**:
  1. In `live_auction_manager.py`, `place_bid` checked only `bid_amount > current_bid`. Any user could place bids on behalf of any team exceeding their purse balance.
  2. Simultaneous bids had no concurrency serialization (`asyncio.Lock()`), risking race conditions in determining the winning bidder.
  3. When an item was marked `SOLD`, no records were written to `auction_squad_members` or `auction_bid_audits`, and no money was deducted from `auction_teams.purse_spent`.
* **Affected Files**:
  - `backend/auction/live_auction_manager.py`
  - `backend/routers/auction.py`
  - `tests/test_auction_concurrency.py`
* **Correction Implemented**:
  - Added `asyncio.Lock()` to `LiveAuctionManager` to serialize all incoming bids and state updates.
  - Added synchronous database validation in `place_bid`: validates team exists, checks `remaining_purse >= bid_amount`, verifies current squad count does not exceed `max_squad_size` (8), and checks minimum reserve funds:
    $$\text{Reserve Required} = (\text{Remaining Squad Slots} - 1) \times 2.0\text{L}$$
  - Logs every bid to `AuctionBidAudit` table in SQLite.
  - In `close_bidding("SOLD")`, atomically inserts the player into `AuctionSquadMember`, deducts `purse_spent` on `AuctionTeam`, and marks the winning bid in `AuctionBidAudit`.
* **Verification & Results**:
  - `tests/test_auction_concurrency.py` passes.
  - Unauthorized/over-budget bids are rejected with an informative `BID_REJECTED` event.

---

### Fix P0-02: Super Over Career Statistical Segregation
* **Issue**:
  - In `backend/services/player_service.py`, batting and bowling extractions aggregated `innings_type == "Super Over"` directly into career statistics.
  - Under official cricket rules (ICC, IPL, T20), Super Over statistics must not be mixed into standard career totals, averages, or strike rates.
  - This distorted Sagar Kapadia's career totals (138 runs vs 134 regular runs; 11 wickets vs 10 regular wickets).
* **Affected Files**:
  - `backend/services/player_service.py`
  - `tests/test_data_integrity.py`
* **Correction Implemented**:
  - Filtered `career_batting`, `career_bowling`, `ko_batting`, `ko_bowling`, and `season_breakdown` to strictly include `innings_type == "Regular"`.
  - Created dedicated `super_over_batting` and `super_over_bowling` profile attributes to retain complete Super Over statistics separately without polluting standard leaderboards.
* **Verification & Results**:
  - `test_super_over_separation` passes. Regular career stats represent verified regulation match performance.

---

## 2. P1 High Priority Corrections

### Fix P1-01: Rating Engine Orthogonality & Non-Participant Floor
* **Issue**:
  - In `backend/analytics/ratings_engine.py`, scoring volume and batting average components were collinear, effectively allocating 50% of raw batting points to runs per dismissal.
  - Knockout rating awarded 42.0 points to non-participants while a participant with 0 runs / 0 wickets in a high-pressure semifinal got 30.0 points.
  - For all-rounders, `all_rounder_rating` computed a harmonic mean, but `overall_rating` bypassed it and used flat arithmetic weighting ($0.40 \times \text{bat} + 0.40 \times \text{bowl}$).
* **Affected Files**:
  - `backend/analytics/ratings_engine.py`
  - `tests/test_cricket_analytics.py`
* **Correction Implemented**:
  - Replaced batting components with orthogonal metrics: Absolute Scoring Volume (25 pts), Strike Rate Velocity (40 pts), True Dismissal Resistance (20 pts), Boundary Percentage (15 pts).
  - Adjusted knockout fallback for non-participants to a discounted baseline ($0.25 \times (\text{bat} + \text{bowl})$), ensuring active playoff participants rank above non-qualifiers.
  - Directly incorporated `all_rounder_rating` into the overall rating calculation:
    $$R_{\text{Overall}} = 0.50 \times R_{\text{AR}} + 0.25 \times \max(R_{\text{Bat}}, R_{\text{Bowl}}) + 0.15 \times C_{\text{Idx}} + 0.10 \times R_{\text{KO}}$$
* **Verification & Results**:
  - `tests/test_cricket_analytics.py::test_ratings_and_valuation` passes. All ratings stay strictly within 0–100 with defensible mathematical foundations.

---

### Fix P1-02: Reconciliation of Historical Insight Narratives with SQL Ground Truth
* **Issue**:
  - The previous narrative report included hallucinated claims (e.g. *88/4 vs Spartans 11*, *Dabang 8*, *Ajay V 3.38 RPO*, *Smeet Shah 14 boundaries*, *5 wins each for TEAM VB & Exotica Warriors*).
* **Affected Files**:
  - `backend/analytics/tournament_intelligence.py`
  - `tests/test_insights_recalculation.py`
  - `documentation/tournament_insights_audit.md`
* **Correction Implemented**:
  - Recalculated all 16 claims directly from SQL ground truth:
    - Exotica Warriors: 4 wins (100% win rate); TEAM VB: 3 wins.
    - Smeet Shah: 3.57 RPO (most economical bowler with $\ge 30$ balls).
    - Sagar Kapadia: 138 total runs, 17 boundaries (all-time boundary leader).
    - Exotica Warriors: 62/2 (all-time highest team innings total).
    - ACER ASPIRE: 30 runs defended vs ACER SWIFT (24) in 2024 SF2 (lowest defended total).
    - Toss: Won 13 of 27 matches (48.1% win rate, no statistical toss advantage).
    - Chasing: Won 15 of 27 matches (55.6% win rate).
    - Boundaries: Doubled (+96.5%) from 3.11/match in 2023 to 6.11/match in 2025.
* **Verification & Results**:
  - `tests/test_insights_recalculation.py` passes 10 out of 10 tests.

---

## 3. P2 & P3 Corrections

### Fix P2-01: Expanded Test Suite
* Expanded test suite from 18 tests to **36 comprehensive automated tests** covering data extraction, Super Over handling, identity resolution, mathematical formulas, tournament insights, and auction concurrency.

### Fix P3-01: Documentation Transparency
* Updated documentation to clarify that the 7 tactical cohorts are rule-based filters evaluated with cosine similarity, avoiding ungrounded claims about ball-by-ball phases.
