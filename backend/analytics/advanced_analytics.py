import math
from collections import defaultdict
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from backend.database.models import (
    Match, Innings, Player, BattingScorecard, BowlingScorecard,
    Partnership, FieldingEvent
)
from backend.services.player_service import get_all_players_summary, get_player_full_profile


def get_data_availability_matrix() -> List[Dict[str, str]]:
    """
    Verified data-availability classification derived strictly from inspecting
    all 27 CricHeroes PDF scorecards and the 17-table SQLite schema.
    """
    return [
        {"module": "Partnerships", "metric": "Wicket-by-Wicket Partnership Runs & Pairs", "status": "DERIVABLE FROM EXISTING DATA", "source": "Reconstructed mathematically from complete Fall of Wickets (innings.fall_of_wickets recovered from all 27 PDFs) + batting_scorecards.batting_position (252 partnerships)."},
        {"module": "Partnerships", "metric": "Partnership Balls Faced & Run Rate", "status": "REQUIRES ADDITIONAL DATA", "source": "Fall of Wickets gives over timestamp (e.g. 2.4 ov), not exact legal balls per individual partnership when wides/no-balls occur; exact runs & over spans are reported instead."},
        {"module": "Fielding", "metric": "Catches, Caught & Bowled, Run-Outs & Stumpings", "status": "DIRECTLY AVAILABLE", "source": "Extracted from batting_scorecards.dismissal & fielder_name across all 312 records (163 canonical fielding events including joint run-out assists 'A / B' and wicketkeeper '†' tags)."},
        {"module": "Fielding", "metric": "Dropped Catches / Runs Saved / Misfields", "status": "NOT AVAILABLE", "source": "CricHeroes summary scorecards do not log non-dismissal fielding events."},
        {"module": "Advanced Batting", "metric": "Boundary %, Runs/Innings, Team Share %, Not-Out %, Consistency, Wins vs Losses", "status": "DERIVABLE FROM EXISTING DATA", "source": "Computed directly from 312 regulation batting_scorecards joined with innings totals and match outcomes."},
        {"module": "Advanced Batting", "metric": "Batting Dot-Ball Percentage (Batter 0s)", "status": "NOT AVAILABLE", "source": "Verified across all 27 PDFs: CricHeroes batting tables include R, B, 4s, 6s, SR only; batting 0s are not recorded. Never fabricated."},
        {"module": "Advanced Batting", "metric": "Phase-Wise Splits (Powerplay / Middle / Death)", "status": "NOT AVAILABLE", "source": "Ball-by-ball commentary is not present in the 27 summary PDFs."},
        {"module": "Advanced Bowling", "metric": "Bowling Dot-Ball Percentage (Bowler 0s)", "status": "DIRECTLY AVAILABLE", "source": "Directly recorded in bowling_scorecards.dot_balls for all 277 spells (827 dot balls across 3 seasons)."},
        {"module": "Advanced Bowling", "metric": "Wickets/Match, Economy Progression, Opponent Splits, Winning Wickets, Best Spells", "status": "DERIVABLE FROM EXISTING DATA", "source": "Computed directly from 277 regulation bowling_scorecards joined with matches and innings."},
        {"module": "Player Impact", "metric": "Winning Contribution, Consistency, Knockout Uplift, Two-Way Impact", "status": "DERIVABLE FROM EXISTING DATA", "source": "Derived from regular + knockout match scorecards with explicit correlation-vs-causation labeling."},
        {"module": "Intelligence Lab", "metric": "2-Player & 3-Player Franchise Combinations & Win % Splits", "status": "DERIVABLE FROM EXISTING DATA", "source": "Computed from team appearances across all 27 historical matches with minimum sample thresholds and confidence tags."}
    ]


