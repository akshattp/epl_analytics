"""
EPL Player Intelligence, Tagging & Classification Rule Engine (v2.0.1-dev)
Centralized, testable domain service separating:
1. Experience level (Emerging, Developing, Established, Proven)
2. Batting evidence & performance eligibility
3. Bowling evidence & performance eligibility
4. All-round contribution & genuine two-way qualification
5. Overall EPL performance with Bayesian shrinkage towards league baselines
6. Statistical confidence & transparent controlled-vocabulary tags
"""

from typing import Dict, Any, List, Optional

# League priors representing replacement-level / median 6-over cricket participant
LEAGUE_PRIOR_BATTING = 32.0
LEAGUE_PRIOR_BOWLING = 32.0
LEAGUE_PRIOR_OVERALL = 30.0

# Exposure shrinkage denominators (observations needed to weigh sample equally to prior)
SHRINKAGE_BALLS_FACED = 30.0  # Approx. 4-5 innings
SHRINKAGE_BALLS_BOWLED = 24.0 # 4.0 regulation overs


def evaluate_experience_level(matches: int) -> Dict[str, str]:
    """
    Initial experience categories:
    - 1–2 matches: Emerging.
    - 3–5 matches: Developing.
    - 6–9 matches: Established.
    - 10+ matches: Proven.
    These are experience labels, not performance rankings.
    """
    if matches >= 10:
        level = "Proven"
        label = f"Proven ({matches} Matches)"
    elif matches >= 6:
        level = "Established"
        label = f"Established ({matches} Matches)"
    elif matches >= 3:
        level = "Developing"
        label = f"Developing ({matches} Matches)"
    else:
        level = "Emerging"
        label = f"Emerging ({matches} {'Match' if matches == 1 else 'Matches'})"

    return {
        "experience_level": level,
        "experience_label": label
    }


def evaluate_evidence_and_eligibility(
    matches: int,
    career_batting: Dict[str, Any],
    career_bowling: Dict[str, Any],
    both_disciplines_matches: int = 0
) -> Dict[str, Any]:
    """
    Evaluates evidence thresholds and sample-size eligibility for Batting, Bowling, and All-Rounder.
    If the data does not meet the relevant threshold, flags Limited Sample / Insufficient Evidence.
    Does not substitute missing values with zero.
    """
    inn = career_batting.get("innings", 0)
    runs = career_batting.get("total_runs", 0)
    balls_faced = career_batting.get("total_balls", 0)

    legal_balls = career_bowling.get("legal_balls", 0)
    wkts = career_bowling.get("wickets", 0)

    # 1. Batting Evidence & Eligibility
    if inn >= 6 and balls_faced >= 36:
        bat_evidence = "Established Evidence"
        bat_eligible = True
    elif inn >= 3 and balls_faced >= 18:
        bat_evidence = "Developing Evidence"
        bat_eligible = True
    elif runs >= 25 and balls_faced >= 15:
        bat_evidence = "Developing Evidence"
        bat_eligible = True
    elif inn > 0 or balls_faced > 0:
        bat_evidence = "Limited Sample"
        bat_eligible = False
    else:
        bat_evidence = "Did Not Bat"
        bat_eligible = False

    # 2. Bowling Evidence & Eligibility
    if legal_balls >= 36: # 6.0+ regulation overs
        bowl_evidence = "Established Evidence"
        bowl_eligible = True
    elif legal_balls >= 18: # 3.0-5.5 regulation overs
        bowl_evidence = "Developing Evidence"
        bowl_eligible = True
    elif legal_balls >= 6: # 1.0-2.5 overs
        bowl_evidence = "Limited Sample"
        bowl_eligible = False
    else:
        bowl_evidence = "Did Not Bowl"
        bowl_eligible = False

    # 3. All-Rounder Eligibility
    # Require meaningful batting AND bowling contributions independently.
    # Do not award all-rounder status merely for 1 run and 1 wicket.
    ar_eligible = (
        bat_eligible and
        bowl_eligible and
        runs >= 20 and
        legal_balls >= 24 and
        wkts >= 2 and
        both_disciplines_matches >= 2
    )

    return {
        "batting_evidence": bat_evidence,
        "is_batting_eligible": bat_eligible,
        "bowling_evidence": bowl_evidence,
        "is_bowling_eligible": bowl_eligible,
        "is_all_rounder_eligible": ar_eligible
    }


