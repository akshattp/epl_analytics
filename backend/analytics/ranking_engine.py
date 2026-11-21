"""
EPL 2.1-dev — Four-Tier Ranking Engine
=======================================
Four INDEPENDENT ranking systems, each using ONLY discipline-specific metrics:

  1. BAT  — Batting-only ranking (bowling has zero influence)
  2. BOWL — Bowling-only ranking (batting has zero influence)
  3. AR   — All-Round Contribution (dual-discipline, same-match bonus)
  4. OVERALL — Fair cross-role ranking (normalized, role-aware)

Each ranking:
  - Produces a 0–100 score
  - Applies Bayesian shrinkage towards a league replacement baseline
  - Maintains confidence SEPARATE from performance score
  - Provides a transparent component breakdown
  - Respects eligibility thresholds (ineligible players receive rank=None)
"""

from typing import Dict, Any, List, Optional, Tuple
import math

# ─────────────────────────────────────────────
# League baseline priors (replacement-level)
# Used for Bayesian shrinkage on small samples
# ─────────────────────────────────────────────
BAT_LEAGUE_PRIOR      = 28.0   # median raw BAT score across all 73 players
BOWL_LEAGUE_PRIOR     = 28.0   # median raw BOWL score
OVERALL_LEAGUE_PRIOR  = 25.0   # overall floor for all players

# Shrinkage denominators (observations needed to weight sample == prior)
BAT_SHRINK_BALLS      = 25.0   # ~4 innings worth of balls
BOWL_SHRINK_BALLS     = 18.0   # 3.0 overs

# ─────────────────────────────────────────────
# ELIGIBILITY THRESHOLDS
# ─────────────────────────────────────────────
BAT_MIN_BALLS         = 1      # any ball faced → appears in ranking (confidence shown)
BOWL_MIN_LEGAL_BALLS  = 6      # min 1 over bowled
AR_MIN_RUNS           = 20
AR_MIN_BALLS_FACED    = 18     # 3 innings equivalent
AR_MIN_WICKETS        = 3
AR_MIN_LEGAL_BALLS    = 18     # 3.0 overs
AR_MIN_MATCHES        = 3

# ─────────────────────────────────────────────
# BATTING RANKING ENGINE
# ─────────────────────────────────────────────

def compute_bat_score(career_batting: Dict[str, Any]) -> Dict[str, Any]:
    """
    Pure batting ranking score (0–100). No bowling data used.

    Components:
      Volume     [0–25]: Scoring volume relative to 50-run career benchmark
      Velocity   [0–30]: Strike rate relative to 135 benchmark
      Reliability[0–25]: Batting average relative to 18 avg benchmark;
                         handles undefeated (not-out all innings) correctly
      Boundary   [0–10]: Boundary run % relative to 50% benchmark
      Milestone  [0–10]: Match-winning innings frequency (scores 15+, 20+)
    """
    innings       = career_batting.get("innings", 0)
    total_runs    = career_batting.get("total_runs", 0)
    total_balls   = career_batting.get("total_balls", 0)
    strike_rate   = career_batting.get("strike_rate", 0.0)
    batting_avg   = career_batting.get("batting_average", 0.0)
    not_outs      = career_batting.get("not_outs", 0)
    outs          = innings - not_outs
    bpct          = career_batting.get("boundary_runs_percentage",
                       career_batting.get("boundary_percentage", 0.0))
    s15           = career_batting.get("scores_15_plus", 0)
    s20           = career_batting.get("scores_20_plus", 0)

    if total_balls == 0:
        return {
            "bat_score": None,
            "bat_score_raw": None,
            "bat_eligible": False,
            "bat_eligibility_reason": "Did Not Bat",
            "bat_components": {},
            "bat_shrinkage_weight": 0.0
        }

    # Component 1: Scoring volume
    c_volume = min(25.0, (total_runs / 50.0) * 25.0)

    # Component 2: Scoring velocity (SR)
    c_velocity = min(30.0, (strike_rate / 135.0) * 30.0)

    # Component 3: Reliability / average
    # For fully undefeated batters (outs==0), use runs/innings as proxy; cap at 20 avg equivalent
    if outs > 0:
        avg_for_score = batting_avg
    elif innings > 0:
        avg_for_score = min(20.0, total_runs / innings)  # treat not-out avg conservatively
    else:
        avg_for_score = 0.0
    c_reliability = min(25.0, (avg_for_score / 18.0) * 25.0)

    # Component 4: Boundary prowess
    c_boundary = min(10.0, (bpct / 50.0) * 10.0)

    # Component 5: Milestone innings frequency
    milestone_pct = ((s15 * 4.0) + (s20 * 6.0)) / max(innings, 1)
    c_milestone = min(10.0, min(10.0, milestone_pct))

    raw_bat = c_volume + c_velocity + c_reliability + c_boundary + c_milestone

    # Bayesian shrinkage: w = balls_faced / (balls_faced + shrink_denom)
    w = total_balls / (total_balls + BAT_SHRINK_BALLS)
    shrunk_bat = round(w * raw_bat + (1.0 - w) * BAT_LEAGUE_PRIOR, 1)
    shrunk_bat = min(99.0, max(0.0, shrunk_bat))

    return {
        "bat_score": shrunk_bat,
        "bat_score_raw": round(raw_bat, 1),
        "bat_eligible": True,
        "bat_eligibility_reason": "Eligible",
        "bat_shrinkage_weight": round(w, 3),
        "bat_components": {
            "volume":      round(c_volume, 1),
            "velocity":    round(c_velocity, 1),
            "reliability": round(c_reliability, 1),
            "boundary":    round(c_boundary, 1),
            "milestone":   round(c_milestone, 1),
            "formula": (
                "Score = (Volume[25] + Velocity[30] + Reliability[25] + "
                "Boundary[10] + Milestone[10]) × shrinkage_weight + "
                "league_prior × (1-weight)"
            )
        }
    }