def get_partnership_analytics(db: Session, season: Optional[int] = None) -> Dict[str, Any]:
    q = db.query(Partnership).filter(Partnership.innings_type == "Regular")
    if season:
        q = q.filter(Partnership.season == season)
    rows = q.all()

    matches_by_id = {m.id: m for m in db.query(Match).all()}

    if not rows:
        return {
            "availability": "DERIVABLE FROM EXISTING DATA",
            "total_partnerships": 0,
            "summary": {},
            "highest_partnerships": [],
            "best_opening_partnerships": [],
            "by_wicket": [],
            "top_pairs": [],
            "by_season": [],
            "winning_partnerships": []
        }

    runs_list = [r.runs for r in rows]
    avg_runs = round(sum(runs_list) / len(runs_list), 2)
    win_rows = [r for r in rows if r.is_winning_match]
    avg_win_runs = round(sum(r.runs for r in win_rows) / len(win_rows), 2) if win_rows else 0.0

    def serialize(p: Partnership) -> Dict[str, Any]:
        m = matches_by_id.get(p.match_id)
        opp = ""
        if m:
            opp = m.team2 if m.team1 == p.batting_team else m.team1
        return {
            "id": p.id,
            "match_code": m.match_code if m else f"M-{p.match_id}",
            "season": p.season,
            "stage": m.stage if m else "League",
            "batting_team": p.batting_team,
            "opponent": opp,
            "wicket_number": p.wicket_number,
            "wicket_label": f"{p.wicket_number}{'st' if p.wicket_number==1 else 'nd' if p.wicket_number==2 else 'rd' if p.wicket_number==3 else 'th'} Wkt",
            "batter1_id": p.batter1_id,
            "batter1_name": p.batter1_name,
            "batter2_id": p.batter2_id,
            "batter2_name": p.batter2_name,
            "pair_label": f"{p.batter1_name} & {p.batter2_name}",
            "runs": p.runs,
            "runs_display": f"{p.runs}{'*' if p.is_unbroken else ''}",
            "is_unbroken": p.is_unbroken,
            "score_span": f"{p.start_score} → {p.end_score}",
            "over_span": f"{p.start_over or '0.0'}–{p.end_over or '?'} ov",
            "contribution_pct": p.contribution_pct,
            "is_winning_match": p.is_winning_match,
            "confidence": p.confidence
        }

    sorted_all = sorted(rows, key=lambda x: (-x.runs, -x.contribution_pct))
    highest = [serialize(p) for p in sorted_all[:15]]
    openings = [serialize(p) for p in sorted([r for r in rows if r.wicket_number == 1], key=lambda x: (-x.runs, -x.contribution_pct))[:10]]
    winning_top = [serialize(p) for p in sorted(win_rows, key=lambda x: (-x.runs, -x.contribution_pct))[:12]]

    # By wicket breakdown
    wkt_groups = defaultdict(list)
    for r in rows:
        wkt_groups[r.wicket_number].append(r)
    by_wicket = []
    for w in sorted(wkt_groups.keys()):
        grp = wkt_groups[w]
        best = max(grp, key=lambda x: x.runs)
        by_wicket.append({
            "wicket_number": w,
            "wicket_label": f"{w}{'st' if w==1 else 'nd' if w==2 else 'rd' if w==3 else 'th'} Wicket",
            "count": len(grp),
            "avg_runs": round(sum(x.runs for x in grp) / len(grp), 2),
            "highest_runs": best.runs,
            "highest_pair": f"{best.batter1_name} & {best.batter2_name}",
            "avg_contribution_pct": round(sum(x.contribution_pct for x in grp) / len(grp), 1)
        })

    # Most successful pairs (order-insensitive canonical ID pair)
    pair_map = defaultdict(list)
    for r in rows:
        k1 = r.batter1_id or r.batter1_name
        k2 = r.batter2_id or r.batter2_name
        pair_key = tuple(sorted([(k1, r.batter1_name), (k2, r.batter2_name)], key=lambda t: t[0]))
        pair_map[pair_key].append(r)

    top_pairs = []
    for pair_key, grp in pair_map.items():
        tot = sum(x.runs for x in grp)
        wins = sum(1 for x in grp if x.is_winning_match)
        top_pairs.append({
            "batter1_id": pair_key[0][0],
            "batter1_name": pair_key[0][1],
            "batter2_id": pair_key[1][0],
            "batter2_name": pair_key[1][1],
            "pair_label": f"{pair_key[0][1]} & {pair_key[1][1]}",
            "stands": len(grp),
            "total_runs": tot,
            "avg_runs": round(tot / len(grp), 2),
            "highest_stand": max(x.runs for x in grp),
            "avg_contribution_pct": round(sum(x.contribution_pct for x in grp) / len(grp), 1),
            "stands_in_wins": wins,
            "seasons": sorted(list({x.season for x in grp}))
        })
    top_pairs.sort(key=lambda x: (-x["total_runs"], -x["avg_runs"]))

    # By season
    season_map = defaultdict(list)
    for r in rows:
        season_map[r.season].append(r)
    by_season = []
    for s in sorted(season_map.keys()):
        grp = season_map[s]
        best = max(grp, key=lambda x: x.runs)
        open_grp = [x for x in grp if x.wicket_number == 1]
        by_season.append({
            "season": s,
            "total_partnerships": len(grp),
            "avg_partnership": round(sum(x.runs for x in grp) / len(grp), 2),
            "avg_opening_stand": round(sum(x.runs for x in open_grp) / len(open_grp), 2) if open_grp else 0.0,
            "highest_partnership": best.runs,
            "highest_pair": f"{best.batter1_name} & {best.batter2_name}",
            "twenty_plus_stands": sum(1 for x in grp if x.runs >= 20)
        })

    return {
        "availability": "DERIVABLE FROM EXISTING DATA",
        "method_note": "Reconstructed mathematically from complete Fall of Wickets recovered from all 27 CricHeroes PDFs combined with scorecard batting positions. No partnership runs are estimated from batting aggregates.",
        "total_partnerships": len(rows),
        "summary": {
            "highest_runs": sorted_all[0].runs,
            "highest_pair": f"{sorted_all[0].batter1_name} & {sorted_all[0].batter2_name}",
            "average_partnership": avg_runs,
            "average_in_wins": avg_win_runs,
            "twenty_plus_stands": sum(1 for r in rows if r.runs >= 20),
            "thirty_plus_stands": sum(1 for r in rows if r.runs >= 30),
            "unbroken_stands": sum(1 for r in rows if r.is_unbroken)
        },
        "highest_partnerships": highest,
        "best_opening_partnerships": openings,
        "by_wicket": by_wicket,
        "top_pairs": top_pairs[:20],
        "by_season": by_season,
        "winning_partnerships": winning_top
    }


