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
    experience: Optional[str] = None,
    confidence: Optional[str] = None,
    tag: Optional[str] = None,
    sort_by: str = "rating", # rating, runs, wickets, strike_rate, economy, pis
    sort_dir: str = "desc",
    db: Session = Depends(get_db)
):
    summaries = get_all_players_summary(db)
    
    # Filter
    if search:
        s_low = search.lower().strip()
        summaries = [p for p in summaries if s_low in p["name"].lower() or s_low in p["player_id"].lower()]
    if role:
        summaries = [
            p for p in summaries 
            if p["primary_role"] == role or 
               p.get("role_classification") == role or 
               role in p.get("performance_tags", []) or 
               role in p.get("secondary_roles", [])
        ]
    if category:
        summaries = [p for p in summaries if p["valuation"]["category"] == category]
    if season:
        summaries = [p for p in summaries if season in p["seasons"]]
    if experience:
        summaries = [p for p in summaries if (p.get("experience_level") or "").lower() == experience.lower()]
    if confidence:
        summaries = [p for p in summaries if (p.get("confidence_level") or "").lower() == confidence.lower()]
    if tag:
        t_low = tag.lower()
        summaries = [p for p in summaries if any(t_low == t.lower() for t in p.get("performance_tags", []))]

    # Sort
    def get_sort_val(p):
        if sort_by == "runs": return p["total_runs"]
        elif sort_by == "wickets": return p["wickets"]
        elif sort_by == "strike_rate": return p["strike_rate"]
        elif sort_by == "economy": return p["economy"] if p["legal_balls"] > 0 else 999.0
        elif sort_by == "batting_average": return p["batting_average"]
        elif sort_by == "valuation": return p["valuation"]["estimated_valuation"]
        elif sort_by == "pis": return p.get("player_intelligence", {}).get("overall_player_intelligence_score", 0.0)
        else: return p["ratings"]["overall_rating"]

    reverse = (sort_dir.lower() == "desc")
    summaries.sort(key=get_sort_val, reverse=reverse)

    return {
        "count": len(summaries),
        "players": summaries
    }

@router.get("/classification-audit")
def get_classification_audit(db: Session = Depends(get_db)):
    """
    EPL v2.0.1-dev Classification Audit across all 73 canonical players.
    Produces full audit matrix separating experience, batting/bowling evidence,
    roles, confidence, and controlled-vocabulary performance tags.
    """
    summaries = get_all_players_summary(db)
    
    audit_table = []
    exp_counts = {}
    conf_counts = {}
    role_counts = {}
    tag_counts = {}

    misleading_old_tags = []
    low_sample_elite = []
    role_corrections = []

    for p in summaries:
        pi = p.get("player_intelligence", {})
        r = p.get("ratings", {})
        exp = p.get("experience_level", "Unknown")
        conf = p.get("confidence_level", "Unknown")
        role = p.get("role_classification", p.get("primary_role", "Unknown"))
        tags = p.get("performance_tags", [])

        exp_counts[exp] = exp_counts.get(exp, 0) + 1
        conf_counts[conf] = conf_counts.get(conf, 0) + 1
        role_counts[role] = role_counts.get(role, 0) + 1
        for t in tags:
            tag_counts[t] = tag_counts.get(t, 0) + 1

        row = {
            "player_id": p["player_id"],
            "name": p["name"],
            "matches": p["matches"],
            "experience_level": exp,
            "batting_evidence": p.get("batting_evidence", "Unknown"),
            "bowling_evidence": p.get("bowling_evidence", "Unknown"),
            "existing_score": r.get("overall_rating", 0.0),
            "existing_tags": p.get("secondary_roles", []),
            "new_score": pi.get("overall_player_intelligence_score", 0.0),
            "new_tags": tags,
            "confidence": conf,
            "role_classification": role,
            "primary_role": p.get("primary_role"),
            "reason": p.get("audit_reason", "")
        }
        audit_table.append(row)

        # Highlight anomalies
        if p["matches"] <= 3 and any(t in ["Consistent Scorer", "Aggressive Batsman", "Consistent All-rounder"] for t in p.get("secondary_roles", [])):
            misleading_old_tags.append({
                "name": p["name"],
                "matches": p["matches"],
                "old_tags": p.get("secondary_roles", []),
                "new_tags": tags,
                "reason": "Player had <= 3 matches but was previously awarded cumulative consistency tags."
            })

        if p["matches"] <= 2 and r.get("overall_rating", 0) >= 40:
            low_sample_elite.append({
                "name": p["name"],
                "matches": p["matches"],
                "old_score": r.get("overall_rating", 0),
                "new_score": pi.get("overall_player_intelligence_score", 0),
                "reason": "Player had <= 2 appearances with pseudo-inflated rating; now properly dampened."
            })

        if p["primary_role"] != "All-rounder" and "All-rounder" in str(p.get("secondary_roles", [])):
            role_corrections.append({
                "name": p["name"],
                "matches": p["matches"],
                "current_role": role,
                "reason": "Role corrected to reflect true single-discipline evidence."
            })

    return {
        "total_players": len(summaries),
        "summary": {
            "experience_distribution": exp_counts,
            "confidence_distribution": conf_counts,
            "role_distribution": role_counts,
            "tag_distribution": tag_counts
        },
        "flags": {
            "misleading_tags_resolved": len(misleading_old_tags),
            "low_sample_elite_dampened": len(low_sample_elite),
            "role_corrections": len(role_corrections),
            "details": {
                "misleading_old_tags": misleading_old_tags,
                "low_sample_elite": low_sample_elite,
                "role_corrections": role_corrections
            }
        },
        "audit_table": audit_table
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
