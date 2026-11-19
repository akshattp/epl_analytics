from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from backend.database.db import get_db
from backend.database.models import BattingScorecard, BowlingScorecard, Match, Innings, Partnership
from backend.services.player_service import get_all_players_summary, get_player_full_profile
from backend.analytics.clustering_engine import PlayerSimilarityEngine

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/batting")
def get_batting_analytics(
    min_innings: int = 1,
    season: Optional[int] = None,
    sort_by: str = "runs", # runs, strike_rate, batting_average, boundary_pct, intelligence_score
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
        elif sort_by == "intelligence_score": 
            return p.get("player_intelligence", {}).get("batting_intelligence_score") or 0.0
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
    sort_by: str = "wickets", # wickets, economy, strike_rate, dot_pct, intelligence_score
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
        elif sort_by == "intelligence_score":
            return p.get("player_intelligence", {}).get("bowling_intelligence_score") or 0.0
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
    filtered.sort(key=lambda p: -(p.get("player_intelligence", {}).get("all_rounder_intelligence_score") or p["ratings"]["all_rounder_rating"]))
    return {
        "count": len(filtered),
        "leaderboard": filtered
    }

@router.get("/records")
def get_tournament_records(db: Session = Depends(get_db)):
    """
    Returns verified tournament records & milestones across all three EPL seasons.
    """
    # 1. Top 10 Individual Batting Scores
    top_bat = db.query(BattingScorecard, Match)\
        .join(Match, BattingScorecard.match_id == Match.id)\
        .filter(BattingScorecard.innings_type == "Regular")\
        .order_by(BattingScorecard.runs.desc(), BattingScorecard.strike_rate.desc())\
        .limit(10).all()

    highest_scores = [
        {
            "rank": i + 1,
            "player_name": bs.raw_player_name,
            "player_id": bs.player_id,
            "runs": bs.runs,
            "balls": bs.balls,
            "fours": bs.fours,
            "sixes": bs.sixes,
            "strike_rate": bs.strike_rate,
            "is_not_out": bs.is_not_out,
            "display_score": f"{bs.runs}*" if bs.is_not_out else str(bs.runs),
            "season": m.season,
            "match_code": m.match_code,
            "stage": m.stage,
            "team": bs.team
        }
        for i, (bs, m) in enumerate(top_bat)
    ]

    # 2. Top 10 Bowling Figures
    top_bowl = db.query(BowlingScorecard, Match)\
        .join(Match, BowlingScorecard.match_id == Match.id)\
        .filter(BowlingScorecard.innings_type == "Regular")\
        .order_by(BowlingScorecard.wickets.desc(), BowlingScorecard.runs_conceded.asc())\
        .limit(10).all()

    best_bowling = [
        {
            "rank": i + 1,
            "player_name": bw.raw_player_name,
            "player_id": bw.player_id,
            "wickets": bw.wickets,
            "runs_conceded": bw.runs_conceded,
            "overs": bw.overs,
            "legal_balls": bw.legal_balls,
            "economy": bw.economy,
            "dot_balls": bw.dot_balls,
            "display_figures": f"{bw.wickets}/{bw.runs_conceded}",
            "season": m.season,
            "match_code": m.match_code,
            "stage": m.stage,
            "team": bw.team
        }
        for i, (bw, m) in enumerate(top_bowl)
    ]

    # 3. Top 10 Highest Partnerships
    top_partnerships = db.query(Partnership)\
        .filter(Partnership.innings_type == "Regular")\
        .order_by(Partnership.runs.desc())\
        .limit(10).all()

    partnerships_list = [
        {
            "rank": i + 1,
            "batter1_name": p.batter1_name,
            "batter2_name": p.batter2_name,
            "batter1_id": p.batter1_id,
            "batter2_id": p.batter2_id,
            "runs": p.runs,
            "wicket_number": p.wicket_number,
            "batting_team": p.batting_team,
            "season": p.season,
            "is_unbroken": p.is_unbroken,
            "start_over": p.start_over,
            "end_over": p.end_over
        }
        for i, p in enumerate(top_partnerships)
    ]

    # 4. Fastest 20+ Scores
    fastest_20s = db.query(BattingScorecard, Match)\
        .join(Match, BattingScorecard.match_id == Match.id)\
        .filter(BattingScorecard.innings_type == "Regular", BattingScorecard.runs >= 20)\
        .order_by(BattingScorecard.balls.asc(), BattingScorecard.strike_rate.desc())\
        .limit(10).all()

    fastest_list = [
        {
            "rank": i + 1,
            "player_name": bs.raw_player_name,
            "player_id": bs.player_id,
            "runs": bs.runs,
            "balls": bs.balls,
            "strike_rate": bs.strike_rate,
            "fours": bs.fours,
            "sixes": bs.sixes,
            "season": m.season,
            "match_code": m.match_code,
            "stage": m.stage,
            "team": bs.team
        }
        for i, (bs, m) in enumerate(fastest_20s)
    ]

    # 5. Most Economical Spells (min 2.0 overs / 12 legal balls)
    econ_spells = db.query(BowlingScorecard, Match)\
        .join(Match, BowlingScorecard.match_id == Match.id)\
        .filter(BowlingScorecard.innings_type == "Regular", BowlingScorecard.legal_balls >= 12)\
        .order_by(BowlingScorecard.economy.asc(), BowlingScorecard.runs_conceded.asc())\
        .limit(10).all()

    econ_list = [
        {
            "rank": i + 1,
            "player_name": bw.raw_player_name,
            "player_id": bw.player_id,
            "overs": bw.overs,
            "runs_conceded": bw.runs_conceded,
            "wickets": bw.wickets,
            "economy": bw.economy,
            "dot_balls": bw.dot_balls,
            "season": m.season,
            "match_code": m.match_code,
            "stage": m.stage,
            "team": bw.team
        }
        for i, (bw, m) in enumerate(econ_spells)
    ]

    # 6. Highest Team Totals
    team_totals = db.query(Innings, Match)\
        .join(Match, Innings.match_id == Match.id)\
        .filter(Innings.innings_type == "Regular")\
        .order_by(Innings.total_runs.desc())\
        .limit(10).all()

    team_totals_list = [
        {
            "rank": i + 1,
            "batting_team": inn.batting_team,
            "bowling_team": inn.bowling_team,
            "total_runs": inn.total_runs,
            "wickets": inn.wickets,
            "overs": inn.overs,
            "crr": inn.crr,
            "season": m.season,
            "match_code": m.match_code,
            "stage": m.stage
        }
        for i, (inn, m) in enumerate(team_totals)
    ]

    return {
        "highest_individual_scores": highest_scores,
        "best_bowling_figures": best_bowling,
        "highest_partnerships": partnerships_list,
        "fastest_twenties": fastest_list,
        "most_economical_spells": econ_list,
        "highest_team_totals": team_totals_list
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
