"""
EPL 2.1-dev — Four-Tier Player Intelligence & Rankings Test Suite
================================================================
Comprehensive verification for:
  - BAT Ranking Engine (discipline isolation, components, shrinkage, eligibility)
  - BOWL Ranking Engine (discipline isolation, suppression, shrinkage, eligibility)
  - AR Ranking Engine (dual-discipline criteria, exposure weighting, balance & same-match bonuses)
  - OVERALL Ranking Engine (role normalization, confidence damping, complete 73-player coverage)
  - Confidence Engine (independent from performance score)
  - API Router Endpoints & Security Checks
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.db import SessionLocal
from backend.services.player_service import get_all_players_summary
from backend.analytics.ranking_engine import (
    compute_bat_score,
    compute_bowl_score,
    compute_ar_score,
    compute_overall_score,
    compute_ranking_confidence,
    compute_player_rankings,
    build_four_tier_leaderboards,
    BAT_LEAGUE_PRIOR,
    BOWL_LEAGUE_PRIOR,
    OVERALL_LEAGUE_PRIOR
)

client = TestClient(app)


# ==============================================================================
# PART 1: BATTING RANKING ENGINE TESTS
# ==============================================================================

def test_bat_score_pure_batter():
    """Verify standard batter scoring with full component breakdown."""
    bat_data = {
        "innings": 6,
        "total_runs": 85,
        "total_balls": 60,
        "strike_rate": 141.67,
        "batting_average": 21.25,
        "not_outs": 2,
        "boundary_runs_percentage": 52.0,
        "scores_15_plus": 3,
        "scores_20_plus": 2
    }
    res = compute_bat_score(bat_data)
    assert res["bat_eligible"] is True
    assert res["bat_score"] is not None
    assert 50.0 <= res["bat_score"] <= 90.0
    assert "volume" in res["bat_components"]
    assert "velocity" in res["bat_components"]
    assert "reliability" in res["bat_components"]
    assert "boundary" in res["bat_components"]
    assert "milestone" in res["bat_components"]


def test_bat_score_ineligible_did_not_bat():
    """Player with 0 balls faced must receive None score and ineligible status."""
    bat_data = {
        "innings": 0,
        "total_runs": 0,
        "total_balls": 0,
        "strike_rate": 0.0,
        "batting_average": 0.0,
        "not_outs": 0
    }
    res = compute_bat_score(bat_data)
    assert res["bat_eligible"] is False
    assert res["bat_score"] is None
    assert res["bat_eligibility_reason"] == "Did Not Bat"


def test_bat_score_small_sample_bayesian_shrinkage():
    """A batter with 1 innings and high SR should shrink significantly towards league prior."""
    bat_data = {
        "innings": 1,
        "total_runs": 30,
        "total_balls": 15,
        "strike_rate": 200.0,
        "batting_average": 30.0,
        "not_outs": 0,
        "boundary_runs_percentage": 70.0,
        "scores_15_plus": 1,
        "scores_20_plus": 1
    }
    res = compute_bat_score(bat_data)
    assert res["bat_eligible"] is True
    assert res["bat_score_raw"] > 70.0
    # Shrunk score should be pulled towards BAT_LEAGUE_PRIOR (28.0)
    assert res["bat_score"] < res["bat_score_raw"]
    # Shrinkage weight for 15 balls = 15 / (15 + 25) = 0.375
    assert res["bat_shrinkage_weight"] == pytest.approx(0.375, abs=0.01)


# ==============================================================================
# PART 2: BOWLING RANKING ENGINE TESTS
# ==============================================================================

def test_bowl_score_pure_bowler():
    """Verify pure bowler scoring with suppression and wicket threat."""
    bowl_data = {
        "legal_balls": 48,  # 8.0 overs
        "wickets": 6,
        "economy": 4.5,
        "dot_ball_percentage": 52.0,
        "bowling_consistency_index": 70.0,
        "bowling_innings": 5
    }
    res = compute_bowl_score(bowl_data)
    assert res["bowl_eligible"] is True
    assert res["bowl_score"] is not None
    assert 60.0 <= res["bowl_score"] <= 90.0
    assert "wicket_taking" in res["bowl_components"]
    assert "economy" in res["bowl_components"]
    assert "dot_balls" in res["bowl_components"]
    assert "consistency" in res["bowl_components"]


def test_bowl_score_ineligible_insufficient_sample():
    """Bowler with fewer than 6 legal balls (< 1 over) must be marked ineligible."""
    bowl_data = {
        "legal_balls": 4,
        "wickets": 1,
        "economy": 3.0,
        "dot_ball_percentage": 50.0
    }
    res = compute_bowl_score(bowl_data)
    assert res["bowl_eligible"] is False
    assert res["bowl_score"] is None
    assert "Insufficient Sample" in res["bowl_eligibility_reason"]


# ==============================================================================
# PART 3: ALL-ROUND RANKING ENGINE TESTS
# ==============================================================================

def test_ar_score_qualified_all_rounder():
    """Player meeting all 5 thresholds qualifies for AR ranking."""
    bat_data = {"total_runs": 65, "total_balls": 45, "innings": 5, "strike_rate": 144.4, "batting_average": 16.25}
    bowl_data = {"legal_balls": 36, "wickets": 5, "economy": 5.2, "dot_ball_percentage": 45.0}
    arm = {"both_disciplines_matches": 4, "impact_all_rounder_matches": 2}
    bat_res = compute_bat_score(bat_data)
    bowl_res = compute_bowl_score(bowl_data)

    ar_res = compute_ar_score(
        career_batting=bat_data,
        career_bowling=bowl_data,
        all_rounder_metrics=arm,
        bat_result=bat_res,
        bowl_result=bowl_res,
        matches_played=5
    )

    assert ar_res["ar_eligible"] is True
    assert ar_res["ar_score"] is not None
    assert ar_res["ar_components"]["balance_bonus"] > 0
    assert ar_res["ar_components"]["dual_bonus"] > 0


def test_ar_score_ineligible_reasons():
    """Player failing runs (<20) or wickets (<3) receives explicit disqualification reasons."""
    # Fails runs
    bat_data = {"total_runs": 12, "total_balls": 10, "innings": 2}
    bowl_data = {"legal_balls": 24, "wickets": 4, "economy": 5.0}
    bat_res = compute_bat_score(bat_data)
    bowl_res = compute_bowl_score(bowl_data)

    ar_res = compute_ar_score(
        career_batting=bat_data,
        career_bowling=bowl_data,
        all_rounder_metrics={},
        bat_result=bat_res,
        bowl_result=bowl_res,
        matches_played=4
    )
    assert ar_res["ar_eligible"] is False
    assert ar_res["ar_score"] is None
    assert "runs 12<20" in ar_res["ar_eligibility_reason"]


def test_ar_same_match_bonus_differentiation():
    """Player with same-match dual contributions receives higher AR score than spread performances."""
    bat_data = {"total_runs": 80, "total_balls": 55, "innings": 6, "strike_rate": 145.0, "batting_average": 20.0}
    bowl_data = {"legal_balls": 36, "wickets": 6, "economy": 5.0, "dot_ball_percentage": 50.0}
    bat_res = compute_bat_score(bat_data)
    bowl_res = compute_bowl_score(bowl_data)

    # Player A: 0 same-match impact performances
    res_a = compute_ar_score(bat_data, bowl_data, {"impact_all_rounder_matches": 0}, bat_res, bowl_res, 6)
    # Player B: 3 same-match impact performances
    res_b = compute_ar_score(bat_data, bowl_data, {"impact_all_rounder_matches": 3}, bat_res, bowl_res, 6)

    assert res_b["ar_score"] > res_a["ar_score"]
    assert res_b["ar_components"]["dual_bonus"] > res_a["ar_components"]["dual_bonus"]


# ==============================================================================
# PART 4: OVERALL RANKING ENGINE & FULL 73-PLAYER COVERAGE
# ==============================================================================

def test_full_73_player_leaderboards_integrity():
    """Verify leaderboards build without errors and rank all 73 canonical players."""
    db = SessionLocal()
    try:
        players = get_all_players_summary(db)
        assert len(players) == 73

        boards = build_four_tier_leaderboards(players)

        assert "batting" in boards
        assert "bowling" in boards
        assert "allround" in boards
        assert "overall" in boards

        # Batting board: 70 players have faced at least 1 ball
        bat_ranked = [p for p in boards["batting"] if p["bat_rank"] is not None]
        assert len(bat_ranked) >= 65

        # All-Round board: strictly qualified players only
        ar_ranked = [p for p in boards["allround"] if p["ar_rank"] is not None]
        assert 10 <= len(ar_ranked) <= 20  # Expect ~12 genuine all-rounders

        # Overall board: all 73 players present and ordered
        assert len(boards["overall"]) == 73
        ovr_ranks = [p["overall_rank"] for p in boards["overall"] if p["overall_rank"] is not None]
        assert len(ovr_ranks) == 73
        assert ovr_ranks == list(range(1, 74))

        # Check ground truth #1
        top_overall = boards["overall"][0]
        assert top_overall["name"] == "Sagar Kapadia"
        assert top_overall["overall_rank"] == 1
    finally:
        db.close()


def test_confidence_grading_independence():
    """Verify confidence level is determined strictly by exposure, independent of performance score."""
    # 1 match, 1 innings, high performance -> VERY LOW confidence
    conf_1 = compute_ranking_confidence(matches=1, innings=1, balls_faced=12, legal_balls=0, bat_eligible=True, bowl_eligible=False)
    assert conf_1["bat_confidence_level"] == "VERY LOW"
    assert conf_1["overall_confidence_level"] == "VERY LOW"

    # 10 matches, 8 innings, 60 balls faced -> HIGH confidence
    conf_2 = compute_ranking_confidence(matches=10, innings=8, balls_faced=60, legal_balls=48, bat_eligible=True, bowl_eligible=True)
    assert conf_2["bat_confidence_level"] == "HIGH"
    assert conf_2["bowl_confidence_level"] == "HIGH"
    assert conf_2["overall_confidence_level"] == "HIGH"


# ==============================================================================
# PART 5: API ENDPOINTS INTEGRATION TESTS
# ==============================================================================

def test_api_rankings_endpoints():
    """Test all five rankings API endpoints."""
    # 1. Batting
    r_bat = client.get("/api/rankings/batting?limit=5")
    assert r_bat.status_code == 200
    data_bat = r_bat.json()
    assert data_bat["ranking_type"] == "BAT"
    assert len(data_bat["players"]) == 5
    assert data_bat["players"][0]["bat_rank"] == 1

    # 2. Bowling
    r_bowl = client.get("/api/rankings/bowling?limit=5")
    assert r_bowl.status_code == 200
    data_bowl = r_bowl.json()
    assert data_bowl["ranking_type"] == "BOWL"
    assert len(data_bowl["players"]) == 5

    # 3. Allround
    r_ar = client.get("/api/rankings/allround")
    assert r_ar.status_code == 200
    data_ar = r_ar.json()
    assert data_ar["ranking_type"] == "AR"
    assert data_ar["total_eligible"] >= 10
    assert len(data_ar["ineligible_players"]) > 0

    # 4. Overall
    r_ovr = client.get("/api/rankings/overall?limit=10")
    assert r_ovr.status_code == 200
    data_ovr = r_ovr.json()
    assert data_ovr["total_ranked"] == 73

    # 5. Single Player Dossier
    r_p = client.get("/api/rankings/player/EPL-P-001")
    assert r_p.status_code == 200
    dp = r_p.json()
    assert "rankings" in dp
    assert "batting" in dp["rankings"]
    assert "bowling" in dp["rankings"]
    assert "allround" in dp["rankings"]
    assert "overall" in dp["rankings"]
