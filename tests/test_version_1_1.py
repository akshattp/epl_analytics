import io
import openpyxl
from fastapi.testclient import TestClient

from backend.main import app
from backend.database.db import SessionLocal
from backend.database.models import (
    Partnership, FieldingEvent, AuctionConfig, AuctionPoolEntry, Player
)
from backend.auction.live_auction_manager import LiveAuctionManager

client = TestClient(app)


def _login_auctioneer() -> str:
    res = client.post("/api/auth/login", json={"username": "auctioneer", "password": "epladmin2026"})
    assert res.status_code == 200
    return res.json()["token"]


def _login_owner() -> str:
    res = client.post("/api/auth/login", json={"username": "vipers", "password": "vipers2026"})
    assert res.status_code == 200
    return res.json()["token"]


def test_version_and_changelog_endpoints():
    v_res = client.get("/api/version")
    assert v_res.status_code == 200
    v_data = v_res.json()
    assert v_data["version"] in ["1.1.0", "1.3.0", "2.0.0", "2.0.1-dev", "2.1-dev"]
    assert v_data["changelog_url"] == "/changelog"

    c_res = client.get("/api/changelog")
    assert c_res.status_code == 200
    c_data = c_res.json()
    assert c_data["current_version"] in ["1.1.0", "1.3.0", "2.0.0", "2.0.1-dev", "2.1-dev"]
    assert len(c_data["releases"]) >= 4
    expected_cats = {
        "New Features",
        "Analytics Improvements",
        "Auction Improvements",
        "UI/UX Improvements",
        "Bug Fixes",
        "Security Improvements",
        "Performance Improvements",
    }
    assert expected_cats.issubset(set(c_data["categories"]))
    assert c_data["provenance_note"]


def test_v1_1_database_migrations_and_counts():
    db = SessionLocal()
    try:
        assert db.query(Player).count() >= 73
        assert db.query(Partnership).count() >= 250
        assert db.query(FieldingEvent).count() >= 160
        assert db.query(AuctionConfig).count() >= 1
        assert db.query(AuctionPoolEntry).count() >= 73
    finally:
        db.close()


def test_data_availability_matrix():
    res = client.get("/api/advanced/data-availability")
    assert res.status_code == 200
    matrix = res.json()["matrix"]
    assert len(matrix) >= 8
    valid_statuses = {
        "DIRECTLY AVAILABLE",
        "DERIVABLE FROM EXISTING DATA",
        "REQUIRES ADDITIONAL DATA",
        "NOT AVAILABLE",
    }
    for row in matrix:
        assert row["status"] in valid_statuses


def test_partnership_analytics_exact_reconciliation():
    res = client.get("/api/advanced/partnerships")
    assert res.status_code == 200
    data = res.json()
    assert data["total_partnerships"] >= 240
    assert data["summary"]["highest_runs"] == 50
    assert len(data["best_opening_partnerships"]) >= 5
    assert len(data["by_wicket"]) >= 5
    assert len(data["top_pairs"]) >= 10
    assert len(data["by_season"]) == 3


def test_fielding_analytics_canonical_extraction():
    res = client.get("/api/advanced/fielding")
    assert res.status_code == 200
    data = res.json()
    assert data["availability"] == "DIRECTLY AVAILABLE"
    assert data["total_fielding_events"] >= 160
    assert data["bowler_vs_fielder_attribution"]["bowler_credited_dismissals"] > 0
    assert data["bowler_vs_fielder_attribution"]["fielder_assisted_dismissals"] > 0
    top = data["leaderboard"][0]
    assert top["fielder_name"] == "Sagar Kapadia"
    assert top["total_dismissals"] == 12


