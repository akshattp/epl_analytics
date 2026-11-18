"""
Professional Export Service for EPL Version 1.1:
- Filtered & Sorted Complete Player Statistics Export (CSV, Excel .xlsx, Chromium PDF)
- Individual Player Profile PDF via Playwright Headless Chromium reusing actual Next.js UI + Recharts SVG
- Auction Results Export (Multi-sheet Excel .xlsx & Chromium PDF)
Strictly adheres to the 5-colour EPL palette:
#02000D, #07203F, #EBDED4, #D9AA90, #A65E46
"""
import csv
import io
import html
import urllib.request
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

from backend.services.player_service import get_all_players_summary, get_player_full_profile


def _render_html_to_pdf_bytes(html_content: str, landscape: bool = False) -> bytes:
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        page.set_content(html_content, wait_until="networkidle")
        pdf_bytes = page.pdf(
            format="A4",
            landscape=landscape,
            print_background=True,
            margin={"top": "12mm", "bottom": "12mm", "left": "10mm", "right": "10mm"}
        )
        browser.close()
        return pdf_bytes


def _render_url_to_pdf_bytes(url: str) -> Optional[bytes]:
    """Renders the live Next.js print-optimized profile page directly via Playwright Chromium."""
    try:
        # Quick probe so we don't wait 30s if frontend isn't running during offline unit tests
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=2.5) as resp:
            if resp.status != 200:
                return None
    except Exception:
        return None

    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1200, "height": 1600})
        page.goto(url, wait_until="networkidle", timeout=20000)
        # Wait for data & Recharts SVGs to settle
        try:
            page.wait_for_selector("[data-profile-ready='true']", timeout=10000)
        except Exception:
            pass
        page.wait_for_timeout(800)
        page.emulate_media(media="print")
        pdf_bytes = page.pdf(
            format="A4",
            print_background=True,
            margin={"top": "10mm", "bottom": "10mm", "left": "8mm", "right": "8mm"}
        )
        browser.close()
        return pdf_bytes


def build_filtered_player_export_rows(
    db: Session,
    search: Optional[str] = None,
    role: Optional[str] = None,
    category: Optional[str] = None,
    min_matches: int = 0,
    sort_by: str = "overall_rating",
    sort_dir: str = "desc"
) -> List[Dict[str, Any]]:
    summaries = get_all_players_summary(db)
    rows = []

    for p in summaries:
        if search:
            q = search.strip().lower()
            if q not in p["name"].lower() and q not in p["player_id"].lower():
                continue
        if role and role != "ALL" and p["primary_role"] != role:
            continue
        if category and category != "ALL" and p["valuation"]["category"] != category:
            continue
        if p["matches"] < min_matches:
            continue

        prof = get_player_full_profile(db, p["player_id"])
        bat = prof["career_batting"] if prof else {}
        bowl = prof["career_bowling"] if prof else {}
        sb = prof.get("season_breakdown", {}) if prof else {}
        season_summary = " | ".join(
            f"{sk}: {sb[sk]['batting'].get('total_runs', 0)}r/{sb[sk]['bowling'].get('wickets', 0)}w"
            for sk in sorted(sb.keys(), key=lambda x: int(x))
        ) or "Uncapped"

        rows.append({
            "player_id": p["player_id"],
            "name": p["name"],
            "primary_role": p["primary_role"],
            "matches": p["matches"],
            "innings": bat.get("innings", 0),
            "runs": p["total_runs"],
            "batting_average": p["batting_average"],
            "strike_rate": p["strike_rate"],
            "fours": bat.get("fours", 0),
            "sixes": bat.get("sixes", 0),
            "boundaries": bat.get("fours", 0) + bat.get("sixes", 0),
            "best_batting": bat.get("highest_score", "0"),
            "wickets": p["wickets"],
            "overs": bowl.get("overs", "0.0"),
            "economy": p["economy"],
            "bowling_strike_rate": bowl.get("bowling_strike_rate", 0.0),
            "best_bowling": bowl.get("best_figures", "0/0"),
            "overall_rating": p["ratings"]["overall_rating"],
            "batting_rating": p["ratings"]["batting_rating"],
            "bowling_rating": p["ratings"]["bowling_rating"],
            "all_rounder_rating": p["ratings"]["all_rounder_rating"],
            "auction_category": p["valuation"]["category"],
            "estimated_valuation": p["valuation"]["estimated_valuation"],
            "season_wise_summary": season_summary
        })

    reverse = (sort_dir or "desc").lower() != "asc"
    valid_sort_keys = {
        "name", "player_id", "matches", "runs", "batting_average", "strike_rate",
        "boundaries", "wickets", "economy", "overall_rating", "batting_rating",
        "bowling_rating", "all_rounder_rating", "estimated_valuation"
    }
    skey = sort_by if sort_by in valid_sort_keys else "overall_rating"
    rows.sort(key=lambda r: (r.get(skey) is None, r.get(skey)), reverse=reverse)
    return rows


