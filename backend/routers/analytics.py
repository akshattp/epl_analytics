from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from backend.database.db import get_db
from backend.services.player_service import get_all_players_summary, get_player_full_profile
from backend.analytics.clustering_engine import PlayerSimilarityEngine

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/batting")
def get_batting_analytics(
    min_innings: int = 1,
    season: Optional[int] = None,
    sort_by: str = "runs", # runs, strike_rate, batting_average, boundary_pct
    db: Session = Depends(get_db)
):
    players = get_all_players_summary(db)
    filtered = [p for p in players if p["innings"] >= min_innings]
    if season:
        filtered = [p for p in filtered if season in p["seasons"]]

    def sort_key(p):
        if sort_by == "strike_rate": return p["strike_rate"]
        elif sort_by == "batting_average": return p["batting_average"]
        elif sort_by == "boundary_pct": return p["boundary_percentage"]
        elif sort_by == "rating": return p["ratings"]["batting_rating"]
        else: return p["total_runs"]

    filtered.sort(key=sort_key, reverse=True)
    return {
        "count": len(filtered),
        "leaderboard": filtered
    }

@router.get("/bowling")
def get_bowling_analytics(
    min_balls: int = 6,
    season: Optional[int] = None,
    sort_by: str = "wickets", # wickets, economy, strike_rate, dot_pct
    db: Session = Depends(get_db)
):
    players = get_all_players_summary(db)
    filtered = [p for p in players if p["legal_balls"] >= min_balls]
    if season:
        filtered = [p for p in filtered if season in p["seasons"]]

    def sort_key(p):
        if sort_by == "economy": return -p["economy"] # lower economy is better
        elif sort_by == "strike_rate": return -(p["bowling_strike_rate"] or 999.0)
        elif sort_by == "dot_pct": return p["dot_ball_percentage"]
        elif sort_by == "rating": return p["ratings"]["bowling_rating"]
        else: return p["wickets"]

    filtered.sort(key=sort_key, reverse=True)
    return {
        "count": len(filtered),
        "leaderboard": filtered
    }

@router.get("/all-rounders")
def get_all_rounder_analytics(
    min_matches: int = 2,
    db: Session = Depends(get_db)
):
    players = get_all_players_summary(db)
    filtered = [
        p for p in players
        if p["matches"] >= min_matches and (p["total_runs"] > 0 or p["legal_balls"] > 0)
    ]
    filtered.sort(key=lambda p: -p["ratings"]["all_rounder_rating"])
    return {
        "count": len(filtered),
        "leaderboard": filtered
    }

@router.get("/comparison")
def compare_players(
    ids: str = Query(..., description="Comma-separated player IDs (e.g. EPL-P-001,EPL-P-002)"),
    db: Session = Depends(get_db)
):
    id_list = [i.strip() for i in ids.split(",") if i.strip()]
    profiles = []
    for pid in id_list:
        prof = get_player_full_profile(db, pid)
        if prof:
            profiles.append(prof)
    return {
        "count": len(profiles),
        "players": profiles
    }

@router.get("/similar-groups")
def get_similar_groups(db: Session = Depends(get_db)):
    all_players = get_all_players_summary(db)
    engine = PlayerSimilarityEngine(all_players)
    groups = engine.generate_all_seven_groups()
    return {
        "total_groups": len(groups),
        "groups": groups
    }