# ─────────────────────────────────────────────
# BOWLING RANKING ENGINE
# ─────────────────────────────────────────────

def compute_bowl_score(career_bowling: Dict[str, Any]) -> Dict[str, Any]:
    """
    Pure bowling ranking score (0–100). No batting data used.

    Components:
      Wicket-taking [0–35]: Wickets per over vs 0.65/over benchmark (elite)
      Economy       [0–30]: Run suppression; EPL elite ≈ 3.5–5.0 RPO
      Dot Ball      [0–20]: Pressure generation; elite ≈ 55% dots
      Consistency   [0–15]: Bowling consistency index (spell-to-spell variance)
    """
    legal_balls  = career_bowling.get("legal_balls", 0)
    overs_float  = legal_balls / 6.0
    wickets      = career_bowling.get("wickets", 0)
    economy      = career_bowling.get("economy", 0.0)
    dot_pct      = career_bowling.get("dot_ball_percentage", 0.0)
    consistency  = career_bowling.get("bowling_consistency_index", 50.0)
    two_plus     = career_bowling.get("two_plus_wickets", 0)
    bow_inn      = career_bowling.get("bowling_innings", 0)

    if legal_balls < BOWL_MIN_LEGAL_BALLS:
        reason = "Did Not Bowl" if legal_balls == 0 else f"Insufficient Sample ({legal_balls} balls)"
        return {
            "bowl_score": None,
            "bowl_score_raw": None,
            "bowl_eligible": False,
            "bowl_eligibility_reason": reason,
            "bowl_components": {},
            "bowl_shrinkage_weight": 0.0
        }

    # Component 1: Wicket-taking threat
    wpo = wickets / overs_float if overs_float > 0 else 0.0
    c_wickets = min(35.0, (wpo / 0.65) * 35.0)

    # Component 2: Economy run-suppression
    # EPL range: Smeet Shah 3.57 (elite) → 9.0+ (poor)
    # Linear: score = max(0, (8.5 - eco) / 5.0 * 30)
    c_economy = max(0.0, min(30.0, (8.5 - economy) / 5.0 * 30.0))

    # Component 3: Dot ball pressure
    c_dots = min(20.0, (dot_pct / 55.0) * 20.0)

    # Component 4: Bowling consistency (spell-to-spell stability)
    # Consistency index from cricket_math: 0–100; 50 is baseline
    c_consistency = min(15.0, (consistency / 100.0) * 15.0)

    raw_bowl = c_wickets + c_economy + c_dots + c_consistency

    # Bayesian shrinkage
    w = legal_balls / (legal_balls + BOWL_SHRINK_BALLS)
    shrunk_bowl = round(w * raw_bowl + (1.0 - w) * BOWL_LEAGUE_PRIOR, 1)
    shrunk_bowl = min(99.0, max(0.0, shrunk_bowl))

    return {
        "bowl_score": shrunk_bowl,
        "bowl_score_raw": round(raw_bowl, 1),
        "bowl_eligible": True,
        "bowl_eligibility_reason": "Eligible",
        "bowl_shrinkage_weight": round(w, 3),
        "bowl_components": {
            "wicket_taking": round(c_wickets, 1),
            "economy":       round(c_economy, 1),
            "dot_balls":     round(c_dots, 1),
            "consistency":   round(c_consistency, 1),
            "formula": (
                "Score = (Wickets[35] + Economy[30] + DotBalls[20] + Consistency[15]) "
                "× shrinkage_weight + league_prior × (1-weight)"
            )
        }
    }


