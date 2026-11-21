"""
EPL 2.1-dev — Four-Tier Rankings API Router
============================================
Four independent ranking endpoints:
  GET /api/rankings/batting   — BAT leaderboard (batting-only score)
  GET /api/rankings/bowling   — BOWL leaderboard (bowling-only score)
  GET /api/rankings/allround  — AR leaderboard (all-round eligible players only)
  GET /api/rankings/overall   — OVERALL leaderboard (all 73 players)
  GET /api/rankings/player/{player_id} — single player's four scores
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from backend.database.db import get_db
from backend.services.player_service import get_all_players_summary
from backend.analytics.ranking_engine import build_four_tier_leaderboards, compute_player_rankings

router = APIRouter(prefix="/api/rankings", tags=["Rankings"])


def _get_boards(db: Session):
    """Builds all four leaderboards. Called once per request (FastAPI DI handles caching)."""
    players = get_all_players_summary(db)
    return build_four_tier_leaderboards(players)


@router.get("/batting")
def batting_rankings(
    min_innings: int = Query(1, description="Minimum innings to appear in results"),
    min_balls: int = Query(0, description="Minimum balls faced to appear in results"),
    limit: int = Query(100, le=200),
    db: Session = Depends(get_db)
):
    """
    BAT Leaderboard — ranked purely on batting metrics.
    Bowling performance has ZERO influence on this ranking.
    """
    boards = _get_boards(db)
    result = boards["batting"]

    # Apply filters
    if min_innings > 1:
        result = [p for p in result if p.get("innings", 0) >= min_innings]
    if min_balls > 0:
        result = [p for p in result if p.get("total_balls", 0) >= min_balls]

    eligible = [p for p in result if p.get("bat_score") is not None]
    ineligible = [p for p in result if p.get("bat_score") is None]

    return {
        "leaderboard": "batting",
        "ranking_type": "BAT",
        "description": "Batting-only ranking. Bowling has zero influence.",
        "total_eligible": len(eligible),
        "total_ineligible": len(ineligible),
        "filters": {"min_innings": min_innings, "min_balls": min_balls},
        "players": eligible[:limit],
        "ineligible_players": ineligible
    }


@router.get("/bowling")
def bowling_rankings(
    min_overs: float = Query(0.0, description="Minimum overs bowled to appear"),
    min_wickets: int = Query(0, description="Minimum wickets to filter"),
    limit: int = Query(100, le=200),
    db: Session = Depends(get_db)
):
    """
    BOWL Leaderboard — ranked purely on bowling metrics.
    Batting performance has ZERO influence on this ranking.
    """
    boards = _get_boards(db)
    result = boards["bowling"]

    # Apply filters
    if min_overs > 0:
        min_legal_balls = int(min_overs * 6)
        result = [p for p in result if p.get("legal_balls", 0) >= min_legal_balls]
    if min_wickets > 0:
        result = [p for p in result if p.get("wickets", 0) >= min_wickets]

    eligible = [p for p in result if p.get("bowl_score") is not None]
    ineligible = [p for p in result if p.get("bowl_score") is None]

    return {
        "leaderboard": "bowling",
        "ranking_type": "BOWL",
        "description": "Bowling-only ranking. Batting has zero influence.",
        "total_eligible": len(eligible),
        "total_ineligible": len(ineligible),
        "filters": {"min_overs": min_overs, "min_wickets": min_wickets},
        "players": eligible[:limit],
        "ineligible_players": ineligible
    }


@router.get("/allround")
def allround_rankings(
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db)
):
    """
    AR Leaderboard — genuine all-rounders only.

    Eligibility requirements (ALL must be met):
      - career runs ≥ 20
      - balls faced ≥ 18
      - career wickets ≥ 3
      - legal balls bowled ≥ 18
      - matches played ≥ 3

    Ineligible players are listed with their specific disqualification reason.
    """
    boards = _get_boards(db)
    result = boards["allround"]

    eligible = [p for p in result if p.get("ar_score") is not None]
    ineligible = [p for p in result if p.get("ar_score") is None]

    return {
        "leaderboard": "allround",
        "ranking_type": "AR",
        "description": (
            "All-round contribution ranking. Requires ≥20 runs, ≥18 balls faced, "
            "≥3 wickets, ≥18 legal balls, ≥3 matches played."
        ),
        "eligibility_criteria": {
            "min_runs": 20,
            "min_balls_faced": 18,
            "min_wickets": 3,
            "min_legal_balls": 18,
            "min_matches": 3
        },
        "total_eligible": len(eligible),
        "total_ineligible": len(ineligible),
        "players": eligible[:limit],
        "ineligible_players": ineligible
    }


@router.get("/overall")
def overall_rankings(
    limit: int = Query(100, le=200),
    path_filter: Optional[str] = Query(None, description="Filter by role path: Batting, Bowling, All-Round, Dual-Discipline"),
    db: Session = Depends(get_db)
):
    """
    OVERALL Leaderboard — all 73 players on a single cross-role ranking.

    Uses role-aware scoring paths:
      - All-Round: players eligible for AR ranking
      - Batting: pure batters
      - Bowling: pure bowlers
      - Dual-Discipline: both bat/bowl eligible but not AR-qualifying
    """
    boards = _get_boards(db)
    result = boards["overall"]

    if path_filter:
        result = [p for p in result if p.get("overall_path", "").lower() == path_filter.lower()]

    ranked = [p for p in result if p.get("overall_score") is not None]
    unranked = [p for p in result if p.get("overall_score") is None]

    return {
        "leaderboard": "overall",
        "ranking_type": "OVERALL",
        "description": "Cross-role ranking of all EPL players. Role-normalized, confidence-damped.",
        "total_ranked": len(ranked),
        "path_breakdown": {
            "all_round": sum(1 for p in ranked if p.get("overall_path") == "All-Round"),
            "batting": sum(1 for p in ranked if p.get("overall_path") == "Batting"),
            "bowling": sum(1 for p in ranked if p.get("overall_path") == "Bowling"),
            "dual_discipline": sum(1 for p in ranked if p.get("overall_path") == "Dual-Discipline"),
            "no_evidence": sum(1 for p in ranked if p.get("overall_path") == "No Evidence"),
        },
        "filters": {"path_filter": path_filter},
        "players": ranked[:limit],
        "unranked_players": unranked
    }


@router.get("/player/{player_id}")
def player_rankings(player_id: str, db: Session = Depends(get_db)):
    """
    Returns all four ranking scores for a single player.
    Includes component breakdowns for each discipline.
    """
    boards = _get_boards(db)
    all_players = boards["overall"]  # all 73 players present here

    player = next((p for p in all_players if p.get("player_id") == player_id), None)
    if not player:
        # Also check batting/bowling boards for ineligible OVERALL players
        for board_key in ("batting", "bowling", "allround"):
            player = next((p for p in boards[board_key] if p.get("player_id") == player_id), None)
            if player:
                break

    if not player:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Player {player_id} not found in ranking boards")

    return {
        "player_id": player.get("player_id"),
        "name": player.get("name"),
        "primary_role": player.get("primary_role"),
        "matches": player.get("matches"),
        "rankings": {
            "batting": {
                "rank": player.get("bat_rank"),
                "rank_of": player.get("bat_rank_of"),
                "score": player.get("bat_score"),
                "score_raw": player.get("bat_score_raw"),
                "eligible": player.get("bat_eligible"),
                "eligibility_reason": player.get("bat_eligibility_reason"),
                "confidence_level": player.get("bat_confidence_level"),
                "confidence_score": player.get("bat_confidence_score"),
                "shrinkage_weight": player.get("bat_shrinkage_weight"),
                "components": player.get("bat_components", {})
            },
            "bowling": {
                "rank": player.get("bowl_rank"),
                "rank_of": player.get("bowl_rank_of"),
                "score": player.get("bowl_score"),
                "score_raw": player.get("bowl_score_raw"),
                "eligible": player.get("bowl_eligible"),
                "eligibility_reason": player.get("bowl_eligibility_reason"),
                "confidence_level": player.get("bowl_confidence_level"),
                "confidence_score": player.get("bowl_confidence_score"),
                "shrinkage_weight": player.get("bowl_shrinkage_weight"),
                "components": player.get("bowl_components", {})
            },
            "allround": {
                "rank": player.get("ar_rank"),
                "rank_of": player.get("ar_rank_of"),
                "score": player.get("ar_score"),
                "eligible": player.get("ar_eligible"),
                "eligibility_reason": player.get("ar_eligibility_reason"),
                "confidence_level": player.get("ar_confidence_level"),
                "confidence_score": player.get("ar_confidence_score"),
                "components": player.get("ar_components", {})
            },
            "overall": {
                "rank": player.get("overall_rank"),
                "rank_of": player.get("overall_rank_of"),
                "score": player.get("overall_score"),
                "score_raw": player.get("overall_score_raw"),
                "path": player.get("overall_path"),
                "confidence_level": player.get("overall_confidence_level"),
                "confidence_score": player.get("overall_confidence_score"),
                "components": player.get("overall_components", {})
            }
        }
    }