def get_fielding_analytics(db: Session, season: Optional[int] = None) -> Dict[str, Any]:
    q = db.query(FieldingEvent).filter(FieldingEvent.innings_type == "Regular")
    if season:
        q = q.filter(FieldingEvent.season == season)
    events = q.all()

    # Bowler vs Fielder dismissal breakdown from batting_scorecards
    bq = db.query(BattingScorecard).filter(BattingScorecard.innings_type == "Regular")
    if season:
        bq = bq.filter(BattingScorecard.season == season)
    bat_rows = bq.all()

    dismissal_breakdown = {
        "bowled_bowler_only": 0,
        "caught_bowler_plus_fielder": 0,
        "caught_and_bowled": 0,
        "stumped_bowler_plus_keeper": 0,
        "hit_wicket_bowler_only": 0,
        "run_out_fielder_only": 0,
        "other_dismissals": 0,
        "not_out": 0
    }
    for sc in bat_rows:
        dl = (sc.dismissal or "").strip().lower()
        if dl in ("not out", ""):
            dismissal_breakdown["not_out"] += 1
        elif dl.startswith("c & b") or dl.startswith("c&b"):
            dismissal_breakdown["caught_and_bowled"] += 1
        elif dl.startswith("c "):
            dismissal_breakdown["caught_bowler_plus_fielder"] += 1
        elif dl.startswith("st "):
            dismissal_breakdown["stumped_bowler_plus_keeper"] += 1
        elif "run out" in dl:
            dismissal_breakdown["run_out_fielder_only"] += 1
        elif dl.startswith("b "):
            dismissal_breakdown["bowled_bowler_only"] += 1
        elif "hit wkt" in dl or "hit wicket" in dl:
            dismissal_breakdown["hit_wicket_bowler_only"] += 1
        else:
            dismissal_breakdown["other_dismissals"] += 1

    bowler_credited = (
        dismissal_breakdown["bowled_bowler_only"]
        + dismissal_breakdown["caught_bowler_plus_fielder"]
        + dismissal_breakdown["caught_and_bowled"]
        + dismissal_breakdown["stumped_bowler_plus_keeper"]
        + dismissal_breakdown["hit_wicket_bowler_only"]
    )
    fielder_involved = (
        dismissal_breakdown["caught_bowler_plus_fielder"]
        + dismissal_breakdown["caught_and_bowled"]
        + dismissal_breakdown["stumped_bowler_plus_keeper"]
        + dismissal_breakdown["run_out_fielder_only"]
    )

    # Aggregate per fielder
    matches_by_player = defaultdict(set)
    for sc in db.query(BattingScorecard).filter(BattingScorecard.innings_type == "Regular").all():
        matches_by_player[sc.player_id].add(sc.match_id)
    for sc in db.query(BowlingScorecard).filter(BowlingScorecard.innings_type == "Regular").all():
        matches_by_player[sc.player_id].add(sc.match_id)

    agg = defaultdict(lambda: {
        "fielder_id": None, "fielder_name": "", "catches": 0, "caught_and_bowled": 0,
        "run_outs_direct": 0, "run_out_assists": 0, "stumpings": 0, "total_dismissals": 0,
        "seasons": defaultdict(int), "matches_with_event": set()
    })

    for ev in events:
        key = ev.fielder_id or f"UNREG:{ev.fielder_name}"
        rec = agg[key]
        rec["fielder_id"] = ev.fielder_id
        rec["fielder_name"] = ev.fielder_name
        rec["total_dismissals"] += 1
        rec["seasons"][ev.season] += 1
        rec["matches_with_event"].add(ev.match_id)
        if ev.dismissal_type == "catch":
            rec["catches"] += 1
        elif ev.dismissal_type == "caught_and_bowled":
            rec["caught_and_bowled"] += 1
        elif ev.dismissal_type == "run_out":
            rec["run_outs_direct"] += 1
        elif ev.dismissal_type == "run_out_assist":
            rec["run_out_assists"] += 1
        elif ev.dismissal_type == "stumping":
            rec["stumpings"] += 1

    leaderboard = []
    for rec in agg.values():
        m_cnt = len(matches_by_player.get(rec["fielder_id"], rec["matches_with_event"])) or 1
        total_catches = rec["catches"] + rec["caught_and_bowled"]
        total_runouts = rec["run_outs_direct"] + rec["run_out_assists"]
        leaderboard.append({
            "fielder_id": rec["fielder_id"],
            "fielder_name": rec["fielder_name"],
            "matches": m_cnt,
            "catches": total_catches,
            "caught_and_bowled": rec["caught_and_bowled"],
            "run_outs_direct": rec["run_outs_direct"],
            "run_out_assists": rec["run_out_assists"],
            "run_outs_total": total_runouts,
            "stumpings": rec["stumpings"],
            "total_dismissals": rec["total_dismissals"],
            "dismissals_per_match": round(rec["total_dismissals"] / m_cnt, 2),
            "season_breakdown": {str(k): v for k, v in sorted(rec["seasons"].items())}
        })

    leaderboard.sort(key=lambda x: (-x["total_dismissals"], -x["run_outs_total"], -x["catches"]))

    # Season summary
    season_summary = defaultdict(lambda: {"season": 0, "catches": 0, "run_outs": 0, "stumpings": 0, "total": 0})
    for ev in events:
        ss = season_summary[ev.season]
        ss["season"] = ev.season
        ss["total"] += 1
        if ev.dismissal_type in ("catch", "caught_and_bowled"):
            ss["catches"] += 1
        elif ev.dismissal_type in ("run_out", "run_out_assist"):
            ss["run_outs"] += 1
        elif ev.dismissal_type == "stumping":
            ss["stumpings"] += 1

    return {
        "availability": "DIRECTLY AVAILABLE",
        "method_note": "Extracted directly from CricHeroes scorecard dismissal strings. Joint run-outs ('A / B') credit each participating fielder with a run-out assist. Non-dismissal metrics (dropped catches, runs saved) are not recorded in source PDFs.",
        "total_fielding_events": len(events),
        "bowler_vs_fielder_attribution": {
            "total_wickets_fallen": bowler_credited + dismissal_breakdown["run_out_fielder_only"] + dismissal_breakdown["other_dismissals"],
            "bowler_credited_dismissals": bowler_credited,
            "fielder_assisted_dismissals": fielder_involved,
            "run_out_share_pct": round((dismissal_breakdown["run_out_fielder_only"] / max(1, bowler_credited + dismissal_breakdown["run_out_fielder_only"])) * 100, 1),
            "breakdown": dismissal_breakdown
        },
        "leaderboard": leaderboard,
        "by_season": [season_summary[s] for s in sorted(season_summary.keys())]
    }


