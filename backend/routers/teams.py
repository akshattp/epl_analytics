from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any

from backend.database.db import get_db
from backend.database.models import Match, Innings

router = APIRouter(prefix="/api/teams", tags=["Teams"])

@router.get("")
def get_teams_analytics(db: Session = Depends(get_db)):
    matches = db.query(Match).all()
    innings = db.query(Innings).filter(Innings.innings_type == "Regular").all()

    teams_data = {}
    
    # Process matches for wins/losses
    for m in matches:
        for t in [m.team1, m.team2]:
            if t not in teams_data:
                teams_data[t] = {
                    "team_name": t,
                    "seasons": set(),
                    "matches_played": 0,
                    "matches_won": 0,
                    "matches_lost": 0,
                    "total_runs_scored": 0,
                    "total_overs_batted": 0.0,
                    "total_balls_batted": 0,
                    "total_runs_conceded": 0,
                    "total_balls_bowled": 0,
                    "wickets_lost": 0,
                    "wickets_taken": 0
                }
            teams_data[t]["seasons"].add(m.season)
            teams_data[t]["matches_played"] += 1
            if m.winner == t:
                teams_data[t]["matches_won"] += 1
            elif m.winner and m.winner != t:
                teams_data[t]["matches_lost"] += 1

    # Process innings for runs and run-rates
    for inn in innings:
        t_bat = inn.batting_team
        t_bowl = inn.bowling_team
        if t_bat in teams_data:
            teams_data[t_bat]["total_runs_scored"] += inn.total_runs
            teams_data[t_bat]["total_balls_batted"] += inn.legal_balls
            teams_data[t_bat]["wickets_lost"] += inn.wickets
        if t_bowl in teams_data:
            teams_data[t_bowl]["total_runs_conceded"] += inn.total_runs
            teams_data[t_bowl]["total_balls_bowled"] += inn.legal_balls
            teams_data[t_bowl]["wickets_taken"] += inn.wickets

    result = []
    for t, d in teams_data.items():
        mp = d["matches_played"]
        mw = d["matches_won"]
        win_pct = round((mw / mp) * 100, 1) if mp > 0 else 0.0
        
        balls_bat = d["total_balls_batted"]
        balls_bowl = d["total_balls_bowled"]
        
        bat_rr = round((d["total_runs_scored"] / balls_bat) * 6.0, 2) if balls_bat > 0 else 0.0
        bowl_rr = round((d["total_runs_conceded"] / balls_bowl) * 6.0, 2) if balls_bowl > 0 else 0.0
        nrr = round(bat_rr - bowl_rr, 2)

        result.append({
            "team_name": t,
            "seasons": sorted(list(d["seasons"])),
            "matches_played": mp,
            "matches_won": mw,
            "matches_lost": d["matches_lost"],
            "win_percentage": win_pct,
            "total_runs_scored": d["total_runs_scored"],
            "total_runs_conceded": d["total_runs_conceded"],
            "wickets_lost": d["wickets_lost"],
            "wickets_taken": d["wickets_taken"],
            "batting_run_rate": bat_rr,
            "bowling_economy": bowl_rr,
            "net_run_rate": nrr
        })

    result.sort(key=lambda x: (-x["matches_won"], -x["win_percentage"]))
    return {
        "count": len(result),
        "teams": result
    }
