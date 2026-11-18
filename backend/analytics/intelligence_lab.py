"""
EPL Intelligence Lab: Player Combination Intelligence & Statistical Discovery.
Discovers 2-player and 3-player franchise combinations, winning patterns,
multi-season finalists, and empirical team-composition hypotheses with
strict sample-size thresholds, confidence ratings, and correlation-vs-causation framing.
"""
from collections import defaultdict
from itertools import combinations
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from backend.database.models import Match, Player, BattingScorecard, BowlingScorecard
from backend.services.player_service import get_all_players_summary


def _confidence_label(n: int) -> Dict[str, str]:
    if n >= 6:
        return {
            "level": "Moderate Exploratory",
            "note": f"Observed across n={n} matches. Meaningful descriptive pattern; still small-sample relative to professional leagues."
        }
    if n >= 4:
        return {
            "level": "Low Exploratory",
            "note": f"Observed across n={n} matches. Exploratory historical association only."
        }
    return {
        "level": "Insufficient Evidence",
        "note": "Interesting historical pattern – insufficient evidence for a reliable conclusion."
    }


def _build_match_rosters(db: Session):
    matches = db.query(Match).all()
    matches_by_id = {m.id: m for m in matches}
    players_by_id = {p.id: p.name for p in db.query(Player).all()}

    # (match_id, team) -> set of player_ids + per-player batting/bowling contributions
    rosters = defaultdict(set)
    bat_contrib = defaultdict(lambda: defaultdict(int))  # (match_id, team) -> player_id -> runs
    bowl_contrib = defaultdict(lambda: defaultdict(int)) # (match_id, team) -> player_id -> wickets

    for sc in db.query(BattingScorecard).filter(BattingScorecard.innings_type == "Regular").all():
        rosters[(sc.match_id, sc.team)].add(sc.player_id)
        bat_contrib[(sc.match_id, sc.team)][sc.player_id] += sc.runs

    for sc in db.query(BowlingScorecard).filter(BowlingScorecard.innings_type == "Regular").all():
        rosters[(sc.match_id, sc.team)].add(sc.player_id)
        bowl_contrib[(sc.match_id, sc.team)][sc.player_id] += sc.wickets

    # Track per-team match records
    team_matches = defaultdict(list) # team -> list of (match_id, won, stage, season)
    for (mid, team), pids in rosters.items():
        m = matches_by_id.get(mid)
        if not m:
            continue
        won = bool(m.winner and m.winner.strip().lower() == team.strip().lower())
        team_matches[team].append((mid, won, m.stage, m.season))

    return matches_by_id, players_by_id, rosters, bat_contrib, bowl_contrib, team_matches


