# EPL Version 1.1 – Auction Setup & Complete Lifecycle Workflow

## 1. End-to-End Auction Lifecycle

EPL Version 1.1 introduces a structured, persistent 5-stage auction lifecycle replacing direct entry into an unconfigured live bidding screen:

```text
DRAFT ──► CONFIGURED ──► LIVE ◄──► PAUSED ──► COMPLETED
  │          │             │                     │
  │   Setup Wizard   Config Locked        Final Squads &
  │  (18 settings,   WebSocket Bidding    PDF/Excel Reports
  │   6 teams, pool) Atomic SQLite Commits
```

### Persisted Database Tables (Additive Migrations)
1. `auction_configs`: Stores all 18 configurable settings, lifecycle `status`, `locked` flag, and live pointer (`current_player_id`, `current_bid`, `current_bidder_team_id`) so restarting FastAPI recovers the exact auction state automatically via `LiveAuctionManager.sync_from_db()`.
2. `auction_pool_entries`: Links canonical `players.id` to configurable `category`, `base_price`, `is_available`, `is_returning`, `nomination_rank`, and live `auction_status` (`PENDING`, `NOMINATED`, `SOLD`, `UNSOLD`).
3. Additive columns on `auction_teams`: `min_squad_size`, `logo_text`, `role_requirements_json`.

---

## 2. Pre-Auction Setup Wizard (`/auction` → Tab 1)

Restricted to authenticated `auctioneer` role accounts (read-only preview for franchise owners & spectators):

1. **Step 01 – Auction Rules & Format (`PUT /api/auction/config`)**:
   - Configurable fields: Auction Name, Season/Year, Auction Date, Number of Teams, Initial Purse, Min Base Price, Min Bid Increment, Min Squad Size, Max Squad Size, Timer Duration, Categories, Unsold Player Rule, Retention Rule, Auction Format, Nomination Order.
2. **Step 02 – Six Franchise Configuration (`PUT /api/auction/teams/{team_id}`)**:
   - Editable defaults pre-seeded for all 6 EPL franchises (Victory Vipers, Exotica Warriors, The Ultimates, Exotica Panthers, Exotica Living Legenda, Exotica Lions Pride).
   - Editable Team Name, Owner Name, Logo Monogram, Purse Total, Min/Max Squad Size, and Role Requirements.
3. **Step 03 – Auction Player Pool & CSV Import (`GET/POST/PUT/DELETE /api/auction/pool`, `POST /api/auction/pool/import-csv`)**:
   - Displays all returning canonical players and newly registered uncapped players with matches, career stats, EPL rating, cohort, category, inline editable base price, and availability toggle.
   - Bulk CSV importer (`name,role,category,base_price,batting_hand`) matches existing canonical players by `normalized_name` so returning players are **never duplicated**.
4. **Step 04 – Pre-Auction Preview & Controlled Start (`GET /api/auction/preview`, `POST /api/auction/lifecycle/start`)**:
   - Summarizes total registered players, returning vs new counts, team count, combined purse, squad size bounds, pool sufficiency check, and category distribution.
   - Explicit confirmation modal (`confirm: true`) prevents accidental launches. Starting locks configuration (`locked = True`) and broadcasts `AUCTION_STARTED`.

---

## 3. Live Bidding Room & Security Controls (`/auction` → Tab 2)

- **Authentication**: PBKDF2-HMAC-SHA256 hashed credentials + 24-hour bearer session tokens passed via WebSocket query `?token=...`.
- **Role Enforcement**:
  - Only `auctioneer` can send `NOMINATE`, `PAUSE`, `RESUME`, `SET_TIMER`, `UNDO`, `SOLD`, `UNSOLD`, or `complete`.
  - Authenticated `team_owner` accounts can bid strictly for their assigned `team_id`.
- **Financial & Concurrency Guardrails**:
  - `asyncio.Lock()` serializes concurrent bids within the process; SQLite ACID transactions commit `AuctionSquadMember`, `AuctionBidAudit`, and `AuctionTeam.purse_spent`.
  - Reserve fund check: $\text{Remaining Purse} - \text{Bid} \ge (\text{Unfilled Slots} - 1) \times \text{Min Base Price}$.
  - Duplicate purchase prevention checks `auction_squad_members` before accepting any bid.
- **Next Player Queue & Restart Recovery**:
  - Sidebar displays upcoming `PENDING` players in rank order with one-click `Advance Next in Queue`.
  - FastAPI startup hook runs `auction_manager.sync_from_db(db)` to restore `PAUSED` or active `BIDDING_ACTIVE` rounds and bid history automatically after any server restart.

---

## 4. Auction Results & Export Reporting (`/auction` → Tab 4)

- Endpoint: `GET /api/auction/results`
- Reports final squads, total spend, remaining purse, average EPL rating, batting depth, bowling depth, all-rounder count, **Most Expensive Acquisition**, **Top Best-Value Purchases** (`estimated_valuation - purchase_price`), and Unsold Pool.
- Export buttons download multi-sheet **Excel** (`GET /api/exports/auction-results?format=xlsx`) and Chromium-rendered **PDF** (`GET /api/exports/auction-results?format=pdf`).
