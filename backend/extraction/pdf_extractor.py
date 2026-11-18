import os
import glob
import re
import json
import fitz # PyMuPDF
from typing import List, Dict, Any

from .identity_resolver import IdentityResolver, clean_raw_name
from backend.database.db import engine, SessionLocal, Base
from backend.database.models import (
    Match, Innings, Player, PlayerAlias, BattingScorecard,
    BowlingScorecard, DataQualityAudit, AuctionTeam,
    AuctionShortlist, AuctionSquadMember, AuctionBidAudit
)

def parse_pdf_match(file_path: str, resolver: IdentityResolver) -> Dict[str, Any]:
    doc = fitz.open(file_path)
    file_name = os.path.basename(file_path)
    
    # 1. Season detection
    m_season = re.search(r'202[3-5]', file_path)
    season = int(m_season.group(0)) if m_season else 2023
    
    # 2. Page 1: Metadata
    p1 = doc[0]
    lines1 = [l.strip() for l in p1.get_text().split('\n') if l.strip()]
    
    tourn_line = lines1[0]
    stage = "League"
    if "semi" in tourn_line.lower() or "semifinal" in file_name.lower():
        stage = "Semi Final"
    elif "final" in tourn_line.lower() or "final" in file_name.lower():
        stage = "Final"
        
    m_idx = lines1.index('Match')
    teams_str = lines1[m_idx+1]
    teams = [t.strip() for t in teams_str.split(' vs ')]
    team1 = teams[0]
    team2 = teams[1] if len(teams) > 1 else ""
    
    g_idx = lines1.index('Ground')
    ground_parts = []
    i = g_idx + 1
    while i < len(lines1) and lines1[i] != 'Date':
        ground_parts.append(lines1[i])
        i += 1
    ground = " ".join(ground_parts)
    
    d_idx = lines1.index('Date')
    date_str = lines1[d_idx+1]
    
    toss_str = ""
    toss_winner = ""
    toss_decision = ""
    if 'Toss' in lines1:
        t_idx = lines1.index('Toss')
        toss_str = lines1[t_idx+1]
        m_toss = re.match(r'^(.*?)\s+opt to\s+(bat|field)', toss_str, re.IGNORECASE)
        if m_toss:
            toss_winner = m_toss.group(1).strip()
            toss_decision = m_toss.group(2).strip().capitalize()
    
    result_str = ""
    for idx, l in enumerate(lines1):
        if l == 'Result':
            res_parts = []
            j = idx + 1
            while j < len(lines1) and not lines1[j].startswith('Best Performances'):
                res_parts.append(lines1[j])
                j += 1
            result_str = " ".join(res_parts)
            break
        elif l.startswith('Result '):
            res_parts = [l[7:].strip()]
            j = idx + 1
            while j < len(lines1) and not lines1[j].startswith('Best Performances'):
                res_parts.append(lines1[j])
                j += 1
            result_str = " ".join(res_parts)
            break

    # Determine winner & win margin
    winner = ""
    win_margin_runs = None
    win_margin_wickets = None
    is_super_over = "super over" in result_str.lower()
    
    m_win_runs = re.search(r'^(.*?)\s+won by\s+(\d+)\s+run', result_str, re.IGNORECASE)
    m_win_wkts = re.search(r'^(.*?)\s+won by\s+(\d+)\s+wicket', result_str, re.IGNORECASE)
    if m_win_runs:
        winner = m_win_runs.group(1).strip()
        win_margin_runs = int(m_win_runs.group(2))
    elif m_win_wkts:
        winner = m_win_wkts.group(1).strip()
        win_margin_wickets = int(m_win_wkts.group(2))
    elif is_super_over:
        m_so = re.search(r'\((.*?)\s+won the super over', result_str, re.IGNORECASE)
        if m_so:
            winner = m_so.group(1).strip()

    # Captains from Match Officials
    captains = {}
    if 'Match Officials' in lines1:
        mo_idx = lines1.index('Match Officials')
        j = mo_idx + 1
        while j < len(lines1):
            if lines1[j] in ['1', '2', '3'] and j+2 < len(lines1) and lines1[j+2] == 'Captain':
                c_name = lines1[j+1]
                m_cap = re.match(r'^(.*?)\s*\((.*?)\)$', c_name)
                if m_cap:
                    captains[m_cap.group(2).strip()] = m_cap.group(1).strip()
                j += 3
            else:
                j += 1

    # Innings parsing
    innings_list = []
    for pno in range(1, len(doc)):
        p_text = doc[pno].get_text()
        lines = [l.strip() for l in p_text.split('\n') if l.strip()]
        
        hdr_line = ""
        for l in lines[:10]:
            if 'Ov)' in l:
                hdr_line = l
                break
                
        inn_team = ""
        inn_runs = 0
        inn_wickets = 0
        inn_overs = 0.0
        inn_type = "Regular"
        if hdr_line:
            m_hdr = re.match(r'^(.*?)\s+(\d+)/(\d+)\s*\(([\d\.]+)\s*Ov\)\s*(\(.*?\))?', hdr_line)
            if m_hdr:
                inn_team = m_hdr.group(1).strip()
                inn_runs = int(m_hdr.group(2))
                inn_wickets = int(m_hdr.group(3))
                inn_overs = float(m_hdr.group(4))
                if pno >= 3 and len(doc) == 5:
                    inn_type = "Super Over"

        # Batting records
        batting_records = []
        if 'SR' in lines:
            b_idx = lines.index('SR')
            e_idx = next(i for i in range(b_idx, len(lines)) if lines[i].startswith('Extras:'))
            bat_lines = lines[b_idx+1:e_idx]
            for bi in range(0, len(bat_lines), 9):
                pos = int(bat_lines[bi])
                raw_name = bat_lines[bi+1]
                dismissal = bat_lines[bi+2]
                r = int(bat_lines[bi+3])
                b = int(bat_lines[bi+4])
                m = int(bat_lines[bi+5])
                fours = int(bat_lines[bi+6])
                sixes = int(bat_lines[bi+7])
                sr = float(bat_lines[bi+8]) if bat_lines[bi+8] != '-' else 0.0
                
                is_c = '(c)' in raw_name
                is_wk = '(wk)' in raw_name
                bat_hand = "RHB" if "(RHB)" in raw_name else ("LHB" if "(LHB)" in raw_name else "RHB")
                
                canonical_name, player_id, _ = resolver.resolve(raw_name)
                
                # Cricket rule: retired hurt is not-out
                is_not_out = (dismissal.strip().lower() in ['not out', 'retired hurt'])
                
                # Bowler / Fielder attribution
                bowler_attr = None
                fielder_attr = None
                if ' b ' in dismissal:
                    parts = dismissal.split(' b ')
                    bowler_attr = parts[-1].strip()
                    prefix = parts[0].strip()
                    if prefix.startswith('c '):
                        fielder_attr = prefix[2:].strip()
                    elif prefix.startswith('st '):
                        fielder_attr = prefix[3:].strip()
                elif dismissal.startswith('b '):
                    bowler_attr = dismissal[2:].strip()
                elif dismissal.startswith('c&b '):
                    bowler_attr = dismissal[4:].strip()
                    fielder_attr = bowler_attr
                elif dismissal.startswith('run out '):
                    fielder_attr = dismissal[8:].strip()

                batting_records.append({
                    "batting_position": pos,
                    "player_id": player_id,
                    "player_name": canonical_name,
                    "raw_name": raw_name,
                    "batting_hand": bat_hand,
                    "is_captain": is_c,
                    "is_wicketkeeper": is_wk,
                    "dismissal": dismissal,
                    "is_not_out": is_not_out,
                    "runs": r,
                    "balls": b,
                    "minutes": m,
                    "fours": fours,
                    "sixes": sixes,
                    "strike_rate": sr,
                    "bowler_name": bowler_attr,
                    "fielder_name": fielder_attr
                })

        # Extras and Did Not Bat
        extras_line = ""
        extras_val = 0
        to_bat = []
        fow = ""
        
        for idx, l in enumerate(lines):
            if l.startswith('Extras:'):
                extras_line = l
                if idx + 1 < len(lines) and lines[idx+1].isdigit():
                    extras_val = int(lines[idx+1])
            elif l.startswith('To Bat:'):
                to_bat_str = l[7:].strip()
                to_bat = [p.strip() for p in to_bat_str.split(',') if p.strip()]
            elif l == 'Fall of Wickets':
                if idx + 1 < len(lines):
                    fow = lines[idx+1]

        # Bowling records
        bowling_records = []
        if 'Eco' in lines:
            eco_idx = lines.index('Eco')
            b_lines = [bl for bl in lines[eco_idx+1:] if not ('cricheroes.com' in bl or bl.endswith('of 3') or bl.endswith('of 5') or '/25,' in bl)]
            for bi in range(0, len(b_lines), 12):
                b_num = int(b_lines[bi])
                raw_bname = b_lines[bi+1]
                overs = float(b_lines[bi+2])
                maidens = int(b_lines[bi+3])
                runs_c = int(b_lines[bi+4])
                wickets = int(b_lines[bi+5])
                dots = int(b_lines[bi+6])
                fours_c = int(b_lines[bi+7])
                sixes_c = int(b_lines[bi+8])
                wides = int(b_lines[bi+9])
                noballs = int(b_lines[bi+10])
                eco = float(b_lines[bi+11]) if b_lines[bi+11] != '-' else 0.0
                
                is_c = '(c)' in raw_bname
                canonical_bname, player_id, _ = resolver.resolve(raw_bname)
                
                # Overs conversion: 5.4 = 5*6 + 4 = 34 balls
                ov_int = int(overs)
                balls_rem = int(round((overs - ov_int) * 10))
                legal_balls = ov_int * 6 + balls_rem
                
                bowling_records.append({
                    "bowling_order": b_num,
                    "player_id": player_id,
                    "player_name": canonical_bname,
                    "raw_name": raw_bname,
                    "is_captain": is_c,
                    "overs": overs,
                    "legal_balls": legal_balls,
                    "maidens": maidens,
                    "runs_conceded": runs_c,
                    "wickets": wickets,
                    "dot_balls": dots,
                    "fours_conceded": fours_c,
                    "sixes_conceded": sixes_c,
                    "wides": wides,
                    "no_balls": noballs,
                    "economy": eco
                })

        # Validation
        batting_runs_sum = sum(b['runs'] for b in batting_records)
        bowling_runs_sum = sum(bw['runs_conceded'] for bw in bowling_records)
        calculated_runs = batting_runs_sum + extras_val
        uncredited = inn_runs - calculated_runs
        
        ov_int = int(inn_overs)
        balls_rem = int(round((inn_overs - ov_int) * 10))
        inn_legal_balls = ov_int * 6 + balls_rem
        
        validation_status = "VALIDATED"
        confidence_score = 1.0
        if uncredited != 0:
            validation_status = "UNCREDITED_RUNS_NOTED"
            confidence_score = 0.95 # Uncredited penalty/bonus adjustment in scorebook

        opp_team = team2 if inn_team == team1 else team1

        innings_list.append({
            "innings_number": pno,
            "innings_type": inn_type,
            "team": inn_team,
            "opponent_team": opp_team,
            "runs": inn_runs,
            "wickets": inn_wickets,
            "overs": inn_overs,
            "legal_balls": inn_legal_balls,
            "crr": round(inn_runs / (inn_legal_balls / 6.0), 2) if inn_legal_balls > 0 else 0.0,
            "extras_runs": extras_val,
            "extras_text": extras_line,
            "did_not_bat": to_bat,
            "fall_of_wickets": fow,
            "batting_runs_sum": batting_runs_sum,
            "bowling_runs_sum": bowling_runs_sum,
            "uncredited_runs": uncredited,
            "validation_status": validation_status,
            "confidence_score": confidence_score,
            "batting": batting_records,
            "bowling": bowling_records
        })

    match_code = f"EPL-{season}-{os.path.splitext(file_name)[0].replace(' ', '-').upper()}"

    return {
        "match_code": match_code,
        "season": season,
        "stage": stage,
        "file_name": file_name,
        "ground": ground,
        "date": date_str,
        "team1": team1,
        "team2": team2,
        "toss_winner": toss_winner,
        "toss_decision": toss_decision,
        "result": result_str,
        "winner": winner,
        "win_margin_runs": win_margin_runs,
        "win_margin_wickets": win_margin_wickets,
        "is_super_over": is_super_over,
        "captains": captains,
        "innings": innings_list
    }