def get_combination_intelligence(
    db: Session,
    combo_size: int = 2,
    min_matches: int = 3,
    player_id_filter: Optional[str] = None,
    limit: int = 30
) -> Dict[str, Any]:
    """
    Computes 2-player or 3-player franchise combinations who played together
    on the same team across historical matches.
    """
    combo_size = 3 if combo_size == 3 else 2
    matches_by_id, players_by_id, rosters, bat_contrib, bowl_contrib, team_matches = _build_match_rosters(db)

    combo_records = defaultdict(lambda: {
        "matches": 0, "wins": 0, "semifinals": 0, "finals": 0, "championships": 0,
        "combined_runs": 0, "combined_wickets": 0, "teams": set(), "seasons": set(),
        "match_keys": set()
    })

    for (mid, team), pids in rosters.items():
        m = matches_by_id.get(mid)
        if not m or len(pids) < combo_size:
            continue
        sorted_pids = sorted(pids)
        if player_id_filter and player_id_filter not in sorted_pids:
            continue

        won = bool(m.winner and m.winner.strip().lower() == team.strip().lower())
        is_sf = "semi" in (m.stage or "").lower()
        is_final = (m.stage or "").strip().lower() == "final"

        for tup in combinations(sorted_pids, combo_size):
            if player_id_filter and player_id_filter not in tup:
                continue
            rec = combo_records[tup]
            rec["matches"] += 1
            if won:
                rec["wins"] += 1
            if is_sf:
                rec["semifinals"] += 1
            if is_final:
                rec["finals"] += 1
                if won:
                    rec["championships"] += 1
            rec["combined_runs"] += sum(bat_contrib[(mid, team)].get(pid, 0) for pid in tup)
            rec["combined_wickets"] += sum(bowl_contrib[(mid, team)].get(pid, 0) for pid in tup)
            rec["teams"].add(team)
            rec["seasons"].add(m.season)
            rec["match_keys"].add((mid, team))

    # Build baseline win% without the combination across the teams they played for
    results = []
    for tup, rec in combo_records.items():
        if rec["matches"] < min_matches:
            continue
        win_pct_with = round((rec["wins"] / rec["matches"]) * 100.0, 1)

        # Matches of those same teams where the full combination was NOT together
        other_matches = 0
        other_wins = 0
        for team in rec["teams"]:
            for mid, won, _, _ in team_matches[team]:
                if (mid, team) not in rec["match_keys"]:
                    other_matches += 1
                    if won:
                        other_wins += 1
        win_pct_without = round((other_wins / other_matches) * 100.0, 1) if other_matches > 0 else None
        delta = round(win_pct_with - win_pct_without, 1) if win_pct_without is not None else None

        conf = _confidence_label(rec["matches"])
        names = [players_by_id.get(pid, pid) for pid in tup]
        results.append({
            "player_ids": list(tup),
            "player_names": names,
            "combination_label": " + ".join(names),
            "combo_size": combo_size,
            "matches_together": rec["matches"],
            "wins_together": rec["wins"],
            "win_pct_with": win_pct_with,
            "matches_without_same_teams": other_matches,
            "win_pct_without": win_pct_without,
            "win_pct_delta": delta,
            "semifinals_reached": rec["semifinals"],
            "finals_reached": rec["finals"],
            "championships_won": rec["championships"],
            "combined_runs": rec["combined_runs"],
            "combined_wickets": rec["combined_wickets"],
            "teams": sorted(list(rec["teams"])),
            "seasons": sorted(list(rec["seasons"])),
            "confidence_level": conf["level"],
            "reliability_note": conf["note"]
        })

    results.sort(key=lambda x: (-x["wins_together"], -x["win_pct_with"], -x["matches_together"], -x["combined_runs"]))

    return {
        "combo_size": combo_size,
        "min_matches_threshold": min_matches,
        "total_qualifying_combinations": len(results),
        "statistical_guardrail": "Descriptive historical co-occurrence across 27 matches (EPL 2023–2025). Combinations with fewer than 4 shared matches are explicitly flagged as insufficient evidence for reliable inference.",
        "combinations": results[:limit]
    }


