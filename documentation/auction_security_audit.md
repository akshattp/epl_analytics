# Live Auction Engine Security, Integrity & Concurrency Audit

**Date of Audit:** November 17, 2026  
**Auditor:** Principal Cybersecurity Engineer & Senior Backend Architect  
**Modules Audited:** `backend/auction/live_auction_manager.py`, `backend/routers/auction.py`  

---

## 1. Executive Summary of Security Findings

The auction module is the highest-concurrency component of the EPL platform, coordinating 6 franchise owners competing for 73 players with real-time financial purse constraints.

The audit uncovered **critical vulnerabilities (P0)** in the v1.0 implementation:
1. **Unauthenticated WebSocket Interface**: Any anonymous WebSocket client could inject arbitrary `BID` or `SOLD` commands.
2. **Missing Purse Limit & Reserve Fund Enforcement in Memory**: `LiveAuctionManager.place_bid()` verified only that `bid_amount > current_bid`. It did **not** check whether the bidding team had sufficient remaining purse, nor whether minimum reserve funds were preserved for remaining squad slots.
3. **Missing Database Persistence on Sale**: Calling `SOLD` broadcasted the event over the socket but did not persist the purchase to `auction_squad_members` or deduct the purse from `auction_teams`.
4. **Lack of Concurrency Lock**: Simultaneous bids could trigger race conditions in `current_bidder` state assignment.

---

## 2. In-Depth Vulnerability Assessment

### 2.1 Concurrency & Race Condition Vulnerability (CVE-EPL-001)
* **Vulnerability Class**: Thread/Coroutine Race Condition in Shared State.
* **Mechanism**: Two owners sending bids at $t_0$ (Team A: 12.0L) and $t_0 + 2\text{ms}$ (Team B: 12.5L). Without an `asyncio.Lock()`, both coroutines could interleave, leading to a state where Team A's lower bid is acknowledged last, recording an incorrect highest bidder.
* **Remediation**: Implemented an explicit `asyncio.Lock()` wrapping bid validation, state assignment, and audit logging.

### 2.2 Financial Purse Exhaustion Bypass (CVE-EPL-002)
* **Vulnerability Class**: Client-Side Trust / Missing Business Rule Validation.
* **Mechanism**: A client sending `{"action": "BID", "team_id": 1, "bid_amount": 95.0}` when Team 1 only had 40.0 Lakhs remaining was accepted because `place_bid` lacked database purse introspection.
* **Remediation**: Implemented atomic purse query and minimum reserve fund calculation:
  $$\text{Max Bid Allowed} = \text{Purse Remaining} - (\text{Required Remaining Slots} - 1) \times \text{Base Price Minimum (2.0L)}$$

### 2.3 State Machine Transition Integrity
* **Valid Transitions**:
  - `IDLE` $\rightarrow$ `NOMINATED` (Nominate player with base price)
  - `NOMINATED` $\rightarrow$ `BIDDING_ACTIVE` (Accept bids $\ge \text{base price}$)
  - `BIDDING_ACTIVE` $\rightarrow$ `SOLD` (Close round with winning team)
  - `BIDDING_ACTIVE` $\rightarrow$ `UNSOLD` (Close round with no valid bids)
  - `SOLD` / `UNSOLD` $\rightarrow$ `IDLE` (Reset for next player)
* **Invalid Transitions Blocked**:
  - Placing a bid when state is `IDLE` or `SOLD`.
  - Nominating a player while an active bid round is ongoing (`BIDDING_ACTIVE`).
  - Selling a player with no valid bids.

---

## 3. Mandatory Audit Trail & Event Schema

Every accepted bid is persisted with complete immutability to `auction_bid_audits`:
```json
{
  "bid_id": 1042,
  "player_id": "EPL-P-001",
  "team_id": 2,
  "team_name": "Exotica Warriors",
  "owner_name": "Aryan Shetty",
  "bid_amount": 14.5,
  "timestamp": "2026-11-17T19:18:22Z",
  "auction_state": "BIDDING_ACTIVE",
  "purse_remaining_after_bid": 85.5
}
```

---

## 4. WebSocket Hardening Implementation

To resolve these vulnerabilities, `backend/auction/live_auction_manager.py` and `backend/routers/auction.py` have been refactored to include:
1. `asyncio.Lock()` for atomic bid serialization.
2. Synchronous database session dependency injecting purse balance and reserve slot verification before accepting any bid.
3. Automated database commit to `auction_squad_members`, `auction_bid_audits`, and `auction_teams` upon closing a round as `SOLD`.
4. Role-based message parsing restricting `NOMINATE`, `SOLD`, and `UNSOLD` commands to authenticated auctioneers.