# ─────────────────────────────────────────────
# ALL-ROUND RANKING ENGINE
# ─────────────────────────────────────────────

def compute_ar_score(
    career_batting: Dict[str, Any],
    career_bowling: Dict[str, Any],
    all_rounder_metrics: Dict[str, Any],
    bat_result: Dict[str, Any],
    bowl_result: Dict[str, Any],
    matches_played: int
) -> Dict[str, Any]:
    """
    All-Round Contribution Score (0–100).

    Eligibility requirements (all must be met):
      - career runs >= 20
      - balls faced >= 18
      - career wickets >= 3
      - legal balls >= 18
      - matches played >= 3

    Formula:
      1. Discipline-weighted combination of BAT and BOWL scores
         (weighted by relative discipline exposure, not equal 50/50)
      2. Balance bonus: closer to 50/50 contribution → up to +10 pts
      3. Same-match dual impact bonus: matches with ≥10 runs AND ≥1 wkt → up to +8 pts

    Key distinction:
      - Player A: 50 runs in Match 1, 3 wkts in Match 3 → qualifies, no dual bonus
      - Player B: 50 runs AND 3 wkts in Match 1 → qualifies + dual bonus
    """
    runs        = career_batting.get("total_runs", 0)
    balls_faced = career_batting.get("total_balls", 0)
    wickets     = career_bowling.get("wickets", 0)
    legal_balls = career_bowling.get("legal_balls", 0)

    # Eligibility check
    if (runs < AR_MIN_RUNS or balls_faced < AR_MIN_BALLS_FACED or
            wickets < AR_MIN_WICKETS or legal_balls < AR_MIN_LEGAL_BALLS or
            matches_played < AR_MIN_MATCHES):
        reasons = []
        if runs < AR_MIN_RUNS:        reasons.append(f"runs {runs}<{AR_MIN_RUNS}")
        if balls_faced < AR_MIN_BALLS_FACED: reasons.append(f"balls faced {balls_faced}<{AR_MIN_BALLS_FACED}")
        if wickets < AR_MIN_WICKETS:  reasons.append(f"wickets {wickets}<{AR_MIN_WICKETS}")
        if legal_balls < AR_MIN_LEGAL_BALLS: reasons.append(f"legal_balls {legal_balls}<{AR_MIN_LEGAL_BALLS}")
        if matches_played < AR_MIN_MATCHES:  reasons.append(f"matches {matches_played}<{AR_MIN_MATCHES}")
        return {
            "ar_score": None,
            "ar_eligible": False,
            "ar_eligibility_reason": "Ineligible: " + "; ".join(reasons),
            "ar_components": {}
        }

    if not bat_result.get("bat_eligible") or bat_result.get("bat_score") is None:
        return {
            "ar_score": None,
            "ar_eligible": False,
            "ar_eligibility_reason": "Ineligible: Batting score unavailable",
            "ar_components": {}
        }

    if not bowl_result.get("bowl_eligible") or bowl_result.get("bowl_score") is None:
        return {
            "ar_score": None,
            "ar_eligible": False,
            "ar_eligibility_reason": "Ineligible: Bowling score unavailable",
            "ar_components": {}
        }

    bat_score  = bat_result["bat_score"]
    bowl_score = bowl_result["bowl_score"]

    # Step 1: Discipline exposure weighting
    # Weight by relative balls (batting balls vs bowling balls)
    total_exposure = balls_faced + legal_balls
    bat_weight = balls_faced / total_exposure if total_exposure > 0 else 0.5
    bowl_weight = 1.0 - bat_weight

    discipline_base = (bat_score * bat_weight) + (bowl_score * bowl_weight)

    # Step 2: Balance bonus (rewards near-equal contribution)
    # ratio = min/max ∈ [0, 1]; 1.0 = perfectly balanced
    min_score = min(bat_score, bowl_score)
    max_score = max(bat_score, bowl_score)
    balance_ratio = min_score / max_score if max_score > 0 else 0.0
    balance_bonus = balance_ratio * 10.0  # up to +10

    # Step 3: Same-match dual impact bonus
    dual_matches  = all_rounder_metrics.get("impact_all_rounder_matches", 0)
    dual_pct      = dual_matches / matches_played if matches_played > 0 else 0.0
    dual_bonus    = min(8.0, dual_pct * 25.0)  # up to +8

    ar_raw = discipline_base + balance_bonus + dual_bonus
    ar_score = round(min(99.0, max(10.0, ar_raw)), 1)

    return {
        "ar_score": ar_score,
        "ar_eligible": True,
        "ar_eligibility_reason": "Eligible",
        "ar_components": {
            "bat_score_input":   bat_score,
            "bowl_score_input":  bowl_score,
            "bat_weight":        round(bat_weight, 3),
            "bowl_weight":       round(bowl_weight, 3),
            "discipline_base":   round(discipline_base, 1),
            "balance_ratio":     round(balance_ratio, 3),
            "balance_bonus":     round(balance_bonus, 1),
            "dual_impact_matches": dual_matches,
            "dual_pct":          round(dual_pct * 100, 1),
            "dual_bonus":        round(dual_bonus, 1),
            "formula": (
                "AR = (BAT×bat_weight + BOWL×bowl_weight) "
                "+ balance_bonus[max 10] + same_match_bonus[max 8]"
            )
        }
    }


