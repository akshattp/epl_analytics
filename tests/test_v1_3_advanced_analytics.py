import pytest
import sqlite3
import os
from fastapi.testclient import TestClient

from backend.main import app
from backend.database.db import get_db
from backend.analytics.cricket_math import (
    overs_to_balls,
    balls_to_overs,
    format_overs,
    calculate_batting_metrics,
    calculate_bowling_metrics,
    calculate_situational_splits,
    calculate_all_rounder_metrics
)
from backend.analytics.player_intelligence import calculate_player_intelligence
from backend.services.player_service import get_player_full_profile, get_all_players_summary

client = TestClient(app)

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "database", "epl_analytics.db")

def test_cricket_overs_and_balls_conversions():
    """Verify exact cricket ball and over math (never treating overs as decimals)."""
    assert overs_to_balls(0.0) == 0
    assert overs_to_balls(1.0) == 6
    assert overs_to_balls(1.4) == 10
    assert overs_to_balls(2.0) == 12
    assert overs_to_balls(5.4) == 34
    assert overs_to_balls(6.0) == 36

    assert balls_to_overs(0) == 0.0
    assert balls_to_overs(6) == 1.0
    assert balls_to_overs(10) == 1.4
    assert balls_to_overs(12) == 2.0
    assert balls_to_overs(34) == 5.4
    assert balls_to_overs(36) == 6.0

    assert format_overs(10) == "1.4"
    assert format_overs(34) == "5.4"

def test_batting_metrics_undefeated_and_milestones():
    """Verify undefeated batting average, duck %, not-out %, and 6-over milestones."""
    innings = [
        {"match_id": 1, "runs": 24, "balls": 12, "fours": 3, "sixes": 1, "is_not_out": True},
        {"match_id": 2, "runs": 16, "balls": 10, "fours": 2, "sixes": 0, "is_not_out": False},
        {"match_id": 3, "runs": 0, "balls": 2, "fours": 0, "sixes": 0, "is_not_out": False},
    ]
    m = calculate_batting_metrics(innings)
    assert m["matches"] == 3
    assert m["innings"] == 3
    assert m["total_runs"] == 40
    assert m["total_balls"] == 24
    assert m["outs"] == 2
    assert m["not_outs"] == 1
    # Batting average = 40 / 2 = 20.0
    assert m["batting_average"] == 20.0
    assert m["average_display"] == "20.00"
    # Strike rate = (40 / 24) * 100 = 166.67
    assert m["strike_rate"] == 166.67
    # Ducks & Not outs
    assert m["duck_count"] == 1
    assert m["duck_percentage"] == 33.33
    assert m["not_out_percentage"] == 33.33
    # Milestones (10+, 15+, 20+)
    assert m["scores_10_plus"] == 2
    assert m["scores_15_plus"] == 2
    assert m["scores_20_plus"] == 1
    assert m["pct_20_plus"] == 33.3
    # Highest score
    assert m["highest_score"] == 24
    assert m["highest_score_not_out"] is True
    assert m["highest_score_display"] == "24*"
    # Boundary proportion: (3*4 + 1*6) + (2*4) = 18 + 8 = 26 runs
    assert m["boundary_runs"] == 26
    assert m["boundary_runs_percentage"] == 65.0
    # Explosiveness index > 0
    assert m["explosiveness_index"] > 50.0

def test_undefeated_batter_zero_outs_handling():
    """Verify that a batter with 0 dismissals is flagged as undefeated with None strict average."""
    innings = [
        {"match_id": 1, "runs": 25, "balls": 14, "fours": 3, "sixes": 0, "is_not_out": True},
        {"match_id": 2, "runs": 15, "balls": 8, "fours": 2, "sixes": 0, "is_not_out": True},
    ]
    m = calculate_batting_metrics(innings)
    assert m["outs"] == 0
    assert m["not_outs"] == 2
    assert m["is_undefeated"] is True
    assert m["batting_average_strict"] is None
    assert m["average_display"] == "40*"
    # Backward compatibility float
    assert m["batting_average"] == 40.0

