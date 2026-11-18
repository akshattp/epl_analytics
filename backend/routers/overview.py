from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Any, Optional

from backend.database.db import get_db
from backend.database.models import Match, Innings, Player, BattingScorecard, BowlingScorecard
from backend.services.player_service import get_all_players_summary, get_player_full_profile

router = APIRouter(prefix="/api/overview", tags=["Overview"])

@router.get("")
def get_overview(db: Session = Depends(get_db)):
    total_seasons = db.query(func.count(func.distinct(Match.season))).scalar() or 3
    total_matches = db.query(func.count(Match.id)).scalar() or 0
    total_players = db.query(func.count(Player.id)).scalar() or 0

    # Top Run Scorer
    top_batter = db.query(
        Player.id, Player.name, func.sum(BattingScorecard.runs).label("runs")
    ).join(BattingScorecard, Player.id == BattingScorecard.player_id)\
     .group_by(Player.id)\
     .order_by(desc("runs")).first()

    # Top Wicket Taker
    top_bowler = db.query(
        Player.id, Player.name, func.sum(BowlingScorecard.wickets).label("wkts")
    ).join(BowlingScorecard, Player.id == BowlingScorecard.player_id)\
     .group_by(Player.id)\
     .order_by(desc("wkts")).first()

    # Best Overall Rated Player
    all_summaries = get_all_players_summary(db)
    all_summaries_sorted = sorted(all_summaries, key=lambda x: -x["ratings"]["overall_rating"])
    best_overall = all_summaries_sorted[0] if all_summaries_sorted else None

    # Most Successful Team
    matches = db.query(Match).all()
    team_wins = {}
    for m in matches:
        if m.winner:
            team_wins[m.winner] = team_wins.get(m.winner, 0) + 1
    most_successful_team = sorted(team_wins.items(), key=lambda x: -x[1])[0] if team_wins else ("N/A", 0)

    # Season Summary List
    season_summaries = []
    for s in [2023, 2024, 2025]:
        s_matches = [m for m in matches if m.season == s]
        s_inns = db.query(Innings).join(Match, Innings.match_id == Match.id)\
                   .filter(Match.season == s, Innings.innings_type == "Regular").all()
        s_runs = sum(i.total_runs for i in s_inns)
        s_balls = sum(i.legal_balls for i in s_inns)
        avg_score = round(s_runs / len(s_inns), 1) if s_inns else 0.0
        champion_match = next((m for m in s_matches if m.stage == "Final"), None)
        champion = champion_match.winner if champion_match else "N/A"

        season_summaries.append({
            "season": s,
            "matches_count": len(s_matches),
            "champion": champion,
            "total_runs": s_runs,
            "average_score": avg_score,
            "run_rate": round((s_runs / s_balls) * 6.0, 2) if s_balls > 0 else 0.0
        })

    return {
        "summary": {
            "total_seasons": total_seasons,
            "total_matches": total_matches,
            "total_players": total_players,
            "highest_run_scorer": {
                "player_id": top_batter[0] if top_batter else "",
                "name": top_batter[1] if top_batter else "N/A",
                "runs": top_batter[2] if top_batter else 0
            },
            "highest_wicket_taker": {
                "player_id": top_bowler[0] if top_bowler else "",
                "name": top_bowler[1] if top_bowler else "N/A",
                "wickets": top_bowler[2] if top_bowler else 0
            },
            "best_overall_player": {
                "player_id": best_overall["player_id"] if best_overall else "",
                "name": best_overall["name"] if best_overall else "N/A",
                "rating": best_overall["ratings"]["overall_rating"] if best_overall else 0.0,
                "role": best_overall["primary_role"] if best_overall else "All-rounder"
            },
            "most_successful_team": {
                "name": most_successful_team[0],
                "wins": most_successful_team[1]
            }
        },
        "seasons": season_summaries
    }