def get_advanced_batting_analytics(db: Session, season: Optional[int] = None) -> Dict[str, Any]:
    q = db.query(BattingScorecard).filter(BattingScorecard.innings_type == "Regular")
    if season:
        q = q.filter(BattingScorecard.season == season)
    rows = q.all()

    matches_by_id = {m.id: m for m in db.query(Match).all()}
    innings_by_id = {i.id: i for i in db.query(Innings).all()}
    players_by_id = {p.id: p for p in db.query(Player).all()}

    by_player = defaultdict(list)
    for r in rows:
        by_player[r.player_id].append(r)

    records = []
    for pid, scs in by_player.items():
        p = players_by_id.get(pid)
        if not p:
            continue
        inns = len(scs)
        runs_list = [s.runs for s in scs]
        tot_runs = sum(runs_list)
        tot_balls = sum(s.balls for s in scs)
        tot_4s = sum(s.fours for s in scs)
        tot_6s = sum(s.sixes for s in scs)
        boundary_runs = tot_4s * 4 + tot_6s * 6
        not_outs = sum(1 for s in scs if s.is_not_out)
        dismissals = inns - not_outs

        # Team contribution %
        team_totals_sum = sum((innings_by_id[s.innings_id].total_runs if s.innings_id in innings_by_id else 0) for s in scs)
        team_share_pct = round((tot_runs / team_totals_sum) * 100.0, 1) if team_totals_sum > 0 else 0.0

        # Consistency (Std Dev & Coefficient of Variation)
        mean_r = tot_runs / inns
        variance = sum((x - mean_r) ** 2 for x in runs_list) / inns
        std_dev = round(math.sqrt(variance), 2)
        consistency_score = round(max(0.0, 100.0 - (std_dev / max(1.0, mean_r)) * 45.0), 1) if inns >= 3 else None

        # High-impact innings (>= 20 runs OR >= 35% of team total with >= 12 runs)
        high_impact = 0
        win_runs, win_inns, win_balls = 0, 0, 0
        loss_runs, loss_inns, loss_balls = 0, 0, 0
        season_runs = defaultdict(int)

        for s in scs:
            season_runs[s.season] += s.runs
            inn_tot = innings_by_id[s.innings_id].total_runs if s.innings_id in innings_by_id else 0
            if s.runs >= 20 or (inn_tot > 0 and s.runs >= 12 and (s.runs / inn_tot) >= 0.35):
                high_impact += 1
            m = matches_by_id.get(s.match_id)
            if m and m.winner:
                if m.winner.strip().lower() == s.team.strip().lower():
                    win_runs += s.runs
                    win_inns += 1
                    win_balls += s.balls
                else:
                    loss_runs += s.runs
                    loss_inns += 1
                    loss_balls += s.balls

        records.append({
            "player_id": pid,
            "name": p.name,
            "primary_role": p.primary_role,
            "innings": inns,
            "runs": tot_runs,
            "balls": tot_balls,
            "batting_average": round(tot_runs / dismissals, 2) if dismissals > 0 else float(tot_runs),
            "strike_rate": round((tot_runs / tot_balls) * 100, 1) if tot_balls > 0 else 0.0,
            "runs_per_innings": round(mean_r, 2),
            "boundary_runs_pct": round((boundary_runs / tot_runs) * 100, 1) if tot_runs > 0 else 0.0,
            "boundary_ball_pct": round(((tot_4s + tot_6s) / tot_balls) * 100, 1) if tot_balls > 0 else 0.0,
            "dot_ball_pct": None, # Explicitly NOT AVAILABLE in CricHeroes batting PDFs
            "team_run_share_pct": team_share_pct,
            "not_out_frequency_pct": round((not_outs / inns) * 100, 1),
            "scoring_std_dev": std_dev,
            "consistency_index": consistency_score,
            "high_impact_innings": high_impact,
            "runs_in_wins": win_runs,
            "avg_in_wins": round(win_runs / win_inns, 2) if win_inns > 0 else 0.0,
            "sr_in_wins": round((win_runs / win_balls) * 100, 1) if win_balls > 0 else 0.0,
            "runs_in_losses": loss_runs,
            "avg_in_losses": round(loss_runs / loss_inns, 2) if loss_inns > 0 else 0.0,
            "season_progression": {str(k): v for k, v in sorted(season_runs.items())}
        })

    records.sort(key=lambda x: (-x["runs"], -x["strike_rate"]))
    return {
        "availability": "DERIVABLE FROM EXISTING DATA",
        "dot_ball_status": "NOT AVAILABLE — CricHeroes historical batting PDFs record R, B, 4s, 6s, SR only (no batter 0s column).",
        "count": len(records),
        "players": records
    }