# ─────────────────────────────────────────────
# OVERALL RANKING ENGINE
# ─────────────────────────────────────────────

def compute_overall_score(
    career_batting: Dict[str, Any],
    career_bowling: Dict[str, Any],
    bat_result: Dict[str, Any],
    bowl_result: Dict[str, Any],
    ar_result: Dict[str, Any],
    confidence_score: float,
    matches_played: int
) -> Dict[str, Any]:
    """
    Overall EPL Ranking Score (0–100).
    All 73 players compete on the SAME leaderboard.

    Role-normalized approach:
      - Pure BAT-eligible: score = BAT × 0.80 + consistency/milestone bonus × 0.20
      - Pure BOWL-eligible: score = BOWL × 0.80 + consistency/milestone bonus × 0.20
      - AR-eligible: score = max(
            AR × 0.90 + consistency × 0.10,
            (BAT × bat_weight + BOWL × bowl_weight) × 0.85 + dual_bonus_scaled × 0.15
          )
        → all-rounders get credit for BOTH disciplines

    Confidence damping: shrinks towards OVERALL_LEAGUE_PRIOR (25.0)
    """
    bat_score   = bat_result.get("bat_score")
    bowl_score  = bowl_result.get("bowl_score")
    ar_score    = ar_result.get("ar_score")
    bat_eligible  = bat_result.get("bat_eligible", False)
    bowl_eligible = bowl_result.get("bowl_eligible", False)
    ar_eligible   = ar_result.get("ar_eligible", False)

    innings      = career_batting.get("innings", 0)
    s15          = career_batting.get("scores_15_plus", 0)
    s20          = career_batting.get("scores_20_plus", 0)
    consistency  = career_batting.get("consistency_index", 50.0)
    bowl_consist = career_bowling.get("bowling_consistency_index", 50.0)

    # Milestone bonus component (0–10)
    milestone_bonus = 0.0
    if innings > 0:
        mfreq = ((s15 * 4.0) + (s20 * 7.0)) / max(innings, 1)
        milestone_bonus = min(10.0, mfreq)

    if ar_eligible and ar_score is not None:
        # All-rounder path: use the richer AR score, plus supplement
        ar_comps = ar_result.get("ar_components", {})
        dual_bonus_scaled = ar_comps.get("dual_bonus", 0.0)
        combined_consistency = (consistency * 0.5 + bowl_consist * 0.5)
        raw_overall = (
            ar_score * 0.80 +
            combined_consistency * 0.10 +
            (milestone_bonus + dual_bonus_scaled) * 0.05 +
            matches_played * 0.05  # experience term, capped at 5 pts for 10+ matches
        )
        raw_overall = min(raw_overall, 99.0)
        path = "All-Round"

    elif bat_eligible and not bowl_eligible:
        # Pure batter path
        raw_overall = (
            bat_score * 0.80 +
            consistency * 0.12 +
            milestone_bonus * 0.08
        )
        path = "Batting"

    elif bowl_eligible and not bat_eligible:
        # Pure bowler path
        raw_overall = (
            bowl_score * 0.80 +
            bowl_consist * 0.12 +
            milestone_bonus * 0.08
        )
        path = "Bowling"

    elif bat_eligible and bowl_eligible:
        # Both eligible but not AR-qualifying (single-discipline dominant)
        # Use whichever discipline is stronger as lead
        if bat_score >= bowl_score:
            raw_overall = bat_score * 0.65 + bowl_score * 0.25 + consistency * 0.10
        else:
            raw_overall = bowl_score * 0.65 + bat_score * 0.25 + bowl_consist * 0.10
        path = "Dual-Discipline"

    elif bat_eligible:
        raw_overall = bat_score * 0.80 + consistency * 0.12 + milestone_bonus * 0.08
        path = "Batting"

    elif bowl_eligible:
        raw_overall = bowl_score * 0.80 + bowl_consist * 0.12 + milestone_bonus * 0.08
        path = "Bowling"

    else:
        # Player with no bat or bowl exposure (appeared but no contribution)
        raw_overall = OVERALL_LEAGUE_PRIOR
        path = "No Evidence"

    # Confidence damping — high-confidence players → score stays near raw
    # low-confidence → shrinks towards OVERALL_LEAGUE_PRIOR
    final_overall = round(
        confidence_score * raw_overall + (1.0 - confidence_score) * OVERALL_LEAGUE_PRIOR, 1
    )
    final_overall = min(99.0, max(10.0, final_overall))

    return {
        "overall_score": final_overall,
        "overall_score_raw": round(raw_overall, 1),
        "overall_path": path,
        "overall_components": {
            "confidence_applied": round(confidence_score, 3),
            "milestone_bonus": round(milestone_bonus, 1),
            "path_description": path,
            "formula": (
                f"Overall[{path}] = confidence × raw_score + "
                f"(1-confidence) × {OVERALL_LEAGUE_PRIOR}"
            )
        }
    }