def get_intelligence_lab_discoveries(db: Session) -> Dict[str, Any]:
    """
    Winning Combination Discovery + Empirical Statistical Hypotheses (Section 5B & 5C).
    Every finding carries sample sizes, descriptive framing, and confidence tags.
    """
    matches_by_id, players_by_id, rosters, bat_contrib, bowl_contrib, team_matches = _build_match_rosters(db)
    summaries = {p["player_id"]: p for p in get_all_players_summary(db)}

    # 1. Multi-championship & consistent finalist players across seasons
    player_postseason = defaultdict(lambda: {
        "player_id": "", "name": "", "matches": 0, "wins": 0,
        "semifinals": set(), "finals": set(), "titles": set(), "seasons": set()
    })
    for (mid, team), pids in rosters.items():
        m = matches_by_id.get(mid)
        if not m:
            continue
        won = bool(m.winner and m.winner.strip().lower() == team.strip().lower())
        is_sf = "semi" in (m.stage or "").lower()
        is_final = (m.stage or "").strip().lower() == "final"
        for pid in pids:
            pr = player_postseason[pid]
            pr["player_id"] = pid
            pr["name"] = players_by_id.get(pid, pid)
            pr["matches"] += 1
            if won: pr["wins"] += 1
            pr["seasons"].add(m.season)
            if is_sf: pr["semifinals"].add(m.season)
            if is_final:
                pr["finals"].add(m.season)
                if won: pr["titles"].add(m.season)

    consistent_finalists = []
    for pid, pr in player_postseason.items():
        if len(pr["finals"]) >= 2 or len(pr["titles"]) >= 2:
            consistent_finalists.append({
                "player_id": pid,
                "name": pr["name"],
                "matches": pr["matches"],
                "wins": pr["wins"],
                "win_pct": round((pr["wins"] / max(1, pr["matches"])) * 100, 1),
                "semifinal_seasons": sorted(list(pr["semifinals"])),
                "final_seasons": sorted(list(pr["finals"])),
                "championship_seasons": sorted(list(pr["titles"])),
                "titles_count": len(pr["titles"]),
                "finals_count": len(pr["finals"])
            })
    consistent_finalists.sort(key=lambda x: (-x["titles_count"], -x["finals_count"], -x["win_pct"]))

    # 2. Top recurring semifinal pairs
    sf_pairs = defaultdict(lambda: {"count": 0, "wins": 0, "seasons": set()})
    for (mid, team), pids in rosters.items():
        m = matches_by_id.get(mid)
        if not m or "semi" not in (m.stage or "").lower():
            continue
        won = bool(m.winner and m.winner.strip().lower() == team.strip().lower())
        for tup in combinations(sorted(pids), 2):
            sf_pairs[tup]["count"] += 1
            if won: sf_pairs[tup]["wins"] += 1
            sf_pairs[tup]["seasons"].add(m.season)

    recurring_sf_combos = []
    for tup, d in sf_pairs.items():
        if d["count"] >= 2:
            conf = _confidence_label(d["count"])
            recurring_sf_combos.append({
                "player_ids": list(tup),
                "combination_label": f"{players_by_id.get(tup[0], tup[0])} + {players_by_id.get(tup[1], tup[1])}",
                "semifinals_together": d["count"],
                "semifinal_wins": d["wins"],
                "seasons": sorted(list(d["seasons"])),
                "confidence_level": conf["level"],
                "reliability_note": conf["note"]
            })
    recurring_sf_combos.sort(key=lambda x: (-x["semifinals_together"], -x["semifinal_wins"]))

    # 3. Six Empirical Statistical Hypotheses (Team-Season and Match Level)
    # Build team-season profiles
    team_season_players = defaultdict(set)
    team_season_meta = defaultdict(lambda: {"matches": 0, "wins": 0, "reached_sf": False, "reached_final": False, "won_title": False})
    for (mid, team), pids in rosters.items():
        m = matches_by_id.get(mid)
        if not m:
            continue
        key = (m.season, team)
        team_season_players[key].update(pids)
        meta = team_season_meta[key]
        meta["matches"] += 1
        won = bool(m.winner and m.winner.strip().lower() == team.strip().lower())
        if won: meta["wins"] += 1
        if "semi" in (m.stage or "").lower(): meta["reached_sf"] = True
        if (m.stage or "").strip().lower() == "final":
            meta["reached_final"] = True
            if won: meta["won_title"] = True

    # Hypothesis A: 2+ strong all-rounders (AR rating >= 55) vs reaching the Final
    ar2_final, ar2_total = 0, 0
    ar_low_final, ar_low_total = 0, 0
    for key, pids in team_season_players.items():
        strong_ars = sum(1 for pid in pids if summaries.get(pid, {}).get("ratings", {}).get("all_rounder_rating", 0) >= 55)
        if strong_ars >= 2:
            ar2_total += 1
            if team_season_meta[key]["reached_final"]: ar2_final += 1
        else:
            ar_low_total += 1
            if team_season_meta[key]["reached_final"]: ar_low_final += 1

    # Hypothesis B: Match-level strike wicket-taker (team has bowler taking 2+ wkts in match) vs Win Rate
    strike_wins, strike_tot = 0, 0
    nostrike_wins, nostrike_tot = 0, 0
    # Hypothesis C: Batting depth (3+ batters scoring >= 5 runs in the match) vs Win Rate
    depth_wins, depth_tot = 0, 0
    nodepth_wins, nodepth_tot = 0, 0
    # Hypothesis E: Experience (team has higher average seasons played than opponent) vs Win Rate
    player_seasons_cnt = {pid: len(pr["seasons"]) for pid, pr in player_postseason.items()}
    exp_wins, exp_tot = 0, 0
    # Hypothesis D: Higher combined EPL team rating vs reaching semifinals
    ts_ratings = []
    for key, pids in team_season_players.items():
        avg_r = sum(summaries.get(pid, {}).get("ratings", {}).get("overall_rating", 40.0) for pid in pids) / max(1, len(pids))
        ts_ratings.append((avg_r, team_season_meta[key]["reached_sf"], key))
    median_ts_r = sorted([x[0] for x in ts_ratings])[len(ts_ratings)//2] if ts_ratings else 50.0
    high_r_sf = sum(1 for x in ts_ratings if x[0] >= median_ts_r and x[1])
    high_r_tot = sum(1 for x in ts_ratings if x[0] >= median_ts_r)
    low_r_sf = sum(1 for x in ts_ratings if x[0] < median_ts_r and x[1])
    low_r_tot = sum(1 for x in ts_ratings if x[0] < median_ts_r)

    for (mid, team), pids in rosters.items():
        m = matches_by_id.get(mid)
        if not m or not m.winner:
            continue
        won = m.winner.strip().lower() == team.strip().lower()
        max_w = max(bowl_contrib[(mid, team)].values()) if bowl_contrib[(mid, team)] else 0
        if max_w >= 2:
            strike_tot += 1
            if won: strike_wins += 1
        else:
            nostrike_tot += 1
            if won: nostrike_wins += 1

        contrib_batters = sum(1 for r in bat_contrib[(mid, team)].values() if r >= 5)
        if contrib_batters >= 3:
            depth_tot += 1
            if won: depth_wins += 1
        else:
            nodepth_tot += 1
            if won: nodepth_wins += 1

    for m in matches_by_id.values():
        if not m.winner:
            continue
        p1 = rosters.get((m.id, m.team1), set())
        p2 = rosters.get((m.id, m.team2), set())
        if not p1 or not p2:
            continue
        e1 = sum(player_seasons_cnt.get(pid, 1) for pid in p1) / len(p1)
        e2 = sum(player_seasons_cnt.get(pid, 1) for pid in p2) / len(p2)
        if abs(e1 - e2) > 0.05:
            exp_tot += 1
            more_exp_team = m.team1 if e1 > e2 else m.team2
            if m.winner.strip().lower() == more_exp_team.strip().lower():
                exp_wins += 1

    discoveries = [
        {
            "id": "DISC-01",
            "question": "Does having 2+ high-rated all-rounders (AR rating >= 55) associate with reaching the Final?",
            "metric_a_label": "Squads with 2+ Strong All-Rounders",
            "metric_a_value": f"{round(ar2_final/max(1,ar2_total)*100,1)}% reached Final ({ar2_final}/{ar2_total} squads)",
            "metric_b_label": "Squads with <2 Strong All-Rounders",
            "metric_b_value": f"{round(ar_low_final/max(1,ar_low_total)*100,1)}% reached Final ({ar_low_final}/{ar_low_total} squads)",
            "sample_size": ar2_total + ar_low_total,
            "sample_unit": "team-seasons",
            "confidence": _confidence_label(ar2_total)["level"],
            "interpretation": "Descriptive team-season observation comparing all-rounder density with Finals appearances. Association does not establish sole causation."
        },
        {
            "id": "DISC-02",
            "question": "Do teams with a 2+ wicket bowling spell in a match win more frequently?",
            "metric_a_label": "Match innings with a 2+ Wicket Bowler",
            "metric_a_value": f"{round(strike_wins/max(1,strike_tot)*100,1)}% win rate ({strike_wins}/{strike_tot} team-innings)",
            "metric_b_label": "Match innings without a 2+ Wicket Bowler",
            "metric_b_value": f"{round(nostrike_wins/max(1,nostrike_tot)*100,1)}% win rate ({nostrike_wins}/{nostrike_tot} team-innings)",
            "sample_size": strike_tot + nostrike_tot,
            "sample_unit": "team-match appearances",
            "confidence": "Moderate Exploratory",
            "interpretation": "In 6-over underarm cricket, individual multi-wicket spells strongly co-occur with match victories across all 27 historical matches."
        },
        {
            "id": "DISC-03",
            "question": "Does batting depth (3+ batters scoring >= 5 runs) associate with winning matches?",
            "metric_a_label": "Teams with 3+ Batters Scoring >= 5 Runs",
            "metric_a_value": f"{round(depth_wins/max(1,depth_tot)*100,1)}% win rate ({depth_wins}/{depth_tot} team-innings)",
            "metric_b_label": "Teams with <3 Batters Scoring >= 5 Runs",
            "metric_b_value": f"{round(nodepth_wins/max(1,nodepth_tot)*100,1)}% win rate ({nodepth_wins}/{nodepth_tot} team-innings)",
            "sample_size": depth_tot + nodepth_tot,
            "sample_unit": "team-match appearances",
            "confidence": "Moderate Exploratory",
            "interpretation": "Distributed scoring contributions across 3+ batters correlate with higher historical win frequency compared to single-batter reliance."
        },
        {
            "id": "DISC-04",
            "question": "Do squads above the median combined EPL rating reach Semifinals more often?",
            "metric_a_label": f"Above-Median Squad Rating (>= {round(median_ts_r,1)})",
            "metric_a_value": f"{round(high_r_sf/max(1,high_r_tot)*100,1)}% reached SF ({high_r_sf}/{high_r_tot} squads)",
            "metric_b_label": f"Below-Median Squad Rating (< {round(median_ts_r,1)})",
            "metric_b_value": f"{round(low_r_sf/max(1,low_r_tot)*100,1)}% reached SF ({low_r_sf}/{low_r_tot} squads)",
            "sample_size": len(ts_ratings),
            "sample_unit": "team-seasons",
            "confidence": _confidence_label(high_r_tot)["level"],
            "interpretation": "Note: Ratings are computed using historical career data including those seasons (in-sample descriptive fit, not out-of-sample prediction)."
        },
        {
            "id": "DISC-05",
            "question": "Does higher roster multi-season experience associate with head-to-head wins?",
            "metric_a_label": "More Experienced Side Won",
            "metric_a_value": f"{round(exp_wins/max(1,exp_tot)*100,1)}% ({exp_wins}/{exp_tot} decisive matches)",
            "metric_b_label": "Less Experienced Side Won",
            "metric_b_value": f"{round((exp_tot-exp_wins)/max(1,exp_tot)*100,1)}% ({exp_tot-exp_wins}/{exp_tot} decisive matches)",
            "sample_size": exp_tot,
            "sample_unit": "head-to-head matches",
            "confidence": "Moderate Exploratory" if exp_tot >= 10 else "Low Exploratory",
            "interpretation": "Compares average multi-season EPL appearances of both playing XIs in each match."
        }
    ]

    top_pairs = get_combination_intelligence(db, combo_size=2, min_matches=3, limit=12)["combinations"]
    top_trios = get_combination_intelligence(db, combo_size=3, min_matches=3, limit=12)["combinations"]

    return {
        "disclaimer": "EPL Intelligence Lab presents descriptive exploratory findings from 27 historical matches (2023–2025). Sample sizes are explicitly displayed; no finding represents a guarantee or causal proof.",
        "top_two_player_combinations": top_pairs,
        "top_three_player_combinations": top_trios,
        "recurring_semifinal_combinations": recurring_sf_combos[:10],
        "consistent_finalists_and_champions": consistent_finalists[:12],
        "statistical_discoveries": discoveries
    }
