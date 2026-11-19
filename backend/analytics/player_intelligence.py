import math
from typing import Dict, Any, List, Optional

def calculate_player_intelligence(
    career_batting: Dict[str, Any],
    career_bowling: Dict[str, Any],
    all_rounder_metrics: Dict[str, Any],
    situational_splits: Optional[Dict[str, Any]] = None,
    knockout_batting: Optional[Dict[str, Any]] = None,
    knockout_bowling: Optional[Dict[str, Any]] = None,
    matches_played: int = 0
) -> Dict[str, Any]:
    """
    EPL Player Intelligence Score (PIS) Engine (v1.3)
    Computes a transparent, explainable 100-point multi-pillar intelligence suite:
    - Batting Intelligence Score (BIS)
    - Bowling Intelligence Score (BoIS)
    - All-Rounder Intelligence Score (AIS)
    - Consistency Intelligence Score (CIS)
    - Match Impact Intelligence Score (MIS)
    - Overall Player Intelligence Score (PIS)
    
    CRUCIAL: Missing disciplines are never penalized as zero. Weights adapt dynamically
    to player role classification.
    """
    # ---------------- 1. BATTING INTELLIGENCE SCORE (BIS, 0-100) ----------------
    inn = career_batting.get("innings", 0)
    runs = career_batting.get("total_runs", 0)
    sr = career_batting.get("strike_rate", 0.0)
    avg = career_batting.get("batting_average", 0.0)
    bpct = career_batting.get("boundary_runs_percentage", career_batting.get("boundary_percentage", 0.0))
    balls_faced = career_batting.get("total_balls", 0)

    if inn > 0 and balls_faced > 0:
        # Sub-factor 1: Scoring Volume (max 25 pts) - 50 runs benchmark in 6-over cricket
        c_vol = min(25.0, (runs / 50.0) * 25.0)
        # Sub-factor 2: Scoring Velocity (max 35 pts) - 140 SR benchmark
        c_vel = min(35.0, (sr / 140.0) * 35.0)
        # Sub-factor 3: Dismissal Resistance / Avg (max 25 pts) - 18 avg benchmark
        c_rel = min(25.0, (avg / 18.0) * 25.0)
        # Sub-factor 4: Boundary Prowess (max 15 pts) - 50% boundary runs benchmark
        c_bnd = min(15.0, (bpct / 50.0) * 15.0)
        raw_bat = c_vol + c_vel + c_rel + c_bnd
        
        # Bayesian opportunity shrinkage: w = inn / (inn + 2.0)
        shrinkage_bat = inn / (inn + 2.0)
        batting_score = round(raw_bat * shrinkage_bat, 1)
        batting_applicable = True
        batting_explanation = (
            f"Volume ({c_vol:.1f}/25) + Velocity ({c_vel:.1f}/35) + "
            f"Reliability ({c_rel:.1f}/25) + Boundary Prowess ({c_bnd:.1f}/15) "
            f"× Sample Weight ({shrinkage_bat:.2f})"
        )
    else:
        c_vol, c_vel, c_rel, c_bnd = 0.0, 0.0, 0.0, 0.0
        shrinkage_bat = 0.0
        batting_score = None
        batting_applicable = False
        batting_explanation = "No batting innings recorded in regulation tournament play."

    # ---------------- 2. BOWLING INTELLIGENCE SCORE (BoIS, 0-100) ----------------
    balls_bowled = career_bowling.get("legal_balls", 0)
    wkts = career_bowling.get("wickets", 0)
    eco = career_bowling.get("economy", 0.0)
    dot_pct = career_bowling.get("dot_ball_percentage", 0.0)
    overs = balls_bowled / 6.0

    if balls_bowled > 0:
        # Sub-factor 1: Wicket Threat (max 35 pts) - 0.65 wkts/over benchmark
        wkts_per_over = (wkts / overs) if overs > 0 else 0.0
        c_wkt = min(35.0, (wkts_per_over / 0.65) * 35.0)
        # Sub-factor 2: Economy Control (max 35 pts) - <4.0 elite (35 pts), >8.5 is 0
        c_eco = max(0.0, min(35.0, (8.5 - eco) / 4.5 * 35.0))
        # Sub-factor 3: Dot Ball Suppression (max 15 pts) - 50% dot balls is elite
        c_dot = min(15.0, (dot_pct / 50.0) * 15.0)
        # Sub-factor 4: Multi-wicket Impact (max 15 pts) - 2+ wkts frequency
        two_plus = career_bowling.get("two_plus_wickets", 0)
        c_multi = min(15.0, two_plus * 7.5)
        raw_bowl = c_wkt + c_eco + c_dot + c_multi

        # Bayesian opportunity shrinkage: w = balls / (balls + 12.0)
        shrinkage_bowl = balls_bowled / (balls_bowled + 12.0)
        bowling_score = round(raw_bowl * shrinkage_bowl, 1)
        bowling_applicable = True
        bowling_explanation = (
            f"Wicket Threat ({c_wkt:.1f}/35) + Economy ({c_eco:.1f}/35) + "
            f"Dot Balls ({c_dot:.1f}/15) + Multi-Wickets ({c_multi:.1f}/15) "
            f"× Sample Weight ({shrinkage_bowl:.2f})"
        )
    else:
        c_wkt, c_eco, c_dot, c_multi = 0.0, 0.0, 0.0, 0.0
        shrinkage_bowl = 0.0
        bowling_score = None
        bowling_applicable = False
        bowling_explanation = "No bowling deliveries recorded in regulation tournament play."

    # ---------------- 3. ALL-ROUNDER INTELLIGENCE SCORE (AIS, 0-100) ----------------
    bat_val = batting_score if batting_score is not None else 0.0
    bowl_val = bowling_score if bowling_score is not None else 0.0

    if batting_applicable and bowling_applicable and bat_val > 10.0 and bowl_val > 10.0:
        harmonic_base = (2 * bat_val * bowl_val) / (bat_val + bowl_val)
        balance_ratio = min(bat_val, bowl_val) / max(bat_val, bowl_val)
        dual_freq = all_rounder_metrics.get("impact_all_rounder_pct", 0.0)
        dual_multiplier = 0.8 + (0.2 * balance_ratio) + (0.1 * min(1.0, dual_freq / 25.0))
        all_rounder_score = round(min(100.0, harmonic_base * dual_multiplier), 1)
        all_rounder_explanation = (
            f"Harmonic Mean ({harmonic_base:.1f}) balanced by discipline ratio ({balance_ratio:.2f}) "
            f"and dual-impact frequency ({dual_freq:.1f}%)"
        )
    elif batting_applicable and bowling_applicable:
        all_rounder_score = round(max(bat_val, bowl_val) * 0.25, 1)
        all_rounder_explanation = "Baseline two-way potential below dual-discipline threshold."
    else:
        all_rounder_score = 0.0
        all_rounder_explanation = "Single-discipline specialist; all-rounder score not active."

    # ---------------- 4. CONSISTENCY INTELLIGENCE SCORE (CIS, 0-100) ----------------
    bat_cons = career_batting.get("consistency_index", 50.0)
    bowl_cons = career_bowling.get("bowling_consistency_index", 50.0)

    if batting_applicable and bowling_applicable:
        consistency_score = round((bat_cons * 0.5) + (bowl_cons * 0.5), 1)
        consistency_explanation = f"Weighted aggregate of batting consistency ({bat_cons}) and bowling spell consistency ({bowl_cons})"
    elif batting_applicable:
        consistency_score = round(bat_cons, 1)
        consistency_explanation = f"Batting score variance consistency across {inn} innings ({bat_cons})"
    elif bowling_applicable:
        consistency_score = round(bowl_cons, 1)
        consistency_explanation = f"Bowling economy stability across {career_bowling.get('bowling_innings', 0)} spells ({bowl_cons})"
    else:
        consistency_score = 50.0
        consistency_explanation = "Baseline consistency index (insufficient sample)."

    # ---------------- 5. MATCH IMPACT INTELLIGENCE SCORE (MIS, 0-100) ----------------
    # High-impact events: 15+ & 20+ runs, 2+ wickets, knockout output, chasing clutch
    s15 = career_batting.get("scores_15_plus", 0)
    s20 = career_batting.get("scores_20_plus", 0)
    multi_w = career_bowling.get("two_plus_wickets", 0)
    
    ko_runs = knockout_batting.get("total_runs", 0) if knockout_batting else 0
    ko_wkts = knockout_bowling.get("wickets", 0) if knockout_bowling else 0

    impact_points = 20.0 # Baseline participation
    impact_points += min(30.0, (s15 * 6.0) + (s20 * 8.0))
    impact_points += min(30.0, multi_w * 12.0)
    impact_points += min(20.0, (ko_runs * 1.5) + (ko_wkts * 6.0))
    match_impact_score = round(min(100.0, max(10.0, impact_points)), 1)
    match_impact_explanation = (
        f"Milestone innings ({s15}x15+, {s20}x20+) + Multi-wicket spells ({multi_w}x2+) "
        f"+ Knockout stage production ({ko_runs} runs, {ko_wkts} wkts)"
    )

    # ---------------- 6. ROLE CLASSIFICATION & OVERALL PIS ----------------
    role = all_rounder_metrics.get("role_classification", "Specialist / Emerging")

    if role == "Pure Batsman" or (batting_applicable and not bowling_applicable):
        # 65% Batting, 15% Consistency, 20% Impact
        weights = {"batting": 0.65, "bowling": 0.0, "all_rounder": 0.0, "consistency": 0.15, "impact": 0.20}
        raw_overall = (bat_val * 0.65) + (consistency_score * 0.15) + (match_impact_score * 0.20)
    elif role == "Pure Bowler" or (bowling_applicable and not batting_applicable):
        # 65% Bowling, 15% Consistency, 20% Impact
        weights = {"batting": 0.0, "bowling": 0.65, "all_rounder": 0.0, "consistency": 0.15, "impact": 0.20}
        raw_overall = (bowl_val * 0.65) + (consistency_score * 0.15) + (match_impact_score * 0.20)
    elif role == "Balanced All-Rounder":
        # 35% All-Rounder, 25% Batting, 25% Bowling, 7.5% Consistency, 7.5% Impact
        weights = {"batting": 0.25, "bowling": 0.25, "all_rounder": 0.35, "consistency": 0.075, "impact": 0.075}
        raw_overall = (all_rounder_score * 0.35) + (bat_val * 0.25) + (bowl_val * 0.25) + (consistency_score * 0.075) + (match_impact_score * 0.075)
    elif role == "Batting All-Rounder":
        # 45% Batting, 20% Bowling, 15% All-Rounder, 10% Consistency, 10% Impact
        weights = {"batting": 0.45, "bowling": 0.20, "all_rounder": 0.15, "consistency": 0.10, "impact": 0.10}
        raw_overall = (bat_val * 0.45) + (bowl_val * 0.20) + (all_rounder_score * 0.15) + (consistency_score * 0.10) + (match_impact_score * 0.10)
    elif role == "Bowling All-Rounder":
        # 45% Bowling, 20% Batting, 15% All-Rounder, 10% Consistency, 10% Impact
        weights = {"batting": 0.20, "bowling": 0.45, "all_rounder": 0.15, "consistency": 0.10, "impact": 0.10}
        raw_overall = (bowl_val * 0.45) + (bat_val * 0.20) + (all_rounder_score * 0.15) + (consistency_score * 0.10) + (match_impact_score * 0.10)
    else: # Specialist / Emerging
        lead_val = max(bat_val, bowl_val)
        weights = {"lead_discipline": 0.70, "impact": 0.30}
        raw_overall = (lead_val * 0.70) + (match_impact_score * 0.30)

    overall_pis = round(min(99.0, max(10.0, raw_overall)), 1)

    # ---------------- 7. SAMPLE SIZE & CONFIDENCE SAFEGUARDS ----------------
    if matches_played >= 5 and (inn >= 4 or balls_bowled >= 24):
        confidence_level = "HIGH"
        confidence_badge = "High Statistical Significance (Verified over 5+ matches)"
    elif matches_played >= 2 and (inn >= 2 or balls_bowled >= 12):
        confidence_level = "MEDIUM"
        confidence_badge = "Moderate Sample (2-4 matches observed)"
    else:
        confidence_level = "LOW"
        confidence_badge = "Limited Sample (Single tournament appearance / trial rating applicable)"

    # ---------------- 8. 6-AXIS RADAR METRICS (0-100) ----------------
    # 1. Batting Power: SR & Boundaries
    radar_power = round(min(100.0, (sr / 150.0 * 60.0) + (bpct / 50.0 * 40.0)), 1) if balls_faced > 0 else 0.0
    # 2. Batting Reliability: Avg, Runs/Innings, Not-out resistance
    radar_reliability = round(min(100.0, (avg / 18.0 * 60.0) + (career_batting.get("not_out_percentage", 0.0) * 0.4)), 1) if inn > 0 else 0.0
    # 3. Bowling Economy: Run suppression
    radar_economy = round(max(0.0, min(100.0, (8.5 - eco) / 4.5 * 100.0)), 1) if balls_bowled > 0 else 0.0
    # 4. Bowling Penetration: Wickets per over & strike rate
    radar_penetration = round(min(100.0, (wkts_per_over / 0.65 * 100.0)), 1) if balls_bowled > 0 else 0.0
    # 5. Match Impact: Clutch & Milestones
    radar_impact = match_impact_score
    # 6. Consistency: Combined stability
    radar_consistency = consistency_score

    radar_profile = {
        "batting_power": radar_power,
        "batting_reliability": radar_reliability,
        "bowling_economy": radar_economy,
        "bowling_penetration": radar_penetration,
        "match_impact": radar_impact,
        "consistency": radar_consistency
    }

    return {
        "overall_player_intelligence_score": overall_pis,
        "batting_intelligence_score": batting_score,
        "bowling_intelligence_score": bowling_score,
        "all_rounder_intelligence_score": all_rounder_score,
        "consistency_intelligence_score": consistency_score,
        "match_impact_intelligence_score": match_impact_score,
        "role_classification": role,
        "confidence_level": confidence_level,
        "confidence_badge": confidence_badge,
        "weights_used": weights,
        "explanations": {
            "batting": batting_explanation,
            "bowling": bowling_explanation,
            "all_rounder": all_rounder_explanation,
            "consistency": consistency_explanation,
            "match_impact": match_impact_explanation
        },
        "radar_profile": radar_profile
    }