def get_advanced_bowling_analytics(db: Session, season: Optional[int] = None) -> Dict[str, Any]:
    q = db.query(BowlingScorecard).filter(BowlingScorecard.innings_type == "Regular")
    if season:
        q = q.filter(BowlingScorecard.season == season)
    rows = q.all()

    matches_by_id = {m.id: m for m in db.query(Match).all()}
    innings_by_id = {i.id: i for i in db.query(Innings).all()}
    players_by_id = {p.id: p for p in db.query(Player).all()}

    by_player = defaultdict(list)
    for r in rows:
        by_player[r.player_id].append(r)

    records = []
    for pid, scs in by_player.items():
        p = players_by_id.get(pid)
        if not p:
            continue
        spells = len(scs)
        tot_balls = sum(s.legal_balls for s in scs)
        tot_runs = sum(s.runs_conceded for s in scs)
        tot_wkts = sum(s.wickets for s in scs)
        tot_dots = sum(s.dot_balls or 0 for s in scs)
        tot_wides = sum(s.wides or 0 for s in scs)
        tot_nb = sum(s.no_balls or 0 for s in scs)

        overs_whole = tot_balls // 6
        overs_rem = tot_balls % 6
        overs_str = f"{overs_whole}.{overs_rem}"
        econ = round((tot_runs / tot_balls) * 6.0, 2) if tot_balls > 0 else 0.0
        dot_pct = round((tot_dots / tot_balls) * 100.0, 1) if tot_balls > 0 else 0.0

        # Bowling contribution (% of team wickets taken in those innings)
        team_wkts_sum = sum((innings_by_id[s.innings_id].wickets if s.innings_id in innings_by_id else 0) for s in scs)
        wkt_share = round((tot_wkts / team_wkts_sum) * 100.0, 1) if team_wkts_sum > 0 else 0.0

        # Economy consistency across spells
        spell_econs = [(s.runs_conceded / s.legal_balls) * 6.0 for s in scs if s.legal_balls > 0]
        econ_std = round(math.sqrt(sum((e - econ) ** 2 for e in spell_econs) / len(spell_econs)), 2) if spell_econs else 0.0

        # Best spell
        best = max(scs, key=lambda s: (s.wickets, -s.runs_conceded))
        best_spell = f"{best.wickets}/{best.runs_conceded}"

        win_wkts, win_balls, win_runs = 0, 0, 0
        opp_splits = defaultdict(lambda: {"wickets": 0, "runs": 0, "balls": 0})
        season_econ = defaultdict(lambda: {"runs": 0, "balls": 0, "wickets": 0})

        for s in scs:
            season_econ[s.season]["runs"] += s.runs_conceded
            season_econ[s.season]["balls"] += s.legal_balls
            season_econ[s.season]["wickets"] += s.wickets
            m = matches_by_id.get(s.match_id)
            if m:
                opp = m.team2 if m.team1 == s.team else m.team1
                opp_splits[opp]["wickets"] += s.wickets
                opp_splits[opp]["runs"] += s.runs_conceded
                opp_splits[opp]["balls"] += s.legal_balls
                if m.winner and m.winner.strip().lower() == s.team.strip().lower():
                    win_wkts += s.wickets
                    win_balls += s.legal_balls
                    win_runs += s.runs_conceded

        season_prog = {
            str(k): {
                "wickets": v["wickets"],
                "economy": round((v["runs"] / v["balls"]) * 6.0, 2) if v["balls"] > 0 else 0.0
            }
            for k, v in sorted(season_econ.items())
        }
        top_opponents = [
            {
                "opponent": opp,
                "wickets": d["wickets"],
                "economy": round((d["runs"] / d["balls"]) * 6.0, 2) if d["balls"] > 0 else 0.0
            }
            for opp, d in sorted(opp_splits.items(), key=lambda kv: (-kv[1]["wickets"], kv[1]["runs"]))[:4]
        ]

        records.append({
            "player_id": pid,
            "name": p.name,
            "primary_role": p.primary_role,
            "matches_bowled": spells,
            "overs": overs_str,
            "legal_balls": tot_balls,
            "runs_conceded": tot_runs,
            "wickets": tot_wkts,
            "wickets_per_match": round(tot_wkts / spells, 2),
            "economy": econ,
            "dot_balls": tot_dots,
            "dot_ball_pct": dot_pct,
            "extras_conceded": tot_wides + tot_nb,
            "bowling_contribution_pct": wkt_share,
            "wickets_in_wins": win_wkts,
            "economy_in_wins": round((win_runs / win_balls) * 6.0, 2) if win_balls > 0 else 0.0,
            "best_spell": best_spell,
            "economy_std_dev": econ_std,
            "season_progression": season_prog,
            "top_opponents": top_opponents
        })

    records.sort(key=lambda x: (-x["wickets"], x["economy"]))
    return {
        "availability": "DIRECTLY AVAILABLE (Dot Balls) + DERIVABLE",
        "dot_ball_status": "DIRECTLY AVAILABLE — Verified across all 277 regulation bowling scorecards (827 total dot balls).",
        "count": len(records),
        "players": records
    }