# ─────────────────────────────────────────────
# CONFIDENCE ENGINE
# ─────────────────────────────────────────────

def compute_ranking_confidence(
    matches: int,
    innings: int,
    balls_faced: int,
    legal_balls: int,
    bat_eligible: bool,
    bowl_eligible: bool
) -> Dict[str, Any]:
    """
    Computes per-ranking confidence scores.
    Confidence is SEPARATE from performance.
    A player can be an Explosive Batter (high perf) with VERY LOW confidence (2 matches).
    """
    # BAT confidence
    if innings >= 6 and balls_faced >= 50:
        bat_conf_level, bat_conf = "HIGH",    0.90
    elif innings >= 4 and balls_faced >= 30:
        bat_conf_level, bat_conf = "MEDIUM",  0.70
    elif innings >= 2 and balls_faced >= 12:
        bat_conf_level, bat_conf = "LOW",     0.50
    elif innings >= 1 and balls_faced > 0:
        bat_conf_level, bat_conf = "VERY LOW", 0.30
    else:
        bat_conf_level, bat_conf = "N/A",     0.0

    # BOWL confidence
    if legal_balls >= 48:   # 8+ overs
        bowl_conf_level, bowl_conf = "HIGH",    0.90
    elif legal_balls >= 24: # 4+ overs
        bowl_conf_level, bowl_conf = "MEDIUM",  0.70
    elif legal_balls >= 12: # 2+ overs
        bowl_conf_level, bowl_conf = "LOW",     0.50
    elif legal_balls >= 6:  # 1+ over
        bowl_conf_level, bowl_conf = "VERY LOW", 0.30
    else:
        bowl_conf_level, bowl_conf = "N/A",     0.0

    # AR confidence (minimum of both)
    ar_conf = min(bat_conf, bowl_conf)
    if ar_conf >= 0.80:   ar_conf_level = "HIGH"
    elif ar_conf >= 0.60: ar_conf_level = "MEDIUM"
    elif ar_conf >= 0.40: ar_conf_level = "LOW"
    elif ar_conf > 0:     ar_conf_level = "VERY LOW"
    else:                 ar_conf_level = "N/A"

    # Overall confidence (matches-weighted, broader exposure)
    if matches >= 8 and (balls_faced >= 40 or legal_balls >= 36):
        ovr_conf_level, ovr_conf = "HIGH",    0.90
    elif matches >= 5 and (bat_eligible or bowl_eligible):
        ovr_conf_level, ovr_conf = "MEDIUM",  0.72
    elif matches >= 3:
        ovr_conf_level, ovr_conf = "LOW",     0.52
    elif matches >= 1:
        ovr_conf_level, ovr_conf = "VERY LOW", 0.32
    else:
        ovr_conf_level, ovr_conf = "N/A",     0.0

    return {
        "bat_confidence_level": bat_conf_level,
        "bat_confidence_score": bat_conf,
        "bowl_confidence_level": bowl_conf_level,
        "bowl_confidence_score": bowl_conf,
        "ar_confidence_level": ar_conf_level,
        "ar_confidence_score": ar_conf,
        "overall_confidence_level": ovr_conf_level,
        "overall_confidence_score": ovr_conf
    }


