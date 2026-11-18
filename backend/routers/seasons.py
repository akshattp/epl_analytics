from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any

from backend.database.db import get_db
from backend.database.models import Match, Innings, BattingScorecard, BowlingScorecard

router = APIRouter(prefix="/api/seasons", tags=["Seasons"])

@router.get("")
def get_seasons_comparison(db: Session = Depends(get_db)):
    seasons = [2023, 2024, 2025]
    comparison = []

    for s in seasons:
        matches = db.query(Match).filter(Match.season == s).all()
        inns = db.query(Innings).join(Match, Innings.match_id == Match.id)\
                  .filter(Match.season == s, Innings.innings_type == "Regular").all()

        total_runs = sum(i.total_runs for i in inns)
        total_balls = sum(i.legal_balls for i in inns)
        total_wickets = sum(i.wickets for i in inns)
        
        # Batting milestones in season
        fours = db.query(func.sum(BattingScorecard.fours)).filter(BattingScorecard.season == s).scalar() or 0
        sixes = db.query(func.sum(BattingScorecard.sixes)).filter(BattingScorecard.season == s).scalar() or 0
        
        # Champion
        final_match = next((m for m in matches if m.stage == "Final"), None)
        champion = final_match.winner if final_match else "N/A"

        # Close finishes (<= 5 runs or <= 2 wickets)
        close_finishes = sum(1 for m in matches if (m.win_margin_runs and m.win_margin_runs <= 5) or (m.win_margin_wickets and m.win_margin_wickets <= 2) or m.is_super_over)

        avg_score = round(total_runs / len(inns), 1) if inns else 0.0
        run_rate = round((total_runs / total_balls) * 6.0, 2) if total_balls > 0 else 0.0
        balls_per_wkt = round(total_balls / total_wickets, 1) if total_wickets > 0 else 0.0

        comparison.append({
            "season": s,
            "matches_count": len(matches),
            "champion": champion,
            "total_runs": total_runs,
            "average_score": avg_score,
            "run_rate": run_rate,
            "total_wickets": total_wickets,
            "balls_per_wicket": balls_per_wkt,
            "total_fours": fours,
            "total_sixes": sixes,
            "close_finishes_count": close_finishes,
            "competitiveness_index": round((close_finishes / len(matches)) * 100, 1) if matches else 0.0
        })

    return {
        "seasons": comparison
    }