EXPORT_COLUMNS = [
    ("player_id", "Player ID"),
    ("name", "Player Name"),
    ("primary_role", "Role"),
    ("matches", "Mat"),
    ("innings", "Inns"),
    ("runs", "Runs"),
    ("batting_average", "Bat Avg"),
    ("strike_rate", "SR"),
    ("boundaries", "Bnd (4s+6s)"),
    ("best_batting", "Best Bat"),
    ("wickets", "Wkts"),
    ("overs", "Overs"),
    ("economy", "Econ"),
    ("bowling_strike_rate", "Bowl SR"),
    ("best_bowling", "Best Bowl"),
    ("overall_rating", "EPL Rtg"),
    ("batting_rating", "Bat Rtg"),
    ("bowling_rating", "Bowl Rtg"),
    ("all_rounder_rating", "AR Rtg"),
    ("auction_category", "Auction Tier"),
    ("estimated_valuation", "Est Val (L)"),
    ("season_wise_summary", "Season Breakdown (Runs/Wkts)")
]


def generate_players_csv(rows: List[Dict[str, Any]]) -> bytes:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([label for _, label in EXPORT_COLUMNS])
    for r in rows:
        writer.writerow([r.get(k, "") for k, _ in EXPORT_COLUMNS])
    return buf.getvalue().encode("utf-8-sig")


def generate_players_excel(rows: List[Dict[str, Any]], filter_note: str = "All Players") -> bytes:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "EPL Player Statistics"

    navy_fill = PatternFill(start_color="07203F", end_color="07203F", fill_type="solid")
    beige_fill = PatternFill(start_color="EBDED4", end_color="EBDED4", fill_type="solid")
    peach_fill = PatternFill(start_color="D9AA90", end_color="D9AA90", fill_type="solid")
    header_font = Font(name="Calibri", size=10, bold=True, color="EBDED4")
    title_font = Font(name="Calibri", size=14, bold=True, color="07203F")
    sub_font = Font(name="Calibri", size=9, italic=True, color="A65E46")
    body_font = Font(name="Calibri", size=10, color="02000D")
    thin_border = Border(
        bottom=Side(style="thin", color="D9AA90")
    )

    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(EXPORT_COLUMNS))
    ws.cell(row=1, column=1, value="EPL – EXOTICA PREMIER LEAGUE | COMPLETE PLAYER STATISTICS REPORT").font = title_font
    ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=len(EXPORT_COLUMNS))
    ws.cell(row=2, column=1, value=f"Version 1.1.0 | Active Filters: {filter_note} | Total Exported Records: {len(rows)}").font = sub_font

    header_row = 4
    for col_idx, (_, label) in enumerate(EXPORT_COLUMNS, start=1):
        cell = ws.cell(row=header_row, column=col_idx, value=label)
        cell.fill = navy_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    for row_idx, r in enumerate(rows, start=header_row + 1):
        for col_idx, (k, _) in enumerate(EXPORT_COLUMNS, start=1):
            c = ws.cell(row=row_idx, column=col_idx, value=r.get(k, ""))
            c.font = body_font
            c.border = thin_border
            if row_idx % 2 == 1:
                c.fill = beige_fill

    # Auto column widths
    for col_idx, (k, label) in enumerate(EXPORT_COLUMNS, start=1):
        col_letter = openpyxl.utils.get_column_letter(col_idx)
        max_len = max([len(label)] + [len(str(r.get(k, ""))) for r in rows[:100]])
        ws.column_dimensions[col_letter].width = min(38, max(10, max_len + 3))

    ws.freeze_panes = "C5"
    out = io.BytesIO()
    wb.save(out)
    return out.getvalue()