def test_advanced_batting_and_bowling_dot_ball_honesty():
    bat_res = client.get("/api/advanced/batting")
    assert bat_res.status_code == 200
    bat_data = bat_res.json()
    assert "NOT AVAILABLE" in bat_data["dot_ball_status"]
    # Ensure batting dot-ball % is never fabricated
    for p in bat_data["players"][:10]:
        assert p["dot_ball_pct"] is None
        assert "boundary_runs_pct" in p
        assert "team_run_share_pct" in p

    bowl_res = client.get("/api/advanced/bowling")
    assert bowl_res.status_code == 200
    bowl_data = bowl_res.json()
    assert "DIRECTLY AVAILABLE" in bowl_data["dot_ball_status"]
    # Verify real bowling dot balls are present
    assert any(p["dot_ball_pct"] > 0 for p in bowl_data["players"])


def test_player_impact_model_and_disclaimer():
    res = client.get("/api/advanced/impact")
    assert res.status_code == 200
    data = res.json()
    assert "correlation" in data["methodology_disclaimer"].lower()
    assert len(data["players"]) >= 30


def test_intelligence_lab_combinations_and_discoveries():
    c2 = client.get("/api/intelligence-lab/combinations?size=2&min_matches=3")
    assert c2.status_code == 200
    d2 = c2.json()
    assert d2["combo_size"] == 2
    assert len(d2["combinations"]) > 0
    for row in d2["combinations"]:
        assert row["matches_together"] >= 3
        if row["matches_together"] < 4:
            assert "insufficient evidence" in row["reliability_note"].lower()

    c3 = client.get("/api/intelligence-lab/combinations?size=3&min_matches=3")
    assert c3.status_code == 200
    assert c3.json()["combo_size"] == 3

    disc = client.get("/api/intelligence-lab/discoveries")
    assert disc.status_code == 200
    dd = disc.json()
    assert len(dd["statistical_discoveries"]) >= 5
    assert "not" in dd["disclaimer"].lower() or "no finding" in dd["disclaimer"].lower()


def test_dynamic_chart_endpoints():
    ov = client.get("/api/advanced/charts/overview")
    assert ov.status_code == 200
    ovd = ov.json()
    assert len(ovd["season_trends"]) == 3
    assert len(ovd["toss_outcomes"]) == 2
    assert len(ovd["innings_outcomes"]) == 2

    pl = client.get("/api/advanced/charts/player/EPL-P-001")
    assert pl.status_code == 200
    pld = pl.json()
    assert len(pld["radar"]) == 6
    assert len(pld["season_progression"]) == 3

    tm = client.get("/api/advanced/charts/teams")
    assert tm.status_code == 200
    assert len(tm.json()["teams"]) >= 10


def test_filtered_player_exports_csv_excel_pdf():
    # Filtered CSV export
    csv_res = client.get("/api/exports/players?format=csv&role=All-rounder")
    assert csv_res.status_code == 200
    text = csv_res.content.decode("utf-8-sig")
    lines = [ln for ln in text.splitlines() if ln.strip()]
    assert len(lines) > 5
    assert "Player ID" in lines[0]
    assert "EPL Rtg" in lines[0]

    # Filtered Excel export
    xlsx_res = client.get("/api/exports/players?format=xlsx&role=All-rounder")
    assert xlsx_res.status_code == 200
    wb = openpyxl.load_workbook(io.BytesIO(xlsx_res.content))
    ws = wb.active
    assert ws.max_row >= 6

    # Filtered PDF export
    pdf_res = client.get("/api/exports/players?format=pdf&role=All-rounder")
    assert pdf_res.status_code == 200
    assert pdf_res.content.startswith(b"%PDF-")
    assert len(pdf_res.content) > 5000


