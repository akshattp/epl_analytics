import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from backend.database.models import (
    Player, Match, Innings, BattingScorecard, BowlingScorecard
)
from backend.analytics.cricket_math import calculate_batting_metrics, calculate_bowling_metrics
from backend.analytics.ratings_engine import calculate_player_ratings
from backend.auction.valuation_engine import calculate_player_valuation

def get_player_full_profile(db: Session, player_id: str) -> Optional[Dict[str, Any]]:
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        return None

    bat_records = db.query(BattingScorecard, Match).join(Match, BattingScorecard.match_id == Match.id)\
                    .filter(BattingScorecard.player_id == player_id).all()
    bowl_records = db.query(BowlingScorecard, Match).join(Match, BowlingScorecard.match_id == Match.id)\
                     .filter(BowlingScorecard.player_id == player_id).all()

    # Split regular vs knockout
    bat_raw = []
    bat_ko = []
    bowl_raw = []
    bowl_ko = []
    seasons_seen = set()

    for sc, m in bat_records:
        seasons_seen.add(m.season)
        d = {
            "match_id": m.id,
            "match_code": m.match_code,
            "season": m.season,
            "stage": m.stage,
            "opponent": m.team2 if sc.team == m.team1 else m.team1,
            "runs": sc.runs,
            "balls": sc.balls,
            "fours": sc.fours,
            "sixes": sc.sixes,
            "strike_rate": sc.strike_rate,
            "dismissal": sc.dismissal,
            "is_not_out": sc.is_not_out,
            "batting_position": sc.batting_position,
            "innings_type": sc.innings_type
        }
        bat_raw.append(d)
        if m.stage in ["Semi Final", "Final"]:
            bat_ko.append(d)

    for sc, m in bowl_records:
        seasons_seen.add(m.season)
        d = {
            "match_id": m.id,
            "match_code": m.match_code,
            "season": m.season,
            "stage": m.stage,
            "opponent": sc.team,
            "overs": sc.overs,
            "legal_balls": sc.legal_balls,
            "maidens": sc.maidens,
            "runs_conceded": sc.runs_conceded,
            "wickets": sc.wickets,
            "dot_balls": sc.dot_balls,
            "fours_conceded": sc.fours_conceded,
            "sixes_conceded": sc.sixes_conceded,
            "wides": sc.wides,
            "no_balls": sc.no_balls,
            "economy": sc.economy,
            "innings_type": sc.innings_type
        }
        bowl_raw.append(d)
        if m.stage in ["Semi Final", "Final"]:
            bowl_ko.append(d)

    bat_regular = [r for r in bat_raw if r["innings_type"] == "Regular"]
    bat_so = [r for r in bat_raw if r["innings_type"] == "Super Over"]
    bowl_regular = [r for r in bowl_raw if r["innings_type"] == "Regular"]
    bowl_so = [r for r in bowl_raw if r["innings_type"] == "Super Over"]

    career_batting = calculate_batting_metrics(bat_regular)
    career_bowling = calculate_bowling_metrics(bowl_regular)
    super_over_batting = calculate_batting_metrics(bat_so)
    super_over_bowling = calculate_bowling_metrics(bowl_so)
    ko_batting = calculate_batting_metrics([r for r in bat_ko if r["innings_type"] == "Regular"])
    ko_bowling = calculate_bowling_metrics([r for r in bowl_ko if r["innings_type"] == "Regular"])

    # Season-wise breakdown
    season_breakdown = {}
    for s in sorted(seasons_seen):
        s_bat = [r for r in bat_raw if r["season"] == s and r["innings_type"] == "Regular"]
        s_bowl = [r for r in bowl_raw if r["season"] == s and r["innings_type"] == "Regular"]
        season_breakdown[s] = {
            "season": s,
            "batting": calculate_batting_metrics(s_bat),
            "bowling": calculate_bowling_metrics(s_bowl)
        }

    # Ratings
    ratings = calculate_player_ratings(
        batting_stats=career_batting,
        bowling_stats=career_bowling,
        knockout_batting_stats=ko_batting,
        knockout_bowling_stats=ko_bowling,
        career_seasons=list(seasons_seen)
    )

    # Auction Valuation
    valuation = calculate_player_valuation(
        player_id=player.id,
        overall_rating=ratings["overall_rating"],
        primary_role=ratings["primary_role"],
        ratings=ratings,
        is_new=player.is_new_player,
        trial_rating=player.trial_rating
    )

    # Aliases
    aliases = [a.raw_name for a in player.aliases]

    return {
        "player_id": player.id,
        "name": player.name,
        "normalized_name": player.normalized_name,
        "batting_hand": player.batting_hand,
        "is_new_player": player.is_new_player,
        "experience_notes": player.experience_notes,
        "trial_rating": player.trial_rating,
        "primary_role": ratings["primary_role"],
        "secondary_roles": ratings["secondary_roles"],
        "career_seasons": sorted(list(seasons_seen)),
        "matches_played": len(set([r["match_id"] for r in bat_raw + bowl_raw])),
        "career_batting": career_batting,
        "career_bowling": career_bowling,
        "super_over_batting": super_over_batting,
        "super_over_bowling": super_over_bowling,
        "season_breakdown": season_breakdown,
        "ratings": ratings,
        "valuation": valuation,
        "match_history": sorted(bat_raw + bowl_raw, key=lambda x: (x.get("season", 0), x.get("match_id", 0)), reverse=True),
        "aliases": aliases
    }

def get_all_players_summary(db: Session) -> List[Dict[str, Any]]:
    players = db.query(Player).all()
    summaries = []
    for p in players:
        prof = get_player_full_profile(db, p.id)
        if prof:
            summaries.append({
                "player_id": prof["player_id"],
                "name": prof["name"],
                "batting_hand": prof["batting_hand"],
                "primary_role": prof["primary_role"],
                "secondary_roles": prof["secondary_roles"],
                "is_new_player": prof["is_new_player"],
                "matches": prof["matches_played"],
                "innings": prof["career_batting"]["innings"],
                "total_runs": prof["career_batting"]["total_runs"],
                "strike_rate": prof["career_batting"]["strike_rate"],
                "batting_average": prof["career_batting"]["batting_average"],
                "boundary_percentage": prof["career_batting"]["boundary_percentage"],
                "legal_balls": prof["career_bowling"]["legal_balls"],
                "overs": prof["career_bowling"]["overs"],
                "wickets": prof["career_bowling"]["wickets"],
                "economy": prof["career_bowling"]["economy"],
                "bowling_average": prof["career_bowling"]["bowling_average"],
                "bowling_strike_rate": prof["career_bowling"]["bowling_strike_rate"],
                "dot_ball_percentage": prof["career_bowling"]["dot_ball_percentage"],
                "ratings": prof["ratings"],
                "valuation": prof["valuation"],
                "seasons": prof["career_seasons"]
            })
    return summaries
