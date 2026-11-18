from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from backend.database.db import get_db
from backend.services.player_service import get_all_players_summary, get_player_full_profile
from backend.analytics.clustering_engine import PlayerSimilarityEngine

router = APIRouter(prefix="/api/players", tags=["Players"])

@router.get("")
def list_players(
    search: Optional[str] = None,
    role: Optional[str] = None,
    category: Optional[str] = None,
    season: Optional[int] = None,
    sort_by: str = "rating", # rating, runs, wickets, strike_rate, economy
    sort_dir: str = "desc",
    db: Session = Depends(get_db)
):
    summaries = get_all_players_summary(db)
    
    # Filter
    if search:
        s_low = search.lower().strip()
        summaries = [p for p in summaries if s_low in p["name"].lower() or s_low in p["player_id"].lower()]
    if role:
        summaries = [p for p in summaries if p["primary_role"] == role or role in p["secondary_roles"]]
    if category:
        summaries = [p for p in summaries if p["valuation"]["category"] == category]
    if season:
        summaries = [p for p in summaries if season in p["seasons"]]

    # Sort
    def get_sort_val(p):
        if sort_by == "runs": return p["total_runs"]
        elif sort_by == "wickets": return p["wickets"]
        elif sort_by == "strike_rate": return p["strike_rate"]
        elif sort_by == "economy": return p["economy"] if p["legal_balls"] > 0 else 999.0
        elif sort_by == "batting_average": return p["batting_average"]
        elif sort_by == "valuation": return p["valuation"]["estimated_valuation"]
        else: return p["ratings"]["overall_rating"]

    reverse = (sort_dir.lower() == "desc")
    summaries.sort(key=get_sort_val, reverse=reverse)

    return {
        "count": len(summaries),
        "players": summaries
    }

@router.get("/{player_id}")
def get_player(player_id: str, db: Session = Depends(get_db)):
    profile = get_player_full_profile(db, player_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Also attach similar players
    all_players = get_all_players_summary(db)
    engine = PlayerSimilarityEngine(all_players)
    similar = engine.get_similar_players(player_id, top_k=4)
    profile["similar_players"] = similar

    return profile