def get_player_impact_analytics(db: Session) -> Dict[str, Any]:
    """
    Player Impact Model combining winning-match contribution, consistency,
    knockout performance, and dual-discipline (batting + bowling) impact.
    Explicitly frames all findings as historical associations (correlation, not causation).
    """
    summaries = get_all_players_summary(db)
    adv_bat = {p["player_id"]: p for p in get_advanced_batting_analytics(db)["players"]}
    adv_bowl = {p["player_id"]: p for p in get_advanced_bowling_analytics(db)["players"]}
    field_map = {f["fielder_id"]: f for f in get_fielding_analytics(db)["leaderboard"] if f["fielder_id"]}

    matches_by_id = {m.id: m for m in db.query(Match).all()}
    ko_match_ids = {m.id for m in matches_by_id.values() if m.stage in ("Semi Final", "Final", "Semifinal")}

    ko_bat = defaultdict(lambda: {"runs": 0, "balls": 0, "inns": 0})
    for sc in db.query(BattingScorecard).filter(BattingScorecard.innings_type == "Regular").all():
        if sc.match_id in ko_match_ids:
            ko_bat[sc.player_id]["runs"] += sc.runs
            ko_bat[sc.player_id]["balls"] += sc.balls
            ko_bat[sc.player_id]["inns"] += 1

    ko_bowl = defaultdict(lambda: {"wkts": 0, "runs": 0, "balls": 0, "spells": 0})
    for sc in db.query(BowlingScorecard).filter(BowlingScorecard.innings_type == "Regular").all():
        if sc.match_id in ko_match_ids:
            ko_bowl[sc.player_id]["wkts"] += sc.wickets
            ko_bowl[sc.player_id]["runs"] += sc.runs_conceded
            ko_bowl[sc.player_id]["balls"] += sc.legal_balls
            ko_bowl[sc.player_id]["spells"] += 1

    impact_rows = []
    for p in summaries:
        pid = p["player_id"]
        if p["matches"] < 2:
            continue
        b = adv_bat.get(pid, {})
        bw = adv_bowl.get(pid, {})
        fd = field_map.get(pid, {})
        kb = ko_bat.get(pid, {"runs": 0, "balls": 0, "inns": 0})
        kbw = ko_bowl.get(pid, {"wkts": 0, "runs": 0, "balls": 0, "spells": 0})

        winning_contrib = round(
            min(40.0, b.get("runs_in_wins", 0) * 0.4)
            + min(40.0, bw.get("wickets_in_wins", 0) * 5.0)
            + min(20.0, fd.get("total_dismissals", 0) * 2.0),
            1
        )
        ko_inns = kb["inns"] + kbw["spells"]
        ko_impact = round(
            min(50.0, kb["runs"] * 0.8) + min(50.0, kbw["wkts"] * 12.0),
            1
        ) if ko_inns > 0 else 0.0

        bat_r = p["ratings"]["batting_rating"]
        bowl_r = p["ratings"]["bowling_rating"]
        two_way_score = round((2 * bat_r * bowl_r) / (bat_r + bowl_r), 1) if (bat_r > 10 and bowl_r > 10) else 0.0

        composite_impact = round(
            p["ratings"]["overall_rating"] * 0.40
            + winning_contrib * 0.25
            + ko_impact * 0.20
            + two_way_score * 0.15,
            1
        )

        tags = []
        if winning_contrib >= 45: tags.append("High Winning-Match Contributor")
        if b.get("high_impact_innings", 0) >= 2: tags.append("Explosive Match-Turners")
        if ko_impact >= 35: tags.append("Knockout Performer")
        if two_way_score >= 45: tags.append("Dual-Discipline Anchor")
        if (b.get("consistency_index") or 0) >= 60: tags.append("Consistent Scorer")

        impact_rows.append({
            "player_id": pid,
            "name": p["name"],
            "primary_role": p["primary_role"],
            "matches": p["matches"],
            "overall_rating": p["ratings"]["overall_rating"],
            "winning_contribution_score": winning_contrib,
            "knockout_impact_score": ko_impact,
            "knockout_appearances": ko_inns,
            "two_way_balance_score": two_way_score,
            "high_impact_innings": b.get("high_impact_innings", 0),
            "fielding_dismissals": fd.get("total_dismissals", 0),
            "consistency_index": b.get("consistency_index"),
            "composite_impact_index": composite_impact,
            "archetype_tags": tags[:3]
        })

    impact_rows.sort(key=lambda x: -x["composite_impact_index"])
    return {
        "methodology_disclaimer": "Statistical Association Notice: High impact indices measure historical co-occurrence between individual output and team victories (correlation). Cricket outcomes depend on all teammates, opposition quality, and match context; no metric implies single-handed causation.",
        "count": len(impact_rows),
        "players": impact_rows
    }