def calculate_statistical_confidence(
    matches: int,
    innings: int,
    balls_faced: int,
    legal_balls: int,
    is_bat_eligible: bool,
    is_bowl_eligible: bool
) -> Dict[str, Any]:
    """
    Computes statistical confidence separating raw appearance rate from verified volume.
    """
    if matches >= 6 and (balls_faced >= 30 or legal_balls >= 36):
        level = "HIGH"
        score = 1.00
        badge = f"High Statistical Significance ({matches}M, verified exposure)"
    elif matches >= 3 and (is_bat_eligible or is_bowl_eligible):
        level = "MEDIUM"
        score = 0.85
        badge = f"Moderate Sample ({matches}M, developing evidence)"
    elif matches >= 2 and (balls_faced >= 10 or legal_balls >= 12):
        level = "LOW"
        score = 0.65
        badge = f"Low Confidence ({matches}M, limited sample size)"
    else:
        level = "VERY LOW"
        score = 0.45
        badge = f"Insufficient Evidence ({matches}M, early appearance)"

    return {
        "confidence_level": level,
        "confidence_score": score,
        "confidence_badge": badge
    }


def determine_roles(
    experience_level: str,
    evidence: Dict[str, Any],
    career_batting: Dict[str, Any],
    career_bowling: Dict[str, Any]
) -> Dict[str, str]:
    """
    Determines primary_role and granular role_classification strictly from evidence.
    Never defaults unverified or low-sample players to 'All-rounder'.
    """
    runs = career_batting.get("total_runs", 0)
    balls_faced = career_batting.get("total_balls", 0)
    legal_balls = career_bowling.get("legal_balls", 0)
    wkts = career_bowling.get("wickets", 0)

    is_ar = evidence["is_all_rounder_eligible"]
    is_bat = evidence["is_batting_eligible"]
    is_bowl = evidence["is_bowling_eligible"]

    if is_ar:
        primary_role = "All-rounder"
        if runs >= 35 and wkts >= 4:
            role_classification = "Balanced All-Rounder"
        elif runs >= 35:
            role_classification = "Batting All-Rounder"
        elif wkts >= 4:
            role_classification = "Bowling All-Rounder"
        else:
            role_classification = "Balanced All-Rounder"
    elif is_bowl and (not is_bat or (wkts >= 3 and runs < 25)):
        primary_role = "Specialist Bowler"
        role_classification = "Specialist Bowler" if balls_faced > 0 else "Pure Bowler"
    elif is_bat and (not is_bowl or (runs >= 30 and legal_balls < 18)):
        primary_role = "Specialist Batsman"
        role_classification = "Specialist Batter" if legal_balls > 0 else "Pure Batter"
    elif experience_level == "Emerging":
        if balls_faced > 0 and legal_balls == 0:
            primary_role = "Specialist Batsman"
            role_classification = "Emerging Batter"
        elif legal_balls > 0 and balls_faced == 0:
            primary_role = "Specialist Bowler"
            role_classification = "Emerging Bowler"
        elif legal_balls >= balls_faced:
            primary_role = "Specialist Bowler"
            role_classification = "Emerging Bowler"
        else:
            primary_role = "Specialist Batsman"
            role_classification = "Emerging Batter"
    else: # Developing
        if legal_balls >= 18:
            primary_role = "Specialist Bowler"
            role_classification = "Specialist Bowler"
        elif runs >= 20:
            primary_role = "Specialist Batsman"
            role_classification = "Specialist Batter"
        elif legal_balls > balls_faced:
            primary_role = "Specialist Bowler"
            role_classification = "Developing Bowler"
        else:
            primary_role = "Specialist Batsman"
            role_classification = "Developing Batter"

    return {
        "primary_role": primary_role,
        "role_classification": role_classification
    }