# ─────────────────────────────────────────────
# MASTER RANKING FUNCTION
# ─────────────────────────────────────────────

def compute_player_rankings(
    career_batting: Dict[str, Any],
    career_bowling: Dict[str, Any],
    all_rounder_metrics: Dict[str, Any],
    matches_played: int,
    existing_confidence_score: float = None
) -> Dict[str, Any]:
    """
    Computes all four ranking scores for a single player.
    Returns a dict containing bat, bowl, ar, and overall scores plus confidence.
    """
    innings     = career_batting.get("innings", 0)
    balls_faced = career_batting.get("total_balls", 0)
    legal_balls = career_bowling.get("legal_balls", 0)

    # 1. Confidence
    confidence = compute_ranking_confidence(
        matches=matches_played,
        innings=innings,
        balls_faced=balls_faced,
        legal_balls=legal_balls,
        bat_eligible=balls_faced > 0,
        bowl_eligible=legal_balls >= BOWL_MIN_LEGAL_BALLS
    )

    # Use overall confidence for overall score damping
    overall_conf = (
        existing_confidence_score
        if existing_confidence_score is not None
        else confidence["overall_confidence_score"]
    )

    # 2. BAT score
    bat_result = compute_bat_score(career_batting)

    # 3. BOWL score
    bowl_result = compute_bowl_score(career_bowling)

    # 4. AR score
    ar_result = compute_ar_score(
        career_batting=career_batting,
        career_bowling=career_bowling,
        all_rounder_metrics=all_rounder_metrics,
        bat_result=bat_result,
        bowl_result=bowl_result,
        matches_played=matches_played
    )

    # 5. OVERALL score
    overall_result = compute_overall_score(
        career_batting=career_batting,
        career_bowling=career_bowling,
        bat_result=bat_result,
        bowl_result=bowl_result,
        ar_result=ar_result,
        confidence_score=overall_conf,
        matches_played=matches_played
    )

    return {
        **bat_result,
        **bowl_result,
        **ar_result,
        **overall_result,
        **confidence
    }


# ─────────────────────────────────────────────
# LEADERBOARD BUILDER
# ─────────────────────────────────────────────

