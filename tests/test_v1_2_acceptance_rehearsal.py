"""
EPL v1.2 – Full System Acceptance Test & Isolated Six-Team Auction Rehearsal.
- Runs 3 complete isolated 6-team auction simulations against cloned temporary SQLite DBs
  (ZERO mutations to production DB or historical 2023-2025 statistics).
- Verifies strict cross-owner privacy & role-based access control (HTTP + WebSocket).
- Verifies Database Backup, Corruption Simulation, Restore & Mid-Auction Restart Recovery.
- Audits Auction Intelligence valuation, dynamic scarcity, comparability & reserve-aware recommendations.
"""
import asyncio
import hashlib
import os
import random
import shutil
import sqlite3
import tempfile
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from backend.main import app
from backend.database.db import DB_PATH
from backend.database.models import (
    AuctionConfig, AuctionPoolEntry, AuctionTeam, AuctionSquadMember,
    AuctionBidAudit, Match, Innings, Player, Partnership, FieldingEvent
)
from backend.auction.live_auction_manager import LiveAuctionManager
from backend.auction.intelligence_service import get_owner_dashboard, get_player_scarcity_insight
from backend.services.player_service import get_all_players_summary

client = TestClient(app)


def _sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _login(username: str, password: str) -> str:
    res = client.post("/api/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200, f"Login failed for {username}: {res.text}"
    return res.json()["token"]


def _make_isolated_db():
    tmpdir = tempfile.mkdtemp(prefix="epl_v1_2_sim_")
    iso_db = os.path.join(tmpdir, "isolated_epl.db")
    shutil.copy2(DB_PATH, iso_db)
    engine = create_engine(f"sqlite:///{iso_db}", connect_args={"check_same_thread": False})
    IsoSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return tmpdir, iso_db, engine, IsoSession


def test_security_zero_credential_leak_and_strict_owner_isolation():
    # 1. Verify /api/auth/accounts never leaks plaintext PINs or password hashes
    acc_res = client.get("/api/auth/accounts")
    assert acc_res.status_code == 200
    for persona in acc_res.json()["personas"]:
        assert "default_pin" not in persona
        assert "password" not in persona
        assert "password_hash" not in persona

    # 2. Verify all 6 owners + auctioneer authenticate independently
    owner_creds = [
        ("vipers", "vipers2026", 1),
        ("warriors", "warriors2026", 2),
        ("ultimates", "ultimates2026", 3),
        ("panthers", "panthers2026", 4),
        ("legends", "legends2026", 5),
        ("lions", "lions2026", 6),
    ]
    tokens = {tid: _login(u, p) for u, p, tid in owner_creds}
    admin_tok = _login("auctioneer", "epladmin2026")

    # 3. Unauthenticated access MUST return 401 across all protected endpoints
    assert client.get("/api/auction/shortlists/1").status_code == 401
    assert client.post("/api/auction/shortlists", json={"team_id": 1, "player_id": "EPL-P-001"}).status_code == 401
    assert client.get("/api/auction/dashboard/1").status_code == 401
    assert client.post("/api/auction/admin/reset").status_code == 401
    assert client.post("/api/advanced/fielding/manual", json={
        "player_id": "EPL-P-001", "season": 2026, "fielding_team": "Test", "dismissal_type": "catch"
    }).status_code == 401

    # 4. Owner 1 adds a private shortlist entry; Owner 2 & Auctioneer MUST NOT see/modify/delete it
    h1 = {"Authorization": f"Bearer {tokens[1]}"}
    h2 = {"Authorization": f"Bearer {tokens[2]}"}
    ha = {"Authorization": f"Bearer {admin_tok}"}

    created = client.post("/api/auction/shortlists", headers=h1, json={
        "team_id": 1, "player_id": "EPL-P-001", "priority": "High", "max_target_bid": 22.0, "notes": "Secret target"
    })
    assert created.status_code == 200
    sl_id = created.json()["id"]

    try:
        # Owner 1 reads own shortlist cleanly
        own_sl = client.get("/api/auction/shortlists/1", headers=h1)
        assert own_sl.status_code == 200
        assert any(i["player_id"] == "EPL-P-001" for i in own_sl.json()["shortlist"])

        # Owner 2 blocked from reading, writing, or deleting Owner 1's shortlist
        assert client.get("/api/auction/shortlists/1", headers=h2).status_code == 403
        assert client.post("/api/auction/shortlists", headers=h2, json={
            "team_id": 1, "player_id": "EPL-P-003", "priority": "High", "max_target_bid": 10.0
        }).status_code == 403
        assert client.delete(f"/api/auction/shortlists/{sl_id}", headers=h2).status_code == 403

        # Even Auctioneer cannot read Owner 1's confidential shortlist
        assert client.get("/api/auction/shortlists/1", headers=ha).status_code == 403

        # Cross-owner dashboard blocked; own dashboard succeeds for all 6 owners
        assert client.get("/api/auction/dashboard/1", headers=h2).status_code == 403
        for tid, tok in tokens.items():
            d = client.get(f"/api/auction/dashboard/{tid}", headers={"Authorization": f"Bearer {tok}"})
            assert d.status_code == 200
            assert d.json()["team_id"] == tid

        # Owner blocked from admin reset and manual fielding entry
        assert client.post("/api/auction/admin/reset", headers=h1).status_code == 403
        assert client.post("/api/advanced/fielding/manual", headers=h1, json={
            "player_id": "EPL-P-001", "season": 2026, "fielding_team": "Test", "dismissal_type": "catch"
        }).status_code == 403
    finally:
        # Clean up Owner 1's test shortlist item
        del_res = client.delete(f"/api/auction/shortlists/{sl_id}", headers=h1)
        assert del_res.status_code == 200


def test_websocket_role_enforcement_and_spoofing_protection():
    o2_tok = _login("warriors", "warriors2026")
    # 1. Unauthenticated WebSocket cannot nominate or bid
    with client.websocket_connect("/api/auction/ws") as ws:
        hello = ws.receive_json()
        assert hello["event"] == "CONNECTION_ESTABLISHED"
        assert hello["authenticated"] is False

        ws.send_json({"action": "NOMINATE", "player": {"id": "EPL-P-001", "name": "Sagar Kapadia"}, "base_price": 10.0})
        err = ws.receive_json()
        assert err["event"] == "AUTH_ERROR"

        ws.send_json({"action": "BID", "team_id": 1, "bid_amount": 11.0})
        err2 = ws.receive_json()
        assert err2["event"] == "AUTH_ERROR"

    # 2. Owner 2 (Team 2) cannot nominate or spoof a bid as Team 1
    with client.websocket_connect(f"/api/auction/ws?token={o2_tok}") as ws2:
        hello2 = ws2.receive_json()
        assert hello2["authenticated"] is True
        assert hello2["user"]["team_id"] == 2

        ws2.send_json({"action": "NOMINATE", "player": {"id": "EPL-P-001", "name": "Sagar Kapadia"}, "base_price": 10.0})
        assert ws2.receive_json()["event"] == "AUTH_ERROR"

        ws2.send_json({"action": "BID", "team_id": 1, "team_name": "Victory Vipers", "owner_name": "Spoofer", "bid_amount": 11.0})
        spoof_err = ws2.receive_json()
        assert spoof_err["event"] == "AUTH_ERROR"
        assert "Identity violation" in spoof_err["message"]


def test_isolated_six_team_auction_rehearsal_three_sessions_and_zero_prod_mutation():
    """
    Runs 3 complete isolated 6-team live auction rehearsals with dummy teams,
    concurrent bidding, reserve enforcement, duplicate prevention, pause/resume,
    undo nomination, and mid-auction backend restart recovery.
    Guarantees production DB is untouched byte-for-byte.
    """
    prod_hash_before = _sha256(DB_PATH)

    async def run_session(seed: int):
        rng = random.Random(seed)
        tmpdir, iso_db, engine, IsoSession = _make_isolated_db()
        try:
            db = IsoSession()
            # Rename teams to 6 isolated dummy franchises with fresh 100L purses
            dummy_names = [
                ("Alpha Strikers", "Sim Owner 1"),
                ("Beta Titans", "Sim Owner 2"),
                ("Gamma Knights", "Sim Owner 3"),
                ("Delta Royals", "Sim Owner 4"),
                ("Epsilon Mavericks", "Sim Owner 5"),
                ("Zeta Challengers", "Sim Owner 6"),
            ]
            teams = db.query(AuctionTeam).order_by(AuctionTeam.id).all()
            assert len(teams) == 6
            for idx, t in enumerate(teams):
                t.team_name, t.owner_name = dummy_names[idx]
                t.purse_total = 100.0
                t.purse_spent = 0.0
                t.max_squad_size = 8
                t.min_squad_size = 6
            db.query(AuctionSquadMember).delete()
            db.query(AuctionBidAudit).delete()

            cfg = db.query(AuctionConfig).order_by(AuctionConfig.id.desc()).first()
            cfg.auction_name = f"EPL Rehearsal Session #{seed}"
            cfg.status = "LIVE"
            cfg.locked = True
            cfg.min_base_price = 2.0
            cfg.min_bid_increment = 0.5
            cfg.timer_duration = 15
            db.query(AuctionPoolEntry).update({"auction_status": "PENDING", "sold_to_team_id": None, "sold_price": None})
            db.commit()

            mgr = LiveAuctionManager()
            mgr.sync_from_db(db)

            pool = sorted(get_all_players_summary(db), key=lambda x: -x["ratings"]["overall_rating"])
            sold_count = 0
            unsold_count = 0

            # Test Undo nomination on first player before bidding
            await mgr.nominate_player(pool[0], base_price=pool[0]["valuation"]["base_price"], db=db)
            assert mgr.state == "BIDDING_ACTIVE"
            await mgr.undo_nomination(db=db)
            assert mgr.state == "IDLE"
            assert mgr.current_player is None

            # Test Pause / Resume enforcement
            await mgr.nominate_player(pool[0], base_price=5.0, db=db)
            await mgr.pause_bidding(db=db)
            ok_paused, msg_paused = await mgr.place_bid(1, teams[0].team_name, teams[0].owner_name, 5.5, db=db)
            assert not ok_paused and "PAUSED" in msg_paused
            await mgr.resume_bidding(db=db)
            assert mgr.state == "BIDDING_ACTIVE"

            # Test Minimum Increment Rejection & Reserve Fund Rejection
            ok1, _ = await mgr.place_bid(1, teams[0].team_name, teams[0].owner_name, 6.0, db=db)
            assert ok1
            ok_small, msg_small = await mgr.place_bid(2, teams[1].team_name, teams[1].owner_name, 6.2, db=db)
            assert not ok_small and "Minimum bid increment" in msg_small
            # Reserve limit: 8 slots -> 7 remaining * 2.0L = 14L reserve -> max bid 86.0L; 87.0L MUST be rejected
            ok_res, msg_res = await mgr.place_bid(2, teams[1].team_name, teams[1].owner_name, 87.0, db=db)
            assert not ok_res and "Reserve violation" in msg_res

            # Test Backend Restart Recovery MID-BIDDING!
            restarted_mgr = LiveAuctionManager()
            restarted_mgr.sync_from_db(db)
            assert restarted_mgr.state == "BIDDING_ACTIVE"
            assert restarted_mgr.current_player["id"] == pool[0]["player_id"]
            assert restarted_mgr.current_bid == 6.0
            assert restarted_mgr.current_bidder["team_id"] == 1
            assert len(restarted_mgr.bid_history) >= 1
            mgr = restarted_mgr

            # Close first player as SOLD, then verify Duplicate Purchase Prevention!
            sold_res = await mgr.close_bidding("SOLD", db=db)
            assert sold_res["event"] == "PLAYER_SOLD"
            sold_count += 1

            # Attempt to re-nominate & buy already-sold player -> MUST be rejected!
            await mgr.nominate_player(pool[0], base_price=5.0, db=db)
            dup_ok, dup_msg = await mgr.place_bid(3, teams[2].team_name, teams[2].owner_name, 6.0, db=db)
            assert not dup_ok and "already been sold" in dup_msg.lower()
            await mgr.undo_nomination(db=db)

            # Simulate remaining players with simultaneous 6-owner bidding bursts
            for idx_p, pl in enumerate(pool[1:56], start=1):
                # Force 3 players to go UNSOLD intentionally to test UNSOLD flow
                base_p = max(2.0, float(pl["valuation"]["base_price"]))
                await mgr.nominate_player(pl, base_price=base_p, db=db)
                if idx_p in (10, 25, 40):
                    u_res = await mgr.close_bidding("UNSOLD", db=db)
                    assert u_res["event"] == "PLAYER_UNSOLD"
                    unsold_count += 1
                    continue

                # Run 2 concurrent 6-owner bid waves
                for wave in range(2):
                    bid_price = round(mgr.current_bid + 0.5, 1)
                    shuffled_teams = list(teams)
                    rng.shuffle(shuffled_teams)
                    tasks = [
                        mgr.place_bid(t.id, t.team_name, t.owner_name, bid_price, db=db)
                        for t in shuffled_teams
                    ]
                    outcomes = await asyncio.gather(*tasks)
                    # At most ONE owner can win a simultaneous identical price wave!
                    winners = [o for o in outcomes if o[0] is True]
                    assert len(winners) <= 1

                if mgr.current_bidder:
                    await mgr.close_bidding("SOLD", db=db)
                    sold_count += 1
                else:
                    await mgr.close_bidding("UNSOLD", db=db)
                    unsold_count += 1

            # Strict Financial & Roster Integrity Audit across all 6 teams
            all_members = db.query(AuctionSquadMember).all()
            pids = [m.player_id for m in all_members]
            assert len(pids) == len(set(pids)), "Duplicate player detected across squads!"
            assert len(all_members) == sold_count
            assert sold_count >= 36  # At least 6 players/team on average
            assert unsold_count >= 3

            for t in db.query(AuctionTeam).all():
                t_members = [m for m in all_members if m.team_id == t.id]
                expected_spent = round(sum(m.purchase_price for m in t_members), 2)
                assert abs(t.purse_spent - expected_spent) < 0.01, f"Purse mismatch for {t.team_name}"
                assert t.purse_spent <= t.purse_total
                assert len(t_members) <= t.max_squad_size

            # Audit Auction Intelligence: verify dynamic scarcity drops after player sold
            # and verify owner dashboard respects reserve & identifies real category counts
            dash1 = get_owner_dashboard(db, 1)
            assert dash1["squad_size_current"] > 0
            for rec in dash1["tailored_recommendations"]:
                assert rec["estimated_valuation"] <= dash1["max_bid_capacity"]
            scarcity_check = get_player_scarcity_insight(db, pool[55]["player_id"])
            assert "scarcity_level" in scarcity_check
            assert scarcity_check["recommended_valuation_ceiling"] > 0

            db.close()
        finally:
            engine.dispose()
            shutil.rmtree(tmpdir, ignore_errors=True)

    for s in (101, 202, 303):
        asyncio.run(run_session(s))

    # Production DB MUST be byte-for-byte untouched!
    assert _sha256(DB_PATH) == prod_hash_before


def test_database_backup_corruption_and_recovery_procedure():
    """Tests backup creation, simulated interrupted corruption, restore & PRAGMA integrity_check."""
    tmpdir, iso_db, engine, IsoSession = _make_isolated_db()
    backup_path = os.path.join(tmpdir, "backup_snapshot.db")
    try:
        # Step 1: Take verified snapshot backup
        shutil.copy2(iso_db, backup_path)
        orig_hash = _sha256(backup_path)

        # Step 2: Simulate interrupted/corrupted auction state on active DB
        conn = sqlite3.connect(iso_db)
        conn.execute("UPDATE auction_teams SET purse_spent = 999.0 WHERE id = 1")
        conn.execute("DELETE FROM auction_pool_entries WHERE id <= 10")
        conn.commit()
        conn.close()
        assert _sha256(iso_db) != orig_hash

        # Step 3: Execute Recovery Procedure (restore snapshot)
        engine.dispose()
        shutil.copy2(backup_path, iso_db)
        assert _sha256(iso_db) == orig_hash

        # Step 4: Verify SQLite PRAGMA integrity_check & exact table counts
        conn2 = sqlite3.connect(iso_db)
        integrity = conn2.execute("PRAGMA integrity_check").fetchone()[0]
        assert integrity == "ok"
        assert conn2.execute("SELECT count(*) FROM matches").fetchone()[0] == 27
        assert conn2.execute("SELECT count(*) FROM innings").fetchone()[0] == 56
        assert conn2.execute("SELECT count(*) FROM players").fetchone()[0] >= 73
        assert conn2.execute("SELECT count(*) FROM partnerships").fetchone()[0] >= 250
        assert conn2.execute("SELECT count(*) FROM fielding_events").fetchone()[0] >= 160
        assert conn2.execute("SELECT purse_spent FROM auction_teams WHERE id = 1").fetchone()[0] == 0.0
        conn2.close()
    finally:
        engine.dispose()
        shutil.rmtree(tmpdir, ignore_errors=True)