def get_overview_charts(db: Session) -> Dict[str, Any]:
    matches = db.query(Match).all()
    reg_innings = db.query(Innings).filter(Innings.innings_type == "Regular").all()
    reg_bat = db.query(BattingScorecard).filter(BattingScorecard.innings_type == "Regular").all()
    reg_bowl = db.query(BowlingScorecard).filter(BowlingScorecard.innings_type == "Regular").all()

    match_season = {m.id: m.season for m in matches}
    season_stats = defaultdict(lambda: {"season": 0, "matches": 0, "runs": 0, "wickets": 0, "balls": 0, "fours": 0, "sixes": 0, "extras": 0})

    for m in matches:
        season_stats[m.season]["season"] = m.season
        season_stats[m.season]["matches"] += 1
    for inn in reg_innings:
        s = match_season.get(inn.match_id)
        if s:
            season_stats[s]["runs"] += inn.total_runs
            season_stats[s]["wickets"] += inn.wickets
            season_stats[s]["balls"] += inn.legal_balls
            season_stats[s]["extras"] += inn.extras_runs or 0
    for b in reg_bat:
        season_stats[b.season]["fours"] += b.fours
        season_stats[b.season]["sixes"] += b.sixes

    season_trends = []
    for s in sorted(season_stats.keys()):
        d = season_stats[s]
        rr = round((d["runs"] / d["balls"]) * 6.0, 2) if d["balls"] > 0 else 0.0
        b_per_m = round((d["fours"] + d["sixes"]) / max(1, d["matches"]), 2)
        season_trends.append({
            "season": str(s),
            "matches": d["matches"],
            "total_runs": d["runs"],
            "total_wickets": d["wickets"],
            "run_rate": rr,
            "boundaries_total": d["fours"] + d["sixes"],
            "boundaries_per_match": b_per_m,
            "fours": d["fours"],
            "sixes": d["sixes"]
        })

    # Team wins distribution
    team_wins = defaultdict(lambda: {"team": "", "wins": 0, "matches": 0})
    for m in matches:
        for t in (m.team1, m.team2):
            team_wins[t]["team"] = t
            team_wins[t]["matches"] += 1
        if m.winner:
            team_wins[m.winner]["wins"] += 1
    team_win_dist = sorted(
        [
            {
                "team": d["team"],
                "wins": d["wins"],
                "losses": max(0, d["matches"] - d["wins"]),
                "matches": d["matches"],
                "win_pct": round((d["wins"] / max(1, d["matches"])) * 100, 1)
            }
            for d in team_wins.values()
        ],
        key=lambda x: (-x["wins"], -x["win_pct"])
    )[:10]

    # Toss & Chasing outcomes
    toss_won_match = 0
    toss_lost_match = 0
    bat_first_wins = 0
    chase_wins = 0
    first_inn_by_match = {inn.match_id: inn.batting_team for inn in reg_innings if inn.innings_number == 1}

    for m in matches:
        if not m.winner:
            continue
        if m.toss_winner and m.toss_winner.strip().lower() == m.winner.strip().lower():
            toss_won_match += 1
        else:
            toss_lost_match += 1

        bf = first_inn_by_match.get(m.id, "")
        if bf and bf.strip().lower() == m.winner.strip().lower():
            bat_first_wins += 1
        else:
            chase_wins += 1

    # Batting vs Bowling scoring composition (boundary runs vs non-boundary vs extras)
    total_bat_runs = sum(b.runs for b in reg_bat)
    boundary_runs = sum(b.fours * 4 + b.sixes * 6 for b in reg_bat)
    running_runs = max(0, total_bat_runs - boundary_runs)
    extras_runs = sum(inn.extras_runs or 0 for inn in reg_innings)
    dot_balls = sum(bw.dot_balls or 0 for bw in reg_bowl)
    scoring_balls = max(0, sum(bw.legal_balls for bw in reg_bowl) - dot_balls)

    return {
        "season_trends": season_trends,
        "team_win_distribution": team_win_dist,
        "toss_outcomes": [
            {"label": "Toss Winner Won", "count": toss_won_match, "pct": round(toss_won_match / max(1, len(matches)) * 100, 1)},
            {"label": "Toss Loser Won", "count": toss_lost_match, "pct": round(toss_lost_match / max(1, len(matches)) * 100, 1)}
        ],
        "innings_outcomes": [
            {"label": "Chasing Team Won", "count": chase_wins, "pct": round(chase_wins / max(1, len(matches)) * 100, 1)},
            {"label": "Batting First Won", "count": bat_first_wins, "pct": round(bat_first_wins / max(1, len(matches)) * 100, 1)}
        ],
        "run_composition": [
            {"label": "Running Between Wickets", "runs": running_runs},
            {"label": "Boundary Runs (4s & 6s)", "runs": boundary_runs},
            {"label": "Extras (Wides/NB/Byes)", "runs": extras_runs}
        ],
        "bowling_pressure": [
            {"label": "Dot Balls Bowled", "balls": dot_balls},
            {"label": "Scoring Balls", "balls": scoring_balls}
        ]
    }


