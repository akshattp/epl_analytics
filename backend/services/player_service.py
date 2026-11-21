import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from backend.database.models import (
    Player, Match, Innings, BattingScorecard, BowlingScorecard
)
from backend.analytics.cricket_math import (
    calculate_batting_metrics,
    calculate_bowling_metrics,
    calculate_situational_splits,
    calculate_all_rounder_metrics
)
from backend.analytics.ratings_engine import calculate_player_ratings
from backend.analytics.player_intelligence import calculate_player_intelligence
from backend.analytics.classification_engine import classify_player
from backend.auction.valuation_engine import calculate_player_valuation

def get_player_full_profile(db: Session, player_id: str) -> Optional[Dict[str, Any]]:
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        return None

    bat_records = db.query(BattingScorecard, Match, Innings)\
                    .join(Match, BattingScorecard.match_id == Match.id)\
                    .join(Innings, BattingScorecard.innings_id == Innings.id)\
                    .filter(BattingScorecard.player_id == player_id).all()
                    
    bowl_records = db.query(BowlingScorecard, Match, Innings)\
                     .join(Match, BowlingScorecard.match_id == Match.id)\
                     .join(Innings, BowlingScorecard.innings_id == Innings.id)\
                     .filter(BowlingScorecard.player_id == player_id).all()

    # Split regular vs knockout and populate raw structures
    bat_raw = []
    bat_ko = []
    bowl_raw = []
    bowl_ko = []
    seasons_seen = set()

    for sc, m, inn in bat_records:
        seasons_seen.add(m.season)
        d = {
            "match_id": m.id,
            "match_code": m.match_code,
            "season": m.season,
            "stage": m.stage,
            "opponent": m.team2 if sc.team == m.team1 else m.team1,
            "team": sc.team,
            "innings_number": inn.innings_number,
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

    for sc, m, inn in bowl_records:
        seasons_seen.add(m.season)
        d = {
            "match_id": m.id,
            "match_code": m.match_code,
            "season": m.season,
            "stage": m.stage,
            "opponent": sc.team,
            "innings_number": inn.innings_number,
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

    # Regulation Career Metrics
    career_batting = calculate_batting_metrics(bat_regular)
    career_bowling = calculate_bowling_metrics(bowl_regular)
    super_over_batting = calculate_batting_metrics(bat_so)
    super_over_bowling = calculate_bowling_metrics(bowl_so)
    ko_batting = calculate_batting_metrics([r for r in bat_ko if r["innings_type"] == "Regular"])
    ko_bowling = calculate_bowling_metrics([r for r in bowl_ko if r["innings_type"] == "Regular"])

    # Matches played in regulation
    all_reg_matches = set([r["match_id"] for r in bat_regular + bowl_regular])
    matches_played = len(all_reg_matches)

    # Situational Splits (Innings 1 vs Innings 2)
    situational_splits = calculate_situational_splits(bat_regular, bowl_regular)

    # All-Rounder Analytics & Role Classification
    all_rounder_metrics = calculate_all_rounder_metrics(bat_regular, bowl_regular, matches_played)

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

    # Traditional Bayesian Ratings (Preserved)
    ratings = calculate_player_ratings(
        batting_stats=career_batting,
        bowling_stats=career_bowling,
        knockout_batting_stats=ko_batting,
        knockout_bowling_stats=ko_bowling,
        career_seasons=list(seasons_seen)
    )

    # Master Classification & Rule Engine (v2.0.1-dev)
    # Separates: Experience, Batting Evidence, Bowling Evidence, All-round Contribution, Overall Score, Statistical Confidence
    classification = classify_player(
        matches_played=matches_played,
        career_batting=career_batting,
        career_bowling=career_bowling,
        all_rounder_metrics=all_rounder_metrics,
        career_seasons=list(seasons_seen)
    )

    # Harmonize roles, tags and scores across all modules
    ratings["primary_role"] = classification["primary_role"]
    ratings["secondary_roles"] = classification["performance_tags"]
    ratings["overall_rating"] = classification["intelligence_suite"]["overall_player_intelligence_score"]
    all_rounder_metrics["role_classification"] = classification["role_classification"]

    # EPL v1.3 Player Intelligence Suite (PIS) & v2.0.1-dev Rule Engine Enrichment
    player_intelligence = calculate_player_intelligence(
        career_batting=career_batting,
        career_bowling=career_bowling,
        all_rounder_metrics=all_rounder_metrics,
        situational_splits=situational_splits,
        knockout_batting=ko_batting,
        knockout_bowling=ko_bowling,
        matches_played=matches_played
    )

    # Enrich player_intelligence with definitive classification engine results
    player_intelligence["experience_level"] = classification["experience_level"]
    player_intelligence["experience_label"] = classification["experience_label"]
    player_intelligence["batting_evidence"] = classification["batting_evidence"]
    player_intelligence["is_batting_eligible"] = classification["is_batting_eligible"]
    player_intelligence["bowling_evidence"] = classification["bowling_evidence"]
    player_intelligence["is_bowling_eligible"] = classification["is_bowling_eligible"]
    player_intelligence["is_all_rounder_eligible"] = classification["is_all_rounder_eligible"]
    player_intelligence["confidence_level"] = classification["confidence_level"]
    player_intelligence["confidence_score"] = classification["confidence_score"]
    player_intelligence["confidence_badge"] = classification["confidence_badge"]
    player_intelligence["performance_tags"] = classification["performance_tags"]
    player_intelligence["tags_detail"] = classification["tags_detail"]
    player_intelligence["audit_reason"] = classification["audit_reason"]
    player_intelligence["overall_player_intelligence_score"] = classification["intelligence_suite"]["overall_player_intelligence_score"]
    player_intelligence["overall_score"] = classification["intelligence_suite"]["overall_player_intelligence_score"]
    player_intelligence["batting_intelligence_score"] = classification["intelligence_suite"]["batting_intelligence_score"]
    player_intelligence["bowling_intelligence_score"] = classification["intelligence_suite"]["bowling_intelligence_score"]
    player_intelligence["all_rounder_intelligence_score"] = classification["intelligence_suite"]["all_rounder_intelligence_score"]
    player_intelligence["role_classification"] = classification["role_classification"]

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

    # Consolidated Match-by-match chronology with discipline tags
    match_map = {}
    for r in bat_regular:
        mid = r["match_id"]
        if mid not in match_map:
            match_map[mid] = {
                "match_id": mid,
                "match_code": r["match_code"],
                "season": r["season"],
                "stage": r["stage"],
                "opponent": r["opponent"],
                "batting": r,
                "bowling": None
            }
        else:
            match_map[mid]["batting"] = r

    for r in bowl_regular:
        mid = r["match_id"]
        if mid not in match_map:
            match_map[mid] = {
                "match_id": mid,
                "match_code": r["match_code"],
                "season": r["season"],
                "stage": r["stage"],
                "opponent": r["opponent"],
                "batting": None,
                "bowling": r
            }
        else:
            match_map[mid]["bowling"] = r

    consolidated_timeline = sorted(
        match_map.values(),
        key=lambda x: (x.get("season", 0), x.get("match_id", 0)),
        reverse=True
    )

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
        "role_classification": classification["role_classification"],
        "experience_level": classification["experience_level"],
        "experience_label": classification["experience_label"],
        "batting_evidence": classification["batting_evidence"],
        "bowling_evidence": classification["bowling_evidence"],
        "is_batting_eligible": classification["is_batting_eligible"],
        "is_bowling_eligible": classification["is_bowling_eligible"],
        "is_all_rounder_eligible": classification["is_all_rounder_eligible"],
        "confidence_level": classification["confidence_level"],
        "confidence_score": classification["confidence_score"],
        "confidence_badge": classification["confidence_badge"],
        "performance_tags": classification["performance_tags"],
        "tags_detail": classification["tags_detail"],
        "audit_reason": classification["audit_reason"],
        "career_seasons": sorted(list(seasons_seen)),
        "matches_played": matches_played,
        "career_batting": career_batting,
        "career_bowling": career_bowling,
        "super_over_batting": super_over_batting,
        "super_over_bowling": super_over_bowling,
        "situational_splits": situational_splits,
        "all_rounder_metrics": all_rounder_metrics,
        "player_intelligence": player_intelligence,
        "season_breakdown": season_breakdown,
        "ratings": ratings,
        "valuation": valuation,
        "match_history": consolidated_timeline,
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
                "role_classification": prof["role_classification"],
                "experience_level": prof.get("experience_level"),
                "experience_label": prof.get("experience_label"),
                "batting_evidence": prof.get("batting_evidence"),
                "bowling_evidence": prof.get("bowling_evidence"),
                "is_batting_eligible": prof.get("is_batting_eligible"),
                "is_bowling_eligible": prof.get("is_bowling_eligible"),
                "is_all_rounder_eligible": prof.get("is_all_rounder_eligible"),
                "confidence_level": prof.get("confidence_level"),
                "confidence_score": prof.get("confidence_score"),
                "confidence_badge": prof.get("confidence_badge"),
                "performance_tags": prof.get("performance_tags", []),
                "tags_detail": prof.get("tags_detail", []),
                "audit_reason": prof.get("audit_reason"),
                "is_new_player": prof["is_new_player"],
                "matches": prof["matches_played"],
                "innings": prof["career_batting"]["innings"],
                "total_runs": prof["career_batting"]["total_runs"],
                "strike_rate": prof["career_batting"]["strike_rate"],
                "batting_average": prof["career_batting"]["batting_average"],
                "average_display": prof["career_batting"]["average_display"],
                "boundary_percentage": prof["career_batting"]["boundary_percentage"],
                "boundary_runs_percentage": prof["career_batting"]["boundary_runs_percentage"],
                "scores_10_plus": prof["career_batting"]["scores_10_plus"],
                "scores_20_plus": prof["career_batting"]["scores_20_plus"],
                "highest_score_display": prof["career_batting"]["highest_score_display"],
                "legal_balls": prof["career_bowling"]["legal_balls"],
                "overs": prof["career_bowling"]["overs"],
                "overs_display": prof["career_bowling"]["overs_display"],
                "wickets": prof["career_bowling"]["wickets"],
                "economy": prof["career_bowling"]["economy"],
                "bowling_average": prof["career_bowling"]["bowling_average"],
                "bowling_strike_rate": prof["career_bowling"]["bowling_strike_rate"],
                "dot_ball_percentage": prof["career_bowling"]["dot_ball_percentage"],
                "multi_wicket_frequency": prof["career_bowling"]["multi_wicket_frequency"],
                "career_batting": prof["career_batting"],
                "career_bowling": prof["career_bowling"],
                "ratings": prof["ratings"],
                "player_intelligence": prof["player_intelligence"],
                "all_rounder_metrics": prof["all_rounder_metrics"],
                "valuation": prof["valuation"],
                "seasons": prof["career_seasons"]
            })
    return summaries