def test_bowling_metrics_strict_economy_and_multi_wickets():
    """Verify economy uses legal deliveries strictly and zero wickets returns None average."""
    spells = [
        {"match_id": 1, "legal_balls": 12, "runs_conceded": 10, "wickets": 2, "maidens": 0, "dot_balls": 6, "fours_conceded": 1, "sixes_conceded": 0, "wides": 1, "no_balls": 0},
        {"match_id": 2, "legal_balls": 6, "runs_conceded": 8, "wickets": 0, "maidens": 0, "dot_balls": 2, "fours_conceded": 1, "sixes_conceded": 0, "wides": 0, "no_balls": 0},
    ]
    m = calculate_bowling_metrics(spells)
    assert m["matches"] == 2
    assert m["bowling_innings"] == 2
    assert m["legal_balls"] == 18
    assert m["overs"] == 3.0
    assert m["overs_display"] == "3.0"
    assert m["runs_conceded"] == 18
    assert m["wickets"] == 2
    # Economy = 18 runs / (18 / 6.0) = 6.00
    assert m["economy"] == 6.00
    # Bowling Average = 18 / 2 = 9.00
    assert m["bowling_average"] == 9.00
    # Bowling Strike Rate = 18 / 2 = 9.00
    assert m["bowling_strike_rate"] == 9.00
    # Multi-wicket spells
    assert m["two_plus_wickets"] == 1
    assert m["multi_wicket_frequency"] == 50.0

def test_bowling_zero_wickets_none_representation():
    """Verify that 0 wickets yields None for bowling average and bowling strike rate."""
    spells = [
        {"match_id": 1, "legal_balls": 12, "runs_conceded": 14, "wickets": 0, "maidens": 0, "dot_balls": 4, "fours_conceded": 2, "sixes_conceded": 0, "wides": 0, "no_balls": 0}
    ]
    m = calculate_bowling_metrics(spells)
    assert m["wickets"] == 0
    assert m["bowling_average"] is None
    assert m["bowling_strike_rate"] is None
    assert m["economy"] == 7.00

def test_situational_splits_calculation():
    """Verify chasing vs batting first calculations."""
    bat_records = [
        {"match_id": 1, "innings_number": 1, "runs": 20, "balls": 12, "fours": 2, "sixes": 0, "is_not_out": False},
        {"match_id": 2, "innings_number": 2, "runs": 30, "balls": 15, "fours": 4, "sixes": 0, "is_not_out": True},
    ]
    bowl_records = [
        {"match_id": 1, "innings_number": 1, "legal_balls": 12, "runs_conceded": 8, "wickets": 2, "maidens": 0, "dot_balls": 6, "fours_conceded": 1, "sixes_conceded": 0, "wides": 0, "no_balls": 0},
        {"match_id": 2, "innings_number": 2, "legal_balls": 6, "runs_conceded": 5, "wickets": 1, "maidens": 0, "dot_balls": 3, "fours_conceded": 0, "sixes_conceded": 0, "wides": 0, "no_balls": 0},
    ]
    splits = calculate_situational_splits(bat_records, bowl_records)
    assert splits["batting_first"]["total_runs"] == 20
    assert splits["chasing"]["total_runs"] == 30
    assert splits["chasing"]["highest_score_display"] == "30*"
    assert splits["bowling_first"]["wickets"] == 2
    assert splits["defending"]["wickets"] == 1

def test_all_rounder_metrics_and_role_classification():
    """Verify all-rounder participation, dual-discipline frequencies and role classification."""
    bat = [
        {"match_id": 1, "runs": 15, "balls": 10, "fours": 2, "sixes": 0},
        {"match_id": 2, "runs": 20, "balls": 12, "fours": 3, "sixes": 0},
    ]
    bowl = [
        {"match_id": 1, "legal_balls": 12, "runs_conceded": 8, "wickets": 1},
        {"match_id": 2, "legal_balls": 12, "runs_conceded": 10, "wickets": 2},
    ]
    ar = calculate_all_rounder_metrics(bat, bowl, total_matches=2)
    assert ar["both_disciplines_matches"] == 2
    assert ar["both_disciplines_pct"] == 100.0
    # Both matches had >= 10 runs AND >= 1 wicket
    assert ar["impact_all_rounder_matches"] == 2
    assert ar["impact_all_rounder_pct"] == 100.0
    assert ar["role_classification"] == "Balanced All-Rounder"