def get_player_charts(db: Session, player_id: str) -> Dict[str, Any]:
    prof = get_player_full_profile(db, player_id)
    if not prof:
        return {}

    all_summaries = get_all_players_summary(db)
    adv_bat = {p["player_id"]: p for p in get_advanced_batting_analytics(db)["players"]}
    adv_bowl = {p["player_id"]: p for p in get_advanced_bowling_analytics(db)["players"]}

    # Season progression from prof["season_breakdown"]
    season_progression = []
    sb = prof.get("season_breakdown", {}) or {}
    for sk in sorted(sb.keys(), key=lambda x: int(x)):
        sd = sb[sk]
        season_progression.append({
            "season": str(sk),
            "runs": sd["batting"].get("total_runs", 0),
            "strike_rate": sd["batting"].get("strike_rate", 0.0),
            "wickets": sd["bowling"].get("wickets", 0),
            "economy": sd["bowling"].get("economy", 0.0)
        })

    # Scatter plots: Batting Avg vs SR (qualified >= 3 innings) & Bowling Econ vs Wickets (>= 12 legal balls)
    bat_scatter = []
    bowl_scatter = []
    for p in all_summaries:
        if p.get("innings", 0) >= 3 or p["player_id"] == player_id:
            bat_scatter.append({
                "player_id": p["player_id"],
                "name": p["name"],
                "average": p["batting_average"],
                "strike_rate": p["strike_rate"],
                "runs": p["total_runs"],
                "is_target": p["player_id"] == player_id
            })
        if p.get("legal_balls", 0) >= 12 or p["player_id"] == player_id:
            bowl_scatter.append({
                "player_id": p["player_id"],
                "name": p["name"],
                "economy": p["economy"],
                "wickets": p["wickets"],
                "is_target": p["player_id"] == player_id
            })

    # Radar chart
    r = prof["ratings"]
    pb = adv_bat.get(player_id, {})
    pbw = adv_bowl.get(player_id, {})
    radar = [
        {"axis": "Batting", "score": r["batting_rating"]},
        {"axis": "Bowling", "score": r["bowling_rating"]},
        {"axis": "All-Round", "score": r["all_rounder_rating"]},
        {"axis": "Consistency", "score": r.get("consistency_rating", 50.0)},
        {"axis": "Clutch / KO", "score": r.get("clutch_rating", 50.0)},
        {"axis": "Overall", "score": r["overall_rating"]}
    ]

    # Innings-by-innings consistency series
    scs = (
        db.query(BattingScorecard)
        .filter(BattingScorecard.player_id == player_id, BattingScorecard.innings_type == "Regular")
        .order_by(BattingScorecard.season, BattingScorecard.match_id)
        .all()
    )
    innings_log = [
        {"label": f"S{str(sc.season)[-2:]}-I{idx+1}", "runs": sc.runs, "balls": sc.balls, "sr": sc.strike_rate}
        for idx, sc in enumerate(scs)
    ]

    # Wins vs Losses split
    wins_vs_losses = [
        {
            "metric": "Avg Runs / Inn",
            "In Wins": pb.get("avg_in_wins", 0.0),
            "In Losses": pb.get("avg_in_losses", 0.0)
        },
        {
            "metric": "Total Runs",
            "In Wins": pb.get("runs_in_wins", 0),
            "In Losses": pb.get("runs_in_losses", 0)
        },
        {
            "metric": "Bowling Econ",
            "In Wins": pbw.get("economy_in_wins", 0.0),
            "In Losses": pbw.get("economy", 0.0)
        }
    ]

    return {
        "player_id": player_id,
        "season_progression": season_progression,
        "batting_scatter": bat_scatter,
        "bowling_scatter": bowl_scatter,
        "radar": radar,
        "innings_consistency": innings_log,
        "wins_vs_losses": wins_vs_losses,
        "advanced_batting": pb,
        "advanced_bowling": pbw
    }


def get_team_charts(db: Session) -> Dict[str, Any]:
    matches = db.query(Match).all()
    innings = db.query(Innings).filter(Innings.innings_type == "Regular").all()

    team_stats = defaultdict(lambda: {
        "team": "", "seasons": set(), "matches": 0, "wins": 0, "losses": 0,
        "runs_for": 0, "balls_for": 0, "wickets_taken": 0, "runs_against": 0, "balls_against": 0,
        "semifinals": 0, "finals": 0, "titles": 0
    })

    for m in matches:
        for t in (m.team1, m.team2):
            ts = team_stats[t]
            ts["team"] = t
            ts["seasons"].add(m.season)
            ts["matches"] += 1
            if m.winner and m.winner.strip().lower() == t.strip().lower():
                ts["wins"] += 1
                if m.stage == "Final":
                    ts["titles"] += 1
            else:
                ts["losses"] += 1
            if "semi" in (m.stage or "").lower():
                ts["semifinals"] += 1
            if m.stage == "Final":
                ts["finals"] += 1

    for inn in innings:
        ts_b = team_stats[inn.batting_team]
        ts_b["runs_for"] += inn.total_runs
        ts_b["balls_for"] += inn.legal_balls
        ts_f = team_stats[inn.bowling_team]
        ts_f["wickets_taken"] += inn.wickets
        ts_f["runs_against"] += inn.total_runs
        ts_f["balls_against"] += inn.legal_balls

    rows = []
    for t, d in team_stats.items():
        if not t:
            continue
        bat_rr = round((d["runs_for"] / d["balls_for"]) * 6.0, 2) if d["balls_for"] > 0 else 0.0
        bowl_econ = round((d["runs_against"] / d["balls_against"]) * 6.0, 2) if d["balls_against"] > 0 else 0.0
        rows.append({
            "team": t,
            "seasons": sorted(list(d["seasons"])),
            "matches": d["matches"],
            "wins": d["wins"],
            "losses": d["losses"],
            "win_pct": round((d["wins"] / max(1, d["matches"])) * 100, 1),
            "runs_for": d["runs_for"],
            "batting_rr": bat_rr,
            "wickets_taken": d["wickets_taken"],
            "bowling_econ": bowl_econ,
            "semifinals": d["semifinals"],
            "finals": d["finals"],
            "titles": d["titles"]
        })

    rows.sort(key=lambda x: (-x["titles"], -x["wins"], -x["win_pct"]))
    return {"teams": rows}
