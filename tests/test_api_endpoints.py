import pytest
from fastapi.testclient import TestClient
from backend.main import app

@pytest.fixture(scope="module")
def client():
    return TestClient(app)

def test_api_overview(client):
    response = client.get("/api/overview")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert data["summary"]["total_matches"] == 27
    assert data["summary"]["total_players"] == 73
    assert data["summary"]["total_seasons"] == 3
    assert len(data["seasons"]) == 3
    assert data["summary"]["highest_run_scorer"]["runs"] > 0
    assert data["summary"]["highest_wicket_taker"]["wickets"] > 0

def test_api_players(client):
    response = client.get("/api/players")
    assert response.status_code == 200
    res = response.json()
    assert res["count"] == 73
    players = res["players"]
    assert len(players) == 73
    
    first = players[0]
    assert "player_id" in first
    assert "name" in first
    assert "ratings" in first
    assert "overall_rating" in first["ratings"]
    assert "valuation" in first

def test_api_player_detail(client):
    response = client.get("/api/players/EPL-P-001")
    assert response.status_code == 200
    p = response.json()
    assert p["player_id"] == "EPL-P-001"
    assert "career_batting" in p
    assert "career_bowling" in p
    assert "career_seasons" in p
    assert "season_breakdown" in p
    assert "similar_players" in p
    assert len(p["similar_players"]) > 0

def test_api_analytics_batting(client):
    response = client.get("/api/analytics/batting?sort_by=runs")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] > 0
    leaderboard = data["leaderboard"]
    # Sorted descending by runs
    assert leaderboard[0]["total_runs"] >= leaderboard[-1]["total_runs"]

def test_api_analytics_bowling(client):
    response = client.get("/api/analytics/bowling?sort_by=wickets")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] > 0
    leaderboard = data["leaderboard"]
    # Sorted descending by wickets
    assert leaderboard[0]["wickets"] >= leaderboard[-1]["wickets"]

def test_api_analytics_similar_groups(client):
    response = client.get("/api/analytics/similar-groups")
    assert response.status_code == 200
    data = response.json()
    assert data["total_groups"] == 7
    assert len(data["groups"]) == 7

def test_api_insights(client):
    response = client.get("/api/insights")
    assert response.status_code == 200
    data = response.json()
    assert data["total_insights"] == 16
    assert "categories" in data
    assert "all" in data
    assert len(data["all"]) == 16
    first = data["all"][0]
    assert "title" in first
    assert "short_explanation" in first
    assert "supporting_evidence" in first

def test_api_auction_players(client):
    response = client.get("/api/auction/players")
    assert response.status_code == 200
    res = response.json()
    assert res["count"] == 73
    pool = res["players"]
    assert len(pool) == 73
    first = pool[0]
    assert "category" in first
    assert "base_price" in first
    assert "estimated_valuation" in first

def test_api_auction_teams(client):
    response = client.get("/api/auction/teams")
    assert response.status_code == 200
    data = response.json()
    assert "teams" in data
    teams = data["teams"]
    assert len(teams) == 6
    for t in teams:
        assert "team_id" in t
        assert "owner_name" in t
        assert "purse_total" in t
        assert t["purse_total"] == 100.0

def test_api_seasons(client):
    response = client.get("/api/seasons")
    assert response.status_code == 200
    data = response.json()
    assert len(data["seasons"]) == 3

def test_api_teams(client):
    response = client.get("/api/teams")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] > 0

def test_api_admin_data_quality(client):
    response = client.get("/api/admin/data-quality")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert data["summary"]["total_matches"] == 27
    assert data["summary"]["clean_innings"] > 0
    assert "audits" in data
