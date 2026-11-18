from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database.models import AuctionTeam, AuctionSquadMember, Player, AuctionShortlist
from backend.services.player_service import get_all_players_summary, get_player_full_profile

def get_owner_dashboard(db: Session, team_id: int) -> Dict[str, Any]:
    """
    Computes a comprehensive squad intelligence dashboard for a franchise owner:
    - Purse and slot metrics
    - Batting, Bowling, All-rounder squad strength
    - Category distribution
    - Squad weaknesses and tailored recommendations
    """
    team = db.query(AuctionTeam).filter(AuctionTeam.id == team_id).first()
    if not team:
        return {}

    # Squad members
    squad_entries = db.query(AuctionSquadMember).filter(AuctionSquadMember.team_id == team_id).all()
    squad_players = []
    total_bat_rating = 0.0
    total_bowl_rating = 0.0
    total_ar_rating = 0.0
    category_counts = {
        "Marquee / Elite": 0,
        "Tier 1 (High Impact)": 0,
        "Tier 2 (Solid Core)": 0,
        "Role Specialist": 0,
        "Uncapped / New": 0
    }

    for member in squad_entries:
        prof = get_player_full_profile(db, member.player_id)
        if prof:
            ratings = prof.get("ratings", {})
            val = prof.get("valuation", {})
            cat = val.get("category", "Tier 2 (Solid Core)")
            category_counts[cat] = category_counts.get(cat, 0) + 1
            
            b_r = ratings.get("batting_rating", 0.0)
            bw_r = ratings.get("bowling_rating", 0.0)
            ar_r = ratings.get("all_rounder_rating", 0.0)
            
            total_bat_rating += b_r
            total_bowl_rating += bw_r
            total_ar_rating += ar_r

            squad_players.append({
                "player_id": prof["player_id"],
                "name": prof["name"],
                "purchase_price": member.purchase_price,
                "primary_role": prof["primary_role"],
                "category": cat,
                "ratings": ratings
            })

    n = len(squad_players)
    avg_bat = round(total_bat_rating / n, 1) if n > 0 else 0.0
    avg_bowl = round(total_bowl_rating / n, 1) if n > 0 else 0.0
    avg_ar = round(total_ar_rating / n, 1) if n > 0 else 0.0

    # Squad Balance Score (0-100)
    # Rewards having at least 2 strong batters, 2 strong bowlers, and 2 all-rounders
    balance_score = round(min(100.0, (avg_bat * 0.35 + avg_bowl * 0.35 + avg_ar * 0.30)), 1)

    # Identify Squad Deficits
    weaknesses = []
    if n > 0:
        if avg_bat < 45.0:
            weaknesses.append("Batting Depth Deficit: Team lacks explosive top-order scoring.")
        if avg_bowl < 45.0:
            weaknesses.append("Bowling Containment Deficit: Team lacks restrictive economy bowling.")
        if avg_ar < 40.0:
            weaknesses.append("All-Rounder Flexibility Deficit: Team lacks two-way balance.")
    else:
        weaknesses.append("Fresh Roster: Open slate, recommend acquiring a marquee Platinum all-rounder early.")

    remaining_slots = max(0, team.max_squad_size - n)
    purse_rem = round(team.purse_total - team.purse_spent, 2)
    max_bid = max(0.0, round(purse_rem - (max(0, remaining_slots - 1) * 2.0), 2))

    # All available players not yet sold
    all_sold_pids = set(row[0] for row in db.query(AuctionSquadMember.player_id).all())
    all_summaries = get_all_players_summary(db)
    available_players = [p for p in all_summaries if p["player_id"] not in all_sold_pids]

    # Recommendations tailored to weaknesses
    recommendations = []
    for p in available_players:
        urgency = "Medium"
        if avg_bat < 45.0 and p["primary_role"] in ["Specialist Batsman", "All-rounder"]:
            urgency = "High"
        elif avg_bowl < 45.0 and p["primary_role"] in ["Specialist Bowler", "All-rounder"]:
            urgency = "High"
        
        if p["valuation"]["estimated_valuation"] <= max_bid:
            recommendations.append({
                "player_id": p["player_id"],
                "name": p["name"],
                "primary_role": p["primary_role"],
                "category": p["valuation"]["category"],
                "estimated_valuation": p["valuation"]["estimated_valuation"],
                "overall_rating": p["ratings"]["overall_rating"],
                "fit_urgency": urgency
            })

    recommendations.sort(key=lambda x: (0 if x["fit_urgency"] == "High" else 1, -x["overall_rating"]))

    return {
        "team_id": team.id,
        "team_name": team.team_name,
        "owner_name": team.owner_name,
        "purse_total": team.purse_total,
        "purse_spent": team.purse_spent,
        "purse_remaining": purse_rem,
        "max_bid_capacity": max_bid,
        "squad_size_current": n,
        "squad_size_target": team.max_squad_size,
        "remaining_slots": remaining_slots,
        "squad_strengths": {
            "batting_strength": avg_bat,
            "bowling_strength": avg_bowl,
            "all_rounder_strength": avg_ar,
            "squad_balance_score": balance_score
        },
        "category_distribution": category_counts,
        "squad_weaknesses": weaknesses,
        "squad_members": squad_players,
        "tailored_recommendations": recommendations[:6]
    }

def get_player_scarcity_insight(db: Session, player_id: str) -> Dict[str, Any]:
    """
    Computes market scarcity indicator for a nominated player:
    How many comparable players (same role and tier) remain unsold in the auction pool.
    """
    prof = get_player_full_profile(db, player_id)
    if not prof:
        return {}

    all_sold_pids = set(row[0] for row in db.query(AuctionSquadMember.player_id).all())
    all_summaries = get_all_players_summary(db)
    unsold_pool = [p for p in all_summaries if p["player_id"] not in all_sold_pids and p["player_id"] != player_id]

    target_role = prof["primary_role"]
    target_category = prof["valuation"]["category"]
    target_rating = prof["ratings"]["overall_rating"]

    # Count unsold with same category & role
    similar_tier_count = sum(
        1 for p in unsold_pool
        if p["primary_role"] == target_role and p["valuation"]["category"] == target_category
    )

    # Scarcity Index
    if similar_tier_count == 0:
        scarcity_level = "CRITICAL (Last Remaining in Tier)"
        scarcity_multiplier = 1.35
    elif similar_tier_count <= 2:
        scarcity_level = "VERY HIGH (Only 1-2 Alternatives)"
        scarcity_multiplier = 1.20
    elif similar_tier_count <= 4:
        scarcity_level = "MODERATE (3-4 Alternatives)"
        scarcity_multiplier = 1.05
    else:
        scarcity_level = "ABUNDANT (5+ Alternatives Available)"
        scarcity_multiplier = 1.0

    return {
        "player_id": player_id,
        "name": prof["name"],
        "primary_role": target_role,
        "category": target_category,
        "overall_rating": target_rating,
        "unsold_tier_alternatives_count": similar_tier_count,
        "scarcity_level": scarcity_level,
        "recommended_valuation_ceiling": round(prof["valuation"]["estimated_valuation"] * scarcity_multiplier, 1),
        "tactical_bidding_advice": (
            f"High market competition expected. Only {similar_tier_count} other {target_category} {target_role}s remain in the auction pool."
            if similar_tier_count <= 2 else
            f"Patient bidding advised. {similar_tier_count} alternative {target_category} options remain available."
        )
    }