def test_individual_player_profile_pdf_export():
    pdf_res = client.get("/api/exports/player/EPL-P-001/pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.content.startswith(b"%PDF-")
    assert len(pdf_res.content) > 10000


def test_auction_setup_lifecycle_permissions_and_restart_recovery():
    admin_token = _login_auctioneer()
    owner_token = _login_owner()
    admin_hdr = {"Authorization": f"Bearer {admin_token}"}
    owner_hdr = {"Authorization": f"Bearer {owner_token}"}

    # Ensure clean DRAFT start (authenticated as auctioneer)
    client.post("/api/auction/admin/reset", headers=admin_hdr)

    # Owner MUST be forbidden from modifying auction config
    forbid = client.put("/api/auction/config", headers=owner_hdr, json={"timer_duration": 20})
    assert forbid.status_code == 403

    # Auctioneer updates config
    upd = client.put(
        "/api/auction/config",
        headers=admin_hdr,
        json={"auction_name": "EPL 2026 Verified Auction", "timer_duration": 20, "min_bid_increment": 0.5}
    )
    assert upd.status_code == 200
    assert upd.json()["timer_duration"] == 20

    # Duplicate-safe CSV import of existing player Sagar Kapadia should NOT create a duplicate canonical player
    db = SessionLocal()
    before_players = db.query(Player).count()
    db.close()
    imp = client.post(
        "/api/auction/pool/import-csv",
        headers=admin_hdr,
        json={"csv_text": "name,role,category,base_price,batting_hand\nSagar Kapadia,All-rounder,Marquee / Elite,12.0,RHB\n"}
    )
    assert imp.status_code == 200
    assert imp.json()["updated"] >= 1
    db = SessionLocal()
    after_players = db.query(Player).count()
    db.close()
    assert after_players == before_players

    # Preview endpoint works
    prev = client.get("/api/auction/preview")
    assert prev.status_code == 200
    assert prev.json()["total_registered_players"] >= 73

    # Start without explicit confirm MUST fail
    bad_start = client.post("/api/auction/lifecycle/start", headers=admin_hdr, json={"confirm": False})
    assert bad_start.status_code == 400

    # Confirmed start locks config
    good_start = client.post("/api/auction/lifecycle/start", headers=admin_hdr, json={"confirm": True})
    assert good_start.status_code == 200
    assert good_start.json()["config"]["locked"] is True
    assert good_start.json()["config"]["status"] == "LIVE"

    # Attempting to edit locked config MUST fail
    locked_edit = client.put("/api/auction/config", headers=admin_hdr, json={"timer_duration": 30})
    assert locked_edit.status_code == 400

    # Pause & Resume lifecycle
    p_res = client.post("/api/auction/lifecycle/pause", headers=admin_hdr)
    assert p_res.status_code == 200
    assert p_res.json()["state"] == "PAUSED"

    # Simulate backend restart recovery via fresh LiveAuctionManager instance
    fresh_mgr = LiveAuctionManager()
    db = SessionLocal()
    try:
        fresh_mgr.sync_from_db(db)
        assert fresh_mgr.state == "PAUSED"
        assert fresh_mgr.timer_duration == 20
    finally:
        db.close()

    r_res = client.post("/api/auction/lifecycle/resume", headers=admin_hdr)
    assert r_res.status_code == 200

    # Auction Results & Exports (PDF + Excel)
    res_api = client.get("/api/auction/results")
    assert res_api.status_code == 200
    assert len(res_api.json()["teams"]) == 6

    res_xlsx = client.get("/api/exports/auction-results?format=xlsx")
    assert res_xlsx.status_code == 200
    wb = openpyxl.load_workbook(io.BytesIO(res_xlsx.content))
    assert "Team Summary" in wb.sheetnames

    res_pdf = client.get("/api/exports/auction-results?format=pdf")
    assert res_pdf.status_code == 200
    assert res_pdf.content.startswith(b"%PDF-")

    # Restore pristine clean DRAFT state after test
    client.post("/api/auction/admin/reset", headers=admin_hdr)
    client.put(
        "/api/auction/config",
        headers=admin_hdr,
        json={"auction_name": "EPL 2026 Official Player Auction", "timer_duration": 15}
    )
    client.post("/api/auction/admin/reset", headers=admin_hdr)