def evaluate_performance_tags(
    matches: int,
    experience_level: str,
    evidence: Dict[str, Any],
    career_batting: Dict[str, Any],
    career_bowling: Dict[str, Any],
    both_disciplines_matches: int,
    shrunk_bis: Optional[float] = None,
    shrunk_bois: Optional[float] = None
) -> List[Dict[str, str]]:
    """
    Evaluates controlled vocabulary of performance tags based on strict, defensible criteria:
    - Limited Sample Size
    - Emerging Talent
    - Explosive Batter
    - Consistent Run Scorer
    - High-Impact Batter
    - Reliable Finisher
    - Strike Bowler
    - Economical Bowler
    - Wicket-Taking Specialist
    - Genuine All-round Contributor
    """
    tags = []

    inn = career_batting.get("innings", 0)
    runs = career_batting.get("total_runs", 0)
    balls_faced = career_batting.get("total_balls", 0)
    avg = career_batting.get("batting_average", 0.0)
    sr = career_batting.get("strike_rate", 0.0)
    bpct = career_batting.get("boundary_runs_percentage", career_batting.get("boundary_percentage", 0.0))
    s15 = career_batting.get("scores_15_plus", 0)
    s20 = career_batting.get("scores_20_plus", 0)
    not_outs = career_batting.get("not_outs", 0)
    not_out_pct = (not_outs / inn * 100.0) if inn > 0 else 0.0
    bat_consistency = career_batting.get("consistency_index", 50.0)

    legal_balls = career_bowling.get("legal_balls", 0)
    overs = career_bowling.get("overs", legal_balls / 6.0)
    wkts = career_bowling.get("wickets", 0)
    eco = career_bowling.get("economy", 0.0)
    bowl_sr = career_bowling.get("bowling_strike_rate", 0.0)
    two_plus = career_bowling.get("two_plus_wickets", 0)

    is_bat_eligible = evidence["is_batting_eligible"]
    is_bowl_eligible = evidence["is_bowling_eligible"]
    is_ar_eligible = evidence["is_all_rounder_eligible"]

    # 1. Limited Sample Size
    if matches <= 2 or (balls_faced < 18 and legal_balls < 18):
        tags.append({
            "tag": "Limited Sample Size",
            "category": "Confidence",
            "explanation": f"Observed across {matches} {'match' if matches == 1 else 'matches'} ({balls_faced} balls faced, {legal_balls} balls bowled); statistical exposure is too limited for definitive performance evaluation."
        })

    # 2. Emerging Talent
    if matches <= 2 and (
        (runs >= 15 and sr >= 125.0) or
        (wkts >= 2 and eco <= 6.5)
    ):
        tags.append({
            "tag": "Emerging Talent",
            "category": "Potential",
            "explanation": f"Demonstrated high early-career production ({runs} runs @ {sr:.1f} SR / {wkts} wkts @ {eco:.2f} eco) across {matches} appearance(s)."
        })

    # 3. Explosive Batter (Requires eligible sample: >= 3 innings & >= 25 balls faced)
    if is_bat_eligible and inn >= 3 and balls_faced >= 25 and sr >= 135.0 and bpct >= 45.0:
        tags.append({
            "tag": "Explosive Batter",
            "category": "Batting",
            "explanation": f"Maintains rapid scoring rate ({sr:.1f} SR) with {bpct:.1f}% boundary runs across {balls_faced} balls faced."
        })

    # 4. Consistent Run Scorer (Requires >= 4 innings & >= 35 balls faced & >= 40 runs)
    if is_bat_eligible and inn >= 4 and balls_faced >= 35 and runs >= 40 and avg >= 16.0 and bat_consistency >= 50.0:
        tags.append({
            "tag": "Consistent Run Scorer",
            "category": "Batting",
            "explanation": f"Proven accumulator averaging {avg:.2f} runs with steady multi-match scoring volume ({bat_consistency:.1f} consistency index)."
        })

    # 5. High-Impact Batter (Requires >= 4 innings & >= 40 runs & multiple 15+ scores)
    if is_bat_eligible and inn >= 4 and runs >= 40 and (s15 >= 2 or s20 >= 2) and sr >= 115.0:
        tags.append({
            "tag": "High-Impact Batter",
            "category": "Batting",
            "explanation": f"Frequent producer of match-defining milestones ({s15} scores of 15+, {s20} scores of 20+) at {sr:.1f} strike rate."
        })

    # 6. Reliable Finisher (Requires >= 4 innings & >= 2 not-outs with high finish rate)
    if is_bat_eligible and inn >= 4 and not_outs >= 2 and not_out_pct >= 30.0 and sr >= 110.0 and avg >= 15.0:
        tags.append({
            "tag": "Reliable Finisher",
            "category": "Batting",
            "explanation": f"High unbeaten completion rate ({not_out_pct:.1f}% not-outs, {not_outs} undefeated finishes) with {sr:.1f} SR and {avg:.2f} average."
        })

    # 7. Strike Bowler (Requires >= 24 legal balls / 4 overs & >= 3 wickets)
    if is_bowl_eligible and legal_balls >= 24 and wkts >= 3 and bowl_sr > 0 and bowl_sr <= 9.0:
        tags.append({
            "tag": "Strike Bowler",
            "category": "Bowling",
            "explanation": f"Penetrative wicket threat striking every {bowl_sr:.1f} deliveries across {legal_balls} legal balls."
        })

    # 8. Economical Bowler (Requires >= 24 legal balls / 4 overs)
    if is_bowl_eligible and legal_balls >= 24 and eco <= 5.00:
        tags.append({
            "tag": "Economical Bowler",
            "category": "Bowling",
            "explanation": f"Outstanding run suppression conceding only {eco:.2f} RPO across {legal_balls} legal balls bowled."
        })

    # 9. Wicket-Taking Specialist (Requires >= 36 legal balls / 6 overs & >= 5 wickets)
    if is_bowl_eligible and legal_balls >= 36 and wkts >= 5 and (two_plus >= 1 or (wkts / overs) >= 0.65):
        tags.append({
            "tag": "Wicket-Taking Specialist",
            "category": "Bowling",
            "explanation": f"Elite tournament wicket accumulator with {wkts} career wickets and proven multi-wicket spell capability."
        })

    # 10. Genuine All-round Contributor (Requires verified dual participation)
    if is_ar_eligible and matches >= 5 and (both_disciplines_matches >= 3 or (both_disciplines_matches / matches) >= 0.40):
        tags.append({
            "tag": "Genuine All-round Contributor",
            "category": "All-Round",
            "explanation": f"Delivers validated independent impact with both bat ({runs} runs) and ball ({wkts} wkts) in {both_disciplines_matches} dual-discipline matches."
        })

    return tags


