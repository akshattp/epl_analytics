# EPL v1.2 – Isolated Six-Team Auction Rehearsal & Simulation Results

**Audit Date:** November 18, 2026  
**Test Module:** [test_v1_2_acceptance_rehearsal.py](file:///Users/akshat/Document/Coding%20Project/EPL-Stats/tests/test_v1_2_acceptance_rehearsal.py)  
**Environment:** Completely isolated temporary SQLite clones (`tempfile.mkdtemp`) with 6 dummy franchises (`Alpha Strikers`, `Beta Titans`, `Gamma Knights`, `Delta Royals`, `Epsilon Mavericks`, `Zeta Challengers`).  
**Production DB Preservation:** Verified via SHA-256 checksum before and after all 3 rehearsal sessions — **byte-for-byte identical (0 mutations to production DB or 2023–2025 historical statistics)**.

---

## 1. Rehearsal Acceptance Classification Matrix

| Auction Requirement | Status | Verification Evidence |
| :--- | :---: | :--- |
| Complete pre-auction setup & config lock | **VERIFIED** | 18-parameter config persisted in `auction_configs`; locked on confirmed `START AUCTION` (`PUT /config` rejected with `400` once `LIVE`). |
| Player nomination & queue management | **VERIFIED** | 56+ nominations per rehearsal session; `undo_nomination` cleanly resets state to `IDLE` and restores pool status to `PENDING`. |
| Simultaneous 6-owner concurrent bidding | **VERIFIED** | `asyncio.gather` concurrent bid waves from all 6 owners at identical price serialized strictly via `asyncio.Lock()`; at most 1 owner wins any identical price wave. |
| Minimum bid increment validation | **VERIFIED** | Bid of `6.2L` against `6.0L` (increment `0.5L`) rejected with `"Minimum bid increment is 0.5L"`. |
| Purse & maximum squad size limits | **VERIFIED** | Over-purse bids rejected; squads capped strictly at `max_squad_size = 8`. |
| Minimum squad reserve fund rule | **VERIFIED** | With 8 empty slots (`7` unfilled slots × `2.0L` = `14.0L` reserve), an `87.0L` bid against `100.0L` purse was rejected (`"Reserve violation"`). |
| `SOLD` & `UNSOLD` atomic transitions | **VERIFIED** | `SOLD` atomically commits `AuctionSquadMember`, `AuctionBidAudit`, `AuctionPoolEntry`, and `AuctionTeam.purse_spent`; `UNSOLD` marks pool status without deducting purse. |
| Duplicate purchase prevention | **VERIFIED** | Re-nominating and attempting to bid on an already-sold player (`EPL-P-001`) rejected with `"Player has already been sold to a franchise."` |
| Pause & Resume auctioneer controls | **VERIFIED** | Bids during `PAUSED` rejected (`"status: PAUSED"`); accepted immediately after `RESUME`. |
| Owner WebSocket disconnect & reconnect | **VERIFIED** | Live 7-socket benchmark disconnected Owner 1 and reconnected with valid session token in `2.5 ms` receiving full authenticated state snapshot. |
| Mid-auction backend restart recovery | **VERIFIED** | Destroyed in-memory `LiveAuctionManager` mid-bidding, instantiated fresh manager, ran `sync_from_db(db)` — exact player, current bid (`6.0L`), leading team (`Team 1`), and bid audit history recovered with zero loss. |
| Final squad & financial reconciliation | **VERIFIED** | Across all 3 independent rehearsal sessions (seeds `101`, `202`, `303`): `sum(squad.purchase_price) == team.purse_spent` within `0.01L` for all 6 teams; 0 duplicate players across squads. |
| Zero-mutation AI Mock Sandbox (UI & API) | **VERIFIED** | Fixed `BUG-UI-01` & `BUG-CALC-01` (`summary` key + `"Marquee / Elite"` tier matching); verified 0 DB mutations on `auction_squad_members` and clean UI rendering in Chromium. |

---

## 2. Auction Intelligence Logic Audit (Section 5)

| Intelligence Capability | Status | Audit Finding |
| :--- | :---: | :--- |
| Explainable player valuations | **VERIFIED** | Valuations trace deterministically to Bayesian 100-point rating, base price tier, scarcity multiplier, and transparent strengths/weaknesses arrays. |
| Dynamic player scarcity calculation | **VERIFIED** | `/api/auction/scarcity/{player_id}` dynamically queries live `auction_squad_members` to count remaining unsold peers of identical role & category; fixed `BUG-UI-02` field mismatch so Live Podium renders `scarcity_level`, `recommended_valuation_ceiling`, and `tactical_bidding_advice`. |
| Comparable players accuracy | **VERIFIED** | Cosine similarity over standardized historical features surfaces role- and output-matched substitutes. |
| Team weakness diagnostics | **VERIFIED** | Fixed `BUG-CALC-01` (`category_counts` now tracks actual EPL tiers `"Marquee / Elite"` through `"Uncapped / New"` instead of legacy Platinum/Gold labels); flags batting/bowling/all-rounder deficits accurately. |
| Purse & reserve-aware recommendations | **VERIFIED** | Verified in isolated rehearsals: every recommended target in `get_owner_dashboard` satisfies `estimated_valuation <= max_bid_capacity`, strictly respecting mandatory reserve funds for remaining unfilled slots. |