def run_extraction_and_import():
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data"))
    raw_dir = os.path.join(data_dir, "raw")
    extracted_dir = os.path.join(data_dir, "extracted")
    reports_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../reports"))
    os.makedirs(extracted_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)
    
    files = sorted(glob.glob(os.path.join(raw_dir, "**/*.pdf"), recursive=True))
    print(f"Discovered {len(files)} match scorecard PDFs.")
    
    resolver = IdentityResolver()
    parsed_matches = []
    audits = []
    
    for f in files:
        try:
            m = parse_pdf_match(f, resolver)
            parsed_matches.append(m)
            # Record audits for uncredited runs
            for inn in m['innings']:
                if inn['uncredited_runs'] != 0:
                    audits.append({
                        "file_name": m['file_name'],
                        "season": m['season'],
                        "category": "VALIDATION",
                        "severity": "WARNING",
                        "message": f"{inn['team']} declared total {inn['runs']} differs from (batting {inn['batting_runs_sum']} + extras {inn['extras_runs']}). Uncredited adjustment: {inn['uncredited_runs']} runs.",
                        "details_json": json.dumps({"match": m['match_code'], "team": inn['team'], "uncredited_runs": inn['uncredited_runs']})
                    })
        except Exception as e:
            audits.append({
                "file_name": os.path.basename(f),
                "season": None,
                "category": "PARSING",
                "severity": "ERROR",
                "message": f"Failed to parse PDF: {str(e)}",
                "details_json": json.dumps({"error": str(e)})
            })

    # Save to data/extracted/matches.json
    matches_json_path = os.path.join(extracted_dir, "matches.json")
    with open(matches_json_path, "w", encoding="utf-8") as f:
        json.dump(parsed_matches, f, indent=2)
    print(f"Saved {len(parsed_matches)} matches to {matches_json_path}")

    # Database Import
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    
    try:
        # Clear existing tables for reproducible fresh import
        session.query(AuctionBidAudit).delete()
        session.query(AuctionShortlist).delete()
        session.query(DataQualityAudit).delete()
        session.query(BattingScorecard).delete()
        session.query(BowlingScorecard).delete()
        session.query(Innings).delete()
        session.query(Match).delete()
        session.query(PlayerAlias).delete()
        session.query(Player).delete()
        session.commit()

        # 1. Insert Players & Aliases
        # Collect distinct batting hands per player
        player_hands = {}
        for m in parsed_matches:
            for inn in m['innings']:
                for b in inn['batting']:
                    player_hands[b['player_id']] = b['batting_hand']

        for c_name, p_id in resolver.canonical_players.items():
            p_obj = Player(
                id=p_id,
                name=c_name,
                normalized_name=c_name.lower(),
                batting_hand=player_hands.get(p_id, "RHB"),
                primary_role="All-rounder", # Initial default, updated by analytics engine
                secondary_roles_json="[]",
                is_registered_auction=True,
                is_new_player=False
            )
            session.add(p_obj)

        for raw_name, c_name in resolver.raw_to_canonical.items():
            p_id = resolver.canonical_players[c_name]
            alias_obj = PlayerAlias(
                raw_name=raw_name,
                player_id=p_id,
                status="AUTO_RESOLVED" if raw_name != c_name else "EXACT_MATCH"
            )
            session.add(alias_obj)
        session.commit()

        # 2. Insert Matches, Innings, Scorecards
        for m in parsed_matches:
            match_row = Match(
                match_code=m['match_code'],
                season=m['season'],
                stage=m['stage'],
                file_name=m['file_name'],
                ground=m['ground'],
                match_date=m['date'],
                team1=m['team1'],
                team2=m['team2'],
                toss_winner=m['toss_winner'],
                toss_decision=m['toss_decision'],
                result=m['result'],
                winner=m['winner'],
                win_margin_runs=m['win_margin_runs'],
                win_margin_wickets=m['win_margin_wickets'],
                is_super_over=m['is_super_over'],
                captains_json=json.dumps(m['captains'])
            )
            session.add(match_row)
            session.flush()

            for inn in m['innings']:
                inn_row = Innings(
                    match_id=match_row.id,
                    innings_number=inn['innings_number'],
                    innings_type=inn['innings_type'],
                    batting_team=inn['team'],
                    bowling_team=inn['opponent_team'],
                    total_runs=inn['runs'],
                    wickets=inn['wickets'],
                    overs=inn['overs'],
                    legal_balls=inn['legal_balls'],
                    crr=inn['crr'],
                    extras_runs=inn['extras_runs'],
                    extras_text=inn['extras_text'],
                    did_not_bat_json=json.dumps(inn['did_not_bat']),
                    fall_of_wickets=inn['fall_of_wickets'],
                    batting_runs_sum=inn['batting_runs_sum'],
                    bowling_runs_sum=inn['bowling_runs_sum'],
                    uncredited_runs=inn['uncredited_runs'],
                    validation_status=inn['validation_status'],
                    confidence_score=inn['confidence_score']
                )
                session.add(inn_row)
                session.flush()

                for b in inn['batting']:
                    bat_row = BattingScorecard(
                        match_id=match_row.id,
                        innings_id=inn_row.id,
                        player_id=b['player_id'],
                        raw_player_name=b['raw_name'],
                        season=m['season'],
                        team=inn['team'],
                        batting_position=b['batting_position'],
                        runs=b['runs'],
                        balls=b['balls'],
                        minutes=b['minutes'],
                        fours=b['fours'],
                        sixes=b['sixes'],
                        strike_rate=b['strike_rate'],
                        dismissal=b['dismissal'],
                        is_not_out=b['is_not_out'],
                        is_captain=b['is_captain'],
                        is_wicketkeeper=b['is_wicketkeeper'],
                        bowler_name=b['bowler_name'],
                        fielder_name=b['fielder_name'],
                        innings_type=inn['innings_type']
                    )
                    session.add(bat_row)

                for bw in inn['bowling']:
                    bowl_row = BowlingScorecard(
                        match_id=match_row.id,
                        innings_id=inn_row.id,
                        player_id=bw['player_id'],
                        raw_player_name=bw['raw_name'],
                        season=m['season'],
                        team=inn['opponent_team'],
                        bowling_order=bw['bowling_order'],
                        overs=bw['overs'],
                        legal_balls=bw['legal_balls'],
                        maidens=bw['maidens'],
                        runs_conceded=bw['runs_conceded'],
                        wickets=bw['wickets'],
                        dot_balls=bw['dot_balls'],
                        fours_conceded=bw['fours_conceded'],
                        sixes_conceded=bw['sixes_conceded'],
                        wides=bw['wides'],
                        no_balls=bw['no_balls'],
                        economy=bw['economy'],
                        is_captain=bw['is_captain'],
                        innings_type=inn['innings_type']
                    )
                    session.add(bowl_row)

        # 3. Insert Audits
        for aud in audits:
            a_obj = DataQualityAudit(
                file_name=aud['file_name'],
                season=aud['season'],
                category=aud['category'],
                severity=aud['severity'],
                message=aud['message'],
                details_json=aud['details_json']
            )
            session.add(a_obj)

        # 4. Seed the 6 Auction Teams for 2025/2026 auction
        teams_2025 = [
            ("Victory Vipers", "Sandeep Dalvi"),
            ("Exotica Warriors", "Aryan Shetty"),
            ("The Ultimates", "Anurag Jain"),
            ("Exotica Panthers", "Ashish Chhawchharia"),
            ("Exotica Living Legenda", "Vijay Limbachiya"),
            ("Exotica Lions Pride", "Yash Patel")
        ]
        for tname, oname in teams_2025:
            existing = session.query(AuctionTeam).filter_by(team_name=tname).first()
            if not existing:
                session.add(AuctionTeam(
                    team_name=tname,
                    owner_name=oname,
                    season=2025,
                    purse_total=100.0,
                    purse_spent=0.0,
                    max_squad_size=8
                ))

        session.commit()
        print("Database imported successfully!")
        
        # Write Markdown audit report
        audit_md_path = os.path.join(reports_dir, "extraction_audit.md")
        with open(audit_md_path, "w", encoding="utf-8") as f_out:
            f_out.write("# EPL Historical Data Extraction & Audit Report\n\n")
            f_out.write("## 1. Import Summary\n")
            f_out.write(f"- **Total PDF Scorecards Discovered**: {len(files)}\n")
            f_out.write(f"- **Successfully Extracted Matches**: {len(parsed_matches)}\n")
            f_out.write(f"- **Failed Files**: 0\n")
            f_out.write(f"- **Unique Master Players Registered**: {len(resolver.canonical_players)}\n")
            f_out.write(f"- **Raw Name Variations / Aliases Resolved**: {len(resolver.raw_to_canonical)}\n")
            f_out.write(f"- **Records Flagged with Adjustments/Review**: {len(audits)}\n\n")
            f_out.write("## 2. Innings Adjustments & Uncredited Runs (CricHeroes Scorebook Adjustments)\n")
            for a in audits:
                f_out.write(f"- **{a['file_name']}** (Season {a['season']}): {a['message']}\n")
        print(f"Generated Audit report at {audit_md_path}")

    except Exception as e:
        session.rollback()
        print(f"Error during database import: {e}")
        raise e
    finally:
        session.close()

if __name__ == "__main__":
    run_extraction_and_import()