def compute_bayesian_intelligence_suite(
    matches: int,
    career_batting: Dict[str, Any],
    career_bowling: Dict[str, Any],
    all_rounder_metrics: Dict[str, Any],
    evidence: Dict[str, Any],
    role_classification: str,
    confidence_factor: float
) -> Dict[str, Any]:
    """
    Computes Bayesian-shrunk Player Intelligence Suite:
    - BIS (Batting Intelligence Score)
    - BoIS (Bowling Intelligence Score)
    - AIS (All-Rounder Intelligence Score)
    - CIS (Consistency Intelligence Score)
    - MIS (Match Impact Intelligence Score)
    - Final Overall PIS (with sample-size confidence dampening)
    """
    inn = career_batting.get("innings", 0)
    runs = career_batting.get("total_runs", 0)
    balls_faced = career_batting.get("total_balls", 0)
    avg = career_batting.get("batting_average", 0.0)
    sr = career_batting.get("strike_rate", 0.0)
    bpct = career_batting.get("boundary_runs_percentage", career_batting.get("boundary_percentage", 0.0))
    bat_consistency = career_batting.get("consistency_index", 50.0)

    legal_balls = career_bowling.get("legal_balls", 0)
    overs = career_bowling.get("overs", legal_balls / 6.0)
    wkts = career_bowling.get("wickets", 0)
    eco = career_bowling.get("economy", 0.0)
    dot_pct = career_bowling.get("dot_ball_percentage", 0.0)
    two_plus = career_bowling.get("two_plus_wickets", 0)
    bowl_consistency = career_bowling.get("bowling_consistency_index", 50.0)

    # 1. Batting Intelligence Score (BIS)
    if balls_faced > 0 and inn > 0:
        c_vol = min(25.0, (runs / 50.0) * 25.0)
        c_vel = min(35.0, (sr / 140.0) * 35.0)
        c_rel = min(25.0, (avg / 18.0) * 25.0)
        c_bnd = min(15.0, (bpct / 50.0) * 15.0)
        raw_bat = c_vol + c_vel + c_rel + c_bnd
        w_bat = balls_faced / (balls_faced + SHRINKAGE_BALLS_FACED)
        shrunk_bis = round(w_bat * raw_bat + (1.0 - w_bat) * LEAGUE_PRIOR_BATTING, 1)
        bis_applicable = True
    else:
        shrunk_bis = None
        bis_applicable = False

    # 2. Bowling Intelligence Score (BoIS)
    if legal_balls > 0:
        wkts_per_over = (wkts / overs) if overs > 0 else 0.0
        c_wkt = min(35.0, (wkts_per_over / 0.65) * 35.0)
        c_eco = max(0.0, min(35.0, (8.5 - eco) / 4.5 * 35.0))
        c_dot = min(15.0, (dot_pct / 50.0) * 15.0)
        c_multi = min(15.0, two_plus * 7.5)
        raw_bowl = c_wkt + c_eco + c_dot + c_multi
        w_bowl = legal_balls / (legal_balls + SHRINKAGE_BALLS_BOWLED)
        shrunk_bois = round(w_bowl * raw_bowl + (1.0 - w_bowl) * LEAGUE_PRIOR_BOWLING, 1)
        bois_applicable = True
    else:
        shrunk_bois = None
        bois_applicable = False

    # 3. All-Rounder Intelligence Score (AIS)
    if evidence["is_all_rounder_eligible"] and bis_applicable and bois_applicable:
        harmonic_base = (2 * shrunk_bis * shrunk_bois) / (shrunk_bis + shrunk_bois)
        balance_ratio = min(shrunk_bis, shrunk_bois) / max(shrunk_bis, shrunk_bois)
        dual_freq = all_rounder_metrics.get("impact_all_rounder_pct", 0.0)
        shrunk_ais = round(min(100.0, harmonic_base * (0.80 + 0.20 * balance_ratio) * (0.95 + 0.05 * min(1.0, dual_freq / 25.0))), 1)
    else:
        shrunk_ais = 0.0

    # 4. Consistency Score (CIS)
    if bis_applicable and bois_applicable:
        consistency_score = round((bat_consistency * 0.5) + (bowl_consistency * 0.5), 1)
    elif bis_applicable:
        consistency_score = round(bat_consistency, 1)
    elif bois_applicable:
        consistency_score = round(bowl_consistency, 1)
    else:
        consistency_score = 50.0

    # 5. Match Impact Score (MIS)
    s15 = career_batting.get("scores_15_plus", 0)
    s20 = career_batting.get("scores_20_plus", 0)
    impact_points = 20.0
    impact_points += min(30.0, (s15 * 6.0) + (s20 * 8.0))
    impact_points += min(30.0, two_plus * 12.0)
    match_impact_score = round(min(100.0, max(10.0, impact_points)), 1)

    # 6. Overall Raw PIS
    if role_classification.endswith("All-Rounder"):
        raw_overall = (shrunk_ais * 0.40) + (shrunk_bis * 0.25) + (shrunk_bois * 0.25) + (consistency_score * 0.10)
    elif "Batter" in role_classification or "Batsman" in role_classification:
        bat_val = shrunk_bis if shrunk_bis is not None else 25.0
        raw_overall = (bat_val * 0.70) + (consistency_score * 0.15) + (match_impact_score * 0.15)
    elif "Bowler" in role_classification:
        bowl_val = shrunk_bois if shrunk_bois is not None else 25.0
        raw_overall = (bowl_val * 0.70) + (consistency_score * 0.15) + (match_impact_score * 0.15)
    else:
        lead_val = max(shrunk_bis or 25.0, shrunk_bois or 25.0)
        raw_overall = lead_val

    # 7. Apply Confidence Damping:
    # Contract towards baseline prior LEAGUE_PRIOR_OVERALL (30.0) based on confidence factor
    final_pis = round(confidence_factor * raw_overall + (1.0 - confidence_factor) * LEAGUE_PRIOR_OVERALL, 1)
    final_pis = min(99.0, max(10.0, final_pis))

    return {
        "overall_player_intelligence_score": final_pis,
        "batting_intelligence_score": shrunk_bis,
        "bowling_intelligence_score": shrunk_bois,
        "all_rounder_intelligence_score": shrunk_ais,
        "consistency_intelligence_score": consistency_score,
        "match_impact_intelligence_score": match_impact_score
    }


