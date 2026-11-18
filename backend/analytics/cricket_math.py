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

def calculate_batting_metrics(innings_records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes career/season aggregate batting metrics strictly from raw totals.
    Never averages averages.
    """
    matches = len(set(r.get('match_id') for r in innings_records))
    innings = len(innings_records)
    total_runs = sum(r['runs'] for r in innings_records)
    total_balls = sum(r['balls'] for r in innings_records)
    total_4s = sum(r['fours'] for r in innings_records)
    total_6s = sum(r['sixes'] for r in innings_records)
    not_outs = sum(1 for r in innings_records if r['is_not_out'])
    outs = innings - not_outs

    highest_score = max((r['runs'] for r in innings_records), default=0)
    
    # Batting average
    if outs > 0:
        batting_avg = round(total_runs / outs, 2)
    else:
        batting_avg = float(total_runs) # 0 dismissals

    # Strike rate
    strike_rate = round((total_runs / total_balls) * 100, 2) if total_balls > 0 else 0.0

    # Boundary metrics
    boundary_runs = (total_4s * 4) + (total_6s * 6)
    boundary_pct = round((boundary_runs / total_runs) * 100, 2) if total_runs > 0 else 0.0
    total_boundaries = total_4s + total_6s
    balls_per_boundary = round(total_balls / total_boundaries, 2) if total_boundaries > 0 else float(total_balls)

    # Milestone counts (for 6-over cricket: 20+, 30+, 50+)
    scores_20_plus = sum(1 for r in innings_records if r['runs'] >= 20)
    scores_30_plus = sum(1 for r in innings_records if r['runs'] >= 30)
    scores_50_plus = sum(1 for r in innings_records if r['runs'] >= 50)

    # Consistency index: variance in innings scores
    if len(innings_records) > 1:
        mean_score = total_runs / innings
        variance = sum((r['runs'] - mean_score) ** 2 for r in innings_records) / (innings - 1)
        std_dev = math.sqrt(variance)
        # Lower CV is more consistent; bounded 0-100
        cv = (std_dev / mean_score) if mean_score > 0 else 1.0
        consistency_index = round(max(0, min(100, 100 - (cv * 40))), 1)
    else:
        consistency_index = 50.0

    return {
        "matches": matches,
        "innings": innings,
        "total_runs": total_runs,
        "total_balls": total_balls,
        "outs": outs,
        "not_outs": not_outs,
        "batting_average": batting_avg,
        "strike_rate": strike_rate,
        "highest_score": highest_score,
        "fours": total_4s,
        "sixes": total_6s,
        "boundary_runs": boundary_runs,
        "boundary_percentage": boundary_pct,
        "balls_per_boundary": balls_per_boundary,
        "scores_20_plus": scores_20_plus,
        "scores_30_plus": scores_30_plus,
        "scores_50_plus": scores_50_plus,
        "consistency_index": consistency_index
    }

def calculate_bowling_metrics(bowling_records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes career/season aggregate bowling metrics strictly from raw totals.
    """
    matches = len(set(r.get('match_id') for r in bowling_records))
    bowling_innings = len(bowling_records)
    total_balls = sum(r['legal_balls'] for r in bowling_records)
    total_runs_conceded = sum(r['runs_conceded'] for r in bowling_records)
    total_wickets = sum(r['wickets'] for r in bowling_records)
    total_maidens = sum(r['maidens'] for r in bowling_records)
    total_dots = sum(r['dot_balls'] for r in bowling_records)
    total_4s_c = sum(r['fours_conceded'] for r in bowling_records)
    total_6s_c = sum(r['sixes_conceded'] for r in bowling_records)
    total_wides = sum(r['wides'] for r in bowling_records)
    total_no_balls = sum(r['no_balls'] for r in bowling_records)

    total_overs = balls_to_overs(total_balls)
    
    # Economy
    economy = round((total_runs_conceded / (total_balls / 6.0)), 2) if total_balls > 0 else 0.0

    # Bowling Average
    bowling_avg = round(total_runs_conceded / total_wickets, 2) if total_wickets > 0 else None

    # Bowling Strike Rate
    bowling_sr = round(total_balls / total_wickets, 2) if total_wickets > 0 else None

    # Dot ball percentage
    dot_ball_pct = round((total_dots / total_balls) * 100, 2) if total_balls > 0 else 0.0

    # Boundary concession percentage
    boundary_runs_c = (total_4s_c * 4) + (total_6s_c * 6)
    boundary_concession_pct = round((boundary_runs_c / total_runs_conceded) * 100, 2) if total_runs_conceded > 0 else 0.0

    # Best bowling figures (wkt desc, runs asc)
    best_fig = "0/0"
    if bowling_records:
        sorted_records = sorted(bowling_records, key=lambda x: (-x['wickets'], x['runs_conceded']))
        best = sorted_records[0]
        best_fig = f"{best['wickets']}/{best['runs_conceded']}"

    # Multi-wicket performances (2+ wkts in 1-2 over spell)
    two_plus_wickets = sum(1 for r in bowling_records if r['wickets'] >= 2)

    return {
        "matches": matches,
        "bowling_innings": bowling_innings,
        "legal_balls": total_balls,
        "overs": total_overs,
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
        "dot_ball_percentage": dot_ball_pct,
        "boundary_concession_percentage": boundary_concession_pct,
        "best_figures": best_fig,
        "two_plus_wickets": two_plus_wickets
    }
