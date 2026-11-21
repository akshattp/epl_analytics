import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.database.db import SessionLocal
from backend.services.player_service import get_all_players_summary, get_player_full_profile
from backend.analytics.classification_engine import (
    classify_player,
    evaluate_experience_level,
    evaluate_evidence_and_eligibility,
    calculate_statistical_confidence,
    evaluate_performance_tags,
    compute_bayesian_intelligence_suite
)

client = TestClient(app)

def test_experience_level_categories():
    assert evaluate_experience_level(1)["experience_level"] == "Emerging"
    assert evaluate_experience_level(2)["experience_level"] == "Emerging"
    assert evaluate_experience_level(3)["experience_level"] == "Developing"
    assert evaluate_experience_level(5)["experience_level"] == "Developing"
    assert evaluate_experience_level(6)["experience_level"] == "Established"
    assert evaluate_experience_level(9)["experience_level"] == "Established"
    assert evaluate_experience_level(10)["experience_level"] == "Proven"
    assert evaluate_experience_level(12)["experience_level"] == "Proven"

def test_evidence_and_eligibility_thresholds():
    # Low sample batter
    low_bat = evaluate_evidence_and_eligibility(
        matches=1,
        career_batting={"innings": 1, "total_runs": 2, "total_balls": 2},
        career_bowling={"legal_balls": 0, "wickets": 0}
    )
    assert low_bat["batting_evidence"] == "Limited Sample"
    assert low_bat["is_batting_eligible"] is False
    assert low_bat["bowling_evidence"] == "Did Not Bowl"
    assert low_bat["is_bowling_eligible"] is False
    assert low_bat["is_all_rounder_eligible"] is False

    # Eligible batter
    elig_bat = evaluate_evidence_and_eligibility(
        matches=6,
        career_batting={"innings": 6, "total_runs": 75, "total_balls": 45},
        career_bowling={"legal_balls": 0, "wickets": 0}
    )
    assert elig_bat["batting_evidence"] == "Established Evidence"
    assert elig_bat["is_batting_eligible"] is True

    # Low sample bowler
    low_bowl = evaluate_evidence_and_eligibility(
        matches=2,
        career_batting={"innings": 0, "total_runs": 0, "total_balls": 0},
        career_bowling={"legal_balls": 12, "wickets": 1}
    )
    assert low_bowl["bowling_evidence"] == "Limited Sample"
    assert low_bowl["is_bowling_eligible"] is False

    # Genuine two-way contributor
    true_ar = evaluate_evidence_and_eligibility(
        matches=10,
        career_batting={"innings": 8, "total_runs": 95, "total_balls": 65},
        career_bowling={"legal_balls": 48, "wickets": 7},
        both_disciplines_matches=6
    )
    assert true_ar["is_batting_eligible"] is True
    assert true_ar["is_bowling_eligible"] is True
    assert true_ar["is_all_rounder_eligible"] is True

def test_shailesh_mali_developing_not_false_consistency():
    db = SessionLocal()
    summaries = get_all_players_summary(db)
    db.close()
    
    mali = next((p for p in summaries if p["name"] == "Shailesh Mali"), None)
    assert mali is not None
    assert mali["matches"] == 3
    assert mali["experience_level"] == "Developing"
    assert mali["confidence_level"] == "MEDIUM"
    assert mali["primary_role"] == "Specialist Batsman"
    assert "Pure Batter" in mali["role_classification"] or "Specialist Batter" in mali["role_classification"]
    # Explosive rate from 32 balls is recognized
    assert "Explosive Batter" in mali["performance_tags"]
    # But cumulative consistency tags requiring >= 4 innings are NOT awarded
    assert "Consistent Run Scorer" not in mali["performance_tags"]
    assert "Reliable Finisher" not in mali["performance_tags"]

def test_yogesh_chandorkar_not_false_all_rounder():
    db = SessionLocal()
    summaries = get_all_players_summary(db)
    db.close()
    
    yogesh = next((p for p in summaries if p["name"] == "Yogesh Chandorkar"), None)
    assert yogesh is not None
    assert yogesh["matches"] == 3
    assert yogesh["experience_level"] == "Developing"
    # Not an all-rounder
    assert yogesh["primary_role"] != "All-rounder"
    assert "All-Rounder" not in yogesh["role_classification"]
    assert "Genuine All-round Contributor" not in yogesh["performance_tags"]
    # 18 balls is less than 24 balls needed for Economical Bowler tag
    assert "Economical Bowler" not in yogesh["performance_tags"]

def test_vikas_yadav_low_sample_safeguard():
    db = SessionLocal()
    summaries = get_all_players_summary(db)
    db.close()
    
    vikas = next((p for p in summaries if p["name"] == "Vikas Yadav"), None)
    assert vikas is not None
    assert vikas["matches"] == 1
    assert vikas["experience_level"] == "Emerging"
    assert vikas["confidence_level"] == "VERY LOW"
    assert vikas["batting_evidence"] == "Limited Sample"
    assert vikas["bowling_evidence"] == "Did Not Bowl"
    assert vikas["primary_role"] != "All-rounder"
    assert "Limited Sample Size" in vikas["performance_tags"]
    assert "Explosive Batter" not in vikas["performance_tags"]
    # Shrunk score should be close to baseline
    assert 25.0 <= vikas["player_intelligence"]["overall_player_intelligence_score"] <= 40.0

def test_sagar_kapadia_proven_all_rounder():
    db = SessionLocal()
    summaries = get_all_players_summary(db)
    db.close()
    
    sagar = next((p for p in summaries if p["name"] == "Sagar Kapadia"), None)
    assert sagar is not None
    assert sagar["matches"] == 12
    assert sagar["experience_level"] == "Proven"
    assert sagar["confidence_level"] == "HIGH"
    assert sagar["primary_role"] == "All-rounder"
    assert sagar["role_classification"] == "Balanced All-Rounder"
    assert "Genuine All-round Contributor" in sagar["performance_tags"]
    assert "Consistent Run Scorer" in sagar["performance_tags"]
    assert "Wicket-Taking Specialist" in sagar["performance_tags"]
    assert sagar["player_intelligence"]["overall_player_intelligence_score"] >= 75.0

def test_classification_audit_endpoint():
    res = client.get("/api/players/classification-audit")
    assert res.status_code == 200
    data = res.json()
    assert data["total_players"] == 73
    assert "summary" in data
    assert "flags" in data
    assert "audit_table" in data
    assert len(data["audit_table"]) == 73
    
    # Verify distributions
    exp_dist = data["summary"]["experience_distribution"]
    assert exp_dist["Proven"] == 9
    assert exp_dist["Established"] == 22
    assert exp_dist["Developing"] == 20
    assert exp_dist["Emerging"] == 22
    assert sum(exp_dist.values()) == 73