def test_player_intelligence_dynamic_missing_value_protection():
    """Verify pure batter is not penalized for never bowling and pure bowler not penalized for never batting."""
    # Pure Batter
    bat_stats = calculate_batting_metrics([
        {"match_id": 1, "runs": 30, "balls": 18, "fours": 4, "sixes": 0, "is_not_out": False},
        {"match_id": 2, "runs": 25, "balls": 15, "fours": 3, "sixes": 0, "is_not_out": True},
    ])
    bowl_stats = calculate_bowling_metrics([]) # 0 deliveries
    ar = {"role_classification": "Pure Batsman", "impact_all_rounder_pct": 0.0}
    
    pi_batter = calculate_player_intelligence(
        career_batting=bat_stats,
        career_bowling=bowl_stats,
        all_rounder_metrics=ar,
        matches_played=2
    )
    assert pi_batter["bowling_intelligence_score"] is None
    assert pi_batter["batting_intelligence_score"] > 40.0
    assert pi_batter["overall_player_intelligence_score"] > 35.0

    # Pure Bowler
    bowl_stats2 = calculate_bowling_metrics([
        {"match_id": 1, "legal_balls": 12, "runs_conceded": 6, "wickets": 2, "maidens": 0, "dot_balls": 7, "fours_conceded": 0, "sixes_conceded": 0, "wides": 0, "no_balls": 0},
        {"match_id": 2, "legal_balls": 12, "runs_conceded": 8, "wickets": 1, "maidens": 0, "dot_balls": 6, "fours_conceded": 1, "sixes_conceded": 0, "wides": 0, "no_balls": 0},
    ])
    bat_stats2 = calculate_batting_metrics([]) # 0 innings
    ar2 = {"role_classification": "Pure Bowler", "impact_all_rounder_pct": 0.0}

    pi_bowler = calculate_player_intelligence(
        career_batting=bat_stats2,
        career_bowling=bowl_stats2,
        all_rounder_metrics=ar2,
        matches_played=2
    )
    assert pi_bowler["batting_intelligence_score"] is None
    assert pi_bowler["bowling_intelligence_score"] > 40.0
    assert pi_bowler["overall_player_intelligence_score"] > 35.0

def test_super_over_exclusion_from_regulation_career():
    """Verify that Super Over performances are strictly excluded from regulation career batting and bowling."""
    db = next(get_db())
    # Find players who participated in the Super Over (Match: EPL-2025-EPL2025-SEMIFINAL1)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    so_players = c.execute("SELECT DISTINCT player_id FROM batting_scorecards WHERE innings_type = 'Super Over'").fetchall()
    assert len(so_players) > 0
    test_pid = so_players[0][0]
    
    prof = get_player_full_profile(db, test_pid)
    # Check that super over batting is segregated
    reg_runs = prof["career_batting"]["total_runs"]
    so_runs = prof["super_over_batting"]["total_runs"]
    
    # Combined runs from database
    total_db_runs = c.execute("SELECT sum(runs) FROM batting_scorecards WHERE player_id = ?", (test_pid,)).fetchone()[0] or 0
    assert reg_runs + so_runs == total_db_runs

def test_api_tournament_records_endpoint():
    """Verify /api/analytics/records returns all 6 milestone categories."""
    res = client.get("/api/analytics/records")
    assert res.status_code == 200
    data = res.json()
    assert "highest_individual_scores" in data
    assert "best_bowling_figures" in data
    assert "highest_partnerships" in data
    assert "fastest_twenties" in data
    assert "most_economical_spells" in data
    assert "highest_team_totals" in data

    # Verify top individual score is Akshat Panchal 41*
    top_score = data["highest_individual_scores"][0]
    assert top_score["runs"] == 41
    assert top_score["is_not_out"] is True
    assert top_score["display_score"] == "41*"