def generate_players_pdf(rows: List[Dict[str, Any]], filter_note: str = "All Players") -> bytes:
    pdf_cols = [
        ("player_id", "ID"), ("name", "Player"), ("primary_role", "Role"),
        ("matches", "Mat"), ("runs", "Runs"), ("batting_average", "Avg"),
        ("strike_rate", "SR"), ("boundaries", "Bnd"), ("best_batting", "Best"),
        ("wickets", "Wkts"), ("overs", "Ov"), ("economy", "Econ"),
        ("best_bowling", "BBI"), ("overall_rating", "EPL"),
        ("batting_rating", "Bat"), ("bowling_rating", "Bowl"),
        ("all_rounder_rating", "AR"), ("season_wise_summary", "Seasons (R/W)")
    ]
    thead = "".join(f"<th>{html.escape(lbl)}</th>" for _, lbl in pdf_cols)
    tbody_rows = []
    for idx, r in enumerate(rows):
        bg = "#F8F3EF" if idx % 2 == 1 else "#FFFFFF"
        tds = "".join(f"<td>{html.escape(str(r.get(k, '')))}</td>" for k, _ in pdf_cols)
        tbody_rows.append(f"<tr style='background:{bg}'>{tds}</tr>")

    doc_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page {{ size: A4 landscape; margin: 10mm; }}
  body {{ font-family: 'Inter', -apple-system, sans-serif; color: #02000D; background: #FFFFFF; margin: 0; }}
  .header {{ background: #07203F; color: #EBDED4; padding: 14px 18px; border-bottom: 4px solid #A65E46; display: flex; justify-content: space-between; align-items: center; }}
  .header h1 {{ font-family: Georgia, serif; margin: 0; font-size: 18px; letter-spacing: 0.02em; }}
  .header .meta {{ font-size: 10px; color: #D9AA90; text-align: right; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 8.5px; }}
  thead {{ display: table-header-group; }}
  th {{ background: #07203F; color: #EBDED4; padding: 6px 5px; text-align: left; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 2px solid #D9AA90; }}
  td {{ padding: 5px; border-bottom: 1px solid #EBDED4; font-variant-numeric: tabular-nums; }}
  tr {{ page-break-inside: avoid; }}
  .footer {{ margin-top: 12px; font-size: 8.5px; color: #07203F; border-top: 1px solid #D9AA90; padding-top: 6px; display: flex; justify-content: space-between; }}
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>EPL – EXOTICA PREMIER LEAGUE</h1>
      <div style="font-size:10px;color:#D9AA90;margin-top:2px;">Complete Player Statistics Export • Historical Analytics (2023–2025)</div>
    </div>
    <div class="meta">
      <div><strong>Records Exported:</strong> {len(rows)}</div>
      <div><strong>Filters:</strong> {html.escape(filter_note)}</div>
      <div><strong>Platform:</strong> EPL Analytics v1.1.0</div>
    </div>
  </div>
  <table>
    <thead><tr>{thead}</tr></thead>
    <tbody>{''.join(tbody_rows)}</tbody>
  </table>
  <div class="footer">
    <span>Source: Verified CricHeroes Official Scorecards (27 Matches, Regular Innings Segregated from Super Overs)</span>
    <span>EPL Cricket Intelligence Platform</span>
  </div>
</body>
</html>"""
    return _render_html_to_pdf_bytes(doc_html, landscape=True)


def generate_individual_player_pdf(db: Session, player_id: str, frontend_base_url: str = "http://localhost:3000") -> Optional[bytes]:
    prof = get_player_full_profile(db, player_id)
    if not prof:
        return None

    # 1. Primary path: render the exact Next.js profile page (?print=1) via Playwright Chromium
    live_url = f"{frontend_base_url.rstrip('/')}/players/{player_id}?print=1"
    rendered = _render_url_to_pdf_bytes(live_url)
    if rendered:
        return rendered

    # 2. High-fidelity fallback HTML->Chromium PDF matching exact EPL 5-colour design system
    r = prof["ratings"]
    bat = prof["career_batting"]
    bowl = prof["career_bowling"]
    val = prof["valuation"]
    sb = prof.get("season_breakdown", {}) or {}
    seasons = [
        {"season": sk, "matches": sb[sk]["batting"].get("matches", 0), "batting": sb[sk]["batting"], "bowling": sb[sk]["bowling"]}
        for sk in sorted(sb.keys(), key=lambda x: int(x))
    ]
    sim = prof.get("similar_players", [])[:4]

    season_rows_html = "".join(
        f"<tr><td><strong>{s['season']}</strong></td><td>{s['matches']}</td><td>{s['batting'].get('total_runs',0)}</td>"
        f"<td>{s['batting'].get('strike_rate',0)}</td><td>{s['batting'].get('fours',0)}/{s['batting'].get('sixes',0)}</td>"
        f"<td>{s['bowling'].get('wickets',0)}</td><td>{s['bowling'].get('overs','0.0')}</td><td>{s['bowling'].get('economy',0)}</td></tr>"
        for s in seasons
    ) or "<tr><td colspan='8'>No historical season appearances recorded.</td></tr>"

    # Inline SVG bar chart for season runs & wickets
    max_runs = max([s["batting"].get("total_runs", 0) for s in seasons] + [20])
    svg_bars = ""
    for idx, s in enumerate(seasons):
        runs_s = s["batting"].get("total_runs", 0)
        x = 50 + idx * 120
        h = int((runs_s / max_runs) * 100)
        y = 120 - h
        svg_bars += f"<rect x='{x}' y='{y}' width='42' height='{h}' fill='#07203F' rx='3' />"
        svg_bars += f"<text x='{x+21}' y='{y-5}' text-anchor='middle' font-size='10' fill='#02000D' font-weight='bold'>{runs_s}r</text>"
        svg_bars += f"<text x='{x+21}' y='138' text-anchor='middle' font-size='10' fill='#07203F'>{s['season']}</text>"

    sim_cards = "".join(
        f"<div class='sim-card'><strong>{html.escape(sp.get('player_name') or sp.get('name', ''))}</strong> ({html.escape(sp['player_id'])})<br/>"
        f"<span style='color:#A65E46;'>Similarity: {sp['similarity_score']}% • Rating: {sp['overall_rating']}</span></div>"
        for sp in sim
    )

    strengths_li = "".join(f"<li>{html.escape(st)}</li>" for st in val.get("strengths", []))
    weaknesses_li = "".join(f"<li>{html.escape(wk)}</li>" for wk in val.get("weaknesses", []))

    doc_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page {{ size: A4 portrait; margin: 10mm; }}
  body {{ font-family: 'Inter', -apple-system, sans-serif; background: #EBDED4; color: #02000D; margin: 0; padding: 14px; }}
  .hero {{ background: #07203F; color: #EBDED4; padding: 20px; border-radius: 10px; border-bottom: 4px solid #A65E46; display: flex; justify-content: space-between; align-items: center; }}
  .hero h1 {{ font-family: Georgia, serif; font-size: 24px; margin: 4px 0; color: #FFFFFF; }}
  .badge {{ background: #A65E46; color: #EBDED4; padding: 6px 14px; border-radius: 8px; text-align: center; }}
  .grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 14px; }}
  .card {{ background: #FFFFFF; border: 1px solid #D9AA90; border-radius: 8px; padding: 12px; }}
  .card h3 {{ font-family: Georgia, serif; color: #07203F; margin: 0 0 8px 0; font-size: 13px; border-bottom: 1px solid #EBDED4; padding-bottom: 4px; }}
  .kpi-val {{ font-size: 20px; font-weight: 700; color: #07203F; }}
  .kpi-lbl {{ font-size: 9px; text-transform: uppercase; color: #A65E46; letter-spacing: 0.06em; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 6px; }}
  th {{ background: #07203F; color: #EBDED4; padding: 6px; text-align: left; }}
  td {{ padding: 6px; border-bottom: 1px solid #EBDED4; }}
  .two-col {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px; }}
  .sim-card {{ background: #EBDED4; padding: 8px; border-radius: 6px; font-size: 10px; margin-bottom: 6px; }}
</style>
</head>
<body>
  <div class="hero">
    <div>
      <div style="font-size:10px;color:#D9AA90;letter-spacing:0.12em;text-transform:uppercase;">EPL – EXOTICA PREMIER LEAGUE • OFFICIAL PLAYER DOSSIER</div>
      <h1>{html.escape(prof['name'])}</h1>
      <div style="font-size:11px;color:#D9AA90;">{html.escape(prof['player_id'])} • {html.escape(prof['primary_role'])} • {html.escape(prof['batting_hand'])} • {html.escape(val['category'])}</div>
    </div>
    <div class="badge">
      <div style="font-size:9px;text-transform:uppercase;">EPL Rating</div>
      <div style="font-size:26px;font-weight:800;">{r['overall_rating']}</div>
    </div>
  </div>

  <div class="grid">
    <div class="card"><div class="kpi-lbl">Career Runs (Reg)</div><div class="kpi-val">{bat.get('runs',0)}</div><div style="font-size:10px;">Avg {bat.get('average',0)} • SR {bat.get('strike_rate',0)}</div></div>
    <div class="card"><div class="kpi-lbl">Career Wickets (Reg)</div><div class="kpi-val">{bowl.get('wickets',0)}</div><div style="font-size:10px;">Econ {bowl.get('economy',0)} • Best {bowl.get('best_bowling','0/0')}</div></div>
    <div class="card"><div class="kpi-lbl">Discipline Ratings</div><div class="kpi-val">{r['batting_rating']} / {r['bowling_rating']}</div><div style="font-size:10px;">Bat / Bowl • AR: {r['all_rounder_rating']}</div></div>
    <div class="card"><div class="kpi-lbl">Est. Auction Value</div><div class="kpi-val" style="color:#A65E46;">₹{val['estimated_valuation']}L</div><div style="font-size:10px;">Base ₹{val['base_price']}L • Range {val['valuation_range']}L</div></div>
  </div>

  <div class="two-col">
    <div class="card">
      <h3>Season-by-Season Performance Progression</h3>
      <svg width="100%" height="150" viewBox="0 0 420 150">{svg_bars}</svg>
    </div>
    <div class="card">
      <h3>Auction Intelligence & Scouting Report</h3>
      <p style="font-size:10px;margin:4px 0;"><strong>Scarcity Multiplier:</strong> {val['scarcity_multiplier']}x • <strong>Tier:</strong> {html.escape(val['category'])}</p>
      <div style="font-size:10px;"><strong>Strengths:</strong><ul style="margin:4px 0 6px 16px;">{strengths_li}</ul></div>
      <div style="font-size:10px;"><strong>Watchpoints:</strong><ul style="margin:4px 0 0 16px;">{weaknesses_li}</ul></div>
    </div>
  </div>

  <div class="card" style="margin-top:14px;">
    <h3>Career vs Season Breakdown (Regulation Innings)</h3>
    <table>
      <thead><tr><th>Season</th><th>Mat</th><th>Runs</th><th>SR</th><th>4s/6s</th><th>Wkts</th><th>Overs</th><th>Econ</th></tr></thead>
      <tbody>{season_rows_html}</tbody>
    </table>
  </div>

  <div class="card" style="margin-top:14px;">
    <h3>Comparable Historical Profiles (Similar Players)</h3>
    {sim_cards or '<div style="font-size:10px;">No comparable profiles available.</div>'}
  </div>
</body>
</html>"""
    return _render_html_to_pdf_bytes(doc_html, landscape=False)


def generate_auction_results_excel(results_data: Dict[str, Any]) -> bytes:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Team Summary"

    navy_fill = PatternFill(start_color="07203F", end_color="07203F", fill_type="solid")
    beige_fill = PatternFill(start_color="EBDED4", end_color="EBDED4", fill_type="solid")
    hdr_font = Font(name="Calibri", size=10, bold=True, color="EBDED4")
    title_font = Font(name="Calibri", size=14, bold=True, color="07203F")

    ws.cell(row=1, column=1, value=f"EPL AUCTION RESULTS – {results_data.get('auction_name', 'Official Auction')}").font = title_font
    headers = ["Team", "Owner", "Squad Size", "Purse Spent (L)", "Purse Remaining (L)", "Avg Rating", "Bat Depth", "Bowl Depth", "AR Count"]
    for idx, h in enumerate(headers, 1):
        c = ws.cell(row=3, column=idx, value=h)
        c.fill = navy_fill
        c.font = hdr_font

    for r_idx, t in enumerate(results_data.get("teams", []), 4):
        vals = [
            t["team_name"], t["owner_name"], t["squad_size"], t["purse_spent"],
            t["purse_remaining"], t["average_rating"], t["batting_depth"],
            t["bowling_depth"], t["all_rounder_count"]
        ]
        for c_idx, v in enumerate(vals, 1):
            c = ws.cell(row=r_idx, column=c_idx, value=v)
            if r_idx % 2 == 1:
                c.fill = beige_fill

    # Sheet 2: All Sold Players
    ws2 = wb.create_sheet("Sold Players")
    s_headers = ["Team", "Player ID", "Player Name", "Role", "Rating", "Sold Price (L)", "Est. Value (L)", "Value Delta (L)"]
    for idx, h in enumerate(s_headers, 1):
        c = ws2.cell(row=1, column=idx, value=h)
        c.fill = navy_fill
        c.font = hdr_font
    row_i = 2
    for t in results_data.get("teams", []):
        for p in t.get("squad", []):
            vals = [t["team_name"], p["player_id"], p["player_name"], p["role"], p["overall_rating"], p["purchase_price"], p["estimated_valuation"], p["value_delta"]]
            for c_idx, v in enumerate(vals, 1):
                ws2.cell(row=row_i, column=c_idx, value=v)
            row_i += 1

    # Sheet 3: Unsold Players
    ws3 = wb.create_sheet("Unsold Pool")
    u_headers = ["Player ID", "Player Name", "Role", "Category", "Base Price (L)", "Rating"]
    for idx, h in enumerate(u_headers, 1):
        c = ws3.cell(row=1, column=idx, value=h)
        c.fill = navy_fill
        c.font = hdr_font
    for r_idx, u in enumerate(results_data.get("unsold_players", []), 2):
        vals = [u["player_id"], u["name"], u["primary_role"], u["category"], u["base_price"], u["overall_rating"]]
        for c_idx, v in enumerate(vals, 1):
            ws3.cell(row=r_idx, column=c_idx, value=v)

    out = io.BytesIO()
    wb.save(out)
    return out.getvalue()


def generate_auction_results_pdf(results_data: Dict[str, Any]) -> bytes:
    teams_html = ""
    for t in results_data.get("teams", []):
        sq_rows = "".join(
            f"<tr><td>{html.escape(p['player_name'])}</td><td>{html.escape(p['role'])}</td>"
            f"<td>{p['overall_rating']}</td><td>₹{p['purchase_price']}L</td><td>₹{p['estimated_valuation']}L</td></tr>"
            for p in t.get("squad", [])
        ) or "<tr><td colspan='5'>No players acquired.</td></tr>"
        teams_html += f"""
        <div class='team-box'>
          <div class='team-hdr'>
            <strong>{html.escape(t['team_name'])}</strong> ({html.escape(t['owner_name'])})
            <span>Spent: ₹{t['purse_spent']}L • Left: ₹{t['purse_remaining']}L • Avg Rtg: {t['average_rating']}</span>
          </div>
          <table>
            <thead><tr><th>Player</th><th>Role</th><th>Rating</th><th>Sold Price</th><th>Est. Value</th></tr></thead>
            <tbody>{sq_rows}</tbody>
          </table>
        </div>"""

    mep = results_data.get("most_expensive_player")
    mep_str = f"{mep['player_name']} (₹{mep['purchase_price']}L → {mep['team_name']})" if mep else "None yet"

    doc_html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8" /><style>
  @page {{ size: A4 portrait; margin: 10mm; }}
  body {{ font-family: 'Inter', sans-serif; color: #02000D; background: #FFFFFF; margin: 0; }}
  .hdr {{ background: #07203F; color: #EBDED4; padding: 16px; border-bottom: 4px solid #A65E46; }}
  .hdr h1 {{ font-family: Georgia, serif; margin: 0; font-size: 20px; }}
  .kpis {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0; }}
  .kpi {{ background: #EBDED4; padding: 10px; border-radius: 6px; border-left: 3px solid #A65E46; font-size: 11px; }}
  .team-box {{ margin-bottom: 14px; page-break-inside: avoid; border: 1px solid #D9AA90; border-radius: 6px; overflow: hidden; }}
  .team-hdr {{ background: #07203F; color: #EBDED4; padding: 8px 10px; font-size: 11px; display: flex; justify-content: space-between; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 9.5px; }}
  th {{ background: #EBDED4; color: #07203F; padding: 5px; text-align: left; }}
  td {{ padding: 5px; border-bottom: 1px solid #EBDED4; }}
</style></head><body>
  <div class="hdr">
    <h1>{html.escape(results_data.get('auction_name', 'EPL Official Auction'))} – Final Results Report</h1>
    <div style="font-size:10px;color:#D9AA90;">Status: {html.escape(str(results_data.get('status', 'LIVE')))} • Total Sold: {results_data.get('total_sold', 0)} • Total Unsold: {results_data.get('total_unsold', 0)}</div>
  </div>
  <div class="kpis">
    <div class="kpi"><strong>Most Expensive Buy</strong><br/>{html.escape(mep_str)}</div>
    <div class="kpi"><strong>Total League Spend</strong><br/>₹{results_data.get('total_spend', 0)} Lakhs</div>
    <div class="kpi"><strong>Unsold Pool Size</strong><br/>{results_data.get('total_unsold', 0)} Players</div>
  </div>
  {teams_html}
</body></html>"""
    return _render_html_to_pdf_bytes(doc_html, landscape=False)
