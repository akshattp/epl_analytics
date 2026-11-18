import glob, os, fitz, json, re

def parse_pdf(file_path):
    doc = fitz.open(file_path)
    file_name = os.path.basename(file_path)
    # Season from path or name
    m_season = re.search(r'202[3-5]', file_path)
    season = int(m_season.group(0)) if m_season else None
    
    # Page 1: Match metadata
    p1 = doc[0]
    lines1 = [l.strip() for l in p1.get_text().split('\n') if l.strip()]
    
    # Tournament header & stage
    tourn_line = lines1[0]
    stage = "League"
    if "semi" in tourn_line.lower() or "semifinal" in file_name.lower():
        stage = "Semi Final"
    elif "final" in tourn_line.lower() or "final" in file_name.lower():
        stage = "Final"
        
    # Match teams
    m_idx = lines1.index('Match')
    teams_str = lines1[m_idx+1]
    teams = [t.strip() for t in teams_str.split(' vs ')]
    team1 = teams[0]
    team2 = teams[1] if len(teams) > 1 else ""
    
    # Ground
    g_idx = lines1.index('Ground')
    ground_parts = []
    i = g_idx + 1
    while i < len(lines1) and lines1[i] != 'Date':
        ground_parts.append(lines1[i])
        i += 1
    ground = " ".join(ground_parts)
    
    # Date
    d_idx = lines1.index('Date')
    date_str = lines1[d_idx+1]
    
    # Toss
    toss_str = ""
    if 'Toss' in lines1:
        t_idx = lines1.index('Toss')
        toss_str = lines1[t_idx+1]
    
    # Result
    result_str = ""
    for idx, l in enumerate(lines1):
        if l == 'Result':
            # Grab subsequent non-header lines until 'Best Performances'
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
            
    # Captains from Match Officials
    captains = {}
    if 'Match Officials' in lines1:
        mo_idx = lines1.index('Match Officials')
        j = mo_idx + 1
        while j < len(lines1):
            if lines1[j] in ['1', '2'] and j+2 < len(lines1) and lines1[j+2] == 'Captain':
                c_name = lines1[j+1]
                m_cap = re.match(r'^(.*?)\s*\((.*?)\)$', c_name)
                if m_cap:
                    captains[m_cap.group(2).strip()] = m_cap.group(1).strip()
                j += 3
            else:
                j += 1

    # Innings parsing
    innings = []
    for pno in range(1, len(doc)):
        p_text = doc[pno].get_text()
        lines = [l.strip() for l in p_text.split('\n') if l.strip()]
        
        # Header info
        # e.g., 'KILLFIST WARRIORS 34/3 (6.0 Ov) (1st Innings)'
        # or 'The Ultimates 5/1 (1.0 Ov) (2nd Innings)'
        hdr_line = ""
        for l in lines[:10]:
            if 'Ov)' in l:
                hdr_line = l
                break
                
        # Parse innings header
        # regex to capture Team, Score, Wickets, Overs, Innings label
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
                inn_lbl = m_hdr.group(5) or ""
                if pno >= 3 and len(doc) == 5:
                    inn_type = "Super Over"

        # Batting parsing
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
                
                # Extract hand and roles (c), (wk)
                is_c = '(c)' in raw_name
                is_wk = '(wk)' in raw_name
                clean_name = re.sub(r'\s*\((?:c|wk|RHB|LHB)\)', '', raw_name).strip()
                bat_hand = "RHB" if "(RHB)" in raw_name else ("LHB" if "(LHB)" in raw_name else "Unknown")
                is_not_out = (dismissal.strip().lower() == 'not out')
                
                batting_records.append({
                    "batting_position": pos,
                    "player_name": clean_name,
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
                    "strike_rate": sr
                })
                
        # Extras & Total
        extras_line = ""
        extras_val = 0
        total_overs = inn_overs
        total_wickets = inn_wickets
        total_runs = inn_runs
        crr = 0.0
        to_bat = []
        fow = ""
        
        for idx, l in enumerate(lines):
            if l.startswith('Extras:'):
                extras_line = l
                if idx + 1 < len(lines) and lines[idx+1].isdigit():
                    extras_val = int(lines[idx+1])
            elif l.startswith('Total: Overs'):
                # Total line: 'Total: Overs 6.0, Wickets 3'
                # next line: '34 (CRR: 5.67)'
                if idx + 1 < len(lines):
                    tot_sub = lines[idx+1]
                    m_crr = re.search(r'([\d\.]+)\s*\(CRR:\s*([\d\.-]+)\)', tot_sub)
                    if m_crr:
                        total_runs = int(float(m_crr.group(1)))
                        crr_str = m_crr.group(2)
                        crr = float(crr_str) if crr_str != '-' else 0.0
            elif l.startswith('To Bat:'):
                to_bat_str = l[7:].strip()
                to_bat = [p.strip() for p in to_bat_str.split(',') if p.strip()]
            elif l == 'Fall of Wickets':
                if idx + 1 < len(lines):
                    fow = lines[idx+1]

        # Bowling parsing
        bowling_records = []
        if 'Eco' in lines:
            eco_idx = lines.index('Eco')
            b_lines = [bl for bl in lines[eco_idx+1:] if not ('cricheroes.com' in bl or bl.endswith('of 3') or bl.endswith('of 5') or '/25,' in bl)]
            for bi in range(0, len(b_lines), 12):
                b_num = int(b_lines[bi])
                raw_bname = b_lines[bi+1]
                overs = float(b_lines[bi+2])
                maidens = int(b_lines[bi+3])
                runs = int(b_lines[bi+4])
                wickets = int(b_lines[bi+5])
                dots = int(b_lines[bi+6])
                fours_c = int(b_lines[bi+7])
                sixes_c = int(b_lines[bi+8])
                wides = int(b_lines[bi+9])
                noballs = int(b_lines[bi+10])
                eco = float(b_lines[bi+11]) if b_lines[bi+11] != '-' else 0.0
                
                is_c = '(c)' in raw_bname
                clean_bname = re.sub(r'\s*\((?:c|wk)\)', '', raw_bname).strip()
                
                # Overs in cricket: e.g. 1.4 = 1 over and 4 balls = 10 balls
                ov_int = int(overs)
                balls_rem = int(round((overs - ov_int) * 10))
                legal_balls = ov_int * 6 + balls_rem
                
                bowling_records.append({
                    "bowling_order": b_num,
                    "player_name": clean_bname,
                    "raw_name": raw_bname,
                    "is_captain": is_c,
                    "overs": overs,
                    "legal_balls": legal_balls,
                    "maidens": maidens,
                    "runs_conceded": runs,
                    "wickets": wickets,
                    "dot_balls": dots,
                    "fours_conceded": fours_c,
                    "sixes_conceded": sixes_c,
                    "wides": wides,
                    "no_balls": noballs,
                    "economy": eco
                })

        innings.append({
            "innings_number": pno,
            "innings_type": inn_type,
            "team": inn_team,
            "runs": total_runs,
            "wickets": total_wickets,
            "overs": total_overs,
            "crr": crr,
            "extras_text": extras_line,
            "extras_runs": extras_val,
            "did_not_bat": to_bat,
            "fall_of_wickets": fow,
            "batting": batting_records,
            "bowling": bowling_records
        })

    return {
        "file_name": file_name,
        "season": season,
        "stage": stage,
        "ground": ground,
        "date": date_str,
        "teams": [team1, team2],
        "team1": team1,
        "team2": team2,
        "toss": toss_str,
        "result": result_str,
        "captains": captains,
        "innings": innings
    }

files = sorted(glob.glob('/Users/akshat/Document/Coding Project/EPL-Stats/data/raw/EPL Data/**/*.pdf', recursive=True))
print(f"Parsing {len(files)} matches...")
all_matches = []
for f in files:
    m = parse_pdf(f)
    all_matches.append(m)

print(f"Successfully parsed {len(all_matches)} matches.")
print("\nValidation Sample:")
for m in all_matches[:3]:
    print(f"Season: {m['season']} | {m['stage']} | {m['file_name']}")
    print(f"  Teams: {m['team1']} vs {m['team2']}")
    print(f"  Toss: {m['toss']}")
    print(f"  Result: {m['result']}")
    for inn in m['innings']:
        bat_runs = sum(b['runs'] for b in inn['batting'])
        print(f"  Innings: {inn['team']} -> Score: {inn['runs']}/{inn['wickets']} in {inn['overs']} ov | Batting sum: {bat_runs} + Extras: {inn['extras_runs']} = {bat_runs + inn['extras_runs']} | Batsmen: {len(inn['batting'])} | Bowlers: {len(inn['bowling'])}")
