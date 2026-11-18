# EPL Database Backup, Recovery & Disaster Management Guide

**Audience:** Tournament Administrators & Technical Operators  
**System:** SQLite Relational Database (`data/database/epl_analytics.db`)  
**Scope:** Hot Backups, Crash Recovery, Post-Crash State Restoration  

---

## 1. Automated & Manual Backup Protocols

### 1.1 Hot SQLite Backup (Safe While Server Is Running)
SQLite supports non-blocking online backups while transactions are active:

```bash
# Execute safe online SQLite backup
cd "/Users/akshat/Document/Coding Project/EPL-Stats"
sqlite3 data/database/epl_analytics.db ".backup 'data/database/epl_backup_$(date +%Y%m%d_%H%M%S).db'"
```

### 1.2 Mandatory Pre-Auction Snapshot Checklist
Before the live auction commences:
1. Ensure historical scorecards are intact (27 matches, 73 players).
2. Reset team purses to 100.0L using `POST /api/auction/admin/reset` if rehearsal bids were tested.
3. Take a clean pre-auction snapshot:
   ```bash
   cp data/database/epl_analytics.db data/database/epl_pre_auction_clean.db
   ```

---

## 2. Disaster Recovery Scenarios & Procedures

### Scenario A: Accidental Process Kill / Machine Power Loss Mid-Auction
* **Impact**: Active WebSocket connections drop. Ephemeral in-memory countdown timer resets.
* **Database State**: All completed `SOLD` transactions and accepted `AuctionBidAudit` records are already committed safely to disk due to SQLite ACID durability.
* **Recovery Procedure**:
  1. Restart backend: `uvicorn backend.main:app --host 0.0.0.0 --port 8000`.
  2. Restart frontend: `npm run dev -- -H 0.0.0.0 -p 3000`.
  3. Clients refresh browsers; active purses and acquired squad members automatically reload from the database.
  4. Auctioneer re-nominates the interrupted player and resumes bidding.

### Scenario B: Accidental Erroneous Sale / Premature Hammer Drop
* **Impact**: A player was marked `SOLD` to the wrong team or at an incorrect price.
* **Correction Procedure**:
  1. The auctioneer can delete the invalid squad entry via the Admin portal (`/admin`) or SQLite CLI:
     ```sql
     DELETE FROM auction_squad_members WHERE id = <invalid_id>;
     UPDATE auction_teams SET purse_spent = purse_spent - <price> WHERE id = <team_id>;
     ```
  2. Alternatively, re-nominate the player for a re-bid.

### Scenario C: Total Database Corruption
* **Recovery Procedure**:
  ```bash
  cd "/Users/akshat/Document/Coding Project/EPL-Stats"
  # Restore from verified backup snapshot
  cp data/database/epl_analytics_backup_pre_audit.db data/database/epl_analytics.db
  # Re-run automated verification test suite
  pytest -v
  ```

---

## 3. Post-Recovery Integrity Verification Checklist

After any restore operation, run the test suite to confirm 100% data integrity:
```bash
pytest tests/test_data_integrity.py tests/test_insights_recalculation.py -v
```
All tests must report **PASSED** before resuming tournament operations.
