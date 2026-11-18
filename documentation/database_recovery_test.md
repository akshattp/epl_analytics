# EPL v1.2 – Database Integrity, Backup & Disaster Recovery Test Report

**Audit Date:** November 18, 2026  
**Database Engine:** SQLite 3 (`data/database/epl_analytics.db`, 17 tables, 500 KB)

---

## 1. Pre-Acceptance Backups Verified on Disk

| Backup Artifact | Path | Size | Verification |
| :--- | :--- | :---: | :---: |
| Complete Project Source & Config Snapshot | `backups/epl_project_backup_pre_v1_2.tar.gz` | 16 MB | **VERIFIED** |
| Pre-v1.2 Standalone Database Snapshot | `data/database/epl_analytics_backup_pre_v1_2.db` | 500 KB | **VERIFIED** |
| Pre-v1.1 Database Snapshot | `data/database/epl_analytics_backup_pre_v1_1.db` | 340 KB | **VERIFIED** |
| Pre-Audit Historical Database Snapshot | `data/database/epl_analytics_backup_pre_audit.db` | 312 KB | **VERIFIED** |

---

## 2. Recovery & Consistency Test Matrix

| Test Scenario | Status | Execution Evidence |
| :--- | :---: | :--- |
| Automated backup snapshot & SHA-256 verification | **VERIFIED** | Snapshot hash matched source DB before fault injection. |
| Simulated mid-auction corruption & restore | **VERIFIED** | Injected erroneous `purse_spent = 999.0` and deleted 10 pool entries on isolated DB; restored from snapshot; SHA-256 restored identically and `PRAGMA integrity_check` returned `ok`. |
| Historical record preservation across recovery | **VERIFIED** | Exact verified counts post-recovery: 27 matches, 56 innings, 73 canonical players, 252 partnerships, 163 fielding events. |
| Interrupted live auction recovery (Backend restart) | **VERIFIED** | Destroyed in-memory `LiveAuctionManager` mid-bidding (`6.0L` leading bid on `EPL-P-001`); constructed fresh instance and ran `sync_from_db(db)` — exact player, bid, bidder, timer config, and `AuctionBidAudit` history restored. |
| Duplicate bid & duplicate purchase prevention | **VERIFIED** | Concurrent identical-price waves serialized by `asyncio.Lock()`; re-buying a player already in `auction_squad_members` blocked atomically. |
| ACID transaction consistency | **VERIFIED** | `SOLD` commits `AuctionSquadMember`, `AuctionBidAudit`, `AuctionPoolEntry`, and `AuctionTeam.purse_spent` in a single SQLAlchemy transaction with rollback on error. |
| WebSocket reconnection recovery | **VERIFIED** | Disconnected live Owner 1 socket; reconnected with Bearer token in `2.5 ms` receiving full `CONNECTION_ESTABLISHED` snapshot. |

---

## 3. Tournament-Day Operational Backup & Recovery Runbook

### Take Instant Hot Backup (Before & Mid-Auction)
```bash
cd "/Users/akshat/Document/Coding Project/EPL-Stats"
sqlite3 data/database/epl_analytics.db ".backup 'backups/epl_live_$(date +%Y%m%d_%H%M%S).db'"
```

### Recover After Unexpected Backend Crash / Power Loss
1. Restart FastAPI backend:
   ```bash
   cd "/Users/akshat/Document/Coding Project/EPL-Stats"
   "/Users/akshat/Document/Coding Project/venv/bin/uvicorn" backend.main:app --host 0.0.0.0 --port 8000
   ```
2. On startup, `recover_auction_state_on_startup()` automatically invokes `auction_manager.sync_from_db(db)` to restore active nomination, highest bid, leading franchise, and timer settings.
3. Connected browser clients automatically reconnect their WebSocket within 3 seconds and receive the restored `CONNECTION_ESTABLISHED` snapshot.

### Full Database Rollback (Only if Corruption Occurs)
```bash
# Stop uvicorn first, then restore the latest verified backup:
cp backups/epl_live_<TIMESTAMP>.db data/database/epl_analytics.db
sqlite3 data/database/epl_analytics.db "PRAGMA integrity_check;"
```
