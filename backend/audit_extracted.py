import sys, os, glob, re
from test_extract_all import parse_pdf

files = sorted(glob.glob('/Users/akshat/Document/Coding Project/EPL-Stats/data/raw/EPL Data/**/*.pdf', recursive=True))

discrepancies = []
total_batting_records = 0
total_bowling_records = 0
all_player_names = set()

for f in files:
    m = parse_pdf(f)
    for inn in m['innings']:
        bat_sum = sum(b['runs'] for b in inn['batting'])
        extras = inn['extras_runs']
        tot = inn['runs']
        if bat_sum + extras != tot:
            discrepancies.append(f"{m['file_name']} {inn['team']} runs mismatch: bat({bat_sum}) + ext({extras}) != tot({tot})")
        
        dismissals = sum(1 for b in inn['batting'] if not b['is_not_out'])
        if dismissals != inn['wickets']:
            discrepancies.append(f"{m['file_name']} {inn['team']} wickets mismatch: dismissals({dismissals}) != inn_wkt({inn['wickets']})")
            
        total_batting_records += len(inn['batting'])
        total_bowling_records += len(inn['bowling'])
        
        for b in inn['batting']:
            all_player_names.add(b['player_name'])
        for bw in inn['bowling']:
            all_player_names.add(bw['player_name'])

print(f"Total Matches: {len(files)}")
print(f"Total Batting Entries: {total_batting_records}")
print(f"Total Bowling Entries: {total_bowling_records}")
print(f"Distinct Raw Player Names: {len(all_player_names)}")
print(f"Discrepancies found: {len(discrepancies)}")
for d in discrepancies:
    print("  ->", d)
