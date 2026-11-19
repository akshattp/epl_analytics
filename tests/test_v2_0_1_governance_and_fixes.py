import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.db import get_db, SessionLocal
from backend.services.player_service import get_all_players_summary, get_player_full_profile

client = TestClient(app)

def test_api_players_runs_and_wickets_populated_and_reconciled():
    """
    Regression Test for EPL 2.0.1 Bug: Runs and Wickets showing zero on landing page.
    Verifies that /api/players returns accurate non-zero career batting runs and bowling wickets
    for active tournament players, and that nested career_batting and career_bowling objects
    are present and reconciled with flat total_runs and wickets.
    """
    res = client.get("/api/players?sort_by=rating")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] == 73
    players = data["players"]
    assert len(players) == 73

    # Check Sagar Kapadia (EPL-P-001)
    sagar = next((p for p in players if p["player_id"] == "EPL-P-001"), None)
    assert sagar is not None
    assert sagar["total_runs"] == 134, "Sagar Kapadia must have 134 regulation career runs"
    assert sagar["wickets"] == 10, "Sagar Kapadia must have 10 regulation career wickets"
    assert sagar["career_batting"]["total_runs"] == 134
    assert sagar["career_bowling"]["wickets"] == 10
    assert sagar["career_batting"]["strike_rate"] > 100.0
    assert sagar["career_bowling"]["economy"] < 5.0

    # Verify that at least 40 players have total_runs > 0 and at least 30 have wickets > 0
    batters_with_runs = [p for p in players if p["total_runs"] > 0]
    bowlers_with_wkts = [p for p in players if p["wickets"] > 0]
    assert len(batters_with_runs) >= 40, f"Expected >= 40 batters with runs, got {len(batters_with_runs)}"
    assert len(bowlers_with_wkts) >= 30, f"Expected >= 30 bowlers with wickets, got {len(bowlers_with_wkts)}"

    # Verify reconciliation with individual player profile endpoint
    detail_res = client.get("/api/players/EPL-P-001")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["career_batting"]["total_runs"] == sagar["total_runs"]
    assert detail["career_bowling"]["wickets"] == sagar["wickets"]

def test_super_over_exclusion_consistency():
    """
    Verifies that Super Over numbers are strictly excluded from career_batting and career_bowling
    while preserved in super_over_batting and super_over_bowling.
    """
    db = SessionLocal()
    try:
        prof = get_player_full_profile(db, "EPL-P-001")
        assert prof is not None
        assert prof["career_batting"]["total_runs"] == 134
        assert prof["career_bowling"]["wickets"] == 10
        # Check super over segregation
        assert prof["super_over_batting"]["total_runs"] == 4
        assert prof["super_over_bowling"]["wickets"] == 1
    finally:
        db.close()

def test_version_governance_endpoint():
    """
    Verifies that /api/version returns version info reflecting v2.0.1 development status
    and properly registers historical releases up to 2.0.0 in /api/changelog.
    """
    res = client.get("/api/version")
    assert res.status_code == 200
    data = res.json()
    assert data["version"] == "2.0.1-dev"
    assert data["total_releases"] >= 8

    # Check changelog endpoint
    c_res = client.get("/api/changelog")
    assert c_res.status_code == 200
    c_data = c_res.json()
    assert "releases" in c_data
    versions = [r["version"] for r in c_data["releases"]]
    assert "1.3.0" in versions
    assert "2.0.0" in versions
    assert "2.0.1-dev" in versions
