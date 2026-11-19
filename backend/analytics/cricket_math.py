import math
from typing import Dict, Any, List, Optional

def overs_to_balls(overs: float) -> int:
    """Converts cricket overs (e.g., 5.4) to total legal balls (34)."""
    ov_int = int(overs)
    balls_rem = int(round((overs - ov_int) * 10))
    return ov_int * 6 + balls_rem

def balls_to_overs(balls: int) -> float:
    """Converts total legal balls (e.g., 34) to cricket overs (5.4)."""
    completed_overs = balls // 6
    remaining_balls = balls % 6
    return float(f"{completed_overs}.{remaining_balls}")

def format_overs(balls: int) -> str:
    """Returns formatted string representation of overs (e.g., '5.4' or '2.0')."""
    return f"{balls // 6}.{balls % 6}"

def calculate_batting_metrics(innings_records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes career/season aggregate batting metrics strictly from raw totals.
    Never averages averages. Handles undefeated cases, boundary rates, 6-over milestones,
    and consistency/explosiveness indices.
    """
    matches = len(set(r.get('match_id') for r in innings_records if r.get('match_id') is not None))
    innings = len(innings_records)
    total_runs = sum(r.get('runs', 0) for r in innings_records)
    total_balls = sum(r.get('balls', 0) for r in innings_records)
    total_4s = sum(r.get('fours', 0) for r in innings_records)
    total_6s = sum(r.get('sixes', 0) for r in innings_records)
    not_outs = sum(1 for r in innings_records if r.get('is_not_out', False))
    outs = innings - not_outs

    # Highest score with undefeated distinction
    highest_score_raw = 0
    highest_score_not_out = False
    if innings_records:
        highest_record = max(innings_records, key=lambda x: (x.get('runs', 0), 1 if x.get('is_not_out') else 0))
        highest_score_raw = highest_record.get('runs', 0)
        highest_score_not_out = bool(highest_record.get('is_not_out', False))
    
    highest_score_display = f"{highest_score_raw}*" if highest_score_not_out else str(highest_score_raw)

    # Batting average
    is_undefeated = (outs == 0 and total_runs > 0)
    if outs > 0:
        batting_avg = round(total_runs / outs, 2)
        batting_avg_strict = batting_avg
        average_display = f"{batting_avg:.2f}"
    elif is_undefeated:
        batting_avg = float(total_runs) # Backward-compatibility float
        batting_avg_strict = None      # Strict statistical undefined indicator
        average_display = f"{total_runs}*"
    else:
        batting_avg = 0.0
        batting_avg_strict = 0.0
        average_display = "0.00"

    # Strike rate & runs per innings
    strike_rate = round((total_runs / total_balls) * 100, 2) if total_balls > 0 else 0.0
    runs_per_innings = round(total_runs / innings, 2) if innings > 0 else 0.0

    # Boundary metrics
    boundary_runs = (total_4s * 4) + (total_6s * 6)
    boundary_pct = round((boundary_runs / total_runs) * 100, 2) if total_runs > 0 else 0.0
    total_boundaries = total_4s + total_6s
    balls_per_boundary = round(total_balls / total_boundaries, 2) if total_boundaries > 0 else float(total_balls)
    boundary_balls_pct = round((total_boundaries / total_balls) * 100, 2) if total_balls > 0 else 0.0

    # Ducks & Not Out percentages
    duck_count = sum(1 for r in innings_records if r.get('runs', 0) == 0 and not r.get('is_not_out', False))
    duck_pct = round((duck_count / innings) * 100, 2) if innings > 0 else 0.0
    not_out_pct = round((not_outs / innings) * 100, 2) if innings > 0 else 0.0

    # Milestone counts for 6-over underarm cricket
    scores_10_plus = sum(1 for r in innings_records if r.get('runs', 0) >= 10)
    pct_10_plus = round((scores_10_plus / innings) * 100, 1) if innings > 0 else 0.0

    scores_15_plus = sum(1 for r in innings_records if r.get('runs', 0) >= 15)
    pct_15_plus = round((scores_15_plus / innings) * 100, 1) if innings > 0 else 0.0

    scores_20_plus = sum(1 for r in innings_records if r.get('runs', 0) >= 20)
    pct_20_plus = round((scores_20_plus / innings) * 100, 1) if innings > 0 else 0.0

    scores_30_plus = sum(1 for r in innings_records if r.get('runs', 0) >= 30)
    pct_30_plus = round((scores_30_plus / innings) * 100, 1) if innings > 0 else 0.0

    scores_50_plus = sum(1 for r in innings_records if r.get('runs', 0) >= 50)
    pct_50_plus = round((scores_50_plus / innings) * 100, 1) if innings > 0 else 0.0

    # Consistency index: variance in innings scores (0-100)
    if innings > 1:
        mean_score = total_runs / innings
        variance = sum((r.get('runs', 0) - mean_score) ** 2 for r in innings_records) / (innings - 1)
        std_dev = math.sqrt(variance)
        cv = (std_dev / mean_score) if mean_score > 0 else 1.0
        consistency_index = round(max(0.0, min(100.0, 100.0 - (cv * 35.0))), 1)
    elif innings == 1:
        consistency_index = 50.0
    else:
        consistency_index = 0.0

    # Batting explosiveness index (0-100)
    # Combines scoring velocity (SR) and boundary generation capability
    sr_comp = min(60.0, (strike_rate / 150.0) * 60.0)
    bnd_comp = min(40.0, (boundary_pct / 60.0) * 40.0)
    explosiveness_index = round(min(100.0, max(0.0, sr_comp + bnd_comp)), 1) if total_balls > 0 else 0.0

    return {
        "matches": matches,
        "innings": innings,
        "total_runs": total_runs,
        "total_balls": total_balls,
        "outs": outs,
        "not_outs": not_outs,
        "is_undefeated": is_undefeated,
        "batting_average": batting_avg,
        "batting_average_strict": batting_avg_strict,
        "average_display": average_display,
        "strike_rate": strike_rate,
        "runs_per_innings": runs_per_innings,
        "highest_score": highest_score_raw,
        "highest_score_not_out": highest_score_not_out,
        "highest_score_display": highest_score_display,
        "fours": total_4s,
        "sixes": total_6s,
        "total_boundaries": total_boundaries,
        "boundary_runs": boundary_runs,
        "boundary_percentage": boundary_pct,
        "boundary_runs_percentage": boundary_pct,
        "boundary_balls_percentage": boundary_balls_pct,
        "balls_per_boundary": balls_per_boundary,
        "duck_count": duck_count,
        "duck_percentage": duck_pct,
        "not_out_percentage": not_out_pct,
        "scores_10_plus": scores_10_plus,
        "pct_10_plus": pct_10_plus,
        "scores_15_plus": scores_15_plus,
        "pct_15_plus": pct_15_plus,
        "scores_20_plus": scores_20_plus,
        "pct_20_plus": pct_20_plus,
        "scores_30_plus": scores_30_plus,
        "pct_30_plus": pct_30_plus,
        "scores_50_plus": scores_50_plus,
        "pct_50_plus": pct_50_plus,
        "consistency_index": consistency_index,
        "explosiveness_index": explosiveness_index
    }

def calculate_bowling_metrics(bowling_records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes career/season aggregate bowling metrics strictly from raw totals.
    Calculates overs using actual balls (never as decimals).
    """
    matches = len(set(r.get('match_id') for r in bowling_records if r.get('match_id') is not None))
    bowling_innings = len(bowling_records)
    total_balls = sum(r.get('legal_balls', 0) for r in bowling_records)
    total_runs_conceded = sum(r.get('runs_conceded', 0) for r in bowling_records)
    total_wickets = sum(r.get('wickets', 0) for r in bowling_records)
    total_maidens = sum(r.get('maidens', 0) for r in bowling_records)
    total_dots = sum(r.get('dot_balls', 0) for r in bowling_records)
    total_4s_c = sum(r.get('fours_conceded', 0) for r in bowling_records)
    total_6s_c = sum(r.get('sixes_conceded', 0) for r in bowling_records)
    total_wides = sum(r.get('wides', 0) for r in bowling_records)
    total_no_balls = sum(r.get('no_balls', 0) for r in bowling_records)

    total_overs = balls_to_overs(total_balls)
    overs_display = format_overs(total_balls)
    
    # Economy strictly using legal deliveries
    economy = round((total_runs_conceded / (total_balls / 6.0)), 2) if total_balls > 0 else 0.0

    # Bowling Average & Strike Rate
    bowling_avg = round(total_runs_conceded / total_wickets, 2) if total_wickets > 0 else None
    bowling_sr = round(total_balls / total_wickets, 2) if total_wickets > 0 else None

    # Wickets per match / innings
    wickets_per_match = round(total_wickets / matches, 2) if matches > 0 else 0.0
    wickets_per_innings = round(total_wickets / bowling_innings, 2) if bowling_innings > 0 else 0.0

    # Dot ball percentage
    dot_ball_pct = round((total_dots / total_balls) * 100, 2) if total_balls > 0 else 0.0

    # Boundary concession percentages
    boundary_runs_c = (total_4s_c * 4) + (total_6s_c * 6)
    boundary_concession_pct = round((boundary_runs_c / total_runs_conceded) * 100, 2) if total_runs_conceded > 0 else 0.0
    boundary_concession_balls_pct = round(((total_4s_c + total_6s_c) / total_balls) * 100, 2) if total_balls > 0 else 0.0

    # Best bowling figures (wkt desc, runs asc, balls asc)
    best_fig = "0/0"
    if bowling_records:
        sorted_records = sorted(
            bowling_records,
            key=lambda x: (-x.get('wickets', 0), x.get('runs_conceded', 0), x.get('legal_balls', 0))
        )
        best = sorted_records[0]
        best_fig = f"{best.get('wickets', 0)}/{best.get('runs_conceded', 0)}"

    # Multi-wicket performances (2+ wkts in 1-2 over spell)
    two_plus_wickets = sum(1 for r in bowling_records if r.get('wickets', 0) >= 2)
    multi_wicket_frequency = round((two_plus_wickets / bowling_innings) * 100, 1) if bowling_innings > 0 else 0.0

    # Bowling consistency index: variance in economy across spells
    if bowling_innings > 1:
        spell_ecos = [
            (r.get('runs_conceded', 0) / (r.get('legal_balls', 1) / 6.0))
            for r in bowling_records if r.get('legal_balls', 0) > 0
        ]
        if len(spell_ecos) > 1:
            mean_eco = sum(spell_ecos) / len(spell_ecos)
            var_eco = sum((e - mean_eco) ** 2 for e in spell_ecos) / (len(spell_ecos) - 1)
            std_eco = math.sqrt(var_eco)
            bowling_consistency_index = round(max(0.0, min(100.0, 100.0 - (std_eco * 12.0))), 1)
        else:
            bowling_consistency_index = 50.0
    elif bowling_innings == 1:
        bowling_consistency_index = 50.0
    else:
        bowling_consistency_index = 0.0

    return {
        "matches": matches,
        "bowling_innings": bowling_innings,
        "legal_balls": total_balls,
        "overs": total_overs,
        "overs_display": overs_display,
        "runs_conceded": total_runs_conceded,
        "wickets": total_wickets,
        "maidens": total_maidens,
        "dot_balls": total_dots,
        "fours_conceded": total_4s_c,
        "sixes_conceded": total_6s_c,
        "wides": total_wides,
        "no_balls": total_no_balls,
        "economy": economy,
        "bowling_average": bowling_avg,
        "bowling_strike_rate": bowling_sr,
        "wickets_per_match": wickets_per_match,
        "wickets_per_innings": wickets_per_innings,
        "dot_ball_percentage": dot_ball_pct,
        "boundary_concession_percentage": boundary_concession_pct,
        "boundary_concession_runs_pct": boundary_concession_pct,
        "boundary_concession_balls_pct": boundary_concession_balls_pct,
        "best_figures": best_fig,
        "two_plus_wickets": two_plus_wickets,
        "multi_wicket_frequency": multi_wicket_frequency,
        "bowling_consistency_index": bowling_consistency_index
    }

def calculate_situational_splits(
    batting_records: List[Dict[str, Any]],
    bowling_records: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Computes granular situational splits:
    - Batting First (Innings 1) vs Chasing (Innings 2)
    - Bowling First (Innings 1) vs Defending (Innings 2)
    """
    bat_first = [r for r in batting_records if r.get('innings_number') == 1]
    bat_chase = [r for r in batting_records if r.get('innings_number') == 2]

    bowl_first = [r for r in bowling_records if r.get('innings_number') == 1]
    bowl_defend = [r for r in bowling_records if r.get('innings_number') == 2]

    return {
        "batting_first": calculate_batting_metrics(bat_first),
        "chasing": calculate_batting_metrics(bat_chase),
        "bowling_first": calculate_bowling_metrics(bowl_first),
        "defending": calculate_bowling_metrics(bowl_defend)
    }

def calculate_all_rounder_metrics(
    batting_records: List[Dict[str, Any]],
    bowling_records: List[Dict[str, Any]],
    total_matches: int
) -> Dict[str, Any]:
    """
    Computes all-rounder participation, dual-discipline impact frequency,
    and role classification.
    """
    bat_matches = set(r.get('match_id') for r in batting_records if r.get('match_id') is not None)
    bowl_matches = set(r.get('match_id') for r in bowling_records if r.get('match_id') is not None)

    # Matches where player performed both disciplines
    both_matches = bat_matches.intersection(bowl_matches)
    both_count = len(both_matches)
    both_pct = round((both_count / total_matches) * 100, 1) if total_matches > 0 else 0.0

    # Build match-by-match lookup for simultaneous high-impact
    bat_by_match = {r.get('match_id'): r.get('runs', 0) for r in batting_records}
    bowl_by_match = {r.get('match_id'): r.get('wickets', 0) for r in bowling_records}

    all_match_ids = set(bat_by_match.keys()).union(bowl_by_match.keys())

    impact_count = 0
    any_count = 0
    for mid in all_match_ids:
        r = bat_by_match.get(mid, 0)
        w = bowl_by_match.get(mid, 0)
        if r >= 10 and w >= 1:
            impact_count += 1
        if r >= 10 or w >= 1:
            any_count += 1

    impact_pct = round((impact_count / total_matches) * 100, 1) if total_matches > 0 else 0.0
    any_pct = round((any_count / total_matches) * 100, 1) if total_matches > 0 else 0.0

    # Classify Role based on physical tournament parameters
    total_runs = sum(r.get('runs', 0) for r in batting_records)
    total_balls_faced = sum(r.get('balls', 0) for r in batting_records)
    total_balls_bowled = sum(r.get('legal_balls', 0) for r in bowling_records)
    total_wickets = sum(r.get('wickets', 0) for r in bowling_records)

    if total_balls_bowled < 6 and total_runs >= 10:
        role_classification = "Pure Batsman"
    elif total_balls_bowled < 6 and total_runs < 10:
        role_classification = "Specialist Batsman"
    elif total_balls_faced < 6 and total_balls_bowled >= 12:
        role_classification = "Pure Bowler"
    elif total_runs >= 25 and total_balls_bowled >= 18 and total_wickets >= 2:
        role_classification = "Balanced All-Rounder"
    elif total_runs >= 20 and total_balls_bowled >= 6:
        role_classification = "Batting All-Rounder"
    elif total_balls_bowled >= 18 and total_wickets >= 2 and total_runs >= 10:
        role_classification = "Bowling All-Rounder"
    elif total_balls_bowled >= 12:
        role_classification = "Bowling All-Rounder"
    else:
        role_classification = "Specialist / Emerging"

    return {
        "both_disciplines_matches": both_count,
        "both_disciplines_pct": both_pct,
        "impact_all_rounder_matches": impact_count,
        "impact_all_rounder_pct": impact_pct,
        "any_contribution_matches": any_count,
        "all_rounder_consistency": any_pct,
        "role_classification": role_classification
    }