def build_four_tier_leaderboards(
    all_player_data: List[Dict[str, Any]]
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Takes a list of player profile dicts (from player_service.get_all_players_summary)
    and returns four sorted, ranked leaderboards.

    Input dicts must contain: player_id, name, career_batting, career_bowling,
                              all_rounder_metrics, matches_played (or matches)

    Returns:
    {
      "batting":  [...sorted by bat_score desc, rank assigned],
      "bowling":  [...sorted by bowl_score desc, rank assigned],
      "allround": [...eligible only, sorted by ar_score desc, rank assigned],
      "overall":  [...all players, sorted by overall_score desc, rank assigned]
    }
    """
    ranked_players = []
    for p in all_player_data:
        cb = p.get("career_batting", {})
        cw = p.get("career_bowling", {})
        arm = p.get("all_rounder_metrics", {})
        m = p.get("matches", p.get("matches_played", 0))
        existing_conf = p.get("confidence_score") or p.get("player_intelligence", {}).get("confidence_score")

        scores = compute_player_rankings(
            career_batting=cb,
            career_bowling=cw,
            all_rounder_metrics=arm,
            matches_played=m,
            existing_confidence_score=existing_conf
        )

        entry = {
            "player_id":          p.get("player_id"),
            "name":               p.get("name"),
            "primary_role":       p.get("primary_role"),
            "role_classification":p.get("role_classification"),
            "experience_level":   p.get("experience_level"),
            "matches":            m,
            "innings":            cb.get("innings", 0),
            "total_runs":         cb.get("total_runs", 0),
            "total_balls":        cb.get("total_balls", 0),
            "batting_average":    cb.get("batting_average", 0.0),
            "average_display":    cb.get("average_display", "0.00"),
            "strike_rate":        cb.get("strike_rate", 0.0),
            "highest_score_display": cb.get("highest_score_display", "0"),
            "boundary_percentage":cb.get("boundary_percentage", 0.0),
            "scores_15_plus":     cb.get("scores_15_plus", 0),
            "scores_20_plus":     cb.get("scores_20_plus", 0),
            "legal_balls":        cw.get("legal_balls", 0),
            "overs_display":      cw.get("overs_display", "0.0"),
            "wickets":            cw.get("wickets", 0),
            "economy":            cw.get("economy", 0.0),
            "bowling_average":    cw.get("bowling_average"),
            "bowling_strike_rate":cw.get("bowling_strike_rate"),
            "dot_ball_percentage":cw.get("dot_ball_percentage", 0.0),
            "both_disciplines_matches": arm.get("both_disciplines_matches", 0),
            "impact_all_rounder_matches": arm.get("impact_all_rounder_matches", 0),
            **scores
        }
        ranked_players.append(entry)

    # --- BATTING LEADERBOARD ---
    bat_pool = [p for p in ranked_players if p.get("bat_score") is not None]
    bat_pool.sort(key=lambda x: -x["bat_score"])
    for i, p in enumerate(bat_pool):
        p["bat_rank"] = i + 1
        p["bat_rank_of"] = len(bat_pool)
    # Ineligible players get rank=None
    bat_ineligible = [p for p in ranked_players if p.get("bat_score") is None]
    for p in bat_ineligible:
        p["bat_rank"] = None
        p["bat_rank_of"] = len(bat_pool)

    # --- BOWLING LEADERBOARD ---
    bowl_pool = [p for p in ranked_players if p.get("bowl_score") is not None]
    bowl_pool.sort(key=lambda x: -x["bowl_score"])
    for i, p in enumerate(bowl_pool):
        p["bowl_rank"] = i + 1
        p["bowl_rank_of"] = len(bowl_pool)
    bowl_ineligible = [p for p in ranked_players if p.get("bowl_score") is None]
    for p in bowl_ineligible:
        p["bowl_rank"] = None
        p["bowl_rank_of"] = len(bowl_pool)

    # --- ALL-ROUND LEADERBOARD ---
    ar_pool = [p for p in ranked_players if p.get("ar_score") is not None]
    ar_pool.sort(key=lambda x: -x["ar_score"])
    for i, p in enumerate(ar_pool):
        p["ar_rank"] = i + 1
        p["ar_rank_of"] = len(ar_pool)
    ar_ineligible = [p for p in ranked_players if p.get("ar_score") is None]
    for p in ar_ineligible:
        p["ar_rank"] = None
        p["ar_rank_of"] = len(ar_pool)

    # --- OVERALL LEADERBOARD ---
    overall_pool = [p for p in ranked_players if p.get("overall_score") is not None]
    overall_pool.sort(key=lambda x: -x["overall_score"])
    for i, p in enumerate(overall_pool):
        p["overall_rank"] = i + 1
        p["overall_rank_of"] = len(overall_pool)
    overall_ineligible = [p for p in ranked_players if p.get("overall_score") is None]
    for p in overall_ineligible:
        p["overall_rank"] = None
        p["overall_rank_of"] = len(overall_pool)

    return {
        "batting":  bat_pool + bat_ineligible,
        "bowling":  bowl_pool + bowl_ineligible,
        "allround": ar_pool + ar_ineligible,
        "overall":  overall_pool + overall_ineligible
    }
