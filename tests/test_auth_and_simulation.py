import pytest
from fastapi.testclient import TestClient
import sqlite3

from backend.main import app
from backend.database.db import SessionLocal
from backend.database.models import AuctionSquadMember, User

@pytest.fixture(scope="module")
def client():
    return TestClient(app)

def test_auth_login_auctioneer(client):
    res = client.post("/api/auth/login", json={"username": "auctioneer", "password": "epladmin2026"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert "token" in data
    assert data["user"]["role"] == "auctioneer"
    assert data["user"]["team_id"] is None

def test_auth_login_team_owner(client):
    res = client.post("/api/auth/login", json={"username": "vipers", "password": "vipers2026"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert "token" in data
    assert data["user"]["role"] == "team_owner"
    assert data["user"]["team_id"] == 1
    assert data["team"]["team_name"] == "Victory Vipers"
    assert data["team"]["purse_remaining"] == 100.0

def test_auth_invalid_password(client):
    res = client.post("/api/auth/login", json={"username": "vipers", "password": "wrongpassword"})
    assert res.status_code == 401
    assert "Invalid username or password" in res.json()["detail"]

def test_auth_me_endpoint(client):
    # Login first
    login_res = client.post("/api/auth/login", json={"username": "warriors", "password": "warriors2026"})
    token = login_res.json()["token"]

    # Call /me with token
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["user"]["username"] == "warriors"
    assert me_data["user"]["team_id"] == 2
    assert me_data["team"]["team_name"] == "Exotica Warriors"

def test_owner_dashboard_endpoint(client):
    # Unauthenticated request MUST be rejected
    unauth = client.get("/api/auction/dashboard/1")
    assert unauth.status_code == 401

    # Rival owner (Team 2) MUST be forbidden from reading Team 1 dashboard
    o2_tok = client.post("/api/auth/login", json={"username": "warriors", "password": "warriors2026"}).json()["token"]
    rival = client.get("/api/auction/dashboard/1", headers={"Authorization": f"Bearer {o2_tok}"})
    assert rival.status_code == 403

    # Team 1 owner accesses own dashboard cleanly
    o1_tok = client.post("/api/auth/login", json={"username": "vipers", "password": "vipers2026"}).json()["token"]
    res = client.get("/api/auction/dashboard/1", headers={"Authorization": f"Bearer {o1_tok}"})
    assert res.status_code == 200
    data = res.json()
    assert data["team_id"] == 1
    assert data["team_name"] == "Victory Vipers"
    assert "squad_strengths" in data
    assert "squad_weaknesses" in data
    assert "tailored_recommendations" in data
    assert "max_bid_capacity" in data
    assert data["max_bid_capacity"] > 0

def test_player_scarcity_endpoint(client):
    res = client.get("/api/auction/scarcity/EPL-P-001")
    assert res.status_code == 200
    data = res.json()
    assert data["player_id"] == "EPL-P-001"
    assert "scarcity_level" in data
    assert "recommended_valuation_ceiling" in data
    assert "unsold_tier_alternatives_count" in data

def test_simulation_zero_db_mutation(client):
    db = SessionLocal()
    initial_squad_count = db.query(AuctionSquadMember).count()
    db.close()

    sim_res = client.post("/api/auction/simulate")
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert sim_data["simulation_status"] == "COMPLETED"
    assert len(sim_data["teams"]) == 6
    assert sim_data["total_players_sold"] > 0

    # Verify zero database mutations
    db2 = SessionLocal()
    final_squad_count = db2.query(AuctionSquadMember).count()
    db2.close()
    assert final_squad_count == initial_squad_count