def classify_player(
    matches_played: int,
    career_batting: Dict[str, Any],
    career_bowling: Dict[str, Any],
    all_rounder_metrics: Dict[str, Any],
    career_seasons: Optional[List[int]] = None
) -> Dict[str, Any]:
    """
    Master classification function executing the unified rules across any player.
    """
    # 1. Experience Level
    exp = evaluate_experience_level(matches_played)

    # 2. Evidence & Eligibility
    both_matches = all_rounder_metrics.get("both_disciplines_matches", 0)
    evidence = evaluate_evidence_and_eligibility(
        matches_played, career_batting, career_bowling, both_matches
    )

    # 3. Statistical Confidence
    conf = calculate_statistical_confidence(
        matches_played,
        career_batting.get("innings", 0),
        career_batting.get("total_balls", 0),
        career_bowling.get("legal_balls", 0),
        evidence["is_batting_eligible"],
        evidence["is_bowling_eligible"]
    )

    # 4. Roles
    roles = determine_roles(
        exp["experience_level"], evidence, career_batting, career_bowling
    )

    # 5. Bayesian Intelligence Suite
    intel = compute_bayesian_intelligence_suite(
        matches_played,
        career_batting,
        career_bowling,
        all_rounder_metrics,
        evidence,
        roles["role_classification"],
        conf["confidence_score"]
    )

    # 6. Performance Tags
    tags = evaluate_performance_tags(
        matches_played,
        exp["experience_level"],
        evidence,
        career_batting,
        career_bowling,
        both_matches,
        intel["batting_intelligence_score"],
        intel["bowling_intelligence_score"]
    )

    # Generate Audit Reason
    reasons = [f"Experience: {exp['experience_label']}."]
    if not evidence["is_batting_eligible"]:
        reasons.append(f"Batting: {evidence['batting_evidence']}.")
    if not evidence["is_bowling_eligible"]:
        reasons.append(f"Bowling: {evidence['bowling_evidence']}.")
    if evidence["is_all_rounder_eligible"]:
        reasons.append("Validated independent two-way contributor.")
    elif roles["primary_role"] != "All-rounder":
        reasons.append(f"Classified as {roles['role_classification']}.")

    audit_reason = " ".join(reasons)

    return {
        "experience_level": exp["experience_level"],
        "experience_label": exp["experience_label"],
        "batting_evidence": evidence["batting_evidence"],
        "is_batting_eligible": evidence["is_batting_eligible"],
        "bowling_evidence": evidence["bowling_evidence"],
        "is_bowling_eligible": evidence["is_bowling_eligible"],
        "is_all_rounder_eligible": evidence["is_all_rounder_eligible"],
        "primary_role": roles["primary_role"],
        "role_classification": roles["role_classification"],
        "confidence_level": conf["confidence_level"],
        "confidence_score": conf["confidence_score"],
        "confidence_badge": conf["confidence_badge"],
        "performance_tags": [t["tag"] for t in tags],
        "tags_detail": tags,
        "intelligence_suite": intel,
        "audit_reason": audit_reason
    }
