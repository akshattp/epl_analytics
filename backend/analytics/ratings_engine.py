import math
from typing import Dict, Any, List, Optional

Optional_Dict = Optional[Dict[str, Any]]

def calculate_player_ratings(
    batting_stats: Dict[str, Any],
    bowling_stats: Dict[str, Any],
    knockout_batting_stats: Optional_Dict = None,
    knockout_bowling_stats: Optional_Dict = None,
    career_seasons: List[int] = None
) -> Dict[str, Any]:
    """
    Computes transparent, normalized ratings (0-100) with opportunity shrinkage.
    Every rating includes a detailed breakdown of its mathematical components.
    """
    if career_seasons is None:
        career_seasons = []

    # ---------------- BATTING RATING (0-100) ----------------
    inn = batting_stats.get("innings", 0)
    runs = batting_stats.get("total_runs", 0)
    sr = batting_stats.get("strike_rate", 0.0)
    avg = batting_stats.get("batting_average", 0.0)
    bpct = batting_stats.get("boundary_percentage", 0.0)
    
    if inn > 0:
        # Component 1: Absolute scoring volume (max 25 pts) - 50 career runs benchmark
        c_vol = min(25.0, (runs / 50.0) * 25.0)
        # Component 2: Strike rate velocity (max 40 pts) - 135 SR benchmark
        c_vel = min(40.0, (sr / 135.0) * 40.0)
        # Component 3: Dismissal resistance / Average (max 20 pts) - 18 avg benchmark
        c_rel = min(20.0, (avg / 18.0) * 20.0)
        # Component 4: Boundary prowess (max 15 pts) - 45% boundary runs benchmark
        c_bnd = min(15.0, (bpct / 45.0) * 15.0)
        raw_bat_rating = c_vol + c_vel + c_rel + c_bnd
        
        # Bayesian opportunity shrinkage (damping factor w = inn / (inn + 2))
        shrinkage_bat = inn / (inn + 2.0)
        batting_rating = round(raw_bat_rating * shrinkage_bat, 1)
    else:
        c_vol, c_vel, c_rel, c_bnd = 0.0, 0.0, 0.0, 0.0
        shrinkage_bat = 0.0
        batting_rating = 0.0

    batting_breakdown = {
        "scoring_volume_score": round(c_vol, 1),
        "scoring_velocity_score": round(c_vel, 1),
        "reliability_score": round(c_rel, 1),
        "boundary_prowess_score": round(c_bnd, 1),
        "opportunity_weight": round(shrinkage_bat, 2),
        "formula": "Score = (Volume[25] + Velocity[40] + Reliability[20] + Boundary[15]) * (Innings / (Innings + 2))"
    }

    # ---------------- BOWLING RATING (0-100) ----------------
    balls = bowling_stats.get("legal_balls", 0)
    wkts = bowling_stats.get("wickets", 0)
    eco = bowling_stats.get("economy", 0.0)
    dot_pct = bowling_stats.get("dot_ball_percentage", 0.0)
    overs = balls / 6.0

    if balls > 0:
        # Component 1: Wicket-taking threat (max 40 pts) - 0.7 wkts/over is elite
        wkts_per_over = wkts / overs if overs > 0 else 0
        c_wkt = min(40.0, (wkts_per_over / 0.7) * 40.0)
        # Component 2: Economy run suppression (max 35 pts) - <4.0 is elite, >8.0 is 0
        c_eco = max(0.0, min(35.0, (8.5 - eco) / 4.5 * 35.0))
        # Component 3: Dot ball prowess (max 15 pts) - 50% dot balls is elite
        c_dot = min(15.0, (dot_pct / 50.0) * 15.0)
        # Component 4: Multi-wicket impact (max 10 pts)
        c_multi = min(10.0, bowling_stats.get("two_plus_wickets", 0) * 5.0)
        raw_bowl_rating = c_wkt + c_eco + c_dot + c_multi
        
        # Bayesian shrinkage for bowling (w = balls / (balls + 12))
        shrinkage_bowl = balls / (balls + 12.0)
        bowling_rating = round(raw_bowl_rating * shrinkage_bowl, 1)
    else:
        c_wkt, c_eco, c_dot, c_multi = 0.0, 0.0, 0.0, 0.0
        shrinkage_bowl = 0.0
        bowling_rating = 0.0

    bowling_breakdown = {
        "wicket_threat_score": round(c_wkt, 1),
        "economy_control_score": round(c_eco, 1),
        "dot_ball_score": round(c_dot, 1),
        "multi_wicket_score": round(c_multi, 1),
        "opportunity_weight": round(shrinkage_bowl, 2),
        "formula": "Score = (Wickets[40] + Economy[35] + DotBalls[15] + MultiWkts[10]) * (Balls / (Balls + 12))"
    }

    # ---------------- ALL-ROUNDER RATING (0-100) ----------------
    if batting_rating > 10.0 and bowling_rating > 10.0:
        # Harmonic-geometric blend rewarding two-way performance
        harmonic_base = (2 * batting_rating * bowling_rating) / (batting_rating + bowling_rating)
        balance_ratio = min(batting_rating, bowling_rating) / max(batting_rating, bowling_rating)
        all_rounder_rating = round(harmonic_base * (0.8 + 0.2 * balance_ratio), 1)
    else:
        all_rounder_rating = round(max(batting_rating, bowling_rating) * 0.2, 1)

    all_rounder_breakdown = {
        "batting_contribution": batting_rating,
        "bowling_contribution": bowling_rating,
        "formula": "Harmonic Mean of Batting and Bowling Ratings scaled by balance factor"
    }

    # ---------------- CONSISTENCY RATING (0-100) ----------------
    consistency_rating = batting_stats.get("consistency_index", 50.0)
    if balls >= 12:
        # Boost consistency if bowling economy is steady (<6.0)
        if eco <= 5.5:
            consistency_rating = min(100.0, consistency_rating * 0.7 + 30.0)
    consistency_rating = round(consistency_rating, 1)

    # ---------------- KNOCKOUT RATING (0-100) ----------------
    # Calculated from semifinal and final matches
    ko_inn = knockout_batting_stats.get("innings", 0) if knockout_batting_stats else 0
    ko_balls = knockout_bowling_stats.get("legal_balls", 0) if knockout_bowling_stats else 0
    if ko_inn > 0 or ko_balls > 0:
        ko_bat_runs = knockout_batting_stats.get("total_runs", 0) if knockout_batting_stats else 0
        ko_wkts = knockout_bowling_stats.get("wickets", 0) if knockout_bowling_stats else 0
        ko_score = min(100.0, (ko_bat_runs * 2.5) + (ko_wkts * 10.0) + 35.0)
        knockout_rating = round(ko_score, 1)
    else:
        # Penalize non-participants so active playoff players who competed under pressure rank higher
        knockout_rating = round((batting_rating + bowling_rating) * 0.25, 1)

    # ---------------- PRIMARY & SECONDARY ROLES ----------------
    if batting_rating >= 35.0 and bowling_rating >= 35.0 and balls >= 24 and runs >= 20:
        primary_role = "All-rounder"
    elif bowling_rating > batting_rating and (balls >= 12 or bowling_rating >= 25.0):
        primary_role = "Specialist Bowler"
    elif batting_rating >= 20.0 or runs >= 10:
        primary_role = "Specialist Batsman"
    elif balls >= 6:
        primary_role = "Specialist Bowler"
    else:
        primary_role = "Specialist Batsman"

    # Secondary styles - Controlled vocabulary & sample-gated tags
    secondary_roles = []
    if sr >= 135.0 and inn >= 3 and balls >= 25 and bpct >= 45.0:
        secondary_roles.append("Explosive Batter")
    if avg >= 16.0 and inn >= 4 and runs >= 40:
        secondary_roles.append("Consistent Run Scorer")
    if runs >= 40 and inn >= 4 and bowling_stats.get("scores_15_plus", 0) >= 2:
        secondary_roles.append("High-Impact Batter")
    if bowling_stats.get("bowling_strike_rate") and bowling_stats["bowling_strike_rate"] <= 9.0 and wkts >= 3 and balls >= 24:
        secondary_roles.append("Strike Bowler")
    if eco <= 5.0 and balls >= 24:
        secondary_roles.append("Economical Bowler")
    if wkts >= 5 and balls >= 36:
        secondary_roles.append("Wicket-Taking Specialist")
    if batting_rating >= 30.0 and bowling_rating >= 30.0 and balls >= 24 and runs >= 25:
        secondary_roles.append("Genuine All-round Contributor")
    if inn <= 2 and balls < 18 and runs < 15 and wkts < 2:
        secondary_roles.append("Limited Sample Size")
    elif (inn <= 2 or len(career_seasons) == 1) and ((runs >= 15 and sr >= 125.0) or (wkts >= 2 and eco <= 6.5)):
        secondary_roles.append("Emerging Talent")

    # ---------------- OVERALL EPL RATING (0-100) ----------------
    if primary_role == "Specialist Batsman":
        overall = (0.65 * batting_rating) + (0.15 * bowling_rating) + (0.10 * consistency_rating) + (0.10 * knockout_rating)
    elif primary_role == "Specialist Bowler":
        overall = (0.65 * bowling_rating) + (0.15 * batting_rating) + (0.10 * consistency_rating) + (0.10 * knockout_rating)
    else: # All-rounder - incorporate harmonic all-rounder balance score directly
        overall = (0.50 * all_rounder_rating) + (0.25 * max(batting_rating, bowling_rating)) + (0.15 * consistency_rating) + (0.10 * knockout_rating)

    overall_rating = round(min(99.0, max(10.0, overall)), 1)

    return {
        "batting_rating": batting_rating,
        "bowling_rating": bowling_rating,
        "all_rounder_rating": all_rounder_rating,
        "consistency_rating": consistency_rating,
        "knockout_rating": knockout_rating,
        "overall_rating": overall_rating,
        "primary_role": primary_role,
        "secondary_roles": secondary_roles,
        "batting_breakdown": batting_breakdown,
        "bowling_breakdown": bowling_breakdown,
        "all_rounder_breakdown": all_rounder_breakdown
    }

# Helper type alias
Optional_Dict = Optional[Dict[str, Any]]
