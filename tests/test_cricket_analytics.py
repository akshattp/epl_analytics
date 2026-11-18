import pytest
from backend.analytics.cricket_math import (
    overs_to_balls, balls_to_overs,
    calculate_batting_metrics, calculate_bowling_metrics
)
from backend.analytics.ratings_engine import calculate_player_ratings
from backend.auction.valuation_engine import calculate_player_valuation, determine_player_category
from backend.analytics.clustering_engine import PlayerSimilarityEngine
from backend.extraction.identity_resolver import IdentityResolver

def test_overs_conversion():
    # 5.4 overs = 5*6 + 4 = 34 balls
    assert overs_to_balls(5.4) == 34
    assert overs_to_balls(0.1) == 1
    assert overs_to_balls(1.0) == 6
    assert overs_to_balls(6.0) == 36
    
    # 34 balls = 5.4 overs
    assert balls_to_overs(34) == 5.4
    assert balls_to_overs(6) == 1.0
    assert balls_to_overs(36) == 6.0
    assert balls_to_overs(0) == 0.0

def test_batting_metrics_recalculation():
    # Recalculates from aggregate totals, never averaging averages!
    innings = [
        {"match_id": 1, "runs": 20, "balls": 15, "fours": 2, "sixes": 1, "is_not_out": False},
        {"match_id": 2, "runs": 30, "balls": 20, "fours": 4, "sixes": 0, "is_not_out": True},
    ]
    metrics = calculate_batting_metrics(innings)
    assert metrics["matches"] == 2
    assert metrics["innings"] == 2
    assert metrics["total_runs"] == 50
    assert metrics["total_balls"] == 35
    assert metrics["outs"] == 1
    assert metrics["not_outs"] == 1
    # Batting average = 50 / 1 = 50.0
    assert metrics["batting_average"] == 50.0
    # Strike rate = (50 / 35) * 100 = 142.86
    assert metrics["strike_rate"] == 142.86
    # Boundary runs = (2*4 + 1*6) + (4*4 + 0*6) = 14 + 16 = 30 runs
    assert metrics["boundary_runs"] == 30
    assert metrics["boundary_percentage"] == 60.0

def test_bowling_metrics():
    spells = [
        {"match_id": 1, "legal_balls": 12, "runs_conceded": 8, "wickets": 2, "maidens": 0, "dot_balls": 7, "fours_conceded": 1, "sixes_conceded": 0, "wides": 0, "no_balls": 0},
        {"match_id": 2, "legal_balls": 6, "runs_conceded": 4, "wickets": 1, "maidens": 0, "dot_balls": 3, "fours_conceded": 0, "sixes_conceded": 0, "wides": 0, "no_balls": 0},
    ]
    metrics = calculate_bowling_metrics(spells)
    assert metrics["matches"] == 2
    assert metrics["legal_balls"] == 18
    assert metrics["overs"] == 3.0
    assert metrics["runs_conceded"] == 12
    assert metrics["wickets"] == 3
    # Economy = (12 / 3.0) = 4.0
    assert metrics["economy"] == 4.0
    # Bowling average = 12 / 3 = 4.0
    assert metrics["bowling_average"] == 4.0
    # Bowling SR = 18 / 3 = 6.0
    assert metrics["bowling_strike_rate"] == 6.0
    # Dot ball % = (10 / 18) * 100 = 55.56
    assert metrics["dot_ball_percentage"] == 55.56

def test_identity_resolution():
    resolver = IdentityResolver()
    c1, id1, s1 = resolver.resolve("AMIT KAKKAD")
    c2, id2, s2 = resolver.resolve("Amit Kakkad")
    # Must resolve to the exact same player and ID
    assert c1 == "Amit Kakkad"
    assert c2 == "Amit Kakkad"
    assert id1 == id2
    assert s1 == "AUTO_RESOLVED"

    # Distinct players check
    _, id_sagar, _ = resolver.resolve("Sagar")
    _, id_sagar_kapadia, _ = resolver.resolve("Sagar Kapadia")
    assert id_sagar != id_sagar_kapadia

def test_ratings_and_valuation():
    bat_stats = {
        "innings": 5, "total_runs": 85, "strike_rate": 125.0,
        "batting_average": 28.33, "boundary_percentage": 52.0, "consistency_index": 72.0
    }
    bowl_stats = {
        "legal_balls": 30, "wickets": 6, "economy": 4.2,
        "dot_ball_percentage": 50.0, "two_plus_wickets": 1
    }
    ratings = calculate_player_ratings(bat_stats, bowl_stats, career_seasons=[2023, 2024, 2025])
    
    assert 0 <= ratings["batting_rating"] <= 100
    assert 0 <= ratings["bowling_rating"] <= 100
    assert 0 <= ratings["all_rounder_rating"] <= 100
    assert 0 <= ratings["overall_rating"] <= 100
    assert ratings["primary_role"] == "All-rounder"

    valuation = calculate_player_valuation(
        player_id="EPL-P-001",
        overall_rating=ratings["overall_rating"],
        primary_role=ratings["primary_role"],
        ratings=ratings
    )
    assert valuation["base_price"] > 0
    assert valuation["estimated_valuation"] >= valuation["base_price"]
    assert valuation["category"] in ["Marquee / Elite", "Tier 1 (High Impact)", "Tier 2 (Solid Core)"]

def test_similarity_cohorts():
    mock_players = [
        {
            "player_id": "P1", "name": "Power Batter", "innings": 4, "total_runs": 80,
            "strike_rate": 140.0, "batting_average": 26.6, "boundary_percentage": 65.0,
            "legal_balls": 6, "wickets": 0, "economy": 8.0, "dot_ball_percentage": 20.0,
            "ratings": {"batting_rating": 70.0, "bowling_rating": 10.0, "all_rounder_rating": 15.0, "overall_rating": 65.0, "knockout_rating": 60.0}
        },
        {
            "player_id": "P2", "name": "Explosive Opener", "innings": 5, "total_runs": 75,
            "strike_rate": 135.0, "batting_average": 25.0, "boundary_percentage": 60.0,
            "legal_balls": 0, "wickets": 0, "economy": 6.0, "dot_ball_percentage": 0.0,
            "ratings": {"batting_rating": 68.0, "bowling_rating": 0.0, "all_rounder_rating": 0.0, "overall_rating": 62.0, "knockout_rating": 55.0}
        }
    ]
    engine = PlayerSimilarityEngine(mock_players)
    groups = engine.generate_all_seven_groups()
    assert len(groups) == 7
    exp_group = next(g for g in groups if g["group_name"] == "Explosive Batters")
    assert len(exp_group["players"]) >= 1
